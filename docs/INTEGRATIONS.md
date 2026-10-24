# MyCircle — External Integrations & Adapter Status (v1.0.1)

> **App Version:** `1.0.1`  
> **App Developed By:** Malini Kochar  
> **App Demo Video:** [https://www.youtube.com/watch?v=jgpNHm1oluc](https://www.youtube.com/watch?v=jgpNHm1oluc)  
> **Hackathon Submission:** [Neighborhood Hacks 2026 (Devpost)](https://neighborhood-hacks-2026.devpost.com/)  
> **Repository:** [https://github.com/malinikochar/mycircle](https://github.com/malinikochar/mycircle)  

Per Section 7 and Section 12 of the PRD, every external dependency is encapsulated behind a typed adapter contract that exposes explicit operational states: `configured`, `demo`, `unavailable`, or `failed`.

> **Truthfulness Policy:** Demo/unconfigured adapters never claim an emergency was acknowledged by emergency services, never claim a municipal/civic portal officially received a complaint without manual submission evidence, never claim a payment gateway settled funds, and never claim a live RTSP camera is streaming when operating in demo mode.

---

## 1. Integration Matrix

| Adapter | Status in Current Environment | Implementation Details | Production Setup Requirements |
|---|---|---|---|
| **Supabase Auth, Postgres 17, RLS & Storage** | `configured` (Live) | Connected to Supabase project `mycircle` (`runquwuetzfivhwefenk`). Enforces RLS on all 55+ tables, private storage policies, and transactional server mutations. | Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (or `NEXT_PUBLIC_SUPABASE_ANON_KEY`). Optional `SUPABASE_SERVICE_ROLE_KEY` for server-only administrative/seed operations. |
| **Resend.com Transactional Email Service (`EVT-04`)** | `configured` (Live) | Integrated via Resend API key (`re_gt2L6Gio_...`). Delivers 7 responsive, branded HTML email templates for welcome emails, password resets, emergency SOS alerts, order status updates, and circular exchange agreements to `@ensure.in` recipients. | Provided via `RESEND_API_KEY` in environment variables. |
| **In-App Notification & Outbox Engine (`EVT-03..05`, `SOS-06`)** | `configured` (Live In-App) | Persists `notifications`, `notification_deliveries`, and `outbox_jobs` in Postgres with retry count, backoff, and distinct `queued`, `provider_accepted`, `failed`, and `acknowledged` states. | Fully functioning out-of-the-box in Postgres with real-time UI notification drawer. |
| **Payment & Settlement Adapter (`SHOP-09..10`, `SOC-09`)** | `demo` (Direct / Pay-on-Delivery) | Supports Pay-on-Delivery and Direct Merchant/Peer UPI arrangement with separate `agreed`, `reported`, and `confirmed` states. Payment screenshots are flagged as evidence to review, never automatic settlement. | Configure `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` + webhook secret for automated payment capture/escrow. |
| **Pharmacy Prescription Review (`SHOP-11`)** | `demo` (Gated Manual Pharmacist Workflow) | Prescriptions (`classification = 'prescription'`) are private to buyer and authorised pharmacy staff (`can_review_prescriptions = true`). Automated treatment advice and substitution are disabled. | Requires licensed pharmacy partner onboarding, verified pharmacist registration numbers, and signed compliance agreement before live medicine dispatch. |
| **Civic / Government Escalation Adapter (`CASE-05..06`)** | `demo` (Consented Redacted Package + Manual Reference Tracking) | Builds a redacted escalation package from linked complaints (`shared_issues`) with explicit resident consent records. Tracks `prepared`, `submitted`, `acknowledged`, and `resolved` separately. Requires manual official docket reference entry; never fabricates municipal receipt. | Connect authorised municipal Open311 / CPGRAMS / ward portal webhook credentials if granted by local civic authority. |
| **Device Foreground Location Adapter (`STF-02..07`)** | `configured` (Browser Geolocation API + Live Bugis MRT Simulator) | Uses browser `navigator.geolocation` only when staff user has an active shift (`on_duty`), explicit consent toggle enabled, and foreground tab active. Displays interactive Leaflet radar map centered at Bugis MRT, Singapore. Coordinates older than 120s are marked `stale`. | For continuous background patrol tracking, integrate a managed device MDM/native companion app; browser PWAs cannot guarantee background execution. |
| **Common-Area CCTV Gateway Adapter (`CCTV-01..07`)** | `demo` (Short-Lived Scoped Session + Labelled Synthetic Sample Feed) | Validates `camera_grants` (`live`, `playback`, `export`), logs `camera_access_events`, and issues a 60-second scoped session token. Because Vercel serverless routes cannot ingest RTSP or run long-lived transcoding, the adapter serves a clearly watermarked `[SIMULATED DEMO FEED — NOT LIVE CCTV]` canvas/video state unless an external WebRTC/HLS media gateway is configured. | Configure `CCTV_GATEWAY_URL` and `CCTV_GATEWAY_SIGNING_SECRET` pointing to an external MediaMTX / Frigate / cloud VMS gateway on an allowlisted host. |

---

## 2. Resend Transactional Email Templates

The app includes 7 responsive HTML email templates dispatching from `notifications@ensure.in`:

1. **Member Welcome & Verification:** Sent upon registration approval with temporary access credentials.
2. **Password Reset Request:** Secure one-time password reset link with 15-minute expiration.
3. **Emergency SOS Alert:** High-priority alert sent to registered emergency contacts and on-duty security responders with emergency location and direct call links.
4. **Order Placed & Confirmation:** Itemized breakdown of grocery/pharmacy orders.
5. **Buyer Price Adjustment Notice:** Actionable approval request when a shop owner modifies an item's weight or price.
6. **Social Service Exchange Agreement:** Mutual terms confirmation notice for peer item loans and volunteer assistance.
7. **Civic Complaint Docket Update:** Ticket status update when maintenance staff or sub-admins update a case.
