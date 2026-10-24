import React from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  Megaphone,
  Calendar,
  ShoppingBag,
  HeartHandshake,
  Wrench,
  FileWarning,
  ShieldCheck,
  Users,
  ArrowRight,
  CheckCircle2,
  Clock,
  Info,
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
      {/* Hero Welcome & Community Status */}
      <section className="rounded-2xl bg-white border border-[#E5DEC9] p-5 sm:p-6 shadow-xs">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#0F766E]">
              <ShieldCheck className="w-4 h-4" />
              <span>Verified Neighbourhood Hub • {bootstrap.community.name}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#0F172A]">
              Namaste, {bootstrap.actor.display_name}
            </h1>
            <p className="text-sm text-[#475569] max-w-2xl">
              Connected to live Supabase Postgres 17 with{' '}
              <strong className="text-[#0F172A] tabular-nums">
                {bootstrap.community.approved_members ?? 998}
              </strong>{' '}
              approved residents across 6 towers, 10 permission-scoped sub-admins, local arcade shops, and verified responders.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link
              href="/social-service"
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#0F766E] hover:bg-[#115E59] text-white text-xs font-bold shadow-xs transition"
            >
              <HeartHandshake className="w-4 h-4" />
              <span>Social Service Hub</span>
            </Link>
            <Link
              href="/workspaces/admin"
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#0F172A] hover:bg-slate-800 text-white text-xs font-bold transition"
            >
              <span>Inspect 10 Sub-Admins</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Key Metrics Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-5 border-t border-[#E5DEC9]">
          <div className="p-3 rounded-xl bg-[#FAF8F5] border border-[#E5DEC9]">
            <div className="text-xs text-[#475569] font-medium">Directory & Profiles</div>
            <div className="text-xl font-bold text-[#0F172A] tabular-nums mt-0.5">
              {bootstrap.community.total_members} Members
            </div>
            <div className="text-[11px] text-[#0F766E] font-medium">
              Phone & flat hidden by default
            </div>
          </div>
          <div className="p-3 rounded-xl bg-[#FAF8F5] border border-[#E5DEC9]">
            <div className="text-xs text-[#475569] font-medium">Scoped Governance</div>
            <div className="text-xl font-bold text-[#0F172A] tabular-nums mt-0.5">
              1 + 10 Admins
            </div>
            <div className="text-[11px] text-[#0F766E] font-medium">
              Primary + 10 module sub-admins
            </div>
          </div>
          <div className="p-3 rounded-xl bg-[#FAF8F5] border border-[#E5DEC9]">
            <div className="text-xs text-[#475569] font-medium">Social Service</div>
            <div className="text-xl font-bold text-[#0F172A] tabular-nums mt-0.5">
              {(bootstrap.social_service?.listings ?? []).length} Active
            </div>
            <div className="text-[11px] text-[#0F766E] font-medium">
              Needs, giveaways, loans & swaps
            </div>
          </div>
          <div className="p-3 rounded-xl bg-[#FAF8F5] border border-[#E5DEC9]">
            <div className="text-xs text-[#475569] font-medium">Cases & Shared Issues</div>
            <div className="text-xl font-bold text-[#0F172A] tabular-nums mt-0.5">
              {(bootstrap.help_and_cases?.complaints ?? []).length} Tracked
            </div>
            <div className="text-[11px] text-[#0F766E] font-medium">
              Consented redacted escalations
            </div>
          </div>
        </div>
      </section>

      {/* Urgent SOS Community / Responder Banner (SOS-04) */}
      {activeIncidents.map((inc) => (
        <section
          key={inc.id}
          className="rounded-2xl bg-[#FEF2F2] border-2 border-[#DC2626] p-4 sm:p-5 space-y-2"
          aria-label="Active Community Safety Alert"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-[#DC2626] font-bold text-sm">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <span className="uppercase tracking-wide">
                Active Safety Alert ({inc.category.replace('_', ' ')}) — {inc.approx_area_public_label}
              </span>
            </div>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-200 text-red-950">
              Status: {inc.status.replace('_', ' ')}
            </span>
          </div>
          <p className="text-sm text-slate-900 font-medium">{inc.safe_guidance_public_text}</p>
          {inc.restricted_responder_details ? (
            <div className="p-3 rounded-xl bg-white/90 border border-red-300 text-xs text-red-950 font-semibold">
              {inc.restricted_responder_details}
            </div>
          ) : (
            <p className="text-xs text-red-800">
              Sanitised community alert: Reporter flat number and private phone are visible only to authorised on-duty responders (SOS-04).
            </p>
          )}
          <div className="pt-1">
            <Link
              href="/safety"
              className="inline-flex items-center gap-1 text-xs font-bold text-[#DC2626] underline"
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
          className="rounded-2xl bg-[#FEF3C7] border border-amber-400 p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4"
        >
          <div className="space-y-1">
            <div className="text-xs font-bold uppercase tracking-wider text-[#B45309] flex items-center gap-1.5">
              <Clock className="w-4 h-4" />
              <span>Buyer Approval Required • {ord.shop_name} (SHOP-05)</span>
            </div>
            <h2 className="text-base font-bold text-[#0F172A]">
              Proposed Total Adjustment: {formatPaiseToINR(ord.total_paise)} →{' '}
              <span className="text-[#B45309]">{formatPaiseToINR(ord.proposed_total_paise)}</span>
            </h2>
            <p className="text-xs text-slate-800">{ord.price_change_reason}</p>
          </div>
          <Link
            href="/shops"
            className="px-4 py-2 rounded-xl bg-[#0F172A] text-white text-xs font-bold hover:bg-slate-800 transition"
          >
            Review & Approve / Cancel in Shops
          </Link>
        </section>
      ))}

      {/* Two-Column Grid: Active Announcements & Upcoming Events */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Pinned Announcements (EVT-01 / Test 13) */}
        <section className="rounded-2xl bg-white border border-[#E5DEC9] p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Megaphone className="w-5 h-5 text-[#0F766E]" />
              <h2 className="text-lg font-bold text-[#0F172A]">Active Official Notices</h2>
            </div>
            <span className="text-xs font-semibold text-[#475569]">
              {activeProminent.length} Active • {expiredArchive.length} Expired Archived
            </span>
          </div>

          <div className="space-y-3">
            {activeProminent.map((ann) => (
              <article
                key={ann.id}
                className="p-4 rounded-xl bg-[#FAF8F5] border border-[#E5DEC9] space-y-2"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="px-2 py-0.5 rounded-md bg-teal-100 text-[#0F766E] text-[11px] font-bold uppercase">
                    {ann.category} • {ann.target_building_name ?? 'All 6 Towers'}
                  </span>
                  {ann.requires_acknowledgement && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                      <CheckCircle2 className="w-3 h-3" />
                      {ann.acknowledgement_count} Acknowledged
                    </span>
                  )}
                </div>
                <h3 className="font-bold text-[#0F172A] text-sm">{ann.title}</h3>
                <p className="text-xs text-[#475569] leading-relaxed">{ann.body}</p>
                <div className="text-[11px] text-[#475569] flex items-center justify-between pt-1">
                  <span>Published by {ann.author_name}</span>
                  {ann.expires_at && (
                    <span>Active until {new Date(ann.expires_at).toLocaleDateString('en-IN')}</span>
                  )}
                </div>
              </article>
            ))}

            {expiredArchive.length > 0 && (
              <details className="rounded-xl bg-[#F3EFEA] border border-[#E5DEC9] p-3 text-xs">
                <summary className="font-semibold text-[#475569] cursor-pointer">
                  Archived Expired Notices ({expiredArchive.length}) — Demoted from Active Prominence (Test 13)
                </summary>
                <div className="mt-2 space-y-2 pt-2 border-t border-[#E5DEC9]">
                  {expiredArchive.map((exp) => (
                    <div key={exp.id} className="text-[#475569]">
                      <strong>{exp.title}</strong> — Expired{' '}
                      {exp.expires_at ? new Date(exp.expires_at).toLocaleDateString('en-IN') : ''}
                    </div>
                  ))}
                </div>
              </details>
            )}
          </div>
        </section>

        {/* Community Events & Linked Social Service Requests (EVT-02, EVT-03) */}
        <section className="rounded-2xl bg-white border border-[#E5DEC9] p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-[#0F766E]" />
              <h2 className="text-lg font-bold text-[#0F172A]">Events & Volunteer Needs</h2>
            </div>
            <Link href="/social-service" className="text-xs font-bold text-[#0F766E] hover:underline">
              View Linked Needs →
            </Link>
          </div>

          <div className="space-y-3">
            {events.map((evt) => (
              <article
                key={evt.id}
                className="p-4 rounded-xl bg-[#FAF8F5] border border-[#E5DEC9] space-y-2"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-[#0F766E]">{evt.location_label}</span>
                  <span className="px-2.5 py-0.5 rounded-full bg-white border border-[#E5DEC9] text-xs font-semibold tabular-nums">
                    {evt.rsvp_going_count} / {evt.capacity ?? '∞'} Attending
                  </span>
                </div>
                <h3 className="font-bold text-[#0F172A] text-sm">{evt.title}</h3>
                <p className="text-xs text-[#475569] leading-relaxed">{evt.description}</p>
                <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs">
                  <span className="text-[#475569]">Organiser: {evt.organiser_name}</span>
                  {evt.linked_exchange_listing_id && (
                    <Link
                      href="/social-service"
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#F0FDFA] text-[#0F766E] border border-teal-300 font-semibold"
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
      <section className="rounded-2xl bg-white border border-[#E5DEC9] p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-lg font-bold text-[#0F172A]">
              Dedicated Social Service Exchange (SOC-01..10)
            </h2>
            <p className="text-xs text-[#475569]">
              Structured requests, giveaways, sales, loans, rentals, swaps, and volunteer time with versioned agreements and 14-day blind reviews.
            </p>
          </div>
          <Link
            href="/social-service"
            className="px-3.5 py-2 rounded-xl bg-[#0F766E] text-white text-xs font-bold hover:bg-[#115E59]"
          >
            Open Social Service Tab →
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {openExchanges.map((item) => (
            <div
              key={item.id}
              className="p-4 rounded-xl bg-[#FAF8F5] border border-[#E5DEC9] flex flex-col justify-between gap-3"
            >
              <div className="space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={`px-2 py-0.5 rounded-md text-[11px] font-bold uppercase ${
                      item.direction === 'need'
                        ? 'bg-amber-100 text-amber-900'
                        : 'bg-teal-100 text-[#0F766E]'
                    }`}
                  >
                    {item.direction === 'need' ? 'I Need Something' : 'I Have an Offer'} •{' '}
                    {item.exchange_mode.replace('_', ' ')}
                  </span>
                  <span className="text-xs font-semibold tabular-nums text-[#475569]">
                    {item.remaining_quantity}/{item.total_quantity} avail
                  </span>
                </div>
                <h3 className="font-bold text-sm text-[#0F172A]">{item.title}</h3>
                <p className="text-xs text-[#475569] line-clamp-2">{item.description}</p>
              </div>
              <div className="pt-2 border-t border-[#E5DEC9] flex items-center justify-between text-xs">
                <span className="font-medium text-[#0F172A]">{item.owner_name}</span>
                <span className="font-bold text-[#0F766E]">
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
      <section className="rounded-2xl bg-white border border-[#E5DEC9] p-5 space-y-3">
        <div className="flex items-center gap-2">
          <Info className="w-5 h-5 text-[#0F766E]" />
          <h2 className="text-base font-bold text-[#0F172A]">
            External Integration & Adapter Honesty Matrix (PRD Section 9)
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {(bootstrap.integration_settings ?? []).map((adapter) => (
            <div
              key={adapter.adapter_key}
              className="p-3.5 rounded-xl bg-[#FAF8F5] border border-[#E5DEC9] space-y-1"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-bold text-xs text-[#0F172A]">{adapter.display_name}</span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                    adapter.status === 'configured'
                      ? 'bg-emerald-100 text-emerald-900'
                      : 'bg-amber-100 text-amber-900'
                  }`}
                >
                  {adapter.status}
                </span>
              </div>
              <p className="text-[11px] text-[#475569] leading-relaxed">{adapter.status_reason}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
