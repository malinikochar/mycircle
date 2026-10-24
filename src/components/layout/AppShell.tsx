'use client';

import React, { useState, useTransition, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Home,
  Users,
  ShoppingBag,
  Wrench,
  HeartHandshake,
  FileWarning,
  ShieldAlert,
  UserCheck,
  Building2,
  Store,
  Briefcase,
  Radio,
  AlertTriangle,
  PhoneCall,
  CheckCircle2,
  Lock,
  Sparkles,
  Menu,
  X,
  ChevronRight,
} from 'lucide-react';
import type { BuildingInfo, CommunityBootstrapState } from '@/lib/types/domain';
import { switchPersonaAction, triggerSOSIncidentAction } from '@/app/actions/community-actions';

interface AppShellProps {
  bootstrap: CommunityBootstrapState;
  children: React.ReactNode;
}

const RESIDENT_NAV = [
  { href: '/', label: 'Home', shortLabel: 'Home', icon: Home },
  { href: '/community', label: 'Community & Directory', shortLabel: 'Community', icon: Users },
  { href: '/shops', label: 'Local Shops & Rx', shortLabel: 'Shops', icon: ShoppingBag },
  { href: '/social-service', label: 'Social Service', shortLabel: 'Social Service', icon: HeartHandshake },
  { href: '/services', label: 'Service Providers', shortLabel: 'Services', icon: Wrench },
  { href: '/help-complaints', label: 'Help & Complaints', shortLabel: 'Cases', icon: FileWarning },
  { href: '/safety', label: 'Safety, Staff & CCTV', shortLabel: 'Safety', icon: ShieldAlert },
  { href: '/account', label: 'Account & Privacy', shortLabel: 'Account', icon: UserCheck },
];

const WORKSPACE_NAV = [
  { href: '/workspaces/admin', label: 'Admin & 10 Sub-Admins', badge: 'Scoped Governance', icon: Building2 },
  { href: '/workspaces/shop', label: 'Shop & Pharmacy Desk', badge: 'Orders & Invoices', icon: Store },
  { href: '/workspaces/provider', label: 'Service Provider Desk', badge: 'Quotes & Jobs', icon: Briefcase },
  { href: '/workspaces/staff', label: 'Staff & Responder Duty', badge: 'Shifts, SOS & GPS', icon: Radio },
];

