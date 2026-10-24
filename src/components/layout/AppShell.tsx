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
  Lock,
  LayoutGrid,
  X,
  ChevronRight,
  Bell,
  ShieldCheck,
  LogOut,
  KeyRound,
  UserPlus,
} from 'lucide-react';
import type { BuildingInfo, CommunityBootstrapState } from '@/lib/types/domain';
import {
  logoutAction,
  triggerSOSIncidentAction,
} from '@/app/actions/community-actions';
import { MyCircleLogo } from '@/components/layout/MyCircleLogo';
import { AuthPortalClient } from '@/components/auth/AuthPortalClient';

interface AppShellProps {
  bootstrap: CommunityBootstrapState;
  children: React.ReactNode;
}

const RESIDENT_NAV = [
  {
    href: '/',
    label: 'Home Dashboard',
    shortLabel: 'Home',
    icon: Home,
    color: 'text-[#6366F1]',
    tileBg: 'bg-[#6366F1]/10 text-[#6366F1]',
  },
  {
    href: '/community',
    label: 'Directory & Feed',
    shortLabel: 'Directory',
    icon: Users,
    color: 'text-[#0EA5E9]',
    tileBg: 'bg-[#0EA5E9]/10 text-[#0EA5E9]',
  },
  {
    href: '/shops',
    label: 'Local Shops & Rx',
    shortLabel: 'Shops',
    icon: ShoppingBag,
    color: 'text-[#10B981]',
    tileBg: 'bg-[#10B981]/10 text-[#10B981]',
  },
  {
    href: '/social-service',
    label: 'Social Exchange',
    shortLabel: 'Exchange',
    icon: HeartHandshake,
    color: 'text-[#8B5CF6]',
    tileBg: 'bg-[#8B5CF6]/10 text-[#8B5CF6]',
  },
  {
    href: '/services',
    label: 'Service Providers',
    shortLabel: 'Services',
    icon: Wrench,
    color: 'text-[#F59E0B]',
    tileBg: 'bg-[#F59E0B]/10 text-[#F59E0B]',
  },
  {
    href: '/help-complaints',
    label: 'Help & Complaints',
    shortLabel: 'Helpdesk',
    icon: FileWarning,
    color: 'text-[#EC4899]',
    tileBg: 'bg-[#EC4899]/10 text-[#EC4899]',
  },
  {
    href: '/safety',
    label: 'Safety & CCTV',
    shortLabel: 'Safety',
    icon: ShieldAlert,
    color: 'text-[#EF4444]',
    tileBg: 'bg-[#EF4444]/10 text-[#EF4444]',
  },
  {
    href: '/account',
    label: 'My Profile',
    shortLabel: 'Profile',
    icon: UserCheck,
    color: 'text-[#6366F1]',
    tileBg: 'bg-[#6366F1]/10 text-[#6366F1]',
  },
];

