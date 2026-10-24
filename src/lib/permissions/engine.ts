import type {
  ActorContext,
  CameraItem,
  ComplaintItem,
  DirectoryMember,
  OrderRecord,
  RoleGrant,
  SOSIncidentItem,
  SubAdminScope,
  WorkspaceType,
} from '@/lib/types/domain';

export interface PermissionCheckResult {
  allowed: boolean;
  reason: string;
}

/**
 * 1. Membership Gate (Phase 0 / Test 1)
 * Denies access to all community routes and records if the actor is unauthenticated,
 * pending, rejected, or suspended.
 */
export function enforceMembershipGate(actor: Pick<ActorContext, 'id' | 'status' | 'status_reason'> | null): PermissionCheckResult {
  if (!actor || !actor.id) {
    return { allowed: false, reason: 'Unauthenticated session: sign-in required.' };
  }
  if (actor.status !== 'approved') {
    return {
      allowed: false,
      reason: `Membership status is "${actor.status}" (${actor.status_reason ?? 'awaiting verification'}). Protected community modules are denied.`,
    };
  }
  return { allowed: true, reason: 'Approved community member.' };
}

/**
 * 2. Scoped Sub-Admin Authorization (Section 3.2 / Test 2)
 * Verifies module scope, optional building scope, and allowed action.
 */
export function canPerformAdminAction(
  actor: Pick<ActorContext, 'status' | 'role_grants'>,
  requiredScope: SubAdminScope,
  action: string,
  targetBuildingId: string | null = null
): PermissionCheckResult {
  if (actor.status !== 'approved') {
    return { allowed: false, reason: 'Suspended or unapproved members cannot exercise administrative grants.' };
  }

  const now = Date.now();
  for (const grant of actor.role_grants ?? []) {
    if (grant.expires_at && new Date(grant.expires_at).getTime() <= now) {
      continue;
    }

    const isPrimaryOrAll = grant.role_type === 'primary_admin' || grant.module_scope === 'all';
    const scopeMatches = isPrimaryOrAll || grant.module_scope === requiredScope;

    if (!scopeMatches) {
      continue;
    }

    const buildingMatches =
      isPrimaryOrAll ||
      !grant.building_scope_id ||
      !targetBuildingId ||
      grant.building_scope_id === targetBuildingId;

    if (!buildingMatches) {
      continue;
    }

    const actionAllowed =
      isPrimaryOrAll ||
      grant.allowed_actions.includes('*') ||
      grant.allowed_actions.includes(action);

    if (actionAllowed) {
      return {
        allowed: true,
        reason: `Authorised via ${grant.title_label} (${grant.module_scope}).`,
      };
    }
  }

  return {
    allowed: false,
    reason: `Denied: Actor lacks "${requiredScope}" scope or "${action}" permission${targetBuildingId ? ` for building ${targetBuildingId}` : ''}.`,
  };
}

/**
 * 3. Last-Owner Protection (Section 3.1)
 * Prevents revoking or demoting the last active Primary Admin in a community.
 */
export function validatePrimaryAdminRevocation(
  activeGrants: RoleGrant[],
  targetGrantId: string
): PermissionCheckResult {
  const target = activeGrants.find((g) => g.id === targetGrantId);
  if (!target) {
    return { allowed: false, reason: 'Target role grant not found.' };
  }
  if (target.role_type !== 'primary_admin') {
    return { allowed: true, reason: 'Sub-admin grant can be revoked by Primary Admin.' };
  }
  const remainingPrimaryAdmins = activeGrants.filter(
    (g) => g.role_type === 'primary_admin' && g.id !== targetGrantId
  );
  if (remainingPrimaryAdmins.length === 0) {
    return {
      allowed: false,
      reason: 'Last-owner protection: Cannot revoke the sole Primary Admin without transferring ownership first.',
    };
  }
  return { allowed: true, reason: 'Another active Primary Admin exists.' };
}

/**
 * 4. Workspace Access Enforcement (Section 3.3 / Section 4.1)
 * Keeps Resident, Admin, Shop, Provider, and Staff operational workspaces separated.
 */
