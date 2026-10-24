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
import { MemberAvatar } from '@/components/ui/MemberAvatar';

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
    <div className="space-y-6">
      {/* Spacious Apple-style Header & Tabs */}
      <div className="rounded-[24px] bg-white border border-black/[0.06] shadow-[0_8px_30px_rgba(0,0,0,0.03)] p-6 sm:p-8 flex flex-wrap items-center justify-between gap-5">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#F59E0B]/15 text-[#D97706] text-[11px] font-semibold">
            <Wrench className="w-3.5 h-3.5" />
            <span>Verified Technicians & Specialists</span>
          </div>
          <h1 className="text-[24px] sm:text-[28px] font-display font-bold tracking-[-0.03em] text-[#1D1D1F]">
            Local Service Providers
          </h1>
          <p className="text-[13px] text-[#6E6E73]">
            Verified technicians and neighbour-recommended specialists. Click any card for details.
          </p>
        </div>

        <div className="flex flex-wrap gap-1.5 p-1.5 rounded-full bg-[#F5F5F7] border border-black/[0.05]">
          <button
            type="button"
            onClick={() => setActiveTab('providers')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-[13px] font-semibold transition cursor-pointer ${
              activeTab === 'providers'
                ? 'bg-[#F59E0B] text-white shadow-xs'
                : 'text-[#6E6E73] hover:text-[#1D1D1F]'
            }`}
          >
            <Wrench className="w-3.5 h-3.5" />
            <span>Providers ({providers.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('bookings')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-[13px] font-semibold transition cursor-pointer ${
              activeTab === 'bookings'
                ? 'bg-[#0071E3] text-white shadow-xs'
                : 'text-[#6E6E73] hover:text-[#1D1D1F]'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Bookings & Quotes ({bookings.length + enquiries.length})</span>
          </button>
        </div>
      </div>

      {/* TAB 1: SPACIOUS PROVIDER CARDS + PAGINATION */}
      {activeTab === 'providers' && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {pagedProviders.map((prov) => (
              <article
                key={prov.id}
                onClick={() => setSelectedProvider(prov)}
                className="bg-white border border-black/[0.06] hover:border-[#F59E0B]/40 rounded-[22px] p-6 flex flex-col justify-between gap-4 transition cursor-pointer shadow-[0_8px_30px_rgba(0,0,0,0.02)]"
              >
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="px-3 py-1 rounded-full bg-[#F59E0B]/15 text-[#D97706] text-[11px] font-semibold">
                      {prov.category_name}
                    </span>
                    <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#F5F5F7] border border-black/[0.05] text-[11px] font-bold text-[#1D1D1F]">
                      <Star className="w-3 h-3 text-[#F59E0B] fill-[#F59E0B]" />
                      <span>
                        {prov.verified_rating_avg
                          ? `${prov.verified_rating_avg} (${prov.verified_review_count})`
                          : `${prov.off_platform_recommendation_count} Recs`}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 pt-1">
                    <MemberAvatar name={prov.display_name} size="md" ring />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <h2 className="text-[16px] font-display font-bold text-[#1D1D1F] truncate">
                          {prov.display_name}
                        </h2>
                        {prov.listing_mode === 'provider_managed' && (
                          <ShieldCheck className="w-4 h-4 text-[#10B981] shrink-0" />
                        )}
                      </div>
                      <p className="text-[12px] text-[#6E6E73] line-clamp-1">{prov.description}</p>
                    </div>
                  </div>
                </div>

                <div className="pt-3.5 border-t border-black/[0.06] flex items-center justify-between text-[12px]">
                  <span className="font-semibold text-[#1D1D1F] truncate">
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

          <div className="bg-white border border-black/[0.06] rounded-[22px] px-6 py-2">
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
        <div className="bg-white border border-black/[0.06] shadow-[0_8px_30px_rgba(0,0,0,0.03)] rounded-[24px] p-6 sm:p-8 space-y-5">
          <div className="space-y-4">
            {pagedBookings.map((bk) => (
              <div
                key={bk.id}
                onClick={() => setSelectedBooking(bk)}
                className="p-6 rounded-[20px] bg-[#F5F5F7]/70 hover:bg-white border border-black/[0.06] hover:border-[#0071E3]/40 flex flex-wrap items-center justify-between gap-4 cursor-pointer transition"
              >
                <div className="flex items-center gap-3.5">
                  <MemberAvatar name={bk.provider_name} size="md" />
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-3 py-0.5 rounded-full bg-[#0071E3]/10 text-[#0071E3] text-[11px] font-semibold uppercase">
                        {bk.status.replace(/_/g, ' ')}
                      </span>
                      <span className="text-[12px] text-[#6E6E73]">
                        {new Date(bk.scheduled_for).toLocaleDateString('en-SG')}
                      </span>
                    </div>
                    <h3 className="font-display font-bold text-[16px] text-[#1D1D1F]">
                      {bk.provider_name}
                    </h3>
                    <p className="text-[12px] text-[#6E6E73]">Resident: {bk.resident_name}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="font-display font-bold text-[16px] text-[#10B981]">
                    {formatPaiseToINR(bk.agreed_price_paise)}
                  </span>
                  <span className="h-[36px] px-4 rounded-full bg-white border border-black/[0.08] text-[12px] font-semibold text-[#0071E3] inline-flex items-center gap-1.5">
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
            <span className="px-2.5 py-0.5 rounded-full bg-[#F59E0B]/15 text-[#D97706] text-[11px] font-semibold">
              {selectedProvider.listing_mode === 'provider_managed'
                ? 'Verified Provider Account'
                : 'Neighbour Recommended'}
            </span>
          )
        }
      >
        {selectedProvider && (
          <div className="space-y-4">
            <p className="text-[14px] text-[#1D1D1F] leading-relaxed">
              {selectedProvider.description}
            </p>

            <div className="p-3.5 rounded-[12px] bg-[#10B981]/10 border border-[#10B981]/25 text-[12px] text-[#059669] flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 shrink-0" />
              <span>{selectedProvider.verification_badge_scope}</span>
            </div>

            <div className="grid grid-cols-2 gap-3 p-4 rounded-[14px] bg-[#F5F5F7] border border-black/[0.06] text-[12px]">
              <div>
                <span className="text-[#6E6E73] block">Availability</span>
                <strong className="text-[#1D1D1F]">{selectedProvider.availability_summary}</strong>
              </div>
              <div>
                <span className="text-[#6E6E73] block">Contact</span>
                <strong className="text-[#1D1D1F] inline-flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-[#10B981]" />
                  {selectedProvider.public_phone ?? 'Book via App'}
                </strong>
              </div>
            </div>

            {selectedProvider.recommendations.length > 0 && (
              <div className="space-y-2">
                <div className="text-[12px] font-bold text-[#1D1D1F] flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5 text-[#0071E3]" />
                  <span>
                    Neighbour Recommendations ({selectedProvider.recommendations.length})
                  </span>
                </div>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {selectedProvider.recommendations.map((rec) => (
                    <div
                      key={rec.id}
                      className="p-3.5 rounded-[12px] bg-[#F5F5F7] border border-black/[0.05] text-[12px]"
                    >
                      <div className="flex items-center justify-between">
                        <strong>{rec.member_name}</strong>
                        <span className="text-[#6E6E73] text-[11px]">{rec.approx_month_year}</span>
                      </div>
                      <div className="text-[#0071E3] font-semibold text-[11px] mt-0.5">
                        {rec.work_summary}
                      </div>
                      <p className="text-[#6E6E73] mt-0.5">{rec.endorsement_note}</p>
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
            <div className="p-4 rounded-[14px] bg-[#F5F5F7] border border-black/[0.06] space-y-1.5">
              <div>
                <span className="text-[#6E6E73]">Status: </span>
                <strong className="uppercase text-[#0071E3]">
                  {selectedBooking.status.replace(/_/g, ' ')}
                </strong>
              </div>
              <div>
                <span className="text-[#6E6E73]">Scheduled For: </span>
                <strong>{new Date(selectedBooking.scheduled_for).toLocaleString('en-SG')}</strong>
              </div>
              <div>
                <span className="text-[#6E6E73]">Agreed Price: </span>
                <strong className="text-[#10B981]">
                  {formatPaiseToINR(selectedBooking.agreed_price_paise)}
                </strong>
              </div>
            </div>
            {selectedBooking.outcome_notes && (
              <p className="text-[#1D1D1F]">{selectedBooking.outcome_notes}</p>
            )}
          </div>
        )}
      </DetailModal>
    </div>
  );
}
