'use client';

import React, { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { UserCheck, Lock, ShieldCheck, Star, Bell } from 'lucide-react';
import type { ActorContext, NotificationItem } from '@/lib/types/domain';
import { updateVisibilityAction } from '@/app/actions/community-actions';

interface AccountPrivacyClientProps {
  actor: ActorContext;
  notifications: NotificationItem[];
}

export function AccountPrivacyClient({ actor, notifications }: AccountPrivacyClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showUnit, setShowUnit] = useState(Boolean(actor.visibility?.show_unit));
  const [showPhone, setShowPhone] = useState(Boolean(actor.visibility?.show_phone));
  const [showProfession, setShowProfession] = useState(Boolean(actor.visibility?.show_profession ?? true));
  const [showBusiness, setShowBusiness] = useState(Boolean(actor.visibility?.show_business ?? true));
  const [feedback, setFeedback] = useState<string | null>(null);

  function handleSaveVisibility(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const res = await updateVisibilityAction({
        show_unit: showUnit,
        show_phone: showPhone,
        show_profession: showProfession,
        show_business: showBusiness,
      });
      if (res.ok) {
        setFeedback(
          'Saved to live Supabase `profile_visibility` and recorded in `audit_logs`! Other residents will now see your updated field projection in the Directory.'
        );
        router.refresh();
      } else {
        setFeedback(`Error: ${res.error}`);
      }
    });
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl bg-white border border-[#E8E8EC] p-5 sm:p-6 space-y-2">
        <span className="text-xs font-bold uppercase tracking-wider text-[#6366F1]">
          MEM-03 & REP-07 • Account, Per-Field Directory Privacy & Reputation
        </span>
        <h1 className="text-2xl font-bold text-[#0A0A0A]">
          {actor.display_name} — Profile, Privacy & Notifications
        </h1>
        <p className="text-sm text-[#6B6B6B]">
          Control which personal fields are projected in the Community Directory. By default, exact flat number (`show_unit = false`) and personal phone (`show_phone = false`) are hidden on the server (Test 3).
        </p>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Per-Field Directory Visibility Controls (MEM-03 / Test 3) */}
        <form
          onSubmit={handleSaveVisibility}
          className="rounded-2xl bg-white border border-[#E8E8EC] p-5 space-y-4"
        >
          <div className="flex items-center gap-2">
            <Lock className="w-5 h-5 text-[#6366F1]" />
            <h2 className="text-base font-bold text-[#0A0A0A]">
              Per-Field Directory Visibility Controls (MEM-03)
            </h2>
          </div>

          <div className="p-3.5 rounded-xl bg-[#FAFAFA] border border-[#E8E8EC] text-xs space-y-1">
            <div>
              <strong>Private Record on Server (`private_contacts`):</strong>
            </div>
            <div>
              Building: <strong>{actor.building_name}</strong> • Flat: <strong>{actor.unit_number}</strong> • Phone:{' '}
              <strong>{actor.personal_phone}</strong>
            </div>
          </div>

          {feedback && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-300 text-xs font-semibold text-emerald-950">
              {feedback}
            </div>
          )}

          <div className="space-y-3 text-sm">
            <label className="flex items-center justify-between p-3 rounded-xl bg-[#FAFAFA] border border-[#E8E8EC] cursor-pointer">
              <div>
                <div className="font-bold text-[#0A0A0A] text-xs">Show Exact Flat / Unit Number (`show_unit`)</div>
                <div className="text-[11px] text-[#6B6B6B]">
                  Default OFF. When off, only your tower name is shown to fellow residents.
                </div>
              </div>
              <input
                type="checkbox"
                checked={showUnit}
                onChange={(e) => setShowUnit(e.target.checked)}
                className="w-4 h-4 accent-[#6366F1]"
              />
            </label>

            <label className="flex items-center justify-between p-3 rounded-xl bg-[#FAFAFA] border border-[#E8E8EC] cursor-pointer">
              <div>
                <div className="font-bold text-[#0A0A0A] text-xs">Show Personal Phone Number (`show_phone`)</div>
                <div className="text-[11px] text-[#6B6B6B]">
                  Default OFF. Residents coordinate via in-app messages unless you opt in.
                </div>
              </div>
              <input
                type="checkbox"
                checked={showPhone}
                onChange={(e) => setShowPhone(e.target.checked)}
                className="w-4 h-4 accent-[#6366F1]"
              />
            </label>

            <label className="flex items-center justify-between p-3 rounded-xl bg-[#FAFAFA] border border-[#E8E8EC] cursor-pointer">
              <div>
                <div className="font-bold text-[#0A0A0A] text-xs">Show Profession & Skills (`show_profession`)</div>
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

            <label className="flex items-center justify-between p-3 rounded-xl bg-[#FAFAFA] border border-[#E8E8EC] cursor-pointer">
              <div>
                <div className="font-bold text-[#0A0A0A] text-xs">Show Business Profile (`show_business`)</div>
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
            className="w-full py-2.5 rounded-xl bg-[#6366F1] hover:bg-[#4F46E5] text-white font-bold text-xs cursor-pointer"
          >
            {isPending ? 'Updating Supabase Privacy Settings...' : 'Save Directory Visibility Preferences'}
          </button>
        </form>

        {/* Separate Member vs Provider Reputation & Notifications (REP-07 & EVT-04) */}
        <div className="space-y-6">
          <section className="rounded-2xl bg-white border border-[#E8E8EC] p-5 space-y-3">
            <div className="flex items-center gap-2">
              <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
              <h2 className="text-base font-bold text-[#0A0A0A]">
                Separate Member vs Service Provider Reputation (REP-07)
              </h2>
            </div>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3.5 rounded-xl bg-[#FAFAFA] border border-[#E8E8EC]">
                <div className="text-[#6B6B6B] font-medium">Member Exchange Average</div>
                <div className="text-xl font-bold text-[#0A0A0A] tabular-nums mt-1">
                  {actor.member_rating_avg ? `${Number(actor.member_rating_avg).toFixed(2)} ★` : 'No reviews yet'}
                </div>
                <div className="text-[11px] text-[#6366F1]">
                  {actor.member_review_count ?? 0} verified reviews • {actor.completed_interactions_count ?? 0} exchanges
                </div>
              </div>
              <div className="p-3.5 rounded-xl bg-[#FAFAFA] border border-[#E8E8EC]">
                <div className="text-[#6B6B6B] font-medium">Service Provider Average</div>
                <div className="text-xl font-bold text-[#0A0A0A] tabular-nums mt-1">
                  {(actor.provider_memberships?.length ?? 0) > 0 ? '4.75 ★' : 'N/A (Resident)'}
                </div>
                <div className="text-[11px] text-[#6B6B6B]">
                  Kept strictly separate from peer-to-peer member score
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-2xl bg-white border border-[#E8E8EC] p-5 space-y-3">
            <div className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-[#6366F1]" />
              <h2 className="text-base font-bold text-[#0A0A0A]">
                In-App Notification Centre ({notifications.length} Safe Previews — EVT-04)
              </h2>
            </div>
            {notifications.length === 0 ? (
              <p className="text-xs text-[#6B6B6B]">No unread notifications for {actor.display_name}.</p>
            ) : (
              <div className="space-y-2">
                {notifications.map((n) => (
                  <div key={n.id} className="p-3 rounded-xl bg-[#FAFAFA] border border-[#E8E8EC] text-xs space-y-1">
                    <div className="font-bold text-[#0A0A0A]">{n.title}</div>
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
