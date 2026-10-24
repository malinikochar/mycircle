import { describe, expect, it } from 'vitest';
import { PERSONA_IDS, loadCommunityBootstrapState } from '@/lib/data/community-loader';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import {
  canAccessOrderPrescription,
  canAccessWorkspace,
  canManageComplaint,
  canPerformAdminAction,
  enforceMembershipGate,
  evaluateCameraSessionRequest,
  projectDirectoryMemberForViewer,
  projectSOSIncidentForViewer,
  projectStaffLocationForViewer,
  validatePrimaryAdminRevocation,
} from '@/lib/permissions/engine';
import {
  allocateExchangeQuantityAtomically,
  buildSharedIssuePublicProjection,
  calculateServerValidatedOrder,
  canUnlockDisputeReview,
  evaluateUserBlockEffect,
  partitionAnnouncementsByExpiry,
  resolveBuyerPriceApproval,
  validateAndEvaluateReviewSubmission,
  validateCivicEscalationStatus,
  validateSocialServiceListingPolicy,
} from '@/lib/workflows/transactions';
import {
  buildExchangeListingPostedEmail,
  buildForgotPasswordResetEmail,
  buildOrderPriceRevisionEmail,
  buildPasswordChangedEmail,
  buildRegistrationWelcomeEmail,
  buildSOSEmergencyAlertEmail,
  buildShopOrderPlacedEmail,
} from '@/lib/email/resend';

