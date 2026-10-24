import React from 'react';
import {
  Building2,
  ShieldCheck,
  Lock,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { loadCommunityBootstrapState } from '@/lib/data/community-loader';
import {
  canAccessWorkspace,
  canPerformAdminAction,
  validatePrimaryAdminRevocation,
} from '@/lib/permissions/engine';
import { AdminMemberInspector } from '@/components/workspaces/AdminMemberInspector';

export default async function AdminWorkspacePage() {
  const bootstrap = await loadCommunityBootstrapState();
  if (bootstrap.access_denied) return null;

  const actor = bootstrap.actor;
  const workspaceAccess = canAccessWorkspace(actor, 'admin');
  const allGrants = bootstrap.role_grants ?? [];
  const isPrimaryAdmin = Boolean(
    actor.role_grants?.some((r) => r.role_type === 'primary_admin' || r.module_scope === 'all')
  );

  const scopeChecks = [
    {
      label: 'Approve / Suspend Resident Memberships',
      scope: 'membership' as const,
      action: 'approve_member',
      buildingId: null,
    },
    {
      label: 'Moderate Community Posts & Reviews',
      scope: 'moderation' as const,
      action: 'moderate_post',
      buildingId: null,
    },
    {
      label: 'Publish Notices & Manage Events',
      scope: 'events' as const,
      action: 'publish_notice',
      buildingId: null,
    },
    {
      label: 'Triage Water Cases in Tower B',
      scope: 'water' as const,
      action: 'triage_case',
      buildingId: '22222222-2222-4222-8222-222222222202',
    },
    {
      label: 'Triage Electrical, Lift & Solar Cases',
      scope: 'electricity' as const,
      action: 'triage_case',
      buildingId: null,
    },
    {
      label: 'Triage Sanitation & Waste Cases',
      scope: 'cleanliness' as const,
      action: 'triage_case',
      buildingId: null,
    },
    {
      label: 'Prepare Civic Escalation Packages',
      scope: 'civic_escalation' as const,
      action: 'prepare_escalation',
      buildingId: null,
    },
    {
      label: 'Approve Local Shops & Mediate Orders',
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
      label: 'Manage Staff Shifts & CCTV Grants',
      scope: 'safety' as const,
      action: 'grant_camera_view',
      buildingId: null,
    },
  ];

  const lastOwnerCheck = validatePrimaryAdminRevocation(
    allGrants,
    '33333333-3333-4333-8333-333333333300'
  );

  if (!workspaceAccess.allowed) {
    return (
      <div className="max-w-lg mx-auto my-10 rounded-[16px] bg-white border border-[#E8E8EC] p-8 text-center space-y-3">
        <div className="w-12 h-12 rounded-full bg-[#F59E0B]/15 text-[#D97706] flex items-center justify-center mx-auto">
          <Lock className="w-6 h-6" />
        </div>
        <h1 className="text-[20px] font-display font-bold text-[#0A0A0A]">
          Admin Console Restricted
        </h1>
        <p className="text-[14px] text-[#6B6B6B]">
          Only Society Admins and Scoped Sub-Admins have access to this workspace.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Clean Header */}
      <section className="rounded-[16px] bg-white border border-[#E8E8EC] p-6 space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-[#6366F1]/10 text-[#6366F1]">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>{isPrimaryAdmin ? 'Primary Society Admin Console' : 'Scoped Sub-Admin Console'}</span>
        </div>
        <h1 className="text-[24px] font-display font-bold text-[#0A0A0A]">
          Community Governance & Permissions
        </h1>
        <p className="text-[14px] text-[#6B6B6B]">
          Signed in as <strong className="text-[#0A0A0A]">{actor.display_name}</strong> •{' '}
          {lastOwnerCheck.allowed ? 'Standard Role' : 'Protected Primary Admin'}
        </p>
      </section>

      {/* Primary Admin Exclusive: Member & Role Directory */}
      {isPrimaryAdmin && bootstrap.personas.length > 0 && (
        <AdminMemberInspector
          personas={bootstrap.personas}
          currentActorId={actor.id}
        />
      )}

      {/* Authorised Policy Matrix for Logged-In Admin */}
      <section className="rounded-[16px] bg-white border border-[#E8E8EC] p-6 space-y-4">
        <h2 className="text-[18px] font-display font-bold text-[#0A0A0A]">
          Your Authorised Admin Permissions
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {scopeChecks.map((chk) => {
            const res = canPerformAdminAction(actor, chk.scope, chk.action, chk.buildingId);
            return (
              <div
                key={chk.label}
                className={`p-3.5 rounded-[12px] border text-xs flex items-start justify-between gap-3 ${
                  res.allowed
                    ? 'bg-[#10B981]/5 border-[#10B981]/30 text-[#0A0A0A]'
                    : 'bg-[#FAFAFA] border-[#E8E8EC] text-[#6B6B6B]'
                }`}
              >
                <div className="space-y-0.5">
                  <div className="font-bold text-[13px] text-[#0A0A0A]">{chk.label}</div>
                  <div className="text-[12px] text-[#6B6B6B]">{res.reason}</div>
                </div>
                {res.allowed ? (
                  <CheckCircle2 className="w-4 h-4 text-[#10B981] shrink-0 mt-0.5" />
                ) : (
                  <XCircle className="w-4 h-4 text-[#9C9C9C] shrink-0 mt-0.5" />
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Society Governance Roster */}
      <section className="rounded-[16px] bg-white border border-[#E8E8EC] p-6 space-y-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-[10px] bg-[#6366F1]/10 text-[#6366F1] flex items-center justify-center">
            <Building2 className="w-5 h-5" />
          </div>
          <h2 className="text-[18px] font-display font-bold text-[#0A0A0A]">
            Governance Committee Roster ({allGrants.length} Roles)
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {allGrants.map((g) => (
            <article
              key={g.id}
              className="rounded-[12px] bg-[#FAFAFA] border border-[#E8E8EC] p-4 space-y-2 text-xs"
            >
              <div className="flex items-center justify-between gap-2">
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[11px] font-medium capitalize ${
                    g.role_type === 'primary_admin'
                      ? 'bg-[#6366F1] text-white'
                      : 'bg-[#6366F1]/10 text-[#6366F1]'
                  }`}
                >
                  {g.module_scope.replace('_', ' ')}
                </span>
                <span className="font-medium text-[#6B6B6B]">
                  {g.building_scope_name ?? 'All Towers'}
                </span>
              </div>

              <h3 className="font-display font-bold text-[15px] text-[#0A0A0A]">{g.title_label}</h3>
              <div className="text-[#6B6B6B]">
                <strong className="text-[#0A0A0A]">{g.user_name}</strong> • {g.user_profession}
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
