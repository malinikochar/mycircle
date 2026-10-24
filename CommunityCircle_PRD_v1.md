# CommunityCircle — Product Requirements Document

**Version:** 1.0  
**Date:** 24 October 2026  
**Status:** Build specification; no implementation or integrations are claimed complete.  
**Working name:** CommunityCircle; brand/domain availability has not been checked.  
**Target:** One private community with up to 1,000 registered resident accounts and at least 10 supported sub-admin accounts.  
**Build environment:** Antigravity 2.0 as the development assistant; GitHub repository; Supabase backend; Vercel deployment.

## 1. Executive summary

CommunityCircle is a mobile-first private community application that combines resident profiles and discussions, nearby shopping, local service discovery, mutual help and item exchanges, transaction-based reviews, announcements, complaints, emergency coordination, and permission-controlled security information.

Residents should be able to find people and local expertise, order essentials, offer or request items, borrow equipment for an event, recommend a provider, follow a complaint, and obtain urgent community assistance. Administrators delegate operations to sub-admins. Shops, providers, and security staff receive separate workspaces with narrowly scoped access.

The product vision includes all modules in this document. Implementation is phased; a phase boundary does not remove a requirement. Features that depend on external systems must be labelled unavailable or simulated until actually integrated. This is not a guarantee of emergency response, delivery speed, provider quality, or hackathon success.

## 2. Goals, scope, and assumptions

### Goals

- Make daily community information and services easy to find in one place.
- Support local businesses without exposing unrelated resident information.
- Enable borrowing, giveaways, paid exchanges, and help between residents.
- Provide useful, transaction-linked member and provider reputation.
- Give complaints, requests, and emergencies identifiable ownership and status.
- Share administration across at least ten delegates with configurable permissions.
- Make staff location and common-area CCTV access explicit, limited, and auditable.

### Initial assumptions

- One community, multiple buildings, INR amounts, Asia/Kolkata display timezone, UTC storage timestamps.
- 1,000 registered members is a design target, not a claim of 1,000 concurrent sessions.
- One user can hold multiple roles, but must deliberately switch workspaces. Permissions never merge into unrestricted access.
- All community-owned records carry a community identifier, allowing later expansion without launching multi-community SaaS billing now.
- Membership is invitation/request based with administrator approval. Pending and suspended members cannot browse private community data.
- Pay on delivery/direct merchant payment initially. Payment collection, settlement, refunds, and escrow require separate integrations.
- English interface first, translation-ready Hindi and Marathi strings; do not label incomplete translations as fully supported.

### Explicit exclusions from initial live operation

- Guaranteed three-minute delivery or guaranteed emergency attendance.
- Automated diagnosis, prescription approval, or medicine substitution.
- Silent or continuous off-duty location tracking.
- Public access to resident directories, camera feeds, or transaction histories.
- Claimed official government complaint delivery without a verified submission channel.
- Face recognition, public-person tracking, or public ranking of residents by personal worth.

## 3. Roles and permission model

Access is deny-by-default and enforced in database policies and server actions. UI visibility is not a security boundary. A permission has a module, action, scope, issuer, and optional expiry.

| Role | Main permissions | Key restrictions |
|---|---|---|
| Community admin | Membership, role assignment, shop approval, module configuration, announcements, operational reports, security grants | No automatic access to prescriptions, private chats, unrelated purchases, or unrestricted exports |
| Sub-admin | Only assigned modules, buildings, cases, and actions | Cannot self-promote or grant authority beyond their own scope |
| Resident | Own profile/private records; approved community content; shopping, exchanges, requests, reviews, complaints, events | No other member's private orders, address, contact fields, or confidential cases |
| Shop owner/staff | Own shop catalogue, orders, invoices, fulfilment details, ledger | No resident directory, other shops, general community feed, or unrelated complaints |
| Provider | Own listing and assigned enquiries/bookings; respond to own reviews | No unrelated directory or customer records |
| Security/staff | Assigned shifts, tasks, incidents, and explicitly allowed location/camera views | No blanket resident access; no viewing others' location by job title alone |
| External authority | No account by default; later explicit shared-case access only | No browsing of community data |

Support ten or more active sub-admins without requiring ten filled seats. Examples: membership, moderation, events, water, electricity, cleanliness, civic escalation, commerce support, local services, safety. Revocation must affect database, attachment, realtime, camera, and location access. Privileged operations require stronger authentication where supported. Never allow deletion of the last primary administrator without ownership transfer.

Separate publicly shareable profile fields from private contact details. Community-visible means approved members only, not the public internet. A vendor who is also a resident receives vendor access in the shop workspace and resident access through their independently approved membership.

## 4. Information architecture and visual direction

### Resident destinations

