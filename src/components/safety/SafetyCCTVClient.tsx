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
  MapPin,
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
import { BugisStaffLiveMap } from '@/components/maps/BugisStaffLiveMap';
import { MemberAvatar } from '@/components/ui/MemberAvatar';

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
  const [activeTab, setActiveTab] = useState<'map' | 'alerts' | 'cameras'>('map');
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
    <div className="space-y-6">
      {/* Spacious Apple-style Header & Segmented Tabs */}
      <div className="rounded-[24px] bg-white border border-black/[0.06] shadow-[0_8px_30px_rgba(0,0,0,0.03)] p-6 sm:p-8 flex flex-wrap items-center justify-between gap-5">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#10B981]/10 text-[#059669] text-[11px] font-semibold">
            <MapPin className="w-3.5 h-3.5" />
            <span>Singapore • Bugis MRT Precinct (1.3006° N, 103.8559° E)</span>
          </div>
          <h1 className="text-[24px] sm:text-[28px] font-display font-bold tracking-[-0.03em] text-[#1D1D1F]">
            Safety, Bugis Live Map & CCTV
          </h1>
          <p className="text-[13px] text-[#6E6E73]">
            Live on-duty staff & security radar near Bugis MRT, SOS alerts, and common-area cameras.
          </p>
        </div>

        <div className="flex flex-wrap gap-1.5 p-1.5 rounded-full bg-[#F5F5F7] border border-black/[0.05]">
          <button
            type="button"
            onClick={() => setActiveTab('map')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-[13px] font-semibold transition cursor-pointer ${
              activeTab === 'map'
                ? 'bg-[#10B981] text-white shadow-xs'
                : 'text-[#6E6E73] hover:text-[#1D1D1F]'
            }`}
          >
            <Radio className="w-3.5 h-3.5" />
            <span>Live Staff Map ({activeLocations.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('alerts')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-[13px] font-semibold transition cursor-pointer ${
              activeTab === 'alerts'
                ? 'bg-[#EF4444] text-white shadow-xs'
                : 'text-[#6E6E73] hover:text-[#1D1D1F]'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Safety Alerts ({incidents.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('cameras')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-[13px] font-semibold transition cursor-pointer ${
              activeTab === 'cameras'
                ? 'bg-[#0071E3] text-white shadow-xs'
                : 'text-[#6E6E73] hover:text-[#1D1D1F]'
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            <span>CCTV Grid ({cameras.length})</span>
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

      {/* TAB 1: LIVE BUGIS STAFF & SECURITY MAP + ROSTER */}
      {activeTab === 'map' && (
        <div className="space-y-6">
          <BugisStaffLiveMap activeLocations={activeLocations} />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {activeLocations.map((loc) => (
              <div
                key={loc.session_id}
                className="p-6 rounded-[22px] bg-white border border-black/[0.06] shadow-[0_8px_30px_rgba(0,0,0,0.03)] flex items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3.5">
                  <MemberAvatar name={loc.staff_name} size="md" ring />
                  <div className="space-y-1">
                    <div className="font-display font-bold text-[16px] text-[#1D1D1F]">
                      {loc.staff_name}
                    </div>
                    <div className="text-[13px] text-[#6E6E73]">{loc.approximate_zone_label}</div>
                    <div className="text-[11px] font-mono text-[#0071E3]">
                      Precision: {loc.precision_granted} •{' '}
                      {loc.latitude !== null
                        ? `${loc.latitude.toFixed(4)}°N, ${loc.longitude?.toFixed(4)}°E`
                        : 'Zone Protected'}
                    </div>
                  </div>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-[11px] font-semibold shrink-0 ${
                    loc.is_active
                      ? 'bg-[#10B981]/15 text-[#059669]'
                      : 'bg-[#F5F5F7] text-[#6E6E73]'
                  }`}
                >
                  {loc.is_active ? '● On Duty' : 'Off Shift'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: SAFETY ALERTS */}
      {activeTab === 'alerts' && (
        <div className="bg-white border border-black/[0.06] shadow-[0_8px_30px_rgba(0,0,0,0.03)] rounded-[24px] p-6 sm:p-7 space-y-4">
          {incidents.map((inc) => (
            <div
              key={inc.id}
              onClick={() => setSelectedIncident(inc)}
              className="p-6 rounded-[20px] bg-[#F5F5F7]/70 hover:bg-white border border-black/[0.06] hover:border-[#EF4444]/40 flex flex-wrap items-center justify-between gap-4 transition cursor-pointer"
            >
              <div className="space-y-2 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-full bg-[#EF4444]/10 text-[#EF4444] text-[11px] font-bold uppercase">
                    {inc.category.replace(/_/g, ' ')}
                  </span>
                  <span className="px-2.5 py-1 rounded-full bg-white border border-black/[0.06] text-[10px] font-bold uppercase text-[#1D1D1F]">
                    {inc.status.replace(/_/g, ' ')}
                  </span>
                </div>
                <h3 className="font-display font-bold text-[16px] text-[#1D1D1F]">
                  {inc.approx_area_public_label}
                </h3>
                <p className="text-[13px] text-[#6E6E73] line-clamp-1">
                  {inc.safe_guidance_public_text}
                </p>
              </div>

              <span className="shrink-0 h-[38px] px-4 rounded-full bg-white border border-black/[0.08] text-[12px] font-semibold inline-flex items-center gap-1.5 text-[#EF4444]">
                <Eye className="w-3.5 h-3.5" />
                <span>View Details</span>
              </span>
            </div>
          ))}
        </div>
      )}

      {/* TAB 3: COMMON-AREA CCTV */}
      {activeTab === 'cameras' && (
        <div className="bg-white border border-black/[0.06] shadow-[0_8px_30px_rgba(0,0,0,0.03)] rounded-[24px] p-6 sm:p-7 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="text-[13px] text-[#6E6E73]">
              Restricted strictly to public common areas (gates, lobbies, Bugis perimeter).
            </div>
            <select
              value={selectedGroup}
              onChange={(e) => {
                setSelectedGroup(e.target.value);
                setCameraPage(1);
              }}
              aria-label="Filter CCTV by Group"
              className="rounded-full border border-black/[0.1] px-4 py-2 text-[13px] bg-white"
            >
              <option value="all">All Zones ({cameras.length})</option>
              {groups.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {pagedCameras.map((cam) => (
              <div
                key={cam.id}
                onClick={() => setSelectedCamera(cam)}
                className="p-6 rounded-[20px] bg-[#1D1D1F] text-white flex items-center justify-between gap-4 cursor-pointer hover:ring-2 hover:ring-[#0071E3] transition"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#10B981]/20 text-[#10B981] text-[10px] font-mono">
                      ● {cam.online_state.toUpperCase()}
                    </span>
                    <span className="text-[11px] font-mono text-slate-400">{cam.camera_code}</span>
                  </div>
                  <div className="font-display font-bold text-[16px]">{cam.display_name}</div>
                  <div className="text-[12px] text-slate-400">{cam.common_area_label}</div>
                </div>
                <span className="h-[36px] px-4 rounded-full bg-white/10 text-xs font-semibold inline-flex items-center gap-1.5">
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
            <p className="text-[14px] text-[#1D1D1F] leading-relaxed">
              {selectedIncident.safe_guidance_public_text}
            </p>
            {selectedIncident.restricted_responder_details && (
              <div className="p-4 rounded-[14px] bg-[#EF4444]/10 border border-[#EF4444]/30 text-[12px] text-[#EF4444]">
                <strong>Authorized Responder Detail:</strong>{' '}
                {selectedIncident.restricted_responder_details}
              </div>
            )}
            {selectedIncident.status === 'triggered' && (
              <button
                type="button"
                disabled={isPending}
                onClick={() => handleAcknowledgeSOS(selectedIncident.id)}
                className="h-[40px] px-5 rounded-full bg-[#10B981] text-white text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
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
          <div className="space-y-4">
            <div className="rounded-[18px] bg-[#1D1D1F] text-white p-8 text-center space-y-2">
              <Camera className="w-8 h-8 text-[#10B981] mx-auto" />
              <div className="font-mono text-xs text-[#10B981]">
                ● COMMON-AREA FEED ({selectedCamera.camera_code})
              </div>
              <p className="text-xs text-slate-400">{selectedCamera.privacy_designation}</p>
            </div>
            <div className="flex items-center justify-between pt-2">
              <span className="text-xs text-[#6E6E73] inline-flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-[#0071E3]" />
                {selectedCamera.actor_has_live_grant
                  ? 'Live Stream Authorised'
                  : 'Requires Role Grant'}
              </span>
              <button
                type="button"
                disabled={isPending}
                onClick={() => handleRequestCameraSession(selectedCamera.id)}
                className="h-[38px] px-5 rounded-full bg-[#0071E3] text-white text-xs font-semibold cursor-pointer"
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
