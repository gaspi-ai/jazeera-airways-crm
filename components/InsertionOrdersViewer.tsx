'use client';

import React, { useState } from 'react';
import {
  FileText,
  Download,
  Eye,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Building2,
  Calendar,
  Sparkles,
} from 'lucide-react';
import { DealWithRelations, formatKWD, formatDate } from '@/lib/types';

interface InsertionOrdersViewerProps {
  deals: DealWithRelations[];
}

export function InsertionOrdersViewer({ deals }: InsertionOrdersViewerProps) {
  const [selectedDealForPreview, setSelectedDealForPreview] = useState<DealWithRelations | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const handleDownloadPDF = async (deal: DealWithRelations) => {
    try {
      setDownloadingId(deal.id);
      const { generateInsertionOrderPDF } = await import('@/lib/pdfGenerator');
      generateInsertionOrderPDF(deal);
    } catch (err) {
      console.error('Failed to generate PDF:', err);
    } finally {
      setDownloadingId(null);
    }
  };

  // Filter deals that are at least at MEDIA_PLAN_SENT, IO_SIGNED, IN_PRODUCTION, or WON
  const ioEligibleDeals = deals.filter(
    (d) => !['RFP_RECEIVED', 'CLOSED_LOST'].includes(d.stage)
  );

  return (
    <div className="space-y-6">
      {/* Overview Banner */}
      <div className="bg-gradient-to-r from-[#002B66] via-[#0B2545] to-[#00A3E0] rounded-2xl p-6 text-white shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-[#FFC72C] text-[#002B66] font-bold text-[10px] uppercase px-2 py-0.5 rounded">
              Contract & Commercial Engine
            </span>
            <span className="text-xs text-sky-200">Jazeera Airways Commercial Media Division</span>
          </div>
          <h2 className="text-xl font-bold mt-1">Automated Insertion Orders (IO)</h2>
          <p className="text-xs text-sky-100 mt-0.5 max-w-xl">
            Generates standardized aviation media contracts with mandatory 4-week production lead times, Directorate General of Civil Aviation (DGCA) compliance, and Kuwait commercial terms.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 text-center border border-white/20">
            <div className="text-lg font-black text-[#FFC72C]">{ioEligibleDeals.length}</div>
            <div className="text-[10px] text-sky-200 uppercase font-semibold">Active Orders</div>
          </div>
        </div>
      </div>

      {/* Orders List Table */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-[11px] uppercase tracking-wider text-slate-600 dark:text-slate-400">
                <th className="p-4 font-bold">IO Reference</th>
                <th className="p-4 font-bold">Campaign & Client</th>
                <th className="p-4 font-bold">Flight Dates</th>
                <th className="p-4 font-bold">Media Value (KWD)</th>
                <th className="p-4 font-bold">Aviation Safety</th>
                <th className="p-4 font-bold">Status</th>
                <th className="p-4 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {ioEligibleDeals.map((deal) => {
                const isSigned = ['IO_SIGNED', 'IN_PRODUCTION', 'INSTALLED_POP_DELIVERED', 'CLOSED_WON'].includes(deal.stage);

                return (
                  <tr key={deal.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="p-4 align-middle">
                      <span className="font-mono text-xs font-bold text-[#002B66] dark:text-sky-400 bg-blue-50 dark:bg-blue-950/80 px-2 py-1 rounded inline-block">
                        {deal.dealCode}
                      </span>
                    </td>
                    <td className="p-4 align-middle">
                      <div className="font-bold text-slate-900 dark:text-slate-100">{deal.title}</div>
                      <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1.5">
                        <Building2 className="h-3 w-3 text-slate-400" />
                        <span>{deal.company.name}</span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          ({deal.bookingSlots.length} assets)
                        </span>
                      </div>
                    </td>
                    <td className="p-4 align-middle text-slate-600 dark:text-slate-300">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3 text-slate-400" />
                        <span>
                          {formatDate(deal.targetStartDate)} - {formatDate(deal.targetEndDate)}
                        </span>
                      </div>
                    </td>
                    <td className="p-4 align-middle">
                      <span className="font-mono font-bold text-slate-900 dark:text-slate-100 text-xs">
                        {formatKWD(deal.totalValueKWD)}
                      </span>
                    </td>
                    <td className="p-4 align-middle">
                      {deal.aviationApproval ? (
                        <span className="flex items-center gap-1 text-emerald-600 font-semibold text-[11px]">
                          <ShieldCheck className="h-3.5 w-3.5" />
                          Passed
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-amber-600 font-semibold text-[11px]">
                          <Clock className="h-3.5 w-3.5" />
                          Pending Audit
                        </span>
                      )}
                    </td>
                    <td className="p-4 align-middle">
                      <span
                        className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                          isSigned
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            : 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                        }`}
                      >
                        {deal.stage.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="p-4 align-middle text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setSelectedDealForPreview(deal)}
                          className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-1 text-xs"
                        >
                          <Eye className="h-3.5 w-3.5 text-slate-500" />
                          Preview
                        </button>
                        <button
                          onClick={() => handleDownloadPDF(deal)}
                          disabled={downloadingId === deal.id}
                          className="px-3 py-1.5 rounded-lg bg-[#002B66] hover:bg-blue-900 text-white font-bold transition-all flex items-center gap-1.5 text-xs shadow-sm disabled:opacity-50"
                        >
                          <Download className="h-3.5 w-3.5" />
                          {downloadingId === deal.id ? 'Generating...' : 'Download PDF'}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* IO Modal Preview */}
      {selectedDealForPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-3xl rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95">
            {/* Blue Header with Yellow stripe */}
            <div className="bg-[#002B66] p-6 text-white border-b-4 border-[#FFC72C] flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold tracking-tight">JAZEERA AIRWAYS</h3>
                <p className="text-xs text-[#FFC72C] uppercase tracking-wider font-semibold">
                  Terminal 5 & In-Flight Media Network | Insertion Order
                </p>
                <p className="text-[11px] text-sky-200 mt-0.5">
                  Ref: {selectedDealForPreview.dealCode} • Date: {formatDate(selectedDealForPreview.createdAt)}
                </p>
              </div>
              <button
                onClick={() => setSelectedDealForPreview(null)}
                className="text-white/80 hover:text-white p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            {/* Document Content */}
            <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto text-xs text-slate-700 dark:text-slate-300">
              {/* Advertiser & Campaign Box */}
              <div className="grid grid-cols-2 gap-4 bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl border">
                <div>
                  <h4 className="font-bold text-[#002B66] dark:text-sky-400 uppercase text-[10px]">
                    Client / Media Agency
                  </h4>
                  <p className="font-bold text-sm mt-0.5 text-slate-900 dark:text-slate-100">
                    {selectedDealForPreview.company.name}
                  </p>
                  <p className="text-[11px] text-slate-500">
                    {selectedDealForPreview.company.type} • {selectedDealForPreview.company.industry}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Contact: {selectedDealForPreview.contact?.name || 'Authorized Buyer'} (
                    {selectedDealForPreview.contact?.email || selectedDealForPreview.company.contactEmail})
                  </p>
                </div>
                <div>
                  <h4 className="font-bold text-[#002B66] dark:text-sky-400 uppercase text-[10px]">
                    Campaign Details
                  </h4>
                  <p className="font-bold text-sm mt-0.5 text-slate-900 dark:text-slate-100">
                    {selectedDealForPreview.title}
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Flight: {formatDate(selectedDealForPreview.targetStartDate)} to{' '}
                    {formatDate(selectedDealForPreview.targetEndDate)}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-1">
                    DGCA Permit: {selectedDealForPreview.dgcaPermitNo || 'DGCA-MED-2026-COMPLIANT'}
                  </p>
                </div>
              </div>

              {/* Itemized Table */}
              <h4 className="font-bold text-[#002B66] dark:text-sky-400 uppercase text-[10px] tracking-wider">
                Itemized Media Inventory Schedule
              </h4>
              <div className="rounded-xl border overflow-hidden">
                <table className="w-full text-left border-collapse text-[11px]">
                  <thead className="bg-[#002B66] text-white">
                    <tr>
                      <th className="p-2.5">Code</th>
                      <th className="p-2.5">Placement</th>
                      <th className="p-2.5">Dimensions</th>
                      <th className="p-2.5">Slot / Format</th>
                      <th className="p-2.5 text-right">Agreed Rate</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                    {selectedDealForPreview.bookingSlots.map((slot, i) => (
                      <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                        <td className="p-2.5 font-mono font-bold text-blue-700 dark:text-sky-400">
                          {slot.asset.code}
                        </td>
                        <td className="p-2.5 font-medium">{slot.asset.name}</td>
                        <td className="p-2.5 text-slate-500">{slot.asset.dimensions}</td>
                        <td className="p-2.5">
                          {slot.asset.isDigitalLoop
                            ? `Slot ${slot.slotIndex}/6 (10s)`
                            : 'Exclusive Static'}
                        </td>
                        <td className="p-2.5 text-right font-mono font-bold">
                          {formatKWD(slot.agreedRateKWD)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Terms */}
              <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 p-3.5 rounded-xl text-[11px] text-amber-900 dark:text-amber-200 space-y-1">
                <p className="font-bold">Airline Media Terms & Aviation Safety Specifications:</p>
                <p>• 4-week production lead time required following final artwork proof sign-off.</p>
                <p>• Adhesive films verified compliant with FAA FAR 25.853 flame retardant certification.</p>
                <p>• Campaigns are 100% non-cancellable once sent to fabrication.</p>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border-t flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Total Net Value: {formatKWD(selectedDealForPreview.totalValueKWD)}
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setSelectedDealForPreview(null)}
                  className="px-3.5 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200 rounded-lg"
                >
                  Close
                </button>
                <button
                  onClick={() => handleDownloadPDF(selectedDealForPreview)}
                  disabled={downloadingId === selectedDealForPreview.id}
                  className="px-4 py-2 text-xs font-bold bg-[#002B66] text-white hover:bg-blue-900 rounded-lg flex items-center gap-1.5 shadow-sm disabled:opacity-50"
                >
                  <Download className="h-3.5 w-3.5" />
                  {downloadingId === selectedDealForPreview.id ? 'Generating PDF...' : 'Download Official PDF'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
