'use client';

import React, { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  KeyRound,
  UserPlus,
  ShieldCheck,
  Building2,
  Mail,
  Lock,
  User,
  Phone,
  Briefcase,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Sparkles,
  Store,
  Wrench,
  Radio,
  UserCheck,
  Clock,
} from 'lucide-react';
import type { BuildingInfo, ActorContext } from '@/lib/types/domain';
import {
  loginWithCredentialsAction,
  registerMemberAction,
} from '@/app/actions/community-actions';
import { MyCircleLogo } from '@/components/layout/MyCircleLogo';

export interface DemoCredentialPreset {
  roleBadge: string;
  displayName: string;
  username: string;
  email: string;
  password: string;
  description: string;
  targetRoute: string;
  accentColor: string;
  iconName: 'admin' | 'resident' | 'subadmin' | 'shop' | 'pharmacy' | 'provider' | 'staff' | 'pending';
}

export const DEMO_CREDENTIAL_PRESETS: DemoCredentialPreset[] = [
  {
    roleBadge: 'Primary Admin',
    displayName: 'Aarav Mehta (Society Secretary)',
    username: 'admin',
    email: 'admin@mycircle.in',
    password: 'MyCircle@Admin2026',
    description: 'Full access across all 12 modules, 10 Sub-Admin scopes, CCTV audit logs & civic escalations.',
    targetRoute: '/workspaces/admin',
    accentColor: 'text-[#6366F1] bg-[#6366F1]/10 border-[#6366F1]/25',
    iconName: 'admin',
  },
  {
    roleBadge: 'Approved Resident',
    displayName: 'Priya Nair (Tower B-402)',
    username: 'priya',
    email: 'priya@mycircle.in',
    password: 'MyCircle@User2026',
    description: 'Verified resident profile with shop orders, Social Service exchanges, bookings & privacy controls.',
    targetRoute: '/',
    accentColor: 'text-[#10B981] bg-[#10B981]/10 border-[#10B981]/25',
    iconName: 'resident',
  },
  {
    roleBadge: 'Approved Resident #2',
    displayName: 'Dr. Rohan Kulkarni (Tower C)',
    username: 'rohan',
    email: 'rohan@mycircle.in',
    password: 'MyCircle@User2026',
    description: 'Second verified resident for testing peer-to-peer borrowing, dual-blind reviews & privacy projection.',
    targetRoute: '/social-service',
    accentColor: 'text-[#10B981] bg-[#10B981]/10 border-[#10B981]/25',
    iconName: 'resident',
  },
  {
    roleBadge: 'Membership Sub-Admin',
    displayName: 'Neha Deshmukh (Sub-Admin #1)',
    username: 'neha_admin',
    email: 'neha.admin@mycircle.in',
    password: 'MyCircle@SubAdmin2026',
    description: 'Scoped exclusively to Membership & Directory verification; blocked from Safety/CCTV & Water.',
    targetRoute: '/workspaces/admin',
    accentColor: 'text-[#6366F1] bg-[#6366F1]/10 border-[#6366F1]/25',
    iconName: 'subadmin',
  },
  {
    roleBadge: 'Safety & CCTV Sub-Admin',
    displayName: 'Col. Pratap Chauhan (Sub-Admin #10)',
    username: 'safety_admin',
    email: 'safety.admin@mycircle.in',
    password: 'MyCircle@SubAdmin2026',
    description: 'Authorised for SOS dispatch coordination, staff GPS duty zones, and common-area CCTV live grants.',
    targetRoute: '/safety',
    accentColor: 'text-[#EF4444] bg-[#EF4444]/10 border-[#EF4444]/25',
    iconName: 'subadmin',
  },
  {
    roleBadge: 'Local Shop Owner',
    displayName: 'Suresh Agarwal (Fresh Mart)',
    username: 'freshmart',
    email: 'shop@mycircle.in',
    password: 'MyCircle@Shop2026',
    description: 'Manages grocery catalog, order fulfilment, price adjustments, GST invoices & customer khata ledger.',
    targetRoute: '/workspaces/shop',
    accentColor: 'text-[#F59E0B] bg-[#F59E0B]/10 border-[#F59E0B]/25',
    iconName: 'shop',
  },
  {
    roleBadge: 'Licensed Pharmacist',
    displayName: 'Dr. Zoya Merchant (CarePlus Rx)',
    username: 'pharmacist',
    email: 'pharmacy@mycircle.in',
    password: 'MyCircle@Shop2026',
    description: 'Authorised to inspect private prescription uploads (`prescriptions-private`) and dispense medicines.',
    targetRoute: '/workspaces/shop',
    accentColor: 'text-[#10B981] bg-[#10B981]/10 border-[#10B981]/25',
    iconName: 'pharmacy',
  },
  {
    roleBadge: 'Service Provider',
    displayName: 'Ramesh Vishwakarma (Electrician)',
    username: 'ramesh_elec',
    email: 'provider@mycircle.in',
    password: 'MyCircle@Service2026',
    description: 'Responds to resident service enquiries, issues quotes, and completes scheduled electrical bookings.',
    targetRoute: '/workspaces/provider',
    accentColor: 'text-[#6366F1] bg-[#6366F1]/10 border-[#6366F1]/25',
    iconName: 'provider',
  },
  {
    roleBadge: 'Security & SOS Staff',
    displayName: 'Mahesh Yadav (Head Guard)',
    username: 'mahesh_guard',
    email: 'security@mycircle.in',
    password: 'MyCircle@Staff2026',
    description: 'On-duty responder with SOS acknowledgement access, patrol checkpoints & consent-based GPS sharing.',
    targetRoute: '/workspaces/staff',
    accentColor: 'text-[#EF4444] bg-[#EF4444]/10 border-[#EF4444]/25',
    iconName: 'staff',
  },
  {
    roleBadge: 'Pending Applicant',
    displayName: 'Vikram Sethi (Tower D Applicant)',
    username: 'pending_user',
    email: 'pending@mycircle.in',
    password: 'MyCircle@User2026',
    description: 'Tests Server Membership Gate (Acceptance Test 1): restricted from all directory & community data.',
    targetRoute: '/',
    accentColor: 'text-[#F59E0B] bg-[#F59E0B]/10 border-[#F59E0B]/25',
    iconName: 'pending',
  },
];

