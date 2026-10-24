import React from 'react';
import { loadCommunityBootstrapState } from '@/lib/data/community-loader';
import { CommunityDirectoryClient } from '@/components/community/CommunityDirectoryClient';

export default async function CommunityPage() {
  const bootstrap = await loadCommunityBootstrapState();
  if (bootstrap.access_denied) return null;

  return (
    <CommunityDirectoryClient
      actorId={bootstrap.actor.id}
      totalSocietyMembers={bootstrap.community.total_members}
      directory={bootstrap.directory ?? []}
      posts={bootstrap.posts ?? []}
      groups={bootstrap.groups ?? []}
    />
  );
}
