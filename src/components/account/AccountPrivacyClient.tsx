'use client';

import React, { useState, useTransition, useRef } from 'react';
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
  Camera,
  Upload,
  Sparkles,
} from 'lucide-react';
import type { ActorContext, NotificationItem } from '@/lib/types/domain';
import type { ActorAccountDetails } from '@/lib/data/community-loader';
import {
  updateVisibilityAction,
  updateMemberProfileAction,
  updateMemberAvatarAction,
  changeUserPasswordAction,
  logoutAction,
} from '@/app/actions/community-actions';
import { MemberAvatar, resolveMemberAvatarUrl } from '@/components/ui/MemberAvatar';

interface AccountPrivacyClientProps {
  actor: ActorContext;
  accountDetails: ActorAccountDetails;
  notifications: NotificationItem[];
}

const STUDIO_PORTRAIT_PRESETS = [
  { label: 'Priya Nair', url: '/avatars/priya-nair.jpg' },
  { label: 'Aarav Mehta', url: '/avatars/aarav-mehta.jpg' },
  { label: 'Ananya Iyer', url: '/avatars/ananya-iyer.jpg' },
  { label: 'Rohan Kulkarni', url: '/avatars/rohan-kulkarni.jpg' },
  { label: 'Zoya Merchant', url: '/avatars/zoya-merchant.jpg' },
  { label: 'Siddharth Joshi', url: '/avatars/siddharth-joshi.jpg' },
  { label: 'Neha Deshmukh', url: '/avatars/neha-deshmukh.jpg' },
  { label: 'Harpreet Gill', url: '/avatars/harpreet-gill.jpg' },
  { label: 'Kavita Krishnan', url: '/avatars/kavita-krishnan.jpg' },
  { label: 'Pranav Kapoor', url: '/avatars/pranav-kapoor.jpg' },
  { label: 'Meera Chawla', url: '/avatars/meera-chawla.jpg' },
  { label: 'Farhan Shaikh', url: '/avatars/farhan-shaikh.jpg' },
];

