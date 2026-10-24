'use client';

import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationBarProps {
  currentPage: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  itemLabel?: string;
}

export function PaginationBar({
  currentPage,
  totalItems,
  pageSize,
  onPageChange,
  itemLabel = 'records',
}: PaginationBarProps) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safePage = Math.min(Math.max(1, currentPage), totalPages);
  const startIdx = totalItems === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const endIdx = Math.min(totalItems, safePage * pageSize);

  if (totalItems <= pageSize && totalPages <= 1) {
    if (totalItems === 0) return null;
    return (
      <div className="flex items-center justify-between pt-2 text-[12px] text-[#6B6B6B]">
        <span>
          Showing <strong className="text-[#0A0A0A]">{totalItems}</strong> {itemLabel}
        </span>
        <span className="text-[11px] font-mono text-[#9C9C9C]">Page 1 of 1</span>
      </div>
    );
  }

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[#E8E8EC]">
      <div className="text-[12px] text-[#6B6B6B]">
        Showing{' '}
        <strong className="text-[#0A0A0A]">
          {startIdx}–{endIdx}
        </strong>{' '}
        of <strong className="text-[#0A0A0A]">{totalItems}</strong> {itemLabel}
      </div>

      <div className="flex items-center gap-1.5">
        <button
          type="button"
          disabled={safePage <= 1}
          onClick={() => onPageChange(safePage - 1)}
          className="inline-flex items-center gap-1 h-[34px] px-3 rounded-[8px] border border-[#E8E8EC] bg-white hover:border-[#6366F1] disabled:opacity-40 disabled:pointer-events-none text-[12px] font-medium text-[#0A0A0A] transition cursor-pointer"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
          <span>Prev</span>
        </button>

        <div className="flex items-center gap-1">
          {pages.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => onPageChange(p)}
              className={`w-[34px] h-[34px] rounded-[8px] text-[12px] font-medium transition cursor-pointer ${
                p === safePage
                  ? 'bg-[#6366F1] text-white shadow-2xs'
                  : 'bg-white border border-[#E8E8EC] text-[#6B6B6B] hover:border-[#6366F1] hover:text-[#0A0A0A]'
              }`}
            >
              {p}
            </button>
          ))}
        </div>

        <button
          type="button"
          disabled={safePage >= totalPages}
          onClick={() => onPageChange(safePage + 1)}
          className="inline-flex items-center gap-1 h-[34px] px-3 rounded-[8px] border border-[#E8E8EC] bg-white hover:border-[#6366F1] disabled:opacity-40 disabled:pointer-events-none text-[12px] font-medium text-[#0A0A0A] transition cursor-pointer"
        >
          <span>Next</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