| Area | Screens |
|---|---|
| Home | Current notices, active orders/requests, upcoming events, quick actions |
| Community | Feed, posts, groups, member directory, member profiles, messaging, events |
| Shops | Shop directory, shop page, catalogue, cart, checkout, order detail, invoice history |
| Services | Provider search, provider profile, enquiry/booking, service reviews |
| Social Service | Requests, offers, giveaways, sales, loans, rentals, swaps, my exchanges |
| Help & Complaints | Help requests, complaint submission, case timeline, shared issues |
| Safety | SOS, own incidents, authorised staff map, permitted camera list |
| Account | Profile, privacy, activity, ratings, notifications, saved items, settings |

Use Home, Community, Shops, Social Service, and More as a compact mobile bottom bar; More exposes the other destinations. Desktop uses a sidebar. SOS, global search, and notifications remain easy to reach without covering primary content. Provide separate admin, shop, provider, and staff workspace navigation.

Design direction: warm neutral background, deep navy text/navigation, teal primary actions, amber attention states, red reserved for urgent/error states. Use large readable type, consistent cards, clear badges, useful empty states, restrained motion, and strong contrast. Avoid a dense dashboard of unrelated statistics or an ornamental 3D landing page. Make the working product the centre of the experience.

Forms must support validation, draft preservation where appropriate, error recovery, loading indicators, and accessible focus management. Target WCAG 2.2 AA practices, keyboard use, screen-reader labels, text equivalents for icons, and reduced motion; validate rather than claiming certification. Location maps and camera interfaces must have descriptive list alternatives where applicable.

## 5. Functional requirements

### MEM — Membership, profiles, and search

- **MEM-01:** Invite or request membership; verify authentication; approve, reject with reason, suspend, reactivate, and revoke membership.
- **MEM-02:** Maintain display name, optional photo, introduction, interests, profession, skills, business name/category/description, services offered, optional business links and contact channels.
- **MEM-03:** Collect necessary account/contact and building/unit details privately. Provide per-field community visibility settings; exact residential unit and personal phone are hidden by default.
- **MEM-04:** Search approved members by visible name, profession, skills, business, and service category. Apply pagination and optional building filter only where building visibility permits it.
- **MEM-05:** Profiles display published transaction ratings, review counts, recommendations, and completed-interaction counts without exposing transaction contents or counterparties' private details.
- **MEM-06:** Private account includes orders, invoices, exchanges, cases, saved providers, notifications, privacy controls, and membership exit request.
- **MEM-07:** Search indexes, suggestions, result counts, exports, and API responses must respect the same access rules as direct profile reads. Do not support phone-number enumeration or bulk resident scraping.

### COM — Social interaction

- **COM-01:** Community-only text/photo posts, comments, saved posts, and category filters: general, celebrations, lost and found, recommendations, help, and local information.
- **COM-02:** Clearly distinguish official announcements from member opinions. Pinned notices expire.
- **COM-03:** Building and interest groups have explicit membership and moderation policies. Private messaging supports message requests, blocking, and reporting.
- **COM-04:** Transaction conversations are available before general chat and remain linked to their order, request, or exchange. Only participants and explicitly authorised support reviewers may read them.
- **COM-05:** Moderation records reasons, actor, action, and appeal route. Administrators cannot silently edit members' statements.

### SHOP — Commerce and vendor accounts

- **SHOP-01:** Admin approves shops and service areas. Shop profiles include business details, hours, delivery availability, minimum order, delivery fees, and confirmed service windows.
- **SHOP-02:** Shop owners invite restricted staff and manage only their own products, pack/unit sizes, images, prices, and stock state.
- **SHOP-03:** Residents search products, add items to a single-shop cart, review charges, select delivery details, and place an order.
- **SHOP-04:** Validate ownership, prices, quantities, stock, and totals on the server. Store immutable order-line snapshots. Make submission idempotent and stock reservations transactional where stock is tracked.
- **SHOP-05:** Shop accepts/rejects and confirms delivery estimate. Changed prices, weight estimates beyond the agreed tolerance, or substitutions require buyer approval.
- **SHOP-06:** Statuses: submitted, awaiting buyer approval, accepted, preparing, out for delivery, delivered; branches rejected, cancelled, disputed. Only authorised actors can make allowed transitions.
- **SHOP-07:** Vendors receive an order-specific projection of buyer name, required delivery address/contact, and relevant instructions. They cannot search all residents or retain a marketing directory from orders.
- **SHOP-08:** Order messages, receipts, history, reordering, cancellation reasons, and delivery/problem confirmation are supported.
- **SHOP-09:** Invoices include seller identity, reference, date, itemised prices, charges, seller-configured tax fields where applicable, and totals. Issued invoices retain history; corrections create traceable adjustments or revisions.
- **SHOP-10:** Vendor ledger shows sales, unpaid balances, recorded payments, adjustments, and shop-only export. Separate order status from payment status. A screenshot is evidence to review, not automatic proof of settlement.
- **SHOP-11:** Real pharmacy fulfilment remains gated. Prescription files are accessible only to the buyer and explicitly authorised pharmacy staff; generic admin/support roles cannot read them. No automatic treatment advice or substitution.

