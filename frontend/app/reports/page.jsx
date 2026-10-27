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
import { 
  Printer, 
  FileText, 
  Calendar, 
  Filter, 
  RefreshCw, 
  TrendingDown, 
  AlertTriangle, 
  Clock, 
  ArrowDownRight, 
  ArrowUpRight, 
  Sliders 
} from 'lucide-react';

export default function ReportsPage() {
  const [reportType, setReportType] = useState('current-stock');
  const [reportData, setReportData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [category, setCategory] = useState('');
  const [batchNumber, setBatchNumber] = useState('');
  const [windowDays, setWindowDays] = useState(30);

  const loadReport = async () => {
    setLoading(true);
    setError(null);
    try {
      let endpoint = `/reports/${reportType}`;
      const queryParams = new URLSearchParams();

      if (['received', 'issued', 'adjustments'].includes(reportType)) {
        if (startDate) queryParams.append('startDate', startDate);
        if (endDate) queryParams.append('endDate', endDate);
        if (batchNumber) queryParams.append('batchNumber', batchNumber);
      }

      if (reportType === 'current-stock' && category) {
        queryParams.append('category', category);
      }

      if (reportType === 'upcoming-expiry' && windowDays) {
        queryParams.append('windowDays', windowDays);
      }

      const queryString = queryParams.toString();
      if (queryString) endpoint += `?${queryString}`;

      const res = await fetchFromApi(endpoint);
      setReportData(res.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReport();
  }, [reportType]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <Layout>
      {/* Print-only Header (hidden on screen, visible during browser print) */}
      <div className="hidden print:block p-4 mb-6 border-b border-slate-300">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">PharmaCare Inventory Management</h1>
            <h2 className="text-lg font-semibold text-slate-700 capitalize mt-1">
              {reportType.replace('-', ' ')} Report
            </h2>
          </div>
          <div className="text-right text-xs text-slate-500">
            <p>Generated: {new Date().toLocaleString()}</p>
            {startDate && endDate && <p>Date Range: {startDate} to {endDate}</p>}
          </div>
        </div>
      </div>

      <div className="print:hidden">
        <PageHeader 
          title="Inventory Reports" 
          description="Generate, filter, and print detailed stock level, movement, and alert audits."
          action={
            <Button onClick={handlePrint} variant="outline" className="flex items-center space-x-2 text-xs py-2">
              <Printer className="w-4 h-4 text-slate-600" />
              <span>Print Report</span>
            </Button>
          }
        />
      </div>

      {/* Report Selection Tabs */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 mb-6 print:hidden flex flex-wrap gap-2">
        <button
          onClick={() => setReportType('current-stock')}
          className={`px-3 py-2 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-colors ${
            reportType === 'current-stock' ? 'bg-navy-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Current Stock</span>
        </button>

        <button
          onClick={() => setReportType('received')}
          className={`px-3 py-2 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-colors ${
            reportType === 'received' ? 'bg-navy-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <ArrowDownRight className="w-3.5 h-3.5 text-emerald-500" />
          <span>Stock Received</span>
        </button>

        <button
          onClick={() => setReportType('issued')}
          className={`px-3 py-2 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-colors ${
            reportType === 'issued' ? 'bg-navy-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <ArrowUpRight className="w-3.5 h-3.5 text-blue-500" />
          <span>Stock Issued</span>
        </button>

        <button
          onClick={() => setReportType('adjustments')}
          className={`px-3 py-2 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-colors ${
            reportType === 'adjustments' ? 'bg-navy-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <Sliders className="w-3.5 h-3.5 text-amber-500" />
          <span>Adjustments</span>
        </button>

        <button
          onClick={() => setReportType('low-stock')}
          className={`px-3 py-2 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-colors ${
            reportType === 'low-stock' ? 'bg-amber-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <AlertTriangle className="w-3.5 h-3.5" />
          <span>Low-Stock Report</span>
        </button>

        <button
          onClick={() => setReportType('upcoming-expiry')}
          className={`px-3 py-2 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-colors ${
            reportType === 'upcoming-expiry' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>Upcoming Expiry</span>
        </button>

        <button
          onClick={() => setReportType('expired')}
          className={`px-3 py-2 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-colors ${
            reportType === 'expired' ? 'bg-red-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <TrendingDown className="w-3.5 h-3.5" />
          <span>Expired Batches</span>
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 mb-6 print:hidden flex flex-wrap gap-4 items-center">
        {['received', 'issued', 'adjustments'].includes(reportType) && (
          <>
            <div className="flex items-center space-x-2">
              <label className="text-xs font-medium text-slate-600">Start Date:</label>
              <input 
                type="date" 
                value={startDate} 
                onChange={(e) => setStartDate(e.target.value)} 
                className="px-3 py-1.5 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-navy-900 focus:outline-none"
              />
            </div>

            <div className="flex items-center space-x-2">
              <label className="text-xs font-medium text-slate-600">End Date:</label>
              <input 
                type="date" 
                value={endDate} 
                onChange={(e) => setEndDate(e.target.value)} 
                className="px-3 py-1.5 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-navy-900 focus:outline-none"
              />
            </div>
          </>
        )}

        {reportType === 'current-stock' && (
          <div className="flex items-center space-x-2">
            <label className="text-xs font-medium text-slate-600">Category:</label>
            <input 
              type="text" 
              placeholder="Filter by category..."
              value={category} 
              onChange={(e) => setCategory(e.target.value)} 
              className="px-3 py-1.5 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-navy-900 focus:outline-none"
            />
          </div>
        )}

        {reportType === 'upcoming-expiry' && (
          <div className="flex items-center space-x-2">
            <label className="text-xs font-medium text-slate-600">Window (Days):</label>
            <input 
              type="number" 
              value={windowDays} 
              onChange={(e) => setWindowDays(e.target.value)} 
              className="w-20 px-3 py-1.5 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-navy-900 focus:outline-none"
            />
          </div>
        )}

        <Button onClick={loadReport} className="text-xs py-1.5 px-3 flex items-center space-x-1">
          <Filter className="w-3.5 h-3.5" />
          <span>Apply Filters</span>
        </Button>
      </div>

      {/* Main Report Table Display */}
      {error && <div className="mb-6"><ErrorMessage title="Failed to Load Report" message={error} /></div>}

      {loading ? (
        <Loading message="Generating inventory report..." />
      ) : reportData.length === 0 ? (
        <EmptyState title="No records found" description="No matching data found for the selected report criteria." />
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden print:border-none print:shadow-none">
          {reportType === 'current-stock' && (
            <Table headers={['Drug Name', 'Form & Strength', 'Category', 'Usable Stock', 'Expired Stock', 'Total Stock', 'Unit']}>
              {reportData.map((d) => (
                <tr key={d.drug_id} className="hover:bg-slate-50 transition-colors text-xs">
                  <td className="px-6 py-4 font-semibold text-navy-900">{d.drug_name}</td>
                  <td className="px-6 py-4">{d.dosage_form} ({d.strength})</td>
                  <td className="px-6 py-4">{d.category}</td>
                  <td className="px-6 py-4 font-bold text-emerald-600">{d.usable_stock}</td>
                  <td className="px-6 py-4 font-semibold text-red-600">{d.expired_stock}</td>
                  <td className="px-6 py-4 font-bold text-slate-800">{d.total_stock}</td>
                  <td className="px-6 py-4">{d.unit_of_measurement}</td>
                </tr>
              ))}
            </Table>
          )}

          {['received', 'issued', 'adjustments'].includes(reportType) && (
            <Table headers={['Type', 'Drug Name', 'Batch #', 'Quantity', 'User', 'Reason / Notes', 'Date & Time']}>
              {reportData.map((t) => (
                <tr key={t.transaction_id} className="hover:bg-slate-50 transition-colors text-xs">
                  <td className="px-6 py-4 font-semibold">
                    <span className={`px-2 py-0.5 rounded ${
                      t.transaction_type === 'RECEIVED' ? 'bg-emerald-100 text-emerald-800' :
                      t.transaction_type === 'ISSUED' ? 'bg-blue-100 text-blue-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {t.transaction_type}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-medium text-navy-900">{t.drug_name} ({t.strength})</td>
                  <td className="px-6 py-4 font-mono">{t.batch_number}</td>
                  <td className={`px-6 py-4 font-mono font-bold ${t.quantity > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                    {t.quantity > 0 ? `+${t.quantity}` : t.quantity} {t.unit_of_measurement}
                  </td>
                  <td className="px-6 py-4">{t.user_name}</td>
                  <td className="px-6 py-4 text-slate-500 max-w-xs">{t.reason_or_notes || '—'}</td>
                  <td className="px-6 py-4 text-slate-400">{new Date(t.transaction_date).toLocaleString()}</td>
                </tr>
              ))}
            </Table>
          )}

          {reportType === 'low-stock' && (
            <Table headers={['Drug Name', 'Form & Strength', 'Category', 'Usable Stock', 'Min Threshold', 'Unit']}>
              {reportData.map((d) => (
                <tr key={d.drug_id} className="hover:bg-slate-50 transition-colors text-xs">
                  <td className="px-6 py-4 font-semibold text-navy-900">{d.drug_name}</td>
                  <td className="px-6 py-4">{d.dosage_form} ({d.strength})</td>
                  <td className="px-6 py-4">{d.category}</td>
                  <td className="px-6 py-4 font-bold text-amber-600">{d.usable_stock}</td>
                  <td className="px-6 py-4">{d.minimum_stock_threshold}</td>
                  <td className="px-6 py-4">{d.unit_of_measurement}</td>
                </tr>
              ))}
            </Table>
          )}

          {['upcoming-expiry', 'expired'].includes(reportType) && (
            <Table headers={['Drug Name', 'Batch #', 'Remaining Qty', 'Expiry Date', 'Unit']}>
              {reportData.map((b) => (
                <tr key={b.batch_id} className="hover:bg-slate-50 transition-colors text-xs">
                  <td className="px-6 py-4 font-semibold text-navy-900">{b.drug_name} ({b.strength} {b.dosage_form})</td>
                  <td className="px-6 py-4 font-mono">{b.batch_number}</td>
                  <td className={`px-6 py-4 font-bold ${reportType === 'expired' ? 'text-red-600' : 'text-amber-600'}`}>
                    {b.current_quantity}
                  </td>
                  <td className="px-6 py-4 font-semibold">{b.expiry_date}</td>
                  <td className="px-6 py-4">{b.unit_of_measurement}</td>
                </tr>
              ))}
            </Table>
          )}
        </div>
      )}
    </Layout>
  );
}