'use client';

import React, { useState } from 'react';
import {
  X,
  TrendingUp,
  CheckCircle,
  Clock,
  ShieldAlert,
  ShieldCheck,
  Edit,
  FileText,
  Trash2,
  XCircle,
  Plus,
  Building2,
  Calendar,
  Layers,
  ChevronRight,
  Filter,
  Flame,
  Scan,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import {
  DealWithRelations,
  PIPELINE_STAGES,
  PipelineStage,
  formatKWD,
  formatDate,
} from '@/lib/types';

export type KpiCardType = 'PIPELINE' | 'CLOSED_WON' | 'PRODUCTION' | 'SAFETY';

interface KpiCardDrilldownModalProps {
  isOpen: boolean;
  onClose: () => void;
  cardType: KpiCardType | null;
  deals: DealWithRelations[];
  onOpenNewDeal: () => void;
  onRefresh: () => void;
  onOpenBrief: (deal: DealWithRelations) => void;
  onEditDeal: (deal: DealWithRelations) => void;
  onDeleteDeal: (deal: DealWithRelations) => void;
  onCancelDeal: (deal: DealWithRelations) => void;
  onStageChange: (deal: DealWithRelations, targetStage: PipelineStage) => void;
  onApproveSafety: (deal: DealWithRelations) => void;
  activeKpiFilter: string;
  onToggleKpiFilter: (cardType: KpiCardType) => void;
}

export function KpiCardDrilldownModal({
  isOpen,
  onClose,
  cardType,
  deals,
  onOpenNewDeal,
  onRefresh,
  onOpenBrief,
  onEditDeal,
  onDeleteDeal,
  onCancelDeal,
  onStageChange,
  onApproveSafety,
  activeKpiFilter,
  onToggleKpiFilter,
}: KpiCardDrilldownModalProps) {
  const [generatingPdfId, setGeneratingPdfId] = useState<string | null>(null);

  if (!isOpen || !cardType) return null;

  // Filter deals based on selected KPI card
  let filteredDeals: DealWithRelations[] = [];
  let headerTitle = '';
  let headerSubtitle = '';
  let badgeColor = '';
  let headerBgGradient = '';
  let primaryMetricLabel = '';
  let primaryMetricValue = '';
  let secondaryMetricLabel = '';
  let secondaryMetricValue = '';

  switch (cardType) {
    case 'PIPELINE': {
      filteredDeals = deals.filter(
        (d) => d.stage !== 'CLOSED_LOST' && d.stage !== 'CLOSED_WON'
      );
      const totalNet = filteredDeals.reduce((sum, d) => sum + (d.totalValueKWD || 0), 0);
      const totalGross = filteredDeals.reduce(
        (sum, d) => sum + (d.grossValueKWD || d.totalValueKWD || 0),
        0
      );
      const totalDisc = filteredDeals.reduce((sum, d) => sum + (d.discountAmountKWD || 0), 0);

      headerTitle = 'Active Sales Pipeline Management';
      headerSubtitle =
        'Live unclosed opportunities across Jazeera T5 and Fleet commercial inventory.';
      badgeColor = 'bg-sky-500/20 text-sky-200 border-sky-400/30';
      headerBgGradient = 'from-[#002B66] via-[#0B2545] to-[#133E87]';
      primaryMetricLabel = 'Net Pipeline Value';
      primaryMetricValue = formatKWD(totalNet);
      secondaryMetricLabel = 'Gross / Discounts';
      secondaryMetricValue = `${formatKWD(totalGross)} (-${formatKWD(totalDisc)})`;
      break;
    }
    case 'CLOSED_WON': {
      filteredDeals = deals.filter((d) => d.stage === 'CLOSED_WON');
      const totalWon = filteredDeals.reduce((sum, d) => sum + (d.totalValueKWD || 0), 0);

      headerTitle = 'Closed Won — Airline Contracted Revenue';
      headerSubtitle =
        'Legally executed and fully recognized revenue for Jazeera Airways Commercial Media.';
      badgeColor = 'bg-emerald-500/20 text-emerald-200 border-emerald-400/30';
      headerBgGradient = 'from-emerald-900 via-teal-900 to-emerald-950';
      primaryMetricLabel = '100% Recognized Revenue';
      primaryMetricValue = formatKWD(totalWon);
      secondaryMetricLabel = 'Executed Contracts';
      secondaryMetricValue = `${filteredDeals.length} Won Deals`;
      break;
    }
    case 'PRODUCTION': {
      filteredDeals = deals.filter(
        (d) => d.stage === 'IN_PRODUCTION' || d.stage === 'IO_SIGNED'
      );
      const totalProd = filteredDeals.reduce((sum, d) => sum + (d.totalValueKWD || 0), 0);

      headerTitle = 'Print & Production Lead Time Queue';
      headerSubtitle =
        'Active print, vinyl, and digital campaign preparation under 4-week airline fabrication lead time.';
      badgeColor = 'bg-purple-500/20 text-purple-200 border-purple-400/30';
      headerBgGradient = 'from-purple-900 via-indigo-950 to-purple-950';
      primaryMetricLabel = 'Value in Fabrication';
      primaryMetricValue = formatKWD(totalProd);
      secondaryMetricLabel = 'Queue Status';
      secondaryMetricValue = `${filteredDeals.length} Campaigns in Prep`;
      break;
    }
    case 'SAFETY': {
      filteredDeals = deals.filter(
        (d) => !d.aviationApproval && d.stage !== 'CLOSED_LOST'
      );
      const totalAtRisk = filteredDeals.reduce((sum, d) => sum + (d.totalValueKWD || 0), 0);

      headerTitle = 'Aviation Safety Compliance Gate (FAR/JAR-25)';
      headerSubtitle =
        'Engineering audit verification required before physical installation or IO signing.';
      badgeColor = 'bg-amber-500/20 text-amber-200 border-amber-400/30';
      headerBgGradient = 'from-amber-700 via-orange-900 to-amber-950';
      primaryMetricLabel = 'Audit Pending Deals';
      primaryMetricValue = `${filteredDeals.length} Deals`;
      secondaryMetricLabel = 'Value Requiring Sign-off';
      secondaryMetricValue = formatKWD(totalAtRisk);
      break;
    }
  }

  const handleDownloadIO = async (deal: DealWithRelations) => {
    try {
      setGeneratingPdfId(deal.id);
      const { generateInsertionOrderPDF } = await import('@/lib/pdfGenerator');
      generateInsertionOrderPDF(deal);
    } catch (err) {
      console.error('Failed to generate IO PDF:', err);
    } finally {
      setGeneratingPdfId(null);
    }
  };

  const isFilteredOnBoard = activeKpiFilter === cardType;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 w-full max-w-5xl max-h-[92vh] rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className={`bg-gradient-to-r ${headerBgGradient} text-white p-5 sm:p-6 shrink-0 relative shadow-inner`}>
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1.5 flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className={`text-[11px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg border ${badgeColor}`}>
                  {cardType.replace('_', ' ')} OVERVIEW
                </span>
                <span className="text-xs text-white/80 font-medium">
                  {filteredDeals.length} {filteredDeals.length === 1 ? 'Record Found' : 'Records Found'}
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                {headerTitle}
              </h2>
              <p className="text-xs text-slate-200/90 leading-relaxed max-w-2xl">
                {headerSubtitle}
              </p>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer shrink-0"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Quick Metrics & Action Strip */}
          <div className="mt-4 pt-4 border-t border-white/15 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-4">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-300 block">
                  {primaryMetricLabel}
                </span>
                <span className="text-xl font-black text-[#FFC72C] tracking-tight">
                  {primaryMetricValue}
                </span>
              </div>
              <div className="h-8 w-px bg-white/20 hidden sm:block" />
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-300 block">
                  {secondaryMetricLabel}
                </span>
                <span className="text-sm font-bold text-white mt-0.5 block">
                  {secondaryMetricValue}
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => onToggleKpiFilter(cardType)}
                className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-sm ${
                  isFilteredOnBoard
                    ? 'bg-[#FFC72C] text-slate-950 hover:bg-[#ffd24d]'
                    : 'bg-white/15 text-white hover:bg-white/25 border border-white/20'
                }`}
              >
                <Filter className="h-3.5 w-3.5" />
                {isFilteredOnBoard ? 'Kanban Filter Active (Click to Clear)' : 'Filter Kanban Board'}
              </button>

              <button
                onClick={() => {
                  onClose();
                  onOpenNewDeal();
                }}
                className="px-3 py-1.5 text-xs font-bold rounded-xl bg-white text-[#002B66] hover:bg-sky-50 shadow-sm flex items-center gap-1.5 cursor-pointer transition-all active:scale-95"
              >
                <Plus className="h-3.5 w-3.5" />
                New Deal
              </button>
            </div>
          </div>
        </div>

        {/* Scrollable Deals List */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-4 flex-1">
          {filteredDeals.length === 0 ? (
            <div className="h-64 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center p-6 text-center gap-3">
              <div className="p-3.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400">
                <Clock className="h-8 w-8" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                  No deals currently in this category
                </h4>
                <p className="text-xs text-slate-500 mt-1 max-w-md">
                  There are no records matching the criteria for {cardType.replace('_', ' ')}. You can create a new deal to populate this pipeline category.
                </p>
              </div>
              <button
                onClick={() => {
                  onClose();
                  onOpenNewDeal();
                }}
                className="mt-2 px-4 py-2 text-xs font-bold rounded-xl bg-[#002B66] text-white hover:bg-blue-900 cursor-pointer shadow-md flex items-center gap-1.5"
              >
                <Plus className="h-3.5 w-3.5" />
                Create New Deal
              </button>
            </div>
          ) : (
            filteredDeals.map((deal) => {
              const currentStage = PIPELINE_STAGES.find((s) => s.id === deal.stage);
              const stageIndex = PIPELINE_STAGES.findIndex((s) => s.id === deal.stage);
              const hasDiscount = (deal.discountAmountKWD || 0) > 0;
              const isPdfLoading = generatingPdfId === deal.id;

              return (
                <div
                  key={deal.id}
                  className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/80 p-5 shadow-sm hover:shadow-md hover:border-sky-300 dark:hover:border-sky-700/80 transition-all flex flex-col gap-4"
                >
                  {/* Deal Header Row */}
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="space-y-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-xs font-bold text-[#002B66] dark:text-sky-400 bg-blue-50 dark:bg-blue-950/80 px-2 py-0.5 rounded-md border border-blue-200 dark:border-blue-900">
                          {deal.dealCode}
                        </span>

                        {currentStage && (
                          <span
                            className="text-[11px] font-bold px-2.5 py-0.5 rounded-md flex items-center gap-1"
                            style={{
                              backgroundColor: `${currentStage.color}15`,
                              color: currentStage.color,
                            }}
                          >
                            <span
                              className="w-2 h-2 rounded-full"
                              style={{ backgroundColor: currentStage.color }}
                            />
                            {currentStage.label} ({Math.round(currentStage.weight * 100)}%)
                          </span>
                        )}

                        {deal.aviationApproval ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800 flex items-center gap-1">
                            <ShieldCheck className="h-3 w-3" />
                            Safety Cleared
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-800 flex items-center gap-1">
                            <ShieldAlert className="h-3 w-3 animate-pulse" />
                            Safety Audit Required
                          </span>
                        )}
                      </div>

                      <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 hover:text-[#002B66] dark:hover:text-sky-400 transition-colors cursor-pointer"
                        onClick={() => {
                          onClose();
                          onOpenBrief(deal);
                        }}
                      >
                        {deal.title}
                      </h3>

                      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                        <span className="flex items-center gap-1 text-slate-700 dark:text-slate-300 font-semibold">
                          <Building2 className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                          {deal.company.name}
                        </span>
                        <span>•</span>
                        <span className="uppercase text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-medium">
                          {deal.company.type === 'AGENCY' ? 'Media Agency' : 'Direct Advertiser'}
                        </span>
                        {deal.targetStartDate && deal.targetEndDate && (
                          <>
                            <span>•</span>
                            <span className="flex items-center gap-1 text-slate-600 dark:text-slate-400">
                              <Calendar className="h-3 w-3 text-slate-400" />
                              {formatDate(deal.targetStartDate)} – {formatDate(deal.targetEndDate)}
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Financial Figures */}
                    <div className="text-left sm:text-right shrink-0 bg-slate-50 dark:bg-slate-900/60 p-3 rounded-xl border border-slate-200/80 dark:border-slate-700/80 sm:bg-transparent sm:border-0 sm:p-0">
                      <div className="text-[10px] uppercase font-bold text-slate-400">
                        Net Contract Value
                      </div>
                      <div className="text-lg font-black text-[#002B66] dark:text-[#FFC72C] tracking-tight">
                        {formatKWD(deal.totalValueKWD)}
                      </div>
                      {hasDiscount ? (
                        <div className="text-[10px] text-red-600 dark:text-red-400 font-semibold">
                          Gross: {formatKWD(deal.grossValueKWD || deal.totalValueKWD)} (-{formatKWD(deal.discountAmountKWD!)} {deal.discountValue}%)
                        </div>
                      ) : (
                        <div className="text-[10px] text-slate-400">Zero Discount</div>
                      )}
                    </div>
                  </div>

                  {/* Booked Assets Strip */}
                  {deal.bookingSlots.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1 mr-1">
                        <Layers className="h-3 w-3" />
                        Assets:
                      </span>
                      {deal.bookingSlots.map((slot, idx) => (
                        <span
                          key={idx}
                          className="text-[10px] font-medium rounded-lg px-2 py-0.5 bg-slate-100 dark:bg-slate-700/70 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700"
                        >
                          {slot.asset.code}: {slot.asset.name} ({formatKWD(slot.agreedRateKWD)})
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Full CRUD Actions Toolbar */}
                  <div className="pt-3 border-t border-slate-100 dark:border-slate-700/80 flex flex-wrap items-center justify-between gap-2.5">
                    <div className="flex flex-wrap items-center gap-2">
                      {/* Direct Brief Viewer */}
                      <button
                        onClick={() => {
                          onClose();
                          onOpenBrief(deal);
                        }}
                        className="px-3 py-1.5 text-xs font-bold rounded-xl bg-[#002B66] hover:bg-blue-900 text-white shadow-sm flex items-center gap-1.5 cursor-pointer transition-all active:scale-95"
                      >
                        <FileText className="h-3.5 w-3.5" />
                        Open Deal Brief
                      </button>

                      {/* Direct Edit Deal */}
                      <button
                        onClick={() => {
                          onClose();
                          onEditDeal(deal);
                        }}
                        className="px-3 py-1.5 text-xs font-bold rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 flex items-center gap-1.5 cursor-pointer transition-all active:scale-95"
                      >
                        <Edit className="h-3.5 w-3.5 text-slate-500" />
                        Edit Deal & Pricing
                      </button>

                      {/* Safety Sign-off Shortcut */}
                      {!deal.aviationApproval && (
                        <button
                          onClick={() => {
                            onClose();
                            onApproveSafety(deal);
                          }}
                          className="px-3 py-1.5 text-xs font-bold rounded-xl bg-amber-500 hover:bg-amber-400 text-amber-950 flex items-center gap-1.5 cursor-pointer transition-all active:scale-95"
                        >
                          <ShieldCheck className="h-3.5 w-3.5" />
                          Sign Off Safety Gate
                        </button>
                      )}

                      {/* Download IO PDF */}
                      <button
                        onClick={() => handleDownloadIO(deal)}
                        disabled={isPdfLoading}
                        className="px-2.5 py-1.5 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 text-slate-700 dark:text-slate-300 flex items-center gap-1 cursor-pointer transition-colors disabled:opacity-50"
                      >
                        <FileText className="h-3.5 w-3.5 text-sky-600" />
                        {isPdfLoading ? 'Generating...' : 'IO PDF'}
                      </button>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {/* Stage Transition Selector */}
                      <div className="flex items-center gap-1 text-xs">
                        <span className="text-[10px] uppercase font-bold text-slate-400">Stage:</span>
                        <select
                          value={deal.stage}
                          onChange={(e) => onStageChange(deal, e.target.value as PipelineStage)}
                          className="text-xs font-bold rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 py-1 px-2 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-sky-500 cursor-pointer"
                        >
                          {PIPELINE_STAGES.map((s) => (
                            <option key={s.id} value={s.id}>
                              {s.label} ({Math.round(s.weight * 100)}%)
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Cancel Deal */}
                      {deal.stage !== 'CLOSED_LOST' && (
                        <button
                          title="Cancel Deal"
                          onClick={() => onCancelDeal(deal)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                        >
                          <XCircle className="h-4 w-4" />
                        </button>
                      )}

                      {/* Delete Deal */}
                      <button
                        title="Delete Deal Permanently"
                        onClick={() => {
                          onClose();
                          onDeleteDeal(deal);
                        }}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-900/90 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0">
          <div className="text-[11px] text-slate-500">
            Jazeera Airways Commercial Media • Live CRM Data Pipeline
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 cursor-pointer transition-colors"
          >
            Close Overview
          </button>
        </div>
      </div>
    </div>
  );
}
