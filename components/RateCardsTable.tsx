'use client';

import React, { useMemo, useState } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  flexRender,
  ColumnDef,
  SortingState,
} from '@tanstack/react-table';
import {
  Search,
  ArrowUpDown,
  Download,
  Filter,
  CheckCircle2,
  Shield,
  Clock,
  Sparkles,
} from 'lucide-react';
import { InventoryAssetWithBookings, formatKWD } from '@/lib/types';

interface RateCardsTableProps {
  assets: InventoryAssetWithBookings[];
  onBookAsset: (assetId: string) => void;
}

export function RateCardsTable({ assets, onBookAsset }: RateCardsTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');

  const filteredData = useMemo(() => {
    if (categoryFilter === 'ALL') return assets;
    return assets.filter((a) => a.category === categoryFilter);
  }, [assets, categoryFilter]);

  const columns = useMemo<ColumnDef<InventoryAssetWithBookings>[]>(
    () => [
      {
        accessorKey: 'code',
        header: ({ column }) => (
          <button
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="flex items-center gap-1 font-bold text-xs"
          >
            Asset Code
            <ArrowUpDown className="h-3 w-3" />
          </button>
        ),
        cell: (info) => (
          <div className="font-mono text-xs font-bold text-[#002B66] dark:text-sky-400 bg-blue-50 dark:bg-blue-950/80 px-2 py-1 rounded inline-block">
            {info.getValue() as string}
          </div>
        ),
      },
      {
        accessorKey: 'name',
        header: 'Media Product & Location',
        cell: (info) => {
          const row = info.row.original;
          return (
            <div>
              <div className="font-bold text-xs text-slate-900 dark:text-slate-100">{row.name}</div>
              <div className="text-[11px] text-slate-500 truncate max-w-xs">{row.locationDesc}</div>
            </div>
          );
        },
      },
      {
        accessorKey: 'environment',
        header: 'Environment',
        cell: (info) => {
          const val = info.getValue() as string;
          return (
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
              {val.replace('_', ' ')}
            </span>
          );
        },
      },
      {
        accessorKey: 'dimensions',
        header: 'Dimensions & Scale',
        cell: (info) => (
          <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
            {info.getValue() as string}
          </span>
        ),
      },
      {
        accessorKey: 'baseRate1M',
        header: ({ column }) => (
          <button
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="flex items-center gap-1 font-bold text-xs"
          >
            1 Month
            <ArrowUpDown className="h-3 w-3" />
          </button>
        ),
        cell: (info) => {
          const val = info.getValue() as number | null;
          return val ? (
            <span className="font-mono font-bold text-xs text-slate-900 dark:text-slate-100">
              {formatKWD(val)}
            </span>
          ) : (
            <span className="text-[11px] text-slate-400">-</span>
          );
        },
      },
      {
        accessorKey: 'baseRate3M',
        header: '3 Months',
        cell: (info) => {
          const val = info.getValue() as number | null;
          return val ? (
            <span className="font-mono font-bold text-xs text-slate-700 dark:text-slate-300">
              {formatKWD(val)}
            </span>
          ) : (
            <span className="text-[11px] text-slate-400">-</span>
          );
        },
      },
      {
        accessorKey: 'baseRate6M',
        header: '6 Months',
        cell: (info) => {
          const val = info.getValue() as number | null;
          return val ? (
            <span className="font-mono font-bold text-xs text-slate-700 dark:text-slate-300">
              {formatKWD(val)}
            </span>
          ) : (
            <span className="text-[11px] text-slate-400">-</span>
          );
        },
      },
      {
        accessorKey: 'baseRate12M',
        header: '1 Year (Annual)',
        cell: (info) => {
          const val = info.getValue() as number | null;
          return val ? (
            <span className="font-mono font-bold text-xs text-emerald-600 dark:text-emerald-400">
              {formatKWD(val)}
            </span>
          ) : (
            <span className="text-[11px] text-slate-400">-</span>
          );
        },
      },
      {
        accessorKey: 'productionLeadWeeks',
        header: 'Lead Time',
        cell: (info) => (
          <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 flex items-center gap-1">
            <Clock className="h-3 w-3 text-slate-400" />
            {info.getValue() as number} Wks
          </span>
        ),
      },
      {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => (
          <button
            onClick={() => onBookAsset(row.original.id)}
            className="px-2.5 py-1 rounded-lg bg-[#002B66] text-white text-[11px] font-bold hover:bg-blue-900 transition-colors shadow-sm"
          >
            Book
          </button>
        ),
      },
    ],
    [onBookAsset]
  );

  const table = useReactTable({
    data: filteredData,
    columns,
    state: {
      sorting,
      globalFilter,
    },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: {
        pageSize: 15,
      },
    },
  });

  return (
    <div className="space-y-4">
      {/* Table Toolbar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-2 w-full md:w-auto">
          <Filter className="h-4 w-4 text-slate-400" />
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-2 text-slate-800 dark:text-slate-200"
          >
            <option value="ALL">All Categories ({assets.length})</option>
            <option value="DIGITAL_SCREEN">Digital Screens (10s Loop)</option>
            <option value="LIGHTBOX">Static Lightboxes</option>
            <option value="WRAP">Terminal & Fuselage Wraps</option>
            <option value="SEATBACK">Seatback Stickers</option>
            <option value="OVERHEAD_BIN">Overhead Bins</option>
            <option value="MAGAZINE">In-Flight Magazine</option>
            <option value="BOARDING_PASS">Boarding Passes</option>
            <option value="E_TICKET">E-Tickets & Web</option>
            <option value="TROLLEY">Baggage Trolleys</option>
          </select>
        </div>

        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search rate cards, dimensions, specs..."
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="w-full text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 pl-9 pr-3 py-2 text-slate-800 dark:text-slate-200"
          />
        </div>
      </div>

      {/* TanStack High-Density Table */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              {table.getHeaderGroups().map((headerGroup) => (
                <tr
                  key={headerGroup.id}
                  className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-[11px] uppercase tracking-wider text-slate-600 dark:text-slate-400"
                >
                  {headerGroup.headers.map((header) => (
                    <th key={header.id} className="p-3.5 font-bold">
                      {header.isPlaceholder
                        ? null
                        : flexRender(header.column.columnDef.header, header.getContext())}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              {table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors"
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="p-3.5 align-middle">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination controls */}
        <div className="p-3.5 bg-slate-50 dark:bg-slate-800/40 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
          <div>
            Showing {table.getRowModel().rows.length} of {filteredData.length} media inventory
            assets
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              className="px-3 py-1 rounded border border-slate-200 dark:border-slate-700 disabled:opacity-40"
            >
              Previous
            </button>
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
            </span>
            <button
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              className="px-3 py-1 rounded border border-slate-200 dark:border-slate-700 disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
