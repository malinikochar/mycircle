import React from 'react';
import { loadCommunityBootstrapState } from '@/lib/data/community-loader';
import { ServicesClient } from '@/components/services/ServicesClient';

export default async function ServicesPage() {
  const bootstrap = await loadCommunityBootstrapState();
  if (bootstrap.access_denied) return null;

  return (
    <ServicesClient
      providers={bootstrap.services?.providers ?? []}
      enquiries={bootstrap.services?.enquiries ?? []}
      bookings={bootstrap.services?.bookings ?? []}
    />
  );
}
