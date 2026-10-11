'use client';

import React, { useState } from 'react';
import {
  Monitor,
  Plane,
  Layers,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Clock,
  Calendar,
  Building,
  Search,
  Filter,
  Users,
} from 'lucide-react';
import { InventoryAssetWithBookings, formatKWD, formatDate } from '@/lib/types';

interface AvailsEngineProps {
  assets: (InventoryAssetWithBookings & {
    occupiedSlots: number;
    availableSlots: number;
    occupancyPercentage: number;
    bookedUnits: number;
    activeBookingsCount: number;
  })[];
  onBookAsset: (assetId: string) => void;
}

export function AvailsEngine({ assets, onBookAsset }: AvailsEngineProps) {
  const [envFilter, setEnvFilter] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedAssetForDetails, setSelectedAssetForDetails] = useState<any | null>(null);

  const filteredAssets = assets.filter((asset) => {
    const matchesEnv = envFilter === 'ALL' || asset.environment === envFilter;
    const matchesSearch =
      asset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asset.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asset.locationDesc.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesEnv && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Top Filter and Search Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-2 w-full md:w-auto">
          <button
            onClick={() => setEnvFilter('ALL')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              envFilter === 'ALL'
                ? 'bg-[#002B66] text-white shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
            }`}
          >
            All Media ({assets.length})
          </button>
          <button
            onClick={() => setEnvFilter('T5_GROUND')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              envFilter === 'T5_GROUND'
                ? 'bg-[#002B66] text-white shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
            }`}
          >
            Terminal 5 Ground
          </button>
          <button
            onClick={() => setEnvFilter('INFLIGHT')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              envFilter === 'INFLIGHT'
                ? 'bg-[#002B66] text-white shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
            }`}
          >
            In-Flight Fleet (A320)
          </button>
          <button
            onClick={() => setEnvFilter('DIGITAL_PRINT')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              envFilter === 'DIGITAL_PRINT'
                ? 'bg-[#002B66] text-white shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
            }`}
          >
            Direct Passenger Touchpoints
          </button>
        </div>

        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search code, location, screen..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/80 pl-9 pr-3 py-2 text-slate-800 dark:text-slate-200 focus:border-[#00A3E0] focus:ring-1 focus:ring-[#00A3E0]"
          />
        </div>
      </div>

      {/* Avails Matrix Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredAssets.map((asset) => {
          const isDigital = asset.isDigitalLoop;
          const isFleet = asset.environment === 'INFLIGHT' && asset.totalUnits === 24;

          return (
            <div
              key={asset.id}
              className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group"
            >
              <div>
                {/* Header Code and Badges */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold px-2 py-1 rounded-md bg-[#002B66]/10 text-[#002B66] dark:bg-sky-950/80 dark:text-sky-400 border border-blue-200 dark:border-blue-900">
                      {asset.code}
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                      {asset.category.replace(/_/g, ' ')}
                    </span>
                  </div>

                  {isDigital ? (
                    <span className="flex items-center gap-1 text-[11px] font-bold text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/60 px-2 py-0.5 rounded-full border border-sky-200 dark:border-sky-800">
                      <Monitor className="h-3 w-3" />
                      10s Loop
                    </span>
                  ) : isFleet ? (
                    <span className="flex items-center gap-1 text-[11px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded-full border border-indigo-200 dark:border-indigo-800">
                      <Plane className="h-3 w-3" />
                      24 A320 Fleet
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-[11px] font-bold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
                      Exclusive Static
                    </span>
                  )}
                </div>

                {/* Asset Title */}
                <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 mt-3 group-hover:text-[#002B66] dark:group-hover:text-sky-400 transition-colors">
                  {asset.name}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1.5">
                  <Building className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                  <span className="truncate">{asset.locationDesc}</span>
                </p>

                {/* Dimensions & Lead Time */}
                <div className="mt-3.5 grid grid-cols-2 gap-2 text-[11px] text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/40 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">
                      Dimensions:
                    </span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {asset.dimensions}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">
                      Lead Time:
                    </span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {asset.productionLeadWeeks} Weeks
                    </span>
                  </div>
                </div>

                {/* Avails Capacity Engine Display */}
                <div className="mt-4 p-3 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-inner">
                  {isDigital ? (
                    <div>
                      <div className="flex items-center justify-between text-xs mb-1.5">
                        <span className="font-bold text-slate-700 dark:text-slate-300">
                          Digital Loop Occupancy:
                        </span>
                        <span className="font-mono font-bold text-sky-600 dark:text-sky-400">
                          {asset.occupiedSlots} / {asset.loopMaxClients} Slots Booked
                        </span>
                      </div>
                      {/* Loop Progress Bar */}
                      <div className="w-full bg-slate-200 dark:bg-slate-700 h-2.5 rounded-full overflow-hidden flex">
                        {Array.from({ length: asset.loopMaxClients }).map((_, i) => (
                          <div
                            key={i}
                            className={`h-full flex-1 border-r border-white dark:border-slate-800 last:border-0 ${
                              i < asset.occupiedSlots
                                ? 'bg-sky-500 dark:bg-sky-400'
                                : 'bg-slate-200 dark:bg-slate-700'
                            }`}
                          />
                        ))}
                      </div>
                      <div className="mt-1.5 flex justify-between text-[10px] text-slate-500">
                        <span>{asset.availableSlots} Available for Booking</span>
                        <span>{10 * asset.loopMaxClients}s Total Loop</span>
                      </div>
                    </div>
                  ) : isFleet ? (
                    <div>
                      <div className="flex items-center justify-between text-xs mb-1.5">
                        <span className="font-bold text-slate-700 dark:text-slate-300">
                          Fleet Active Allocation:
                        </span>
                        <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">
                          {asset.bookingSlots.length} / 24 A320 Aircraft
                        </span>
                      </div>
                      <div className="w-full bg-slate-200 dark:bg-slate-700 h-2.5 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-indigo-500 rounded-full"
                          style={{
                            width: `${Math.min(100, (asset.bookingSlots.length / 24) * 100)}%`,
                          }}
                        />
                      </div>
                      <div className="mt-1.5 flex justify-between text-[10px] text-slate-500">
                        <span>{24 - asset.bookingSlots.length} Aircraft Available</span>
                        <span>Full Fleet Coverage</span>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="font-bold text-slate-700 dark:text-slate-300">
                          Inventory Status:
                        </span>
                        <span
                          className={`font-bold px-2 py-0.5 rounded text-[10px] ${
                            asset.activeBookingsCount > 0
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300'
                              : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300'
                          }`}
                        >
                          {asset.activeBookingsCount > 0 ? 'Active Bookings' : '100% Available'}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500">
                        {asset.totalUnits} Total Units ({asset.activeBookingsCount} Active Contract)
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Bottom Actions and Pricing */}
              <div className="mt-5 pt-3.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">
                    Starting Monthly Rate:
                  </span>
                  <span className="font-black text-sm text-[#002B66] dark:text-sky-400">
                    {asset.baseRate1M ? formatKWD(asset.baseRate1M) : 'Custom Quote'}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setSelectedAssetForDetails(asset)}
                    className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    View Slots
                  </button>
                  <button
                    onClick={() => onBookAsset(asset.id)}
                    className="text-xs font-bold px-3.5 py-1.5 rounded-lg bg-[#002B66] hover:bg-blue-900 text-white shadow-sm transition-all"
                  >
                    Book Avails
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected Asset Slots Details Modal */}
      {selectedAssetForDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-xl rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
            <div className="bg-[#002B66] p-5 text-white flex items-center justify-between">
              <div>
                <span className="font-mono text-xs text-sky-300">
                  {selectedAssetForDetails.code}
                </span>
                <h3 className="text-base font-bold">{selectedAssetForDetails.name}</h3>
              </div>
              <button
                onClick={() => setSelectedAssetForDetails(null)}
                className="text-white/80 hover:text-white p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
              <div className="text-xs text-slate-600 dark:text-slate-400">
                <strong>Location:</strong> {selectedAssetForDetails.locationDesc}
              </div>

              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Active Bookings & Slot Allocation
              </h4>

              {selectedAssetForDetails.bookingSlots.length === 0 ? (
                <div className="p-4 rounded-xl border border-dashed text-center text-xs text-slate-500">
                  No active bookings. All slots are 100% available for sale.
                </div>
              ) : (
                <div className="space-y-2">
                  {selectedAssetForDetails.bookingSlots.map((b: any, idx: number) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between text-xs"
                    >
                      <div>
                        <span className="font-bold text-slate-900 dark:text-slate-100">
                          {b.deal ? b.deal.title : 'Direct Client'}
                        </span>
                        <div className="text-[11px] text-slate-500">
                          {b.deal?.company?.name} • Stage: {b.deal?.stage}
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="font-mono font-bold text-sky-600">
                          Slot {b.slotIndex}
                        </span>
                        <div className="text-[10px] text-slate-500">
                          {formatDate(b.startDate)} - {formatDate(b.endDate)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="pt-2 border-t text-xs text-slate-500">
                <strong>Technical Specifications:</strong>
                <p className="mt-1">{selectedAssetForDetails.technicalSpecs}</p>
              </div>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border-t flex justify-end">
              <button
                onClick={() => setSelectedAssetForDetails(null)}
                className="px-4 py-2 text-xs font-bold bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
