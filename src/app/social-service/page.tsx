import React from 'react';
import { loadCommunityBootstrapState } from '@/lib/data/community-loader';
import { SocialServiceClient } from '@/components/social-service/SocialServiceClient';

export default async function SocialServicePage() {
  const bootstrap = await loadCommunityBootstrapState();
  if (bootstrap.access_denied) return null;

  return (
    <SocialServiceClient
      listings={bootstrap.social_service?.listings ?? []}
      agreements={bootstrap.social_service?.agreements ?? []}
      eligibilities={bootstrap.reputation?.eligibilities ?? []}
      reviews={bootstrap.reputation?.reviews ?? []}
    />
  );
}
