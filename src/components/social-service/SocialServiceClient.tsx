'use client';

import React, { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  Plus,
  Eye,
  MapPin,
  Star,
  CheckCircle2,
  HeartHandshake,
} from 'lucide-react';
import type {
  ExchangeAgreementItem,
  ExchangeListingItem,
  ReviewEligibilityItem,
  ReviewItem,
} from '@/lib/types/domain';
import { createExchangeListingAction } from '@/app/actions/community-actions';
import { formatPaiseToINR } from '@/lib/workflows/transactions';
import { PaginationBar } from '@/components/ui/PaginationBar';
import { DetailModal } from '@/components/ui/DetailModal';
import { MemberAvatar } from '@/components/ui/MemberAvatar';

interface SocialServiceClientProps {
  listings: ExchangeListingItem[];
  agreements: ExchangeAgreementItem[];
  eligibilities: ReviewEligibilityItem[];
  reviews: ReviewItem[];
}

const LISTINGS_PER_PAGE = 4;
const AGREEMENTS_PER_PAGE = 3;

export function SocialServiceClient({
  listings,
  agreements,
  reviews,
}: SocialServiceClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [activeTab, setActiveTab] = useState<'listings' | 'agreements' | 'reviews'>('listings');
  const [directionFilter, setDirectionFilter] = useState<'all' | 'offer' | 'need'>('all');
  const [page, setPage] = useState(1);
  const [agrPage, setAgrPage] = useState(1);

  // Modals
  const [selectedListing, setSelectedListing] = useState<ExchangeListingItem | null>(null);
  const [selectedAgreement, setSelectedAgreement] = useState<ExchangeAgreementItem | null>(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);

  // Create Listing Form State
  const [direction, setDirection] = useState<'offer' | 'need'>('offer');
  const [exchangeMode, setExchangeMode] = useState<string>('loan');
  const [category, setCategory] = useState('Tools & Home Equipment');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [priceRupees, setPriceRupees] = useState('0');
  const [depositRupees, setDepositRupees] = useState('0');
  const [handoverOptions, setHandoverOptions] = useState('Tower Lobby Desk');
  const [feedback, setFeedback] = useState<string | null>(null);

  const filteredListings = listings.filter(
    (l) => directionFilter === 'all' || l.direction === directionFilter
  );
  const pagedListings = filteredListings.slice(
    (page - 1) * LISTINGS_PER_PAGE,
    page * LISTINGS_PER_PAGE
  );

  const pagedAgreements = agreements.slice(
    (agrPage - 1) * AGREEMENTS_PER_PAGE,
    agrPage * AGREEMENTS_PER_PAGE
  );

  function handleCreateListing(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const res = await createExchangeListingAction({
        direction,
        exchangeMode,
        category,
        title,
        description,
        quantity: Math.max(1, parseInt(quantity, 10) || 1),
        pricePaise: Math.round((parseFloat(priceRupees) || 0) * 100),
        depositPaise: Math.round((parseFloat(depositRupees) || 0) * 100),
        handoverOptions,
      });
      if (res.ok) {
        setFeedback('Listing published to Social Exchange.');
        setTitle('');
        setDescription('');
        setCreateModalOpen(false);
        router.refresh();
      } else {
        setFeedback(`Error: ${res.error}`);
      }
    });
  }

  return (
    <div className="space-y-6">
      {/* Spacious Apple-style Header & Actions */}
      <div className="rounded-[24px] bg-white border border-black/[0.06] shadow-[0_8px_30px_rgba(0,0,0,0.03)] p-6 sm:p-8 flex flex-wrap items-center justify-between gap-5">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#8B5CF6]/10 text-[#8B5CF6] text-[11px] font-semibold">
            <HeartHandshake className="w-3.5 h-3.5" />
            <span>Peer-to-Peer Neighbour Exchange</span>
          </div>
          <h1 className="text-[24px] sm:text-[28px] font-display font-bold tracking-[-0.03em] text-[#1D1D1F]">
            Social Exchange & Sharing
          </h1>
          <p className="text-[13px] text-[#6E6E73]">
            Donate, lend, borrow, or swap items with verified neighbours. Click any card for details.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex flex-wrap gap-1.5 p-1.5 rounded-full bg-[#F5F5F7] border border-black/[0.05]">
            <button
              type="button"
              onClick={() => setActiveTab('listings')}
              className={`px-4 py-2 rounded-full text-[13px] font-semibold transition cursor-pointer ${
                activeTab === 'listings'
                  ? 'bg-[#8B5CF6] text-white shadow-xs'
                  : 'text-[#6E6E73] hover:text-[#1D1D1F]'
              }`}
            >
              Listings ({filteredListings.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('agreements')}
              className={`px-4 py-2 rounded-full text-[13px] font-semibold transition cursor-pointer ${
                activeTab === 'agreements'
                  ? 'bg-[#10B981] text-white shadow-xs'
                  : 'text-[#6E6E73] hover:text-[#1D1D1F]'
              }`}
            >
              Agreements ({agreements.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('reviews')}
              className={`px-4 py-2 rounded-full text-[13px] font-semibold transition cursor-pointer ${
                activeTab === 'reviews'
                  ? 'bg-[#F59E0B] text-white shadow-xs'
                  : 'text-[#6E6E73] hover:text-[#1D1D1F]'
              }`}
            >
              Reviews ({reviews.length})
            </button>
          </div>

          <button
            type="button"
            onClick={() => setCreateModalOpen(true)}
            className="inline-flex items-center gap-1.5 h-[40px] px-4.5 rounded-full bg-[#0071E3] hover:bg-[#0077ED] text-white text-[13px] font-semibold shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Post Listing</span>
          </button>
        </div>
      </div>

      {feedback && (
        <div className="p-4 rounded-[16px] bg-[#10B981]/10 border border-[#10B981]/30 text-[13px] text-[#1D1D1F] flex items-center justify-between">
          <span>{feedback}</span>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="text-xs font-semibold text-[#6E6E73] hover:text-[#1D1D1F]"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* TAB 1: SPACIOUS LISTINGS + PAGINATION */}
      {activeTab === 'listings' && (
        <div className="space-y-5">
          <div className="flex flex-wrap gap-2">
            {(['all', 'offer', 'need'] as const).map((dir) => (
              <button
                key={dir}
                type="button"
                onClick={() => {
                  setDirectionFilter(dir);
                  setPage(1);
                }}
                className={`px-4 py-2 rounded-full text-[12px] font-semibold border transition cursor-pointer ${
                  directionFilter === dir
                    ? 'bg-[#1D1D1F] text-white border-[#1D1D1F]'
                    : 'bg-white text-[#6E6E73] border-black/[0.08] hover:text-[#1D1D1F]'
                }`}
              >
                {dir === 'all'
                  ? 'All Items'
                  : dir === 'offer'
                  ? 'Available to Share'
                  : 'Neighbour Requests'}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {pagedListings.map((item) => (
              <article
                key={item.id}
                onClick={() => setSelectedListing(item)}
                className="bg-white border border-black/[0.06] hover:border-[#8B5CF6]/40 rounded-[22px] p-6 flex flex-col justify-between gap-4 transition cursor-pointer shadow-[0_8px_30px_rgba(0,0,0,0.02)]"
              >
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`px-3 py-1 rounded-full text-[11px] font-semibold capitalize ${
                        item.direction === 'offer'
                          ? 'bg-[#10B981]/15 text-[#059669]'
                          : 'bg-[#F59E0B]/15 text-[#D97706]'
                      }`}
                    >
                      {item.direction === 'offer' ? 'Offering' : 'Needed'} •{' '}
                      {item.exchange_mode.replace(/_/g, ' ')}
                    </span>
                    <span className="text-[13px] font-bold text-[#0071E3]">
                      {item.price_paise > 0
                        ? formatPaiseToINR(item.price_paise)
                        : item.deposit_paise > 0
                        ? `Deposit ${formatPaiseToINR(item.deposit_paise)}`
                        : 'Free'}
                    </span>
                  </div>
                  <h2 className="text-[16px] font-display font-bold text-[#1D1D1F] leading-snug line-clamp-1">
                    {item.title}
                  </h2>
                  <p className="text-[13px] text-[#6E6E73] leading-relaxed line-clamp-2">
                    {item.description}
                  </p>
                </div>

                <div className="pt-3.5 border-t border-black/[0.06] flex items-center justify-between text-[12px]">
                  <div className="flex items-center gap-2">
                    <MemberAvatar name={item.owner_name} size="xs" />
                    <span className="text-[#1D1D1F] font-semibold">{item.owner_name}</span>
                  </div>
                  <span className="font-semibold text-[#8B5CF6] inline-flex items-center gap-1">
                    <Eye className="w-3.5 h-3.5" />
                    <span>View Details</span>
                  </span>
                </div>
              </article>
            ))}
          </div>

          <div className="bg-white border border-black/[0.06] rounded-[22px] px-6 py-2">
            <PaginationBar
              currentPage={page}
              totalItems={filteredListings.length}
              pageSize={LISTINGS_PER_PAGE}
              onPageChange={setPage}
              itemLabel="listings"
            />
          </div>
        </div>
      )}

      {/* TAB 2: HANDOVER AGREEMENTS */}
      {activeTab === 'agreements' && (
        <div className="bg-white border border-black/[0.06] shadow-[0_8px_30px_rgba(0,0,0,0.03)] rounded-[24px] p-6 sm:p-8 space-y-5">
          <div className="space-y-4">
            {pagedAgreements.map((agr) => (
              <div
                key={agr.id}
                onClick={() => setSelectedAgreement(agr)}
                className="p-6 rounded-[20px] bg-[#F5F5F7]/70 hover:bg-white border border-black/[0.06] hover:border-[#10B981]/40 flex flex-wrap items-center justify-between gap-4 transition cursor-pointer"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-0.5 rounded-full bg-[#0071E3]/10 text-[#0071E3] text-[11px] font-semibold uppercase">
                      {agr.status.replace(/_/g, ' ')}
                    </span>
                    <span className="text-[12px] text-[#6E6E73]">
                      {agr.owner_name} ↔ {agr.counterparty_name}
                    </span>
                  </div>
                  <h3 className="font-display font-bold text-[16px] text-[#1D1D1F]">
                    {agr.listing_title}
                  </h3>
                  <p className="text-[13px] text-[#6E6E73]">
                    Handover: {agr.handover_location_label}
                  </p>
                </div>

                <span className="h-[38px] px-4 rounded-full bg-white border border-black/[0.08] text-[12px] font-semibold inline-flex items-center gap-1.5 text-[#10B981]">
                  <Eye className="w-3.5 h-3.5" />
                  <span>Details</span>
                </span>
              </div>
            ))}
          </div>

          <PaginationBar
            currentPage={agrPage}
            totalItems={agreements.length}
            pageSize={AGREEMENTS_PER_PAGE}
            onPageChange={setAgrPage}
            itemLabel="agreements"
          />
        </div>
      )}

      {/* TAB 3: EXCHANGE REVIEWS */}
      {activeTab === 'reviews' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {reviews.map((rev) => (
            <div
              key={rev.id}
              className="p-6 rounded-[22px] bg-white border border-black/[0.06] shadow-[0_8px_30px_rgba(0,0,0,0.02)] space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <MemberAvatar name={rev.reviewer_name} size="sm" />
                  <span className="font-display font-bold text-[14px] text-[#1D1D1F]">
                    {rev.reviewer_name} → {rev.subject_user_name}
                  </span>
                </div>
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[#F59E0B]/15 text-[#D97706] text-xs font-bold">
                  <Star className="w-3 h-3 fill-[#F59E0B]" />
                  {rev.overall_rating}/5
                </span>
              </div>
              {rev.written_feedback && (
                <p className="text-[13px] text-[#6E6E73] leading-relaxed">
                  {rev.written_feedback}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* MODAL 1: Listing Full Details */}
      <DetailModal
        open={Boolean(selectedListing)}
        onClose={() => setSelectedListing(null)}
        title={selectedListing?.title ?? ''}
        subtitle={
          selectedListing
            ? `Listed by ${selectedListing.owner_name} (${selectedListing.category})`
            : ''
        }
        badge={
          selectedListing && (
            <span className="px-2.5 py-0.5 rounded-full bg-[#8B5CF6]/10 text-[#8B5CF6] text-[11px] font-semibold capitalize">
              {selectedListing.exchange_mode.replace(/_/g, ' ')}
            </span>
          )
        }
      >
        {selectedListing && (
          <div className="space-y-4">
            <p className="text-[14px] text-[#1D1D1F] leading-relaxed">
              {selectedListing.description}
            </p>
            <div className="grid grid-cols-2 gap-3 p-4 rounded-[14px] bg-[#F5F5F7] border border-black/[0.06] text-[12px]">
              <div>
                <span className="text-[#6E6E73] block">Handover Options</span>
                <strong className="text-[#1D1D1F] inline-flex items-center gap-1 mt-0.5">
                  <MapPin className="w-3.5 h-3.5 text-[#8B5CF6]" />
                  {selectedListing.handover_options}
                </strong>
              </div>
              <div>
                <span className="text-[#6E6E73] block">Price / Deposit</span>
                <strong className="text-[#0071E3]">
                  {selectedListing.price_paise > 0
                    ? formatPaiseToINR(selectedListing.price_paise)
                    : selectedListing.deposit_paise > 0
                    ? `Refundable Deposit ${formatPaiseToINR(selectedListing.deposit_paise)}`
                    : 'Free Community Share'}
                </strong>
              </div>
              <div>
                <span className="text-[#6E6E73] block">Condition</span>
                <strong className="text-[#1D1D1F] capitalize">
                  {selectedListing.item_condition}
                </strong>
              </div>
              <div>
                <span className="text-[#6E6E73] block">Availability</span>
                <strong className="text-[#10B981]">
                  {selectedListing.remaining_quantity} of {selectedListing.total_quantity} available
                </strong>
              </div>
            </div>
          </div>
        )}
      </DetailModal>

      {/* MODAL 2: Agreement Full Details */}
      <DetailModal
        open={Boolean(selectedAgreement)}
        onClose={() => setSelectedAgreement(null)}
        title={selectedAgreement?.listing_title ?? ''}
        subtitle={
          selectedAgreement
            ? `${selectedAgreement.owner_name} ↔ ${selectedAgreement.counterparty_name}`
            : ''
        }
      >
        {selectedAgreement && (
          <div className="space-y-3 text-[13px]">
            <div className="grid grid-cols-2 gap-3 p-4 rounded-[14px] bg-[#F5F5F7] border border-black/[0.06]">
              <div>
                <span className="text-[#6E6E73] block text-xs">Status</span>
                <strong className="uppercase text-[#0071E3]">
                  {selectedAgreement.status.replace(/_/g, ' ')}
                </strong>
              </div>
              <div>
                <span className="text-[#6E6E73] block text-xs">Location</span>
                <strong>{selectedAgreement.handover_location_label}</strong>
              </div>
            </div>
            {selectedAgreement.responsibility_terms && (
              <p className="text-[#6E6E73]">{selectedAgreement.responsibility_terms}</p>
            )}
            {selectedAgreement.condition_reports.map((cr, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-[12px] bg-[#10B981]/10 border border-[#10B981]/30 flex items-center gap-2 text-xs"
              >
                <CheckCircle2 className="w-4 h-4 text-[#10B981] shrink-0" />
                <span>
                  <strong className="capitalize">{cr.stage}:</strong> {cr.condition_summary}
                </span>
              </div>
            ))}
          </div>
        )}
      </DetailModal>

      {/* MODAL 3: Create New Social Listing */}
      <DetailModal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Post a Social Exchange Listing"
        subtitle="Share tools, donate items, or request help from a neighbour"
      >
        <form onSubmit={handleCreateListing} className="space-y-4 text-[13px]">
          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => setDirection('offer')}
              className={`py-2.5 rounded-full font-semibold border cursor-pointer ${
                direction === 'offer'
                  ? 'bg-[#10B981] text-white border-[#10B981]'
                  : 'bg-[#F5F5F7] text-[#1D1D1F] border-black/[0.06]'
              }`}
            >
              I Have / Offering
            </button>
            <button
              type="button"
              onClick={() => setDirection('need')}
              className={`py-2.5 rounded-full font-semibold border cursor-pointer ${
                direction === 'need'
                  ? 'bg-[#F59E0B] text-white border-[#F59E0B]'
                  : 'bg-[#F5F5F7] text-[#1D1D1F] border-black/[0.06]'
              }`}
            >
              I Need / Requesting
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold mb-1">Exchange Mode</label>
              <select
                value={exchangeMode}
                onChange={(e) => setExchangeMode(e.target.value)}
                className="w-full rounded-[12px] border border-black/[0.1] px-3.5 py-2.5 bg-white"
              >
                <option value="loan">Lend / Borrow</option>
                <option value="giveaway">Donate Free</option>
                <option value="swap">Barter / Swap</option>
                <option value="sale">Low-Cost Sale</option>
                <option value="volunteer_help">Volunteer Help</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold mb-1">Quantity</label>
              <input
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="w-full rounded-[12px] border border-black/[0.1] px-3.5 py-2.5"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold mb-1">Category</label>
            <input
              type="text"
              required
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full rounded-[12px] border border-black/[0.1] px-3.5 py-2.5"
            />
          </div>

          <div>
            <label className="block font-semibold mb-1">Short Title</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Bosch Drill Kit"
              className="w-full rounded-[12px] border border-black/[0.1] px-3.5 py-2.5"
            />
          </div>

          <div>
            <label className="block font-semibold mb-1">Description</label>
            <textarea
              rows={2}
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Condition and handover details..."
              className="w-full rounded-[12px] border border-black/[0.1] px-3.5 py-2.5"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold mb-1">Price (₹)</label>
              <input
                type="number"
                min="0"
                value={priceRupees}
                onChange={(e) => setPriceRupees(e.target.value)}
                className="w-full rounded-[12px] border border-black/[0.1] px-3.5 py-2.5"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1">Deposit (₹)</label>
              <input
                type="number"
                min="0"
                value={depositRupees}
                onChange={(e) => setDepositRupees(e.target.value)}
                className="w-full rounded-[12px] border border-black/[0.1] px-3.5 py-2.5"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold mb-1">Handover Location</label>
            <input
              type="text"
              required
              value={handoverOptions}
              onChange={(e) => setHandoverOptions(e.target.value)}
              className="w-full rounded-[12px] border border-black/[0.1] px-3.5 py-2.5"
            />
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="w-full h-[42px] rounded-full bg-[#0071E3] hover:bg-[#0077ED] text-white font-semibold cursor-pointer"
          >
            {isPending ? 'Publishing...' : 'Publish Listing'}
          </button>
        </form>
      </DetailModal>
    </div>
  );
}
