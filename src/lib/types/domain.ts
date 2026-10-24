export type MembershipStatus = 'pending' | 'approved' | 'rejected' | 'suspended';

export type WorkspaceType = 'resident' | 'admin' | 'shop' | 'provider' | 'staff';

export type SubAdminScope =
  | 'all'
  | 'membership'
  | 'moderation'
  | 'events'
  | 'water'
  | 'electricity'
  | 'cleanliness'
  | 'civic_escalation'
  | 'commerce_support'
  | 'local_services'
  | 'safety';

export interface RoleGrant {
  id: string;
  user_id?: string;
  user_name?: string;
  user_profession?: string;
  role_type: 'primary_admin' | 'sub_admin';
  module_scope: SubAdminScope;
  building_scope_id: string | null;
  building_scope_name?: string | null;
  allowed_actions: string[];
  title_label: string;
  expires_at?: string | null;
}

export interface ShopMembership {
  shop_id: string;
  shop_name: string;
  role: 'owner' | 'pharmacist' | 'staff';
  can_review_prescriptions: boolean;
}

export interface ProviderMembership {
  provider_id: string;
  display_name: string;
  role: 'primary' | 'delegate';
}

export interface StaffProfileSummary {
  user_id?: string;
  display_name?: string;
  avatar_url?: string | null;
  staff_code: string;
  employer_team?: string;
  role_title: 'security_guard' | 'head_guard' | 'housekeeping' | 'technician' | 'estate_manager';
  assigned_post_label: string | null;
  is_active_responder: boolean;
}

export interface ProfileVisibility {
  show_building: boolean;
  show_unit: boolean;
  show_phone: boolean;
  show_profession: boolean;
  show_business: boolean;
  allow_direct_messages: boolean;
}

export interface ActorContext {
  id: string;
  display_name: string;
  avatar_url?: string | null;
  bio?: string;
  profession: string | null;
  skills?: string[];
  interests?: string[];
  member_rating_avg?: number | null;
  member_review_count?: number;
  completed_interactions_count?: number;
  status: MembershipStatus;
  status_reason?: string | null;
  building_id?: string | null;
  building_name?: string | null;
  building_code?: string | null;
  unit_number?: string | null;
  personal_phone?: string | null;
  residency_type?: string | null;
  visibility?: ProfileVisibility;
  role_grants: RoleGrant[];
  shop_memberships: ShopMembership[];
  provider_memberships: ProviderMembership[];
  staff_profile?: StaffProfileSummary | null;
}

export interface PersonaOption {
  id: string;
  display_name: string;
  avatar_url?: string | null;
  profession: string | null;
  membership_status: MembershipStatus;
  building_code: string | null;
  roles: Array<{
    role_type: 'primary_admin' | 'sub_admin';
    module_scope: SubAdminScope;
    title_label: string;
  }>;
  is_shop_member: boolean;
  is_provider: boolean;
  is_staff: boolean;
}

export interface DirectoryMember {
  id: string;
  display_name: string;
  avatar_url?: string | null;
  bio: string | null;
  profession: string | null;
  skills: string[];
  interests: string[];
  member_rating_avg: number | null;
  member_review_count: number;
  completed_interactions_count: number;
  membership_status: MembershipStatus;
  building_name: string | null;
  building_code: string | null;
  unit_number: string | null;
  personal_phone: string | null;
  professional_headline: string | null;
  business_name: string | null;
  business_category: string | null;
  business_description: string | null;
  role_badges: string[];
}

export interface BuildingInfo {
  id: string;
  code: string;
  name: string;
  floors_count: number;
  units_count: number;
}

export interface AnnouncementItem {
  id: string;
  title: string;
  body: string;
  category: 'general' | 'utility' | 'governance' | 'maintenance' | 'safety' | 'events';
  audience_type: 'all_members' | 'building' | 'role';
  target_building_name: string | null;
  author_name: string;
  is_pinned: boolean;
  requires_acknowledgement: boolean;
  published_at: string;
  expires_at: string | null;
  is_expired: boolean;
  acknowledgement_count: number;
  actor_acknowledged: boolean;
}

export interface EventItem {
  id: string;
  title: string;
  description: string;
  location_label: string;
  starts_at: string;
  ends_at: string;
  capacity: number | null;
  status: 'scheduled' | 'cancelled' | 'completed';
  organiser_name: string;
  linked_exchange_listing_id: string | null;
  rsvp_going_count: number;
  actor_rsvp: 'going' | 'interested' | 'not_going' | null;
}

