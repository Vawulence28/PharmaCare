'use client';

import React from 'react';
import { Button } from '@/components/ui/Button';
import { Pill, X, Shield, Calendar, Layers, Activity } from 'lucide-react';

export function DrugDetailModal({ isOpen, onClose, drug }) {
  if (!isOpen || !drug) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center space-x-3">
            <div className="bg-blue-600 p-2.5 rounded-xl text-white">
              <Pill className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-navy-900">{drug.name}</h3>
              <p className="text-xs text-slate-500">ID: #{drug.id} {drug.generic_name ? `• Generic: ${drug.generic_name}` : ''}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm bg-slate-50 p-4 rounded-xl border border-slate-200">
          <div>
            <span className="text-xs text-slate-500 block">Category</span>
            <span className="font-semibold text-slate-800">{drug.category}</span>
          </div>
          <div>
            <span className="text-xs text-slate-500 block">Dosage Form</span>
            <span className="font-semibold text-slate-800 capitalize">{drug.dosage_form}</span>
          </div>
          <div>
            <span className="text-xs text-slate-500 block">Strength & Unit</span>
            <span className="font-semibold text-slate-800">{drug.strength} ({drug.unit_of_measurement})</span>
          </div>
          <div>
            <span className="text-xs text-slate-500 block">Minimum Threshold</span>
            <span className="font-semibold text-slate-800">{drug.minimum_stock_threshold} {drug.unit_of_measurement}</span>
          </div>
          <div>
            <span className="text-xs text-slate-500 block">Status</span>
            <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold mt-0.5 ${
              drug.is_active ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
            }`}>
              {drug.is_active ? 'Active' : 'Archived'}
            </span>
          </div>
          <div>
            <span className="text-xs text-slate-500 block">Created At</span>
            <span className="font-semibold text-slate-800 text-xs">{new Date(drug.created_at).toLocaleDateString()}</span>
          </div>
        </div>

        {drug.description && (
          <div>
            <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Description</h4>
            <p className="text-sm text-slate-700 bg-white p-3 rounded-lg border border-slate-200">{drug.description}</p>
          </div>
        )}

        <div className="flex justify-end pt-4 border-t border-slate-100">
          <Button onClick={onClose}>Close</Button>
        </div>
      </div>
    </div>
  );
}