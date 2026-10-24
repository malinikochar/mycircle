'use client';

import React from 'react';
import { X } from 'lucide-react';

interface DetailModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  badge?: React.ReactNode;
  maxWidthClass?: string;
  children: React.ReactNode;
}

export function DetailModal({
  open,
  onClose,
  title,
  subtitle,
  badge,
  maxWidthClass = 'max-w-lg',
  children,
}: DetailModalProps) {
  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-end sm:items-center justify-center sm:p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className={`bg-white border border-[#E8E8EC] rounded-t-[20px] sm:rounded-[16px] w-full ${maxWidthClass} p-5 sm:p-6 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 pb-3 border-b border-[#E8E8EC]">
          <div className="space-y-1">
            {badge && <div>{badge}</div>}
            <h2 className="text-[18px] sm:text-[20px] font-display font-bold text-[#0A0A0A]">
              {title}
            </h2>
            {subtitle && <p className="text-[13px] text-[#6B6B6B]">{subtitle}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="p-2 rounded-[8px] bg-[#FAFAFA] border border-[#E8E8EC] text-[#6B6B6B] hover:text-[#0A0A0A] transition cursor-pointer shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-4 text-[14px] text-[#0A0A0A]">{children}</div>
      </div>
    </div>
  );
}
