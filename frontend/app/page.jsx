'use client';

import React, { useState, useEffect } from 'react';
import { Layout } from '@/components/Layout';
import { PageHeader } from '@/components/ui/PageHeader';
import { Table } from '@/components/ui/Table';
import { Button } from '@/components/ui/Button';
import { Loading } from '@/components/ui/Loading';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { EmptyState } from '@/components/ui/EmptyState';
import { fetchFromApi } from '@/utils/api';
import Link from 'next/link';
import { 
  Pill, 
  Layers, 
  AlertTriangle, 
  Clock, 
  XCircle, 
  RefreshCw, 
  ArrowRight,
  Activity
} from 'lucide-react';

export default function DashboardPage() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  const loadDashboard = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchFromApi('/dashboard/summary');
      setSummary(data.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  if (loading && !summary) {
    return (
      <Layout>
        <PageHeader title="Dashboard & Inventory Summary" description="Loading real-time pharmacy analytics and alerts..." />
        <Loading message="Fetching dashboard metrics..." />
      </Layout>
    );
  }

  if (error && !summary) {
    return (
      <Layout>
        <PageHeader title="Dashboard & Inventory Summary" description="Real-time pharmacy analytics and alerts." />
        <ErrorMessage title="Failed to Load Dashboard" message={error} />
        <div className="mt-4">
          <Button onClick={loadDashboard} className="flex items-center space-x-2">
            <RefreshCw className="w-4 h-4" />
            <span>Retry Connection</span>
          </Button>
        </div>
      </Layout>
    );
  }

  const metrics = summary?.metrics || {};
  const usableStockByUnit = summary?.usableStockByUnit || [];
  const alerts = summary?.alerts || { lowStockDrugs: [], expiredBatches: [], expiringSoonBatches: [] };
  const recentTransactions = summary?.recentTransactions || [];

  return (
    <Layout>
      <PageHeader 
        title="Dashboard & Inventory Summary" 
        description="Real-time overview of drug catalogues, active batches, stock levels, and critical alerts."
        action={
          <Button variant="outline" onClick={loadDashboard} className="flex items-center space-x-2 text-xs py-2 w-full sm:w-auto justify-center">
            <RefreshCw className="w-4 h-4" />
            <span>Refresh Data</span>
          </Button>
        }
      />

      {error && <div className="mb-6"><ErrorMessage title="Warning" message={error} /></div>}

      {/* Summary Metric Cards (Responsive Grid) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <div 
          onClick={() => setActiveTab('overview')}
          className={`bg-white p-5 rounded-xl shadow-sm border transition-all cursor-pointer ${
            activeTab === 'overview' ? 'border-primary-600 ring-2 ring-primary-600/10' : 'border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase">Active Drugs</span>
            <div className="p-2 bg-primary-50 text-primary-600 rounded-lg"><Pill className="w-5 h-5" /></div>
          </div>
          <p className="text-2xl font-bold text-navy-900 mt-3">{metrics.totalActiveDrugs ?? 0}</p>
          <p className="text-xs text-slate-400 mt-1">Catalogue products</p>
        </div>

        <div 
          onClick={() => setActiveTab('overview')}
          className={`bg-white p-5 rounded-xl shadow-sm border transition-all cursor-pointer ${
            activeTab === 'overview' ? 'border-primary-600 ring-2 ring-primary-600/10' : 'border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase">Active Batches</span>
            <div className="p-2 bg-teal-50 text-teal-600 rounded-lg"><Layers className="w-5 h-5" /></div>
          </div>
          <p className="text-2xl font-bold text-navy-900 mt-3">{metrics.totalActiveBatches ?? 0}</p>
          <p className="text-xs text-slate-400 mt-1">Usable inventory lots</p>
        </div>

        <div 
          onClick={() => setActiveTab('lowStock')}
          className={`bg-white p-5 rounded-xl shadow-sm border transition-all cursor-pointer ${
            activeTab === 'lowStock' ? 'border-amber-500 ring-2 ring-amber-500/10' : 'border-slate-200 hover:border-amber-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-600 uppercase">Low-Stock Drugs</span>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-lg"><AlertTriangle className="w-5 h-5" /></div>
          </div>
          <p className="text-2xl font-bold text-amber-600 mt-3">{metrics.lowStockCount ?? 0}</p>
          <p className="text-xs text-amber-600/80 mt-1">At or below threshold</p>
        </div>

        <div 
          onClick={() => setActiveTab('expiringSoon')}
          className={`bg-white p-5 rounded-xl shadow-sm border transition-all cursor-pointer ${
            activeTab === 'expiringSoon' ? 'border-blue-500 ring-2 ring-blue-500/10' : 'border-slate-200 hover:border-blue-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-blue-600 uppercase">Expiring Soon</span>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><Clock className="w-5 h-5" /></div>
          </div>
          <p className="text-2xl font-bold text-blue-600 mt-3">{metrics.expiringSoonCount ?? 0}</p>
          <p className="text-xs text-blue-600/80 mt-1">Within 30 days</p>
        </div>

        <div 
          onClick={() => setActiveTab('expired')}
          className={`bg-white p-5 rounded-xl shadow-sm border transition-all cursor-pointer ${
            activeTab === 'expired' ? 'border-red-500 ring-2 ring-red-500/10' : 'border-slate-200 hover:border-red-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-red-600 uppercase">Expired Batches</span>
            <div className="p-2 bg-red-50 text-red-600 rounded-lg"><XCircle className="w-5 h-5" /></div>
          </div>
          <p className="text-2xl font-bold text-red-600 mt-3">{metrics.expiredCount ?? 0}</p>
          <p className="text-xs text-red-600/80 mt-1">Require write-off</p>
        </div>
      </div>

      {/* Usable Stock Breakdown */}
      <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-slate-200 mb-8">
        <h3 className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-4">Usable Stock Breakdown by Unit of Measurement</h3>
        {usableStockByUnit.length === 0 ? (
          <p className="text-sm text-slate-500">No active usable stock recorded.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            {usableStockByUnit.map((item, idx) => (
              <div key={idx} className="p-3 sm:p-4 bg-emerald-50/50 rounded-xl border border-emerald-100">
                <span className="text-xs text-slate-500 uppercase block">Unit: {item.unit_of_measurement}</span>
                <span className="text-lg sm:text-xl font-bold text-primary-900 mt-1 block">{item.total_usable_quantity}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Responsive Filter Tabs */}
      <div className="flex overflow-x-auto space-x-2 border-b border-slate-200 mb-6 pb-2 no-scrollbar">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-colors whitespace-nowrap ${
            activeTab === 'overview' ? 'bg-primary-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          Overview & Recent Activity
        </button>
        <button
          onClick={() => setActiveTab('lowStock')}
          className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-colors flex items-center space-x-2 whitespace-nowrap ${
            activeTab === 'lowStock' ? 'bg-amber-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <span>Low-Stock Alerts</span>
          {metrics.lowStockCount > 0 && <span className="bg-white text-amber-800 text-xs px-2 py-0.5 rounded-full font-bold">{metrics.lowStockCount}</span>}
        </button>
        <button
          onClick={() => setActiveTab('expiringSoon')}
          className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-colors flex items-center space-x-2 whitespace-nowrap ${
            activeTab === 'expiringSoon' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <span>Expiring Soon</span>
          {metrics.expiringSoonCount > 0 && <span className="bg-white text-blue-800 text-xs px-2 py-0.5 rounded-full font-bold">{metrics.expiringSoonCount}</span>}
        </button>
        <button
          onClick={() => setActiveTab('expired')}
          className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-colors flex items-center space-x-2 whitespace-nowrap ${
            activeTab === 'expired' ? 'bg-red-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <span>Expired Batches</span>
          {metrics.expiredCount > 0 && <span className="bg-white text-red-800 text-xs px-2 py-0.5 rounded-full font-bold">{metrics.expiredCount}</span>}
        </button>
      </div>

      {/* Tab Content with Horizontal Scroll Wrappers */}
      {activeTab === 'overview' && (
        <div className="space-y-8">
          <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-4">
              <h3 className="text-base font-bold text-navy-900 flex items-center space-x-2">
                <Activity className="w-5 h-5 text-primary-600" />
                <span>Recent Stock Movements & Audit Log</span>
              </h3>
              <Link href="/stock" className="text-xs font-semibold text-primary-600 hover:underline flex items-center space-x-1">
                <span>View All Stock Operations</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {recentTransactions.length === 0 ? (
              <EmptyState title="No recent stock movements" description="Transactions will appear here once inventory actions are performed." />
            ) : (
              <div className="overflow-x-auto">
                <Table headers={['Type', 'Drug Name', 'Batch #', 'Qty Change', 'User', 'Notes / Reason', 'Timestamp']}>
                  {recentTransactions.map((t) => (
                    <tr key={t.id} className="hover:bg-slate-50 transition-colors text-xs">
                      <td className="px-4 sm:px-6 py-4 font-semibold">
                        <span className={`px-2 py-0.5 rounded ${
                          t.transaction_type === 'RECEIVED' ? 'bg-emerald-100 text-emerald-800' :
                          t.transaction_type === 'ISSUED' ? 'bg-blue-100 text-blue-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {t.transaction_type}
                        </span>
                      </td>
                      <td className="px-4 sm:px-6 py-4 font-medium text-navy-900">{t.drug_name}</td>
                      <td className="px-4 sm:px-6 py-4 font-mono">{t.batch_number}</td>
                      <td className={`px-4 sm:px-6 py-4 font-mono font-bold ${t.quantity > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                        {t.quantity > 0 ? `+${t.quantity}` : t.quantity}
                      </td>
                      <td className="px-4 sm:px-6 py-4">{t.user_name}</td>
                      <td className="px-4 sm:px-6 py-4 text-slate-500 truncate max-w-xs">{t.reason_or_notes || '—'}</td>
                      <td className="px-4 sm:px-6 py-4 text-slate-400">{new Date(t.transaction_date).toLocaleString()}</td>
                    </tr>
                  ))}
                </Table>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'lowStock' && (
        <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <h3 className="text-base font-bold text-navy-900 mb-4 flex items-center space-x-2">
            <AlertTriangle className="w-5 h-5 text-amber-600" />
            <span>Low-Stock Drugs (Usable Stock ≤ Threshold)</span>
          </h3>

          {alerts.lowStockDrugs.length === 0 ? (
            <EmptyState title="No low stock items" description="All drug products are currently above their minimum stock thresholds." />
          ) : (
            <div className="overflow-x-auto">
              <Table headers={['Drug Name', 'Strength & Form', 'Category', 'Usable Stock', 'Min Threshold', 'Unit', 'Action']}>
                {alerts.lowStockDrugs.map((d) => (
                  <tr key={d.drug_id} className="hover:bg-slate-50 transition-colors text-sm">
                    <td className="px-4 sm:px-6 py-4 font-semibold text-navy-900">{d.name}</td>
                    <td className="px-4 sm:px-6 py-4">{d.strength} {d.dosage_form}</td>
                    <td className="px-4 sm:px-6 py-4">{d.category || '—'}</td>
                    <td className="px-4 sm:px-6 py-4 font-bold text-amber-600">{d.usable_stock}</td>
                    <td className="px-4 sm:px-6 py-4">{d.minimum_stock_threshold}</td>
                    <td className="px-4 sm:px-6 py-4">{d.unit_of_measurement}</td>
                    <td className="px-4 sm:px-6 py-4">
                      <Link href="/stock" className="text-xs font-semibold text-primary-600 hover:underline flex items-center space-x-1">
                        <span>Restock Batch</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </Table>
            </div>
          )}
        </div>
      )}

      {activeTab === 'expiringSoon' && (
        <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <h3 className="text-base font-bold text-navy-900 mb-4 flex items-center space-x-2">
            <Clock className="w-5 h-5 text-blue-600" />
            <span>Batches Approaching Expiry (Within 30 Days)</span>
          </h3>

          {alerts.expiringSoonBatches.length === 0 ? (
            <EmptyState title="No batches expiring soon" description="No active batches are approaching expiry within the 30-day window." />
          ) : (
            <div className="overflow-x-auto">
              <Table headers={['Drug Name', 'Batch Number', 'Current Qty', 'Expiry Date', 'Unit', 'Action']}>
                {alerts.expiringSoonBatches.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50 transition-colors text-sm">
                    <td className="px-4 sm:px-6 py-4 font-semibold text-navy-900">{b.drug_name} ({b.strength} {b.dosage_form})</td>
                    <td className="px-4 sm:px-6 py-4 font-mono font-medium">{b.batch_number}</td>
                    <td className="px-4 sm:px-6 py-4 font-bold text-slate-800">{b.current_quantity} {b.unit_of_measurement}</td>
                    <td className="px-4 sm:px-6 py-4 text-amber-600 font-semibold">{b.expiry_date}</td>
                    <td className="px-4 sm:px-6 py-4">{b.unit_of_measurement}</td>
                    <td className="px-4 sm:px-6 py-4">
                      <Link href="/stock" className="text-xs font-semibold text-primary-600 hover:underline flex items-center space-x-1">
                        <span>Manage Batch</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </Table>
            </div>
          )}
        </div>
      )}

      {activeTab === 'expired' && (
        <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <h3 className="text-base font-bold text-navy-900 mb-4 flex items-center space-x-2">
            <XCircle className="w-5 h-5 text-red-600" />
            <span>Expired Batches with Remaining Quantities</span>
          </h3>

          {alerts.expiredBatches.length === 0 ? (
            <EmptyState title="No expired batches" description="There are no expired batches with remaining quantities in inventory." />
          ) : (
            <div className="overflow-x-auto">
              <Table headers={['Drug Name', 'Batch Number', 'Remaining Qty', 'Expiry Date', 'Unit', 'Action']}>
                {alerts.expiredBatches.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50 transition-colors text-sm">
                    <td className="px-4 sm:px-6 py-4 font-semibold text-navy-900">{b.drug_name} ({b.strength} {b.dosage_form})</td>
                    <td className="px-4 sm:px-6 py-4 font-mono font-medium">{b.batch_number}</td>
                    <td className="px-4 sm:px-6 py-4 font-bold text-red-600">{b.current_quantity} {b.unit_of_measurement}</td>
                    <td className="px-4 sm:px-6 py-4 text-red-600 font-semibold">{b.expiry_date}</td>
                    <td className="px-4 sm:px-6 py-4">{b.unit_of_measurement}</td>
                    <td className="px-4 sm:px-6 py-4">
                      <Link href="/stock" className="text-xs font-semibold text-red-600 hover:underline flex items-center space-x-1">
                        <span>Review / Adjust</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </Table>
            </div>
          )}
        </div>
      )}
    </Layout>
  );
}