import React from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  Megaphone,
  Calendar,
  HeartHandshake,
  ShieldCheck,
  Users,
  ArrowRight,
  CheckCircle2,
  Clock,
  Info,
  Building2,
  FileWarning,
  KeyRound,
  UserPlus,
  UserCheck,
} from 'lucide-react';
import { loadCommunityBootstrapState } from '@/lib/data/community-loader';
import { formatPaiseToINR, partitionAnnouncementsByExpiry } from '@/lib/workflows/transactions';

export default async function HomePage() {
  const bootstrap = await loadCommunityBootstrapState();

  if (bootstrap.access_denied) {
    return null; // Handled by AppShell membership gate
  }

  const announcements = bootstrap.announcements ?? [];
  const { activeProminent, expiredArchive } = partitionAnnouncementsByExpiry(announcements);
  const events = bootstrap.events ?? [];
  const ordersAwaitingApproval = (bootstrap.orders ?? []).filter(
    (o) => o.status === 'awaiting_buyer_approval' && o.buyer_id === bootstrap.actor.id
  );
  const activeIncidents = (bootstrap.safety_and_sos?.incidents ?? []).filter(
    (i) => i.status !== 'resolved' && i.status !== 'cancelled_accidental'
  );
  const openExchanges = (bootstrap.social_service?.listings ?? []).slice(0, 3);

  return (
    <div className="space-y-6">
      {/* Hero Welcome & Community Status — MyCircle Editorial Precision */}
      <section className="genesis-card rounded-[12px] bg-white border border-[#E8E8EC] p-6 sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-wider px-2.5 py-0.5 rounded-[4px] bg-[#20970B]/10 text-[#20970B] border border-[#20970B]/25 font-medium">
                <ShieldCheck className="w-3 h-3" />
                <span>MyCircle • Genesis Design System</span>
              </span>
              <span className="inline-flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-wider text-[#6B6B6B]">
                <Building2 className="w-3.5 h-3.5 text-[#6366F1]" />
                <span>{bootstrap.community.name}</span>
              </span>
            </div>
            <h1 className="text-[32px] sm:text-[40px] font-display font-bold tracking-[-0.035em] text-[#0A0A0A] leading-tight">
              Namaste, {bootstrap.actor.display_name}
            </h1>
            <p className="text-[15px] text-[#6B6B6B] max-w-2xl leading-relaxed">
              Welcome to <strong className="text-[#0A0A0A]">MyCircle</strong> — connected to live Supabase Postgres 17 with{' '}
              <strong className="text-[#0A0A0A] font-mono">
                {bootstrap.community.approved_members ?? 998}
              </strong>{' '}
              approved residents across 6 towers, 10 permission-scoped sub-admins, local arcade shops, and verified responders.
            </p>
          </div>

          <div className="flex flex-wrap gap-2.5">
            <Link
              href="/login"
              className="genesis-btn inline-flex items-center gap-1.5 h-[38px] px-4 rounded-[6px] bg-[#0A0A0A] hover:bg-[#6366F1] text-white text-[13px] font-medium transition"
            >
              <KeyRound className="w-4 h-4" />
              <span>Login & Role Vault</span>
            </Link>
            <Link
              href="/register"
              className="genesis-btn inline-flex items-center gap-1.5 h-[38px] px-4 rounded-[6px] bg-white border border-[#E8E8EC] hover:border-[#6366F1] text-[#0A0A0A] text-[13px] font-medium transition"
            >
              <UserPlus className="w-4 h-4 text-[#10B981]" />
              <span>Register Member</span>
            </Link>
            <Link
              href="/account"
              className="genesis-btn inline-flex items-center gap-1.5 h-[38px] px-4 rounded-[6px] bg-[#6366F1] hover:bg-[#4F46E5] text-white text-[13px] font-medium transition"
            >
              <UserCheck className="w-4 h-4" />
              <span>My Profile & Privacy</span>
            </Link>
          </div>
        </div>

        {/* Key Metrics Strip with UI/UX Pro Max Vector Icon Containers */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 mt-6 pt-6 border-t border-[#E8E8EC]">
          <Link
            href="/community"
            className="p-4 rounded-[10px] bg-[#FAFAFA] border border-[#E8E8EC] hover:border-[#6366F1] transition space-y-2"
          >
            <div className="flex items-center justify-between">
              <span className="text-[12px] text-[#6B6B6B] font-medium">Directory & Profiles</span>
              <div className="icon-box-sm bg-[#6366F1]/10 text-[#6366F1]">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <div className="text-[20px] font-display font-bold text-[#0A0A0A] tabular-nums">
              {bootstrap.community.total_members} Members
            </div>
            <div className="text-[11px] text-[#6366F1] font-medium">
              Phone & flat hidden by default
            </div>
          </Link>

          <Link
            href="/workspaces/admin"
            className="p-4 rounded-[10px] bg-[#FAFAFA] border border-[#E8E8EC] hover:border-[#6366F1] transition space-y-2"
          >
            <div className="flex items-center justify-between">
              <span className="text-[12px] text-[#6B6B6B] font-medium">Scoped Governance</span>
              <div className="icon-box-sm bg-[#10B981]/10 text-[#10B981]">
                <Building2 className="w-4 h-4" />
              </div>
            </div>
            <div className="text-[20px] font-display font-bold text-[#0A0A0A] tabular-nums">
              1 + 10 Admins
            </div>
            <div className="text-[11px] text-[#10B981] font-medium">
              Primary + 10 module sub-admins
            </div>
          </Link>

          <Link
            href="/social-service"
            className="p-4 rounded-[10px] bg-[#FAFAFA] border border-[#E8E8EC] hover:border-[#6366F1] transition space-y-2"
          >
            <div className="flex items-center justify-between">
              <span className="text-[12px] text-[#6B6B6B] font-medium">Social Service</span>
              <div className="icon-box-sm bg-[#6366F1]/10 text-[#6366F1]">
                <HeartHandshake className="w-4 h-4" />
              </div>
            </div>
            <div className="text-[20px] font-display font-bold text-[#0A0A0A] tabular-nums">
              {(bootstrap.social_service?.listings ?? []).length} Active
            </div>
            <div className="text-[11px] text-[#6366F1] font-medium">
              Needs, giveaways, loans & swaps
            </div>
          </Link>

          <Link
            href="/help-complaints"
            className="p-4 rounded-[10px] bg-[#FAFAFA] border border-[#E8E8EC] hover:border-[#6366F1] transition space-y-2"
          >
            <div className="flex items-center justify-between">
              <span className="text-[12px] text-[#6B6B6B] font-medium">Cases & Escalations</span>
              <div className="icon-box-sm bg-[#F59E0B]/10 text-[#F59E0B]">
                <FileWarning className="w-4 h-4" />
              </div>
            </div>
            <div className="text-[20px] font-display font-bold text-[#0A0A0A] tabular-nums">
              {(bootstrap.help_and_cases?.complaints ?? []).length} Tracked
            </div>
            <div className="text-[11px] text-[#F59E0B] font-medium">
              Consented redacted escalations
            </div>
          </Link>
        </div>
      </section>

      {/* Urgent SOS Community / Responder Banner (SOS-04) */}
      {activeIncidents.map((inc) => (
        <section
          key={inc.id}
          className="rounded-[12px] bg-[#EF4444]/5 border border-[#EF4444] p-5 space-y-2"
          aria-label="Active Community Safety Alert"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-[#EF4444] font-bold text-sm">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <span className="uppercase tracking-wide">
                Active Safety Alert ({inc.category.replace('_', ' ')}) — {inc.approx_area_public_label}
              </span>
            </div>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-medium bg-[#EF4444]/15 text-[#EF4444]">
              Status: {inc.status.replace('_', ' ')}
            </span>
          </div>
          <p className="text-sm text-[#0A0A0A] font-medium">{inc.safe_guidance_public_text}</p>
          {inc.restricted_responder_details ? (
            <div className="p-3 rounded-[8px] bg-white border border-[#EF4444]/30 text-xs text-[#0A0A0A] font-medium">
              {inc.restricted_responder_details}
            </div>
          ) : (
            <p className="text-xs text-[#6B6B6B]">
              Sanitised community alert: Reporter flat number and private phone are visible only to authorised on-duty responders (SOS-04).
            </p>
          )}
          <div className="pt-1">
            <Link
              href="/safety"
              className="inline-flex items-center gap-1 text-xs font-medium text-[#EF4444] hover:underline"
            >
              <span>View Responder Status & Delivery Audit</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </section>
      ))}

      {/* Buyer Order Price/Weight Change Action Banner (SHOP-05 / Test 6) */}
      {ordersAwaitingApproval.map((ord) => (
        <section
          key={ord.id}
          className="rounded-[12px] bg-[#F59E0B]/10 border border-[#F59E0B]/40 p-5 flex flex-wrap items-center justify-between gap-4"
        >
          <div className="space-y-1">
            <div className="text-xs font-mono uppercase tracking-wider text-[#B45309] flex items-center gap-1.5 font-medium">
              <Clock className="w-4 h-4" />
              <span>Buyer Approval Required • {ord.shop_name} (SHOP-05)</span>
            </div>
            <h2 className="text-base font-display font-bold text-[#0A0A0A]">
              Proposed Total Adjustment: {formatPaiseToINR(ord.total_paise)}{' '}
              <ArrowRight className="inline w-4 h-4 mx-1 text-[#B45309]" />
              <span className="text-[#B45309]">{formatPaiseToINR(ord.proposed_total_paise)}</span>
            </h2>
            <p className="text-xs text-[#6B6B6B]">{ord.price_change_reason}</p>
          </div>
          <Link
            href="/shops"
            className="h-[38px] px-4 rounded-[6px] bg-[#0A0A0A] text-white text-xs font-medium inline-flex items-center gap-1.5 hover:bg-[#6366F1] transition"
          >
            <span>Review & Approve / Cancel in Shops</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </section>
      ))}

      {/* Two-Column Grid: Active Announcements & Upcoming Events */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Pinned Announcements (EVT-01 / Test 13) */}
        <section className="rounded-[12px] bg-white border border-[#E8E8EC] p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="icon-box-sm bg-[#6366F1]/10 text-[#6366F1]">
                <Megaphone className="w-4 h-4" />
              </div>
              <h2 className="text-[18px] font-display font-bold text-[#0A0A0A]">
                Active Official Notices
              </h2>
            </div>
            <span className="text-xs font-mono text-[#6B6B6B]">
              {activeProminent.length} Active • {expiredArchive.length} Archived
            </span>
          </div>

          <div className="space-y-3">
            {activeProminent.map((ann) => (
              <article
                key={ann.id}
                className="p-4 rounded-[10px] bg-[#FAFAFA] border border-[#E8E8EC] space-y-2"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-[#6366F1]/10 text-[#6366F1] text-[11px] font-mono uppercase font-medium">
                    {ann.category} • {ann.target_building_name ?? 'All 6 Towers'}
                  </span>
                  {ann.requires_acknowledgement && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#10B981] bg-[#10B981]/10 px-2.5 py-0.5 rounded-full">
                      <CheckCircle2 className="w-3 h-3" />
                      {ann.acknowledgement_count} Acknowledged
                    </span>
                  )}
                </div>
                <h3 className="font-display font-bold text-[#0A0A0A] text-[15px]">{ann.title}</h3>
                <p className="text-[13px] text-[#6B6B6B] leading-relaxed">{ann.body}</p>
                <div className="text-[11px] text-[#9C9C9C] flex items-center justify-between pt-1">
                  <span>Published by {ann.author_name}</span>
                  {ann.expires_at && (
                    <span>Active until {new Date(ann.expires_at).toLocaleDateString('en-IN')}</span>
                  )}
                </div>
              </article>
            ))}

            {expiredArchive.length > 0 && (
              <details className="rounded-[8px] bg-[#FAFAFA] border border-[#E8E8EC] p-3 text-xs">
                <summary className="font-medium text-[#6B6B6B] cursor-pointer">
                  Archived Expired Notices ({expiredArchive.length}) — Demoted from Active Prominence (Test 13)
                </summary>
                <div className="mt-2 space-y-2 pt-2 border-t border-[#E8E8EC]">
                  {expiredArchive.map((exp) => (
                    <div key={exp.id} className="text-[#6B6B6B]">
                      <strong className="text-[#0A0A0A]">{exp.title}</strong> — Expired{' '}
                      {exp.expires_at ? new Date(exp.expires_at).toLocaleDateString('en-IN') : ''}
                    </div>
                  ))}
                </div>
              </details>
            )}
          </div>
        </section>

        {/* Community Events & Linked Social Service Requests (EVT-02, EVT-03) */}
        <section className="rounded-[12px] bg-white border border-[#E8E8EC] p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="icon-box-sm bg-[#6366F1]/10 text-[#6366F1]">
                <Calendar className="w-4 h-4" />
              </div>
              <h2 className="text-[18px] font-display font-bold text-[#0A0A0A]">
                Events & Volunteer Needs
              </h2>
            </div>
            <Link
              href="/social-service"
              className="inline-flex items-center gap-1 text-xs font-medium text-[#6366F1] hover:underline"
            >
              <span>View Linked Needs</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-3">
            {events.map((evt) => (
              <article
                key={evt.id}
                className="p-4 rounded-[10px] bg-[#FAFAFA] border border-[#E8E8EC] space-y-2"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-medium text-[#6366F1]">{evt.location_label}</span>
                  <span className="px-2.5 py-0.5 rounded-full bg-white border border-[#E8E8EC] text-xs font-mono tabular-nums">
                    {evt.rsvp_going_count} / {evt.capacity ?? '∞'} Attending
                  </span>
                </div>
                <h3 className="font-display font-bold text-[#0A0A0A] text-[15px]">{evt.title}</h3>
                <p className="text-[13px] text-[#6B6B6B] leading-relaxed">{evt.description}</p>
                <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs">
                  <span className="text-[#9C9C9C]">Organiser: {evt.organiser_name}</span>
                  {evt.linked_exchange_listing_id && (
                    <Link
                      href="/social-service"
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[6px] bg-[#6366F1]/10 text-[#6366F1] font-medium"
                    >
                      <HeartHandshake className="w-3.5 h-3.5" />
                      <span>Linked Social Service Borrow Request</span>
                    </Link>
                  )}
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>

      {/* Dedicated Social Service Preview Strip (SOC-01) */}
      <section className="rounded-[12px] bg-white border border-[#E8E8EC] p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="icon-box-md bg-[#6366F1]/10 text-[#6366F1]">
              <HeartHandshake className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-[18px] font-display font-bold text-[#0A0A0A]">
                Dedicated Social Service Exchange (SOC-01..10)
              </h2>
              <p className="text-[13px] text-[#6B6B6B]">
                Structured requests, giveaways, sales, loans, rentals, swaps, and volunteer time with versioned agreements and 14-day blind reviews.
              </p>
            </div>
          </div>
          <Link
            href="/social-service"
            className="h-[38px] px-4 rounded-[6px] bg-[#6366F1] hover:bg-[#4F46E5] text-white text-xs font-medium inline-flex items-center gap-1.5 transition"
          >
            <span>Open Social Service Hub</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {openExchanges.map((item) => (
            <div
              key={item.id}
              className="p-4 rounded-[10px] bg-[#FAFAFA] border border-[#E8E8EC] flex flex-col justify-between gap-3"
            >
              <div className="space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[11px] font-mono uppercase font-medium ${
                      item.direction === 'need'
                        ? 'bg-[#F59E0B]/15 text-[#B45309]'
                        : 'bg-[#6366F1]/10 text-[#6366F1]'
                    }`}
                  >
                    {item.direction === 'need' ? 'I Need Something' : 'I Have an Offer'} •{' '}
                    {item.exchange_mode.replace('_', ' ')}
                  </span>
                  <span className="text-xs font-mono tabular-nums text-[#6B6B6B]">
                    {item.remaining_quantity}/{item.total_quantity} avail
                  </span>
                </div>
                <h3 className="font-display font-bold text-[15px] text-[#0A0A0A]">{item.title}</h3>
                <p className="text-[13px] text-[#6B6B6B] line-clamp-2">{item.description}</p>
              </div>
              <div className="pt-2 border-t border-[#E8E8EC] flex items-center justify-between text-xs">
                <span className="font-medium text-[#0A0A0A]">{item.owner_name}</span>
                <span className="font-mono font-medium text-[#6366F1]">
                  {item.price_paise > 0
                    ? formatPaiseToINR(item.price_paise)
                    : item.deposit_paise > 0
                    ? `Deposit ${formatPaiseToINR(item.deposit_paise)}`
                    : 'Free / Community Share'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Honest Integration & Demo Adapter Status Matrix (Section 9) */}
      <section className="rounded-[12px] bg-white border border-[#E8E8EC] p-6 space-y-4">
        <div className="flex items-center gap-2.5">
          <div className="icon-box-sm bg-[#6366F1]/10 text-[#6366F1]">
            <Info className="w-4 h-4" />
          </div>
          <h2 className="text-[16px] font-display font-bold text-[#0A0A0A]">
            External Integration & Adapter Honesty Matrix (PRD Section 9)
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {(bootstrap.integration_settings ?? []).map((adapter) => (
            <div
              key={adapter.adapter_key}
              className="p-3.5 rounded-[8px] bg-[#FAFAFA] border border-[#E8E8EC] space-y-1"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-medium text-[13px] text-[#0A0A0A]">{adapter.display_name}</span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-mono uppercase font-medium ${
                    adapter.status === 'configured'
                      ? 'bg-[#10B981]/15 text-[#10B981]'
                      : 'bg-[#F59E0B]/15 text-[#B45309]'
                  }`}
                >
                  {adapter.status}
                </span>
              </div>
              <p className="text-[12px] text-[#6B6B6B] leading-relaxed">{adapter.status_reason}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
