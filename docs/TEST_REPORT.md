# MyCircle — Acceptance & Verification Test Report (v1.0.1)

> **App Version:** `1.0.1`  
> **App Developed By:** Malini Kochar  
> **App Demo Video:** [https://www.youtube.com/watch?v=jgpNHm1oluc](https://www.youtube.com/watch?v=jgpNHm1oluc)  
> **Hackathon Submission:** [Neighborhood Hacks 2026 (Devpost)](https://neighborhood-hacks-2026.devpost.com/)  
> **Database:** Live Supabase Postgres 17 (`runquwuetzfivhwefenk` — `https://runquwuetzfivhwefenk.supabase.co`)  
> **Repository:** [https://github.com/malinikochar/mycircle](https://github.com/malinikochar/mycircle)  

---

## 1. Automated Verification Summary

| Command | Target | Result | Duration / Notes |
|---|---|---|---|
| `npm run typecheck` (`tsc --noEmit`) | Full TypeScript codebase (`src/**`) | **PASSED (Exit 0)** | Zero TypeScript errors across client and server |
| `npm test` (`vitest run`) | [`src/__tests__/acceptance.test.ts`](file:///d:/MyApp/MyCircle/src/__tests__/acceptance.test.ts) (23 Acceptance Tests) | **PASSED (23 / 23)** | ~12.7s total (live RPC queries against `runquwuetzfivhwefenk` + permission & workflow engine assertions) |
| `npm run build` (`next build`) | Next.js 16.4.3 App Router Production Build | **PASSED (Exit 0)** | Compiled with Turbopack; all dynamic routes & separated role workspaces verified |
| Supabase Security Advisor (`get_advisors(type="security")`) | Live Postgres 17 schema (`public.*`, `private.*`, `storage.*`) | **PASSED (`{"lints":[]}`)** | 0 errors, 0 warnings across 55+ tables & RLS policies |

---

## 2. Comprehensive Acceptance Test Matrix (Tests 1–23)

| # | Acceptance Requirement | Test Case in `src/__tests__/acceptance.test.ts` | Status |
|---|---|---|---|
| 1 | Pending/suspended members cannot read community data via UI, API, storage, search, or realtime | `Test 1: Membership Gate — blocks pending and suspended users on live Supabase RPC & permission engine` | **PASSED** |
| 2 | 10+ scoped sub-admins; events delegate cannot read private complaints or self-promote | `Test 2: Scoped Sub-Admin Isolation — 10 sub-admins are enforced by module and building scope` | **PASSED** |
| 3 | Contact privacy: personal phone & flat number are stripped in directory payloads unless opted in | `Test 3: Contact Privacy — personal phone & flat number are stripped in directory payloads unless opted in` | **PASSED** |
| 4 | Order integrity & idempotency: ignores tampered client prices and prevents duplicate orders | `Test 4: Order Integrity & Idempotency — ignores tampered client prices and prevents duplicate orders` | **PASSED** |
| 5 | Prescription privacy: private Rx attachment visible only to patient and fulfilling pharmacist | `Test 5: Prescription Privacy — private Rx attachment visible only to patient and fulfilling pharmacist` | **PASSED** |
| 6 | Order price/weight change approval: requires explicit buyer approval before fulfilment | `Test 6: Order Price/Weight Change Approval — requires explicit buyer approval before fulfilment` | **PASSED** |
| 7 | Service review eligibility & separation: off-platform recommendations excluded from verified average | `Test 7: Service Review Eligibility & Separation — off-platform recommendations excluded from verified average` | **PASSED** |
| 8 | Social Service agreement & atomic quantity allocation: prevents double allocation on last unit | `Test 8: Social Service Agreement & Atomic Quantity Allocation — prevents double allocation on last unit` | **PASSED** |
| 9 | Blind review window: keeps first review hidden until counterparty submits or 14-day window expires | `Test 9: Blind Review Window — keeps first review hidden until counterparty submits or 14-day window expires` | **PASSED** |
| 10 | Dispute review eligibility: pre-handover cancellation blocked; post-handover overdue/dispute unlocked | `Test 10: Dispute Review Eligibility — pre-handover cancellation blocked; post-handover overdue/dispute unlocked` | **PASSED** |
| 11 | Complaint duplicate linking: links cases into shared issue without exposing private reporter details | `Test 11: Complaint Duplicate Linking — links cases into shared issue without exposing private reporter details` | **PASSED** |
| 12 | Civic escalation honesty: demo or unverified submission cannot be marked acknowledged | `Test 12: Civic Escalation Honesty — demo or unverified submission cannot be marked acknowledged` | **PASSED** |
| 13 | Announcement expiry: expired announcements lose active prominence | `Test 13: Announcement Expiry — expired announcements lose active prominence` | **PASSED** |
| 14 | SOS alert separation: responder receives full unit/phone while resident receives sanitised guidance | `Test 14: SOS Alert Separation — responder receives full unit/phone while resident receives sanitised guidance` | **PASSED** |
| 15 | SOS responder ownership: authorised responder or safety sub-admin can acknowledge incident | `Test 15: SOS Responder Ownership — authorised responder or safety sub-admin can acknowledge incident` | **PASSED** |
| 16 | Staff location consent & shift boundary: off-duty or unconsented staff location is hidden | `Test 16: Staff Location Consent & Shift Boundary — off-duty or unconsented staff location is hidden` | **PASSED** |
| 17 | Staff location grant precision: approximate grant strips lat/lng on live Supabase RPC & engine | `Test 17: Staff Location Grant Precision — approximate grant strips lat/lng on live Supabase RPC & engine` | **PASSED** |
| 18 | Common-Area Camera Permission & Audit: denies ungranted camera and mints 60s token for granted camera | `Test 18: Common-Area Camera Permission & Audit — denies ungranted camera and mints 60s token for granted camera` | **PASSED** |
| 19 | Demo Adapter Honesty: unconfigured SMS/push/civic/camera adapters never fake live acknowledgment | `Test 19: Demo Adapter Honesty — unconfigured SMS/push/civic/camera adapters never fake live acknowledgment` | **PASSED** |
| 20 | Workspace Separation & Mobile Navigation Contract: verifies separated role workspaces | `Test 20: Workspace Separation & Mobile Navigation Contract — verifies separated role workspaces` | **PASSED** |
| 21 | MyCircle Authentication & Account Profile RPCs: verifies Admin & Resident login credentials on live Supabase | `Test 21: MyCircle Authentication & Account Profile RPCs — verifies Admin & Resident login credentials on live Supabase` | **PASSED** |
| 22 | @ensure.in Email Domain & Resend Transactional Templates: verifies all 7 email templates and domain migration | `Test 22: @ensure.in Email Domain & Resend Transactional Templates — verifies all 7 email templates and domain migration` | **PASSED** |
| 23 | Singapore Bugis MRT Relocation, Realistic Member Portraits, Avatar Upload & Notification Center RPCs | `Test 23: Singapore Bugis MRT Relocation, Realistic Member Portraits, Avatar Upload & Notification Center RPCs` | **PASSED** |

---

## 3. Live Vitest Test Execution Output

```text
 RUN  v3.1.1 D:/MyApp/MyCircle

 ✓ src/__tests__/acceptance.test.ts (23 tests) 12755ms
   ✓ CommunityCircle PRD v1.0 — 20 Acceptance Tests & Live Supabase Verification > Test 1: Membership Gate — blocks pending and suspended users on live Supabase RPC & permission engine  1352ms
   ✓ CommunityCircle PRD v1.0 — 20 Acceptance Tests & Live Supabase Verification > Test 2: Scoped Sub-Admin Isolation — 10 sub-admins are enforced by module and building scope  790ms
   ✓ CommunityCircle PRD v1.0 — 20 Acceptance Tests & Live Supabase Verification > Test 3: Contact Privacy — personal phone & flat number are stripped in directory payloads unless opted in  682ms
   ✓ CommunityCircle PRD v1.0 — 20 Acceptance Tests & Live Supabase Verification > Test 4: Order Integrity & Idempotency — ignores tampered client prices and prevents duplicate orders  1ms
   ✓ CommunityCircle PRD v1.0 — 20 Acceptance Tests & Live Supabase Verification > Test 5: Prescription Privacy — private Rx attachment visible only to patient and fulfilling pharmacist  1385ms
   ✓ CommunityCircle PRD v1.0 — 20 Acceptance Tests & Live Supabase Verification > Test 6: Order Price/Weight Change Approval — requires explicit buyer approval before fulfilment  1ms
   ✓ CommunityCircle PRD v1.0 — 20 Acceptance Tests & Live Supabase Verification > Test 7: Service Review Eligibility & Separation — off-platform recommendations excluded from verified average  312ms
   ✓ CommunityCircle PRD v1.0 — 20 Acceptance Tests & Live Supabase Verification > Test 8: Social Service Agreement & Atomic Quantity Allocation — prevents double allocation on last unit  2ms
   ✓ CommunityCircle PRD v1.0 — 20 Acceptance Tests & Live Supabase Verification > Test 9: Blind Review Window — keeps first review hidden until counterparty submits or 14-day window expires  2ms
   ✓ CommunityCircle PRD v1.0 — 20 Acceptance Tests & Live Supabase Verification > Test 10: Dispute Review Eligibility — pre-handover cancellation blocked; post-handover overdue/dispute unlocked  1ms
   ✓ CommunityCircle PRD v1.0 — 20 Acceptance Tests & Live Supabase Verification > Test 11: Complaint Duplicate Linking — links cases into shared issue without exposing private reporter details  1ms
   ✓ CommunityCircle PRD v1.0 — 20 Acceptance Tests & Live Supabase Verification > Test 12: Civic Escalation Honesty — demo or unverified submission cannot be marked acknowledged  1ms
   ✓ CommunityCircle PRD v1.0 — 20 Acceptance Tests & Live Supabase Verification > Test 13: Announcement Expiry — expired announcements lose active prominence  361ms
   ✓ CommunityCircle PRD v1.0 — 20 Acceptance Tests & Live Supabase Verification > Test 14: SOS Alert Separation — responder receives full unit/phone while resident receives sanitised guidance  455ms
   ✓ CommunityCircle PRD v1.0 — 20 Acceptance Tests & Live Supabase Verification > Test 15: SOS Responder Ownership — authorised responder or safety sub-admin can acknowledge incident  355ms
   ✓ CommunityCircle PRD v1.0 — 20 Acceptance Tests & Live Supabase Verification > Test 16: Staff Location Consent & Shift Boundary — off-duty or unconsented staff location is hidden  1ms
   ✓ CommunityCircle PRD v1.0 — 20 Acceptance Tests & Live Supabase Verification > Test 17: Staff Location Grant Precision — approximate grant strips lat/lng on live Supabase RPC & engine  456ms
   ✓ CommunityCircle PRD v1.0 — 20 Acceptance Tests & Live Supabase Verification > Test 18: Common-Area Camera Permission & Audit — denies ungranted camera and mints 60s token for granted camera  396ms
   ✓ CommunityCircle PRD v1.0 — 20 Acceptance Tests & Live Supabase Verification > Test 19: Demo Adapter Honesty — unconfigured SMS/push/civic/camera adapters never fake live acknowledgment  2ms
   ✓ CommunityCircle PRD v1.0 — 20 Acceptance Tests & Live Supabase Verification > Test 20: Workspace Separation & Mobile Navigation Contract — verifies separated role workspaces  381ms
   ✓ CommunityCircle PRD v1.0 — 20 Acceptance Tests & Live Supabase Verification > Test 21: MyCircle Authentication & Account Profile RPCs — verifies Admin & Resident login credentials on live Supabase  1752ms
   ✓ CommunityCircle PRD v1.0 — 20 Acceptance Tests & Live Supabase Verification > Test 22: @ensure.in Email Domain & Resend Transactional Templates — verifies all 7 email templates and domain migration  4307ms
   ✓ CommunityCircle PRD v1.0 — 20 Acceptance Tests & Live Supabase Verification > Test 23: Singapore Bugis MRT Relocation, Realistic Member Portraits, Avatar Upload & Notification Center RPCs  809ms

 Test Files  1 passed (1)
      Tests  23 passed (23)
   Duration  13.83s
```

---

## 4. Evaluator Verification Steps

To reproduce all 23 verification tests locally:
```bash
git clone https://github.com/malinikochar/mycircle.git
cd mycircle
npm install
npm test
```
All tests execute against the live cloud Supabase database without requiring local Docker or PostgreSQL containers.
