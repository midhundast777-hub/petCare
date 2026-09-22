import React, { useState, useEffect } from 'react';
import Modal from '../../components/Modal';
import { medicalService } from '../../services/medicalService';
import { petService } from '../../services/petService';
import { useToast } from '../../context/ToastContext';

export const MedicalRecordModal = ({ isOpen, onClose, onSaved }) => {
  const { addToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [pets, setPets] = useState([]);

  const [formData, setFormData] = useState({
    pet: '',
    visit_date: new Date().toISOString().split('T')[0],
    veterinarian: '',
    diagnosis: '',
    symptoms: '',
    treatment: '',
    prescription: '',
    notes: '',
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
      await medicalService.createRecord(formData);
      addToast('Medical record documented successfully!', 'success');
      if (onSaved) onSaved();
      onClose();
    } catch (err) {
      addToast('Failed to save medical record', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add Veterinary Medical Record"
      subtitle="Document visit diagnosis, symptoms, clinical treatment, and prescriptions"
      maxWidth="max-w-2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
              Visit Date *
            </label>
            <input
              type="date"
              required
              value={formData.visit_date}
              onChange={(e) => setFormData({ ...formData, visit_date: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
              Diagnosis *
            </label>
            <input
              type="text"
              required
              value={formData.diagnosis}
              onChange={(e) => setFormData({ ...formData, diagnosis: e.target.value })}
              placeholder="e.g. Acute Otitis Externa, Dermatitis"
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
              Attending Veterinarian *
            </label>
            <input
              type="text"
              required
              value={formData.veterinarian}
              onChange={(e) => setFormData({ ...formData, veterinarian: e.target.value })}
              placeholder="e.g. Dr. Alex Rivera"
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
            Observed Symptoms
          </label>
          <input
            type="text"
            value={formData.symptoms}
            onChange={(e) => setFormData({ ...formData, symptoms: e.target.value })}
            placeholder="Head shaking, ear scratching, discharge..."
            className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20"
          />
        </div>

        <div>
          <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
            Clinical Treatment Provided
          </label>
          <textarea
            rows={2}
            value={formData.treatment}
            onChange={(e) => setFormData({ ...formData, treatment: e.target.value })}
            placeholder="Ear flush, deep clean, topical drops applied"
            className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20"
          />
        </div>

        <div>
          <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
            Prescription (Rx) & Home Care
          </label>
          <input
            type="text"
            value={formData.prescription}
            onChange={(e) => setFormData({ ...formData, prescription: e.target.value })}
            placeholder="e.g. Posatex drops 4 drops daily for 7 days"
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
            {loading ? 'Saving...' : 'Save Medical Record'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default MedicalRecordModal;
