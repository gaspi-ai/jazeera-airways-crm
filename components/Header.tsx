'use client';

import React from 'react';
import {
  Plane,
  LayoutGrid,
  BarChart3,
  FileText,
  Camera,
  Building2,
  Plus,
  Sparkles,
  ShieldCheck,
  Globe,
  Radio,
  Settings,
} from 'lucide-react';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenPitchStats: () => void;
  onOpenNewDeal: () => void;
}

export function Header({
  activeTab,
  setActiveTab,
  onOpenPitchStats,
  onOpenNewDeal,
}: HeaderProps) {
  const tabs = [
    { id: 'pipeline', label: 'Sales Pipeline', icon: LayoutGrid },
    { id: 'avails', label: 'T5 & In-Flight Avails', icon: BarChart3 },
    { id: 'ratecard', label: 'Rate Cards & Catalog', icon: FileText },
    { id: 'insertion_orders', label: 'Insertion Orders (IO)', icon: FileText },
    { id: 'pop', label: 'Proof of Performance', icon: Camera },
    { id: 'companies', label: 'Advertisers & Agencies', icon: Building2 },
    { id: 'settings', label: 'Settings & Admin', icon: Settings },
  ];

  return (
    <header className="sticky top-0 z-40 bg-[#002B66] text-white shadow-xl border-b-2 border-[#FFC72C]">
      {/* Top Bar with Live Operations Pill */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Brand identity */}
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#00A3E0] to-[#FFC72C] flex items-center justify-center shadow-md p-0.5">
            <div className="w-full h-full bg-[#002B66] rounded-[10px] flex items-center justify-center">
              <Plane className="h-5 w-5 text-[#FFC72C] -rotate-45" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-black text-lg tracking-wider text-white">JAZEERA</span>
              <span className="font-light text-lg tracking-wider text-[#00A3E0]">AIRWAYS</span>
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#FFC72C] bg-white/10 px-2 py-0.5 rounded border border-white/20">
                T5 & In-Flight Media
              </span>
            </div>
            <p className="text-[10px] text-sky-200">
              Commercial & In-Flight Media Sales Network • Kuwait International Airport
            </p>
          </div>
        </div>

        {/* Live Terminal & Fleet Ticker + Action Buttons */}
        <div className="flex items-center gap-3 flex-wrap justify-end">
          {/* Live Ops Badge */}
          <div className="hidden lg:flex items-center gap-2 bg-black/25 px-3 py-1.5 rounded-full border border-sky-400/20 text-[11px] text-sky-200">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span>T5 Terminal Live</span>
            <span className="text-slate-400">•</span>
            <span>24 A320 Fleet</span>
            <span className="text-slate-400">•</span>
            <span className="text-[#FFC72C] font-mono">4.9M Pax</span>
          </div>

          {/* Pitch Deck Stats Helper Button */}
          <button
            onClick={onOpenPitchStats}
            className="flex items-center gap-1.5 rounded-xl bg-sky-500/20 hover:bg-sky-500/30 text-sky-100 px-3.5 py-2 text-xs font-semibold border border-sky-400/30 transition-all cursor-pointer hover:border-sky-300"
          >
            <Sparkles className="h-3.5 w-3.5 text-[#FFC72C]" />
            Pitch Stats
          </button>

          {/* New Deal Button */}
          <button
            onClick={onOpenNewDeal}
            className="flex items-center gap-1.5 rounded-xl bg-[#FFC72C] hover:bg-[#ffcf40] text-[#002B66] px-4 py-2 text-xs font-black shadow-lg transition-all cursor-pointer hover:shadow-yellow-500/20 active:scale-95"
          >
            <Plus className="h-4 w-4 stroke-[3]" />
            New Deal
          </button>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-t border-blue-900/60 overflow-x-auto">
        <nav className="flex space-x-1 py-1.5 min-w-max">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-white text-[#002B66] shadow-sm'
                    : 'text-sky-200 hover:text-white hover:bg-blue-900/60'
                }`}
              >
                <Icon className={`h-3.5 w-3.5 ${isActive ? 'text-[#002B66]' : 'text-sky-300'}`} />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
