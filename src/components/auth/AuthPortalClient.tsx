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
  ArrowLeft,
  Sparkles,
  Store,
  Wrench,
  Radio,
  UserCheck,
  Clock,
  RotateCcw,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import type { BuildingInfo, ActorContext } from '@/lib/types/domain';
import {
  loginWithCredentialsAction,
  registerMemberAction,
  resetForgottenPasswordAction,
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
  buttonStyle: string;
  badgeStyle: string;
  iconName:
    | 'admin'
    | 'resident'
    | 'subadmin'
    | 'shop'
    | 'pharmacy'
    | 'provider'
    | 'staff'
    | 'pending';
}

export const DEMO_CREDENTIAL_PRESETS: DemoCredentialPreset[] = [
  {
    roleBadge: 'Primary Admin',
    displayName: 'Aarav Mehta',
    username: 'admin',
    email: 'admin@mycircle.in',
    password: 'MyCircle@Admin2026',
    description: 'Full Society Admin access, member management & 10 sub-admin scopes.',
    targetRoute: '/workspaces/admin',
    buttonStyle: 'bg-[#6366F1] hover:bg-[#4F46E5] text-white',
    badgeStyle: 'text-[#6366F1] bg-[#6366F1]/10 border-[#6366F1]/25',
    iconName: 'admin',
  },
  {
    roleBadge: 'Resident Member',
    displayName: 'Priya Nair (Tower B)',
    username: 'priya',
    email: 'priya@mycircle.in',
    password: 'MyCircle@User2026',
    description: 'Standard resident account with shops, social exchange & privacy settings.',
    targetRoute: '/',
    buttonStyle: 'bg-[#10B981] hover:bg-[#059669] text-white',
    badgeStyle: 'text-[#059669] bg-[#10B981]/10 border-[#10B981]/25',
    iconName: 'resident',
  },
  {
    roleBadge: 'Resident #2',
    displayName: 'Dr. Rohan Kulkarni',
    username: 'rohan',
    email: 'rohan@mycircle.in',
    password: 'MyCircle@User2026',
    description: 'Second resident account for peer-to-peer borrowing & reviews.',
    targetRoute: '/social-service',
    buttonStyle: 'bg-[#0EA5E9] hover:bg-[#0284C7] text-white',
    badgeStyle: 'text-[#0284C7] bg-[#0EA5E9]/10 border-[#0EA5E9]/25',
    iconName: 'resident',
  },
  {
    roleBadge: 'Membership Sub-Admin',
    displayName: 'Neha Deshmukh',
    username: 'neha_admin',
    email: 'neha.admin@mycircle.in',
    password: 'MyCircle@SubAdmin2026',
    description: 'Scoped to Membership & Directory verification only.',
    targetRoute: '/workspaces/admin',
    buttonStyle: 'bg-[#8B5CF6] hover:bg-[#7C3AED] text-white',
    badgeStyle: 'text-[#7C3AED] bg-[#8B5CF6]/10 border-[#8B5CF6]/25',
    iconName: 'subadmin',
  },
  {
    roleBadge: 'Safety & CCTV Admin',
    displayName: 'Col. Pratap Chauhan',
    username: 'safety_admin',
    email: 'safety.admin@mycircle.in',
    password: 'MyCircle@SubAdmin2026',
    description: 'Scoped to SOS alerts, staff duty zones & common-area CCTV.',
    targetRoute: '/safety',
    buttonStyle: 'bg-[#EF4444] hover:bg-[#DC2626] text-white',
    badgeStyle: 'text-[#DC2626] bg-[#EF4444]/10 border-[#EF4444]/25',
    iconName: 'subadmin',
  },
  {
    roleBadge: 'Local Shop Owner',
    displayName: 'Suresh Agarwal',
    username: 'freshmart',
    email: 'shop@mycircle.in',
    password: 'MyCircle@Shop2026',
    description: 'Grocery store orders, price revisions & invoices.',
    targetRoute: '/workspaces/shop',
    buttonStyle: 'bg-[#F59E0B] hover:bg-[#D97706] text-white',
    badgeStyle: 'text-[#D97706] bg-[#F59E0B]/10 border-[#F59E0B]/25',
    iconName: 'shop',
  },
  {
    roleBadge: 'Pharmacist',
    displayName: 'Dr. Zoya Merchant',
    username: 'pharmacist',
    email: 'pharmacy@mycircle.in',
    password: 'MyCircle@Shop2026',
    description: 'CarePlus Pharmacy prescription verification & orders.',
    targetRoute: '/workspaces/shop',
    buttonStyle: 'bg-[#10B981] hover:bg-[#059669] text-white',
    badgeStyle: 'text-[#059669] bg-[#10B981]/10 border-[#10B981]/25',
    iconName: 'pharmacy',
  },
  {
    roleBadge: 'Service Provider',
    displayName: 'Ramesh Vishwakarma',
    username: 'ramesh_elec',
    email: 'provider@mycircle.in',
    password: 'MyCircle@Service2026',
    description: 'Electrician service quotes & scheduled resident bookings.',
    targetRoute: '/workspaces/provider',
    buttonStyle: 'bg-[#6366F1] hover:bg-[#4F46E5] text-white',
    badgeStyle: 'text-[#6366F1] bg-[#6366F1]/10 border-[#6366F1]/25',
    iconName: 'provider',
  },
  {
    roleBadge: 'Security Staff',
    displayName: 'Mahesh Yadav',
    username: 'mahesh_guard',
    email: 'security@mycircle.in',
    password: 'MyCircle@Staff2026',
    description: 'Head Guard SOS response & shift check-in.',
    targetRoute: '/workspaces/staff',
    buttonStyle: 'bg-[#EF4444] hover:bg-[#DC2626] text-white',
    badgeStyle: 'text-[#DC2626] bg-[#EF4444]/10 border-[#EF4444]/25',
    iconName: 'staff',
  },
  {
    roleBadge: 'Pending Applicant',
    displayName: 'Vikram Sethi',
    username: 'pending_user',
    email: 'pending@mycircle.in',
    password: 'MyCircle@User2026',
    description: 'Unapproved applicant (tests server access restriction).',
    targetRoute: '/',
    buttonStyle: 'bg-[#64748B] hover:bg-[#475569] text-white',
    badgeStyle: 'text-[#475569] bg-[#64748B]/10 border-[#64748B]/25',
    iconName: 'pending',
  },
];