### SRV — Services and recommendations

- **SRV-01:** Directory includes electricians, plumbers, maids, cleaners, drivers, salons, tutors, repair specialists, and configurable categories.
- **SRV-02:** Distinguish member-recommended listings from provider-managed profiles. Obtain permission before publishing a provider's personal contact/photo.
- **SRV-03:** Provider pages include description, service area, availability, optional indicative pricing, recommendations, review counts, and enquiry action. An approval badge states what was checked; it does not imply professional vetting.
- **SRV-04:** Record enquiry, provider response/quote, acceptance, scheduled work, service outcome, cancellation, or dispute. Deposits and payouts are later integrations.
- **SRV-05:** Ratings cover quality, punctuality, communication, and adherence to agreed pricing. Users can review an eligible recorded service interaction; provider can respond and appeal abuse.
- **SRV-06:** Off-platform recommendations are labelled as such and excluded from the verified-transaction average unless a documented verification process establishes eligibility.

### SOC — Dedicated Social Service tab

- **SOC-01:** Two prominent actions: “I need something” and “I have something to offer.” Browse requests, free giveaways, sales, lending/borrowing, rentals, swaps, and help/time offers.
- **SOC-02:** Listings contain owner, title, description, category, photos, condition, quantity, availability dates, event date if relevant, free/price/rental terms, proposed deposit if applicable, collection/delivery options, and expiry.
- **SOC-03:** Example use cases: borrow chairs for an event, give away a sofa, sell a study table, rent a sound system, swap books, or volunteer event setup assistance.
- **SOC-04:** Members respond, ask questions, and negotiate privately. Listing owners choose a counterparty; accepting one offer does not expose other respondents' details. Support quantity allocations or a waitlist where multiple units exist.
- **SOC-05:** Before acceptance, both participants confirm item, quantity, condition, dates, price/deposit, handover, return, and responsibility terms. Store a versioned agreement snapshot; changes require agreement again.
- **SOC-06:** Record handover with participant confirmation and optional condition photos. Borrowing/rental records include due date, extension requests, reminders, return initiation, and condition confirmation.
- **SOC-07:** Statuses: proposed → accepted → handover pending → active → return pending when applicable → completed. Branches: rejected, cancelled, overdue, disputed. An overdue computed state does not itself prove misconduct.
- **SOC-08:** Gifts/sales complete at confirmed handover; loans/rentals complete after return or documented dispute resolution; swaps track both sides' handovers. Blocking a user must not erase an active transaction or remove a route to resolve it.
- **SOC-09:** Show payment/deposit as agreed, reported, and confirmed separately. Initially payments are arranged directly; do not imply platform escrow or compensation guarantees.
- **SOC-10:** Restrict prohibited/unsafe items using an administrator-maintained listing policy. Do not enable peer-to-peer medicine exchange. Keep exact home locations private until needed for an agreed handover.

### REP — Transaction-linked reputation

- **REP-01:** Every approved member can receive reviews from eligible recorded interactions, including help and item exchanges. No rating without an eligible relationship; no self-review; one review per reviewer/subject/interaction.
- **REP-02:** Member dimensions: communication, reliability, fulfilment of agreed terms, timeliness, and care/return condition when applicable. Use 1–5 stars plus factual written feedback; lower ratings represent negative experiences.
- **REP-03:** Eligibility opens after recorded completion, or after a recorded handover followed by overdue/disputed status. A party cannot block all feedback by refusing completion. Cancelled-before-handover no-shows require reviewable evidence of an accepted arrangement; casual enquiries are ineligible.
- **REP-04:** Proposed default: 14-day review window from eligibility. Hide each review from the counterparty until both submit or the window ends. Notify participants of eligibility and publication; edits before publication are versioned, later corrections are auditable.
- **REP-05:** Display mean overall rating and review count separately for member exchanges and provider services. Average only published eligible reviews; show “No reviews yet” for zero. Do not combine private financial history, complaints, location, or CCTV observations into a credibility score.
- **REP-06:** Show dimension averages with their own counts because some dimensions are not applicable. New members are not treated as low-quality; count and recency remain visible alongside averages. Do not impose a hard minimum score that prevents newcomers from participating.
- **REP-07:** Allow factual negative feedback, subject response, reporting, and appeal. A dispute does not automatically remove a negative review. Moderators can redact private information or remove policy violations with a reason and audit history; participants cannot buy removal.
- **REP-08:** Detect repeated/duplicate interactions intended to inflate ratings, rate-limit reviews, and flag suspicious patterns for human review. Do not claim that a star average guarantees trustworthiness.

