'use client';

import React, { useState } from 'react';
import { Plane, Users, Clock, Luggage, Globe, Copy, Check, X, Sparkles, TrendingUp } from 'lucide-react';

interface PitchDeckStatsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PitchDeckStatsDrawer({ isOpen, onClose }: PitchDeckStatsDrawerProps) {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  if (!isOpen) return null;

  const stats = [
    {
      id: 'passengers',
      icon: Users,
      metric: '4.9 Million+',
      title: 'Annual High-Yield Passengers',
      subtitle: '30.5% Kuwait International Market Share',
      pitchCopy:
        'Jazeera Airways carries over 4.9M annual passengers through Terminal 5, capturing 30.5% market share at Kuwait International Airport with high-frequency business and leisure reach across GCC and Middle East.',
    },
    {
      id: 'fleet',
      icon: Plane,
      metric: '24 Modern Airbus A320s',
      title: 'Active Fleet Reach',
      subtitle: 'Operating to 60+ International Destinations',
      pitchCopy:
        'With 24 Airbus A320 aircraft flying to 60+ high-traffic destinations across GCC, Middle East, Europe, Central and South Asia, inflight assets deliver uninterrupted 2 to 5 hour direct consumer dwell time.',
    },
    {
      id: 'dwell',
      icon: Clock,
      metric: '15 Minutes Dwell Time',
      title: 'Rapid Check-in to Gate Processing',
      subtitle: 'Higher Retail & Gate Concourse Exposure',
      pitchCopy:
        'Terminal 5 provides an ultra-efficient 15-minute check-in to gate transit, allowing passengers maximum relaxed dwell time in the duty free, concourses, and gate lightboxes before flight departure.',
    },
    {
      id: 'baggage',
      icon: Luggage,
      metric: '1,200 Bags / Hour',
      title: 'Baggage Handling System Capacity',
      subtitle: 'Guaranteed 20-30 Min Carousel Eye-Level Exposure',
      pitchCopy:
        'T5 high-speed baggage handling processes 1,200 bags/hour, ensuring an average 20-30 minute focused passenger dwell time facing our 4x 75" 4K baggage carousel digital screens and arrival wall lightboxes.',
    },
    {
      id: 'exclusive_t5',
      icon: Globe,
      metric: 'Dedicated Terminal 5',
      title: 'Exclusive Jazeera Passenger Concourse',
      subtitle: 'Zero Clutter from Competing Airlines',
      pitchCopy:
        'Terminal 5 is Jazeera Airways’ exclusive dedicated passenger terminal in Kuwait, delivering 100% brand share of voice without visual competition from other regional airlines.',
    },
  ];

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(id);
    setTimeout(() => {
      setCopiedKey(null);
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#002B66] to-[#00A3E0] p-6 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-white/20 p-2 backdrop-blur-md">
              <Sparkles className="h-6 w-6 text-[#FFC72C]" />
            </div>
            <div>
              <h3 className="text-lg font-bold tracking-tight">Pitch Deck Stats Helper</h3>
              <p className="text-xs text-sky-100">
                Official Jazeera & T5 Data to Copy Directly into Client Pitches
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

        {/* Content list */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <div className="rounded-xl bg-sky-50 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-800/60 p-3.5 flex items-start gap-3 text-xs text-sky-900 dark:text-sky-200">
            <TrendingUp className="h-4 w-4 text-sky-600 dark:text-sky-400 shrink-0 mt-0.5" />
            <span>
              Click <strong>&quot;Copy Pitch Snippet&quot;</strong> on any metric below to copy pre-formatted, agency-ready media narrative to your clipboard.
            </span>
          </div>

          {stats.map((item) => {
            const Icon = item.icon;
            const isCopied = copiedKey === item.id;

            return (
              <div
                key={item.id}
                className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 p-4 hover:border-[#00A3E0] transition-all shadow-sm group"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-blue-100 dark:bg-blue-950/80 p-2 text-[#002B66] dark:text-[#00A3E0]">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <span className="text-lg font-extrabold text-[#002B66] dark:text-sky-400">
                        {item.metric}
                      </span>
                      <h4 className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                        {item.title}
                      </h4>
                    </div>
                  </div>

                  <button
                    onClick={() => handleCopy(item.id, item.pitchCopy)}
                    className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-all ${
                      isCopied
                        ? 'bg-emerald-600 text-white'
                        : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 hover:bg-[#002B66] hover:text-white group-hover:border-[#002B66]'
                    }`}
                  >
                    {isCopied ? (
                      <>
                        <Check className="h-3.5 w-3.5" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5" />
                        Copy Pitch
                      </>
                    )}
                  </button>
                </div>

                <div className="mt-3 pt-3 border-t border-slate-200/70 dark:border-slate-700/60">
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                    {item.subtitle}
                  </p>
                  <p className="mt-1 text-xs text-slate-700 dark:text-slate-300 bg-white/70 dark:bg-slate-900/60 p-2.5 rounded-lg border border-slate-200/60 dark:border-slate-800/80 italic leading-relaxed">
                    &ldquo;{item.pitchCopy}&rdquo;
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 text-center text-xs text-slate-500 dark:text-slate-400">
          Source: Jazeera Airways Official Traffic Audit & DGCA Commercial Operations
        </div>
      </div>
    </div>
  );
}
