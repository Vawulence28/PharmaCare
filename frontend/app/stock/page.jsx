'use client';

import React, { useState, useEffect } from 'react';
import { Layout } from '@/components/Layout';
import { PageHeader } from '@/components/ui/PageHeader';
import { Table } from '@/components/ui/Table';
import { Button } from '@/components/ui/Button';
import { Loading } from '@/components/ui/Loading';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { RegisterBatchModal } from '@/components/modals/RegisterBatchModal';
import { ReceiveStockModal } from '@/components/modals/ReceiveStockModal';
import { IssueStockModal } from '@/components/modals/IssueStockModal';
import { AdjustStockModal } from '@/components/modals/AdjustStockModal';
import { BatchDetailModal } from '@/components/modals/BatchDetailModal';
import { fetchFromApi } from '@/utils/api';
import { useAuth } from '@/context/AuthContext';
import { Plus, Search, Eye, ArrowDownRight, ArrowUpRight, Sliders, History } from 'lucide-react';

export default function StockPage() {
  const { user } = useAuth();
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [isReceiveOpen, setIsReceiveOpen] = useState(false);
  const [isIssueOpen, setIsIssueOpen] = useState(false);
  const [isAdjustOpen, setIsAdjustOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState(null);

  const [viewMode, setViewMode] = useState('batches');
  const [transactions, setTransactions] = useState([]);

  const loadBatches = async () => {
    setLoading(true);
    setError(null);
    try {
      const queryParams = new URLSearchParams({
        ...(search && { search }),
        ...(statusFilter && { status: statusFilter }),
      });
      const data = await fetchFromApi(`/stock/batches?${queryParams.toString()}`);
      setBatches(data.data.batches);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadTransactions = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchFromApi('/stock/transactions');
      setTransactions(data.data.transactions);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (viewMode === 'batches') {
      loadBatches();
    } else {
      loadTransactions();
    }
  }, [search, statusFilter, viewMode]);

  const handleActionSuccess = (msg) => {
    setSuccessMessage(msg);
    if (viewMode === 'batches') loadBatches();
    else loadTransactions();
    setTimeout(() => setSuccessMessage(null), 4000);
  };

  return (
    <Layout>
      <PageHeader 
        title="Batches & Stock Management" 
        description="Monitor drug batches, perform FEFO stock issues, and inspect audit trails."
        action={
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => setIsReceiveOpen(true)} className="flex items-center space-x-1.5 text-xs">
              <ArrowDownRight className="w-4 h-4 text-emerald-600" />
              <span>Receive Stock</span>
            </Button>
            <Button variant="outline" onClick={() => setIsIssueOpen(true)} className="flex items-center space-x-1.5 text-xs">
              <ArrowUpRight className="w-4 h-4 text-blue-600" />
              <span>Issue Stock</span>
            </Button>
            {user?.role === 'ADMIN' && (
              <Button variant="outline" onClick={() => setIsAdjustOpen(true)} className="flex items-center space-x-1.5 text-xs">
                <Sliders className="w-4 h-4 text-amber-600" />
                <span>Adjust Stock</span>
              </Button>
            )}
            <Button onClick={() => setIsRegisterOpen(true)} className="flex items-center space-x-1.5 text-xs">
              <Plus className="w-4 h-4" />
              <span>Register Batch</span>
            </Button>
          </div>
        }
      />

      {successMessage && (
        <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-sm font-medium">
          {successMessage}
        </div>
      )}

      {error && <div className="mb-6"><ErrorMessage title="Operation Failed" message={error} /></div>}

      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 mb-6 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex space-x-2 w-full md:w-auto">
          <button
            onClick={() => setViewMode('batches')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
              viewMode === 'batches' ? 'bg-navy-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Batch Inventory
          </button>
          <button
            onClick={() => setViewMode('transactions')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center space-x-1.5 ${
              viewMode === 'transactions' ? 'bg-navy-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <History className="w-4 h-4" />
            <span>Audit History</span>
          </button>
        </div>

        {viewMode === 'batches' && (
          <div className="flex items-center space-x-4 w-full md:w-auto">
            <div className="relative w-full md:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
              <input 
                type="text" 
                placeholder="Search drug or batch #..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-navy-900"
              />
            </div>

            <select 
              value={statusFilter} 
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-navy-900 bg-white"
            >
              <option value="">All Expiry Statuses</option>
              <option value="AVAILABLE">Available</option>
              <option value="EXPIRING_SOON">Expiring Soon (30 days)</option>
              <option value="EXPIRED">Expired</option>
              <option value="DEPLETED">Depleted</option>
            </select>
          </div>
        )}
      </div>

      {loading ? (
        <Loading message={viewMode === 'batches' ? 'Loading stock batches...' : 'Loading audit trail...'} />
      ) : viewMode === 'batches' ? (
        batches.length === 0 ? (
          <EmptyState 
            title="No batches found" 
            description="Register a new batch or adjust search filters to view inventory items."
          />
        ) : (
          <Table headers={['Drug Name', 'Batch Number', 'Current Qty', 'Received Date', 'Expiry Date', 'Status', 'Actions']}>
            {batches.map((b) => (
              <tr key={b.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4 font-semibold text-navy-900">
                  {b.drug_name} <span className="text-xs text-slate-400 font-normal">({b.strength} {b.dosage_form})</span>
                </td>
                <td className="px-6 py-4 font-mono font-medium">{b.batch_number}</td>
                <td className="px-6 py-4 font-bold text-slate-800">{b.current_quantity}</td>
                <td className="px-6 py-4 text-slate-500 text-xs">{b.date_received}</td>
                <td className="px-6 py-4 text-slate-700 font-medium text-xs">{b.expiry_date}</td>
                <td className="px-6 py-4">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                    b.status === 'AVAILABLE' ? 'bg-emerald-100 text-emerald-800' :
                    b.status === 'EXPIRING_SOON' ? 'bg-amber-100 text-amber-800' :
                    b.status === 'EXPIRED' ? 'bg-red-100 text-red-800' : 'bg-slate-200 text-slate-700'
                  }`}>
                    {b.status}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <button 
                    onClick={() => { setSelectedBatch(b); setIsDetailOpen(true); }}
                    className="p-1.5 text-slate-600 hover:bg-slate-200 rounded-lg transition-colors flex items-center space-x-1 text-xs"
                    title="View Batch History"
                  >
                    <Eye className="w-4 h-4" />
                    <span>Details</span>
                  </button>
                </td>
              </tr>
            ))}
          </Table>
        )
      ) : (
        transactions.length === 0 ? (
          <EmptyState title="No transactions recorded" description="Stock movements will appear here." />
        ) : (
          <Table headers={['Type', 'Drug Name', 'Batch #', 'Qty Change', 'User', 'Reason / Notes', 'Timestamp']}>
            {transactions.map((t) => (
              <tr key={t.id} className="hover:bg-slate-50 transition-colors text-xs">
                <td className="px-6 py-4 font-semibold">
                  <span className={`px-2 py-0.5 rounded ${
                    t.transaction_type === 'RECEIVED' ? 'bg-emerald-100 text-emerald-800' :
                    t.transaction_type === 'ISSUED' ? 'bg-blue-100 text-blue-800' : 'bg-amber-100 text-amber-800'
                  }`}>
                    {t.transaction_type}
                  </span>
                </td>
                <td className="px-6 py-4 font-medium text-navy-900">{t.drug_name}</td>
                <td className="px-6 py-4 font-mono">{t.batch_number}</td>
                <td className={`px-6 py-4 font-mono font-bold ${t.quantity > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                  {t.quantity > 0 ? `+${t.quantity}` : t.quantity}
                </td>
                <td className="px-6 py-4">{t.user_name}</td>
                <td className="px-6 py-4 text-slate-500 truncate max-w-xs">{t.reason_or_notes || '—'}</td>
                <td className="px-6 py-4 text-slate-400">{new Date(t.transaction_date).toLocaleString()}</td>
              </tr>
            ))}
          </Table>
        )
      )}

      <RegisterBatchModal 
        isOpen={isRegisterOpen} 
        onClose={() => setIsRegisterOpen(false)} 
        onSuccess={() => handleActionSuccess('Batch registered successfully.')} 
      />

      <ReceiveStockModal 
        isOpen={isReceiveOpen} 
        onClose={() => setIsReceiveOpen(false)} 
        onSuccess={() => handleActionSuccess('Stock received successfully.')} 
      />

      <IssueStockModal 
        isOpen={isIssueOpen} 
        onClose={() => setIsIssueOpen(false)} 
        onSuccess={() => handleActionSuccess('Stock issued successfully.')} 
      />

      <AdjustStockModal 
        isOpen={isAdjustOpen} 
        onClose={() => setIsAdjustOpen(false)} 
        onSuccess={() => handleActionSuccess('Stock adjusted successfully.')} 
      />

      <BatchDetailModal 
        isOpen={isDetailOpen} 
        onClose={() => setIsDetailOpen(false)} 
        batch={selectedBatch} 
      />
    </Layout>
  );
}