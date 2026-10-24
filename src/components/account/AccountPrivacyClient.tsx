'use client';

import React, { useState, useTransition } from 'react';
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
  Mail,
  KeyRound,
  LogOut,
  CheckCircle2,
  Save,
  AlertCircle,
} from 'lucide-react';
import type { ActorContext, NotificationItem } from '@/lib/types/domain';
import type { ActorAccountDetails } from '@/lib/data/community-loader';
import {
  updateVisibilityAction,
  updateMemberProfileAction,
  changeUserPasswordAction,
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
  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'privacy'>('profile');

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

  // Password Change State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [passwordFeedback, setPasswordFeedback] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  // Per-Field Visibility State
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
        setProfileFeedback('Your profile changes have been saved.');
        router.refresh();
      } else {
        setProfileFeedback(`Error: ${res.error}`);
      }
    });
  }

  function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    setPasswordFeedback(null);

    if (newPassword !== confirmNewPassword) {
      setPasswordFeedback({
        type: 'error',
        text: 'New password and confirmation do not match.',
      });
      return;
    }

    startTransition(async () => {
      const res = await changeUserPasswordAction({
        currentPassword,
        newPassword,
      });

      if (res.ok) {
        setPasswordFeedback({
          type: 'success',
          text: 'Your password has been updated successfully.',
        });
        setCurrentPassword('');
        setNewPassword('');
        setConfirmNewPassword('');
      } else {
        setPasswordFeedback({
          type: 'error',
          text: res.error ?? 'Could not update password.',
        });
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
        setPrivacyFeedback('Privacy preferences saved.');
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
      {/* Clean Profile Header Card */}
      <section className="rounded-[16px] bg-white border border-[#E8E8EC] p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-[16px] bg-gradient-to-br from-[#6366F1] to-[#4F46E5] text-white font-display font-bold text-[22px] flex items-center justify-center shrink-0 shadow-xs">
            {initials}
          </div>
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[#6366F1]/10 text-[#6366F1]">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>{accountDetails.role_label}</span>
              </span>
              {actor.member_rating_avg && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[#F59E0B]/15 text-[#D97706]">
                  <Star className="w-3 h-3 fill-[#F59E0B] text-[#F59E0B]" />
                  <span>{Number(actor.member_rating_avg).toFixed(2)} Member Rating</span>
                </span>
              )}
            </div>
            <h1 className="text-[22px] font-display font-bold text-[#0A0A0A]">
              {actor.display_name}
            </h1>
            <div className="flex flex-wrap items-center gap-3 text-[13px] text-[#6B6B6B]">
              <span className="inline-flex items-center gap-1 font-mono text-[12px] text-[#0A0A0A]">
                <User className="w-3.5 h-3.5 text-[#6366F1]" />@{accountDetails.username}
              </span>
              <span>•</span>
              <span className="inline-flex items-center gap-1">
                <Mail className="w-3.5 h-3.5 text-[#0EA5E9]" />
                {accountDetails.email}
              </span>
              <span>•</span>
              <span className="inline-flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5 text-[#10B981]" />
                {actor.building_name ?? 'Tower'} • Flat {actor.unit_number}
              </span>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={handleLogout}
          disabled={isPending}
          className="h-[40px] px-4 rounded-[8px] bg-[#EF4444] hover:bg-[#DC2626] text-white text-[13px] font-medium inline-flex items-center gap-2 transition cursor-pointer self-start sm:self-center"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
      </section>

      {/* Colorful Tab Selector */}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setActiveTab('profile')}
          className={`h-[40px] px-4 rounded-[10px] text-[13px] font-medium inline-flex items-center gap-2 transition cursor-pointer ${
            activeTab === 'profile'
              ? 'bg-[#6366F1] text-white shadow-xs'
              : 'bg-white border border-[#E8E8EC] text-[#6B6B6B] hover:text-[#0A0A0A]'
          }`}
        >
          <UserCheck className="w-4 h-4" />
          <span>Edit Profile & Business</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('security')}
          className={`h-[40px] px-4 rounded-[10px] text-[13px] font-medium inline-flex items-center gap-2 transition cursor-pointer ${
            activeTab === 'security'
              ? 'bg-[#F59E0B] text-white shadow-xs'
              : 'bg-white border border-[#E8E8EC] text-[#6B6B6B] hover:text-[#0A0A0A]'
          }`}
        >
          <KeyRound className="w-4 h-4" />
          <span>Password & Security</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('privacy')}
          className={`h-[40px] px-4 rounded-[10px] text-[13px] font-medium inline-flex items-center gap-2 transition cursor-pointer ${
            activeTab === 'privacy'
              ? 'bg-[#10B981] text-white shadow-xs'
              : 'bg-white border border-[#E8E8EC] text-[#6B6B6B] hover:text-[#0A0A0A]'
          }`}
        >
          <Lock className="w-4 h-4" />
          <span>Privacy & Notifications ({notifications.length})</span>
        </button>
      </div>

      {/* TAB 1: PROFILE EDITOR */}
      {activeTab === 'profile' && (
        <form
          onSubmit={handleSaveProfile}
          className="rounded-[16px] bg-white border border-[#E8E8EC] p-6 space-y-5"
        >
          <div className="flex items-center gap-2.5 border-b border-[#E8E8EC] pb-4">
            <div className="icon-box-md bg-[#6366F1]/10 text-[#6366F1]">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-[18px] font-display font-bold text-[#0A0A0A]">
                Personal & Directory Profile
              </h2>
              <p className="text-[13px] text-[#6B6B6B]">
                Update your name, profession, contact details, and optional resident business listing.
              </p>
            </div>
          </div>

          {profileFeedback && (
            <div className="p-3.5 rounded-[10px] bg-[#10B981]/10 border border-[#10B981]/30 text-[13px] text-[#0A0A0A] flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#10B981] shrink-0" />
              <span>{profileFeedback}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[13px] font-medium text-[#0A0A0A] mb-1">
                Full Name
              </label>
              <input
                type="text"
                required
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-[8px] border border-[#E8E8EC] text-[14px]"
              />
            </div>
            <div>
              <label className="block text-[13px] font-medium text-[#0A0A0A] mb-1">
                Profession
              </label>
              <input
                type="text"
                value={profession}
                onChange={(e) => setProfession(e.target.value)}
                placeholder="e.g. Principal Architect"
                className="w-full px-3.5 py-2.5 rounded-[8px] border border-[#E8E8EC] text-[14px]"
              />
            </div>
          </div>

          <div>
            <label className="block text-[13px] font-medium text-[#0A0A0A] mb-1">
              About Me (Bio)
            </label>
            <textarea
              rows={2}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-[8px] border border-[#E8E8EC] text-[14px]"
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
                placeholder="Interior Design, AutoCAD"
                className="w-full px-3.5 py-2.5 rounded-[8px] border border-[#E8E8EC] text-[14px]"
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
                className="w-full px-3.5 py-2.5 rounded-[8px] border border-[#E8E8EC] text-[14px]"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-[#E8E8EC] grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-[13px] font-medium text-[#0A0A0A] mb-1">
                Flat / Unit Number
              </label>
              <input
                type="text"
                value={unitNumber}
                onChange={(e) => setUnitNumber(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-[8px] border border-[#E8E8EC] text-[14px] font-mono"
              />
            </div>
            <div>
              <label className="block text-[13px] font-medium text-[#0A0A0A] mb-1">
                Phone Number
              </label>
              <input
                type="text"
                value={personalPhone}
                onChange={(e) => setPersonalPhone(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-[8px] border border-[#E8E8EC] text-[14px] font-mono"
              />
            </div>
            <div>
              <label className="block text-[13px] font-medium text-[#0A0A0A] mb-1">
                Residency Type
              </label>
              <select
                value={residencyType}
                onChange={(e) => setResidencyType(e.target.value)}
                className="w-full px-3 py-2.5 rounded-[8px] border border-[#E8E8EC] text-[14px] bg-white"
              >
                <option value="owner_resident">Owner Resident</option>
                <option value="tenant_resident">Tenant Resident</option>
                <option value="family_member">Family Member</option>
              </select>
            </div>
          </div>

          <div className="pt-3 border-t border-[#E8E8EC] space-y-3">
            <div className="text-[13px] font-medium text-[#0A0A0A] flex items-center gap-1.5">
              <Briefcase className="w-4 h-4 text-[#6366F1]" />
              <span>Professional Headline & Member Business (Optional)</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[12px] text-[#6B6B6B] mb-1">
                  Professional Headline
                </label>
                <input
                  type="text"
                  value={headline}
                  onChange={(e) => setHeadline(e.target.value)}
                  placeholder="e.g. Chartered Accountant"
                  className="w-full px-3.5 py-2 rounded-[8px] border border-[#E8E8EC] text-[13px]"
                />
              </div>
              <div>
                <label className="block text-[12px] text-[#6B6B6B] mb-1">Business Name</label>
                <input
                  type="text"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  placeholder="e.g. Studio Terracotta"
                  className="w-full px-3.5 py-2 rounded-[8px] border border-[#E8E8EC] text-[13px]"
                />
              </div>
              <div>
                <label className="block text-[12px] text-[#6B6B6B] mb-1">Business Category</label>
                <input
                  type="text"
                  value={businessCategory}
                  onChange={(e) => setBusinessCategory(e.target.value)}
                  placeholder="e.g. Architecture"
                  className="w-full px-3.5 py-2 rounded-[8px] border border-[#E8E8EC] text-[13px]"
                />
              </div>
            </div>
            <div>
              <label className="block text-[12px] text-[#6B6B6B] mb-1">Business Description</label>
              <input
                type="text"
                value={businessDescription}
                onChange={(e) => setBusinessDescription(e.target.value)}
                placeholder="Short summary of services offered to neighbours"
                className="w-full px-3.5 py-2 rounded-[8px] border border-[#E8E8EC] text-[13px]"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="h-[42px] px-6 rounded-[8px] bg-gradient-to-r from-[#6366F1] to-[#4F46E5] hover:from-[#4F46E5] hover:to-[#4338CA] text-white font-medium text-[14px] inline-flex items-center gap-2 shadow-xs transition cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>{isPending ? 'Saving...' : 'Save Profile Changes'}</span>
          </button>
        </form>
      )}

      {/* TAB 2: PASSWORD & SECURITY */}
      {activeTab === 'security' && (
        <div className="max-w-xl rounded-[16px] bg-white border border-[#E8E8EC] p-6 space-y-5">
          <div className="flex items-center gap-2.5 border-b border-[#E8E8EC] pb-4">
            <div className="icon-box-md bg-[#F59E0B]/10 text-[#D97706]">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-[18px] font-display font-bold text-[#0A0A0A]">
                Update Account Password
              </h2>
              <p className="text-[13px] text-[#6B6B6B]">
                Change the password for <strong>@{accountDetails.username}</strong> ({accountDetails.email}).
              </p>
            </div>
          </div>

          {passwordFeedback && (
            <div
              className={`p-3.5 rounded-[10px] text-[13px] flex items-center gap-2 ${
                passwordFeedback.type === 'success'
                  ? 'bg-[#10B981]/10 border border-[#10B981]/30 text-[#0A0A0A]'
                  : 'bg-[#EF4444]/10 border border-[#EF4444]/30 text-[#EF4444]'
              }`}
            >
              {passwordFeedback.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-[#10B981] shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0" />
              )}
              <span>{passwordFeedback.text}</span>
            </div>
          )}

          <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
              <label className="block text-[13px] font-medium text-[#0A0A0A] mb-1">
                Current Password
              </label>
              <input
                type="password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter current password"
                className="w-full px-3.5 py-2.5 rounded-[8px] border border-[#E8E8EC] text-[14px] font-mono"
              />
            </div>

            <div>
              <label className="block text-[13px] font-medium text-[#0A0A0A] mb-1">
                New Password (minimum 6 characters)
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
                className="w-full px-3.5 py-2.5 rounded-[8px] border border-[#E8E8EC] text-[14px] font-mono"
              />
            </div>

            <div>
              <label className="block text-[13px] font-medium text-[#0A0A0A] mb-1">
                Confirm New Password
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
                placeholder="Repeat new password"
                className="w-full px-3.5 py-2.5 rounded-[8px] border border-[#E8E8EC] text-[14px] font-mono"
              />
            </div>

            <button
              type="submit"
              disabled={isPending}
              className="h-[42px] px-6 rounded-[8px] bg-gradient-to-r from-[#F59E0B] to-[#D97706] hover:from-[#D97706] hover:to-[#B45309] text-white font-medium text-[14px] inline-flex items-center gap-2 shadow-xs transition cursor-pointer"
            >
              <KeyRound className="w-4 h-4" />
              <span>{isPending ? 'Updating Password...' : 'Update Password'}</span>
            </button>
          </form>
        </div>
      )}

      {/* TAB 3: PRIVACY & NOTIFICATIONS */}
      {activeTab === 'privacy' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <form
            onSubmit={handleSaveVisibility}
            className="rounded-[16px] bg-white border border-[#E8E8EC] p-6 space-y-4"
          >
            <div className="flex items-center gap-2.5">
              <div className="icon-box-md bg-[#10B981]/10 text-[#10B981]">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-[18px] font-display font-bold text-[#0A0A0A]">
                  Directory Privacy Settings
                </h2>
                <p className="text-[13px] text-[#6B6B6B]">
                  Choose which details neighbours can see in the directory.
                </p>
              </div>
            </div>

            {privacyFeedback && (
              <div className="p-3 rounded-[8px] bg-[#10B981]/10 border border-[#10B981]/30 text-[13px] font-medium text-[#0A0A0A]">
                {privacyFeedback}
              </div>
            )}

            <div className="space-y-2.5">
              <label className="flex items-center justify-between p-3.5 rounded-[10px] bg-[#FAFAFA] border border-[#E8E8EC] cursor-pointer">
                <div>
                  <div className="font-medium text-[#0A0A0A] text-[14px]">
                    Show Flat / Unit Number
                  </div>
                  <div className="text-[12px] text-[#6B6B6B]">
                    When off, only your tower name is displayed.
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={showUnit}
                  onChange={(e) => setShowUnit(e.target.checked)}
                  className="w-4 h-4 accent-[#10B981]"
                />
              </label>

              <label className="flex items-center justify-between p-3.5 rounded-[10px] bg-[#FAFAFA] border border-[#E8E8EC] cursor-pointer">
                <div>
                  <div className="font-medium text-[#0A0A0A] text-[14px]">
                    Show Phone Number
                  </div>
                  <div className="text-[12px] text-[#6B6B6B]">
                    When off, neighbours connect via in-app messages.
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={showPhone}
                  onChange={(e) => setShowPhone(e.target.checked)}
                  className="w-4 h-4 accent-[#10B981]"
                />
              </label>

              <label className="flex items-center justify-between p-3.5 rounded-[10px] bg-[#FAFAFA] border border-[#E8E8EC] cursor-pointer">
                <div>
                  <div className="font-medium text-[#0A0A0A] text-[14px]">
                    Show Profession & Skills
                  </div>
                  <div className="text-[12px] text-[#6B6B6B]">
                    Helps neighbours find your professional skills.
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={showProfession}
                  onChange={(e) => setShowProfession(e.target.checked)}
                  className="w-4 h-4 accent-[#10B981]"
                />
              </label>

              <label className="flex items-center justify-between p-3.5 rounded-[10px] bg-[#FAFAFA] border border-[#E8E8EC] cursor-pointer">
                <div>
                  <div className="font-medium text-[#0A0A0A] text-[14px]">
                    Show Business Listing
                  </div>
                  <div className="text-[12px] text-[#6B6B6B]">
                    Displays your business in the Community Directory.
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={showBusiness}
                  onChange={(e) => setShowBusiness(e.target.checked)}
                  className="w-4 h-4 accent-[#10B981]"
                />
              </label>
            </div>

            <button
              type="submit"
              disabled={isPending}
              className="w-full h-[42px] rounded-[8px] bg-gradient-to-r from-[#10B981] to-[#059669] hover:from-[#059669] hover:to-[#047857] text-white font-medium text-[14px] transition cursor-pointer"
            >
              {isPending ? 'Saving...' : 'Save Privacy Preferences'}
            </button>
          </form>

          <section className="rounded-[16px] bg-white border border-[#E8E8EC] p-6 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="icon-box-md bg-[#6366F1]/10 text-[#6366F1]">
                <Bell className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-[18px] font-display font-bold text-[#0A0A0A]">
                  Recent Notifications
                </h2>
                <p className="text-[13px] text-[#6B6B6B]">
                  Updates from your community, orders, and exchanges
                </p>
              </div>
            </div>

            {notifications.length === 0 ? (
              <p className="text-[13px] text-[#6B6B6B]">No unread notifications.</p>
            ) : (
              <div className="space-y-2.5">
                {notifications.map((n) => (
                  <div
                    key={n.id}
                    className="p-3.5 rounded-[10px] bg-[#FAFAFA] border border-[#E8E8EC] space-y-1"
                  >
                    <div className="font-medium text-[14px] text-[#0A0A0A]">{n.title}</div>
                    <p className="text-[13px] text-[#6B6B6B]">{n.safe_preview_body}</p>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
