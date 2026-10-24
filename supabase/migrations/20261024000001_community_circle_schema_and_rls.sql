-- ============================================================================
-- CommunityCircle v1.0 — Authoritative Database Schema, Constraints & RLS
-- Target: Supabase PostgreSQL 17 (Project: mycircle / runquwuetzfivhwefenk)
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Unexposed private schema for SECURITY DEFINER RLS helper functions
CREATE SCHEMA IF NOT EXISTS private;
REVOKE ALL ON SCHEMA private FROM PUBLIC;
GRANT USAGE ON SCHEMA private TO authenticated, service_role;

-- ============================================================================
-- 1. IDENTITY, BUILDINGS, PROFILES, VISIBILITY, MEMBERSHIPS & SCOPED ROLES
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.communities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  city TEXT NOT NULL DEFAULT 'Mumbai',
  timezone TEXT NOT NULL DEFAULT 'Asia/Kolkata',
  currency_code TEXT NOT NULL DEFAULT 'INR',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.buildings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id UUID NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  floors_count INT NOT NULL DEFAULT 15,
  units_count INT NOT NULL DEFAULT 180,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (community_id, code)
);

CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY,
  community_id UUID NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  avatar_url TEXT,
  bio TEXT,
  interests TEXT[] NOT NULL DEFAULT '{}',
  profession TEXT,
  skills TEXT[] NOT NULL DEFAULT '{}',
  member_rating_avg NUMERIC(3,2),
  member_review_count INT NOT NULL DEFAULT 0,
  completed_interactions_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.private_contacts (
  user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  community_id UUID NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
  building_id UUID REFERENCES public.buildings(id),
  unit_number TEXT NOT NULL,
  personal_phone TEXT NOT NULL,
  alternate_email TEXT,
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  residency_type TEXT NOT NULL DEFAULT 'owner_resident' CHECK (residency_type IN ('owner_resident', 'tenant_resident', 'family_member')),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.profile_visibility (
  user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  community_id UUID NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
  show_building BOOLEAN NOT NULL DEFAULT true,
  show_unit BOOLEAN NOT NULL DEFAULT false,
  show_phone BOOLEAN NOT NULL DEFAULT false,
  show_profession BOOLEAN NOT NULL DEFAULT true,
  show_business BOOLEAN NOT NULL DEFAULT true,
  allow_direct_messages BOOLEAN NOT NULL DEFAULT true,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.professional_profiles (
  user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  community_id UUID NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
  headline TEXT NOT NULL,
  years_experience INT NOT NULL DEFAULT 0,
  qualifications TEXT,
  available_for_consultation BOOLEAN NOT NULL DEFAULT true,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.business_profiles (
  user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  community_id UUID NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
  business_name TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT NOT NULL,
  services_offered TEXT[] NOT NULL DEFAULT '{}',
  website_url TEXT,
  contact_channel TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  community_id UUID NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
  building_id UUID REFERENCES public.buildings(id),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'suspended', 'revoked', 'exit_requested')),
  status_reason TEXT,
  approved_by UUID REFERENCES public.profiles(id),
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, community_id)
);

CREATE TABLE IF NOT EXISTS public.role_grants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id UUID NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role_type TEXT NOT NULL CHECK (role_type IN ('primary_admin', 'sub_admin')),
  module_scope TEXT NOT NULL CHECK (module_scope IN (
    'all', 'membership', 'moderation', 'events', 'water',
    'electricity', 'cleanliness', 'civic_escalation', 'commerce_support',
    'local_services', 'safety'
  )),
  building_scope_id UUID REFERENCES public.buildings(id),
  allowed_actions TEXT[] NOT NULL DEFAULT '{}',
  title_label TEXT NOT NULL,
  granted_by UUID REFERENCES public.profiles(id),
  expires_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.user_blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id UUID NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
  blocker_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  blocked_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (blocker_id, blocked_id),
  CHECK (blocker_id <> blocked_id)
);

-- ============================================================================
-- 2. SOCIAL INTERACTION, GROUPS, CONVERSATIONS, ANNOUNCEMENTS & EVENTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id UUID NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  building_id UUID REFERENCES public.buildings(id),
  category TEXT NOT NULL CHECK (category IN ('general', 'celebrations', 'lost_and_found', 'recommendations', 'help', 'local_info')),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  media_urls TEXT[] NOT NULL DEFAULT '{}',
  is_hidden_by_moderation BOOLEAN NOT NULL DEFAULT false,
  moderation_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id UUID NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.saved_posts (
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, post_id)
);

CREATE TABLE IF NOT EXISTS public.groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id UUID NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
  building_id UUID REFERENCES public.buildings(id),
  name TEXT NOT NULL,
  group_type TEXT NOT NULL CHECK (group_type IN ('building', 'interest')),
  moderation_policy TEXT NOT NULL,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.group_memberships (
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('member', 'moderator')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'pending', 'removed')),
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (group_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id UUID NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
  context_type TEXT NOT NULL CHECK (context_type IN ('direct', 'order', 'exchange', 'service_enquiry', 'help_request')),
  context_id UUID,
  request_status TEXT NOT NULL DEFAULT 'active' CHECK (request_status IN ('active', 'message_request', 'blocked')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.conversation_members (
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (conversation_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.moderation_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id UUID NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
  reporter_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  target_type TEXT NOT NULL CHECK (target_type IN ('post', 'comment', 'message', 'review', 'member')),
  target_id UUID NOT NULL,
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'reviewed_action_taken', 'dismissed', 'appealed')),
  moderator_id UUID REFERENCES public.profiles(id),
  resolution_notes TEXT,
  appeal_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id UUID NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES public.profiles(id),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('utility', 'maintenance', 'governance', 'emergency_followup', 'community')),
  audience_type TEXT NOT NULL DEFAULT 'all_members' CHECK (audience_type IN ('all_members', 'building', 'segment')),
  target_building_id UUID REFERENCES public.buildings(id),
  is_pinned BOOLEAN NOT NULL DEFAULT false,
  requires_acknowledgement BOOLEAN NOT NULL DEFAULT false,
  published_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.audience_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  announcement_id UUID NOT NULL REFERENCES public.announcements(id) ON DELETE CASCADE,
  building_id UUID REFERENCES public.buildings(id),
  role_filter TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.acknowledgements (
  announcement_id UUID NOT NULL REFERENCES public.announcements(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  acknowledged_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (announcement_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id UUID NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
  organiser_id UUID NOT NULL REFERENCES public.profiles(id),
  building_id UUID REFERENCES public.buildings(id),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  location_label TEXT NOT NULL,
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL,
  capacity INT NOT NULL DEFAULT 100,
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'updated', 'cancelled', 'completed')),
  cancellation_reason TEXT,
  linked_exchange_listing_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.event_rsvps (
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'going' CHECK (status IN ('going', 'interested', 'cancelled_by_user', 'event_cancelled')),
  guests_count INT NOT NULL DEFAULT 1 CHECK (guests_count >= 1),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (event_id, user_id)
);

-- ============================================================================
-- 3. COMMERCE, SHOPS, ORDERS, INVOICES & VENDOR LEDGER
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.shops (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id UUID NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL REFERENCES public.profiles(id),
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('grocery', 'dairy_bakery', 'pharmacy', 'stationery_general', 'laundry_water')),
  description TEXT NOT NULL,
  unit_location TEXT NOT NULL,
  operating_hours TEXT NOT NULL,
  service_windows TEXT[] NOT NULL DEFAULT '{}',
  delivery_available BOOLEAN NOT NULL DEFAULT true,
  min_order_paise BIGINT NOT NULL DEFAULT 0 CHECK (min_order_paise >= 0),
  delivery_fee_paise BIGINT NOT NULL DEFAULT 0 CHECK (delivery_fee_paise >= 0),
  is_pharmacy_gated BOOLEAN NOT NULL DEFAULT false,
  gstin_number TEXT,
  approval_status TEXT NOT NULL DEFAULT 'pending' CHECK (approval_status IN ('pending', 'approved', 'suspended')),
  approved_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.shop_memberships (
  shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('owner', 'manager', 'cashier', 'delivery', 'pharmacist')),
  can_review_prescriptions BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (shop_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
  community_id UUID NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  pack_size TEXT NOT NULL,
  unit_label TEXT NOT NULL DEFAULT 'pack',
  price_paise BIGINT NOT NULL CHECK (price_paise >= 0),
  tax_rate_bps INT NOT NULL DEFAULT 0 CHECK (tax_rate_bps >= 0),
  stock_quantity INT NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0),
  track_inventory BOOLEAN NOT NULL DEFAULT true,
  requires_prescription BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id UUID NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
  shop_id UUID NOT NULL REFERENCES public.shops(id),
  buyer_id UUID NOT NULL REFERENCES public.profiles(id),
  idempotency_key TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'submitted' CHECK (status IN (
    'submitted', 'awaiting_buyer_approval', 'accepted', 'preparing',
    'out_for_delivery', 'delivered', 'rejected', 'cancelled', 'disputed'
  )),
  payment_status TEXT NOT NULL DEFAULT 'unpaid' CHECK (payment_status IN (
    'unpaid', 'payment_reported', 'paid_confirmed', 'refund_pending', 'adjusted'
  )),
  payment_method TEXT NOT NULL DEFAULT 'pay_on_delivery' CHECK (payment_method IN ('pay_on_delivery', 'direct_upi')),
  subtotal_paise BIGINT NOT NULL CHECK (subtotal_paise >= 0),
  tax_paise BIGINT NOT NULL DEFAULT 0 CHECK (tax_paise >= 0),
  delivery_fee_paise BIGINT NOT NULL DEFAULT 0 CHECK (delivery_fee_paise >= 0),
  total_paise BIGINT NOT NULL CHECK (total_paise >= 0),
  proposed_total_paise BIGINT,
  price_change_reason TEXT,
  substitution_note TEXT,
  delivery_estimate_text TEXT,
  cancellation_reason TEXT,
  buyer_name_snapshot TEXT NOT NULL,
  delivery_building_snapshot TEXT NOT NULL,
  delivery_unit_snapshot TEXT NOT NULL,
  delivery_phone_snapshot TEXT NOT NULL,
  delivery_instructions TEXT,
  prescription_attachment_id UUID,
  pharmacist_verified_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (buyer_id, idempotency_key)
);

CREATE TABLE IF NOT EXISTS public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id),
  product_name_snapshot TEXT NOT NULL,
  pack_size_snapshot TEXT NOT NULL,
  quantity INT NOT NULL CHECK (quantity > 0),
  unit_price_paise_snapshot BIGINT NOT NULL CHECK (unit_price_paise_snapshot >= 0),
  proposed_unit_price_paise BIGINT,
  tax_paise_snapshot BIGINT NOT NULL DEFAULT 0,
  line_total_paise_snapshot BIGINT NOT NULL CHECK (line_total_paise_snapshot >= 0)
);

