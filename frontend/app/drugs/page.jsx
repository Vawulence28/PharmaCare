'use client';

import React, { useState, useEffect } from 'react';
import { Layout } from '@/components/Layout';
import { PageHeader } from '@/components/ui/PageHeader';
import { Table } from '@/components/ui/Table';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Loading } from '@/components/ui/Loading';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { DrugModal } from '@/components/modals/DrugModal';
import { DrugDetailModal } from '@/components/modals/DrugDetailModal';
import { ConfirmModal } from '@/components/modals/ConfirmModal';
import { fetchFromApi } from '@/utils/api';
import { useAuth } from '@/context/AuthContext';
import { Plus, Search, Eye, Edit3, Archive, Filter } from 'lucide-react';

export default function DrugsPage() {
  const { user } = useAuth();
  const [drugs, setDrugs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  // Filters & Pagination
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('true'); // default active
  const [categories, setCategories] = useState([]);
  const [offset, setOffset] = useState(0);
  const [limit] = useState(10);
  const [totalCount, setTotalCount] = useState(0);

  // Modals state
  const [isAddEditOpen, setIsAddEditOpen] = useState(false);
  const [drugToEdit, setDrugToEdit] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedDrug, setSelectedDrug] = useState(null);
  const [isArchiveOpen, setIsArchiveOpen] = useState(false);
  const [drugToArchive, setDrugToArchive] = useState(null);

  const loadDrugs = async () => {
    setLoading(true);
    setError(null);
    try {
      const queryParams = new URLSearchParams({
        limit,
        offset,
        ...(search && { search }),
        ...(categoryFilter && { category: categoryFilter }),
        ...(statusFilter !== '' && { status: statusFilter }),
      });

      const data = await fetchFromApi(`/drugs?${queryParams.toString()}`);
      setDrugs(data.data.drugs);
      setTotalCount(data.data.pagination.total);

      // Extract unique categories for filter dropdown
      const uniqueCats = [...new Set(data.data.drugs.map((d) => d.category))];
      setCategories((prev) => [...new Set([...prev, ...uniqueCats])]);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDrugs();
  }, [search, categoryFilter, statusFilter, offset]);

  const handleSaveDrug = async (formData) => {
    setError(null);
    try {
      if (drugToEdit) {
        await fetchFromApi(`/drugs/${drugToEdit.id}`, {
          method: 'PUT',
          body: JSON.stringify(formData),
        });
        setSuccessMessage('Drug updated successfully.');
      } else {
        await fetchFromApi('/drugs', {
          method: 'POST',
          body: JSON.stringify(formData),
        });
        setSuccessMessage('Drug created successfully.');
      }
      setIsAddEditOpen(false);
      setDrugToEdit(null);
      loadDrugs();
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleArchiveConfirm = async () => {
    if (!drugToArchive) return;
    setError(null);
    try {
      await fetchFromApi(`/drugs/${drugToArchive.id}/archive`, {
        method: 'PATCH',
      });
      setSuccessMessage(`Drug "${drugToArchive.name}" archived successfully.`);
      setIsArchiveOpen(false);
      setDrugToArchive(null);
      loadDrugs();
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err) {
      setError(err.message);
      setIsArchiveOpen(false);
    }
  };

  return (
    <Layout>
      <PageHeader 
        title="Drug Catalogue" 
        description="Manage pharmacy drug inventory items, dosages, and stock thresholds."
        action={
          <Button onClick={() => { setDrugToEdit(null); setIsAddEditOpen(true); }} className="flex items-center space-x-2">
            <Plus className="w-4 h-4" />
            <span>Add New Drug</span>
          </Button>
        }
      />

      {successMessage && (
        <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-sm font-medium">
          {successMessage}
        </div>
      )}

      {error && <div className="mb-6"><ErrorMessage title="Operation Failed" message={error} /></div>}

      {/* Search and Filters Bar */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 mb-6 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
          <input 
            type="text" 
            placeholder="Search by name, generic, or ID..." 
            value={search}
            onChange={(e) => { setSearch(e.target.value); setOffset(0); }}
            className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-navy-900"
          />
        </div>

        <div className="flex items-center space-x-4 w-full md:w-auto">
          <select 
            value={categoryFilter} 
            onChange={(e) => { setCategoryFilter(e.target.value); setOffset(0); }}
            className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-navy-900 bg-white"
          >
            <option value="">All Categories</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>

          <select 
            value={statusFilter} 
            onChange={(e) => { setStatusFilter(e.target.value); setOffset(0); }}
            className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-navy-900 bg-white"
          >
            <option value="true">Active Only</option>
            <option value="false">Archived Only</option>
            <option value="">All Statuses</option>
          </select>
        </div>
      </div>

      {/* Drug Table */}
      {loading ? (
        <Loading message="Loading drug catalogue..." />
      ) : drugs.length === 0 ? (
        <EmptyState 
          title="No drugs found" 
          description="Try adjusting your search query or filters, or add a new drug to the catalogue."
          action={
            <Button onClick={() => { setDrugToEdit(null); setIsAddEditOpen(true); }} className="mt-2">
              Add Drug
            </Button>
          }
        />
      ) : (
        <>
          <Table headers={['Drug Name', 'Generic Name', 'Category', 'Form', 'Strength', 'Min Stock', 'Status', 'Actions']}>
            {drugs.map((d) => (
              <tr key={d.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4 font-semibold text-navy-900">
                  {d.name} <span className="text-xs text-slate-400 font-normal">#{d.id}</span>
                </td>
                <td className="px-6 py-4 text-slate-600">{d.generic_name || '—'}</td>
                <td className="px-6 py-4">{d.category}</td>
                <td className="px-6 py-4 capitalize">{d.dosage_form}</td>
                <td className="px-6 py-4 font-mono text-xs">{d.strength}</td>
                <td className="px-6 py-4">{d.minimum_stock_threshold} {d.unit_of_measurement}</td>
                <td className="px-6 py-4">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                    d.is_active ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {d.is_active ? 'Active' : 'Archived'}
                  </span>
                </td>
                <td className="px-6 py-4 space-x-1">
                  <button 
                    onClick={() => { setSelectedDrug(d); setIsDetailOpen(true); }}
                    className="p-1.5 text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
                    title="View Details"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => { setDrugToEdit(d); setIsAddEditOpen(true); }}
                    className="p-1.5 text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
                    title="Edit Drug"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  {user?.role === 'ADMIN' && d.is_active && (
                    <button 
                      onClick={() => { setDrugToArchive(d); setIsArchiveOpen(true); }}
                      className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Archive Drug"
                    >
                      <Archive className="w-4 h-4" />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </Table>

          {/* Pagination Controls */}
          <div className="flex items-center justify-between mt-6 bg-white px-6 py-3 rounded-xl border border-slate-200">
            <p className="text-sm text-slate-500">
              Showing <span className="font-medium">{offset + 1}</span> to <span className="font-medium">{Math.min(offset + limit, totalCount)}</span> of <span className="font-medium">{totalCount}</span> drugs
            </p>
            <div className="flex space-x-2">
              <Button 
                variant="outline" 
                disabled={offset === 0} 
                onClick={() => setOffset(Math.max(0, offset - limit))}
                className="text-xs py-1.5 px-3"
              >
                Previous
              </Button>
              <Button 
                variant="outline" 
                disabled={offset + limit >= totalCount} 
                onClick={() => setOffset(offset + limit)}
                className="text-xs py-1.5 px-3"
              >
                Next
              </Button>
            </div>
          </div>
        </>
      )}

      {/* Modals */}
      <DrugModal 
        isOpen={isAddEditOpen} 
        onClose={() => setIsAddEditOpen(false)} 
        onSubmit={handleSaveDrug} 
        drugToEdit={drugToEdit} 
      />

      <DrugDetailModal 
        isOpen={isDetailOpen} 
        onClose={() => setIsDetailOpen(false)} 
        drug={selectedDrug} 
      />

      <ConfirmModal 
        isOpen={isArchiveOpen} 
        onClose={() => setIsArchiveOpen(false)} 
        onConfirm={handleArchiveConfirm} 
        title="Archive Drug" 
        message={`Are you sure you want to archive "${drugToArchive?.name}"? Archived drugs will be deactivated in the catalogue.`}
        confirmText="Archive"
        variant="danger"
      />
    </Layout>
  );
}