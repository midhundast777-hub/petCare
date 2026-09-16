import React, { useState, useEffect } from 'react';
import Modal from '../../components/Modal';
import { petService } from '../../services/petService';
import { customerService } from '../../services/customerService';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../context/ToastContext';

export const PetModal = ({ isOpen, onClose, pet, onSaved, defaultOwnerId }) => {
  const { isCustomer } = useAuth();
  const { addToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    owner: '',
    species: 'DOG',
    breed: '',
    gender: 'MALE',
    date_of_birth: '',
    color: '',
    weight: '',
    microchip_number: '',
    photo: '',
    blood_group: '',
    allergies: '',
    medical_conditions: '',
    special_needs: '',
    dietary_preferences: '',
    personality_behavior: '',
    emergency_instructions: '',
    status: 'ACTIVE',
  });

  useEffect(() => {
    if (!isCustomer) {
      customerService.getAll().then((res) => {
        const list = Array.isArray(res) ? res : res.results || [];
        setCustomers(list);
      }).catch(console.error);
    }
  }, [isCustomer]);

  useEffect(() => {
    if (pet) {
      setFormData({
        name: pet.name || '',
        owner: pet.owner || defaultOwnerId || '',
        species: pet.species || 'DOG',
        breed: pet.breed || '',
        gender: pet.gender || 'MALE',
        date_of_birth: pet.date_of_birth || '',
        color: pet.color || '',
        weight: pet.weight || '',
        microchip_number: pet.microchip_number || '',
        photo: pet.photo || '',
        blood_group: pet.blood_group || '',
        allergies: pet.allergies || '',
        medical_conditions: pet.medical_conditions || '',
        special_needs: pet.special_needs || '',
        dietary_preferences: pet.dietary_preferences || '',
        personality_behavior: pet.personality_behavior || '',
        emergency_instructions: pet.emergency_instructions || '',
        status: pet.status || 'ACTIVE',
      });
    } else {
      setFormData({
        name: '',
        owner: defaultOwnerId || '',
        species: 'DOG',
        breed: '',
        gender: 'MALE',
        date_of_birth: '',
        color: '',
        weight: '',
        microchip_number: '',
        photo: '',
        blood_group: '',
        allergies: '',
        medical_conditions: '',
        special_needs: '',
        dietary_preferences: '',
        personality_behavior: '',
        emergency_instructions: '',
        status: 'ACTIVE',
      });
    }
  }, [pet, isOpen, defaultOwnerId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const payload = { ...formData };
    if (isCustomer || !payload.owner) {
      delete payload.owner;
    }
    if (!payload.date_of_birth) delete payload.date_of_birth;
    if (payload.weight === '' || payload.weight === null) delete payload.weight;

    try {
      if (pet?.id) {
        await petService.update(pet.id, payload);
        addToast('Pet profile updated successfully!', 'success');
      } else {
        await petService.create(payload);
        addToast('Pet registered successfully!', 'success');
      }
      if (onSaved) onSaved();
      onClose();
    } catch (err) {
      const errorData = err.response?.data;
      let msg = 'Failed to save pet details. Check inputs.';
      if (typeof errorData === 'string') {
        msg = errorData;
      } else if (errorData?.detail) {
        msg = errorData.detail;
      } else if (errorData && typeof errorData === 'object') {
        const firstKey = Object.keys(errorData)[0];
        const val = errorData[firstKey];
        msg = `${firstKey}: ${Array.isArray(val) ? val.join(', ') : val}`;
      }
      addToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={pet?.id ? `Edit ${pet.name}'s Profile` : 'Register New Pet'}
      subtitle="Complete veterinary profile, dietary preferences, and emergency notes"
      maxWidth="max-w-2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Basic Info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
              Pet Name *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20"
            />
          </div>

          {!isCustomer && (
            <div>
              <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                Pet Owner / Customer *
              </label>
              <select
                required
                value={formData.owner}
                onChange={(e) => setFormData({ ...formData, owner: e.target.value })}
                disabled={!!defaultOwnerId}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20 disabled:opacity-80 disabled:cursor-not-allowed"
              >
                <option value="">Select Pet Owner...</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.full_name} ({c.customer_id})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
              Species *
            </label>
            <select
              value={formData.species}
              onChange={(e) => setFormData({ ...formData, species: e.target.value })}
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20"
            >
              <option value="DOG">Dog</option>
              <option value="CAT">Cat</option>
              <option value="BIRD">Bird</option>
              <option value="RABBIT">Rabbit</option>
              <option value="OTHER">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
              Breed
            </label>
            <input
              type="text"
              value={formData.breed}
              onChange={(e) => setFormData({ ...formData, breed: e.target.value })}
              placeholder="e.g. Golden Retriever"
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
              Gender
            </label>
            <select
              value={formData.gender}
              onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20"
            >
              <option value="MALE">Male</option>
              <option value="FEMALE">Female</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
              Date of Birth
            </label>
            <input
              type="date"
              value={formData.date_of_birth}
              onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
              Weight (kg)
            </label>
            <input
              type="number"
              step="0.01"
              value={formData.weight}
              onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
              placeholder="e.g. 28.5"
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
              Color
            </label>
            <input
              type="text"
              value={formData.color}
              onChange={(e) => setFormData({ ...formData, color: e.target.value })}
              placeholder="e.g. Golden Honey"
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
              Microchip Number
            </label>
            <input
              type="text"
              value={formData.microchip_number}
              onChange={(e) => setFormData({ ...formData, microchip_number: e.target.value })}
              placeholder="15-digit ISO microchip"
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20 font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
              Photo URL
            </label>
            <input
              type="url"
              value={formData.photo}
              onChange={(e) => setFormData({ ...formData, photo: e.target.value })}
              placeholder="https://images.unsplash.com/..."
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20"
            />
          </div>
        </div>

        {/* Health & Diet Fields */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
              Allergies
            </label>
            <input
              type="text"
              value={formData.allergies}
              onChange={(e) => setFormData({ ...formData, allergies: e.target.value })}
              placeholder="e.g. Chicken, Flea saliva"
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
              Pre-existing Medical Conditions
            </label>
            <input
              type="text"
              value={formData.medical_conditions}
              onChange={(e) => setFormData({ ...formData, medical_conditions: e.target.value })}
              placeholder="e.g. Hypothyroidism, Arthritis"
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
              Dietary Preferences & Feeding Routine
            </label>
            <textarea
              rows={2}
              value={formData.dietary_preferences}
              onChange={(e) => setFormData({ ...formData, dietary_preferences: e.target.value })}
              placeholder="Brand, wet/dry, cup portions, timing"
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
              Personality & Behavior Notes
            </label>
            <textarea
              rows={2}
              value={formData.personality_behavior}
              onChange={(e) => setFormData({ ...formData, personality_behavior: e.target.value })}
              placeholder="Playful, dog-friendly, thunderstorm anxiety..."
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
            Emergency Instructions
          </label>
          <input
            type="text"
            value={formData.emergency_instructions}
            onChange={(e) => setFormData({ ...formData, emergency_instructions: e.target.value })}
            placeholder="Preferred emergency hospital or doctor contacts"
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
            {loading ? 'Saving...' : pet?.id ? 'Update Pet' : 'Register Pet'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default PetModal;
