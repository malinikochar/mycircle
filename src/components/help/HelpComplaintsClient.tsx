'use client';

import React, { useState } from 'react';
import {
  FileWarning,
  HeartHandshake,
  Building2,
  Eye,
  Landmark,
} from 'lucide-react';
import type {
  AuthorityContactItem,
  ComplaintItem,
  EscalationRecordItem,
  HelpRequestItem,
  SharedIssueItem,
} from '@/lib/types/domain';
import { PaginationBar } from '@/components/ui/PaginationBar';
import { DetailModal } from '@/components/ui/DetailModal';

interface HelpComplaintsClientProps {
  complaints: ComplaintItem[];
  helpRequests: HelpRequestItem[];
  sharedIssues: SharedIssueItem[];
  authorityContacts: AuthorityContactItem[];
  escalationRecords: EscalationRecordItem[];
}

const ITEMS_PER_PAGE = 3;

export function HelpComplaintsClient({
  complaints,
  helpRequests,
  sharedIssues,
  authorityContacts,
  escalationRecords,
}: HelpComplaintsClientProps) {
  const [activeTab, setActiveTab] = useState<'complaints' | 'shared' | 'help' | 'civic'>(
    'complaints'
  );
  const [page, setPage] = useState(1);

  // Modals
  const [selectedComplaint, setSelectedComplaint] = useState<ComplaintItem | null>(null);
  const [selectedHelp, setSelectedHelp] = useState<HelpRequestItem | null>(null);
  const [selectedShared, setSelectedShared] = useState<SharedIssueItem | null>(null);

  function switchTab(next: 'complaints' | 'shared' | 'help' | 'civic') {
    setActiveTab(next);
    setPage(1);
  }

  const totalItems =
    activeTab === 'complaints'
      ? complaints.length
      : activeTab === 'help'
      ? helpRequests.length
      : activeTab === 'shared'
      ? sharedIssues.length
      : escalationRecords.length;

  const pagedComplaints = complaints.slice(
    (page - 1) * ITEMS_PER_PAGE,
    page * ITEMS_PER_PAGE
  );
  const pagedHelp = helpRequests.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);
  const pagedShared = sharedIssues.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  return (
    <div className="space-y-5">
      {/* Compact Header */}
      <div className="rounded-[16px] bg-white border border-[#E8E8EC] p-5 sm:p-6 flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-[22px] sm:text-[26px] font-display font-bold tracking-[-0.03em] text-[#0A0A0A]">
            Helpdesk & Complaints
          </h1>
          <p className="text-[13px] text-[#6B6B6B]">
            Track society maintenance tickets, shared tower issues, and neighbour help requests.
          </p>
        </div>

        {/* Segmented Tabs */}
        <div className="flex flex-wrap gap-1.5 p-1 rounded-[10px] bg-[#FAFAFA] border border-[#E8E8EC]">
          <button
            type="button"
            onClick={() => switchTab('complaints')}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-[8px] text-[13px] font-medium transition cursor-pointer ${
              activeTab === 'complaints'
                ? 'bg-[#6366F1] text-white shadow-2xs'
                : 'text-[#6B6B6B] hover:text-[#0A0A0A]'
            }`}
          >
            <FileWarning className="w-3.5 h-3.5" />
            <span>Complaints ({complaints.length})</span>
          </button>
          <button
            type="button"
            onClick={() => switchTab('shared')}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-[8px] text-[13px] font-medium transition cursor-pointer ${
              activeTab === 'shared'
                ? 'bg-[#F59E0B] text-white shadow-2xs'
                : 'text-[#6B6B6B] hover:text-[#0A0A0A]'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Shared Issues ({sharedIssues.length})</span>
          </button>
          <button
            type="button"
            onClick={() => switchTab('help')}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-[8px] text-[13px] font-medium transition cursor-pointer ${
              activeTab === 'help'
                ? 'bg-[#10B981] text-white shadow-2xs'
                : 'text-[#6B6B6B] hover:text-[#0A0A0A]'
            }`}
          >
            <HeartHandshake className="w-3.5 h-3.5" />
            <span>Neighbour Help ({helpRequests.length})</span>
          </button>
          <button
            type="button"
            onClick={() => switchTab('civic')}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-[8px] text-[13px] font-medium transition cursor-pointer ${
              activeTab === 'civic'
                ? 'bg-[#0EA5E9] text-white shadow-2xs'
                : 'text-[#6B6B6B] hover:text-[#0A0A0A]'
            }`}
          >
            <Landmark className="w-3.5 h-3.5" />
            <span>Civic Escalations ({escalationRecords.length})</span>
          </button>
        </div>
      </div>

      {/* Main Content Card */}
      <div className="bg-white border border-[#E8E8EC] rounded-[16px] p-5 space-y-4">
        {/* TAB 1: COMPLAINTS */}
        {activeTab === 'complaints' && (
          <div className="space-y-3">
            {pagedComplaints.map((c) => (
              <div
                key={c.id}
                onClick={() => setSelectedComplaint(c)}
                className="p-4 rounded-[12px] bg-[#FAFAFA] border border-[#E8E8EC] hover:border-[#6366F1] flex flex-wrap items-center justify-between gap-4 transition cursor-pointer"
              >
                <div className="space-y-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-[11px] font-bold text-[#6366F1]">
                      {c.case_reference}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-[#6366F1]/10 text-[#6366F1] text-[10px] font-medium uppercase">
                      {c.category}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-white border border-[#E8E8EC] text-[10px] font-bold uppercase text-[#0A0A0A]">
                      {c.status.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <h3 className="font-display font-bold text-[15px] text-[#0A0A0A] truncate">
                    {c.title}
                  </h3>
                  <p className="text-[12px] text-[#6B6B6B] line-clamp-1">{c.description}</p>
                </div>

                <span className="shrink-0 h-[34px] px-3 rounded-[8px] bg-white border border-[#E8E8EC] text-[12px] font-medium inline-flex items-center gap-1.5 text-[#6366F1]">
                  <Eye className="w-3.5 h-3.5" />
                  <span>View Case</span>
                </span>
              </div>
            ))}
          </div>
        )}

        {/* TAB 2: SHARED BUILDING ISSUES */}
        {activeTab === 'shared' && (
          <div className="space-y-3">
            {pagedShared.map((cl) => (
              <div
                key={cl.id}
                onClick={() => setSelectedShared(cl)}
                className="p-4 rounded-[12px] bg-[#FAFAFA] border border-[#E8E8EC] hover:border-[#F59E0B] flex flex-wrap items-center justify-between gap-4 transition cursor-pointer"
              >
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-[#F59E0B]/15 text-[#D97706] text-[11px] font-bold">
                      {cl.linked_cases_count} Linked Cases
                    </span>
                    <span className="text-[12px] text-[#6B6B6B] capitalize">{cl.category}</span>
                  </div>
                  <h3 className="font-display font-bold text-[15px] text-[#0A0A0A] truncate">
                    {cl.title}
                  </h3>
                  <p className="text-[12px] text-[#6B6B6B] line-clamp-1">{cl.public_summary}</p>
                </div>

                <span className="shrink-0 h-[34px] px-3 rounded-[8px] bg-white border border-[#E8E8EC] text-[12px] font-medium inline-flex items-center gap-1.5 text-[#D97706]">
                  <Eye className="w-3.5 h-3.5" />
                  <span>Details</span>
                </span>
              </div>
            ))}
          </div>
        )}

        {/* TAB 3: NEIGHBOUR HELP */}
        {activeTab === 'help' && (
          <div className="space-y-3">
            {pagedHelp.map((req) => (
              <div
                key={req.id}
                onClick={() => setSelectedHelp(req)}
                className="p-4 rounded-[12px] bg-[#FAFAFA] border border-[#E8E8EC] hover:border-[#10B981] flex flex-wrap items-center justify-between gap-4 transition cursor-pointer"
              >
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-[#10B981]/15 text-[#059669] text-[11px] font-medium">
                      {req.category}
                    </span>
                    <span className="text-[12px] text-[#6B6B6B]">by {req.requester_name}</span>
                  </div>
                  <h3 className="font-display font-bold text-[15px] text-[#0A0A0A] truncate">
                    {req.title}
                  </h3>
                  <p className="text-[12px] text-[#6B6B6B] line-clamp-1">{req.description}</p>
                </div>

                <span className="shrink-0 h-[34px] px-3 rounded-[8px] bg-white border border-[#E8E8EC] text-[12px] font-medium inline-flex items-center gap-1.5 text-[#10B981]">
                  <Eye className="w-3.5 h-3.5" />
                  <span>View</span>
                </span>
              </div>
            ))}
          </div>
        )}

        {/* TAB 4: CIVIC ESCALATIONS */}
        {activeTab === 'civic' && (
          <div className="space-y-3">
            {escalationRecords.map((esc) => (
              <div
                key={esc.id}
                className="p-4 rounded-[12px] bg-[#FAFAFA] border border-[#E8E8EC] space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-[#0EA5E9]">
                    Docket: {esc.official_docket_reference ?? 'Pending Submission'}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-[#0EA5E9]/10 text-[#0284C7] text-[10px] font-bold uppercase">
                    {esc.status.replace(/_/g, ' ')}
                  </span>
                </div>
                <p className="text-[13px] text-[#0A0A0A]">{esc.redacted_package_summary}</p>
                <div className="text-[11px] text-[#6B6B6B]">
                  Consented Resident Cases: <strong>{esc.consented_complaint_count}</strong>
                </div>
              </div>
            ))}

            {authorityContacts.map((auth) => (
              <div
                key={auth.id}
                className="p-3.5 rounded-[12px] bg-white border border-[#E8E8EC] flex items-center justify-between text-xs"
              >
                <div>
                  <strong className="text-[#0A0A0A]">{auth.office_title}</strong>
                  <div className="text-[#6B6B6B]">{auth.jurisdiction_name}</div>
                </div>
                <span className="font-mono text-[#6366F1]">{auth.contact_reference}</span>
              </div>
            ))}
          </div>
        )}

        {activeTab !== 'civic' && (
          <PaginationBar
            currentPage={page}
            totalItems={totalItems}
            pageSize={ITEMS_PER_PAGE}
            onPageChange={setPage}
            itemLabel={activeTab}
          />
        )}
      </div>

      {/* MODAL 1: Complaint Full Details & Timeline */}
      <DetailModal
        open={Boolean(selectedComplaint)}
        onClose={() => setSelectedComplaint(null)}
        title={
          selectedComplaint
            ? `${selectedComplaint.case_reference} — ${selectedComplaint.title}`
            : ''
        }
        subtitle={
          selectedComplaint
            ? `${selectedComplaint.building_name ?? 'Society Wide'} • Filed by ${
                selectedComplaint.reporter_name
              }`
            : ''
        }
        badge={
          selectedComplaint && (
            <span className="px-2.5 py-0.5 rounded-full bg-[#6366F1]/10 text-[#6366F1] text-[11px] font-bold uppercase">
              {selectedComplaint.status.replace(/_/g, ' ')}
            </span>
          )
        }
      >
        {selectedComplaint && (
          <div className="space-y-4">
            <p className="text-[14px] text-[#0A0A0A] leading-relaxed">
              {selectedComplaint.description}
            </p>
            <div className="grid grid-cols-2 gap-3 p-3.5 rounded-[10px] bg-[#FAFAFA] border border-[#E8E8EC] text-[12px]">
              <div>
                <span className="text-[#6B6B6B] block">Assigned Sub-Admin</span>
                <strong className="text-[#0A0A0A]">
                  {selectedComplaint.assigned_admin_name ?? 'Department Queue'}
                </strong>
              </div>
              <div>
                <span className="text-[#6B6B6B] block">Location</span>
                <strong className="text-[#0A0A0A]">{selectedComplaint.location_detail}</strong>
              </div>
            </div>

            {selectedComplaint.events.length > 0 && (
              <div className="space-y-2">
                <div className="text-[12px] font-bold text-[#0A0A0A]">Case Audit Timeline</div>
                {selectedComplaint.events.map((ev, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-[8px] bg-[#FAFAFA] border border-[#E8E8EC] text-[12px]"
                  >
                    <strong className="uppercase text-[#6366F1]">{ev.to_status}: </strong>
                    <span>{ev.note}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </DetailModal>

      {/* MODAL 2: Shared Issue Details */}
      <DetailModal
        open={Boolean(selectedShared)}
        onClose={() => setSelectedShared(null)}
        title={selectedShared?.title ?? ''}
        subtitle={selectedShared ? `Category: ${selectedShared.category}` : ''}
      >
        {selectedShared && (
          <div className="space-y-4">
            <p className="text-[14px] text-[#0A0A0A] leading-relaxed">
              {selectedShared.public_summary}
            </p>
            <div className="p-3 rounded-[10px] bg-[#FAFAFA] border border-[#E8E8EC] flex items-center justify-between text-[13px]">
              <span>
                Linked Resident Cases: <strong>{selectedShared.linked_cases_count}</strong>
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-[#10B981]/15 text-[#059669] text-xs font-bold uppercase">
                {selectedShared.status}
              </span>
            </div>
          </div>
        )}
      </DetailModal>

      {/* MODAL 3: Neighbour Help Details */}
      <DetailModal
        open={Boolean(selectedHelp)}
        onClose={() => setSelectedHelp(null)}
        title={selectedHelp?.title ?? ''}
        subtitle={selectedHelp ? `Requested by ${selectedHelp.requester_name}` : ''}
      >
        {selectedHelp && (
          <div className="space-y-3">
            <p className="text-[14px] text-[#0A0A0A] leading-relaxed">
              {selectedHelp.description}
            </p>
            <div className="p-3 rounded-[10px] bg-[#FAFAFA] border border-[#E8E8EC] text-[12px] space-y-1">
              <div>
                Area: <strong>{selectedHelp.approx_area}</strong> • Timing:{' '}
                <strong>{selectedHelp.timing_needed}</strong>
              </div>
              {selectedHelp.linked_social_service_note && (
                <div className="text-[#6366F1]">{selectedHelp.linked_social_service_note}</div>
              )}
            </div>
          </div>
        )}
      </DetailModal>
    </div>
  );
}
