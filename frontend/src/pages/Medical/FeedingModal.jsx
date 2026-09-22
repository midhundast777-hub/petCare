import React, { useState, useEffect } from 'react';
import Modal from '../../components/Modal';
import { medicalService } from '../../services/medicalService';
import { petService } from '../../services/petService';
import { useToast } from '../../context/ToastContext';

export const FeedingModal = ({ isOpen, onClose, onSaved }) => {
  const { addToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [pets, setPets] = useState([]);

  const [formData, setFormData] = useState({
    pet: '',
    food_type: '',
    quantity: '1 cup (150g)',
    feeding_time: '08:00 AM & 06:00 PM',
    frequency: 'Twice daily',
    special_instructions: '',
  });

  useEffect(() => {
    if (isOpen) {
      petService.getAll().then((res) => {
        setPets(Array.isArray(res) ? res : res.results || []);
      }).catch(console.error);
    }
  }, [isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await medicalService.createFeedingSchedule(formData);
      addToast('Feeding schedule created successfully!', 'success');
      if (onSaved) onSaved();
      onClose();
    } catch (err) {
      addToast('Failed to save feeding schedule', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create Pet Feeding Schedule"
      subtitle="Configure diet brands, exact portions, feeding windows, and preparation notes"
      maxWidth="max-w-xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
            Pet *
          </label>
          <select
            required
            value={formData.pet}
            onChange={(e) => setFormData({ ...formData, pet: e.target.value })}
            className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20"
          >
            <option value="">Select Pet...</option>
            {pets.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.species} • Owner: {p.owner_name})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
            Food Brand / Type *
          </label>
          <input
            type="text"
            required
            value={formData.food_type}
            onChange={(e) => setFormData({ ...formData, food_type: e.target.value })}
            placeholder="e.g. Purina Pro Plan Salmon Sensitive Skin dry kibble"
            className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
              Portion Quantity *
            </label>
            <input
              type="text"
              required
              value={formData.quantity}
              onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
              placeholder="e.g. 1.5 cups, 1 pouch 85g"
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
              Feeding Times / Window *
            </label>
            <input
              type="text"
              required
              value={formData.feeding_time}
              onChange={(e) => setFormData({ ...formData, feeding_time: e.target.value })}
              placeholder="e.g. 08:00 AM & 05:30 PM"
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
            Special Preparation Instructions
          </label>
          <input
            type="text"
            value={formData.special_instructions}
            onChange={(e) => setFormData({ ...formData, special_instructions: e.target.value })}
            placeholder="e.g. Add 2 tbsp warm water, mix with salmon oil"
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
            {loading ? 'Saving...' : 'Save Feeding Schedule'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default FeedingModal;
