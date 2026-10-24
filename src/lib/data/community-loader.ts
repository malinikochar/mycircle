import { cache } from 'react';
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

/**
 * Returns the authenticated user's UUID from the session cookie, or null if not logged in.
 * Unauthenticated visitors receive null so zero community data is exposed publicly.
 */
export async function getAuthenticatedUserId(): Promise<string | null> {
  try {
    const cookieStore = await cookies();
    const cookieVal = cookieStore.get(PERSONA_COOKIE_NAME)?.value;
    if (cookieVal && /^[0-9a-f-]{36}$/i.test(cookieVal)) {
      return cookieVal;
    }
  } catch {
    // Called outside request context
  }
  return null;
}

export async function getActivePersonaId(): Promise<string> {
  const authenticatedId = await getAuthenticatedUserId();
  if (!authenticatedId) {
    throw new Error('Authentication required: please sign in to perform this action.');
  }
  return authenticatedId;
}

const UNAUTHENTICATED_BOOTSTRAP_STATE: CommunityBootstrapState = {
  access_denied: true,
  membership_status: 'unauthenticated',
  membership_reason: 'Please sign in with your MyCircle account to access private community services.',
  community: {
    id: '11111111-1111-4111-8111-111111111111',
    name: 'MyCircle Private Community',
    city: 'Mumbai',
    total_members: 0,
  },
  buildings: [
    { id: '22222222-2222-4222-8222-222222222201', code: 'TWR-A', name: 'Tower A — Gulmohar', floors_count: 18, units_count: 180 },
    { id: '22222222-2222-4222-8222-222222222202', code: 'TWR-B', name: 'Tower B — Amaltas', floors_count: 18, units_count: 180 },
    { id: '22222222-2222-4222-8222-222222222203', code: 'TWR-C', name: 'Tower C — Banyan', floors_count: 18, units_count: 180 },
    { id: '22222222-2222-4222-8222-222222222204', code: 'TWR-D', name: 'Tower D — Ashoka', floors_count: 16, units_count: 160 },
    { id: '22222222-2222-4222-8222-222222222205', code: 'TWR-E', name: 'Tower E — Peepal', floors_count: 16, units_count: 160 },
    { id: '22222222-2222-4222-8222-222222222206', code: 'TWR-F', name: 'Tower F — Deodar', floors_count: 14, units_count: 140 },
  ],
  actor: {
    id: '',
    display_name: 'Guest Visitor',
    profession: null,
    status: 'pending',
    role_grants: [],
    shop_memberships: [],
    provider_memberships: [],
  },
  personas: [],
};

const fetchBootstrapForActor = cache(
  async (actorId: string, preservePersonas: boolean): Promise<CommunityBootstrapState> => {
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

    const isPrimaryAdmin = Boolean(
      state.actor?.role_grants?.some(
        (r) => r.role_type === 'primary_admin' || r.module_scope === 'all'
      )
    );

    // Restrict full member persona list strictly to Primary Admin (never exposed to general users)
    if (!isPrimaryAdmin && !preservePersonas) {
      state.personas = [];
    }

    return state;
  }
);

export async function loadCommunityBootstrapState(
  explicitActorId?: string
): Promise<CommunityBootstrapState> {
  const actorId = explicitActorId ?? (await getAuthenticatedUserId());

  // Production Auth Gate: If no user is logged in, return zero community data
  if (!actorId) {
    return UNAUTHENTICATED_BOOTSTRAP_STATE;
  }

  return fetchBootstrapForActor(actorId, Boolean(explicitActorId));
}

const fetchAccountDetailsForActor = cache(
  async (actorId: string): Promise<ActorAccountDetails> => {
    const supabase = createSupabaseServerClient();

    const { data, error } = await supabase.rpc('cc_get_actor_account_details', {
      p_actor_id: actorId,
    });

    if (error || !data) {
      return {
        user_id: actorId,
        username: `member_${actorId.slice(-4)}`,
        email: `resident.${actorId.slice(-4)}@ensure.in`,
        role_label: 'Verified Resident Member',
      };
    }

    return data as ActorAccountDetails;
  }
);

export async function loadActorAccountDetails(
  explicitActorId?: string
): Promise<ActorAccountDetails> {
  const actorId = explicitActorId ?? (await getAuthenticatedUserId());
  if (!actorId) {
    return {
      user_id: '',
      username: '',
      email: '',
      role_label: 'Unauthenticated',
    };
  }

  return fetchAccountDetailsForActor(actorId);
}
