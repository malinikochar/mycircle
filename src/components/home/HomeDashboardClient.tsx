'use client';

import React, { useState } from 'react';
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
  Eye,
  MapPin,
} from 'lucide-react';
import type {
  AnnouncementItem,
  CommunityBootstrapState,
  EventItem,
  ExchangeListingItem,
  OrderRecord,
  SOSIncidentItem,
} from '@/lib/types/domain';
import { formatPaiseToINR, partitionAnnouncementsByExpiry } from '@/lib/workflows/transactions';
import { PaginationBar } from '@/components/ui/PaginationBar';
import { DetailModal } from '@/components/ui/DetailModal';

interface HomeDashboardClientProps {
  bootstrap: CommunityBootstrapState;
}

const HOME_PAGE_SIZE = 2;

export function HomeDashboardClient({ bootstrap }: HomeDashboardClientProps) {
  const [activeTab, setActiveTab] = useState<'notices' | 'events' | 'exchanges'>('notices');
  const [page, setPage] = useState(1);

  // Modal state for "View Details on Click"
  const [selectedNotice, setSelectedNotice] = useState<AnnouncementItem | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<EventItem | null>(null);
  const [selectedExchange, setSelectedExchange] = useState<ExchangeListingItem | null>(null);
  const [selectedIncident, setSelectedIncident] = useState<SOSIncidentItem | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<OrderRecord | null>(null);

  const announcements = bootstrap.announcements ?? [];
  const { activeProminent } = partitionAnnouncementsByExpiry(announcements);
  const events = bootstrap.events ?? [];
  const exchanges = bootstrap.social_service?.listings ?? [];

  const ordersAwaitingApproval = (bootstrap.orders ?? []).filter(
    (o) => o.status === 'awaiting_buyer_approval' && o.buyer_id === bootstrap.actor.id
  );
  const activeIncidents = (bootstrap.safety_and_sos?.incidents ?? []).filter(
    (i) => i.status !== 'resolved' && i.status !== 'cancelled_accidental'
  );
  const isAdmin = (bootstrap.actor.role_grants?.length ?? 0) > 0;

  function switchTab(nextTab: 'notices' | 'events' | 'exchanges') {
    setActiveTab(nextTab);
    setPage(1);
  }

  const currentItemsLength =
    activeTab === 'notices'
      ? activeProminent.length
      : activeTab === 'events'
      ? events.length
      : exchanges.length;

  const pagedNotices = activeProminent.slice(
    (page - 1) * HOME_PAGE_SIZE,
    page * HOME_PAGE_SIZE
  );
  const pagedEvents = events.slice((page - 1) * HOME_PAGE_SIZE, page * HOME_PAGE_SIZE);
  const pagedExchanges = exchanges.slice((page - 1) * HOME_PAGE_SIZE, page * HOME_PAGE_SIZE);

  return (
    <div className="space-y-5">
      {/* Compact Welcome Hero + Quick Stat Tiles */}
      <section className="rounded-[16px] bg-white border border-[#E8E8EC] p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-[#6366F1]/10 text-[#6366F1]">
              <Building2 className="w-3 h-3" />
              <span>
                {bootstrap.community.name} • {bootstrap.actor.building_name ?? 'Verified Member'}
              </span>
            </div>
            <h1 className="text-[22px] sm:text-[26px] font-display font-bold tracking-[-0.03em] text-[#0A0A0A]">
              Hello, {bootstrap.actor.display_name}
            </h1>
            <p className="text-[13px] text-[#6B6B6B]">
              Quick overview of your apartment community. Click any item to view full details.
            </p>
          </div>

          {/* Colorful Quick Action Buttons */}
          <div className="flex flex-wrap gap-2">
            <Link
              href="/shops"
              className="inline-flex items-center gap-1.5 h-[36px] px-3.5 rounded-[8px] bg-gradient-to-r from-[#10B981] to-[#059669] text-white text-[12px] font-medium shadow-2xs transition"
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>Local Shops</span>
            </Link>
            <Link
              href="/social-service"
              className="inline-flex items-center gap-1.5 h-[36px] px-3.5 rounded-[8px] bg-gradient-to-r from-[#6366F1] to-[#4F46E5] text-white text-[12px] font-medium shadow-2xs transition"
            >
              <HeartHandshake className="w-3.5 h-3.5" />
              <span>Exchange</span>
            </Link>
            <Link
              href="/services"
              className="inline-flex items-center gap-1.5 h-[36px] px-3.5 rounded-[8px] bg-gradient-to-r from-[#F59E0B] to-[#D97706] text-white text-[12px] font-medium shadow-2xs transition"
            >
              <Wrench className="w-3.5 h-3.5" />
              <span>Services</span>
            </Link>
            {isAdmin ? (
              <Link
                href="/workspaces/admin"
                className="inline-flex items-center gap-1.5 h-[36px] px-3.5 rounded-[8px] bg-[#0A0A0A] hover:bg-[#6366F1] text-white text-[12px] font-medium transition"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Admin Desk</span>
              </Link>
            ) : (
              <Link
                href="/account"
                className="inline-flex items-center gap-1.5 h-[36px] px-3.5 rounded-[8px] bg-[#0EA5E9] text-white text-[12px] font-medium shadow-2xs transition"
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span>My Profile</span>
              </Link>
            )}
          </div>
        </div>

        {/* 4 Compact Stat Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-5 border-t border-[#E8E8EC]">
          <Link
            href="/community"
            className="p-3.5 rounded-[12px] bg-[#FAFAFA] border border-[#E8E8EC] hover:border-[#0EA5E9] transition flex items-center justify-between"
          >
            <div>
              <div className="text-[11px] text-[#6B6B6B] font-medium">Directory</div>
              <div className="text-[18px] font-display font-bold text-[#0A0A0A]">
                {bootstrap.community.approved_members ?? 998}
              </div>
              <div className="text-[11px] text-[#0EA5E9] font-medium">Members →</div>
            </div>
            <div className="w-9 h-9 rounded-[10px] bg-[#0EA5E9]/10 text-[#0EA5E9] flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </Link>

          <Link
            href="/shops"
            className="p-3.5 rounded-[12px] bg-[#FAFAFA] border border-[#E8E8EC] hover:border-[#10B981] transition flex items-center justify-between"
          >
            <div>
              <div className="text-[11px] text-[#6B6B6B] font-medium">Local Shops</div>
              <div className="text-[18px] font-display font-bold text-[#0A0A0A]">
                {(bootstrap.shops ?? []).length} Stores
              </div>
              <div className="text-[11px] text-[#10B981] font-medium">Order Now →</div>
            </div>
            <div className="w-9 h-9 rounded-[10px] bg-[#10B981]/10 text-[#10B981] flex items-center justify-center">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </Link>

          <Link
            href="/social-service"
            className="p-3.5 rounded-[12px] bg-[#FAFAFA] border border-[#E8E8EC] hover:border-[#8B5CF6] transition flex items-center justify-between"
          >
            <div>
              <div className="text-[11px] text-[#6B6B6B] font-medium">Exchange</div>
              <div className="text-[18px] font-display font-bold text-[#0A0A0A]">
                {exchanges.length} Items
              </div>
              <div className="text-[11px] text-[#8B5CF6] font-medium">Borrow/Share →</div>
            </div>
            <div className="w-9 h-9 rounded-[10px] bg-[#8B5CF6]/10 text-[#8B5CF6] flex items-center justify-center">
              <HeartHandshake className="w-4 h-4" />
            </div>
          </Link>

          <Link
            href="/help-complaints"
            className="p-3.5 rounded-[12px] bg-[#FAFAFA] border border-[#E8E8EC] hover:border-[#F59E0B] transition flex items-center justify-between"
          >
            <div>
              <div className="text-[11px] text-[#6B6B6B] font-medium">Helpdesk</div>
              <div className="text-[18px] font-display font-bold text-[#0A0A0A]">
                {(bootstrap.help_and_cases?.complaints ?? []).length} Cases
              </div>
              <div className="text-[11px] text-[#D97706] font-medium">View Status →</div>
            </div>
            <div className="w-9 h-9 rounded-[10px] bg-[#F59E0B]/10 text-[#F59E0B] flex items-center justify-center">
              <FileWarning className="w-4 h-4" />
            </div>
          </Link>
        </div>
      </section>

      {/* Compact Actionable Alert Strip (Click to View Full Details) */}
      {(activeIncidents.length > 0 || ordersAwaitingApproval.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {activeIncidents.slice(0, 1).map((inc) => (
            <div
              key={inc.id}
              className="rounded-[12px] bg-[#EF4444]/5 border border-[#EF4444]/30 px-4 py-3 flex items-center justify-between gap-3"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-[8px] bg-[#EF4444]/15 text-[#EF4444] flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="text-[12px] font-bold text-[#EF4444] truncate">
                    Safety Advisory • {inc.approx_area_public_label}
                  </div>
                  <div className="text-[12px] text-[#6B6B6B] truncate">
                    {inc.safe_guidance_public_text}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedIncident(inc)}
                className="shrink-0 h-[32px] px-3 rounded-[8px] bg-[#EF4444] text-white text-[11px] font-medium inline-flex items-center gap-1 cursor-pointer"
              >
                <Eye className="w-3 h-3" />
                <span>Details</span>
              </button>
            </div>
          ))}

          {ordersAwaitingApproval.slice(0, 1).map((ord) => (
            <div
              key={ord.id}
              className="rounded-[12px] bg-[#F59E0B]/10 border border-[#F59E0B]/30 px-4 py-3 flex items-center justify-between gap-3"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-[8px] bg-[#F59E0B]/20 text-[#D97706] flex items-center justify-center shrink-0">
                  <Clock className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="text-[12px] font-bold text-[#D97706] truncate">
                    Order Price Revision • {ord.shop_name}
                  </div>
                  <div className="text-[12px] text-[#0A0A0A] truncate">
                    {formatPaiseToINR(ord.total_paise)} →{' '}
                    <strong>{formatPaiseToINR(ord.proposed_total_paise ?? ord.total_paise)}</strong>
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedOrder(ord)}
                className="shrink-0 h-[32px] px-3 rounded-[8px] bg-[#F59E0B] text-white text-[11px] font-medium inline-flex items-center gap-1 cursor-pointer"
              >
                <Eye className="w-3 h-3" />
                <span>Details</span>
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Clean Tabbed Community Highlights with Pagination & Click-for-Details */}
      <section className="rounded-[16px] bg-white border border-[#E8E8EC] p-5 sm:p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Segmented Tabs */}
          <div className="flex flex-wrap gap-1.5 p-1 rounded-[10px] bg-[#FAFAFA] border border-[#E8E8EC]">
            <button
              type="button"
              onClick={() => switchTab('notices')}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-[8px] text-[13px] font-medium transition cursor-pointer ${
                activeTab === 'notices'
                  ? 'bg-[#6366F1] text-white shadow-2xs'
                  : 'text-[#6B6B6B] hover:text-[#0A0A0A]'
              }`}
            >
              <Megaphone className="w-3.5 h-3.5" />
              <span>Notices ({activeProminent.length})</span>
            </button>
            <button
              type="button"
              onClick={() => switchTab('events')}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-[8px] text-[13px] font-medium transition cursor-pointer ${
                activeTab === 'events'
                  ? 'bg-[#10B981] text-white shadow-2xs'
                  : 'text-[#6B6B6B] hover:text-[#0A0A0A]'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Events ({events.length})</span>
            </button>
            <button
              type="button"
              onClick={() => switchTab('exchanges')}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-[8px] text-[13px] font-medium transition cursor-pointer ${
                activeTab === 'exchanges'
                  ? 'bg-[#8B5CF6] text-white shadow-2xs'
                  : 'text-[#6B6B6B] hover:text-[#0A0A0A]'
              }`}
            >
              <HeartHandshake className="w-3.5 h-3.5" />
              <span>Exchanges ({exchanges.length})</span>
            </button>
          </div>

          <Link
            href={activeTab === 'exchanges' ? '/social-service' : '/community'}
            className="text-[12px] font-semibold text-[#6366F1] hover:underline inline-flex items-center gap-1"
          >
            <span>Open Full Module</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Tab 1: Concise Notice Cards */}
        {activeTab === 'notices' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {pagedNotices.map((ann) => (
              <div
                key={ann.id}
                onClick={() => setSelectedNotice(ann)}
                className="p-4 rounded-[12px] bg-[#FAFAFA] border border-[#E8E8EC] hover:border-[#6366F1] transition flex flex-col justify-between gap-3 cursor-pointer"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-[#6366F1]/10 text-[#6366F1] text-[11px] font-medium capitalize">
                      {ann.category}
                    </span>
                    <span className="text-[11px] text-[#10B981] font-medium inline-flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      {ann.acknowledgement_count} read
                    </span>
                  </div>
                  <h3 className="font-display font-bold text-[#0A0A0A] text-[15px] line-clamp-1">
                    {ann.title}
                  </h3>
                  <p className="text-[13px] text-[#6B6B6B] line-clamp-1">{ann.body}</p>
                </div>

                <div className="pt-2.5 border-t border-[#E8E8EC] flex items-center justify-between text-[12px]">
                  <span className="text-[#6B6B6B]">Tap for full notice</span>
                  <span className="font-semibold text-[#6366F1] inline-flex items-center gap-1">
                    <Eye className="w-3.5 h-3.5" />
                    <span>View Details</span>
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Tab 2: Concise Event Cards */}
        {activeTab === 'events' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {pagedEvents.map((evt) => (
              <div
                key={evt.id}
                onClick={() => setSelectedEvent(evt)}
                className="p-4 rounded-[12px] bg-[#FAFAFA] border border-[#E8E8EC] hover:border-[#10B981] transition flex flex-col justify-between gap-3 cursor-pointer"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#10B981]">
                      <MapPin className="w-3 h-3" />
                      {evt.location_label}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-white border border-[#E8E8EC] text-[11px] font-medium text-[#0A0A0A]">
                      {evt.rsvp_going_count} Going
                    </span>
                  </div>
                  <h3 className="font-display font-bold text-[#0A0A0A] text-[15px] line-clamp-1">
                    {evt.title}
                  </h3>
                  <p className="text-[13px] text-[#6B6B6B] line-clamp-1">{evt.description}</p>
                </div>

                <div className="pt-2.5 border-t border-[#E8E8EC] flex items-center justify-between text-[12px]">
                  <span className="text-[#6B6B6B]">Schedule & Organiser</span>
                  <span className="font-semibold text-[#10B981] inline-flex items-center gap-1">
                    <Eye className="w-3.5 h-3.5" />
                    <span>View Details</span>
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Tab 3: Concise Social Exchange Cards */}
        {activeTab === 'exchanges' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {pagedExchanges.map((item) => (
              <div
                key={item.id}
                onClick={() => setSelectedExchange(item)}
                className="p-4 rounded-[12px] bg-[#FAFAFA] border border-[#E8E8EC] hover:border-[#8B5CF6] transition flex flex-col justify-between gap-3 cursor-pointer"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[11px] font-medium capitalize ${
                        item.direction === 'need'
                          ? 'bg-[#F59E0B]/15 text-[#D97706]'
                          : 'bg-[#10B981]/15 text-[#059669]'
                      }`}
                    >
                      {item.exchange_mode.replace(/_/g, ' ')}
                    </span>
                    <span className="text-[12px] font-bold text-[#6366F1]">
                      {item.price_paise > 0
                        ? formatPaiseToINR(item.price_paise)
                        : item.deposit_paise > 0
                        ? `Deposit ${formatPaiseToINR(item.deposit_paise)}`
                        : 'Free'}
                    </span>
                  </div>
                  <h3 className="font-display font-bold text-[15px] text-[#0A0A0A] line-clamp-1">
                    {item.title}
                  </h3>
                  <p className="text-[13px] text-[#6B6B6B] line-clamp-1">{item.description}</p>
                </div>

                <div className="pt-2.5 border-t border-[#E8E8EC] flex items-center justify-between text-[12px]">
                  <span className="font-medium text-[#0A0A0A]">{item.owner_name}</span>
                  <span className="font-semibold text-[#8B5CF6] inline-flex items-center gap-1">
                    <Eye className="w-3.5 h-3.5" />
                    <span>View Details</span>
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        <PaginationBar
          currentPage={page}
          totalItems={currentItemsLength}
          pageSize={HOME_PAGE_SIZE}
          onPageChange={setPage}
          itemLabel={activeTab}
        />
      </section>

      {/* MODAL 1: Notice Detail */}
      <DetailModal
        open={Boolean(selectedNotice)}
        onClose={() => setSelectedNotice(null)}
        title={selectedNotice?.title ?? ''}
        subtitle={
          selectedNotice
            ? `Published by ${selectedNotice.author_name} on ${new Date(
                selectedNotice.published_at
              ).toLocaleDateString('en-IN')}`
            : undefined
        }
        badge={
          selectedNotice && (
            <span className="px-2.5 py-0.5 rounded-full bg-[#6366F1]/10 text-[#6366F1] text-[11px] font-medium capitalize">
              {selectedNotice.category} Notice
            </span>
          )
        }
      >
        {selectedNotice && (
          <div className="space-y-4">
            <p className="text-[14px] text-[#0A0A0A] leading-relaxed">{selectedNotice.body}</p>
            <div className="p-3 rounded-[10px] bg-[#FAFAFA] border border-[#E8E8EC] flex items-center justify-between text-[12px]">
              <span className="text-[#6B6B6B]">
                Read by <strong>{selectedNotice.acknowledgement_count}</strong> residents
              </span>
              <span className="text-[#10B981] font-medium">
                {selectedNotice.actor_acknowledged ? 'Acknowledged ✓' : 'Official Society Notice'}
              </span>
            </div>
          </div>
        )}
      </DetailModal>

      {/* MODAL 2: Event Detail */}
      <DetailModal
        open={Boolean(selectedEvent)}
        onClose={() => setSelectedEvent(null)}
        title={selectedEvent?.title ?? ''}
        subtitle={selectedEvent ? `Organised by ${selectedEvent.organiser_name}` : undefined}
        badge={
          <span className="px-2.5 py-0.5 rounded-full bg-[#10B981]/10 text-[#10B981] text-[11px] font-medium">
            Community Event
          </span>
        }
      >
        {selectedEvent && (
          <div className="space-y-4">
            <p className="text-[14px] text-[#0A0A0A] leading-relaxed">
              {selectedEvent.description}
            </p>
            <div className="grid grid-cols-2 gap-2.5 p-3 rounded-[10px] bg-[#FAFAFA] border border-[#E8E8EC] text-[12px]">
              <div>
                <span className="text-[#6B6B6B] block">Venue & Time</span>
                <strong className="text-[#0A0A0A]">
                  {selectedEvent.location_label} •{' '}
                  {new Date(selectedEvent.starts_at).toLocaleDateString('en-IN')}
                </strong>
              </div>
              <div>
                <span className="text-[#6B6B6B] block">Attendance</span>
                <strong className="text-[#10B981]">{selectedEvent.rsvp_going_count} Going</strong>
              </div>
            </div>
          </div>
        )}
      </DetailModal>

      {/* MODAL 3: Exchange Detail */}
      <DetailModal
        open={Boolean(selectedExchange)}
        onClose={() => setSelectedExchange(null)}
        title={selectedExchange?.title ?? ''}
        subtitle={selectedExchange ? `Listed by ${selectedExchange.owner_name}` : undefined}
        badge={
          selectedExchange && (
            <span className="px-2.5 py-0.5 rounded-full bg-[#8B5CF6]/10 text-[#8B5CF6] text-[11px] font-medium capitalize">
              {selectedExchange.exchange_mode.replace(/_/g, ' ')}
            </span>
          )
        }
      >
        {selectedExchange && (
          <div className="space-y-4">
            <p className="text-[14px] text-[#0A0A0A] leading-relaxed">
              {selectedExchange.description}
            </p>
            <div className="grid grid-cols-2 gap-2.5 p-3 rounded-[10px] bg-[#FAFAFA] border border-[#E8E8EC] text-[12px]">
              <div>
                <span className="text-[#6B6B6B] block">Price / Deposit</span>
                <strong className="text-[#6366F1]">
                  {selectedExchange.price_paise > 0
                    ? formatPaiseToINR(selectedExchange.price_paise)
                    : selectedExchange.deposit_paise > 0
                    ? `Deposit ${formatPaiseToINR(selectedExchange.deposit_paise)}`
                    : 'Free'}
                </strong>
              </div>
              <div>
                <span className="text-[#6B6B6B] block">Handover</span>
                <strong className="text-[#0A0A0A]">{selectedExchange.handover_options}</strong>
              </div>
            </div>
            <div className="flex justify-end">
              <Link
                href="/social-service"
                className="h-[38px] px-4 rounded-[8px] bg-[#6366F1] hover:bg-[#4F46E5] text-white text-[13px] font-medium inline-flex items-center gap-1.5"
              >
                <span>Open in Social Exchange</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        )}
      </DetailModal>

      {/* MODAL 4: Safety Incident Detail */}
      <DetailModal
        open={Boolean(selectedIncident)}
        onClose={() => setSelectedIncident(null)}
        title={
          selectedIncident ? `Safety Notice — ${selectedIncident.approx_area_public_label}` : ''
        }
        subtitle={selectedIncident ? `Status: ${selectedIncident.status.toUpperCase()}` : undefined}
        badge={
          <span className="px-2.5 py-0.5 rounded-full bg-[#EF4444]/10 text-[#EF4444] text-[11px] font-medium">
            Active Safety Advisory
          </span>
        }
      >
        {selectedIncident && (
          <div className="space-y-4">
            <p className="text-[14px] text-[#0A0A0A] leading-relaxed">
              {selectedIncident.safe_guidance_public_text}
            </p>
            {selectedIncident.restricted_responder_details && (
              <div className="p-3 rounded-[10px] bg-[#EF4444]/5 border border-[#EF4444]/30 text-[12px] text-[#EF4444]">
                <strong>Authorized Responder Detail:</strong>{' '}
                {selectedIncident.restricted_responder_details}
              </div>
            )}
            <div className="flex justify-end">
              <Link
                href="/safety"
                className="h-[38px] px-4 rounded-[8px] bg-[#EF4444] text-white text-[13px] font-medium inline-flex items-center gap-1.5"
              >
                <span>Open Safety Module</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        )}
      </DetailModal>

      {/* MODAL 5: Order Price Revision Detail */}
      <DetailModal
        open={Boolean(selectedOrder)}
        onClose={() => setSelectedOrder(null)}
        title={selectedOrder ? `Order Revision — ${selectedOrder.shop_name}` : ''}
        subtitle={
          selectedOrder
            ? `Invoice: ${selectedOrder.invoice?.invoice_number ?? selectedOrder.id.slice(0, 8)}`
            : undefined
        }
        badge={
          <span className="px-2.5 py-0.5 rounded-full bg-[#F59E0B]/15 text-[#D97706] text-[11px] font-medium">
            Awaiting Buyer Approval
          </span>
        }
      >
        {selectedOrder && (
          <div className="space-y-4">
            <div className="p-3.5 rounded-[10px] bg-[#FAFAFA] border border-[#E8E8EC] space-y-1">
              <div className="text-[13px] text-[#6B6B6B]">
                Original Total: <strong>{formatPaiseToINR(selectedOrder.total_paise)}</strong>
              </div>
              <div className="text-[15px] font-bold text-[#D97706]">
                Revised Total:{' '}
                {formatPaiseToINR(
                  selectedOrder.proposed_total_paise ?? selectedOrder.total_paise
                )}
              </div>
              <p className="text-[13px] text-[#0A0A0A] pt-1">
                {selectedOrder.price_change_reason}
              </p>
            </div>
            <div className="flex justify-end">
              <Link
                href="/shops"
                className="h-[38px] px-4 rounded-[8px] bg-[#10B981] text-white text-[13px] font-medium inline-flex items-center gap-1.5"
              >
                <span>Approve or Decline in Shops</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        )}
      </DetailModal>
    </div>
  );
}