CREATE TABLE IF NOT EXISTS public.order_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  actor_id UUID REFERENCES public.profiles(id),
  from_status TEXT,
  to_status TEXT NOT NULL,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id UUID NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
  order_id UUID NOT NULL UNIQUE REFERENCES public.orders(id) ON DELETE CASCADE,
  shop_id UUID NOT NULL REFERENCES public.shops(id),
  buyer_id UUID NOT NULL REFERENCES public.profiles(id),
  invoice_number TEXT NOT NULL UNIQUE,
  seller_name_snapshot TEXT NOT NULL,
  seller_gstin_snapshot TEXT,
  subtotal_paise BIGINT NOT NULL,
  tax_paise BIGINT NOT NULL,
  delivery_fee_paise BIGINT NOT NULL,
  total_paise BIGINT NOT NULL,
  current_revision_number INT NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'issued' CHECK (status IN ('issued', 'revised', 'credit_note_adjusted')),
  issued_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.invoice_revisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  revision_number INT NOT NULL,
  previous_total_paise BIGINT NOT NULL,
  new_total_paise BIGINT NOT NULL,
  adjustment_reason TEXT NOT NULL,
  revised_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.ledger_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id UUID NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
  shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
  order_id UUID REFERENCES public.orders(id),
  invoice_id UUID REFERENCES public.invoices(id),
  entry_type TEXT NOT NULL CHECK (entry_type IN ('sale_debit', 'payment_credit', 'adjustment_credit', 'adjustment_debit')),
  amount_paise BIGINT NOT NULL CHECK (amount_paise >= 0),
  payment_evidence_note TEXT,
  is_settled_verified BOOLEAN NOT NULL DEFAULT false,
  recorded_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================================
-- 4. LOCAL SERVICES, RECOMMENDATIONS, ENQUIRIES & BOOKINGS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.service_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id UUID NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
  slug TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (community_id, slug)
);

