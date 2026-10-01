'use client';

import React from 'react';

interface HeaderProps {
  title: string;
  subtitle?: string;
  actionButton?: React.ReactNode;
}

export default function Header({ title, subtitle, actionButton }: HeaderProps) {
  return (
    <header className="no-print h-16 border-b border-slate-200 bg-white px-8 flex items-center justify-between sticky top-0 z-20">
      <div>
        <h1 className="text-lg font-bold text-slate-900 tracking-tight">{title}</h1>
        {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-4">
        {actionButton && <div>{actionButton}</div>}
        <div className="h-5 w-[1px] bg-slate-200" />
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Branch Online
          </span>
        </div>
      </div>
    </header>
  );
}
