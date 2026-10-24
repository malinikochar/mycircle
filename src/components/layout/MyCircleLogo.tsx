import React from 'react';

interface MyCircleLogoProps {
  size?: 'sm' | 'md' | 'lg';
  showBadge?: boolean;
  showSubtitle?: boolean;
}

export function MyCircleLogo({
  size = 'md',
  showBadge = true,
  showSubtitle = false,
}: MyCircleLogoProps) {
  const dimensions = {
    sm: { box: 'w-8 h-8', svg: 20, text: 'text-[16px]' },
    md: { box: 'w-9 h-9', svg: 22, text: 'text-[18px]' },
    lg: { box: 'w-11 h-11', svg: 26, text: 'text-[22px]' },
  }[size];

  return (
    <div className="inline-flex items-center gap-2.5 select-none group">
      {/* Geometric Vector Emblem: Interlocking Community Rings + Verified Trust Node */}
      <div
        className={`${dimensions.box} relative rounded-[10px] bg-[#0A0A0A] group-hover:bg-[#14142B] transition-all duration-200 flex items-center justify-center shadow-xs border border-white/10 overflow-hidden shrink-0`}
      >
        {/* Subtle radial glow */}
        <div
          className="absolute inset-0 opacity-35 pointer-events-none"
          style={{
            background:
              'radial-gradient(circle at 25% 25%, rgba(99, 102, 241, 0.65), transparent 65%), radial-gradient(circle at 80% 80%, rgba(16, 185, 129, 0.45), transparent 60%)',
          }}
        />
        <svg
          width={dimensions.svg}
          height={dimensions.svg}
          viewBox="0 0 32 32"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
          className="relative z-10 transition-transform duration-200 group-hover:scale-105"
        >
          {/* Outer protective community ring */}
          <circle
            cx="16"
            cy="16"
            r="11.5"
            stroke="url(#mycircle_ring_grad)"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeDasharray="56 16"
          />
          {/* Inner interlocking neighbourhood ring */}
          <circle
            cx="16"
            cy="16"
            r="6.25"
            stroke="#FFFFFF"
            strokeWidth="2.1"
            strokeOpacity="0.92"
          />
          {/* Top-right verified trust emerald node */}
          <circle
            cx="24.5"
            cy="7.5"
            r="3.2"
            fill="#10B981"
            stroke="#0A0A0A"
            strokeWidth="1.4"
          />
          {/* Center community hub point */}
          <circle cx="16" cy="16" r="2.2" fill="#6366F1" />
          <defs>
            <linearGradient
              id="mycircle_ring_grad"
              x1="4"
              y1="4"
              x2="28"
              y2="28"
              gradientUnits="userSpaceOnUse"
            >
              <stop offset="0%" stopColor="#818CF8" />
              <stop offset="55%" stopColor="#6366F1" />
              <stop offset="100%" stopColor="#10B981" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* Wordmark + Optional Genesis Badge */}
      <div className="flex flex-col">
        <div className="flex items-center gap-2">
          <span
            className={`font-display font-bold tracking-[-0.035em] leading-none ${dimensions.text} text-[#0A0A0A]`}
          >
            My<span className="text-[#6366F1]">Circle</span>
          </span>
          {showBadge && (
            <span
              title="MyCircle — Verified Community OS (Genesis Design System)"
              className="hidden sm:inline-flex items-center gap-1 text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-[4px] bg-[#20970B]/10 text-[#20970B] border border-[#20970B]/25 font-medium"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#20970B]" />
              <span>Verified OS</span>
            </span>
          )}
        </div>
        {showSubtitle && (
          <span className="text-[11px] text-[#6B6B6B] font-medium tracking-tight mt-0.5">
            Trusted Residential Community Network
          </span>
        )}
      </div>
    </div>
  );
}
