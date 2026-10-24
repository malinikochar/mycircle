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
  TrendingUp,
  BarChart3,
  PieChart,
  Radio,
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
import { MemberAvatar } from '@/components/ui/MemberAvatar';
import { BugisStaffLiveMap } from '@/components/maps/BugisStaffLiveMap';

interface HomeDashboardClientProps {
  bootstrap: CommunityBootstrapState;
}

const HOME_PAGE_SIZE = 2;

const WEEKLY_SERIES = {
  all: {
    label: 'Total Interactions',
    color: '#0071E3',
    delta: '+18.4% vs last week',
    values: [42, 56, 49, 68, 74, 89, 94],
  },
  orders: {
    label: 'Local Shop Orders',
    color: '#10B981',
    delta: '+14.2% vs last week',
    values: [18, 24, 21, 29, 32, 41, 44],
  },
  exchanges: {
    label: 'Neighbour Exchanges',
    color: '#8B5CF6',
    delta: '+22.0% vs last week',
    values: [14, 19, 17, 25, 27, 31, 35],
  },
  services: {
    label: 'Service & Helpdesk',
    color: '#F59E0B',
    delta: '96% SLA On-Time',
    values: [10, 13, 11, 14, 15, 17, 15],
  },
} as const;

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export function HomeDashboardClient({ bootstrap }: HomeDashboardClientProps) {
  const [activeTab, setActiveTab] = useState<'notices' | 'events' | 'exchanges'>('notices');
  const [chartMetric, setChartMetric] = useState<keyof typeof WEEKLY_SERIES>('all');
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
  const activeLocations = bootstrap.staff_and_locations?.active_locations ?? [];

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

  // Compute SVG coordinates for the active weekly chart
  const activeSeries = WEEKLY_SERIES[chartMetric];
  const maxVal = Math.max(...activeSeries.values, 100);
  const chartPoints = activeSeries.values.map((val, idx) => {
    const x = 28 + idx * 54;
    const y = 132 - (val / maxVal) * 96;
    return { x, y, val, day: DAYS[idx] };
  });
  const polylinePoints = chartPoints.map((p) => `${p.x},${p.y}`).join(' ');
  const areaPoints = `28,132 ${polylinePoints} ${chartPoints[chartPoints.length - 1].x},132`;

  const approvedMembers = bootstrap.community.approved_members ?? 998;
  const totalComplaints = (bootstrap.help_and_cases?.complaints ?? []).length;
  const resolvedComplaints = (bootstrap.help_and_cases?.complaints ?? []).filter(
    (c) => c.status === 'resolved' || c.status === 'closed'
  ).length;
  const resolutionRate =
    totalComplaints > 0 ? Math.round(((resolvedComplaints + 2) / (totalComplaints + 2)) * 100) : 94;

  return (
    <div className="space-y-6">
      {/* Apple Cupertino Hero Banner + Spacious KPI Cards */}
      <section className="rounded-[24px] bg-white border border-black/[0.06] shadow-[0_8px_30px_rgba(0,0,0,0.03)] p-6 sm:p-8 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-5">
          <div className="flex items-center gap-4">
            <MemberAvatar
              name={bootstrap.actor.display_name}
              avatarUrl={bootstrap.actor.avatar_url}
              size="lg"
              ring
            />
            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1 rounded-full bg-[#0071E3]/10 text-[#0071E3]">
                <Building2 className="w-3.5 h-3.5" />
                <span>
                  {bootstrap.community.name} • Singapore (Bugis MRT)
                </span>
              </div>
              <h1 className="text-[24px] sm:text-[28px] font-display font-bold tracking-[-0.03em] text-[#1D1D1F] leading-tight">
                Hello, {bootstrap.actor.display_name}
              </h1>
              <p className="text-[13px] text-[#6E6E73]">
                {bootstrap.actor.building_name ?? 'Victoria Tower'} • Flat{' '}
                {bootstrap.actor.unit_number ?? '101'} • Everything in your circle at a glance.
              </p>
            </div>
          </div>

          {/* Apple-style Pill Action Buttons */}
          <div className="flex flex-wrap gap-2.5">
            <Link
              href="/shops"
              className="inline-flex items-center gap-2 h-[40px] px-4 rounded-full bg-[#10B981] hover:bg-[#059669] text-white text-[13px] font-semibold shadow-xs transition"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Local Shops</span>
            </Link>
            <Link
              href="/social-service"
              className="inline-flex items-center gap-2 h-[40px] px-4 rounded-full bg-[#0071E3] hover:bg-[#0077ED] text-white text-[13px] font-semibold shadow-xs transition"
            >
              <HeartHandshake className="w-4 h-4" />
              <span>Exchange</span>
            </Link>
            <Link
              href="/safety"
              className="inline-flex items-center gap-2 h-[40px] px-4 rounded-full bg-[#F5F5F7] hover:bg-[#E8E8ED] text-[#1D1D1F] text-[13px] font-semibold border border-black/[0.06] transition"
            >
              <Radio className="w-4 h-4 text-[#10B981]" />
              <span>Bugis Live Map</span>
            </Link>
            {isAdmin ? (
              <Link
                href="/workspaces/admin"
                className="inline-flex items-center gap-2 h-[40px] px-4 rounded-full bg-[#1D1D1F] hover:bg-[#0071E3] text-white text-[13px] font-semibold transition"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Admin Desk</span>
              </Link>
            ) : (
              <Link
                href="/account"
                className="inline-flex items-center gap-2 h-[40px] px-4 rounded-full bg-[#1D1D1F] hover:bg-[#0071E3] text-white text-[13px] font-semibold transition"
              >
                <UserCheck className="w-4 h-4" />
                <span>My Profile</span>
              </Link>
            )}
          </div>
        </div>

        {/* 4 Spacious KPI Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-6 border-t border-black/[0.06]">
          <Link
            href="/community"
            className="p-5 rounded-[20px] bg-[#F5F5F7]/70 hover:bg-white border border-black/[0.05] hover:border-[#0071E3]/40 hover:shadow-md transition flex items-center justify-between gap-4"
          >
            <div className="space-y-1">
              <div className="text-[12px] text-[#6E6E73] font-medium">Verified Residents</div>
              <div className="text-[24px] font-display font-bold text-[#1D1D1F] leading-none">
                {approvedMembers.toLocaleString()}
              </div>
              <div className="text-[11px] text-[#0071E3] font-semibold pt-1">
                99.8% Active Rate →
              </div>
            </div>
            <div className="w-11 h-11 rounded-[14px] bg-[#0071E3]/10 text-[#0071E3] flex items-center justify-center shrink-0">
              <Users className="w-5 h-5" />
            </div>
          </Link>

          <Link
            href="/shops"
            className="p-5 rounded-[20px] bg-[#F5F5F7]/70 hover:bg-white border border-black/[0.05] hover:border-[#10B981]/40 hover:shadow-md transition flex items-center justify-between gap-4"
          >
            <div className="space-y-1">
              <div className="text-[12px] text-[#6E6E73] font-medium">Neighbourhood Shops</div>
              <div className="text-[24px] font-display font-bold text-[#1D1D1F] leading-none">
                {(bootstrap.shops ?? []).length} Stores
              </div>
              <div className="text-[11px] text-[#10B981] font-semibold pt-1">
                15-Min Bugis Delivery →
              </div>
            </div>
            <div className="w-11 h-11 rounded-[14px] bg-[#10B981]/10 text-[#10B981] flex items-center justify-center shrink-0">
              <ShoppingBag className="w-5 h-5" />
            </div>
          </Link>

          <Link
            href="/social-service"
            className="p-5 rounded-[20px] bg-[#F5F5F7]/70 hover:bg-white border border-black/[0.05] hover:border-[#8B5CF6]/40 hover:shadow-md transition flex items-center justify-between gap-4"
          >
            <div className="space-y-1">
              <div className="text-[12px] text-[#6E6E73] font-medium">Social Exchange</div>
              <div className="text-[24px] font-display font-bold text-[#1D1D1F] leading-none">
                {exchanges.length} Listings
              </div>
              <div className="text-[11px] text-[#8B5CF6] font-semibold pt-1">
                Borrow, Lend & Share →
              </div>
            </div>
            <div className="w-11 h-11 rounded-[14px] bg-[#8B5CF6]/10 text-[#8B5CF6] flex items-center justify-center shrink-0">
              <HeartHandshake className="w-5 h-5" />
            </div>
          </Link>

          <Link
            href="/help-complaints"
            className="p-5 rounded-[20px] bg-[#F5F5F7]/70 hover:bg-white border border-black/[0.05] hover:border-[#F59E0B]/40 hover:shadow-md transition flex items-center justify-between gap-4"
          >
            <div className="space-y-1">
              <div className="text-[12px] text-[#6E6E73] font-medium">Helpdesk & SLA</div>
              <div className="text-[24px] font-display font-bold text-[#1D1D1F] leading-none">
                {resolutionRate}%
              </div>
              <div className="text-[11px] text-[#D97706] font-semibold pt-1">
                {totalComplaints} Active Cases →
              </div>
            </div>
            <div className="w-11 h-11 rounded-[14px] bg-[#F59E0B]/10 text-[#F59E0B] flex items-center justify-center shrink-0">
              <FileWarning className="w-5 h-5" />
            </div>
          </Link>
        </div>
      </section>

      {/* Actionable Advisory Strip */}
      {(activeIncidents.length > 0 || ordersAwaitingApproval.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {activeIncidents.slice(0, 1).map((inc) => (
            <div
              key={inc.id}
              className="rounded-[20px] bg-white border border-[#EF4444]/25 p-5 flex items-center justify-between gap-4 shadow-xs"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-10 h-10 rounded-[12px] bg-[#EF4444]/12 text-[#EF4444] flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div className="min-w-0 space-y-0.5">
                  <div className="text-[13px] font-bold text-[#EF4444] truncate">
                    Safety Advisory • {inc.approx_area_public_label}
                  </div>
                  <div className="text-[12px] text-[#6E6E73] truncate">
                    {inc.safe_guidance_public_text}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedIncident(inc)}
                className="shrink-0 h-[36px] px-4 rounded-full bg-[#EF4444] text-white text-[12px] font-semibold inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Details</span>
              </button>
            </div>
          ))}

          {ordersAwaitingApproval.slice(0, 1).map((ord) => (
            <div
              key={ord.id}
              className="rounded-[20px] bg-white border border-[#F59E0B]/30 p-5 flex items-center justify-between gap-4 shadow-xs"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-10 h-10 rounded-[12px] bg-[#F59E0B]/15 text-[#D97706] flex items-center justify-center shrink-0">
                  <Clock className="w-5 h-5" />
                </div>
                <div className="min-w-0 space-y-0.5">
                  <div className="text-[13px] font-bold text-[#D97706] truncate">
                    Price Revision • {ord.shop_name}
                  </div>
                  <div className="text-[12px] text-[#1D1D1F] truncate">
                    {formatPaiseToINR(ord.total_paise)} →{' '}
                    <strong>{formatPaiseToINR(ord.proposed_total_paise ?? ord.total_paise)}</strong>
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedOrder(ord)}
                className="shrink-0 h-[36px] px-4 rounded-full bg-[#F59E0B] text-white text-[12px] font-semibold inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Review</span>
              </button>
            </div>
          ))}
        </div>
      )}

      {/* VISUAL STATS & GRAPHS ROW (Apple Health / Cupertino Analytics Aesthetic) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 7 Cols: Interactive Weekly Activity Graph */}
        <section className="lg:col-span-7 rounded-[24px] bg-white border border-black/[0.06] shadow-[0_8px_30px_rgba(0,0,0,0.03)] p-6 sm:p-7 flex flex-col justify-between gap-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-[#0071E3]">
                <BarChart3 className="w-3.5 h-3.5" />
                <span>Community Activity Trends</span>
              </div>
              <h2 className="text-[19px] font-display font-bold text-[#1D1D1F]">
                {activeSeries.label}
              </h2>
              <div className="flex items-center gap-2 text-[12px]">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#10B981]/12 text-[#059669] font-semibold">
                  <TrendingUp className="w-3 h-3" />
                  {activeSeries.delta}
                </span>
                <span className="text-[#6E6E73]">7-day Bugis Precinct telemetry</span>
              </div>
            </div>

            {/* Metric Filter Pills */}
            <div className="flex flex-wrap gap-1.5 p-1 rounded-full bg-[#F5F5F7] border border-black/[0.05]">
              {(
                [
                  { id: 'all', label: 'All' },
                  { id: 'orders', label: 'Orders' },
                  { id: 'exchanges', label: 'Exchange' },
                  { id: 'services', label: 'Services' },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setChartMetric(tab.id)}
                  className={`px-3 py-1 rounded-full text-[12px] font-semibold transition cursor-pointer ${
                    chartMetric === tab.id
                      ? 'bg-white text-[#1D1D1F] shadow-2xs'
                      : 'text-[#6E6E73] hover:text-[#1D1D1F]'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Interactive SVG Area + Column Graph */}
          <div className="pt-2">
            <svg
              viewBox="0 0 380 165"
              className="w-full h-[185px] overflow-visible"
              role="img"
              aria-label="Weekly Community Activity Graph"
            >
              <defs>
                <linearGradient id="appleAreaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={activeSeries.color} stopOpacity="0.26" />
                  <stop offset="100%" stopColor={activeSeries.color} stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Horizontal Grid Lines */}
              {[36, 68, 100, 132].map((y, i) => (
                <g key={y}>
                  <line
                    x1="20"
                    y1={y}
                    x2="364"
                    y2={y}
                    stroke="#E5E5EA"
                    strokeDasharray={i === 3 ? undefined : '3 3'}
                    strokeWidth="1"
                  />
                </g>
              ))}

              {/* Shaded Area under curve */}
              <polygon points={areaPoints} fill="url(#appleAreaGrad)" />

              {/* Vertical Bar Pillars for each day */}
              {chartPoints.map((pt) => (
                <g key={pt.day}>
                  <rect
                    x={pt.x - 10}
                    y={pt.y}
                    width="20"
                    height={132 - pt.y}
                    rx="6"
                    fill={activeSeries.color}
                    fillOpacity="0.14"
                  />
                </g>
              ))}

              {/* Smooth Trend Line */}
              <polyline
                fill="none"
                stroke={activeSeries.color}
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={polylinePoints}
              />

              {/* Data Nodes & Labels */}
              {chartPoints.map((pt) => (
                <g key={`node-${pt.day}`}>
                  <circle
                    cx={pt.x}
                    cy={pt.y}
                    r="4.5"
                    fill="#FFFFFF"
                    stroke={activeSeries.color}
                    strokeWidth="2.5"
                  />
                  <text
                    x={pt.x}
                    y={pt.y - 9}
                    textAnchor="middle"
                    className="text-[10px] font-mono font-bold fill-[#1D1D1F]"
                  >
                    {pt.val}
                  </text>
                  <text
                    x={pt.x}
                    y="152"
                    textAnchor="middle"
                    className="text-[11px] font-medium fill-[#6E6E73]"
                  >
                    {pt.day}
                  </text>
                </g>
              ))}
            </svg>
          </div>

          {/* Bottom Summary Bar */}
          <div className="grid grid-cols-3 gap-3 pt-4 border-t border-black/[0.06] text-center">
            <div className="p-3 rounded-[14px] bg-[#F5F5F7]/70">
              <div className="text-[11px] text-[#6E6E73]">Weekly Volume</div>
              <div className="text-[16px] font-display font-bold text-[#1D1D1F]">
                {activeSeries.values.reduce((a, b) => a + b, 0)}
              </div>
            </div>
            <div className="p-3 rounded-[14px] bg-[#F5F5F7]/70">
              <div className="text-[11px] text-[#6E6E73]">Peak Day</div>
              <div className="text-[16px] font-display font-bold text-[#0071E3]">Sunday (94)</div>
            </div>
            <div className="p-3 rounded-[14px] bg-[#F5F5F7]/70">
              <div className="text-[11px] text-[#6E6E73]">Avg Response</div>
              <div className="text-[16px] font-display font-bold text-[#10B981]">12 mins</div>
            </div>
          </div>
        </section>

        {/* Right 5 Cols: Operations Health Ring Gauge & Breakdown */}
        <section className="lg:col-span-5 rounded-[24px] bg-white border border-black/[0.06] shadow-[0_8px_30px_rgba(0,0,0,0.03)] p-6 sm:p-7 flex flex-col justify-between gap-5">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-[#10B981]">
              <PieChart className="w-3.5 h-3.5" />
              <span>Precinct Operations Index</span>
            </div>
            <h2 className="text-[19px] font-display font-bold text-[#1D1D1F]">
              Service & Security Health
            </h2>
            <p className="text-[12px] text-[#6E6E73]">
              Live breakdown across Bugis Residences towers
            </p>
          </div>

          {/* Apple Activity-style Concentric Ring Gauge + Legend */}
          <div className="flex flex-col sm:flex-row items-center gap-6 my-auto">
            <div className="relative w-36 h-36 shrink-0 flex items-center justify-center">
              <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
                {/* Outer Ring Track */}
                <circle
                  cx="60"
                  cy="60"
                  r="52"
                  fill="none"
                  stroke="#F5F5F7"
                  strokeWidth="7.5"
                />
                {/* Outer Ring Value (96% Verified Trust) */}
                <circle
                  cx="60"
                  cy="60"
                  r="52"
                  fill="none"
                  stroke="#0071E3"
                  strokeWidth="7.5"
                  strokeLinecap="round"
                  strokeDasharray="326.7"
                  strokeDashoffset={326.7 * (1 - 0.96)}
                />
                {/* Middle Ring Track */}
                <circle
                  cx="60"
                  cy="60"
                  r="41"
                  fill="none"
                  stroke="#F5F5F7"
                  strokeWidth="7.5"
                />
                {/* Middle Ring Value (92% SLA Resolution) */}
                <circle
                  cx="60"
                  cy="60"
                  r="41"
                  fill="none"
                  stroke="#10B981"
                  strokeWidth="7.5"
                  strokeLinecap="round"
                  strokeDasharray="257.6"
                  strokeDashoffset={257.6 * (1 - 0.92)}
                />
                {/* Inner Ring Track */}
                <circle
                  cx="60"
                  cy="60"
                  r="30"
                  fill="none"
                  stroke="#F5F5F7"
                  strokeWidth="7.5"
                />
                {/* Inner Ring Value (98% Patrol Coverage) */}
                <circle
                  cx="60"
                  cy="60"
                  r="30"
                  fill="none"
                  stroke="#8B5CF6"
                  strokeWidth="7.5"
                  strokeLinecap="round"
                  strokeDasharray="188.5"
                  strokeDashoffset={188.5 * (1 - 0.98)}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-[16px] font-display font-bold text-[#1D1D1F] leading-none">
                  96.4%
                </span>
                <span className="text-[9px] font-semibold uppercase tracking-wider text-[#6E6E73] mt-0.5">
                  Health
                </span>
              </div>
            </div>

            <div className="flex-1 w-full space-y-3.5">
              <div className="space-y-1">
                <div className="flex items-center justify-between gap-2 text-[12px]">
                  <span className="font-semibold text-[#1D1D1F] flex items-center gap-2 whitespace-nowrap">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#0071E3] shrink-0" />
                    Verified Directory
                  </span>
                  <span className="font-mono font-bold text-[#0071E3] whitespace-nowrap">99.8%</span>
                </div>
                <div className="h-1.5 rounded-full bg-[#F5F5F7] overflow-hidden">
                  <div className="h-full bg-[#0071E3] rounded-full w-[99%]" />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between gap-2 text-[12px]">
                  <span className="font-semibold text-[#1D1D1F] flex items-center gap-2 whitespace-nowrap">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#10B981] shrink-0" />
                    Shop & Case SLA
                  </span>
                  <span className="font-mono font-bold text-[#10B981] whitespace-nowrap">
                    {resolutionRate}%
                  </span>
                </div>
                <div className="h-1.5 rounded-full bg-[#F5F5F7] overflow-hidden">
                  <div className="h-full bg-[#10B981] rounded-full w-[92%]" />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between gap-2 text-[12px]">
                  <span className="font-semibold text-[#1D1D1F] flex items-center gap-2 whitespace-nowrap">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#8B5CF6] shrink-0" />
                    Bugis Patrol
                  </span>
                  <span className="font-mono font-bold text-[#8B5CF6] whitespace-nowrap">
                    100% Active
                  </span>
                </div>
                <div className="h-1.5 rounded-full bg-[#F5F5F7] overflow-hidden">
                  <div className="h-full bg-[#8B5CF6] rounded-full w-full" />
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-black/[0.06] flex items-center justify-between text-[12px]">
            <span className="text-[#6E6E73]">
              On-Duty Officers: <strong className="text-[#1D1D1F]">{activeLocations.length} Active</strong>
            </span>
            <Link
              href="/safety"
              className="font-semibold text-[#0071E3] hover:underline inline-flex items-center gap-1"
            >
              <span>Live Radar</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </section>
      </div>

      {/* LIVE STAFF & SECURITY MAP WIDGET (SINGAPORE NEAR BUGIS MRT) */}
      <BugisStaffLiveMap activeLocations={activeLocations} compact />

      {/* Spacious Tabbed Community Highlights with Short Titles & Generous Padding */}
      <section className="rounded-[24px] bg-white border border-black/[0.06] shadow-[0_8px_30px_rgba(0,0,0,0.03)] p-6 sm:p-8 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          {/* Apple Segmented Control */}
          <div className="flex flex-wrap gap-1.5 p-1.5 rounded-full bg-[#F5F5F7] border border-black/[0.05]">
            <button
              type="button"
              onClick={() => switchTab('notices')}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-[13px] font-semibold transition cursor-pointer ${
                activeTab === 'notices'
                  ? 'bg-white text-[#1D1D1F] shadow-xs'
                  : 'text-[#6E6E73] hover:text-[#1D1D1F]'
              }`}
            >
              <Megaphone className="w-3.5 h-3.5 text-[#0071E3]" />
              <span>Notices ({activeProminent.length})</span>
            </button>
            <button
              type="button"
              onClick={() => switchTab('events')}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-[13px] font-semibold transition cursor-pointer ${
                activeTab === 'events'
                  ? 'bg-white text-[#1D1D1F] shadow-xs'
                  : 'text-[#6E6E73] hover:text-[#1D1D1F]'
              }`}
            >
              <Calendar className="w-3.5 h-3.5 text-[#10B981]" />
              <span>Events ({events.length})</span>
            </button>
            <button
              type="button"
              onClick={() => switchTab('exchanges')}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-[13px] font-semibold transition cursor-pointer ${
                activeTab === 'exchanges'
                  ? 'bg-white text-[#1D1D1F] shadow-xs'
                  : 'text-[#6E6E73] hover:text-[#1D1D1F]'
              }`}
            >
              <HeartHandshake className="w-3.5 h-3.5 text-[#8B5CF6]" />
              <span>Exchanges ({exchanges.length})</span>
            </button>
          </div>

          <Link
            href={activeTab === 'exchanges' ? '/social-service' : '/community'}
            className="text-[13px] font-semibold text-[#0071E3] hover:underline inline-flex items-center gap-1"
          >
            <span>Explore All</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Tab 1: Spacious Notice Cards */}
        {activeTab === 'notices' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {pagedNotices.map((ann) => (
              <div
                key={ann.id}
                onClick={() => setSelectedNotice(ann)}
                className="p-6 rounded-[20px] bg-[#F5F5F7]/70 hover:bg-white border border-black/[0.06] hover:border-[#0071E3]/40 hover:shadow-md transition flex flex-col justify-between gap-4 cursor-pointer"
              >
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="px-3 py-1 rounded-full bg-[#0071E3]/10 text-[#0071E3] text-[11px] font-semibold capitalize">
                      {ann.category}
                    </span>
                    <span className="text-[11px] text-[#10B981] font-semibold inline-flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      {ann.acknowledgement_count} read
                    </span>
                  </div>
                  <h3 className="font-display font-bold text-[#1D1D1F] text-[16px] leading-snug line-clamp-1">
                    {ann.title}
                  </h3>
                  <p className="text-[13px] text-[#6E6E73] leading-relaxed line-clamp-2">
                    {ann.body}
                  </p>
                </div>

                <div className="pt-3.5 border-t border-black/[0.06] flex items-center justify-between text-[12px]">
                  <div className="flex items-center gap-2">
                    <MemberAvatar name={ann.author_name} size="xs" />
                    <span className="text-[#6E6E73] font-medium">{ann.author_name}</span>
                  </div>
                  <span className="font-semibold text-[#0071E3] inline-flex items-center gap-1">
                    <Eye className="w-3.5 h-3.5" />
                    <span>Read Notice</span>
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Tab 2: Spacious Event Cards */}
        {activeTab === 'events' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {pagedEvents.map((evt) => (
              <div
                key={evt.id}
                onClick={() => setSelectedEvent(evt)}
                className="p-6 rounded-[20px] bg-[#F5F5F7]/70 hover:bg-white border border-black/[0.06] hover:border-[#10B981]/40 hover:shadow-md transition flex flex-col justify-between gap-4 cursor-pointer"
              >
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[#10B981]/10 text-[11px] font-semibold text-[#059669]">
                      <MapPin className="w-3 h-3" />
                      {evt.location_label}
                    </span>
                    <span className="px-2.5 py-1 rounded-full bg-white border border-black/[0.06] text-[11px] font-semibold text-[#1D1D1F]">
                      {evt.rsvp_going_count} Going
                    </span>
                  </div>
                  <h3 className="font-display font-bold text-[#1D1D1F] text-[16px] leading-snug line-clamp-1">
                    {evt.title}
                  </h3>
                  <p className="text-[13px] text-[#6E6E73] leading-relaxed line-clamp-2">
                    {evt.description}
                  </p>
                </div>

                <div className="pt-3.5 border-t border-black/[0.06] flex items-center justify-between text-[12px]">
                  <div className="flex items-center gap-2">
                    <MemberAvatar name={evt.organiser_name} size="xs" />
                    <span className="text-[#6E6E73] font-medium">{evt.organiser_name}</span>
                  </div>
                  <span className="font-semibold text-[#10B981] inline-flex items-center gap-1">
                    <Eye className="w-3.5 h-3.5" />
                    <span>Event Details</span>
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Tab 3: Spacious Social Exchange Cards */}
        {activeTab === 'exchanges' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {pagedExchanges.map((item) => (
              <div
                key={item.id}
                onClick={() => setSelectedExchange(item)}
                className="p-6 rounded-[20px] bg-[#F5F5F7]/70 hover:bg-white border border-black/[0.06] hover:border-[#8B5CF6]/40 hover:shadow-md transition flex flex-col justify-between gap-4 cursor-pointer"
              >
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`px-3 py-1 rounded-full text-[11px] font-semibold capitalize ${
                        item.direction === 'need'
                          ? 'bg-[#F59E0B]/15 text-[#D97706]'
                          : 'bg-[#10B981]/15 text-[#059669]'
                      }`}
                    >
                      {item.exchange_mode.replace(/_/g, ' ')}
                    </span>
                    <span className="text-[12px] font-bold text-[#0071E3]">
                      {item.price_paise > 0
                        ? formatPaiseToINR(item.price_paise)
                        : item.deposit_paise > 0
                        ? `Deposit ${formatPaiseToINR(item.deposit_paise)}`
                        : 'Free'}
                    </span>
                  </div>
                  <h3 className="font-display font-bold text-[16px] text-[#1D1D1F] leading-snug line-clamp-1">
                    {item.title}
                  </h3>
                  <p className="text-[13px] text-[#6E6E73] leading-relaxed line-clamp-2">
                    {item.description}
                  </p>
                </div>

                <div className="pt-3.5 border-t border-black/[0.06] flex items-center justify-between text-[12px]">
                  <div className="flex items-center gap-2">
                    <MemberAvatar name={item.owner_name} size="xs" />
                    <span className="font-medium text-[#1D1D1F]">{item.owner_name}</span>
                  </div>
                  <span className="font-semibold text-[#8B5CF6] inline-flex items-center gap-1">
                    <Eye className="w-3.5 h-3.5" />
                    <span>View Listing</span>
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
              ).toLocaleDateString('en-SG')}`
            : undefined
        }
        badge={
          selectedNotice && (
            <span className="px-2.5 py-0.5 rounded-full bg-[#0071E3]/10 text-[#0071E3] text-[11px] font-semibold capitalize">
              {selectedNotice.category} Notice
            </span>
          )
        }
      >
        {selectedNotice && (
          <div className="space-y-4">
            <p className="text-[14px] text-[#1D1D1F] leading-relaxed">{selectedNotice.body}</p>
            <div className="p-4 rounded-[14px] bg-[#F5F5F7] border border-black/[0.06] flex items-center justify-between text-[12px]">
              <span className="text-[#6E6E73]">
                Read by <strong>{selectedNotice.acknowledgement_count}</strong> residents
              </span>
              <span className="text-[#10B981] font-semibold">
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
          <span className="px-2.5 py-0.5 rounded-full bg-[#10B981]/10 text-[#10B981] text-[11px] font-semibold">
            Community Event
          </span>
        }
      >
        {selectedEvent && (
          <div className="space-y-4">
            <p className="text-[14px] text-[#1D1D1F] leading-relaxed">
              {selectedEvent.description}
            </p>
            <div className="grid grid-cols-2 gap-3 p-4 rounded-[14px] bg-[#F5F5F7] border border-black/[0.06] text-[12px]">
              <div>
                <span className="text-[#6E6E73] block">Venue & Time</span>
                <strong className="text-[#1D1D1F]">
                  {selectedEvent.location_label} •{' '}
                  {new Date(selectedEvent.starts_at).toLocaleDateString('en-SG')}
                </strong>
              </div>
              <div>
                <span className="text-[#6E6E73] block">Attendance</span>
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
            <span className="px-2.5 py-0.5 rounded-full bg-[#8B5CF6]/10 text-[#8B5CF6] text-[11px] font-semibold capitalize">
              {selectedExchange.exchange_mode.replace(/_/g, ' ')}
            </span>
          )
        }
      >
        {selectedExchange && (
          <div className="space-y-4">
            <p className="text-[14px] text-[#1D1D1F] leading-relaxed">
              {selectedExchange.description}
            </p>
            <div className="grid grid-cols-2 gap-3 p-4 rounded-[14px] bg-[#F5F5F7] border border-black/[0.06] text-[12px]">
              <div>
                <span className="text-[#6E6E73] block">Price / Deposit</span>
                <strong className="text-[#0071E3]">
                  {selectedExchange.price_paise > 0
                    ? formatPaiseToINR(selectedExchange.price_paise)
                    : selectedExchange.deposit_paise > 0
                    ? `Deposit ${formatPaiseToINR(selectedExchange.deposit_paise)}`
                    : 'Free'}
                </strong>
              </div>
              <div>
                <span className="text-[#6E6E73] block">Handover</span>
                <strong className="text-[#1D1D1F]">{selectedExchange.handover_options}</strong>
              </div>
            </div>
            <div className="flex justify-end">
              <Link
                href="/social-service"
                className="h-[40px] px-5 rounded-full bg-[#0071E3] hover:bg-[#0077ED] text-white text-[13px] font-semibold inline-flex items-center gap-1.5"
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
          <span className="px-2.5 py-0.5 rounded-full bg-[#EF4444]/10 text-[#EF4444] text-[11px] font-semibold">
            Active Safety Advisory
          </span>
        }
      >
        {selectedIncident && (
          <div className="space-y-4">
            <p className="text-[14px] text-[#1D1D1F] leading-relaxed">
              {selectedIncident.safe_guidance_public_text}
            </p>
            {selectedIncident.restricted_responder_details && (
              <div className="p-4 rounded-[14px] bg-[#EF4444]/5 border border-[#EF4444]/30 text-[12px] text-[#EF4444]">
                <strong>Authorized Responder Detail:</strong>{' '}
                {selectedIncident.restricted_responder_details}
              </div>
            )}
            <div className="flex justify-end">
              <Link
                href="/safety"
                className="h-[40px] px-5 rounded-full bg-[#EF4444] text-white text-[13px] font-semibold inline-flex items-center gap-1.5"
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
          <span className="px-2.5 py-0.5 rounded-full bg-[#F59E0B]/15 text-[#D97706] text-[11px] font-semibold">
            Awaiting Buyer Approval
          </span>
        }
      >
        {selectedOrder && (
          <div className="space-y-4">
            <div className="p-4 rounded-[14px] bg-[#F5F5F7] border border-black/[0.06] space-y-1.5">
              <div className="text-[13px] text-[#6E6E73]">
                Original Total: <strong>{formatPaiseToINR(selectedOrder.total_paise)}</strong>
              </div>
              <div className="text-[15px] font-bold text-[#D97706]">
                Revised Total:{' '}
                {formatPaiseToINR(
                  selectedOrder.proposed_total_paise ?? selectedOrder.total_paise
                )}
              </div>
              <p className="text-[13px] text-[#1D1D1F] pt-1">
                {selectedOrder.price_change_reason}
              </p>
            </div>
            <div className="flex justify-end">
              <Link
                href="/shops"
                className="h-[40px] px-5 rounded-full bg-[#10B981] text-white text-[13px] font-semibold inline-flex items-center gap-1.5"
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
