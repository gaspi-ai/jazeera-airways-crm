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
  Search,
  Filter,
  Edit,
  Trash2,
  XCircle,
  Percent,
  Banknote,
} from 'lucide-react';
import { DealWithRelations, PIPELINE_STAGES, PipelineStage, formatKWD } from '@/lib/types';
import { SafetyGateModal } from './SafetyGateModal';
import { EditDealModal } from './EditDealModal';
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

  // Edit deal state
  const [selectedDealForEdit, setSelectedDealForEdit] = useState<DealWithRelations | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [companyTypeFilter, setCompanyTypeFilter] = useState('ALL');
  const [safetyFilter, setSafetyFilter] = useState('ALL');

  // Deletion confirm modal
  const [dealToDelete, setDealToDelete] = useState<DealWithRelations | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Filter deals
  const filteredDeals = deals.filter((deal) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      !q ||
      deal.title.toLowerCase().includes(q) ||
      deal.dealCode.toLowerCase().includes(q) ||
      deal.company.name.toLowerCase().includes(q);

    const matchesCompany =
      companyTypeFilter === 'ALL' || deal.company.type === companyTypeFilter;

    const matchesSafety =
      safetyFilter === 'ALL' ||
      (safetyFilter === 'CLEARED' && deal.aviationApproval) ||
      (safetyFilter === 'PENDING' && !deal.aviationApproval);

    return matchesSearch && matchesCompany && matchesSafety;
  });

  // Group deals by stage
  const dealsByStage: Record<PipelineStage, DealWithRelations[]> = PIPELINE_STAGES.reduce(
    (acc, stage) => {
      acc[stage.id] = [];
      return acc;
    },
    {} as Record<PipelineStage, DealWithRelations[]>
  );

  filteredDeals.forEach((deal) => {
    if (dealsByStage[deal.stage as PipelineStage]) {
      dealsByStage[deal.stage as PipelineStage].push(deal);
    }
  });

  // Calculate live financial KPIs
  let totalGrossKWD = 0;
  let totalDiscountsKWD = 0;
  let totalPipelineKWD = 0;
  let weightedRevenueKWD = 0;
  let closedWonKWD = 0;
  let inProductionKWD = 0;

  deals.forEach((deal) => {
    const stageConfig = PIPELINE_STAGES.find((s) => s.id === deal.stage);
    const weight = stageConfig ? stageConfig.weight : 0;
    const netVal = deal.totalValueKWD || 0;
    const grossVal = deal.grossValueKWD || netVal;
    const discVal = deal.discountAmountKWD || 0;

    if (deal.stage !== 'CLOSED_LOST') {
      totalGrossKWD += grossVal;
      totalDiscountsKWD += discVal;
      totalPipelineKWD += netVal;
      weightedRevenueKWD += netVal * weight;
    }
    if (deal.stage === 'CLOSED_WON') {
      closedWonKWD += netVal;
    }
    if (deal.stage === 'IN_PRODUCTION') {
      inProductionKWD += netVal;
    }
  });

  const pendingSafetyApprovalCount = deals.filter(
    (d) => !d.aviationApproval && !['CLOSED_LOST', 'CLOSED_WON'].includes(d.stage)
  ).length;

  // Handle stage transition
  const handleStageChange = async (deal: DealWithRelations, targetStage: PipelineStage) => {
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

  const handleCancelDeal = async (deal: DealWithRelations) => {
    const reason = prompt(
      `Please provide cancellation reason for "${deal.title}" (${deal.dealCode}):`,
      'Budget reallocated / client cancelled'
    );
    if (reason === null) return; // user cancelled prompt

    setUpdatingDealId(deal.id);
    try {
      const res = await fetch(`/api/deals/${deal.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stage: 'CLOSED_LOST', cancellationReason: reason }),
      });
      if (res.ok) {
        onRefresh();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to cancel deal');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setUpdatingDealId(null);
    }
  };

  const handleDeleteDeal = async () => {
    if (!dealToDelete) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/deals/${dealToDelete.id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setDealToDelete(null);
        onRefresh();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to delete deal');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsDeleting(false);
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
    try {
      const res = await fetch(`/api/deals/${dealId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          aviationApproval: true,
          flammabilityCertified: details.flammabilityCertified,
          scannerChecked: details.scannerChecked,
          dgcaPermitNo: details.dgcaPermitNo,
          aviationSafetyNotes: details.aviationSafetyNotes,
          stage: 'IO_SIGNED',
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        alert(errorData.error || 'Failed to sign off safety approval');
        return;
      }

      setIsSafetyModalOpen(false);
      onRefresh();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Financial KPIs Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl bg-gradient-to-br from-[#002B66] via-[#0B2545] to-[#133E87] text-white p-4.5 shadow-lg border border-sky-500/20">
          <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-sky-200">
            <span>Net Pipeline Revenue</span>
            {totalDiscountsKWD > 0 && (
              <span className="text-[10px] text-[#FFC72C] bg-white/10 px-1.5 py-0.5 rounded">
                -{formatKWD(totalDiscountsKWD)} Disc.
              </span>
            )}
          </div>
          <div className="text-2xl font-black mt-1 text-[#FFC72C] tracking-tight">
            {formatKWD(totalPipelineKWD)}
          </div>
          <div className="text-[11px] text-sky-200 mt-1 flex items-center justify-between">
            <span>Weighted: {formatKWD(Math.round(weightedRevenueKWD))}</span>
            <span className="text-[10px] text-slate-300">Gross: {formatKWD(totalGrossKWD)}</span>
          </div>
        </div>

        <div className="rounded-2xl bg-gradient-to-br from-emerald-800 to-teal-900 text-white p-4.5 shadow-lg border border-emerald-500/30">
          <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-200">
            Closed Won (Airline Revenue)
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

      {/* Global Search & Filter Controls */}
      <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative flex-1 w-full sm:max-w-md">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search deals by title, code (e.g. JZ-2026-001), or advertiser..."
            className="w-full text-xs pl-9 pr-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto overflow-x-auto">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-semibold shrink-0">
            <Filter className="h-3.5 w-3.5 text-slate-400" />
            <span>Filter:</span>
          </div>

          <select
            value={companyTypeFilter}
            onChange={(e) => setCompanyTypeFilter(e.target.value)}
            className="text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-2 text-slate-700 dark:text-slate-300 font-medium"
          >
            <option value="ALL">All Account Types</option>
            <option value="DIRECT_CLIENT">Direct Clients</option>
            <option value="AGENCY">Media Agencies</option>
          </select>

          <select
            value={safetyFilter}
            onChange={(e) => setSafetyFilter(e.target.value)}
            className="text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-2 text-slate-700 dark:text-slate-300 font-medium"
          >
            <option value="ALL">All Safety Statuses</option>
            <option value="CLEARED">Safety Cleared Only</option>
            <option value="PENDING">Safety Audit Required</option>
          </select>

          {(searchQuery || companyTypeFilter !== 'ALL' || safetyFilter !== 'ALL') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setCompanyTypeFilter('ALL');
                setSafetyFilter('ALL');
              }}
              className="px-2.5 py-1.5 text-xs rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold cursor-pointer shrink-0"
            >
              Reset
            </button>
          )}
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
                      const hasDiscount = (deal.discountAmountKWD || 0) > 0;

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
                            <div className="text-right">
                              <span className="font-black text-xs text-slate-900 dark:text-slate-100 block">
                                {formatKWD(deal.totalValueKWD)}
                              </span>
                              {hasDiscount && (
                                <span className="text-[9.5px] text-red-500 font-semibold block">
                                  -{formatKWD(deal.discountAmountKWD!)} ({deal.discountValue}%)
                                </span>
                              )}
                            </div>
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

                          {/* Cancellation Note if LOST */}
                          {deal.stage === 'CLOSED_LOST' && deal.cancellationReason && (
                            <div className="mt-2 p-1.5 rounded bg-red-50 dark:bg-red-950/40 text-[10px] text-red-700 dark:text-red-300 font-medium">
                              Reason: {deal.cancellationReason}
                            </div>
                          )}

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
                                className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-bold hover:underline cursor-pointer"
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

                          {/* Action Toolbar */}
                          <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between gap-1">
                            <div className="flex items-center gap-1">
                              {/* Edit Deal Button */}
                              <button
                                title="Edit Deal & Pricing"
                                onClick={() => {
                                  setSelectedDealForEdit(deal);
                                  setIsEditModalOpen(true);
                                }}
                                className="p-1 rounded text-slate-500 hover:text-[#002B66] hover:bg-sky-50 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                              >
                                <Edit className="h-3.5 w-3.5" />
                              </button>

                              {/* PDF Button */}
                              <button
                                title="Download Insertion Order (IO) PDF"
                                onClick={() => generateInsertionOrderPDF(deal)}
                                className="p-1 rounded text-slate-500 hover:text-[#002B66] hover:bg-blue-50 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                              >
                                <FileText className="h-3.5 w-3.5" />
                              </button>

                              {/* Cancel Deal Button */}
                              {deal.stage !== 'CLOSED_LOST' && (
                                <button
                                  title="Cancel Deal"
                                  onClick={() => handleCancelDeal(deal)}
                                  className="p-1 rounded text-slate-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                                >
                                  <XCircle className="h-3.5 w-3.5" />
                                </button>
                              )}

                              {/* Delete Deal Button */}
                              <button
                                title="Delete Deal"
                                onClick={() => setDealToDelete(deal)}
                                className="p-1 rounded text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>

                            {/* Stage Transition Navigation */}
                            <div className="flex items-center gap-1">
                              {stageIndex > 0 && (
                                <button
                                  title={`Move back to ${PIPELINE_STAGES[stageIndex - 1].label}`}
                                  onClick={() =>
                                    handleStageChange(deal, PIPELINE_STAGES[stageIndex - 1].id)
                                  }
                                  className="p-1 rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer"
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
                                  className={`flex items-center gap-1 px-2 py-1 rounded text-[10px] font-bold transition-all cursor-pointer ${
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

      {/* Safety Gate Sign-off Modal */}
      {selectedDealForSafety && (
        <SafetyGateModal
          isOpen={isSafetyModalOpen}
          onClose={() => setIsSafetyModalOpen(false)}
          deal={selectedDealForSafety}
          onApproveAndAdvance={handleApproveSafetyAndAdvance}
        />
      )}

      {/* Edit Deal Modal */}
      {selectedDealForEdit && (
        <EditDealModal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setSelectedDealForEdit(null);
          }}
          deal={selectedDealForEdit}
          onDealUpdated={onRefresh}
        />
      )}

      {/* Delete Deal Confirmation Modal */}
      {dealToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3 text-red-600 mb-3">
              <AlertCircle className="h-6 w-6" />
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Confirm Deal Deletion
              </h3>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Are you sure you want to permanently delete deal <strong>{dealToDelete.dealCode}</strong> (
              <em>{dealToDelete.title}</em>)? This will release all booked inventory slots back into the avails engine.
            </p>
            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setDealToDelete(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleDeleteDeal}
                className="px-5 py-2 text-xs font-bold bg-red-600 hover:bg-red-700 text-white rounded-lg shadow-md cursor-pointer disabled:opacity-50"
              >
                {isDeleting ? 'Deleting...' : 'Delete Deal'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
