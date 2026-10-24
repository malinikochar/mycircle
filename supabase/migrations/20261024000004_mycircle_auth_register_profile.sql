-- ============================================================================
-- MyCircle v1.1 — Authentication, Member Registration & Full Profile Management
-- Target: Supabase PostgreSQL 17 (Project: mycircle / runquwuetzfivhwefenk)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.user_credentials (
  user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role_label TEXT NOT NULL DEFAULT 'Resident Member',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.user_credentials ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'user_credentials'
      AND policyname = 'user_credentials_self_select'
  ) THEN
    CREATE POLICY "user_credentials_self_select" ON public.user_credentials
      FOR SELECT TO authenticated
      USING (user_id = (SELECT auth.uid()));
  END IF;
END $$;

-- Seed deterministic credentials for Admin, Sub-Admins, Residents, Shops, Providers, Staff & Pending Applicant
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
  password_hash = EXCLUDED.password_hash,
  role_label = EXCLUDED.role_label;

-- 1. Authenticate User by Username or Email + Password
CREATE OR REPLACE FUNCTION public.cc_authenticate_user(
  p_identifier text,
  p_password text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_cred record;
  v_clean_identifier text := lower(trim(COALESCE(p_identifier, '')));
BEGIN
  IF v_clean_identifier = '' OR COALESCE(p_password, '') = '' THEN
    RAISE EXCEPTION 'Username/email and password are required';
  END IF;

  SELECT
    uc.user_id,
    uc.email,
    uc.username,
    uc.password_hash,
    uc.role_label,
    p.display_name,
    p.community_id,
    COALESCE(m.status, 'pending') AS membership_status
  INTO v_cred
  FROM public.user_credentials uc
  JOIN public.profiles p ON p.id = uc.user_id
  LEFT JOIN public.memberships m ON m.user_id = uc.user_id AND m.community_id = p.community_id
  WHERE lower(uc.username) = v_clean_identifier
     OR lower(uc.email) = v_clean_identifier;

  IF v_cred.user_id IS NULL THEN
    RAISE EXCEPTION 'Invalid username/email or password';
  END IF;

  IF v_cred.password_hash <> pg_catalog.md5('mycircle_v1_salt:' || p_password) THEN
    RAISE EXCEPTION 'Invalid username/email or password';
  END IF;

  INSERT INTO public.audit_events (
    community_id, actor_id, workspace_context, action_type, target_type, target_id, metadata
  ) VALUES (
    v_cred.community_id,
    v_cred.user_id,
    'auth_portal',
    'user_authenticated_login',
    'user_credentials',
    v_cred.user_id,
    jsonb_build_object('username', v_cred.username, 'email', v_cred.email)
  );

  RETURN jsonb_build_object(
    'authenticated', true,
    'user_id', v_cred.user_id,
    'display_name', v_cred.display_name,
    'username', v_cred.username,
    'email', v_cred.email,
    'role_label', v_cred.role_label,
    'membership_status', v_cred.membership_status
  );
END;
$$;

-- 2. Register a New Community Member (Creates Profile, Private Contacts, Visibility, Membership & Credentials)
CREATE OR REPLACE FUNCTION public.cc_register_member(
  p_display_name text,
  p_username text,
  p_email text,
  p_password text,
  p_profession text,
  p_building_id uuid,
  p_unit_number text,
  p_phone text,
  p_residency_type text DEFAULT 'owner_resident',
  p_bio text DEFAULT '',
  p_auto_approve boolean DEFAULT true
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_community_id uuid := '11111111-1111-4111-8111-111111111111'::uuid;
  v_new_user_id uuid := gen_random_uuid();
  v_clean_username text := lower(trim(COALESCE(p_username, '')));
  v_clean_email text := lower(trim(COALESCE(p_email, '')));
  v_status text := CASE WHEN COALESCE(p_auto_approve, true) THEN 'approved' ELSE 'pending' END;
  v_building_id uuid := COALESCE(p_building_id, '22222222-2222-4222-8222-222222222201'::uuid);
  v_residency text := CASE
    WHEN p_residency_type IN ('owner_resident', 'tenant_resident', 'family_member') THEN p_residency_type
    ELSE 'owner_resident'
  END;
BEGIN
  IF trim(COALESCE(p_display_name, '')) = '' THEN
    RAISE EXCEPTION 'Full display name is required';
  END IF;

  IF length(v_clean_username) < 3 THEN
    RAISE EXCEPTION 'Username must be at least 3 characters';
  END IF;

  IF position('@' in v_clean_email) = 0 THEN
    RAISE EXCEPTION 'Valid email address is required';
  END IF;

  IF length(COALESCE(p_password, '')) < 6 THEN
    RAISE EXCEPTION 'Password must be at least 6 characters';
  END IF;

  IF EXISTS (SELECT 1 FROM public.user_credentials WHERE lower(username) = v_clean_username) THEN
    RAISE EXCEPTION 'Username "%" is already taken', v_clean_username;
  END IF;

  IF EXISTS (SELECT 1 FROM public.user_credentials WHERE lower(email) = v_clean_email) THEN
    RAISE EXCEPTION 'Email "%" is already registered', v_clean_email;
  END IF;

  INSERT INTO public.profiles (
    id, community_id, display_name, bio, interests, profession, skills
  ) VALUES (
    v_new_user_id,
    v_community_id,
    trim(p_display_name),
    COALESCE(NULLIF(trim(p_bio), ''), 'Verified resident member of Serenity Heights on MyCircle.'),
    ARRAY['community', 'neighbourhood'],
    COALESCE(NULLIF(trim(p_profession), ''), 'Community Resident'),
    ARRAY['Community Collaboration']
  );

  INSERT INTO public.memberships (
    user_id, community_id, building_id, status, status_reason, approved_by, approved_at
  ) VALUES (
    v_new_user_id,
    v_community_id,
    v_building_id,
    v_status,
    CASE
      WHEN v_status = 'approved' THEN 'Verified resident registration via MyCircle onboarding'
      ELSE 'Pending Membership Sub-Admin verification of society flat/unit'
    END,
    CASE WHEN v_status = 'approved' THEN '00000000-0000-4000-8000-000000000001'::uuid ELSE NULL END,
    CASE WHEN v_status = 'approved' THEN now() ELSE NULL END
  );

  INSERT INTO public.private_contacts (
    user_id, community_id, building_id, unit_number, personal_phone, alternate_email, residency_type
  ) VALUES (
    v_new_user_id,
    v_community_id,
    v_building_id,
    COALESCE(NULLIF(trim(p_unit_number), ''), '101'),
    COALESCE(NULLIF(trim(p_phone), ''), '+91-9820000999'),
    v_clean_email,
    v_residency
  );

  INSERT INTO public.profile_visibility (
    user_id, community_id, show_building, show_unit, show_phone, show_profession, show_business, allow_direct_messages
  ) VALUES (
    v_new_user_id,
    v_community_id,
    true,
    false,
    false,
    true,
    true,
    true
  );

  INSERT INTO public.user_credentials (
    user_id, email, username, password_hash, role_label
  ) VALUES (
    v_new_user_id,
    v_clean_email,
    v_clean_username,
    pg_catalog.md5('mycircle_v1_salt:' || p_password),
    CASE
      WHEN v_status = 'approved' THEN 'Approved Resident (' || COALESCE(NULLIF(trim(p_profession), ''), 'Member') || ')'
      ELSE 'Pending Resident Applicant'
    END
  );

  INSERT INTO public.audit_events (
    community_id, actor_id, workspace_context, action_type, target_type, target_id, metadata
  ) VALUES (
    v_community_id,
    v_new_user_id,
    'auth_portal',
    'member_registered',
    'profiles',
    v_new_user_id,
    jsonb_build_object(
      'username', v_clean_username,
      'email', v_clean_email,
      'membership_status', v_status
    )
  );

  RETURN jsonb_build_object(
    'registered', true,
    'user_id', v_new_user_id,
    'display_name', trim(p_display_name),
    'username', v_clean_username,
    'email', v_clean_email,
    'membership_status', v_status
  );
END;
$$;

-- 3. Update Member Profile, Contact Info, Professional Headline & Business Listing
CREATE OR REPLACE FUNCTION public.cc_update_member_profile(
  p_actor_id uuid,
  p_display_name text,
  p_profession text,
  p_bio text,
  p_skills text[],
  p_interests text[],
  p_unit_number text,
  p_personal_phone text,
  p_residency_type text DEFAULT 'owner_resident',
  p_headline text DEFAULT NULL,
  p_business_name text DEFAULT NULL,
  p_business_category text DEFAULT NULL,
  p_business_description text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_community_id uuid := '11111111-1111-4111-8111-111111111111'::uuid;
  v_existing record;
  v_residency text := CASE
    WHEN p_residency_type IN ('owner_resident', 'tenant_resident', 'family_member') THEN p_residency_type
    ELSE 'owner_resident'
  END;
BEGIN
  SELECT p.id, p.community_id, m.building_id
  INTO v_existing
  FROM public.profiles p
  LEFT JOIN public.memberships m ON m.user_id = p.id AND m.community_id = p.community_id
  WHERE p.id = p_actor_id;

  IF v_existing.id IS NULL THEN
    RAISE EXCEPTION 'Member profile not found';
  END IF;

  INSERT INTO public.profiles (
    id, community_id, display_name, profession, bio, skills, interests, updated_at
  ) VALUES (
    p_actor_id,
    v_community_id,
    COALESCE(NULLIF(trim(p_display_name), ''), 'Resident Member'),
    COALESCE(NULLIF(trim(p_profession), ''), 'Community Resident'),
    COALESCE(trim(p_bio), ''),
    COALESCE(p_skills, '{}'::text[]),
    COALESCE(p_interests, '{}'::text[]),
    now()
  )
  ON CONFLICT (id) DO UPDATE SET
    display_name = EXCLUDED.display_name,
    profession = EXCLUDED.profession,
    bio = EXCLUDED.bio,
    skills = EXCLUDED.skills,
    interests = EXCLUDED.interests,
    updated_at = now();

  INSERT INTO public.private_contacts (
    user_id, community_id, building_id, unit_number, personal_phone, residency_type, updated_at
  ) VALUES (
    p_actor_id,
    v_community_id,
    COALESCE(v_existing.building_id, '22222222-2222-4222-8222-222222222201'::uuid),
    COALESCE(NULLIF(trim(p_unit_number), ''), '101'),
    COALESCE(NULLIF(trim(p_personal_phone), ''), '+91-9820000000'),
    v_residency,
    now()
  )
  ON CONFLICT (user_id) DO UPDATE SET
    unit_number = EXCLUDED.unit_number,
    personal_phone = EXCLUDED.personal_phone,
    residency_type = EXCLUDED.residency_type,
    updated_at = now();

  IF NULLIF(trim(COALESCE(p_headline, '')), '') IS NOT NULL THEN
    INSERT INTO public.professional_profiles (
      user_id, community_id, headline, years_experience, available_for_consultation, updated_at
    ) VALUES (
      p_actor_id, v_community_id, trim(p_headline), 5, true, now()
    )
    ON CONFLICT (user_id) DO UPDATE SET
      headline = EXCLUDED.headline,
      updated_at = now();
  END IF;

  IF NULLIF(trim(COALESCE(p_business_name, '')), '') IS NOT NULL THEN
    INSERT INTO public.business_profiles (
      user_id, community_id, business_name, category, description, contact_channel, updated_at
    ) VALUES (
      p_actor_id,
      v_community_id,
      trim(p_business_name),
      COALESCE(NULLIF(trim(p_business_category), ''), 'Community Enterprise'),
      COALESCE(NULLIF(trim(p_business_description), ''), 'Resident-operated business in Serenity Heights.'),
      'In-app message',
      now()
    )
    ON CONFLICT (user_id) DO UPDATE SET
      business_name = EXCLUDED.business_name,
      category = EXCLUDED.category,
      description = EXCLUDED.description,
      updated_at = now();
  END IF;

  INSERT INTO public.audit_events (
    community_id, actor_id, workspace_context, action_type, target_type, target_id, metadata
  ) VALUES (
    v_community_id,
    p_actor_id,
    'resident_account',
    'member_profile_updated',
    'profiles',
    p_actor_id,
    jsonb_build_object('display_name', p_display_name)
  );

  RETURN jsonb_build_object('updated', true, 'user_id', p_actor_id);
END;
$$;

-- 4. Fetch Actor Account Credentials & Extended Professional/Business Profile
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

GRANT EXECUTE ON FUNCTION public.cc_authenticate_user(text, text) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.cc_register_member(text, text, text, text, text, uuid, text, text, text, text, boolean) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.cc_update_member_profile(uuid, text, text, text, text[], text[], text, text, text, text, text, text, text) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.cc_get_actor_account_details(uuid) TO anon, authenticated, service_role;
