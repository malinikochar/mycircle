'use server';

import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import {
  getActivePersonaId,
  loadCommunityBootstrapState,
  PERSONA_COOKIE_NAME,
} from '@/lib/data/community-loader';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function switchPersonaAction(personaId: string) {
  // Strictly restricted to Primary Admin
  const currentBootstrap = await loadCommunityBootstrapState();
  const isPrimaryAdmin = Boolean(
    currentBootstrap.actor?.role_grants?.some(
      (r) => r.role_type === 'primary_admin' || r.module_scope === 'all'
    )
  );
  if (!isPrimaryAdmin) {
    return {
      ok: false,
      error: 'Only Primary Society Admins are permitted to switch member sessions.',
    };
  }

  const cookieStore = await cookies();
  cookieStore.set(PERSONA_COOKIE_NAME, personaId, {
    path: '/',
    httpOnly: false,
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 30,
  });
  revalidatePath('/', 'layout');
  return { ok: true, personaId };
}

export async function loginWithCredentialsAction(input: {
  identifier: string;
  password: string;
}) {
  const supabase = createSupabaseServerClient();

  const { data, error } = await supabase.rpc('cc_authenticate_user', {
    p_identifier: input.identifier,
    p_password: input.password,
  });

  if (error || !data) {
    return {
      ok: false,
      error: error?.message ?? 'Invalid username/email or password.',
    };
  }

  const authResult = data as {
    authenticated: boolean;
    user_id: string;
    display_name: string;
    username: string;
    email: string;
    role_label: string;
    membership_status: string;
  };

  const cookieStore = await cookies();
  cookieStore.set(PERSONA_COOKIE_NAME, authResult.user_id, {
    path: '/',
    httpOnly: false,
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 30,
  });

  revalidatePath('/', 'layout');
  return { ok: true, data: authResult };
}

export async function registerMemberAction(input: {
  displayName: string;
  username: string;
  email: string;
  password: string;
  profession: string;
  buildingId: string;
  unitNumber: string;
  phone: string;
  residencyType: string;
  bio: string;
  autoApprove: boolean;
}) {
  const supabase = createSupabaseServerClient();

  const { data, error } = await supabase.rpc('cc_register_member', {
    p_display_name: input.displayName,
    p_username: input.username,
    p_email: input.email,
    p_password: input.password,
    p_profession: input.profession,
    p_building_id: input.buildingId,
    p_unit_number: input.unitNumber,
    p_phone: input.phone,
    p_residency_type: input.residencyType,
    p_bio: input.bio,
    p_auto_approve: input.autoApprove,
  });

  if (error || !data) {
    return {
      ok: false,
      error: error?.message ?? 'Registration failed. Please verify your details.',
    };
  }

  const regResult = data as {
    registered: boolean;
    user_id: string;
    display_name: string;
    username: string;
    email: string;
    membership_status: string;
  };

  const cookieStore = await cookies();
  cookieStore.set(PERSONA_COOKIE_NAME, regResult.user_id, {
    path: '/',
    httpOnly: false,
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 30,
  });

  revalidatePath('/', 'layout');
  return { ok: true, data: regResult };
}

export async function changeUserPasswordAction(input: {
  currentPassword: string;
  newPassword: string;
}) {
  const actorId = await getActivePersonaId();
  const supabase = createSupabaseServerClient();

  const { data, error } = await supabase.rpc('cc_change_user_password', {
    p_actor_id: actorId,
    p_current_password: input.currentPassword,
    p_new_password: input.newPassword,
  });

  if (error) {
    return { ok: false, error: error.message };
  }

  return { ok: true, data };
}

export async function resetForgottenPasswordAction(input: {
  identifier: string;
  verificationText: string;
  newPassword: string;
}) {
  const supabase = createSupabaseServerClient();

  const { data, error } = await supabase.rpc('cc_reset_forgotten_password', {
    p_identifier: input.identifier,
    p_verification_text: input.verificationText,
    p_new_password: input.newPassword,
  });

  if (error || !data) {
    return {
      ok: false,
      error: error?.message ?? 'Could not reset password for that account.',
    };
  }

  return {
    ok: true,
    data: data as {
      reset: boolean;
      user_id: string;
      username: string;
      email: string;
      display_name: string;
    },
  };
}

export async function updateMemberProfileAction(input: {
  displayName: string;
  profession: string;
  bio: string;
  skills: string[];
  interests: string[];
  unitNumber: string;
  personalPhone: string;
  residencyType: string;
  headline?: string;
  businessName?: string;
  businessCategory?: string;
  businessDescription?: string;
}) {
  const actorId = await getActivePersonaId();
  const supabase = createSupabaseServerClient();

  const { data, error } = await supabase.rpc('cc_update_member_profile', {
    p_actor_id: actorId,
    p_display_name: input.displayName,
    p_profession: input.profession,
    p_bio: input.bio,
    p_skills: input.skills,
    p_interests: input.interests,
    p_unit_number: input.unitNumber,
    p_personal_phone: input.personalPhone,
    p_residency_type: input.residencyType,
    p_headline: input.headline ?? null,
    p_business_name: input.businessName ?? null,
    p_business_category: input.businessCategory ?? null,
    p_business_description: input.businessDescription ?? null,
  });

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePath('/', 'layout');
  revalidatePath('/account');
  revalidatePath('/community');
  return { ok: true, data };
}

