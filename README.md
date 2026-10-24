# CommunityCircle (MyCircle)

**Private Community Trust, Commerce, Service & Safety Platform**

Implemented against [`CommunityCircle_PRD_v1.md`](file:///d:/MyApp/MyCircle/CommunityCircle_PRD_v1.md) using **Next.js (App Router)**, **TypeScript**, **Tailwind CSS**, and **Supabase** (`https://runquwuetzfivhwefenk.supabase.co`).

---

## Product Scope Implemented (Phases 0–5)

1. **Identity, Membership & Directory (`MEM-01..07`)**:
   - Approved-member gate (`active`, `pending`, `suspended`, `revoked`).
   - Primary Admin + **10 distinct permission-scoped sub-admins** (`membership_moderator`, `content_moderator`, `events_announcements_manager`, `shop_marketplace_coordinator`, `service_directory_coordinator`, `social_service_moderator`, `helpdesk_complaints_officer`, `civic_escalation_liaison`, `safety_sos_coordinator`, `staff_cctv_controller`).
   - 1,000 synthetic member profiles across 6 buildings (`Tower A — Banyan` through `Villa Row F — Gulmohar`).
   - Field-level directory privacy (`hidden`, `approved_members`, `neighborhood_only`, `transaction_counterparties_only`).
2. **Community Feed, Discussions, Messaging, Announcements & Events (`COM-01..05`, `EVT-01..05`)**:
   - Category filterable community feed, urgent pinned notices, event RSVPs, volunteer slots, and attendance check-in.
3. **Local Shops, Orders, Prescriptions, Price Change Approval, Invoices & Ledger (`SHOP-01..11`)**:
   - Multi-mode ordering (`catalog`, `freeform`, `shopping_list`, `prescription`).
   - Mandatory buyer approval (`price_change_pending` → `confirmed_by_buyer`) whenever merchant line-item revisions change the billed total.
   - Strict prescription attachment privacy (`prescriptions-private` bucket; isolated from general community admins).
   - Running customer accounts, invoice revisions (`v1`, `v2`), and credit/adjustment ledger entries.
4. **Trusted Service Providers, Recommendations, Bookings & Verified Reviews (`SRV-01..06`, `REP-01..08`)**:
   - Community-endorsed providers with distinct `member_endorsed` vs `admin_verified` badges.
   - Booking lifecycle (`inquiry` → `quoted` → `scheduled` → `in_progress` → `completed`).
   - Blind 7-day review window unlocking only on terminal transaction states (`completed` / `returned`).
5. **Social Service & Peer-to-Peer Exchange (`SOC-01..10`)**:
   - All 7 exchange modes (`help_request`, `service_offer`, `giveaway`, `sale`, `borrow_lend`, `rental`, `barter_swap`) with explicit condition tracking, security deposit states, and return reminders.
6. **Help Requests, Complaints, Shared Building Issues & Civic Escalation (`HELP-01..03`, `CASE-01..06`)**:
   - Urgent help requests, building/flat/common-area maintenance complaints, linked affected households, and municipal/civic escalation (`Manual Civic Reference Record — No Live Government API Connected`).
7. **SOS Emergency Alerts, Staff Attendance, Consent-Based Duty GPS & Common-Area CCTV (`SOS-01..09`, `STF-01..07`, `CCTV-01..07`)**:
   - Two-step SOS confirmation (`trigger` → `active` → `acknowledged` → `responding` → `resolved`) with honest SMS/Push adapter status banner.
   - Staff duty check-in/out and explicit consent-based duty location sharing (`exact_coords_AuthorizedOnly` stripped for general residents).
   - Common-area-only CCTV registry (`common_area_confirmed = true` DB constraint), mandatory access reason logging, and 60-second short-lived signed session tokens (`Simulated Demo Feed — Not Live RTSP/WebRTC`).
8. **Separated Operational Workspaces**:
   - `/workspaces/admin` (Primary Admin & 10 Scoped Sub-Admins)
   - `/workspaces/shop` (Shop Owner / Manager Order Queue, Price-Change Builder & Ledger)
   - `/workspaces/provider` (Service Provider Quotes, Schedule & Verified Reviews)
   - `/workspaces/staff` (Staff Shift Check-In, GPS Consent & SOS Responder Dispatch)

---

## Architecture & Key Documentation

- [`docs/DECISIONS.md`](file:///d:/MyApp/MyCircle/docs/DECISIONS.md) — Architectural & product decisions (`DEC-01` through `DEC-08`)
- [`docs/PERMISSIONS.md`](file:///d:/MyApp/MyCircle/docs/PERMISSIONS.md) — Complete Role × Resource × Action matrix, 10 sub-admin scopes, and RLS policies
- [`docs/INTEGRATIONS.md`](file:///d:/MyApp/MyCircle/docs/INTEGRATIONS.md) — Live Supabase connection + honest demo adapter specifications
- [`docs/IMPLEMENTATION_STATUS.md`](file:///d:/MyApp/MyCircle/docs/IMPLEMENTATION_STATUS.md) — Complete PRD trace matrix (`MEM-01` through `CCTV-07`)
- [`docs/TEST_REPORT.md`](file:///d:/MyApp/MyCircle/docs/TEST_REPORT.md) — Automated acceptance test & verification report

---

## Local Setup Instructions

### 1. Prerequisites
- Node.js 20+
- npm 10+
- Access to Supabase project `runquwuetzfivhwefenk` (`https://runquwuetzfivhwefenk.supabase.co`)

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment Variables
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```
Ensure `.env.local` has the Supabase project URL and publishable/anon keys:
```env
NEXT_PUBLIC_SUPABASE_URL=https://runquwuetzfivhwefenk.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_XlwzVBO1B3mSu_0UcRJPFQ_UXQTE4MO
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon_jwt_key>
```

### 4. Database Migrations & Seed Data
The SQL migrations in `supabase/migrations/` are already applied to the live Supabase project `runquwuetzfivhwefenk`:
- [`supabase/migrations/20261024000001_community_circle_schema_and_rls.sql`](file:///d:/MyApp/MyCircle/supabase/migrations/20261024000001_community_circle_schema_and_rls.sql) — 55+ tables, `private.*` security definer helpers, indexes, and RLS policies.
- [`supabase/migrations/20261024000002_storage_and_synthetic_seed.sql`](file:///d:/MyApp/MyCircle/supabase/migrations/20261024000002_storage_and_synthetic_seed.sql) — Storage buckets, 1,000 member profiles, 10 sub-admin role grants, shops, orders, providers, exchange listings, complaints, SOS incidents, staff shifts, and common-area cameras.
- [`supabase/migrations/20261024000003_server_rpc_workflows.sql`](file:///d:/MyApp/MyCircle/supabase/migrations/20261024000003_server_rpc_workflows.sql) — Server-side RPC workflows (`cc_get_bootstrap_state`, `cc_update_profile_visibility`, `cc_place_shop_order`, `cc_respond_order_price_change`, `cc_create_exchange_listing`, `cc_request_camera_session`, `cc_trigger_sos_incident`, `cc_acknowledge_sos_incident`).

### 5. Run Development Server
```bash
npm run dev
```
Open `http://localhost:3000`. Use the **Role & Persona Switcher** in the header to test cross-role permissions across all 16 seeded personas (Primary Admin, 10 Scoped Sub-Admins, Resident Member, Shop Owner, Service Provider, On-Duty Staff, and Pending Applicant).

### 6. Run Verification Suite
```bash
npm run typecheck
npm test
npm run build
```
