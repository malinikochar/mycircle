import React from 'react';
import { loadCommunityBootstrapState } from '@/lib/data/community-loader';
import { HelpComplaintsClient } from '@/components/help/HelpComplaintsClient';

export default async function HelpComplaintsPage() {
  const bootstrap = await loadCommunityBootstrapState();
  if (bootstrap.access_denied) return null;

  return (
    <HelpComplaintsClient
      complaints={bootstrap.help_and_cases?.complaints ?? []}
      helpRequests={bootstrap.help_and_cases?.help_requests ?? []}
      sharedIssues={bootstrap.help_and_cases?.shared_issues ?? []}
      authorityContacts={bootstrap.help_and_cases?.authority_contacts ?? []}
      escalationRecords={bootstrap.help_and_cases?.escalation_records ?? []}
    />
  );
}