export function AppShell({ bootstrap, children }: AppShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [sosModalOpen, setSosModalOpen] = useState(false);

  // SOS Hold-to-Send & Form State
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
  const isUnauthenticated = bootstrap.membership_status === 'unauthenticated';
  const isAuthRoute =
    pathname === '/login' || pathname === '/register' || pathname === '/forgot-password';

  function handleLogout() {
    setMobileMenuOpen(false);
    startTransition(async () => {
      await logoutAction();
      router.push('/login');
      router.refresh();
    });
  }

  // Strictly Gate All Content Until User Logs In
  if (isUnauthenticated) {
    const authMode =
      pathname === '/register'
        ? 'register'
        : pathname === '/forgot-password'
        ? 'forgot'
        : 'login';

    return (
      <div className="min-h-screen flex flex-col bg-[#FAFAFA] text-[#0A0A0A] genesis-dot-grid">
        <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#E8E8EC]">
          <div className="max-w-[1200px] mx-auto px-4 sm:px-6 h-[60px] flex items-center justify-between">
            <Link href="/login" aria-label="MyCircle Home">
              <MyCircleLogo size="md" showBadge={true} />
            </Link>
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className={`inline-flex items-center gap-1.5 h-[36px] px-3.5 rounded-[8px] text-[13px] font-medium transition ${
                  authMode === 'login'
                    ? 'bg-[#6366F1] text-white'
                    : 'bg-white border border-[#E8E8EC] text-[#0A0A0A] hover:border-[#6366F1]'
                }`}
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>Sign In</span>
              </Link>
              <Link
                href="/register"
                className={`inline-flex items-center gap-1.5 h-[36px] px-3.5 rounded-[8px] text-[13px] font-medium transition ${
                  authMode === 'register'
                    ? 'bg-[#10B981] text-white'
                    : 'bg-white border border-[#E8E8EC] text-[#0A0A0A] hover:border-[#10B981]'
                }`}
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Register</span>
              </Link>
            </div>
          </div>
        </header>
        <main className="flex-1">
          <AuthPortalClient initialMode={authMode} buildings={buildings} />
        </main>
      </div>
    );
  }

  // Role-scoped workspaces: only show workspaces the logged-in user is authorised to use
  const isPrimaryAdmin = Boolean(
    actor?.role_grants?.some((r) => r.role_type === 'primary_admin' || r.module_scope === 'all')
  );
  const isAdminOrSubAdmin = (actor?.role_grants?.length ?? 0) > 0;
  const isShopMember = (actor?.shop_memberships?.length ?? 0) > 0 || isPrimaryAdmin;
  const isProvider = (actor?.provider_memberships?.length ?? 0) > 0 || isPrimaryAdmin;
  const isStaff = Boolean(actor?.staff_profile) || isPrimaryAdmin;

  const allowedWorkspaces = [
    ...(isAdminOrSubAdmin
      ? [
          {
            href: '/workspaces/admin',
            label: isPrimaryAdmin ? 'Admin Console' : 'Sub-Admin Desk',
            icon: Building2,
            color: 'bg-[#6366F1] text-white',
          },
        ]
      : []),
    ...(isShopMember
      ? [
          {
            href: '/workspaces/shop',
            label: 'Shop & Pharmacy Desk',
            icon: Store,
            color: 'bg-[#10B981] text-white',
          },
        ]
      : []),
    ...(isProvider
      ? [
          {
            href: '/workspaces/provider',
            label: 'Service Provider Desk',
            icon: Briefcase,
            color: 'bg-[#F59E0B] text-white',
          },
        ]
      : []),
    ...(isStaff
      ? [
          {
            href: '/workspaces/staff',
            label: 'Staff & Responder Duty',
            icon: Radio,
            color: 'bg-[#EF4444] text-white',
          },
        ]
      : []),
  ];

  const activeRoleSummary =
    actor?.role_grants && actor.role_grants.length > 0
      ? actor.role_grants[0].title_label
      : actor?.shop_memberships && actor.shop_memberships.length > 0
      ? `${actor.shop_memberships[0].shop_name}`
      : actor?.provider_memberships && actor.provider_memberships.length > 0
      ? actor.provider_memberships[0].display_name
      : actor?.staff_profile
      ? `Security Staff`
      : `Resident (${actor?.building_code ?? 'Verified'})`;

  const initials = (actor?.display_name || 'MC')
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

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
            ? 'Active SOS alert already recorded within the last 60 seconds.'
            : 'Emergency alert dispatched to on-duty security responders.'
        );
        router.refresh();
      } else {
        setSosFeedback(`Error: ${res.error}`);
      }
    });
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#FAFAFA] text-[#0A0A0A] genesis-dot-grid">
      {/* Sticky Top App Header — Compact on Mobile, Full on Desktop */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#E8E8EC]">
        <div className="max-w-[1280px] mx-auto px-3.5 sm:px-6 h-[58px] flex items-center justify-between gap-2">
          {/* Logo Left */}
          <Link href="/" aria-label="MyCircle Home">
            <MyCircleLogo size="sm" showBadge={false} />
          </Link>

          {/* Right Controls: User Profile Pill, Notifications, SOS Alert & Sign Out */}
          <div className="flex items-center gap-2">
            {/* Logged-in User Profile Pill */}
            <Link
              href="/account"
              className="flex items-center gap-2 pl-1.5 pr-2.5 py-1 rounded-full bg-[#FAFAFA] border border-[#E8E8EC] hover:border-[#6366F1] transition"
            >
              <span className="w-7 h-7 rounded-full bg-gradient-to-br from-[#6366F1] to-[#4F46E5] text-white text-[11px] font-bold flex items-center justify-center">
                {initials}
              </span>
              <div className="hidden sm:flex flex-col text-left leading-tight">
                <span className="text-[12px] font-medium text-[#0A0A0A]">
                  {actor?.display_name}
                </span>
                <span className="text-[10px] text-[#6366F1] font-medium">
                  {activeRoleSummary}
                </span>
              </div>
            </Link>

            {/* Notification Bell */}
            <Link
              href="/account"
              title="Notifications"
              aria-label={`Notifications (${notificationCount})`}
              className="relative inline-flex items-center justify-center w-9 h-9 rounded-[10px] bg-white border border-[#E8E8EC] hover:border-[#6366F1] text-[#0A0A0A] transition"
            >
              <Bell className="w-4 h-4 text-[#6B6B6B]" />
              {notificationCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#6366F1] text-white text-[10px] font-mono font-bold flex items-center justify-center">
                  {notificationCount}
                </span>
              )}
            </Link>

            {/* Colorful Emergency SOS Button */}
            <button
              type="button"
              onClick={() => {
                setSosFeedback(null);
                setHoldProgress(0);
                setSosModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 h-9 px-3 rounded-[10px] bg-gradient-to-r from-[#EF4444] to-[#DC2626] hover:from-[#DC2626] hover:to-[#B91C1C] text-white font-medium text-[12px] shadow-2xs transition cursor-pointer"
              aria-label="Open Emergency SOS"
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>SOS</span>
            </button>

            {/* Desktop Sign Out Button */}
            <button
              type="button"
              onClick={handleLogout}
              disabled={isPending}
              title="Sign Out"
              className="hidden sm:inline-flex items-center gap-1.5 h-9 px-3 rounded-[10px] bg-white border border-[#E8E8EC] hover:border-[#EF4444] text-[#6B6B6B] hover:text-[#EF4444] text-[12px] font-medium transition cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Layout Container */}
      <div className="flex-1 max-w-[1280px] w-full mx-auto px-3.5 sm:px-6 py-4 sm:py-6 flex gap-6">
        {/* Clean Desktop Sidebar */}
        <aside className="hidden lg:flex flex-col w-60 shrink-0 gap-4">
          <div className="bg-white border border-[#E8E8EC] rounded-[14px] p-3.5">
            <div className="text-[11px] font-mono uppercase tracking-wider text-[#9C9C9C] px-2.5 mb-2">
              Community Menu
            </div>
            <nav className="space-y-1" aria-label="Primary Navigation">
              {RESIDENT_NAV.map((item) => {
                const Icon = item.icon;
                const active = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    prefetch={true}
                    className={`flex items-center justify-between px-3 py-2.5 rounded-[8px] text-[14px] font-medium transition ${
                      active
                        ? 'bg-gradient-to-r from-[#6366F1] to-[#4F46E5] text-white shadow-2xs'
                        : 'text-[#6B6B6B] hover:text-[#0A0A0A] hover:bg-[#FAFAFA]'
                    }`}
                  >
                    <span className="flex items-center gap-2.5">
                      <Icon className={`w-4 h-4 shrink-0 ${active ? 'text-white' : item.color}`} />
                      <span>{item.label}</span>
                    </span>
                    {active && <ChevronRight className="w-3.5 h-3.5 text-white/80" />}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Role Workspaces: ONLY visible if the logged-in user has an Admin, Shop, Provider, or Staff role */}
          {allowedWorkspaces.length > 0 && (
            <div className="bg-white border border-[#E8E8EC] rounded-[14px] p-3.5 space-y-2">
              <div className="text-[11px] font-mono uppercase tracking-wider text-[#9C9C9C] px-2">
                My Role Workspace
              </div>
              <nav className="space-y-1.5" aria-label="Role Workspaces">
                {allowedWorkspaces.map((ws) => {
                  const Icon = ws.icon;
                  const active = pathname === ws.href;
                  return (
                    <Link
                      key={ws.href}
                      href={ws.href}
                      prefetch={true}
                      className={`flex items-center justify-between px-3 py-2.5 rounded-[8px] text-[13px] font-medium transition ${
                        active
                          ? ws.color
                          : 'bg-[#FAFAFA] text-[#0A0A0A] border border-[#E8E8EC] hover:border-[#6366F1]'
                      }`}
                    >
                      <span className="flex items-center gap-2.5">
                        <Icon className="w-4 h-4 shrink-0" />
                        <span>{ws.label}</span>
                      </span>
                      <ChevronRight className="w-3.5 h-3.5 opacity-70" />
                    </Link>
                  );
                })}
              </nav>
            </div>
          )}
        </aside>

        {/* Primary Viewport */}
        <main className="flex-1 min-w-0 pb-24 lg:pb-12">
          {bootstrap.access_denied && !isAuthRoute ? (
            /* Pending / Suspended Membership Screen */
            <div className="max-w-lg mx-auto my-10 bg-white border border-[#E8E8EC] rounded-[16px] p-6 sm:p-8 text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-[#F59E0B]/15 text-[#F59E0B] flex items-center justify-center mx-auto">
                <Lock className="w-6 h-6" />
              </div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[12px] font-medium bg-[#F59E0B]/15 text-[#D97706]">
                <ShieldCheck className="w-3.5 h-3.5" />
                Account Status: {bootstrap.membership_status.toUpperCase()}
              </span>
              <h1 className="text-[22px] font-display font-bold text-[#0A0A0A]">
                Membership Verification Pending
              </h1>
              <p className="text-[14px] text-[#6B6B6B] leading-relaxed">
                Hello <strong className="text-[#0A0A0A]">{actor?.display_name}</strong>.{' '}
                {bootstrap.membership_reason}
              </p>
              <div className="pt-2 flex justify-center gap-3">
                <button
                  type="button"
                  onClick={handleLogout}
                  className="h-[40px] px-5 rounded-[8px] bg-[#6366F1] hover:bg-[#4F46E5] text-white font-medium text-[14px] cursor-pointer"
                >
                  Sign Out & Switch Account
                </button>
              </div>
            </div>
          ) : (
            children
          )}
        </main>
      </div>

      {/* Native-Style Mobile App Bottom Navigation Bar */}
      <nav
        aria-label="Mobile Primary Navigation"
        className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-md border-t border-[#E8E8EC] px-2 py-1.5 flex items-center justify-around shadow-lg"
      >
        {[RESIDENT_NAV[0], RESIDENT_NAV[1], RESIDENT_NAV[2], RESIDENT_NAV[3]].map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              prefetch={true}
              onClick={() => setMobileMenuOpen(false)}
              className={`min-h-[46px] min-w-[62px] flex flex-col items-center justify-center gap-0.5 px-2.5 py-1 rounded-[12px] text-[11px] font-medium transition ${
                active
                  ? 'bg-[#6366F1] text-white shadow-2xs'
                  : 'text-[#6B6B6B] hover:text-[#0A0A0A]'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{item.shortLabel}</span>
            </Link>
          );
        })}
        <button
          type="button"
          onClick={() => setMobileMenuOpen((prev) => !prev)}
          className={`min-h-[46px] min-w-[62px] flex flex-col items-center justify-center gap-0.5 px-2.5 py-1 rounded-[12px] text-[11px] font-medium transition cursor-pointer ${
            mobileMenuOpen ? 'bg-[#0A0A0A] text-white' : 'text-[#6B6B6B] hover:text-[#0A0A0A]'
          }`}
        >
          <LayoutGrid className="w-4 h-4" />
          <span>App Menu</span>
        </button>
      </nav>

      {/* Mobile App Slide-Up Bottom Sheet Menu */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-end lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        >
          <div
            className="w-full bg-white rounded-t-[24px] p-5 pb-8 space-y-4 border-t border-[#E8E8EC] shadow-2xl max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Pull Handle */}
            <div className="w-10 h-1.5 rounded-full bg-[#E8E8EC] mx-auto" />

            {/* User Header inside Mobile Sheet */}
            <div className="flex items-center justify-between pb-3 border-b border-[#E8E8EC]">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#6366F1] to-[#4F46E5] text-white text-xs font-bold flex items-center justify-center">
                  {initials}
                </div>
                <div>
                  <div className="text-[14px] font-display font-bold text-[#0A0A0A]">
                    {actor?.display_name}
                  </div>
                  <div className="text-[11px] text-[#6366F1] font-medium">
                    {activeRoleSummary}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 rounded-full bg-[#FAFAFA] border border-[#E8E8EC] text-[#6B6B6B]"
                aria-label="Close menu"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* 2-Column Colorful App Launcher Grid */}
            <div>
              <div className="text-[11px] font-mono uppercase tracking-wider text-[#9C9C9C] mb-2">
                MyCircle Modules
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                {RESIDENT_NAV.map((item) => {
                  const Icon = item.icon;
                  const active = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-2.5 p-3 rounded-[12px] border text-[13px] font-medium transition ${
                        active
                          ? 'bg-[#6366F1] text-white border-[#6366F1]'
                          : 'bg-[#FAFAFA] text-[#0A0A0A] border-[#E8E8EC]'
                      }`}
                    >
                      <div
                        className={`w-8 h-8 rounded-[8px] flex items-center justify-center shrink-0 ${
                          active ? 'bg-white/20 text-white' : item.tileBg
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className="truncate">{item.shortLabel}</span>
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* Role Workspaces inside Mobile App Sheet */}
            {allowedWorkspaces.length > 0 && (
              <div className="pt-2 border-t border-[#E8E8EC] space-y-2">
                <div className="text-[11px] font-mono uppercase tracking-wider text-[#9C9C9C]">
                  My Role Workspaces
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {allowedWorkspaces.map((ws) => {
                    const Icon = ws.icon;
                    return (
                      <Link
                        key={ws.href}
                        href={ws.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className={`flex items-center justify-between px-3.5 py-2.5 rounded-[10px] text-[13px] font-medium ${ws.color}`}
                      >
                        <span className="flex items-center gap-2">
                          <Icon className="w-4 h-4" />
                          <span>{ws.label}</span>
                        </span>
                        <ChevronRight className="w-4 h-4 opacity-80" />
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Sign Out Button */}
            <div className="pt-2 border-t border-[#E8E8EC]">
              <button
                type="button"
                onClick={handleLogout}
                className="w-full h-[42px] rounded-[10px] bg-[#EF4444]/10 text-[#EF4444] text-[13px] font-semibold flex items-center justify-center gap-2 cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out of MyCircle</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SOS Emergency Modal */}
      {sosModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="sos-modal-title"
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
        >
          <div className="bg-white border border-[#EF4444] rounded-[16px] max-w-lg w-full p-6 shadow-lg space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="icon-box-md bg-[#EF4444]/10 text-[#EF4444]">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h2 id="sos-modal-title" className="text-[18px] font-display font-bold text-[#0A0A0A]">
                    Emergency SOS Alert
                  </h2>
                  <p className="text-[12px] text-[#6B6B6B]">
                    Alerts on-duty security responders immediately
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSosModalOpen(false)}
                className="p-2 rounded-[8px] text-[#6B6B6B] hover:bg-[#FAFAFA] cursor-pointer"
                aria-label="Close SOS Modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 rounded-[10px] bg-[#EF4444]/5 border border-[#EF4444]/25 space-y-2">
              <div className="text-[12px] font-medium text-[#EF4444] flex items-center gap-1.5">
                <PhoneCall className="w-3.5 h-3.5" />
                <span>Emergency Helpline Numbers:</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[12px] font-medium">
                <a
                  href="tel:112"
                  className="px-2.5 py-2 rounded-[6px] bg-white border border-[#EF4444]/40 text-[#EF4444] text-center hover:bg-[#EF4444]/10"
                >
                  112 (Emergency)
                </a>
                <a
                  href="tel:101"
                  className="px-2.5 py-2 rounded-[6px] bg-white border border-[#EF4444]/40 text-[#EF4444] text-center hover:bg-[#EF4444]/10"
                >
                  101 (Fire)
                </a>
                <a
                  href="tel:108"
                  className="px-2.5 py-2 rounded-[6px] bg-white border border-[#EF4444]/40 text-[#EF4444] text-center hover:bg-[#EF4444]/10"
                >
                  108 (Ambulance)
                </a>
                <a
                  href="tel:+919820000025"
                  className="px-2.5 py-2 rounded-[6px] bg-white border border-[#EF4444]/40 text-[#EF4444] text-center hover:bg-[#EF4444]/10"
                >
                  Main Gate
                </a>
              </div>
            </div>

            <div className="space-y-3 text-[13px]">
              <div>
                <label className="block font-medium text-[#0A0A0A] mb-1">Emergency Type</label>
                <select
                  value={sosCategory}
                  onChange={(e) => setSosCategory(e.target.value as typeof sosCategory)}
                  className="w-full rounded-[8px] border border-[#E8E8EC] px-3.5 py-2.5 text-[14px] bg-white"
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
                    className="w-full rounded-[8px] border border-[#E8E8EC] px-3.5 py-2.5 text-[14px] bg-white"
                  >
                    {buildings.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-medium text-[#0A0A0A] mb-1">Floor / Location</label>
                  <input
                    type="text"
                    value={sosFloor}
                    onChange={(e) => setSosFloor(e.target.value)}
                    placeholder="e.g. 7th Floor"
                    className="w-full rounded-[8px] border border-[#E8E8EC] px-3.5 py-2.5 text-[14px]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-[#0A0A0A] mb-1">Area / Lift</label>
                  <input
                    type="text"
                    value={sosLiftOrArea}
                    onChange={(e) => setSosLiftOrArea(e.target.value)}
                    placeholder="e.g. Lift #2"
                    className="w-full rounded-[8px] border border-[#E8E8EC] px-3.5 py-2.5 text-[14px]"
                  />
                </div>
                <div>
                  <label className="block font-medium text-[#0A0A0A] mb-1">Note for Security</label>
                  <input
                    type="text"
                    value={sosNotes}
                    onChange={(e) => setSosNotes(e.target.value)}
                    placeholder="Optional note"
                    className="w-full rounded-[8px] border border-[#E8E8EC] px-3.5 py-2.5 text-[14px]"
                  />
                </div>
              </div>
            </div>

            {sosFeedback && (
              <div className="p-3 rounded-[8px] bg-[#10B981]/10 border border-[#10B981]/30 text-[12px] text-[#0A0A0A] font-medium">
                {sosFeedback}
              </div>
            )}

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
              className="relative overflow-hidden w-full h-[44px] rounded-[8px] bg-gradient-to-r from-[#EF4444] to-[#DC2626] hover:from-[#DC2626] hover:to-[#B91C1C] text-white font-medium text-[14px] cursor-pointer"
            >
              <span
                className="absolute inset-y-0 left-0 bg-black/25 transition-all"
                style={{ width: `${holdProgress}%` }}
              />
              <span className="relative z-10">
                {holdProgress > 0 && holdProgress < 100
                  ? `Hold to Dispatch SOS (${holdProgress}%)`
                  : 'Send Emergency SOS Alert'}
              </span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