export async function logoutAction() {
  const cookieStore = await cookies();
  cookieStore.delete(PERSONA_COOKIE_NAME);
  revalidatePath('/', 'layout');
  return { ok: true };
}

export async function updateVisibilityAction(input: {
  show_unit: boolean;
  show_phone: boolean;
  show_profession: boolean;
  show_business: boolean;
}) {
  const actorId = await getActivePersonaId();
  const supabase = createSupabaseServerClient();

  const { data, error } = await supabase.rpc('cc_update_profile_visibility', {
    p_actor_id: actorId,
    p_show_unit: input.show_unit,
    p_show_phone: input.show_phone,
    p_show_profession: input.show_profession,
    p_show_business: input.show_business,
  });

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePath('/', 'layout');
  return { ok: true, data };
}

export async function placeShopOrderAction(input: {
  shopId: string;
  productId: string;
  quantity: number;
  idempotencyKey: string;
  paymentMethod: 'pay_on_delivery' | 'direct_upi' | 'counter_pickup';
  instructions: string;
}) {
  const actorId = await getActivePersonaId();
  const supabase = createSupabaseServerClient();

  const { data, error } = await supabase.rpc('cc_place_shop_order', {
    p_actor_id: actorId,
    p_shop_id: input.shopId,
    p_product_id: input.productId,
    p_quantity: input.quantity,
    p_idempotency_key: input.idempotencyKey,
    p_payment_method: input.paymentMethod,
    p_instructions: input.instructions,
  });

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePath('/shops');
  revalidatePath('/workspaces/shop');
  revalidatePath('/account');
  return { ok: true, data };
}

export async function respondOrderPriceChangeAction(input: {
  orderId: string;
  approve: boolean;
}) {
  const actorId = await getActivePersonaId();
  const supabase = createSupabaseServerClient();

  const { data, error } = await supabase.rpc('cc_respond_order_price_change', {
    p_actor_id: actorId,
    p_order_id: input.orderId,
    p_approve: input.approve,
  });

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePath('/shops');
  revalidatePath('/workspaces/shop');
  revalidatePath('/');
  return { ok: true, data };
}

export async function createExchangeListingAction(input: {
  direction: 'need' | 'offer';
  exchangeMode: string;
  title: string;
  description: string;
  category: string;
  quantity: number;
  pricePaise: number;
  depositPaise: number;
  handoverOptions: string;
}) {
  const actorId = await getActivePersonaId();
  const supabase = createSupabaseServerClient();

  const { data, error } = await supabase.rpc('cc_create_exchange_listing', {
    p_actor_id: actorId,
    p_direction: input.direction,
    p_exchange_mode: input.exchangeMode,
    p_title: input.title,
    p_description: input.description,
    p_category: input.category,
    p_quantity: input.quantity,
    p_price_paise: input.pricePaise,
    p_deposit_paise: input.depositPaise,
    p_handover_options: input.handoverOptions,
  });

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePath('/social-service');
  revalidatePath('/');
  return { ok: true, data };
}

export async function requestCameraSessionAction(cameraId: string) {
  const actorId = await getActivePersonaId();
  const supabase = createSupabaseServerClient();

  const { data, error } = await supabase.rpc('cc_request_camera_session', {
    p_actor_id: actorId,
    p_camera_id: cameraId,
  });

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePath('/safety');
  revalidatePath('/workspaces/admin');
  return { ok: true, data };
}

export async function triggerSOSIncidentAction(input: {
  category: 'medical' | 'fire_smoke' | 'security_threat' | 'lift_entrapment' | 'urgent_hazard';
  buildingId: string;
  manualFloor: string;
  manualLiftOrArea: string;
  notes: string;
}) {
  const actorId = await getActivePersonaId();
  const supabase = createSupabaseServerClient();

  const { data, error } = await supabase.rpc('cc_trigger_sos_incident', {
    p_actor_id: actorId,
    p_category: input.category,
    p_building_id: input.buildingId,
    p_manual_floor: input.manualFloor,
    p_manual_lift: input.manualLiftOrArea,
    p_notes: input.notes,
  });

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePath('/safety');
  revalidatePath('/workspaces/staff');
  revalidatePath('/workspaces/admin');
  revalidatePath('/');
  return { ok: true, data };
}

export async function acknowledgeSOSIncidentAction(incidentId: string) {
  const actorId = await getActivePersonaId();
  const supabase = createSupabaseServerClient();

  const { data, error } = await supabase.rpc('cc_acknowledge_sos_incident', {
    p_actor_id: actorId,
    p_incident_id: incidentId,
  });

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePath('/safety');
  revalidatePath('/workspaces/staff');
  revalidatePath('/workspaces/admin');
  revalidatePath('/');
  return { ok: true, data };
}
