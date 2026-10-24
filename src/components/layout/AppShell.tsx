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
  Menu,
  X,
  ChevronRight,
  Search,
  Bell,
  ShieldCheck,
  Database,
  RefreshCw,
  KeyRound,
  UserPlus,
} from 'lucide-react';
import type { BuildingInfo, CommunityBootstrapState } from '@/lib/types/domain';
import { switchPersonaAction, triggerSOSIncidentAction } from '@/app/actions/community-actions';
import { MyCircleLogo } from '@/components/layout/MyCircleLogo';

interface AppShellProps {
  bootstrap: CommunityBootstrapState;
  children: React.ReactNode;
}

const RESIDENT_NAV = [
  { href: '/', label: 'Home Overview', shortLabel: 'Home', icon: Home },
  { href: '/community', label: 'Community & Directory', shortLabel: 'Community', icon: Users },
  { href: '/shops', label: 'Local Shops & Rx', shortLabel: 'Shops', icon: ShoppingBag },
  { href: '/social-service', label: 'Social Service', shortLabel: 'Exchange', icon: HeartHandshake },
  { href: '/services', label: 'Service Providers', shortLabel: 'Services', icon: Wrench },
  { href: '/help-complaints', label: 'Help & Complaints', shortLabel: 'Cases', icon: FileWarning },
  { href: '/safety', label: 'Safety, Staff & CCTV', shortLabel: 'Safety', icon: ShieldAlert },
  { href: '/account', label: 'My Profile & Privacy', shortLabel: 'Profile', icon: UserCheck },
];

