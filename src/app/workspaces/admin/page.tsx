import React from 'react';
import {
  Building2,
  ShieldCheck,
  Lock,
  CheckCircle2,
  XCircle,
  AlertCircle,
} from 'lucide-react';
import { loadCommunityBootstrapState } from '@/lib/data/community-loader';
import {
  canAccessWorkspace,
  canPerformAdminAction,
  validatePrimaryAdminRevocation,
} from '@/lib/permissions/engine';

export default async function AdminWorkspacePage() {
  const bootstrap = await loadCommunityBootstrapState();
  if (bootstrap.access_denied) return null;

  const actor = bootstrap.actor;
  const workspaceAccess = canAccessWorkspace(actor, 'admin');
  const allGrants = bootstrap.role_grants ?? [];

  const scopeChecks = [
    {
      label: 'Approve / Suspend Resident Memberships',
      scope: 'membership' as const,
      action: 'approve_member',
      buildingId: null,
    },
    {
      label: 'Moderate Community Posts & Redact Reviews',
      scope: 'moderation' as const,
      action: 'moderate_post',
      buildingId: null,
    },
    {
      label: 'Publish Notices & Manage Cultural Events',
      scope: 'events' as const,
      action: 'publish_notice',
      buildingId: null,
    },
    {
      label: 'Triage Water Cases in Tower B (Amaltas)',
      scope: 'water' as const,
      action: 'triage_case',
      buildingId: '22222222-2222-4222-8222-222222222202',
    },
    {
      label: 'Triage Water Cases in Tower C (Out-of-Tower Check)',
      scope: 'water' as const,
      action: 'triage_case',
      buildingId: '22222222-2222-4222-8222-222222222203',
    },
    {
      label: 'Triage Electrical, Lift & Solar Cases',
      scope: 'electricity' as const,
      action: 'triage_case',
      buildingId: null,
    },
    {
      label: 'Triage Sanitation, Waste & Drainage Cases',
      scope: 'cleanliness' as const,
      action: 'triage_case',
      buildingId: null,
    },
    {
      label: 'Prepare Redacted Civic Escalation Packages',
      scope: 'civic_escalation' as const,
      action: 'prepare_escalation',
      buildingId: null,
    },
    {
      label: 'Approve Local Shops & Mediate Order Disputes',
      scope: 'commerce_support' as const,
      action: 'approve_shop',
      buildingId: null,
    },
    {
      label: 'Verify Service Provider Badges',
      scope: 'local_services' as const,
      action: 'verify_provider_badge',
      buildingId: null,
    },
    {
      label: 'Manage Staff Shifts, Location Grants & CCTV Grants',
      scope: 'safety' as const,
      action: 'grant_camera_view',
      buildingId: null,
    },
  ];

  const lastOwnerCheck = validatePrimaryAdminRevocation(
    allGrants,
    '33333333-3333-4333-8333-333333333300'
  );

  return (
    <div className="space-y-6">
      <section className="rounded-2xl bg-white border border-[#E5DEC9] p-5 sm:p-6 space-y-2">
        <span className="text-xs font-bold uppercase tracking-wider text-[#0F766E]">
          Separated Role Workspace • Governance & 10 Permission-Scoped Sub-Admins (Section 3.2 & Test 2)
        </span>
        <h1 className="text-2xl font-bold text-[#0F172A]">
          Community Governance, Scoped Sub-Admin Matrix & Audit Enforcement
        </h1>
        <p className="text-sm text-[#475569]">
          Use the top bar <strong>Acting Persona</strong> selector to switch between Primary Admin Aarav Mehta, any of the 10 Permission-Scoped Sub-Admins, or an ordinary resident to verify server-side permission boundaries in real time.
        </p>
      </section>

      {!workspaceAccess.allowed ? (
        <div className="rounded-2xl bg-amber-50 border-2 border-amber-400 p-6 space-y-3">
          <div className="flex items-center gap-2 text-amber-900 font-bold">
            <Lock className="w-5 h-5" />
            <span>Admin Workspace Restricted for {actor.display_name}</span>
          </div>
          <p className="text-xs text-amber-950">{workspaceAccess.reason}</p>
          <p className="text-xs text-amber-900">
            Select <strong>Aarav Mehta (Primary Admin)</strong> or any of <strong>Sub-Admins #1–#10</strong> in the top persona selector to enter this operational workspace.
          </p>
        </div>
      ) : (
        <div className="rounded-2xl bg-emerald-50 border border-emerald-300 p-4 flex flex-wrap items-center justify-between gap-2 text-xs text-emerald-950">
          <span className="font-bold flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-700" />
            {workspaceAccess.reason}
          </span>
          <span>
            Last-Owner Protection Check:{' '}
            <strong>{lastOwnerCheck.allowed ? 'Revocable' : lastOwnerCheck.reason}</strong>
          </span>
        </div>
      )}

      {/* Live Permission Scope Evaluation for Current Actor (Test 2) */}
      <section className="rounded-2xl bg-white border border-[#E5DEC9] p-5 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h2 className="text-base font-bold text-[#0F172A]">
            Live Server Scope Evaluation for Current Actor: {actor.display_name}
          </h2>
          <span className="text-xs text-[#475569]">
            Evaluated via `canPerformAdminAction` & `private.has_admin_scope`
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {scopeChecks.map((chk) => {
            const res = canPerformAdminAction(actor, chk.scope, chk.action, chk.buildingId);
            return (
              <div
                key={chk.label}
                className={`p-3.5 rounded-xl border text-xs flex items-start justify-between gap-3 ${
                  res.allowed
                    ? 'bg-emerald-50/70 border-emerald-300 text-emerald-950'
                    : 'bg-[#FAF8F5] border-[#E5DEC9] text-[#475569]'
                }`}
              >
                <div className="space-y-0.5">
                  <div className="font-bold text-[#0F172A]">{chk.label}</div>
                  <div className="text-[11px]">{res.reason}</div>
                </div>
                {res.allowed ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                ) : (
                  <XCircle className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Complete Roster of 1 Primary Admin + 10 Permission-Scoped Sub-Admins */}
      <section className="rounded-2xl bg-white border border-[#E5DEC9] p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Building2 className="w-5 h-5 text-[#0F766E]" />
          <h2 className="text-lg font-bold text-[#0F172A]">
            Active Governance Roster: 1 Primary Admin + 10 Scoped Sub-Admins ({allGrants.length} Total)
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {allGrants.map((g) => (
            <article
              key={g.id}
              className="rounded-xl bg-[#FAF8F5] border border-[#E5DEC9] p-4 space-y-2 text-xs"
            >
              <div className="flex items-center justify-between gap-2">
                <span
                  className={`px-2.5 py-0.5 rounded-full font-bold uppercase ${
                    g.role_type === 'primary_admin'
                      ? 'bg-[#0F172A] text-teal-300'
                      : 'bg-teal-100 text-[#0F766E]'
                  }`}
                >
                  {g.role_type.replace('_', ' ')} • Scope: {g.module_scope}
                </span>
                <span className="font-semibold text-[#475569]">
                  {g.building_scope_name ?? 'All 6 Towers'}
                </span>
              </div>

              <h3 className="font-bold text-sm text-[#0F172A]">{g.title_label}</h3>
              <div className="text-[#0F172A] font-medium">
                Holder: <strong>{g.user_name}</strong> ({g.user_profession})
              </div>

              <div className="flex flex-wrap gap-1.5 pt-1">
                {g.allowed_actions.map((act) => (
                  <span
                    key={act}
                    className="px-2 py-0.5 rounded bg-white border border-[#E5DEC9] font-mono text-[11px] text-[#0F766E]"
                  >
                    {act}
                  </span>
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