interface AuthPortalClientProps {
  initialMode: 'login' | 'register' | 'forgot';
  buildings: BuildingInfo[];
  currentActor?: ActorContext;
}

export function AuthPortalClient({
  initialMode,
  buildings,
}: AuthPortalClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showDemoVault, setShowDemoVault] = useState(false);

  // Login State
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Registration State
  const [regDisplayName, setRegDisplayName] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regProfession, setRegProfession] = useState('');
  const [regBuildingId, setRegBuildingId] = useState(
    buildings[0]?.id ?? '22222222-2222-4222-8222-222222222201'
  );
  const [regUnitNumber, setRegUnitNumber] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regResidencyType, setRegResidencyType] = useState('owner_resident');

  // Forgot Password State
  const [forgotIdentifier, setForgotIdentifier] = useState('');
  const [forgotVerifyText, setForgotVerifyText] = useState('');
  const [forgotNewPassword, setForgotNewPassword] = useState('');
  const [forgotConfirmPassword, setForgotConfirmPassword] = useState('');

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  function renderPresetIcon(iconName: DemoCredentialPreset['iconName']) {
    switch (iconName) {
      case 'admin':
        return <ShieldCheck className="w-3.5 h-3.5" />;
      case 'resident':
        return <UserCheck className="w-3.5 h-3.5" />;
      case 'subadmin':
        return <Building2 className="w-3.5 h-3.5" />;
      case 'shop':
      case 'pharmacy':
        return <Store className="w-3.5 h-3.5" />;
      case 'provider':
        return <Wrench className="w-3.5 h-3.5" />;
      case 'staff':
        return <Radio className="w-3.5 h-3.5" />;
      case 'pending':
        return <Clock className="w-3.5 h-3.5" />;
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

      setSuccessMsg(`Welcome back, ${res.data.display_name}! Redirecting...`);
      router.push('/');
      router.refresh();
    });
  }

  function handleQuickLogin(preset: DemoCredentialPreset) {
    setIdentifier(preset.username);
    setPassword(preset.password);
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

      setSuccessMsg(`Signed in as ${res.data.display_name}. Redirecting...`);
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
        profession: regProfession || 'Resident Member',
        buildingId: regBuildingId,
        unitNumber: regUnitNumber || '101',
        phone: regPhone || '+91-9820000000',
        residencyType: regResidencyType,
        bio: 'Verified resident member of MyCircle.',
        autoApprove: true,
      });

      if (!res.ok || !res.data) {
        setErrorMsg(res.error ?? 'Registration failed.');
        return;
      }

      setSuccessMsg(
        `Welcome to MyCircle, ${res.data.display_name}! Taking you to your dashboard...`
      );
      router.push('/');
      router.refresh();
    });
  }

  function handleForgotSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (forgotNewPassword !== forgotConfirmPassword) {
      setErrorMsg('New password and confirmation password do not match.');
      return;
    }

    startTransition(async () => {
      const res = await resetForgottenPasswordAction({
        identifier: forgotIdentifier,
        verificationText: forgotVerifyText,
        newPassword: forgotNewPassword,
      });

      if (!res.ok || !res.data) {
        setErrorMsg(res.error ?? 'Password reset failed.');
        return;
      }

      setSuccessMsg(
        `Password updated for ${res.data.display_name} (@${res.data.username}). Redirecting to Sign In...`
      );
      setTimeout(() => {
        router.push('/login');
      }, 1200);
    });
  }

  return (
    <div className="max-w-lg mx-auto py-6 sm:py-10 px-4 space-y-5">
      {/* Dedicated Standalone Auth Card */}
      <div className="bg-white border border-[#E8E8EC] rounded-[16px] shadow-xs p-6 sm:p-8 space-y-6">
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center space-y-2">
          <MyCircleLogo size="lg" showBadge={false} />
          <h1 className="text-[22px] sm:text-[26px] font-display font-bold tracking-[-0.03em] text-[#0A0A0A]">
            {initialMode === 'login'
              ? 'Sign in to MyCircle'
              : initialMode === 'register'
              ? 'Create Resident Account'
              : 'Reset Your Password'}
          </h1>
          <p className="text-[13px] text-[#6B6B6B] max-w-sm">
            {initialMode === 'login'
              ? 'Private residential community network. Sign in to access your neighbourhood directory, local shops, and services.'
              : initialMode === 'register'
              ? 'Register your apartment unit for private-by-default access to your society.'
              : 'Verify your unit or phone number to set a new password.'}
          </p>
        </div>

        {errorMsg && (
          <div className="p-3.5 rounded-[10px] bg-[#EF4444]/10 border border-[#EF4444]/30 text-[13px] text-[#EF4444] flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3.5 rounded-[10px] bg-[#10B981]/10 border border-[#10B981]/30 text-[13px] text-[#0A0A0A] flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-[#10B981] shrink-0 mt-0.5" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* PAGE 1: DEDICATED SIGN IN (/login) */}
        {initialMode === 'login' && (
          <form onSubmit={handleLoginSubmit} className="space-y-4">
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
                  placeholder="Enter username or email (e.g. priya or admin)"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-[8px] border border-[#E8E8EC] text-[14px] text-[#0A0A0A] bg-white"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="login-password"
                  className="block text-[13px] font-medium text-[#0A0A0A]"
                >
                  Password
                </label>
                <Link
                  href="/forgot-password"
                  className="text-[12px] font-medium text-[#6366F1] hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#9C9C9C] absolute left-3.5 top-3" />
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full pl-10 pr-10 py-2.5 rounded-[8px] border border-[#E8E8EC] text-[14px] text-[#0A0A0A] font-mono bg-white"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3 top-2.5 text-[#6B6B6B] hover:text-[#0A0A0A] cursor-pointer"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isPending}
              className="w-full h-[44px] rounded-[8px] bg-gradient-to-r from-[#6366F1] to-[#4F46E5] hover:from-[#4F46E5] hover:to-[#4338CA] text-white font-medium text-[14px] flex items-center justify-center gap-2 shadow-xs transition cursor-pointer"
            >
              <KeyRound className="w-4 h-4" />
              <span>{isPending ? 'Signing in...' : 'Sign In to MyCircle'}</span>
            </button>

            <div className="pt-3 border-t border-[#E8E8EC] flex items-center justify-between text-[13px]">
              <span className="text-[#6B6B6B]">New resident in the society?</span>
              <Link
                href="/register"
                className="font-semibold text-[#10B981] hover:underline inline-flex items-center gap-1"
              >
                <span>Create Account</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </form>
        )}

        {/* PAGE 2: DEDICATED REGISTER (/register) */}
        {initialMode === 'register' && (
          <form onSubmit={handleRegisterSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-[13px] font-medium text-[#0A0A0A]">Full Name</label>
              <div className="relative">
                <User className="w-4 h-4 text-[#9C9C9C] absolute left-3.5 top-3" />
                <input
                  type="text"
                  required
                  value={regDisplayName}
                  onChange={(e) => setRegDisplayName(e.target.value)}
                  placeholder="e.g. Aditi Deshmukh"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-[8px] border border-[#E8E8EC] text-[14px]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="block text-[13px] font-medium text-[#0A0A0A]">Username</label>
                <input
                  type="text"
                  required
                  value={regUsername}
                  onChange={(e) => setRegUsername(e.target.value)}
                  placeholder="aditi_d"
                  className="w-full px-3.5 py-2.5 rounded-[8px] border border-[#E8E8EC] text-[14px] font-mono"
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-[13px] font-medium text-[#0A0A0A]">Email Address</label>
                <input
                  type="email"
                  required
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  placeholder="aditi@mycircle.in"
                  className="w-full px-3.5 py-2.5 rounded-[8px] border border-[#E8E8EC] text-[14px]"
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
                  className="w-full px-3.5 py-2.5 rounded-[8px] border border-[#E8E8EC] text-[14px] font-mono"
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-[13px] font-medium text-[#0A0A0A]">Profession</label>
                <div className="relative">
                  <Briefcase className="w-4 h-4 text-[#9C9C9C] absolute left-3 top-3" />
                  <input
                    type="text"
                    value={regProfession}
                    onChange={(e) => setRegProfession(e.target.value)}
                    placeholder="e.g. Product Designer"
                    className="w-full pl-9 pr-3 py-2.5 rounded-[8px] border border-[#E8E8EC] text-[14px]"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2 space-y-1.5">
                <label className="block text-[13px] font-medium text-[#0A0A0A]">Tower</label>
                <select
                  value={regBuildingId}
                  onChange={(e) => setRegBuildingId(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-[8px] border border-[#E8E8EC] text-[14px] bg-white"
                >
                  {buildings.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="block text-[13px] font-medium text-[#0A0A0A]">Flat No.</label>
                <input
                  type="text"
                  required
                  value={regUnitNumber}
                  onChange={(e) => setRegUnitNumber(e.target.value)}
                  placeholder="804"
                  className="w-full px-3.5 py-2.5 rounded-[8px] border border-[#E8E8EC] text-[14px] font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="block text-[13px] font-medium text-[#0A0A0A]">Phone Number</label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-[#9C9C9C] absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    value={regPhone}
                    onChange={(e) => setRegPhone(e.target.value)}
                    placeholder="+91-9820112233"
                    className="w-full pl-9 pr-3 py-2.5 rounded-[8px] border border-[#E8E8EC] text-[14px] font-mono"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="block text-[13px] font-medium text-[#0A0A0A]">Residency</label>
                <select
                  value={regResidencyType}
                  onChange={(e) => setRegResidencyType(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-[8px] border border-[#E8E8EC] text-[14px] bg-white"
                >
                  <option value="owner_resident">Owner Resident</option>
                  <option value="tenant_resident">Tenant Resident</option>
                  <option value="family_member">Family Member</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={isPending}
              className="w-full h-[44px] rounded-[8px] bg-gradient-to-r from-[#10B981] to-[#059669] hover:from-[#059669] hover:to-[#047857] text-white font-medium text-[14px] flex items-center justify-center gap-2 shadow-xs transition cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>{isPending ? 'Creating Account...' : 'Create MyCircle Account'}</span>
            </button>

            <div className="pt-3 border-t border-[#E8E8EC] flex items-center justify-between text-[13px]">
              <span className="text-[#6B6B6B]">Already have an account?</span>
              <Link
                href="/login"
                className="font-semibold text-[#6366F1] hover:underline inline-flex items-center gap-1"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to Sign In</span>
              </Link>
            </div>
          </form>
        )}

        {/* PAGE 3: DEDICATED FORGOT PASSWORD (/forgot-password) */}
        {initialMode === 'forgot' && (
          <form onSubmit={handleForgotSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-[13px] font-medium text-[#0A0A0A]">
                Username or Registered Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#9C9C9C] absolute left-3.5 top-3" />
                <input
                  type="text"
                  required
                  value={forgotIdentifier}
                  onChange={(e) => setForgotIdentifier(e.target.value)}
                  placeholder="e.g. priya or priya@mycircle.in"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-[8px] border border-[#E8E8EC] text-[14px]"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-[13px] font-medium text-[#0A0A0A]">
                Flat / Unit Number or Registered Phone
              </label>
              <input
                type="text"
                value={forgotVerifyText}
                onChange={(e) => setForgotVerifyText(e.target.value)}
                placeholder="e.g. 402 or +91-9820..."
                className="w-full px-3.5 py-2.5 rounded-[8px] border border-[#E8E8EC] text-[14px]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="block text-[13px] font-medium text-[#0A0A0A]">
                  New Password
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={forgotNewPassword}
                  onChange={(e) => setForgotNewPassword(e.target.value)}
                  placeholder="Min 6 characters"
                  className="w-full px-3.5 py-2.5 rounded-[8px] border border-[#E8E8EC] text-[14px] font-mono"
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-[13px] font-medium text-[#0A0A0A]">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={forgotConfirmPassword}
                  onChange={(e) => setForgotConfirmPassword(e.target.value)}
                  placeholder="Repeat password"
                  className="w-full px-3.5 py-2.5 rounded-[8px] border border-[#E8E8EC] text-[14px] font-mono"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isPending}
              className="w-full h-[44px] rounded-[8px] bg-gradient-to-r from-[#F59E0B] to-[#D97706] hover:from-[#D97706] hover:to-[#B45309] text-white font-medium text-[14px] flex items-center justify-center gap-2 shadow-xs transition cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>{isPending ? 'Updating Password...' : 'Reset Password'}</span>
            </button>

            <div className="pt-3 border-t border-[#E8E8EC] flex items-center justify-between text-[13px]">
              <span className="text-[#6B6B6B]">Remembered your password?</span>
              <Link
                href="/login"
                className="font-semibold text-[#6366F1] hover:underline inline-flex items-center gap-1"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to Sign In</span>
              </Link>
            </div>
          </form>
        )}
      </div>

      {/* Collapsible Demo Test Accounts Helper (Shown on Sign In page) */}
      {initialMode === 'login' && (
        <div className="bg-white border border-[#E8E8EC] rounded-[14px] overflow-hidden">
          <button
            type="button"
            onClick={() => setShowDemoVault((prev) => !prev)}
            className="w-full px-5 py-3.5 flex items-center justify-between text-left hover:bg-[#FAFAFA] transition cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#6366F1]" />
              <span className="text-[13px] font-medium text-[#0A0A0A]">
                One-Click Demo Logins (Admin, Resident, Shop, Provider & Staff)
              </span>
            </div>
            {showDemoVault ? (
              <ChevronUp className="w-4 h-4 text-[#6B6B6B]" />
            ) : (
              <ChevronDown className="w-4 h-4 text-[#6B6B6B]" />
            )}
          </button>

          {showDemoVault && (
            <div className="p-4 pt-2 border-t border-[#E8E8EC] bg-[#FAFAFA] grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {DEMO_CREDENTIAL_PRESETS.map((preset) => (
                <div
                  key={preset.username}
                  className="p-3 rounded-[10px] bg-white border border-[#E8E8EC] flex flex-col justify-between gap-2.5"
                >
                  <div>
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border ${preset.badgeStyle}`}
                    >
                      {renderPresetIcon(preset.iconName)}
                      <span>{preset.roleBadge}</span>
                    </span>
                    <div className="font-display font-bold text-[14px] text-[#0A0A0A] mt-1">
                      {preset.displayName}
                    </div>
                    <div className="text-[11px] font-mono text-[#6B6B6B] mt-0.5">
                      User: <strong className="text-[#0A0A0A]">{preset.username}</strong> • Pass:{' '}
                      <strong className="text-[#6366F1]">{preset.password}</strong>
                    </div>
                  </div>
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={() => handleQuickLogin(preset)}
                    className={`w-full h-[32px] px-3 rounded-[6px] text-[12px] font-medium flex items-center justify-center gap-1.5 transition cursor-pointer ${preset.buttonStyle}`}
                  >
                    <span>Sign In as {preset.roleBadge}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