### HELP — Assistance requests

- **HELP-01:** Requests cover finding a maid/driver, seeking a local professional, lost items, parcel help, and other everyday assistance. Item acquisition/loans link to Social Service rather than duplicating its transaction model.
- **HELP-02:** Capture category, description, approximate area, timing, optional photos, and community-visible or admin-only visibility.
- **HELP-03:** Open → responding → arranged → completed/closed; support expiry, withdrawal, replies, provider recommendations, and eligible helpfulness feedback.

### CASE — Complaints and civic follow-up

- **CASE-01:** Water, electricity, waste, cleanliness, drainage, roads, building maintenance, and other configurable categories. Capture description, location, occurrence time, photos, and privacy choice.
- **CASE-02:** Generate case reference; route to responsible admin or queue. Statuses: submitted, needs information, triaged, assigned, in progress, resolution proposed, resolved; branches rejected with reason, externally forwarded, awaiting external response, reopened.
- **CASE-03:** Each case has owner, timeline, next action, internal follow-up date, attachment permissions, and resident updates.
- **CASE-04:** Admin can link duplicate cases to one shared issue after review; preserve private original records, consent, and individual notification subscriptions.
- **CASE-05:** Maintain authority contacts by jurisdiction/category with source and last verification date. Prepare a redacted, consented escalation package. Record manual official submission and reference; prepared, submitted, acknowledged, and resolved are distinct.
- **CASE-06:** Government/corporator/political-office access or automatic delivery requires an actual authorised integration. No unsupported official-receipt claim. Resident can challenge closure; staff can close unresponsive cases only with documented policy and reason.

### EVT — Announcements, events, and notifications

- **EVT-01:** Publish immediate or scheduled notices to all members, a building, or approved audience segment, with category, owner, expiry, and optional acknowledgement.
- **EVT-02:** Event pages include time, place, organiser, capacity, RSVP, changes, cancellation, and optional requests for items/volunteers linked to Social Service.
- **EVT-03:** Notification centre covers orders, messages, responses, exchanges, returns, review windows, complaints, events, and safety incidents. Link to the relevant record.
- **EVT-04:** In-app notifications are baseline. Push is opt-in; email/SMS/WhatsApp are separate adapters. Track queued, provider-accepted, failed, and acknowledged separately where supported. Do not equate “sent” with “read.”
- **EVT-05:** Preferences, digests, quiet hours, and narrowly defined urgent alert policy. Do not put medicine details, private allegations, or exact home addresses into broad notification previews.

### SOS — Emergency coordination

- **SOS-01:** Persistent accessible SOS action with categories lift entrapment, fire/smoke, accident/injury, suspected theft/security, and other urgent help.
- **SOS-02:** Use a brief hold-to-send or equivalent accessible confirmation to reduce accidents, not a long mandatory form. Allow manual building/floor/lift number when device location is denied or inaccurate. Do not infer floor from GPS.
- **SOS-03:** On activation, persist the incident before attempting notification delivery. Immediately notify designated on-duty responders and create a sanitised community-wide alert for active members. Full incident detail is restricted; membership approval must not delay an already authorised member's SOS.
- **SOS-04:** Community-wide alert contains category, approximate area, time, and safe next action. Exact personal location, medical details, and identities in suspected-theft reports go only to authorised responders. Administrators can target subsequent updates to affected buildings.
- **SOS-05:** Statuses: raised, responder acknowledged, responder assigned/en route, assistance arrived, resolved; alternatives accidental/cancelled. Acknowledgement identifies a responder and timestamp. Administrative closing is not proof emergency services attended.
- **SOS-06:** Show delivery failures and lack of acknowledgement prominently. Re-alert or escalate through configured channels after configurable intervals; suggested initial internal reminder is 30 seconds, not a response guarantee. Queue retries with deduplication and backoff.
- **SOS-07:** Provide a direct call action for verified local emergency/security contacts configured for the deployment; do not invent numbers. State clearly that the app supplements emergency channels and is not continuously guaranteed to be monitored.
- **SOS-08:** If network transmission fails, show “Alert not sent” and the calling alternative. Never display successful dispatch based only on a local animation. Accidental cancellation sends a correction and retains audit history.
- **SOS-09:** Optional time-limited incident location sharing, responder updates, incident attachment permissions, post-incident review, and abuse investigation. Protect the endpoint against floods without silently discarding a legitimate repeat emergency; return an existing active incident or explicit error.

### STF — Staff, security, and location

