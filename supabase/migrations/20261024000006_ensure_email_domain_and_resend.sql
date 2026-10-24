-- ============================================================================
-- MyCircle v1.3 — Migrate All Emails to @ensure.in & Configure Resend Email Adapter
-- Target: Supabase PostgreSQL 17 (Project: mycircle / runquwuetzfivhwefenk)
-- ============================================================================

-- 1. Update all user_credentials emails from @mycircle.in to @ensure.in
UPDATE public.user_credentials
SET email = regexp_replace(email, '@mycircle\.in$', '@ensure.in', 'i')
WHERE email ~* '@mycircle\.in$';

-- Ensure all 10 deterministic test accounts have exact @ensure.in email addresses
INSERT INTO public.user_credentials (user_id, email, username, password_hash, role_label)
VALUES
  (
    '00000000-0000-4000-8000-000000000001',
    'admin@ensure.in',
    'admin',
    pg_catalog.md5('mycircle_v1_salt:MyCircle@Admin2026'),
    'Primary Society Admin (All 12 Modules)'
  ),
  (
    '00000000-0000-4000-8000-000000000002',
    'priya@ensure.in',
    'priya',
    pg_catalog.md5('mycircle_v1_salt:MyCircle@User2026'),
    'Approved Resident (Tower B-402 • Architect)'
  ),
  (
    '00000000-0000-4000-8000-000000000003',
    'rohan@ensure.in',
    'rohan',
    pg_catalog.md5('mycircle_v1_salt:MyCircle@User2026'),
    'Approved Resident (Tower C • Paediatrician)'
  ),
  (
    '00000000-0000-4000-8000-000000000011',
    'neha.admin@ensure.in',
    'neha_admin',
    pg_catalog.md5('mycircle_v1_salt:MyCircle@SubAdmin2026'),
    'Sub-Admin #1 — Membership & Directory Verification'
  ),
  (
    '00000000-0000-4000-8000-000000000020',
    'safety.admin@ensure.in',
    'safety_admin',
    pg_catalog.md5('mycircle_v1_salt:MyCircle@SubAdmin2026'),
    'Sub-Admin #10 — Safety, SOS & CCTV Governance'
  ),
  (
    '00000000-0000-4000-8000-000000000021',
    'shop@ensure.in',
    'freshmart',
    pg_catalog.md5('mycircle_v1_salt:MyCircle@Shop2026'),
    'Shop Owner — Annapurna Daily Fresh Mart'
  ),
  (
    '00000000-0000-4000-8000-000000000022',
    'pharmacy@ensure.in',
    'pharmacist',
    pg_catalog.md5('mycircle_v1_salt:MyCircle@Shop2026'),
    'Licensed Pharmacist — CarePlus Pharmacy'
  ),
  (
    '00000000-0000-4000-8000-000000000023',
    'provider@ensure.in',
    'ramesh_elec',
    pg_catalog.md5('mycircle_v1_salt:MyCircle@Service2026'),
    'Service Provider — Master Electrician'
  ),
  (
    '00000000-0000-4000-8000-000000000025',
    'security@ensure.in',
    'mahesh_guard',
    pg_catalog.md5('mycircle_v1_salt:MyCircle@Staff2026'),
    'Head Security Guard & Active SOS Responder'
  ),
  (
    '00000000-0000-4000-8000-000000000004',
    'pending@ensure.in',
    'pending_user',
    pg_catalog.md5('mycircle_v1_salt:MyCircle@User2026'),
    'Pending Resident Applicant (Access Gate Test)'
  )
ON CONFLICT (user_id) DO UPDATE SET
  email = EXCLUDED.email,
  username = EXCLUDED.username,
  role_label = EXCLUDED.role_label;

-- 2. Update private_contacts alternate_email to @ensure.in
UPDATE public.private_contacts
SET alternate_email = regexp_replace(alternate_email, '@(mycircle\.in|example\.org)$', '@ensure.in', 'i')
WHERE alternate_email ~* '@(mycircle\.in|example\.org)$';

-- Sync private_contacts.alternate_email with user_credentials.email where present
UPDATE public.private_contacts pc
SET alternate_email = uc.email
FROM public.user_credentials uc
WHERE pc.user_id = uc.user_id;

-- 3. Update cc_get_actor_account_details fallback domain to @ensure.in
CREATE OR REPLACE FUNCTION public.cc_get_actor_account_details(
  p_actor_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'user_id', p.id,
    'username', COALESCE(uc.username, 'member_' || right(p.id::text, 4)),
    'email', COALESCE(uc.email, 'resident.' || right(p.id::text, 4) || '@ensure.in'),
    'role_label', COALESCE(uc.role_label, 'Verified Resident Member'),
    'professional_headline', pp.headline,
    'years_experience', pp.years_experience,
    'qualifications', pp.qualifications,
    'business_name', bp.business_name,
    'business_category', bp.category,
    'business_description', bp.description
  )
  INTO v_result
  FROM public.profiles p
  LEFT JOIN public.user_credentials uc ON uc.user_id = p.id
  LEFT JOIN public.professional_profiles pp ON pp.user_id = p.id
  LEFT JOIN public.business_profiles bp ON bp.user_id = p.id
  WHERE p.id = p_actor_id;

  RETURN COALESCE(v_result, '{}'::jsonb);
END;
$$;

-- 4. Mark Resend Email Adapter as 'configured' in integration_settings
UPDATE public.integration_settings
SET
  status = 'configured',
  status_reason = 'Live Resend API configured for @ensure.in transactional emails (Registration, Password Reset, Orders, Exchanges & SOS).'
WHERE adapter_key ILIKE '%resend%' OR adapter_key ILIKE '%email%';

GRANT EXECUTE ON FUNCTION public.cc_get_actor_account_details(uuid) TO anon, authenticated, service_role;
