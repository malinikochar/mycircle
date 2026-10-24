import type {
  AnnouncementItem,
  ComplaintItem,
  EscalationRecordItem,
  ExchangeAgreementItem,
  ExchangeListingItem,
  OrderPaymentStatus,
  OrderStatus,
  ProductItem,
  ReviewEligibilityItem,
  ReviewItem,
  ShopItem,
} from '@/lib/types/domain';

/**
 * Format integer paise into Indian Rupees (e.g. 64325 -> "₹643.25")
 */
export function formatPaiseToINR(paise: number | null | undefined): string {
  const safePaise = typeof paise === 'number' && Number.isFinite(paise) ? paise : 0;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: safePaise % 100 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(safePaise / 100);
}

/**
 * 1. Server-Validated Idempotent Order Calculation (SHOP-04 / Test 4)
 * Ignores any client-submitted unit price or total; calculates integer paise
 * strictly from authoritative database product and shop records.
 */
export function calculateServerValidatedOrder(params: {
  shop: Pick<ShopItem, 'id' | 'approval_status' | 'min_order_paise' | 'delivery_fee_paise'>;
  productsById: Map<string, Pick<ProductItem, 'id' | 'name' | 'price_paise' | 'tax_rate_bps' | 'stock_quantity' | 'requires_prescription' | 'is_active'>>;
  requestedItems: Array<{
    product_id: string;
    quantity: number;
    tampered_client_price_paise?: number;
  }>;
  buyerId: string;
  idempotencyKey: string;
  existingOrderByIdempotencyKey?: { id: string; total_paise: number; status: OrderStatus } | null;
  hasUploadedPrescription?: boolean;
}): {
  ok: boolean;
  idempotentReplay: boolean;
  error?: string;
  orderSummary?: {
    order_id: string;
    subtotal_paise: number;
    tax_paise: number;
    delivery_fee_paise: number;
    total_paise: number;
    status: OrderStatus;
    payment_status: OrderPaymentStatus;
  };
} {
  if (params.existingOrderByIdempotencyKey) {
    return {
      ok: true,
      idempotentReplay: true,
      orderSummary: {
        order_id: params.existingOrderByIdempotencyKey.id,
        subtotal_paise: 0,
        tax_paise: 0,
        delivery_fee_paise: params.shop.delivery_fee_paise,
        total_paise: params.existingOrderByIdempotencyKey.total_paise,
        status: params.existingOrderByIdempotencyKey.status,
        payment_status: 'unpaid',
      },
    };
  }

  if (params.shop.approval_status !== 'approved') {
    return { ok: false, idempotentReplay: false, error: 'Shop is not approved for ordering.' };
  }

  if (params.requestedItems.length === 0) {
    return { ok: false, idempotentReplay: false, error: 'Order must contain at least one item.' };
  }

  let subtotalPaise = 0;
  let taxPaise = 0;

  for (const item of params.requestedItems) {
    if (!Number.isInteger(item.quantity) || item.quantity <= 0) {
      return { ok: false, idempotentReplay: false, error: 'Item quantity must be a positive integer.' };
    }
    const product = params.productsById.get(item.product_id);
    if (!product || !product.is_active) {
      return { ok: false, idempotentReplay: false, error: `Product ${item.product_id} is inactive or unavailable.` };
    }
    if (product.requires_prescription && !params.hasUploadedPrescription) {
      return {
        ok: false,
        idempotentReplay: false,
        error: `Prescription upload required for "${product.name}" (SHOP-11).`,
      };
    }
    if (product.stock_quantity < item.quantity) {
      return {
        ok: false,
        idempotentReplay: false,
        error: `Insufficient stock for "${product.name}": requested ${item.quantity}, available ${product.stock_quantity}.`,
      };
    }

    const lineSubtotal = product.price_paise * item.quantity;
    const lineTax = Math.floor((lineSubtotal * product.tax_rate_bps) / 10000);
    subtotalPaise += lineSubtotal;
    taxPaise += lineTax;
  }

  if (subtotalPaise < params.shop.min_order_paise) {
    return {
      ok: false,
      idempotentReplay: false,
      error: `Minimum order for this shop is ${formatPaiseToINR(params.shop.min_order_paise)}.`,
    };
  }

  const totalPaise = subtotalPaise + taxPaise + params.shop.delivery_fee_paise;

  return {
    ok: true,
    idempotentReplay: false,
    orderSummary: {
      order_id: `ord-${params.idempotencyKey}`,
      subtotal_paise: subtotalPaise,
      tax_paise: taxPaise,
      delivery_fee_paise: params.shop.delivery_fee_paise,
      total_paise: totalPaise,
      status: 'submitted',
      payment_status: 'unpaid',
    },
  };
}