export interface PostComment {
  id: string;
  author_name: string;
  body: string;
  created_at: string;
}

export interface PostItem {
  id: string;
  category: 'general' | 'recommendations' | 'lost_and_found' | 'local_info' | 'celebrations';
  title: string;
  body: string;
  author_id: string;
  author_name: string;
  author_profession: string | null;
  building_name: string | null;
  moderation_state: 'visible' | 'hidden_pending_review' | 'removed';
  created_at: string;
  comments: PostComment[];
}

export interface CommunityGroup {
  id: string;
  name: string;
  group_type: 'building' | 'interest' | 'committee';
  moderation_policy: string;
  building_name: string | null;
}

export interface ProductItem {
  id: string;
  name: string;
  category: string;
  pack_size: string;
  unit_label: string;
  price_paise: number;
  tax_rate_bps: number;
  stock_quantity: number;
  requires_prescription: boolean;
  is_active: boolean;
}

export interface ShopItem {
  id: string;
  owner_id: string;
  owner_name: string;
  name: string;
  category: 'grocery' | 'pharmacy' | 'bakery_dairy' | 'stationery' | 'general';
  description: string;
  unit_location: string;
  operating_hours: string;
  service_windows: string[];
  delivery_available: boolean;
  min_order_paise: number;
  delivery_fee_paise: number;
  is_pharmacy_gated: boolean;
  gstin_number: string | null;
  approval_status: 'pending' | 'approved' | 'suspended';
  products: ProductItem[];
}

export type OrderStatus =
  | 'draft'
  | 'submitted'
  | 'accepted'
  | 'awaiting_buyer_approval'
  | 'preparing'
  | 'ready_for_pickup'
  | 'out_for_delivery'
  | 'delivered'
  | 'completed'
  | 'cancelled'
  | 'refund_or_credit_pending';

export type OrderPaymentStatus =
  | 'unpaid'
  | 'payment_reported'
  | 'paid_confirmed'
  | 'partially_adjusted'
  | 'refund_pending'
  | 'refunded';

export interface OrderLineItem {
  id: string;
  product_id: string;
  product_name_snapshot: string;
  pack_size_snapshot: string;
  quantity: number;
  unit_price_paise_snapshot: number;
  proposed_unit_price_paise: number | null;
  tax_paise_snapshot: number;
  line_total_paise_snapshot: number;
}

export interface InvoiceRevisionItem {
  revision_number: number;
  previous_total_paise: number;
  new_total_paise: number;
  adjustment_reason: string;
  created_at: string;
}

export interface InvoiceRecord {
  id: string;
  invoice_number: string;
  seller_name_snapshot: string;
  seller_gstin_snapshot: string | null;
  subtotal_paise: number;
  tax_paise: number;
  delivery_fee_paise: number;
  total_paise: number;
  current_revision_number: number;
  status: 'issued' | 'revised' | 'void';
  revisions: InvoiceRevisionItem[];
}

export interface OrderRecord {
  id: string;
  shop_id: string;
  shop_name: string;
  buyer_id: string;
  buyer_name_snapshot: string;
  delivery_building_snapshot: string;
  delivery_unit_snapshot: string;
  delivery_phone_snapshot: string;
  delivery_instructions: string | null;
  idempotency_key: string;
  status: OrderStatus;
  payment_status: OrderPaymentStatus;
  payment_method: 'pay_on_delivery' | 'direct_upi' | 'counter_pickup';
  subtotal_paise: number;
  tax_paise: number;
  delivery_fee_paise: number;
  total_paise: number;
  proposed_total_paise: number | null;
  price_change_reason: string | null;
  substitution_note: string | null;
  delivery_estimate_text: string | null;
  created_at: string;
  prescription_attachment: {
    id: string;
    storage_bucket: string;
    storage_path: string;
    mime_type: string;
    pharmacist_verified_by: string | null;
  } | null;
  has_restricted_prescription: boolean;
  items: OrderLineItem[];
  invoice: InvoiceRecord | null;
}

export interface LedgerEntryRecord {
  id: string;
  shop_id: string;
  shop_name: string;
  order_id: string | null;
  entry_type: 'sale_debit' | 'payment_credit' | 'adjustment_credit' | 'refund_debit';
  amount_paise: number;
  payment_evidence_note: string | null;
  is_settled_verified: boolean;
  created_at: string;
}

