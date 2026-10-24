'use client';

import React, { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  AlertTriangle,
  Radio,
  MapPin,
  Camera,
  ShieldCheck,
  Lock,
  CheckCircle2,
  Eye,
  Clock,
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

interface SafetyCCTVClientProps {
  actorId: string;
  actorName: string;
  incidents: SOSIncidentItem[];
  activeLocations: ActiveLocationItem[];
  cameras: CameraItem[];
  cameraAccessEvents: CameraAccessEventItem[];
}

export function SafetyCCTVClient({
  actorId,
  actorName,
  incidents,
  activeLocations,
  cameras,
  cameraAccessEvents,
}: SafetyCCTVClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [activeCameraSession, setActiveCameraSession] = useState<{
    camera_code: string;
    display_name: string;
    session_token: string;
    expires_at: string;
    watermark_text: string;
  } | null>(null);
  const [feedback, setFeedback] = useState<{ ok: boolean; msg: string } | null>(null);

  function handleAcknowledgeSOS(incidentId: string) {
    startTransition(async () => {
      const res = await acknowledgeSOSIncidentAction(incidentId);
      if (res.ok) {
        setFeedback({
          ok: true,
          msg: `SOS Incident ${incidentId.slice(0, 8)} acknowledged by responder ${actorName} (SOS-05 / Test 15).`,
        });
        router.refresh();
      } else {
        setFeedback({
          ok: false,
          msg: `Server Denied Acknowledgement: ${res.error}`,
        });
      }
    });
  }

  function handleRequestCameraSession(cameraId: string) {
    startTransition(async () => {
      const res = await requestCameraSessionAction(cameraId);
      if (!res.ok) {
        setFeedback({ ok: false, msg: res.error ?? 'Failed to request camera session' });
        return;
      }
      if (res.data?.access_result === 'denied') {
        setActiveCameraSession(null);
        setFeedback({
          ok: false,
          msg: res.data.reason,
        });
        router.refresh();
        return;
      }

      setActiveCameraSession({
        camera_code: res.data.camera_code,
        display_name: res.data.display_name,
        session_token: res.data.session_token,
        expires_at: res.data.expires_at,
        watermark_text: res.data.watermark_text,
      });
      setFeedback({
        ok: true,
        msg: `60-second scoped session minted for ${res.data.camera_code} and recorded in camera_access_events audit log (CCTV-03/04, Test 18).`,
      });
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl bg-white border border-[#E8E8EC] p-5 sm:p-6 space-y-2">
        <span className="text-xs font-bold uppercase tracking-wider text-[#6366F1]">
          Phases 4 & 5 • SOS Alerts, Consented Staff Location & Common-Area CCTV (Tests 14–18)
        </span>
        <h1 className="text-2xl font-bold text-[#0A0A0A]">
          Community Safety, Responder Dispatch, Duty GPS & Scoped CCTV
        </h1>
        <p className="text-sm text-[#6B6B6B] max-w-3xl">
          Enforces sanitised community SOS alerts vs full responder unit/phone disclosure (`SOS-04`), strips raw GPS `latitude`/`longitude` unless the viewer holds a `precise` location grant (`STF-03`), and issues 60-second watermarked CCTV tokens with full access audit logs (`CCTV-04`).
        </p>

        {feedback && (
          <div
            className={`p-3.5 rounded-xl text-xs font-semibold border mt-3 ${
              feedback.ok
                ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                : 'bg-red-50 border-red-300 text-red-950'
            }`}
          >
            {feedback.msg}
          </div>
        )}
      </section>

      {/* 1. SOS Incidents & Honest Channel Delivery Audit (SOS-01..09 / Tests 14 & 15) */}
      <section className="rounded-2xl bg-white border border-[#E8E8EC] p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-[#EF4444]" />
            <h2 className="text-lg font-bold text-[#0A0A0A]">
              SOS Incidents & Honest Delivery Audit ({incidents.length})
            </h2>
          </div>
          <span className="text-xs text-[#6B6B6B]">Viewing as: {actorName}</span>
        </div>

        <div className="space-y-4">
          {incidents.map((inc) => (
            <article
              key={inc.id}
              className="rounded-xl bg-[#FEF2F2]/60 border border-red-300 p-4 space-y-3 text-xs"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-[#EF4444] text-white font-bold uppercase">
                    {inc.category.replace(/_/g, ' ')}
                  </span>
                  <span className="font-bold text-sm text-[#0A0A0A]">
                    {inc.approx_area_public_label}
                  </span>
                </div>
                <span className="px-2.5 py-0.5 rounded-full bg-white border border-red-300 font-bold text-red-900">
                  Status: {inc.status.replace(/_/g, ' ')}
                </span>
              </div>

              <p className="text-slate-900 font-medium">{inc.safe_guidance_public_text}</p>

              {/* Restricted Responder Detail vs Sanitised Resident Projection (SOS-04 / Test 14) */}
              {inc.restricted_responder_details ? (
                <div className="p-3 rounded-lg bg-white border border-red-300 text-red-950 font-semibold space-y-1">
                  <div>{inc.restricted_responder_details}</div>
                  <div className="text-[11px] text-slate-600">
                    Manual Floor: {inc.manual_floor_label} • Lift/Area: {inc.manual_lift_or_area_label}
                  </div>
                </div>
              ) : (
                <div className="p-3 rounded-lg bg-white border border-[#E8E8EC] text-[#6B6B6B] flex items-center gap-2">
                  <Lock className="w-4 h-4 text-amber-700 shrink-0" />
                  <span>
                    Sanitised Community View (Test 14): Exact reporter flat number, floor, and phone number are stripped for non-responder residents. Switch to <strong>Mahesh Yadav (Head Security)</strong> or <strong>Col. Pratap Chauhan (Safety Sub-Admin)</strong> to inspect full responder details.
                  </span>
                </div>
              )}

              {/* Channel Delivery Status Including Prominent SMS Failure State (SOS-06) */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                {inc.deliveries.map((del, idx) => (
                  <div
                    key={idx}
                    className={`p-2.5 rounded-lg border ${
                      del.delivery_status === 'failed'
                        ? 'bg-red-100/90 border-red-400 text-red-950'
                        : 'bg-white border-[#E8E8EC] text-[#0A0A0A]'
                    }`}
                  >
                    <div className="font-bold flex items-center justify-between">
                      <span>{del.channel.replace(/_/g, ' ')}</span>
                      <span className="uppercase text-[10px]">{del.delivery_status}</span>
                    </div>
                    {del.failure_reason && (
                      <p className="text-[11px] mt-1 font-medium">{del.failure_reason}</p>
                    )}
                  </div>
                ))}
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                <span className="text-[#6B6B6B]">
                  Acknowledged by: <strong>{inc.acknowledged_by_name ?? 'Awaiting Responder'}</strong>
                </span>
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => handleAcknowledgeSOS(inc.id)}
                  className="px-3.5 py-1.5 rounded-lg bg-[#0A0A0A] hover:bg-slate-800 text-white font-bold cursor-pointer"
                >
                  Acknowledge Incident as Responder (Test 15)
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* 2. Consented Foreground Staff Location & Precision Stripping (STF-01..07 / Tests 16 & 17) */}
      <section className="rounded-2xl bg-white border border-[#E8E8EC] p-5 space-y-4">
        <div className="flex items-center gap-2">
          <MapPin className="w-5 h-5 text-[#6366F1]" />
          <h2 className="text-lg font-bold text-[#0A0A0A]">
            On-Duty Staff Consented Foreground Location (STF-02..05 / Tests 16 & 17)
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {activeLocations.map((loc) => (
            <article
              key={loc.session_id}
              className="rounded-xl bg-[#FAFAFA] border border-[#E8E8EC] p-4 space-y-2.5 text-xs"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-[#0A0A0A]">{loc.staff_name}</span>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-900 font-bold uppercase">
                  On-Duty & Consented • {loc.is_stale ? 'Stale (>120s)' : 'Live (<120s)'}
                </span>
              </div>
              <p className="text-[#6B6B6B]">{loc.purpose}</p>
              <div className="p-3 rounded-lg bg-white border border-[#E8E8EC] space-y-1">
                <div>
                  <strong>Approximate Zone Label:</strong> {loc.approximate_zone_label}
                </div>
                <div>
                  <strong>Viewer Grant Precision:</strong>{' '}
                  <span className="uppercase font-bold text-[#6366F1]">{loc.precision_granted}</span>
                </div>
                {loc.latitude !== null && loc.longitude !== null ? (
                  <div className="font-mono font-bold text-emerald-800">
                    Precise Coordinates Authorised: {loc.latitude.toFixed(4)}, {loc.longitude.toFixed(4)} (±
                    {loc.accuracy_meters}m)
                  </div>
                ) : (
                  <div className="text-slate-600 flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                    <span>
                      Raw Coordinates Stripped by Server (`latitude: null, longitude: null` — Test 17). Switch to <strong>Col. Pratap Chauhan (Safety Sub-Admin)</strong> to verify precise coordinate grant.
                    </span>
                  </div>
                )}
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* 3. Common-Area CCTV Inventory, Scoped 60s Session Minting & Audit Logs (CCTV-01..07 / Test 18) */}
      <section className="rounded-2xl bg-white border border-[#E8E8EC] p-5 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Camera className="w-5 h-5 text-[#6366F1]" />
            <h2 className="text-lg font-bold text-[#0A0A0A]">
              Common-Area CCTV Inventory & 60-Second Scoped Session Gateway (CCTV-01..07)
            </h2>
          </div>
          <span className="text-xs font-semibold text-[#6366F1]">
            Zero Private Flat Cameras • Server Credentials Isolated in `camera_secrets`
          </span>
        </div>

        {/* Active Watermarked Demo Feed Viewer */}
        {activeCameraSession && (
          <div className="rounded-2xl bg-[#0A0A0A] text-white p-5 space-y-3 border-2 border-[#6366F1]">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                <span className="font-bold text-sm">
                  Scoped Session Active: {activeCameraSession.camera_code} — {activeCameraSession.display_name}
                </span>
              </div>
              <span className="px-2.5 py-0.5 rounded bg-amber-500/20 border border-amber-400 text-amber-300 text-xs font-bold">
                DEMO SAMPLE FEED (No Direct RTSP on Vercel — CCTV-05)
              </span>
            </div>

            <div className="relative h-48 rounded-xl bg-slate-900 border border-slate-700 flex flex-col items-center justify-center p-4 text-center overflow-hidden">
              <div className="text-xs font-mono text-indigo-300/90 uppercase tracking-widest mb-2">
                [WATERMARK] {activeCameraSession.watermark_text}
              </div>
              <p className="text-sm font-semibold text-slate-200 max-w-md">
                Synthetic Common-Area Perimeter Feed • Recording Export Disabled by Default
              </p>
              <p className="text-xs text-slate-400 mt-1 font-mono">
                Scoped Token: {activeCameraSession.session_token} • Expires:{' '}
                {new Date(activeCameraSession.expires_at).toLocaleTimeString('en-IN')}
              </p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {cameras.map((cam) => (
            <article
              key={cam.id}
              className="rounded-xl bg-[#FAFAFA] border border-[#E8E8EC] p-4 flex flex-col justify-between gap-3 text-xs"
            >
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-[#6366F1]">{cam.camera_code}</span>
                  <span
                    className={`px-2 py-0.5 rounded font-bold uppercase ${
                      cam.online_state === 'online_demo'
                        ? 'bg-indigo-100 text-[#6366F1]'
                        : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {cam.online_state.replace('_', ' ')} ({cam.integration_type.replace(/_/g, ' ')})
                  </span>
                </div>
                <h3 className="font-bold text-sm text-[#0A0A0A]">{cam.display_name}</h3>
                <p className="text-[#6B6B6B]">
                  <strong>Area:</strong> {cam.group_name} ({cam.common_area_label})
                </p>
                <p className="text-[11px] text-[#6366F1] font-medium">
                  Privacy Boundary: {cam.privacy_designation}
                </p>
              </div>

              <div className="pt-3 border-t border-[#E8E8EC] flex items-center justify-between gap-2">
                <span
                  className={`font-bold ${
                    cam.actor_has_live_grant ? 'text-emerald-800' : 'text-amber-800'
                  }`}
                >
                  {cam.actor_has_live_grant ? '✓ Active Live Grant Held' : '✗ No Active Grant for Current Persona'}
                </span>
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => handleRequestCameraSession(cam.id)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0A0A0A] hover:bg-slate-800 text-white font-bold cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Request 60s Session</span>
                </button>
              </div>
            </article>
          ))}
        </div>

        {/* Camera Access Audit Log (CCTV-04 / Test 18) */}
        {cameraAccessEvents.length > 0 && (
          <div className="pt-3 border-t border-[#E8E8EC] space-y-2">
            <div className="text-xs font-bold text-[#0A0A0A]">
              Recent Camera Access Audit Log (`camera_access_events` — CCTV-04):
            </div>
            <div className="space-y-1.5">
              {cameraAccessEvents.slice(0, 6).map((ev) => (
                <div
                  key={ev.id}
                  className="p-2.5 rounded-lg bg-[#FAFAFA] border border-[#E8E8EC] text-xs flex flex-wrap items-center justify-between gap-2"
                >
                  <span>
                    <strong>{ev.camera_code}</strong> • Viewer: {ev.viewer_name} • Result:{' '}
                    <strong
                      className={
                        ev.access_result === 'session_issued' ? 'text-emerald-800' : 'text-red-700'
                      }
                    >
                      {ev.access_result.toUpperCase()}
                    </strong>
                  </span>
                  <span className="text-[11px] text-[#6B6B6B]">
                    {ev.denial_reason ?? `Token ${ev.session_token_id.slice(0, 18)}...`}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