export function AccountPrivacyClient({
  actor,
  accountDetails,
  notifications,
}: AccountPrivacyClientProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isPending, startTransition] = useTransition();
  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'privacy'>('profile');

  // Avatar State
  const [currentAvatarUrl, setCurrentAvatarUrl] = useState<string>(
    resolveMemberAvatarUrl(actor.display_name, actor.avatar_url)
  );
  const [avatarFeedback, setAvatarFeedback] = useState<string | null>(null);
  const [showPresetPicker, setShowPresetPicker] = useState(false);

  // Profile Edit State
  const [displayName, setDisplayName] = useState(actor.display_name ?? '');
  const [profession, setProfession] = useState(actor.profession ?? '');
  const [bio, setBio] = useState(actor.bio ?? '');
  const [skillsText, setSkillsText] = useState((actor.skills ?? []).join(', '));
  const [interestsText, setInterestsText] = useState((actor.interests ?? []).join(', '));
  const [unitNumber, setUnitNumber] = useState(actor.unit_number ?? '101');
  const [personalPhone, setPersonalPhone] = useState(actor.personal_phone ?? '+65-91234567');
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

  function saveNewAvatarUrl(nextUrl: string) {
    setAvatarFeedback(null);
    setCurrentAvatarUrl(nextUrl);
    startTransition(async () => {
      const res = await updateMemberAvatarAction(nextUrl);
      if (res.ok) {
        setAvatarFeedback('Profile photo updated across all MyCircle modules.');
        setShowPresetPicker(false);
        router.refresh();
      } else {
        setAvatarFeedback(`Error saving photo: ${res.error}`);
      }
    });
  }

  function handleFileUploadChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const targetSize = 256;
        canvas.width = targetSize;
        canvas.height = targetSize;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Center crop square
        const minSide = Math.min(img.width, img.height);
        const sx = (img.width - minSide) / 2;
        const sy = (img.height - minSide) / 2;
        ctx.drawImage(img, sx, sy, minSide, minSide, 0, 0, targetSize, targetSize);

        const dataUrl = canvas.toDataURL('image/jpeg', 0.86);
        saveNewAvatarUrl(dataUrl);
      };
      if (typeof reader.result === 'string') {
        img.src = reader.result;
      }
    };
    reader.readAsDataURL(file);
  }

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
      {/* Apple-style Profile Header Card with Photo Upload */}
      <section className="rounded-[24px] bg-white border border-black/[0.06] shadow-[0_8px_30px_rgba(0,0,0,0.03)] p-6 sm:p-8 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-5">
            <div className="relative group self-start">
              <MemberAvatar
                name={actor.display_name}
                avatarUrl={currentAvatarUrl}
                size="xl"
                ring
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                title="Upload new profile photo"
                className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-[#0071E3] text-white flex items-center justify-center shadow-md hover:bg-[#0077ED] transition cursor-pointer"
              >
                <Camera className="w-4 h-4" />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUploadChange}
                className="hidden"
                aria-label="Upload Profile Photo"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1 px-3 py-0.5 rounded-full text-[11px] font-semibold bg-[#0071E3]/10 text-[#0071E3]">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>{accountDetails.role_label}</span>
                </span>
                {actor.member_rating_avg && (
                  <span className="inline-flex items-center gap-1 px-3 py-0.5 rounded-full text-[11px] font-semibold bg-[#F59E0B]/15 text-[#D97706]">
                    <Star className="w-3 h-3 fill-[#F59E0B] text-[#F59E0B]" />
                    <span>{Number(actor.member_rating_avg).toFixed(2)} Member Rating</span>
                  </span>
                )}
              </div>
              <h1 className="text-[24px] font-display font-bold text-[#1D1D1F]">
                {actor.display_name}
              </h1>
              <div className="flex flex-wrap items-center gap-3 text-[13px] text-[#6E6E73]">
                <span className="inline-flex items-center gap-1 font-mono text-[12px] text-[#1D1D1F]">
                  <User className="w-3.5 h-3.5 text-[#0071E3]" />@{accountDetails.username}
                </span>
                <span>•</span>
                <span className="inline-flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5 text-[#0EA5E9]" />
                  {accountDetails.email}
                </span>
                <span>•</span>
                <span className="inline-flex items-center gap-1">
                  <Building2 className="w-3.5 h-3.5 text-[#10B981]" />
                  {actor.building_name ?? 'Victoria Tower'} • Flat {actor.unit_number}
                </span>
              </div>

              {/* Photo Upload Controls */}
              <div className="flex flex-wrap items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isPending}
                  className="h-[34px] px-3.5 rounded-full bg-[#0071E3]/10 hover:bg-[#0071E3] text-[#0071E3] hover:text-white text-[12px] font-semibold inline-flex items-center gap-1.5 transition cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Upload Photo</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowPresetPicker((prev) => !prev)}
                  className="h-[34px] px-3.5 rounded-full bg-[#F5F5F7] hover:bg-[#E8E8ED] text-[#1D1D1F] text-[12px] font-semibold inline-flex items-center gap-1.5 border border-black/[0.06] transition cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5 text-[#8B5CF6]" />
                  <span>{showPresetPicker ? 'Hide Studio Portraits' : 'Choose Studio Portrait'}</span>
                </button>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            disabled={isPending}
            className="h-[40px] px-5 rounded-full bg-[#EF4444] hover:bg-[#DC2626] text-white text-[13px] font-semibold inline-flex items-center gap-2 transition cursor-pointer self-start sm:self-center"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>

        {avatarFeedback && (
          <div className="p-3.5 rounded-[14px] bg-[#10B981]/10 border border-[#10B981]/30 text-[13px] text-[#1D1D1F] flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#10B981] shrink-0" />
            <span>{avatarFeedback}</span>
          </div>
        )}

        {/* Studio Portrait Gallery Drawer */}
        {showPresetPicker && (
          <div className="p-5 rounded-[20px] bg-[#F5F5F7] border border-black/[0.06] space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-[13px] font-bold text-[#1D1D1F]">
                Select a Verified Studio Portrait or Upload Your Own Above
              </div>
              <button
                type="button"
                onClick={() => setShowPresetPicker(false)}
                className="text-xs font-semibold text-[#6E6E73] hover:text-[#1D1D1F]"
              >
                Close
              </button>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
              {STUDIO_PORTRAIT_PRESETS.map((preset) => {
                const selected = currentAvatarUrl === preset.url;
                return (
                  <button
                    key={preset.url}
                    type="button"
                    onClick={() => saveNewAvatarUrl(preset.url)}
                    className={`p-2.5 rounded-[16px] bg-white border flex flex-col items-center gap-1.5 transition cursor-pointer ${
                      selected
                        ? 'border-[#0071E3] ring-2 ring-[#0071E3]/25'
                        : 'border-black/[0.06] hover:border-[#0071E3]'
                    }`}
                  >
                    <MemberAvatar name={preset.label} avatarUrl={preset.url} size="md" />
                    <span className="text-[11px] font-medium text-[#1D1D1F] truncate w-full text-center">
                      {preset.label.split(' ')[0]}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </section>

      {/* Apple Segmented Tab Selector */}
      <div className="flex flex-wrap gap-2 p-1.5 rounded-full bg-white border border-black/[0.06] w-fit shadow-2xs">
        <button
          type="button"
          onClick={() => setActiveTab('profile')}
          className={`h-[38px] px-5 rounded-full text-[13px] font-semibold inline-flex items-center gap-2 transition cursor-pointer ${
            activeTab === 'profile'
              ? 'bg-[#0071E3] text-white shadow-xs'
              : 'text-[#6E6E73] hover:text-[#1D1D1F]'
          }`}
        >
          <UserCheck className="w-4 h-4" />
          <span>Edit Profile & Business</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('security')}
          className={`h-[38px] px-5 rounded-full text-[13px] font-semibold inline-flex items-center gap-2 transition cursor-pointer ${
            activeTab === 'security'
              ? 'bg-[#F59E0B] text-white shadow-xs'
              : 'text-[#6E6E73] hover:text-[#1D1D1F]'
          }`}
        >
          <KeyRound className="w-4 h-4" />
          <span>Password & Security</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('privacy')}
          className={`h-[38px] px-5 rounded-full text-[13px] font-semibold inline-flex items-center gap-2 transition cursor-pointer ${
            activeTab === 'privacy'
              ? 'bg-[#10B981] text-white shadow-xs'
              : 'text-[#6E6E73] hover:text-[#1D1D1F]'
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
          className="rounded-[24px] bg-white border border-black/[0.06] shadow-[0_8px_30px_rgba(0,0,0,0.03)] p-6 sm:p-8 space-y-6"
        >
          <div className="flex items-center gap-3 border-b border-black/[0.06] pb-5">
            <div className="icon-box-md bg-[#0071E3]/10 text-[#0071E3]">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-[19px] font-display font-bold text-[#1D1D1F]">
                Personal & Directory Profile
              </h2>
              <p className="text-[13px] text-[#6E6E73]">
                Update your name, profession, contact details, and optional resident business listing.
              </p>
            </div>
          </div>

          {profileFeedback && (
            <div className="p-4 rounded-[14px] bg-[#10B981]/10 border border-[#10B981]/30 text-[13px] text-[#1D1D1F] flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#10B981] shrink-0" />
              <span>{profileFeedback}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-[13px] font-semibold text-[#1D1D1F] mb-1.5">
                Full Name
              </label>
              <input
                type="text"
                required
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full px-4 py-2.5 rounded-[12px] border border-black/[0.1] text-[14px]"
              />
            </div>
            <div>
              <label className="block text-[13px] font-semibold text-[#1D1D1F] mb-1.5">
                Profession
              </label>
              <input
                type="text"
                value={profession}
                onChange={(e) => setProfession(e.target.value)}
                placeholder="e.g. Principal Architect"
                className="w-full px-4 py-2.5 rounded-[12px] border border-black/[0.1] text-[14px]"
              />
            </div>
          </div>

          <div>
            <label className="block text-[13px] font-semibold text-[#1D1D1F] mb-1.5">
              About Me (Bio)
            </label>
            <textarea
              rows={2}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="w-full px-4 py-2.5 rounded-[12px] border border-black/[0.1] text-[14px]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-[13px] font-semibold text-[#1D1D1F] mb-1.5">
                Skills (comma-separated)
              </label>
              <input
                type="text"
                value={skillsText}
                onChange={(e) => setSkillsText(e.target.value)}
                placeholder="Interior Design, AutoCAD"
                className="w-full px-4 py-2.5 rounded-[12px] border border-black/[0.1] text-[14px]"
              />
            </div>
            <div>
              <label className="block text-[13px] font-semibold text-[#1D1D1F] mb-1.5">
                Interests (comma-separated)
              </label>
              <input
                type="text"
                value={interestsText}
                onChange={(e) => setInterestsText(e.target.value)}
                placeholder="gardening, books, badminton"
                className="w-full px-4 py-2.5 rounded-[12px] border border-black/[0.1] text-[14px]"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-black/[0.06] grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div>
              <label className="block text-[13px] font-semibold text-[#1D1D1F] mb-1.5">
                Flat / Unit Number
              </label>
              <input
                type="text"
                value={unitNumber}
                onChange={(e) => setUnitNumber(e.target.value)}
                className="w-full px-4 py-2.5 rounded-[12px] border border-black/[0.1] text-[14px] font-mono"
              />
            </div>
            <div>
              <label className="block text-[13px] font-semibold text-[#1D1D1F] mb-1.5">
                Phone Number
              </label>
              <input
                type="text"
                value={personalPhone}
                onChange={(e) => setPersonalPhone(e.target.value)}
                className="w-full px-4 py-2.5 rounded-[12px] border border-black/[0.1] text-[14px] font-mono"
              />
            </div>
            <div>
              <label className="block text-[13px] font-semibold text-[#1D1D1F] mb-1.5">
                Residency Type
              </label>
              <select
                value={residencyType}
                onChange={(e) => setResidencyType(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-[12px] border border-black/[0.1] text-[14px] bg-white"
              >
                <option value="owner_resident">Owner Resident</option>
                <option value="tenant_resident">Tenant Resident</option>
                <option value="family_member">Family Member</option>
              </select>
            </div>
          </div>

          <div className="pt-4 border-t border-black/[0.06] space-y-4">
            <div className="text-[13px] font-semibold text-[#1D1D1F] flex items-center gap-1.5">
              <Briefcase className="w-4 h-4 text-[#0071E3]" />
              <span>Professional Headline & Member Business (Optional)</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-[12px] text-[#6E6E73] mb-1">
                  Professional Headline
                </label>
                <input
                  type="text"
                  value={headline}
                  onChange={(e) => setHeadline(e.target.value)}
                  placeholder="e.g. Chartered Accountant"
                  className="w-full px-4 py-2 rounded-[12px] border border-black/[0.1] text-[13px]"
                />
              </div>
              <div>
                <label className="block text-[12px] text-[#6E6E73] mb-1">Business Name</label>
                <input
                  type="text"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  placeholder="e.g. Studio Terracotta"
                  className="w-full px-4 py-2 rounded-[12px] border border-black/[0.1] text-[13px]"
                />
              </div>
              <div>
                <label className="block text-[12px] text-[#6E6E73] mb-1">Business Category</label>
                <input
                  type="text"
                  value={businessCategory}
                  onChange={(e) => setBusinessCategory(e.target.value)}
                  placeholder="e.g. Architecture"
                  className="w-full px-4 py-2 rounded-[12px] border border-black/[0.1] text-[13px]"
                />
              </div>
            </div>
            <div>
              <label className="block text-[12px] text-[#6E6E73] mb-1">Business Description</label>
              <input
                type="text"
                value={businessDescription}
                onChange={(e) => setBusinessDescription(e.target.value)}
                placeholder="Short summary of services offered to neighbours"
                className="w-full px-4 py-2 rounded-[12px] border border-black/[0.1] text-[13px]"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="h-[44px] px-6 rounded-full bg-[#0071E3] hover:bg-[#0077ED] text-white font-semibold text-[14px] inline-flex items-center gap-2 shadow-xs transition cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>{isPending ? 'Saving...' : 'Save Profile Changes'}</span>
          </button>
        </form>
      )}

      {/* TAB 2: PASSWORD & SECURITY */}
      {activeTab === 'security' && (
        <div className="max-w-xl rounded-[24px] bg-white border border-black/[0.06] shadow-[0_8px_30px_rgba(0,0,0,0.03)] p-6 sm:p-8 space-y-6">
          <div className="flex items-center gap-3 border-b border-black/[0.06] pb-5">
            <div className="icon-box-md bg-[#F59E0B]/10 text-[#D97706]">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-[19px] font-display font-bold text-[#1D1D1F]">
                Update Account Password
              </h2>
              <p className="text-[13px] text-[#6E6E73]">
                Change the password for <strong>@{accountDetails.username}</strong> ({accountDetails.email}).
              </p>
            </div>
          </div>

          {passwordFeedback && (
            <div
              className={`p-4 rounded-[14px] text-[13px] flex items-center gap-2 ${
                passwordFeedback.type === 'success'
                  ? 'bg-[#10B981]/10 border border-[#10B981]/30 text-[#1D1D1F]'
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
              <label className="block text-[13px] font-semibold text-[#1D1D1F] mb-1.5">
                Current Password
              </label>
              <input
                type="password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter current password"
                className="w-full px-4 py-2.5 rounded-[12px] border border-black/[0.1] text-[14px] font-mono"
              />
            </div>

            <div>
              <label className="block text-[13px] font-semibold text-[#1D1D1F] mb-1.5">
                New Password (minimum 6 characters)
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
                className="w-full px-4 py-2.5 rounded-[12px] border border-black/[0.1] text-[14px] font-mono"
              />
            </div>

            <div>
              <label className="block text-[13px] font-semibold text-[#1D1D1F] mb-1.5">
                Confirm New Password
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
                placeholder="Repeat new password"
                className="w-full px-4 py-2.5 rounded-[12px] border border-black/[0.1] text-[14px] font-mono"
              />
            </div>

            <button
              type="submit"
              disabled={isPending}
              className="h-[44px] px-6 rounded-full bg-[#F59E0B] hover:bg-[#D97706] text-white font-semibold text-[14px] inline-flex items-center gap-2 shadow-xs transition cursor-pointer"
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
            className="rounded-[24px] bg-white border border-black/[0.06] shadow-[0_8px_30px_rgba(0,0,0,0.03)] p-6 sm:p-8 space-y-5"
          >
            <div className="flex items-center gap-3">
              <div className="icon-box-md bg-[#10B981]/10 text-[#10B981]">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-[19px] font-display font-bold text-[#1D1D1F]">
                  Directory Privacy Settings
                </h2>
                <p className="text-[13px] text-[#6E6E73]">
                  Choose which details neighbours can see in the directory.
                </p>
              </div>
            </div>

            {privacyFeedback && (
              <div className="p-3.5 rounded-[12px] bg-[#10B981]/10 border border-[#10B981]/30 text-[13px] font-medium text-[#1D1D1F]">
                {privacyFeedback}
              </div>
            )}

            <div className="space-y-3">
              <label className="flex items-center justify-between p-4 rounded-[16px] bg-[#F5F5F7] border border-black/[0.05] cursor-pointer">
                <div>
                  <div className="font-semibold text-[#1D1D1F] text-[14px]">
                    Show Flat / Unit Number
                  </div>
                  <div className="text-[12px] text-[#6E6E73]">
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

              <label className="flex items-center justify-between p-4 rounded-[16px] bg-[#F5F5F7] border border-black/[0.05] cursor-pointer">
                <div>
                  <div className="font-semibold text-[#1D1D1F] text-[14px]">
                    Show Phone Number
                  </div>
                  <div className="text-[12px] text-[#6E6E73]">
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

              <label className="flex items-center justify-between p-4 rounded-[16px] bg-[#F5F5F7] border border-black/[0.05] cursor-pointer">
                <div>
                  <div className="font-semibold text-[#1D1D1F] text-[14px]">
                    Show Profession & Skills
                  </div>
                  <div className="text-[12px] text-[#6E6E73]">
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

              <label className="flex items-center justify-between p-4 rounded-[16px] bg-[#F5F5F7] border border-black/[0.05] cursor-pointer">
                <div>
                  <div className="font-semibold text-[#1D1D1F] text-[14px]">
                    Show Business Listing
                  </div>
                  <div className="text-[12px] text-[#6E6E73]">
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
              className="w-full h-[44px] rounded-full bg-[#10B981] hover:bg-[#059669] text-white font-semibold text-[14px] transition cursor-pointer"
            >
              {isPending ? 'Saving...' : 'Save Privacy Preferences'}
            </button>
          </form>

          <section className="rounded-[24px] bg-white border border-black/[0.06] shadow-[0_8px_30px_rgba(0,0,0,0.03)] p-6 sm:p-8 space-y-5">
            <div className="flex items-center gap-3">
              <div className="icon-box-md bg-[#0071E3]/10 text-[#0071E3]">
                <Bell className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-[19px] font-display font-bold text-[#1D1D1F]">
                  Recent Notifications
                </h2>
                <p className="text-[13px] text-[#6E6E73]">
                  Updates from your community, orders, and exchanges
                </p>
              </div>
            </div>

            {notifications.length === 0 ? (
              <p className="text-[13px] text-[#6E6E73]">No notifications yet.</p>
            ) : (
              <div className="space-y-3">
                {notifications.map((n) => (
                  <div
                    key={n.id}
                    className="p-4 rounded-[16px] bg-[#F5F5F7] border border-black/[0.05] space-y-1"
                  >
                    <div className="font-semibold text-[14px] text-[#1D1D1F]">{n.title}</div>
                    <p className="text-[13px] text-[#6E6E73] leading-relaxed">
                      {n.safe_preview_body}
                    </p>
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