- **STF-01:** Staff profiles, employer/team, role, assigned building/post, duty roster, attendance, check-in/out, tasks, patrol checkpoints, and incident responsibilities.
- **STF-02:** Location sharing requires clear notice, device permission, visible sharing state, an active duty session, and an authorised purpose. The administrator can grant viewing access but cannot bypass device consent.
- **STF-03:** Map/list shows only permitted on-duty staff, last update, accuracy where available, duty status, and approximate location. Granular permission determines whether a viewer needs precise coordinates; never send precise data to a client and merely blur it visually.
- **STF-04:** Grants specify subject/group, viewer/role, purpose, precision, validity period, and whether history is permitted. Default residents see relevant duty availability, not everyone's live location. Individual residents can receive limited grants when justified.
- **STF-05:** Stop collection on shift end, sharing withdrawal, or membership revocation. Revocation removes subsequent reads and subscriptions. Historical retention default proposal: latest position only for routine use; optional incident/patrol history up to seven days after an explicit approved policy. Do not retain indefinite tracks by default.
- **STF-06:** Suggested foreground update interval is 30–60 seconds when moving; throttle and adapt for battery/network. Mark stale after two minutes without update. Timestamps are more authoritative than a moving icon.
- **STF-07:** A browser/PWA cannot be assumed to provide reliable continuous background tracking on every device. Document foreground limitations; consider a later consent-based native/managed-device integration if continuous duty tracking is required. Do not fake movement in live mode.

### CCTV — Permission-controlled common-area cameras

- **CCTV-01:** Maintain community-authorised camera inventory: area, building, owner/system, integration type, online state, and privacy designation. Common areas only; no private homes or inappropriate private spaces.
- **CCTV-02:** Admin grants view access per camera/area to roles or individuals, with expiry. Live view, playback, and export are separate permissions. Default member has none.
- **CCTV-03:** Authorise each session server-side; issue short-lived scoped playback access and log start/end/access events. Revoke active sessions through the adapter when supported and limit token lifetime so revocation is bounded; target no more than 60 seconds of residual access.
- **CCTV-04:** Keep camera credentials and network endpoints off clients and out of GitHub. Never expose a permanent raw camera URL. Validate configured endpoints against an approved network/host policy rather than accepting arbitrary user URLs.
- **CCTV-05:** Integration uses an authorised NVR/VMS or gateway capable of browser-compatible streams. Do not assume Vercel can ingest RTSP, transcode streams, or act as a long-running camera server. Video infrastructure is a separate dependency.
- **CCTV-06:** Show offline/unsupported states. Demo mode uses clearly labelled synthetic or authorised sample footage; no claim that a public street camera is connected.
- **CCTV-07:** Recording access and exports are disabled initially unless an explicit retention and access policy exists. Watermarks/access logs can deter misuse but cannot guarantee prevention of screenshots or screen recording.

## 6. Data architecture

Use relational records with foreign keys, explicit ownership, UTC timestamps, and audit events. Prefer enums or constrained values for states and actions. Money uses integer paise or a suitable fixed decimal, never floating-point currency calculations.

| Domain | Entities and essential relationships |
|---|---|
| Identity | communities, buildings, profiles, private_contacts, memberships, role_grants; membership links user/community/building |
| Profiles/search | professional_profiles, business_profiles, profile_visibility; index only visible approved fields |
| Social | posts, comments, groups, group_memberships, conversations, conversation_members, messages, moderation_reports |
| Commerce | shops, shop_memberships, products, orders, order_items, order_events, invoices, invoice_revisions, ledger_entries |
| Services | providers, provider_memberships, service_categories, recommendations, service_enquiries, service_bookings |
| Exchange | exchange_listings, listing_responses, exchange_agreements, exchange_participants, exchange_events, condition_reports, return_extensions |
| Review | review_eligibility, reviews, review_dimensions, review_responses, review_reports; eligibility references a concrete order/booking/exchange/help interaction |
| Assistance/civic | help_requests, request_responses, complaints, shared_issues, complaint_issue_links, case_events, authority_contacts, escalation_records |
| Notices/events | announcements, audience_rules, acknowledgements, events, event_rsvps |
| Safety | incidents, incident_events, incident_responders, incident_alert_deliveries |
| Staff/location | staff_profiles, shifts, attendance, tasks, patrol_checkpoints, location_sharing_sessions, current_locations, location_grants, optional_location_history |
| Cameras | cameras, camera_groups, camera_grants, camera_sessions, camera_access_events; secrets held outside ordinary client-readable tables |
| Operations | attachments, consent_records, audit_events, notifications, notification_deliveries, outbox_jobs, integration_settings |

Important constraints: unique active community membership per user; valid shop ownership on order lines; unique reviewer/subject/interaction review; no reviewer equals subject; accepted exchange allocations cannot exceed available quantity; one current location per active sharing session; foreign keys for eligibility rather than arbitrary unverifiable text IDs.