export interface ServiceRecommendation {
  id: string;
  member_name: string;
  is_off_platform: boolean;
  work_summary: string;
  approx_month_year: string;
  endorsement_note: string;
}

export interface ServiceProviderItem {
  id: string;
  category_id: string;
  category_name: string;
  display_name: string;
  listing_mode: 'provider_managed' | 'member_recommended';
  description: string;
  service_area: string;
  availability_summary: string;
  indicative_pricing_text: string;
  contact_publication_consented: boolean;
  public_phone: string | null;
  verification_badge_scope: string;
  verified_rating_avg: number | null;
  verified_review_count: number;
  off_platform_recommendation_count: number;
  recommendations: ServiceRecommendation[];
}

export interface ServiceEnquiryItem {
  id: string;
  provider_id: string;
  provider_name: string;
  resident_id: string;
  resident_name: string;
  problem_description: string;
  preferred_schedule: string;
  quoted_price_paise: number | null;
  quote_notes: string | null;
  status: 'requested' | 'quoted' | 'accepted' | 'declined' | 'cancelled';
  created_at: string;
}

export interface ServiceBookingItem {
  id: string;
  provider_id: string;
  provider_name: string;
  resident_id: string;
  resident_name: string;
  agreed_price_paise: number;
  scheduled_for: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled' | 'no_show' | 'disputed';
  outcome_notes: string | null;
  completed_at: string | null;
}

export type ExchangeMode =
  | 'request'
  | 'giveaway'
  | 'sale'
  | 'borrow_request'
  | 'loan'
  | 'rental'
  | 'swap'
  | 'volunteer_help';

export type ExchangeAgreementStatus =
  | 'proposed'
  | 'agreed'
  | 'handover_pending'
  | 'handed_over'
  | 'active'
  | 'return_pending'
  | 'returned'
  | 'completed'
  | 'overdue'
  | 'disputed'
  | 'cancelled';

export interface ExchangeListingItem {
  id: string;
  owner_id: string;
  owner_name: string;
  owner_rating_avg: number | null;
  owner_review_count: number;
  direction: 'need' | 'offer';
  exchange_mode: ExchangeMode;
  title: string;
  description: string;
  category: string;
  item_condition: string;
  total_quantity: number;
  allocated_quantity: number;
  remaining_quantity: number;
  price_paise: number;
  deposit_paise: number;
  rental_rate_paise_per_day: number;
  available_from: string | null;
  available_until: string | null;
  event_date: string | null;
  handover_options: string;
  status: 'open' | 'partially_allocated' | 'fully_allocated' | 'completed' | 'expired' | 'cancelled';
  expires_at: string | null;
}

export interface ExchangeAgreementItem {
  id: string;
  listing_id: string;
  listing_title: string;
  owner_id: string;
  owner_name: string;
  counterparty_id: string;
  counterparty_name: string;
  exchange_mode: ExchangeMode;
  agreed_quantity: number;
  agreed_condition: string;
  agreed_price_paise: number;
  agreed_deposit_paise: number;
  payment_deposit_status: 'not_applicable' | 'pending' | 'reported' | 'confirmed' | 'returned';
  handover_location_label: string;
  handover_at: string | null;
  due_back_at: string | null;
  responsibility_terms: string | null;
  version: number;
  status: ExchangeAgreementStatus;
  handover_confirmed_by_owner_at: string | null;
  handover_confirmed_by_counterparty_at: string | null;
  condition_reports: Array<{
    stage: 'handover' | 'return';
    condition_summary: string;
    damage_reported: boolean;
    created_at: string;
  }>;
  extensions: Array<{
    id: string;
    requested_due_at: string;
    reason: string;
    status: 'pending' | 'approved' | 'declined';
  }>;
}

export interface ReviewEligibilityItem {
  id: string;
  interaction_type: 'exchange' | 'service_booking';
  exchange_agreement_id: string | null;
  service_booking_id: string | null;
  reviewer_id: string;
  reviewer_name: string;
  subject_user_id: string;
  subject_user_name: string;
  subject_provider_id: string | null;
  eligibility_reason: 'completed' | 'overdue_post_handover' | 'disputed_post_handover';
  window_ends_at: string;
  has_submitted: boolean;
}

