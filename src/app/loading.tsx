import React from 'react';

export default function GlobalLoading() {
  return (
    <div className="space-y-5 animate-pulse">
      {/* Header Skeleton */}
      <div className="rounded-[16px] bg-white border border-[#E8E8EC] p-6 space-y-3">
        <div className="h-5 w-36 rounded-full bg-[#6366F1]/10" />
        <div className="h-7 w-64 rounded-[8px] bg-[#E8E8EC]" />
        <div className="h-4 w-96 max-w-full rounded-[6px] bg-[#F1F1F4]" />
      </div>

      {/* Cards Grid Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[1, 2, 3, 4].map((idx) => (
          <div
            key={idx}
            className="rounded-[14px] bg-white border border-[#E8E8EC] p-5 space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="h-5 w-24 rounded-full bg-[#F1F1F4]" />
              <div className="h-5 w-16 rounded-full bg-[#F1F1F4]" />
            </div>
            <div className="h-5 w-48 rounded-[6px] bg-[#E8E8EC]" />
            <div className="h-4 w-full rounded-[6px] bg-[#F1F1F4]" />
            <div className="pt-2 flex justify-between items-center">
              <div className="h-4 w-28 rounded-[6px] bg-[#F1F1F4]" />
              <div className="h-8 w-24 rounded-[8px] bg-[#6366F1]/15" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
