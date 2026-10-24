'use client';

import React, { useState } from 'react';

const NAME_TO_AVATAR_MAP: Record<string, string> = {
  aarav: '/avatars/aarav-mehta.jpg',
  priya: '/avatars/priya-nair.jpg',
  rohan: '/avatars/rohan-kulkarni.jpg',
  vikram: '/avatars/pranav-kapoor.jpg',
  karan: '/avatars/farhan-shaikh.jpg',
  neha: '/avatars/neha-deshmukh.jpg',
  siddharth: '/avatars/siddharth-joshi.jpg',
  ananya: '/avatars/ananya-iyer.jpg',
  rajeshwar: '/avatars/rajeshwar-rao.jpg',
  farhan: '/avatars/farhan-shaikh.jpg',
  kavita: '/avatars/kavita-krishnan.jpg',
  devendra: '/avatars/devendra-patil.jpg',
  meera: '/avatars/meera-chawla.jpg',
  harpreet: '/avatars/harpreet-gill.jpg',
  pratap: '/avatars/pratap-chauhan.jpg',
  col: '/avatars/pratap-chauhan.jpg',
  suresh: '/avatars/suresh-agarwal.jpg',
  zoya: '/avatars/zoya-merchant.jpg',
  ramesh: '/avatars/ramesh-vishwakarma.jpg',
  santosh: '/avatars/santosh-pawar.jpg',
  mahesh: '/avatars/mahesh-yadav.jpg',
  dinesh: '/avatars/dinesh-tiwari.jpg',
  pooja: '/avatars/pooja-jain.jpg',
  deepika: '/avatars/deepika-sharma.jpg',
  pranav: '/avatars/pranav-kapoor.jpg',
  swati: '/avatars/ananya-iyer.jpg',
  meghna: '/avatars/kavita-krishnan.jpg',
  aditi: '/avatars/meera-chawla.jpg',
  sneha: '/avatars/neha-deshmukh.jpg',
  nikhil: '/avatars/farhan-shaikh.jpg',
  rahul: '/avatars/aarav-mehta.jpg',
  gaurav: '/avatars/rohan-kulkarni.jpg',
  arjun: '/avatars/devendra-patil.jpg',
  vikrant: '/avatars/siddharth-joshi.jpg',
};

export function resolveMemberAvatarUrl(name?: string | null, explicitUrl?: string | null): string {
  if (explicitUrl && explicitUrl.trim().length > 0) {
    return explicitUrl.trim();
  }
  const cleaned = (name || '')
    .toLowerCase()
    .replace(/^(dr\.|col\.|mr\.|ms\.|mrs\.)\s+/i, '')
    .trim();
  const firstWord = cleaned.split(/\s+/)[0]?.replace(/[^a-z]/g, '') || '';
  if (firstWord && NAME_TO_AVATAR_MAP[firstWord]) {
    return NAME_TO_AVATAR_MAP[firstWord];
  }
  return '/avatars/aarav-mehta.jpg';
}

interface MemberAvatarProps {
  name?: string | null;
  avatarUrl?: string | null;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showStatusDot?: boolean;
  statusColor?: string;
  ring?: boolean;
}

const SIZE_CLASSES: Record<NonNullable<MemberAvatarProps['size']>, string> = {
  xs: 'w-7 h-7 text-[11px]',
  sm: 'w-9 h-9 text-[12px]',
  md: 'w-11 h-11 text-[13px]',
  lg: 'w-14 h-14 text-[16px]',
  xl: 'w-20 h-20 text-[22px]',
};

export function MemberAvatar({
  name,
  avatarUrl,
  size = 'md',
  className = '',
  showStatusDot = false,
  statusColor = 'bg-[#10B981]',
}: MemberAvatarProps) {
  const [imgError, setImgError] = useState(false);
  const resolvedSrc = resolveMemberAvatarUrl(name, avatarUrl);

  const initials = (name || 'MC')
    .replace(/^(Dr\.|Col\.)\s+/i, '')
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <div className={`relative inline-flex shrink-0 ${SIZE_CLASSES[size]} ${className}`}>
      {!imgError && resolvedSrc ? (
        <img
          src={resolvedSrc}
          alt={name || 'Member Avatar'}
          onError={() => setImgError(true)}
          className="w-full h-full rounded-full object-cover ring-1 ring-black/[0.08] shadow-xs bg-[#F5F5F7]"
        />
      ) : (
        <div className="w-full h-full rounded-full bg-gradient-to-br from-[#6366F1] to-[#4F46E5] text-white font-semibold flex items-center justify-center ring-1 ring-black/[0.08]">
          {initials}
        </div>
      )}
      {showStatusDot && (
        <span
          className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full ring-2 ring-white ${statusColor}`}
        />
      )}
    </div>
  );
}
