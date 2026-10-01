'use client';

import React from 'react';

interface TwoPanelProps {
  leftPanel: React.ReactNode;
  rightPanel: React.ReactNode;
  leftWidthClass?: string; // default w-full lg:w-96
}

export default function TwoPanel({
  leftPanel,
  rightPanel,
  leftWidthClass = 'w-full lg:w-[380px]',
}: TwoPanelProps) {
  return (
    <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-4rem-2rem)] min-h-[600px]">
      {/* Left List Panel */}
      <div
        className={`${leftWidthClass} flex-shrink-0 bg-white border border-slate-200 rounded-xl flex flex-col overflow-hidden shadow-sm`}
      >
        {leftPanel}
      </div>

      {/* Right Detail Panel */}
      <div className="flex-1 min-w-0 bg-white border border-slate-200 rounded-xl flex flex-col overflow-hidden shadow-sm">
        {rightPanel}
      </div>
    </div>
  );
}
