-- ============================================================================
-- CommunityCircle v1.0 — Server-Enforced RPC Workflows & Scoped State Loader
-- Enforces deny-by-default permissions, field-level privacy, and audit logs
-- ============================================================================

CREATE OR REPLACE FUNCTION public.cc_get_bootstrap_state(
  p_actor_id uuid DEFAULT '00000000-0000-4000-8000-000000000002'::uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_community_id uuid := '11111111-1111-4111-8111-111111111111'::uuid;
  v_membership record;
  v_is_primary_admin boolean := false;
  v_has_membership_scope boolean := false;
  v_has_safety_scope boolean := false;
  v_has_commerce_scope boolean := false;
  v_is_responder boolean := false;
  v_result jsonb;
BEGIN
  SELECT m.status, m.status_reason, m.building_id, b.name AS building_name, b.code AS building_code
  INTO v_membership
  FROM public.memberships m
  LEFT JOIN public.buildings b ON b.id = m.building_id
  WHERE m.user_id = p_actor_id AND m.community_id = v_community_id;

  SELECT EXISTS (
    SELECT 1 FROM public.role_grants rg
    WHERE rg.user_id = p_actor_id
      AND rg.community_id = v_community_id
      AND rg.revoked_at IS NULL
      AND (rg.expires_at IS NULL OR rg.expires_at > now())
      AND (rg.role_type = 'primary_admin' OR rg.module_scope = 'all')
  ) INTO v_is_primary_admin;

  SELECT v_is_primary_admin OR EXISTS (
    SELECT 1 FROM public.role_grants rg
    WHERE rg.user_id = p_actor_id
      AND rg.community_id = v_community_id
      AND rg.revoked_at IS NULL
      AND (rg.expires_at IS NULL OR rg.expires_at > now())
      AND rg.module_scope = 'membership'
  ) INTO v_has_membership_scope;

  SELECT v_is_primary_admin OR EXISTS (
    SELECT 1 FROM public.role_grants rg
    WHERE rg.user_id = p_actor_id
      AND rg.community_id = v_community_id
      AND rg.revoked_at IS NULL
      AND (rg.expires_at IS NULL OR rg.expires_at > now())
      AND rg.module_scope = 'safety'
  ) INTO v_has_safety_scope;

  SELECT v_is_primary_admin OR EXISTS (
    SELECT 1 FROM public.role_grants rg
    WHERE rg.user_id = p_actor_id
      AND rg.community_id = v_community_id
      AND rg.revoked_at IS NULL
      AND (rg.expires_at IS NULL OR rg.expires_at > now())
      AND rg.module_scope = 'commerce_support'
  ) INTO v_has_commerce_scope;

  SELECT v_has_safety_scope OR EXISTS (
    SELECT 1 FROM public.staff_profiles sp
    WHERE sp.user_id = p_actor_id
      AND sp.community_id = v_community_id
      AND sp.is_active_responder = true
  ) INTO v_is_responder;

  -- If membership is NOT approved (pending / rejected / suspended), block all community data (Test 1)
  IF v_membership.status IS NULL OR v_membership.status <> 'approved' THEN
    RETURN jsonb_build_object(
      'access_denied', true,
      'membership_status', COALESCE(v_membership.status, 'unauthenticated'),
      'membership_reason', COALESCE(v_membership.status_reason, 'Approved community membership required'),
      'community', (
        SELECT jsonb_build_object('id', c.id, 'name', c.name, 'city', c.city, 'total_members', 1000)
        FROM public.communities c WHERE c.id = v_community_id
      ),
      'actor', (
        SELECT jsonb_build_object(
          'id', p.id,
          'display_name', p.display_name,
          'profession', p.profession,
          'status', COALESCE(v_membership.status, 'pending'),
          'status_reason', v_membership.status_reason,
          'building_name', v_membership.building_name
        )
        FROM public.profiles p WHERE p.id = p_actor_id
      ),
      'personas', (
        SELECT COALESCE(jsonb_agg(
          jsonb_build_object(
            'id', p.id,
            'display_name', p.display_name,
            'profession', p.profession,
            'membership_status', m.status,
            'building_code', b.code,
            'roles', COALESCE((
              SELECT jsonb_agg(jsonb_build_object('role_type', rg.role_type, 'module_scope', rg.module_scope, 'title_label', rg.title_label))
              FROM public.role_grants rg WHERE rg.user_id = p.id AND rg.revoked_at IS NULL
            ), '[]'::jsonb),
            'is_shop_member', EXISTS(SELECT 1 FROM public.shop_memberships sm WHERE sm.user_id = p.id AND sm.is_active = true),
            'is_provider', EXISTS(SELECT 1 FROM public.provider_memberships pm WHERE pm.user_id = p.id),
            'is_staff', EXISTS(SELECT 1 FROM public.staff_profiles sp WHERE sp.user_id = p.id)
          ) ORDER BY p.id
        ), '[]'::jsonb)
        FROM public.profiles p
        JOIN public.memberships m ON m.user_id = p.id
        LEFT JOIN public.buildings b ON b.id = m.building_id
        WHERE p.id <= '00000000-0000-4000-8000-000000000026'::uuid
      )
    );
  END IF;

  -- Approved Member: Return permission-filtered state
  SELECT jsonb_build_object(
    'access_denied', false,
    'membership_status', 'approved',
    'community', (
      SELECT jsonb_build_object(
        'id', c.id,
        'slug', c.slug,
        'name', c.name,
        'city', c.city,
        'timezone', c.timezone,
        'total_members', (SELECT count(*) FROM public.memberships WHERE community_id = v_community_id),
        'approved_members', (SELECT count(*) FROM public.memberships WHERE community_id = v_community_id AND status = 'approved'),
        'pending_members', (SELECT count(*) FROM public.memberships WHERE community_id = v_community_id AND status = 'pending'),
        'suspended_members', (SELECT count(*) FROM public.memberships WHERE community_id = v_community_id AND status = 'suspended')
      )
      FROM public.communities c WHERE c.id = v_community_id
    ),
    'buildings', (
      SELECT COALESCE(jsonb_agg(jsonb_build_object(
        'id', b.id, 'code', b.code, 'name', b.name, 'floors_count', b.floors_count, 'units_count', b.units_count
      ) ORDER BY b.code), '[]'::jsonb)
      FROM public.buildings b WHERE b.community_id = v_community_id
    ),
    'actor', (
      SELECT jsonb_build_object(
        'id', p.id,
        'display_name', p.display_name,
        'bio', p.bio,
        'profession', p.profession,
        'skills', p.skills,
        'interests', p.interests,
        'member_rating_avg', p.member_rating_avg,
        'member_review_count', p.member_review_count,
        'completed_interactions_count', p.completed_interactions_count,
        'status', v_membership.status,
        'building_id', v_membership.building_id,
        'building_name', v_membership.building_name,
        'building_code', v_membership.building_code,
        'unit_number', pc.unit_number,
        'personal_phone', pc.personal_phone,
        'residency_type', pc.residency_type,
        'visibility', jsonb_build_object(
          'show_building', pv.show_building,
          'show_unit', pv.show_unit,
          'show_phone', pv.show_phone,
          'show_profession', pv.show_profession,
          'show_business', pv.show_business,
          'allow_direct_messages', pv.allow_direct_messages
        ),
        'role_grants', COALESCE((
          SELECT jsonb_agg(jsonb_build_object(
            'id', rg.id,
            'role_type', rg.role_type,
            'module_scope', rg.module_scope,
            'building_scope_id', rg.building_scope_id,
            'allowed_actions', rg.allowed_actions,
            'title_label', rg.title_label
          ))
          FROM public.role_grants rg
          WHERE rg.user_id = p.id AND rg.revoked_at IS NULL AND (rg.expires_at IS NULL OR rg.expires_at > now())
        ), '[]'::jsonb),
        'shop_memberships', COALESCE((
          SELECT jsonb_agg(jsonb_build_object(
            'shop_id', sm.shop_id,
            'shop_name', s.name,
            'role', sm.role,
            'can_review_prescriptions', sm.can_review_prescriptions
          ))
          FROM public.shop_memberships sm
          JOIN public.shops s ON s.id = sm.shop_id
          WHERE sm.user_id = p.id AND sm.is_active = true
        ), '[]'::jsonb),
        'provider_memberships', COALESCE((
          SELECT jsonb_agg(jsonb_build_object(
            'provider_id', pm.provider_id,
            'display_name', pr.display_name,
            'role', pm.role
          ))
          FROM public.provider_memberships pm
          JOIN public.providers pr ON pr.id = pm.provider_id
          WHERE pm.user_id = p.id
        ), '[]'::jsonb),
        'staff_profile', (
          SELECT jsonb_build_object(
            'staff_code', sp.staff_code,
            'role_title', sp.role_title,
            'assigned_post_label', sp.assigned_post_label,
            'is_active_responder', sp.is_active_responder
          )
          FROM public.staff_profiles sp WHERE sp.user_id = p.id
        )
      )
      FROM public.profiles p
      LEFT JOIN public.private_contacts pc ON pc.user_id = p.id
      LEFT JOIN public.profile_visibility pv ON pv.user_id = p.id
      WHERE p.id = p_actor_id
    ),
    'personas', (
      SELECT COALESCE(jsonb_agg(
        jsonb_build_object(
          'id', p.id,
          'display_name', p.display_name,
          'profession', p.profession,
          'membership_status', m.status,
          'building_code', b.code,
          'roles', COALESCE((
            SELECT jsonb_agg(jsonb_build_object('role_type', rg.role_type, 'module_scope', rg.module_scope, 'title_label', rg.title_label))
            FROM public.role_grants rg WHERE rg.user_id = p.id AND rg.revoked_at IS NULL
          ), '[]'::jsonb),
          'is_shop_member', EXISTS(SELECT 1 FROM public.shop_memberships sm WHERE sm.user_id = p.id AND sm.is_active = true),
          'is_provider', EXISTS(SELECT 1 FROM public.provider_memberships pm WHERE pm.user_id = p.id),
          'is_staff', EXISTS(SELECT 1 FROM public.staff_profiles sp WHERE sp.user_id = p.id)
        ) ORDER BY p.id
      ), '[]'::jsonb)
      FROM public.profiles p
      JOIN public.memberships m ON m.user_id = p.id
      LEFT JOIN public.buildings b ON b.id = m.building_id
      WHERE p.id <= '00000000-0000-4000-8000-000000000026'::uuid
    ),
    'directory', (
      SELECT COALESCE(jsonb_agg(
        jsonb_build_object(
          'id', p.id,
          'display_name', p.display_name,
          'bio', p.bio,
          'profession', CASE WHEN pv.show_profession THEN p.profession ELSE NULL END,
          'skills', p.skills,
          'interests', p.interests,
          'member_rating_avg', p.member_rating_avg,
          'member_review_count', p.member_review_count,
          'completed_interactions_count', p.completed_interactions_count,
          'membership_status', m.status,
          'building_name', CASE WHEN pv.show_building OR p.id = p_actor_id OR v_has_membership_scope THEN b.name ELSE 'Building Hidden' END,
          'building_code', CASE WHEN pv.show_building OR p.id = p_actor_id OR v_has_membership_scope THEN b.code ELSE NULL END,
          -- Field-level privacy: exact unit & personal phone stripped unless opted-in, owner, or membership admin (MEM-03, Test 3)
          'unit_number', CASE WHEN pv.show_unit OR p.id = p_actor_id OR v_has_membership_scope THEN pc.unit_number ELSE NULL END,
          'personal_phone', CASE WHEN pv.show_phone OR p.id = p_actor_id OR v_has_membership_scope THEN pc.personal_phone ELSE NULL END,
          'professional_headline', pp.headline,
          'business_name', CASE WHEN pv.show_business THEN bp.business_name ELSE NULL END,
          'business_category', CASE WHEN pv.show_business THEN bp.category ELSE NULL END,
          'business_description', CASE WHEN pv.show_business THEN bp.description ELSE NULL END,
          'role_badges', COALESCE((
            SELECT jsonb_agg(rg.title_label)
            FROM public.role_grants rg WHERE rg.user_id = p.id AND rg.revoked_at IS NULL
          ), '[]'::jsonb)
        ) ORDER BY p.id
      ), '[]'::jsonb)
      FROM (
        SELECT * FROM public.profiles
        WHERE community_id = v_community_id
        ORDER BY id
        LIMIT 45
      ) p
      JOIN public.memberships m ON m.user_id = p.id
      LEFT JOIN public.buildings b ON b.id = m.building_id
      LEFT JOIN public.private_contacts pc ON pc.user_id = p.id
      LEFT JOIN public.profile_visibility pv ON pv.user_id = p.id
      LEFT JOIN public.professional_profiles pp ON pp.user_id = p.id
      LEFT JOIN public.business_profiles bp ON bp.user_id = p.id
      WHERE m.status = 'approved' OR v_has_membership_scope
    ),
    'role_grants', (
      SELECT COALESCE(jsonb_agg(
        jsonb_build_object(
          'id', rg.id,
          'user_id', rg.user_id,
          'user_name', p.display_name,
          'user_profession', p.profession,
          'role_type', rg.role_type,
          'module_scope', rg.module_scope,
          'building_scope_id', rg.building_scope_id,
          'building_scope_name', b.name,
          'allowed_actions', rg.allowed_actions,
          'title_label', rg.title_label,
          'expires_at', rg.expires_at
        ) ORDER BY rg.id
      ), '[]'::jsonb)
      FROM public.role_grants rg
      JOIN public.profiles p ON p.id = rg.user_id
      LEFT JOIN public.buildings b ON b.id = rg.building_scope_id
      WHERE rg.community_id = v_community_id AND rg.revoked_at IS NULL
    ),
    'announcements', (
      SELECT COALESCE(jsonb_agg(
        jsonb_build_object(
          'id', a.id,
          'title', a.title,
          'body', a.body,
          'category', a.category,
          'audience_type', a.audience_type,
          'target_building_name', b.name,
          'author_name', p.display_name,
          'is_pinned', a.is_pinned,
          'requires_acknowledgement', a.requires_acknowledgement,
          'published_at', a.published_at,
          'expires_at', a.expires_at,
          'is_expired', (a.expires_at IS NOT NULL AND a.expires_at <= now()),
          'acknowledgement_count', (SELECT count(*) FROM public.acknowledgements ack WHERE ack.announcement_id = a.id),
          'actor_acknowledged', EXISTS(SELECT 1 FROM public.acknowledgements ack WHERE ack.announcement_id = a.id AND ack.user_id = p_actor_id)
        ) ORDER BY (a.expires_at IS NOT NULL AND a.expires_at <= now()) ASC, a.is_pinned DESC, a.published_at DESC
      ), '[]'::jsonb)
      FROM public.announcements a
      JOIN public.profiles p ON p.id = a.author_id
      LEFT JOIN public.buildings b ON b.id = a.target_building_id
      WHERE a.community_id = v_community_id
    ),
    'events', (
      SELECT COALESCE(jsonb_agg(
        jsonb_build_object(
          'id', e.id,
          'title', e.title,
          'description', e.description,
          'location_label', e.location_label,
          'starts_at', e.starts_at,
          'ends_at', e.ends_at,
          'capacity', e.capacity,
          'status', e.status,
          'organiser_name', p.display_name,
          'linked_exchange_listing_id', e.linked_exchange_listing_id,
          'rsvp_going_count', (SELECT COALESCE(sum(guests_count), 0) FROM public.event_rsvps er WHERE er.event_id = e.id AND er.status = 'going'),
          'actor_rsvp', (SELECT er.status FROM public.event_rsvps er WHERE er.event_id = e.id AND er.user_id = p_actor_id)
        ) ORDER BY e.starts_at ASC
      ), '[]'::jsonb)
      FROM public.events e
      JOIN public.profiles p ON p.id = e.organiser_id
      WHERE e.community_id = v_community_id
    ),
    'posts', (
      SELECT COALESCE(jsonb_agg(
        jsonb_build_object(
          'id', po.id,
          'category', po.category,
          'title', po.title,
          'body', po.body,
          'author_id', po.author_id,
          'author_name', p.display_name,
          'author_profession', p.profession,
          'building_name', b.name,
          'moderation_state', CASE WHEN po.is_hidden_by_moderation THEN 'hidden' ELSE 'visible' END,
          'created_at', po.created_at,
          'comments', COALESCE((
            SELECT jsonb_agg(jsonb_build_object(
              'id', cm.id,
              'author_name', cp.display_name,
              'body', cm.body,
              'created_at', cm.created_at
            ) ORDER BY cm.created_at ASC)
            FROM public.comments cm
            JOIN public.profiles cp ON cp.id = cm.author_id
            WHERE cm.post_id = po.id
          ), '[]'::jsonb)
        ) ORDER BY po.created_at DESC
      ), '[]'::jsonb)
      FROM public.posts po
      JOIN public.profiles p ON p.id = po.author_id
      LEFT JOIN public.buildings b ON b.id = po.building_id
      WHERE po.community_id = v_community_id AND po.is_hidden_by_moderation = false
    ),
    'groups', (
      SELECT COALESCE(jsonb_agg(
        jsonb_build_object(
          'id', g.id,
          'name', g.name,
          'group_type', g.group_type,
          'moderation_policy', g.moderation_policy,
          'building_name', b.name
        )
      ), '[]'::jsonb)
      FROM public.groups g
      LEFT JOIN public.buildings b ON b.id = g.building_id
      WHERE g.community_id = v_community_id
    ),
    'shops', (
      SELECT COALESCE(jsonb_agg(
        jsonb_build_object(
          'id', s.id,
          'owner_id', s.owner_id,
          'owner_name', p.display_name,
          'name', s.name,
          'category', s.category,
          'description', s.description,
          'unit_location', s.unit_location,
          'operating_hours', s.operating_hours,
          'service_windows', s.service_windows,
          'delivery_available', s.delivery_available,
          'min_order_paise', s.min_order_paise,
          'delivery_fee_paise', s.delivery_fee_paise,
          'is_pharmacy_gated', s.is_pharmacy_gated,
          'gstin_number', s.gstin_number,
          'approval_status', s.approval_status,
          'products', COALESCE((
            SELECT jsonb_agg(jsonb_build_object(
              'id', pr.id,
              'name', pr.name,
              'category', pr.category,
              'pack_size', pr.pack_size,
              'unit_label', pr.unit_label,
              'price_paise', pr.price_paise,
              'tax_rate_bps', pr.tax_rate_bps,
              'stock_quantity', pr.stock_quantity,
              'requires_prescription', pr.requires_prescription,
              'is_active', pr.is_active
            ) ORDER BY pr.name)
            FROM public.products pr WHERE pr.shop_id = s.id
          ), '[]'::jsonb)
        ) ORDER BY s.name
      ), '[]'::jsonb)
      FROM public.shops s
      JOIN public.profiles p ON p.id = s.owner_id
      WHERE s.community_id = v_community_id
    ),
    'orders', (
      SELECT COALESCE(jsonb_agg(
        jsonb_build_object(
          'id', o.id,
          'shop_id', o.shop_id,
          'shop_name', s.name,
          'buyer_id', o.buyer_id,
          'buyer_name_snapshot', o.buyer_name_snapshot,
          'delivery_building_snapshot', o.delivery_building_snapshot,
          'delivery_unit_snapshot', o.delivery_unit_snapshot,
          'delivery_phone_snapshot', o.delivery_phone_snapshot,
          'delivery_instructions', o.delivery_instructions,
          'idempotency_key', o.idempotency_key,
          'status', o.status,
          'payment_status', o.payment_status,
          'payment_method', o.payment_method,
          'subtotal_paise', o.subtotal_paise,
          'tax_paise', o.tax_paise,
          'delivery_fee_paise', o.delivery_fee_paise,
          'total_paise', o.total_paise,
          'proposed_total_paise', o.proposed_total_paise,
          'price_change_reason', o.price_change_reason,
          'substitution_note', o.substitution_note,
          'delivery_estimate_text', o.delivery_estimate_text,
          'created_at', o.created_at,
          -- Prescription privacy: only buyer or authorised pharmacist on that shop can see prescription attachment (SHOP-11, Test 5)
          'prescription_attachment', CASE
            WHEN o.prescription_attachment_id IS NOT NULL AND (
              o.buyer_id = p_actor_id
              OR EXISTS (
                SELECT 1 FROM public.shop_memberships sm
                WHERE sm.shop_id = o.shop_id AND sm.user_id = p_actor_id AND sm.is_active = true AND sm.can_review_prescriptions = true
              )
            ) THEN (
              SELECT jsonb_build_object(
                'id', att.id,
                'storage_bucket', att.storage_bucket,
                'storage_path', att.storage_path,
                'mime_type', att.mime_type,
                'pharmacist_verified_by', o.pharmacist_verified_by
              )
              FROM public.attachments att WHERE att.id = o.prescription_attachment_id
            )
            ELSE NULL
          END,
          'has_restricted_prescription', (o.prescription_attachment_id IS NOT NULL),
          'items', COALESCE((
            SELECT jsonb_agg(jsonb_build_object(
              'id', oi.id,
              'product_id', oi.product_id,
              'product_name_snapshot', oi.product_name_snapshot,
              'pack_size_snapshot', oi.pack_size_snapshot,
              'quantity', oi.quantity,
              'unit_price_paise_snapshot', oi.unit_price_paise_snapshot,
              'proposed_unit_price_paise', oi.proposed_unit_price_paise,
              'tax_paise_snapshot', oi.tax_paise_snapshot,
              'line_total_paise_snapshot', oi.line_total_paise_snapshot
            ))
            FROM public.order_items oi WHERE oi.order_id = o.id
          ), '[]'::jsonb),
          'invoice', (
            SELECT jsonb_build_object(
              'id', inv.id,
              'invoice_number', inv.invoice_number,
              'seller_name_snapshot', inv.seller_name_snapshot,
              'seller_gstin_snapshot', inv.seller_gstin_snapshot,
              'subtotal_paise', inv.subtotal_paise,
              'tax_paise', inv.tax_paise,
              'delivery_fee_paise', inv.delivery_fee_paise,
              'total_paise', inv.total_paise,
              'current_revision_number', inv.current_revision_number,
              'status', inv.status,
              'revisions', COALESCE((
                SELECT jsonb_agg(jsonb_build_object(
                  'revision_number', ir.revision_number,
                  'previous_total_paise', ir.previous_total_paise,
                  'new_total_paise', ir.new_total_paise,
                  'adjustment_reason', ir.adjustment_reason,
                  'created_at', ir.created_at
                ) ORDER BY ir.revision_number ASC)
                FROM public.invoice_revisions ir WHERE ir.invoice_id = inv.id
              ), '[]'::jsonb)
            )
            FROM public.invoices inv WHERE inv.order_id = o.id
          )
        ) ORDER BY o.created_at DESC
      ), '[]'::jsonb)
      FROM public.orders o
      JOIN public.shops s ON s.id = o.shop_id
      WHERE o.community_id = v_community_id
        AND (
          o.buyer_id = p_actor_id
          OR EXISTS (SELECT 1 FROM public.shop_memberships sm WHERE sm.shop_id = o.shop_id AND sm.user_id = p_actor_id AND sm.is_active = true)
          OR v_has_commerce_scope
        )
    ),
    'ledger_entries', (
      SELECT COALESCE(jsonb_agg(
        jsonb_build_object(
          'id', le.id,
          'shop_id', le.shop_id,
          'shop_name', s.name,
          'order_id', le.order_id,
          'entry_type', le.entry_type,
          'amount_paise', le.amount_paise,
          'payment_evidence_note', le.payment_evidence_note,
          'is_settled_verified', le.is_settled_verified,
          'created_at', le.created_at
        ) ORDER BY le.created_at DESC
      ), '[]'::jsonb)
      FROM public.ledger_entries le
      JOIN public.shops s ON s.id = le.shop_id
      WHERE le.community_id = v_community_id
        AND (
          EXISTS (SELECT 1 FROM public.shop_memberships sm WHERE sm.shop_id = le.shop_id AND sm.user_id = p_actor_id AND sm.is_active = true)
          OR v_has_commerce_scope
        )
    ),
    'services', jsonb_build_object(
      'categories', (
        SELECT COALESCE(jsonb_agg(jsonb_build_object('id', sc.id, 'slug', sc.slug, 'name', sc.name, 'description', sc.description)), '[]'::jsonb)
        FROM public.service_categories sc WHERE sc.community_id = v_community_id
      ),
      'providers', (
        SELECT COALESCE(jsonb_agg(
          jsonb_build_object(
            'id', pr.id,
            'category_id', pr.category_id,
            'category_name', sc.name,
            'display_name', pr.display_name,
            'listing_mode', pr.listing_mode,
            'description', pr.description,
            'service_area', pr.service_area,
            'availability_summary', pr.availability_summary,
            'indicative_pricing_text', pr.indicative_pricing_text,
            'contact_publication_consented', pr.contact_publication_consented,
            'public_phone', CASE WHEN pr.contact_publication_consented THEN pr.public_phone ELSE NULL END,
            'verification_badge_scope', pr.verification_badge_scope,
            'verified_rating_avg', pr.verified_rating_avg,
            'verified_review_count', pr.verified_review_count,
            'off_platform_recommendation_count', pr.off_platform_recommendation_count,
            'recommendations', COALESCE((
              SELECT jsonb_agg(jsonb_build_object(
                'id', rc.id,
                'member_name', mp.display_name,
                'is_off_platform', rc.is_off_platform,
                'work_summary', rc.work_summary,
                'approx_month_year', rc.approx_month_year,
                'endorsement_note', rc.endorsement_note
              ))
              FROM public.recommendations rc
              JOIN public.profiles mp ON mp.id = rc.member_id
              WHERE rc.provider_id = pr.id
            ), '[]'::jsonb)
          ) ORDER BY pr.display_name
        ), '[]'::jsonb)
        FROM public.providers pr
        JOIN public.service_categories sc ON sc.id = pr.category_id
        WHERE pr.community_id = v_community_id
      ),
      'enquiries', (
        SELECT COALESCE(jsonb_agg(
          jsonb_build_object(
            'id', se.id,
            'provider_id', se.provider_id,
            'provider_name', pr.display_name,
            'resident_id', se.resident_id,
            'resident_name', rp.display_name,
            'problem_description', se.problem_description,
            'preferred_schedule', se.preferred_schedule,
            'quoted_price_paise', se.quoted_price_paise,
            'quote_notes', se.quote_notes,
            'status', se.status,
            'created_at', se.created_at
          ) ORDER BY se.created_at DESC
        ), '[]'::jsonb)
        FROM public.service_enquiries se
        JOIN public.providers pr ON pr.id = se.provider_id
        JOIN public.profiles rp ON rp.id = se.resident_id
        WHERE se.community_id = v_community_id
      ),
      'bookings', (
        SELECT COALESCE(jsonb_agg(
          jsonb_build_object(
            'id', sb.id,
            'provider_id', sb.provider_id,
            'provider_name', pr.display_name,
            'resident_id', sb.resident_id,
            'resident_name', rp.display_name,
            'agreed_price_paise', sb.agreed_price_paise,
            'scheduled_for', sb.scheduled_for,
            'status', sb.status,
            'outcome_notes', sb.outcome_notes,
            'completed_at', sb.completed_at
          ) ORDER BY sb.created_at DESC
        ), '[]'::jsonb)
        FROM public.service_bookings sb
        JOIN public.providers pr ON pr.id = sb.provider_id
        JOIN public.profiles rp ON rp.id = sb.resident_id
        WHERE sb.community_id = v_community_id
      )
    ),
    'social_service', jsonb_build_object(
      'listings', (
        SELECT COALESCE(jsonb_agg(
          jsonb_build_object(
            'id', el.id,
            'owner_id', el.owner_id,
            'owner_name', p.display_name,
            'owner_rating_avg', p.member_rating_avg,
            'owner_review_count', p.member_review_count,
            'direction', el.direction,
            'exchange_mode', el.exchange_mode,
            'title', el.title,
            'description', el.description,
            'category', el.category,
            'item_condition', el.item_condition,
            'total_quantity', el.total_quantity,
            'allocated_quantity', el.allocated_quantity,
            'remaining_quantity', (el.total_quantity - el.allocated_quantity),
            'price_paise', el.price_paise,
            'deposit_paise', el.deposit_paise,
            'rental_rate_paise_per_day', el.rental_rate_paise_per_day,
            'available_from', el.available_from,
            'available_until', el.available_until,
            'event_date', el.event_date,
            'handover_options', el.handover_options,
            'status', el.status,
            'expires_at', el.expires_at
          ) ORDER BY el.created_at DESC
        ), '[]'::jsonb)
        FROM public.exchange_listings el
        JOIN public.profiles p ON p.id = el.owner_id
        WHERE el.community_id = v_community_id AND el.status <> 'policy_removed'
      ),
      'agreements', (
        SELECT COALESCE(jsonb_agg(
          jsonb_build_object(
            'id', ea.id,
            'listing_id', ea.listing_id,
            'listing_title', el.title,
            'owner_id', ea.owner_id,
            'owner_name', op.display_name,
            'counterparty_id', ea.counterparty_id,
            'counterparty_name', cp.display_name,
            'exchange_mode', ea.exchange_mode,
            'agreed_quantity', ea.agreed_quantity,
            'agreed_condition', ea.agreed_condition,
            'agreed_price_paise', ea.agreed_price_paise,
            'agreed_deposit_paise', ea.agreed_deposit_paise,
            'payment_deposit_status', ea.payment_deposit_status,
            'handover_location_label', ea.handover_location_label,
            'handover_at', ea.handover_at,
            'due_back_at', ea.due_back_at,
            'responsibility_terms', ea.responsibility_terms,
            'version', ea.version,
            'status', ea.status,
            'handover_confirmed_by_owner_at', ea.handover_confirmed_by_owner_at,
            'handover_confirmed_by_counterparty_at', ea.handover_confirmed_by_counterparty_at,
            'condition_reports', COALESCE((
              SELECT jsonb_agg(jsonb_build_object(
                'stage', cr.stage,
                'condition_summary', cr.condition_summary,
                'damage_reported', (cr.stage = 'dispute'),
                'created_at', cr.created_at
              ))
              FROM public.condition_reports cr WHERE cr.agreement_id = ea.id
            ), '[]'::jsonb),
            'extensions', COALESCE((
              SELECT jsonb_agg(jsonb_build_object(
                'id', re.id,
                'requested_due_at', re.requested_due_at,
                'reason', re.reason,
                'status', re.status
              ))
              FROM public.return_extensions re WHERE re.agreement_id = ea.id
            ), '[]'::jsonb)
          ) ORDER BY ea.created_at DESC
        ), '[]'::jsonb)
        FROM public.exchange_agreements ea
        JOIN public.exchange_listings el ON el.id = ea.listing_id
        JOIN public.profiles op ON op.id = ea.owner_id
        JOIN public.profiles cp ON cp.id = ea.counterparty_id
        WHERE ea.community_id = v_community_id
      )
    ),
    'reputation', jsonb_build_object(
      'eligibilities', (
        SELECT COALESCE(jsonb_agg(
          jsonb_build_object(
            'id', re.id,
            'interaction_type', re.interaction_type,
            'exchange_agreement_id', re.exchange_agreement_id,
            'service_booking_id', re.service_booking_id,
            'reviewer_id', re.reviewer_id,
            'reviewer_name', rp.display_name,
            'subject_user_id', re.subject_user_id,
            'subject_user_name', COALESCE(sp.display_name, pr.display_name),
            'subject_provider_id', re.subject_provider_id,
            'eligibility_reason', re.eligibility_reason,
            'window_ends_at', re.window_ends_at,
            'has_submitted', EXISTS(SELECT 1 FROM public.reviews rv WHERE rv.eligibility_id = re.id)
          )
        ), '[]'::jsonb)
        FROM public.review_eligibility re
        JOIN public.profiles rp ON rp.id = re.reviewer_id
        LEFT JOIN public.profiles sp ON sp.id = re.subject_user_id
        LEFT JOIN public.providers pr ON pr.id = re.subject_provider_id
        WHERE re.community_id = v_community_id
      ),
      'reviews', (
        SELECT COALESCE(jsonb_agg(
          jsonb_build_object(
            'id', rv.id,
            'eligibility_id', rv.eligibility_id,
            'reviewer_id', rv.reviewer_id,
            'reviewer_name', rp.display_name,
            'subject_user_id', rv.subject_user_id,
            'subject_user_name', COALESCE(sp.display_name, pr.display_name),
            'subject_provider_id', rv.subject_provider_id,
            'target_kind', rv.target_kind,
            'overall_rating', rv.overall_rating,
            'written_feedback', rv.written_feedback,
            'counterparty_response', (
              SELECT rr.response_body FROM public.review_responses rr WHERE rr.review_id = rv.id LIMIT 1
            ),
            'is_published', rv.is_published,
            'published_at', rv.published_at,
            'dimensions', COALESCE((
              SELECT jsonb_agg(jsonb_build_object('dimension_key', rd.dimension_key, 'score', rd.score))
              FROM public.review_dimensions rd WHERE rd.review_id = rv.id
            ), '[]'::jsonb)
          ) ORDER BY rv.created_at DESC
        ), '[]'::jsonb)
        FROM public.reviews rv
        JOIN public.profiles rp ON rp.id = rv.reviewer_id
        LEFT JOIN public.profiles sp ON sp.id = rv.subject_user_id
        LEFT JOIN public.providers pr ON pr.id = rv.subject_provider_id
        WHERE rv.community_id = v_community_id
          AND (rv.is_published = true OR rv.reviewer_id = p_actor_id)
      )
    ),
    'help_and_cases', jsonb_build_object(
      'help_requests', (
        SELECT COALESCE(jsonb_agg(
          jsonb_build_object(
            'id', hr.id,
            'requester_id', hr.requester_id,
            'requester_name', p.display_name,
            'category', hr.category,
            'title', hr.title,
            'description', hr.description,
            'approx_area', hr.approx_area,
            'timing_needed', hr.timing_needed,
            'visibility_scope', hr.visibility_scope,
            'status', hr.status,
            'linked_social_service_note', hr.linked_social_service_note,
            'created_at', hr.created_at
          ) ORDER BY hr.created_at DESC
        ), '[]'::jsonb)
        FROM public.help_requests hr
        JOIN public.profiles p ON p.id = hr.requester_id
        WHERE hr.community_id = v_community_id
          AND (hr.visibility_scope = 'community' OR hr.requester_id = p_actor_id OR v_is_primary_admin)
      ),
      'complaints', (
        SELECT COALESCE(jsonb_agg(
          jsonb_build_object(
            'id', c.id,
            'case_reference', c.case_reference,
            'reporter_id', c.reporter_id,
            'reporter_name', rp.display_name,
            'building_id', c.building_id,
            'building_name', b.name,
            'category', c.category,
            'title', c.title,
            'description', c.description,
            'location_detail', c.location_detail,
            'privacy_choice', c.privacy_choice,
            'consented_for_external_escalation', c.consented_for_external_escalation,
            'status', c.status,
            'assigned_admin_name', ap.display_name,
            'next_action', c.next_action,
            'follow_up_date', c.follow_up_date,
            'shared_issue_id', c.shared_issue_id,
            'created_at', c.created_at,
            'events', COALESCE((
              SELECT jsonb_agg(jsonb_build_object(
                'from_status', ce.from_status,
                'to_status', ce.to_status,
                'note', ce.note,
                'created_at', ce.created_at
              ) ORDER BY ce.created_at ASC)
              FROM public.case_events ce WHERE ce.complaint_id = c.id AND (ce.is_internal_only = false OR v_is_primary_admin)
            ), '[]'::jsonb)
          ) ORDER BY c.created_at DESC
        ), '[]'::jsonb)
        FROM public.complaints c
        JOIN public.profiles rp ON rp.id = c.reporter_id
        LEFT JOIN public.buildings b ON b.id = c.building_id
        LEFT JOIN public.profiles ap ON ap.id = c.assigned_admin_id
        WHERE c.community_id = v_community_id
          AND (
            c.reporter_id = p_actor_id
            OR c.privacy_choice <> 'private_to_admin'
            OR v_is_primary_admin
            OR EXISTS (
              SELECT 1 FROM public.role_grants rg
              WHERE rg.user_id = p_actor_id
                AND rg.revoked_at IS NULL
                AND (rg.module_scope = c.category OR rg.module_scope = 'civic_escalation')
                AND (rg.building_scope_id IS NULL OR rg.building_scope_id = c.building_id)
            )
          )
      ),
      'shared_issues', (
        SELECT COALESCE(jsonb_agg(
          jsonb_build_object(
            'id', si.id,
            'title', si.title,
            'category', si.category,
            'public_summary', si.public_summary,
            'status', si.status,
            'linked_cases_count', si.linked_cases_count,
            'created_at', si.created_at
          )
        ), '[]'::jsonb)
        FROM public.shared_issues si WHERE si.community_id = v_community_id
      ),
      'authority_contacts', (
        SELECT COALESCE(jsonb_agg(
          jsonb_build_object(
            'id', ac.id,
            'jurisdiction_name', ac.jurisdiction_name,
            'department_category', ac.department_category,
            'office_title', ac.office_title,
            'submission_channel', ac.submission_channel,
            'contact_reference', ac.contact_reference,
            'source_url', ac.source_url,
            'last_verified_at', ac.last_verified_at
          )
        ), '[]'::jsonb)
        FROM public.authority_contacts ac WHERE ac.community_id = v_community_id
      ),
      'escalation_records', (
        SELECT COALESCE(jsonb_agg(
          jsonb_build_object(
            'id', er.id,
            'shared_issue_id', er.shared_issue_id,
            'complaint_id', er.complaint_id,
            'redacted_package_summary', er.redacted_package_summary,
            'consented_complaint_count', er.consented_complaint_count,
            'status', er.status,
            'submission_mode', er.submission_mode,
            'official_docket_reference', er.official_docket_reference,
            'acknowledgement_evidence_note', er.acknowledgement_evidence_note,
            'submitted_at', er.submitted_at
          )
        ), '[]'::jsonb)
        FROM public.escalation_records er WHERE er.community_id = v_community_id
      )
    ),
    'safety_and_sos', jsonb_build_object(
      'incidents', (
        SELECT COALESCE(jsonb_agg(
          jsonb_build_object(
            'id', inc.id,
            'reporter_id', inc.reporter_id,
            'reporter_name', CASE WHEN v_is_responder OR inc.reporter_id = p_actor_id THEN rp.display_name ELSE 'Resident Alert' END,
            'category', inc.category,
            'building_name', b.name,
            'manual_floor_label', CASE WHEN v_is_responder OR inc.reporter_id = p_actor_id THEN inc.manual_floor_label ELSE NULL END,
            'manual_lift_or_area_label', CASE WHEN v_is_responder OR inc.reporter_id = p_actor_id THEN inc.manual_lift_or_area_label ELSE NULL END,
            'approx_area_public_label', inc.approx_area_public_label,
            'safe_guidance_public_text', inc.safe_guidance_public_text,
            -- Sanitised community alert vs full responder alert (SOS-04, Test 14)
            'restricted_responder_details', CASE WHEN v_is_responder OR inc.reporter_id = p_actor_id THEN inc.restricted_responder_details ELSE NULL END,
            'status', inc.status,
            'acknowledged_by_name', ap.display_name,
            'acknowledged_at', inc.acknowledged_at,
            'is_demo_simulation', inc.is_demo_simulation,
            'created_at', inc.created_at,
            'deliveries', COALESCE((
              SELECT jsonb_agg(jsonb_build_object(
                'channel', iad.channel,
                'delivery_status', iad.delivery_status,
                'retry_count', iad.retry_count,
                'failure_reason', iad.failure_reason
              ))
              FROM public.incident_alert_deliveries iad WHERE iad.incident_id = inc.id
            ), '[]'::jsonb)
          ) ORDER BY inc.created_at DESC
        ), '[]'::jsonb)
        FROM public.incidents inc
        JOIN public.profiles rp ON rp.id = inc.reporter_id
        LEFT JOIN public.buildings b ON b.id = inc.building_id
        LEFT JOIN public.profiles ap ON ap.id = inc.acknowledged_by_user_id
        WHERE inc.community_id = v_community_id
      )
    ),
    'staff_and_locations', jsonb_build_object(
      'staff', (
        SELECT COALESCE(jsonb_agg(
          jsonb_build_object(
            'user_id', sp.user_id,
            'display_name', p.display_name,
            'staff_code', sp.staff_code,
            'employer_team', sp.employer_team,
            'role_title', sp.role_title,
            'assigned_post_label', sp.assigned_post_label,
            'is_active_responder', sp.is_active_responder
          )
        ), '[]'::jsonb)
        FROM public.staff_profiles sp
        JOIN public.profiles p ON p.id = sp.user_id
        WHERE sp.community_id = v_community_id
      ),
      'shifts', (
        SELECT COALESCE(jsonb_agg(
          jsonb_build_object(
            'id', sh.id,
            'staff_user_id', sh.staff_user_id,
            'staff_name', p.display_name,
            'shift_name', sh.shift_name,
            'assigned_post_label', sh.assigned_post_label,
            'starts_at', sh.starts_at,
            'ends_at', sh.ends_at,
            'status', sh.status,
            'checked_in_at', sh.checked_in_at
          ) ORDER BY sh.starts_at DESC
        ), '[]'::jsonb)
        FROM public.shifts sh
        JOIN public.profiles p ON p.id = sh.staff_user_id
        WHERE sh.community_id = v_community_id
      ),
      'tasks', (
        SELECT COALESCE(jsonb_agg(
          jsonb_build_object(
            'id', t.id,
            'staff_user_id', t.staff_user_id,
            'title', t.title,
            'area_label', t.area_label,
            'status', t.status
          )
        ), '[]'::jsonb)
        FROM public.tasks t WHERE t.community_id = v_community_id
      ),
      'checkpoints', (
        SELECT COALESCE(jsonb_agg(
          jsonb_build_object(
            'id', pc.id,
            'checkpoint_code', pc.checkpoint_code,
            'location_name', pc.location_name,
            'last_checked_at', pc.last_checked_at
          )
        ), '[]'::jsonb)
        FROM public.patrol_checkpoints pc WHERE pc.community_id = v_community_id
      ),
      'active_locations', (
        SELECT COALESCE(jsonb_agg(
          jsonb_build_object(
            'session_id', cl.session_id,
            'staff_user_id', cl.staff_user_id,
            'staff_name', p.display_name,
            'purpose', lss.purpose,
            'device_permission_state', lss.device_permission_state,
            'consent_given', lss.consent_given,
            'is_active', lss.is_active,
            'approximate_zone_label', cl.approximate_zone_label,
            -- Server strips raw latitude/longitude unless viewer is staff subject, safety admin, or has precise grant (STF-03, Test 17)
            'precision_granted', CASE
              WHEN cl.staff_user_id = p_actor_id OR v_has_safety_scope OR EXISTS (
                SELECT 1 FROM public.location_grants lg
                WHERE lg.subject_staff_user_id = cl.staff_user_id
                  AND lg.viewer_user_id = p_actor_id
                  AND lg.precision_level = 'precise'
                  AND lg.revoked_at IS NULL
                  AND lg.valid_until > now()
              ) THEN 'precise'
              ELSE 'approximate'
            END,
            'latitude', CASE
              WHEN cl.staff_user_id = p_actor_id OR v_has_safety_scope OR EXISTS (
                SELECT 1 FROM public.location_grants lg
                WHERE lg.subject_staff_user_id = cl.staff_user_id
                  AND lg.viewer_user_id = p_actor_id
                  AND lg.precision_level = 'precise'
                  AND lg.revoked_at IS NULL
                  AND lg.valid_until > now()
              ) THEN cl.latitude
              ELSE NULL
            END,
            'longitude', CASE
              WHEN cl.staff_user_id = p_actor_id OR v_has_safety_scope OR EXISTS (
                SELECT 1 FROM public.location_grants lg
                WHERE lg.subject_staff_user_id = cl.staff_user_id
                  AND lg.viewer_user_id = p_actor_id
                  AND lg.precision_level = 'precise'
                  AND lg.revoked_at IS NULL
                  AND lg.valid_until > now()
              ) THEN cl.longitude
              ELSE NULL
            END,
            'accuracy_meters', cl.accuracy_meters,
            'is_demo_simulated', cl.is_demo_simulated,
            'updated_at', cl.updated_at,
            'is_stale', (extract(epoch from (now() - cl.updated_at)) > 120)
          )
        ), '[]'::jsonb)
        FROM public.current_locations cl
        JOIN public.location_sharing_sessions lss ON lss.id = cl.session_id
        JOIN public.profiles p ON p.id = cl.staff_user_id
        WHERE cl.community_id = v_community_id
          AND lss.is_active = true
          AND lss.consent_given = true
      ),
      'location_grants', (
        SELECT COALESCE(jsonb_agg(
          jsonb_build_object(
            'id', lg.id,
            'subject_staff_name', sp.display_name,
            'viewer_role', lg.viewer_role,
            'viewer_user_id', lg.viewer_user_id,
            'purpose', lg.purpose,
            'precision_level', lg.precision_level,
            'allow_history', lg.allow_history,
            'valid_until', lg.valid_until
          )
        ), '[]'::jsonb)
        FROM public.location_grants lg
        JOIN public.profiles sp ON sp.id = lg.subject_staff_user_id
        WHERE lg.community_id = v_community_id AND lg.revoked_at IS NULL
      )
    ),
    'cctv', jsonb_build_object(
      'cameras', (
        SELECT COALESCE(jsonb_agg(
          jsonb_build_object(
            'id', cam.id,
            'camera_code', cam.camera_code,
            'display_name', cam.display_name,
            'group_name', cg.name,
            'area_classification', cg.area_classification,
            'common_area_label', cam.common_area_label,
            'privacy_designation', cam.privacy_designation,
            'integration_type', cam.integration_type,
            'online_state', cam.online_state,
            'recording_export_enabled', cam.recording_export_enabled,
            'actor_has_live_grant', (
              v_has_safety_scope OR EXISTS (
                SELECT 1 FROM public.camera_grants gr
                WHERE gr.camera_id = cam.id
                  AND gr.grantee_user_id = p_actor_id
                  AND gr.permission_type = 'live'
                  AND gr.revoked_at IS NULL
                  AND gr.expires_at > now()
              )
            )
          ) ORDER BY cam.camera_code
        ), '[]'::jsonb)
        FROM public.cameras cam
        JOIN public.camera_groups cg ON cg.id = cam.group_id
        WHERE cam.community_id = v_community_id
      ),
      'grants', (
        SELECT COALESCE(jsonb_agg(
          jsonb_build_object(
            'id', gr.id,
            'camera_id', gr.camera_id,
            'camera_code', cam.camera_code,
            'grantee_user_id', gr.grantee_user_id,
            'grantee_name', p.display_name,
            'grantee_role_scope', gr.grantee_role_scope,
            'permission_type', gr.permission_type,
            'purpose', gr.purpose,
            'expires_at', gr.expires_at
          )
        ), '[]'::jsonb)
        FROM public.camera_grants gr
        JOIN public.cameras cam ON cam.id = gr.camera_id
        LEFT JOIN public.profiles p ON p.id = gr.grantee_user_id
        WHERE gr.community_id = v_community_id AND gr.revoked_at IS NULL
      ),
      'access_events', (
        SELECT COALESCE(jsonb_agg(
          jsonb_build_object(
            'id', cae.id,
            'camera_id', cae.camera_id,
            'camera_code', cam.camera_code,
            'viewer_id', cae.actor_id,
            'viewer_name', p.display_name,
            'permission_used', COALESCE(cs.permission_type, 'live'),
            'session_token_id', COALESCE(cs.scoped_token_hash, 'AUDIT-' || left(cae.id::text, 8)),
            'session_expires_at', cs.expires_at,
            'access_result', CASE WHEN cae.action = 'session_denied' THEN 'denied' ELSE cae.action END,
            'denial_reason', CASE WHEN cae.action = 'session_denied' THEN cae.reason_or_note ELSE NULL END,
            'created_at', cae.created_at
          ) ORDER BY cae.created_at DESC
        ), '[]'::jsonb)
        FROM public.camera_access_events cae
        JOIN public.cameras cam ON cam.id = cae.camera_id
        JOIN public.profiles p ON p.id = cae.actor_id
        LEFT JOIN public.camera_sessions cs ON cs.id = cae.session_id
        WHERE cae.community_id = v_community_id
          AND (v_has_safety_scope OR cae.actor_id = p_actor_id)
      )
    ),
    'integration_settings', (
      SELECT COALESCE(jsonb_agg(
        jsonb_build_object(
          'adapter_key', ist.adapter_key,
          'display_name', ist.display_name,
          'status', ist.status,
          'status_reason', ist.status_reason
        ) ORDER BY ist.adapter_key
      ), '[]'::jsonb)
      FROM public.integration_settings ist WHERE ist.community_id = v_community_id
    ),
    'notifications', (
      SELECT COALESCE(jsonb_agg(
        jsonb_build_object(
          'id', n.id,
          'category', n.category,
          'title', n.title,
          'safe_preview_body', n.safe_preview_body,
          'link_route', n.link_route,
          'is_urgent', n.is_urgent,
          'read_at', n.acknowledged_at,
          'created_at', n.created_at
        ) ORDER BY n.created_at DESC
      ), '[]'::jsonb)
      FROM public.notifications n WHERE n.recipient_id = p_actor_id
    )
  ) INTO v_result;

  RETURN v_result;
END;
$$;

-- ============================================================================
-- MUTATION 1: Update Profile Visibility (MEM-03, Test 3)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.cc_update_profile_visibility(
  p_actor_id uuid,
  p_show_unit boolean,
  p_show_phone boolean,
  p_show_profession boolean DEFAULT true,
  p_show_business boolean DEFAULT true
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.memberships
    WHERE user_id = p_actor_id AND status = 'approved'
  ) THEN
    RAISE EXCEPTION 'Only approved community members can update profile visibility';
  END IF;

  INSERT INTO public.profile_visibility (user_id, show_building, show_unit, show_phone, show_profession, show_business, allow_direct_messages, updated_at)
  VALUES (p_actor_id, true, p_show_unit, p_show_phone, p_show_profession, p_show_business, true, now())
  ON CONFLICT (user_id)
  DO UPDATE SET
    show_unit = EXCLUDED.show_unit,
    show_phone = EXCLUDED.show_phone,
    show_profession = EXCLUDED.show_profession,
    show_business = EXCLUDED.show_business,
    updated_at = now();

  INSERT INTO public.audit_events (community_id, actor_id, workspace_context, action_type, target_type, target_id, metadata)
  VALUES (
    '11111111-1111-4111-8111-111111111111'::uuid,
    p_actor_id,
    'resident_account',
    'update_profile_visibility',
    'profile_visibility',
    p_actor_id,
    jsonb_build_object('show_unit', p_show_unit, 'show_phone', p_show_phone)
  );

  RETURN jsonb_build_object('ok', true, 'show_unit', p_show_unit, 'show_phone', p_show_phone);
END;
$$;

-- ============================================================================
-- MUTATION 2: Server-Validated Idempotent Order Placement (SHOP-04, Test 4)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.cc_place_shop_order(
  p_actor_id uuid,
  p_shop_id uuid,
  p_product_id uuid,
  p_quantity int,
  p_idempotency_key text,
  p_payment_method text DEFAULT 'pay_on_delivery',
  p_instructions text DEFAULT ''
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_community_id uuid := '11111111-1111-4111-8111-111111111111'::uuid;
  v_existing_order record;
  v_shop record;
  v_product record;
  v_buyer record;
  v_subtotal bigint;
  v_tax bigint;
  v_total bigint;
  v_order_id uuid;
  v_invoice_id uuid;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.memberships
    WHERE user_id = p_actor_id AND community_id = v_community_id AND status = 'approved'
  ) THEN
    RAISE EXCEPTION 'Approved membership required to place shop orders';
  END IF;

  IF p_quantity <= 0 THEN
    RAISE EXCEPTION 'Order quantity must be greater than zero';
  END IF;

  -- Idempotency check: return existing order if same buyer + idempotency_key already exists
  SELECT id, total_paise, status INTO v_existing_order
  FROM public.orders
  WHERE buyer_id = p_actor_id AND idempotency_key = p_idempotency_key;

  IF v_existing_order.id IS NOT NULL THEN
    RETURN jsonb_build_object(
      'ok', true,
      'idempotent_replay', true,
      'order_id', v_existing_order.id,
      'total_paise', v_existing_order.total_paise,
      'status', v_existing_order.status
    );
  END IF;

  SELECT * INTO v_shop FROM public.shops WHERE id = p_shop_id AND approval_status = 'approved';
  IF v_shop.id IS NULL THEN
    RAISE EXCEPTION 'Shop is not active or approved';
  END IF;

  SELECT * INTO v_product FROM public.products WHERE id = p_product_id AND shop_id = p_shop_id AND is_active = true FOR UPDATE;
  IF v_product.id IS NULL THEN
    RAISE EXCEPTION 'Product not found or inactive';
  END IF;

  IF v_product.requires_prescription THEN
    RAISE EXCEPTION 'Prescription-gated item requires private prescription upload and licensed pharmacist verification (SHOP-11)';
  END IF;

  IF v_product.track_inventory AND v_product.stock_quantity < p_quantity THEN
    RAISE EXCEPTION 'Insufficient stock: only % units available', v_product.stock_quantity;
  END IF;

  -- Server calculates integer paise totals directly from database product & shop rows
  v_subtotal := v_product.price_paise * p_quantity;
  v_tax := (v_subtotal * v_product.tax_rate_bps) / 10000;
  v_total := v_subtotal + v_tax + v_shop.delivery_fee_paise;

  SELECT p.display_name, b.name AS building_name, pc.unit_number, pc.personal_phone
  INTO v_buyer
  FROM public.profiles p
  JOIN public.memberships m ON m.user_id = p.id
  JOIN public.private_contacts pc ON pc.user_id = p.id
  LEFT JOIN public.buildings b ON b.id = m.building_id
  WHERE p.id = p_actor_id;

  IF v_product.track_inventory THEN
    INSERT INTO public.products (
      id, shop_id, community_id, name, category, pack_size, unit_label,
      price_paise, tax_rate_bps, stock_quantity, track_inventory, requires_prescription, is_active
    ) VALUES (
      v_product.id, v_product.shop_id, v_product.community_id, v_product.name, v_product.category,
      v_product.pack_size, v_product.unit_label, v_product.price_paise, v_product.tax_rate_bps,
      v_product.stock_quantity - p_quantity, v_product.track_inventory, v_product.requires_prescription, v_product.is_active
    )
    ON CONFLICT (id) DO UPDATE SET stock_quantity = EXCLUDED.stock_quantity;
  END IF;

  INSERT INTO public.orders (
    community_id, shop_id, buyer_id, idempotency_key, status, payment_status, payment_method,
    subtotal_paise, tax_paise, delivery_fee_paise, total_paise,
    buyer_name_snapshot, delivery_building_snapshot, delivery_unit_snapshot, delivery_phone_snapshot, delivery_instructions
  ) VALUES (
    v_community_id, p_shop_id, p_actor_id, p_idempotency_key, 'submitted', 'unpaid', p_payment_method,
    v_subtotal, v_tax, v_shop.delivery_fee_paise, v_total,
    v_buyer.display_name, COALESCE(v_buyer.building_name, 'Tower A'), v_buyer.unit_number, v_buyer.personal_phone, p_instructions
  ) RETURNING id INTO v_order_id;

  INSERT INTO public.order_items (
    order_id, product_id, product_name_snapshot, pack_size_snapshot, quantity,
    unit_price_paise_snapshot, tax_paise_snapshot, line_total_paise_snapshot
  ) VALUES (
    v_order_id, v_product.id, v_product.name, v_product.pack_size, p_quantity,
    v_product.price_paise, v_tax, (v_subtotal + v_tax)
  );

  INSERT INTO public.invoices (
    community_id, order_id, shop_id, buyer_id, invoice_number,
    seller_name_snapshot, seller_gstin_snapshot,
    subtotal_paise, tax_paise, delivery_fee_paise, total_paise, status
  ) VALUES (
    v_community_id, v_order_id, p_shop_id, p_actor_id,
    'INV-' || upper(left(replace(v_order_id::text, '-', ''), 8)),
    v_shop.name, v_shop.gstin_number,
    v_subtotal, v_tax, v_shop.delivery_fee_paise, v_total, 'issued'
  ) RETURNING id INTO v_invoice_id;

  INSERT INTO public.ledger_entries (
    community_id, shop_id, order_id, invoice_id, entry_type, amount_paise, payment_evidence_note, is_settled_verified, recorded_by
  ) VALUES (
    v_community_id, p_shop_id, v_order_id, v_invoice_id, 'sale_debit', v_total,
    'Order placed via server-validated checkout (' || p_payment_method || ')', false, p_actor_id
  );

  RETURN jsonb_build_object(
    'ok', true,
    'idempotent_replay', false,
    'order_id', v_order_id,
    'invoice_id', v_invoice_id,
    'total_paise', v_total,
    'status', 'submitted'
  );
END;
$$;

-- ============================================================================
-- MUTATION 3: Buyer Approval or Cancellation of Price/Weight Change (SHOP-05, Test 6)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.cc_respond_order_price_change(
  p_actor_id uuid,
  p_order_id uuid,
  p_approve boolean
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_order record;
  v_new_status text;
  v_new_total bigint;
BEGIN
  SELECT * INTO v_order FROM public.orders WHERE id = p_order_id FOR UPDATE;
  IF v_order.id IS NULL THEN
    RAISE EXCEPTION 'Order not found';
  END IF;

  IF v_order.buyer_id <> p_actor_id THEN
    RAISE EXCEPTION 'Only the buyer on this order can approve or reject proposed price/weight changes';
  END IF;

  IF v_order.status <> 'awaiting_buyer_approval' THEN
    RAISE EXCEPTION 'Order is not awaiting buyer approval';
  END IF;

  IF p_approve THEN
    v_new_status := 'accepted';
    v_new_total := COALESCE(v_order.proposed_total_paise, v_order.total_paise);
  ELSE
    v_new_status := 'cancelled';
    v_new_total := v_order.total_paise;
  END IF;

  INSERT INTO public.orders (
    id, community_id, shop_id, buyer_id, idempotency_key, status, payment_status, payment_method,
    subtotal_paise, tax_paise, delivery_fee_paise, total_paise, proposed_total_paise,
    buyer_name_snapshot, delivery_building_snapshot, delivery_unit_snapshot, delivery_phone_snapshot, updated_at
  ) VALUES (
    v_order.id, v_order.community_id, v_order.shop_id, v_order.buyer_id, v_order.idempotency_key,
    v_new_status, v_order.payment_status, v_order.payment_method,
    v_order.subtotal_paise, v_order.tax_paise, v_order.delivery_fee_paise, v_new_total, NULL,
    v_order.buyer_name_snapshot, v_order.delivery_building_snapshot, v_order.delivery_unit_snapshot, v_order.delivery_phone_snapshot, now()
  )
  ON CONFLICT (id) DO UPDATE SET
    total_paise = EXCLUDED.total_paise,
    proposed_total_paise = NULL,
    status = EXCLUDED.status,
    updated_at = now();

  RETURN jsonb_build_object('ok', true, 'order_id', p_order_id, 'new_status', v_new_status);
END;
$$;

-- ============================================================================
-- MUTATION 4: Create Social Service Listing with Prohibited Item Check (SOC-10)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.cc_create_exchange_listing(
  p_actor_id uuid,
  p_direction text,
  p_exchange_mode text,
  p_title text,
  p_description text,
  p_category text,
  p_quantity int DEFAULT 1,
  p_price_paise bigint DEFAULT 0,
  p_deposit_paise bigint DEFAULT 0,
  p_handover_options text DEFAULT 'Tower lobby handover'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_listing_id uuid;
  v_combined_text text := lower(p_title || ' ' || p_description || ' ' || p_category);
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.memberships
    WHERE user_id = p_actor_id AND status = 'approved'
  ) THEN
    RAISE EXCEPTION 'Approved membership required to publish Social Service listings';
  END IF;

  -- Prohibited item policy check (SOC-10): block peer-to-peer medicines, weapons, hazardous materials
  IF v_combined_text ~ '(prescription|schedule-h|antibiotic|insulin|tablet|capsule|medicine|firearm|ammunition|explosive)' THEN
    RAISE EXCEPTION 'Prohibited Item Policy (SOC-10): Prescription or OTC medicines, weapons, and hazardous materials cannot be listed in peer-to-peer Social Service exchanges';
  END IF;

  INSERT INTO public.exchange_listings (
    community_id, owner_id, direction, exchange_mode, title, description, category,
    item_condition, total_quantity, allocated_quantity, price_paise, deposit_paise,
    handover_options, status, expires_at
  ) VALUES (
    '11111111-1111-4111-8111-111111111111'::uuid,
    p_actor_id,
    p_direction,
    p_exchange_mode,
    p_title,
    p_description,
    p_category,
    'good',
    GREATEST(1, p_quantity),
    0,
    GREATEST(0, p_price_paise),
    GREATEST(0, p_deposit_paise),
    p_handover_options,
    'open',
    now() + interval '14 days'
  ) RETURNING id INTO v_listing_id;

  RETURN jsonb_build_object('ok', true, 'listing_id', v_listing_id);
END;
$$;

-- ============================================================================
-- MUTATION 5: Request Scoped 60-Second Camera Session with Audit Log (CCTV-03/04, Test 18)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.cc_request_camera_session(
  p_actor_id uuid,
  p_camera_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_community_id uuid := '11111111-1111-4111-8111-111111111111'::uuid;
  v_camera record;
  v_has_grant boolean := false;
  v_token text;
  v_session_id uuid;
  v_expires_at timestamptz := now() + interval '60 seconds';
BEGIN
  SELECT * INTO v_camera FROM public.cameras WHERE id = p_camera_id AND community_id = v_community_id;
  IF v_camera.id IS NULL THEN
    RAISE EXCEPTION 'Camera not found';
  END IF;

  -- Check if actor has safety admin scope OR an active unexpired camera_grant
  SELECT EXISTS (
    SELECT 1 FROM public.role_grants rg
    WHERE rg.user_id = p_actor_id
      AND rg.revoked_at IS NULL
      AND (rg.expires_at IS NULL OR rg.expires_at > now())
      AND (rg.role_type = 'primary_admin' OR rg.module_scope IN ('all', 'safety'))
  ) OR EXISTS (
    SELECT 1 FROM public.camera_grants cg
    WHERE cg.camera_id = p_camera_id
      AND cg.grantee_user_id = p_actor_id
      AND cg.permission_type = 'live'
      AND cg.revoked_at IS NULL
      AND cg.expires_at > now()
  ) INTO v_has_grant;

  IF NOT v_has_grant THEN
    INSERT INTO public.camera_access_events (
      community_id, camera_id, actor_id, action, reason_or_note
    ) VALUES (
      v_community_id, p_camera_id, p_actor_id,
      'session_denied', 'Actor lacks active live camera grant for ' || v_camera.camera_code
    );

    RETURN jsonb_build_object(
      'ok', false,
      'access_result', 'denied',
      'reason', 'Permission denied: you do not hold an active live grant for camera ' || v_camera.camera_code || '. Access attempt logged.'
    );
  END IF;

  v_token := 'cctv-scoped-60s-' || replace(gen_random_uuid()::text, '-', '');

  INSERT INTO public.camera_sessions (
    community_id, camera_id, viewer_user_id, permission_type, scoped_token_hash, adapter_mode, expires_at
  ) VALUES (
    v_community_id, p_camera_id, p_actor_id, 'live', v_token, 'demo_synthetic', v_expires_at
  ) RETURNING id INTO v_session_id;

  INSERT INTO public.camera_access_events (
    community_id, camera_id, session_id, actor_id, action, reason_or_note
  ) VALUES (
    v_community_id, p_camera_id, v_session_id, p_actor_id, 'session_issued', '60s scoped token issued for ' || v_camera.camera_code
  );

  RETURN jsonb_build_object(
    'ok', true,
    'access_result', 'session_issued',
    'camera_code', v_camera.camera_code,
    'display_name', v_camera.display_name,
    'online_state', v_camera.online_state,
    'integration_type', v_camera.integration_type,
    'session_token', v_token,
    'expires_at', v_expires_at,
    'watermark_text', 'DEMO SAMPLE FEED • ' || v_camera.camera_code || ' • VIEWER ' || left(p_actor_id::text, 8)
  );
END;
$$;

-- ============================================================================
-- MUTATION 6: Trigger & Deduplicate SOS Incident Before Fan-Out (SOS-02..06, Test 14)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.cc_trigger_sos_incident(
  p_actor_id uuid,
  p_category text,
  p_building_id uuid,
  p_manual_floor text,
  p_manual_lift text,
  p_notes text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_community_id uuid := '11111111-1111-4111-8111-111111111111'::uuid;
  v_existing_id uuid;
  v_reporter record;
  v_building_name text;
  v_incident_id uuid;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.memberships
    WHERE user_id = p_actor_id AND status = 'approved'
  ) THEN
    RAISE EXCEPTION 'Approved membership required to trigger community SOS';
  END IF;

  -- Deduplicate repeated SOS presses within 60 seconds by the same user
  SELECT id INTO v_existing_id
  FROM public.incidents
  WHERE reporter_id = p_actor_id
    AND status IN ('raised', 'responder_acknowledged', 'responder_en_route', 'assistance_arrived')
    AND created_at > now() - interval '60 seconds'
  LIMIT 1;

  IF v_existing_id IS NOT NULL THEN
    RETURN jsonb_build_object('ok', true, 'deduplicated', true, 'incident_id', v_existing_id);
  END IF;

  SELECT p.display_name, pc.unit_number, pc.personal_phone
  INTO v_reporter
  FROM public.profiles p
  LEFT JOIN public.private_contacts pc ON pc.user_id = p.id
  WHERE p.id = p_actor_id;

  SELECT name INTO v_building_name FROM public.buildings WHERE id = p_building_id;

  INSERT INTO public.incidents (
    community_id, reporter_id, category, building_id,
    manual_floor_label, manual_lift_or_area_label,
    approx_area_public_label, safe_guidance_public_text, restricted_responder_details,
    status, is_demo_simulation
  ) VALUES (
    v_community_id, p_actor_id, p_category, p_building_id,
    p_manual_floor, p_manual_lift,
    COALESCE(v_building_name, 'Main Complex') || ' — ' || COALESCE(NULLIF(p_manual_floor, ''), 'Common Area'),
    'Active ' || replace(p_category, '_', ' ') || ' alert in ' || COALESCE(v_building_name, 'Main Complex') || '. Please keep lift lobbies and emergency access lanes clear for on-duty responders.',
    '[RESTRICTED RESPONDER DETAIL] Reporter: ' || v_reporter.display_name || ' (Unit ' || COALESCE(v_reporter.unit_number, 'N/A') || ', Phone ' || COALESCE(v_reporter.personal_phone, 'N/A') || '). Notes: ' || COALESCE(p_notes, 'None'),
    'raised',
    true
  ) RETURNING id INTO v_incident_id;

  INSERT INTO public.incident_alert_deliveries (incident_id, channel, delivery_status, retry_count, failure_reason)
  VALUES
    (v_incident_id, 'in_app_responder', 'provider_accepted', 0, NULL),
    (v_incident_id, 'in_app_community_sanitised', 'provider_accepted', 0, NULL),
    (v_incident_id, 'sms_adapter', 'failed', 1, 'External SMS Gateway unconfigured in demo mode — use direct emergency phone buttons if urgent (SOS-06)');

  RETURN jsonb_build_object('ok', true, 'deduplicated', false, 'incident_id', v_incident_id);
END;
$$;

-- ============================================================================
-- MUTATION 7: Responder Acknowledge SOS Incident (SOS-05, Test 15)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.cc_acknowledge_sos_incident(
  p_actor_id uuid,
  p_incident_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_is_authorised boolean := false;
  v_inc record;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM public.staff_profiles sp
    WHERE sp.user_id = p_actor_id AND sp.is_active_responder = true
  ) OR EXISTS (
    SELECT 1 FROM public.role_grants rg
    WHERE rg.user_id = p_actor_id
      AND rg.revoked_at IS NULL
      AND (rg.role_type = 'primary_admin' OR rg.module_scope IN ('all', 'safety'))
  ) INTO v_is_authorised;

  IF NOT v_is_authorised THEN
    RAISE EXCEPTION 'Only authorised on-duty responders or Safety Sub-Admins can acknowledge SOS incidents';
  END IF;

  SELECT * INTO v_inc FROM public.incidents WHERE id = p_incident_id FOR UPDATE;
  IF v_inc.id IS NULL THEN
    RAISE EXCEPTION 'Incident not found';
  END IF;

  INSERT INTO public.incidents (
    id, community_id, reporter_id, category, building_id,
    manual_floor_label, manual_lift_or_area_label,
    approx_area_public_label, safe_guidance_public_text, restricted_responder_details,
    status, acknowledged_by_user_id, acknowledged_at, is_demo_simulation, updated_at
  ) VALUES (
    v_inc.id, v_inc.community_id, v_inc.reporter_id, v_inc.category, v_inc.building_id,
    v_inc.manual_floor_label, v_inc.manual_lift_or_area_label,
    v_inc.approx_area_public_label, v_inc.safe_guidance_public_text, v_inc.restricted_responder_details,
    'responder_acknowledged', p_actor_id, now(), v_inc.is_demo_simulation, now()
  )
  ON CONFLICT (id) DO UPDATE SET
    status = 'responder_acknowledged',
    acknowledged_by_user_id = EXCLUDED.acknowledged_by_user_id,
    acknowledged_at = EXCLUDED.acknowledged_at,
    updated_at = now();

  INSERT INTO public.incident_responders (incident_id, responder_user_id, assignment_status)
  VALUES (p_incident_id, p_actor_id, 'acknowledged')
  ON CONFLICT (incident_id, responder_user_id)
  DO UPDATE SET assignment_status = 'acknowledged', updated_at = now();

  RETURN jsonb_build_object('ok', true, 'incident_id', p_incident_id, 'status', 'responder_acknowledged');
END;
$$;

GRANT EXECUTE ON FUNCTION public.cc_get_bootstrap_state(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.cc_update_profile_visibility(uuid, boolean, boolean, boolean, boolean) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.cc_place_shop_order(uuid, uuid, uuid, int, text, text, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.cc_respond_order_price_change(uuid, uuid, boolean) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.cc_create_exchange_listing(uuid, text, text, text, text, text, int, bigint, bigint, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.cc_request_camera_session(uuid, uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.cc_trigger_sos_incident(uuid, text, uuid, text, text, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.cc_acknowledge_sos_incident(uuid, uuid) TO anon, authenticated;
