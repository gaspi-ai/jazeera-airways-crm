'use client';

import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, ShieldAlert, Sparkles, Building2, Calendar, Banknote, AlertTriangle } from 'lucide-react';
import { InventoryAssetWithBookings } from '@/lib/types';

interface NewDealModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDealCreated: () => void;
}

export function NewDealModal({ isOpen, onClose, onDealCreated }: NewDealModalProps) {
  const [title, setTitle] = useState('');
  const [companies, setCompanies] = useState<any[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState('');
  const [selectedContactId, setSelectedContactId] = useState('');
  const [assets, setAssets] = useState<InventoryAssetWithBookings[]>([]);

  const [targetStartDate, setTargetStartDate] = useState('2026-10-01');
  const [targetEndDate, setTargetEndDate] = useState('2026-10-31');
  const [aviationApproval, setAviationApproval] = useState(false);
  const [flammabilityCertified, setFlammabilityCertified] = useState(false);
  const [scannerChecked, setScannerChecked] = useState(false);
  const [notes, setNotes] = useState('');
  const [discountType, setDiscountType] = useState<'NONE' | 'PERCENTAGE' | 'FIXED_AMOUNT'>('NONE');
  const [discountValue, setDiscountValue] = useState<number>(0);

  // Selected asset booking line items
  const [bookingItems, setBookingItems] = useState<
    {
      assetId: string;
      durationMonths: number;
      slotIndex: number;
      rateKWD: number;
      productionIncluded: boolean;
    }[]
  >([]);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (isOpen) {
      fetchCompanies();
      fetchAssets();
    }
  }, [isOpen]);

  const checkAssetAvailability = (assetId: string) => {
    const asset = assets.find((a) => a.id === assetId);
    if (!asset) return { available: true };
    const start = new Date(targetStartDate);
    const end = new Date(targetEndDate);
    const confirmedStages = [
      'IO_SIGNED',
      'IN_PRODUCTION',
      'INSTALLED_POP_DELIVERED',
      'LIVE_RUNNING',
      'CLOSED_WON',
    ];

    const overlappingSlots = (asset.bookingSlots || []).filter((s: any) => {
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

  const fetchCompanies = async () => {
    try {
      const res = await fetch('/api/companies');
      const data = await res.json();
      setCompanies(data);
      if (data.length > 0 && !selectedCompanyId) {
        setSelectedCompanyId(data[0].id);
        if (data[0].contacts?.length > 0) {
          setSelectedContactId(data[0].contacts[0].id);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchAssets = async () => {
    try {
      const res = await fetch('/api/inventory');
      const data = await res.json();
      setAssets(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCompanyChange = (companyId: string) => {
    setSelectedCompanyId(companyId);
    const comp = companies.find((c) => c.id === companyId);
    if (comp?.contacts?.length > 0) {
      setSelectedContactId(comp.contacts[0].id);
    } else {
      setSelectedContactId('');
    }
  };

  const addBookingItem = () => {
    if (assets.length === 0) return;
    // Prefer the first available asset for selected campaign dates
    const availableAsset = assets.find((a) => checkAssetAvailability(a.id).available) || assets[0];
    const initialRate = availableAsset.baseRate1M || 5000;
    setBookingItems([
      ...bookingItems,
      {
        assetId: availableAsset.id,
        durationMonths: 1,
        slotIndex: 1,
        rateKWD: initialRate,
        productionIncluded: false,
      },
    ]);
  };

  const updateBookingItem = (index: number, field: string, val: any) => {
    const updated = [...bookingItems];
    const item = { ...updated[index], [field]: val };

    if (field === 'assetId' || field === 'durationMonths') {
      const asset = assets.find((a) => a.id === (field === 'assetId' ? val : item.assetId));
      if (asset) {
        const dur = field === 'durationMonths' ? Number(val) : item.durationMonths;
        let rate = asset.baseRate1M || 0;
        if (dur === 3 && asset.baseRate3M) rate = asset.baseRate3M;
        else if (dur === 6 && asset.baseRate6M) rate = asset.baseRate6M;
        else if (dur === 12 && asset.baseRate12M) rate = asset.baseRate12M;
        item.rateKWD = rate;
      }
    }

    updated[index] = item;
    setBookingItems(updated);
  };

  const removeBookingItem = (index: number) => {
    setBookingItems(bookingItems.filter((_, idx) => idx !== index));
  };

  const grossValueKWD = bookingItems.reduce((acc, curr) => acc + (Number(curr.rateKWD) || 0), 0);
  let discountAmountKWD = 0;
  if (discountType === 'PERCENTAGE' && discountValue > 0) {
    discountAmountKWD = Math.round(grossValueKWD * (discountValue / 100));
  } else if (discountType === 'FIXED_AMOUNT' && discountValue > 0) {
    discountAmountKWD = Math.min(grossValueKWD, discountValue);
  }
  const netValueKWD = Math.max(0, grossValueKWD - discountAmountKWD);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setErrorMsg('Please enter a campaign deal title');
      return;
    }
    if (!selectedCompanyId) {
      setErrorMsg('Please select a company');
      return;
    }

    // Check for any hard booking conflicts on selected placements
    const conflictingItem = bookingItems.find((item) => !checkAssetAvailability(item.assetId).available);
    if (conflictingItem) {
      const conflictingAsset = assets.find((a) => a.id === conflictingItem.assetId);
      const status = checkAssetAvailability(conflictingItem.assetId);
      setErrorMsg(
        `Exclusive Booking Conflict: ${conflictingAsset?.name || 'Selected asset'} (${conflictingAsset?.code || ''}) has a confirmed booking during ${targetStartDate} to ${targetEndDate} (${status.message || 'Booked'}). Please pick an available placement or adjust campaign dates.`
      );
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      const payload = {
        title,
        companyId: selectedCompanyId,
        contactId: selectedContactId || null,
        stage: 'RFP_RECEIVED',
        targetStartDate,
        targetEndDate,
        aviationApproval,
        flammabilityCertified,
        scannerChecked,
        notes,
        discountType,
        discountValue,
        bookingSlots: bookingItems.map((item) => ({
          assetId: item.assetId,
          startDate: targetStartDate,
          endDate: targetEndDate,
          slotIndex: item.slotIndex,
          agreedRateKWD: item.rateKWD,
          productionIncluded: item.productionIncluded,
        })),
      };

      const res = await fetch('/api/deals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        setErrorMsg(data.error || 'Failed to create deal. Please verify dates and inventory availability.');
        setLoading(false);
        return;
      }

      onDealCreated();
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Something went wrong while creating deal');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const currentCompany = companies.find((c) => c.id === selectedCompanyId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="w-full max-w-3xl rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#002B66] via-[#0B2545] to-[#00A3E0] p-6 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-white/10 p-2.5 backdrop-blur-md">
              <Sparkles className="h-6 w-6 text-[#FFC72C]" />
            </div>
            <div>
              <h3 className="text-xl font-bold tracking-tight">Create New Media Proposal / Deal</h3>
              <p className="text-xs text-sky-200 mt-0.5">
                Jazeera Airways Terminal 5 & Fleet In-Flight Inventory Booking Engine
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {errorMsg && (
            <div className="rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 p-3.5 text-xs text-red-700 dark:text-red-300 font-medium">
              {errorMsg}
            </div>
          )}

          {/* Title & Client */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                Campaign / Deal Title *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. NBK Summer Miles Campaign - Mega Screen & Cabin Domination"
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2.5 text-sm text-slate-900 dark:text-slate-100 focus:border-[#00A3E0] focus:ring-1 focus:ring-[#00A3E0]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                Advertiser / Media Agency *
              </label>
              <select
                value={selectedCompanyId}
                onChange={(e) => handleCompanyChange(e.target.value)}
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2.5 text-sm text-slate-900 dark:text-slate-100 focus:border-[#00A3E0]"
              >
                {companies.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.type === 'AGENCY' ? 'Agency' : 'Direct Client'})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                Primary Contact Person
              </label>
              <select
                value={selectedContactId}
                onChange={(e) => setSelectedContactId(e.target.value)}
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2.5 text-sm text-slate-900 dark:text-slate-100 focus:border-[#00A3E0]"
              >
                {currentCompany?.contacts?.map((contact: any) => (
                  <option key={contact.id} value={contact.id}>
                    {contact.name} - {contact.role} ({contact.email})
                  </option>
                )) || <option value="">No contacts found</option>}
              </select>
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-sky-600" />
                Target Flight Start Date
              </label>
              <input
                type="date"
                value={targetStartDate}
                onChange={(e) => setTargetStartDate(e.target.value)}
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-sky-600" />
                Target Flight End Date
              </label>
              <input
                type="date"
                value={targetEndDate}
                onChange={(e) => setTargetEndDate(e.target.value)}
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs"
              />
            </div>
          </div>

          {/* Media Inventory Selection */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Media Inventory Line Items ({bookingItems.length})
                </h4>
                <p className="text-[11px] text-slate-500">
                  Select Jazeera assets, tier durations, and digital slot loops
                </p>
              </div>
              <button
                type="button"
                onClick={addBookingItem}
                className="flex items-center gap-1 rounded-lg bg-[#002B66] text-white px-3 py-1.5 text-xs font-semibold hover:bg-blue-900 transition-colors shadow-sm"
              >
                <Plus className="h-3.5 w-3.5" />
                Add Asset
              </button>
            </div>

            {bookingItems.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-300 dark:border-slate-700 p-6 text-center text-xs text-slate-500">
                No inventory assets selected yet. Click &quot;Add Asset&quot; to pick from Jazeera T5 and Fleet media catalog.
              </div>
            ) : (
              <div className="space-y-3">
                {bookingItems.map((item, idx) => {
                  const asset = assets.find((a) => a.id === item.assetId);
                  return (
                    <div
                      key={idx}
                      className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/50 p-4 space-y-3"
                    >
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-center">
                        <div className="md:col-span-2">
                          <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                            Media Asset
                          </label>
                          <select
                            value={item.assetId}
                            onChange={(e) => updateBookingItem(idx, 'assetId', e.target.value)}
                            className="w-full text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-2 font-medium"
                          >
                            {assets.map((a) => {
                              const avail = checkAssetAvailability(a.id);
                              return (
                                <option key={a.id} value={a.id}>
                                  [{a.code}] {a.name} ({avail.available ? '✓ Available' : '⚠️ Booked'})
                                </option>
                              );
                            })}
                          </select>
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                            Duration Tier
                          </label>
                          <select
                            value={item.durationMonths}
                            onChange={(e) => updateBookingItem(idx, 'durationMonths', e.target.value)}
                            className="w-full text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-2 font-medium"
                          >
                            <option value={1}>1 Month Rate</option>
                            <option value={3}>3 Months Rate</option>
                            <option value={6}>6 Months Rate</option>
                            <option value={12}>1 Year Rate</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                            Agreed Rate (KWD)
                          </label>
                          <input
                            type="number"
                            value={item.rateKWD}
                            onChange={(e) => updateBookingItem(idx, 'rateKWD', Number(e.target.value))}
                            className="w-full text-xs font-bold text-[#002B66] dark:text-sky-400 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-2"
                          />
                        </div>
                      </div>

                      {/* Conflict Alert Banner if Item is Booked */}
                      {!checkAssetAvailability(item.assetId).available && (
                        <div className="flex items-center gap-2 p-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-[11px] text-amber-800 dark:text-amber-200">
                          <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
                          <span>
                            ⚠️ {checkAssetAvailability(item.assetId).message} during campaign window ({targetStartDate} to {targetEndDate}). Please switch placement or choose alternative dates.
                          </span>
                        </div>
                      )}

                      <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-700 text-xs">
                        <div className="flex items-center gap-4">
                          {asset?.isDigitalLoop && (
                            <div className="flex items-center gap-2">
                              <span className="text-[11px] text-slate-500">Digital Slot:</span>
                              <select
                                value={item.slotIndex}
                                onChange={(e) =>
                                  updateBookingItem(idx, 'slotIndex', Number(e.target.value))
                                }
                                className="text-xs rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-2 py-0.5"
                              >
                                {[1, 2, 3, 4, 5, 6].map((num) => (
                                  <option key={num} value={num}>
                                    Slot {num} of 6 (10s)
                                  </option>
                                ))}
                              </select>
                            </div>
                          )}

                          <label className="flex items-center gap-1.5 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={item.productionIncluded}
                              onChange={(e) =>
                                updateBookingItem(idx, 'productionIncluded', e.target.checked)
                              }
                              className="rounded border-slate-300 text-sky-600 h-4 w-4"
                            />
                            <span className="text-[11px] text-slate-600 dark:text-slate-300">
                              Production & Printing Included
                            </span>
                          </label>
                        </div>

                        <button
                          type="button"
                          onClick={() => removeBookingItem(idx)}
                          className="text-red-500 hover:text-red-700 p-1 transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}

                {/* Commercial Discount Engine */}
                <div className="p-4 rounded-xl border border-sky-100 dark:border-sky-950 bg-sky-50/60 dark:bg-sky-950/20 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                      Commercial Discount & Agency Margins
                    </span>

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

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Discount Mechanism
                      </label>
                      <select
                        value={discountType}
                        onChange={(e) => setDiscountType(e.target.value as any)}
                        className="w-full text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-2 text-slate-900 dark:text-slate-100"
                      >
                        <option value="NONE">No Discount (Standard Rate Card)</option>
                        <option value="PERCENTAGE">Percentage (%) Discount</option>
                        <option value="FIXED_AMOUNT">Fixed Lump-Sum (KWD) Deduction</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
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
                          className="w-full text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-2 pr-10 font-bold text-slate-900 dark:text-slate-100 disabled:opacity-50"
                        />
                        <span className="absolute right-3 top-2 text-[11px] text-slate-400 font-bold">
                          {discountType === 'PERCENTAGE' ? '%' : 'KWD'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Financial Summary */}
                  <div className="pt-2 border-t border-sky-200 dark:border-sky-900 grid grid-cols-3 gap-2 text-center">
                    <div className="p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Gross Media</span>
                      <span className="text-xs font-black text-slate-800 dark:text-slate-200">{grossValueKWD.toLocaleString()} KWD</span>
                    </div>
                    <div className="p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                      <span className="text-[10px] uppercase font-bold text-red-500 block">Discount</span>
                      <span className="text-xs font-black text-red-600 dark:text-red-400">
                        {discountAmountKWD > 0 ? `-${discountAmountKWD.toLocaleString()} KWD` : '0 KWD'}
                      </span>
                    </div>
                    <div className="p-2 rounded-lg bg-[#002B66] text-white">
                      <span className="text-[10px] uppercase font-bold text-sky-200 block">Net Payable</span>
                      <span className="text-xs font-black text-[#FFC72C]">{netValueKWD.toLocaleString()} KWD</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Aviation Safety Pre-Check */}
          <div className="rounded-xl border border-amber-200 dark:border-amber-800/60 bg-amber-50/50 dark:bg-amber-950/20 p-4 space-y-2">
            <div className="flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 text-amber-600" />
              <h5 className="text-xs font-bold text-amber-900 dark:text-amber-200 uppercase tracking-wider">
                Aviation Safety Gate Notice
              </h5>
            </div>
            <p className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
              New deals are initialized at <strong>RFP Received</strong>. The CRM will enforce the 
              <strong> Aviation & Material Safety Approval Gate</strong> before transitioning to <strong>IO Signed</strong>, ensuring flammability (FAR/JAR-25) and scanner compliance.
            </p>
          </div>

          {/* Footer Submit */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 text-xs font-bold bg-[#002B66] hover:bg-[#003882] text-white rounded-lg shadow-md transition-all flex items-center gap-2 cursor-pointer"
            >
              {loading ? 'Creating Proposal...' : 'Create Media Deal'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
