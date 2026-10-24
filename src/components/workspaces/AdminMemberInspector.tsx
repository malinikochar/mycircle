'use client';

import React, { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Users, ShieldCheck, ArrowRight } from 'lucide-react';
import type { PersonaOption } from '@/lib/types/domain';
import { switchPersonaAction } from '@/app/actions/community-actions';

interface AdminMemberInspectorProps {
  personas: PersonaOption[];
  currentActorId: string;
}

export function AdminMemberInspector({
  personas,
  currentActorId,
}: AdminMemberInspectorProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleInspectMember(memberId: string) {
    startTransition(async () => {
      await switchPersonaAction(memberId);
      router.push('/');
      router.refresh();
    });
  }

  return (
    <section className="rounded-[16px] bg-white border border-[#E8E8EC] p-6 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#E8E8EC] pb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-[10px] bg-[#6366F1]/10 text-[#6366F1] flex items-center justify-center">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-[18px] font-display font-bold text-[#0A0A0A]">
              Admin-Only Member & Role Directory ({personas.length} Accounts)
            </h2>
            <p className="text-[13px] text-[#6B6B6B]">
              Visible exclusively to Primary Society Admins. Inspect any member or sub-admin role.
            </p>
          </div>
        </div>
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium bg-[#10B981]/10 text-[#059669]">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Admin Restricted</span>
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {personas.map((p) => {
          const isCurrent = p.id === currentActorId;
          return (
            <div
              key={p.id}
              className="p-3.5 rounded-[12px] bg-[#FAFAFA] border border-[#E8E8EC] flex flex-col justify-between gap-3"
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-medium uppercase ${
                      p.membership_status === 'approved'
                        ? 'bg-[#10B981]/15 text-[#059669]'
                        : 'bg-[#F59E0B]/15 text-[#D97706]'
                    }`}
                  >
                    {p.membership_status}
                  </span>
                  {p.building_code && (
                    <span className="text-[11px] font-mono text-[#6B6B6B]">
                      {p.building_code}
                    </span>
                  )}
                </div>
                <div className="font-display font-bold text-[14px] text-[#0A0A0A] mt-1">
                  {p.display_name}
                </div>
                <div className="text-[12px] text-[#6B6B6B]">
                  {p.roles[0]?.title_label ?? p.profession ?? 'Resident'}
                </div>
              </div>

              <button
                type="button"
                disabled={isPending || isCurrent}
                onClick={() => handleInspectMember(p.id)}
                className={`h-[32px] px-3 rounded-[6px] text-[12px] font-medium inline-flex items-center justify-center gap-1.5 transition cursor-pointer ${
                  isCurrent
                    ? 'bg-[#E8E8EC] text-[#6B6B6B] cursor-default'
                    : 'bg-[#6366F1] hover:bg-[#4F46E5] text-white'
                }`}
              >
                <span>{isCurrent ? 'Current Session' : 'View as Member'}</span>
                {!isCurrent && <ArrowRight className="w-3.5 h-3.5" />}
              </button>
            </div>
          );
        })}
      </div>
    </section>
  );
}
