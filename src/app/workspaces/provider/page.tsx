import React from 'react';
import { Briefcase, Lock, CheckCircle2, Wrench } from 'lucide-react';
import { loadCommunityBootstrapState } from '@/lib/data/community-loader';
import { canAccessWorkspace } from '@/lib/permissions/engine';
import { formatPaiseToINR } from '@/lib/workflows/transactions';

export default async function ProviderWorkspacePage() {
  const bootstrap = await loadCommunityBootstrapState();
  if (bootstrap.access_denied) return null;

  const actor = bootstrap.actor;
  const access = canAccessWorkspace(actor, 'provider');
  const enquiries = bootstrap.services?.enquiries ?? [];
  const bookings = bootstrap.services?.bookings ?? [];

  return (
    <div className="space-y-6">
      <section className="rounded-2xl bg-white border border-[#E8E8EC] p-5 sm:p-6 space-y-2">
        <span className="text-xs font-bold uppercase tracking-wider text-[#F59E0B]">
          Service Provider Workspace
        </span>
        <h1 className="text-2xl font-bold text-[#0A0A0A]">
          Service Provider Enquiries, Quotes & Scheduled Jobs
        </h1>
        <p className="text-sm text-[#6B6B6B]">
          Manage resident quote requests, confirm appointment slots, and mark service jobs completed.
        </p>
      </section>

      {!access.allowed ? (
        <div className="rounded-2xl bg-amber-50 border-2 border-amber-400 p-6 space-y-2">
          <div className="flex items-center gap-2 text-amber-900 font-bold">
            <Lock className="w-5 h-5" />
            <span>Service Provider Workspace Restricted for {actor.display_name}</span>
          </div>
          <p className="text-xs text-amber-950">{access.reason}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <section className="rounded-2xl bg-white border border-[#E8E8EC] p-5 space-y-3">
            <div className="flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-[#6366F1]" />
              <h2 className="text-base font-bold text-[#0A0A0A]">Incoming Resident Enquiries ({enquiries.length})</h2>
            </div>
            {enquiries.map((enq) => (
              <div key={enq.id} className="p-4 rounded-xl bg-[#FAFAFA] border border-[#E8E8EC] text-xs space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#0A0A0A]">{enq.resident_name}</span>
                  <span className="px-2 py-0.5 rounded bg-indigo-100 text-[#6366F1] font-bold uppercase">
                    {enq.status}
                  </span>
                </div>
                <p className="text-[#6B6B6B]">{enq.problem_description}</p>
                {enq.quoted_price_paise && (
                  <div className="font-semibold text-[#6366F1]">
                    Quoted: {formatPaiseToINR(enq.quoted_price_paise)} — {enq.quote_notes}
                  </div>
                )}
              </div>
            ))}
          </section>

          <section className="rounded-2xl bg-white border border-[#E8E8EC] p-5 space-y-3">
            <div className="flex items-center gap-2">
              <Wrench className="w-5 h-5 text-[#6366F1]" />
              <h2 className="text-base font-bold text-[#0A0A0A]">Bookings & Job Outcomes ({bookings.length})</h2>
            </div>
            {bookings.map((bk) => (
              <div key={bk.id} className="p-4 rounded-xl bg-[#FAFAFA] border border-[#E8E8EC] text-xs space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#0A0A0A]">{bk.resident_name}</span>
                  <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-900 font-bold uppercase">
                    {bk.status} • {formatPaiseToINR(bk.agreed_price_paise)}
                  </span>
                </div>
                <p className="text-[#6B6B6B]">{bk.outcome_notes}</p>
              </div>
            ))}
          </section>
        </div>
      )}
    </div>
  );
}
