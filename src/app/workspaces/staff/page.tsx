import React from 'react';
import { Radio, Lock, MapPin, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { loadCommunityBootstrapState } from '@/lib/data/community-loader';
import { canAccessWorkspace } from '@/lib/permissions/engine';

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
      <section className="rounded-2xl bg-white border border-[#E8E8EC] p-5 sm:p-6 space-y-2">
        <span className="text-xs font-bold uppercase tracking-wider text-[#EF4444]">
          Security & Staff Duty Workspace
        </span>
        <h1 className="text-2xl font-bold text-[#0A0A0A]">
          Staff Duty Desk, Patrol Checkpoints & Foreground Location Control
        </h1>
        <p className="text-sm text-[#6B6B6B]">
          Manage on-duty shifts, assigned tasks, patrol checkpoints, and consented shift location sessions.
        </p>
      </section>

      {!access.allowed ? (
        <div className="rounded-2xl bg-amber-50 border-2 border-amber-400 p-6 space-y-2">
          <div className="flex items-center gap-2 text-amber-900 font-bold">
            <Lock className="w-5 h-5" />
            <span>Staff & Responder Workspace Restricted for {actor.display_name}</span>
          </div>
          <p className="text-xs text-amber-950">{access.reason}</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <section className="rounded-2xl bg-white border border-[#E8E8EC] p-5 space-y-3">
              <div className="flex items-center gap-2">
                <Radio className="w-5 h-5 text-[#6366F1]" />
                <h2 className="text-base font-bold text-[#0A0A0A]">Shift Check-In / Check-Out Roster ({shifts.length})</h2>
              </div>
              {shifts.map((sh) => (
                <div key={sh.id} className="p-4 rounded-xl bg-[#FAFAFA] border border-[#E8E8EC] text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#0A0A0A]">{sh.staff_name}</span>
                    <span
                      className={`px-2 py-0.5 rounded font-bold uppercase ${
                        sh.status === 'on_duty'
                          ? 'bg-emerald-100 text-emerald-900'
                          : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      {sh.status.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="text-[#6B6B6B]">{sh.shift_name} • Post: {sh.assigned_post_label}</div>
                </div>
              ))}
            </section>

            <section className="rounded-2xl bg-white border border-[#E8E8EC] p-5 space-y-3">
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-[#6366F1]" />
                <h2 className="text-base font-bold text-[#0A0A0A]">
                  Consented On-Duty Foreground Location Sessions (STF-02..05)
                </h2>
              </div>
              {activeLocations.map((loc) => (
                <div key={loc.session_id} className="p-4 rounded-xl bg-[#FAFAFA] border border-[#E8E8EC] text-xs space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#0A0A0A]">{loc.staff_name}</span>
                    <span className="px-2 py-0.5 rounded bg-indigo-100 text-[#6366F1] font-bold uppercase">
                      Consent: {loc.consent_given ? 'Active' : 'Stopped'}
                    </span>
                  </div>
                  <p className="text-[#6B6B6B]">{loc.purpose}</p>
                  <div className="text-[#0A0A0A] font-medium">
                    Zone: {loc.approximate_zone_label} • Coordinates:{' '}
                    {loc.latitude !== null ? `${loc.latitude}, ${loc.longitude}` : 'Stripped for Approximate Viewer'}
                  </div>
                </div>
              ))}
            </section>
          </div>

          <section className="rounded-2xl bg-white border border-[#E8E8EC] p-5 space-y-3">
            <h2 className="text-base font-bold text-[#0A0A0A]">
              Assigned Shift Tasks ({tasks.length}) & Patrol Checkpoints ({checkpoints.length})
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              {tasks.map((t) => (
                <div key={t.id} className="p-3.5 rounded-xl bg-[#FAFAFA] border border-[#E8E8EC]">
                  <div className="font-bold text-[#0A0A0A]">{t.title}</div>
                  <div className="text-[#6B6B6B] mt-0.5">
                    Area: {t.area_label} • Status: <strong>{t.status.toUpperCase()}</strong>
                  </div>
                </div>
              ))}
              {checkpoints.map((cp) => (
                <div key={cp.id} className="p-3.5 rounded-xl bg-[#FAFAFA] border border-[#E8E8EC]">
                  <div className="font-mono font-bold text-[#6366F1]">{cp.checkpoint_code}</div>
                  <div className="font-bold text-[#0A0A0A]">{cp.location_name}</div>
                </div>
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