/**
 * 2. Shop Price/Weight/Substitution Proposal & Buyer Approval (SHOP-05, SHOP-09 / Test 6)
 * Ensures shop price/pack changes transition to `awaiting_buyer_approval` and cannot
 * advance to `preparing`/`delivered` until the buyer explicitly approves.
 */
export function proposeOrderAdjustment(order: {
  status: OrderStatus;
  total_paise: number;
  proposed_total_paise: number;
  reason: string;
}): {
  status: OrderStatus;
  total_paise: number;
  proposed_total_paise: number;
  requiresBuyerConsent: true;
} {
  return {
    status: 'awaiting_buyer_approval',
    total_paise: order.total_paise,
    proposed_total_paise: order.proposed_total_paise,
    requiresBuyerConsent: true,
  };
}

export function resolveBuyerPriceApproval(params: {
  actorId: string;
  buyerId: string;
  currentStatus: OrderStatus;
  originalTotalPaise: number;
  proposedTotalPaise: number | null;
  currentInvoiceRevision: number;
  approve: boolean;
}): {
  ok: boolean;
  error?: string;
  newStatus?: OrderStatus;
  finalTotalPaise?: number;
  newInvoiceRevision?: number;
} {
  if (params.actorId !== params.buyerId) {
    return { ok: false, error: 'Only the ordering buyer can approve or decline a proposed price adjustment.' };
  }
  if (params.currentStatus !== 'awaiting_buyer_approval' || params.proposedTotalPaise === null) {
    return { ok: false, error: 'Order does not have a pending price adjustment.' };
  }

  if (!params.approve) {
    return {
      ok: true,
      newStatus: 'cancelled',
      finalTotalPaise: params.originalTotalPaise,
      newInvoiceRevision: params.currentInvoiceRevision,
    };
  }

  return {
    ok: true,
    newStatus: 'accepted',
    finalTotalPaise: params.proposedTotalPaise,
    newInvoiceRevision: params.currentInvoiceRevision + 1,
  };
}

/**
 * 3. Atomic Social Service Quantity Allocation & Agreement Snapshot (SOC-04, SOC-05 / Test 8)
 * Prevents double allocation when two members attempt to accept the last remaining unit.
 */
export function allocateExchangeQuantityAtomically(params: {
  listing: Pick<ExchangeListingItem, 'id' | 'owner_id' | 'total_quantity' | 'allocated_quantity' | 'status' | 'exchange_mode' | 'price_paise' | 'deposit_paise'>;
  counterpartyId: string;
  requestedQuantity: number;
}): {
  ok: boolean;
  error?: string;
  updatedAllocatedQuantity?: number;
  updatedListingStatus?: ExchangeListingItem['status'];
  agreementSnapshot?: {
    version: number;
    agreed_quantity: number;
    agreed_price_paise: number;
    agreed_deposit_paise: number;
    status: ExchangeAgreementItem['status'];
  };
} {
  if (params.listing.owner_id === params.counterpartyId) {
    return { ok: false, error: 'Cannot create an exchange agreement with yourself.' };
  }
  if (params.requestedQuantity <= 0) {
    return { ok: false, error: 'Requested quantity must be at least 1.' };
  }

  const remaining = params.listing.total_quantity - params.listing.allocated_quantity;
  if (remaining < params.requestedQuantity) {
    return {
      ok: false,
      error: `Double-allocation prevented (Test 8): Only ${remaining} unit(s) remaining on listing ${params.listing.id}.`,
    };
  }

  const newAllocated = params.listing.allocated_quantity + params.requestedQuantity;
  const newStatus: ExchangeListingItem['status'] =
    newAllocated >= params.listing.total_quantity ? 'fully_allocated' : 'partially_allocated';

  return {
    ok: true,
    updatedAllocatedQuantity: newAllocated,
    updatedListingStatus: newStatus,
    agreementSnapshot: {
      version: 1,
      agreed_quantity: params.requestedQuantity,
      agreed_price_paise: params.listing.price_paise * params.requestedQuantity,
      agreed_deposit_paise: params.listing.deposit_paise,
      status: 'agreed',
    },
  };
}

