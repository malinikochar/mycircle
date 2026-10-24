import React from 'react';
import { loadCommunityBootstrapState } from '@/lib/data/community-loader';
import { AuthPortalClient } from '@/components/auth/AuthPortalClient';

export default async function RegisterPage() {
  const bootstrap = await loadCommunityBootstrapState();

  return (
    <AuthPortalClient
      initialMode="register"
      buildings={bootstrap.buildings ?? [
        { id: '22222222-2222-4222-8222-222222222201', code: 'TWR-A', name: 'Tower A — Gulmohar', floors_count: 18, units_count: 180 },
        { id: '22222222-2222-4222-8222-222222222202', code: 'TWR-B', name: 'Tower B — Amaltas', floors_count: 18, units_count: 180 },
        { id: '22222222-2222-4222-8222-222222222203', code: 'TWR-C', name: 'Tower C — Banyan', floors_count: 18, units_count: 180 },
        { id: '22222222-2222-4222-8222-222222222204', code: 'TWR-D', name: 'Tower D — Ashoka', floors_count: 16, units_count: 160 },
      ]}
      currentActor={bootstrap.actor}
    />
  );
}
