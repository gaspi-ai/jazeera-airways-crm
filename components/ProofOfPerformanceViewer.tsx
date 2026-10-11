'use client';

import React, { useState } from 'react';
import {
  Camera,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  Download,
  Plus,
  Plane,
  Building,
  UserCheck,
  Sparkles,
} from 'lucide-react';
import { DealWithRelations } from '@/lib/types';
import { generateProofOfPerformancePDF } from '@/lib/pdfGenerator';

interface ProofOfPerformanceViewerProps {
  deals: DealWithRelations[];
  onRefresh: () => void;
}

export function ProofOfPerformanceViewer({ deals, onRefresh }: ProofOfPerformanceViewerProps) {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedDealId, setSelectedDealId] = useState('');
  const [selectedAssetId, setSelectedAssetId] = useState('');
  const [locationOrFlight, setLocationOrFlight] = useState('Terminal 5 Departures Mega Screen (P2.5)');
  const [certifiedBy, setCertifiedBy] = useState('Capt. Tariq Al-Hajji (Jazeera Airport Ops Director)');
  const [inspectorRole, setInspectorRole] = useState('Terminal Operations & Media Compliance Lead');
  const [photoUrl, setPhotoUrl] = useState('https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1200&q=80');
  const [notes, setNotes] = useState('Installed and audited. Full color saturation and illumination verified.');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Collect all PoP records across deals
  const allPops = deals.flatMap((deal) =>
    deal.proofOfPerformances.map((pop) => ({
      ...pop,
      deal,
    }))
  );

  const handleOpenAddModal = (deal?: DealWithRelations) => {
    if (deal) {
      setSelectedDealId(deal.id);
      if (deal.bookingSlots.length > 0) {
        setSelectedAssetId(deal.bookingSlots[0].assetId);
      }
    } else if (deals.length > 0) {
      setSelectedDealId(deals[0].id);
      if (deals[0].bookingSlots.length > 0) {
        setSelectedAssetId(deals[0].bookingSlots[0].assetId);
      }
    }
    setIsAddModalOpen(true);
  };

  const handleCreatePoP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDealId || !selectedAssetId) return;

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/proof-of-performance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dealId: selectedDealId,
          assetId: selectedAssetId,
          flightNumberOrLocation: locationOrFlight,
          photoUrls: JSON.stringify([photoUrl]),
          certifiedBy,
          inspectorRole,
          complianceStatus: 'VERIFIED',
          inspectionNotes: notes,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        alert(err.error || 'Failed to create PoP');
        return;
      }

      onRefresh();
      setIsAddModalOpen(false);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentDealForModal = deals.find((d) => d.id === selectedDealId);

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-gradient-to-r from-[#002B66] to-[#0D9488] rounded-2xl p-6 text-white shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-[#FFC72C] text-[#002B66] font-bold text-[10px] uppercase px-2 py-0.5 rounded">
              Flight Operations & Verification
            </span>
            <span className="text-xs text-teal-200">Quality Assurance Deck</span>
          </div>
          <h2 className="text-xl font-bold mt-1">Proof of Performance (PoP) & Flight Audit</h2>
          <p className="text-xs text-teal-100 mt-0.5 max-w-xl">
            Real-time installation certifications and flight inspections signed off by Jazeera Terminal 5 Operations and Add Effect Media Quality teams.
          </p>
        </div>

        <button
          onClick={() => handleOpenAddModal()}
          className="flex items-center gap-2 rounded-xl bg-white text-[#002B66] px-4 py-2.5 text-xs font-bold shadow-md hover:bg-slate-100 transition-all shrink-0 cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          Log New PoP Inspection
        </button>
      </div>

      {/* PoP Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {allPops.map((pop) => {
          let parsedPhotos: string[] = [];
          try {
            parsedPhotos = JSON.parse(pop.photoUrls);
          } catch {
            parsedPhotos = [pop.photoUrls];
          }

          return (
            <div
              key={pop.id}
              className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                {/* Photo Header */}
                <div className="relative h-44 bg-slate-900 overflow-hidden group">
                  {parsedPhotos[0] ? (
                    <img
                      src={parsedPhotos[0]}
                      alt={pop.flightNumberOrLocation}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-500">
                      <Camera className="h-8 w-8" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />
                  
                  <div className="absolute top-3 left-3">
                    <span className="font-mono text-[10px] font-bold bg-[#002B66]/90 text-white px-2 py-1 rounded backdrop-blur-md">
                      {pop.asset.code}
                    </span>
                  </div>

                  <div className="absolute top-3 right-3">
                    <span className="flex items-center gap-1 text-[10px] font-bold bg-emerald-600/90 text-white px-2 py-0.5 rounded-full backdrop-blur-md">
                      <ShieldCheck className="h-3 w-3" />
                      {pop.complianceStatus}
                    </span>
                  </div>

                  <div className="absolute bottom-3 left-3 right-3 text-white">
                    <div className="text-xs font-bold truncate">{pop.deal.title}</div>
                    <div className="text-[10px] text-slate-300 truncate">
                      {pop.deal.company.name} • {pop.deal.dealCode}
                    </div>
                  </div>
                </div>

                {/* Audit Body */}
                <div className="p-4 space-y-3">
                  <div className="space-y-1">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">
                      Audit Location / Aircraft:
                    </span>
                    <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                      {pop.flightNumberOrLocation}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-400 space-y-1.5">
                    <div className="flex items-center gap-1.5">
                      <UserCheck className="h-3.5 w-3.5 text-teal-600 shrink-0" />
                      <span className="truncate font-medium">{pop.certifiedBy}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
                      <Calendar className="h-3.5 w-3.5 shrink-0" />
                      <span>{new Date(pop.timestamp).toLocaleString('en-GB')}</span>
                    </div>
                  </div>

                  {pop.inspectionNotes && (
                    <p className="text-[11px] text-slate-600 dark:text-slate-300 italic border-l-2 border-[#00A3E0] pl-2.5 py-0.5">
                      &ldquo;{pop.inspectionNotes}&rdquo;
                    </p>
                  )}
                </div>
              </div>

              {/* Bottom Action */}
              <div className="p-4 pt-0">
                <button
                  onClick={() => generateProofOfPerformancePDF(pop.deal)}
                  className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-slate-100 hover:bg-[#002B66] hover:text-white dark:bg-slate-800 dark:hover:bg-blue-900 text-slate-800 dark:text-slate-200 py-2 text-xs font-bold transition-all shadow-sm"
                >
                  <Download className="h-3.5 w-3.5" />
                  Generate PoP Certificate PDF
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add New PoP Inspection Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
            <div className="bg-gradient-to-r from-[#002B66] to-[#0D9488] p-5 text-white flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold">Log Proof of Performance Inspection</h3>
                <p className="text-xs text-teal-100">
                  Add installation verification stamp & audit photos
                </p>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-white/80 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreatePoP} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Associated Campaign Deal
                </label>
                <select
                  value={selectedDealId}
                  onChange={(e) => {
                    setSelectedDealId(e.target.value);
                    const d = deals.find((deal) => deal.id === e.target.value);
                    if (d?.bookingSlots.length) {
                      setSelectedAssetId(d.bookingSlots[0].assetId);
                    }
                  }}
                  className="w-full text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-2.5"
                >
                  {deals.map((d) => (
                    <option key={d.id} value={d.id}>
                      [{d.dealCode}] {d.title} ({d.company.name})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Target Asset Placement
                </label>
                <select
                  value={selectedAssetId}
                  onChange={(e) => setSelectedAssetId(e.target.value)}
                  className="w-full text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-2.5"
                >
                  {currentDealForModal?.bookingSlots.map((slot) => (
                    <option key={slot.assetId} value={slot.assetId}>
                      [{slot.asset.code}] {slot.asset.name}
                    </option>
                  )) || <option value="">No assets found</option>}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Flight Number or Terminal 5 Location
                </label>
                <input
                  type="text"
                  value={locationOrFlight}
                  onChange={(e) => setLocationOrFlight(e.target.value)}
                  placeholder="e.g. Flight J9 253 (Tail 9K-CAA) or T5 Check-In Counter #12"
                  className="w-full text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-2.5"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Certifying Operations Inspector
                </label>
                <input
                  type="text"
                  value={certifiedBy}
                  onChange={(e) => setCertifiedBy(e.target.value)}
                  className="w-full text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-2.5"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Audit Photo URL
                </label>
                <input
                  type="url"
                  value={photoUrl}
                  onChange={(e) => setPhotoUrl(e.target.value)}
                  className="w-full text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-2.5"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Inspector Audit Notes
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-2"
                />
              </div>

              <div className="pt-3 border-t flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700 rounded-lg"
                >
                  {isSubmitting ? 'Submitting...' : 'Certify PoP'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