CREATE TABLE IF NOT EXISTS public.providers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id UUID NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES public.service_categories(id),
  managed_by_user_id UUID REFERENCES public.profiles(id),
  recommended_by_member_id UUID REFERENCES public.profiles(id),
  display_name TEXT NOT NULL,
  listing_mode TEXT NOT NULL CHECK (listing_mode IN ('provider_managed', 'member_recommended')),
  description TEXT NOT NULL,
  service_area TEXT NOT NULL,
  availability_summary TEXT NOT NULL,
  indicative_pricing_text TEXT,
  contact_publication_consented BOOLEAN NOT NULL DEFAULT false,
  public_phone TEXT,
  verification_badge_scope TEXT NOT NULL DEFAULT 'Identity & community entry logged; not a trade skill certification',
  verified_rating_avg NUMERIC(3,2),
  verified_review_count INT NOT NULL DEFAULT 0,
  off_platform_recommendation_count INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.provider_memberships (
  provider_id UUID NOT NULL REFERENCES public.providers(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'primary' CHECK (role IN ('primary', 'assistant')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (provider_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id UUID NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
  provider_id UUID NOT NULL REFERENCES public.providers(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  is_off_platform BOOLEAN NOT NULL DEFAULT true,
  work_summary TEXT NOT NULL,
  approx_month_year TEXT,
  endorsement_note TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.service_enquiries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id UUID NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
  provider_id UUID NOT NULL REFERENCES public.providers(id) ON DELETE CASCADE,
  resident_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  problem_description TEXT NOT NULL,
  preferred_schedule TEXT,
  quoted_price_paise BIGINT CHECK (quoted_price_paise >= 0),
  quote_notes TEXT,
  status TEXT NOT NULL DEFAULT 'enquired' CHECK (status IN ('enquired', 'quoted', 'accepted', 'declined', 'cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.service_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id UUID NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
  enquiry_id UUID NOT NULL UNIQUE REFERENCES public.service_enquiries(id) ON DELETE CASCADE,
  provider_id UUID NOT NULL REFERENCES public.providers(id),
  resident_id UUID NOT NULL REFERENCES public.profiles(id),
  agreed_price_paise BIGINT NOT NULL CHECK (agreed_price_paise >= 0),
  scheduled_for TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled', 'disputed')),
  outcome_notes TEXT,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================================
-- 5. SOCIAL SERVICE EXCHANGES & TRANSACTION-LINKED REPUTATION
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.exchange_listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id UUID NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  direction TEXT NOT NULL CHECK (direction IN ('need', 'offer')),
  exchange_mode TEXT NOT NULL CHECK (exchange_mode IN ('request', 'giveaway', 'sale', 'loan', 'rental', 'swap', 'volunteer_help')),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  item_condition TEXT NOT NULL DEFAULT 'good' CHECK (item_condition IN ('new', 'like_new', 'good', 'fair', 'not_applicable')),
  total_quantity INT NOT NULL DEFAULT 1 CHECK (total_quantity > 0),
  allocated_quantity INT NOT NULL DEFAULT 0 CHECK (allocated_quantity >= 0 AND allocated_quantity <= total_quantity),
  price_paise BIGINT NOT NULL DEFAULT 0 CHECK (price_paise >= 0),
  deposit_paise BIGINT NOT NULL DEFAULT 0 CHECK (deposit_paise >= 0),
  rental_rate_paise_per_day BIGINT NOT NULL DEFAULT 0 CHECK (rental_rate_paise_per_day >= 0),
  available_from DATE,
  available_until DATE,
  event_date DATE,
  handover_options TEXT NOT NULL DEFAULT 'Tower lobby handover',
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'partially_allocated', 'fully_allocated', 'completed', 'expired', 'withdrawn', 'policy_removed')),
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.listing_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL REFERENCES public.exchange_listings(id) ON DELETE CASCADE,
  respondent_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  requested_quantity INT NOT NULL DEFAULT 1 CHECK (requested_quantity > 0),
  message TEXT NOT NULL,
  proposed_terms TEXT,
  status TEXT NOT NULL DEFAULT 'proposed' CHECK (status IN ('proposed', 'waitlisted', 'accepted', 'rejected', 'withdrawn')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.exchange_agreements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id UUID NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
  listing_id UUID NOT NULL REFERENCES public.exchange_listings(id) ON DELETE CASCADE,
  response_id UUID REFERENCES public.listing_responses(id),
  owner_id UUID NOT NULL REFERENCES public.profiles(id),
  counterparty_id UUID NOT NULL REFERENCES public.profiles(id),
  exchange_mode TEXT NOT NULL,
  agreed_quantity INT NOT NULL CHECK (agreed_quantity > 0),
  agreed_condition TEXT NOT NULL,
  agreed_price_paise BIGINT NOT NULL DEFAULT 0,
  agreed_deposit_paise BIGINT NOT NULL DEFAULT 0,
  payment_deposit_status TEXT NOT NULL DEFAULT 'not_applicable' CHECK (payment_deposit_status IN ('not_applicable', 'agreed', 'reported', 'confirmed')),
  handover_location_label TEXT NOT NULL,
  handover_at TIMESTAMPTZ,
  due_back_at TIMESTAMPTZ,
  responsibility_terms TEXT NOT NULL,
  version INT NOT NULL DEFAULT 1,
  terms_snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
  owner_confirmed_at TIMESTAMPTZ,
  counterparty_confirmed_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'proposed' CHECK (status IN (
    'proposed', 'accepted', 'handover_pending', 'active',
    'return_pending', 'completed', 'rejected', 'cancelled', 'overdue', 'disputed'
  )),
  handover_confirmed_by_owner_at TIMESTAMPTZ,
  handover_confirmed_by_counterparty_at TIMESTAMPTZ,
  return_initiated_at TIMESTAMPTZ,
  return_confirmed_at TIMESTAMPTZ,
  dispute_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (owner_id <> counterparty_id)
);

CREATE TABLE IF NOT EXISTS public.exchange_participants (
  agreement_id UUID NOT NULL REFERENCES public.exchange_agreements(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  participant_role TEXT NOT NULL CHECK (participant_role IN ('owner', 'counterparty')),
  handover_confirmed BOOLEAN NOT NULL DEFAULT false,
  return_confirmed BOOLEAN NOT NULL DEFAULT false,
  PRIMARY KEY (agreement_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.exchange_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agreement_id UUID NOT NULL REFERENCES public.exchange_agreements(id) ON DELETE CASCADE,
  actor_id UUID REFERENCES public.profiles(id),
  event_type TEXT NOT NULL,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.condition_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agreement_id UUID NOT NULL REFERENCES public.exchange_agreements(id) ON DELETE CASCADE,
  recorded_by UUID NOT NULL REFERENCES public.profiles(id),
  stage TEXT NOT NULL CHECK (stage IN ('handover', 'return', 'dispute')),
  condition_summary TEXT NOT NULL,
  photo_urls TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.return_extensions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agreement_id UUID NOT NULL REFERENCES public.exchange_agreements(id) ON DELETE CASCADE,
  requested_by UUID NOT NULL REFERENCES public.profiles(id),
  requested_due_at TIMESTAMPTZ NOT NULL,
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'declined')),
  responded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================================
-- 6. ASSISTANCE REQUESTS, COMPLAINTS, SHARED ISSUES & CIVIC ESCALATION
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.help_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id UUID NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
  requester_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  category TEXT NOT NULL CHECK (category IN ('domestic_staff_search', 'local_professional', 'lost_item', 'parcel_help', 'everyday_assistance')),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  approx_area TEXT NOT NULL,
  timing_needed TEXT NOT NULL,
  visibility_scope TEXT NOT NULL DEFAULT 'community' CHECK (visibility_scope IN ('community', 'admin_only')),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'responding', 'arranged', 'completed', 'closed', 'withdrawn', 'expired')),
  helper_user_id UUID REFERENCES public.profiles(id),
  linked_social_service_note TEXT,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.request_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  help_request_id UUID NOT NULL REFERENCES public.help_requests(id) ON DELETE CASCADE,
  responder_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  recommended_provider_id UUID REFERENCES public.providers(id),
  is_marked_helpful BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Review tables reference exchange_agreements, service_bookings, help_requests, orders
CREATE TABLE IF NOT EXISTS public.review_eligibility (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id UUID NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
  interaction_type TEXT NOT NULL CHECK (interaction_type IN ('exchange', 'service_booking', 'help_request', 'shop_order')),
  exchange_agreement_id UUID REFERENCES public.exchange_agreements(id) ON DELETE CASCADE,
  service_booking_id UUID REFERENCES public.service_bookings(id) ON DELETE CASCADE,
  help_request_id UUID REFERENCES public.help_requests(id) ON DELETE CASCADE,
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
  reviewer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  subject_user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  subject_provider_id UUID REFERENCES public.providers(id) ON DELETE CASCADE,
  eligibility_reason TEXT NOT NULL CHECK (eligibility_reason IN ('completed', 'post_handover_overdue', 'post_handover_dispute', 'verified_no_show')),
  window_opens_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  window_ends_at TIMESTAMPTZ NOT NULL,
  counterparty_eligibility_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (reviewer_id IS DISTINCT FROM subject_user_id),
  CHECK (num_nonnulls(exchange_agreement_id, service_booking_id, help_request_id, order_id) = 1)
);

CREATE TABLE IF NOT EXISTS public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id UUID NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
  eligibility_id UUID NOT NULL UNIQUE REFERENCES public.review_eligibility(id) ON DELETE CASCADE,
  reviewer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  subject_user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  subject_provider_id UUID REFERENCES public.providers(id) ON DELETE CASCADE,
  target_kind TEXT NOT NULL CHECK (target_kind IN ('member_exchange', 'provider_service')),
  overall_rating INT NOT NULL CHECK (overall_rating BETWEEN 1 AND 5),
  written_feedback TEXT NOT NULL,
  is_published BOOLEAN NOT NULL DEFAULT false,
  published_at TIMESTAMPTZ,
  is_flagged_suspicious BOOLEAN NOT NULL DEFAULT false,
  flag_reason TEXT,
  moderation_status TEXT NOT NULL DEFAULT 'active' CHECK (moderation_status IN ('active', 'redacted', 'removed_policy_violation')),
  moderation_reason TEXT,
  edit_version INT NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (reviewer_id IS DISTINCT FROM subject_user_id)
);

CREATE TABLE IF NOT EXISTS public.review_dimensions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id UUID NOT NULL REFERENCES public.reviews(id) ON DELETE CASCADE,
  dimension_key TEXT NOT NULL CHECK (dimension_key IN (
    'communication', 'reliability', 'terms_fulfilment', 'timeliness',
    'care_return_condition', 'quality', 'punctuality', 'price_adherence'
  )),
  score INT NOT NULL CHECK (score BETWEEN 1 AND 5),
  UNIQUE (review_id, dimension_key)
);

CREATE TABLE IF NOT EXISTS public.review_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id UUID NOT NULL UNIQUE REFERENCES public.reviews(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  response_body TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.review_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id UUID NOT NULL REFERENCES public.reviews(id) ON DELETE CASCADE,
  reporter_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'upheld_redacted', 'rejected')),
  moderator_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.shared_issues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id UUID NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  public_summary TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'in_progress',
  linked_cases_count INT NOT NULL DEFAULT 1,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.complaints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id UUID NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
  case_reference TEXT NOT NULL UNIQUE,
  reporter_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  building_id UUID REFERENCES public.buildings(id),
  category TEXT NOT NULL CHECK (category IN ('water', 'electricity', 'waste', 'cleanliness', 'drainage', 'roads', 'building_maintenance', 'other')),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  location_detail TEXT NOT NULL,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  privacy_choice TEXT NOT NULL DEFAULT 'private_to_admin' CHECK (privacy_choice IN ('private_to_admin', 'shareable_redacted')),
  consented_for_external_escalation BOOLEAN NOT NULL DEFAULT false,
  status TEXT NOT NULL DEFAULT 'submitted' CHECK (status IN (
    'submitted', 'needs_information', 'triaged', 'assigned', 'in_progress',
    'resolution_proposed', 'resolved', 'rejected', 'externally_forwarded',
    'awaiting_external_response', 'reopened'
  )),
  rejection_or_closure_reason TEXT,
  assigned_admin_id UUID REFERENCES public.profiles(id),
  next_action TEXT,
  follow_up_date DATE,
  shared_issue_id UUID REFERENCES public.shared_issues(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.complaint_issue_links (
  complaint_id UUID NOT NULL REFERENCES public.complaints(id) ON DELETE CASCADE,
  shared_issue_id UUID NOT NULL REFERENCES public.shared_issues(id) ON DELETE CASCADE,
  resident_consented BOOLEAN NOT NULL DEFAULT true,
  linked_by UUID REFERENCES public.profiles(id),
  linked_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (complaint_id, shared_issue_id)
);

CREATE TABLE IF NOT EXISTS public.case_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  complaint_id UUID NOT NULL REFERENCES public.complaints(id) ON DELETE CASCADE,
  actor_id UUID REFERENCES public.profiles(id),
  from_status TEXT,
  to_status TEXT NOT NULL,
  note TEXT NOT NULL,
  is_internal_only BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.authority_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id UUID NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
  jurisdiction_name TEXT NOT NULL,
  department_category TEXT NOT NULL,
  office_title TEXT NOT NULL,
  submission_channel TEXT NOT NULL,
  contact_reference TEXT NOT NULL,
  source_url TEXT,
  last_verified_at DATE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.escalation_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id UUID NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
  shared_issue_id UUID REFERENCES public.shared_issues(id),
  complaint_id UUID REFERENCES public.complaints(id),
  authority_contact_id UUID NOT NULL REFERENCES public.authority_contacts(id),
  redacted_package_summary TEXT NOT NULL,
  consented_complaint_count INT NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'prepared' CHECK (status IN ('prepared', 'submitted', 'acknowledged', 'resolved')),
  submission_mode TEXT NOT NULL DEFAULT 'manual_docket_recorded' CHECK (submission_mode IN ('manual_docket_recorded', 'demo_simulated_portal')),
  official_docket_reference TEXT,
  acknowledgement_evidence_note TEXT,
  prepared_by UUID REFERENCES public.profiles(id),
  submitted_at TIMESTAMPTZ,
  acknowledged_at TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================================
-- 7. SAFETY (SOS), STAFF SHIFTS, CONSENTED LOCATION & COMMON-AREA CCTV
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.incidents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id UUID NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
  reporter_id UUID NOT NULL REFERENCES public.profiles(id),
  category TEXT NOT NULL CHECK (category IN ('lift_entrapment', 'fire_smoke', 'accident_injury', 'suspected_theft_security', 'other_urgent')),
  building_id UUID REFERENCES public.buildings(id),
  manual_floor_label TEXT,
  manual_lift_or_area_label TEXT,
  approx_area_public_label TEXT NOT NULL,
  safe_guidance_public_text TEXT NOT NULL,
  restricted_responder_details TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'raised' CHECK (status IN (
    'raised', 'responder_acknowledged', 'responder_en_route',
    'assistance_arrived', 'resolved', 'accidental_cancelled'
  )),
  acknowledged_by_user_id UUID REFERENCES public.profiles(id),
  acknowledged_at TIMESTAMPTZ,
  arrived_at TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ,
  cancellation_correction_note TEXT,
  is_demo_simulation BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.incident_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id UUID NOT NULL REFERENCES public.incidents(id) ON DELETE CASCADE,
  actor_id UUID REFERENCES public.profiles(id),
  event_type TEXT NOT NULL,
  note TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.incident_responders (
  incident_id UUID NOT NULL REFERENCES public.incidents(id) ON DELETE CASCADE,
  responder_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  assignment_status TEXT NOT NULL DEFAULT 'notified' CHECK (assignment_status IN ('notified', 'acknowledged', 'en_route', 'on_scene')),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (incident_id, responder_user_id)
);

CREATE TABLE IF NOT EXISTS public.incident_alert_deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id UUID NOT NULL REFERENCES public.incidents(id) ON DELETE CASCADE,
  channel TEXT NOT NULL CHECK (channel IN ('in_app_responder', 'in_app_community_sanitised', 'sms_adapter', 'push_adapter')),
  delivery_status TEXT NOT NULL CHECK (delivery_status IN ('queued', 'provider_accepted', 'failed', 'acknowledged')),
  retry_count INT NOT NULL DEFAULT 0,
  failure_reason TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.staff_profiles (
  user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  community_id UUID NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
  staff_code TEXT NOT NULL UNIQUE,
  employer_team TEXT NOT NULL,
  role_title TEXT NOT NULL CHECK (role_title IN ('security_guard', 'head_guard', 'facility_supervisor', 'electrician_staff', 'housekeeping_lead')),
  assigned_building_id UUID REFERENCES public.buildings(id),
  assigned_post_label TEXT NOT NULL,
  is_active_responder BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.shifts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id UUID NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
  staff_user_id UUID NOT NULL REFERENCES public.staff_profiles(user_id) ON DELETE CASCADE,
  shift_name TEXT NOT NULL,
  assigned_post_label TEXT NOT NULL,
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'on_duty', 'completed', 'missed')),
  checked_in_at TIMESTAMPTZ,
  checked_out_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shift_id UUID NOT NULL REFERENCES public.shifts(id) ON DELETE CASCADE,
  staff_user_id UUID NOT NULL REFERENCES public.staff_profiles(user_id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN ('check_in', 'check_out')),
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  verification_note TEXT
);

