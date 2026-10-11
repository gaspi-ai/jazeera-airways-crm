'use client';

import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import {
  ShieldAlert,
  ShieldCheck,
  FileText,
  Building2,
  Calendar,
  ChevronRight,
  ChevronLeft,
  ArrowRight,
  Sparkles,
  AlertCircle,
  Clock,
  CheckCircle,
} from 'lucide-react';
import { DealWithRelations, PIPELINE_STAGES, PipelineStage, formatKWD } from '@/lib/types';
import { SafetyGateModal } from './SafetyGateModal';
import { generateInsertionOrderPDF } from '@/lib/pdfGenerator';

interface KanbanBoardProps {
  deals: DealWithRelations[];
  onRefresh: () => void;
  onOpenNewDeal: () => void;
}

export function KanbanBoard({ deals, onRefresh, onOpenNewDeal }: KanbanBoardProps) {
  const [selectedDealForSafety, setSelectedDealForSafety] = useState<DealWithRelations | null>(null);
  const [isSafetyModalOpen, setIsSafetyModalOpen] = useState(false);
  const [updatingDealId, setUpdatingDealId] = useState<string | null>(null);

  // Group deals by stage
  const dealsByStage: Record<PipelineStage, DealWithRelations[]> = PIPELINE_STAGES.reduce(
    (acc, stage) => {
      acc[stage.id] = [];
      return acc;
    },
    {} as Record<PipelineStage, DealWithRelations[]>
  );

  deals.forEach((deal) => {
    if (dealsByStage[deal.stage as PipelineStage]) {
      dealsByStage[deal.stage as PipelineStage].push(deal);
    }
  });

  // Calculate live financial KPIs
  let totalPipelineKWD = 0;
  let weightedRevenueKWD = 0;
  let closedWonKWD = 0;
  let inProductionKWD = 0;

  deals.forEach((deal) => {
    const stageConfig = PIPELINE_STAGES.find((s) => s.id === deal.stage);
    const weight = stageConfig ? stageConfig.weight : 0;
    const val = deal.totalValueKWD || 0;

    if (deal.stage !== 'CLOSED_LOST') {
      totalPipelineKWD += val;
      weightedRevenueKWD += val * weight;
    }
    if (deal.stage === 'CLOSED_WON') {
      closedWonKWD += val;
    }
    if (deal.stage === 'IN_PRODUCTION') {
      inProductionKWD += val;
    }
  });

  const pendingSafetyApprovalCount = deals.filter(
    (d) => !d.aviationApproval && !['CLOSED_LOST', 'CLOSED_WON'].includes(d.stage)
  ).length;

  // Handle stage transition
  const handleStageChange = async (deal: DealWithRelations, targetStage: PipelineStage) => {
    // Safety check: block transition to IO_SIGNED or beyond if aviation safety approval is false
    const stagesRequiringApproval: PipelineStage[] = [
      'IO_SIGNED',
      'IN_PRODUCTION',
      'INSTALLED_POP_DELIVERED',
      'CLOSED_WON',
    ];

    if (stagesRequiringApproval.includes(targetStage) && !deal.aviationApproval) {
      setSelectedDealForSafety(deal);
      setIsSafetyModalOpen(true);
      return;
    }

    setUpdatingDealId(deal.id);
    try {
      const res = await fetch(`/api/deals/${deal.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stage: targetStage }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        if (errorData.code === 'SAFETY_APPROVAL_REQUIRED') {
          setSelectedDealForSafety(deal);
          setIsSafetyModalOpen(true);
          return;
        }
        alert(errorData.error || 'Failed to update stage');
        return;
      }

      if (targetStage === 'CLOSED_WON') {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
        });
      }

      onRefresh();
    } catch (err) {
      console.error(err);
    } finally {
      setUpdatingDealId(null);
    }
  };

  const handleApproveSafetyAndAdvance = async (
    dealId: string,
    details: {
      flammabilityCertified: boolean;
      scannerChecked: boolean;
      dgcaPermitNo: string;
      aviationSafetyNotes: string;
    }
  ) => {
    setUpdatingDealId(dealId);
    try {
      const res = await fetch(`/api/deals/${dealId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stage: 'IO_SIGNED',
          aviationApproval: true,
          ...details,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        alert(err.error || 'Error advancing deal');
        return;
      }

      onRefresh();
    } catch (err) {
      console.error(err);
    } finally {
      setUpdatingDealId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Live Financial KPI Widget */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        <div className="rounded-2xl bg-gradient-to-br from-[#002B66] to-[#0B2545] text-white p-4.5 shadow-lg border border-blue-900/40 relative overflow-hidden">
          <div className="text-[11px] font-bold uppercase tracking-wider text-sky-200">
            Total Pipeline Value
          </div>
          <div className="text-2xl font-black mt-1 text-white">
            {formatKWD(totalPipelineKWD)}
          </div>
          <div className="text-[11px] text-sky-300 mt-1 flex items-center gap-1">
            <span>{deals.length} Total Campaigns In Flight</span>
          </div>
          <div className="absolute -bottom-6 -right-6 w-20 h-20 bg-sky-400/10 rounded-full blur-xl pointer-events-none" />
        </div>

        <div className="rounded-2xl bg-gradient-to-br from-blue-700 to-[#00A3E0] text-white p-4.5 shadow-lg border border-sky-400/30 relative overflow-hidden">
          <div className="text-[11px] font-bold uppercase tracking-wider text-sky-100 flex items-center justify-between">
            <span>Weighted Pipeline</span>
            <span className="rounded-full bg-white/20 px-1.5 py-0.2 text-[10px] font-mono">Forecast</span>
          </div>
          <div className="text-2xl font-black mt-1 text-[#FFC72C]">
            {formatKWD(Math.round(weightedRevenueKWD))}
          </div>
          <div className="text-[11px] text-sky-100 mt-1">
            Probability weighted by sales gate
          </div>
        </div>

        <div className="rounded-2xl bg-gradient-to-br from-emerald-800 to-teal-700 text-white p-4.5 shadow-lg border border-emerald-600/30">
          <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-200">
            Closed Won Revenue
          </div>
          <div className="text-2xl font-black mt-1 text-emerald-100">
            {formatKWD(closedWonKWD)}
          </div>
          <div className="text-[11px] text-emerald-200 mt-1 flex items-center gap-1">
            <CheckCircle className="h-3.5 w-3.5 text-emerald-300" />
            <span>100% Recognized Airline Revenue</span>
          </div>
        </div>

        <div className="rounded-2xl bg-gradient-to-br from-purple-800 to-indigo-900 text-white p-4.5 shadow-lg border border-purple-500/30">
          <div className="text-[11px] font-bold uppercase tracking-wider text-purple-200">
            In Print / Production
          </div>
          <div className="text-2xl font-black mt-1 text-purple-100">
            {formatKWD(inProductionKWD)}
          </div>
          <div className="text-[11px] text-purple-200 mt-1 flex items-center gap-1">
            <Clock className="h-3.5 w-3.5 text-purple-300" />
            <span>4-Week Fabrication Window</span>
          </div>
        </div>

        <div className="rounded-2xl bg-gradient-to-br from-amber-600 to-orange-700 text-white p-4.5 shadow-lg border border-amber-500/30">
          <div className="text-[11px] font-bold uppercase tracking-wider text-amber-100 flex items-center justify-between">
            <span>Aviation Safety Gate</span>
            <ShieldAlert className="h-4 w-4 text-amber-200 animate-pulse" />
          </div>
          <div className="text-2xl font-black mt-1 text-amber-50">
            {pendingSafetyApprovalCount} Deals
          </div>
          <div className="text-[11px] text-amber-200 mt-1">
            Requires FAR/JAR-25 verification
          </div>
        </div>
      </div>

      {/* Kanban Column Container */}
      <div className="overflow-x-auto pb-4">
        <div className="flex gap-4 min-w-[1750px]">
          {PIPELINE_STAGES.map((stage, stageIndex) => {
            const stageDeals = dealsByStage[stage.id] || [];
            const stageTotal = stageDeals.reduce((sum, d) => sum + (d.totalValueKWD || 0), 0);
            const isSafetyStage = stage.id === 'AVIATION_SAFETY_APPROVAL';

            return (
              <div
                key={stage.id}
                className={`flex-1 min-w-[280px] max-w-[320px] rounded-2xl flex flex-col transition-all ${
                  isSafetyStage
                    ? 'bg-amber-50/70 dark:bg-amber-950/20 border-2 border-amber-300 dark:border-amber-600/50 shadow-md'
                    : 'bg-slate-100/80 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800'
                }`}
              >
                {/* Stage Header */}
                <div className="p-3.5 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: stage.color }}
                    />
                    <h3 className="font-bold text-xs text-slate-800 dark:text-slate-200 tracking-tight">
                      {stage.label}
                    </h3>
                    <span className="rounded-full bg-slate-200 dark:bg-slate-800 text-[10px] font-semibold px-2 py-0.5 text-slate-700 dark:text-slate-300">
                      {stageDeals.length}
                    </span>
                  </div>
                  <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400 font-mono">
                    {stageTotal > 0 ? `${(stageTotal / 1000).toFixed(0)}k KWD` : '0'}
                  </span>
                </div>

                {/* Subtitle / probability weight */}
                <div className="px-3.5 py-1.5 bg-slate-200/40 dark:bg-slate-800/40 flex items-center justify-between text-[10px] text-slate-500">
                  <span>{stage.description}</span>
                  <span className="font-mono font-bold text-slate-600 dark:text-slate-400">
                    {Math.round(stage.weight * 100)}%
                  </span>
                </div>

                {/* Deals List */}
                <div className="p-3 space-y-3 flex-1 overflow-y-auto max-h-[calc(100vh-280px)]">
                  {stageDeals.length === 0 ? (
                    <div className="h-28 rounded-xl border border-dashed border-slate-300 dark:border-slate-800 flex items-center justify-center text-[11px] text-slate-400">
                      No deals in this stage
                    </div>
                  ) : (
                    stageDeals.map((deal) => {
                      const isUpdating = updatingDealId === deal.id;

                      return (
                        <div
                          key={deal.id}
                          className={`rounded-xl bg-white dark:bg-slate-800/90 border p-3.5 shadow-sm hover:shadow-md transition-all relative group ${
                            deal.aviationApproval
                              ? 'border-slate-200 dark:border-slate-700/80'
                              : 'border-amber-300 dark:border-amber-700/60'
                          } ${isUpdating ? 'opacity-50 pointer-events-none' : ''}`}
                        >
                          {/* Deal Code & Value */}
                          <div className="flex items-start justify-between gap-2">
                            <span className="font-mono text-[10px] font-bold text-[#002B66] dark:text-sky-400 bg-blue-50 dark:bg-blue-950/80 px-1.5 py-0.5 rounded">
                              {deal.dealCode}
                            </span>
                            <span className="font-black text-xs text-slate-900 dark:text-slate-100">
                              {formatKWD(deal.totalValueKWD)}
                            </span>
                          </div>

                          {/* Title */}
                          <h4 className="font-bold text-xs text-slate-900 dark:text-slate-100 mt-2 line-clamp-2 leading-snug">
                            {deal.title}
                          </h4>

                          {/* Company & Contact */}
                          <div className="mt-2 flex items-center gap-1.5 text-[11px] text-slate-600 dark:text-slate-400">
                            <Building2 className="h-3 w-3 text-slate-400 shrink-0" />
                            <span className="truncate font-medium">{deal.company.name}</span>
                            <span className="text-[10px] rounded px-1 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 uppercase">
                              {deal.company.type === 'AGENCY' ? 'Agency' : 'Direct'}
                            </span>
                          </div>

                          {/* Inventory Asset Pills */}
                          <div className="mt-2.5 flex flex-wrap gap-1">
                            {deal.bookingSlots.slice(0, 3).map((slot, idx) => (
                              <span
                                key={idx}
                                className="text-[9.5px] font-medium rounded-md px-1.5 py-0.5 bg-slate-100 dark:bg-slate-700/60 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 truncate max-w-[130px]"
                              >
                                {slot.asset.code}: {slot.asset.name}
                              </span>
                            ))}
                            {deal.bookingSlots.length > 3 && (
                              <span className="text-[9px] rounded px-1 py-0.5 bg-slate-200 dark:bg-slate-700 text-slate-600">
                                +{deal.bookingSlots.length - 3} more
                              </span>
                            )}
                          </div>

                          {/* Aviation Safety Indicator & 4-Week Lead Time */}
                          <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between text-[10px]">
                            {deal.aviationApproval ? (
                              <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
                                <ShieldCheck className="h-3.5 w-3.5" />
                                Safety Cleared
                              </span>
                            ) : (
                              <button
                                onClick={() => {
                                  setSelectedDealForSafety(deal);
                                  setIsSafetyModalOpen(true);
                                }}
                                className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-bold hover:underline"
                              >
                                <ShieldAlert className="h-3.5 w-3.5 animate-pulse" />
                                Safety Audit Req.
                              </button>
                            )}

                            {deal.stage === 'IN_PRODUCTION' && (
                              <span className="flex items-center gap-1 text-purple-600 dark:text-purple-400 font-semibold">
                                <Clock className="h-3 w-3" />
                                4-Wk Lead
                              </span>
                            )}
                          </div>

                          {/* Stage Transition Toolbar */}
                          <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between gap-1.5">
                            <button
                              title="Download Insertion Order (IO) PDF"
                              onClick={() => generateInsertionOrderPDF(deal)}
                              className="p-1 rounded text-slate-500 hover:text-[#002B66] hover:bg-blue-50 dark:hover:bg-slate-700 transition-colors"
                            >
                              <FileText className="h-3.5 w-3.5" />
                            </button>

                            <div className="flex items-center gap-1">
                              {stageIndex > 0 && (
                                <button
                                  title={`Move back to ${PIPELINE_STAGES[stageIndex - 1].label}`}
                                  onClick={() =>
                                    handleStageChange(deal, PIPELINE_STAGES[stageIndex - 1].id)
                                  }
                                  className="p-1 rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700"
                                >
                                  <ChevronLeft className="h-3.5 w-3.5" />
                                </button>
                              )}

                              {stageIndex < PIPELINE_STAGES.length - 1 && (
                                <button
                                  title={`Advance to ${PIPELINE_STAGES[stageIndex + 1].label}`}
                                  onClick={() =>
                                    handleStageChange(deal, PIPELINE_STAGES[stageIndex + 1].id)
                                  }
                                  className={`flex items-center gap-1 px-2 py-1 rounded text-[10px] font-bold transition-all ${
                                    PIPELINE_STAGES[stageIndex + 1].id === 'IO_SIGNED' &&
                                    !deal.aviationApproval
                                      ? 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                                      : 'bg-[#002B66] text-white hover:bg-blue-900'
                                  }`}
                                >
                                  <span>Next</span>
                                  <ChevronRight className="h-3 w-3" />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Safety Gate Modal */}
      <SafetyGateModal
        deal={selectedDealForSafety}
        isOpen={isSafetyModalOpen}
        onClose={() => {
          setIsSafetyModalOpen(false);
          setSelectedDealForSafety(null);
        }}
        onApproveAndAdvance={handleApproveSafetyAndAdvance}
      />
    </div>
  );
}
