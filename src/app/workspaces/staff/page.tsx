import React from 'react';
import { Radio, Lock, MapPin } from 'lucide-react';
import { loadCommunityBootstrapState } from '@/lib/data/community-loader';
import { canAccessWorkspace } from '@/lib/permissions/engine';
import { BugisStaffLiveMap } from '@/components/maps/BugisStaffLiveMap';
import { MemberAvatar } from '@/components/ui/MemberAvatar';

export default async function StaffWorkspacePage() {
  const bootstrap = await loadCommunityBootstrapState();
  if (bootstrap.access_denied) return null;

  const actor = bootstrap.actor;
  const access = canAccessWorkspace(actor, 'staff');
  const shifts = bootstrap.staff_and_locations?.shifts ?? [];
  const tasks = bootstrap.staff_and_locations?.tasks ?? [];
  const checkpoints = bootstrap.staff_and_locations?.checkpoints ?? [];
  const activeLocations = bootstrap.staff_and_locations?.active_locations ?? [];

  return (
    <div className="space-y-6">
      <section className="rounded-[24px] bg-white border border-black/[0.06] shadow-[0_8px_30px_rgba(0,0,0,0.03)] p-6 sm:p-8 space-y-2">
        <span className="text-xs font-bold uppercase tracking-wider text-[#EF4444]">
          Security & Staff Duty Workspace • Singapore (Bugis MRT)
        </span>
        <h1 className="text-2xl font-display font-bold text-[#1D1D1F]">
          Staff Duty Desk, Patrol Checkpoints & Live Bugis Radar
        </h1>
        <p className="text-sm text-[#6E6E73]">
          Manage on-duty shifts, assigned tasks, patrol checkpoints, and consented shift location sessions near Bugis MRT.
        </p>
      </section>

      {!access.allowed ? (
        <div className="rounded-[22px] bg-amber-50 border border-amber-300 p-6 space-y-2">
          <div className="flex items-center gap-2 text-amber-900 font-bold">
            <Lock className="w-5 h-5" />
            <span>Staff & Responder Workspace Restricted for {actor.display_name}</span>
          </div>
          <p className="text-xs text-amber-950">{access.reason}</p>
        </div>
      ) : (
        <>
          <BugisStaffLiveMap activeLocations={activeLocations} />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <section className="rounded-[24px] bg-white border border-black/[0.06] p-6 space-y-4">
              <div className="flex items-center gap-2">
                <Radio className="w-5 h-5 text-[#0071E3]" />
                <h2 className="text-base font-display font-bold text-[#1D1D1F]">
                  Shift Check-In / Check-Out Roster ({shifts.length})
                </h2>
              </div>
              {shifts.map((sh) => (
                <div
                  key={sh.id}
                  className="p-5 rounded-[18px] bg-[#F5F5F7]/70 border border-black/[0.06] text-xs flex items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3">
                    <MemberAvatar name={sh.staff_name} size="sm" />
                    <div className="space-y-0.5">
                      <span className="font-bold text-[#1D1D1F] text-sm block">{sh.staff_name}</span>
                      <div className="text-[#6E6E73]">
                        {sh.shift_name} • Post: {sh.assigned_post_label}
                      </div>
                    </div>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full font-bold uppercase ${
                      sh.status === 'on_duty'
                        ? 'bg-emerald-100 text-emerald-900'
                        : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {sh.status.replace('_', ' ')}
                  </span>
                </div>
              ))}
            </section>

            <section className="rounded-[24px] bg-white border border-black/[0.06] p-6 space-y-4">
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-[#10B981]" />
                <h2 className="text-base font-display font-bold text-[#1D1D1F]">
                  Consented On-Duty Foreground Location Sessions
                </h2>
              </div>
              {activeLocations.map((loc) => (
                <div
                  key={loc.session_id}
                  className="p-5 rounded-[18px] bg-[#F5F5F7]/70 border border-black/[0.06] text-xs space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <MemberAvatar name={loc.staff_name} size="xs" />
                      <span className="font-bold text-[#1D1D1F] text-sm">{loc.staff_name}</span>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full bg-[#0071E3]/10 text-[#0071E3] font-bold uppercase">
                      Consent: {loc.consent_given ? 'Active' : 'Stopped'}
                    </span>
                  </div>
                  <p className="text-[#6E6E73]">{loc.purpose}</p>
                  <div className="text-[#1D1D1F] font-medium">
                    Zone: {loc.approximate_zone_label} • Coordinates:{' '}
                    {loc.latitude !== null
                      ? `${loc.latitude}, ${loc.longitude}`
                      : 'Stripped for Approximate Viewer'}
                  </div>
                </div>
              ))}
            </section>
          </div>

          <section className="rounded-[24px] bg-white border border-black/[0.06] p-6 space-y-4">
            <h2 className="text-base font-display font-bold text-[#1D1D1F]">
              Assigned Shift Tasks ({tasks.length}) & Patrol Checkpoints ({checkpoints.length})
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              {tasks.map((t) => (
                <div
                  key={t.id}
                  className="p-5 rounded-[18px] bg-[#F5F5F7]/70 border border-black/[0.06]"
                >
                  <div className="font-bold text-sm text-[#1D1D1F]">{t.title}</div>
                  <div className="text-[#6E6E73] mt-1">
                    Area: {t.area_label} • Status: <strong>{t.status.toUpperCase()}</strong>
                  </div>
                </div>
              ))}
              {checkpoints.map((cp) => (
                <div
                  key={cp.id}
                  className="p-5 rounded-[18px] bg-[#F5F5F7]/70 border border-black/[0.06]"
                >
                  <div className="font-mono font-bold text-[#0071E3]">{cp.checkpoint_code}</div>
                  <div className="font-bold text-sm text-[#1D1D1F] mt-0.5">{cp.location_name}</div>
                </div>
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
