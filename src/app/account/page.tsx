import React from 'react';
import { loadCommunityBootstrapState } from '@/lib/data/community-loader';
import { AccountPrivacyClient } from '@/components/account/AccountPrivacyClient';

export default async function AccountPage() {
  const bootstrap = await loadCommunityBootstrapState();
  if (bootstrap.access_denied) return null;

  return (
    <AccountPrivacyClient
      actor={bootstrap.actor}
      notifications={bootstrap.notifications ?? []}
    />
  );
}
