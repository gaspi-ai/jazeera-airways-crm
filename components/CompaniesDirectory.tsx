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
  Edit,
  Trash2,
  Archive,
  Search,
  Filter,
  AlertTriangle,
  CheckCircle,
  X,
  UserPlus,
} from 'lucide-react';
import { CompanyWithRelations, formatKWD } from '@/lib/types';

interface CompaniesDirectoryProps {
  companies: any[];
  onRefresh: () => void;
  onOpenNewDeal: () => void;
}

export function CompaniesDirectory({ companies, onRefresh, onOpenNewDeal }: CompaniesDirectoryProps) {
  // Add company modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [type, setType] = useState('DIRECT_CLIENT');
  const [industry, setIndustry] = useState('FINTECH_BANKING');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [contactName, setContactName] = useState('');
  const [contactRole, setContactRole] = useState('Media Planner');

  // Edit company modal
  const [editingCompany, setEditingCompany] = useState<any | null>(null);

  // Delete / Archive confirmation modal
  const [deletingCompany, setDeletingCompany] = useState<any | null>(null);

  // Add Contact modal for specific company
  const [contactTargetCompany, setContactTargetCompany] = useState<any | null>(null);
  const [newContactName, setNewContactName] = useState('');
  const [newContactRole, setNewContactRole] = useState('Media Planner');
  const [newContactEmail, setNewContactEmail] = useState('');
  const [newContactPhone, setNewContactPhone] = useState('');

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [industryFilter, setIndustryFilter] = useState('ALL');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const showToast = (type: 'success' | 'error', text: string) => {
    setFeedbackMsg({ type, text });
    setTimeout(() => setFeedbackMsg(null), 4000);
  };

  // Filtered companies
  const filteredCompanies = companies.filter((c) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      !q ||
      c.name.toLowerCase().includes(q) ||
      c.contactEmail.toLowerCase().includes(q) ||
      (c.contacts || []).some((ct: any) => ct.name.toLowerCase().includes(q));

    const matchesType = typeFilter === 'ALL' || c.type === typeFilter;
    const matchesIndustry = industryFilter === 'ALL' || c.industry === industryFilter;

    return matchesSearch && matchesType && matchesIndustry;
  });

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
        throw new Error(err.error || 'Failed to create company');
      }

      showToast('success', `${name} created successfully.`);
      onRefresh();
      setIsAddModalOpen(false);
      setName('');
      setEmail('');
      setPhone('');
      setAddress('');
      setContactName('');
    } catch (err: any) {
      showToast('error', err.message || 'Error creating company');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCompany) return;

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/companies/${editingCompany.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editingCompany.name,
          type: editingCompany.type,
          industry: editingCompany.industry,
          contactEmail: editingCompany.contactEmail,
          phone: editingCompany.phone,
          billingAddress: editingCompany.billingAddress,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to update company');
      }

      showToast('success', `${editingCompany.name} updated successfully.`);
      setEditingCompany(null);
      onRefresh();
    } catch (err: any) {
      showToast('error', err.message || 'Error updating company');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteOrArchive = async (mode: 'archive' | 'force') => {
    if (!deletingCompany) return;

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/companies/${deletingCompany.id}?mode=${mode}`, {
        method: 'DELETE',
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to delete company');
      }

      showToast('success', data.message || 'Action executed successfully.');
      setDeletingCompany(null);
      onRefresh();
    } catch (err: any) {
      showToast('error', err.message || 'Error during deletion');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactTargetCompany || !newContactName || !newContactEmail) return;

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyId: contactTargetCompany.id,
          name: newContactName,
          role: newContactRole,
          email: newContactEmail,
          phone: newContactPhone,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to add contact');
      }

      showToast('success', `Added ${newContactName} to ${contactTargetCompany.name}.`);
      setContactTargetCompany(null);
      setNewContactName('');
      setNewContactEmail('');
      setNewContactPhone('');
      onRefresh();
    } catch (err: any) {
      showToast('error', err.message || 'Error adding contact');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteContact = async (contactId: string, contactName: string) => {
    if (!confirm(`Remove contact "${contactName}"?`)) return;

    try {
      const res = await fetch(`/api/contacts/${contactId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        showToast('success', `Contact removed.`);
        onRefresh();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {feedbackMsg && (
        <div
          className={`p-4 rounded-xl text-xs font-semibold flex items-center justify-between border shadow-lg animate-in fade-in ${
            feedbackMsg.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/70 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
              : 'bg-red-50 dark:bg-red-950/70 border-red-300 dark:border-red-800 text-red-800 dark:text-red-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedbackMsg.type === 'success' ? (
              <CheckCircle className="h-4 w-4 text-emerald-600" />
            ) : (
              <AlertTriangle className="h-4 w-4 text-red-600" />
            )}
            <span>{feedbackMsg.text}</span>
          </div>
          <button onClick={() => setFeedbackMsg(null)} className="cursor-pointer">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

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

      {/* Search & Filter Bar */}
      <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative flex-1 w-full sm:max-w-md">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search companies by name, email, or contact person..."
            className="w-full text-xs pl-9 pr-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto overflow-x-auto">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-semibold shrink-0">
            <Filter className="h-3.5 w-3.5 text-slate-400" />
            <span>Filter:</span>
          </div>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-2 text-slate-700 dark:text-slate-300 font-medium"
          >
            <option value="ALL">All Account Types</option>
            <option value="DIRECT_CLIENT">Direct Clients</option>
            <option value="AGENCY">Media Agencies</option>
          </select>

          <select
            value={industryFilter}
            onChange={(e) => setIndustryFilter(e.target.value)}
            className="text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-2 text-slate-700 dark:text-slate-300 font-medium"
          >
            <option value="ALL">All Industries</option>
            <option value="FINTECH_BANKING">Banking & Fintech</option>
            <option value="TELCO">Telecommunications</option>
            <option value="RETAIL">Retail & Fashion</option>
            <option value="TOURISM">Tourism & Hospitality</option>
            <option value="FMCG">FMCG & F&B</option>
            <option value="AUTOMOTIVE">Automotive</option>
            <option value="OTHER">Other</option>
          </select>

          {(searchQuery || typeFilter !== 'ALL' || industryFilter !== 'ALL') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setTypeFilter('ALL');
                setIndustryFilter('ALL');
              }}
              className="px-2.5 py-1.5 text-xs rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold cursor-pointer shrink-0"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Grid of Companies */}
      {filteredCompanies.length === 0 ? (
        <div className="p-12 text-center rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900">
          <Building2 className="h-10 w-10 text-slate-400 mx-auto mb-2" />
          <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300">No companies found</h4>
          <p className="text-xs text-slate-500 mt-1">Try adjusting your search or filter parameters</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredCompanies.map((company) => {
            const totalSpend = (company.deals || []).reduce(
              (acc: number, d: any) => acc + (d.totalValueKWD || 0),
              0
            );
            const activeDealsCount = (company.deals || []).filter((d: any) => d.stage !== 'CLOSED_LOST').length;

            return (
              <div
                key={company.id}
                className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group"
              >
                <div>
                  {/* Top Badges & Actions */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950 text-[#002B66] dark:text-sky-400 border border-blue-200 dark:border-blue-900">
                        {company.type.replace('_', ' ')}
                      </span>
                      <span className="text-[10px] font-medium text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                        {company.industry.replace('_', ' ')}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                      {/* Edit Company */}
                      <button
                        title="Edit Company Details"
                        onClick={() => setEditingCompany({ ...company })}
                        className="p-1 text-slate-400 hover:text-[#002B66] hover:bg-sky-50 dark:hover:bg-slate-800 rounded cursor-pointer"
                      >
                        <Edit className="h-3.5 w-3.5" />
                      </button>

                      {/* Delete / Archive Company */}
                      <button
                        title="Delete or Archive Account"
                        onClick={() => setDeletingCompany(company)}
                        className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-slate-800 rounded cursor-pointer"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
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

                  {/* Contacts list */}
                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Stakeholders ({company.contacts?.length || 0})
                      </span>
                      <button
                        onClick={() => setContactTargetCompany(company)}
                        className="text-[10px] font-bold text-sky-600 hover:text-sky-700 flex items-center gap-1 cursor-pointer"
                      >
                        <UserPlus className="h-3 w-3" />
                        <span>Add</span>
                      </button>
                    </div>

                    <div className="space-y-1.5">
                      {company.contacts?.map((contact: any) => (
                        <div
                          key={contact.id}
                          className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 text-xs flex items-center justify-between group/c"
                        >
                          <div>
                            <div className="font-semibold text-slate-900 dark:text-slate-100">
                              {contact.name}
                            </div>
                            <div className="text-[10px] text-slate-500">{contact.role}</div>
                          </div>
                          <div className="flex items-center gap-2">
                            <a
                              href={`mailto:${contact.email}`}
                              className="text-sky-600 hover:text-sky-700"
                            >
                              <Mail className="h-3.5 w-3.5" />
                            </a>
                            <button
                              onClick={() => handleDeleteContact(contact.id, contact.name)}
                              className="text-slate-300 hover:text-red-500 opacity-0 group-hover/c:opacity-100 transition-opacity"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Bottom spend and action */}
                <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">
                      Portfolio Value ({activeDealsCount} active):
                    </span>
                    <span className="font-black text-sm text-[#002B66] dark:text-sky-400">
                      {formatKWD(totalSpend)}
                    </span>
                  </div>

                  <button
                    onClick={onOpenNewDeal}
                    className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-[#002B66] hover:text-white transition-colors text-xs font-semibold cursor-pointer"
                  >
                    + New Deal
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal 1: Add Company */}
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
                className="text-white/80 hover:text-white cursor-pointer"
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
                  className="w-full text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-2.5 text-slate-900 dark:text-slate-100"
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
                    className="w-full text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-2.5 text-slate-900 dark:text-slate-100"
                  >
                    <option value="DIRECT_CLIENT">Direct Advertiser</option>
                    <option value="AGENCY">Media Agency</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Industry Vertical
                  </label>
                  <select
                    value={industry}
                    onChange={(e) => setIndustry(e.target.value)}
                    className="w-full text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-2.5 text-slate-900 dark:text-slate-100"
                  >
                    <option value="FINTECH_BANKING">Banking & Fintech</option>
                    <option value="TELCO">Telecommunications</option>
                    <option value="RETAIL">Retail & E-Commerce</option>
                    <option value="TOURISM">Tourism & Hospitality</option>
                    <option value="FMCG">FMCG & F&B</option>
                    <option value="AUTOMOTIVE">Automotive</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Official Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="marketing@brand.com"
                    className="w-full text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-2.5 text-slate-900 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Contact Phone
                  </label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+965 2222 xxxx"
                    className="w-full text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-2.5 text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Billing & Corporate Address
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="e.g. Al Hamra Tower, Floor 42, Sharq, Kuwait City"
                  className="w-full text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-2.5 text-slate-900 dark:text-slate-100"
                />
              </div>

              <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
                <span className="text-[11px] font-bold uppercase text-slate-400 block mb-2">
                  Primary Media Planner / Contact (Optional)
                </span>
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    placeholder="Stakeholder Name"
                    className="text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-2 text-slate-900 dark:text-slate-100"
                  />
                  <input
                    type="text"
                    value={contactRole}
                    onChange={(e) => setContactRole(e.target.value)}
                    placeholder="Role (e.g. Account Director)"
                    className="text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-2 text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 text-xs font-bold bg-[#002B66] text-white rounded-lg shadow-md cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? 'Creating...' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Edit Company */}
      {editingCompany && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
            <div className="bg-[#002B66] p-5 text-white flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold">Edit Account Details</h3>
                <p className="text-xs text-sky-200">{editingCompany.name}</p>
              </div>
              <button
                onClick={() => setEditingCompany(null)}
                className="text-white/80 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUpdateCompany} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Company Name *
                </label>
                <input
                  type="text"
                  required
                  value={editingCompany.name}
                  onChange={(e) => setEditingCompany({ ...editingCompany, name: e.target.value })}
                  className="w-full text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-2.5 text-slate-900 dark:text-slate-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Account Type
                  </label>
                  <select
                    value={editingCompany.type}
                    onChange={(e) => setEditingCompany({ ...editingCompany, type: e.target.value })}
                    className="w-full text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-2.5 text-slate-900 dark:text-slate-100"
                  >
                    <option value="DIRECT_CLIENT">Direct Advertiser</option>
                    <option value="AGENCY">Media Agency</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Industry Vertical
                  </label>
                  <select
                    value={editingCompany.industry}
                    onChange={(e) => setEditingCompany({ ...editingCompany, industry: e.target.value })}
                    className="w-full text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-2.5 text-slate-900 dark:text-slate-100"
                  >
                    <option value="FINTECH_BANKING">Banking & Fintech</option>
                    <option value="TELCO">Telecommunications</option>
                    <option value="RETAIL">Retail & E-Commerce</option>
                    <option value="TOURISM">Tourism & Hospitality</option>
                    <option value="FMCG">FMCG & F&B</option>
                    <option value="AUTOMOTIVE">Automotive</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Contact Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={editingCompany.contactEmail}
                    onChange={(e) => setEditingCompany({ ...editingCompany, contactEmail: e.target.value })}
                    className="w-full text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-2.5 text-slate-900 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Phone
                  </label>
                  <input
                    type="text"
                    value={editingCompany.phone || ''}
                    onChange={(e) => setEditingCompany({ ...editingCompany, phone: e.target.value })}
                    className="w-full text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-2.5 text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Billing Address
                </label>
                <input
                  type="text"
                  value={editingCompany.billingAddress || ''}
                  onChange={(e) => setEditingCompany({ ...editingCompany, billingAddress: e.target.value })}
                  className="w-full text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-2.5 text-slate-900 dark:text-slate-100"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingCompany(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 text-xs font-bold bg-[#002B66] text-white rounded-lg shadow-md cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 3: Delete / Archive Confirmation */}
      {deletingCompany && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3 text-red-600 mb-3">
              <AlertTriangle className="h-6 w-6" />
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Remove Account: {deletingCompany.name}
              </h3>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
              {(deletingCompany.deals || []).length > 0 ? (
                <>
                  This account has <strong>{(deletingCompany.deals || []).length} deal(s)</strong> linked.
                  We recommend <strong>Archiving</strong> this account to preserve historical billing, insertion orders, and audits while hiding it from active directories.
                </>
              ) : (
                <>
                  Are you sure you want to permanently remove <strong>{deletingCompany.name}</strong>?
                </>
              )}
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-end gap-2.5 pt-3 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setDeletingCompany(null)}
                className="w-full sm:w-auto px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => handleDeleteOrArchive('archive')}
                className="w-full sm:w-auto px-4 py-2 text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white rounded-lg shadow cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                <Archive className="h-3.5 w-3.5" />
                <span>Archive Account</span>
              </button>

              {(deletingCompany.deals || []).length === 0 && (
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => handleDeleteOrArchive('force')}
                  className="w-full sm:w-auto px-4 py-2 text-xs font-bold bg-red-600 hover:bg-red-700 text-white rounded-lg shadow cursor-pointer disabled:opacity-50"
                >
                  Delete Permanently
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal 4: Add Contact to Company */}
      {contactTargetCompany && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  Add Stakeholder to {contactTargetCompany.name}
                </h3>
                <p className="text-[11px] text-slate-500">Authorized media planner or executive</p>
              </div>
              <button
                onClick={() => setContactTargetCompany(null)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddContact} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={newContactName}
                  onChange={(e) => setNewContactName(e.target.value)}
                  placeholder="e.g. Fatima Al-Sabah"
                  className="w-full text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-2 text-slate-900 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Role / Title *
                </label>
                <input
                  type="text"
                  required
                  value={newContactRole}
                  onChange={(e) => setNewContactRole(e.target.value)}
                  placeholder="e.g. Media Buying Director"
                  className="w-full text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-2 text-slate-900 dark:text-slate-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={newContactEmail}
                    onChange={(e) => setNewContactEmail(e.target.value)}
                    placeholder="contact@agency.com"
                    className="w-full text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-2 text-slate-900 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Phone
                  </label>
                  <input
                    type="text"
                    value={newContactPhone}
                    onChange={(e) => setNewContactPhone(e.target.value)}
                    placeholder="+965 ..."
                    className="w-full text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-2 text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setContactTargetCompany(null)}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-1.5 text-xs font-bold bg-[#002B66] text-white rounded-lg shadow cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? 'Adding...' : 'Add Contact'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
