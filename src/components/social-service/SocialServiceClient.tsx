'use client';

import React, { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  HeartHandshake,
  PlusCircle,
  ShieldAlert,
  CheckCircle2,
  Clock,
  Star,
  FileCheck2,
  ArrowLeftRight,
} from 'lucide-react';
import type {
  ExchangeAgreementItem,
  ExchangeListingItem,
  ReviewEligibilityItem,
  ReviewItem,
} from '@/lib/types/domain';
import { formatPaiseToINR } from '@/lib/workflows/transactions';
import { createExchangeListingAction } from '@/app/actions/community-actions';

interface SocialServiceClientProps {
  listings: ExchangeListingItem[];
  agreements: ExchangeAgreementItem[];
  eligibilities: ReviewEligibilityItem[];
  reviews: ReviewItem[];
}

export function SocialServiceClient({
  listings,
  agreements,
  eligibilities,
  reviews,
}: SocialServiceClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [directionFilter, setDirectionFilter] = useState<'all' | 'need' | 'offer'>('all');

  // New Listing Form State (SOC-01..03, SOC-10)
  const [direction, setDirection] = useState<'need' | 'offer'>('offer');
  const [exchangeMode, setExchangeMode] = useState<string>('loan');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Tools & Utilities');
  const [quantity, setQuantity] = useState(1);
  const [priceRupees, setPriceRupees] = useState(0);
  const [depositRupees, setDepositRupees] = useState(0);
  const [handoverOptions, setHandoverOptions] = useState('Tower lobby handover with condition check');
  const [feedback, setFeedback] = useState<{ ok: boolean; msg: string } | null>(null);

  const visibleListings = listings.filter(
    (l) => directionFilter === 'all' || l.direction === directionFilter
  );

  function handlePublishListing(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const res = await createExchangeListingAction({
        direction,
        exchangeMode,
        title,
        description,
        category,
        quantity,
        pricePaise: Math.round(priceRupees * 100),
        depositPaise: Math.round(depositRupees * 100),
        handoverOptions,
      });
      if (res.ok) {
        setFeedback({
          ok: true,
          msg: 'Social Service listing published to live Supabase database!',
        });
        setTitle('');
        setDescription('');
        router.refresh();
      } else {
        setFeedback({
          ok: false,
          msg: res.error ?? 'Failed to publish listing',
        });
      }
    });
  }

  return (
    <div className="space-y-6">
      {/* Header & Entry Paths ("I need something" / "I have something to offer" — SOC-01) */}
      <section className="rounded-2xl bg-white border border-[#E5DEC9] p-5 sm:p-6 space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-[#0F766E]">
              Phase 2 • Dedicated Social Service Tab (SOC-01..10 & REP-01..08)
            </span>
            <h1 className="text-2xl font-bold text-[#0F172A]">
              Neighbour Exchanges, Borrowing, Giveaways, Swaps & Volunteer Time
            </h1>
            <p className="text-sm text-[#475569] max-w-3xl">
              Every exchange uses versioned agreements (`exchange_agreements`), atomic quantity allocation (preventing double-allocation on simultaneous acceptance — Test 8), handover/return condition reports, and a 14-day blind review window (Test 9 & Test 10).
            </p>
          </div>
        </div>

        {/* Two Prominent Entry Paths Required by SOC-01 */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          <button
            type="button"
            onClick={() => setDirectionFilter('all')}
            className={`p-3.5 rounded-xl border text-left transition cursor-pointer ${
              directionFilter === 'all'
                ? 'bg-[#0F172A] text-white border-[#0F172A]'
                : 'bg-[#FAF8F5] text-[#0F172A] border-[#E5DEC9]'
            }`}
          >
            <div className="text-xs font-bold uppercase opacity-80">All Exchanges</div>
            <div className="text-base font-bold mt-0.5">Browse All ({listings.length})</div>
          </button>

          <button
            type="button"
            onClick={() => {
              setDirectionFilter('need');
              setDirection('need');
              setExchangeMode('request');
            }}
            className={`p-3.5 rounded-xl border text-left transition cursor-pointer ${
              directionFilter === 'need'
                ? 'bg-amber-700 text-white border-amber-700'
                : 'bg-amber-50 text-amber-950 border-amber-300'
            }`}
          >
            <div className="text-xs font-bold uppercase">Entry Path 1 (SOC-01)</div>
            <div className="text-base font-bold mt-0.5">“I Need Something” (Requests & Borrows)</div>
          </button>

          <button
            type="button"
            onClick={() => {
              setDirectionFilter('offer');
              setDirection('offer');
              setExchangeMode('loan');
            }}
            className={`p-3.5 rounded-xl border text-left transition cursor-pointer ${
              directionFilter === 'offer'
                ? 'bg-[#0F766E] text-white border-[#0F766E]'
                : 'bg-[#F0FDFA] text-[#0F766E] border-teal-300'
            }`}
          >
            <div className="text-xs font-bold uppercase">Entry Path 2 (SOC-01)</div>
            <div className="text-base font-bold mt-0.5">
              “I Have Something to Offer” (Giveaways, Loans, Sales, Swaps)
            </div>
          </button>
        </div>
      </section>

      {/* Main Grid: Active Listings + Publish New Listing Form */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-base font-bold text-[#0F172A]">
            Active Community Exchange Listings ({visibleListings.length})
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {visibleListings.map((item) => (
              <article
                key={item.id}
                className="rounded-2xl bg-white border border-[#E5DEC9] p-5 flex flex-col justify-between gap-4"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase ${
                        item.direction === 'need'
                          ? 'bg-amber-100 text-amber-900'
                          : 'bg-teal-100 text-[#0F766E]'
                      }`}
                    >
                      {item.direction === 'need' ? 'Need' : 'Offer'} • {item.exchange_mode.replace('_', ' ')}
                    </span>
                    <span className="text-xs font-bold tabular-nums text-[#0F172A]">
                      {item.remaining_quantity} of {item.total_quantity} remaining
                    </span>
                  </div>

                  <h3 className="font-bold text-base text-[#0F172A]">{item.title}</h3>
                  <p className="text-xs text-[#475569] leading-relaxed">{item.description}</p>

                  <div className="text-xs text-[#475569] pt-1 space-y-1">
                    <div>
                      <strong>Category:</strong> {item.category} • <strong>Condition:</strong>{' '}
                      {item.item_condition.replace('_', ' ')}
                    </div>
                    <div>
                      <strong>Handover:</strong> {item.handover_options}
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-[#E5DEC9] flex items-center justify-between text-xs">
                  <div>
                    <div className="font-bold text-[#0F172A]">{item.owner_name}</div>
                    {item.owner_rating_avg && (
                      <div className="inline-flex items-center gap-1 text-[#475569] tabular-nums">
                        <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                        <span>
                          {Number(item.owner_rating_avg).toFixed(2)} ({item.owner_review_count} member reviews)
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="text-right">
                    <div className="font-bold text-[#0F766E]">
                      {item.price_paise > 0
                        ? `Sale ${formatPaiseToINR(item.price_paise)}`
                        : item.rental_rate_paise_per_day > 0
                        ? `${formatPaiseToINR(item.rental_rate_paise_per_day)}/day`
                        : 'Free Community Share'}
                    </div>
                    {item.deposit_paise > 0 && (
                      <div className="text-[11px] text-[#475569]">
                        Refundable Deposit: {formatPaiseToINR(item.deposit_paise)}
                      </div>
                    )}
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>

        {/* Publish New Listing Form with Prohibited Item Policy Check (SOC-10) */}
        <div className="rounded-2xl bg-white border border-[#E5DEC9] p-5 space-y-4 h-fit">
          <div className="flex items-center gap-2">
            <PlusCircle className="w-5 h-5 text-[#0F766E]" />
            <h2 className="text-base font-bold text-[#0F172A]">Create Social Service Listing</h2>
          </div>

          <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-[11px] text-amber-950 flex items-start gap-2">
            <ShieldAlert className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
            <span>
              <strong>Prohibited Item Policy (SOC-10):</strong> Prescription or OTC medicines, weapons, and hazardous items are blocked on the server.
            </span>
          </div>

          {feedback && (
            <div
              className={`p-3 rounded-xl text-xs font-semibold border ${
                feedback.ok
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                  : 'bg-red-50 border-red-300 text-red-950'
              }`}
            >
              {feedback.msg}
            </div>
          )}

          <form onSubmit={handlePublishListing} className="space-y-3 text-xs">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block font-semibold text-[#0F172A] mb-1">Entry Direction</label>
                <select
                  value={direction}
                  onChange={(e) => setDirection(e.target.value as 'need' | 'offer')}
                  className="w-full rounded-lg border border-[#E5DEC9] px-2.5 py-2 bg-white"
                >
                  <option value="need">I Need Something</option>
                  <option value="offer">I Have an Offer</option>
                </select>
              </div>
              <div>
                <label className="block font-semibold text-[#0F172A] mb-1">Exchange Mode</label>
                <select
                  value={exchangeMode}
                  onChange={(e) => setExchangeMode(e.target.value)}
                  className="w-full rounded-lg border border-[#E5DEC9] px-2.5 py-2 bg-white"
                >
                  <option value="request">Request Item / Help</option>
                  <option value="giveaway">Free Giveaway</option>
                  <option value="loan">Lend / Borrow (Free)</option>
                  <option value="sale">Resident Sale</option>
                  <option value="rental">Paid Rental</option>
                  <option value="swap">Book / Item Swap</option>
                  <option value="volunteer_help">Volunteer Time Offer</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block font-semibold text-[#0F172A] mb-1">Listing Title</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Lending Bosch Cordless Drill or Need 6 Folding Chairs"
                className="w-full rounded-lg border border-[#E5DEC9] px-3 py-2 text-xs"
              />
            </div>

            <div>
              <label className="block font-semibold text-[#0F172A] mb-1">Description & Terms</label>
              <textarea
                rows={3}
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Condition, duration, dimensions, and return expectations..."
                className="w-full rounded-lg border border-[#E5DEC9] px-3 py-2 text-xs"
              />
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block font-semibold text-[#0F172A] mb-1">Quantity</label>
                <input
                  type="number"
                  min={1}
                  value={quantity}
                  onChange={(e) => setQuantity(Number(e.target.value))}
                  className="w-full rounded-lg border border-[#E5DEC9] px-2.5 py-1.5"
                />
              </div>
              <div>
                <label className="block font-semibold text-[#0F172A] mb-1">Price (₹)</label>
                <input
                  type="number"
                  min={0}
                  value={priceRupees}
                  onChange={(e) => setPriceRupees(Number(e.target.value))}
                  className="w-full rounded-lg border border-[#E5DEC9] px-2.5 py-1.5"
                />
              </div>
              <div>
                <label className="block font-semibold text-[#0F172A] mb-1">Deposit (₹)</label>
                <input
                  type="number"
                  min={0}
                  value={depositRupees}
                  onChange={(e) => setDepositRupees(Number(e.target.value))}
                  className="w-full rounded-lg border border-[#E5DEC9] px-2.5 py-1.5"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isPending}
              className="w-full py-2.5 rounded-xl bg-[#0F766E] hover:bg-[#115E59] text-white font-bold text-xs cursor-pointer disabled:opacity-50"
            >
              {isPending ? 'Validating & Saving to Supabase...' : 'Publish Social Service Listing'}
            </button>
          </form>
        </div>
      </div>

      {/* Versioned Exchange Agreements, Condition Reports & Return Extensions (SOC-05..08) */}
      <section className="rounded-2xl bg-white border border-[#E5DEC9] p-5 space-y-4">
        <div className="flex items-center gap-2">
          <FileCheck2 className="w-5 h-5 text-[#0F766E]" />
          <h2 className="text-lg font-bold text-[#0F172A]">
            Versioned Exchange Agreements, Handover Logs & Return Extensions ({agreements.length})
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {agreements.map((ag) => (
            <article
              key={ag.id}
              className="rounded-xl bg-[#FAF8F5] border border-[#E5DEC9] p-4 space-y-2.5 text-xs"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="px-2 py-0.5 rounded bg-teal-100 text-[#0F766E] font-bold uppercase">
                  Agreement v{ag.version} • {ag.status}
                </span>
                <span className="font-semibold text-[#475569]">
                  Qty: {ag.agreed_quantity} • Deposit: {formatPaiseToINR(ag.agreed_deposit_paise)} ({ag.payment_deposit_status})
                </span>
              </div>

              <h3 className="font-bold text-sm text-[#0F172A]">{ag.listing_title}</h3>
              <p className="text-[#475569]">
                <strong>Owner:</strong> {ag.owner_name} ↔ <strong>Counterparty:</strong> {ag.counterparty_name}
              </p>
              <p className="text-[#475569]">
                <strong>Agreed Condition:</strong> {ag.agreed_condition}
              </p>
              {ag.responsibility_terms && (
                <p className="text-[#475569]">
                  <strong>Terms Snapshot:</strong> {ag.responsibility_terms}
                </p>
              )}

              {ag.condition_reports && ag.condition_reports.length > 0 && (
                <div className="p-2.5 rounded-lg bg-white border border-[#E5DEC9] space-y-1">
                  <div className="font-bold text-[#0F172A]">Handover / Return Condition Report:</div>
                  {ag.condition_reports.map((cr, idx) => (
                    <div key={idx} className="text-[#475569]">
                      [{cr.stage.toUpperCase()}] {cr.condition_summary}
                    </div>
                  ))}
                </div>
              )}

              {ag.extensions && ag.extensions.length > 0 && (
                <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-950">
                  <strong>Return Extension ({ag.extensions[0].status.toUpperCase()}):</strong>{' '}
                  {ag.extensions[0].reason}
                </div>
              )}
            </article>
          ))}
        </div>
      </section>

      {/* Transaction-Linked Reputation & 14-Day Blind Review Window (REP-01..08 / Test 9 & 10) */}
      <section className="rounded-2xl bg-white border border-[#E5DEC9] p-5 space-y-4">
        <div className="flex items-center gap-2">
          <ArrowLeftRight className="w-5 h-5 text-[#0F766E]" />
          <h2 className="text-lg font-bold text-[#0F172A]">
            Transaction-Linked Reputation & 14-Day Blind Review Window (REP-01..08)
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {reviews.map((rv) => (
            <article
              key={rv.id}
              className="rounded-xl bg-[#FAF8F5] border border-[#E5DEC9] p-4 space-y-2 text-xs"
            >
              <div className="flex items-center justify-between">
                <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-900 font-bold uppercase">
                  {rv.target_kind.replace('_', ' ')} • {rv.is_published ? 'Published (Both Submitted)' : 'Blind Window Hidden'}
                </span>
                <span className="inline-flex items-center gap-1 font-bold text-sm text-[#0F172A]">
                  <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                  {rv.overall_rating}.0 / 5.0
                </span>
              </div>
              <div className="font-bold text-[#0F172A]">
                {rv.reviewer_name} reviewed {rv.subject_user_name}
              </div>
              <p className="text-[#475569] leading-relaxed">“{rv.written_feedback}”</p>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {rv.dimensions.map((d) => (
                  <span
                    key={d.dimension_key}
                    className="px-2 py-0.5 rounded bg-white border border-[#E5DEC9] text-[11px]"
                  >
                    {d.dimension_key.replace(/_/g, ' ')}: <strong>{d.score}/5</strong>
                  </span>
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
