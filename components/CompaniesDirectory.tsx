'use client';

import React, { useState } from 'react';
import {
  Building2,
  Users,
  Phone,
  Mail,
  MapPin,
  Plus,
  Briefcase,
  ExternalLink,
  Sparkles,
} from 'lucide-react';
import { formatKWD } from '@/lib/types';

interface CompaniesDirectoryProps {
  companies: any[];
  onRefresh: () => void;
  onOpenNewDeal: () => void;
}

export function CompaniesDirectory({ companies, onRefresh, onOpenNewDeal }: CompaniesDirectoryProps) {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [type, setType] = useState('DIRECT_CLIENT');
  const [industry, setIndustry] = useState('FINTECH_BANKING');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [contactName, setContactName] = useState('');
  const [contactRole, setContactRole] = useState('Media Planner');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreateCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email) return;

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/companies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          type,
          industry,
          contactEmail: email,
          phone,
          billingAddress: address,
          contacts: contactName
            ? [{ name: contactName, role: contactRole, email, phone }]
            : [],
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        alert(err.error || 'Failed to create company');
        return;
      }

      onRefresh();
      setIsAddModalOpen(false);
      setName('');
      setEmail('');
      setPhone('');
      setContactName('');
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#002B66] via-[#0B2545] to-[#133E87] rounded-2xl p-6 text-white shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-[#FFC72C] text-[#002B66] font-bold text-[10px] uppercase px-2 py-0.5 rounded">
              Advertiser & Agency Accounts
            </span>
            <span className="text-xs text-sky-200">Media Buying Portfolio</span>
          </div>
          <h2 className="text-xl font-bold mt-1">Client CRM & Stakeholders Directory</h2>
          <p className="text-xs text-sky-100 mt-0.5 max-w-xl">
            Directory of top Kuwait media agencies (Impact BBDO, Mindshare, Wavemaker) and direct brand partners (NBK, Zain, KFH, Talabat).
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-2 rounded-xl bg-white text-[#002B66] px-4 py-2.5 text-xs font-bold shadow-md hover:bg-slate-100 transition-all shrink-0 cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          Add Advertiser / Agency
        </button>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {companies.map((company) => {
          const totalSpend = (company.deals || []).reduce(
            (acc: number, d: any) => acc + (d.totalValueKWD || 0),
            0
          );

          return (
            <div
              key={company.id}
              className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950 text-[#002B66] dark:text-sky-400 border border-blue-200 dark:border-blue-900">
                    {company.type.replace('_', ' ')}
                  </span>
                  <span className="text-[10px] font-medium text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                    {company.industry.replace('_', ' ')}
                  </span>
                </div>

                <h3 className="font-bold text-base text-slate-900 dark:text-slate-100 mt-3">
                  {company.name}
                </h3>

                <div className="mt-3 space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
                  <div className="flex items-center gap-2">
                    <Mail className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{company.contactEmail}</span>
                  </div>
                  {company.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                      <span>{company.phone}</span>
                    </div>
                  )}
                  {company.billingAddress && (
                    <div className="flex items-start gap-2 text-[11px] text-slate-500">
                      <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0 mt-0.5" />
                      <span className="line-clamp-2">{company.billingAddress}</span>
                    </div>
                  )}
                </div>

                {/* Contacts pill list */}
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                    Authorized Stakeholders ({company.contacts?.length || 0})
                  </span>
                  <div className="space-y-1.5">
                    {company.contacts?.slice(0, 2).map((contact: any) => (
                      <div
                        key={contact.id}
                        className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 text-xs flex items-center justify-between"
                      >
                        <div>
                          <div className="font-semibold text-slate-900 dark:text-slate-100">
                            {contact.name}
                          </div>
                          <div className="text-[10px] text-slate-500">{contact.role}</div>
                        </div>
                        <a
                          href={`mailto:${contact.email}`}
                          className="text-sky-600 hover:text-sky-700"
                        >
                          <Mail className="h-3.5 w-3.5" />
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Bottom spend and action */}
              <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">
                    Portfolio Value:
                  </span>
                  <span className="font-black text-sm text-[#002B66] dark:text-sky-400">
                    {formatKWD(totalSpend)}
                  </span>
                </div>

                <button
                  onClick={onOpenNewDeal}
                  className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-[#002B66] hover:text-white transition-colors text-xs font-semibold"
                >
                  + New Deal
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
            <div className="bg-[#002B66] p-5 text-white flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold">Add Advertiser or Media Agency</h3>
                <p className="text-xs text-sky-200">New corporate media buying account</p>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-white/80 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateCompany} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Company / Organization Name *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Gulf Bank or Wavemaker Kuwait"
                  className="w-full text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-2.5"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Account Type
                  </label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className="w-full text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-2.5"
                  >
                    <option value="DIRECT_CLIENT">Direct Advertiser</option>
                    <option value="AGENCY">Media Agency</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Industry Sector
                  </label>
                  <select
                    value={industry}
                    onChange={(e) => setIndustry(e.target.value)}
                    className="w-full text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-2.5"
                  >
                    <option value="FINTECH_BANKING">Banking & Finance</option>
                    <option value="TELCO">Telecommunications</option>
                    <option value="RETAIL">Retail & E-Commerce</option>
                    <option value="TOURISM">Tourism & Hospitality</option>
                    <option value="FMCG">FMCG & Consumer Goods</option>
                    <option value="OTHER">Other / Agency</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Corporate Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-2.5"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-2.5"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Billing Address (Kuwait)
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-2.5"
                />
              </div>

              <div className="pt-2 border-t">
                <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                  Primary Contact Person (Optional)
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    placeholder="Contact Name"
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    className="w-full text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-2"
                  />
                  <input
                    type="text"
                    placeholder="Role (e.g. Media Planner)"
                    value={contactRole}
                    onChange={(e) => setContactRole(e.target.value)}
                    className="w-full text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-2"
                  />
                </div>
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
                  className="px-5 py-2 text-xs font-bold bg-[#002B66] text-white hover:bg-blue-900 rounded-lg"
                >
                  {isSubmitting ? 'Creating...' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
