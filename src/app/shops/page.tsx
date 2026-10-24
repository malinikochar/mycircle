import React from 'react';
import { loadCommunityBootstrapState } from '@/lib/data/community-loader';
import { ShopsCommerceClient } from '@/components/shops/ShopsCommerceClient';

export default async function ShopsPage() {
  const bootstrap = await loadCommunityBootstrapState();
  if (bootstrap.access_denied) return null;

  return (
    <ShopsCommerceClient
      actorId={bootstrap.actor.id}
      actorName={bootstrap.actor.display_name}
      shops={bootstrap.shops ?? []}
      orders={bootstrap.orders ?? []}
    />
  );
}