export interface ReviewItem {
  id: string;
  eligibility_id: string;
  reviewer_id: string;
  reviewer_name: string;
  subject_user_id: string;
  subject_user_name: string;
  subject_provider_id: string | null;
  target_kind: 'member_exchange' | 'provider_service';
  overall_rating: number;
  written_feedback: string | null;
  counterparty_response: string | null;
  is_published: boolean;
  published_at: string | null;
  dimensions: Array<{ dimension_key: string; score: number }>;
}

export interface HelpRequestItem {
  id: string;
  requester_id: string;
  requester_name: string;
  category: string;
  title: string;
  description: string;
  approx_area: string;
  timing_needed: string;
  visibility_scope: 'community' | 'building' | 'admin_only';
  status: 'open' | 'responding' | 'arranged' | 'completed' | 'closed' | 'expired';
  linked_social_service_note: string | null;
  created_at: string;
}

export type ComplaintStatus =
  | 'submitted'
  | 'triaged'
  | 'assigned'
  | 'in_progress'
  | 'waiting_for_resident'
  | 'waiting_for_contractor'
  | 'externally_forwarded'
  | 'resolved'
  | 'closed'
  | 'reopened';

export interface ComplaintItem {
  id: string;
  case_reference: string;
  reporter_id: string;
  reporter_name: string;
  building_id: string | null;
  building_name: string | null;
  category: 'water' | 'electricity' | 'cleanliness' | 'security_facility' | 'roads' | 'drainage' | 'streetlights' | 'other_civic';
  title: string;
  description: string;
  location_detail: string;
  privacy_choice: 'private_to_admin' | 'shareable_redacted' | 'public_community_issue';
  consented_for_external_escalation: boolean;
  status: ComplaintStatus;
  assigned_admin_name: string | null;
  next_action: string | null;
  follow_up_date: string | null;
  shared_issue_id: string | null;
  created_at: string;
  events: Array<{
    from_status: string | null;
    to_status: string;
    note: string;
    created_at: string;
  }>;
}

export interface SharedIssueItem {
  id: string;
  title: string;
  category: string;
  public_summary: string;
  status: string;
  linked_cases_count: number;
  created_at: string;
}

export interface AuthorityContactItem {
  id: string;
  jurisdiction_name: string;
  department_category: string;
  office_title: string;
  submission_channel: string;
  contact_reference: string;
  source_url: string | null;
  last_verified_at: string;
}

export interface EscalationRecordItem {
  id: string;
  shared_issue_id: string | null;
  complaint_id: string | null;
  redacted_package_summary: string;
  consented_complaint_count: number;
  status: 'not_escalated' | 'package_prepared' | 'submitted' | 'acknowledged' | 'in_progress' | 'resolved' | 'rejected_or_unreachable';
  submission_mode: 'manual_docket_recorded' | 'demo_adapter' | 'configured_portal';
  official_docket_reference: string | null;
  acknowledgement_evidence_note: string | null;
  submitted_at: string | null;
}

export interface SOSIncidentItem {
  id: string;
  reporter_id: string;
  reporter_name: string;
  category: 'medical' | 'fire_smoke' | 'security_threat' | 'lift_entrapment' | 'urgent_hazard';
  building_name: string | null;
  manual_floor_label: string | null;
  manual_lift_or_area_label: string | null;
  approx_area_public_label: string;
  safe_guidance_public_text: string;
  restricted_responder_details: string | null;
  status: 'triggered' | 'responder_acknowledged' | 'on_site' | 'contained' | 'resolved' | 'cancelled_accidental';
  acknowledged_by_name: string | null;
  acknowledged_at: string | null;
  is_demo_simulation: boolean;
  created_at: string;
  deliveries: Array<{
    channel: 'in_app_responder' | 'in_app_community_sanitised' | 'sms_adapter' | 'whatsapp_adapter';
    delivery_status: 'queued' | 'provider_accepted' | 'delivered' | 'failed' | 'acknowledged';
    retry_count: number;
    failure_reason: string | null;
  }>;
}

export interface ActiveLocationItem {
  session_id: string;
  staff_user_id: string;
  staff_name: string;
  purpose: string;
  device_permission_state: 'granted' | 'denied' | 'unavailable' | 'demo_simulated';
  consent_given: boolean;
  is_active: boolean;
  approximate_zone_label: string;
  precision_granted: 'approximate' | 'precise';
  latitude: number | null;
  longitude: number | null;
  accuracy_meters: number | null;
  is_demo_simulated: boolean;
  updated_at: string;
  is_stale: boolean;
}

