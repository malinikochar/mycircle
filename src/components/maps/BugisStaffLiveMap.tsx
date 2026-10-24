'use client';

import React, { useState } from 'react';
import {
  MapPin,
  Navigation,
  Radio,
  ShieldCheck,
  TrainFront,
  Building2,
  Hospital,
  Compass,
  Layers,
  CheckCircle2,
  Eye,
  Clock,
} from 'lucide-react';
import type { ActiveLocationItem, StaffProfileSummary } from '@/lib/types/domain';
import { MemberAvatar } from '@/components/ui/MemberAvatar';

interface BugisLandmark {
  id: string;
  name: string;
  subtitle: string;
  category: 'mrt' | 'hospital' | 'mall' | 'civic' | 'checkpoint';
  lat: number;
  lng: number;
  distanceFromGate: string;
  xPercent: number;
  yPercent: number;
}

const BUGIS_LANDMARKS: BugisLandmark[] = [
  {
    id: 'bugis-mrt',
    name: 'Bugis MRT Station (EW12 / DT14)',
    subtitle: 'East-West & Downtown Line Interchange • Exit C',
    category: 'mrt',
    lat: 1.3006,
    lng: 103.8559,
    distanceFromGate: '65m walk',
    xPercent: 64,
    yPercent: 46,
  },
  {
    id: 'raffles-hospital',
    name: 'Raffles Hospital (24h Emergency)',
    subtitle: '585 North Bridge Rd • Closest Trauma & Medical Center',
    category: 'hospital',
    lat: 1.3014,
    lng: 103.8572,
    distanceFromGate: '210m NE',
    xPercent: 78,
    yPercent: 22,
  },
  {
    id: 'bugis-junction',
    name: 'Bugis Junction & Bugis+',
    subtitle: '200 Victoria St • Retail Arcade & Covered Linkway',
    category: 'mall',
    lat: 1.2995,
    lng: 103.8552,
    distanceFromGate: '110m SW',
    xPercent: 52,
    yPercent: 74,
  },
  {
    id: 'national-library',
    name: 'National Library Building',
    subtitle: '100 Victoria St • Civic Plaza & Reading Commons',
    category: 'civic',
    lat: 1.2976,
    lng: 103.8543,
    distanceFromGate: '290m SW',
    xPercent: 20,
    yPercent: 82,
  },
  {
    id: 'duo-tower',
    name: 'DUO Tower & Fraser St',
    subtitle: 'Ophir-Rochor Corridor • Underground Pedestrian Link',
    category: 'civic',
    lat: 1.2995,
    lng: 103.8584,
    distanceFromGate: '240m SE',
    xPercent: 83,
    yPercent: 66,
  },
];

interface BugisStaffLiveMapProps {
  activeLocations: ActiveLocationItem[];
  staffList?: StaffProfileSummary[];
  checkpoints?: Array<{
    id: string;
    checkpoint_code: string;
    location_name: string;
    last_checked_at: string;
  }>;
  compact?: boolean;
}

