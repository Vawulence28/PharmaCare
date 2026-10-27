'use client';

import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { X } from 'lucide-react';

const VALID_DOSAGE_FORMS = ['tablet', 'capsule', 'syrup', 'injection', 'ointment', 'drops', 'inhaler', 'other'];

export function DrugModal({ isOpen, onClose, onSubmit, drugToEdit }) {
  const [formData, setFormData] = useState({
    name: '',
    genericName: '',
    category: '',
    dosageForm: 'tablet',
    strength: '',
    unitOfMeasurement: 'tablets',
    minimumStockThreshold: 10,
    description: '',
  });

  useEffect(() => {
    if (drugToEdit) {
      setFormData({
        name: drugToEdit.name || '',
        genericName: drugToEdit.generic_name || '',
        category: drugToEdit.category || '',
        dosageForm: drugToEdit.dosage_form || 'tablet',
        strength: drugToEdit.strength || '',
        unitOfMeasurement: drugToEdit.unit_of_measurement || 'tablets',
        minimumStockThreshold: drugToEdit.minimum_stock_threshold ?? 10,
        description: drugToEdit.description || '',
      });
    } else {
      setFormData({
        name: '',
        genericName: '',
        category: '',
        dosageForm: 'tablet',
        strength: '',
        unitOfMeasurement: 'tablets',
        minimumStockThreshold: 10,
        description: '',
      });
    }
  }, [drugToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-xl space-y-6 my-8">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <h3 className="text-lg font-bold text-navy-900">
            {drugToEdit ? 'Edit Drug Record' : 'Add New Drug'}
          </h3>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input 
              label="Drug Name *" 
              value={formData.name} 
              onChange={(e) => setFormData({ ...formData, name: e.target.value })} 
              placeholder="e.g. Paracetamol"
              required 
            />
            <Input 
              label="Generic Name" 
              value={formData.genericName} 
              onChange={(e) => setFormData({ ...formData, genericName: e.target.value })} 
              placeholder="e.g. Acetaminophen" 
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input 
              label="Category *" 
              value={formData.category} 
              onChange={(e) => setFormData({ ...formData, category: e.target.value })} 
              placeholder="e.g. Analgesic"
              required 
            />
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Dosage Form *</label>
              <select 
                value={formData.dosageForm} 
                onChange={(e) => setFormData({ ...formData, dosageForm: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg shadow-sm focus:ring-2 focus:ring-navy-900 focus:outline-none text-sm capitalize"
              >
                {VALID_DOSAGE_FORMS.map((form) => (
                  <option key={form} value={form} className="capitalize">{form}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input 
              label="Strength *" 
              value={formData.strength} 
              onChange={(e) => setFormData({ ...formData, strength: e.target.value })} 
              placeholder="e.g. 500mg"
              required 
            />
            <Input 
              label="Unit of Measurement *" 
              value={formData.unitOfMeasurement} 
              onChange={(e) => setFormData({ ...formData, unitOfMeasurement: e.target.value })} 
              placeholder="e.g. tablets"
              required 
            />
            <Input 
              label="Min Stock Threshold *" 
              type="number" 
              min="0"
              value={formData.minimumStockThreshold} 
              onChange={(e) => setFormData({ ...formData, minimumStockThreshold: parseInt(e.target.value, 10) || 0 })} 
              required 
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Description / Notes</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows="3"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg shadow-sm focus:ring-2 focus:ring-navy-900 focus:outline-none text-sm"
              placeholder="Optional description or indications..."
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-slate-100">
            <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
            <Button type="submit">{drugToEdit ? 'Save Changes' : 'Create Drug'}</Button>
          </div>
        </form>
      </div>
    </div>
  );
}