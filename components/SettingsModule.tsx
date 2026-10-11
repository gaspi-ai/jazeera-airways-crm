'use client';

import React, { useState, useEffect } from 'react';
import {
  Settings,
  Banknote,
  ShieldCheck,
  Building2,
  Sliders,
  Save,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  Percent,
  FileText,
  Clock,
  Sparkles,
  Plane,
} from 'lucide-react';
import { InventoryAssetWithBookings, formatKWD } from '@/lib/types';

interface SettingsModuleProps {
  assets: InventoryAssetWithBookings[];
  onRefreshAssets: () => void;
}

export function SettingsModule({ assets, onRefreshAssets }: SettingsModuleProps) {
  const [activeSubTab, setActiveSubTab] = useState<'ratecards' | 'agency' | 'compliance' | 'profile'>('ratecards');
  const [settings, setSettings] = useState<any>({
    agencyCommissionPreset: 15,
    defaultDiscountPresets: [5, 10, 15, 20],
    currency: 'KWD',
    entityName: 'Jazeera Airways K.S.C.P.',
    department: 'Commercial Media & In-Flight Sales Directorate',
    taxRegistration: 'KW-DGCA-MED-041',
    minProductionLeadWeeks: 4,
    flammabilityStandard: 'FAA FAR 25.853 / EASA CS-25 (12-second vertical flammability)',
    scannerStandard: 'IATA 722e Optical Reflection Compliance',
    dgcaPermitRequired: true,
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Asset inline editing state
  const [editingAssetId, setEditingAssetId] = useState<string | null>(null);
  const [rate1M, setRate1M] = useState<number | ''>('');
  const [rate3M, setRate3M] = useState<number | ''>('');
  const [rate6M, setRate6M] = useState<number | ''>('');
  const [rate12M, setRate12M] = useState<number | ''>('');
  const [leadWeeks, setLeadWeeks] = useState<number>(4);
  const [assetStatus, setAssetStatus] = useState<string>('AVAILABLE');
  const [savingAsset, setSavingAsset] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/settings');
      const data = await res.json();
      setSettings(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const showNotification = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  const handleSaveSettings = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });

      if (!res.ok) {
        throw new Error('Failed to save settings');
      }

      showNotification('success', 'System settings saved and applied to all CRM workflows.');
    } catch (err: any) {
      showNotification('error', err.message || 'Error saving settings');
    } finally {
      setSaving(false);
    }
  };

  const handleStartEditAsset = (asset: any) => {
    setEditingAssetId(asset.id);
    setRate1M(asset.baseRate1M ?? '');
    setRate3M(asset.baseRate3M ?? '');
    setRate6M(asset.baseRate6M ?? '');
    setRate12M(asset.baseRate12M ?? '');
    setLeadWeeks(asset.productionLeadWeeks || 4);
    setAssetStatus(asset.status || 'AVAILABLE');
  };

  const handleSaveAssetRate = async (assetId: string) => {
    setSavingAsset(true);
    try {
      const res = await fetch(`/api/inventory/${assetId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          baseRate1M: rate1M === '' ? null : Number(rate1M),
          baseRate3M: rate3M === '' ? null : Number(rate3M),
          baseRate6M: rate6M === '' ? null : Number(rate6M),
          baseRate12M: rate12M === '' ? null : Number(rate12M),
          productionLeadWeeks: Number(leadWeeks),
          status: assetStatus,
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to update asset rate');
      }

      showNotification('success', 'Asset rate cards and specifications updated successfully.');
      setEditingAssetId(null);
      onRefreshAssets();
    } catch (err: any) {
      showNotification('error', err.message || 'Error saving asset rates');
    } finally {
      setSavingAsset(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`p-4 rounded-xl text-xs font-semibold flex items-center justify-between border shadow-lg animate-in fade-in ${
            toast.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/70 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
              : 'bg-red-50 dark:bg-red-950/70 border-red-300 dark:border-red-800 text-red-800 dark:text-red-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {toast.type === 'success' ? (
              <CheckCircle className="h-4 w-4 text-emerald-600" />
            ) : (
              <AlertTriangle className="h-4 w-4 text-red-600" />
            )}
            <span>{toast.message}</span>
          </div>
          <button onClick={() => setToast(null)} className="cursor-pointer">
            ✕
          </button>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#002B66] via-[#0B2545] to-[#133E87] rounded-2xl p-6 text-white shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-[#FFC72C] text-[#002B66] font-bold text-[10px] uppercase px-2 py-0.5 rounded">
              Administration & Policy Center
            </span>
            <span className="text-xs text-sky-200">Terminal 5 & Fleet Commercial Network</span>
          </div>
          <h2 className="text-xl font-bold mt-1">CRM Master Settings & Pricing Engine</h2>
          <p className="text-xs text-sky-100 mt-0.5 max-w-xl">
            Configure official rate card baselines, agency commission presets, aviation flammability rules, and Jazeera legal entity profiles.
          </p>
        </div>

        <button
          onClick={() => handleSaveSettings()}
          disabled={saving}
          className="flex items-center gap-2 rounded-xl bg-[#FFC72C] hover:bg-[#ffcf40] text-[#002B66] px-5 py-2.5 text-xs font-black shadow-lg transition-all shrink-0 cursor-pointer disabled:opacity-50"
        >
          {saving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          <span>Save All Settings</span>
        </button>
      </div>

      {/* Settings Navigation Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 space-x-2">
        {[
          { id: 'ratecards', label: 'Rate Card Overrides', icon: Banknote },
          { id: 'agency', label: 'Agency Commissions & Margins', icon: Percent },
          { id: 'compliance', label: 'Aviation Compliance Checklist', icon: ShieldCheck },
          { id: 'profile', label: 'System Profile & Branding', icon: Building2 },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer ${
                isActive
                  ? 'border-[#002B66] dark:border-sky-400 text-[#002B66] dark:text-sky-400 bg-sky-50/50 dark:bg-sky-950/30'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab 1: Rate Card & Pricing Overrides */}
      {activeSubTab === 'ratecards' && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                T5 Ground & Fleet In-Flight Media Catalog ({assets.length} Inventory Units)
              </h3>
              <p className="text-xs text-slate-500">
                Click any line item to override default base rates (1M, 3M, 6M, 12M in KWD) and production lead times.
              </p>
            </div>
            <button
              onClick={onRefreshAssets}
              className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 flex items-center gap-1 cursor-pointer"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>Refresh Assets</span>
            </button>
          </div>

          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-[11px] uppercase font-bold text-slate-500">
                    <th className="py-3 px-4">Asset Code</th>
                    <th className="py-3 px-4">Placement / Name</th>
                    <th className="py-3 px-4">1 Month</th>
                    <th className="py-3 px-4">3 Months</th>
                    <th className="py-3 px-4">6 Months</th>
                    <th className="py-3 px-4">12 Months</th>
                    <th className="py-3 px-4">Lead Time</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {assets.map((asset) => {
                    const isEditing = editingAssetId === asset.id;

                    return (
                      <tr key={asset.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                        <td className="py-3 px-4 font-mono font-bold text-[#002B66] dark:text-sky-400">
                          {asset.code}
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900 dark:text-slate-100">{asset.name}</div>
                          <div className="text-[10px] text-slate-400">{asset.dimensions} • {asset.environment.replace('_', ' ')}</div>
                        </td>

                        {/* 1 Month */}
                        <td className="py-3 px-4">
                          {isEditing ? (
                            <input
                              type="number"
                              value={rate1M}
                              onChange={(e) => setRate1M(e.target.value === '' ? '' : Number(e.target.value))}
                              className="w-20 p-1 text-xs rounded border border-slate-300 dark:border-slate-700 font-bold"
                            />
                          ) : (
                            <span className="font-semibold text-slate-800 dark:text-slate-200">
                              {asset.baseRate1M ? formatKWD(asset.baseRate1M) : '—'}
                            </span>
                          )}
                        </td>

                        {/* 3 Months */}
                        <td className="py-3 px-4">
                          {isEditing ? (
                            <input
                              type="number"
                              value={rate3M}
                              onChange={(e) => setRate3M(e.target.value === '' ? '' : Number(e.target.value))}
                              className="w-20 p-1 text-xs rounded border border-slate-300 dark:border-slate-700 font-bold"
                            />
                          ) : (
                            <span className="font-semibold text-slate-800 dark:text-slate-200">
                              {asset.baseRate3M ? formatKWD(asset.baseRate3M) : '—'}
                            </span>
                          )}
                        </td>

                        {/* 6 Months */}
                        <td className="py-3 px-4">
                          {isEditing ? (
                            <input
                              type="number"
                              value={rate6M}
                              onChange={(e) => setRate6M(e.target.value === '' ? '' : Number(e.target.value))}
                              className="w-20 p-1 text-xs rounded border border-slate-300 dark:border-slate-700 font-bold"
                            />
                          ) : (
                            <span className="font-semibold text-slate-800 dark:text-slate-200">
                              {asset.baseRate6M ? formatKWD(asset.baseRate6M) : '—'}
                            </span>
                          )}
                        </td>

                        {/* 12 Months */}
                        <td className="py-3 px-4">
                          {isEditing ? (
                            <input
                              type="number"
                              value={rate12M}
                              onChange={(e) => setRate12M(e.target.value === '' ? '' : Number(e.target.value))}
                              className="w-20 p-1 text-xs rounded border border-slate-300 dark:border-slate-700 font-bold"
                            />
                          ) : (
                            <span className="font-semibold text-slate-800 dark:text-slate-200">
                              {asset.baseRate12M ? formatKWD(asset.baseRate12M) : '—'}
                            </span>
                          )}
                        </td>

                        {/* Lead Time */}
                        <td className="py-3 px-4">
                          {isEditing ? (
                            <select
                              value={leadWeeks}
                              onChange={(e) => setLeadWeeks(Number(e.target.value))}
                              className="p-1 text-xs rounded border border-slate-300 dark:border-slate-700"
                            >
                              <option value={2}>2 Weeks</option>
                              <option value={3}>3 Weeks</option>
                              <option value={4}>4 Weeks</option>
                              <option value={6}>6 Weeks</option>
                            </select>
                          ) : (
                            <span className="text-slate-600 dark:text-slate-400">
                              {asset.productionLeadWeeks} weeks
                            </span>
                          )}
                        </td>

                        {/* Status */}
                        <td className="py-3 px-4">
                          {isEditing ? (
                            <select
                              value={assetStatus}
                              onChange={(e) => setAssetStatus(e.target.value)}
                              className="p-1 text-xs rounded border border-slate-300 dark:border-slate-700"
                            >
                              <option value="AVAILABLE">Available</option>
                              <option value="MAINTENANCE">Maintenance</option>
                              <option value="SOLD_OUT">Sold Out</option>
                            </select>
                          ) : (
                            <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                              {asset.status}
                            </span>
                          )}
                        </td>

                        {/* Action Buttons */}
                        <td className="py-3 px-4 text-right">
                          {isEditing ? (
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => handleSaveAssetRate(asset.id)}
                                disabled={savingAsset}
                                className="px-2.5 py-1 rounded bg-[#002B66] text-white text-[11px] font-bold hover:bg-blue-900 cursor-pointer disabled:opacity-50"
                              >
                                {savingAsset ? '...' : 'Save'}
                              </button>
                              <button
                                onClick={() => setEditingAssetId(null)}
                                className="px-2 py-1 rounded border border-slate-300 text-slate-500 text-[11px] hover:bg-slate-100 cursor-pointer"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => handleStartEditAsset(asset)}
                              className="px-2.5 py-1 rounded border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-[11px] font-semibold cursor-pointer"
                            >
                              Edit Rates
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Agency Commissions & Margins */}
      {activeSubTab === 'agency' && (
        <form onSubmit={handleSaveSettings} className="space-y-5 max-w-2xl">
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Percent className="h-4 w-4 text-[#002B66] dark:text-[#00A3E0]" />
              <span>Media Agency Commission Guidelines</span>
            </h3>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Standard Agency Commission Preset (%)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={0}
                  max={50}
                  value={settings.agencyCommissionPreset}
                  onChange={(e) =>
                    setSettings({ ...settings, agencyCommissionPreset: Number(e.target.value) })
                  }
                  className="w-32 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-2.5 font-bold"
                />
                <span className="text-xs text-slate-500 font-semibold">% margin applied to media buyers</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                This percentage will be offered as a 1-click preset when booking deals for registered media agencies (e.g. Impact BBDO, Wavemaker).
              </p>
            </div>

            <div className="pt-3 border-t border-slate-200 dark:border-slate-800">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Allowed Commercial Discount Tiers (%)
              </label>
              <div className="flex items-center gap-3">
                {[5, 10, 15, 20].map((tier) => (
                  <label key={tier} className="flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-300 font-medium">
                    <input
                      type="checkbox"
                      checked={settings.defaultDiscountPresets?.includes(tier)}
                      onChange={(e) => {
                        const current = settings.defaultDiscountPresets || [5, 10, 15, 20];
                        const next = e.target.checked
                          ? [...current, tier].sort((a, b) => a - b)
                          : current.filter((x: number) => x !== tier);
                        setSettings({ ...settings, defaultDiscountPresets: next });
                      }}
                      className="rounded text-[#002B66]"
                    />
                    <span>{tier}%</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200 dark:border-slate-800">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Default Currency Code
              </label>
              <input
                type="text"
                disabled
                value="KWD (Kuwaiti Dinar)"
                className="w-48 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 p-2 text-slate-600 font-bold"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2 rounded-xl bg-[#002B66] hover:bg-[#003882] text-white text-xs font-bold shadow-md cursor-pointer disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Update Commission Rules'}
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Tab 3: Aviation Compliance Checklist */}
      {activeSubTab === 'compliance' && (
        <form onSubmit={handleSaveSettings} className="space-y-5 max-w-2xl">
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-amber-600" />
              <span>Aviation Safety & Civil Aviation Directorate (DGCA) Protocols</span>
            </h3>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Aircraft Cabin Flammability Standard
              </label>
              <input
                type="text"
                value={settings.flammabilityStandard}
                onChange={(e) => setSettings({ ...settings, flammabilityStandard: e.target.value })}
                className="w-full text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-2.5 text-slate-900 dark:text-slate-100"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Enforced by Safety Approval Gate before IO legally executes.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Boarding Pass / Printed Scanner Standard
              </label>
              <input
                type="text"
                value={settings.scannerStandard}
                onChange={(e) => setSettings({ ...settings, scannerStandard: e.target.value })}
                className="w-full text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-2.5 text-slate-900 dark:text-slate-100"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Minimum Production Buffer (Weeks)
                </label>
                <input
                  type="number"
                  min={1}
                  max={12}
                  value={settings.minProductionLeadWeeks}
                  onChange={(e) =>
                    setSettings({ ...settings, minProductionLeadWeeks: Number(e.target.value) })
                  }
                  className="w-full text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-2.5 font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Kuwait DGCA Commercial Permit Mandatory
                </label>
                <select
                  value={String(settings.dgcaPermitRequired)}
                  onChange={(e) =>
                    setSettings({ ...settings, dgcaPermitRequired: e.target.value === 'true' })
                  }
                  className="w-full text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-2.5 font-semibold"
                >
                  <option value="true">Mandatory (Block without permit #)</option>
                  <option value="false">Optional</option>
                </select>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2 rounded-xl bg-[#002B66] hover:bg-[#003882] text-white text-xs font-bold shadow-md cursor-pointer disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Aviation Standards'}
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Tab 4: System Profile & Legal Branding */}
      {activeSubTab === 'profile' && (
        <form onSubmit={handleSaveSettings} className="space-y-5 max-w-2xl">
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Building2 className="h-4 w-4 text-[#002B66] dark:text-[#00A3E0]" />
              <span>Commercial Operator & Legal Signatory Entity</span>
            </h3>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Legal Entity Name
              </label>
              <input
                type="text"
                value={settings.entityName}
                onChange={(e) => setSettings({ ...settings, entityName: e.target.value })}
                className="w-full text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-2.5 text-slate-900 dark:text-slate-100 font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Commercial Division / Directorate
              </label>
              <input
                type="text"
                value={settings.department}
                onChange={(e) => setSettings({ ...settings, department: e.target.value })}
                className="w-full text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-2.5 text-slate-900 dark:text-slate-100"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Civil Aviation License / Concession Registration No.
              </label>
              <input
                type="text"
                value={settings.taxRegistration}
                onChange={(e) => setSettings({ ...settings, taxRegistration: e.target.value })}
                className="w-full text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-2.5 text-slate-900 dark:text-slate-100"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2 rounded-xl bg-[#002B66] hover:bg-[#003882] text-white text-xs font-bold shadow-md cursor-pointer disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Profile & Branding'}
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}
