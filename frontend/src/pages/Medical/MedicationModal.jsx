import React, { useState, useEffect } from 'react';
import Modal from '../../components/Modal';
import { medicalService } from '../../services/medicalService';
import { petService } from '../../services/petService';
import { authService } from '../../services/authService';
import { useToast } from '../../context/ToastContext';

export const MedicationModal = ({ isOpen, onClose, onSaved }) => {
  const { addToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [pets, setPets] = useState([]);
  const [staff, setStaff] = useState([]);

  const todayStr = new Date().toISOString().split('T')[0];

  const [formData, setFormData] = useState({
    pet: '',
    medicine_name: '',
    dosage: '',
    frequency: 'Twice daily',
    start_date: todayStr,
    end_date: '',
    instructions: '',
    assigned_staff: '',
    status: 'ACTIVE',
  });

  useEffect(() => {
    if (isOpen) {
      petService.getAll().then((res) => {
        setPets(Array.isArray(res) ? res : res.results || []);
      }).catch(console.error);

      authService.getUsers({ role: 'STAFF' }).then((res) => {
        setStaff(Array.isArray(res) ? res : res.results || []);
      }).catch(console.error);
    }
  }, [isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await medicalService.createMedication(formData);
      addToast('Medication schedule logged successfully!', 'success');
      if (onSaved) onSaved();
      onClose();
    } catch (err) {
      addToast('Failed to save medication', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add Pet Medication Regimen"
      subtitle="Track active prescriptions, dosage schedules, and staff administration logs"
      maxWidth="max-w-xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
            Pet Patient *
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
            Medication Name *
          </label>
          <input
            type="text"
            required
            value={formData.medicine_name}
            onChange={(e) => setFormData({ ...formData, medicine_name: e.target.value })}
            placeholder="e.g. Apoquel, Thyro-Tabs, Carprofen"
            className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
              Dosage *
            </label>
            <input
              type="text"
              required
              value={formData.dosage}
              onChange={(e) => setFormData({ ...formData, dosage: e.target.value })}
              placeholder="e.g. 10mg (1 tablet), 5ml liquid"
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
              Frequency *
            </label>
            <input
              type="text"
              required
              value={formData.frequency}
              onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
              placeholder="e.g. Twice daily with meals"
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
              Start Date *
            </label>
            <input
              type="date"
              required
              value={formData.start_date}
              onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
              End Date (Optional)
            </label>
            <input
              type="date"
              value={formData.end_date}
              onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
            Special Administration Instructions
          </label>
          <input
            type="text"
            value={formData.instructions}
            onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
            placeholder="e.g. Wrap in pill pocket treat, do not give with dairy"
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
            {loading ? 'Saving...' : 'Add Medication'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default MedicationModal;