CREATE TABLE IF NOT EXISTS public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id UUID NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
  shift_id UUID REFERENCES public.shifts(id) ON DELETE SET NULL,
  staff_user_id UUID NOT NULL REFERENCES public.staff_profiles(user_id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  area_label TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed')),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.patrol_checkpoints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id UUID NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
  building_id UUID REFERENCES public.buildings(id),
  checkpoint_code TEXT NOT NULL,
  location_name TEXT NOT NULL,
  last_checked_by UUID REFERENCES public.staff_profiles(user_id),
  last_checked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.location_sharing_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id UUID NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
  staff_user_id UUID NOT NULL REFERENCES public.staff_profiles(user_id) ON DELETE CASCADE,
  shift_id UUID NOT NULL REFERENCES public.shifts(id) ON DELETE CASCADE,
  purpose TEXT NOT NULL,
  device_permission_state TEXT NOT NULL DEFAULT 'granted' CHECK (device_permission_state IN ('granted', 'denied', 'demo_simulated')),
  consent_given BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at TIMESTAMPTZ,
  termination_reason TEXT
);

CREATE TABLE IF NOT EXISTS public.current_locations (
  session_id UUID PRIMARY KEY REFERENCES public.location_sharing_sessions(id) ON DELETE CASCADE,
  community_id UUID NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
  staff_user_id UUID NOT NULL UNIQUE REFERENCES public.staff_profiles(user_id) ON DELETE CASCADE,
  approximate_zone_label TEXT NOT NULL,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  accuracy_meters DOUBLE PRECISION,
  is_demo_simulated BOOLEAN NOT NULL DEFAULT false,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.location_grants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id UUID NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
  subject_staff_user_id UUID REFERENCES public.staff_profiles(user_id) ON DELETE CASCADE,
  viewer_role TEXT NOT NULL,
  viewer_user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  purpose TEXT NOT NULL,
  precision_level TEXT NOT NULL DEFAULT 'approximate' CHECK (precision_level IN ('approximate', 'precise')),
  allow_history BOOLEAN NOT NULL DEFAULT false,
  granted_by UUID REFERENCES public.profiles(id),
  valid_until TIMESTAMPTZ NOT NULL,
  revoked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.optional_location_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.location_sharing_sessions(id) ON DELETE CASCADE,
  staff_user_id UUID NOT NULL REFERENCES public.staff_profiles(user_id) ON DELETE CASCADE,
  approximate_zone_label TEXT NOT NULL,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS public.camera_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id UUID NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  area_classification TEXT NOT NULL CHECK (area_classification IN ('perimeter_gate', 'building_lobby', 'common_courtyard', 'parking_deck')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.cameras (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id UUID NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
  group_id UUID NOT NULL REFERENCES public.camera_groups(id) ON DELETE CASCADE,
  building_id UUID REFERENCES public.buildings(id),
  camera_code TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  common_area_label TEXT NOT NULL,
  privacy_designation TEXT NOT NULL DEFAULT 'common_area_only_no_private_units',
  integration_type TEXT NOT NULL DEFAULT 'demo_synthetic_adapter' CHECK (integration_type IN ('demo_synthetic_adapter', 'external_webrtc_gateway', 'unconfigured_nvr')),
  online_state TEXT NOT NULL DEFAULT 'online_demo' CHECK (online_state IN ('online_demo', 'online_live', 'offline', 'unconfigured')),
  recording_export_enabled BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.camera_secrets (
  camera_id UUID PRIMARY KEY REFERENCES public.cameras(id) ON DELETE CASCADE,
  internal_gateway_host TEXT NOT NULL,
  encrypted_credential_ref TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.camera_grants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id UUID NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
  camera_id UUID NOT NULL REFERENCES public.cameras(id) ON DELETE CASCADE,
  grantee_user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  grantee_role_scope TEXT,
  permission_type TEXT NOT NULL CHECK (permission_type IN ('live', 'playback', 'export')),
  purpose TEXT NOT NULL,
  granted_by UUID REFERENCES public.profiles(id),
  expires_at TIMESTAMPTZ NOT NULL,
  revoked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.camera_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id UUID NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
  camera_id UUID NOT NULL REFERENCES public.cameras(id) ON DELETE CASCADE,
  grant_id UUID REFERENCES public.camera_grants(id) ON DELETE SET NULL,
  viewer_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  permission_type TEXT NOT NULL CHECK (permission_type IN ('live', 'playback')),
  scoped_token_hash TEXT NOT NULL,
  adapter_mode TEXT NOT NULL DEFAULT 'demo_synthetic' CHECK (adapter_mode IN ('demo_synthetic', 'live_gateway')),
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL,
  revoked_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.camera_access_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id UUID NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
  camera_id UUID NOT NULL REFERENCES public.cameras(id) ON DELETE CASCADE,
  session_id UUID REFERENCES public.camera_sessions(id) ON DELETE SET NULL,
  actor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  action TEXT NOT NULL CHECK (action IN ('session_requested', 'session_issued', 'session_denied', 'session_revoked', 'export_blocked')),
  reason_or_note TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================================
-- 8. OPERATIONS: ATTACHMENTS, CONSENTS, AUDIT, NOTIFICATIONS & OUTBOX
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id UUID NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  parent_type TEXT NOT NULL CHECK (parent_type IN ('order_prescription', 'complaint_evidence', 'exchange_condition', 'post_photo', 'incident_photo')),
  parent_id UUID NOT NULL,
  classification TEXT NOT NULL CHECK (classification IN ('prescription', 'confidential_case', 'community_member_only', 'participant_only')),
  storage_bucket TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  size_bytes INT NOT NULL CHECK (size_bytes > 0 AND size_bytes <= 10485760),
  retention_state TEXT NOT NULL DEFAULT 'active' CHECK (retention_state IN ('active', 'expired_purged', 'redacted')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.consent_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id UUID NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  consent_type TEXT NOT NULL CHECK (consent_type IN ('staff_duty_location', 'provider_contact_publication', 'complaint_external_escalation', 'push_notifications')),
  target_reference_id UUID,
  consented BOOLEAN NOT NULL,
  policy_version TEXT NOT NULL DEFAULT 'v1.0',
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  withdrawn_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.audit_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id UUID NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
  actor_id UUID REFERENCES public.profiles(id),
  workspace_context TEXT NOT NULL,
  action_type TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id UUID,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id UUID NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  category TEXT NOT NULL CHECK (category IN ('order', 'message', 'exchange', 'return_reminder', 'review_window', 'complaint', 'event', 'announcement', 'sos_alert')),
  title TEXT NOT NULL,
  safe_preview_body TEXT NOT NULL,
  link_route TEXT NOT NULL,
  is_urgent BOOLEAN NOT NULL DEFAULT false,
  acknowledged_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.notification_deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  notification_id UUID NOT NULL REFERENCES public.notifications(id) ON DELETE CASCADE,
  channel TEXT NOT NULL CHECK (channel IN ('in_app', 'push_opt_in', 'email_adapter', 'sms_adapter', 'whatsapp_adapter')),
  status TEXT NOT NULL CHECK (status IN ('queued', 'provider_accepted', 'failed', 'acknowledged')),
  provider_name TEXT NOT NULL,
  error_message TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.outbox_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id UUID NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
  job_type TEXT NOT NULL,
  dedup_key TEXT NOT NULL UNIQUE,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'processing', 'completed', 'failed')),
  attempts INT NOT NULL DEFAULT 0,
  max_attempts INT NOT NULL DEFAULT 3,
  next_run_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.integration_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id UUID NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
  adapter_key TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('configured', 'demo', 'unavailable', 'failed')),
  status_reason TEXT NOT NULL,
  last_checked_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================================
-- 9. PERFORMANCE INDEXES FOR RLS & HIGH-FREQUENCY QUERIES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_memberships_user_status ON public.memberships (user_id, status);
CREATE INDEX IF NOT EXISTS idx_memberships_community_status ON public.memberships (community_id, status);
CREATE INDEX IF NOT EXISTS idx_role_grants_user_module ON public.role_grants (user_id, module_scope) WHERE revoked_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_profiles_community_profession ON public.profiles (community_id, profession);
CREATE INDEX IF NOT EXISTS idx_orders_buyer_id ON public.orders (buyer_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_shop_id_status ON public.orders (shop_id, status);
CREATE INDEX IF NOT EXISTS idx_products_shop_id ON public.products (shop_id, is_active);
CREATE INDEX IF NOT EXISTS idx_exchange_listings_community_mode ON public.exchange_listings (community_id, exchange_mode, status);
CREATE INDEX IF NOT EXISTS idx_exchange_agreements_participants ON public.exchange_agreements (owner_id, counterparty_id, status);
CREATE INDEX IF NOT EXISTS idx_reviews_subject_user ON public.reviews (subject_user_id, is_published);
CREATE INDEX IF NOT EXISTS idx_reviews_subject_provider ON public.reviews (subject_provider_id, is_published);
CREATE INDEX IF NOT EXISTS idx_complaints_reporter_status ON public.complaints (reporter_id, status);
CREATE INDEX IF NOT EXISTS idx_complaints_category_status ON public.complaints (community_id, category, status);
CREATE INDEX IF NOT EXISTS idx_incidents_community_status ON public.incidents (community_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_recipient ON public.notifications (recipient_id, created_at DESC);

-- ============================================================================
-- 10. PRIVATE SECURITY DEFINER HELPER FUNCTIONS FOR RLS
-- ============================================================================

CREATE OR REPLACE FUNCTION private.is_approved_member(target_community_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.memberships m
    WHERE m.user_id = (SELECT auth.uid())
      AND m.community_id = target_community_id
      AND m.status = 'approved'
  );
$$;

CREATE OR REPLACE FUNCTION private.has_scoped_admin_role(target_community_id UUID, required_module TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.role_grants rg
    JOIN public.memberships m
      ON m.user_id = rg.user_id
     AND m.community_id = rg.community_id
    WHERE rg.user_id = (SELECT auth.uid())
      AND rg.community_id = target_community_id
      AND m.status = 'approved'
      AND rg.revoked_at IS NULL
      AND (rg.expires_at IS NULL OR rg.expires_at > now())
      AND (rg.role_type = 'primary_admin' OR rg.module_scope = 'all' OR rg.module_scope = required_module)
  );
$$;

CREATE OR REPLACE FUNCTION private.is_shop_member(target_shop_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.shop_memberships sm
    WHERE sm.shop_id = target_shop_id
      AND sm.user_id = (SELECT auth.uid())
      AND sm.is_active = true
  );
$$;

CREATE OR REPLACE FUNCTION private.can_review_shop_prescriptions(target_shop_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.shop_memberships sm
    WHERE sm.shop_id = target_shop_id
      AND sm.user_id = (SELECT auth.uid())
      AND sm.is_active = true
      AND sm.can_review_prescriptions = true
  );
$$;

CREATE OR REPLACE FUNCTION private.is_provider_member(target_provider_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.provider_memberships pm
    WHERE pm.provider_id = target_provider_id
      AND pm.user_id = (SELECT auth.uid())
  );
$$;

CREATE OR REPLACE FUNCTION private.is_active_responder(target_community_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.staff_profiles sp
    WHERE sp.user_id = (SELECT auth.uid())
      AND sp.community_id = target_community_id
      AND sp.is_active_responder = true
  ) OR private.has_scoped_admin_role(target_community_id, 'safety');
$$;

REVOKE EXECUTE ON ALL FUNCTIONS IN SCHEMA private FROM PUBLIC, anon;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA private TO authenticated, service_role;

-- ============================================================================
-- 11. ENABLE ROW LEVEL SECURITY ON EVERY PUBLIC TABLE
-- ============================================================================

DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', r.tablename);
  END LOOP;
END $$;

-- ============================================================================
-- 12. GRANULAR ROW LEVEL SECURITY POLICIES (DENY-BY-DEFAULT)
-- ============================================================================

-- Communities & Buildings: readable by approved members
CREATE POLICY "communities_select_approved" ON public.communities
  FOR SELECT TO authenticated
  USING ((SELECT private.is_approved_member(id)));

CREATE POLICY "buildings_select_approved" ON public.buildings
  FOR SELECT TO authenticated
  USING ((SELECT private.is_approved_member(community_id)));

-- Memberships: user sees own row; membership admin sees community rows
CREATE POLICY "memberships_select_own_or_admin" ON public.memberships
  FOR SELECT TO authenticated
  USING (
    user_id = (SELECT auth.uid())
    OR (SELECT private.has_scoped_admin_role(community_id, 'membership'))
  );

CREATE POLICY "memberships_insert_own_request" ON public.memberships
  FOR INSERT TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()) AND status = 'pending');

CREATE POLICY "memberships_update_admin" ON public.memberships
  FOR UPDATE TO authenticated
  USING ((SELECT private.has_scoped_admin_role(community_id, 'membership')))
  WITH CHECK ((SELECT private.has_scoped_admin_role(community_id, 'membership')));

-- Profiles, Professional, Business, Visibility: approved members only
CREATE POLICY "profiles_select_approved" ON public.profiles
  FOR SELECT TO authenticated
  USING (
    id = (SELECT auth.uid())
    OR (SELECT private.is_approved_member(community_id))
  );

CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE TO authenticated
  USING (id = (SELECT auth.uid()))
  WITH CHECK (id = (SELECT auth.uid()));

CREATE POLICY "profile_visibility_select_approved" ON public.profile_visibility
  FOR SELECT TO authenticated
  USING (
    user_id = (SELECT auth.uid())
    OR (SELECT private.is_approved_member(community_id))
  );

CREATE POLICY "profile_visibility_update_own" ON public.profile_visibility
  FOR UPDATE TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "professional_profiles_select_approved" ON public.professional_profiles
  FOR SELECT TO authenticated
  USING ((SELECT private.is_approved_member(community_id)));

CREATE POLICY "business_profiles_select_approved" ON public.business_profiles
  FOR SELECT TO authenticated
  USING ((SELECT private.is_approved_member(community_id)));

-- Private Contacts: STRICTLY owner OR visibility-opted-in OR active SOS responder
CREATE POLICY "private_contacts_select_strict" ON public.private_contacts
  FOR SELECT TO authenticated
  USING (
    user_id = (SELECT auth.uid())
    OR (SELECT private.has_scoped_admin_role(community_id, 'membership'))
  );

CREATE POLICY "private_contacts_update_own" ON public.private_contacts
  FOR UPDATE TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

-- Role Grants & Blocks
CREATE POLICY "role_grants_select_approved" ON public.role_grants
  FOR SELECT TO authenticated
  USING (
    user_id = (SELECT auth.uid())
    OR (SELECT private.is_approved_member(community_id))
  );

CREATE POLICY "user_blocks_manage_own" ON public.user_blocks
  FOR ALL TO authenticated
  USING (blocker_id = (SELECT auth.uid()))
  WITH CHECK (blocker_id = (SELECT auth.uid()));

-- Posts, Comments, Saved Posts, Groups
CREATE POLICY "posts_select_approved" ON public.posts
  FOR SELECT TO authenticated
  USING (
    (SELECT private.is_approved_member(community_id))
    AND (is_hidden_by_moderation = false OR author_id = (SELECT auth.uid()) OR (SELECT private.has_scoped_admin_role(community_id, 'moderation')))
  );

CREATE POLICY "posts_insert_approved" ON public.posts
  FOR INSERT TO authenticated
  WITH CHECK (author_id = (SELECT auth.uid()) AND (SELECT private.is_approved_member(community_id)));

CREATE POLICY "comments_select_approved" ON public.comments
  FOR SELECT TO authenticated
  USING ((SELECT private.is_approved_member(community_id)));

CREATE POLICY "comments_insert_approved" ON public.comments
  FOR INSERT TO authenticated
  WITH CHECK (author_id = (SELECT auth.uid()) AND (SELECT private.is_approved_member(community_id)));

CREATE POLICY "saved_posts_manage_own" ON public.saved_posts
  FOR ALL TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "groups_select_approved" ON public.groups
  FOR SELECT TO authenticated
  USING ((SELECT private.is_approved_member(community_id)));

CREATE POLICY "group_memberships_select_approved" ON public.group_memberships
  FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()) OR EXISTS (SELECT 1 FROM public.groups g WHERE g.id = group_id AND (SELECT private.is_approved_member(g.community_id))));

