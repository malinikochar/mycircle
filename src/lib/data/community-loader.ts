import { cookies } from 'next/headers';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import type { CommunityBootstrapState } from '@/lib/types/domain';

export const PERSONA_IDS = {
  PRIMARY_ADMIN_AARAV: '00000000-0000-4000-8000-000000000001',
  RESIDENT_PRIYA: '00000000-0000-4000-8000-000000000002',
  RESIDENT_ROHAN: '00000000-0000-4000-8000-000000000003',
  PENDING_VIKRAM: '00000000-0000-4000-8000-000000000004',
  SUSPENDED_KARAN: '00000000-0000-4000-8000-000000000005',
  SUBADMIN_1_MEMBERSHIP_NEHA: '00000000-0000-4000-8000-000000000011',
  SUBADMIN_2_MODERATION_SIDDHARTH: '00000000-0000-4000-8000-000000000012',
  SUBADMIN_3_EVENTS_ANANYA: '00000000-0000-4000-8000-000000000013',
  SUBADMIN_4_WATER_RAJESHWAR: '00000000-0000-4000-8000-000000000014',
  SUBADMIN_5_ELECTRICITY_FARHAN: '00000000-0000-4000-8000-000000000015',
  SUBADMIN_6_CLEANLINESS_KAVITA: '00000000-0000-4000-8000-000000000016',
  SUBADMIN_7_CIVIC_DEVENDRA: '00000000-0000-4000-8000-000000000017',
  SUBADMIN_8_COMMERCE_MEERA: '00000000-0000-4000-8000-000000000018',
  SUBADMIN_9_SERVICES_HARPREET: '00000000-0000-4000-8000-000000000019',
  SUBADMIN_10_SAFETY_PRATAP: '00000000-0000-4000-8000-000000000020',
  SHOP_OWNER_SURESH: '00000000-0000-4000-8000-000000000021',
  PHARMACIST_ZOYA: '00000000-0000-4000-8000-000000000022',
  PROVIDER_RAMESH: '00000000-0000-4000-8000-000000000023',
  PROVIDER_SANTOSH: '00000000-0000-4000-8000-000000000024',
  STAFF_RESPONDER_MAHESH: '00000000-0000-4000-8000-000000000025',
  STAFF_GUARD_DINESH: '00000000-0000-4000-8000-000000000026',
} as const;

export const PERSONA_COOKIE_NAME = 'cc_persona_id';

export interface ActorAccountDetails {
  user_id: string;
  username: string;
  email: string;
  role_label: string;
  professional_headline?: string | null;
  years_experience?: number | null;
  qualifications?: string | null;
  business_name?: string | null;
  business_category?: string | null;
  business_description?: string | null;
}

export async function getActivePersonaId(): Promise<string> {
  try {
    const cookieStore = await cookies();
    const cookieVal = cookieStore.get(PERSONA_COOKIE_NAME)?.value;
    if (cookieVal && /^[0-9a-f-]{36}$/i.test(cookieVal)) {
      return cookieVal;
    }
  } catch {
    // Called outside request context (e.g. static generation or Vitest)
  }
  return PERSONA_IDS.RESIDENT_PRIYA;
}

export async function loadCommunityBootstrapState(
  explicitActorId?: string
): Promise<CommunityBootstrapState> {
  const actorId = explicitActorId ?? (await getActivePersonaId());
  const supabase = createSupabaseServerClient();

  const { data, error } = await supabase.rpc('cc_get_bootstrap_state', {
    p_actor_id: actorId,
  });

  if (error || !data) {
    throw new Error(
      `Failed to load MyCircle state from Supabase (runquwuetzfivhwefenk): ${error?.message ?? 'Empty RPC response'}`
    );
  }

  const state = data as CommunityBootstrapState;

  // Ensure any newly registered member is included in personas list for the top navigation selector
  if (
    state.actor?.id &&
    Array.isArray(state.personas) &&
    !state.personas.some((p) => p.id === state.actor.id)
  ) {
    state.personas = [
      {
        id: state.actor.id,
        display_name: state.actor.display_name,
        profession: state.actor.profession ?? 'Community Resident',
        membership_status: state.actor.status ?? 'approved',
        building_code: state.actor.building_code ?? 'TWR-A',
        roles: (state.actor.role_grants ?? []).map((r) => ({
          role_type: r.role_type,
          module_scope: r.module_scope,
          title_label: r.title_label,
        })),
        is_shop_member: (state.actor.shop_memberships?.length ?? 0) > 0,
        is_provider: (state.actor.provider_memberships?.length ?? 0) > 0,
        is_staff: Boolean(state.actor.staff_profile),
      },
      ...state.personas,
    ];
  }

  return state;
}

export async function loadActorAccountDetails(
  explicitActorId?: string
): Promise<ActorAccountDetails> {
  const actorId = explicitActorId ?? (await getActivePersonaId());
  const supabase = createSupabaseServerClient();

  const { data, error } = await supabase.rpc('cc_get_actor_account_details', {
    p_actor_id: actorId,
  });

  if (error || !data) {
    return {
      user_id: actorId,
      username: `member_${actorId.slice(-4)}`,
      email: `resident.${actorId.slice(-4)}@mycircle.in`,
      role_label: 'Verified Resident Member',
    };
  }

  return data as ActorAccountDetails;
}
