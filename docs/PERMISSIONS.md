# CommunityCircle — Permission, Privacy & Isolation Matrix

Access in CommunityCircle is **deny-by-default** and enforced at two independent layers:
1. **PostgreSQL Row-Level Security (RLS)** on every table in `public` and `storage.objects`, backed by `SECURITY DEFINER` helper functions in the unexposed `private` schema with `(select auth.uid())` caching.
2. **Typed Next.js Server Actions / Route Handlers** that validate active membership, workspace context, module/building/action sub-admin scope, last-owner protection, and audit logging before performing mutations.

---

## 1. Primary Role Matrix

| Role | Allowed Reads | Allowed Writes | Hard Restrictions |
|---|---|---|---|
| **Pending / Suspended / Revoked User** | Own `memberships` status row only | Submit initial membership request or appeal | Zero access to directory, posts, shops, services, exchanges, complaints, SOS feed, location, or CCTV via UI, REST, Storage, or Realtime |
| **Approved Resident** | Approved profiles (respecting `profile_visibility`), community posts/announcements/events for their building/audience, active shops/products, own orders/invoices, providers, social service listings, own/public complaints, sanitised SOS alerts, staff duty availability (per `location_grants`), cameras (per `camera_grants`) | Update own profile/visibility, create posts/comments, place idempotent orders, approve/reject shop price adjustments, create/respond to exchange listings, confirm handovers/returns, submit eligible reviews, file help requests/complaints, trigger SOS | Cannot read other residents' `private_contacts`, other buyers' orders/invoices/prescriptions, confidential complaints, raw camera URLs, or ungranted staff coordinates |
| **Community Admin (Primary)** | Community memberships, role grants, shop applications, operational metrics, assigned/escalated complaints, announcements, camera/location grant registries, audit logs | Approve/suspend members, grant/revoke sub-admin roles, approve shops, configure modules, issue time-bound camera/location grants | **Last-owner rule:** Cannot revoke or delete the last active Primary Admin. **Privacy rule:** Cannot read prescription attachments (`SHOP-11`), private DMs (`COM-03`), or unrelated buyer invoices without an active dispute case |
| **Scoped Sub-Admin (10+ Seats)** | Only records matching their `role_grants` (`module`, optional `building_id`, `allowed_actions`, `expires_at > now()`) | Perform only `allowed_actions` within their assigned `module` and `building_id` | Cannot self-promote, grant roles to others, read outside their assigned module/building, or access prescriptions/camera secrets |
| **Shop Owner / Shop Staff** | Own `shops`, `products`, `orders`, `order_items`, `invoices`, `ledger_entries`, and order-linked `conversations` | Manage own catalogue, transition own shop's order states, propose price/weight/substitution changes, issue invoices/revisions, record ledger entries | Cannot query resident directory (`profiles` / `private_contacts`), cannot read other shops' orders/products, cannot read general community feed in shop workspace |
| **Pharmacy Staff (Authorised)** | Same as Shop Staff + prescription `attachments` (`classification = 'prescription'`) linked to orders placed at their pharmacy where `shop_memberships.can_review_prescriptions = true` | Record pharmacist verification status on pharmacy orders | Cannot provide automated diagnosis or substitute prescription medicines without explicit buyer + prescriber re-upload |
| **Service Provider** | Own `providers` listing, `service_enquiries` and `service_bookings` assigned to their provider ID, published `reviews` about their provider profile | Update availability/indicative pricing, submit quotes, update booking status, post `review_responses` to own reviews | Cannot browse resident directory, other providers' enquiries, or community feed |
| **Security / Facility Staff** | Own `staff_profiles`, `shifts`, `tasks`, `patrol_checkpoints`, assigned `incidents` (full responder details), and explicitly granted `cameras` / `current_locations` | Check in/out of shift, start/stop consented `location_sharing_sessions`, publish foreground coordinates, acknowledge SOS & update responder arrival | Cannot view other staff locations by job title alone; cannot access resident private records |

---

## 2. The 10+ Configured Sub-Admin Scopes (`role_grants`)

CommunityCircle supports 10+ simultaneous sub-admin delegates without requiring all seats to be filled by distinct humans during testing, and seeds 10 distinct sub-admin delegate accounts:

1. `membership` — Building-scoped or community-wide resident verification & onboarding (`approve_member`, `reject_member`, `suspend_member`).
2. `moderation` — Community posts, comments, group moderation, and review abuse reports (`moderate_post`, `redact_review`, `resolve_report`).
3. `events` — Announcements, community notices, and event scheduling/RSVPs (`publish_notice`, `manage_event`).
4. `water` — Water supply complaints, tanker notices, and valve maintenance cases (`triage_case`, `assign_case`, `update_case` where `category = 'water'`).
5. `electricity` — Power outage, lift power backup, and common lighting complaints (`triage_case`, `assign_case`, `update_case` where `category = 'electricity'`).
6. `cleanliness` — Waste collection, sanitation, and drainage complaints (`triage_case`, `assign_case`, `update_case` where `category IN ('waste', 'cleanliness', 'drainage')`).
7. `civic_escalation` — Shared issues, authority contact verification, and consented external escalation packages (`link_shared_issue`, `prepare_escalation`, `record_authority_submission`).
8. `commerce_support` — Local shop onboarding, service window verification, and order dispute mediation (`approve_shop`, `mediate_order_dispute`).
9. `local_services` — Provider category curation, recommendation moderation, and service booking disputes (`verify_provider_badge`, `mediate_service_dispute`).
10. `safety` — SOS responder roster, staff shift management, and time-bound location/CCTV session grants (`manage_shifts`, `acknowledge_sos`, `grant_location_view`, `grant_camera_view`).

---

## 3. Sensitive Resource Rules

- **Private Contacts (`private_contacts`):** Readable only by the owner (`user_id = (select auth.uid())`) or an active SOS responder during an open incident raised by that user (`incidents.status IN ('raised', 'responder_acknowledged', 'responder_en_route')`).
- **Transaction Conversations (`conversations`):** Linked to `order_id`, `exchange_listing_id`, `service_enquiry_id`, or `help_request_id`. Readable only by `conversation_members` or a scoped dispute moderator when the underlying transaction status is `disputed`.
- **Staff Location (`current_locations`):**
  - Writing requires an active `shifts` record (`status = 'on_duty'`), an active `location_sharing_sessions` row (`consent_given = true AND ended_at IS NULL`), and `staff_user_id = (select auth.uid())`.
  - Reading checks `location_grants` (`valid_until > now()`). If the viewer's grant has `precision_level = 'approximate'`, server operations return only the coarse building/zone label and never transmit raw `latitude`/`longitude` coordinates to the client (`STF-03`).
  - Positions older than 120 seconds are marked `is_stale = true` (`STF-06`).
- **CCTV Sessions (`camera_sessions` & `camera_secrets`):**
  - `camera_secrets` (NVR credentials/internal stream endpoints) has zero `SELECT` policies for `anon` or `authenticated`.
  - Requesting a stream calls a server action that verifies an active `camera_grants` row (`permission_type IN ('live', 'playback', 'export')`, `expires_at > now()`), logs a `camera_access_events` audit entry, and mints a short-lived session token (`expires_at = now() + interval '60 seconds'`) (`CCTV-03`, `CCTV-04`).
