'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Table } from '@/components/ui/Table';
import { fetchFromApi } from '@/utils/api';
import { Layers, X, Clock } from 'lucide-react';

export function BatchDetailModal({ isOpen, onClose, batch }) {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && batch) {
      setLoading(true);
      fetchFromApi(`/stock/transactions?batchId=${batch.id}`)
        .then((res) => setTransactions(res.data.transactions))
        .catch(() => setTransactions([]))
        .finally(() => setLoading(false));
    }
  }, [isOpen, batch]);

  if (!isOpen || !batch) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-xl space-y-6 my-8">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center space-x-3">
            <div className="bg-blue-600 p-2.5 rounded-xl text-white">
              <Layers className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-navy-900">Batch #{batch.batch_number}</h3>
              <p className="text-xs text-slate-500">Drug: {batch.drug_name} ({batch.strength} {batch.dosage_form})</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm bg-slate-50 p-4 rounded-xl border border-slate-200">
          <div>
            <span className="text-xs text-slate-500 block">Current Qty</span>
            <span className="font-bold text-navy-900 text-base">{batch.current_quantity}</span>
          </div>
          <div>
            <span className="text-xs text-slate-500 block">Received Qty</span>
            <span className="font-semibold text-slate-800">{batch.quantity_received}</span>
          </div>
          <div>
            <span className="text-xs text-slate-500 block">Expiry Date</span>
            <span className="font-semibold text-slate-800">{batch.expiry_date}</span>
          </div>
          <div>
            <span className="text-xs text-slate-500 block">Status</span>
            <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold mt-0.5 ${
              batch.status === 'AVAILABLE' ? 'bg-emerald-100 text-emerald-800' :
              batch.status === 'EXPIRING_SOON' ? 'bg-amber-100 text-amber-800' :
              batch.status === 'EXPIRED' ? 'bg-red-100 text-red-800' : 'bg-slate-200 text-slate-700'
            }`}>
              {batch.status}
            </span>
          </div>
        </div>

        <div>
          <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 flex items-center space-x-1">
            <Clock className="w-4 h-4" />
            <span>Batch Transaction Audit History</span>
          </h4>
          {loading ? (
            <p className="text-sm text-slate-500 py-4 text-center">Loading transaction logs...</p>
          ) : transactions.length === 0 ? (
            <p className="text-sm text-slate-500 py-4 text-center">No transactions recorded for this batch.</p>
          ) : (
            <div className="max-h-60 overflow-y-auto border border-slate-200 rounded-xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 border-b border-slate-200 text-slate-600 uppercase">
                  <tr>
                    <th className="px-4 py-2">Type</th>
                    <th className="px-4 py-2">Qty</th>
                    <th className="px-4 py-2">User</th>
                    <th className="px-4 py-2">Notes</th>
                    <th className="px-4 py-2">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-slate-700">
                  {transactions.map((t) => (
                    <tr key={t.id}>
                      <td className="px-4 py-2 font-semibold">
                        <span className={`px-2 py-0.5 rounded text-[10px] ${
                          t.transaction_type === 'RECEIVED' ? 'bg-emerald-100 text-emerald-800' :
                          t.transaction_type === 'ISSUED' ? 'bg-blue-100 text-blue-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {t.transaction_type}
                        </span>
                      </td>
                      <td className={`px-4 py-2 font-mono font-semibold ${t.quantity > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                        {t.quantity > 0 ? `+${t.quantity}` : t.quantity}
                      </td>
                      <td className="px-4 py-2">{t.user_name}</td>
                      <td className="px-4 py-2 text-slate-500 truncate max-w-xs">{t.reason_or_notes || '—'}</td>
                      <td className="px-4 py-2 text-slate-400">{new Date(t.transaction_date).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="flex justify-end pt-4 border-t border-slate-100">
          <Button onClick={onClose}>Close</Button>
        </div>
      </div>
    </div>
  );
}