Private attachments use private storage policies. Community photos are also private to membership. Attachments record owner, parent resource, classification, file type/size, and retention state. Access cannot be granted merely by knowing an object path. Avoid long-lived signed URLs for highly sensitive files and revoke/expire access according to documented limits.

## 7. Server operations and integration contracts

Exact framework route syntax is an implementation choice. Provide equivalent typed server operations:

| Operation | Required checks |
|---|---|
| Approve membership / grant role | Admin scope, last-owner protection, audit |
| Search directory | Active membership, field visibility, pagination/rate limits |
| Place order / change state | Shop/participant ownership, validated total, legal transition, idempotency |
| Accept exchange / confirm handover / return | Participant identity, agreement version, allocation, evidence access |
| Submit/publish review | Eligibility, review window, uniqueness, anti-self-review, publication policy |
| Assign/link/escalate complaint | Scope, consented disclosure, state and audit |
| Raise/acknowledge SOS | Membership/respondent role, deduplication, minimal-data audience, delivery records |
| Begin/publish/end location | On-duty sharing session, device user ownership, active consent, viewer grants |
| Request camera session | Camera grant, expiry, server-held credential, audit |
| Publish announcement | Audience scope, privilege, queued deliveries |

Use an outbox/job mechanism so record creation and notification scheduling are reliable. Provider failures should not erase an order or incident. Add retry/backoff, idempotency, and operational visibility for pending/failed jobs. A local mocked adapter must never return a production-looking “officially delivered” state.

Adapters: notifications; optional payments; optional authority submission; pharmacy review workflow; device location; camera streaming. Each has configured, unavailable, demo, and failed states. Show these honestly in UI and documentation.

## 8. Technical and operational requirements

- Next.js and TypeScript frontend/server layer; select supported package versions during implementation and pin them in the lockfile.
- Supabase Auth, Postgres, RLS, private Storage, and scoped Realtime where useful. Do not expose the service-role key or trust client-supplied community/shop/user ownership.
- Vercel for web deployment with GitHub source and preview deployments. Long-running video handling lives in suitable external infrastructure.
- Schema migrations, repeatable synthetic seed data, .env.example without secrets, setup README, and environment separation.
- Verify current official documentation before choosing version-sensitive APIs. Do not assume Antigravity, GitHub, Supabase, or deployment credentials are connected.
- Pagination, indexed community/shop/owner/status lookups, bounded uploads, image compression, query limits, and rate limits on search/messages/uploads.
- Realtime subscriptions are scoped to permitted active views. Re-authorise when roles are revoked; test realtime and storage separately from ordinary table reads.
- Sensitive mutations run server-side with permission checks; validate all input and protect sessions against cross-site misuse. Redact sensitive payloads from logs.
- Monitoring for errors, failed notifications, active incidents without acknowledgement, suspicious access, and camera/location adapter failures.
- Backup and restore procedure, documented retention choices, account exit/deletion handling, and ownership succession before real operation.
- Installable PWA is optional. Cache a non-sensitive shell only; do not silently cache prescriptions, camera frames, location histories, or shared-device private data. Offline mode must not falsely confirm an order or SOS.

### Proposed performance targets, to be measured

Seed 1,000 synthetic members and representative content. Test 50 concurrent browsing sessions and bursts of orders and SOS notification fan-out. Agree actual peak load during pilot. Target p95 ordinary API reads under one second and a usable main screen within three seconds on the documented mobile test connection. Measure notification queue latency separately from provider delivery and human acknowledgement. These targets are not achieved claims.

## 9. Build phases and dependencies

| Phase | Scope | Exit gate |
|---|---|---|
| 0 — Foundation | Repository inspection, routes, design system, Auth, memberships, scoped roles, schema/RLS, seed demo users | Cross-role isolation works; no fake backend actions |
| 1 — Daily community | Profiles/professions/business search, notices, directory/recommendations, complaints with assignment, one shop order/invoice path | Resident → shop/admin → resident journeys persist and pass tests |
| 2 — Mutual help and reputation | Social Service listings, agreements, handover/return, help requests, review eligibility/publication, provider outcome reviews | Borrow/return and giveaway/sale examples work; non-return can enter dispute/review flow |
| 3 — Interaction and operations | Feed/photos/comments, events, groups/chat, ledger, moderation, targeted notifications | Privacy and notification failure tests pass |
| 4 — Safety and workforce | SOS and responder dashboard, staff roster/tasks, consented foreground location, granular location permissions | SOS delivery failure is explicit; location consent/revocation/stale states verified |
| 5 — CCTV and external services | Camera adapter with scoped sessions; optional messaging/payment/authority/pharmacy integrations | Real credentials, authorised environment, and operational review; otherwise explicitly demo/unconfigured |