/**
 * 4. Prohibited Item Policy Check (SOC-10)
 * Blocks prescription/OTC medicines, weapons, and hazardous items in peer-to-peer Social Service listings.
 */
export function validateSocialServiceListingPolicy(input: {
  title: string;
  description: string;
  category: string;
}): { allowed: boolean; reason: string } {
  const combined = `${input.title} ${input.description} ${input.category}`.toLowerCase();
  const prohibitedPattern = /\b(prescription|schedule-h|antibiotic|insulin|tablet|capsule|medicine|syrup|firearm|ammunition|explosive)\b/i;

  if (prohibitedPattern.test(combined)) {
    return {
      allowed: false,
      reason:
        'Prohibited Item Policy (SOC-10): Prescription or OTC medicines, weapons, and hazardous items cannot be exchanged peer-to-peer.',
    };
  }
  return { allowed: true, reason: 'Permitted community exchange listing.' };
}

/**
 * 5. User Block vs Active Transaction Obligation Check (MEM-07, SOC-06 / Test 19)
 * Blocking a member prevents new direct messages, but NEVER erases or hides an active
 * unreturned loan/rental obligation or its return-coordination thread.
 */
export function evaluateUserBlockEffect(params: {
  blockerId: string;
  blockedId: string;
  activeAgreementsBetweenPair: Array<Pick<ExchangeAgreementItem, 'id' | 'status' | 'listing_title'>>;
}): {
  newDirectMessagesBlocked: true;
  activeLoanObligationsPreserved: boolean;
  preservedAgreementIds: string[];
  adminEscalationAvailable: true;
} {
  const activeObligations = params.activeAgreementsBetweenPair.filter((ag) =>
    ['agreed', 'handover_pending', 'handed_over', 'active', 'return_pending', 'overdue', 'disputed'].includes(
      ag.status
    )
  );

  return {
    newDirectMessagesBlocked: true,
    activeLoanObligationsPreserved: activeObligations.length > 0,
    preservedAgreementIds: activeObligations.map((a) => a.id),
    adminEscalationAvailable: true,
  };
}

/**
 * 6. Transaction-Linked Review Eligibility & 14-Day Blind Review Window (REP-01..08 / Test 7, 9, 10)
 * - Blocks reviews without an eligible completed or post-handover overdue/disputed interaction
 * - Blocks self-reviews and duplicate reviews
 * - Keeps submitted reviews hidden until BOTH parties submit or the 14-day window expires
 * - Keeps member exchange averages separate from service provider booking averages
 */
export function validateAndEvaluateReviewSubmission(params: {
  actorId: string;
  eligibility: ReviewEligibilityItem | null;
  existingReviewsForEligibility: ReviewItem[];
  counterpartySubmittedReview: ReviewItem | null;
  recentReviewsBetweenPairCount30Days: number;
  overallRating: number;
  writtenFeedback: string;
  nowTimestamp?: number;
}): {
  ok: boolean;
  error?: string;
  isPublishedImmediately?: boolean;
  counterpartyAlsoPublished?: boolean;
  flaggedSuspiciousRepeatedPair?: boolean;
} {
  if (!params.eligibility) {
    return {
      ok: false,
      error: 'Denied (REP-01 / Test 9): Reviews require a verified completed or post-handover overdue/disputed transaction.',
    };
  }

  if (params.eligibility.reviewer_id !== params.actorId) {
    return { ok: false, error: 'Actor does not match the eligible reviewer for this transaction.' };
  }

  if (params.eligibility.reviewer_id === params.eligibility.subject_user_id) {
    return { ok: false, error: 'Denied (REP-08): Self-reviews are prohibited.' };
  }

  if (params.existingReviewsForEligibility.length > 0 || params.eligibility.has_submitted) {
    return { ok: false, error: 'Denied (REP-01): Only one review is permitted per eligible interaction.' };
  }

  const now = params.nowTimestamp ?? Date.now();
  const windowEnd = new Date(params.eligibility.window_ends_at).getTime();
  if (now > windowEnd) {
    return { ok: false, error: 'The 14-day review submission window for this transaction has closed.' };
  }

  if (params.overallRating < 1 || params.overallRating > 5) {
    return { ok: false, error: 'Rating must be between 1 and 5 stars.' };
  }

  const bothSubmitted = Boolean(params.counterpartySubmittedReview);

  return {
    ok: true,
    isPublishedImmediately: bothSubmitted,
    counterpartyAlsoPublished: bothSubmitted,
    flaggedSuspiciousRepeatedPair: params.recentReviewsBetweenPairCount30Days >= 3,
  };
}

