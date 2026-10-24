'use client';

import React, { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  Plus,
  Eye,
  MapPin,
  Star,
  CheckCircle2,
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
    <div className="space-y-5">
      {/* Compact Header & Actions */}
      <div className="rounded-[16px] bg-white border border-[#E8E8EC] p-5 sm:p-6 flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-[22px] sm:text-[26px] font-display font-bold tracking-[-0.03em] text-[#0A0A0A]">
            Social Exchange & Sharing
          </h1>
          <p className="text-[13px] text-[#6B6B6B]">
            Donate, lend, borrow, or swap items with verified neighbours. Click any card for details.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex flex-wrap gap-1.5 p-1 rounded-[10px] bg-[#FAFAFA] border border-[#E8E8EC]">
            <button
              type="button"
              onClick={() => setActiveTab('listings')}
              className={`px-3.5 py-2 rounded-[8px] text-[13px] font-medium transition cursor-pointer ${
                activeTab === 'listings'
                  ? 'bg-[#8B5CF6] text-white shadow-2xs'
                  : 'text-[#6B6B6B] hover:text-[#0A0A0A]'
              }`}
            >
              Listings ({filteredListings.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('agreements')}
              className={`px-3.5 py-2 rounded-[8px] text-[13px] font-medium transition cursor-pointer ${
                activeTab === 'agreements'
                  ? 'bg-[#10B981] text-white shadow-2xs'
                  : 'text-[#6B6B6B] hover:text-[#0A0A0A]'
              }`}
            >
              Agreements ({agreements.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('reviews')}
              className={`px-3.5 py-2 rounded-[8px] text-[13px] font-medium transition cursor-pointer ${
                activeTab === 'reviews'
                  ? 'bg-[#F59E0B] text-white shadow-2xs'
                  : 'text-[#6B6B6B] hover:text-[#0A0A0A]'
              }`}
            >
              Reviews ({reviews.length})
            </button>
          </div>

          <button
            type="button"
            onClick={() => setCreateModalOpen(true)}
            className="inline-flex items-center gap-1.5 h-[38px] px-4 rounded-[8px] bg-gradient-to-r from-[#6366F1] to-[#4F46E5] text-white text-[13px] font-medium shadow-2xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Post Listing</span>
          </button>
        </div>
      </div>

      {feedback && (
        <div className="p-3.5 rounded-[10px] bg-[#10B981]/10 border border-[#10B981]/30 text-[13px] text-[#0A0A0A] flex items-center justify-between">
          <span>{feedback}</span>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="text-xs font-medium text-[#6B6B6B] hover:text-[#0A0A0A]"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* TAB 1: CONCISE LISTINGS + PAGINATION */}
      {activeTab === 'listings' && (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {(['all', 'offer', 'need'] as const).map((dir) => (
              <button
                key={dir}
                type="button"
                onClick={() => {
                  setDirectionFilter(dir);
                  setPage(1);
                }}
                className={`px-3.5 py-1.5 rounded-full text-[12px] font-medium border transition cursor-pointer ${
                  directionFilter === dir
                    ? 'bg-[#0A0A0A] text-white border-[#0A0A0A]'
                    : 'bg-white text-[#6B6B6B] border-[#E8E8EC] hover:text-[#0A0A0A]'
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pagedListings.map((item) => (
              <article
                key={item.id}
                onClick={() => setSelectedListing(item)}
                className="bg-white border border-[#E8E8EC] hover:border-[#8B5CF6] rounded-[14px] p-4 flex flex-col justify-between gap-3 transition cursor-pointer"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[11px] font-medium capitalize ${
                        item.direction === 'offer'
                          ? 'bg-[#10B981]/15 text-[#059669]'
                          : 'bg-[#F59E0B]/15 text-[#D97706]'
                      }`}
                    >
                      {item.direction === 'offer' ? 'Offering' : 'Needed'} •{' '}
                      {item.exchange_mode.replace(/_/g, ' ')}
                    </span>
                    <span className="text-[12px] font-bold text-[#6366F1]">
                      {item.price_paise > 0
                        ? formatPaiseToINR(item.price_paise)
                        : item.deposit_paise > 0
                        ? `Deposit ${formatPaiseToINR(item.deposit_paise)}`
                        : 'Free'}
                    </span>
                  </div>
                  <h2 className="text-[15px] font-display font-bold text-[#0A0A0A] line-clamp-1">
                    {item.title}
                  </h2>
                  <p className="text-[13px] text-[#6B6B6B] line-clamp-1">{item.description}</p>
                </div>

                <div className="pt-2.5 border-t border-[#E8E8EC] flex items-center justify-between text-[12px]">
                  <span className="text-[#6B6B6B]">
                    By <strong className="text-[#0A0A0A]">{item.owner_name}</strong>
                  </span>
                  <span className="font-semibold text-[#8B5CF6] inline-flex items-center gap-1">
                    <Eye className="w-3.5 h-3.5" />
                    <span>View Details</span>
                  </span>
                </div>
              </article>
            ))}
          </div>

          <div className="bg-white border border-[#E8E8EC] rounded-[14px] px-4 pb-3">
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
        <div className="bg-white border border-[#E8E8EC] rounded-[16px] p-5 space-y-4">
          <div className="space-y-3">
            {pagedAgreements.map((agr) => (
              <div
                key={agr.id}
                onClick={() => setSelectedAgreement(agr)}
                className="p-4 rounded-[12px] bg-[#FAFAFA] border border-[#E8E8EC] hover:border-[#10B981] flex flex-wrap items-center justify-between gap-4 transition cursor-pointer"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-[#6366F1]/10 text-[#6366F1] text-[11px] font-medium uppercase">
                      {agr.status.replace(/_/g, ' ')}
                    </span>
                    <span className="text-[12px] text-[#6B6B6B]">
                      {agr.owner_name} ↔ {agr.counterparty_name}
                    </span>
                  </div>
                  <h3 className="font-display font-bold text-[15px] text-[#0A0A0A]">
                    {agr.listing_title}
                  </h3>
                  <p className="text-[12px] text-[#6B6B6B]">
                    Handover: {agr.handover_location_label}
                  </p>
                </div>

                <span className="h-[34px] px-3 rounded-[8px] bg-white border border-[#E8E8EC] text-[12px] font-medium inline-flex items-center gap-1.5 text-[#10B981]">
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {reviews.map((rev) => (
            <div
              key={rev.id}
              className="p-4 rounded-[14px] bg-white border border-[#E8E8EC] space-y-2"
            >
              <div className="flex items-center justify-between">
                <span className="font-display font-bold text-[14px] text-[#0A0A0A]">
                  {rev.reviewer_name} → {rev.subject_user_name}
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#F59E0B]/15 text-[#D97706] text-xs font-bold">
                  <Star className="w-3 h-3 fill-[#F59E0B]" />
                  {rev.overall_rating}/5
                </span>
              </div>
              {rev.written_feedback && (
                <p className="text-[13px] text-[#6B6B6B]">{rev.written_feedback}</p>
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
            <span className="px-2.5 py-0.5 rounded-full bg-[#8B5CF6]/10 text-[#8B5CF6] text-[11px] font-medium capitalize">
              {selectedListing.exchange_mode.replace(/_/g, ' ')}
            </span>
          )
        }
      >
        {selectedListing && (
          <div className="space-y-4">
            <p className="text-[14px] text-[#0A0A0A] leading-relaxed">
              {selectedListing.description}
            </p>
            <div className="grid grid-cols-2 gap-3 p-3.5 rounded-[10px] bg-[#FAFAFA] border border-[#E8E8EC] text-[12px]">
              <div>
                <span className="text-[#6B6B6B] block">Handover Options</span>
                <strong className="text-[#0A0A0A] inline-flex items-center gap-1 mt-0.5">
                  <MapPin className="w-3.5 h-3.5 text-[#8B5CF6]" />
                  {selectedListing.handover_options}
                </strong>
              </div>
              <div>
                <span className="text-[#6B6B6B] block">Price / Deposit</span>
                <strong className="text-[#6366F1]">
                  {selectedListing.price_paise > 0
                    ? formatPaiseToINR(selectedListing.price_paise)
                    : selectedListing.deposit_paise > 0
                    ? `Refundable Deposit ${formatPaiseToINR(selectedListing.deposit_paise)}`
                    : 'Free Community Share'}
                </strong>
              </div>
              <div>
                <span className="text-[#6B6B6B] block">Condition</span>
                <strong className="text-[#0A0A0A] capitalize">
                  {selectedListing.item_condition}
                </strong>
              </div>
              <div>
                <span className="text-[#6B6B6B] block">Availability</span>
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
            <div className="grid grid-cols-2 gap-3 p-3.5 rounded-[10px] bg-[#FAFAFA] border border-[#E8E8EC]">
              <div>
                <span className="text-[#6B6B6B] block text-xs">Status</span>
                <strong className="uppercase text-[#6366F1]">
                  {selectedAgreement.status.replace(/_/g, ' ')}
                </strong>
              </div>
              <div>
                <span className="text-[#6B6B6B] block text-xs">Location</span>
                <strong>{selectedAgreement.handover_location_label}</strong>
              </div>
            </div>
            {selectedAgreement.responsibility_terms && (
              <p className="text-[#6B6B6B]">{selectedAgreement.responsibility_terms}</p>
            )}
            {selectedAgreement.condition_reports.map((cr, idx) => (
              <div
                key={idx}
                className="p-3 rounded-[8px] bg-[#10B981]/10 border border-[#10B981]/30 flex items-center gap-2 text-xs"
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
        <form onSubmit={handleCreateListing} className="space-y-3.5 text-[13px]">
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setDirection('offer')}
              className={`py-2 rounded-[8px] font-medium border cursor-pointer ${
                direction === 'offer'
                  ? 'bg-[#10B981] text-white border-[#10B981]'
                  : 'bg-[#FAFAFA] text-[#0A0A0A] border-[#E8E8EC]'
              }`}
            >
              I Have / Offering
            </button>
            <button
              type="button"
              onClick={() => setDirection('need')}
              className={`py-2 rounded-[8px] font-medium border cursor-pointer ${
                direction === 'need'
                  ? 'bg-[#F59E0B] text-white border-[#F59E0B]'
                  : 'bg-[#FAFAFA] text-[#0A0A0A] border-[#E8E8EC]'
              }`}
            >
              I Need / Requesting
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium mb-1">Exchange Mode</label>
              <select
                value={exchangeMode}
                onChange={(e) => setExchangeMode(e.target.value)}
                className="w-full rounded-[8px] border border-[#E8E8EC] px-3 py-2 bg-white"
              >
                <option value="loan">Lend / Borrow</option>
                <option value="giveaway">Donate Free</option>
                <option value="swap">Barter / Swap</option>
                <option value="sale">Low-Cost Sale</option>
                <option value="volunteer_help">Volunteer Help</option>
              </select>
            </div>
            <div>
              <label className="block font-medium mb-1">Quantity</label>
              <input
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="w-full rounded-[8px] border border-[#E8E8EC] px-3 py-2"
              />
            </div>
          </div>

          <div>
            <label className="block font-medium mb-1">Category</label>
            <input
              type="text"
              required
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full rounded-[8px] border border-[#E8E8EC] px-3.5 py-2"
            />
          </div>

          <div>
            <label className="block font-medium mb-1">Title</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Bosch Cordless Drill Kit"
              className="w-full rounded-[8px] border border-[#E8E8EC] px-3.5 py-2"
            />
          </div>

          <div>
            <label className="block font-medium mb-1">Description</label>
            <textarea
              rows={2}
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Condition and handover details..."
              className="w-full rounded-[8px] border border-[#E8E8EC] px-3.5 py-2"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium mb-1">Price (₹)</label>
              <input
                type="number"
                min="0"
                value={priceRupees}
                onChange={(e) => setPriceRupees(e.target.value)}
                className="w-full rounded-[8px] border border-[#E8E8EC] px-3 py-2"
              />
            </div>
            <div>
              <label className="block font-medium mb-1">Deposit (₹)</label>
              <input
                type="number"
                min="0"
                value={depositRupees}
                onChange={(e) => setDepositRupees(e.target.value)}
                className="w-full rounded-[8px] border border-[#E8E8EC] px-3 py-2"
              />
            </div>
          </div>

          <div>
            <label className="block font-medium mb-1">Handover Location</label>
            <input
              type="text"
              required
              value={handoverOptions}
              onChange={(e) => setHandoverOptions(e.target.value)}
              className="w-full rounded-[8px] border border-[#E8E8EC] px-3.5 py-2"
            />
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="w-full h-[40px] rounded-[8px] bg-[#6366F1] hover:bg-[#4F46E5] text-white font-medium cursor-pointer"
          >
            {isPending ? 'Publishing...' : 'Publish Listing'}
          </button>
        </form>
      </DetailModal>
    </div>
  );
}
