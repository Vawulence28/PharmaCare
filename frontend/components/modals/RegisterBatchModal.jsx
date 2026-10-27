'use client';

import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { fetchFromApi } from '@/utils/api';
import { X } from 'lucide-react';

export function RegisterBatchModal({ isOpen, onClose, onSuccess }) {
  const [drugs, setDrugs] = useState([]);
  const [formData, setFormData] = useState({
    drugId: '',
    batchNumber: '',
    quantityReceived: '',
    expiryDate: '',
    unitCost: '',
    notes: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen) {
      fetchFromApi('/drugs?status=true&limit=100')
        .then((res) => setDrugs(res.data.drugs))
        .catch((err) => setError('Failed to load active drugs list.'));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await fetchFromApi('/stock/batches', {
        method: 'POST',
        body: JSON.stringify({
          ...formData,
          drugId: parseInt(formData.drugId, 10),
          quantityReceived: parseInt(formData.quantityReceived, 10),
          unitCost: formData.unitCost ? parseFloat(formData.unitCost) : 0,
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl space-y-6 my-8">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <h3 className="text-lg font-bold text-navy-900">Register New Batch</h3>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Select Drug *</label>
            <select
              value={formData.drugId}
              onChange={(e) => setFormData({ ...formData, drugId: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-navy-900 focus:outline-none bg-white"
              required
            >
              <option value="">-- Choose Drug --</option>
              {drugs.map((d) => (
                <option key={d.id} value={d.id}>{d.name} ({d.strength} {d.dosage_form})</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Batch Number *"
              value={formData.batchNumber}
              onChange={(e) => setFormData({ ...formData, batchNumber: e.target.value })}
              placeholder="e.g. B-2026-001"
              required
            />
            <Input
              label="Quantity Received *"
              type="number"
              min="1"
              value={formData.quantityReceived}
              onChange={(e) => setFormData({ ...formData, quantityReceived: e.target.value })}
              placeholder="e.g. 100"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Expiry Date *"
              type="date"
              value={formData.expiryDate}
              onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
              required
            />
            <Input
              label="Unit Cost ($)"
              type="number"
              step="0.01"
              min="0"
              value={formData.unitCost}
              onChange={(e) => setFormData({ ...formData, unitCost: e.target.value })}
              placeholder="e.g. 2.50"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Notes / Shipment Details</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows="2"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-navy-900 focus:outline-none"
              placeholder="Optional supplier or shipment remarks..."
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-slate-100">
            <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={loading}>{loading ? 'Registering...' : 'Register Batch'}</Button>
          </div>
        </form>
      </div>
    </div>
  );
}