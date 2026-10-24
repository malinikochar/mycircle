# CommunityCircle — Architectural Decisions, Route Map & Schema Plan

## 1. Core Architectural Assumptions & Decisions

1. **Single-Community Multi-Building Topology (Tenant-Ready):**
   - Every community-scoped table includes `community_id UUID NOT NULL REFERENCES public.communities(id)`.
   - Default deployment targets **Serenity Heights Co-op Housing Society** (`Asia/Kolkata` display timezone, `UTC` database storage, `INR` amounts stored as integer `paise` (`BIGINT` / `INTEGER`) to prevent floating-point rounding errors).
   - Designed for 1,000 registered resident accounts across multiple residential towers (Buildings A–F) plus commercial arcade units, and 10+ permission-scoped sub-admin delegates.

2. **Explicit Workspace Separation (Zero Implicit Privilege Merging):**
   - A user holding multiple roles (e.g., an approved Resident who also owns a Local Shop or serves as a Water & Utilities Sub-Admin) operates in one explicit workspace context at a time (`resident`, `admin`, `shop`, `provider`, `staff`).
   - Server actions and queries require explicit workspace context and validate that the caller holds an active, non-expired grant for that specific module, building, and action.

3. **Strict Data Boundary Enforcement (Supabase RLS + Server Actions + Private Schema Helpers):**
   - Access is **deny-by-default** across all `public` tables and `storage.objects`.
   - Security helper functions live in the unexposed `private` schema (`private.is_active_member`, `private.has_admin_permission`, `private.is_shop_staff`, `private.is_provider_member`, `private.is_security_staff`) using `(select auth.uid())` initplan caching to avoid per-row evaluation overhead.
   - Private resident contact fields (`private_contacts`: personal phone, emergency contact, exact flat/unit number, residency proof notes) are separated from `profiles` (display name, bio, skills, profession, business summary) and controlled by `profile_visibility` settings.
   - Vendors receive an **order-specific delivery projection** (`buyer_name`, `delivery_building`, `delivery_unit`, `delivery_phone`, `delivery_instructions`) frozen on the `orders` record only when an order is submitted to their shop. Vendors cannot query `profiles` or `private_contacts` directly.
   - Prescriptions (`classification = 'prescription'`) in `attachments` are restricted strictly to the uploading buyer and explicitly authorized pharmacy staff (`shop_memberships.can_review_prescriptions = true`), never generic community admins or sub-admins.

4. **Idempotent & Transactional Mutations:**
   - **Order Placement (`SHOP-04`):** Uses client-supplied `idempotency_key` (`UNIQUE (buyer_id, idempotency_key)`), server-side product price lookup, stock reservation check, and immutable `order_items` snapshots in integer paise.
   - **Social Service Allocation (`SOC-04`, `SOC-05`):** Uses atomic quantity checks (`allocated_quantity + requested_quantity <= total_quantity`) and versioned `exchange_agreements` snapshots (`version INTEGER`, `terms_snapshot JSONB`, dual participant confirmation timestamps).
   - **Blind Review Publication (`REP-04`):** Reviews are stored with `is_published = false` until either both counterparties submit their review for the `review_eligibility` pair OR the 14-day `window_ends_at` timestamp passes.

5. **Honest External Adapters (`docs/INTEGRATIONS.md`):**
   - External dependencies (Push/SMS/WhatsApp notifications, Payment Gateway, Civic/Government Complaint Portal, Pharmacy Verification, Device Geolocation, NVR/VMS Camera Streaming) are wrapped in typed server adapters that report `configured`, `demo`, `unavailable`, or `failed` status.
   - Simulated/demo adapters never claim an emergency was acknowledged by authorities, never claim a civic complaint was officially received by a municipal portal without manual reference entry, and never claim a live RTSP stream is connected when serving sample/demo camera sessions.

---

## 2. Application Route Map