interface AuthPortalClientProps {
  initialMode: 'login' | 'register';
  buildings: BuildingInfo[];
  currentActor: ActorContext;
}

export function AuthPortalClient({
  initialMode,
  buildings,
  currentActor,
}: AuthPortalClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);

  // Login State
  const [identifier, setIdentifier] = useState('admin');
  const [password, setPassword] = useState('MyCircle@Admin2026');
  const [showPassword, setShowPassword] = useState(false);
  const [targetRedirect, setTargetRedirect] = useState<string>('/');

  // Registration State
  const [regDisplayName, setRegDisplayName] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regProfession, setRegProfession] = useState('Software Architect');
  const [regBuildingId, setRegBuildingId] = useState(
    buildings[0]?.id ?? '22222222-2222-4222-8222-222222222201'
  );
  const [regUnitNumber, setRegUnitNumber] = useState('804');
  const [regPhone, setRegPhone] = useState('+91-9820112233');
  const [regResidencyType, setRegResidencyType] = useState('owner_resident');
  const [regBio, setRegBio] = useState(
    'Excited to connect with neighbours, support local shops, and participate in community initiatives.'
  );
  const [regAutoApprove, setRegAutoApprove] = useState(true);

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  function renderPresetIcon(iconName: DemoCredentialPreset['iconName']) {
    switch (iconName) {
      case 'admin':
        return <ShieldCheck className="w-4 h-4" />;
      case 'resident':
        return <UserCheck className="w-4 h-4" />;
      case 'subadmin':
        return <Building2 className="w-4 h-4" />;
      case 'shop':
      case 'pharmacy':
        return <Store className="w-4 h-4" />;
      case 'provider':
        return <Wrench className="w-4 h-4" />;
      case 'staff':
        return <Radio className="w-4 h-4" />;
      case 'pending':
        return <Clock className="w-4 h-4" />;
    }
  }

  function handleLoginSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    startTransition(async () => {
      const res = await loginWithCredentialsAction({
        identifier,
        password,
      });
      if (!res.ok || !res.data) {
        setErrorMsg(res.error ?? 'Authentication failed.');
        return;
      }

      setSuccessMsg(
        `Signed in as ${res.data.display_name} (${res.data.role_label}). Redirecting...`
      );
      router.push(targetRedirect || '/');
      router.refresh();
    });
  }

  function handleQuickLogin(preset: DemoCredentialPreset) {
    setMode('login');
    setIdentifier(preset.username);
    setPassword(preset.password);
    setTargetRedirect(preset.targetRoute);
    setErrorMsg(null);
    setSuccessMsg(null);

    startTransition(async () => {
      const res = await loginWithCredentialsAction({
        identifier: preset.username,
        password: preset.password,
      });
      if (!res.ok || !res.data) {
        setErrorMsg(res.error ?? 'Quick login failed.');
        return;
      }

      setSuccessMsg(
        `Signed in as ${res.data.display_name} (${res.data.role_label}). Redirecting to ${preset.targetRoute}...`
      );
      router.push(preset.targetRoute);
      router.refresh();
    });
  }

  function handleRegisterSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    startTransition(async () => {
      const res = await registerMemberAction({
        displayName: regDisplayName,
        username: regUsername,
        email: regEmail,
        password: regPassword,
        profession: regProfession,
        buildingId: regBuildingId,
        unitNumber: regUnitNumber,
        phone: regPhone,
        residencyType: regResidencyType,
        bio: regBio,
        autoApprove: regAutoApprove,
      });

      if (!res.ok || !res.data) {
        setErrorMsg(res.error ?? 'Registration failed.');
        return;
      }

      setSuccessMsg(
        `Account created for ${res.data.display_name} (@${res.data.username}) with status "${res.data.membership_status}". Redirecting to your profile...`
      );
      router.push(res.data.membership_status === 'approved' ? '/account' : '/');
      router.refresh();
    });
  }

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <section className="bg-white border border-[#E8E8EC] rounded-[12px] p-6 sm:p-8 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
        <div className="space-y-3 max-w-2xl">
          <MyCircleLogo size="lg" showBadge={true} showSubtitle={true} />
          <h1 className="text-[26px] sm:text-[32px] font-display font-bold tracking-[-0.03em] text-[#0A0A0A] pt-1">
            Identity, Authentication & Member Onboarding
          </h1>
          <p className="text-[15px] text-[#6B6B6B] leading-relaxed">
            Sign in with your <strong className="text-[#0A0A0A]">MyCircle</strong> username or email, register a new resident profile with field-level privacy defaults, or use the one-click <strong className="text-[#0A0A0A]">Role Credentials Vault</strong> to test Admin, Sub-Admin, Resident, Shop, Provider, and Responder permissions.
          </p>
        </div>

        {/* Active Session Status Card */}
        <div className="bg-[#FAFAFA] border border-[#E8E8EC] rounded-[12px] p-4 min-w-[260px] space-y-2">
          <div className="text-[11px] font-mono uppercase tracking-wider text-[#9C9C9C] flex items-center justify-between">
            <span>Active Session</span>
            <span className="inline-flex items-center gap-1 text-[#10B981] font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]" />
              Connected
            </span>
          </div>
          <div className="font-display font-bold text-[16px] text-[#0A0A0A]">
            {currentActor?.display_name}
          </div>
          <div className="text-[12px] text-[#6B6B6B]">
            {currentActor?.profession ?? 'Community Member'} • Status:{' '}
            <span className="font-mono uppercase text-[#6366F1] font-medium">
              {currentActor?.status ?? 'approved'}
            </span>
          </div>
          <div className="pt-1 flex items-center gap-2">
            <Link
              href="/account"
              className="inline-flex items-center gap-1.5 text-[12px] font-medium text-[#6366F1] hover:underline"
            >
              <span>Manage Profile & Privacy</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Main Two-Column Grid: Left = Auth/Register Form, Right = Role Credentials Vault */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (5 cols): Login / Registration Form */}
        <div className="lg:col-span-5 bg-white border border-[#E8E8EC] rounded-[12px] p-6 space-y-5">
          {/* Mode Switch Tabs */}
          <div className="grid grid-cols-2 gap-1.5 p-1 rounded-[8px] bg-[#FAFAFA] border border-[#E8E8EC]">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setErrorMsg(null);
                setSuccessMsg(null);
              }}
              className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-[6px] text-[13px] font-medium transition cursor-pointer ${
                mode === 'login'
                  ? 'bg-[#0A0A0A] text-white shadow-2xs'
                  : 'text-[#6B6B6B] hover:text-[#0A0A0A]'
              }`}
            >
              <KeyRound className="w-4 h-4" />
              <span>Sign In</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('register');
                setErrorMsg(null);
                setSuccessMsg(null);
              }}
              className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-[6px] text-[13px] font-medium transition cursor-pointer ${
                mode === 'register'
                  ? 'bg-[#6366F1] text-white shadow-2xs'
                  : 'text-[#6B6B6B] hover:text-[#0A0A0A]'
              }`}
            >
              <UserPlus className="w-4 h-4" />
              <span>Register Member</span>
            </button>
          </div>

          {errorMsg && (
            <div className="p-3.5 rounded-[8px] bg-[#EF4444]/10 border border-[#EF4444]/30 text-[13px] text-[#EF4444] flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3.5 rounded-[8px] bg-[#10B981]/10 border border-[#10B981]/30 text-[13px] text-[#0A0A0A] flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-[#10B981] shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          {mode === 'login' ? (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <h2 className="text-[18px] font-display font-bold text-[#0A0A0A]">
                  Sign In to MyCircle
                </h2>
                <p className="text-[13px] text-[#6B6B6B] mt-0.5">
                  Enter your username or email address and password.
                </p>
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="login-identifier"
                  className="block text-[13px] font-medium text-[#0A0A0A]"
                >
                  Username or Email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-[#9C9C9C] absolute left-3.5 top-3" />
                  <input
                    id="login-identifier"
                    type="text"
                    required
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="e.g. admin or priya@mycircle.in"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-[6px] border border-[#E8E8EC] text-[14px] text-[#0A0A0A]"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="login-password"
                  className="block text-[13px] font-medium text-[#0A0A0A]"
                >
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[#9C9C9C] absolute left-3.5 top-3" />
                  <input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password"
                    className="w-full pl-10 pr-10 py-2.5 rounded-[6px] border border-[#E8E8EC] text-[14px] text-[#0A0A0A] font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-3 top-2.5 text-[#6B6B6B] hover:text-[#0A0A0A] cursor-pointer"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isPending}
                className="w-full h-[42px] rounded-[6px] bg-[#6366F1] hover:bg-[#4F46E5] text-white font-medium text-[14px] flex items-center justify-center gap-2 transition cursor-pointer"
              >
                <KeyRound className="w-4 h-4" />
                <span>
                  {isPending ? 'Verifying Credentials...' : 'Sign In to MyCircle'}
                </span>
              </button>

              <div className="pt-2 border-t border-[#E8E8EC] flex items-center justify-between text-[12px] text-[#6B6B6B]">
                <span>New resident in Serenity Heights?</span>
                <button
                  type="button"
                  onClick={() => setMode('register')}
                  className="font-medium text-[#6366F1] hover:underline cursor-pointer"
                >
                  Create Resident Account →
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleRegisterSubmit} className="space-y-4">
              <div>
                <h2 className="text-[18px] font-display font-bold text-[#0A0A0A]">
                  New Resident Registration
                </h2>
                <p className="text-[13px] text-[#6B6B6B] mt-0.5">
                  Creates your profile, private contact record (`show_unit = false`, `show_phone = false` by default), and login credentials.
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="block text-[13px] font-medium text-[#0A0A0A]">
                  Full Name
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-[#9C9C9C] absolute left-3.5 top-3" />
                  <input
                    type="text"
                    required
                    value={regDisplayName}
                    onChange={(e) => setRegDisplayName(e.target.value)}
                    placeholder="e.g. Aditi Deshmukh"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-[6px] border border-[#E8E8EC] text-[14px]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="block text-[13px] font-medium text-[#0A0A0A]">
                    Username
                  </label>
                  <input
                    type="text"
                    required
                    value={regUsername}
                    onChange={(e) => setRegUsername(e.target.value)}
                    placeholder="e.g. aditi_d"
                    className="w-full px-3.5 py-2.5 rounded-[6px] border border-[#E8E8EC] text-[14px] font-mono"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-[13px] font-medium text-[#0A0A0A]">
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="aditi@mycircle.in"
                    className="w-full px-3.5 py-2.5 rounded-[6px] border border-[#E8E8EC] text-[14px]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="block text-[13px] font-medium text-[#0A0A0A]">
                    Password (min 6 chars)
                  </label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-3.5 py-2.5 rounded-[6px] border border-[#E8E8EC] text-[14px] font-mono"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-[13px] font-medium text-[#0A0A0A]">
                    Profession / Headline
                  </label>
                  <div className="relative">
                    <Briefcase className="w-4 h-4 text-[#9C9C9C] absolute left-3 top-3" />
                    <input
                      type="text"
                      value={regProfession}
                      onChange={(e) => setRegProfession(e.target.value)}
                      placeholder="e.g. Product Designer"
                      className="w-full pl-9 pr-3 py-2.5 rounded-[6px] border border-[#E8E8EC] text-[14px]"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2 space-y-1.5">
                  <label className="block text-[13px] font-medium text-[#0A0A0A]">
                    Tower / Building
                  </label>
                  <select
                    value={regBuildingId}
                    onChange={(e) => setRegBuildingId(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-[6px] border border-[#E8E8EC] text-[14px] bg-white"
                  >
                    {buildings.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="block text-[13px] font-medium text-[#0A0A0A]">
                    Flat / Unit (Private)
                  </label>
                  <input
                    type="text"
                    required
                    value={regUnitNumber}
                    onChange={(e) => setRegUnitNumber(e.target.value)}
                    placeholder="804"
                    className="w-full px-3.5 py-2.5 rounded-[6px] border border-[#E8E8EC] text-[14px] font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="block text-[13px] font-medium text-[#0A0A0A]">
                    Personal Phone (Private)
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-[#9C9C9C] absolute left-3 top-3" />
                    <input
                      type="text"
                      required
                      value={regPhone}
                      onChange={(e) => setRegPhone(e.target.value)}
                      placeholder="+91-9820112233"
                      className="w-full pl-9 pr-3 py-2.5 rounded-[6px] border border-[#E8E8EC] text-[14px] font-mono"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="block text-[13px] font-medium text-[#0A0A0A]">
                    Residency Type
                  </label>
                  <select
                    value={regResidencyType}
                    onChange={(e) => setRegResidencyType(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-[6px] border border-[#E8E8EC] text-[14px] bg-white"
                  >
                    <option value="owner_resident">Owner Resident</option>
                    <option value="tenant_resident">Tenant Resident</option>
                    <option value="family_member">Family Member</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-[13px] font-medium text-[#0A0A0A]">
                  Short Community Bio
                </label>
                <textarea
                  rows={2}
                  value={regBio}
                  onChange={(e) => setRegBio(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-[6px] border border-[#E8E8EC] text-[13px]"
                />
              </div>

              <label className="flex items-start gap-2.5 p-3 rounded-[8px] bg-[#FAFAFA] border border-[#E8E8EC] cursor-pointer">
                <input
                  type="checkbox"
                  checked={regAutoApprove}
                  onChange={(e) => setRegAutoApprove(e.target.checked)}
                  className="w-4 h-4 mt-0.5 accent-[#6366F1]"
                />
                <div className="text-[12px]">
                  <div className="font-medium text-[#0A0A0A]">
                    Instant Verification Mode (Recommended for immediate testing)
                  </div>
                  <div className="text-[#6B6B6B]">
                    Uncheck to register as a <strong>Pending Applicant</strong> and test the Membership Sub-Admin approval gate.
                  </div>
                </div>
              </label>

              <button
                type="submit"
                disabled={isPending}
                className="w-full h-[42px] rounded-[6px] bg-[#6366F1] hover:bg-[#4F46E5] text-white font-medium text-[14px] flex items-center justify-center gap-2 transition cursor-pointer"
              >
                <UserPlus className="w-4 h-4" />
                <span>
                  {isPending
                    ? 'Creating Member Account on Supabase...'
                    : 'Register & Sign In to MyCircle'}
                </span>
              </button>
            </form>
          )}
        </div>

        {/* Right Column (7 cols): Interactive Role Credentials Vault */}
        <div className="lg:col-span-7 bg-white border border-[#E8E8EC] rounded-[12px] p-6 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#E8E8EC] pb-4">
            <div>
              <div className="inline-flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-wider text-[#6366F1] font-medium">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Ready-to-Use Test Accounts</span>
              </div>
              <h2 className="text-[20px] font-display font-bold text-[#0A0A0A] mt-0.5">
                Admin, Sub-Admin & Resident Test Credentials
              </h2>
            </div>
            <span className="text-[12px] text-[#6B6B6B]">
              Click any role card to fill & sign in immediately
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {DEMO_CREDENTIAL_PRESETS.map((preset) => (
              <div
                key={preset.username}
                className="p-4 rounded-[10px] bg-[#FAFAFA] border border-[#E8E8EC] hover:border-[#6366F1] transition flex flex-col justify-between gap-3"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium border ${preset.accentColor}`}
                    >
                      {renderPresetIcon(preset.iconName)}
                      <span>{preset.roleBadge}</span>
                    </span>
                    <span className="text-[11px] font-mono text-[#9C9C9C]">
                      {preset.targetRoute}
                    </span>
                  </div>

                  <div className="font-display font-bold text-[15px] text-[#0A0A0A]">
                    {preset.displayName}
                  </div>
                  <p className="text-[12px] text-[#6B6B6B] leading-relaxed">
                    {preset.description}
                  </p>
                </div>

                <div className="space-y-2.5 pt-2 border-t border-[#E8E8EC]">
                  <div className="grid grid-cols-2 gap-2 text-[11px] font-mono bg-white p-2 rounded-[6px] border border-[#E8E8EC]">
                    <div>
                      <span className="text-[#9C9C9C] block">USER / EMAIL</span>
                      <strong className="text-[#0A0A0A] truncate block">
                        {preset.username}
                      </strong>
                      <span className="text-[#6B6B6B] text-[10px] truncate block">
                        {preset.email}
                      </span>
                    </div>
                    <div>
                      <span className="text-[#9C9C9C] block">PASSWORD</span>
                      <strong className="text-[#6366F1] block">
                        {preset.password}
                      </strong>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={isPending}
                      onClick={() => handleQuickLogin(preset)}
                      className="flex-1 h-[34px] px-3 rounded-[6px] bg-[#0A0A0A] hover:bg-[#6366F1] text-white text-[12px] font-medium flex items-center justify-center gap-1.5 transition cursor-pointer"
                    >
                      <span>Sign In as {preset.username}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setMode('login');
                        setIdentifier(preset.username);
                        setPassword(preset.password);
                        setTargetRedirect(preset.targetRoute);
                      }}
                      className="h-[34px] px-2.5 rounded-[6px] bg-white border border-[#E8E8EC] hover:border-[#6366F1] text-[11px] font-mono text-[#6B6B6B] hover:text-[#0A0A0A] cursor-pointer"
                    >
                      Fill Form
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
