'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import useSWR from 'swr';
import { Header } from '@/components/Header';
import { DealWithRelations } from '@/lib/types';
import { RefreshCw } from 'lucide-react';

function TabLoadingSkeleton({ label }: { label: string }) {
  return (
    <div className="h-64 flex flex-col items-center justify-center gap-3 text-slate-400">
      <RefreshCw className="h-6 w-6 animate-spin text-[#002B66] dark:text-[#00A3E0]" />
      <span className="text-xs font-semibold">Loading {label}...</span>
    </div>
  );
}

// Dynamic code-splitting for heavy tab views to reduce initial bundle
const KanbanBoard = dynamic(
  () => import('@/components/KanbanBoard').then((mod) => mod.KanbanBoard),
  {
    loading: () => <TabLoadingSkeleton label="Sales Pipeline" />,
  }
);

const AvailsEngine = dynamic(
  () => import('@/components/AvailsEngine').then((mod) => mod.AvailsEngine),
  {
    loading: () => <TabLoadingSkeleton label="T5 & Fleet Avails Engine" />,
  }
);

const RateCardsTable = dynamic(
  () => import('@/components/RateCardsTable').then((mod) => mod.RateCardsTable),
  {
    loading: () => <TabLoadingSkeleton label="Rate Cards & Catalog" />,
  }
);

const InsertionOrdersViewer = dynamic(
  () =>
    import('@/components/InsertionOrdersViewer').then(
      (mod) => mod.InsertionOrdersViewer
    ),
  {
    loading: () => <TabLoadingSkeleton label="Insertion Orders (IO)" />,
  }
);

const ProofOfPerformanceViewer = dynamic(
  () =>
    import('@/components/ProofOfPerformanceViewer').then(
      (mod) => mod.ProofOfPerformanceViewer
    ),
  {
    loading: () => <TabLoadingSkeleton label="Proof of Performance" />,
  }
);

const CompaniesDirectory = dynamic(
  () =>
    import('@/components/CompaniesDirectory').then(
      (mod) => mod.CompaniesDirectory
    ),
  {
    loading: () => <TabLoadingSkeleton label="Advertisers & Agencies" />,
  }
);

const SettingsModule = dynamic(
  () => import('@/components/SettingsModule').then((mod) => mod.SettingsModule),
  {
    loading: () => <TabLoadingSkeleton label="Settings & Pricing Overrides" />,
  }
);

const PitchDeckStatsDrawer = dynamic(
  () =>
    import('@/components/PitchDeckStatsDrawer').then(
      (mod) => mod.PitchDeckStatsDrawer
    ),
  { ssr: false }
);

const NewDealModal = dynamic(
  () => import('@/components/NewDealModal').then((mod) => mod.NewDealModal),
  { ssr: false }
);

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
};

export default function Home() {
  const [activeTab, setActiveTab] = useState('pipeline');
  const [isPitchStatsOpen, setIsPitchStatsOpen] = useState(false);
  const [isNewDealOpen, setIsNewDealOpen] = useState(false);

  // SWR Caching & Stale-While-Revalidate data layer
  const {
    data: deals = [],
    mutate: mutateDeals,
    isLoading: dealsLoading,
  } = useSWR<DealWithRelations[]>('/api/deals', fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 10000,
  });

  const {
    data: assets = [],
    mutate: mutateAssets,
    isLoading: assetsLoading,
  } = useSWR<any[]>('/api/inventory', fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 30000,
  });

  const {
    data: companies = [],
    mutate: mutateCompanies,
    isLoading: companiesLoading,
  } = useSWR<any[]>('/api/companies', fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 20000,
  });

  const refreshAll = () => {
    mutateDeals();
    mutateAssets();
    mutateCompanies();
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tab = params.get('tab');
      if (tab) {
        setActiveTab(tab);
      }
    }
  }, []);

  const handleBookAsset = (assetId: string) => {
    setIsNewDealOpen(true);
  };

  const initialLoading = dealsLoading && deals.length === 0;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col">
      {/* Top Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenPitchStats={() => setIsPitchStatsOpen(true)}
        onOpenNewDeal={() => setIsNewDealOpen(true)}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {initialLoading ? (
          <div className="h-96 flex flex-col items-center justify-center gap-3 text-slate-500">
            <RefreshCw className="h-8 w-8 animate-spin text-[#002B66] dark:text-[#00A3E0]" />
            <p className="text-xs font-semibold">
              Loading Jazeera Airways T5 & Fleet Media System...
            </p>
          </div>
        ) : (
          <>
            {activeTab === 'pipeline' && (
              <KanbanBoard
                deals={deals}
                onRefresh={mutateDeals}
                onOpenNewDeal={() => setIsNewDealOpen(true)}
              />
            )}

            {activeTab === 'avails' && (
              <AvailsEngine assets={assets} onBookAsset={handleBookAsset} />
            )}

            {activeTab === 'ratecard' && (
              <RateCardsTable assets={assets} onBookAsset={handleBookAsset} />
            )}

            {activeTab === 'insertion_orders' && (
              <InsertionOrdersViewer deals={deals} />
            )}

            {activeTab === 'pop' && (
              <ProofOfPerformanceViewer deals={deals} onRefresh={mutateDeals} />
            )}

            {activeTab === 'companies' && (
              <CompaniesDirectory
                companies={companies}
                onRefresh={mutateCompanies}
                onOpenNewDeal={() => setIsNewDealOpen(true)}
              />
            )}

            {activeTab === 'settings' && (
              <SettingsModule
                assets={assets}
                onRefreshAssets={mutateAssets}
              />
            )}
          </>
        )}
      </main>

      {/* Pitch Deck Stats Helper Drawer */}
      <PitchDeckStatsDrawer
        isOpen={isPitchStatsOpen}
        onClose={() => setIsPitchStatsOpen(false)}
      />

      {/* New Deal Creation Modal */}
      <NewDealModal
        isOpen={isNewDealOpen}
        onClose={() => setIsNewDealOpen(false)}
        onDealCreated={refreshAll}
      />

      {/* Footer */}
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
