# CommunityCircle — Requirement Implementation Status Tracker

This document maps every requirement ID in `CommunityCircle_PRD_v1.md` (Section 5, Section 9, Section 10) to its current status: `Implemented`, `Partial`, `Planned`, or `Blocked`.

| Req ID | Module & Summary | Phase | Status | Notes / Verification |
|---|---|---|---|---|
| **MEM-01** | Invite/request membership; approve, reject with reason, suspend, reactivate, revoke | Phase 0 | Implemented | Enforced in `memberships` RLS + Admin membership workflow |
| **MEM-02** | Display name, photo, intro, interests, profession, skills, business details, services | Phase 1 | Implemented | Stored in `profiles`, `professional_profiles`, `business_profiles` |
| **MEM-03** | Private contact & unit details; per-field visibility; phone/unit hidden by default | Phase 0/1 | Implemented | Separated into `private_contacts` and `profile_visibility` |
| **MEM-04** | Search approved members by name, profession, skills, business, service category with pagination & building filter | Phase 1 | Implemented | Directory search respects `profile_visibility` and active membership |
| **MEM-05** | Display published transaction ratings, review counts, recommendations, completed interactions | Phase 1/2 | Implemented | Separate member exchange vs provider service averages |
| **MEM-06** | Private account: orders, invoices, exchanges, cases, saved providers, notifications, privacy, exit request | Phase 1/2 | Implemented | Available in `/account` workspace |
| **MEM-07** | Search indexes, counts, exports respect direct profile access rules; no phone enumeration | Phase 1 | Implemented | RLS + server search projection prevents scraping/phone enumeration |
| **COM-01** | Community posts, comments, saved posts, category filters (general, celebrations, lost & found, etc.) | Phase 3 | Implemented | Available in `/community` feed tab |
| **COM-02** | Distinguish official announcements from member opinions; pinned notices expire | Phase 1/3 | Implemented | `announcements` vs `posts` with `expires_at` filtering |
| **COM-03** | Building & interest groups with membership/moderation; private DMs with requests, blocking, reporting | Phase 3 | Implemented | `groups`, `conversations`, `moderation_reports`, user blocks |
| **COM-04** | Transaction conversations linked to order/request/exchange; restricted to participants & support reviewers | Phase 1/3 | Implemented | `conversations.context_type` & RLS participant policy |
| **COM-05** | Moderation records reasons, actor, action, appeal route; no silent edits of member statements | Phase 3 | Implemented | Immutable content + `moderation_reports` / `audit_events` |
| **SHOP-01** | Admin approves shops & service areas; hours, delivery fees, minimum order, service windows | Phase 1 | Implemented | `shops` table + Admin commerce approval |
| **SHOP-02** | Shop owners manage staff and own catalogue (pack/unit sizes, prices in paise, stock) | Phase 1 | Implemented | `/workspaces/shop` + `shop_memberships` RLS |
| **SHOP-03** | Residents search products, single-shop cart, review charges, select delivery details, place order | Phase 1 | Implemented | `/shops` catalogue & cart workflow |
| **SHOP-04** | Server validation of ownership, prices, quantities, stock, totals; immutable snapshots; idempotent checkout | Phase 1 | Implemented | `idempotency_key` constraint + server-computed paise totals |
| **SHOP-05** | Shop accepts/rejects, delivery estimate; price/weight/substitution changes require buyer approval | Phase 1 | Implemented | `awaiting_buyer_approval` state & buyer confirmation action |
| **SHOP-06** | Full order state machine (`submitted` -> `awaiting_buyer_approval` -> `accepted` -> `preparing` -> `out_for_delivery` -> `delivered` / `rejected` / `cancelled` / `disputed`) | Phase 1 | Implemented | Enforced by server state transition validator |
| **SHOP-07** | Vendors receive order-specific buyer projection only; cannot browse resident directory | Phase 1 | Implemented | Frozen delivery fields on `orders`; zero shop access to `private_contacts` |
| **SHOP-08** | Order messages, receipts, history, reordering, cancellation reasons, delivery confirmation | Phase 1 | Implemented | Order detail drawer & linked transaction thread |
| **SHOP-09** | Itemised invoices with seller identity, tax fields, totals, and traceable `invoice_revisions` | Phase 1 | Implemented | `invoices` & `invoice_revisions` tables |
| **SHOP-10** | Vendor ledger (sales, unpaid balances, recorded payments, adjustments, export); separate order vs payment status | Phase 3 | Implemented | `ledger_entries` + independent `payment_status` |
| **SHOP-11** | Gated pharmacy workflow; prescription attachments private to buyer & authorised pharmacy staff only | Phase 1/5 | Implemented | `attachments.classification = 'prescription'` RLS + demo adapter banner |
| **SRV-01** | Service directory (electricians, plumbers, maids, cleaners, drivers, salons, tutors, repairs) | Phase 1 | Implemented | `service_categories` & `providers` |
| **SRV-02** | Distinguish member-recommended vs provider-managed profiles; record contact publication consent | Phase 1 | Implemented | `listing_mode` badge & `consent_records` |
| **SRV-03** | Provider page with area, availability, indicative pricing, scope of approval badge, enquiry action | Phase 1 | Implemented | `/services` detail & explicit verification scope note |
| **SRV-04** | Record enquiry, quote response, acceptance, scheduled work, outcome, cancellation, dispute | Phase 1/2 | Implemented | `service_enquiries` & `service_bookings` workflow |
| **SRV-05** | Multi-dimension service ratings (quality, punctuality, communication, price adherence) + provider response | Phase 2 | Implemented | `reviews` & `review_dimensions` |
| **SRV-06** | Off-platform recommendations labelled and excluded from verified-transaction average | Phase 1/2 | Implemented | `recommendations` separated from verified `reviews` average |
| **SOC-01** | Dedicated Social Service tab with "I need something" & "I have something to offer" across all 7 modes | Phase 2 | Implemented | `/social-service` requests, giveaways, sales, loans, rentals, swaps, volunteer help |
| **SOC-02** | Complete listing attributes (condition, quantity, dates, event date, deposit, handover options, expiry) | Phase 2 | Implemented | `exchange_listings` schema & creation form |
| **SOC-03** | Seeded realistic examples (event chairs, sofa giveaway, study table sale, sound system rental, book swap, setup help) | Phase 2 | Implemented | Included in deterministic seed data |
| **SOC-04** | Private responses/negotiation; accepting one counterparty hides others; atomic quantity allocation / waitlist | Phase 2 | Implemented | `listing_responses` & quantity reservation check |
| **SOC-05** | Versioned `exchange_agreements` snapshot confirmed by both participants before acceptance | Phase 2 | Implemented | `exchange_agreements` versioned JSONB & dual confirmation |
| **SOC-06** | Record handover with participant confirmation, condition reports, due dates, extension requests, return confirmation | Phase 2 | Implemented | `condition_reports` & `return_extensions` |
| **SOC-07** | Full exchange state machine (`proposed` -> `accepted` -> `handover_pending` -> `active` -> `return_pending` -> `completed` / `overdue` / `disputed`) | Phase 2 | Implemented | Enforced in server state machine |
| **SOC-08** | Gifts/sales complete at handover; loans/rentals complete at return/dispute resolution; swaps track both sides; blocking preserves active transactions | Phase 2 | Implemented | Tested in automated exchange workflow suite |
| **SOC-09** | Payment/deposit tracked separately as `agreed`, `reported`, and `confirmed`; no false escrow claim | Phase 2 | Implemented | Explicit deposit/payment status badges |
| **SOC-10** | Prohibited item policy (no peer-to-peer medicine exchange); home unit private until agreed handover | Phase 2 | Implemented | Server policy validation blocks medicine/prohibited keywords |
| **REP-01** | Reviews require concrete `review_eligibility` record; no self-review; unique per reviewer/subject/interaction | Phase 2 | Implemented | DB `CHECK (reviewer_id <> subject_id)` & `UNIQUE` constraint |
| **REP-02** | 1-5 stars + factual text across communication, reliability, terms fulfilment, timeliness, care/return condition | Phase 2 | Implemented | Stored in `reviews` & `review_dimensions` |
| **REP-03** | Eligibility opens on completion OR post-handover overdue/dispute so counterparty cannot block feedback | Phase 2 | Implemented | Automatic `review_eligibility` creation on completion or post-handover dispute/overdue |
| **REP-04** | 14-day blind review window; hidden from counterparty until both submit or window expires | Phase 2 | Implemented | `is_published` trigger/server logic + RLS filter |
| **REP-05** | Separate member exchange vs provider service averages; "No reviews yet" for zero; never mixes complaints/CCTV/finance | Phase 2 | Implemented | Isolated aggregation queries |
| **REP-06** | Per-dimension averages with counts; newcomers not penalised or blocked by minimum score | Phase 2 | Implemented | Profile reputation card shows dimension counts & recency |
| **REP-07** | Factual negative feedback, subject response, reporting/appeal, audited moderator redaction | Phase 2/3 | Implemented | `review_responses`, `review_reports`, `audit_events` |
| **REP-08** | Repeated-pair rate limiting & suspicious inflation flagging for moderator review | Phase 2 | Implemented | Server check flags >2 reviews between same pair in 30 days |
| **HELP-01** | Everyday assistance requests (maid/driver search, parcel help, lost items); links item loans to Social Service | Phase 2 | Implemented | `/help-complaints` Help tab with Social Service deep-link |
| **HELP-02** | Category, description, area, timing, photos, community-visible vs admin-only visibility | Phase 2 | Implemented | `help_requests.visibility_scope` RLS enforced |
| **HELP-03** | Lifecycle (`open` -> `responding` -> `arranged` -> `completed` / `closed` / `withdrawn`), replies & helpfulness eligibility | Phase 2 | Implemented | `help_requests` & `request_responses` |
| **CASE-01** | Water, electricity, waste, cleanliness, drainage, roads, maintenance complaints with privacy choice | Phase 1 | Implemented | `complaints` table & form |
| **CASE-02** | Reference generation, scoped sub-admin routing, full status lifecycle (`submitted`..`resolved`, `externally_forwarded`, `reopened`) | Phase 1 | Implemented | `complaints.case_reference` & state transitions |
| **CASE-03** | Case owner, timeline (`case_events`), next action, internal follow-up date, attachment permissions | Phase 1 | Implemented | Timeline & scoped sub-admin assignment |
| **CASE-04** | Link duplicate complaints to `shared_issues` while preserving private original records and individual consent | Phase 1/3 | Implemented | `shared_issues` & `complaint_issue_links` |
| **CASE-05** | Authority contact registry with verification date; consented redacted escalation package; distinct `prepared`/`submitted`/`acknowledged`/`resolved` states | Phase 3/5 | Implemented | `authority_contacts` & `escalation_records` |
| **CASE-06** | Honest external escalation adapter (no fake official receipt); resident closure challenge | Phase 3/5 | Implemented | Explicit manual docket recording + resident reopen/challenge action |
| **EVT-01** | Immediate/scheduled notices by audience (community-wide, building, role), expiry, acknowledgement tracking | Phase 1/3 | Implemented | `announcements`, `audience_rules`, `acknowledgements` |
| **EVT-02** | Community events with capacity, RSVP, cancellation updates, and linked Social Service item/volunteer requests | Phase 3 | Implemented | `events` & `event_rsvps` |
| **EVT-03** | Unified notification centre linking to orders, messages, exchanges, reviews, complaints, events, SOS | Phase 1/3 | Implemented | Header notification drawer & `/account` notifications |
| **EVT-04** | In-app baseline + outbox tracking (`queued`, `provider_accepted`, `failed`, `acknowledged`); sent != read | Phase 3/4 | Implemented | `notifications`, `notification_deliveries`, `outbox_jobs` |
| **EVT-05** | Notification preferences, quiet hours, and privacy-safe previews (redacts medicine/allegations/exact units) | Phase 3 | Implemented | Server preview sanitiser & preferences |
| **SOS-01** | Persistent accessible SOS action (lift entrapment, fire/smoke, accident/injury, suspected theft, other) | Phase 4 | Implemented | Persistent SOS modal & `/safety` screen |
| **SOS-02** | Hold-to-send confirmation + manual building/floor/lift number entry (never infers floor from GPS) | Phase 4 | Implemented | Accessible hold button & explicit floor/lift fields |
| **SOS-03** | Persist incident first; notify on-duty responders (full detail) and publish sanitised community alert | Phase 4 | Implemented | Split responder vs community projection |
| **SOS-04** | Sanitised community alert shows only category, approximate area, time, and safe guidance; building-targeted follow-ups | Phase 4 | Implemented | RLS hides sensitive reporter notes/exact unit from general members |
| **SOS-05** | Statuses (`raised`, `responder_acknowledged`, `responder_en_route`, `assistance_arrived`, `resolved`, `accidental_cancelled`) | Phase 4 | Implemented | Responder timestamped state transitions |
| **SOS-06** | Prominent delivery failure / unacknowledged banner; 30s escalation reminder & deduplicated retry outbox | Phase 4 | Implemented | Unacknowledged timer & outbox visibility |
| **SOS-07** | Direct call actions for configured security/emergency contacts; clear non-guaranteed monitoring disclaimer | Phase 4 | Implemented | Configured `tel:` actions + mandatory safety notice |
| **SOS-08** | Explicit "Alert not sent" fallback on network error; accidental cancellation broadcasts correction & audits | Phase 4 | Implemented | Error state handling & `accidental_cancelled` audit event |
| **SOS-09** | Flood/duplicate protection returns existing active incident rather than dropping or duplicating | Phase 4 | Implemented | Idempotent active-incident check per member/category |
| **STF-01** | Staff profiles, employer/team, assigned building/post, shifts, attendance check-in/out, tasks, patrol checkpoints | Phase 4 | Implemented | `/workspaces/staff` & `staff_profiles`/`shifts`/`tasks` |
| **STF-02** | Foreground location sharing requires notice, device permission, visible active badge, active shift, and purpose | Phase 4 | Implemented | `location_sharing_sessions` consent enforcement |
| **STF-03** | Map/list shows only permitted on-duty staff; server withholds exact coordinates when viewer grant is `approximate` | Phase 4 | Implemented | Server projection strips `lat`/`lng` for approximate grants |
| **STF-04** | Granular `location_grants` (subject, viewer role/user, purpose, precision, expiry, history flag) | Phase 4 | Implemented | Admin security grant manager |
| **STF-05** | Collection stops on shift end, consent withdrawal, or revocation; latest position only by default | Phase 4 | Implemented | Immediate session termination & RLS read block |
| **STF-06** | 30-60s foreground update cadence; marks location `stale` after 2 minutes without update | Phase 4 | Implemented | Computed `is_stale` indicator & timestamp priority |
| **STF-07** | Explicit documentation of browser/PWA foreground limits; demo simulation clearly badged | Phase 4 | Implemented | Banner & `[DEMO SIMULATED SHIFT]` indicator |
| **CCTV-01** | Common-area camera inventory with building, area, system type, online state, privacy designation | Phase 5 | Implemented | `cameras` & `camera_groups` (common areas only) |
| **CCTV-02** | Per-camera/area grants to roles or individuals with expiry; separate `live`, `playback`, and `export` permissions | Phase 5 | Implemented | `camera_grants` table & permission validator |
| **CCTV-03** | Server-authorised short-lived playback sessions (<= 60s TTL) with start/end/access logging in `camera_access_events` | Phase 5 | Implemented | `camera_sessions` 60s token & audit trail |
| **CCTV-04** | Camera credentials & internal endpoints isolated in `camera_secrets`; host allowlist validation | Phase 5 | Implemented | `camera_secrets` inaccessible to client roles |
| **CCTV-05** | External NVR/VMS gateway adapter architecture (no RTSP transcoding on Vercel routes) | Phase 5 | Implemented | Scoped gateway adapter contract |
| **CCTV-06** | Honest offline/unsupported states and watermarked `[DEMO SAMPLE FEED — NOT LIVE CCTV]` mode | Phase 5 | Implemented | Clear watermark & adapter state banner |
| **CCTV-07** | Recording export disabled by default unless explicit export grant + retention policy exists | Phase 5 | Implemented | Server rejects export without explicit `export` grant |
