'use client';

import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { fetchFromApi } from '@/utils/api';
import { X, CheckCircle, AlertCircle } from 'lucide-react';

export function IssueStockModal({ isOpen, onClose, onSuccess }) {
  const [drugs, setDrugs] = useState([]);
  const [selectedDrugId, setSelectedDrugId] = useState('');
  const [stockSummary, setStockSummary] = useState(null);
  const [quantity, setQuantity] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successResult, setSuccessResult] = useState(null);

  useEffect(() => {
    if (isOpen) {
      fetchFromApi('/drugs?status=true&limit=100')
        .then((res) => setDrugs(res.data.drugs))
        .catch(() => setError('Failed to load drugs.'));
      setSuccessResult(null);
      setSelectedDrugId('');
      setStockSummary(null);
      setQuantity('');
      setNotes('');
    }
  }, [isOpen]);

  const handleDrugChange = async (drugId) => {
    setSelectedDrugId(drugId);
    if (!drugId) {
      setStockSummary(null);
      return;
    }
    try {
      const res = await fetchFromApi(`/stock/summary/${drugId}`);
      setStockSummary(res.data.summary);
    } catch (err) {
      setError('Failed to fetch stock summary for drug.');
    }
  };

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetchFromApi('/stock/issue', {
        method: 'POST',
        body: JSON.stringify({
          drugId: parseInt(selectedDrugId, 10),
          quantity: parseInt(quantity, 10),
          notes,
        }),
      });
      setSuccessResult(res.data);
      onSuccess();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <h3 className="text-lg font-bold text-navy-900">Issue Stock (FEFO Allocation)</h3>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {successResult ? (
          <div className="space-y-4">
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 space-y-2">
              <div className="flex items-center space-x-2 font-semibold">
                <CheckCircle className="w-5 h-5 text-emerald-600" />
                <span>Stock Issued Successfully via FEFO</span>
              </div>
              <p className="text-xs text-emerald-700">Total Issued: <span className="font-bold">{successResult.totalIssued} units</span></p>
              <div className="mt-2 text-xs space-y-1 bg-white p-3 rounded-lg border border-emerald-100">
                <p className="font-semibold text-slate-700">Batch Allocations:</p>
                {successResult.allocations.map((a, i) => (
                  <p key={i} className="text-slate-600">• Batch #{a.batchNumber}: <span className="font-bold">{a.issuedQuantity} units</span></p>
                ))}
              </div>
            </div>
            <div className="flex justify-end pt-2">
              <Button onClick={onClose}>Done</Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg flex items-center space-x-2"><AlertCircle className="w-5 h-5 flex-shrink-0" /><span>{error}</span></div>}

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Select Drug *</label>
              <select
                value={selectedDrugId}
                onChange={(e) => handleDrugChange(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-navy-900 focus:outline-none bg-white"
                required
              >
                <option value="">-- Choose Drug --</option>
                {drugs.map((d) => (
                  <option key={d.id} value={d.id}>{d.name} ({d.strength} {d.dosage_form})</option>
                ))}
              </select>
            </div>

            {stockSummary && (
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex justify-between items-center text-sm">
                <div>
                  <span className="text-xs text-slate-500 block">Available Usable Stock</span>
                  <span className="font-bold text-navy-900 text-base">{stockSummary.usable_stock} units</span>
                </div>
                <div className="text-right">
                  <span className="text-xs text-slate-500 block">Expired Stock (Excluded)</span>
                  <span className="font-semibold text-red-600">{stockSummary.expired_stock} units</span>
                </div>
              </div>
            )}

            <Input
              label="Quantity to Issue *"
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="e.g. 10"
              required
            />

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Reason / Notes</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows="2"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-navy-900 focus:outline-none"
                placeholder="Dispensation notes or patient ID..."
              />
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t border-slate-100">
              <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
              <Button type="submit" disabled={loading}>{loading ? 'Issuing...' : 'Issue Stock'}</Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}