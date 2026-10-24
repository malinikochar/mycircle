-- ============================================================================
-- MyCircle v1.2 — Password Reset (Forgot Password) & Logged-In Password Update
-- Target: Supabase PostgreSQL 17 (Project: mycircle / runquwuetzfivhwefenk)
-- ============================================================================

-- 1. Logged-in User Password Change
CREATE OR REPLACE FUNCTION public.cc_change_user_password(
  p_actor_id uuid,
  p_current_password text,
  p_new_password text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_cred record;
  v_community_id uuid := '11111111-1111-4111-8111-111111111111'::uuid;
BEGIN
  IF length(COALESCE(p_new_password, '')) < 6 THEN
    RAISE EXCEPTION 'New password must be at least 6 characters long';
  END IF;

  SELECT * INTO v_cred
  FROM public.user_credentials
  WHERE user_id = p_actor_id;

  IF v_cred.user_id IS NULL THEN
    RAISE EXCEPTION 'Account credentials record not found for this profile';
  END IF;

  IF v_cred.password_hash <> pg_catalog.md5('mycircle_v1_salt:' || COALESCE(p_current_password, '')) THEN
    RAISE EXCEPTION 'Current password is incorrect';
  END IF;

  INSERT INTO public.user_credentials (
    user_id, email, username, password_hash, role_label
  ) VALUES (
    v_cred.user_id,
    v_cred.email,
    v_cred.username,
    pg_catalog.md5('mycircle_v1_salt:' || p_new_password),
    v_cred.role_label
  )
  ON CONFLICT (user_id) DO UPDATE SET
    password_hash = EXCLUDED.password_hash;

  INSERT INTO public.audit_events (
    community_id, actor_id, workspace_context, action_type, target_type, target_id, metadata
  ) VALUES (
    v_community_id,
    p_actor_id,
    'resident_account',
    'password_changed',
    'user_credentials',
    p_actor_id,
    jsonb_build_object('username', v_cred.username)
  );

  RETURN jsonb_build_object(
    'ok', true,
    'message', 'Your password has been updated successfully.'
  );
END;
$$;

-- 2. Forgot Password / Self-Service Password Recovery
CREATE OR REPLACE FUNCTION public.cc_reset_forgotten_password(
  p_identifier text,
  p_verification_text text,
  p_new_password text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_cred record;
  v_clean_id text := lower(trim(COALESCE(p_identifier, '')));
  v_clean_verify text := lower(trim(COALESCE(p_verification_text, '')));
BEGIN
  IF v_clean_id = '' THEN
    RAISE EXCEPTION 'Please enter your username or registered email address';
  END IF;

  IF length(COALESCE(p_new_password, '')) < 6 THEN
    RAISE EXCEPTION 'New password must be at least 6 characters long';
  END IF;

  SELECT
    uc.user_id,
    uc.email,
    uc.username,
    uc.role_label,
    p.display_name,
    p.community_id,
    pc.unit_number,
    pc.personal_phone
  INTO v_cred
  FROM public.user_credentials uc
  JOIN public.profiles p ON p.id = uc.user_id
  LEFT JOIN public.private_contacts pc ON pc.user_id = uc.user_id
  WHERE lower(uc.username) = v_clean_id
     OR lower(uc.email) = v_clean_id;

  IF v_cred.user_id IS NULL THEN
    RAISE EXCEPTION 'No MyCircle account found with that username or email';
  END IF;

  INSERT INTO public.user_credentials (
    user_id, email, username, password_hash, role_label
  ) VALUES (
    v_cred.user_id,
    v_cred.email,
    v_cred.username,
    pg_catalog.md5('mycircle_v1_salt:' || p_new_password),
    v_cred.role_label
  )
  ON CONFLICT (user_id) DO UPDATE SET
    password_hash = EXCLUDED.password_hash;

  INSERT INTO public.audit_events (
    community_id, actor_id, workspace_context, action_type, target_type, target_id, metadata
  ) VALUES (
    v_cred.community_id,
    v_cred.user_id,
    'auth_portal',
    'password_reset_completed',
    'user_credentials',
    v_cred.user_id,
    jsonb_build_object('username', v_cred.username, 'email', v_cred.email, 'verification_provided', v_clean_verify <> '')
  );

  RETURN jsonb_build_object(
    'reset', true,
    'user_id', v_cred.user_id,
    'username', v_cred.username,
    'email', v_cred.email,
    'display_name', v_cred.display_name
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.cc_change_user_password(uuid, text, text) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.cc_reset_forgotten_password(text, text, text) TO anon, authenticated, service_role;
