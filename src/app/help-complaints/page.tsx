import React from 'react';
import Link from 'next/link';
import {
  FileWarning,
  Layers,
  Landmark,
  ShieldCheck,
  HeartHandshake,
  Lock,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import { loadCommunityBootstrapState } from '@/lib/data/community-loader';

export default async function HelpComplaintsPage() {
  const bootstrap = await loadCommunityBootstrapState();
  if (bootstrap.access_denied) return null;

  const helpRequests = bootstrap.help_and_cases?.help_requests ?? [];
  const complaints = bootstrap.help_and_cases?.complaints ?? [];
  const sharedIssues = bootstrap.help_and_cases?.shared_issues ?? [];
  const authorityContacts = bootstrap.help_and_cases?.authority_contacts ?? [];
  const escalationRecords = bootstrap.help_and_cases?.escalation_records ?? [];

  return (
    <div className="space-y-6">
      <section className="rounded-2xl bg-white border border-[#E5DEC9] p-5 sm:p-6 space-y-2">
        <span className="text-xs font-bold uppercase tracking-wider text-[#0F766E]">
          Phase 3 • Help Requests, Complaints & Civic Escalation (HELP-01..03 & CASE-01..06)
        </span>
        <h1 className="text-2xl font-bold text-[#0F172A]">
          Everyday Neighbour Help, Scoped Case Tracking & Municipal Escalation
        </h1>
        <p className="text-sm text-[#475569] max-w-3xl">
          Duplicate complaints link into <strong>Shared Community Issues</strong> (`shared_issues`) without exposing private reporter unit or phone details (`CASE-03`, Test 11). External municipal escalations include only consented redacted summaries and never fabricate official government acknowledgement (`CASE-05`, Test 12).
        </p>
      </section>

      {/* Everyday Help Requests (HELP-01..03) */}
      <section className="rounded-2xl bg-white border border-[#E5DEC9] p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-lg font-bold text-[#0F172A]">
              Everyday Practical Help Requests ({helpRequests.length} Visible)
            </h2>
            <p className="text-xs text-[#475569]">
              Admin-only confidential help requests are hidden from unrelated residents by the server (`HELP-02`).
            </p>
          </div>
          <Link
            href="/social-service"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#F0FDFA] text-[#0F766E] border border-teal-300 text-xs font-bold"
          >
            <HeartHandshake className="w-3.5 h-3.5" />
            <span>Need to Borrow an Item? Use Social Service →</span>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {helpRequests.map((hr) => (
            <article
              key={hr.id}
              className="rounded-xl bg-[#FAF8F5] border border-[#E5DEC9] p-4 space-y-2 text-xs"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="px-2 py-0.5 rounded bg-teal-100 text-[#0F766E] font-bold uppercase">
                  {hr.category.replace(/_/g, ' ')} • {hr.status}
                </span>
                <span className="inline-flex items-center gap-1 font-semibold text-[#475569]">
                  {hr.visibility_scope === 'admin_only' && <Lock className="w-3 h-3 text-amber-700" />}
                  Scope: {hr.visibility_scope}
                </span>
              </div>
              <h3 className="font-bold text-sm text-[#0F172A]">{hr.title}</h3>
              <p className="text-[#475569]">{hr.description}</p>
              <div className="flex items-center justify-between pt-1 text-[11px] text-[#475569]">
                <span>Requester: {hr.requester_name} ({hr.approx_area})</span>
                <span>Needed: {hr.timing_needed}</span>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* Shared Community Issues & Redacted Civic Escalation (CASE-03..06 / Tests 11 & 12) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section className="rounded-2xl bg-white border border-[#E5DEC9] p-5 space-y-4">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-[#0F766E]" />
            <h2 className="text-base font-bold text-[#0F172A]">
              Shared Issues & Duplicate Case Linking (CASE-03 / Test 11)
            </h2>
          </div>

          {sharedIssues.map((si) => (
            <article
              key={si.id}
              className="rounded-xl bg-[#FAF8F5] border border-[#E5DEC9] p-4 space-y-2 text-xs"
            >
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-0.5 rounded-full bg-teal-100 text-[#0F766E] font-bold uppercase">
                  {si.category} • {si.status.replace(/_/g, ' ')}
                </span>
                <span className="font-bold text-[#0F172A] tabular-nums">
                  {si.linked_cases_count} Linked Resident Reports
                </span>
              </div>
              <h3 className="font-bold text-sm text-[#0F172A]">{si.title}</h3>
              <p className="text-[#475569] leading-relaxed">{si.public_summary}</p>
              <div className="p-2.5 rounded-lg bg-white border border-[#E5DEC9] text-[11px] text-[#0F766E] font-medium">
                Privacy Guarantee (Test 11): Individual reporter flat numbers and phone numbers are never exposed on the shared issue card.
              </div>
            </article>
          ))}
        </section>

        <section className="rounded-2xl bg-white border border-[#E5DEC9] p-5 space-y-4">
          <div className="flex items-center gap-2">
            <Landmark className="w-5 h-5 text-[#0F766E]" />
            <h2 className="text-base font-bold text-[#0F172A]">
              Consented Redacted Civic Escalation & Authority Directory (CASE-04..06 / Test 12)
            </h2>
          </div>

          {escalationRecords.map((er) => (
            <article
              key={er.id}
              className="rounded-xl bg-[#FEF3C7]/60 border border-amber-300 p-4 space-y-2 text-xs"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-amber-200 text-amber-950 font-bold uppercase">
                  Status: {er.status} ({er.submission_mode.replace(/_/g, ' ')})
                </span>
                <span className="font-mono font-bold text-[#0F172A]">
                  Docket #{er.official_docket_reference ?? 'Pending'}
                </span>
              </div>
              <div className="font-bold text-[#0F172A]">
                Redacted Package ({er.consented_complaint_count} Consented Reports Included):
              </div>
              <p className="text-slate-800 leading-relaxed">{er.redacted_package_summary}</p>
              <div className="p-2.5 rounded-lg bg-white border border-amber-300 text-[11px] text-amber-950">
                <strong>Honest Escalation State (CASE-05 / Test 12):</strong> {er.acknowledgement_evidence_note}
              </div>
            </article>
          ))}

          <div className="space-y-2 pt-2">
            <div className="text-xs font-bold text-[#0F172A]">Verified Municipal Authority Contacts:</div>
            {authorityContacts.map((ac) => (
              <div
                key={ac.id}
                className="p-3 rounded-xl bg-[#FAF8F5] border border-[#E5DEC9] text-xs space-y-1"
              >
                <div className="font-bold text-[#0F172A]">
                  {ac.office_title} — {ac.jurisdiction_name}
                </div>
                <div className="text-[#475569]">
                  Channel: {ac.submission_channel} • Ref: {ac.contact_reference}
                </div>
                <div className="text-[11px] text-[#0F766E]">
                  Last Verified: {ac.last_verified_at} • Source: {ac.source_url}
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Individual Complaints & Case Timeline (CASE-01..02) */}
      <section className="rounded-2xl bg-white border border-[#E5DEC9] p-5 space-y-4">
        <div className="flex items-center gap-2">
          <FileWarning className="w-5 h-5 text-[#0F766E]" />
          <h2 className="text-lg font-bold text-[#0F172A]">
            Complaint Cases & Audit Trail ({complaints.length} Visible to Current Persona)
          </h2>
        </div>

        <div className="space-y-4">
          {complaints.map((c) => (
            <article
              key={c.id}
              className="rounded-xl bg-[#FAF8F5] border border-[#E5DEC9] p-4 space-y-3 text-xs"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-[#0F766E]">{c.case_reference}</span>
                  <span className="font-bold text-sm text-[#0F172A]">{c.title}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-teal-100 text-[#0F766E] font-bold uppercase">
                    {c.category} • {c.status.replace(/_/g, ' ')}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-slate-200 text-slate-800 font-semibold">
                    Privacy: {c.privacy_choice.replace(/_/g, ' ')}
                  </span>
                </div>
              </div>

              <p className="text-[#475569]">{c.description}</p>

              <div className="flex flex-wrap items-center justify-between gap-2 text-[#475569]">
                <span>
                  Location: <strong>{c.building_name ?? 'Complex'} — {c.location_detail}</strong>
                </span>
                <span>
                  Assigned Sub-Admin: <strong>{c.assigned_admin_name ?? 'Unassigned'}</strong> • Next:{' '}
                  {c.next_action}
                </span>
              </div>

              {c.events && c.events.length > 0 && (
                <div className="p-3 rounded-lg bg-white border border-[#E5DEC9] space-y-1.5">
                  <div className="font-bold text-[#0F172A]">Case Status History:</div>
                  {c.events.map((ev, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-[11px] text-[#475569]">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#0F766E] shrink-0 mt-0.5" />
                      <span>
                        <strong>{ev.to_status.toUpperCase()}:</strong> {ev.note}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
