import React, { useState, useEffect } from 'react';
import Modal from '../../components/Modal';
import { vaccinationService } from '../../services/vaccinationService';
import { petService } from '../../services/petService';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../context/ToastContext';

export const VaccinationModal = ({ isOpen, onClose, vaccination, onSaved }) => {
  const { isCustomer } = useAuth();
  const { addToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [pets, setPets] = useState([]);

  const todayStr = new Date().toISOString().split('T')[0];
  const nextYearStr = new Date(Date.now() + 365 * 86400000).toISOString().split('T')[0];

  const [formData, setFormData] = useState({
    pet: '',
    vaccine_name: '',
    vaccination_date: todayStr,
    expiry_date: nextYearStr,
    veterinarian: '',
    certificate_number: '',
    document_url: '',
    notes: '',
  });

  useEffect(() => {
    if (isOpen) {
      petService.getAll().then((res) => {
        setPets(Array.isArray(res) ? res : res.results || []);
      }).catch(console.error);
    }
  }, [isOpen]);

  useEffect(() => {
    if (vaccination) {
      setFormData({
        pet: vaccination.pet || '',
        vaccine_name: vaccination.vaccine_name || '',
        vaccination_date: vaccination.vaccination_date || todayStr,
        expiry_date: vaccination.expiry_date || nextYearStr,
        veterinarian: vaccination.veterinarian || '',
        certificate_number: vaccination.certificate_number || '',
        document_url: vaccination.document_url || '',
        notes: vaccination.notes || '',
      });
    } else {
      setFormData({
        pet: '',
        vaccine_name: '',
        vaccination_date: todayStr,
        expiry_date: nextYearStr,
        veterinarian: '',
        certificate_number: '',
        document_url: '',
        notes: '',
      });
    }
  }, [vaccination, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (vaccination?.id) {
        await vaccinationService.update(vaccination.id, formData);
        addToast('Vaccination record updated!', 'success');
      } else {
        await vaccinationService.create(formData);
        addToast('Vaccination record logged successfully!', 'success');
      }
      if (onSaved) onSaved();
      onClose();
    } catch (err) {
      addToast('Failed to save vaccination record', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={vaccination?.id ? 'Edit Vaccination Record' : 'Log New Vaccination'}
      subtitle="Track vaccine certificates, validity, and upcoming expirations"
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
            Vaccine Name *
          </label>
          <input
            type="text"
            required
            value={formData.vaccine_name}
            onChange={(e) => setFormData({ ...formData, vaccine_name: e.target.value })}
            placeholder="e.g. Rabies 3-Year, DHPP, Bordetella, FVRCP"
            className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
              Date Administered *
            </label>
            <input
              type="date"
              required
              value={formData.vaccination_date}
              onChange={(e) => setFormData({ ...formData, vaccination_date: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
              Expiration Date *
            </label>
            <input
              type="date"
              required
              value={formData.expiry_date}
              onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
              Administering Veterinarian
            </label>
            <input
              type="text"
              value={formData.veterinarian}
              onChange={(e) => setFormData({ ...formData, veterinarian: e.target.value })}
              placeholder="e.g. Dr. Alex Rivera"
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
              Certificate / Lot Number
            </label>
            <input
              type="text"
              value={formData.certificate_number}
              onChange={(e) => setFormData({ ...formData, certificate_number: e.target.value })}
              placeholder="e.g. VAX-2024-881"
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
            Notes
          </label>
          <textarea
            rows={2}
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            placeholder="Special manufacturer details or pet reaction..."
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
            {loading ? 'Saving...' : vaccination?.id ? 'Update Record' : 'Record Vaccination'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default VaccinationModal;