All phases remain part of the requested product. If time is limited, deliver completed phases and a truthful status matrix rather than implying every screen is live. For a hackathon demo, a reliable cross-role flow plus one distinctive exchange/complaint workflow is preferable to numerous nonfunctional screens. SOS and CCTV demonstrations must clearly identify simulated data.

## 10. Acceptance tests and definition of done

### Permission and privacy

1. Pending/suspended members cannot read community data through UI, direct API, storage, search, or realtime.
2. Create at least ten scoped sub-admins; an events delegate cannot read private complaints or grant themselves security access.
3. Shop A cannot read Shop B's orders, and neither can enumerate members. A buyer can read only their own invoice.
4. Provider sees only assigned enquiries. Personal contact fields hidden from directory remain absent from search suggestions and network responses.
5. Prescriptions and sensitive case attachments are inaccessible to generic admins and unrelated vendors.
6. Revocation closes subsequent location/realtime access and bounds camera access by the session expiry policy.

### Transactions and reputation

7. Double-clicking checkout creates one order; changing a client price does not alter the server-calculated total.
8. Two simultaneous acceptances cannot allocate one available item twice.
9. Loan records agreed due date and condition; return closes the loan, overdue can enter dispute, and blocking does not erase it.
10. A nonparticipant/self-review is rejected; a completed eligible interaction can produce one review per side.
11. Reviews stay hidden until both submit or the window ends. An unresolved post-handover dispute does not prevent eligible feedback.
12. Provider and member averages are separate, count only eligible published reviews, and show no-review state correctly.

### Community and operations

13. A notice reaches only its audience; expiry removes its current prominence. Event cancellations update RSVPs.
14. Linked complaints retain separate private details. External submission cannot become acknowledged without recorded evidence.
15. Invoice revisions retain history. Payment confirmation and delivery status remain independent.

### Safety and monitoring

16. SOS creates a persisted incident, a restricted responder notification, and a sanitised community alert. Duplicate submission is handled without losing the incident.
17. Failed network/provider delivery shows failure or pending state, never responder acknowledgement. Accidental cancellation sends a correction.
18. Manual lift/floor entry works without geolocation. Staff location stops after shift end or consent withdrawal and becomes stale when updates stop.
19. A user without a camera grant cannot obtain a playback token; a live-view grant does not authorise recording export.
20. Demo camera/location/authority events remain visibly labelled and do not count as real response or impact.

### Release definition

Each completed phase includes responsive working screens, loading/empty/error states, accessible core navigation, validated persistence, authorised server operations, meaningful automated tests, and manual cross-role verification. Run formatting/lint, type checks, relevant tests, and production build. Record failures and limitations. Do not mark untouched phases complete.

## 11. Pilot metrics and validation

Begin with consenting households, two local shops, a small provider directory, named admins, and on-duty security contacts. Collect resident and shop feedback before claiming impact.

Track weekly useful actions, order fulfilment and estimate accuracy, answered requests, completed exchanges, on-time returns, review participation, dispute frequency, first complaint response, reopened cases, and announcement acknowledgement. For SOS, distinguish notification delivery, responder acknowledgement, and assistance arrival. Never mix synthetic demo counts with real pilot statistics.

Operational choices still needed: actual community; membership verification; shop delivery capacity; provider consent; dispute moderators; retention policy; staff duty/consent process; camera ownership and system; verified emergency contacts; external complaint jurisdiction; notification budget. These do not block building adapters and demo flows, but block claims that the corresponding real service is operational.

## 12. Required repository deliverables

- Application source and lockfile.
- Supabase SQL migrations, access policies, and synthetic seed scripts.
- .env.example and setup/deployment README.
- docs/IMPLEMENTATION_STATUS.md mapping requirement IDs to implemented, partial, planned, or blocked.
- docs/DECISIONS.md for assumptions and trade-offs.
- docs/PERMISSIONS.md for role, resource, storage, realtime, camera, and location rules.
- docs/TEST_REPORT.md containing executed checks and actual results.
- docs/INTEGRATIONS.md describing each real/demo/unconfigured adapter and setup needs.
- A deterministic, isolated demo route or environment with explicit labels; never hard-code publicly usable privileged production credentials.

## 13. Antigravity starter prompt

Copy the prompt below after placing this file in the project root as `CommunityCircle_PRD_v1.md`.

