import React, { useState, useEffect } from 'react';
import Modal from '../../components/Modal';
import { serviceService } from '../../services/serviceService';
import { useToast } from '../../context/ToastContext';

export const ServiceModal = ({ isOpen, onClose, service, onSaved }) => {
  const { addToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    category: 'GROOMING',
    description: '',
    price: '',
    duration_minutes: 60,
    status: 'ACTIVE',
  });

  useEffect(() => {
    if (service) {
      setFormData({
        name: service.name || '',
        category: service.category || 'GROOMING',
        description: service.description || '',
        price: service.price || '',
        duration_minutes: service.duration_minutes || 60,
        status: service.status || 'ACTIVE',
      });
    } else {
      setFormData({
        name: '',
        category: 'GROOMING',
        description: '',
        price: '',
        duration_minutes: 60,
        status: 'ACTIVE',
      });
    }
  }, [service, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (service?.id) {
        await serviceService.update(service.id, formData);
        addToast('Service updated successfully!', 'success');
      } else {
        await serviceService.create(formData);
        addToast('New service added to catalog!', 'success');
      }
      if (onSaved) onSaved();
      onClose();
    } catch (err) {
      addToast('Failed to save service', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={service?.id ? 'Edit Service Details' : 'Add New Pet Care Service'}
      subtitle="Define pricing, category, standard duration, and description"
      maxWidth="max-w-lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
            Service Name *
          </label>
          <input
            type="text"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g. Deluxe Spa Bath, Behavioral Training"
            className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
              Category *
            </label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20"
            >
              <option value="GROOMING">Pet Grooming</option>
              <option value="BATHING">Bathing & Spa</option>
              <option value="BOARDING">Pet Boarding</option>
              <option value="DAYCARE">Doggy Daycare</option>
              <option value="TRAINING">Behavioral Training</option>
              <option value="VETERINARY">Veterinary Visit</option>
              <option value="NAIL_TRIMMING">Nail Trimming</option>
              <option value="TRANSPORTATION">Pet Taxi Transport</option>
              <option value="OTHER">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
              Price ($) *
            </label>
            <input
              type="number"
              step="0.01"
              required
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              placeholder="e.g. 65.00"
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
              Duration (Minutes) *
            </label>
            <input
              type="number"
              required
              value={formData.duration_minutes}
              onChange={(e) => setFormData({ ...formData, duration_minutes: e.target.value })}
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
              Status
            </label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20"
            >
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
            Service Description
          </label>
          <textarea
            rows={3}
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Detailed description of what this service package includes..."
            className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20"
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-sm font-bold shadow-sm transition-colors disabled:opacity-50"
          >
            {loading ? 'Saving...' : service?.id ? 'Update Service' : 'Add Service'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default ServiceModal;
