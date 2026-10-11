'use client';

import React, { useState, useEffect } from 'react';
import useSWR from 'swr';
import {
  X,
  Plus,
  Trash2,
  Sparkles,
  Building2,
  Calendar,
  Banknote,
  Percent,
  AlertTriangle,
  CheckCircle,
  Clock,
  ShieldCheck,
} from 'lucide-react';
import { DealWithRelations, InventoryAssetWithBookings, PIPELINE_STAGES, formatKWD } from '@/lib/types';

const editModalFetcher = (url: string) => fetch(url).then((res) => res.json());

interface EditDealModalProps {
  deal: DealWithRelations | null;
  isOpen: boolean;
  onClose: () => void;
  onDealUpdated: () => void;
}

export function EditDealModal({ deal, isOpen, onClose, onDealUpdated }: EditDealModalProps) {
  const [title, setTitle] = useState('');
  const [stage, setStage] = useState('RFP_RECEIVED');
  const [selectedCompanyId, setSelectedCompanyId] = useState('');
  const [selectedContactId, setSelectedContactId] = useState('');

  const { data: companies = [] } = useSWR<any[]>(isOpen ? '/api/companies' : null, editModalFetcher, {
    dedupingInterval: 30000,
    revalidateOnFocus: false,
  });

  const { data: assets = [] } = useSWR<InventoryAssetWithBookings[]>(isOpen ? '/api/inventory' : null, editModalFetcher, {
    dedupingInterval: 30000,
    revalidateOnFocus: false,
  });

  const [targetStartDate, setTargetStartDate] = useState('');
  const [targetEndDate, setTargetEndDate] = useState('');
  const [aviationApproval, setAviationApproval] = useState(false);
  const [flammabilityCertified, setFlammabilityCertified] = useState(false);
  const [scannerChecked, setScannerChecked] = useState(false);
  const [dgcaPermitNo, setDgcaPermitNo] = useState('');
  const [notes, setNotes] = useState('');
  const [cancellationReason, setCancellationReason] = useState('');

  // Discount state
  const [discountType, setDiscountType] = useState<'NONE' | 'PERCENTAGE' | 'FIXED_AMOUNT'>('NONE');
  const [discountValue, setDiscountValue] = useState<number>(0);

  // Booking items
  const [bookingItems, setBookingItems] = useState<
    {
      assetId: string;
      startDate: string;
      endDate: string;
      slotIndex: number;
      rateKWD: number;
      productionIncluded: boolean;
    }[]
  >([]);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    if (isOpen && deal) {
      setTitle(deal.title || '');
      setStage(deal.stage || 'RFP_RECEIVED');
      setSelectedCompanyId(deal.companyId || '');
      setSelectedContactId(deal.contactId || '');
      setTargetStartDate(deal.targetStartDate ? new Date(deal.targetStartDate).toISOString().slice(0, 10) : '');
      setTargetEndDate(deal.targetEndDate ? new Date(deal.targetEndDate).toISOString().slice(0, 10) : '');
      setAviationApproval(Boolean(deal.aviationApproval));
      setFlammabilityCertified(Boolean(deal.flammabilityCertified));
      setScannerChecked(Boolean(deal.scannerChecked));
      setDgcaPermitNo(deal.dgcaPermitNo || '');
      setNotes(deal.notes || '');
      setCancellationReason(deal.cancellationReason || '');

      setDiscountType((deal.discountType as any) || 'NONE');
      setDiscountValue(deal.discountValue || 0);

      if (deal.bookingSlots && deal.bookingSlots.length > 0) {
        setBookingItems(
          deal.bookingSlots.map((b) => ({
            assetId: b.assetId,
            startDate: new Date(b.startDate).toISOString().slice(0, 10),
            endDate: new Date(b.endDate).toISOString().slice(0, 10),
            slotIndex: b.slotIndex || 1,
            rateKWD: b.agreedRateKWD || 0,
            productionIncluded: Boolean(b.productionIncluded),
          }))
        );
      } else {
        setBookingItems([]);
      }

      setErrorMsg('');
      setSuccessMsg('');
    }
  }, [isOpen, deal]);

  if (!isOpen || !deal) return null;

  // Financial calculations
  const grossValueKWD = bookingItems.reduce((acc, curr) => acc + (Number(curr.rateKWD) || 0), 0);
  let discountAmountKWD = 0;
  if (discountType === 'PERCENTAGE' && discountValue > 0) {
    discountAmountKWD = Math.round(grossValueKWD * (discountValue / 100));
  } else if (discountType === 'FIXED_AMOUNT' && discountValue > 0) {
    discountAmountKWD = Math.min(grossValueKWD, discountValue);
  }
  const netValueKWD = Math.max(0, grossValueKWD - discountAmountKWD);

  const currentCompany = companies.find((c) => c.id === selectedCompanyId) || deal.company;

  const checkAssetAvailability = (assetId: string, slotStartDate?: string, slotEndDate?: string) => {
    const asset = assets.find((a) => a.id === assetId);
    if (!asset) return { available: true };
    const start = new Date(slotStartDate || targetStartDate || '2026-10-01');
    const end = new Date(slotEndDate || targetEndDate || '2026-10-31');
    const confirmedStages = [
      'IO_SIGNED',
      'IN_PRODUCTION',
      'INSTALLED_POP_DELIVERED',
      'LIVE_RUNNING',
      'CLOSED_WON',
    ];

    const overlappingSlots = (asset.bookingSlots || []).filter((s: any) => {
      if (s.dealId === deal.id) return false;
      if (!s.deal || !confirmedStages.includes(s.deal.stage)) return false;
      const sStart = new Date(s.startDate);
      const sEnd = new Date(s.endDate);
      return sStart <= end && sEnd >= start;
    });

    if (asset.isDigitalLoop) {
      const isAvailable = overlappingSlots.length < (asset.loopMaxClients || 6);
      return {
        available: isAvailable,
        occupiedCount: overlappingSlots.length,
        maxClients: asset.loopMaxClients || 6,
        message: !isAvailable ? `Digital loop full (${overlappingSlots.length}/${asset.loopMaxClients || 6} advertisers)` : undefined,
      };
    }

    const isAvailable = overlappingSlots.length === 0;
    const firstConflict = overlappingSlots[0];
    return {
      available: isAvailable,
      conflictCompany: firstConflict?.deal?.company?.name,
      message: !isAvailable
        ? `Confirmed booked by ${firstConflict?.deal?.company?.name || 'another advertiser'}`
        : undefined,
    };
  };

  const handleAddSlot = () => {
    if (assets.length === 0) return;
    const availableAsset = assets.find((a) => checkAssetAvailability(a.id).available) || assets[0];
    setBookingItems([
      ...bookingItems,
      {
        assetId: availableAsset.id,
        startDate: targetStartDate || '2026-10-01',
        endDate: targetEndDate || '2026-10-31',
        slotIndex: 1,
        rateKWD: availableAsset.baseRate1M || 5000,
        productionIncluded: false,
      },
    ]);
  };

  const handleUpdateSlot = (index: number, field: string, val: any) => {
    const updated = [...bookingItems];
    const item = { ...updated[index], [field]: val };
    if (field === 'assetId') {
      const asset = assets.find((a) => a.id === val);
      if (asset) {
        item.rateKWD = asset.baseRate1M || 5000;
      }
    }
    updated[index] = item;
    setBookingItems(updated);
  };

  const handleRemoveSlot = (index: number) => {
    setBookingItems(bookingItems.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Check for hard conflicts if deal is confirmed or being updated
    const conflictingSlot = bookingItems.find(
      (slot) => !checkAssetAvailability(slot.assetId, slot.startDate, slot.endDate).available
    );
    if (conflictingSlot && ['IO_SIGNED', 'IN_PRODUCTION', 'LIVE_RUNNING', 'CLOSED_WON'].includes(stage)) {
      const conflictingAsset = assets.find((a) => a.id === conflictingSlot.assetId);
      const status = checkAssetAvailability(conflictingSlot.assetId, conflictingSlot.startDate, conflictingSlot.endDate);
      setErrorMsg(
        `Exclusive Booking Conflict: ${conflictingAsset?.name || 'Asset'} has a confirmed booking (${status.message || 'Booked'}). Cannot advance to signed/active stage on conflicting dates.`
      );
      return;
    }

    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const payload: any = {
        title,
        stage,
        companyId: selectedCompanyId,
        contactId: selectedContactId || null,
        targetStartDate: targetStartDate || null,
        targetEndDate: targetEndDate || null,
        aviationApproval,
        flammabilityCertified,
        scannerChecked,
        dgcaPermitNo: dgcaPermitNo || null,
        aviationSafetyNotes: deal.aviationSafetyNotes,
        notes,
        cancellationReason: stage === 'CLOSED_LOST' ? cancellationReason : null,
        discountType,
        discountValue,
        bookingSlots: bookingItems.map((slot) => ({
          assetId: slot.assetId,
          startDate: slot.startDate || targetStartDate,
          endDate: slot.endDate || targetEndDate,
          slotIndex: slot.slotIndex,
          agreedRateKWD: slot.rateKWD,
          productionIncluded: slot.productionIncluded,
        })),
      };

      const res = await fetch(`/api/deals/${deal.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || 'Failed to update deal. Please verify inventory availability.');
        setLoading(false);
        return;
      }

      setSuccessMsg('Deal updated successfully!');
      setTimeout(() => {
        onDealUpdated();
        onClose();
      }, 500);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error updating deal');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="w-full max-w-4xl rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#002B66] via-[#0B2545] to-[#00A3E0] p-6 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-white/10 p-2.5 backdrop-blur-md">
              <Sparkles className="h-6 w-6 text-[#FFC72C]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold bg-[#FFC72C] text-[#002B66] px-2 py-0.5 rounded">
                  {deal.dealCode}
                </span>
                <h3 className="text-xl font-bold tracking-tight">Edit Media Deal & Pricing</h3>
              </div>
              <p className="text-xs text-sky-200 mt-0.5">
                Update contract specifications, discount tiers, and booked inventory slots
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl bg-white/10 p-2 text-white/80 hover:bg-white/20 hover:text-white transition-all cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {errorMsg && (
          <div className="mx-6 mt-6 p-4 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300 text-xs flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="mx-6 mt-6 p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-900 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle className="h-4 w-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Section 1: Campaign Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Campaign / Deal Title *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-2.5 text-slate-900 dark:text-slate-100"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Sales Pipeline Stage
              </label>
              <select
                value={stage}
                onChange={(e) => setStage(e.target.value)}
                className="w-full text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-2.5 text-slate-900 dark:text-slate-100 font-semibold"
              >
                {PIPELINE_STAGES.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label} ({Math.round(s.weight * 100)}%)
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Cancellation Reason if CLOSED_LOST */}
          {stage === 'CLOSED_LOST' && (
            <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900">
              <label className="block text-xs font-bold text-red-700 dark:text-red-300 mb-1">
                Cancellation / Lost Reason *
              </label>
              <input
                type="text"
                value={cancellationReason}
                onChange={(e) => setCancellationReason(e.target.value)}
                placeholder="e.g. Budget reallocated, DGCA creative rejected, or timing delay"
                className="w-full text-xs rounded-lg border border-red-300 dark:border-red-800 bg-white dark:bg-slate-800 p-2 text-slate-900 dark:text-slate-100"
              />
            </div>
          )}

          {/* Company & Contact Selector */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Advertiser / Media Agency
              </label>
              <select
                value={selectedCompanyId}
                onChange={(e) => setSelectedCompanyId(e.target.value)}
                className="w-full text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-2.5 text-slate-900 dark:text-slate-100"
              >
                {companies.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.type.replace('_', ' ')})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Primary Contact Stakeholder
              </label>
              <select
                value={selectedContactId}
                onChange={(e) => setSelectedContactId(e.target.value)}
                className="w-full text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-2.5 text-slate-900 dark:text-slate-100"
              >
                <option value="">-- No specific contact --</option>
                {currentCompany?.contacts?.map((ct: any) => (
                  <option key={ct.id} value={ct.id}>
                    {ct.name} ({ct.role})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Flight Dates */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Flight Target Start Date
              </label>
              <input
                type="date"
                value={targetStartDate}
                onChange={(e) => setTargetStartDate(e.target.value)}
                className="w-full text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-2.5 text-slate-900 dark:text-slate-100"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Flight Target End Date
              </label>
              <input
                type="date"
                value={targetEndDate}
                onChange={(e) => setTargetEndDate(e.target.value)}
                className="w-full text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-2.5 text-slate-900 dark:text-slate-100"
              />
            </div>
          </div>

          {/* Section 2: Booked Inventory Slots */}
          <div className="space-y-3 pt-2 border-t border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  Booked Inventory Assets ({bookingItems.length})
                </h4>
                <p className="text-[11px] text-slate-500">
                  Configure line items and rates with automated overlap safeguards
                </p>
              </div>
              <button
                type="button"
                onClick={handleAddSlot}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-50 dark:bg-sky-950 text-sky-700 dark:text-sky-300 hover:bg-sky-100 text-xs font-semibold border border-sky-200 dark:border-sky-800 cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" />
                Add Asset
              </button>
            </div>

            <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
              {bookingItems.map((item, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex flex-col md:flex-row items-start md:items-center justify-between gap-3"
                >
                  <div className="flex-1 w-full grid grid-cols-1 md:grid-cols-3 gap-2">
                    <select
                      value={item.assetId}
                      onChange={(e) => handleUpdateSlot(idx, 'assetId', e.target.value)}
                      className="text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-2 text-slate-900 dark:text-slate-100 font-medium"
                    >
                      {assets.map((a) => {
                        const avail = checkAssetAvailability(a.id, item.startDate, item.endDate);
                        return (
                          <option key={a.id} value={a.id}>
                            [{a.code}] {a.name} ({avail.available ? '✓ Available' : '⚠️ Booked'})
                          </option>
                        );
                      })}
                    </select>

                    <div className="flex items-center gap-2">
                      <input
                        type="date"
                        value={item.startDate}
                        onChange={(e) => handleUpdateSlot(idx, 'startDate', e.target.value)}
                        className="text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-2 flex-1"
                      />
                      <span className="text-slate-400 text-xs">to</span>
                      <input
                        type="date"
                        value={item.endDate}
                        onChange={(e) => handleUpdateSlot(idx, 'endDate', e.target.value)}
                        className="text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-2 flex-1"
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="relative flex-1">
                        <input
                          type="number"
                          value={item.rateKWD}
                          onChange={(e) => handleUpdateSlot(idx, 'rateKWD', Number(e.target.value))}
                          className="w-full text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-2 pr-12 font-bold text-slate-900 dark:text-slate-100"
                        />
                        <span className="absolute right-2.5 top-2 text-[10px] text-slate-400 font-bold">
                          KWD
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveSlot(idx)}
                        className="p-2 text-red-500 hover:text-red-700 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/40"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {!checkAssetAvailability(item.assetId, item.startDate, item.endDate).available && (
                    <div className="w-full mt-2 p-2 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-[11px] text-amber-800 dark:text-amber-200 flex items-center gap-1.5">
                      <AlertTriangle className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                      <span>
                        ⚠️ {checkAssetAvailability(item.assetId, item.startDate, item.endDate).message} for dates {item.startDate} to {item.endDate}.
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Section 3: Commercial Discount Engine */}
          <div className="p-4 rounded-xl border border-sky-100 dark:border-sky-950 bg-sky-50/60 dark:bg-sky-950/20 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Banknote className="h-4 w-4 text-[#002B66] dark:text-[#00A3E0]" />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-slate-100">
                  Commercial Discount & Agency Margins
                </span>
              </div>

              {/* Quick Preset Buttons */}
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] text-slate-500 font-medium">Presets:</span>
                {[
                  { label: 'Agency 15%', type: 'PERCENTAGE', val: 15 },
                  { label: '10%', type: 'PERCENTAGE', val: 10 },
                  { label: '5%', type: 'PERCENTAGE', val: 5 },
                  { label: 'None', type: 'NONE', val: 0 },
                ].map((p, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => {
                      setDiscountType(p.type as any);
                      setDiscountValue(p.val);
                    }}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all cursor-pointer ${
                      discountType === p.type && discountValue === p.val
                        ? 'bg-[#002B66] text-white'
                        : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Discount Mechanism
                </label>
                <select
                  value={discountType}
                  onChange={(e) => setDiscountType(e.target.value as any)}
                  className="w-full text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-2.5 text-slate-900 dark:text-slate-100 font-medium"
                >
                  <option value="NONE">No Discount (Standard Rate Card)</option>
                  <option value="PERCENTAGE">Percentage (%) Discount</option>
                  <option value="FIXED_AMOUNT">Fixed Lump-Sum (KWD) Deduction</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {discountType === 'PERCENTAGE'
                    ? 'Discount Percentage (%)'
                    : discountType === 'FIXED_AMOUNT'
                    ? 'Fixed Amount (KWD)'
                    : 'Discount Value'}
                </label>
                <div className="relative">
                  <input
                    type="number"
                    disabled={discountType === 'NONE'}
                    value={discountValue}
                    onChange={(e) => setDiscountValue(Number(e.target.value))}
                    min={0}
                    max={discountType === 'PERCENTAGE' ? 100 : grossValueKWD}
                    className="w-full text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-2.5 pr-12 text-slate-900 dark:text-slate-100 font-bold disabled:opacity-50"
                  />
                  <span className="absolute right-3 top-2.5 text-xs text-slate-400 font-bold">
                    {discountType === 'PERCENTAGE' ? '%' : 'KWD'}
                  </span>
                </div>
              </div>
            </div>

            {/* Financial Totals Summary Bar */}
            <div className="pt-3 border-t border-sky-200 dark:border-sky-900 grid grid-cols-3 gap-3 text-center">
              <div className="p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Gross Media Value</span>
                <span className="text-sm font-black text-slate-800 dark:text-slate-200">{formatKWD(grossValueKWD)}</span>
              </div>
              <div className="p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <span className="text-[10px] uppercase font-bold text-red-500 block">Discount Applied</span>
                <span className="text-sm font-black text-red-600 dark:text-red-400">
                  {discountAmountKWD > 0 ? `-${formatKWD(discountAmountKWD)}` : '0 KWD'}
                </span>
              </div>
              <div className="p-2 rounded-lg bg-[#002B66] text-white">
                <span className="text-[10px] uppercase font-bold text-sky-200 block">Final Net Payable</span>
                <span className="text-sm font-black text-[#FFC72C]">{formatKWD(netValueKWD)}</span>
              </div>
            </div>
          </div>

          {/* Section 4: Aviation Compliance & Notes */}
          <div className="p-4 rounded-xl border border-amber-200 dark:border-amber-900/60 bg-amber-50/40 dark:bg-amber-950/20 space-y-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              <span className="text-xs font-bold text-amber-900 dark:text-amber-300 uppercase tracking-wider">
                Aviation Safety & Regulatory Clearance
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <label className="flex items-center gap-2.5 p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium cursor-pointer">
                <input
                  type="checkbox"
                  checked={flammabilityCertified}
                  onChange={(e) => setFlammabilityCertified(e.target.checked)}
                  className="rounded text-[#002B66] focus:ring-sky-500"
                />
                <span>FAR/JAR-25 Flammability</span>
              </label>

              <label className="flex items-center gap-2.5 p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium cursor-pointer">
                <input
                  type="checkbox"
                  checked={scannerChecked}
                  onChange={(e) => setScannerChecked(e.target.checked)}
                  className="rounded text-[#002B66] focus:ring-sky-500"
                />
                <span>T5 Scanner Optical Test</span>
              </label>

              <label className="flex items-center gap-2.5 p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium cursor-pointer">
                <input
                  type="checkbox"
                  checked={aviationApproval}
                  onChange={(e) => setAviationApproval(e.target.checked)}
                  className="rounded text-[#002B66] focus:ring-sky-500"
                />
                <span className="font-bold text-emerald-600">DGCA Safety Sign-off</span>
              </label>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Kuwait DGCA Commercial Permit Number
              </label>
              <input
                type="text"
                value={dgcaPermitNo}
                onChange={(e) => setDgcaPermitNo(e.target.value)}
                placeholder="e.g. DGCA-MED-2026-088"
                className="w-full text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-2 text-slate-900 dark:text-slate-100"
              />
            </div>
          </div>

          {/* Campaign Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Internal Campaign & Operational Notes
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Commercial stipulations, production milestones, or placement specifics..."
              className="w-full text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-2.5 text-slate-900 dark:text-slate-100"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 rounded-xl bg-[#002B66] hover:bg-[#003882] text-white text-xs font-bold shadow-lg transition-all cursor-pointer flex items-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Clock className="h-4 w-4 animate-spin" />
                  Saving Changes...
                </>
              ) : (
                <>Save & Update Deal</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
