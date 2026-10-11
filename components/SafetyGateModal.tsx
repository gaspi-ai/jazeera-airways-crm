'use client';

import React, { useState } from 'react';
import { ShieldAlert, ShieldCheck, CheckCircle2, AlertTriangle, X, Flame, Scan } from 'lucide-react';
import { DealWithRelations } from '@/lib/types';

interface SafetyGateModalProps {
  deal: DealWithRelations | null;
  isOpen: boolean;
  onClose: () => void;
  onApproveAndAdvance: (dealId: string, details: {
    flammabilityCertified: boolean;
    scannerChecked: boolean;
    dgcaPermitNo: string;
    aviationSafetyNotes: string;
  }) => Promise<void>;
}

export function SafetyGateModal({
  deal,
  isOpen,
  onClose,
  onApproveAndAdvance,
}: SafetyGateModalProps) {
  const [flammabilityCertified, setFlammabilityCertified] = useState(
    deal?.flammabilityCertified || false
  );
  const [scannerChecked, setScannerChecked] = useState(
    deal?.scannerChecked || false
  );
  const [dgcaPermitNo, setDgcaPermitNo] = useState(
    deal?.dgcaPermitNo || `DGCA-MED-2026-${Math.floor(100 + Math.random() * 900)}`
  );
  const [safetyNotes, setSafetyNotes] = useState(
    deal?.aviationSafetyNotes ||
      'Verified compliant with FAA FAR 25.853 Appendix F Part I and Kuwait DGCA Terminal 5 fire safety standards.'
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !deal) return null;

  const canApprove = flammabilityCertified && scannerChecked;

  const handleApprove = async () => {
    if (!canApprove) return;
    setIsSubmitting(true);
    try {
      await onApproveAndAdvance(deal.id, {
        flammabilityCertified,
        scannerChecked,
        dgcaPermitNo,
        aviationSafetyNotes: safetyNotes,
      });
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-2xl rounded-2xl bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-500/40 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header with Aviation Warning Banner */}
        <div className="bg-gradient-to-r from-amber-600 via-amber-500 to-yellow-500 p-6 text-white flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-white/20 p-2.5 backdrop-blur-md">
              <ShieldAlert className="h-7 w-7 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="rounded bg-black/20 px-2 py-0.5 text-xs font-bold uppercase tracking-wider">
                  Mandatory Pipeline Gate
                </span>
                <span className="text-xs text-amber-100 font-mono">{deal.dealCode}</span>
              </div>
              <h3 className="text-xl font-bold tracking-tight mt-0.5">
                Aviation & Material Safety Approval
              </h3>
              <p className="text-xs text-amber-100 mt-1">
                Civil Aviation (DGCA) & Airline Fleet Engineering Safety Verification
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-white/80 hover:bg-white/20 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          <div className="rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 p-4 flex gap-3 text-sm text-amber-900 dark:text-amber-200">
            <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">IO Signing Blocked by Aviation Protocol</p>
              <p className="text-xs mt-0.5 text-amber-800 dark:text-amber-300 leading-relaxed">
                Commercial Insertion Orders (IO) cannot be legally executed for Jazeera Airways inventory until all cabin adhesives, print stocks, and digital illuminations receive formal safety sign-off.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Required Safety Audits for &quot;{deal.title}&quot;
            </h4>

            {/* Checklist Item 1: Flammability */}
            <label className={`flex items-start gap-3.5 p-4 rounded-xl border transition-all cursor-pointer ${
              flammabilityCertified
                ? 'bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-700/60'
                : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 hover:border-amber-400'
            }`}>
              <input
                type="checkbox"
                checked={flammabilityCertified}
                onChange={(e) => setFlammabilityCertified(e.target.checked)}
                className="mt-1 h-5 w-5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <Flame className="h-4 w-4 text-orange-500" />
                  <span className="font-semibold text-sm text-slate-900 dark:text-slate-100">
                    FAR / JAR-25 Cabin Flammability Compliance
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                  Confirms adhesive vinyls (seatbacks, bins, wraps) adhere to FAA FAR 25.853 Appendix F 12-second vertical flame test. Certified non-toxic and low-smoke emission for pressurized aircraft cabins.
                </p>
              </div>
            </label>

            {/* Checklist Item 2: Scanner Compatibility */}
            <label className={`flex items-start gap-3.5 p-4 rounded-xl border transition-all cursor-pointer ${
              scannerChecked
                ? 'bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-700/60'
                : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 hover:border-amber-400'
            }`}>
              <input
                type="checkbox"
                checked={scannerChecked}
                onChange={(e) => setScannerChecked(e.target.checked)}
                className="mt-1 h-5 w-5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <Scan className="h-4 w-4 text-sky-500" />
                  <span className="font-semibold text-sm text-slate-900 dark:text-slate-100">
                    IATA 722e Barcode & T5 Optical Scanner Compatibility
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                  Confirms boarding pass ink density and reverse-side bleed does not interfere with automated e-gates or handheld laser scanners at Kuwait T5 gates 1 to 6.
                </p>
              </div>
            </label>

            {/* DGCA Permit & Notes */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  DGCA Aviation Permit Reference
                </label>
                <input
                  type="text"
                  value={dgcaPermitNo}
                  onChange={(e) => setDgcaPermitNo(e.target.value)}
                  placeholder="e.g. DGCA-MED-2026-105"
                  className="w-full text-xs font-mono rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-slate-900 dark:text-slate-100 focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Certifying Safety Authority
                </label>
                <input
                  type="text"
                  defaultValue="Jazeera Flight Safety & Add Effect Technical Team"
                  className="w-full text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 px-3 py-2 text-slate-600 dark:text-slate-300"
                  readOnly
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Inspector Audit Notes
              </label>
              <textarea
                rows={2}
                value={safetyNotes}
                onChange={(e) => setSafetyNotes(e.target.value)}
                className="w-full text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-2.5 text-slate-900 dark:text-slate-100 focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
              />
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="bg-slate-50 dark:bg-slate-800/80 px-6 py-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          >
            Cancel / Keep in Current Stage
          </button>

          <button
            type="button"
            disabled={!canApprove || isSubmitting}
            onClick={handleApprove}
            className={`flex items-center gap-2 rounded-lg px-5 py-2.5 text-xs font-bold shadow-md transition-all ${
              canApprove
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer hover:shadow-emerald-500/20'
                : 'bg-slate-300 dark:bg-slate-700 text-slate-500 dark:text-slate-400 cursor-not-allowed'
            }`}
          >
            {canApprove ? (
              <>
                <ShieldCheck className="h-4 w-4" />
                {isSubmitting ? 'Certifying & Advancing...' : 'Approve Safety & Advance to IO_SIGNED'}
              </>
            ) : (
              <>
                <ShieldAlert className="h-4 w-4" />
                Complete Both Checks to Advance
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
