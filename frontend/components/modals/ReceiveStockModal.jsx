'use client';

import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { fetchFromApi } from '@/utils/api';
import { X } from 'lucide-react';

export function ReceiveStockModal({ isOpen, onClose, onSuccess }) {
  const [batches, setBatches] = useState([]);
  const [formData, setFormData] = useState({ batchId: '', quantity: '', notes: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen) {
      fetchFromApi('/stock/batches')
        .then((res) => setBatches(res.data.batches.filter((b) => b.status !== 'EXPIRED')))
        .catch(() => setError('Failed to load active batches.'));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await fetchFromApi('/stock/receive', {
        method: 'POST',
        body: JSON.stringify({
          batchId: parseInt(formData.batchId, 10),
          quantity: parseInt(formData.quantity, 10),
          notes: formData.notes,
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
          <h3 className="text-lg font-bold text-navy-900">Receive Additional Stock</h3>
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
                  {b.drug_name} — Batch: {b.batch_number} (Qty: {b.current_quantity})
                </option>
              ))}
            </select>
          </div>

          <Input
            label="Quantity to Add *"
            type="number"
            min="1"
            value={formData.quantity}
            onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
            required
          />

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Reason / Shipment Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows="2"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-navy-900 focus:outline-none"
              placeholder="Reason for stock addition..."
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-slate-100">
            <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={loading}>{loading ? 'Processing...' : 'Receive Stock'}</Button>
          </div>
        </form>
      </div>
    </div>
  );
}