export function AppShell({ bootstrap, children }: AppShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [mobileMoreOpen, setMobileMoreOpen] = useState(false);
  const [sosModalOpen, setSosModalOpen] = useState(false);

  // SOS Hold-to-Send & Form State (SOS-01, SOS-02)
  const [sosCategory, setSosCategory] = useState<
    'medical' | 'fire_smoke' | 'security_threat' | 'lift_entrapment' | 'urgent_hazard'
  >('lift_entrapment');
  const [sosBuildingId, setSosBuildingId] = useState<string>(
    bootstrap.actor?.building_id ?? '22222222-2222-4222-8222-222222222202'
  );
  const [sosFloor, setSosFloor] = useState('7th Floor / Lift #2');
  const [sosLiftOrArea, setSosLiftOrArea] = useState('Passenger Lift #2');
  const [sosNotes, setSosNotes] = useState('');
  const [holdProgress, setHoldProgress] = useState(0);
  const [sosFeedback, setSosFeedback] = useState<string | null>(null);
  const holdIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const actor = bootstrap.actor;
  const buildings: BuildingInfo[] = bootstrap.buildings ?? [];

  function handlePersonaChange(newPersonaId: string) {
    startTransition(async () => {
      await switchPersonaAction(newPersonaId);
      router.refresh();
    });
  }

  function startHoldToSend() {
    if (holdIntervalRef.current) clearInterval(holdIntervalRef.current);
    let current = 0;
    holdIntervalRef.current = setInterval(() => {
      current += 10;
      setHoldProgress(current);
      if (current >= 100) {
        if (holdIntervalRef.current) clearInterval(holdIntervalRef.current);
        submitSOSAlert();
      }
    }, 120);
  }

  function cancelHoldToSend() {
    if (holdIntervalRef.current) {
      clearInterval(holdIntervalRef.current);
      holdIntervalRef.current = null;
    }
    if (holdProgress < 100) {
      setHoldProgress(0);
    }
  }

  function submitSOSAlert() {
    startTransition(async () => {
      const res = await triggerSOSIncidentAction({
        category: sosCategory,
        buildingId: sosBuildingId,
        manualFloor: sosFloor,
        manualLiftOrArea: sosLiftOrArea,
        notes: sosNotes,
      });
      if (res.ok) {
        setSosFeedback(
          res.data?.deduplicated
            ? 'Active SOS incident already recorded within the last 60 seconds (Deduplicated per SOS-02).'
            : 'Emergency incident persisted to database and dispatched to on-duty responders. Note: External SMS gateway is in Demo Mode; use direct emergency call buttons below if urgent.'
        );
        router.refresh();
      } else {
        setSosFeedback(`Error: ${res.error}`);
      }
    });
  }

  const activeRoleSummary =
    actor?.role_grants && actor.role_grants.length > 0
      ? actor.role_grants[0].title_label
      : actor?.shop_memberships && actor.shop_memberships.length > 0
      ? `${actor.shop_memberships[0].shop_name} (${actor.shop_memberships[0].role})`
      : actor?.provider_memberships && actor.provider_memberships.length > 0
      ? actor.provider_memberships[0].display_name
      : actor?.staff_profile
      ? `On-Duty Staff (${actor.staff_profile.staff_code})`
      : `Resident (${actor?.building_code ?? 'Verified'})`;

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF8F5] text-[#1E293B]">
      {/* Top Governance & Persona Bar */}
      <header className="sticky top-0 z-40 bg-[#0F172A] text-white border-b border-slate-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-2.5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="w-9 h-9 rounded-lg bg-[#0D9488] flex items-center justify-center font-bold text-white shadow-inner">
                CC
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold tracking-tight text-base text-white">CommunityCircle</span>
                  <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-teal-950/90 text-teal-300 border border-teal-700/60">
                    <Sparkles className="w-3 h-3" />
                    {bootstrap.community?.name ?? 'Serenity Heights'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-300">
                  {bootstrap.community?.city ?? 'Mumbai'} •{' '}
                  <span className="tabular-nums font-semibold text-teal-300">
                    {bootstrap.community?.total_members ?? 1000}
                  </span>{' '}
                  Members • Supabase RLS Enforced
                </p>
              </div>
            </Link>
          </div>

          {/* Persona Switcher & Persistent SOS Trigger */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="flex items-center gap-2 bg-slate-900/90 border border-slate-700 rounded-lg px-2.5 py-1.5">
              <label htmlFor="persona-select" className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">
                Acting Persona:
              </label>
              <select
                id="persona-select"
                aria-label="Switch Acting Persona"
                disabled={isPending}
                value={actor?.id ?? ''}
                onChange={(e) => handlePersonaChange(e.target.value)}
                className="bg-transparent text-xs font-semibold text-teal-200 focus:outline-none cursor-pointer max-w-[230px] sm:max-w-[310px] truncate"
              >
                <optgroup label="Core Residents & Primary Admin" className="bg-slate-900 text-white">
                  {bootstrap.personas
                    .filter((p) =>
                      [
                        '00000000-0000-4000-8000-000000000001',
                        '00000000-0000-4000-8000-000000000002',
                        '00000000-0000-4000-8000-000000000003',
                      ].includes(p.id)
                    )
                    .map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.display_name} — {p.roles[0]?.title_label ?? p.profession}
                      </option>
                    ))}
                </optgroup>
                <optgroup label="10 Permission-Scoped Sub-Admins (Test 2)" className="bg-slate-900 text-white">
                  {bootstrap.personas
                    .filter((p) => p.roles.some((r) => r.role_type === 'sub_admin'))
                    .map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.display_name} — {p.roles[0]?.title_label}
                      </option>
                    ))}
                </optgroup>
                <optgroup label="Local Shops, Pharmacy, Providers & Security Staff" className="bg-slate-900 text-white">
                  {bootstrap.personas
                    .filter((p) => p.is_shop_member || p.is_provider || p.is_staff)
                    .map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.display_name} — {p.profession}
                      </option>
                    ))}
                </optgroup>
                <optgroup label="Access Gate Verification (Pending & Suspended — Test 1)" className="bg-slate-900 text-amber-300">
                  {bootstrap.personas
                    .filter((p) => p.membership_status !== 'approved')
                    .map((p) => (
                      <option key={p.id} value={p.id}>
                        [{p.membership_status.toUpperCase()}] {p.display_name}
                      </option>
                    ))}
                </optgroup>
              </select>
            </div>

            <button
              type="button"
              onClick={() => {
                setSosFeedback(null);
                setHoldProgress(0);
                setSosModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#DC2626] hover:bg-red-700 text-white font-bold text-xs shadow-sm transition cursor-pointer"
              aria-label="Open Emergency SOS Coordinator"
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>SOS Alert</span>
            </button>
          </div>
        </div>

        {/* Active Role & Workspace Context Strip */}
        <div className="bg-slate-900/95 border-t border-slate-800/80 px-4 py-1.5 text-xs">
          <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-slate-300">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-400" />
              <span>Active Session:</span>
              <strong className="text-white">{actor?.display_name}</strong>
              <span className="text-slate-400">•</span>
              <span className="text-teal-300 font-medium">{activeRoleSummary}</span>
              {actor?.unit_number && (
                <span className="hidden md:inline text-slate-400">
                  • Own Unit: {actor.building_code}-{actor.unit_number} (Hidden from directory unless opted in)
                </span>
              )}
            </div>
            <div className="flex items-center gap-3 text-[11px] text-slate-400">
              <span>Demo Adapters: Clearly Labelled</span>
              {isPending && <span className="text-amber-300 font-semibold animate-pulse">Syncing with Supabase...</span>}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Layout: Desktop Sidebar + Main Canvas */}
      <div className="flex-1 max-w-7xl w-full mx-auto flex">
        {/* Desktop Navigation Sidebar */}
        <aside className="hidden lg:flex flex-col w-64 shrink-0 border-r border-[#E5DEC9] bg-[#F3EFEA]/70 p-4 gap-6">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-[#475569] px-2.5 mb-2">
              Resident Community
            </div>
            <nav className="space-y-1" aria-label="Resident Navigation">
              {RESIDENT_NAV.map((item) => {
                const Icon = item.icon;
                const active = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition ${
                      active
                        ? 'bg-[#0F766E] text-white shadow-xs'
                        : 'text-[#1E293B] hover:bg-[#E5DEC9]/60'
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="border-t border-[#E5DEC9] pt-4">
            <div className="text-[11px] font-bold uppercase tracking-wider text-[#475569] px-2.5 mb-2">
              Separated Role Workspaces
            </div>
            <nav className="space-y-1.5" aria-label="Role Workspaces">
              {WORKSPACE_NAV.map((ws) => {
                const Icon = ws.icon;
                const active = pathname === ws.href;
                return (
                  <Link
                    key={ws.href}
                    href={ws.href}
                    className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition border ${
                      active
                        ? 'bg-[#0F172A] text-white border-[#0F172A]'
                        : 'bg-white text-[#0F172A] border-[#E5DEC9] hover:border-[#0F766E]'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <Icon className="w-3.5 h-3.5 text-[#0F766E]" />
                      <span>{ws.label}</span>
                    </span>
                    <ChevronRight className="w-3.5 h-3.5 opacity-60" />
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="mt-auto rounded-xl bg-white border border-[#E5DEC9] p-3.5 text-xs space-y-1.5">
            <div className="font-bold text-[#0F172A] flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-[#0F766E]" />
              <span>Privacy & Safety Guarantees</span>
            </div>
            <p className="text-[#475569] leading-relaxed">
              Personal phones, flat numbers, prescriptions, staff GPS coordinates, and CCTV grants are enforced on the server via Supabase RLS.
            </p>
          </div>
        </aside>

        {/* Primary Viewport */}
        <main className="flex-1 min-w-0 p-4 sm:p-6 pb-24 lg:pb-10">
          {bootstrap.access_denied ? (
            /* Membership Gate Enforcement Screen (Phase 0 / Test 1) */
            <div className="max-w-2xl mx-auto my-8 bg-white border-2 border-amber-600/40 rounded-2xl p-6 sm:p-8 shadow-sm space-y-5">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
                  <Lock className="w-6 h-6" />
                </div>
                <div>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold uppercase bg-amber-100 text-amber-900">
                    Server Membership Gate Enforced • Status: {bootstrap.membership_status}
                  </span>
                  <h1 className="text-xl sm:text-2xl font-bold text-[#0F172A] mt-2">
                    Protected Community Data Is Restricted
                  </h1>
                  <p className="text-sm text-[#475569] mt-1">
                    Acting as <strong>{actor?.display_name}</strong> ({actor?.building_name ?? 'Applicant'}).
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-[#FAF8F5] border border-[#E5DEC9] text-sm space-y-2">
                <div className="font-semibold text-[#0F172A]">Server Gate Reason (Supabase RLS & RPC Check):</div>
                <p className="text-[#475569]">{bootstrap.membership_reason}</p>
                <p className="text-xs text-[#475569]">
                  Zero directory profiles, posts, shop orders, Social Service listings, complaints, staff locations, or CCTV cameras were returned by the server for this session (PRD Acceptance Test 1).
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => handlePersonaChange('00000000-0000-4000-8000-000000000002')}
                  className="px-4 py-2.5 rounded-lg bg-[#0F766E] hover:bg-[#115E59] text-white font-semibold text-sm cursor-pointer"
                >
                  Switch to Approved Resident (Priya Nair)
                </button>
                <button
                  type="button"
                  onClick={() => handlePersonaChange('00000000-0000-4000-8000-000000000011')}
                  className="px-4 py-2.5 rounded-lg bg-[#0F172A] hover:bg-slate-800 text-white font-semibold text-sm cursor-pointer"
                >
                  Switch to Membership Sub-Admin (Neha Deshmukh)
                </button>
              </div>
            </div>
          ) : (
            children
          )}
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar (Section 4.1: Home, Community, Shops, Social Service, More) */}
      <nav
        aria-label="Mobile Primary Navigation"
        className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-white border-t border-[#E5DEC9] px-2 py-1.5 flex items-center justify-around shadow-lg"
      >
        {[RESIDENT_NAV[0], RESIDENT_NAV[1], RESIDENT_NAV[2], RESIDENT_NAV[3]].map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-0.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold ${
                active ? 'text-[#0F766E]' : 'text-[#475569]'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span>{item.shortLabel}</span>
            </Link>
          );
        })}
        <button
          type="button"
          onClick={() => setMobileMoreOpen(true)}
          className="flex flex-col items-center gap-0.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold text-[#475569] cursor-pointer"
        >
          <Menu className="w-5 h-5" />
          <span>More</span>
        </button>
      </nav>

      {/* Mobile "More" Drawer */}
      {mobileMoreOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 flex justify-end lg:hidden">
          <div className="w-80 max-w-full bg-[#FAF8F5] h-full p-5 overflow-y-auto space-y-5">
            <div className="flex items-center justify-between border-b border-[#E5DEC9] pb-3">
              <span className="font-bold text-[#0F172A]">All Modules & Workspaces</span>
              <button
                type="button"
                onClick={() => setMobileMoreOpen(false)}
                className="p-1.5 rounded-lg bg-white border border-[#E5DEC9]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-1">
              {RESIDENT_NAV.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMoreOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium text-[#0F172A] hover:bg-white"
                  >
                    <Icon className="w-4 h-4 text-[#0F766E]" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
            <div className="border-t border-[#E5DEC9] pt-3 space-y-1.5">
              <div className="text-xs font-bold uppercase text-[#475569] px-2">Role Workspaces</div>
              {WORKSPACE_NAV.map((ws) => {
                const Icon = ws.icon;
                return (
                  <Link
                    key={ws.href}
                    href={ws.href}
                    onClick={() => setMobileMoreOpen(false)}
                    className="flex items-center justify-between px-3 py-2.5 rounded-lg bg-white border border-[#E5DEC9] text-xs font-semibold"
                  >
                    <span className="flex items-center gap-2">
                      <Icon className="w-4 h-4 text-[#0F766E]" />
                      <span>{ws.label}</span>
                    </span>
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Accessible Hold-to-Send SOS Modal (SOS-01..08) */}
      {sosModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="sos-modal-title"
          className="fixed inset-0 z-50 bg-slate-950/75 flex items-center justify-center p-4 overflow-y-auto"
        >
          <div className="bg-white border-2 border-[#DC2626] rounded-2xl max-w-lg w-full p-5 sm:p-6 shadow-xl space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-red-100 text-[#DC2626] flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div>
                  <h2 id="sos-modal-title" className="text-lg font-bold text-[#0F172A]">
                    Emergency SOS & Responder Alert
                  </h2>
                  <p className="text-xs text-[#475569]">
                    Persists incident before fan-out • Sanitises public alert • Direct call fallback
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSosModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 cursor-pointer"
                aria-label="Close SOS Modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Direct Phone Call Links for Life-Safety (SOS-07) */}
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 space-y-2">
              <div className="text-xs font-bold text-red-900 flex items-center gap-1.5">
                <PhoneCall className="w-3.5 h-3.5" />
                <span>Immediate Life-Safety Call Links (Do not rely solely on app connectivity):</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-bold">
                <a
                  href="tel:112"
                  className="px-2.5 py-1.5 rounded-lg bg-white border border-red-300 text-red-800 text-center hover:bg-red-100"
                >
                  Call 112 (Emergency)
                </a>
                <a
                  href="tel:101"
                  className="px-2.5 py-1.5 rounded-lg bg-white border border-red-300 text-red-800 text-center hover:bg-red-100"
                >
                  Call 101 (Fire)
                </a>
                <a
                  href="tel:108"
                  className="px-2.5 py-1.5 rounded-lg bg-white border border-red-300 text-red-800 text-center hover:bg-red-100"
                >
                  Call 108 (Ambulance)
                </a>
                <a
                  href="tel:+919820000025"
                  className="px-2.5 py-1.5 rounded-lg bg-white border border-red-300 text-red-800 text-center hover:bg-red-100"
                >
                  Main Gate Desk
                </a>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-[#0F172A] mb-1">Emergency Category</label>
                <select
                  value={sosCategory}
                  onChange={(e) => setSosCategory(e.target.value as typeof sosCategory)}
                  className="w-full rounded-lg border border-[#E5DEC9] px-3 py-2 text-sm bg-white"
                >
                  <option value="lift_entrapment">Lift / Elevator Entrapment</option>
                  <option value="medical">Medical Emergency</option>
                  <option value="fire_smoke">Fire / Smoke Hazard</option>
                  <option value="security_threat">Security Threat / Intrusion</option>
                  <option value="urgent_hazard">Urgent Structural / Electrical Hazard</option>
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#0F172A] mb-1">Building / Tower</label>
                  <select
                    value={sosBuildingId}
                    onChange={(e) => setSosBuildingId(e.target.value)}
                    className="w-full rounded-lg border border-[#E5DEC9] px-3 py-2 text-sm bg-white"
                  >
                    {buildings.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-[#0F172A] mb-1">
                    Manual Floor Label (SOS-02)
                  </label>
                  <input
                    type="text"
                    value={sosFloor}
                    onChange={(e) => setSosFloor(e.target.value)}
                    placeholder="e.g. Between 4th & 5th Floor"
                    className="w-full rounded-lg border border-[#E5DEC9] px-3 py-2 text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#0F172A] mb-1">
                    Lift Car or Area Label
                  </label>
                  <input
                    type="text"
                    value={sosLiftOrArea}
                    onChange={(e) => setSosLiftOrArea(e.target.value)}
                    placeholder="e.g. Passenger Lift #2"
                    className="w-full rounded-lg border border-[#E5DEC9] px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[#0F172A] mb-1">
                    Responder Note (Restricted to Responders)
                  </label>
                  <input
                    type="text"
                    value={sosNotes}
                    onChange={(e) => setSosNotes(e.target.value)}
                    placeholder="Optional medical or access note"
                    className="w-full rounded-lg border border-[#E5DEC9] px-3 py-2 text-sm"
                  />
                </div>
              </div>
            </div>

            {sosFeedback && (
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-300 text-xs text-amber-950 font-medium">
                {sosFeedback}
              </div>
            )}

            <div className="space-y-2 pt-1">
              <button
                type="button"
                onMouseDown={startHoldToSend}
                onMouseUp={cancelHoldToSend}
                onMouseLeave={cancelHoldToSend}
                onTouchStart={startHoldToSend}
                onTouchEnd={cancelHoldToSend}
                onClick={() => {
                  // Accessible single-click/keyboard fallback if user activates via Enter/Space
                  if (holdProgress === 0) submitSOSAlert();
                }}
                className="relative overflow-hidden w-full py-3 rounded-xl bg-[#DC2626] hover:bg-red-700 text-white font-bold text-sm shadow-md cursor-pointer"
              >
                <span
                  className="absolute inset-y-0 left-0 bg-red-950/40 transition-all"
                  style={{ width: `${holdProgress}%` }}
                />
                <span className="relative z-10">
                  {holdProgress > 0 && holdProgress < 100
                    ? `Hold to Dispatch SOS (${holdProgress}%)`
                    : 'Hold 1.2s or Press Enter to Dispatch SOS Alert'}
                </span>
              </button>
              <p className="text-[11px] text-[#475569] text-center">
                Responders receive your unit and phone; general residents receive only a sanitised area safety notice (SOS-04).
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