-- Conversations & Messages: STRICTLY participants or authorised dispute moderators
CREATE POLICY "conversations_select_participant" ON public.conversations
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.conversation_members cm
      WHERE cm.conversation_id = id AND cm.user_id = (SELECT auth.uid())
    )
    OR (SELECT private.has_scoped_admin_role(community_id, 'moderation'))
  );

CREATE POLICY "conversation_members_select_participant" ON public.conversation_members
  FOR SELECT TO authenticated
  USING (
    user_id = (SELECT auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.conversation_members cm2
      WHERE cm2.conversation_id = conversation_id AND cm2.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "messages_select_participant" ON public.messages
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.conversation_members cm
      WHERE cm.conversation_id = conversation_id AND cm.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "messages_insert_participant" ON public.messages
  FOR INSERT TO authenticated
  WITH CHECK (
    sender_id = (SELECT auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.conversation_members cm
      WHERE cm.conversation_id = conversation_id AND cm.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "moderation_reports_select_own_or_mod" ON public.moderation_reports
  FOR SELECT TO authenticated
  USING (
    reporter_id = (SELECT auth.uid())
    OR (SELECT private.has_scoped_admin_role(community_id, 'moderation'))
  );

-- Announcements & Events
CREATE POLICY "announcements_select_approved" ON public.announcements
  FOR SELECT TO authenticated
  USING ((SELECT private.is_approved_member(community_id)));

CREATE POLICY "audience_rules_select_approved" ON public.audience_rules
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.announcements a WHERE a.id = announcement_id AND (SELECT private.is_approved_member(a.community_id))));

CREATE POLICY "acknowledgements_manage_own" ON public.acknowledgements
  FOR ALL TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "events_select_approved" ON public.events
  FOR SELECT TO authenticated
  USING ((SELECT private.is_approved_member(community_id)));

CREATE POLICY "event_rsvps_select_approved" ON public.event_rsvps
  FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()) OR EXISTS (SELECT 1 FROM public.events e WHERE e.id = event_id AND (SELECT private.is_approved_member(e.community_id))));

