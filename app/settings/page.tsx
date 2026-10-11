'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import useSWR from 'swr';
import { Header } from '@/components/Header';
import { SettingsModule } from '@/components/SettingsModule';
import { PitchDeckStatsDrawer } from '@/components/PitchDeckStatsDrawer';
import { NewDealModal } from '@/components/NewDealModal';
import { RefreshCw } from 'lucide-react';

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
};

export default function SettingsPage() {
  const router = useRouter();
  const [isPitchStatsOpen, setIsPitchStatsOpen] = useState(false);
  const [isNewDealOpen, setIsNewDealOpen] = useState(false);

  const {
    data: assets = [],
    mutate: mutateAssets,
    isLoading,
  } = useSWR<any[]>('/api/inventory', fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 30000,
  });

  const handleTabChange = (tab: string) => {
    if (tab === 'settings') return;
    router.push(`/?tab=${tab}`);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col">
      <Header
        activeTab="settings"
        setActiveTab={handleTabChange}
        onOpenPitchStats={() => setIsPitchStatsOpen(true)}
        onOpenNewDeal={() => setIsNewDealOpen(true)}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {isLoading && assets.length === 0 ? (
          <div className="h-96 flex flex-col items-center justify-center gap-3 text-slate-500">
            <RefreshCw className="h-8 w-8 animate-spin text-[#002B66] dark:text-[#00A3E0]" />
            <p className="text-xs font-semibold">Loading Jazeera CRM Settings & Rate Cards...</p>
          </div>
        ) : (
          <SettingsModule assets={assets} onRefreshAssets={() => mutateAssets()} />
        )}
      </main>

      <PitchDeckStatsDrawer
        isOpen={isPitchStatsOpen}
        onClose={() => setIsPitchStatsOpen(false)}
      />

      <NewDealModal
        isOpen={isNewDealOpen}
        onClose={() => setIsNewDealOpen(false)}
        onDealCreated={() => mutateAssets()}
      />

      <footer className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 py-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-bold text-[#002B66] dark:text-sky-400">Jazeera Airways Media CRM</span>
            <span>•</span>
            <span>Terminal 5 & Fleet Commercial Network</span>
          </div>
          <div>
            Jazeera Airways K.S.C.P. Commercial Media & In-Flight Sales Division
          </div>
        </div>
      </footer>
    </div>
  );
}