```text
You are my lead full-stack engineer and product designer. Build CommunityCircle using the attached/root CommunityCircle_PRD_v1.md as the authoritative specification. Read the entire PRD before changing code.

STACK AND ENVIRONMENT
- Use Next.js, TypeScript, Supabase Auth/Postgres/Storage/Realtime, GitHub, and Vercel. Verify current official documentation for version-sensitive APIs and pin supported package versions.
- Inspect the repository and available integrations first. Preserve existing work and follow repository instructions. Do not assume MCP connections, credentials, or deployment access exist.
- Use Antigravity for development assistance; runtime AI is optional and must not block core workflows.

PRODUCT SCOPE
Keep every PRD module in the roadmap: 1,000-member community, admin and at least 10 scoped sub-admins, profiles/professions/business search, social interaction, shops/orders/invoices/ledger, provider services and reviews, Social Service requests/offers/giveaways/sales/loans/rentals/swaps, transaction-linked member reputation, complaints and escalation, announcements/events, SOS, staff shifts and consent-based location, and permission-controlled common-area CCTV.
Do not replace the concept with a generic social feed or shopping template. Implement in the PRD's phases, with complete working vertical workflows.

FIRST ACTIONS
1. Inspect the repo and read the full PRD.
2. Create a short implementation plan, route map, schema plan, permission matrix, dependency checklist, and requirement status tracker in docs/.
3. State sensible assumptions and proceed. Ask only for genuinely blocking credentials, product decisions, or irreversible actions; continue independent work meanwhile.
4. Start Phase 0 and then Phase 1. Do not stop after producing a plan or attractive mockups. Continue through later phases as the session permits, preserving exact progress and next steps if interrupted.

DESIGN
Create a polished mobile-first working application: warm neutral surfaces, navy typography, teal actions, large readable text, consistent cards, restrained motion, strong accessible contrast, and excellent loading/empty/error states. Use the PRD navigation and distinct resident/admin/shop/provider/staff workspaces. Keep SOS accessible without accidental activation. Do not overload the home screen.

BACKEND AND PRIVACY
Use real migrations, foreign keys, server validation, RLS, private storage policies, and scoped realtime subscriptions. Enforce permissions at the data boundary, not just in UI. Separate private contacts from directory profiles. Vendors access only their shop and necessary order fulfilment details. Scope sub-admins by module/building/action. Never expose service-role keys, camera credentials, precise unauthorised locations, prescriptions, or real private data in code, logs, seeds, or GitHub.
Use validated server totals, transaction snapshots, idempotent order creation, safe item allocation, and explicit state transitions. Record review eligibility from real recorded interactions; separate member and provider ratings. Include negative feedback, overdue/dispute review eligibility, blind publication, and moderation/appeal rules from the PRD.

SAFETY AND EXTERNAL DEPENDENCIES
SOS must distinguish incident creation, notification delivery, responder acknowledgement, and assistance arrival; show failures honestly. Do not promise guaranteed response or invent emergency numbers. Location requires device permission, an on-duty session, viewer grants, expiry and stale indicators; do not claim reliable web background tracking without testing. CCTV needs an authorised external video adapter and short-lived scoped sessions; do not stream/transcode RTSP through ordinary Vercel routes. Government, pharmacy, payment, messaging, and camera integrations must be explicit adapters with live/demo/unconfigured states.
If credentials are missing, build a clearly labelled isolated demo adapter and document the blocker. Never simulate successful real payment, official receipt, live camera connection, or emergency attendance. Do not make live emergency calls, send real community alerts, track real staff, or access real cameras during development/testing.

QUALITY AND DELIVERY
For each phase, implement persistence and cross-role workflows before expanding surface area. Run lint, type checks, meaningful permission/state-transition tests, production build, and responsive UI checks. Test direct API, storage, realtime, search, location and camera isolation—not only buttons. Keep IMPLEMENTATION_STATUS.md, DECISIONS.md, PERMISSIONS.md, TEST_REPORT.md and INTEGRATIONS.md accurate.
Provide reproducible synthetic demo data, .env.example, README, migrations, and deployment instructions. Never commit secrets or claim checks that were not run. Prepare Vercel deployment when configured; follow the environment's permission rules for repository pushes and public publishing, and never overwrite an existing production project without explicit authorisation.
At the end, report completed requirement IDs, checks actually run, demo access method, genuine integration blockers, and the next incomplete phase. Clearly distinguish a working deployed feature from a planned or simulated one.

Begin now with repository inspection and Phase 0, then implement the first complete resident-to-shop/admin workflow.
```

## 14. Reference documentation

Implementation references; recheck current API details during development:

- Supabase RLS: https://supabase.com/docs/guides/database/postgres/row-level-security
- Supabase storage access: https://supabase.com/docs/guides/storage/security/access-control
- Supabase private buckets: https://supabase.com/docs/guides/storage/buckets/fundamentals
- Vercel Next.js: https://vercel.com/docs/frameworks/full-stack/nextjs
- Vercel Git deployments: https://vercel.com/docs/git

The PRD is a product build specification, not completed software, legal certification, a financial/accounting assurance, or a security audit.