CREATE POLICY "event_rsvps_manage_own" ON public.event_rsvps
  FOR ALL TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

-- Shops, Products, Orders, Invoices, Ledger (Strict Shop & Buyer Isolation!)
CREATE POLICY "shops_select_approved_or_owner" ON public.shops
  FOR SELECT TO authenticated
  USING (
    (approval_status = 'approved' AND (SELECT private.is_approved_member(community_id)))
    OR (SELECT private.is_shop_member(id))
    OR (SELECT private.has_scoped_admin_role(community_id, 'commerce_support'))
  );

CREATE POLICY "shop_memberships_select_own_or_admin" ON public.shop_memberships
  FOR SELECT TO authenticated
  USING (
    user_id = (SELECT auth.uid())
    OR (SELECT private.is_shop_member(shop_id))
  );

CREATE POLICY "products_select_approved_or_shop" ON public.products
  FOR SELECT TO authenticated
  USING (
    (is_active = true AND (SELECT private.is_approved_member(community_id)))
    OR (SELECT private.is_shop_member(shop_id))
  );

CREATE POLICY "products_manage_shop_member" ON public.products
  FOR ALL TO authenticated
  USING ((SELECT private.is_shop_member(shop_id)))
  WITH CHECK ((SELECT private.is_shop_member(shop_id)));

