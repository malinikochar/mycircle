-- ============================================================================
-- CommunityCircle v1.0 — Private Storage Policies & Synthetic Seed Data
-- Includes 1,000 synthetic members, 10 scoped sub-admins, and all 12 modules
-- ============================================================================

CREATE POLICY "camera_secrets_service_role_only" ON public.camera_secrets
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('community-media', 'community-media', false, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp']),
  ('prescriptions-private', 'prescriptions-private', false, 5242880, ARRAY['image/jpeg', 'image/png', 'application/pdf']),
  ('case-evidence-private', 'case-evidence-private', false, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf']),
  ('exchange-conditions-private', 'exchange-conditions-private', false, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "community_media_select_approved" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'community-media'
    AND (SELECT private.is_approved_member('11111111-1111-4111-8111-111111111111'::uuid))
  );

CREATE POLICY "prescriptions_select_owner_or_pharmacist" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'prescriptions-private'
    AND (
      owner = (SELECT auth.uid())
      OR EXISTS (
        SELECT 1 FROM public.attachments a
        JOIN public.orders o ON o.id = a.parent_id
        WHERE a.storage_bucket = 'prescriptions-private'
          AND a.storage_path = storage.objects.name
          AND (SELECT private.can_review_shop_prescriptions(o.shop_id))
      )
    )
  );

-- ============================================================================
-- 1. SEED COMMUNITY & 6 BUILDINGS
-- ============================================================================

INSERT INTO public.communities (id, slug, name, city, timezone, currency_code)
VALUES (
  '11111111-1111-4111-8111-111111111111',
  'serenity-heights-mumbai',
  'Serenity Heights Co-op Housing Society',
  'Mumbai',
  'Asia/Kolkata',
  'INR'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.buildings (id, community_id, code, name, floors_count, units_count)
VALUES
  ('22222222-2222-4222-8222-222222222201', '11111111-1111-4111-8111-111111111111', 'TWR-A', 'Tower A — Gulmohar', 18, 180),
  ('22222222-2222-4222-8222-222222222202', '11111111-1111-4111-8111-111111111111', 'TWR-B', 'Tower B — Amaltas', 18, 180),
  ('22222222-2222-4222-8222-222222222203', '11111111-1111-4111-8111-111111111111', 'TWR-C', 'Tower C — Banyan', 18, 180),
  ('22222222-2222-4222-8222-222222222204', '11111111-1111-4111-8111-111111111111', 'TWR-D', 'Tower D — Ashoka', 16, 160),
  ('22222222-2222-4222-8222-222222222205', '11111111-1111-4111-8111-111111111111', 'TWR-E', 'Tower E — Peepal', 16, 160),
  ('22222222-2222-4222-8222-222222222206', '11111111-1111-4111-8111-111111111111', 'TWR-F', 'Tower F — Deodar', 14, 140)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 2. SEED NAMED CORE PERSONAS (1..26) + SYNTHETIC RESIDENTS (27..1000)
-- ============================================================================

INSERT INTO public.profiles (id, community_id, display_name, bio, interests, profession, skills, member_rating_avg, member_review_count, completed_interactions_count)
VALUES
  ('00000000-0000-4000-8000-000000000001', '11111111-1111-4111-8111-111111111111', 'Aarav Mehta', 'Honorary Society Secretary & Chartered Accountant. Focused on transparent governance and safe common spaces.', ARRAY['governance', 'solar-energy', 'badminton'], 'Chartered Accountant', ARRAY['Financial Audit', 'Co-op Bylaws', 'Taxation'], 4.90, 8, 19),
  ('00000000-0000-4000-8000-000000000002', '11111111-1111-4111-8111-111111111111', 'Priya Nair', 'Principal Architect in Tower B. Happy to lend design books and event seating.', ARRAY['architecture', 'gardening', 'cultural-events'], 'Principal Architect', ARRAY['Interior Spatial Planning', 'AutoCAD', 'Heritage Restoration'], 4.85, 6, 14),
  ('00000000-0000-4000-8000-000000000003', '11111111-1111-4111-8111-111111111111', 'Dr. Rohan Kulkarni', 'Consultant Paediatrician at Kokilaben Hospital. Active in community health camps and book exchanges.', ARRAY['pediatrics', 'running', 'reading'], 'Consultant Paediatrician', ARRAY['Child Nutrition', 'First Aid Training', 'Vaccination Guidance'], 4.95, 11, 23),
  ('00000000-0000-4000-8000-000000000004', '11111111-1111-4111-8111-111111111111', 'Vikram Sethi (Pending Applicant)', 'Recently moved into Tower D-301; awaiting rental agreement verification.', ARRAY['photography'], 'Product Manager', ARRAY['Agile', 'UX Research'], NULL, 0, 0),
  ('00000000-0000-4000-8000-000000000005', '11111111-1111-4111-8111-111111111111', 'Karan Malhotra (Suspended)', 'Account suspended pending resolution of repeated commercial spamming violation.', ARRAY['trading'], 'Marketing Consultant', ARRAY['Lead Generation'], 2.40, 2, 2),
  ('00000000-0000-4000-8000-000000000011', '11111111-1111-4111-8111-111111111111', 'Neha Deshmukh', 'Sub-Admin for Membership & Resident Verification. Corporate Lawyer.', ARRAY['legal-aid', 'classical-music'], 'Corporate Lawyer', ARRAY['Contract Review', 'Tenant Verification', 'RERA Compliance'], 4.80, 5, 11),
  ('00000000-0000-4000-8000-000000000012', '11111111-1111-4111-8111-111111111111', 'Siddharth Joshi', 'Sub-Admin for Community Moderation & Trust. University Professor.', ARRAY['ethics', 'debate', 'chess'], 'University Professor', ARRAY['Conflict Mediation', 'Academic Writing', 'Marathi Translation'], 4.75, 4, 9),
  ('00000000-0000-4000-8000-000000000013', '11111111-1111-4111-8111-111111111111', 'Ananya Iyer', 'Sub-Admin for Cultural Events & Notices. Brand Strategist.', ARRAY['festivals', 'theatre', 'music'], 'Brand Strategist', ARRAY['Event Curation', 'Stage Production', 'Community Outreach'], 4.92, 9, 17),
  ('00000000-0000-4000-8000-000000000014', '11111111-1111-4111-8111-111111111111', 'Rajeshwar Rao', 'Sub-Admin for Water Supply & Hydraulics. Retired Civil Engineer.', ARRAY['hydrology', 'rainwater-harvesting'], 'Civil & Hydraulic Engineer', ARRAY['Pump Maintenance', 'Water Auditing', 'Plumbing Diagnostics'], 4.88, 7, 15),
  ('00000000-0000-4000-8000-000000000015', '11111111-1111-4111-8111-111111111111', 'Farhan Shaikh', 'Sub-Admin for Electricity, Lifts & Solar Backup. Electrical Systems Lead.', ARRAY['rooftop-solar', 'ev-charging'], 'Electrical Systems Engineer', ARRAY['DG Set Supervision', 'Lift Safety Audits', 'Solar Net-Metering'], 4.86, 6, 13),
  ('00000000-0000-4000-8000-000000000016', '11111111-1111-4111-8111-111111111111', 'Kavita Krishnan', 'Sub-Admin for Cleanliness, Waste Segregation & Composting. Environmental Scientist.', ARRAY['zero-waste', 'composting', 'urban-trees'], 'Environmental Scientist', ARRAY['Wet Waste Composting', 'E-Waste Drives', 'Drainage Audits'], 4.94, 10, 21),
  ('00000000-0000-4000-8000-000000000017', '11111111-1111-4111-8111-111111111111', 'Devendra Patil', 'Sub-Admin for Civic Escalation & Municipal Liaison. Public Policy Researcher.', ARRAY['civic-tech', 'rti', 'urban-roads'], 'Public Policy Researcher', ARRAY['Municipal Ward Liaison', 'RTI Drafting', 'Infrastructure Tracking'], 4.82, 5, 12),
  ('00000000-0000-4000-8000-000000000018', '11111111-1111-4111-8111-111111111111', 'Meera Chawla', 'Sub-Admin for Local Commerce & Vendor Support. Retail Operations Advisor.', ARRAY['local-business', 'baking'], 'Retail Operations Advisor', ARRAY['Supply Chain', 'Merchant Onboarding', 'Invoice Reconciliation'], 4.79, 4, 10),
  ('00000000-0000-4000-8000-000000000019', '11111111-1111-4111-8111-111111111111', 'Harpreet Gill', 'Sub-Admin for Local Service Directory & Domestic Help Welfare.', ARRAY['community-welfare', 'skill-training'], 'HR & Operations Director', ARRAY['Background Verification', 'Fair Wage Standards', 'Service Dispute Resolution'], 4.91, 8, 16),
  ('00000000-0000-4000-8000-000000000020', '11111111-1111-4111-8111-111111111111', 'Col. Pratap Chauhan (Retd.)', 'Sub-Admin for Community Safety, Emergency Response & Security Grants.', ARRAY['disaster-prep', 'fire-drills', 'fitness'], 'Security & Crisis Consultant', ARRAY['Fire Evacuation Drills', 'Responder Coordination', 'CCTV Governance'], 4.96, 12, 28),
  ('00000000-0000-4000-8000-000000000021', '11111111-1111-4111-8111-111111111111', 'Suresh Agarwal', 'Owner of Annapurna Daily Fresh Mart (Arcade Shop #2) and Tower A resident.', ARRAY['organic-produce', 'cricket'], 'Merchant & Grocer', ARRAY['Fresh Produce Sourcing', 'Same-Hour Tower Delivery'], 4.84, 5, 14),
  ('00000000-0000-4000-8000-000000000022', '11111111-1111-4111-8111-111111111111', 'Dr. Zoya Merchant (RPh)', 'Licensed Pharmacist & Owner of CarePlus Community Pharmacy (Arcade Shop #4).', ARRAY['clinical-pharmacy', 'elder-care'], 'Registered Pharmacist (RPh)', ARRAY['Prescription Verification', 'Cold-Chain Storage'], 4.93, 7, 15),
  ('00000000-0000-4000-8000-000000000023', '11111111-1111-4111-8111-111111111111', 'Ramesh Vishwakarma', 'Licensed Electrician serving Serenity Heights for 9 years.', ARRAY['electrical-safety'], 'Master Electrician', ARRAY['MCB & DB Wiring', 'Inverter Setup', 'Appliance Earthing'], NULL, 0, 0),
  ('00000000-0000-4000-8000-000000000024', '11111111-1111-4111-8111-111111111111', 'Santosh Pawar', 'Plumbing & Leak Detection Specialist.', ARRAY['plumbing'], 'Senior Plumber', ARRAY['Concealed Pipe Repair', 'Pressure Pump Fitting', 'Bathroom Waterproofing'], NULL, 0, 0),
  ('00000000-0000-4000-8000-000000000025', '11111111-1111-4111-8111-111111111111', 'Mahesh Yadav', 'Head Security Guard — Main Gate & Emergency Responder.', ARRAY['security'], 'Head Security Officer', ARRAY['First Responder', 'Lift Rescue Procedure', 'Gate Access Control'], NULL, 0, 0),
  ('00000000-0000-4000-8000-000000000026', '11111111-1111-4111-8111-111111111111', 'Dinesh Tiwari', 'Security Guard — Tower B & Courtyard Patrol.', ARRAY['patrol'], 'Security Guard', ARRAY['Night Patrol', 'Visitor Management'], NULL, 0, 0)
ON CONFLICT (id) DO NOTHING;

-- Generate synthetic residents 27..1000 to reach 1,000 total profiles (PRD Section 8)
INSERT INTO public.profiles (id, community_id, display_name, bio, interests, profession, skills, member_rating_avg, member_review_count, completed_interactions_count)
SELECT
  ('00000000-0000-4000-8000-' || lpad(gs::text, 12, '0'))::uuid,
  '11111111-1111-4111-8111-111111111111',
  (ARRAY['Aditi', 'Vikrant', 'Sneha', 'Pranav', 'Pooja', 'Nikhil', 'deepika', 'Rahul', 'Swati', 'Gaurav', 'Meghna', 'Arjun'])[1 + (gs % 12)]
    || ' ' ||
  (ARRAY['Sharma', 'Verma', 'Kulkarni', 'Patel', 'Reddy', 'Bhatia', 'Menon', 'Kapoor', 'Jain', 'Chatterjee'])[1 + (gs % 10)]
    || ' #' || gs::text,
  'Approved resident of Serenity Heights participating in community exchanges and neighbourhood initiatives.',
  ARRAY[(ARRAY['gardening', 'books', 'cycling', 'music', 'yoga', 'cooking', 'chess', 'tech'])[1 + (gs % 8)]],
  (ARRAY['Software Architect', 'Chartered Accountant', 'Data Scientist', 'Dental Surgeon', 'High School Educator', 'Graphic Designer', 'Civil Engineer', 'Financial Analyst', 'Physiotherapist', 'Culinary Entrepreneur'])[1 + (gs % 10)],
  ARRAY[(ARRAY['Python & Cloud', 'GST Advisory', 'Math Tutoring', 'UI Design', 'First Aid', 'Home Baking', 'Guitar Lessons', 'Yoga Coaching'])[1 + (gs % 8)]],
  CASE WHEN gs % 5 = 0 THEN round((4.20 + ((gs % 8) * 0.1))::numeric, 2) ELSE NULL END,
  CASE WHEN gs % 5 = 0 THEN 1 + (gs % 6) ELSE 0 END,
  gs % 9
FROM generate_series(27, 1005) AS gs
ON CONFLICT (id) DO NOTHING;

-- Memberships for all profiles
INSERT INTO public.memberships (user_id, community_id, building_id, status, status_reason, approved_by, approved_at)
SELECT
  p.id,
  p.community_id,
  ('22222222-2222-4222-8222-22222222220' || (1 + (('x' || right(p.id::text, 4))::bit(16)::int % 6))::text)::uuid,
  CASE
    WHEN p.id = '00000000-0000-4000-8000-000000000004' THEN 'pending'
    WHEN p.id = '00000000-0000-4000-8000-000000000005' THEN 'suspended'
    ELSE 'approved'
  END,
  CASE
    WHEN p.id = '00000000-0000-4000-8000-000000000004' THEN 'Awaiting Society NOC upload from Tower D managing clerk'
    WHEN p.id = '00000000-0000-4000-8000-000000000005' THEN 'Suspended 14 days for repeated unsolicited promotional messages'
    ELSE 'Verified resident directory member'
  END,
  '00000000-0000-4000-8000-000000000001',
  now() - interval '90 days'
FROM public.profiles p
ON CONFLICT (user_id, community_id) DO NOTHING;

-- Private contacts (personal phone & unit hidden by default per MEM-03)
INSERT INTO public.private_contacts (user_id, community_id, building_id, unit_number, personal_phone, alternate_email, emergency_contact_name, emergency_contact_phone, residency_type)
SELECT
  m.user_id,
  m.community_id,
  m.building_id,
  ((1 + (('x' || right(m.user_id::text, 3))::bit(12)::int % 15)) * 100 + (1 + (('x' || right(m.user_id::text, 2))::bit(8)::int % 4)))::text,
  '+91-9820' || lpad((('x' || right(m.user_id::text, 6))::bit(24)::int % 1000000)::text, 6, '0'),
  'resident.' || right(m.user_id::text, 4) || '@example.org',
  'Family Emergency Contact',
  '+91-9821000100',
  CASE WHEN ('x' || right(m.user_id::text, 2))::bit(8)::int % 3 = 0 THEN 'tenant_resident' ELSE 'owner_resident' END
FROM public.memberships m
ON CONFLICT (user_id) DO NOTHING;

-- Profile visibility (exact unit and personal phone hidden by default — MEM-03)
INSERT INTO public.profile_visibility (user_id, community_id, show_building, show_unit, show_phone, show_profession, show_business, allow_direct_messages)
SELECT
  m.user_id,
  m.community_id,
  true,
  false,
  false,
  true,
  true,
  true
FROM public.memberships m
ON CONFLICT (user_id) DO NOTHING;

-- Professional & Business Profiles for directory search (MEM-02, MEM-04)
INSERT INTO public.professional_profiles (user_id, community_id, headline, years_experience, qualifications, available_for_consultation)
VALUES
  ('00000000-0000-4000-8000-000000000001', '11111111-1111-4111-8111-111111111111', 'FCA — Co-operative Housing Society Audit & GST Advisory', 16, 'FCA, B.Com (Hons)', true),
  ('00000000-0000-4000-8000-000000000002', '11111111-1111-4111-8111-111111111111', 'COA Registered Principal Architect & Sustainable Interiors', 12, 'B.Arch (Sir J.J.), M.UrbDes', true),
  ('00000000-0000-4000-8000-000000000003', '11111111-1111-4111-8111-111111111111', 'Consultant Paediatrician & Neonatologist', 14, 'MD (Paediatrics), DNB', true),
  ('00000000-0000-4000-8000-000000000011', '11111111-1111-4111-8111-111111111111', 'Real Estate & Co-op Society Legal Counsel', 11, 'LL.M (Mumbai)', true),
  ('00000000-0000-4000-8000-000000000015', '11111111-1111-4111-8111-111111111111', 'Rooftop Solar & EV Charging Infrastructure Specialist', 13, 'B.E. Electrical, Certified Energy Auditor', true)
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO public.business_profiles (user_id, community_id, business_name, category, description, services_offered, website_url, contact_channel)
VALUES
  ('00000000-0000-4000-8000-000000000002', '11111111-1111-4111-8111-111111111111', 'Studio Terracotta Architecture', 'Architecture & Interior Design', 'Boutique residential renovation, balcony greening, and ergonomic home-office studio based in Tower B.', ARRAY['3D Space Planning', 'Balcony Weatherproofing', 'Civil Renovation Supervision'], 'https://studioterracotta.example.com', 'In-app message'),
  ('00000000-0000-4000-8000-000000000013', '11111111-1111-4111-8111-111111111111', 'KalaMandala Cultural Collective', 'Events & Performing Arts', 'Community workshops in Carnatic vocals, children''s theatre, and festival curation.', ARRAY['Weekend Music Batches', 'Stage Design', 'Cultural Workshops'], NULL, 'In-app message'),
  ('00000000-0000-4000-8000-000000000018', '11111111-1111-4111-8111-111111111111', 'Hearth & Crumb Artisanal Sourdough', 'Home Bakery & Food', 'Small-batch sourdough loaves, millet crackers, and eggless celebration cakes baked fresh in Tower C.', ARRAY['Sourdough Subscription', 'Millet Bakes', 'Custom Celebration Cakes'], NULL, 'In-app message')
ON CONFLICT (user_id) DO NOTHING;

-- ============================================================================
-- 3. SEED PRIMARY ADMIN + 10 PERMISSION-SCOPED SUB-ADMINS (Section 3, Test 2)
-- ============================================================================

INSERT INTO public.role_grants (id, community_id, user_id, role_type, module_scope, building_scope_id, allowed_actions, title_label, granted_by, expires_at)
VALUES
  ('33333333-3333-4333-8333-333333333300', '11111111-1111-4111-8111-111111111111', '00000000-0000-4000-8000-000000000001', 'primary_admin', 'all', NULL, ARRAY['*'], 'Honorary General Secretary (Primary Admin)', '00000000-0000-4000-8000-000000000001', NULL),
  ('33333333-3333-4333-8333-333333333301', '11111111-1111-4111-8111-111111111111', '00000000-0000-4000-8000-000000000011', 'sub_admin', 'membership', NULL, ARRAY['approve_member', 'reject_member', 'suspend_member', 'reactivate_member'], 'Sub-Admin #1: Membership & Verification Delegate', '00000000-0000-4000-8000-000000000001', now() + interval '180 days'),
  ('33333333-3333-4333-8333-333333333302', '11111111-1111-4111-8111-111111111111', '00000000-0000-4000-8000-000000000012', 'sub_admin', 'moderation', NULL, ARRAY['moderate_post', 'redact_review', 'resolve_report'], 'Sub-Admin #2: Community Feed & Review Moderator', '00000000-0000-4000-8000-000000000001', now() + interval '180 days'),
  ('33333333-3333-4333-8333-333333333303', '11111111-1111-4111-8111-111111111111', '00000000-0000-4000-8000-000000000013', 'sub_admin', 'events', NULL, ARRAY['publish_notice', 'manage_event', 'cancel_event'], 'Sub-Admin #3: Cultural Events & Announcements Delegate', '00000000-0000-4000-8000-000000000001', now() + interval '180 days'),
  ('33333333-3333-4333-8333-333333333304', '11111111-1111-4111-8111-111111111111', '00000000-0000-4000-8000-000000000014', 'sub_admin', 'water', '22222222-2222-4222-8222-222222222202', ARRAY['triage_case', 'assign_case', 'update_case', 'publish_water_notice'], 'Sub-Admin #4: Water Supply & Pump Operations Delegate', '00000000-0000-4000-8000-000000000001', now() + interval '180 days'),
  ('33333333-3333-4333-8333-333333333305', '11111111-1111-4111-8111-111111111111', '00000000-0000-4000-8000-000000000015', 'sub_admin', 'electricity', NULL, ARRAY['triage_case', 'assign_case', 'update_case'], 'Sub-Admin #5: Electrical, Lifts & Solar Backup Delegate', '00000000-0000-4000-8000-000000000001', now() + interval '180 days'),
  ('33333333-3333-4333-8333-333333333306', '11111111-1111-4111-8111-111111111111', '00000000-0000-4000-8000-000000000016', 'sub_admin', 'cleanliness', NULL, ARRAY['triage_case', 'assign_case', 'update_case'], 'Sub-Admin #6: Sanitation, Waste & Drainage Delegate', '00000000-0000-4000-8000-000000000001', now() + interval '180 days'),
  ('33333333-3333-4333-8333-333333333307', '11111111-1111-4111-8111-111111111111', '00000000-0000-4000-8000-000000000017', 'sub_admin', 'civic_escalation', NULL, ARRAY['link_shared_issue', 'prepare_escalation', 'record_authority_submission'], 'Sub-Admin #7: Civic Escalation & Municipal Ward Delegate', '00000000-0000-4000-8000-000000000001', now() + interval '180 days'),
  ('33333333-3333-4333-8333-333333333308', '11111111-1111-4111-8111-111111111111', '00000000-0000-4000-8000-000000000018', 'sub_admin', 'commerce_support', NULL, ARRAY['approve_shop', 'mediate_order_dispute'], 'Sub-Admin #8: Local Shops & Commerce Support Delegate', '00000000-0000-4000-8000-000000000001', now() + interval '180 days'),
  ('33333333-3333-4333-8333-333333333309', '11111111-1111-4111-8111-111111111111', '00000000-0000-4000-8000-000000000019', 'sub_admin', 'local_services', NULL, ARRAY['verify_provider_badge', 'mediate_service_dispute'], 'Sub-Admin #9: Service Providers & Recommendations Delegate', '00000000-0000-4000-8000-000000000001', now() + interval '180 days'),
  ('33333333-3333-4333-8333-333333333310', '11111111-1111-4111-8111-111111111111', '00000000-0000-4000-8000-000000000020', 'sub_admin', 'safety', NULL, ARRAY['manage_shifts', 'acknowledge_sos', 'grant_location_view', 'grant_camera_view'], 'Sub-Admin #10: Community Safety, Staff & CCTV Delegate', '00000000-0000-4000-8000-000000000001', now() + interval '180 days')
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 4. SEED ANNOUNCEMENTS, EVENTS, POSTS, GROUPS & CONVERSATIONS (EVT & COM)
-- ============================================================================

INSERT INTO public.announcements (id, community_id, author_id, title, body, category, audience_type, target_building_id, is_pinned, requires_acknowledgement, published_at, expires_at)
VALUES
  ('44444444-4444-4444-8444-444444444401', '11111111-1111-4111-8111-111111111111', '00000000-0000-4000-8000-000000000014', 'Scheduled Overhead Tank Cleaning — Tower B (Amaltas)', 'Overhead domestic water tanks for Tower B will be drained for bio-safe cleaning on Sunday between 10:00 AM and 01:30 PM IST. Please store adequate drinking water in advance.', 'utility', 'building', '22222222-2222-4222-8222-222222222202', true, true, now() - interval '4 hours', now() + interval '5 days'),
  ('44444444-4444-4444-8444-444444444402', '11111111-1111-4111-8111-111111111111', '00000000-0000-4000-8000-000000000001', 'Q3 Society Financial Audit & Solar Net-Metering Report Published', 'The audited statement of accounts for Q3 and rooftop solar generation savings (Rs 1.42 Lakh credit) are available for review before the upcoming Special General Body Meeting.', 'governance', 'all_members', NULL, true, false, now() - interval '1 day', now() + interval '14 days'),
  ('44444444-4444-4444-8444-444444444403', '11111111-1111-4111-8111-111111111111', '00000000-0000-4000-8000-000000000013', '[EXPIRED NOTICE] Monsoon Tree Trimming Near East Gate', 'Completed last week; this expired notice verifies that expired announcements automatically lose active prominence (Test 13).', 'maintenance', 'all_members', NULL, true, false, now() - interval '10 days', now() - interval '2 days')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.acknowledgements (announcement_id, user_id, acknowledged_at)
VALUES ('44444444-4444-4444-8444-444444444401', '00000000-0000-4000-8000-000000000002', now() - interval '2 hours')
ON CONFLICT DO NOTHING;

INSERT INTO public.events (id, community_id, organiser_id, building_id, title, description, location_label, starts_at, ends_at, capacity, status, linked_exchange_listing_id)
VALUES
  ('45555555-5555-4555-8555-555555555501', '11111111-1111-4111-8111-111111111111', '00000000-0000-4000-8000-000000000013', NULL, 'Sharadotsav Acoustic Evening & Senior Citizens Felicitations', 'Community musical gathering in the Central Amphitheatre. Linked to Social Service request for 20 foldable chairs and volunteer stage setup help.', 'Central Amphitheatre Lawn', now() + interval '3 days', now() + interval '3 days 3 hours', 150, 'scheduled', '71111111-1111-4111-8111-111111111101'),
  ('45555555-5555-4555-8555-555555555502', '11111111-1111-4111-8111-111111111111', '00000000-0000-4000-8000-000000000016', NULL, 'Sunday E-Waste & Battery Collection Drive', 'Bring old laptops, chargers, CFL bulbs, and household batteries to the Main Clubhouse portico for certified recycling.', 'Main Clubhouse Portico', now() + interval '5 days', now() + interval '5 days 4 hours', 300, 'scheduled', NULL)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.event_rsvps (event_id, user_id, status, guests_count)
VALUES
  ('45555555-5555-4555-8555-555555555501', '00000000-0000-4000-8000-000000000002', 'going', 2),
  ('45555555-5555-4555-8555-555555555501', '00000000-0000-4000-8000-000000000003', 'going', 3)
ON CONFLICT DO NOTHING;

INSERT INTO public.posts (id, community_id, author_id, building_id, category, title, body)
VALUES
  ('46666666-6666-4666-8666-666666666601', '11111111-1111-4111-8111-111111111111', '00000000-0000-4000-8000-000000000003', '22222222-2222-4222-8222-222222222203', 'local_info', 'Weekend Paediatric First-Aid & Choking Response Session', 'Happy to host a 45-minute practical demonstration for parents and caregivers this Saturday at 5 PM in the Tower C reading room. No fees—just bring your questions!'),
  ('46666666-6666-4666-8666-666666666602', '11111111-1111-4111-8111-111111111111', '00000000-0000-4000-8000-000000000002', '22222222-2222-4222-8222-222222222202', 'lost_and_found', 'Found: Pair of Titan Reading Glasses near Badminton Court #1', 'Found a brown leather case with silver-rimmed reading glasses on the bench outside Court #1 at 7:30 AM today. Handed over to Head Guard Mahesh Yadav at the Main Gate desk.'),
  ('46666666-6666-4666-8666-666666666603', '11111111-1111-4111-8111-111111111111', '00000000-0000-4000-8000-000000000016', NULL, 'celebrations', 'Our Wet-Waste Composting Pit Harvested 420 kg of Organic Manure!', 'Thank you to all 6 towers for 94% source segregation this month. Residents can collect free 2 kg packets of cured compost for balcony planters from the nursery shed.')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.comments (id, community_id, post_id, author_id, body)
VALUES
  ('47777777-7777-4777-8777-777777777701', '11111111-1111-4111-8111-111111111111', '46666666-6666-4666-8666-666666666601', '00000000-0000-4000-8000-000000000002', 'Thank you Dr. Rohan! Joining from Tower B with two neighbours.')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.groups (id, community_id, building_id, name, group_type, moderation_policy, created_by)
VALUES
  ('48888888-8888-4888-8888-888888888801', '11111111-1111-4111-8111-111111111111', '22222222-2222-4222-8222-222222222202', 'Tower B — Amaltas Residents Circle', 'building', 'Verified Tower B residents only; moderated for civil maintenance & lift updates.', '00000000-0000-4000-8000-000000000002'),
  ('48888888-8888-4888-8888-888888888802', '11111111-1111-4111-8111-111111111111', NULL, 'Terrace Gardening & Native Plants Guild', 'interest', 'Open to all approved members; no commercial nursery advertising.', '00000000-0000-4000-8000-000000000016')
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 5. SEED LOCAL SHOPS, PRODUCTS, ORDERS, INVOICES & LEDGER (SHOP-01..11)
-- ============================================================================

INSERT INTO public.shops (id, community_id, owner_id, name, category, description, unit_location, operating_hours, service_windows, delivery_available, min_order_paise, delivery_fee_paise, is_pharmacy_gated, gstin_number, approval_status, approved_by)
VALUES
  ('51111111-1111-4111-8111-111111111101', '11111111-1111-4111-8111-111111111111', '00000000-0000-4000-8000-000000000021', 'Annapurna Daily Fresh Mart', 'grocery', 'Farm-fresh vegetables, staples, cold-pressed oils, and household essentials delivered to Towers A–F.', 'Commercial Arcade Shop #2', '07:30 AM – 09:30 PM IST', ARRAY['08:00–11:00 Morning Slot', '17:00–20:30 Evening Slot'], true, 15000, 1500, false, '27AABCA8921K1Z5', 'approved', '00000000-0000-4000-8000-000000000018'),
  ('51111111-1111-4111-8111-111111111102', '11111111-1111-4111-8111-111111111111', '00000000-0000-4000-8000-000000000022', 'CarePlus Community Pharmacy', 'pharmacy', 'Licensed neighbourhood chemist. OTC wellness items available directly; prescription medicines require pharmacist verification of uploaded prescription (no automatic substitution).', 'Commercial Arcade Shop #4', '08:00 AM – 10:30 PM IST', ARRAY['Immediate Verification Slot (09:00–21:00)'], true, 10000, 0, true, '27AADCC4410M1Z9', 'approved', '00000000-0000-4000-8000-000000000018')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.shop_memberships (shop_id, user_id, role, can_review_prescriptions, is_active)
VALUES
  ('51111111-1111-4111-8111-111111111101', '00000000-0000-4000-8000-000000000021', 'owner', false, true),
  ('51111111-1111-4111-8111-111111111102', '00000000-0000-4000-8000-000000000022', 'pharmacist', true, true)
ON CONFLICT DO NOTHING;

INSERT INTO public.products (id, shop_id, community_id, name, category, pack_size, unit_label, price_paise, tax_rate_bps, stock_quantity, track_inventory, requires_prescription, is_active)
VALUES
  ('52222222-2222-4222-8222-222222222201', '51111111-1111-4111-8111-111111111101', '11111111-1111-4111-8111-111111111111', 'Indrayani Organic Rice (Unpolished)', 'Staples & Grains', '5 kg', 'bag', 46500, 500, 28, true, false, true),
  ('52222222-2222-4222-8222-222222222202', '51111111-1111-4111-8111-111111111101', '11111111-1111-4111-8111-111111111111', 'Gir A2 Cultured Bilona Ghee', 'Dairy & Oils', '500 ml', 'jar', 69000, 1200, 14, true, false, true),
  ('52222222-2222-4222-8222-222222222203', '51111111-1111-4111-8111-111111111101', '11111111-1111-4111-8111-111111111111', 'Nashik Farm Alphonso Tomatoes & Greens Basket', 'Fresh Produce', '1.5 kg', 'basket', 14000, 0, 35, true, false, true),
  ('52222222-2222-4222-8222-222222222204', '51111111-1111-4111-8111-111111111101', '11111111-1111-4111-8111-111111111111', 'Cold-Pressed Groundnut Cooking Oil', 'Dairy & Oils', '1 Litre', 'bottle', 31000, 500, 22, true, false, true),
  ('52222222-2222-4222-8222-222222222205', '51111111-1111-4111-8111-111111111102', '11111111-1111-4111-8111-111111111111', 'Digital Clinical Thermometer & Oximeter Kit', 'OTC Wellness', '1 Kit', 'box', 115000, 1200, 10, true, false, true),
  ('52222222-2222-4222-8222-222222222206', '51111111-1111-4111-8111-111111111102', '11111111-1111-4111-8111-111111111111', 'ORS Electrolyte Rehydration Sachets (WHO Formula)', 'OTC Wellness', '10 x 21g', 'pack', 18000, 1200, 45, true, false, true),
  ('52222222-2222-4222-8222-222222222207', '51111111-1111-4111-8111-111111111102', '11111111-1111-4111-8111-111111111111', 'Schedule-H Prescription Dispensing Request (Pharmacist Gated)', 'Prescription Fulfilment', 'As Prescribed', 'rx-pack', 42000, 500, 15, true, true, true)
ON CONFLICT (id) DO NOTHING;

-- Seed 3 Orders:
-- Order 1: Delivered order from Priya Nair at Annapurna Mart with Invoice & Revision history
-- Order 2: Awaiting Buyer Approval at Annapurna Mart (weight/price change proposed by shop — SHOP-05)
-- Order 3: Gated Pharmacy Order with private prescription attachment (SHOP-11, Test 5)
INSERT INTO public.orders (
  id, community_id, shop_id, buyer_id, idempotency_key, status, payment_status, payment_method,
  subtotal_paise, tax_paise, delivery_fee_paise, total_paise, proposed_total_paise,
  price_change_reason, substitution_note, delivery_estimate_text,
  buyer_name_snapshot, delivery_building_snapshot, delivery_unit_snapshot, delivery_phone_snapshot, delivery_instructions,
  prescription_attachment_id, pharmacist_verified_by
)
VALUES
  (
    '53333333-3333-4333-8333-333333333301',
    '11111111-1111-4111-8111-111111111111',
    '51111111-1111-4111-8111-111111111101',
    '00000000-0000-4000-8000-000000000002',
    'seed-order-priya-delivered-001',
    'delivered',
    'paid_confirmed',
    'direct_upi',
    60500, 2325, 1500, 64325, NULL,
    NULL, NULL, 'Delivered in 38 mins to Tower B-704',
    'Priya Nair', 'Tower B — Amaltas', '704', '+91-9820000002', 'Leave with security lift desk if on a call',
    NULL, NULL
  ),
  (
    '53333333-3333-4333-8333-333333333302',
    '11111111-1111-4111-8111-111111111111',
    '51111111-1111-4111-8111-111111111101',
    '00000000-0000-4000-8000-000000000002',
    'seed-order-priya-approval-002',
    'awaiting_buyer_approval',
    'unpaid',
    'pay_on_delivery',
    69000, 8280, 1500, 78780, 73800,
    'Fresh batch jar weight is 470 ml instead of 500 ml; reduced price by Rs 49.80',
    'Offering 470 ml sealed glass jar batch with reduced price; awaiting buyer confirmation.',
    'Today 18:00 – 19:00 IST once approved',
    'Priya Nair', 'Tower B — Amaltas', '704', '+91-9820000002', 'Ring bell once',
    NULL, NULL
  ),
  (
    '53333333-3333-4333-8333-333333333303',
    '11111111-1111-4111-8111-111111111111',
    '51111111-1111-4111-8111-111111111102',
    '00000000-0000-4000-8000-000000000003',
    'seed-order-rohan-pharmacy-003',
    'preparing',
    'payment_reported',
    'direct_upi',
    60000, 4260, 0, 64260, NULL,
    NULL, NULL, 'Pharmacist Dr. Zoya verified Rx; dispatch at 17:30 IST',
    'Dr. Rohan Kulkarni', 'Tower C — Banyan', '1102', '+91-9820000003', 'Hand directly to adult family member',
    '59999999-9999-4999-8999-999999999901', '00000000-0000-4000-8000-000000000022'
  )
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.order_items (order_id, product_id, product_name_snapshot, pack_size_snapshot, quantity, unit_price_paise_snapshot, proposed_unit_price_paise, tax_paise_snapshot, line_total_paise_snapshot)
VALUES
  ('53333333-3333-4333-8333-333333333301', '52222222-2222-4222-8222-222222222201', 'Indrayani Organic Rice (Unpolished)', '5 kg', 1, 46500, NULL, 2325, 48825),
  ('53333333-3333-4333-8333-333333333301', '52222222-2222-4222-8222-222222222203', 'Nashik Farm Alphonso Tomatoes & Greens Basket', '1.5 kg', 1, 14000, NULL, 0, 14000),
  ('53333333-3333-4333-8333-333333333302', '52222222-2222-4222-8222-222222222202', 'Gir A2 Cultured Bilona Ghee', '500 ml', 1, 69000, 64500, 8280, 77280),
  ('53333333-3333-4333-8333-333333333303', '52222222-2222-4222-8222-222222222206', 'ORS Electrolyte Rehydration Sachets (WHO Formula)', '10 x 21g', 1, 18000, NULL, 2160, 20160),
  ('53333333-3333-4333-8333-333333333303', '52222222-2222-4222-8222-222222222207', 'Schedule-H Prescription Dispensing Request (Pharmacist Gated)', 'As Prescribed', 1, 42000, NULL, 2100, 44100);

INSERT INTO public.attachments (id, community_id, owner_id, parent_type, parent_id, classification, storage_bucket, storage_path, mime_type, size_bytes, retention_state)
VALUES (
  '59999999-9999-4999-8999-999999999901',
  '11111111-1111-4111-8111-111111111111',
  '00000000-0000-4000-8000-000000000003',
  'order_prescription',
  '53333333-3333-4333-8333-333333333303',
  'prescription',
  'prescriptions-private',
  'rx/2026/rohan-kulkarni-rx-5333.pdf',
  'application/pdf',
  245120,
  'active'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.invoices (id, community_id, order_id, shop_id, buyer_id, invoice_number, seller_name_snapshot, seller_gstin_snapshot, subtotal_paise, tax_paise, delivery_fee_paise, total_paise, current_revision_number, status)
VALUES (
  '54444444-4444-4444-8444-444444444401',
  '11111111-1111-4111-8111-111111111111',
  '53333333-3333-4333-8333-333333333301',
  '51111111-1111-4111-8111-111111111101',
  '00000000-0000-4000-8000-000000000002',
  'INV-ADFM-2026-0104',
  'Annapurna Daily Fresh Mart',
  '27AABCA8921K1Z5',
  60500, 2325, 1500, 64325, 2, 'revised'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.invoice_revisions (invoice_id, revision_number, previous_total_paise, new_total_paise, adjustment_reason, revised_by)
VALUES (
  '54444444-4444-4444-8444-444444444401',
  2,
  66325,
  64325,
  'Rs 20.00 crate return credit applied on tomato basket handover (SHOP-09 traceable revision)',
  '00000000-0000-4000-8000-000000000021'
);

INSERT INTO public.ledger_entries (community_id, shop_id, order_id, invoice_id, entry_type, amount_paise, payment_evidence_note, is_settled_verified, recorded_by)
VALUES
  ('11111111-1111-4111-8111-111111111111', '51111111-1111-4111-8111-111111111101', '53333333-3333-4333-8333-333333333301', '54444444-4444-4444-8444-444444444401', 'sale_debit', 66325, 'Initial invoice INV-ADFM-2026-0104', true, '00000000-0000-4000-8000-000000000021'),
  ('11111111-1111-4111-8111-111111111111', '51111111-1111-4111-8111-111111111101', '53333333-3333-4333-8333-333333333301', '54444444-4444-4444-8444-444444444401', 'adjustment_credit', 2000, 'Crate return credit note revision #2', true, '00000000-0000-4000-8000-000000000021'),
  ('11111111-1111-4111-8111-111111111111', '51111111-1111-4111-8111-111111111101', '53333333-3333-4333-8333-333333333301', '54444444-4444-4444-8444-444444444401', 'payment_credit', 64325, 'Direct UPI UTR 629184719201 verified by merchant', true, '00000000-0000-4000-8000-000000000021'),
  ('11111111-1111-4111-8111-111111111111', '51111111-1111-4111-8111-111111111102', '53333333-3333-4333-8333-333333333303', NULL, 'sale_debit', 64260, 'Pharmacy order reported UPI screenshot; pending bank statement confirmation (SHOP-10)', false, '00000000-0000-4000-8000-000000000022');

-- ============================================================================
-- 6. SEED LOCAL SERVICES, RECOMMENDATIONS, ENQUIRIES & BOOKINGS (SRV-01..06)
-- ============================================================================

INSERT INTO public.service_categories (id, community_id, slug, name, description)
VALUES
  ('61111111-1111-4111-8111-111111111101', '11111111-1111-4111-8111-111111111111', 'electrician', 'Electricians & Inverter Repair', 'MCB tripping, wiring, ceiling fans, and inverter battery servicing.'),
  ('61111111-1111-4111-8111-111111111102', '11111111-1111-4111-8111-111111111111', 'plumber', 'Plumbers & Leak Diagnostics', 'Tap replacement, concealed pipeline repair, and flush tank servicing.'),
  ('61111111-1111-4111-8111-111111111103', '11111111-1111-4111-8111-111111111111', 'domestic-help', 'Maids, Cooks & Domestic Help', 'Part-time cooking, housekeeping, and elder-care assistance.'),
  ('61111111-1111-4111-8111-111111111104', '11111111-1111-4111-8111-111111111111', 'appliance-repair', 'AC, RO & Appliance Specialists', 'Split AC servicing, water purifier filter change, and washing machine repair.')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.providers (id, community_id, category_id, managed_by_user_id, recommended_by_member_id, display_name, listing_mode, description, service_area, availability_summary, indicative_pricing_text, contact_publication_consented, public_phone, verification_badge_scope, verified_rating_avg, verified_review_count, off_platform_recommendation_count)
VALUES
  (
    '62222222-2222-4222-8222-222222222201',
    '11111111-1111-4111-8111-111111111111',
    '61111111-1111-4111-8111-111111111101',
    '00000000-0000-4000-8000-000000000023',
    NULL,
    'Ramesh Vishwakarma — Electrical & Inverter Works',
    'provider_managed',
    'PWD-licensed wireman handling MCB panels, ELCB safety switches, fan regulators, and inverter installations across Towers A–F.',
    'Towers A–F, Serenity Heights',
    'Mon–Sat, 09:00 AM – 07:30 PM IST',
    'Inspection visit Rs 200 (adjusted in final bill); standard point repair Rs 150–350',
    true,
    '+91-9820000023',
    'Gate security ID & wireman licence number recorded; not a society warranty of work',
    4.75, 4, 3
  ),
  (
    '62222222-2222-4222-8222-222222222202',
    '11111111-1111-4111-8111-111111111111',
    '61111111-1111-4111-8111-111111111102',
    '00000000-0000-4000-8000-000000000024',
    '00000000-0000-4000-8000-000000000002',
    'Santosh Pawar — Plumbing & Pressure Valve Specialist',
    'member_recommended',
    'Recommended by Tower B residents for fixing concealed diverter leaks and kitchen sink traps without breaking tiles unnecessarily.',
    'Towers A–D',
    'Daily 08:30 AM – 06:00 PM IST',
    'Visit charge Rs 250; estimates shared before starting work',
    true,
    '+91-9820000024',
    'Member-recommended listing with signed contact publication consent (SRV-02)',
    4.50, 2, 5
  )
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.provider_memberships (provider_id, user_id, role)
VALUES
  ('62222222-2222-4222-8222-222222222201', '00000000-0000-4000-8000-000000000023', 'primary'),
  ('62222222-2222-4222-8222-222222222202', '00000000-0000-4000-8000-000000000024', 'primary')
ON CONFLICT DO NOTHING;

INSERT INTO public.recommendations (id, community_id, provider_id, member_id, is_off_platform, work_summary, approx_month_year, endorsement_note)
VALUES
  ('63333333-3333-4333-8333-333333333301', '11111111-1111-4111-8111-111111111111', '62222222-2222-4222-8222-222222222201', '00000000-0000-4000-8000-000000000002', true, 'Replaced burnt 32A AC MCB and balanced three-phase DB load', 'August 2026', 'Labelled as off-platform recommendation per SRV-06 (excluded from verified booking average). Arrived on time and carried genuine Havells spares.')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.service_enquiries (id, community_id, provider_id, resident_id, problem_description, preferred_schedule, quoted_price_paise, quote_notes, status)
VALUES
  ('64444444-4444-4444-8444-444444444401', '11111111-1111-4111-8111-111111111111', '62222222-2222-4222-8222-222222222201', '00000000-0000-4000-8000-000000000002', 'Study room ELCB trips whenever geyser and microwave run together; need earthing & load check.', 'Saturday 10:30 AM', 45000, 'Includes earthing leakage test and neutral busbar tightening; spare MCB extra at MRP if needed.', 'accepted'),
  ('64444444-4444-4444-8444-444444444402', '11111111-1111-4111-8111-111111111111', '62222222-2222-4222-8222-222222222202', '00000000-0000-4000-8000-000000000003', 'Utility balcony washing machine inlet valve seeping.', 'Tomorrow 11:00 AM', 35000, 'Labour Rs 350 + brass angle cock at hardware bill price.', 'quoted')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.service_bookings (id, community_id, enquiry_id, provider_id, resident_id, agreed_price_paise, scheduled_for, status, outcome_notes, completed_at)
VALUES (
  '65555555-5555-4555-8555-555555555501',
  '11111111-1111-4111-8111-111111111111',
  '64444444-4444-4444-8444-444444444401',
  '62222222-2222-4222-8222-222222222201',
  '00000000-0000-4000-8000-000000000002',
  45000,
  now() - interval '5 days',
  'completed',
  'Isolated neutral loop in kitchen socket; tested ELCB trip time at 28ms.',
  now() - interval '5 days'
) ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 7. SEED DEDICATED SOCIAL SERVICE LISTINGS & AGREEMENTS (SOC-01..10)
-- ============================================================================

INSERT INTO public.exchange_listings (
  id, community_id, owner_id, direction, exchange_mode, title, description, category,
  item_condition, total_quantity, allocated_quantity, price_paise, deposit_paise, rental_rate_paise_per_day,
  available_from, available_until, event_date, handover_options, status, expires_at
)
VALUES
  (
    '71111111-1111-4111-8111-111111111101',
    '11111111-1111-4111-8111-111111111111',
    '00000000-0000-4000-8000-000000000013',
    'need', 'request',
    'Need to Borrow 20 Foldable Chairs for Sharadotsav Acoustic Evening',
    'Looking to borrow stackable plastic or metal folding chairs for senior citizens seating at the Central Amphitheatre this Sunday evening.',
    'Events & Seating', 'good', 20, 8, 0, 0, 0,
    CURRENT_DATE, CURRENT_DATE + 5, CURRENT_DATE + 3,
    'Volunteer pick-up and return to your tower lobby', 'partially_allocated', now() + interval '4 days'
  ),
  (
    '71111111-1111-4111-8111-111111111102',
    '11111111-1111-4111-8111-111111111111',
    '00000000-0000-4000-8000-000000000002',
    'offer', 'giveaway',
    'Free Giveaway: 3-Seater Solid Teakwood Sofa (Cushions Freshly Dry-Cleaned)',
    'Renovating our living room in Tower B. Giving away a sturdy 3-seater teak frame sofa free to any resident family or common reading room.',
    'Furniture & Home', 'good', 1, 0, 0, 0, 0,
    CURRENT_DATE, CURRENT_DATE + 10, NULL,
    'Pickup via Tower B service lift (Dimensions: 74 x 32 inches)', 'open', now() + interval '10 days'
  ),
  (
    '71111111-1111-4111-8111-111111111103',
    '11111111-1111-4111-8111-111111111111',
    '00000000-0000-4000-8000-000000000003',
    'offer', 'sale',
    'Sale: Featherlite Ergonomic Study Table with Cable Tray (4ft x 2ft)',
    'Gently used for 14 months; height-adjustable glides and matte oak finish without scratches.',
    'Study & Office', 'like_new', 1, 0, 420000, 0, 0,
    CURRENT_DATE, CURRENT_DATE + 14, NULL,
    'Inspect at Tower C lobby by appointment', 'open', now() + interval '14 days'
  ),
  (
    '71111111-1111-4111-8111-111111111104',
    '11111111-1111-4111-8111-111111111111',
    '00000000-0000-4000-8000-000000000003',
    'offer', 'loan',
    'Lending: Heavy-Duty Aluminium 6-Step Foldable Ladder',
    'Available for fellow residents needing to change ceiling bulbs, clean fans, or hang curtains. Please return within 48 hours.',
    'Tools & Utilities', 'like_new', 1, 1, 0, 50000, 0,
    CURRENT_DATE - 3, CURRENT_DATE + 30, NULL,
    'Collect from Tower C stilt security rack', 'fully_allocated', now() + interval '30 days'
  ),
  (
    '71111111-1111-4111-8111-111111111105',
    '11111111-1111-4111-8111-111111111111',
    '00000000-0000-4000-8000-000000000013',
    'offer', 'rental',
    'Rental: Bose Portable PA Speaker + 2 UHF Wireless Microphones',
    'Ideal for birthday gatherings, housing society committee meetings, or acoustic rehearsals in the clubhouse.',
    'Audio & Event Gear', 'like_new', 1, 0, 0, 200000, 60000,
    CURRENT_DATE, CURRENT_DATE + 21, NULL,
    'Handover with sound check in Tower A lobby', 'open', now() + interval '21 days'
  ),
  (
    '71111111-1111-4111-8111-111111111106',
    '11111111-1111-4111-8111-111111111111',
    '00000000-0000-4000-8000-000000000002',
    'offer', 'swap',
    'Book Swap: Charles Correa Architectural Monographs & Illustrated Children''s Atlases',
    'Would love to swap for Indian history hardcovers, botanical illustration books, or regional Marathi literature.',
    'Books & Media', 'like_new', 3, 0, 0, 0, 0,
    CURRENT_DATE, CURRENT_DATE + 30, NULL,
    'Clubhouse library bench exchange', 'open', now() + interval '30 days'
  ),
  (
    '71111111-1111-4111-8111-111111111107',
    '11111111-1111-4111-8111-111111111111',
    '00000000-0000-4000-8000-000000000001',
    'offer', 'volunteer_help',
    'Volunteer Time Offer: Senior Citizen Jeevan Pramaan (Life Certificate) & DigiLocker Help',
    'Available every Sunday 10 AM – 12 PM to help senior residents complete annual pension life-certificate biometrics and utility bill auto-pay setup.',
    'Time & Neighbour Help', 'not_applicable', 5, 2, 0, 0, 0,
    CURRENT_DATE, CURRENT_DATE + 30, NULL,
    'Society Office Desk or home visit for mobility-restricted seniors', 'partially_allocated', now() + interval '30 days'
  )
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.exchange_agreements (
  id, community_id, listing_id, owner_id, counterparty_id, exchange_mode,
  agreed_quantity, agreed_condition, agreed_price_paise, agreed_deposit_paise, payment_deposit_status,
  handover_location_label, handover_at, due_back_at, responsibility_terms, version, terms_snapshot,
  owner_confirmed_at, counterparty_confirmed_at, status,
  handover_confirmed_by_owner_at, handover_confirmed_by_counterparty_at
)
VALUES
  (
    '73333333-3333-4333-8333-333333333301',
    '11111111-1111-4111-8111-111111111111',
    '71111111-1111-4111-8111-111111111104',
    '00000000-0000-4000-8000-000000000003',
    '00000000-0000-4000-8000-000000000002',
    'loan',
    1, 'Like new — all 4 rubber anti-skid shoes intact', 0, 50000, 'confirmed',
    'Tower C Stilt Lobby Desk', now() - interval '2 days', now() + interval '1 day',
    'Borrower cleans paint/dust marks before return; refundable Rs 500 deposit settled directly on return.',
    1,
    '{"item":"Heavy-Duty Aluminium 6-Step Foldable Ladder","quantity":1,"deposit_paise":50000,"due_hours":72}'::jsonb,
    now() - interval '2 days', now() - interval '2 days', 'active',
    now() - interval '2 days', now() - interval '2 days'
  ),
  (
    '73333333-3333-4333-8333-333333333302',
    '11111111-1111-4111-8111-111111111111',
    '71111111-1111-4111-8111-111111111101',
    '00000000-0000-4000-8000-000000000002',
    '00000000-0000-4000-8000-000000000013',
    'loan',
    8, 'Good — 8 stackable Nilkamal chairs', 0, 0, 'not_applicable',
    'Central Amphitheatre Store Room', now() - interval '6 days', now() - interval '3 days',
    'Return stacked and wiped within 24 hours of rehearsal.',
    1,
    '{"item":"8 Stackable Chairs","quantity":8}'::jsonb,
    now() - interval '6 days', now() - interval '6 days', 'completed',
    now() - interval '6 days', now() - interval '6 days'
  )
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.condition_reports (agreement_id, recorded_by, stage, condition_summary)
VALUES (
  '73333333-3333-4333-8333-333333333301',
  '00000000-0000-4000-8000-000000000003',
  'handover',
  'Handed over at Tower C lobby; hinges and anti-skid rubber feet verified by both Dr. Rohan and Priya.'
);

INSERT INTO public.return_extensions (id, agreement_id, requested_by, requested_due_at, reason, status)
VALUES (
  '74444444-4444-4444-8444-444444444401',
  '73333333-3333-4333-8333-333333333301',
  '00000000-0000-4000-8000-000000000002',
  now() + interval '2 days',
  'Electrician visiting tomorrow morning for balcony fixture; requesting 24-hour extension.',
  'pending'
) ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 8. SEED TRANSACTION-LINKED REPUTATION & BLIND REVIEWS (REP-01..08)
-- ============================================================================

INSERT INTO public.review_eligibility (
  id, community_id, interaction_type, exchange_agreement_id, service_booking_id,
  reviewer_id, subject_user_id, subject_provider_id, eligibility_reason,
  window_opens_at, window_ends_at, counterparty_eligibility_id
)
VALUES
  (
    '81111111-1111-4111-8111-111111111101',
    '11111111-1111-4111-8111-111111111111',
    'exchange', '73333333-3333-4333-8333-333333333302', NULL,
    '00000000-0000-4000-8000-000000000002', '00000000-0000-4000-8000-000000000013', NULL,
    'completed', now() - interval '3 days', now() + interval '11 days',
    '81111111-1111-4111-8111-111111111102'
  ),
  (
    '81111111-1111-4111-8111-111111111102',
    '11111111-1111-4111-8111-111111111111',
    'exchange', '73333333-3333-4333-8333-333333333302', NULL,
    '00000000-0000-4000-8000-000000000013', '00000000-0000-4000-8000-000000000002', NULL,
    'completed', now() - interval '3 days', now() + interval '11 days',
    '81111111-1111-4111-8111-111111111101'
  ),
  (
    '81111111-1111-4111-8111-111111111103',
    '11111111-1111-4111-8111-111111111111',
    'service_booking', NULL, '65555555-5555-4555-8555-555555555501',
    '00000000-0000-4000-8000-000000000002', '00000000-0000-4000-8000-000000000023', '62222222-2222-4222-8222-222222222201',
    'completed', now() - interval '5 days', now() + interval '9 days',
    NULL
  )
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.reviews (
  id, community_id, eligibility_id, reviewer_id, subject_user_id, subject_provider_id,
  target_kind, overall_rating, written_feedback, is_published, published_at
)
VALUES
  (
    '82222222-2222-4222-8222-222222222201',
    '11111111-1111-4111-8111-111111111111',
    '81111111-1111-4111-8111-111111111101',
    '00000000-0000-4000-8000-000000000002', '00000000-0000-4000-8000-000000000013', NULL,
    'member_exchange', 5,
    'Ananya and the event volunteers returned all 8 chairs wiped clean and 2 hours ahead of the agreed time.',
    true, now() - interval '2 days'
  ),
  (
    '82222222-2222-4222-8222-222222222202',
    '11111111-1111-4111-8111-111111111111',
    '81111111-1111-4111-8111-111111111102',
    '00000000-0000-4000-8000-000000000013', '00000000-0000-4000-8000-000000000002', NULL,
    'member_exchange', 5,
    'Priya coordinated smoothly with the Tower B lift guard so we could load the chairs without delay.',
    true, now() - interval '2 days'
  ),
  (
    '82222222-2222-4222-8222-222222222203',
    '11111111-1111-4111-8111-111111111111',
    '81111111-1111-4111-8111-111111111103',
    '00000000-0000-4000-8000-000000000002', '00000000-0000-4000-8000-000000000023', '62222222-2222-4222-8222-222222222201',
    'provider_service', 5,
    'Diagnosed the neutral loop quickly with a proper clamp meter and stuck strictly to the quoted Rs 450 charge.',
    true, now() - interval '4 days'
  )
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.review_dimensions (review_id, dimension_key, score)
VALUES
  ('82222222-2222-4222-8222-222222222201', 'communication', 5),
  ('82222222-2222-4222-8222-222222222201', 'reliability', 5),
  ('82222222-2222-4222-8222-222222222201', 'terms_fulfilment', 5),
  ('82222222-2222-4222-8222-222222222201', 'timeliness', 5),
  ('82222222-2222-4222-8222-222222222201', 'care_return_condition', 5),
  ('82222222-2222-4222-8222-222222222203', 'quality', 5),
  ('82222222-2222-4222-8222-222222222203', 'punctuality', 5),
  ('82222222-2222-4222-8222-222222222203', 'communication', 5),
  ('82222222-2222-4222-8222-222222222203', 'price_adherence', 5)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 9. SEED HELP REQUESTS, COMPLAINTS, SHARED ISSUES & CIVIC ESCALATION (HELP & CASE)
-- ============================================================================

INSERT INTO public.help_requests (id, community_id, requester_id, category, title, description, approx_area, timing_needed, visibility_scope, status, linked_social_service_note)
VALUES
  (
    '91111111-1111-4111-8111-111111111101',
    '11111111-1111-4111-8111-111111111111',
    '00000000-0000-4000-8000-000000000002',
    'domestic_staff_search',
    'Looking for Morning Cook (07:30 – 08:30 AM) in Tower B',
    'Seeking a reliable cook already holding a gate pass for Tower B or C for breakfast & tiffin prep.',
    'Tower B — Amaltas',
    'Starting 1st of next month',
    'community',
    'responding',
    'For borrowing kitchen equipment, use the Social Service tab.'
  ),
  (
    '91111111-1111-4111-8111-111111111102',
    '11111111-1111-4111-8111-111111111111',
    '00000000-0000-4000-8000-000000000003',
    'parcel_help',
    'Confidential Medical Courier Collection Request (Admin-Only Visibility)',
    'Away on hospital night duty; requesting estate desk to hold refrigerated vaccine sample box in main office chiller.',
    'Main Gate Security Office',
    'Tonight 21:00 IST',
    'admin_only',
    'arranged',
    NULL
  )
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.shared_issues (id, community_id, title, category, public_summary, status, linked_cases_count, created_by)
VALUES (
  '92222222-2222-4222-8222-222222222201',
  '11111111-1111-4111-8111-111111111111',
  'Low Municipal Water Supply Pressure & East Gate Feeder Valve Leakage',
  'water',
  'Combined tracking issue for reduced morning municipal water inflow affecting Towers B & C and the leaking sluice valve outside East Gate.',
  'externally_forwarded',
  2,
  '00000000-0000-4000-8000-000000000014'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.complaints (
  id, community_id, case_reference, reporter_id, building_id, category, title, description,
  location_detail, privacy_choice, consented_for_external_escalation, status, assigned_admin_id,
  next_action, follow_up_date, shared_issue_id
)
VALUES
  (
    '93333333-3333-4333-8333-333333333301',
    '11111111-1111-4111-8111-111111111111',
    'CASE-2026-WTR-101',
    '00000000-0000-4000-8000-000000000002',
    '22222222-2222-4222-8222-222222222202',
    'water',
    'Severe Drop in Morning Flushing & Domestic Water Pressure on Upper Floors',
    'Pressure drops to a trickle between 07:30 and 09:00 AM on 7th floor. Private unit plumbing verified clear.',
    'Tower B — 7th Floor Riser #2',
    'shareable_redacted',
    true,
    'externally_forwarded',
    '00000000-0000-4000-8000-000000000014',
    'Follow up with BMC K-West Ward Hydraulic Engineer on docket #KW-HYD-88412',
    CURRENT_DATE + 2,
    '92222222-2222-4222-8222-222222222201'
  ),
  (
    '93333333-3333-4333-8333-333333333302',
    '11111111-1111-4111-8111-111111111111',
    'CASE-2026-ELC-102',
    '00000000-0000-4000-8000-000000000003',
    '22222222-2222-4222-8222-222222222203',
    'electricity',
    'Basement B1 EV Charging Bay #4 RCCB Tripping Repeatedly',
    'Private confidential complaint regarding voltage fluctuation on bay #4 meter line.',
    'Tower C Basement B1 Bay #4',
    'private_to_admin',
    false,
    'in_progress',
    '00000000-0000-4000-8000-000000000015',
    'Replace 40A Type-A RCCB and test earth resistance',
    CURRENT_DATE + 1,
    NULL
  )
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.complaint_issue_links (complaint_id, shared_issue_id, resident_consented, linked_by)
VALUES ('93333333-3333-4333-8333-333333333301', '92222222-2222-4222-8222-222222222201', true, '00000000-0000-4000-8000-000000000014')
ON CONFLICT DO NOTHING;

INSERT INTO public.case_events (complaint_id, actor_id, from_status, to_status, note, is_internal_only)
VALUES
  ('93333333-3333-4333-8333-333333333301', '00000000-0000-4000-8000-000000000002', NULL, 'submitted', 'Resident submitted complaint with consent for redacted civic escalation.', false),
  ('93333333-3333-4333-8333-333333333301', '00000000-0000-4000-8000-000000000014', 'submitted', 'triaged', 'Inspected Tower B terrace booster pump; issue traced to low municipal main pressure.', false),
  ('93333333-3333-4333-8333-333333333301', '00000000-0000-4000-8000-000000000017', 'triaged', 'externally_forwarded', 'Prepared redacted escalation package and logged manual municipal docket #KW-HYD-88412 (Awaiting official acknowledgement — CASE-05).', false);

INSERT INTO public.authority_contacts (id, community_id, jurisdiction_name, department_category, office_title, submission_channel, contact_reference, source_url, last_verified_at)
VALUES
  ('94444444-4444-4444-8444-444444444401', '11111111-1111-4111-8111-111111111111', 'BMC K-West Ward (Andheri West)', 'water', 'Assistant Engineer (Water Works) K-West', 'Manual Ward Citizen Facilitation Centre / Portal Docket', '022-26234000 / kw.water@mcgm.example.gov.in', 'https://portal.mcgm.gov.in', CURRENT_DATE - 12),
  ('94444444-4444-4444-8444-444444444402', '11111111-1111-4111-8111-111111111111', 'BMC K-West Ward (Andheri West)', 'roads', 'Executive Engineer (Roads & Stormwater Drains)', 'Manual Ward Docket Submission', '022-26234015', 'https://portal.mcgm.gov.in', CURRENT_DATE - 20)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.escalation_records (
  id, community_id, shared_issue_id, complaint_id, authority_contact_id,
  redacted_package_summary, consented_complaint_count, status, submission_mode,
  official_docket_reference, acknowledgement_evidence_note, prepared_by, submitted_at
)
VALUES (
  '95555555-5555-4555-8555-555555555501',
  '11111111-1111-4111-8111-111111111111',
  '92222222-2222-4222-8222-222222222201',
  '93333333-3333-4333-8333-333333333301',
  '94444444-4444-4444-8444-444444444401',
  'Redacted summary of 2 consented resident reports in Towers B & C showing municipal inlet pressure below 0.8 bar between 06:30–08:30 AM IST. Personal flat numbers and phone numbers removed.',
  2,
  'submitted',
  'manual_docket_recorded',
  'KW-HYD-88412',
  'Manual paper/portal docket filed by Sub-Admin Devendra Patil. Status remains "submitted" (NOT "acknowledged") until official ward inspection receipt is uploaded (CASE-05/06).',
  '00000000-0000-4000-8000-000000000017',
  now() - interval '1 day'
) ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 10. SEED SOS INCIDENTS, STAFF WORKFORCE, CONSENTED LOCATION & CCTV (Phases 4 & 5)
-- ============================================================================

INSERT INTO public.staff_profiles (user_id, community_id, staff_code, employer_team, role_title, assigned_building_id, assigned_post_label, is_active_responder)
VALUES
  ('00000000-0000-4000-8000-000000000025', '11111111-1111-4111-8111-111111111111', 'SEC-101', 'Sentinel Facilities & Security Pvt Ltd', 'head_guard', NULL, 'Main Gate Control Room & Emergency Response', true),
  ('00000000-0000-4000-8000-000000000026', '11111111-1111-4111-8111-111111111111', 'SEC-104', 'Sentinel Facilities & Security Pvt Ltd', 'security_guard', '22222222-2222-4222-8222-222222222202', 'Tower B Lobby & Courtyard Patrol', true)
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO public.shifts (id, community_id, staff_user_id, shift_name, assigned_post_label, starts_at, ends_at, status, checked_in_at, checked_out_at)
VALUES
  ('a1111111-1111-4111-8111-111111111101', '11111111-1111-4111-8111-111111111111', '00000000-0000-4000-8000-000000000025', 'Morning Control Room Shift (06:00–14:00)', 'Main Gate Control Room', now() - interval '2 hours', now() + interval '6 hours', 'on_duty', now() - interval '2 hours', NULL),
  ('a1111111-1111-4111-8111-111111111102', '11111111-1111-4111-8111-111111111111', '00000000-0000-4000-8000-000000000026', 'Night Courtyard Shift (22:00–06:00)', 'Tower B Lobby', now() - interval '10 hours', now() - interval '2 hours', 'completed', now() - interval '10 hours', now() - interval '2 hours')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.tasks (id, community_id, shift_id, staff_user_id, title, area_label, status)
VALUES
  ('a2222222-2222-4222-8222-222222222201', '11111111-1111-4111-8111-111111111111', 'a1111111-1111-4111-8111-111111111101', '00000000-0000-4000-8000-000000000025', 'Verify Lift Intercom Battery Backup across Towers A–C', 'Towers A, B, C Lift Lobbies', 'in_progress'),
  ('a2222222-2222-4222-8222-222222222202', '11111111-1111-4111-8111-111111111111', 'a1111111-1111-4111-8111-111111111101', '00000000-0000-4000-8000-000000000025', 'Inspect Fire Hydrant Booster Gauge at Pump Room', 'Central Pump Room', 'completed')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.patrol_checkpoints (id, community_id, building_id, checkpoint_code, location_name, last_checked_by, last_checked_at)
VALUES
  ('a3333333-3333-4333-8333-333333333301', '11111111-1111-4111-8111-111111111111', '22222222-2222-4222-8222-222222222201', 'CHK-GATE-01', 'Main Vehicular Boom Barrier & Guard Post', '00000000-0000-4000-8000-000000000025', now() - interval '25 minutes'),
  ('a3333333-3333-4333-8333-333333333302', '11111111-1111-4111-8111-111111111111', '22222222-2222-4222-8222-222222222202', 'CHK-TWRB-LFT', 'Tower B Passenger Lift #1 & #2 Machine Room Door', '00000000-0000-4000-8000-000000000025', now() - interval '12 minutes')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.location_sharing_sessions (id, community_id, staff_user_id, shift_id, purpose, device_permission_state, consent_given, is_active, started_at)
VALUES (
  'a4444444-4444-4444-8444-444444444401',
  '11111111-1111-4111-8111-111111111111',
  '00000000-0000-4000-8000-000000000025',
  'a1111111-1111-4111-8111-111111111101',
  'On-duty emergency responder & morning patrol visibility (Consented foreground session)',
  'demo_simulated',
  true,
  true,
  now() - interval '45 minutes'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.current_locations (session_id, community_id, staff_user_id, approximate_zone_label, latitude, longitude, accuracy_meters, is_demo_simulated, updated_at)
VALUES (
  'a4444444-4444-4444-8444-444444444401',
  '11111111-1111-4111-8111-111111111111',
  '00000000-0000-4000-8000-000000000025',
  'Main Gate Control Room & Tower A Driveway Zone',
  19.1364,
  72.8296,
  12.5,
  true,
  now() - interval '20 seconds'
) ON CONFLICT (session_id) DO NOTHING;

INSERT INTO public.location_grants (id, community_id, subject_staff_user_id, viewer_role, viewer_user_id, purpose, precision_level, allow_history, granted_by, valid_until)
VALUES
  ('a5555555-5555-4555-8555-555555555501', '11111111-1111-4111-8111-111111111111', '00000000-0000-4000-8000-000000000025', 'approved_member', NULL, 'Resident duty availability & zone awareness (Approximate zone only)', 'approximate', false, '00000000-0000-4000-8000-000000000020', now() + interval '30 days'),
  ('a5555555-5555-4555-8555-555555555502', '11111111-1111-4111-8111-111111111111', '00000000-0000-4000-8000-000000000025', 'safety_sub_admin', '00000000-0000-4000-8000-000000000020', 'SOS dispatch & patrol coordination (Precise coordinates authorised)', 'precise', true, '00000000-0000-4000-8000-000000000001', now() + interval '30 days')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.incidents (
  id, community_id, reporter_id, category, building_id,
  manual_floor_label, manual_lift_or_area_label,
  approx_area_public_label, safe_guidance_public_text, restricted_responder_details,
  status, acknowledged_by_user_id, acknowledged_at, is_demo_simulation
)
VALUES (
  'a6666666-6666-4666-8666-666666666601',
  '11111111-1111-4111-8111-111111111111',
  '00000000-0000-4000-8000-000000000002',
  'lift_entrapment',
  '22222222-2222-4222-8222-222222222202',
  'Between 4th and 5th Floor',
  'Tower B Passenger Lift #2 (South)',
  'Tower B — Amaltas Lift Lobby',
  'Passenger Lift #2 in Tower B is temporarily halted; Head Guard Mahesh Yadav is on-site operating manual rescue release. Please use Passenger Lift #1 or the staircase.',
  '[RESTRICTED RESPONDER DETAIL] Reporter: Priya Nair (Flat B-704, Phone +91-9820000002). Elderly neighbour accompanying her inside car; ARD fan running, no medical distress reported.',
  'responder_acknowledged',
  '00000000-0000-4000-8000-000000000025',
  now() - interval '4 minutes',
  true
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.incident_responders (incident_id, responder_user_id, assignment_status)
VALUES ('a6666666-6666-4666-8666-666666666601', '00000000-0000-4000-8000-000000000025', 'acknowledged')
ON CONFLICT DO NOTHING;

INSERT INTO public.incident_alert_deliveries (incident_id, channel, delivery_status, retry_count, failure_reason)
VALUES
  ('a6666666-6666-4666-8666-666666666601', 'in_app_responder', 'acknowledged', 0, NULL),
  ('a6666666-6666-4666-8666-666666666601', 'in_app_community_sanitised', 'provider_accepted', 0, NULL),
  ('a6666666-6666-4666-8666-666666666601', 'sms_adapter', 'failed', 2, 'SMS Gateway credentials unconfigured in demo environment — showing honest delivery failure per SOS-06');

INSERT INTO public.camera_groups (id, community_id, name, area_classification)
VALUES
  ('b1111111-1111-4111-8111-111111111101', '11111111-1111-4111-8111-111111111111', 'Perimeter & Entry Gates', 'perimeter_gate'),
  ('b1111111-1111-4111-8111-111111111102', '11111111-1111-4111-8111-111111111111', 'Tower Ground Lobbies (Common Areas Only)', 'building_lobby'),
  ('b1111111-1111-4111-8111-111111111103', '11111111-1111-4111-8111-111111111111', 'Central Amphitheatre & Courtyard', 'common_courtyard')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.cameras (id, community_id, group_id, building_id, camera_code, display_name, common_area_label, privacy_designation, integration_type, online_state, recording_export_enabled)
VALUES
  ('b2222222-2222-4222-8222-222222222201', '11111111-1111-4111-8111-111111111111', 'b1111111-1111-4111-8111-111111111101', NULL, 'CAM-GATE-01', 'Main Vehicular Entry & Guard Cabin', 'Main Gate Common Driveway', 'Common perimeter area only; zero residential window overlap', 'demo_synthetic_adapter', 'online_demo', false),
  ('b2222222-2222-4222-8222-222222222202', '11111111-1111-4111-8111-111111111111', 'b1111111-1111-4111-8111-111111111102', '22222222-2222-4222-8222-222222222202', 'CAM-TWRB-LBY', 'Tower B Ground Floor Lift Waiting Concourse', 'Tower B Ground Lobby', 'Common lift vestibule only; private flat doors excluded', 'demo_synthetic_adapter', 'online_demo', false),
  ('b2222222-2222-4222-8222-222222222203', '11111111-1111-4111-8111-111111111111', 'b1111111-1111-4111-8111-111111111103', NULL, 'CAM-CRTYD-01', 'Children''s Play Area & Amphitheatre Walkway', 'Central Courtyard North', 'Common walkway only; recording export disabled by default', 'demo_synthetic_adapter', 'online_demo', false),
  ('b2222222-2222-4222-8222-222222222204', '11111111-1111-4111-8111-111111111111', 'b1111111-1111-4111-8111-111111111101', NULL, 'CAM-EAST-02', 'East Service Gate & Tanker Bay', 'East Perimeter Service Gate', 'Common service bay; NVR channel currently offline for cable maintenance', 'unconfigured_nvr', 'offline', false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.camera_secrets (camera_id, internal_gateway_host, encrypted_credential_ref)
VALUES
  ('b2222222-2222-4222-8222-222222222201', 'nvr-gateway.internal.serenityheights.local', 'vault:secret/cctv/cam-gate-01'),
  ('b2222222-2222-4222-8222-222222222202', 'nvr-gateway.internal.serenityheights.local', 'vault:secret/cctv/cam-twrb-lby')
ON CONFLICT (camera_id) DO NOTHING;

INSERT INTO public.camera_grants (id, community_id, camera_id, grantee_user_id, grantee_role_scope, permission_type, purpose, granted_by, expires_at)
VALUES
  ('b3333333-3333-4333-8333-333333333301', '11111111-1111-4111-8111-111111111111', 'b2222222-2222-4222-8222-222222222201', '00000000-0000-4000-8000-000000000020', 'safety', 'live', 'Safety Sub-Admin gate monitoring', '00000000-0000-4000-8000-000000000001', now() + interval '30 days'),
  ('b3333333-3333-4333-8333-333333333302', '11111111-1111-4111-8111-111111111111', 'b2222222-2222-4222-8222-222222222202', '00000000-0000-4000-8000-000000000020', 'safety', 'live', 'Tower B lift lobby emergency verification', '00000000-0000-4000-8000-000000000001', now() + interval '30 days'),
  ('b3333333-3333-4333-8333-333333333303', '11111111-1111-4111-8111-111111111111', 'b2222222-2222-4222-8222-222222222201', '00000000-0000-4000-8000-000000000025', 'staff_responder', 'live', 'Main Gate control desk live feed', '00000000-0000-4000-8000-000000000020', now() + interval '30 days'),
  ('b3333333-3333-4333-8333-333333333304', '11111111-1111-4111-8111-111111111111', 'b2222222-2222-4222-8222-222222222201', '00000000-0000-4000-8000-000000000002', 'resident_scoped', 'live', 'Temporary 4-hour Main Gate live grant for furniture pickup vehicle arrival', '00000000-0000-4000-8000-000000000020', now() + interval '4 hours')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.integration_settings (community_id, adapter_key, display_name, status, status_reason)
VALUES
  ('11111111-1111-4111-8111-111111111111', 'supabase_core', 'Supabase Auth, Postgres, RLS & Private Storage', 'configured', 'Connected to live Postgres 17 instance (runquwuetzfivhwefenk) with active RLS policies.'),
  ('11111111-1111-4111-8111-111111111111', 'notifications_outbox', 'In-App Notifications & External SMS/WhatsApp Outbox', 'demo', 'In-app notifications are live; SMS/WhatsApp adapters run in honest demo queue mode until Twilio/Meta keys are configured.'),
  ('11111111-1111-4111-8111-111111111111', 'payments_settlement', 'Merchant Payment & Settlement Adapter', 'demo', 'Pay-on-Delivery and Direct Merchant UPI reporting active; automated Razorpay escrow/settlement is unconfigured.'),
  ('11111111-1111-4111-8111-111111111111', 'pharmacy_rx_workflow', 'Licensed Pharmacist Prescription Verification', 'demo', 'Private Rx storage & pharmacist role check enforced; live medicine dispatch gated on partner licence onboarding.'),
  ('11111111-1111-4111-8111-111111111111', 'civic_authority_portal', 'Municipal / Civic Authority Escalation Portal', 'demo', 'Generates consented redacted escalation packages and tracks manual official docket references; never fabricates municipal receipt.'),
  ('11111111-1111-4111-8111-111111111111', 'foreground_staff_location', 'Consented Foreground Staff Duty Location', 'configured', 'Browser Geolocation API + demo shift simulator with 120s staleness indicator; no background tracking claim.'),
  ('11111111-1111-4111-8111-111111111111', 'cctv_media_gateway', 'Common-Area CCTV Scoped Session Gateway', 'demo', 'Issues 60-second server-scoped tokens with audit logs and serves watermarked synthetic sample footage (no RTSP on Vercel).')
ON CONFLICT (adapter_key) DO NOTHING;

INSERT INTO public.notifications (community_id, recipient_id, category, title, safe_preview_body, link_route, is_urgent)
VALUES
  ('11111111-1111-4111-8111-111111111111', '00000000-0000-4000-8000-000000000002', 'order', 'Action Required: Annapurna Mart Price/Pack Adjustment', 'Shop proposed a pack adjustment on your order (Rs 738.00). Please review and approve or cancel.', '/shops', false),
  ('11111111-1111-4111-8111-111111111111', '00000000-0000-4000-8000-000000000002', 'complaint', 'Case CASE-2026-WTR-101 Linked to Shared Issue', 'Your water pressure report was linked to the Tower B/C municipal supply shared issue (Docket #KW-HYD-88412).', '/help-complaints', false),
  ('11111111-1111-4111-8111-111111111111', '00000000-0000-4000-8000-000000000003', 'exchange', 'Return Extension Requested on 6-Step Ladder Loan', 'Priya Nair requested a 24-hour return extension on your foldable ladder loan.', '/social-service', false);