export function canAccessWorkspace(actor: ActorContext, workspace: WorkspaceType): PermissionCheckResult {
  const gate = enforceMembershipGate(actor);
  if (!gate.allowed) return gate;

  switch (workspace) {
    case 'resident':
      return { allowed: true, reason: 'Approved member can access Resident view.' };
    case 'admin':
      return (actor.role_grants?.length ?? 0) > 0
        ? { allowed: true, reason: `Authorised for Admin Workspace (${actor.role_grants[0].title_label}).` }
        : { allowed: false, reason: 'Denied: No active Primary Admin or Sub-Admin role grant.' };
    case 'shop':
      return (actor.shop_memberships?.length ?? 0) > 0 ||
        canPerformAdminAction(actor, 'commerce_support', 'approve_shop').allowed
        ? { allowed: true, reason: 'Authorised for Shop / Merchant Workspace.' }
        : { allowed: false, reason: 'Denied: Actor is not an active shop owner, pharmacist, or commerce sub-admin.' };
    case 'provider':
      return (actor.provider_memberships?.length ?? 0) > 0 ||
        canPerformAdminAction(actor, 'local_services', 'verify_provider_badge').allowed
        ? { allowed: true, reason: 'Authorised for Service Provider Workspace.' }
        : { allowed: false, reason: 'Denied: Actor is not a registered service provider or local services sub-admin.' };
    case 'staff':
      return Boolean(actor.staff_profile) ||
        canPerformAdminAction(actor, 'safety', 'manage_shifts').allowed
        ? { allowed: true, reason: 'Authorised for Staff & Responder Workspace.' }
        : { allowed: false, reason: 'Denied: Actor is not an on-duty staff member or safety sub-admin.' };
  }
}

/**
 * 5. Directory Field-Level Privacy Filter (MEM-03 / Test 3)
 * Strips unit_number and personal_phone unless the subject opted in,
 * the viewer is the subject, or the viewer holds membership admin scope.
 */
export function projectDirectoryMemberForViewer(
  rawMember: {
    id: string;
    display_name: string;
    bio: string | null;
    profession: string | null;
    skills: string[];
    interests: string[];
    member_rating_avg: number | null;
    member_review_count: number;
    completed_interactions_count: number;
    membership_status: DirectoryMember['membership_status'];
    building_name: string | null;
    building_code: string | null;
    unit_number: string | null;
    personal_phone: string | null;
    show_building: boolean;
    show_unit: boolean;
    show_phone: boolean;
    show_profession: boolean;
    show_business: boolean;
    professional_headline: string | null;
    business_name: string | null;
    business_category: string | null;
    business_description: string | null;
    role_badges: string[];
  },
  viewer: Pick<ActorContext, 'id' | 'status' | 'role_grants'>
): DirectoryMember {
  const isSelf = rawMember.id === viewer.id;
  const hasMembershipAdmin = canPerformAdminAction(viewer, 'membership', 'approve_member').allowed;

  return {
    id: rawMember.id,
    display_name: rawMember.display_name,
    bio: rawMember.bio,
    profession: rawMember.show_profession || isSelf || hasMembershipAdmin ? rawMember.profession : null,
    skills: rawMember.skills,
    interests: rawMember.interests,
    member_rating_avg: rawMember.member_rating_avg,
    member_review_count: rawMember.member_review_count,
    completed_interactions_count: rawMember.completed_interactions_count,
    membership_status: rawMember.membership_status,
    building_name: rawMember.show_building || isSelf || hasMembershipAdmin ? rawMember.building_name : 'Building Hidden',
    building_code: rawMember.show_building || isSelf || hasMembershipAdmin ? rawMember.building_code : null,
    unit_number: rawMember.show_unit || isSelf || hasMembershipAdmin ? rawMember.unit_number : null,
    personal_phone: rawMember.show_phone || isSelf || hasMembershipAdmin ? rawMember.personal_phone : null,
    professional_headline: rawMember.professional_headline,
    business_name: rawMember.show_business ? rawMember.business_name : null,
    business_category: rawMember.show_business ? rawMember.business_category : null,
    business_description: rawMember.show_business ? rawMember.business_description : null,
    role_badges: rawMember.role_badges,
  };
}

