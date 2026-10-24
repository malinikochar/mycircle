import React from 'react';
import {
  loadCommunityBootstrapState,
  loadActorAccountDetails,
} from '@/lib/data/community-loader';
import { AccountPrivacyClient } from '@/components/account/AccountPrivacyClient';

export default async function AccountPage() {
  const [bootstrap, accountDetails] = await Promise.all([
    loadCommunityBootstrapState(),
    loadActorAccountDetails(),
  ]);
  if (bootstrap.access_denied) return null;

  return (
    <AccountPrivacyClient
      actor={bootstrap.actor}
      accountDetails={accountDetails}
      notifications={bootstrap.notifications ?? []}
    />
  );
}
