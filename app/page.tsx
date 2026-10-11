'use client';

import React, { useState, useEffect } from 'react';
import { Header } from '@/components/Header';
import { KanbanBoard } from '@/components/KanbanBoard';
import { AvailsEngine } from '@/components/AvailsEngine';
import { RateCardsTable } from '@/components/RateCardsTable';
import { InsertionOrdersViewer } from '@/components/InsertionOrdersViewer';
import { ProofOfPerformanceViewer } from '@/components/ProofOfPerformanceViewer';
import { CompaniesDirectory } from '@/components/CompaniesDirectory';
import { PitchDeckStatsDrawer } from '@/components/PitchDeckStatsDrawer';
import { NewDealModal } from '@/components/NewDealModal';
import { DealWithRelations, InventoryAssetWithBookings } from '@/lib/types';
import { Plane, AlertTriangle, ShieldCheck, RefreshCw } from 'lucide-react';

export default function Home() {
  const [activeTab, setActiveTab] = useState('pipeline');
  const [deals, setDeals] = useState<DealWithRelations[]>([]);
  const [assets, setAssets] = useState<any[]>([]);
  const [companies, setCompanies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [isPitchStatsOpen, setIsPitchStatsOpen] = useState(false);
  const [isNewDealOpen, setIsNewDealOpen] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [dealsRes, assetsRes, companiesRes] = await Promise.all([
        fetch('/api/deals'),
        fetch('/api/inventory'),
        fetch('/api/companies'),
      ]);

      const [dealsData, assetsData, companiesData] = await Promise.all([
        dealsRes.json(),
        assetsRes.json(),
        companiesRes.json(),
      ]);

      setDeals(Array.isArray(dealsData) ? dealsData : []);
      setAssets(Array.isArray(assetsData) ? assetsData : []);
      setCompanies(Array.isArray(companiesData) ? companiesData : []);
    } catch (err) {
      console.error('Error loading CRM data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleBookAsset = (assetId: string) => {
    setIsNewDealOpen(true);
  };

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
        {loading ? (
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
                onRefresh={loadData}
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
              <ProofOfPerformanceViewer deals={deals} onRefresh={loadData} />
            )}

            {activeTab === 'companies' && (
              <CompaniesDirectory
                companies={companies}
                onRefresh={loadData}
                onOpenNewDeal={() => setIsNewDealOpen(true)}
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
        onDealCreated={loadData}
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