const WORKSPACE_NAV = [
  { href: '/workspaces/admin', label: 'Admin & 10 Sub-Admins', badge: 'Governance', icon: Building2 },
  { href: '/workspaces/shop', label: 'Shop & Pharmacy Desk', badge: 'Orders & Rx', icon: Store },
  { href: '/workspaces/provider', label: 'Service Provider Desk', badge: 'Quotes & Jobs', icon: Briefcase },
  { href: '/workspaces/staff', label: 'Staff & Responder Duty', badge: 'SOS & GPS', icon: Radio },
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
  const notificationCount = bootstrap.notifications?.length ?? 0;
  const isAuthRoute = pathname === '/login' || pathname === '/register';

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
    <div className="min-h-screen flex flex-col bg-[#FAFAFA] text-[#0A0A0A] genesis-dot-grid">
      {/* Genesis Sticky Top Navigation: 56px height, backdrop-blur, 1px #E8E8EC bottom border */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-[#E8E8EC]">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 min-h-[56px] py-2 flex flex-wrap items-center justify-between gap-3">
          {/* Logo Left: Custom Professional MyCircle Vector Logo */}
          <div className="flex items-center gap-3">
            <Link href="/" aria-label="MyCircle Home">
              <MyCircleLogo size="md" showBadge={true} />
            </Link>
          </div>

          {/* Center / Right: Rounded-XL Search-Style Persona Switcher, Auth Links, Notifications & SOS */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-2 bg-[#FAFAFA] border border-[#E8E8EC] rounded-[12px] px-3 py-1.5 hover:border-[#6366F1]/60 transition">
              <Search className="w-3.5 h-3.5 text-[#6366F1] shrink-0" />
              <label
                htmlFor="persona-select"
                className="text-[11px] uppercase tracking-wider text-[#6B6B6B] font-medium hidden md:inline"
              >
                Persona:
              </label>
              <select
                id="persona-select"
                aria-label="Switch Acting Persona"
                disabled={isPending}
                value={actor?.id ?? ''}
                onChange={(e) => handlePersonaChange(e.target.value)}
                className="genesis-nav-select bg-transparent text-[13px] font-medium text-[#0A0A0A] focus:outline-none cursor-pointer max-w-[175px] sm:max-w-[240px] truncate"
              >
                <optgroup label="Active & Core Residents / Admin">
                  {bootstrap.personas
                    .filter(
                      (p) =>
                        [
                          '00000000-0000-4000-8000-000000000001',
                          '00000000-0000-4000-8000-000000000002',
                          '00000000-0000-4000-8000-000000000003',
                        ].includes(p.id) ||
                        (!p.id.startsWith('00000000-0000-4000-8000-0000000000') &&
                          p.membership_status === 'approved')
                    )
                    .map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.display_name} — {p.roles[0]?.title_label ?? p.profession}
                      </option>
                    ))}
                </optgroup>
                <optgroup label="10 Permission-Scoped Sub-Admins (Test 2)">
                  {bootstrap.personas
                    .filter((p) => p.roles.some((r) => r.role_type === 'sub_admin'))
                    .map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.display_name} — {p.roles[0]?.title_label}
                      </option>
                    ))}
                </optgroup>
                <optgroup label="Local Shops, Pharmacy, Providers & Security Staff">
                  {bootstrap.personas
                    .filter((p) => p.is_shop_member || p.is_provider || p.is_staff)
                    .map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.display_name} — {p.profession}
                      </option>
                    ))}
                </optgroup>
                <optgroup label="Access Gate Verification (Pending & Suspended — Test 1)">
                  {bootstrap.personas
                    .filter((p) => p.membership_status !== 'approved')
                    .map((p) => (
                      <option key={p.id} value={p.id}>
                        [{p.membership_status.toUpperCase()}] {p.display_name}
                      </option>
                    ))}
                </optgroup>
              </select>
              <kbd className="hidden xl:inline-block text-[11px] font-mono px-1.5 py-0.5 rounded-[4px] bg-white border border-[#E8E8EC] text-[#9C9C9C]">
                ⌘K
              </kbd>
            </div>

            {/* Sign In & Register Buttons */}
            <Link
              href="/login"
              className={`inline-flex items-center gap-1.5 h-9 px-3 rounded-[6px] text-[13px] font-medium border transition ${
                pathname === '/login'
                  ? 'bg-[#0A0A0A] text-white border-[#0A0A0A]'
                  : 'bg-white text-[#0A0A0A] border-[#E8E8EC] hover:border-[#6366F1]'
              }`}
            >
              <KeyRound className="w-3.5 h-3.5 text-[#6366F1]" />
              <span>Login</span>
            </Link>

            <Link
              href="/register"
              className={`hidden sm:inline-flex items-center gap-1.5 h-9 px-3 rounded-[6px] text-[13px] font-medium border transition ${
                pathname === '/register'
                  ? 'bg-[#6366F1] text-white border-[#6366F1]'
                  : 'bg-white text-[#0A0A0A] border-[#E8E8EC] hover:border-[#6366F1]'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5 text-[#10B981]" />
              <span>Register</span>
            </Link>

            {/* Notification Bell & Profile Link */}
            <Link
              href="/account"
              title="My Profile, Privacy & Notifications"
              aria-label={`Profile & Notifications (${notificationCount})`}
              className="relative inline-flex items-center justify-center w-9 h-9 rounded-[6px] bg-white border border-[#E8E8EC] hover:border-[#6366F1] text-[#0A0A0A] transition"
            >
              <Bell className="w-4 h-4 text-[#6B6B6B]" />
              {notificationCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#6366F1] text-white text-[10px] font-mono font-bold flex items-center justify-center">
                  {notificationCount}
                </span>
              )}
            </Link>

            {/* Genesis Destructive Button: Red text with red border, 6px radius */}
            <button
              type="button"
              onClick={() => {
                setSosFeedback(null);
                setHoldProgress(0);
                setSosModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-[6px] bg-[#EF4444]/10 hover:bg-[#EF4444] text-[#EF4444] hover:text-white border border-[#EF4444] font-medium text-[13px] transition cursor-pointer"
              aria-label="Open Emergency SOS Coordinator"
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>SOS Alert</span>
            </button>
          </div>
        </div>

        {/* Subtle Metadata Context Bar */}
        <div className="bg-[#FAFAFA]/95 border-t border-[#E8E8EC] px-4 sm:px-6 py-1.5 text-[12px]">
          <div className="max-w-[1280px] mx-auto flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-[#6B6B6B] flex-wrap">
              <span className="inline-block w-2 h-2 rounded-full bg-[#10B981]" />
              <span className="font-medium text-[#0A0A0A]">
                {bootstrap.community?.name ?? 'Serenity Heights'}
              </span>
              <span className="text-[#9C9C9C]">•</span>
              <Link
                href="/account"
                className="text-[#0A0A0A] font-medium hover:text-[#6366F1] transition"
              >
                {actor?.display_name}
              </Link>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] bg-[#6366F1]/10 text-[#6366F1] font-medium">
                <ShieldCheck className="w-3 h-3" />
                {activeRoleSummary}
              </span>
              {actor?.unit_number && (
                <span className="hidden md:inline-flex items-center gap-1 text-[#6B6B6B] font-mono text-[11px] bg-white px-2 py-0.5 rounded border border-[#E8E8EC]">
                  <Building2 className="w-3 h-3 text-[#6366F1]" />
                  Unit {actor.building_code}-{actor.unit_number}
                </span>
              )}
            </div>
            <div className="flex items-center gap-3 text-[11px] text-[#6B6B6B] font-mono">
              <span className="inline-flex items-center gap-1">
                <Users className="w-3 h-3 text-[#6366F1]" />
                {bootstrap.community?.total_members ?? 1000} MEMBERS
              </span>
              <span className="text-[#9C9C9C]">•</span>
              <span className="inline-flex items-center gap-1">
                <Database className="w-3 h-3 text-[#10B981]" />
                SUPABASE RLS
              </span>
              {isPending && (
                <span className="inline-flex items-center gap-1 text-[#6366F1] font-medium">
                  <RefreshCw className="w-3 h-3 animate-spin" />
                  SYNCING...
                </span>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Container: 1280px max width with 24px horizontal padding */}
      <div className="flex-1 max-w-[1280px] w-full mx-auto px-4 sm:px-6 py-6 sm:py-8 flex gap-6">
        {/* Desktop Navigation Sidebar */}
        <aside className="hidden lg:flex flex-col w-64 shrink-0 gap-5">
          <div className="bg-white border border-[#E8E8EC] rounded-[12px] p-4">
            <div className="text-[11px] font-mono uppercase tracking-wider text-[#9C9C9C] px-2.5 mb-2.5 flex items-center justify-between">
              <span>Resident Modules</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#FAFAFA] border border-[#E8E8EC]">8</span>
            </div>
            <nav className="space-y-1" aria-label="Resident Navigation">
              {RESIDENT_NAV.map((item) => {
                const Icon = item.icon;
                const active = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center justify-between px-3 py-2 rounded-[6px] text-[14px] font-medium transition ${
                      active
                        ? 'bg-[#6366F1] text-white shadow-2xs'
                        : 'text-[#6B6B6B] hover:text-[#0A0A0A] hover:bg-[#FAFAFA]'
                    }`}
                  >
                    <span className="flex items-center gap-2.5">
                      <Icon className={`w-4 h-4 shrink-0 ${active ? 'text-white' : 'text-[#6366F1]'}`} />
                      <span>{item.label}</span>
                    </span>
                    {active && <ChevronRight className="w-3.5 h-3.5 text-white/80" />}
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="bg-white border border-[#E8E8EC] rounded-[12px] p-4">
            <div className="text-[11px] font-mono uppercase tracking-wider text-[#9C9C9C] px-2.5 mb-2.5 flex items-center justify-between">
              <span>Role Workspaces</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#FAFAFA] border border-[#E8E8EC]">4</span>
            </div>
            <nav className="space-y-1.5" aria-label="Role Workspaces">
              {WORKSPACE_NAV.map((ws) => {
                const Icon = ws.icon;
                const active = pathname === ws.href;
                return (
                  <Link
                    key={ws.href}
                    href={ws.href}
                    className={`flex items-center justify-between px-3 py-2.5 rounded-[6px] text-[13px] font-medium transition border ${
                      active
                        ? 'bg-[#6366F1] text-white border-[#6366F1]'
                        : 'bg-[#FAFAFA] text-[#0A0A0A] border-[#E8E8EC] hover:border-[#6366F1]'
                    }`}
                  >
                    <span className="flex items-center gap-2.5">
                      <Icon className={`w-4 h-4 shrink-0 ${active ? 'text-white' : 'text-[#6366F1]'}`} />
                      <span>{ws.label}</span>
                    </span>
                    <ChevronRight className="w-3.5 h-3.5 opacity-60" />
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Account & Auth Quick Card in Sidebar */}
          <div className="bg-white border border-[#E8E8EC] rounded-[12px] p-4 space-y-2.5">
            <div className="text-[11px] font-mono uppercase tracking-wider text-[#9C9C9C] px-1">
              Authentication & Access
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Link
                href="/login"
                className="flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-[6px] bg-[#0A0A0A] hover:bg-[#6366F1] text-white text-[12px] font-medium transition"
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>Sign In</span>
              </Link>
              <Link
                href="/register"
                className="flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-[6px] bg-[#FAFAFA] border border-[#E8E8EC] hover:border-[#6366F1] text-[#0A0A0A] text-[12px] font-medium transition"
              >
                <UserPlus className="w-3.5 h-3.5 text-[#10B981]" />
                <span>Register</span>
              </Link>
            </div>
          </div>

          <div className="bg-white border border-[#E8E8EC] rounded-[12px] p-4 text-[12px] space-y-2">
            <div className="font-medium text-[#0A0A0A] flex items-center gap-2">
              <div className="icon-box-sm bg-[#10B981]/10 text-[#10B981]">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <span>Server-Enforced Privacy</span>
            </div>
            <p className="text-[#6B6B6B] leading-relaxed">
              Personal phones, flat numbers, prescriptions, staff GPS coordinates, and CCTV grants are protected by Supabase RLS.
            </p>
          </div>
        </aside>

        {/* Primary Viewport */}
        <main className="flex-1 min-w-0 pb-24 lg:pb-12">
          {bootstrap.access_denied && !isAuthRoute ? (
            /* Membership Gate Enforcement Screen (Phase 0 / Test 1) */
            <div className="max-w-2xl mx-auto my-8 bg-white border border-[#E8E8EC] rounded-[12px] p-6 sm:p-8 space-y-5">
              <div className="flex items-start gap-4">
                <div className="icon-box-lg bg-[#F59E0B]/10 text-[#F59E0B]">
                  <Lock className="w-6 h-6" />
                </div>
                <div>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[12px] font-medium bg-[#F59E0B]/15 text-[#F59E0B]">
                    <ShieldAlert className="w-3.5 h-3.5" />
                    Server Membership Gate • Status: {bootstrap.membership_status}
                  </span>
                  <h1 className="text-[24px] font-display font-bold text-[#0A0A0A] mt-2">
                    Protected Community Data Is Restricted
                  </h1>
                  <p className="text-[15px] text-[#6B6B6B] mt-1">
                    Acting as <strong className="text-[#0A0A0A]">{actor?.display_name}</strong> ({actor?.building_name ?? 'Applicant'}).
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-[8px] bg-[#FAFAFA] border border-[#E8E8EC] text-[14px] space-y-2">
                <div className="font-medium text-[#0A0A0A]">Server Gate Reason (Supabase RLS & RPC Check):</div>
                <p className="text-[#6B6B6B]">{bootstrap.membership_reason}</p>
                <p className="text-[12px] text-[#9C9C9C]">
                  Zero directory profiles, posts, shop orders, Social Service listings, complaints, staff locations, or CCTV cameras were returned by the server for this session (PRD Acceptance Test 1).
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => handlePersonaChange('00000000-0000-4000-8000-000000000002')}
                  className="genesis-btn-primary h-[38px] px-4 rounded-[6px] bg-[#6366F1] hover:bg-[#4F46E5] text-white font-medium text-[14px] cursor-pointer"
                >
                  Switch to Approved Resident (Priya Nair)
                </button>
                <button
                  type="button"
                  onClick={() => handlePersonaChange('00000000-0000-4000-8000-000000000011')}
                  className="h-[38px] px-4 rounded-[6px] bg-white border border-[#E8E8EC] hover:border-[#6366F1] text-[#0A0A0A] font-medium text-[14px] cursor-pointer"
                >
                  Switch to Membership Sub-Admin (Neha Deshmukh)
                </button>
                <Link
                  href="/login"
                  className="h-[38px] px-4 rounded-[6px] bg-[#0A0A0A] text-white font-medium text-[14px] inline-flex items-center gap-1.5"
                >
                  <KeyRound className="w-4 h-4" />
                  <span>Open Login Portal</span>
                </Link>
              </div>
            </div>
          ) : (
            children
          )}
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar — Minimum 44x44px touch targets per UI/UX Pro Max */}
      <nav
        aria-label="Mobile Primary Navigation"
        className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-md border-t border-[#E8E8EC] px-2 py-1 flex items-center justify-around"
      >
        {[RESIDENT_NAV[0], RESIDENT_NAV[1], RESIDENT_NAV[2], RESIDENT_NAV[7]].map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`min-h-[44px] min-w-[60px] flex flex-col items-center justify-center gap-0.5 px-2.5 py-1 rounded-[6px] text-[11px] font-medium ${
                active ? 'text-[#6366F1] bg-[#6366F1]/8' : 'text-[#6B6B6B]'
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
          className="min-h-[44px] min-w-[60px] flex flex-col items-center justify-center gap-0.5 px-2.5 py-1 rounded-[6px] text-[11px] font-medium text-[#6B6B6B] cursor-pointer"
        >
          <Menu className="w-5 h-5" />
          <span>More</span>
        </button>
      </nav>

      {/* Mobile "More" Drawer */}
      {mobileMoreOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex justify-end lg:hidden">
          <div className="w-80 max-w-full bg-white h-full p-5 overflow-y-auto space-y-5 border-l border-[#E8E8EC]">
            <div className="flex items-center justify-between border-b border-[#E8E8EC] pb-3">
              <MyCircleLogo size="sm" showBadge={false} />
              <button
                type="button"
                onClick={() => setMobileMoreOpen(false)}
                className="p-2 rounded-[6px] bg-[#FAFAFA] border border-[#E8E8EC]"
                aria-label="Close navigation menu"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Link
                href="/login"
                onClick={() => setMobileMoreOpen(false)}
                className="flex items-center justify-center gap-1.5 py-2 rounded-[6px] bg-[#0A0A0A] text-white text-[13px] font-medium"
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>Sign In</span>
              </Link>
              <Link
                href="/register"
                onClick={() => setMobileMoreOpen(false)}
                className="flex items-center justify-center gap-1.5 py-2 rounded-[6px] bg-[#6366F1] text-white text-[13px] font-medium"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Register</span>
              </Link>
            </div>
            <div className="space-y-1">
              {RESIDENT_NAV.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMoreOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2.5 rounded-[6px] text-[14px] font-medium text-[#0A0A0A] hover:bg-[#FAFAFA]"
                  >
                    <Icon className="w-4 h-4 text-[#6366F1]" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
            <div className="border-t border-[#E8E8EC] pt-3 space-y-1.5">
              <div className="text-[11px] font-mono uppercase text-[#9C9C9C] px-2">Role Workspaces</div>
              {WORKSPACE_NAV.map((ws) => {
                const Icon = ws.icon;
                return (
                  <Link
                    key={ws.href}
                    href={ws.href}
                    onClick={() => setMobileMoreOpen(false)}
                    className="flex items-center justify-between px-3 py-2.5 rounded-[6px] bg-[#FAFAFA] border border-[#E8E8EC] text-[13px] font-medium"
                  >
                    <span className="flex items-center gap-2">
                      <Icon className="w-4 h-4 text-[#6366F1]" />
                      <span>{ws.label}</span>
                    </span>
                    <ChevronRight className="w-4 h-4 text-[#9C9C9C]" />
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
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
        >
          <div className="bg-white border border-[#EF4444] rounded-[12px] max-w-lg w-full p-6 shadow-lg space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="icon-box-md bg-[#EF4444]/10 text-[#EF4444]">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h2 id="sos-modal-title" className="text-[18px] font-display font-bold text-[#0A0A0A]">
                    Emergency SOS & Responder Alert
                  </h2>
                  <p className="text-[12px] text-[#6B6B6B]">
                    Persists incident before fan-out • Sanitises public alert • Direct call fallback
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSosModalOpen(false)}
                className="p-2 rounded-[6px] text-[#6B6B6B] hover:bg-[#FAFAFA] cursor-pointer"
                aria-label="Close SOS Modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Direct Phone Call Links for Life-Safety (SOS-07) */}
            <div className="p-3 rounded-[8px] bg-[#EF4444]/5 border border-[#EF4444]/25 space-y-2">
              <div className="text-[12px] font-medium text-[#EF4444] flex items-center gap-1.5">
                <PhoneCall className="w-3.5 h-3.5" />
                <span>Immediate Life-Safety Call Links (Do not rely solely on app connectivity):</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[12px] font-medium">
                <a
                  href="tel:112"
                  className="px-2.5 py-2 rounded-[6px] bg-white border border-[#EF4444]/40 text-[#EF4444] text-center hover:bg-[#EF4444]/10"
                >
                  Call 112 (Emergency)
                </a>
                <a
                  href="tel:101"
                  className="px-2.5 py-2 rounded-[6px] bg-white border border-[#EF4444]/40 text-[#EF4444] text-center hover:bg-[#EF4444]/10"
                >
                  Call 101 (Fire)
                </a>
                <a
                  href="tel:108"
                  className="px-2.5 py-2 rounded-[6px] bg-white border border-[#EF4444]/40 text-[#EF4444] text-center hover:bg-[#EF4444]/10"
                >
                  Call 108 (Ambulance)
                </a>
                <a
                  href="tel:+919820000025"
                  className="px-2.5 py-2 rounded-[6px] bg-white border border-[#EF4444]/40 text-[#EF4444] text-center hover:bg-[#EF4444]/10"
                >
                  Main Gate Desk
                </a>
              </div>
            </div>

            <div className="space-y-3 text-[13px]">
              <div>
                <label className="block font-medium text-[#0A0A0A] mb-1">Emergency Category</label>
                <select
                  value={sosCategory}
                  onChange={(e) => setSosCategory(e.target.value as typeof sosCategory)}
                  className="w-full rounded-[6px] border border-[#E8E8EC] px-3.5 py-2.5 text-[14px] bg-white"
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
                  <label className="block font-medium text-[#0A0A0A] mb-1">Building / Tower</label>
                  <select
                    value={sosBuildingId}
                    onChange={(e) => setSosBuildingId(e.target.value)}
                    className="w-full rounded-[6px] border border-[#E8E8EC] px-3.5 py-2.5 text-[14px] bg-white"
                  >
                    {buildings.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-medium text-[#0A0A0A] mb-1">
                    Manual Floor Label (SOS-02)
                  </label>
                  <input
                    type="text"
                    value={sosFloor}
                    onChange={(e) => setSosFloor(e.target.value)}
                    placeholder="e.g. Between 4th & 5th Floor"
                    className="w-full rounded-[6px] border border-[#E8E8EC] px-3.5 py-2.5 text-[14px]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-[#0A0A0A] mb-1">
                    Lift Car or Area Label
                  </label>
                  <input
                    type="text"
                    value={sosLiftOrArea}
                    onChange={(e) => setSosLiftOrArea(e.target.value)}
                    placeholder="e.g. Passenger Lift #2"
                    className="w-full rounded-[6px] border border-[#E8E8EC] px-3.5 py-2.5 text-[14px]"
                  />
                </div>
                <div>
                  <label className="block font-medium text-[#0A0A0A] mb-1">
                    Responder Note (Restricted to Responders)
                  </label>
                  <input
                    type="text"
                    value={sosNotes}
                    onChange={(e) => setSosNotes(e.target.value)}
                    placeholder="Optional medical or access note"
                    className="w-full rounded-[6px] border border-[#E8E8EC] px-3.5 py-2.5 text-[14px]"
                  />
                </div>
              </div>
            </div>

            {sosFeedback && (
              <div className="p-3 rounded-[8px] bg-[#F59E0B]/10 border border-[#F59E0B]/30 text-[12px] text-[#0A0A0A] font-medium">
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
                  if (holdProgress === 0) submitSOSAlert();
                }}
                className="relative overflow-hidden w-full h-[44px] rounded-[6px] bg-[#EF4444] hover:bg-red-600 text-white font-medium text-[14px] cursor-pointer"
              >
                <span
                  className="absolute inset-y-0 left-0 bg-black/25 transition-all"
                  style={{ width: `${holdProgress}%` }}
                />
                <span className="relative z-10">
                  {holdProgress > 0 && holdProgress < 100
                    ? `Hold to Dispatch SOS (${holdProgress}%)`
                    : 'Hold 1.2s or Press Enter to Dispatch SOS Alert'}
                </span>
              </button>
              <p className="text-[12px] text-[#6B6B6B] text-center">
                Responders receive your unit and phone; general residents receive only a sanitised area safety notice (SOS-04).
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
