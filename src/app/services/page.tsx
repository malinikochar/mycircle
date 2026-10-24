import React from 'react';
import {
  Wrench,
  Star,
  ShieldCheck,
  Phone,
  CheckCircle2,
  ClipboardList,
  Award,
} from 'lucide-react';
import { loadCommunityBootstrapState } from '@/lib/data/community-loader';
import { formatPaiseToINR } from '@/lib/workflows/transactions';

export default async function ServicesPage() {
  const bootstrap = await loadCommunityBootstrapState();
  if (bootstrap.access_denied) return null;

  const categories = bootstrap.services?.categories ?? [];
  const providers = bootstrap.services?.providers ?? [];
  const enquiries = bootstrap.services?.enquiries ?? [];
  const bookings = bootstrap.services?.bookings ?? [];

  return (
    <div className="space-y-6">
      <section className="rounded-2xl bg-white border border-[#E8E8EC] p-5 sm:p-6 space-y-2">
        <span className="text-xs font-bold uppercase tracking-wider text-[#6366F1]">
          Phase 2 • Local Services & Recommendations (SRV-01..06 & Test 7)
        </span>
        <h1 className="text-2xl font-bold text-[#0A0A0A]">
          Service Providers, Quotes, Bookings & Verified Reviews
        </h1>
        <p className="text-sm text-[#6B6B6B] max-w-3xl">
          Distinguishes <strong>Provider-Managed</strong> accounts from <strong>Member-Recommended</strong> listings (requiring contact publication consent — `SRV-02`), and separates <strong>Verified Booking Rating Averages</strong> from <strong>Off-Platform Member Recommendations</strong> (`SRV-06`, Test 7).
        </p>

        <div className="flex flex-wrap gap-2 pt-3">
          {categories.map((cat) => (
            <span
              key={cat.id}
              className="px-3 py-1 rounded-full bg-[#FAFAFA] border border-[#E8E8EC] text-xs font-semibold text-[#0A0A0A]"
            >
              {cat.name}
            </span>
          ))}
        </div>
      </section>

      {/* Providers Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {providers.map((prv) => (
          <article
            key={prv.id}
            className="rounded-2xl bg-white border border-[#E8E8EC] p-5 space-y-4 flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase ${
                      prv.listing_mode === 'provider_managed'
                        ? 'bg-indigo-100 text-[#6366F1]'
                        : 'bg-amber-100 text-amber-900'
                    }`}
                  >
                    {prv.listing_mode === 'provider_managed'
                      ? 'Provider-Managed Account (SRV-01)'
                      : 'Member-Recommended with Consent (SRV-02)'}
                  </span>
                  <h2 className="text-lg font-bold text-[#0A0A0A] mt-1">{prv.display_name}</h2>
                  <p className="text-xs font-semibold text-[#6366F1]">{prv.category_name}</p>
                </div>

                {/* Separate Verified Booking Rating vs Off-Platform Endorsements (SRV-06 / Test 7) */}
                <div className="text-right bg-[#FAFAFA] border border-[#E8E8EC] rounded-xl px-3 py-2">
                  <div className="inline-flex items-center gap-1 font-bold text-sm text-[#0A0A0A] tabular-nums">
                    <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                    <span>{prv.verified_rating_avg ? Number(prv.verified_rating_avg).toFixed(2) : 'N/A'}</span>
                  </div>
                  <div className="text-[11px] text-[#6366F1] font-semibold">
                    {prv.verified_review_count} Verified Booking Reviews
                  </div>
                  <div className="text-[10px] text-[#6B6B6B]">
                    + {prv.off_platform_recommendation_count} Off-Platform Endorsements (Excluded from avg)
                  </div>
                </div>
              </div>

              <p className="text-xs text-[#6B6B6B] leading-relaxed">{prv.description}</p>

              <div className="p-3 rounded-xl bg-[#FAFAFA] border border-[#E8E8EC] text-xs space-y-1">
                <div>
                  <strong>Indicative Pricing:</strong> {prv.indicative_pricing_text}
                </div>
                <div>
                  <strong>Hours & Area:</strong> {prv.availability_summary} • {prv.service_area}
                </div>
                <div className="flex items-center gap-1.5 text-[#6366F1] font-medium pt-0.5">
                  <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                  <span>Badge Scope: {prv.verification_badge_scope} (SRV-03)</span>
                </div>
              </div>

              {prv.recommendations && prv.recommendations.length > 0 && (
                <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200 text-xs space-y-1">
                  <div className="font-bold text-amber-950 flex items-center gap-1.5">
                    <Award className="w-3.5 h-3.5" />
                    <span>Off-Platform Neighbour Recommendation (SRV-06 / Test 7)</span>
                  </div>
                  {prv.recommendations.map((rec) => (
                    <div key={rec.id} className="text-amber-950">
                      <strong>{rec.member_name}</strong> ({rec.approx_month_year} — {rec.work_summary}): “
                      {rec.endorsement_note}”
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-[#E8E8EC] flex items-center justify-between text-xs">
              <span className="inline-flex items-center gap-1.5 font-semibold text-[#0A0A0A]">
                <Phone className="w-3.5 h-3.5 text-[#6366F1]" />
                {prv.public_phone ?? 'Contact via In-App Enquiry'}
              </span>
              <span className="text-[11px] text-emerald-800 font-semibold">
                Consent Recorded: {prv.contact_publication_consented ? 'Yes' : 'No'}
              </span>
            </div>
          </article>
        ))}
      </div>

      {/* Enquiries, Quotes & Completed Bookings (SRV-04, SRV-05) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section className="rounded-2xl bg-white border border-[#E8E8EC] p-5 space-y-3">
          <div className="flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-[#6366F1]" />
            <h2 className="text-base font-bold text-[#0A0A0A]">Service Enquiries & Quotes (SRV-04)</h2>
          </div>
          {enquiries.map((enq) => (
            <div key={enq.id} className="p-4 rounded-xl bg-[#FAFAFA] border border-[#E8E8EC] text-xs space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-[#0A0A0A]">{enq.provider_name}</span>
                <span className="px-2 py-0.5 rounded bg-indigo-100 text-[#6366F1] font-bold uppercase">
                  {enq.status}
                </span>
              </div>
              <p className="text-[#6B6B6B]">
                <strong>Resident ({enq.resident_name}):</strong> {enq.problem_description}
              </p>
              {enq.quoted_price_paise && (
                <div className="p-2.5 rounded-lg bg-white border border-[#E8E8EC] text-[#0A0A0A]">
                  <strong>Provider Quote: {formatPaiseToINR(enq.quoted_price_paise)}</strong> — {enq.quote_notes}
                </div>
              )}
            </div>
          ))}
        </section>

        <section className="rounded-2xl bg-white border border-[#E8E8EC] p-5 space-y-3">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-[#6366F1]" />
            <h2 className="text-base font-bold text-[#0A0A0A]">
              Completed Bookings Unlocking Verified Reviews (SRV-05)
            </h2>
          </div>
          {bookings.map((bk) => (
            <div key={bk.id} className="p-4 rounded-xl bg-[#FAFAFA] border border-[#E8E8EC] text-xs space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-[#0A0A0A]">{bk.provider_name}</span>
                <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-900 font-bold uppercase">
                  {bk.status} • {formatPaiseToINR(bk.agreed_price_paise)}
                </span>
              </div>
              <p className="text-[#6B6B6B]">
                <strong>Resident:</strong> {bk.resident_name}
              </p>
              {bk.outcome_notes && (
                <p className="text-[#0A0A0A]">
                  <strong>Completion Report:</strong> {bk.outcome_notes}
                </p>
              )}
            </div>
          ))}
        </section>
      </div>
    </div>
  );
}
