'use client';

import React, { useState } from 'react';
import {
  Wrench,
  Star,
  ShieldCheck,
  Calendar,
  Eye,
  MessageSquare,
  Phone,
} from 'lucide-react';
import type {
  ServiceBookingItem,
  ServiceEnquiryItem,
  ServiceProviderItem,
} from '@/lib/types/domain';
import { formatPaiseToINR } from '@/lib/workflows/transactions';
import { PaginationBar } from '@/components/ui/PaginationBar';
import { DetailModal } from '@/components/ui/DetailModal';

interface ServicesClientProps {
  providers: ServiceProviderItem[];
  enquiries: ServiceEnquiryItem[];
  bookings: ServiceBookingItem[];
}

const PROVIDERS_PER_PAGE = 4;
const BOOKINGS_PER_PAGE = 3;

export function ServicesClient({
  providers,
  enquiries,
  bookings,
}: ServicesClientProps) {
  const [activeTab, setActiveTab] = useState<'providers' | 'bookings'>('providers');
  const [providerPage, setProviderPage] = useState(1);
  const [bookingPage, setBookingPage] = useState(1);

  // Modals
  const [selectedProvider, setSelectedProvider] = useState<ServiceProviderItem | null>(null);
  const [selectedBooking, setSelectedBooking] = useState<ServiceBookingItem | null>(null);

  const pagedProviders = providers.slice(
    (providerPage - 1) * PROVIDERS_PER_PAGE,
    providerPage * PROVIDERS_PER_PAGE
  );
  const pagedBookings = bookings.slice(
    (bookingPage - 1) * BOOKINGS_PER_PAGE,
    bookingPage * BOOKINGS_PER_PAGE
  );

  return (
    <div className="space-y-5">
      {/* Compact Header & Tabs */}
      <div className="rounded-[16px] bg-white border border-[#E8E8EC] p-5 sm:p-6 flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-[22px] sm:text-[26px] font-display font-bold tracking-[-0.03em] text-[#0A0A0A]">
            Local Service Providers
          </h1>
          <p className="text-[13px] text-[#6B6B6B]">
            Verified technicians and neighbour-recommended specialists. Click any card for details.
          </p>
        </div>

        <div className="flex flex-wrap gap-1.5 p-1 rounded-[10px] bg-[#FAFAFA] border border-[#E8E8EC]">
          <button
            type="button"
            onClick={() => setActiveTab('providers')}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-[8px] text-[13px] font-medium transition cursor-pointer ${
              activeTab === 'providers'
                ? 'bg-[#F59E0B] text-white shadow-2xs'
                : 'text-[#6B6B6B] hover:text-[#0A0A0A]'
            }`}
          >
            <Wrench className="w-3.5 h-3.5" />
            <span>Providers ({providers.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('bookings')}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-[8px] text-[13px] font-medium transition cursor-pointer ${
              activeTab === 'bookings'
                ? 'bg-[#6366F1] text-white shadow-2xs'
                : 'text-[#6B6B6B] hover:text-[#0A0A0A]'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Bookings & Quotes ({bookings.length + enquiries.length})</span>
          </button>
        </div>
      </div>

      {/* TAB 1: CONCISE PROVIDER CARDS + PAGINATION */}
      {activeTab === 'providers' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pagedProviders.map((prov) => (
              <article
                key={prov.id}
                onClick={() => setSelectedProvider(prov)}
                className="bg-white border border-[#E8E8EC] hover:border-[#F59E0B] rounded-[14px] p-4 flex flex-col justify-between gap-3 transition cursor-pointer"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-[#F59E0B]/15 text-[#D97706] text-[11px] font-medium">
                      {prov.category_name}
                    </span>
                    <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#FAFAFA] border border-[#E8E8EC] text-[11px] font-bold text-[#0A0A0A]">
                      <Star className="w-3 h-3 text-[#F59E0B] fill-[#F59E0B]" />
                      <span>
                        {prov.verified_rating_avg
                          ? `${prov.verified_rating_avg} (${prov.verified_review_count})`
                          : `${prov.off_platform_recommendation_count} Recs`}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <h2 className="text-[16px] font-display font-bold text-[#0A0A0A] truncate">
                      {prov.display_name}
                    </h2>
                    {prov.listing_mode === 'provider_managed' && (
                      <ShieldCheck className="w-4 h-4 text-[#10B981] shrink-0" />
                    )}
                  </div>

                  <p className="text-[12px] text-[#6B6B6B] line-clamp-1">{prov.description}</p>
                </div>

                <div className="pt-2.5 border-t border-[#E8E8EC] flex items-center justify-between text-[12px]">
                  <span className="font-medium text-[#0A0A0A] truncate">
                    {prov.indicative_pricing_text}
                  </span>
                  <span className="shrink-0 font-semibold text-[#D97706] inline-flex items-center gap-1">
                    <Eye className="w-3.5 h-3.5" />
                    <span>View Details</span>
                  </span>
                </div>
              </article>
            ))}
          </div>

          <div className="bg-white border border-[#E8E8EC] rounded-[14px] px-4 pb-3">
            <PaginationBar
              currentPage={providerPage}
              totalItems={providers.length}
              pageSize={PROVIDERS_PER_PAGE}
              onPageChange={setProviderPage}
              itemLabel="providers"
            />
          </div>
        </div>
      )}

      {/* TAB 2: MY BOOKINGS & QUOTES */}
      {activeTab === 'bookings' && (
        <div className="bg-white border border-[#E8E8EC] rounded-[16px] p-5 space-y-4">
          <div className="space-y-3">
            {pagedBookings.map((bk) => (
              <div
                key={bk.id}
                onClick={() => setSelectedBooking(bk)}
                className="p-4 rounded-[12px] bg-[#FAFAFA] border border-[#E8E8EC] hover:border-[#6366F1] flex flex-wrap items-center justify-between gap-4 cursor-pointer transition"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-[#6366F1]/10 text-[#6366F1] text-[11px] font-medium uppercase">
                      {bk.status.replace(/_/g, ' ')}
                    </span>
                    <span className="text-[12px] text-[#6B6B6B]">
                      {new Date(bk.scheduled_for).toLocaleDateString('en-IN')}
                    </span>
                  </div>
                  <h3 className="font-display font-bold text-[15px] text-[#0A0A0A]">
                    {bk.provider_name}
                  </h3>
                  <p className="text-[12px] text-[#6B6B6B]">Resident: {bk.resident_name}</p>
                </div>

                <div className="flex items-center gap-3">
                  <span className="font-display font-bold text-[15px] text-[#10B981]">
                    {formatPaiseToINR(bk.agreed_price_paise)}
                  </span>
                  <span className="text-[12px] font-semibold text-[#6366F1] inline-flex items-center gap-1">
                    <Eye className="w-3.5 h-3.5" />
                    <span>Details</span>
                  </span>
                </div>
              </div>
            ))}
          </div>

          <PaginationBar
            currentPage={bookingPage}
            totalItems={bookings.length}
            pageSize={BOOKINGS_PER_PAGE}
            onPageChange={setBookingPage}
            itemLabel="bookings"
          />
        </div>
      )}

      {/* MODAL 1: Provider Full Details & Recommendations */}
      <DetailModal
        open={Boolean(selectedProvider)}
        onClose={() => setSelectedProvider(null)}
        title={selectedProvider?.display_name ?? ''}
        subtitle={
          selectedProvider
            ? `${selectedProvider.category_name} • ${selectedProvider.indicative_pricing_text}`
            : ''
        }
        badge={
          selectedProvider && (
            <span className="px-2.5 py-0.5 rounded-full bg-[#F59E0B]/15 text-[#D97706] text-[11px] font-medium">
              {selectedProvider.listing_mode === 'provider_managed'
                ? 'Verified Provider Account'
                : 'Neighbour Recommended'}
            </span>
          )
        }
      >
        {selectedProvider && (
          <div className="space-y-4">
            <p className="text-[14px] text-[#0A0A0A] leading-relaxed">
              {selectedProvider.description}
            </p>

            <div className="p-3 rounded-[10px] bg-[#10B981]/10 border border-[#10B981]/25 text-[12px] text-[#059669] flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 shrink-0" />
              <span>{selectedProvider.verification_badge_scope}</span>
            </div>

            <div className="grid grid-cols-2 gap-3 p-3.5 rounded-[10px] bg-[#FAFAFA] border border-[#E8E8EC] text-[12px]">
              <div>
                <span className="text-[#6B6B6B] block">Availability</span>
                <strong className="text-[#0A0A0A]">{selectedProvider.availability_summary}</strong>
              </div>
              <div>
                <span className="text-[#6B6B6B] block">Contact</span>
                <strong className="text-[#0A0A0A] inline-flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-[#10B981]" />
                  {selectedProvider.public_phone ?? 'Book via App'}
                </strong>
              </div>
            </div>

            {selectedProvider.recommendations.length > 0 && (
              <div className="space-y-2">
                <div className="text-[12px] font-bold text-[#0A0A0A] flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5 text-[#6366F1]" />
                  <span>
                    Neighbour Recommendations ({selectedProvider.recommendations.length})
                  </span>
                </div>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {selectedProvider.recommendations.map((rec) => (
                    <div
                      key={rec.id}
                      className="p-2.5 rounded-[8px] bg-[#FAFAFA] border border-[#E8E8EC] text-[12px]"
                    >
                      <div className="flex items-center justify-between">
                        <strong>{rec.member_name}</strong>
                        <span className="text-[#6B6B6B] text-[11px]">{rec.approx_month_year}</span>
                      </div>
                      <div className="text-[#6366F1] font-medium text-[11px] mt-0.5">
                        {rec.work_summary}
                      </div>
                      <p className="text-[#6B6B6B] mt-0.5">{rec.endorsement_note}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </DetailModal>

      {/* MODAL 2: Booking Detail */}
      <DetailModal
        open={Boolean(selectedBooking)}
        onClose={() => setSelectedBooking(null)}
        title={selectedBooking?.provider_name ?? ''}
        subtitle={selectedBooking ? `Resident: ${selectedBooking.resident_name}` : ''}
      >
        {selectedBooking && (
          <div className="space-y-3 text-[13px]">
            <div className="p-3.5 rounded-[10px] bg-[#FAFAFA] border border-[#E8E8EC] space-y-1.5">
              <div>
                <span className="text-[#6B6B6B]">Status: </span>
                <strong className="uppercase text-[#6366F1]">
                  {selectedBooking.status.replace(/_/g, ' ')}
                </strong>
              </div>
              <div>
                <span className="text-[#6B6B6B]">Scheduled For: </span>
                <strong>{new Date(selectedBooking.scheduled_for).toLocaleString('en-IN')}</strong>
              </div>
              <div>
                <span className="text-[#6B6B6B]">Agreed Price: </span>
                <strong className="text-[#10B981]">
                  {formatPaiseToINR(selectedBooking.agreed_price_paise)}
                </strong>
              </div>
            </div>
            {selectedBooking.outcome_notes && (
              <p className="text-[#0A0A0A]">{selectedBooking.outcome_notes}</p>
            )}
          </div>
        )}
      </DetailModal>
    </div>
  );
}
