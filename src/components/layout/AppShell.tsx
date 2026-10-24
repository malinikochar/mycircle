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
  CheckCheck,
  Sparkles,
} from 'lucide-react';
import type { BuildingInfo, CommunityBootstrapState, NotificationItem } from '@/lib/types/domain';
import {
  logoutAction,
  markNotificationsReadAction,
  triggerSOSIncidentAction,
} from '@/app/actions/community-actions';
import { MyCircleLogo } from '@/components/layout/MyCircleLogo';
import { AuthPortalClient } from '@/components/auth/AuthPortalClient';
import { MemberAvatar } from '@/components/ui/MemberAvatar';

interface AppShellProps {
  bootstrap: CommunityBootstrapState;
  children: React.ReactNode;
}

const RESIDENT_NAV = [
  {
    href: '/',
    label: 'Overview',
    shortLabel: 'Home',
    icon: Home,
    color: 'text-[#0071E3]',
    tileBg: 'bg-[#0071E3]/10 text-[#0071E3]',
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
    label: 'Help & Cases',
    shortLabel: 'Helpdesk',
    icon: FileWarning,
    color: 'text-[#EC4899]',
    tileBg: 'bg-[#EC4899]/10 text-[#EC4899]',
  },
  {
    href: '/safety',
    label: 'Safety & Bugis Map',
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
  const [notifOpen, setNotifOpen] = useState(false);

  // SOS Hold-to-Send & Form State
  const [sosCategory, setSosCategory] = useState<
    'medical' | 'fire_smoke' | 'security_threat' | 'lift_entrapment' | 'urgent_hazard'
  >('lift_entrapment');
  const [sosBuildingId, setSosBuildingId] = useState<string>(
    bootstrap.actor?.building_id ?? '22222222-2222-4222-8222-222222222202'
  );
  const [sosFloor, setSosFloor] = useState('Level 7 / Lift #2');
  const [sosLiftOrArea, setSosLiftOrArea] = useState('Passenger Lift #2');
  const [sosNotes, setSosNotes] = useState('');
  const [holdProgress, setHoldProgress] = useState(0);
  const [sosFeedback, setSosFeedback] = useState<string | null>(null);
  const holdIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const actor = bootstrap.actor;
  const buildings: BuildingInfo[] = bootstrap.buildings ?? [];
  const isUnauthenticated = bootstrap.membership_status === 'unauthenticated';
  const isAuthRoute =
    pathname === '/login' || pathname === '/register' || pathname === '/forgot-password';

  // Build rich Notification Center items (combining DB notifications + live community feed fallback)
  const dbNotifications: NotificationItem[] = bootstrap.notifications ?? [];
  const fallbackNotifications: NotificationItem[] =
    dbNotifications.length > 0
      ? dbNotifications
      : [
          ...(bootstrap.announcements ?? []).slice(0, 2).map((a) => ({
            id: `ann-${a.id}`,
            category: 'announcement',
            title: a.title,
            safe_preview_body: a.body.slice(0, 90) + '...',
            link_route: '/community',
            is_urgent: a.is_pinned,
            read_at: null,
            created_at: a.published_at,
          })),
          {
            id: 'bugis-patrol-live',
            category: 'sos_alert',
            title: 'Bugis MRT Patrol Active',
            safe_preview_body: '2 security responders active near Victoria St & Bugis Junction.',
            link_route: '/safety',
            is_urgent: false,
            read_at: null,
            created_at: new Date().toISOString(),
          },
        ];

  const unreadCount = fallbackNotifications.filter((n) => !n.read_at).length;

  function handleMarkAllRead() {
    startTransition(async () => {
      await markNotificationsReadAction();
      router.refresh();
    });
  }

  function handleNotificationClick(item: NotificationItem) {
    setNotifOpen(false);
    if (!item.id.startsWith('ann-') && item.id !== 'bugis-patrol-live' && !item.read_at) {
      startTransition(async () => {
        await markNotificationsReadAction(item.id);
      });
    }
    router.push(item.link_route || '/');
  }

  function handleLogout() {
    setMobileMenuOpen(false);
    setNotifOpen(false);
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
      <div className="min-h-screen flex flex-col bg-[#F5F5F7] text-[#1D1D1F]">
        <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-2xl border-b border-black/[0.06]">
          <div className="max-w-[1200px] mx-auto px-5 sm:px-8 h-[64px] flex items-center justify-between">
            <Link href="/login" aria-label="MyCircle Home">
              <MyCircleLogo size="md" showBadge={true} />
            </Link>
            <div className="flex items-center gap-2.5">
              <Link
                href="/login"
                className={`inline-flex items-center gap-1.5 h-[38px] px-4 rounded-full text-[13px] font-medium transition ${
                  authMode === 'login'
                    ? 'bg-[#1D1D1F] text-white shadow-xs'
                    : 'bg-white border border-black/[0.08] text-[#1D1D1F] hover:border-black/25'
                }`}
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>Sign In</span>
              </Link>
              <Link
                href="/register"
                className={`inline-flex items-center gap-1.5 h-[38px] px-4 rounded-full text-[13px] font-medium transition ${
                  authMode === 'register'
                    ? 'bg-[#0071E3] text-white shadow-xs'
                    : 'bg-white border border-black/[0.08] text-[#1D1D1F] hover:border-[#0071E3]'
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

  // Role-scoped workspaces
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
            color: 'bg-[#1D1D1F] text-white',
          },
        ]
      : []),
    ...(isShopMember
      ? [
          {
            href: '/workspaces/shop',
            label: 'Shop & Rx Desk',
            icon: Store,
            color: 'bg-[#10B981] text-white',
          },
        ]
      : []),
    ...(isProvider
      ? [
          {
            href: '/workspaces/provider',
            label: 'Provider Desk',
            icon: Briefcase,
            color: 'bg-[#F59E0B] text-white',
          },
        ]
      : []),
    ...(isStaff
      ? [
          {
            href: '/workspaces/staff',
            label: 'Security & Duty',
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
      : `Resident • ${actor?.building_code ?? 'Bugis'}`;

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
            : 'Emergency alert dispatched to Bugis on-duty security responders.'
        );
        router.refresh();
      } else {
        setSosFeedback(`Error: ${res.error}`);
      }
    });
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#F5F5F7] text-[#1D1D1F]">
      {/* Apple.com Translucent Frosted Glass Sticky Header */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-2xl border-b border-black/[0.06]">
        <div className="max-w-[1340px] mx-auto px-4 sm:px-8 h-[64px] flex items-center justify-between gap-3">
          {/* Logo Left + Singapore Bugis Location Pill */}
          <div className="flex items-center gap-3">
            <Link href="/" aria-label="MyCircle Home">
              <MyCircleLogo size="sm" showBadge={false} />
            </Link>
            <span className="hidden md:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/[0.04] text-[11px] font-medium text-[#6E6E73]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]" />
              Bugis MRT, Singapore
            </span>
          </div>

          {/* Right Controls: User Profile Pill, Working Notification Center, SOS & Sign Out */}
          <div className="flex items-center gap-2.5">
            {/* Logged-in User Profile Pill with Realistic Studio Portrait */}
            <Link
              href="/account"
              className="flex items-center gap-2.5 pl-1.5 pr-3.5 py-1 rounded-full bg-white/90 border border-black/[0.08] hover:border-[#0071E3] shadow-2xs transition"
            >
              <MemberAvatar
                name={actor?.display_name}
                avatarUrl={actor?.avatar_url}
                size="xs"
                showStatusDot
              />
              <div className="hidden sm:flex flex-col text-left leading-tight">
                <span className="text-[12px] font-semibold text-[#1D1D1F]">
                  {actor?.display_name}
                </span>
                <span className="text-[10px] text-[#0071E3] font-medium">
                  {activeRoleSummary}
                </span>
              </div>
            </Link>

            {/* Interactive Notification Bell + Popover */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setNotifOpen((prev) => !prev)}
                title="Notifications"
                aria-label={`Notifications (${unreadCount})`}
                aria-expanded={notifOpen}
                className={`relative inline-flex items-center justify-center w-9 h-9 rounded-full border transition cursor-pointer ${
                  notifOpen
                    ? 'bg-[#1D1D1F] text-white border-[#1D1D1F]'
                    : 'bg-white border-black/[0.08] hover:border-[#0071E3] text-[#1D1D1F]'
                }`}
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-[#0071E3] text-white text-[10px] font-semibold flex items-center justify-center shadow-xs">
                    {unreadCount}
                  </span>
                )}
              </button>

              {notifOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setNotifOpen(false)}
                  />
                  <div
                    role="dialog"
                    aria-label="Notifications"
                    className="absolute right-0 mt-2.5 w-[340px] sm:w-[380px] z-50 bg-white/95 backdrop-blur-2xl border border-black/[0.08] rounded-[22px] shadow-[0_20px_50px_rgba(0,0,0,0.14)] overflow-hidden"
                  >
                    <div className="px-5 py-4 border-b border-black/[0.06] flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <h3 className="text-[15px] font-semibold text-[#1D1D1F]">
                          Notifications
                        </h3>
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[#0071E3]/10 text-[#0071E3]">
                          {unreadCount} unread
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {unreadCount > 0 && (
                          <button
                            type="button"
                            onClick={handleMarkAllRead}
                            disabled={isPending}
                            className="inline-flex items-center gap-1 text-[12px] font-medium text-[#0071E3] hover:underline cursor-pointer"
                          >
                            <CheckCheck className="w-3.5 h-3.5" />
                            <span>Mark all read</span>
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => setNotifOpen(false)}
                          className="p-1 rounded-full text-[#6E6E73] hover:bg-black/[0.05] cursor-pointer"
                          aria-label="Close notifications"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="max-h-[360px] overflow-y-auto divide-y divide-black/[0.05]">
                      {fallbackNotifications.map((item) => {
                        const isUnread = !item.read_at;
                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => handleNotificationClick(item)}
                            className={`w-full text-left px-5 py-4 hover:bg-[#F5F5F7] transition flex items-start gap-3.5 cursor-pointer ${
                              isUnread ? 'bg-[#0071E3]/[0.03]' : ''
                            }`}
                          >
                            <div
                              className={`mt-1 w-2.5 h-2.5 rounded-full shrink-0 ${
                                item.is_urgent
                                  ? 'bg-[#EF4444]'
                                  : isUnread
                                  ? 'bg-[#0071E3]'
                                  : 'bg-[#D2D2D7]'
                              }`}
                            />
                            <div className="flex-1 min-w-0 space-y-1">
                              <div className="flex items-center justify-between gap-2">
                                <span className="text-[13px] font-semibold text-[#1D1D1F] truncate">
                                  {item.title}
                                </span>
                                <span className="text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full bg-black/[0.05] text-[#6E6E73] shrink-0">
                                  {item.category.replace(/_/g, ' ')}
                                </span>
                              </div>
                              <p className="text-[12px] text-[#6E6E73] leading-relaxed line-clamp-2">
                                {item.safe_preview_body}
                              </p>
                            </div>
                          </button>
                        );
                      })}
                    </div>

                    <div className="px-5 py-3 bg-[#F5F5F7] border-t border-black/[0.06] flex items-center justify-between text-[12px]">
                      <span className="text-[#6E6E73] flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-[#0071E3]" />
                        Resend @ensure.in alerts active
                      </span>
                      <Link
                        href="/account"
                        onClick={() => setNotifOpen(false)}
                        className="font-semibold text-[#0071E3] hover:underline"
                      >
                        Alert Settings →
                      </Link>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Emergency SOS Pill Button */}
            <button
              type="button"
              onClick={() => {
                setSosFeedback(null);
                setHoldProgress(0);
                setSosModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-full bg-[#EF4444] hover:bg-[#DC2626] text-white font-semibold text-[12px] shadow-xs transition cursor-pointer"
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
              className="hidden sm:inline-flex items-center gap-1.5 h-9 px-3.5 rounded-full bg-white border border-black/[0.08] hover:border-[#EF4444] text-[#6E6E73] hover:text-[#EF4444] text-[12px] font-medium transition cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Layout Container with Generous Apple-Style Spacing */}
      <div className="flex-1 max-w-[1340px] w-full mx-auto px-4 sm:px-8 py-6 sm:py-8 flex gap-7">
        {/* Clean Apple-Style Desktop Sidebar */}
        <aside className="hidden lg:flex flex-col w-64 shrink-0 gap-5">
          <div className="bg-white/90 backdrop-blur-xl border border-black/[0.06] rounded-[22px] p-4 shadow-[0_4px_24px_rgba(0,0,0,0.03)]">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-[#86868B] px-3 mb-2.5">
              Community
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
                    className={`flex items-center justify-between px-3.5 py-2.5 rounded-[12px] text-[13.5px] font-medium transition ${
                      active
                        ? 'bg-[#1D1D1F] text-white shadow-xs'
                        : 'text-[#515154] hover:text-[#1D1D1F] hover:bg-[#F5F5F7]'
                    }`}
                  >
                    <span className="flex items-center gap-3">
                      <Icon className={`w-4 h-4 shrink-0 ${active ? 'text-white' : item.color}`} />
                      <span>{item.label}</span>
                    </span>
                    {active && <ChevronRight className="w-3.5 h-3.5 text-white/70" />}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Role Workspaces */}
          {allowedWorkspaces.length > 0 && (
            <div className="bg-white/90 backdrop-blur-xl border border-black/[0.06] rounded-[22px] p-4 space-y-2.5 shadow-[0_4px_24px_rgba(0,0,0,0.03)]">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-[#86868B] px-3">
                Workspaces
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
                      className={`flex items-center justify-between px-3.5 py-2.5 rounded-[12px] text-[13px] font-medium transition ${
                        active
                          ? ws.color
                          : 'bg-[#F5F5F7] text-[#1D1D1F] border border-black/[0.06] hover:border-[#0071E3]'
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
        <main className="flex-1 min-w-0 pb-28 lg:pb-14">
          {bootstrap.access_denied && !isAuthRoute ? (
            /* Pending / Suspended Membership Screen */
            <div className="max-w-lg mx-auto my-10 bg-white border border-black/[0.08] rounded-[24px] p-8 text-center space-y-5 shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
              <div className="w-14 h-14 rounded-full bg-[#F59E0B]/15 text-[#F59E0B] flex items-center justify-center mx-auto">
                <Lock className="w-6 h-6" />
              </div>
              <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-[12px] font-semibold bg-[#F59E0B]/15 text-[#D97706]">
                <ShieldCheck className="w-3.5 h-3.5" />
                Account Status: {bootstrap.membership_status.toUpperCase()}
              </span>
              <h1 className="text-[22px] font-semibold tracking-tight text-[#1D1D1F]">
                Membership Verification Pending
              </h1>
              <p className="text-[14px] text-[#6E6E73] leading-relaxed">
                Hello <strong className="text-[#1D1D1F]">{actor?.display_name}</strong>.{' '}
                {bootstrap.membership_reason}
              </p>
              <div className="pt-2 flex justify-center gap-3">
                <button
                  type="button"
                  onClick={handleLogout}
                  className="h-[42px] px-6 rounded-full bg-[#0071E3] hover:bg-[#0077ED] text-white font-medium text-[14px] cursor-pointer"
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
        className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-white/90 backdrop-blur-2xl border-t border-black/[0.08] px-2 py-1.5 flex items-center justify-around shadow-lg"
      >
        {[RESIDENT_NAV[0], RESIDENT_NAV[1], RESIDENT_NAV[2], RESIDENT_NAV[6]].map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              prefetch={true}
              onClick={() => setMobileMenuOpen(false)}
              className={`min-h-[46px] min-w-[64px] flex flex-col items-center justify-center gap-0.5 px-3 py-1 rounded-[14px] text-[11px] font-medium transition ${
                active
                  ? 'bg-[#1D1D1F] text-white shadow-2xs'
                  : 'text-[#6E6E73] hover:text-[#1D1D1F]'
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
          className={`min-h-[46px] min-w-[64px] flex flex-col items-center justify-center gap-0.5 px-3 py-1 rounded-[14px] text-[11px] font-medium transition cursor-pointer ${
            mobileMenuOpen ? 'bg-[#0071E3] text-white' : 'text-[#6E6E73] hover:text-[#1D1D1F]'
          }`}
        >
          <LayoutGrid className="w-4 h-4" />
          <span>Menu</span>
        </button>
      </nav>

      {/* Mobile App Slide-Up Bottom Sheet Menu */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-end lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        >
          <div
            className="w-full bg-white rounded-t-[28px] p-6 pb-9 space-y-5 border-t border-black/[0.08] shadow-2xl max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-10 h-1.5 rounded-full bg-black/15 mx-auto" />

            <div className="flex items-center justify-between pb-4 border-b border-black/[0.06]">
              <div className="flex items-center gap-3">
                <MemberAvatar
                  name={actor?.display_name}
                  avatarUrl={actor?.avatar_url}
                  size="sm"
                  showStatusDot
                />
                <div>
                  <div className="text-[15px] font-semibold text-[#1D1D1F]">
                    {actor?.display_name}
                  </div>
                  <div className="text-[12px] text-[#0071E3] font-medium">
                    {activeRoleSummary}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 rounded-full bg-[#F5F5F7] text-[#6E6E73]"
                aria-label="Close menu"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wider text-[#86868B] mb-2.5">
                Modules
              </div>
              <div className="grid grid-cols-2 gap-3">
                {RESIDENT_NAV.map((item) => {
                  const Icon = item.icon;
                  const active = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-3 p-3.5 rounded-[16px] border text-[13px] font-medium transition ${
                        active
                          ? 'bg-[#1D1D1F] text-white border-[#1D1D1F]'
                          : 'bg-[#F5F5F7] text-[#1D1D1F] border-black/[0.05]'
                      }`}
                    >
                      <div
                        className={`w-8 h-8 rounded-[10px] flex items-center justify-center shrink-0 ${
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

            {allowedWorkspaces.length > 0 && (
              <div className="pt-3 border-t border-black/[0.06] space-y-2.5">
                <div className="text-[11px] font-semibold uppercase tracking-wider text-[#86868B]">
                  Workspaces
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {allowedWorkspaces.map((ws) => {
                    const Icon = ws.icon;
                    return (
                      <Link
                        key={ws.href}
                        href={ws.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className={`flex items-center justify-between px-4 py-3 rounded-[14px] text-[13px] font-medium ${ws.color}`}
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

            <div className="pt-3 border-t border-black/[0.06]">
              <button
                type="button"
                onClick={handleLogout}
                className="w-full h-[44px] rounded-full bg-[#EF4444]/10 text-[#EF4444] text-[13px] font-semibold flex items-center justify-center gap-2 cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
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
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
        >
          <div className="bg-white border border-black/[0.08] rounded-[24px] max-w-lg w-full p-7 shadow-2xl space-y-5">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-[#EF4444]/10 text-[#EF4444] flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h2 id="sos-modal-title" className="text-[18px] font-semibold text-[#1D1D1F]">
                    Emergency SOS Dispatch
                  </h2>
                  <p className="text-[12px] text-[#6E6E73]">
                    Alerts Bugis MRT gate security & Raffles Hospital liaison
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSosModalOpen(false)}
                className="p-2 rounded-full text-[#6E6E73] hover:bg-[#F5F5F7] cursor-pointer"
                aria-label="Close SOS Modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 rounded-[16px] bg-[#EF4444]/5 border border-[#EF4444]/20 space-y-2.5">
              <div className="text-[12px] font-semibold text-[#EF4444] flex items-center gap-1.5">
                <PhoneCall className="w-3.5 h-3.5" />
                <span>Singapore Emergency Helplines:</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[12px] font-medium">
                <a
                  href="tel:999"
                  className="px-2.5 py-2 rounded-[10px] bg-white border border-[#EF4444]/30 text-[#EF4444] text-center hover:bg-[#EF4444]/10"
                >
                  999 (Police)
                </a>
                <a
                  href="tel:995"
                  className="px-2.5 py-2 rounded-[10px] bg-white border border-[#EF4444]/30 text-[#EF4444] text-center hover:bg-[#EF4444]/10"
                >
                  995 (SCDF/Amb)
                </a>
                <a
                  href="tel:+6563111111"
                  className="px-2.5 py-2 rounded-[10px] bg-white border border-[#EF4444]/30 text-[#EF4444] text-center hover:bg-[#EF4444]/10"
                >
                  Raffles Hosp
                </a>
                <a
                  href="tel:+6568200025"
                  className="px-2.5 py-2 rounded-[10px] bg-white border border-[#EF4444]/30 text-[#EF4444] text-center hover:bg-[#EF4444]/10"
                >
                  Bugis Gate
                </a>
              </div>
            </div>

            <div className="space-y-3.5 text-[13px]">
              <div>
                <label className="block font-medium text-[#1D1D1F] mb-1.5">Emergency Type</label>
                <select
                  value={sosCategory}
                  onChange={(e) => setSosCategory(e.target.value as typeof sosCategory)}
                  className="w-full rounded-[12px] border border-black/[0.12] px-3.5 py-2.5 text-[14px] bg-white"
                >
                  <option value="lift_entrapment">Lift / Elevator Entrapment</option>
                  <option value="medical">Medical Emergency</option>
                  <option value="fire_smoke">Fire / Smoke Hazard</option>
                  <option value="security_threat">Security Threat / Intrusion</option>
                  <option value="urgent_hazard">Urgent Structural / Electrical Hazard</option>
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block font-medium text-[#1D1D1F] mb-1.5">Building / Wing</label>
                  <select
                    value={sosBuildingId}
                    onChange={(e) => setSosBuildingId(e.target.value)}
                    className="w-full rounded-[12px] border border-black/[0.12] px-3.5 py-2.5 text-[14px] bg-white"
                  >
                    {buildings.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-medium text-[#1D1D1F] mb-1.5">Floor / Location</label>
                  <input
                    type="text"
                    value={sosFloor}
                    onChange={(e) => setSosFloor(e.target.value)}
                    placeholder="e.g. Level 7"
                    className="w-full rounded-[12px] border border-black/[0.12] px-3.5 py-2.5 text-[14px]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block font-medium text-[#1D1D1F] mb-1.5">Area / Lift</label>
                  <input
                    type="text"
                    value={sosLiftOrArea}
                    onChange={(e) => setSosLiftOrArea(e.target.value)}
                    placeholder="e.g. Lift #2"
                    className="w-full rounded-[12px] border border-black/[0.12] px-3.5 py-2.5 text-[14px]"
                  />
                </div>
                <div>
                  <label className="block font-medium text-[#1D1D1F] mb-1.5">Note for Security</label>
                  <input
                    type="text"
                    value={sosNotes}
                    onChange={(e) => setSosNotes(e.target.value)}
                    placeholder="Optional note"
                    className="w-full rounded-[12px] border border-black/[0.12] px-3.5 py-2.5 text-[14px]"
                  />
                </div>
              </div>
            </div>

            {sosFeedback && (
              <div className="p-3.5 rounded-[12px] bg-[#10B981]/10 border border-[#10B981]/30 text-[12px] text-[#1D1D1F] font-medium">
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
              className="relative overflow-hidden w-full h-[46px] rounded-full bg-[#EF4444] hover:bg-[#DC2626] text-white font-semibold text-[14px] cursor-pointer shadow-md"
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