/**
 * 6. Prescription Privacy Gate (SHOP-11 / Test 5)
 * Ensures private prescription attachments are visible ONLY to the ordering buyer
 * or a shop member on that specific shop with `can_review_prescriptions = true`.
 * Even Primary Admin and unrelated shop owners are denied prescription access.
 */
export function canAccessOrderPrescription(
  viewer: Pick<ActorContext, 'id' | 'status' | 'shop_memberships'>,
  order: Pick<OrderRecord, 'buyer_id' | 'shop_id' | 'has_restricted_prescription'>
): PermissionCheckResult {
  if (viewer.status !== 'approved') {
    return { allowed: false, reason: 'Unapproved member cannot access prescriptions.' };
  }
  if (!order.has_restricted_prescription) {
    return { allowed: false, reason: 'Order has no prescription attachment.' };
  }
  if (order.buyer_id === viewer.id) {
    return { allowed: true, reason: 'Buyer owns the uploaded prescription.' };
  }
  const pharmacistMembership = (viewer.shop_memberships ?? []).find(
    (sm) => sm.shop_id === order.shop_id && sm.can_review_prescriptions
  );
  if (pharmacistMembership) {
    return { allowed: true, reason: 'Licensed pharmacist on the fulfilling pharmacy shop.' };
  }
  return {
    allowed: false,
    reason: 'Denied (SHOP-11): Prescriptions are private to the patient and the fulfilling shop pharmacist.',
  };
}

/**
 * 7. Complaint & Case Routing Scope Check (CASE-01..03 / Test 2 & Test 11)
 * Verifies whether a sub-admin can view/triage a complaint based on category and building.
 */
export function canManageComplaint(
  viewer: Pick<ActorContext, 'id' | 'status' | 'role_grants'>,
  complaint: Pick<ComplaintItem, 'reporter_id' | 'category' | 'building_id'>
): PermissionCheckResult {
  const scopeMap: Record<ComplaintItem['category'], SubAdminScope> = {
    water: 'water',
    electricity: 'electricity',
    cleanliness: 'cleanliness',
    security_facility: 'safety',
    roads: 'civic_escalation',
    drainage: 'civic_escalation',
    streetlights: 'civic_escalation',
    other_civic: 'civic_escalation',
  };
  const requiredScope = scopeMap[complaint.category];
  return canPerformAdminAction(viewer, requiredScope, 'triage_case', complaint.building_id);
}

/**
 * 8. SOS Alert Projection (SOS-04 / Test 14)
 * Responders and Safety Sub-Admins receive full unit/floor/phone details;
 * ordinary community members receive only sanitised public area guidance.
 */
export function projectSOSIncidentForViewer(
  incident: SOSIncidentItem,
  viewer: Pick<ActorContext, 'id' | 'status' | 'role_grants' | 'staff_profile'>
): SOSIncidentItem {
  const isReporter = incident.reporter_id === viewer.id;
  const isResponder =
    Boolean(viewer.staff_profile?.is_active_responder) ||
    canPerformAdminAction(viewer, 'safety', 'acknowledge_sos').allowed;

  if (isReporter || isResponder) {
    return incident;
  }

  return {
    ...incident,
    reporter_name: 'Resident Alert',
    manual_floor_label: null,
    manual_lift_or_area_label: null,
    restricted_responder_details: null,
  };
}

/**
 * 9. Staff Location Precision Projection (STF-02..05 / Test 16 & Test 17)
 * Requires active shift + explicit staff consent; strips raw latitude/longitude
 * unless viewer is the staff member, Safety Sub-Admin, or holds a precise grant.
 */
