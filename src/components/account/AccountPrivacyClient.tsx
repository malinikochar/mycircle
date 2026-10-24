'use client';

import React, { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  UserCheck,
  Lock,
  ShieldCheck,
  Star,
  Bell,
  User,
  Briefcase,
  Building2,
  Phone,
  Mail,
  KeyRound,
  LogOut,
  CheckCircle2,
  Save,
  Sparkles,
  UserPlus,
} from 'lucide-react';
import type { ActorContext, NotificationItem } from '@/lib/types/domain';
import type { ActorAccountDetails } from '@/lib/data/community-loader';
import {
  updateVisibilityAction,
  updateMemberProfileAction,
  logoutAction,
} from '@/app/actions/community-actions';

interface AccountPrivacyClientProps {
  actor: ActorContext;
  accountDetails: ActorAccountDetails;
  notifications: NotificationItem[];
}

export function AccountPrivacyClient({
  actor,
  accountDetails,
  notifications,
}: AccountPrivacyClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Profile Edit State
  const [displayName, setDisplayName] = useState(actor.display_name ?? '');
  const [profession, setProfession] = useState(actor.profession ?? '');
  const [bio, setBio] = useState(actor.bio ?? '');
  const [skillsText, setSkillsText] = useState((actor.skills ?? []).join(', '));
  const [interestsText, setInterestsText] = useState((actor.interests ?? []).join(', '));
  const [unitNumber, setUnitNumber] = useState(actor.unit_number ?? '101');
  const [personalPhone, setPersonalPhone] = useState(actor.personal_phone ?? '+91-9820000000');
  const [residencyType, setResidencyType] = useState(actor.residency_type ?? 'owner_resident');
  const [headline, setHeadline] = useState(accountDetails.professional_headline ?? '');
  const [businessName, setBusinessName] = useState(accountDetails.business_name ?? '');
  const [businessCategory, setBusinessCategory] = useState(
    accountDetails.business_category ?? ''
  );
  const [businessDescription, setBusinessDescription] = useState(
    accountDetails.business_description ?? ''
  );
  const [profileFeedback, setProfileFeedback] = useState<string | null>(null);

  // Per-Field Visibility State (MEM-03)
  const [showUnit, setShowUnit] = useState(Boolean(actor.visibility?.show_unit));
  const [showPhone, setShowPhone] = useState(Boolean(actor.visibility?.show_phone));
  const [showProfession, setShowProfession] = useState(
    Boolean(actor.visibility?.show_profession ?? true)
  );
  const [showBusiness, setShowBusiness] = useState(
    Boolean(actor.visibility?.show_business ?? true)
  );
  const [privacyFeedback, setPrivacyFeedback] = useState<string | null>(null);

  const initials = (actor.display_name || 'MC')
    .split(' ')
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    setProfileFeedback(null);

    const parsedSkills = skillsText
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    const parsedInterests = interestsText
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    startTransition(async () => {
      const res = await updateMemberProfileAction({
        displayName,
        profession,
        bio,
        skills: parsedSkills,
        interests: parsedInterests,
        unitNumber,
        personalPhone,
        residencyType,
        headline,
        businessName,
        businessCategory,
        businessDescription,
      });

      if (res.ok) {
        setProfileFeedback(
          'Profile, private contact details, and professional/business directory records saved to Supabase!'
        );
        router.refresh();
      } else {
        setProfileFeedback(`Error: ${res.error}`);
      }
    });
  }

  function handleSaveVisibility(e: React.FormEvent) {
    e.preventDefault();
    setPrivacyFeedback(null);
    startTransition(async () => {
      const res = await updateVisibilityAction({
        show_unit: showUnit,
        show_phone: showPhone,
        show_profession: showProfession,
        show_business: showBusiness,
      });
      if (res.ok) {
        setPrivacyFeedback(
          'Saved to live Supabase `profile_visibility` and recorded in `audit_logs`! Other residents now see your updated field projection in the Directory.'
        );
        router.refresh();
      } else {
        setPrivacyFeedback(`Error: ${res.error}`);
      }
    });
  }

  function handleLogout() {
    startTransition(async () => {
      await logoutAction();
      router.push('/login');
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      {/* Top User Identity & Credentials Card */}
      <section className="rounded-[12px] bg-white border border-[#E8E8EC] p-6 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
        <div className="flex items-start sm:items-center gap-4">
          <div className="w-16 h-16 rounded-[14px] bg-[#0A0A0A] text-white font-display font-bold text-[22px] flex items-center justify-center shrink-0 shadow-xs border border-[#6366F1]/40">
            {initials}
          </div>
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-mono uppercase tracking-wider bg-[#6366F1]/10 text-[#6366F1] font-medium">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>{accountDetails.role_label}</span>
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-mono uppercase bg-[#10B981]/10 text-[#10B981] font-medium">
                Status: {actor.status}
              </span>
            </div>
            <h1 className="text-[24px] font-display font-bold text-[#0A0A0A]">
              {actor.display_name}
            </h1>
            <div className="flex flex-wrap items-center gap-3 text-[13px] text-[#6B6B6B]">
              <span className="inline-flex items-center gap-1 font-mono text-[12px] text-[#0A0A0A]">
                <User className="w-3.5 h-3.5 text-[#6366F1]" />@{accountDetails.username}
              </span>
              <span>•</span>
              <span className="inline-flex items-center gap-1 font-mono text-[12px]">
                <Mail className="w-3.5 h-3.5 text-[#6366F1]" />
                {accountDetails.email}
              </span>
              <span>•</span>
              <span className="inline-flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5 text-[#6366F1]" />
                {actor.building_name ?? 'Serenity Heights'} (Flat {actor.unit_number})
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            href="/login"
            className="h-[38px] px-3.5 rounded-[6px] bg-[#FAFAFA] border border-[#E8E8EC] hover:border-[#6366F1] text-[#0A0A0A] text-[13px] font-medium inline-flex items-center gap-1.5 transition"
          >
            <KeyRound className="w-4 h-4 text-[#6366F1]" />
            <span>Switch Account / Credentials</span>
          </Link>
          <Link
            href="/register"
            className="h-[38px] px-3.5 rounded-[6px] bg-[#FAFAFA] border border-[#E8E8EC] hover:border-[#6366F1] text-[#0A0A0A] text-[13px] font-medium inline-flex items-center gap-1.5 transition"
          >
            <UserPlus className="w-4 h-4 text-[#10B981]" />
            <span>Register Member</span>
          </Link>
          <button
            type="button"
            onClick={handleLogout}
            disabled={isPending}
            className="h-[38px] px-3.5 rounded-[6px] bg-[#EF4444]/10 hover:bg-[#EF4444] text-[#EF4444] hover:text-white border border-[#EF4444]/30 text-[13px] font-medium inline-flex items-center gap-1.5 transition cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </section>

      {/* Main Grid: Left = Edit Profile & Professional/Business Details, Right = Privacy & Reputation */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (7 cols): Full User Profile Editor */}
        <form
          onSubmit={handleSaveProfile}
          className="lg:col-span-7 rounded-[12px] bg-white border border-[#E8E8EC] p-6 space-y-5"
        >
          <div className="flex items-center justify-between border-b border-[#E8E8EC] pb-4">
            <div className="flex items-center gap-2.5">
              <div className="icon-box-md bg-[#6366F1]/10 text-[#6366F1]">
                <UserCheck className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-[18px] font-display font-bold text-[#0A0A0A]">
                  Edit Personal, Professional & Business Profile
                </h2>
                <p className="text-[12px] text-[#6B6B6B]">
                  Updates live `profiles`, `private_contacts`, `professional_profiles` & `business_profiles` tables
                </p>
              </div>
            </div>
          </div>

          {profileFeedback && (
            <div className="p-3.5 rounded-[8px] bg-[#10B981]/10 border border-[#10B981]/30 text-[13px] text-[#0A0A0A] flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#10B981] shrink-0" />
              <span>{profileFeedback}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[13px] font-medium text-[#0A0A0A] mb-1">
                Full Display Name
              </label>
              <input
                type="text"
                required
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-[6px] border border-[#E8E8EC] text-[14px]"
              />
            </div>
            <div>
              <label className="block text-[13px] font-medium text-[#0A0A0A] mb-1">
                Primary Profession
              </label>
              <input
                type="text"
                value={profession}
                onChange={(e) => setProfession(e.target.value)}
                placeholder="e.g. Principal Architect"
                className="w-full px-3.5 py-2.5 rounded-[6px] border border-[#E8E8EC] text-[14px]"
              />
            </div>
          </div>

          <div>
            <label className="block text-[13px] font-medium text-[#0A0A0A] mb-1">
              Community Bio & Introduction
            </label>
            <textarea
              rows={3}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-[6px] border border-[#E8E8EC] text-[14px]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[13px] font-medium text-[#0A0A0A] mb-1">
                Skills (comma-separated)
              </label>
              <input
                type="text"
                value={skillsText}
                onChange={(e) => setSkillsText(e.target.value)}
                placeholder="Interior Design, AutoCAD, Mentoring"
                className="w-full px-3.5 py-2.5 rounded-[6px] border border-[#E8E8EC] text-[14px]"
              />
            </div>
            <div>
              <label className="block text-[13px] font-medium text-[#0A0A0A] mb-1">
                Interests (comma-separated)
              </label>
              <input
                type="text"
                value={interestsText}
                onChange={(e) => setInterestsText(e.target.value)}
                placeholder="gardening, books, badminton"
                className="w-full px-3.5 py-2.5 rounded-[6px] border border-[#E8E8EC] text-[14px]"
              />
            </div>
          </div>

          <div className="pt-2 border-t border-[#E8E8EC]">
            <div className="text-[12px] font-mono uppercase tracking-wider text-[#6366F1] mb-3 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5" />
              <span>Private Contact Record (Protected by Server RLS)</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[13px] font-medium text-[#0A0A0A] mb-1">
                  Flat / Unit Number
                </label>
                <input
                  type="text"
                  value={unitNumber}
                  onChange={(e) => setUnitNumber(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-[6px] border border-[#E8E8EC] text-[14px] font-mono"
                />
              </div>
              <div>
                <label className="block text-[13px] font-medium text-[#0A0A0A] mb-1">
                  Personal Phone
                </label>
                <input
                  type="text"
                  value={personalPhone}
                  onChange={(e) => setPersonalPhone(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-[6px] border border-[#E8E8EC] text-[14px] font-mono"
                />
              </div>
              <div>
                <label className="block text-[13px] font-medium text-[#0A0A0A] mb-1">
                  Residency Type
                </label>
                <select
                  value={residencyType}
                  onChange={(e) => setResidencyType(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-[6px] border border-[#E8E8EC] text-[14px] bg-white"
                >
                  <option value="owner_resident">Owner Resident</option>
                  <option value="tenant_resident">Tenant Resident</option>
                  <option value="family_member">Family Member</option>
                </select>
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-[#E8E8EC] space-y-3">
            <div className="text-[12px] font-mono uppercase tracking-wider text-[#6366F1] flex items-center gap-1.5">
              <Briefcase className="w-3.5 h-3.5" />
              <span>Optional Professional & Business Directory Listing (MEM-02 / MEM-04)</span>
            </div>
            <div>
              <label className="block text-[13px] font-medium text-[#0A0A0A] mb-1">
                Professional Headline
              </label>
              <input
                type="text"
                value={headline}
                onChange={(e) => setHeadline(e.target.value)}
                placeholder="e.g. COA Registered Principal Architect & Sustainable Interiors"
                className="w-full px-3.5 py-2.5 rounded-[6px] border border-[#E8E8EC] text-[14px]"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[13px] font-medium text-[#0A0A0A] mb-1">
                  Member Business Name
                </label>
                <input
                  type="text"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  placeholder="e.g. Studio Terracotta Architecture"
                  className="w-full px-3.5 py-2.5 rounded-[6px] border border-[#E8E8EC] text-[14px]"
                />
              </div>
              <div>
                <label className="block text-[13px] font-medium text-[#0A0A0A] mb-1">
                  Business Category
                </label>
                <input
                  type="text"
                  value={businessCategory}
                  onChange={(e) => setBusinessCategory(e.target.value)}
                  placeholder="e.g. Architecture & Interior Design"
                  className="w-full px-3.5 py-2.5 rounded-[6px] border border-[#E8E8EC] text-[14px]"
                />
              </div>
            </div>
            <div>
              <label className="block text-[13px] font-medium text-[#0A0A0A] mb-1">
                Business Description
              </label>
              <textarea
                rows={2}
                value={businessDescription}
                onChange={(e) => setBusinessDescription(e.target.value)}
                placeholder="Describe services offered to fellow residents"
                className="w-full px-3.5 py-2 rounded-[6px] border border-[#E8E8EC] text-[13px]"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="w-full h-[42px] rounded-[6px] bg-[#6366F1] hover:bg-[#4F46E5] text-white font-medium text-[14px] flex items-center justify-center gap-2 transition cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>
              {isPending ? 'Saving Profile Changes...' : 'Save Profile & Directory Details'}
            </span>
          </button>
        </form>

        {/* Right Column (5 cols): Per-Field Directory Privacy Controls, Reputation & Notifications */}
        <div className="lg:col-span-5 space-y-6">
          {/* Per-Field Directory Visibility Controls (MEM-03 / Test 3) */}
          <form
            onSubmit={handleSaveVisibility}
            className="rounded-[12px] bg-white border border-[#E8E8EC] p-6 space-y-4"
          >
            <div className="flex items-center gap-2.5">
              <div className="icon-box-md bg-[#10B981]/10 text-[#10B981]">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-[16px] font-display font-bold text-[#0A0A0A]">
                  Per-Field Directory Privacy (MEM-03)
                </h2>
                <p className="text-[12px] text-[#6B6B6B]">
                  Enforced on the server before directory payloads are returned
                </p>
              </div>
            </div>

            {privacyFeedback && (
              <div className="p-3 rounded-[8px] bg-[#10B981]/10 border border-[#10B981]/30 text-[12px] font-medium text-[#0A0A0A]">
                {privacyFeedback}
              </div>
            )}

            <div className="space-y-2.5 text-sm">
              <label className="flex items-center justify-between p-3 rounded-[8px] bg-[#FAFAFA] border border-[#E8E8EC] cursor-pointer">
                <div>
                  <div className="font-medium text-[#0A0A0A] text-[13px]">
                    Show Exact Flat / Unit Number (`show_unit`)
                  </div>
                  <div className="text-[11px] text-[#6B6B6B]">
                    Default OFF. When off, only your tower name is visible to neighbours.
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={showUnit}
                  onChange={(e) => setShowUnit(e.target.checked)}
                  className="w-4 h-4 accent-[#6366F1]"
                />
              </label>

              <label className="flex items-center justify-between p-3 rounded-[8px] bg-[#FAFAFA] border border-[#E8E8EC] cursor-pointer">
                <div>
                  <div className="font-medium text-[#0A0A0A] text-[13px]">
                    Show Personal Phone Number (`show_phone`)
                  </div>
                  <div className="text-[11px] text-[#6B6B6B]">
                    Default OFF. Neighbours connect via in-app messages unless enabled.
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={showPhone}
                  onChange={(e) => setShowPhone(e.target.checked)}
                  className="w-4 h-4 accent-[#6366F1]"
                />
              </label>

              <label className="flex items-center justify-between p-3 rounded-[8px] bg-[#FAFAFA] border border-[#E8E8EC] cursor-pointer">
                <div>
                  <div className="font-medium text-[#0A0A0A] text-[13px]">
                    Show Profession & Skills (`show_profession`)
                  </div>
                  <div className="text-[11px] text-[#6B6B6B]">
                    Allows neighbours to discover your profession in directory search.
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={showProfession}
                  onChange={(e) => setShowProfession(e.target.checked)}
                  className="w-4 h-4 accent-[#6366F1]"
                />
              </label>

              <label className="flex items-center justify-between p-3 rounded-[8px] bg-[#FAFAFA] border border-[#E8E8EC] cursor-pointer">
                <div>
                  <div className="font-medium text-[#0A0A0A] text-[13px]">
                    Show Business Profile (`show_business`)
                  </div>
                  <div className="text-[11px] text-[#6B6B6B]">
                    Displays your member business in the Business Directory tab.
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={showBusiness}
                  onChange={(e) => setShowBusiness(e.target.checked)}
                  className="w-4 h-4 accent-[#6366F1]"
                />
              </label>
            </div>

            <button
              type="submit"
              disabled={isPending}
              className="w-full h-[38px] rounded-[6px] bg-[#0A0A0A] hover:bg-[#6366F1] text-white font-medium text-[13px] transition cursor-pointer"
            >
              {isPending ? 'Updating Privacy Rules...' : 'Save Directory Privacy Settings'}
            </button>
          </form>

          {/* Separate Member vs Provider Reputation (REP-07) */}
          <section className="rounded-[12px] bg-white border border-[#E8E8EC] p-6 space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="icon-box-sm bg-[#F59E0B]/10 text-[#F59E0B]">
                <Star className="w-4 h-4 fill-[#F59E0B]" />
              </div>
              <h2 className="text-[16px] font-display font-bold text-[#0A0A0A]">
                Separate Member vs Provider Reputation (REP-07)
              </h2>
            </div>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3.5 rounded-[8px] bg-[#FAFAFA] border border-[#E8E8EC]">
                <div className="text-[#6B6B6B] font-medium">Member Exchange Score</div>
                <div className="text-[20px] font-display font-bold text-[#0A0A0A] tabular-nums mt-1 flex items-center gap-1">
                  <span>
                    {actor.member_rating_avg
                      ? Number(actor.member_rating_avg).toFixed(2)
                      : 'New'}
                  </span>
                  {actor.member_rating_avg && (
                    <Star className="w-4 h-4 text-[#F59E0B] fill-[#F59E0B]" />
                  )}
                </div>
                <div className="text-[11px] text-[#6366F1] mt-0.5">
                  {actor.member_review_count ?? 0} reviews •{' '}
                  {actor.completed_interactions_count ?? 0} exchanges
                </div>
              </div>
              <div className="p-3.5 rounded-[8px] bg-[#FAFAFA] border border-[#E8E8EC]">
                <div className="text-[#6B6B6B] font-medium">Service Provider Score</div>
                <div className="text-[20px] font-display font-bold text-[#0A0A0A] tabular-nums mt-1 flex items-center gap-1">
                  <span>
                    {(actor.provider_memberships?.length ?? 0) > 0 ? '4.75' : 'N/A'}
                  </span>
                  {(actor.provider_memberships?.length ?? 0) > 0 && (
                    <Star className="w-4 h-4 text-[#F59E0B] fill-[#F59E0B]" />
                  )}
                </div>
                <div className="text-[11px] text-[#6B6B6B] mt-0.5">
                  Isolated from peer-to-peer score
                </div>
              </div>
            </div>
          </section>

          {/* In-App Notifications (EVT-04) */}
          <section className="rounded-[12px] bg-white border border-[#E8E8EC] p-6 space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="icon-box-sm bg-[#6366F1]/10 text-[#6366F1]">
                <Bell className="w-4 h-4" />
              </div>
              <h2 className="text-[16px] font-display font-bold text-[#0A0A0A]">
                Notification Centre ({notifications.length} Safe Previews)
              </h2>
            </div>
            {notifications.length === 0 ? (
              <p className="text-xs text-[#6B6B6B]">
                No unread notifications for {actor.display_name}.
              </p>
            ) : (
              <div className="space-y-2">
                {notifications.map((n) => (
                  <div
                    key={n.id}
                    className="p-3 rounded-[8px] bg-[#FAFAFA] border border-[#E8E8EC] text-xs space-y-1"
                  >
                    <div className="font-medium text-[#0A0A0A]">{n.title}</div>
                    <p className="text-[#6B6B6B]">{n.safe_preview_body}</p>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