CREATE POLICY "orders_select_buyer_shop_or_dispute_admin" ON public.orders
  FOR SELECT TO authenticated
  USING (
    buyer_id = (SELECT auth.uid())
    OR (SELECT private.is_shop_member(shop_id))
    OR (status = 'disputed' AND (SELECT private.has_scoped_admin_role(community_id, 'commerce_support')))
  );

CREATE POLICY "orders_insert_buyer" ON public.orders
  FOR INSERT TO authenticated
  WITH CHECK (buyer_id = (SELECT auth.uid()) AND (SELECT private.is_approved_member(community_id)));

CREATE POLICY "orders_update_buyer_or_shop" ON public.orders
  FOR UPDATE TO authenticated
  USING (buyer_id = (SELECT auth.uid()) OR (SELECT private.is_shop_member(shop_id)))
  WITH CHECK (buyer_id = (SELECT auth.uid()) OR (SELECT private.is_shop_member(shop_id)));

CREATE POLICY "order_items_select_buyer_or_shop" ON public.order_items
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = order_id
        AND (o.buyer_id = (SELECT auth.uid()) OR (SELECT private.is_shop_member(o.shop_id)))
    )
  );

CREATE POLICY "order_events_select_buyer_or_shop" ON public.order_events
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = order_id
        AND (o.buyer_id = (SELECT auth.uid()) OR (SELECT private.is_shop_member(o.shop_id)))
    )
  );

CREATE POLICY "invoices_select_buyer_or_shop" ON public.invoices
  FOR SELECT TO authenticated
  USING (
    buyer_id = (SELECT auth.uid())
    OR (SELECT private.is_shop_member(shop_id))
  );

CREATE POLICY "invoice_revisions_select_buyer_or_shop" ON public.invoice_revisions
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.invoices inv
      WHERE inv.id = invoice_id
        AND (inv.buyer_id = (SELECT auth.uid()) OR (SELECT private.is_shop_member(inv.shop_id)))
    )
  );

CREATE POLICY "ledger_entries_select_shop_only" ON public.ledger_entries
  FOR SELECT TO authenticated
  USING ((SELECT private.is_shop_member(shop_id)));

-- Services, Enquiries & Bookings
CREATE POLICY "service_categories_select_approved" ON public.service_categories
  FOR SELECT TO authenticated
  USING ((SELECT private.is_approved_member(community_id)));

CREATE POLICY "providers_select_approved_or_self" ON public.providers
  FOR SELECT TO authenticated
  USING (
    (SELECT private.is_approved_member(community_id))
    OR (SELECT private.is_provider_member(id))
  );

CREATE POLICY "provider_memberships_select_own" ON public.provider_memberships
  FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()) OR (SELECT private.is_provider_member(provider_id)));

CREATE POLICY "recommendations_select_approved" ON public.recommendations
  FOR SELECT TO authenticated
  USING ((SELECT private.is_approved_member(community_id)));

CREATE POLICY "service_enquiries_select_participant_only" ON public.service_enquiries
  FOR SELECT TO authenticated
  USING (
    resident_id = (SELECT auth.uid())
    OR (SELECT private.is_provider_member(provider_id))
    OR (SELECT private.has_scoped_admin_role(community_id, 'local_services'))
  );

CREATE POLICY "service_bookings_select_participant_only" ON public.service_bookings
  FOR SELECT TO authenticated
  USING (
    resident_id = (SELECT auth.uid())
    OR (SELECT private.is_provider_member(provider_id))
    OR (SELECT private.has_scoped_admin_role(community_id, 'local_services'))
  );

-- Social Service Exchanges
CREATE POLICY "exchange_listings_select_approved" ON public.exchange_listings
  FOR SELECT TO authenticated
  USING ((SELECT private.is_approved_member(community_id)));

CREATE POLICY "listing_responses_select_owner_or_respondent" ON public.listing_responses
  FOR SELECT TO authenticated
  USING (
    respondent_id = (SELECT auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.exchange_listings el
      WHERE el.id = listing_id AND el.owner_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "exchange_agreements_select_participants_only" ON public.exchange_agreements
  FOR SELECT TO authenticated
  USING (
    owner_id = (SELECT auth.uid())
    OR counterparty_id = (SELECT auth.uid())
    OR (status = 'disputed' AND (SELECT private.has_scoped_admin_role(community_id, 'moderation')))
  );

CREATE POLICY "exchange_participants_select_participants" ON public.exchange_participants
  FOR SELECT TO authenticated
  USING (
    user_id = (SELECT auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.exchange_agreements ea
      WHERE ea.id = agreement_id AND (ea.owner_id = (SELECT auth.uid()) OR ea.counterparty_id = (SELECT auth.uid()))
    )
  );

CREATE POLICY "exchange_events_select_participants" ON public.exchange_events
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.exchange_agreements ea
      WHERE ea.id = agreement_id AND (ea.owner_id = (SELECT auth.uid()) OR ea.counterparty_id = (SELECT auth.uid()))
    )
  );

CREATE POLICY "condition_reports_select_participants" ON public.condition_reports
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.exchange_agreements ea
      WHERE ea.id = agreement_id AND (ea.owner_id = (SELECT auth.uid()) OR ea.counterparty_id = (SELECT auth.uid()))
    )
  );

CREATE POLICY "return_extensions_select_participants" ON public.return_extensions
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.exchange_agreements ea
      WHERE ea.id = agreement_id AND (ea.owner_id = (SELECT auth.uid()) OR ea.counterparty_id = (SELECT auth.uid()))
    )
  );

-- Reviews & Blind Window Enforcement (REP-04)
CREATE POLICY "review_eligibility_select_participants" ON public.review_eligibility
  FOR SELECT TO authenticated
  USING (
    reviewer_id = (SELECT auth.uid())
    OR subject_user_id = (SELECT auth.uid())
  );

CREATE POLICY "reviews_select_published_or_author" ON public.reviews
  FOR SELECT TO authenticated
  USING (
    reviewer_id = (SELECT auth.uid())
    OR (
      (is_published = true OR now() >= (SELECT re.window_ends_at FROM public.review_eligibility re WHERE re.id = eligibility_id))
      AND moderation_status <> 'removed_policy_violation'
      AND (SELECT private.is_approved_member(community_id))
    )
    OR (SELECT private.has_scoped_admin_role(community_id, 'moderation'))
  );

CREATE POLICY "review_dimensions_select_visible" ON public.review_dimensions
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.reviews r
      WHERE r.id = review_id
        AND (r.reviewer_id = (SELECT auth.uid()) OR r.is_published = true)
    )
  );

CREATE POLICY "review_responses_select_visible" ON public.review_responses
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.reviews r
      WHERE r.id = review_id AND r.is_published = true
    )
  );

CREATE POLICY "review_reports_select_reporter_or_mod" ON public.review_reports
  FOR SELECT TO authenticated
  USING (
    reporter_id = (SELECT auth.uid())
  );

-- Help Requests, Complaints, Shared Issues & Escalations
CREATE POLICY "help_requests_select_scoped" ON public.help_requests
  FOR SELECT TO authenticated
  USING (
    requester_id = (SELECT auth.uid())
    OR (visibility_scope = 'community' AND (SELECT private.is_approved_member(community_id)))
    OR (SELECT private.has_scoped_admin_role(community_id, 'moderation'))
  );

CREATE POLICY "request_responses_select_scoped" ON public.request_responses
  FOR SELECT TO authenticated
  USING (
    responder_id = (SELECT auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.help_requests hr
      WHERE hr.id = help_request_id
        AND (hr.requester_id = (SELECT auth.uid()) OR hr.visibility_scope = 'community')
    )
  );

CREATE POLICY "shared_issues_select_approved" ON public.shared_issues
  FOR SELECT TO authenticated
  USING ((SELECT private.is_approved_member(community_id)));

CREATE POLICY "complaints_select_reporter_or_scoped_admin" ON public.complaints
  FOR SELECT TO authenticated
  USING (
    reporter_id = (SELECT auth.uid())
    OR assigned_admin_id = (SELECT auth.uid())
    OR (privacy_choice = 'shareable_redacted' AND (SELECT private.is_approved_member(community_id)))
    OR (SELECT private.has_scoped_admin_role(community_id, CASE
      WHEN category = 'water' THEN 'water'
      WHEN category = 'electricity' THEN 'electricity'
      WHEN category IN ('waste', 'cleanliness', 'drainage') THEN 'cleanliness'
      ELSE 'civic_escalation'
    END))
  );