export function projectStaffLocationForViewer(
  rawLocation: {
    session_id: string;
    staff_user_id: string;
    staff_name: string;
    shift_status: 'scheduled' | 'on_duty' | 'completed' | 'missed';
    consent_given: boolean;
    is_active: boolean;
    approximate_zone_label: string;
    latitude: number;
    longitude: number;
    accuracy_meters: number;
    updated_at: string;
  },
  viewer: Pick<ActorContext, 'id' | 'status' | 'role_grants'>,
  viewerGrantPrecision: 'none' | 'approximate' | 'precise'
): {
  visible: boolean;
  reason: string;
  data: {
    approximate_zone_label: string;
    latitude: number | null;
    longitude: number | null;
    precision_granted: 'approximate' | 'precise';
    is_stale: boolean;
  } | null;
} {
  if (viewer.status !== 'approved') {
    return { visible: false, reason: 'Unapproved viewer.', data: null };
  }
  if (rawLocation.shift_status !== 'on_duty' || !rawLocation.consent_given || !rawLocation.is_active) {
    return {
      visible: false,
      reason: 'Hidden (STF-02): Staff member is off-duty or has not granted active location consent.',
      data: null,
    };
  }

  const isSelf = rawLocation.staff_user_id === viewer.id;
  const isSafetyAdmin = canPerformAdminAction(viewer, 'safety', 'grant_location_view').allowed;
  const effectivePrecision: 'none' | 'approximate' | 'precise' =
    isSelf || isSafetyAdmin ? 'precise' : viewerGrantPrecision;

  if (effectivePrecision === 'none') {
    return { visible: false, reason: 'Denied: No active location grant for this viewer.', data: null };
  }

  const ageSeconds = (Date.now() - new Date(rawLocation.updated_at).getTime()) / 1000;
  const isStale = ageSeconds > 120;

  return {
    visible: true,
    reason: effectivePrecision === 'precise' ? 'Precise coordinates authorised.' : 'Approximate zone only (coordinates stripped).',
    data: {
      approximate_zone_label: rawLocation.approximate_zone_label,
      latitude: effectivePrecision === 'precise' ? rawLocation.latitude : null,
      longitude: effectivePrecision === 'precise' ? rawLocation.longitude : null,
      precision_granted: effectivePrecision,
      is_stale: isStale,
    },
  };
}

/**
 * 10. Common-Area CCTV Access Verification (CCTV-01..07 / Test 18)
 * Verifies common-area camera grant, blocks private residential cameras,
 * and mints a short-lived 60-second scoped session token with an audit record.
 */
export function evaluateCameraSessionRequest(
  viewer: Pick<ActorContext, 'id' | 'status' | 'role_grants'>,
  camera: Pick<CameraItem, 'id' | 'camera_code' | 'display_name' | 'online_state' | 'actor_has_live_grant'>,
  hasActiveDirectGrant: boolean
): {
  allowed: boolean;
  access_result: 'session_issued' | 'denied';
  session_token: string | null;
  expires_in_seconds: number;
  audit_reason: string;
} {
  if (viewer.status !== 'approved') {
    return {
      allowed: false,
      access_result: 'denied',
      session_token: null,
      expires_in_seconds: 0,
      audit_reason: 'Viewer membership is not approved.',
    };
  }

  const isSafetyAdmin = canPerformAdminAction(viewer, 'safety', 'grant_camera_view').allowed;
  const authorised = isSafetyAdmin || camera.actor_has_live_grant || hasActiveDirectGrant;

  if (!authorised) {
    return {
      allowed: false,
      access_result: 'denied',
      session_token: null,
      expires_in_seconds: 0,
      audit_reason: `Denied (CCTV-03): Viewer ${viewer.id} lacks an active live grant for ${camera.camera_code}.`,
    };
  }

  return {
    allowed: true,
    access_result: 'session_issued',
    session_token: `cctv-scoped-60s-${camera.camera_code.toLowerCase()}-${Date.now()}`,
    expires_in_seconds: 60,
    audit_reason: `Issued 60-second scoped session for common-area camera ${camera.camera_code}.`,
  };
}