| Workspace / Area | Route | Purpose & PRD Mapping |
|---|---|---|
| **Global / Auth** | `/login` | Supabase Auth sign-in, membership request, and deterministic Persona/Role Switcher for evaluation |
| **Resident — Home** | `/` | Current notices (`EVT-01`), active orders/requests, upcoming events, quick actions |
| **Resident — Community** | `/community` | Feed & category filters (`COM-01`), announcements (`COM-02`), groups & DMs (`COM-03`), member/profession/business directory (`MEM-02..05`) |
| **Resident — Shops** | `/shops` | Approved shops (`SHOP-01`), product search & single-shop cart (`SHOP-03`), idempotent checkout (`SHOP-04`), orders & invoices (`SHOP-06..09`, `SHOP-11`) |
| **Resident — Services** | `/services` | Service provider directory (`SRV-01..03`), enquiry & quote booking (`SRV-04`), verified vs off-platform recommendations (`SRV-05..06`) |
| **Resident — Social Service** | `/social-service` | "I need something" / "I have something to offer" (`SOC-01..03`), agreement snapshots (`SOC-05`), handover/return & overdue/dispute tracking (`SOC-06..10`) |
| **Resident — Help & Cases** | `/help-complaints` | Everyday help requests (`HELP-01..03`), civic/maintenance complaints (`CASE-01..03`), shared issues (`CASE-04`), escalation packages (`CASE-05..06`) |
| **Resident — Safety** | `/safety` | Hold-to-send SOS & manual floor/lift entry (`SOS-01..08`), permitted on-duty staff map/list (`STF-03..06`), permitted CCTV sessions (`CCTV-01..07`) |
| **Resident — Account** | `/account` | Profile & per-field privacy (`MEM-02..03`), blind/published reviews (`REP-01..08`), notifications (`EVT-03..05`), exit request (`MEM-06`) |
| **Workspace — Admin** | `/workspaces/admin` | Primary Admin & 10+ Scoped Sub-Admins: membership approvals, 10 sub-admin role grants, shop approvals, complaint triage/linking/escalation, notice publishing, SOS & security grants, outbox jobs |
| **Workspace — Shop** | `/workspaces/shop` | Shop Owner/Staff: catalogue management, order state machine, buyer approval requests for price/substitution changes, invoices & revisions, vendor ledger & exports |
| **Workspace — Provider** | `/workspaces/provider` | Service Provider: assigned enquiries, quote submission, booking completion, review responses |
| **Workspace — Staff** | `/workspaces/staff` | Security & Facility Staff: shift check-in/out, patrol checkpoints, explicit foreground location consent toggle, SOS responder acknowledgement & arrival updates |

---

## 3. Database Schema Plan (6 Domains, 50+ Relational Tables & Policies)

1. **Identity & Access:** `communities`, `buildings`, `profiles`, `private_contacts`, `profile_visibility`, `memberships`, `role_grants`, `professional_profiles`, `business_profiles`.
2. **Social & Events:** `posts`, `comments`, `groups`, `group_memberships`, `conversations`, `conversation_members`, `messages`, `moderation_reports`, `announcements`, `audience_rules`, `acknowledgements`, `events`, `event_rsvps`.
3. **Commerce & Services:** `shops`, `shop_memberships`, `products`, `orders`, `order_items`, `order_events`, `invoices`, `invoice_revisions`, `ledger_entries`, `service_categories`, `providers`, `provider_memberships`, `recommendations`, `service_enquiries`, `service_bookings`.
4. **Social Service Exchange & Reputation:** `exchange_listings`, `listing_responses`, `exchange_agreements`, `exchange_participants`, `exchange_events`, `condition_reports`, `return_extensions`, `review_eligibility`, `reviews`, `review_dimensions`, `review_responses`, `review_reports`.
5. **Help, Complaints & Safety:** `help_requests`, `request_responses`, `complaints`, `shared_issues`, `complaint_issue_links`, `case_events`, `authority_contacts`, `escalation_records`, `incidents`, `incident_events`, `incident_responders`, `incident_alert_deliveries`.
6. **Workforce, Location, CCTV & Operations:** `staff_profiles`, `shifts`, `attendance`, `tasks`, `patrol_checkpoints`, `location_sharing_sessions`, `current_locations`, `location_grants`, `optional_location_history`, `camera_groups`, `cameras`, `camera_secrets` (service-only), `camera_grants`, `camera_sessions`, `camera_access_events`, `attachments`, `consent_records`, `audit_events`, `notifications`, `notification_deliveries`, `outbox_jobs`, `integration_settings`.