CREATE POLICY "complaint_issue_links_select_scoped" ON public.complaint_issue_links
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.complaints c
      WHERE c.id = complaint_id
        AND (c.reporter_id = (SELECT auth.uid()) OR (SELECT private.has_scoped_admin_role(c.community_id, 'civic_escalation')))
    )
  );

CREATE POLICY "case_events_select_scoped" ON public.case_events
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.complaints c
      WHERE c.id = complaint_id
        AND (
          (c.reporter_id = (SELECT auth.uid()) AND is_internal_only = false)
          OR (SELECT private.has_scoped_admin_role(c.community_id, 'civic_escalation'))
        )
    )
  );

CREATE POLICY "authority_contacts_select_approved" ON public.authority_contacts
  FOR SELECT TO authenticated
  USING ((SELECT private.is_approved_member(community_id)));

CREATE POLICY "escalation_records_select_approved" ON public.escalation_records
  FOR SELECT TO authenticated
  USING ((SELECT private.is_approved_member(community_id)));

-- SOS Incidents, Staff, Consented Locations & CCTV
CREATE POLICY "incidents_select_approved" ON public.incidents
  FOR SELECT TO authenticated
  USING (
    reporter_id = (SELECT auth.uid())
    OR (SELECT private.is_approved_member(community_id))
    OR (SELECT private.is_active_responder(community_id))
  );

CREATE POLICY "incident_events_select_responder_or_reporter" ON public.incident_events
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.incidents inc
      WHERE inc.id = incident_id
        AND (inc.reporter_id = (SELECT auth.uid()) OR (SELECT private.is_active_responder(inc.community_id)))
    )
  );

CREATE POLICY "incident_responders_select_approved" ON public.incident_responders
  FOR SELECT TO authenticated
  USING (
    responder_user_id = (SELECT auth.uid())
    OR EXISTS (SELECT 1 FROM public.incidents inc WHERE inc.id = incident_id AND (SELECT private.is_approved_member(inc.community_id)))
  );

CREATE POLICY "incident_alert_deliveries_select_responder_or_reporter" ON public.incident_alert_deliveries
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.incidents inc
      WHERE inc.id = incident_id
        AND (inc.reporter_id = (SELECT auth.uid()) OR (SELECT private.is_active_responder(inc.community_id)))
    )
  );

CREATE POLICY "staff_profiles_select_approved" ON public.staff_profiles
  FOR SELECT TO authenticated
  USING (
    user_id = (SELECT auth.uid())
    OR (SELECT private.is_approved_member(community_id))
  );

CREATE POLICY "shifts_select_staff_or_safety" ON public.shifts
  FOR SELECT TO authenticated
  USING (
    staff_user_id = (SELECT auth.uid())
    OR (SELECT private.is_approved_member(community_id))
  );

CREATE POLICY "attendance_select_staff_or_safety" ON public.attendance
  FOR SELECT TO authenticated
  USING (
    staff_user_id = (SELECT auth.uid())
    OR EXISTS (SELECT 1 FROM public.shifts s WHERE s.id = shift_id AND (SELECT private.has_scoped_admin_role(s.community_id, 'safety')))
  );

CREATE POLICY "tasks_select_staff_or_safety" ON public.tasks
  FOR SELECT TO authenticated
  USING (
    staff_user_id = (SELECT auth.uid())
    OR (SELECT private.has_scoped_admin_role(community_id, 'safety'))
  );

CREATE POLICY "patrol_checkpoints_select_approved" ON public.patrol_checkpoints
  FOR SELECT TO authenticated
  USING ((SELECT private.is_approved_member(community_id)));

CREATE POLICY "location_sharing_sessions_select_granted" ON public.location_sharing_sessions
  FOR SELECT TO authenticated
  USING (
    staff_user_id = (SELECT auth.uid())
    OR (
      consent_given = true
      AND is_active = true
      AND ended_at IS NULL
      AND (SELECT private.is_approved_member(community_id))
    )
  );

CREATE POLICY "current_locations_select_granted_active_only" ON public.current_locations
  FOR SELECT TO authenticated
  USING (
    staff_user_id = (SELECT auth.uid())
    OR (
      EXISTS (
        SELECT 1 FROM public.location_sharing_sessions lss
        WHERE lss.id = session_id
          AND lss.consent_given = true
          AND lss.is_active = true
          AND lss.ended_at IS NULL
      )
      AND EXISTS (
        SELECT 1 FROM public.location_grants lg
        WHERE lg.community_id = community_id
          AND (lg.subject_staff_user_id IS NULL OR lg.subject_staff_user_id = staff_user_id)
          AND (lg.viewer_user_id = (SELECT auth.uid()) OR (lg.viewer_role = 'approved_member' AND (SELECT private.is_approved_member(community_id))))
          AND lg.revoked_at IS NULL
          AND lg.valid_until > now()
      )
    )
  );

CREATE POLICY "location_grants_select_safety_or_grantee" ON public.location_grants
  FOR SELECT TO authenticated
  USING (
    viewer_user_id = (SELECT auth.uid())
    OR subject_staff_user_id = (SELECT auth.uid())
    OR (SELECT private.is_approved_member(community_id))
  );

CREATE POLICY "optional_location_history_select_safety" ON public.optional_location_history
  FOR SELECT TO authenticated
  USING (
    staff_user_id = (SELECT auth.uid())
  );

-- CCTV Cameras & Grants (camera_secrets has ZERO client policies!)
CREATE POLICY "camera_groups_select_approved" ON public.camera_groups
  FOR SELECT TO authenticated
  USING ((SELECT private.is_approved_member(community_id)));

CREATE POLICY "cameras_select_approved" ON public.cameras
  FOR SELECT TO authenticated
  USING ((SELECT private.is_approved_member(community_id)));

CREATE POLICY "camera_grants_select_grantee_or_safety" ON public.camera_grants
  FOR SELECT TO authenticated
  USING (
    grantee_user_id = (SELECT auth.uid())
    OR (SELECT private.has_scoped_admin_role(community_id, 'safety'))
  );

CREATE POLICY "camera_sessions_select_viewer_or_safety" ON public.camera_sessions
  FOR SELECT TO authenticated
  USING (
    viewer_user_id = (SELECT auth.uid())
    OR (SELECT private.has_scoped_admin_role(community_id, 'safety'))
  );

CREATE POLICY "camera_access_events_select_safety" ON public.camera_access_events
  FOR SELECT TO authenticated
  USING (
    actor_id = (SELECT auth.uid())
    OR (SELECT private.has_scoped_admin_role(community_id, 'safety'))
  );

-- Attachments (SHOP-11: Prescriptions strictly buyer or authorised pharmacy staff!)
CREATE POLICY "attachments_select_strict_classification" ON public.attachments
  FOR SELECT TO authenticated
  USING (
    owner_id = (SELECT auth.uid())
    OR (
      classification = 'prescription'
      AND EXISTS (
        SELECT 1 FROM public.orders o
        WHERE o.id = parent_id
          AND (SELECT private.can_review_shop_prescriptions(o.shop_id))
      )
    )
    OR (
      classification = 'community_member_only'
      AND (SELECT private.is_approved_member(community_id))
    )
  );

CREATE POLICY "consent_records_select_own_or_admin" ON public.consent_records
  FOR SELECT TO authenticated
  USING (
    user_id = (SELECT auth.uid())
    OR (SELECT private.has_scoped_admin_role(community_id, 'safety'))
  );

CREATE POLICY "audit_events_select_admin" ON public.audit_events
  FOR SELECT TO authenticated
  USING (
    actor_id = (SELECT auth.uid())
    OR (SELECT private.has_scoped_admin_role(community_id, 'all'))
  );

CREATE POLICY "notifications_select_recipient" ON public.notifications
  FOR SELECT TO authenticated
  USING (recipient_id = (SELECT auth.uid()));

CREATE POLICY "notification_deliveries_select_recipient" ON public.notification_deliveries
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.notifications n
      WHERE n.id = notification_id AND n.recipient_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "outbox_jobs_select_admin" ON public.outbox_jobs
  FOR SELECT TO authenticated
  USING ((SELECT private.has_scoped_admin_role(community_id, 'all')));

CREATE POLICY "integration_settings_select_approved" ON public.integration_settings
  FOR SELECT TO authenticated
  USING ((SELECT private.is_approved_member(community_id)));
