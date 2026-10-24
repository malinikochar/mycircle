'use client';

import React, { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  Camera,
  ShieldAlert,
  Radio,
  CheckCircle2,
  Eye,
  Lock,
} from 'lucide-react';
import type {
  ActiveLocationItem,
  CameraAccessEventItem,
  CameraItem,
  SOSIncidentItem,
} from '@/lib/types/domain';
import {
  acknowledgeSOSIncidentAction,
  requestCameraSessionAction,
} from '@/app/actions/community-actions';
import { PaginationBar } from '@/components/ui/PaginationBar';
import { DetailModal } from '@/components/ui/DetailModal';

interface SafetyCCTVClientProps {
  actorId: string;
  actorName: string;
  incidents: SOSIncidentItem[];
  activeLocations: ActiveLocationItem[];
  cameras: CameraItem[];
  cameraAccessEvents: CameraAccessEventItem[];
}

const CAMERAS_PER_PAGE = 4;

export function SafetyCCTVClient({
  incidents,
  activeLocations,
  cameras,
}: SafetyCCTVClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [activeTab, setActiveTab] = useState<'alerts' | 'cameras' | 'staff'>('alerts');
  const [cameraPage, setCameraPage] = useState(1);
  const [selectedGroup, setSelectedGroup] = useState<string>('all');
  const [feedback, setFeedback] = useState<string | null>(null);

  // Modals
  const [selectedIncident, setSelectedIncident] = useState<SOSIncidentItem | null>(null);
  const [selectedCamera, setSelectedCamera] = useState<CameraItem | null>(null);

  const groups = Array.from(new Set(cameras.map((c) => c.group_name)));
  const filteredCameras = cameras.filter(
    (c) => selectedGroup === 'all' || c.group_name === selectedGroup
  );
  const pagedCameras = filteredCameras.slice(
    (cameraPage - 1) * CAMERAS_PER_PAGE,
    cameraPage * CAMERAS_PER_PAGE
  );

  function handleAcknowledgeSOS(incidentId: string) {
    startTransition(async () => {
      const res = await acknowledgeSOSIncidentAction(incidentId);
      if (res.ok) {
        setFeedback('SOS incident acknowledged by responder.');
        setSelectedIncident(null);
        router.refresh();
      } else {
        setFeedback(`Error: ${res.error}`);
      }
    });
  }

  function handleRequestCameraSession(cameraId: string) {
    startTransition(async () => {
      const res = await requestCameraSessionAction(cameraId);
      if (res.ok) {
        setFeedback('Short-lived common-area camera session issued and logged.');
        router.refresh();
      } else {
        setFeedback(`Access denied: ${res.error}`);
      }
    });
  }

  return (
    <div className="space-y-5">
      {/* Compact Header & Tabs */}
      <div className="rounded-[16px] bg-white border border-[#E8E8EC] p-5 sm:p-6 flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-[22px] sm:text-[26px] font-display font-bold tracking-[-0.03em] text-[#0A0A0A]">
            Safety, SOS & Common-Area CCTV
          </h1>
          <p className="text-[13px] text-[#6B6B6B]">
            Real-time safety notices, common-area camera status, and on-duty security staff.
          </p>
        </div>

        <div className="flex flex-wrap gap-1.5 p-1 rounded-[10px] bg-[#FAFAFA] border border-[#E8E8EC]">
          <button
            type="button"
            onClick={() => setActiveTab('alerts')}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-[8px] text-[13px] font-medium transition cursor-pointer ${
              activeTab === 'alerts'
                ? 'bg-[#EF4444] text-white shadow-2xs'
                : 'text-[#6B6B6B] hover:text-[#0A0A0A]'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Safety Alerts ({incidents.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('cameras')}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-[8px] text-[13px] font-medium transition cursor-pointer ${
              activeTab === 'cameras'
                ? 'bg-[#6366F1] text-white shadow-2xs'
                : 'text-[#6B6B6B] hover:text-[#0A0A0A]'
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            <span>CCTV Grid ({cameras.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('staff')}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-[8px] text-[13px] font-medium transition cursor-pointer ${
              activeTab === 'staff'
                ? 'bg-[#10B981] text-white shadow-2xs'
                : 'text-[#6B6B6B] hover:text-[#0A0A0A]'
            }`}
          >
            <Radio className="w-3.5 h-3.5" />
            <span>Active Staff Zones ({activeLocations.length})</span>
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

      {/* TAB 1: SAFETY ALERTS */}
      {activeTab === 'alerts' && (
        <div className="bg-white border border-[#E8E8EC] rounded-[16px] p-5 space-y-3">
          {incidents.map((inc) => (
            <div
              key={inc.id}
              onClick={() => setSelectedIncident(inc)}
              className="p-4 rounded-[12px] bg-[#FAFAFA] border border-[#E8E8EC] hover:border-[#EF4444] flex flex-wrap items-center justify-between gap-4 transition cursor-pointer"
            >
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-[#EF4444]/10 text-[#EF4444] text-[11px] font-bold uppercase">
                    {inc.category.replace(/_/g, ' ')}
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-white border border-[#E8E8EC] text-[10px] font-bold uppercase">
                    {inc.status.replace(/_/g, ' ')}
                  </span>
                </div>
                <h3 className="font-display font-bold text-[15px] text-[#0A0A0A]">
                  {inc.approx_area_public_label}
                </h3>
                <p className="text-[12px] text-[#6B6B6B] line-clamp-1">
                  {inc.safe_guidance_public_text}
                </p>
              </div>

              <span className="shrink-0 h-[34px] px-3 rounded-[8px] bg-white border border-[#E8E8EC] text-[12px] font-medium inline-flex items-center gap-1.5 text-[#EF4444]">
                <Eye className="w-3.5 h-3.5" />
                <span>View Details</span>
              </span>
            </div>
          ))}
        </div>
      )}

      {/* TAB 2: COMMON-AREA CCTV */}
      {activeTab === 'cameras' && (
        <div className="bg-white border border-[#E8E8EC] rounded-[16px] p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="text-[13px] text-[#6B6B6B]">
              Restricted strictly to public common areas (gates, lobbies, perimeter).
            </div>
            <select
              value={selectedGroup}
              onChange={(e) => {
                setSelectedGroup(e.target.value);
                setCameraPage(1);
              }}
              aria-label="Filter CCTV by Group"
              className="rounded-[8px] border border-[#E8E8EC] px-3 py-1.5 text-[13px] bg-white"
            >
              <option value="all">All Zones ({cameras.length})</option>
              {groups.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {pagedCameras.map((cam) => (
              <div
                key={cam.id}
                onClick={() => setSelectedCamera(cam)}
                className="p-4 rounded-[12px] bg-[#0A0A0A] text-white flex items-center justify-between gap-3 cursor-pointer hover:ring-2 hover:ring-[#6366F1] transition"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#10B981]/20 text-[#10B981] text-[10px] font-mono">
                      ● {cam.online_state.toUpperCase()}
                    </span>
                    <span className="text-[11px] font-mono text-slate-400">{cam.camera_code}</span>
                  </div>
                  <div className="font-display font-bold text-[15px]">{cam.display_name}</div>
                  <div className="text-[12px] text-slate-400">{cam.common_area_label}</div>
                </div>
                <span className="h-[32px] px-3 rounded-[8px] bg-white/10 text-xs font-medium inline-flex items-center gap-1">
                  <Eye className="w-3.5 h-3.5" />
                  <span>Feed</span>
                </span>
              </div>
            ))}
          </div>

          <PaginationBar
            currentPage={cameraPage}
            totalItems={filteredCameras.length}
            pageSize={CAMERAS_PER_PAGE}
            onPageChange={setCameraPage}
            itemLabel="cameras"
          />
        </div>
      )}

      {/* TAB 3: ON-DUTY STAFF ZONES */}
      {activeTab === 'staff' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {activeLocations.map((loc) => (
            <div
              key={loc.session_id}
              className="p-4 rounded-[14px] bg-white border border-[#E8E8EC] flex items-center justify-between gap-3"
            >
              <div>
                <div className="font-display font-bold text-[15px] text-[#0A0A0A]">
                  {loc.staff_name}
                </div>
                <div className="text-[12px] text-[#6B6B6B]">{loc.approximate_zone_label}</div>
                <div className="text-[11px] font-mono text-[#6366F1] mt-1">
                  Precision: {loc.precision_granted}
                </div>
              </div>
              <span
                className={`px-2.5 py-1 rounded-full text-[11px] font-medium ${
                  loc.is_active
                    ? 'bg-[#10B981]/15 text-[#059669]'
                    : 'bg-[#FAFAFA] text-[#6B6B6B]'
                }`}
              >
                {loc.is_active ? 'On Duty' : 'Off Shift'}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* MODAL 1: Incident Detail */}
      <DetailModal
        open={Boolean(selectedIncident)}
        onClose={() => setSelectedIncident(null)}
        title={selectedIncident?.approx_area_public_label ?? ''}
        subtitle={
          selectedIncident
            ? `Category: ${selectedIncident.category.replace(/_/g, ' ').toUpperCase()}`
            : ''
        }
      >
        {selectedIncident && (
          <div className="space-y-4">
            <p className="text-[14px] text-[#0A0A0A] leading-relaxed">
              {selectedIncident.safe_guidance_public_text}
            </p>
            {selectedIncident.restricted_responder_details && (
              <div className="p-3 rounded-[10px] bg-[#EF4444]/10 border border-[#EF4444]/30 text-[12px] text-[#EF4444]">
                <strong>Authorized Responder Detail:</strong>{' '}
                {selectedIncident.restricted_responder_details}
              </div>
            )}
            {selectedIncident.status === 'triggered' && (
              <button
                type="button"
                disabled={isPending}
                onClick={() => handleAcknowledgeSOS(selectedIncident.id)}
                className="h-[38px] px-4 rounded-[8px] bg-[#10B981] text-white text-xs font-medium inline-flex items-center gap-1.5 cursor-pointer"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Acknowledge SOS Dispatch</span>
              </button>
            )}
          </div>
        )}
      </DetailModal>

      {/* MODAL 2: Camera Feed Preview */}
      <DetailModal
        open={Boolean(selectedCamera)}
        onClose={() => setSelectedCamera(null)}
        title={selectedCamera?.display_name ?? ''}
        subtitle={
          selectedCamera
            ? `${selectedCamera.camera_code} • ${selectedCamera.common_area_label}`
            : ''
        }
      >
        {selectedCamera && (
          <div className="space-y-3">
            <div className="rounded-[12px] bg-[#0A0A0A] text-white p-8 text-center space-y-2">
              <Camera className="w-8 h-8 text-[#10B981] mx-auto" />
              <div className="font-mono text-xs text-[#10B981]">
                ● COMMON-AREA FEED ({selectedCamera.camera_code})
              </div>
              <p className="text-xs text-slate-400">{selectedCamera.privacy_designation}</p>
            </div>
            <div className="flex items-center justify-between pt-2">
              <span className="text-xs text-[#6B6B6B] inline-flex items-center gap-1">
                <Lock className="w-3.5 h-3.5 text-[#6366F1]" />
                {selectedCamera.actor_has_live_grant
                  ? 'Live Stream Authorised'
                  : 'Requires Role Grant'}
              </span>
              <button
                type="button"
                disabled={isPending}
                onClick={() => handleRequestCameraSession(selectedCamera.id)}
                className="h-[36px] px-4 rounded-[8px] bg-[#6366F1] text-white text-xs font-medium cursor-pointer"
              >
                Request Live Session Token
              </button>
            </div>
          </div>
        )}
      </DetailModal>
    </div>
  );
}
