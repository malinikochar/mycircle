import React from 'react';
import { loadCommunityBootstrapState } from '@/lib/data/community-loader';
import { HomeDashboardClient } from '@/components/home/HomeDashboardClient';

export default async function HomePage() {
  const bootstrap = await loadCommunityBootstrapState();

  if (bootstrap.access_denied) {
    return null; // Handled by AppShell auth/membership gate
  }

  return <HomeDashboardClient bootstrap={bootstrap} />;
}