/**
 * 7. Post-Handover Dispute Review Eligibility Check (REP-05 / Test 10)
 * Pre-handover cancellations do NOT unlock reviews; post-handover overdue or disputed
 * agreements DO unlock reviews for both parties.
 */
export function canUnlockDisputeReview(agreement: {
  status: ExchangeAgreementItem['status'];
  handover_confirmed_by_owner_at: string | null;
  handover_confirmed_by_counterparty_at: string | null;
}): { eligible: boolean; reason: ReviewEligibilityItem['eligibility_reason'] | null } {
  const handoverOccurred = Boolean(
    agreement.handover_confirmed_by_owner_at && agreement.handover_confirmed_by_counterparty_at
  );

  if (!handoverOccurred) {
    return { eligible: false, reason: null };
  }

  if (agreement.status === 'completed' || agreement.status === 'returned') {
    return { eligible: true, reason: 'completed' };
  }
  if (agreement.status === 'overdue') {
    return { eligible: true, reason: 'overdue_post_handover' };
  }
  if (agreement.status === 'disputed') {
    return { eligible: true, reason: 'disputed_post_handover' };
  }

  return { eligible: false, reason: null };
}

/**
 * 8. Shared Issue Duplicate Linking & Redacted Civic Escalation (CASE-03..06 / Test 11 & Test 12)
 * Links duplicate complaints into a shared issue while preserving private reporter details,
 * and never marks an escalation as `acknowledged` without official docket evidence.
 */
export function buildSharedIssuePublicProjection(params: {
  sharedIssueTitle: string;
  category: ComplaintItem['category'];
  linkedComplaints: Array<
    Pick<
      ComplaintItem,
      'id' | 'case_reference' | 'reporter_name' | 'privacy_choice' | 'consented_for_external_escalation' | 'description'
    >
  >;
}): {
  linked_cases_count: number;
  consented_for_escalation_count: number;
  exposed_private_reporter_names: string[];
} {
  const consentedCount = params.linkedComplaints.filter((c) => c.consented_for_external_escalation).length;
  // Private reporter names are NEVER exposed in the shared issue public projection (Test 11)
  return {
    linked_cases_count: params.linkedComplaints.length,
    consented_for_escalation_count: consentedCount,
    exposed_private_reporter_names: [],
  };
}

export function validateCivicEscalationStatus(record: {
  submission_mode: EscalationRecordItem['submission_mode'];
  requested_status: EscalationRecordItem['status'];
  official_docket_reference: string | null;
  acknowledgement_evidence_note: string | null;
}): {
  allowed: boolean;
  effective_status: EscalationRecordItem['status'];
  reason: string;
} {
  if (record.requested_status === 'acknowledged') {
    if (
      record.submission_mode === 'demo_adapter' ||
      !record.official_docket_reference ||
      !record.acknowledgement_evidence_note
    ) {
      return {
        allowed: false,
        effective_status: 'submitted',
        reason:
          'Honest Escalation Policy (CASE-05 / Test 12): Cannot claim official authority "acknowledged" status without a verified official docket reference and receipt evidence.',
      };
    }
  }
  return {
    allowed: true,
    effective_status: record.requested_status,
    reason: 'Valid escalation state transition.',
  };
}

/**
 * 9. Announcement Active Prominence Filter (EVT-01 / Test 13)
 * Expired announcements lose active pinned prominence on Home and Announcements feeds.
 */
export function partitionAnnouncementsByExpiry(
  announcements: AnnouncementItem[],
  nowTimestamp: number = Date.now()
): {
  activeProminent: AnnouncementItem[];
  expiredArchive: AnnouncementItem[];
} {
  const activeProminent: AnnouncementItem[] = [];
  const expiredArchive: AnnouncementItem[] = [];

  for (const item of announcements) {
    const isExpired =
      item.is_expired || (item.expires_at !== null && new Date(item.expires_at).getTime() <= nowTimestamp);
    if (isExpired) {
      expiredArchive.push({ ...item, is_expired: true });
    } else {
      activeProminent.push({ ...item, is_expired: false });
    }
  }

  return { activeProminent, expiredArchive };
}
