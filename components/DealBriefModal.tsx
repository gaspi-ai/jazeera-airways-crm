'use client';

import React, { useState } from 'react';
import {
  X,
  Edit,
  FileText,
  Trash2,
  XCircle,
  Building2,
  Calendar,
  Clock,
  CheckCircle2,
  ShieldAlert,
  ShieldCheck,
  Flame,
  Scan,
  Mail,
  Phone,
  ArrowRight,
  TrendingUp,
  Tag,
  DollarSign,
  Layers,
  MapPin,
  ExternalLink,
  ChevronRight,
  AlertTriangle,
  FileSignature,
  Percent,
} from 'lucide-react';
import {
  DealWithRelations,
  PIPELINE_STAGES,
  PipelineStage,
  formatKWD,
  formatDate,
} from '@/lib/types';

interface DealBriefModalProps {
  deal: DealWithRelations | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (deal: DealWithRelations) => void;
  onDelete: (deal: DealWithRelations) => void;
  onCancelDeal: (deal: DealWithRelations) => void;
  onStageChange: (deal: DealWithRelations, targetStage: PipelineStage) => void;
  onApproveSafety: (deal: DealWithRelations) => void;
}

export function DealBriefModal({
  deal,
  isOpen,
  onClose,
  onEdit,
  onDelete,
  onCancelDeal,
  onStageChange,
  onApproveSafety,
}: DealBriefModalProps) {
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  if (!isOpen || !deal) return null;

  const currentStage = PIPELINE_STAGES.find((s) => s.id === deal.stage);
  const stageIndex = PIPELINE_STAGES.findIndex((s) => s.id === deal.stage);

  const hasDiscount = (deal.discountAmountKWD || 0) > 0;
  const grossVal = deal.grossValueKWD || deal.totalValueKWD;
  const netVal = deal.totalValueKWD;
  const discVal = deal.discountAmountKWD || 0;
  const weight = currentStage ? currentStage.weight : 0;
  const weightedVal = Math.round(netVal * weight);

  // Compute flight duration in days
  let flightDurationDays = 0;
  if (deal.targetStartDate && deal.targetEndDate) {
    const start = new Date(deal.targetStartDate).getTime();
    const end = new Date(deal.targetEndDate).getTime();
    flightDurationDays = Math.max(1, Math.round((end - start) / (1000 * 60 * 60 * 24)));
  }

  const handleDownloadIO = async () => {
    setIsGeneratingPdf(true);
    try {
      const { generateInsertionOrderPDF } = await import('@/lib/pdfGenerator');
      generateInsertionOrderPDF(deal);
    } catch (err) {
      console.error('Failed to generate IO PDF:', err);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 w-full max-w-4xl max-h-[92vh] rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden">
        {/* Top Header */}
        <div className="bg-gradient-to-r from-[#002B66] via-[#093574] to-[#001D47] text-white p-5 sm:p-6 shrink-0 relative">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1.5 flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-xs font-black tracking-wider px-2.5 py-1 rounded-lg bg-sky-400/20 text-sky-200 border border-sky-400/30">
                  {deal.dealCode}
                </span>
                {currentStage && (
                  <span
                    className="text-xs font-bold px-2.5 py-1 rounded-lg flex items-center gap-1.5"
                    style={{
                      backgroundColor: `${currentStage.color}25`,
                      color: currentStage.color,
                      borderColor: `${currentStage.color}50`,
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
                  <span className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    Safety Cleared
                  </span>
                ) : (
                  <button
                    onClick={() => onApproveSafety(deal)}
                    className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30 flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <ShieldAlert className="h-3.5 w-3.5 animate-pulse" />
                    Safety Audit Req. (Click to sign off)
                  </button>
                )}
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight truncate mt-1">
                {deal.title}
              </h2>
              <div className="flex items-center gap-2 text-xs text-sky-200">
                <Building2 className="h-3.5 w-3.5 text-sky-300 shrink-0" />
                <span className="font-bold text-white">{deal.company.name}</span>
                <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-white/10 text-sky-200">
                  {deal.company.type === 'AGENCY' ? 'Media Agency' : 'Direct Advertiser'}
                </span>
                {deal.contact && (
                  <>
                    <span>•</span>
                    <span className="text-slate-300">
                      Contact: {deal.contact.name} ({deal.contact.email})
                    </span>
                  </>
                )}
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer shrink-0"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Action Toolbar */}
          <div className="mt-4 pt-4 border-t border-white/10 flex flex-wrap items-center justify-between gap-2.5">
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => {
                  onClose();
                  onEdit(deal);
                }}
                className="px-3 py-1.5 text-xs font-bold rounded-xl bg-white text-[#002B66] hover:bg-sky-50 shadow-sm flex items-center gap-1.5 cursor-pointer transition-all active:scale-95"
              >
                <Edit className="h-3.5 w-3.5" />
                Edit Deal & Pricing
              </button>

              <button
                onClick={handleDownloadIO}
                disabled={isGeneratingPdf}
                className="px-3 py-1.5 text-xs font-bold rounded-xl bg-sky-500/20 hover:bg-sky-500/30 text-sky-100 border border-sky-400/30 flex items-center gap-1.5 cursor-pointer transition-all active:scale-95 disabled:opacity-50"
              >
                <FileText className="h-3.5 w-3.5" />
                {isGeneratingPdf ? 'Generating PDF...' : 'Download IO PDF'}
              </button>

              {!deal.aviationApproval && (
                <button
                  onClick={() => onApproveSafety(deal)}
                  className="px-3 py-1.5 text-xs font-bold rounded-xl bg-amber-500 text-amber-950 hover:bg-amber-400 shadow-sm flex items-center gap-1.5 cursor-pointer transition-all active:scale-95"
                >
                  <ShieldCheck className="h-3.5 w-3.5" />
                  Sign Off Safety Gate
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              {deal.stage !== 'CLOSED_LOST' && (
                <button
                  onClick={() => onCancelDeal(deal)}
                  className="px-2.5 py-1.5 text-xs font-medium rounded-xl text-amber-200 hover:text-amber-100 hover:bg-amber-500/20 transition-colors cursor-pointer flex items-center gap-1"
                >
                  <XCircle className="h-3.5 w-3.5" />
                  Cancel Deal
                </button>
              )}

              <button
                onClick={() => {
                  onClose();
                  onDelete(deal);
                }}
                className="px-2.5 py-1.5 text-xs font-medium rounded-xl text-red-300 hover:text-red-200 hover:bg-red-500/20 transition-colors cursor-pointer flex items-center gap-1"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Delete
              </button>
            </div>
          </div>
        </div>

        {/* Scrollable Content Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1">
          {/* Quick Stage Stepper / Transition Bar */}
          <div className="bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-3.5 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <TrendingUp className="h-3.5 w-3.5 text-[#002B66] dark:text-sky-400" />
                Pipeline Stage Progression
              </span>
              <span className="text-[11px] text-slate-500 font-medium">
                Stage {stageIndex + 1} of {PIPELINE_STAGES.length}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-9 gap-1.5">
              {PIPELINE_STAGES.map((stg, idx) => {
                const isCurrent = stg.id === deal.stage;
                const isPassed = idx < stageIndex;

                return (
                  <button
                    key={stg.id}
                    onClick={() => onStageChange(deal, stg.id)}
                    className={`p-2 rounded-xl text-left transition-all cursor-pointer border ${
                      isCurrent
                        ? 'bg-[#002B66] text-white border-[#002B66] shadow-sm font-bold scale-[1.02]'
                        : isPassed
                        ? 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-sky-300'
                        : 'bg-white dark:bg-slate-900 text-slate-400 dark:text-slate-500 border-slate-200 dark:border-slate-800 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[9px] font-mono mb-0.5">
                      <span>#{idx + 1}</span>
                      <span>{Math.round(stg.weight * 100)}%</span>
                    </div>
                    <div className="text-[10px] font-bold truncate leading-tight">
                      {stg.label}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Financial Overview Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="rounded-2xl p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                Gross Rate Card
              </span>
              <span className="text-lg font-black text-slate-900 dark:text-slate-100 block mt-1">
                {formatKWD(grossVal)}
              </span>
              <span className="text-[10px] text-slate-400 mt-0.5 block">Standard Catalog Pricing</span>
            </div>

            <div className="rounded-2xl p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                Discount Applied
              </span>
              <span
                className={`text-lg font-black block mt-1 ${
                  hasDiscount ? 'text-amber-600 dark:text-amber-400' : 'text-slate-400'
                }`}
              >
                {hasDiscount
                  ? `-${formatKWD(discVal)} (${deal.discountValue}${
                      deal.discountType === 'PERCENTAGE' ? '%' : ' KWD'
                    })`
                  : '0 KWD (None)'}
              </span>
              <span className="text-[10px] text-slate-400 mt-0.5 block">
                {hasDiscount ? 'Approved Agency Concession' : 'Zero Discount'}
              </span>
            </div>

            <div className="rounded-2xl p-4 bg-gradient-to-br from-blue-50 to-indigo-50/60 dark:from-sky-950/40 dark:to-blue-900/20 border border-blue-200 dark:border-sky-800/50">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#002B66] dark:text-sky-300 block">
                Net Payable Amount
              </span>
              <span className="text-xl font-black text-[#002B66] dark:text-sky-400 block mt-1">
                {formatKWD(netVal)}
              </span>
              <span className="text-[10px] text-blue-600/80 dark:text-sky-300/80 mt-0.5 block font-semibold">
                Final Contracted Revenue
              </span>
            </div>

            <div className="rounded-2xl p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                Weighted Revenue
              </span>
              <span className="text-lg font-black text-slate-900 dark:text-slate-100 block mt-1">
                {formatKWD(weightedVal)}
              </span>
              <span className="text-[10px] text-slate-400 mt-0.5 block">
                Probability: {Math.round(weight * 100)}%
              </span>
            </div>
          </div>

          {/* Campaign Brief & Deliverables Section */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 p-5 bg-white dark:bg-slate-900 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
                <FileSignature className="h-4 w-4 text-[#002B66] dark:text-sky-400" />
                Campaign Brief & Client Requirements
              </h3>
              <button
                onClick={() => {
                  onClose();
                  onEdit(deal);
                }}
                className="text-[11px] font-semibold text-[#002B66] dark:text-sky-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Edit className="h-3 w-3" />
                Edit Brief Notes
              </button>
            </div>

            {deal.notes ? (
              <div className="rounded-xl p-4 bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 text-xs text-slate-700 dark:text-slate-200 leading-relaxed whitespace-pre-line font-normal">
                {deal.notes}
              </div>
            ) : (
              <div className="rounded-xl p-4 bg-slate-50 dark:bg-slate-800/40 border border-dashed border-slate-300 dark:border-slate-700 text-xs text-slate-400 dark:text-slate-500 italic flex items-center justify-between">
                <span>No campaign brief entered yet. Click "Edit Deal & Pricing" to specify brief details.</span>
              </div>
            )}

            {/* Flight Timeline Details */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <div className="rounded-xl p-3 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] font-semibold text-slate-400 uppercase block">Campaign Start</span>
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-1 flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-slate-400" />
                  {formatDate(deal.targetStartDate)}
                </span>
              </div>

              <div className="rounded-xl p-3 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] font-semibold text-slate-400 uppercase block">Campaign End</span>
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-1 flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-slate-400" />
                  {formatDate(deal.targetEndDate)}
                </span>
              </div>

              <div className="rounded-xl p-3 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] font-semibold text-slate-400 uppercase block">Total Flight Duration</span>
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-1 flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-slate-400" />
                  {flightDurationDays > 0 ? `${flightDurationDays} Days (~${Math.round(flightDurationDays / 7)} Weeks)` : 'Open-ended'}
                </span>
              </div>
            </div>
          </div>

          {/* Booked Media Inventory Placements */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 p-5 bg-white dark:bg-slate-900 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
                <Layers className="h-4 w-4 text-[#002B66] dark:text-sky-400" />
                Booked Media Placements ({deal.bookingSlots.length} Assets)
              </h3>
              <span className="text-[11px] font-semibold text-slate-500">
                Lead Time: 4-Week Aviation Fabrication
              </span>
            </div>

            <div className="space-y-2.5">
              {deal.bookingSlots.map((slot, idx) => (
                <div
                  key={slot.id || idx}
                  className="rounded-xl p-3.5 border border-slate-200 dark:border-slate-700/80 bg-slate-50/70 dark:bg-slate-800/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300">
                        {slot.asset.code}
                      </span>
                      <span className="font-bold text-xs text-slate-900 dark:text-slate-100 truncate">
                        {slot.asset.name}
                      </span>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 uppercase">
                        {slot.asset.environment.replace('_', ' ')}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500">
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3 text-slate-400" />
                        {slot.asset.locationDesc}
                      </span>
                      <span>•</span>
                      <span>Dims: {slot.asset.dimensions}</span>
                      {slot.asset.isDigitalLoop && (
                        <>
                          <span>•</span>
                          <span className="text-blue-600 dark:text-blue-400 font-medium">
                            Digital Loop Spot (Max {slot.asset.loopMaxClients} clients)
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-sm font-black text-slate-900 dark:text-slate-100 block">
                      {formatKWD(slot.agreedRateKWD)}
                    </span>
                    <span className="text-[10px] text-slate-500 block">
                      {formatDate(slot.startDate)} - {formatDate(slot.endDate)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Aviation Safety Gate Compliance */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 p-5 bg-white dark:bg-slate-900 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
                {deal.aviationApproval ? (
                  <ShieldCheck className="h-4 w-4 text-emerald-600" />
                ) : (
                  <ShieldAlert className="h-4 w-4 text-amber-500 animate-pulse" />
                )}
                Aviation Safety Gate & Engineering Compliance
              </h3>

              {!deal.aviationApproval && (
                <button
                  onClick={() => onApproveSafety(deal)}
                  className="px-2.5 py-1 text-xs font-bold rounded-lg bg-amber-500 hover:bg-amber-400 text-amber-950 flex items-center gap-1 cursor-pointer transition-colors"
                >
                  Sign Off Safety Now
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="rounded-xl p-3 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 flex items-start gap-2.5">
                <Flame
                  className={`h-4 w-4 shrink-0 mt-0.5 ${
                    deal.flammabilityCertified ? 'text-emerald-500' : 'text-amber-500'
                  }`}
                />
                <div className="text-xs">
                  <div className="font-bold text-slate-800 dark:text-slate-200">
                    FAR/JAR 25.853 Flammability Test
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    {deal.flammabilityCertified
                      ? 'Adhesive vinyl verified self-extinguishing & FAA compliant.'
                      : 'Pending flammability certificate from fabrication supplier.'}
                  </div>
                </div>
              </div>

              <div className="rounded-xl p-3 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 flex items-start gap-2.5">
                <Scan
                  className={`h-4 w-4 shrink-0 mt-0.5 ${
                    deal.scannerChecked ? 'text-emerald-500' : 'text-amber-500'
                  }`}
                />
                <div className="text-xs">
                  <div className="font-bold text-slate-800 dark:text-slate-200">
                    T5 Scanner Optical Verification
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    {deal.scannerChecked
                      ? 'No infrared/laser barcode reflection interference.'
                      : 'Pending check-in scanner clearance by terminal ops.'}
                  </div>
                </div>
              </div>
            </div>

            {deal.dgcaPermitNo && (
              <div className="text-[11px] text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/60 p-2.5 rounded-xl flex items-center justify-between">
                <span>
                  <strong>DGCA Permit Number:</strong> {deal.dgcaPermitNo}
                </span>
                {deal.aviationSafetyNotes && (
                  <span className="truncate max-w-xs text-slate-500">
                    Notes: {deal.aviationSafetyNotes}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Cancellation Info (if applicable) */}
          {deal.stage === 'CLOSED_LOST' && (
            <div className="rounded-2xl border border-red-200 dark:border-red-900/50 p-4 bg-red-50/60 dark:bg-red-950/20 text-red-800 dark:text-red-300 text-xs">
              <strong>Deal Cancelled:</strong> {deal.cancellationReason || 'No reason provided.'}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-900/90 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0">
          <div className="text-[11px] text-slate-400">
            Created: {formatDate(deal.createdAt)} • Last updated: {formatDate(deal.updatedAt)}
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 cursor-pointer transition-colors"
          >
            Close Brief
          </button>
        </div>
      </div>
    </div>
  );
}
