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
  Building2,
  FileWarning,
  ShoppingBag,
  Wrench,
  UserCheck,
} from 'lucide-react';
import { loadCommunityBootstrapState } from '@/lib/data/community-loader';
import { formatPaiseToINR, partitionAnnouncementsByExpiry } from '@/lib/workflows/transactions';

export default async function HomePage() {
  const bootstrap = await loadCommunityBootstrapState();

  if (bootstrap.access_denied) {
    return null; // Handled by AppShell auth/membership gate
  }

  const announcements = bootstrap.announcements ?? [];
  const { activeProminent } = partitionAnnouncementsByExpiry(announcements);
  const events = bootstrap.events ?? [];
  const ordersAwaitingApproval = (bootstrap.orders ?? []).filter(
    (o) => o.status === 'awaiting_buyer_approval' && o.buyer_id === bootstrap.actor.id
  );
  const activeIncidents = (bootstrap.safety_and_sos?.incidents ?? []).filter(
    (i) => i.status !== 'resolved' && i.status !== 'cancelled_accidental'
  );
  const openExchanges = (bootstrap.social_service?.listings ?? []).slice(0, 3);
  const isAdmin = (bootstrap.actor.role_grants?.length ?? 0) > 0;

  return (
    <div className="space-y-6">
      {/* Clean, Colorful Welcome Hero */}
      <section className="rounded-[16px] bg-white border border-[#E8E8EC] p-6 sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 text-[12px] font-medium px-3 py-1 rounded-full bg-[#6366F1]/10 text-[#6366F1]">
              <Building2 className="w-3.5 h-3.5" />
              <span>
                {bootstrap.community.name} • {bootstrap.actor.building_name ?? 'Verified Member'}
              </span>
            </div>
            <h1 className="text-[28px] sm:text-[34px] font-display font-bold tracking-[-0.03em] text-[#0A0A0A]">
              Welcome back, {bootstrap.actor.display_name}
            </h1>
            <p className="text-[15px] text-[#6B6B6B] max-w-xl">
              Connect with neighbours, order from local shops, borrow or share items, and stay updated with society notices.
            </p>
          </div>

          {/* Colorful Action Buttons */}
          <div className="flex flex-wrap gap-2.5">
            <Link
              href="/shops"
              className="inline-flex items-center gap-2 h-[40px] px-4 rounded-[8px] bg-gradient-to-r from-[#10B981] to-[#059669] hover:from-[#059669] hover:to-[#047857] text-white text-[13px] font-medium shadow-2xs transition"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Local Shops</span>
            </Link>
            <Link
              href="/social-service"
              className="inline-flex items-center gap-2 h-[40px] px-4 rounded-[8px] bg-gradient-to-r from-[#6366F1] to-[#4F46E5] hover:from-[#4F46E5] hover:to-[#4338CA] text-white text-[13px] font-medium shadow-2xs transition"
            >
              <HeartHandshake className="w-4 h-4" />
              <span>Social Exchange</span>
            </Link>
            <Link
              href="/services"
              className="inline-flex items-center gap-2 h-[40px] px-4 rounded-[8px] bg-gradient-to-r from-[#F59E0B] to-[#D97706] hover:from-[#D97706] hover:to-[#B45309] text-white text-[13px] font-medium shadow-2xs transition"
            >
              <Wrench className="w-4 h-4" />
              <span>Book Service</span>
            </Link>
            {isAdmin ? (
              <Link
                href="/workspaces/admin"
                className="inline-flex items-center gap-2 h-[40px] px-4 rounded-[8px] bg-[#0A0A0A] hover:bg-[#6366F1] text-white text-[13px] font-medium transition"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Admin Console</span>
              </Link>
            ) : (
              <Link
                href="/account"
                className="inline-flex items-center gap-2 h-[40px] px-4 rounded-[8px] bg-[#0EA5E9] hover:bg-[#0284C7] text-white text-[13px] font-medium shadow-2xs transition"
              >
                <UserCheck className="w-4 h-4" />
                <span>My Profile</span>
              </Link>
            )}
          </div>
        </div>

        {/* 4 Clean Quick Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 mt-6 pt-6 border-t border-[#E8E8EC]">
          <Link
            href="/community"
            className="p-4 rounded-[12px] bg-[#FAFAFA] border border-[#E8E8EC] hover:border-[#0EA5E9] transition space-y-1.5"
          >
            <div className="flex items-center justify-between">
              <span className="text-[12px] text-[#6B6B6B] font-medium">Members</span>
              <div className="w-8 h-8 rounded-[8px] bg-[#0EA5E9]/10 text-[#0EA5E9] flex items-center justify-center">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <div className="text-[20px] font-display font-bold text-[#0A0A0A]">
              {bootstrap.community.approved_members ?? 998}
            </div>
            <div className="text-[11px] text-[#0EA5E9] font-medium">View Directory →</div>
          </Link>

          <Link
            href="/shops"
            className="p-4 rounded-[12px] bg-[#FAFAFA] border border-[#E8E8EC] hover:border-[#10B981] transition space-y-1.5"
          >
            <div className="flex items-center justify-between">
              <span className="text-[12px] text-[#6B6B6B] font-medium">Local Shops</span>
              <div className="w-8 h-8 rounded-[8px] bg-[#10B981]/10 text-[#10B981] flex items-center justify-center">
                <ShoppingBag className="w-4 h-4" />
              </div>
            </div>
            <div className="text-[20px] font-display font-bold text-[#0A0A0A]">
              {(bootstrap.shops ?? []).length} Stores
            </div>
            <div className="text-[11px] text-[#10B981] font-medium">Order Groceries & Rx →</div>
          </Link>

          <Link
            href="/social-service"
            className="p-4 rounded-[12px] bg-[#FAFAFA] border border-[#E8E8EC] hover:border-[#6366F1] transition space-y-1.5"
          >
            <div className="flex items-center justify-between">
              <span className="text-[12px] text-[#6B6B6B] font-medium">Social Exchange</span>
              <div className="w-8 h-8 rounded-[8px] bg-[#6366F1]/10 text-[#6366F1] flex items-center justify-center">
                <HeartHandshake className="w-4 h-4" />
              </div>
            </div>
            <div className="text-[20px] font-display font-bold text-[#0A0A0A]">
              {(bootstrap.social_service?.listings ?? []).length} Listings
            </div>
            <div className="text-[11px] text-[#6366F1] font-medium">Borrow, Share & Swap →</div>
          </Link>

          <Link
            href="/help-complaints"
            className="p-4 rounded-[12px] bg-[#FAFAFA] border border-[#E8E8EC] hover:border-[#F59E0B] transition space-y-1.5"
          >
            <div className="flex items-center justify-between">
              <span className="text-[12px] text-[#6B6B6B] font-medium">Helpdesk</span>
              <div className="w-8 h-8 rounded-[8px] bg-[#F59E0B]/10 text-[#F59E0B] flex items-center justify-center">
                <FileWarning className="w-4 h-4" />
              </div>
            </div>
            <div className="text-[20px] font-display font-bold text-[#0A0A0A]">
              {(bootstrap.help_and_cases?.complaints ?? []).length} Cases
            </div>
            <div className="text-[11px] text-[#D97706] font-medium">Raise Request →</div>
          </Link>
        </div>
      </section>

      {/* Active Safety Alert Banner (Only when active) */}
      {activeIncidents.map((inc) => (
        <section
          key={inc.id}
          className="rounded-[14px] bg-[#EF4444]/5 border border-[#EF4444]/40 p-5 flex flex-wrap items-center justify-between gap-4"
        >
          <div className="space-y-1 max-w-2xl">
            <div className="flex items-center gap-2 text-[#EF4444] font-bold text-sm">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span className="uppercase tracking-wide">
                Safety Notice — {inc.approx_area_public_label}
              </span>
            </div>
            <p className="text-[14px] text-[#0A0A0A]">{inc.safe_guidance_public_text}</p>
            {inc.restricted_responder_details && (
              <p className="text-[12px] font-medium text-[#EF4444]">
                {inc.restricted_responder_details}
              </p>
            )}
          </div>
          <Link
            href="/safety"
            className="h-[38px] px-4 rounded-[8px] bg-[#EF4444] hover:bg-[#DC2626] text-white text-xs font-medium inline-flex items-center gap-1.5 transition"
          >
            <span>View Safety Status</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </section>
      ))}

      {/* Buyer Order Approval Banner (Only if current user has an order awaiting approval) */}
      {ordersAwaitingApproval.map((ord) => (
        <section
          key={ord.id}
          className="rounded-[14px] bg-[#F59E0B]/10 border border-[#F59E0B]/40 p-5 flex flex-wrap items-center justify-between gap-4"
        >
          <div className="space-y-1">
            <div className="text-xs font-medium uppercase tracking-wider text-[#D97706] flex items-center gap-1.5">
              <Clock className="w-4 h-4" />
              <span>Order Update • {ord.shop_name}</span>
            </div>
            <h2 className="text-[16px] font-display font-bold text-[#0A0A0A]">
              Revised Total: {formatPaiseToINR(ord.total_paise)} →{' '}
              <span className="text-[#D97706]">{formatPaiseToINR(ord.proposed_total_paise)}</span>
            </h2>
            <p className="text-[13px] text-[#6B6B6B]">{ord.price_change_reason}</p>
          </div>
          <Link
            href="/shops"
            className="h-[38px] px-4 rounded-[8px] bg-[#F59E0B] hover:bg-[#D97706] text-white text-xs font-medium inline-flex items-center gap-1.5 transition"
          >
            <span>Review Order</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </section>
      ))}

      {/* Clean Two-Column Grid: Society Notices & Upcoming Events */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Official Notices */}
        <section className="rounded-[16px] bg-white border border-[#E8E8EC] p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-[10px] bg-[#6366F1]/10 text-[#6366F1] flex items-center justify-center">
                <Megaphone className="w-4 h-4" />
              </div>
              <h2 className="text-[18px] font-display font-bold text-[#0A0A0A]">
                Community Notices
              </h2>
            </div>
            <Link
              href="/community"
              className="text-xs font-medium text-[#6366F1] hover:underline"
            >
              View All →
            </Link>
          </div>

          <div className="space-y-3">
            {activeProminent.map((ann) => (
              <article
                key={ann.id}
                className="p-4 rounded-[12px] bg-[#FAFAFA] border border-[#E8E8EC] space-y-1.5"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-[#6366F1]/10 text-[#6366F1] text-[11px] font-medium capitalize">
                    {ann.category}
                  </span>
                  {ann.requires_acknowledgement && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#10B981]">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      {ann.acknowledgement_count} read
                    </span>
                  )}
                </div>
                <h3 className="font-display font-bold text-[#0A0A0A] text-[15px]">{ann.title}</h3>
                <p className="text-[13px] text-[#6B6B6B] line-clamp-2">{ann.body}</p>
              </article>
            ))}
          </div>
        </section>

        {/* Upcoming Events */}
        <section className="rounded-[16px] bg-white border border-[#E8E8EC] p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-[10px] bg-[#10B981]/10 text-[#10B981] flex items-center justify-center">
                <Calendar className="w-4 h-4" />
              </div>
              <h2 className="text-[18px] font-display font-bold text-[#0A0A0A]">
                Upcoming Events
              </h2>
            </div>
            <Link
              href="/community"
              className="text-xs font-medium text-[#10B981] hover:underline"
            >
              Explore →
            </Link>
          </div>

          <div className="space-y-3">
            {events.map((evt) => (
              <article
                key={evt.id}
                className="p-4 rounded-[12px] bg-[#FAFAFA] border border-[#E8E8EC] space-y-1.5"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-medium text-[#10B981]">{evt.location_label}</span>
                  <span className="px-2.5 py-0.5 rounded-full bg-white border border-[#E8E8EC] text-xs font-medium text-[#6B6B6B]">
                    {evt.rsvp_going_count} Going
                  </span>
                </div>
                <h3 className="font-display font-bold text-[#0A0A0A] text-[15px]">{evt.title}</h3>
                <p className="text-[13px] text-[#6B6B6B] line-clamp-2">{evt.description}</p>
              </article>
            ))}
          </div>
        </section>
      </div>

      {/* Neighbourhood Exchange Highlights */}
      <section className="rounded-[16px] bg-white border border-[#E8E8EC] p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-[10px] bg-[#8B5CF6]/10 text-[#8B5CF6] flex items-center justify-center">
              <HeartHandshake className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-[18px] font-display font-bold text-[#0A0A0A]">
                Neighbourhood Sharing & Exchange
              </h2>
              <p className="text-[13px] text-[#6B6B6B]">
                Borrow tools, share items, or help a neighbour
              </p>
            </div>
          </div>
          <Link
            href="/social-service"
            className="h-[38px] px-4 rounded-[8px] bg-gradient-to-r from-[#8B5CF6] to-[#6366F1] hover:from-[#7C3AED] hover:to-[#4F46E5] text-white text-xs font-medium inline-flex items-center gap-1.5 transition"
          >
            <span>View All Exchanges</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {openExchanges.map((item) => (
            <div
              key={item.id}
              className="p-4 rounded-[12px] bg-[#FAFAFA] border border-[#E8E8EC] flex flex-col justify-between gap-3"
            >
              <div className="space-y-1.5">
                <span
                  className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-medium capitalize ${
                    item.direction === 'need'
                      ? 'bg-[#F59E0B]/15 text-[#D97706]'
                      : 'bg-[#10B981]/15 text-[#059669]'
                  }`}
                >
                  {item.direction === 'need' ? 'Neighbour Request' : 'Available to Share'} •{' '}
                  {item.exchange_mode.replace('_', ' ')}
                </span>
                <h3 className="font-display font-bold text-[15px] text-[#0A0A0A]">{item.title}</h3>
                <p className="text-[13px] text-[#6B6B6B] line-clamp-2">{item.description}</p>
              </div>
              <div className="pt-2 border-t border-[#E8E8EC] flex items-center justify-between text-xs">
                <span className="font-medium text-[#0A0A0A]">{item.owner_name}</span>
                <span className="font-semibold text-[#6366F1]">
                  {item.price_paise > 0
                    ? formatPaiseToINR(item.price_paise)
                    : item.deposit_paise > 0
                    ? `Deposit ${formatPaiseToINR(item.deposit_paise)}`
                    : 'Free'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
