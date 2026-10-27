'use client';

import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { fetchFromApi } from '@/utils/api';
import { X, ShieldAlert } from 'lucide-react';

export function AdjustStockModal({ isOpen, onClose, onSuccess }) {
  const [batches, setBatches] = useState([]);
  const [formData, setFormData] = useState({ batchId: '', newQuantity: '', reason: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen) {
      fetchFromApi('/stock/batches')
        .then((res) => setBatches(res.data.batches))
        .catch(() => setError('Failed to load batches.'));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await fetchFromApi('/stock/adjust', {
        method: 'POST',
        body: JSON.stringify({
          batchId: parseInt(formData.batchId, 10),
          newQuantity: parseInt(formData.newQuantity, 10),
          reason: formData.reason,
        }),
      });
      onSuccess();
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center space-x-2 text-amber-700">
            <ShieldAlert className="w-5 h-5" />
            <h3 className="text-lg font-bold text-navy-900">Authorized Stock Adjustment</h3>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Select Batch *</label>
            <select
              value={formData.batchId}
              onChange={(e) => setFormData({ ...formData, batchId: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-navy-900 focus:outline-none bg-white"
              required
            >
              <option value="">-- Choose Batch --</option>
              {batches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.drug_name} — Batch: {b.batch_number} (Current Qty: {b.current_quantity})
                </option>
              ))}
            </select>
          </div>

          <Input
            label="New Absolute Quantity *"
            type="number"
            min="0"
            value={formData.newQuantity}
            onChange={(e) => setFormData({ ...formData, newQuantity: e.target.value })}
            placeholder="e.g. 85"
            required
          />

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Reason for Adjustment *</label>
            <textarea
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              rows="3"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-navy-900 focus:outline-none"
              placeholder="Mandatory audit reason (e.g., physical count discrepancy, damaged stock write-off)..."
              required
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-slate-100">
            <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={loading}>{loading ? 'Adjusting...' : 'Apply Adjustment'}</Button>
          </div>
        </form>
      </div>
    </div>
  );
}