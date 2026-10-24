-- ============================================================================
-- Migration 0008: Refresh Active Grant Windows & Prioritize Seed Incident
-- ============================================================================

UPDATE public.incidents
SET created_at = now() + interval '1 day'
WHERE id = 'a6666666-6666-4666-8666-666666666601'::uuid;

UPDATE public.camera_grants
SET expires_at = now() + interval '365 days'
WHERE revoked_at IS NULL;

UPDATE public.location_grants
SET valid_until = now() + interval '365 days'
WHERE revoked_at IS NULL;

UPDATE public.announcements
SET expires_at = now() + interval '365 days'
WHERE id <> '44444444-4444-4444-8444-444444444403'::uuid;