export interface CameraItem {
  id: string;
  camera_code: string;
  display_name: string;
  group_name: string;
  area_classification: string;
  common_area_label: string;
  privacy_designation: string;
  integration_type: 'demo_synthetic_adapter' | 'external_hls_gateway' | 'unconfigured_nvr';
  online_state: 'online_demo' | 'online_live' | 'offline' | 'unconfigured';
  recording_export_enabled: boolean;
  actor_has_live_grant: boolean;
}

export interface CameraAccessEventItem {
  id: string;
  camera_id: string;
  camera_code: string;
  viewer_id: string;
  viewer_name: string;
  permission_used: 'live' | 'playback' | 'export';
  session_token_id: string;
  session_expires_at: string;
  access_result: 'session_issued' | 'denied' | 'revoked_terminated';
  denial_reason: string | null;
  created_at: string;
}

export interface IntegrationSettingItem {
  adapter_key: string;
  display_name: string;
  status: 'configured' | 'demo' | 'unavailable';
  status_reason: string;
}

export interface NotificationItem {
  id: string;
  category: string;
  title: string;
  safe_preview_body: string;
  link_route: string;
  is_urgent: boolean;
  read_at: string | null;
  created_at: string;
}

export interface CommunityBootstrapState {
  access_denied: boolean;
  membership_status: MembershipStatus | 'unauthenticated';
  membership_reason?: string;
  community: {
    id: string;
    slug?: string;
    name: string;
    city: string;
    timezone?: string;
    total_members: number;
    approved_members?: number;
    pending_members?: number;
    suspended_members?: number;
  };
  buildings?: BuildingInfo[];
  actor: ActorContext;
  personas: PersonaOption[];
  directory?: DirectoryMember[];
  role_grants?: RoleGrant[];
  announcements?: AnnouncementItem[];
  events?: EventItem[];
  posts?: PostItem[];
  groups?: CommunityGroup[];
  shops?: ShopItem[];
  orders?: OrderRecord[];
  ledger_entries?: LedgerEntryRecord[];
  services?: {
    categories: Array<{ id: string; slug: string; name: string; description: string }>;
    providers: ServiceProviderItem[];
    enquiries: ServiceEnquiryItem[];
    bookings: ServiceBookingItem[];
  };
  social_service?: {
    listings: ExchangeListingItem[];
    agreements: ExchangeAgreementItem[];
  };
  reputation?: {
    eligibilities: ReviewEligibilityItem[];
    reviews: ReviewItem[];
  };
  help_and_cases?: {
    help_requests: HelpRequestItem[];
    complaints: ComplaintItem[];
    shared_issues: SharedIssueItem[];
    authority_contacts: AuthorityContactItem[];
    escalation_records: EscalationRecordItem[];
  };
  safety_and_sos?: {
    incidents: SOSIncidentItem[];
  };
  staff_and_locations?: {
    staff: StaffProfileSummary[];
    shifts: Array<{
      id: string;
      staff_user_id: string;
      staff_name: string;
      shift_name: string;
      assigned_post_label: string;
      starts_at: string;
      ends_at: string;
      status: string;
      checked_in_at: string | null;
    }>;
    tasks: Array<{
      id: string;
      staff_user_id: string;
      title: string;
      area_label: string;
      status: string;
    }>;
    checkpoints: Array<{
      id: string;
      checkpoint_code: string;
      location_name: string;
      last_checked_at: string | null;
    }>;
    active_locations: ActiveLocationItem[];
    location_grants: Array<{
      id: string;
      subject_staff_name: string;
      viewer_role: string;
      viewer_user_id: string | null;
      purpose: string;
      precision_level: 'approximate' | 'precise';
      allow_history: boolean;
      valid_until: string;
    }>;
  };
  cctv?: {
    cameras: CameraItem[];
    grants: Array<{
      id: string;
      camera_id: string;
      camera_code: string;
      grantee_user_id: string;
      grantee_name: string;
      grantee_role_scope: string;
      permission_type: 'live' | 'playback' | 'export';
      purpose: string;
      expires_at: string;
    }>;
    access_events: CameraAccessEventItem[];
  };
  integration_settings?: IntegrationSettingItem[];
  notifications?: NotificationItem[];
}