export function BugisStaffLiveMap({
  activeLocations,
  staffList = [],
  checkpoints = [],
  compact = false,
}: BugisStaffLiveMapProps) {
  const [mapMode, setMapMode] = useState<'radar' | 'osm'>('radar');
  const [selectedPinId, setSelectedPinId] = useState<string>(
    activeLocations[0]?.staff_user_id ?? 'bugis-mrt'
  );

  // Map staff coordinates around Bugis Residences (Victoria St / Middle Rd)
  const staffPins = activeLocations.map((loc, idx) => {
    const staffProfile = staffList.find((s) => s.user_id === loc.staff_user_id);
    const isMahesh = loc.staff_name.toLowerCase().includes('mahesh') || idx === 0;
    const displayLat = loc.latitude ?? (isMahesh ? 1.3006 : 1.2997);
    const displayLng = loc.longitude ?? (isMahesh ? 103.8559 : 103.8548);
    return {
      ...loc,
      roleTitle: staffProfile?.role_title ?? (isMahesh ? 'head_guard' : 'security_guard'),
      staffCode: staffProfile?.staff_code ?? (isMahesh ? 'SEC-101' : 'SEC-104'),
      avatarUrl: staffProfile?.avatar_url ?? null,
      displayLat,
      displayLng,
      xPercent: isMahesh ? 44 : 26,
      yPercent: isMahesh ? 28 : 52,
    };
  });

  const selectedStaff = staffPins.find((s) => s.staff_user_id === selectedPinId);
  const selectedLandmark = BUGIS_LANDMARKS.find((l) => l.id === selectedPinId);

  return (
    <div className="bg-white border border-black/[0.07] rounded-[24px] p-6 sm:p-7 shadow-[0_8px_30px_rgb(0,0,0,0.04)] space-y-5">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-[#10B981]/12 text-[#059669]">
              <span className="w-2 h-2 rounded-full bg-[#10B981] animate-ping" />
              LIVE PATROL TELEMETRY
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium bg-[#F5F5F7] text-[#1D1D1F]">
              <Compass className="w-3.5 h-3.5 text-[#0071E3]" />
              Singapore • Near Bugis MRT (EW12 / DT14)
            </span>
          </div>
          <h3 className="text-[18px] font-semibold tracking-tight text-[#1D1D1F]">
            Staff & Security Live Location Map
          </h3>
          <p className="text-[13px] text-[#6E6E73]">
            Real-time on-duty security responder positions around Victoria Street, Middle Road & Bugis MRT.
          </p>
        </div>

        {/* Apple Segmented Map Mode Switcher */}
        <div className="inline-flex items-center p-1 rounded-full bg-[#F5F5F7] border border-black/[0.06] self-start">
          <button
            type="button"
            onClick={() => setMapMode('radar')}
            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[12px] font-medium transition cursor-pointer ${
              mapMode === 'radar'
                ? 'bg-white text-[#1D1D1F] shadow-xs'
                : 'text-[#6E6E73] hover:text-[#1D1D1F]'
            }`}
          >
            <Radio className="w-3.5 h-3.5 text-[#0071E3]" />
            <span>Bugis Radar</span>
          </button>
          <button
            type="button"
            onClick={() => setMapMode('osm')}
            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[12px] font-medium transition cursor-pointer ${
              mapMode === 'osm'
                ? 'bg-white text-[#1D1D1F] shadow-xs'
                : 'text-[#6E6E73] hover:text-[#1D1D1F]'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-[#10B981]" />
            <span>Street Map</span>
          </button>
        </div>
      </div>

      {/* Interactive Map Canvas */}
      <div
        className={`relative w-full ${
          compact ? 'h-[310px]' : 'h-[400px]'
        } rounded-[20px] overflow-hidden border border-black/[0.08] bg-[#EEF2F6]`}
      >
        {mapMode === 'osm' ? (
          <div className="relative w-full h-full">
            <iframe
              title="Bugis MRT Singapore Live Street Map"
              src="https://www.openstreetmap.org/export/embed.html?bbox=103.8515%2C1.2965%2C103.8605%2C1.3035&layer=mapnik&marker=1.3006%2C103.8559"
              className="w-full h-full border-0"
              loading="lazy"
            />
            <div className="absolute bottom-3 left-3 right-3 sm:right-auto bg-white/90 backdrop-blur-md border border-black/[0.08] rounded-[14px] px-4 py-2.5 shadow-lg flex items-center gap-3">
              <div className="w-2.5 h-2.5 rounded-full bg-[#10B981] animate-pulse" />
              <div className="text-[12px]">
                <div className="font-semibold text-[#1D1D1F]">
                  Bugis Residences @ 1.3006° N, 103.8559° E
                </div>
                <div className="text-[#6E6E73]">
                  {staffPins.length} Security Officers On-Duty Near Bugis MRT Exit C
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Apple Maps Style Interactive Vector Precinct Map of Bugis, Singapore */
          <div className="relative w-full h-full select-none bg-[#F2F5F8]">
            <svg
              viewBox="0 0 800 450"
              className="w-full h-full object-cover"
              aria-label="Singapore Bugis MRT Interactive Security Map"
            >
              <defs>
                <linearGradient id="bugisPark" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#DCFCE7" />
                  <stop offset="100%" stopColor="#BBF7D0" />
                </linearGradient>
                <linearGradient id="communityCompound" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#E0E7FF" />
                  <stop offset="100%" stopColor="#DBEAFE" />
                </linearGradient>
                <pattern id="appleGrid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path
                    d="M 40 0 L 0 0 0 40"
                    fill="none"
                    stroke="#CBD5E1"
                    strokeWidth="0.5"
                    strokeDasharray="2,2"
                  />
                </pattern>
              </defs>

              {/* Subtle Coordinate Grid */}
              <rect width="800" height="450" fill="url(#appleGrid)" />

              {/* Green Parks / Heritage Gardens */}
              <rect x="30" y="30" width="180" height="110" rx="18" fill="url(#bugisPark)" opacity="0.7" />
              <rect x="610" y="290" width="160" height="130" rx="20" fill="url(#bugisPark)" opacity="0.65" />

              {/* Bugis Residences Perimeter Compound Zone */}
              <rect
                x="220"
                y="125"
                width="260"
                height="185"
                rx="22"
                fill="url(#communityCompound)"
                stroke="#6366F1"
                strokeWidth="2"
                strokeDasharray="6,4"
              />
              <text
                x="240"
                y="150"
                fill="#4338CA"
                fontSize="11"
                fontWeight="700"
                letterSpacing="0.06em"
              >
                BUGIS RESIDENCES COMPOUND
              </text>

              {/* Major Singapore Bugis Roads */}
              {/* Victoria Street (SW to NE arterial) */}
              <path
                d="M 80 420 L 640 30"
                stroke="#FFFFFF"
                strokeWidth="22"
                strokeLinecap="round"
              />
              <path
                d="M 80 420 L 640 30"
                stroke="#CBD5E1"
                strokeWidth="1.5"
                strokeDasharray="8,8"
              />
              <text
                x="455"
                y="138"
                fill="#475569"
                fontSize="11"
                fontWeight="600"
                transform="rotate(-35 455,138)"
              >
                VICTORIA STREET
              </text>

              {/* Middle Road (NW to SE arterial) */}
              <path
                d="M 40 160 L 740 360"
                stroke="#FFFFFF"
                strokeWidth="18"
                strokeLinecap="round"
              />
              <text
                x="145"
                y="185"
                fill="#475569"
                fontSize="11"
                fontWeight="600"
                transform="rotate(16 145,185)"
              >
                MIDDLE ROAD
              </text>

              {/* Rochor Road / Ophir Road */}
              <path
                d="M 260 30 L 770 220"
                stroke="#FEF3C7"
                strokeWidth="16"
                strokeLinecap="round"
              />
              <text
                x="530"
                y="125"
                fill="#92400E"
                fontSize="10"
                fontWeight="600"
                transform="rotate(20 530,125)"
              >
                ROCHOR ROAD
              </text>

              {/* North Bridge Road */}
              <path
                d="M 210 430 L 750 65"
                stroke="#FFFFFF"
                strokeWidth="15"
                strokeLinecap="round"
              />
              <text
                x="600"
                y="185"
                fill="#475569"
                fontSize="10"
                fontWeight="600"
                transform="rotate(-34 600,185)"
              >
                NORTH BRIDGE RD
              </text>

              {/* MRT Underground Lines (East-West Green Line EW12 & Downtown Blue Line DT14) */}
              <path
                d="M 40 270 Q 410 200 770 150"
                fill="none"
                stroke="#10B981"
                strokeWidth="3.5"
                strokeDasharray="6,4"
                opacity="0.75"
              />
              <path
                d="M 330 20 Q 420 205 510 430"
                fill="none"
                stroke="#2563EB"
                strokeWidth="3.5"
                strokeDasharray="6,4"
                opacity="0.75"
              />

              {/* Active Security Patrol Route Line between Guard Posts */}
              <path
                d="M 384 171 L 330 210 L 272 252"
                fill="none"
                stroke="#EF4444"
                strokeWidth="2.5"
                strokeDasharray="4,4"
              />

              {/* Building Blocks inside Compound */}
              <g>
                <rect x="245" y="168" width="65" height="38" rx="8" fill="#FFFFFF" stroke="#94A3B8" strokeWidth="1.2" />
                <text x="277" y="191" textAnchor="middle" fill="#1E293B" fontSize="10" fontWeight="700">
                  Tower A
                </text>
                <rect x="245" y="225" width="65" height="42" rx="8" fill="#FFFFFF" stroke="#94A3B8" strokeWidth="1.2" />
                <text x="277" y="250" textAnchor="middle" fill="#1E293B" fontSize="10" fontWeight="700">
                  Tower B
                </text>
                <rect x="335" y="232" width="65" height="38" rx="8" fill="#FFFFFF" stroke="#94A3B8" strokeWidth="1.2" />
                <text x="367" y="255" textAnchor="middle" fill="#1E293B" fontSize="10" fontWeight="700">
                  Tower C
                </text>
              </g>
            </svg>

            {/* Interactive Nearby Singapore Landmarks */}
            {BUGIS_LANDMARKS.map((lm) => {
              const isSelected = selectedPinId === lm.id;
              const badgeColors =
                lm.category === 'mrt'
                  ? 'bg-[#059669] text-white border-white'
                  : lm.category === 'hospital'
                  ? 'bg-[#EF4444] text-white border-white'
                  : lm.category === 'mall'
                  ? 'bg-[#8B5CF6] text-white border-white'
                  : 'bg-[#1D1D1F] text-white border-white';

              return (
                <button
                  key={lm.id}
                  type="button"
                  onClick={() => setSelectedPinId(lm.id)}
                  style={{ left: `${lm.xPercent}%`, top: `${lm.yPercent}%` }}
                  className={`absolute -translate-x-1/2 -translate-y-1/2 group flex items-center gap-1.5 px-2.5 py-1 rounded-full border shadow-md transition-all cursor-pointer ${badgeColors} ${
                    isSelected ? 'scale-110 ring-4 ring-black/15 z-20' : 'opacity-90 hover:opacity-100 hover:scale-105 z-10'
                  }`}
                >
                  {lm.category === 'mrt' ? (
                    <TrainFront className="w-3.5 h-3.5 shrink-0" />
                  ) : lm.category === 'hospital' ? (
                    <Hospital className="w-3.5 h-3.5 shrink-0" />
                  ) : (
                    <Building2 className="w-3.5 h-3.5 shrink-0" />
                  )}
                  <span className="text-[11px] font-semibold whitespace-nowrap">
                    {lm.name.split(' (')[0]}
                  </span>
                </button>
              );
            })}

            {/* Live On-Duty Staff & Security Officer Pins */}
            {staffPins.map((staff) => {
              const isSelected = selectedPinId === staff.staff_user_id;
              return (
                <button
                  key={staff.session_id}
                  type="button"
                  onClick={() => setSelectedPinId(staff.staff_user_id)}
                  style={{ left: `${staff.xPercent}%`, top: `${staff.yPercent}%` }}
                  className={`absolute -translate-x-1/2 -translate-y-1/2 z-30 flex items-center gap-2 pl-1.5 pr-3 py-1 rounded-full bg-white/95 backdrop-blur-md border-2 transition-all shadow-lg cursor-pointer ${
                    isSelected
                      ? 'border-[#0071E3] ring-4 ring-[#0071E3]/20 scale-110'
                      : 'border-[#10B981] hover:scale-105'
                  }`}
                >
                  <span className="relative flex items-center justify-center">
                    <span className="absolute -inset-1 rounded-full bg-[#10B981]/30 animate-ping" />
                    <MemberAvatar
                      name={staff.staff_name}
                      avatarUrl={staff.avatarUrl}
                      size="xs"
                    />
                  </span>
                  <div className="text-left leading-tight">
                    <div className="text-[11px] font-bold text-[#1D1D1F] whitespace-nowrap">
                      {staff.staff_name}
                    </div>
                    <div className="text-[9px] font-semibold text-[#059669] uppercase tracking-wider">
                      {staff.staffCode} • ON DUTY
                    </div>
                  </div>
                </button>
              );
            })}

            {/* Top-Left Compass & Coordinates Pill */}
            <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-md border border-black/[0.08] rounded-full px-3.5 py-1.5 shadow-sm flex items-center gap-2 text-[11px] font-medium text-[#1D1D1F]">
              <Navigation className="w-3.5 h-3.5 text-[#0071E3]" />
              <span>Bugis Precinct • 1.3006° N, 103.8559° E</span>
            </div>
          </div>
        )}
      </div>

      {/* Selected Pin Inspector & Nearby Bugis Landmarks Strip */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 pt-1">
        {/* Left: Active Inspector Card */}
        <div className="lg:col-span-6 bg-[#F5F5F7] border border-black/[0.06] rounded-[18px] p-5 flex items-start justify-between gap-4">
          {selectedStaff ? (
            <div className="flex items-start gap-3.5">
              <MemberAvatar
                name={selectedStaff.staff_name}
                avatarUrl={selectedStaff.avatarUrl}
                size="md"
                showStatusDot
              />
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[15px] font-semibold text-[#1D1D1F]">
                    {selectedStaff.staff_name}
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#10B981]/15 text-[#059669]">
                    {selectedStaff.staffCode}
                  </span>
                </div>
                <p className="text-[13px] text-[#1D1D1F] font-medium">
                  {selectedStaff.approximate_zone_label}
                </p>
                <div className="flex flex-wrap items-center gap-3 text-[11px] text-[#6E6E73] pt-1">
                  <span className="inline-flex items-center gap-1">
                    <Eye className="w-3.5 h-3.5 text-[#0071E3]" />
                    {selectedStaff.precision_granted === 'precise'
                      ? `GPS: ${selectedStaff.displayLat.toFixed(4)}° N, ${selectedStaff.displayLng.toFixed(4)}° E (±${selectedStaff.accuracy_meters}m)`
                      : 'Zone-Level Radar (Resident Privacy Mode)'}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-[#10B981]" />
                    Active Shift
                  </span>
                </div>
              </div>
            </div>
          ) : selectedLandmark ? (
            <div className="flex items-start gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-[#0071E3]/10 text-[#0071E3] flex items-center justify-center shrink-0">
                <MapPin className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[15px] font-semibold text-[#1D1D1F]">
                    {selectedLandmark.name}
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#0071E3]/10 text-[#0071E3]">
                    {selectedLandmark.distanceFromGate}
                  </span>
                </div>
                <p className="text-[13px] text-[#6E6E73]">{selectedLandmark.subtitle}</p>
                <div className="text-[11px] font-mono text-[#6E6E73] pt-0.5">
                  Coordinates: {selectedLandmark.lat.toFixed(4)}° N, {selectedLandmark.lng.toFixed(4)}° E
                </div>
              </div>
            </div>
          ) : null}
        </div>

        {/* Right: Quick Select On-Duty Staff & Landmarks */}
        <div className="lg:col-span-6 flex flex-col justify-between gap-3 bg-[#F5F5F7] border border-black/[0.06] rounded-[18px] p-5">
          <div className="flex items-center justify-between">
            <span className="text-[12px] font-semibold uppercase tracking-wider text-[#6E6E73]">
              On-Duty Responders & Bugis Landmarks
            </span>
            <span className="text-[11px] text-[#059669] font-medium flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              {staffPins.length} Officers Active
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {staffPins.map((st) => (
              <button
                key={st.staff_user_id}
                type="button"
                onClick={() => setSelectedPinId(st.staff_user_id)}
                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[12px] font-medium transition cursor-pointer ${
                  selectedPinId === st.staff_user_id
                    ? 'bg-[#0071E3] text-white shadow-xs'
                    : 'bg-white text-[#1D1D1F] border border-black/[0.08] hover:border-[#0071E3]'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-[#10B981]" />
                <span>{st.staff_name}</span>
              </button>
            ))}
            {BUGIS_LANDMARKS.slice(0, 3).map((lm) => (
              <button
                key={lm.id}
                type="button"
                onClick={() => setSelectedPinId(lm.id)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-medium transition cursor-pointer ${
                  selectedPinId === lm.id
                    ? 'bg-[#1D1D1F] text-white shadow-xs'
                    : 'bg-white text-[#6E6E73] border border-black/[0.08] hover:text-[#1D1D1F]'
                }`}
              >
                <MapPin className="w-3 h-3" />
                <span>{lm.name.split(' (')[0]}</span>
              </button>
            ))}
          </div>
          {checkpoints.length > 0 && (
            <div className="flex flex-wrap items-center gap-3 pt-1 border-t border-black/[0.06] text-[11px] text-[#6E6E73]">
              {checkpoints.map((cp) => (
                <span key={cp.id} className="inline-flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#10B981]" />
                  <strong className="text-[#1D1D1F]">{cp.checkpoint_code}:</strong> {cp.location_name}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