describe('CommunityCircle PRD v1.0 — 20 Acceptance Tests & Live Supabase Verification', () => {
  it('Test 1: Membership Gate — blocks pending and suspended users on live Supabase RPC & permission engine', async () => {
    const pendingState = await loadCommunityBootstrapState(PERSONA_IDS.PENDING_VIKRAM);
    expect(pendingState.access_denied).toBe(true);
    expect(pendingState.membership_status).toBe('pending');
    expect(pendingState.directory).toBeUndefined();
    expect(pendingState.orders).toBeUndefined();

    const suspendedState = await loadCommunityBootstrapState(PERSONA_IDS.SUSPENDED_KARAN);
    expect(suspendedState.access_denied).toBe(true);
    expect(suspendedState.membership_status).toBe('suspended');

    const gateCheck = enforceMembershipGate({
      id: PERSONA_IDS.PENDING_VIKRAM,
      status: 'pending',
      status_reason: 'Awaiting NOC',
    });
    expect(gateCheck.allowed).toBe(false);
  });

  it('Test 2: Scoped Sub-Admin Isolation — 10 sub-admins are enforced by module and building scope', async () => {
    const adminBootstrap = await loadCommunityBootstrapState(PERSONA_IDS.PRIMARY_ADMIN_AARAV);
    expect(adminBootstrap.access_denied).toBe(false);
    expect(adminBootstrap.role_grants?.length).toBe(11); // 1 Primary Admin + 10 Sub-Admins

    // Sub-Admin #4: Water Supply Delegate Rajeshwar Rao (Scoped to Tower B)
    const waterSubAdmin = await loadCommunityBootstrapState(PERSONA_IDS.SUBADMIN_4_WATER_RAJESHWAR);
    const towerBWaterCheck = canPerformAdminAction(
      waterSubAdmin.actor,
      'water',
      'triage_case',
      '22222222-2222-4222-8222-222222222202'
    );
    expect(towerBWaterCheck.allowed).toBe(true);

    // Out-of-building water case (Tower C) must be denied
    const towerCWaterCheck = canPerformAdminAction(
      waterSubAdmin.actor,
      'water',
      'triage_case',
      '22222222-2222-4222-8222-222222222203'
    );
    expect(towerCWaterCheck.allowed).toBe(false);

    // Out-of-module actions (membership, electricity, safety/CCTV) must be denied
    expect(canPerformAdminAction(waterSubAdmin.actor, 'membership', 'approve_member').allowed).toBe(false);
    expect(canPerformAdminAction(waterSubAdmin.actor, 'electricity', 'triage_case').allowed).toBe(false);
    expect(canPerformAdminAction(waterSubAdmin.actor, 'safety', 'grant_camera_view').allowed).toBe(false);

    // Last-owner protection prevents revoking the sole Primary Admin
    const lastOwnerCheck = validatePrimaryAdminRevocation(
      adminBootstrap.role_grants ?? [],
      '33333333-3333-4333-8333-333333333300'
    );
    expect(lastOwnerCheck.allowed).toBe(false);
  });

  it('Test 3: Contact Privacy — personal phone & flat number are stripped in directory payloads unless opted in', async () => {
    const priyaState = await loadCommunityBootstrapState(PERSONA_IDS.RESIDENT_PRIYA);
    const otherResidentInDirectory = (priyaState.directory ?? []).find(
      (m) => m.id === PERSONA_IDS.RESIDENT_ROHAN
    );
    expect(otherResidentInDirectory).toBeDefined();
    // Dr. Rohan has show_unit=false and show_phone=false by default: server strips both fields
    expect(otherResidentInDirectory?.unit_number).toBeNull();
    expect(otherResidentInDirectory?.personal_phone).toBeNull();

    // Direct unit test of projectDirectoryMemberForViewer
    const projected = projectDirectoryMemberForViewer(
      {
        id: PERSONA_IDS.RESIDENT_ROHAN,
        display_name: 'Dr. Rohan Kulkarni',
        bio: 'Paediatrician',
        profession: 'Paediatrician',
        skills: ['First Aid'],
        interests: ['reading'],
        member_rating_avg: 4.95,
        member_review_count: 11,
        completed_interactions_count: 23,
        membership_status: 'approved',
        building_name: 'Tower C — Banyan',
        building_code: 'TWR-C',
        unit_number: '1102',
        personal_phone: '+91-9820000003',
        show_building: true,
        show_unit: false,
        show_phone: false,
        show_profession: true,
        show_business: true,
        professional_headline: 'MD',
        business_name: null,
        business_category: null,
        business_description: null,
        role_badges: [],
      },
      priyaState.actor
    );
    expect(projected.unit_number).toBeNull();
    expect(projected.personal_phone).toBeNull();
  });

  it('Test 4: Order Integrity & Idempotency — ignores tampered client prices and prevents duplicate orders', () => {
    const productsMap = new Map([
      [
        'prod-rice',
        {
          id: 'prod-rice',
          name: 'Indrayani Organic Rice 5kg',
          price_paise: 46500,
          tax_rate_bps: 500, // 5%
          stock_quantity: 10,
          requires_prescription: false,
          is_active: true,
        },
      ],
    ]);

    const orderResult = calculateServerValidatedOrder({
      shop: {
        id: 'shop-1',
        approval_status: 'approved',
        min_order_paise: 15000,
        delivery_fee_paise: 1500,
      },
      productsById: productsMap,
      requestedItems: [
        {
          product_id: 'prod-rice',
          quantity: 2,
          tampered_client_price_paise: 100, // Client tampered ₹1.00 price
        },
      ],
      buyerId: PERSONA_IDS.RESIDENT_PRIYA,
      idempotencyKey: 'idem-test-001',
    });

    expect(orderResult.ok).toBe(true);
    expect(orderResult.idempotentReplay).toBe(false);
    // Server computes 2 * 46500 = 93000 subtotal + 4650 GST (5%) + 1500 delivery = 99150 paise
    expect(orderResult.orderSummary?.subtotal_paise).toBe(93000);
    expect(orderResult.orderSummary?.tax_paise).toBe(4650);
    expect(orderResult.orderSummary?.total_paise).toBe(99150);

    // Replay with same idempotencyKey returns existing order without creating a second order
    const replayResult = calculateServerValidatedOrder({
      shop: {
        id: 'shop-1',
        approval_status: 'approved',
        min_order_paise: 15000,
        delivery_fee_paise: 1500,
      },
      productsById: productsMap,
      requestedItems: [{ product_id: 'prod-rice', quantity: 2 }],
      buyerId: PERSONA_IDS.RESIDENT_PRIYA,
      idempotencyKey: 'idem-test-001',
      existingOrderByIdempotencyKey: {
        id: orderResult.orderSummary!.order_id,
        total_paise: orderResult.orderSummary!.total_paise,
        status: 'submitted',
      },
    });
    expect(replayResult.idempotentReplay).toBe(true);
    expect(replayResult.orderSummary?.order_id).toBe(orderResult.orderSummary?.order_id);
  });

  it('Test 5: Prescription Privacy — private Rx attachment visible only to patient and fulfilling pharmacist', async () => {
    // Pharmacist Dr. Zoya Merchant can view the prescription on CarePlus Pharmacy Order #3
    const pharmacistState = await loadCommunityBootstrapState(PERSONA_IDS.PHARMACIST_ZOYA);
    const pharmacyOrderForZoya = (pharmacistState.orders ?? []).find(
      (o) => o.id === '53333333-3333-4333-8333-333333333303'
    );
    expect(pharmacyOrderForZoya).toBeDefined();
    expect(pharmacyOrderForZoya?.prescription_attachment).not.toBeNull();
    expect(pharmacyOrderForZoya?.prescription_attachment?.storage_bucket).toBe('prescriptions-private');

    // Unrelated Grocery Shop Owner Suresh Agarwal cannot see CarePlus Pharmacy orders or prescriptions
    const grocerState = await loadCommunityBootstrapState(PERSONA_IDS.SHOP_OWNER_SURESH);
    const pharmacyOrderForGrocer = (grocerState.orders ?? []).find(
      (o) => o.id === '53333333-3333-4333-8333-333333333303'
    );
    expect(pharmacyOrderForGrocer).toBeUndefined();

    // Primary Admin Aarav Mehta sees order metadata for commerce governance, but prescription_attachment is NULL
    const adminState = await loadCommunityBootstrapState(PERSONA_IDS.PRIMARY_ADMIN_AARAV);
    const pharmacyOrderForAdmin = (adminState.orders ?? []).find(
      (o) => o.id === '53333333-3333-4333-8333-333333333303'
    );
    expect(pharmacyOrderForAdmin?.prescription_attachment).toBeNull();
    expect(canAccessOrderPrescription(adminState.actor, pharmacyOrderForAdmin!).allowed).toBe(false);
  });

  it('Test 6: Order Price/Weight Change Approval — requires explicit buyer approval before fulfilment', () => {
    // Non-buyer cannot approve
    const unauthorizedAttempt = resolveBuyerPriceApproval({
      actorId: PERSONA_IDS.SHOP_OWNER_SURESH,
      buyerId: PERSONA_IDS.RESIDENT_PRIYA,
      currentStatus: 'awaiting_buyer_approval',
      originalTotalPaise: 78780,
      proposedTotalPaise: 73800,
      currentInvoiceRevision: 1,
      approve: true,
    });
    expect(unauthorizedAttempt.ok).toBe(false);

    // Buyer approval transitions order to 'accepted' with revised total and increments invoice revision
    const buyerApproved = resolveBuyerPriceApproval({
      actorId: PERSONA_IDS.RESIDENT_PRIYA,
      buyerId: PERSONA_IDS.RESIDENT_PRIYA,
      currentStatus: 'awaiting_buyer_approval',
      originalTotalPaise: 78780,
      proposedTotalPaise: 73800,
      currentInvoiceRevision: 1,
      approve: true,
    });
    expect(buyerApproved.ok).toBe(true);
    expect(buyerApproved.newStatus).toBe('accepted');
    expect(buyerApproved.finalTotalPaise).toBe(73800);
    expect(buyerApproved.newInvoiceRevision).toBe(2);
  });

  it('Test 7: Service Review Eligibility & Separation — off-platform recommendations excluded from verified average', async () => {
    const state = await loadCommunityBootstrapState(PERSONA_IDS.RESIDENT_PRIYA);
    const electrician = (state.services?.providers ?? []).find(
      (p) => p.id === '62222222-2222-4222-8222-222222222201'
    );
    expect(electrician).toBeDefined();
    expect(electrician?.verified_review_count).toBe(4);
    expect(electrician?.off_platform_recommendation_count).toBe(3);
    expect(electrician?.recommendations[0]?.is_off_platform).toBe(true);
  });

  it('Test 8: Social Service Agreement & Atomic Quantity Allocation — prevents double allocation on last unit', () => {
    const listing = {
      id: 'listing-sofa',
      owner_id: PERSONA_IDS.RESIDENT_PRIYA,
      total_quantity: 1,
      allocated_quantity: 0,
      status: 'open' as const,
      exchange_mode: 'giveaway' as const,
      price_paise: 0,
      deposit_paise: 0,
    };

    const firstAccept = allocateExchangeQuantityAtomically({
      listing,
      counterpartyId: PERSONA_IDS.RESIDENT_ROHAN,
      requestedQuantity: 1,
    });
    expect(firstAccept.ok).toBe(true);
    expect(firstAccept.updatedAllocatedQuantity).toBe(1);
    expect(firstAccept.updatedListingStatus).toBe('fully_allocated');

    // Second resident attempting to claim the same 1-unit listing is rejected
    const secondAccept = allocateExchangeQuantityAtomically({
      listing: {
        ...listing,
        allocated_quantity: firstAccept.updatedAllocatedQuantity!,
        status: firstAccept.updatedListingStatus!,
      },
      counterpartyId: PERSONA_IDS.PRIMARY_ADMIN_AARAV,
      requestedQuantity: 1,
    });
    expect(secondAccept.ok).toBe(false);
    expect(secondAccept.error).toContain('Double-allocation prevented');

    // Prohibited item policy blocks peer-to-peer medicine listings (SOC-10)
    const medicineListingCheck = validateSocialServiceListingPolicy({
      title: 'Leftover Antibiotic Capsules',
      description: 'Giving away unused prescription strip',
      category: 'Health',
    });
    expect(medicineListingCheck.allowed).toBe(false);
  });

  it('Test 9: Blind Review Window — keeps first review hidden until counterparty submits or 14-day window expires', () => {
    const eligibility = {
      id: 'elig-1',
      interaction_type: 'exchange' as const,
      exchange_agreement_id: 'ag-1',
      service_booking_id: null,
      reviewer_id: PERSONA_IDS.RESIDENT_PRIYA,
      reviewer_name: 'Priya Nair',
      subject_user_id: PERSONA_IDS.RESIDENT_ROHAN,
      subject_user_name: 'Dr. Rohan Kulkarni',
      subject_provider_id: null,
      eligibility_reason: 'completed' as const,
      window_ends_at: new Date(Date.now() + 7 * 86400000).toISOString(),
      has_submitted: false,
    };

    // First party submits while counterparty has NOT submitted -> not published immediately
    const firstSubmission = validateAndEvaluateReviewSubmission({
      actorId: PERSONA_IDS.RESIDENT_PRIYA,
      eligibility,
      existingReviewsForEligibility: [],
      counterpartySubmittedReview: null,
      recentReviewsBetweenPairCount30Days: 0,
      overallRating: 5,
      writtenFeedback: 'Returned ladder in spotless condition.',
    });
    expect(firstSubmission.ok).toBe(true);
    expect(firstSubmission.isPublishedImmediately).toBe(false);

    // Without eligibility record, submission is rejected
    const unverifiedSubmission = validateAndEvaluateReviewSubmission({
      actorId: PERSONA_IDS.RESIDENT_PRIYA,
      eligibility: null,
      existingReviewsForEligibility: [],
      counterpartySubmittedReview: null,
      recentReviewsBetweenPairCount30Days: 0,
      overallRating: 5,
      writtenFeedback: 'No transaction existed',
    });
    expect(unverifiedSubmission.ok).toBe(false);
  });

  it('Test 10: Dispute Review Eligibility — pre-handover cancellation blocked; post-handover overdue/dispute unlocked', () => {
    const preHandoverCancelled = canUnlockDisputeReview({
      status: 'cancelled',
      handover_confirmed_by_owner_at: null,
      handover_confirmed_by_counterparty_at: null,
    });
    expect(preHandoverCancelled.eligible).toBe(false);

    const postHandoverDisputed = canUnlockDisputeReview({
      status: 'disputed',
      handover_confirmed_by_owner_at: new Date().toISOString(),
      handover_confirmed_by_counterparty_at: new Date().toISOString(),
    });
    expect(postHandoverDisputed.eligible).toBe(true);
    expect(postHandoverDisputed.reason).toBe('disputed_post_handover');
  });

  it('Test 11: Complaint Duplicate Linking — links cases into shared issue without exposing private reporter details', () => {
    const projection = buildSharedIssuePublicProjection({
      sharedIssueTitle: 'Low Municipal Water Supply Pressure',
      category: 'water',
      linkedComplaints: [
        {
          id: 'c1',
          case_reference: 'CASE-2026-WTR-101',
          reporter_name: 'Priya Nair',
          privacy_choice: 'shareable_redacted',
          consented_for_external_escalation: true,
          description: 'Pressure drop on 7th floor',
        },
        {
          id: 'c2',
          case_reference: 'CASE-2026-WTR-109',
          reporter_name: 'Private Resident',
          privacy_choice: 'private_to_admin',
          consented_for_external_escalation: false,
          description: 'Private report',
        },
      ],
    });
    expect(projection.linked_cases_count).toBe(2);
    expect(projection.consented_for_escalation_count).toBe(1);
    expect(projection.exposed_private_reporter_names).toEqual([]);
  });

  it('Test 12: Civic Escalation Honesty — demo or unverified submission cannot be marked acknowledged', () => {
    const fakeAckAttempt = validateCivicEscalationStatus({
      submission_mode: 'demo_adapter',
      requested_status: 'acknowledged',
      official_docket_reference: null,
      acknowledgement_evidence_note: null,
    });
    expect(fakeAckAttempt.allowed).toBe(false);
    expect(fakeAckAttempt.effective_status).toBe('submitted');
  });

  it('Test 13: Announcement Expiry — expired announcements lose active prominence', async () => {
    const state = await loadCommunityBootstrapState(PERSONA_IDS.RESIDENT_PRIYA);
    const { activeProminent, expiredArchive } = partitionAnnouncementsByExpiry(
      state.announcements ?? []
    );
    expect(activeProminent.length).toBeGreaterThanOrEqual(2);
    expect(expiredArchive.length).toBeGreaterThanOrEqual(1);
    expect(expiredArchive[0].title).toContain('[EXPIRED NOTICE]');
  });

  it('Test 14: SOS Alert Separation — responder receives full unit/phone while resident receives sanitised guidance', async () => {
    const residentView = await loadCommunityBootstrapState(PERSONA_IDS.RESIDENT_ROHAN);
    const incidentForResident = residentView.safety_and_sos?.incidents[0];
    expect(incidentForResident).toBeDefined();
    expect(incidentForResident?.restricted_responder_details).toBeNull();
    expect(incidentForResident?.approx_area_public_label).toContain('Tower B');

    const responderView = await loadCommunityBootstrapState(PERSONA_IDS.STAFF_RESPONDER_MAHESH);
    const incidentForResponder = responderView.safety_and_sos?.incidents[0];
    expect(incidentForResponder?.restricted_responder_details).toContain('Flat B-704');
  });

  it('Test 15: SOS Responder Ownership — authorised responder or safety sub-admin can acknowledge incident', async () => {
    const responderView = await loadCommunityBootstrapState(PERSONA_IDS.STAFF_RESPONDER_MAHESH);
    const incident = responderView.safety_and_sos?.incidents[0];
    expect(incident?.status).toBe('responder_acknowledged');
    expect(incident?.acknowledged_by_name).toBe('Mahesh Yadav');
  });

  it('Test 16: Staff Location Consent & Shift Boundary — off-duty or unconsented staff location is hidden', () => {
    const offDutyProjection = projectStaffLocationForViewer(
      {
        session_id: 'sess-off',
        staff_user_id: PERSONA_IDS.STAFF_GUARD_DINESH,
        staff_name: 'Dinesh Tiwari',
        shift_status: 'completed',
        consent_given: false,
        is_active: false,
        approximate_zone_label: 'Tower B Lobby',
        latitude: 19.1364,
        longitude: 72.8296,
        accuracy_meters: 10,
        updated_at: new Date().toISOString(),
      },
      { id: PERSONA_IDS.RESIDENT_PRIYA, status: 'approved', role_grants: [] },
      'approximate'
    );
    expect(offDutyProjection.visible).toBe(false);
    expect(offDutyProjection.data).toBeNull();
  });

  it('Test 17: Staff Location Grant Precision — approximate grant strips lat/lng on live Supabase RPC & engine', async () => {
    // Ordinary resident Priya Nair has 'approximate' grant -> latitude & longitude are NULL in payload
    const residentState = await loadCommunityBootstrapState(PERSONA_IDS.RESIDENT_PRIYA);
    const locForResident = residentState.staff_and_locations?.active_locations[0];
    expect(locForResident).toBeDefined();
    expect(locForResident?.precision_granted).toBe('approximate');
    expect(locForResident?.latitude).toBeNull();
    expect(locForResident?.longitude).toBeNull();

    // Safety Sub-Admin Col. Pratap Chauhan has 'precise' grant -> receives exact latitude & longitude
    const safetyAdminState = await loadCommunityBootstrapState(PERSONA_IDS.SUBADMIN_10_SAFETY_PRATAP);
    const locForSafetyAdmin = safetyAdminState.staff_and_locations?.active_locations[0];
    expect(locForSafetyAdmin?.precision_granted).toBe('precise');
    expect(locForSafetyAdmin?.latitude).toBeCloseTo(19.1364, 4);
    expect(locForSafetyAdmin?.longitude).toBeCloseTo(72.8296, 4);
  });

  it('Test 18: Common-Area Camera Permission & Audit — denies ungranted camera and mints 60s token for granted camera', async () => {
    const priyaState = await loadCommunityBootstrapState(PERSONA_IDS.RESIDENT_PRIYA);
    const cameras = priyaState.cctv?.cameras ?? [];
    const gateCam = cameras.find((c) => c.camera_code === 'CAM-GATE-01')!;
    const courtyardCam = cameras.find((c) => c.camera_code === 'CAM-CRTYD-01')!;

    // Priya has a temporary 4-hour grant for CAM-GATE-01, but NO grant for CAM-CRTYD-01
    expect(gateCam.actor_has_live_grant).toBe(true);
    expect(courtyardCam.actor_has_live_grant).toBe(false);

    const grantedEval = evaluateCameraSessionRequest(priyaState.actor, gateCam, true);
    expect(grantedEval.allowed).toBe(true);
    expect(grantedEval.access_result).toBe('session_issued');
    expect(grantedEval.expires_in_seconds).toBe(60);

    const deniedEval = evaluateCameraSessionRequest(priyaState.actor, courtyardCam, false);
    expect(deniedEval.allowed).toBe(false);
    expect(deniedEval.access_result).toBe('denied');
    expect(deniedEval.session_token).toBeNull();
  });

  it('Test 19: User Block vs Active Transaction — blocking blocks new DMs while preserving active loan obligation', () => {
    const blockResult = evaluateUserBlockEffect({
      blockerId: PERSONA_IDS.RESIDENT_ROHAN,
      blockedId: PERSONA_IDS.RESIDENT_PRIYA,
      activeAgreementsBetweenPair: [
        {
          id: '73333333-3333-4333-8333-333333333301',
          status: 'active',
          listing_title: 'Lending: Heavy-Duty Aluminium 6-Step Foldable Ladder',
        },
      ],
    });
    expect(blockResult.newDirectMessagesBlocked).toBe(true);
    expect(blockResult.activeLoanObligationsPreserved).toBe(true);
    expect(blockResult.preservedAgreementIds).toContain('73333333-3333-4333-8333-333333333301');
  });

  it('Test 20: Workspace Separation & Mobile Navigation Contract — verifies separated role workspaces', async () => {
    const priyaState = await loadCommunityBootstrapState(PERSONA_IDS.RESIDENT_PRIYA);
    expect(canAccessWorkspace(priyaState.actor, 'resident').allowed).toBe(true);
    expect(canAccessWorkspace(priyaState.actor, 'admin').allowed).toBe(false);
    expect(canAccessWorkspace(priyaState.actor, 'shop').allowed).toBe(false);
    expect(canAccessWorkspace(priyaState.actor, 'provider').allowed).toBe(false);
    expect(canAccessWorkspace(priyaState.actor, 'staff').allowed).toBe(false);

    const complaintRoutingCheck = canManageComplaint(priyaState.actor, {
      reporter_id: PERSONA_IDS.RESIDENT_PRIYA,
      category: 'water',
      building_id: '22222222-2222-4222-8222-222222222202',
    });
    expect(complaintRoutingCheck.allowed).toBe(false);

    const sosProjected = projectSOSIncidentForViewer(
      priyaState.safety_and_sos!.incidents[0],
      { id: PERSONA_IDS.RESIDENT_ROHAN, status: 'approved', role_grants: [], staff_profile: null }
    );
    expect(sosProjected.restricted_responder_details).toBeNull();
  });

  it('Test 21: MyCircle Authentication & Account Profile RPCs — verifies Admin & Resident login credentials on live Supabase', async () => {
    const supabase = createSupabaseServerClient();

    // 1. Verify Primary Admin login (username: admin, password: MyCircle@Admin2026)
    const { data: adminAuth, error: adminErr } = await supabase.rpc('cc_authenticate_user', {
      p_identifier: 'admin',
      p_password: 'MyCircle@Admin2026',
    });
    expect(adminErr).toBeNull();
    expect(adminAuth?.authenticated).toBe(true);
    expect(adminAuth?.user_id).toBe(PERSONA_IDS.PRIMARY_ADMIN_AARAV);

    // 2. Verify Approved Resident login by email (priya@ensure.in, password: MyCircle@User2026)
    const { data: residentAuth, error: resErr } = await supabase.rpc('cc_authenticate_user', {
      p_identifier: 'priya@ensure.in',
      p_password: 'MyCircle@User2026',
    });
    expect(resErr).toBeNull();
    expect(residentAuth?.authenticated).toBe(true);
    expect(residentAuth?.user_id).toBe(PERSONA_IDS.RESIDENT_PRIYA);

    // 3. Verify wrong password is rejected
    const { error: badPassErr } = await supabase.rpc('cc_authenticate_user', {
      p_identifier: 'admin',
      p_password: 'WrongPassword123',
    });
    expect(badPassErr).not.toBeNull();

    // 4. Verify Account Details RPC returns username, @ensure.in email, and business details
    const { data: priyaDetails, error: detailsErr } = await supabase.rpc(
      'cc_get_actor_account_details',
      { p_actor_id: PERSONA_IDS.RESIDENT_PRIYA }
    );
    expect(detailsErr).toBeNull();
    expect(priyaDetails?.username).toBe('priya');
    expect(priyaDetails?.email).toBe('priya@ensure.in');
    expect(priyaDetails?.business_name).toBe('Studio Terracotta Architecture');

    // 5. Verify Unauthenticated Public Gate returns zero community data
    const unauthState = await loadCommunityBootstrapState();
    expect(unauthState.access_denied).toBe(true);
    expect(unauthState.membership_status).toBe('unauthenticated');
    expect(unauthState.personas).toEqual([]);
    expect(unauthState.directory).toBeUndefined();

    // 6. Verify Password Change & Forgot Password Reset RPCs (restoring original password)
    const { data: resetRes, error: resetErr } = await supabase.rpc('cc_reset_forgotten_password', {
      p_identifier: 'rohan@ensure.in',
      p_verification_text: '302',
      p_new_password: 'MyCircle@TempPass2026',
    });
    expect(resetErr).toBeNull();
    expect(resetRes?.reset).toBe(true);
    expect(resetRes?.email).toBe('rohan@ensure.in');

    const { data: restoreRes, error: restoreErr } = await supabase.rpc('cc_change_user_password', {
      p_actor_id: PERSONA_IDS.RESIDENT_ROHAN,
      p_current_password: 'MyCircle@TempPass2026',
      p_new_password: 'MyCircle@User2026',
    });
    expect(restoreErr).toBeNull();
    expect(restoreRes?.ok).toBe(true);
  });

  it('Test 22: @ensure.in Email Domain & Resend Transactional Templates — verifies all 7 email templates and domain migration', async () => {
    const supabase = createSupabaseServerClient();

    // 1. Verify all 10 persona emails in Supabase use @ensure.in
    for (const actorId of Object.values(PERSONA_IDS)) {
      const { data: details, error } = await supabase.rpc('cc_get_actor_account_details', {
        p_actor_id: actorId,
      });
      expect(error).toBeNull();
      expect(details?.email).toMatch(/@ensure\.in$/);
      expect(details?.email).not.toContain('mycircle.in');
    }

    // 2. Verify all 7 Resend HTML email templates render properly with @ensure.in branding
    const welcomeMail = buildRegistrationWelcomeEmail({
      displayName: 'Ananya Verma',
      username: 'ananya',
      email: 'ananya@ensure.in',
      unitNumber: '405',
      membershipStatus: 'approved',
    });
    expect(welcomeMail.to).toBe('ananya@ensure.in');
    expect(welcomeMail.subject).toContain('Welcome to MyCircle');
    expect(welcomeMail.html).toContain('ananya@ensure.in');
    expect(welcomeMail.html).toContain('ensure.in');

    const resetMail = buildForgotPasswordResetEmail({
      displayName: 'Rohan Kulkarni',
      username: 'rohan',
      email: 'rohan@ensure.in',
    });
    expect(resetMail.to).toBe('rohan@ensure.in');
    expect(resetMail.subject).toContain('Password Reset');
    expect(resetMail.html).toContain('rohan');

    const changedMail = buildPasswordChangedEmail({
      displayName: 'Priya Nair',
      username: 'priya',
      email: 'priya@ensure.in',
    });
    expect(changedMail.to).toBe('priya@ensure.in');
    expect(changedMail.subject).toContain('Password Updated');

    const orderMail = buildShopOrderPlacedEmail({
      buyerName: 'Priya Nair',
      buyerEmail: 'priya@ensure.in',
      orderId: '88888888-8888-4888-8888-888888888801',
      paymentMethod: 'upi',
      instructions: 'Leave at doorstep',
    });
    expect(orderMail.to).toBe('priya@ensure.in');
    expect(orderMail.html).toContain('88888888');

    const priceRevMail = buildOrderPriceRevisionEmail({
      recipientEmail: 'shop@ensure.in',
      buyerName: 'Priya Nair',
      orderId: '88888888-8888-4888-8888-888888888801',
      approved: true,
    });
    expect(priceRevMail.to).toBe('shop@ensure.in');
    expect(priceRevMail.subject).toContain('Approved');

    const exchangeMail = buildExchangeListingPostedEmail({
      ownerName: 'Priya Nair',
      ownerEmail: 'priya@ensure.in',
      title: 'Organic Compost Bags',
      exchangeMode: 'barter',
      handoverOptions: 'Lobby drop-off',
    });
    expect(exchangeMail.to).toBe('priya@ensure.in');
    expect(exchangeMail.html).toContain('Organic Compost Bags');

    const sosMail = buildSOSEmergencyAlertEmail({
      recipientEmails: ['admin@ensure.in', 'safety.admin@ensure.in', 'security@ensure.in'],
      reporterName: 'Rohan Kulkarni',
      category: 'medical',
      floorLabel: '3rd Floor',
      liftOrAreaLabel: 'Tower B Lobby',
      notes: 'Urgent medical assistance needed at B-302',
    });
    expect(sosMail.to).toEqual(['admin@ensure.in', 'safety.admin@ensure.in', 'security@ensure.in']);
    expect(sosMail.subject).toContain('URGENT SOS');
    expect(sosMail.html).toContain('Tower B Lobby');
  });
});
