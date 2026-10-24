# MyCircle — Trusted Residential Community OS

**Private Community Trust, Commerce, Service & Safety Platform**

Built with **Next.js (App Router)**, **TypeScript**, **Tailwind CSS** (styled with the **Genesis (`chef/genesis`)** & **UI/UX Pro Max** design system), and live **Supabase Postgres 17** (`https://runquwuetzfivhwefenk.supabase.co`).

---

## Test Login Credentials (`/login`)

You can sign in at `http://localhost:3000/login` using **either the Username or Email** below, or click any role card in the **Role Credentials Vault** for one-click sign-in. You can also register a brand-new resident account at `http://localhost:3000/register` and edit your profile at `http://localhost:3000/account`.

| Role / Persona | Display Name | Username | Email | Password | Target Workspace |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Primary Admin** | Aarav Mehta | `admin` | `admin@mycircle.in` | `MyCircle@Admin2026` | `/workspaces/admin` |
| **Approved Resident #1** | Priya Nair | `priya` | `priya@mycircle.in` | `MyCircle@User2026` | `/` & `/account` |
| **Approved Resident #2** | Dr. Rohan Kulkarni | `rohan` | `rohan@mycircle.in` | `MyCircle@User2026` | `/social-service` |
| **Sub-Admin #1 (Membership)** | Neha Deshmukh | `neha_admin` | `neha.admin@mycircle.in` | `MyCircle@SubAdmin2026` | `/workspaces/admin` |
| **Sub-Admin #10 (Safety & CCTV)** | Col. Pratap Chauhan | `safety_admin` | `safety.admin@mycircle.in` | `MyCircle@SubAdmin2026` | `/safety` |
| **Local Shop Owner** | Suresh Agarwal | `freshmart` | `shop@mycircle.in` | `MyCircle@Shop2026` | `/workspaces/shop` |
| **Licensed Pharmacist** | Dr. Zoya Merchant | `pharmacist` | `pharmacy@mycircle.in` | `MyCircle@Shop2026` | `/workspaces/shop` |
| **Service Provider** | Ramesh Vishwakarma | `ramesh_elec` | `provider@mycircle.in` | `MyCircle@Service2026` | `/workspaces/provider` |
| **Security & SOS Staff** | Mahesh Yadav | `mahesh_guard` | `security@mycircle.in` | `MyCircle@Staff2026` | `/workspaces/staff` |
| **Pending Applicant (Gate Test)** | Vikram Sethi | `pending_user` | `pending@mycircle.in` | `MyCircle@User2026` | `/` (Access Gate) |

---

## Product Scope Implemented (Phases 0–5)

1. **Authentication, Registration, Profile & Per-Field Directory Privacy (`MEM-01..07`)**:
   - Full Login (`/login`), Member Registration (`/register`), and Profile & Privacy Editor (`/account`) backed by `public.user_credentials` and server-side RPCs (`cc_authenticate_user`, `cc_register_member`, `cc_update_member_profile`).
   - Approved-member gate (`approved`, `pending`, `suspended`, `rejected`).
   - Primary Admin + **10 distinct permission-scoped sub-admins**.
   - 1,000+ synthetic member profiles across 6 towers (`Tower A — Gulmohar` through `Tower F — Deodar`).
   - Server-enforced per-field directory privacy (`show_unit = false`, `show_phone = false` by default).
2. **Community Feed, Discussions, Messaging, Announcements & Events (`COM-01..05`, `EVT-01..05`)**:
   - Category filterable community feed, urgent pinned notices with automatic expiry demotion, event RSVPs, and linked Social Service borrow requests.
3. **Local Shops, Orders, Prescriptions, Price Change Approval, Invoices & Ledger (`SHOP-01..11`)**:
   - Multi-mode ordering, mandatory buyer approval (`awaiting_buyer_approval`) whenever merchant line-item revisions change the billed total, strict prescription privacy (`prescriptions-private`), GST invoices, and khata ledger entries.
4. **Trusted Service Providers, Recommendations, Bookings & Verified Reviews (`SRV-01..06`, `REP-01..08`)**:
   - Community-endorsed providers, quotes, scheduled bookings, and dual-blind 14-day verified review windows with separated Member vs Service Provider reputation scores (`REP-07`).
5. **Social Service & Peer-to-Peer Exchange (`SOC-01..10`)**:
   - Structured `I Need Something` / `I Have an Offer` exchange modes (`request`, `giveaway`, `sale`, `borrow_request`, `loan`, `rental`, `swap`, `volunteer_help`), atomic quantity allocation, versioned agreements, and condition reports.
6. **Help Requests, Complaints, Shared Building Issues & Civic Escalation (`HELP-01..03`, `CASE-01..06`)**:
   - Urgent help requests, maintenance complaints routed by module scope, redacted shared building issues, and honest civic escalation tracking.
7. **SOS Emergency Alerts, Staff Attendance, Consent-Based Duty GPS & Common-Area CCTV (`SOS-01..09`, `STF-01..07`, `CCTV-01..07`)**:
   - Hold-to-send SOS confirmation with sanitised community alerts vs full responder unit/phone dispatch.
   - Staff duty check-in/out and consent-based duty location sharing (`approximate` zone vs `precise` coordinates).
   - Common-area-only CCTV registry, mandatory audit logging, and 60-second short-lived signed session tokens.

---

## Local Setup & Verification

```bash
npm install
npm run dev
```

Run the full verification suite:
```bash
npm run typecheck
npm test
npm run build
```
