import React from 'react';
import { loadCommunityBootstrapState } from '@/lib/data/community-loader';
import { SafetyCCTVClient } from '@/components/safety/SafetyCCTVClient';

export default async function SafetyPage() {
  const bootstrap = await loadCommunityBootstrapState();
  if (bootstrap.access_denied) return null;

  return (
    <SafetyCCTVClient
      actorId={bootstrap.actor.id}
      actorName={bootstrap.actor.display_name}
      incidents={bootstrap.safety_and_sos?.incidents ?? []}
      activeLocations={bootstrap.staff_and_locations?.active_locations ?? []}
      cameras={bootstrap.cctv?.cameras ?? []}
      cameraAccessEvents={bootstrap.cctv?.access_events ?? []}
    />
  );
}
