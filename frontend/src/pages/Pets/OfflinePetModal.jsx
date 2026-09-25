import React, { useState, useEffect, useRef } from 'react';
import Modal from '../../components/Modal';
import { petService } from '../../services/petService';
import { customerService } from '../../services/customerService';
import { authService } from '../../services/authService';
import { useToast } from '../../context/ToastContext';
import { SPECIES_BREEDS } from './PetModal';
import { Dog, User, Phone, Mail, MapPin, Camera, Upload, Trash2, CheckCircle2, UserPlus } from 'lucide-react';
import { validatePhone, validateEmail, formatPhoneInput } from '../../utils/validation';

export const OfflinePetModal = ({ isOpen, onClose, onSaved }) => {
  const { addToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [ownerMode, setOwnerMode] = useState('new'); // 'new' | 'existing'
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const photoInputRef = useRef(null);

  // Walk-in owner fields
  const [ownerData, setOwnerData] = useState({
    existingCustomerId: '',
    first_name: '',
    last_name: '',
    phone: '',
    email: '',
    city: '',
    address: '',
    emergency_contact_phone: '',
  });

  // Offline pet fields
  const [petData, setPetData] = useState({
    name: '',
    species: 'DOG',
    breed: '',
    customBreed: '',
    gender: 'MALE',
    date_of_birth: '',
    color: '',
    weight: '',
    microchip_number: '',
    photo: '',
    dietary_preferences: '',
    medical_conditions: '',
    allergies: '',
    notes: '',
  });

  useEffect(() => {
    if (isOpen) {
      customerService.getAll()
        .then((res) => {
          const list = Array.isArray(res) ? res : res.results || [];
          setCustomers(list);
        })
        .catch((err) => console.error('Failed to load customers:', err));
    }
  }, [isOpen]);

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      addToast('Please choose an image file', 'error');
      return;
    }

    const preview = URL.createObjectURL(file);
    setPetData((prev) => ({ ...prev, photo: preview }));
    setUploadingPhoto(true);

    try {
      const res = await authService.uploadImage(file);
      setPetData((prev) => ({ ...prev, photo: res.url }));
      addToast('Photo uploaded successfully', 'success');
    } catch (err) {
      const reader = new FileReader();
      reader.onload = () => {
        setPetData((prev) => ({ ...prev, photo: reader.result }));
      };
      reader.readAsDataURL(file);
    } finally {
      setUploadingPhoto(false);
      if (photoInputRef.current) photoInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      let customerId = ownerData.existingCustomerId;
      let ownerName = '';

      if (ownerMode === 'existing') {
        if (!customerId) {
          addToast('Please select an existing owner from the list', 'error');
          setLoading(false);
          return;
        }
        const existing = customers.find((c) => String(c.id) === String(customerId));
        ownerName = existing ? existing.full_name : 'Customer';
      } else {
        // Validation for new walk-in owner
        if (!ownerData.first_name.trim()) {
          addToast('Owner first name is required for walk-in registration', 'error');
          setLoading(false);
          return;
        }

        const phoneVal = validatePhone(ownerData.phone);
        if (!phoneVal.valid) {
          addToast(`Owner phone: ${phoneVal.message}`, 'error');
          setLoading(false);
          return;
        }

        if (ownerData.email && ownerData.email.trim()) {
          const emailVal = validateEmail(ownerData.email);
          if (!emailVal.valid) {
            addToast(emailVal.message, 'error');
            setLoading(false);
            return;
          }
        }

        if (ownerData.emergency_contact_phone && ownerData.emergency_contact_phone.trim()) {
          const emgVal = validatePhone(ownerData.emergency_contact_phone);
          if (!emgVal.valid) {
            addToast(`Emergency phone: ${emgVal.message}`, 'error');
            setLoading(false);
            return;
          }
        }

        const phoneDigits = ownerData.phone.replace(/\D/g, '') || '0000000000';
        const generatedEmail = ownerData.email.trim() || `walkin_${phoneDigits}@petcare.offline`;

        const newCustomerPayload = {
          first_name: ownerData.first_name.trim(),
          last_name: ownerData.last_name.trim() || 'Walk-in',
          phone: ownerData.phone.trim(),
          email: generatedEmail,
          city: ownerData.city.trim(),
          address: ownerData.address.trim(),
          emergency_contact_phone: ownerData.emergency_contact_phone.trim(),
          notes: 'Offline Walk-in Client registered at front desk / clinic',
        };

        const createdCust = await customerService.create(newCustomerPayload);
        customerId = createdCust.id;
        ownerName = createdCust.full_name || `${ownerData.first_name} ${ownerData.last_name}`.trim();
      }

      // Create pet payload
      const finalBreed = petData.breed === 'Other'
        ? (petData.customBreed || 'Other')
        : (petData.breed || 'Mixed Breed');

      const petPayload = {
        name: petData.name.trim(),
        owner: customerId,
        species: petData.species,
        breed: finalBreed,
        gender: petData.gender,
        date_of_birth: petData.date_of_birth || null,
        color: petData.color.trim(),
        weight: petData.weight ? parseFloat(petData.weight) : null,
        microchip_number: petData.microchip_number.trim(),
        photo: petData.photo,
        dietary_preferences: petData.dietary_preferences.trim(),
        medical_conditions: petData.medical_conditions.trim(),
        allergies: petData.allergies.trim(),
        status: 'ACTIVE',
      };

      const createdPet = await petService.create(petPayload);
      addToast(`Offline pet "${createdPet.name}" registered successfully for ${ownerName}!`, 'success');

      if (onSaved) onSaved(createdPet);
      onClose();
    } catch (err) {
      console.error('Offline pet registration error:', err);
      const errData = err.response?.data;
      let msg = 'Failed to register offline pet. Please check inputs.';
      if (typeof errData === 'string') {
        msg = errData;
      } else if (errData?.detail) {
        msg = errData.detail;
      } else if (errData && typeof errData === 'object') {
        const firstKey = Object.keys(errData)[0];
        const val = errData[firstKey];
        msg = `${firstKey}: ${Array.isArray(val) ? val[0] : val}`;
      }
      addToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  const breedsList = SPECIES_BREEDS[petData.species] || [];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Register Offline Pet & Walk-in Owner"
      subtitle="Front-desk registration for walk-in pets and offline clients without portal accounts"
      maxWidth="max-w-2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1: Walk-in Owner / Pet Parent */}
        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-3.5">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <span className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
              <User className="w-4 h-4 text-amber-600" />
              <span>Step 1: Pet Parent / Owner Details</span>
            </span>

            {/* Owner Mode Toggle */}
            <div className="flex bg-slate-200/80 p-0.5 rounded-lg text-xs font-bold">
              <button
                type="button"
                onClick={() => setOwnerMode('new')}
                className={`px-3 py-1 rounded-md transition-all ${
                  ownerMode === 'new' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                + New Walk-in Client
              </button>
              <button
                type="button"
                onClick={() => setOwnerMode('existing')}
                className={`px-3 py-1 rounded-md transition-all ${
                  ownerMode === 'existing' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Existing Client
              </button>
            </div>
          </div>

          {ownerMode === 'existing' ? (
            <div>
              <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                Select Existing Client *
              </label>
              <select
                required={ownerMode === 'existing'}
                value={ownerData.existingCustomerId}
                onChange={(e) => setOwnerData({ ...ownerData, existingCustomerId: e.target.value })}
                className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20"
              >
                <option value="">Select registered client...</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.full_name} ({c.phone || c.email})
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                  Owner First Name *
                </label>
                <input
                  type="text"
                  required={ownerMode === 'new'}
                  placeholder="e.g. John"
                  value={ownerData.first_name}
                  onChange={(e) => setOwnerData({ ...ownerData, first_name: e.target.value })}
                  className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                  Owner Last Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Smith"
                  value={ownerData.last_name}
                  onChange={(e) => setOwnerData({ ...ownerData, last_name: e.target.value })}
                  className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold uppercase text-slate-700">
                    Phone Number *
                  </label>
                  <span className={`text-[11px] font-mono font-bold ${
                    ownerData.phone.replace(/\D/g, '').length === 10
                      ? 'text-emerald-600'
                      : 'text-slate-400'
                  }`}>
                    {ownerData.phone.replace(/\D/g, '').length}/10 digits
                  </span>
                </div>
                <input
                  type="tel"
                  required={ownerMode === 'new'}
                  maxLength={14}
                  placeholder="e.g. 9847012345 (10 digits)"
                  value={ownerData.phone}
                  onChange={(e) => setOwnerData({ ...ownerData, phone: formatPhoneInput(e.target.value) })}
                  className={`w-full px-3.5 py-2 bg-white border rounded-xl text-sm focus:ring-2 ${
                    ownerData.phone && ownerData.phone.replace(/\D/g, '').length === 10
                      ? 'border-emerald-300 focus:border-emerald-500 focus:ring-emerald-500/20'
                      : 'border-slate-200 focus:ring-brand-500/20'
                  }`}
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                  Email (Optional)
                </label>
                <input
                  type="email"
                  placeholder="name@example.com (or auto-generated)"
                  value={ownerData.email}
                  onChange={(e) => setOwnerData({ ...ownerData, email: e.target.value })}
                  className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20"
                />
              </div>
            </div>
          )}
        </div>

        {/* Section 2: Pet Information */}
        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-3.5">
          <span className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
            <Dog className="w-4 h-4 text-brand-600" />
            <span>Step 2: Pet Information</span>
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                Pet Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Bruno, Bella"
                value={petData.name}
                onChange={(e) => setPetData({ ...petData, name: e.target.value })}
                className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20 font-semibold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                Species *
              </label>
              <select
                required
                value={petData.species}
                onChange={(e) => setPetData({ ...petData, species: e.target.value, breed: '' })}
                className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20"
              >
                <option value="DOG">Dog</option>
                <option value="CAT">Cat</option>
                <option value="BIRD">Bird</option>
                <option value="RABBIT">Rabbit</option>
                <option value="OTHER">Other / Exotic</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                Breed
              </label>
              <select
                value={petData.breed}
                onChange={(e) => setPetData({ ...petData, breed: e.target.value })}
                className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20"
              >
                <option value="">Select Breed (or choose Other)...</option>
                {breedsList.map((b) => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
              {petData.breed === 'Other' && (
                <input
                  type="text"
                  placeholder="Specify custom breed..."
                  value={petData.customBreed}
                  onChange={(e) => setPetData({ ...petData, customBreed: e.target.value })}
                  className="w-full mt-2 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                />
              )}
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                Gender *
              </label>
              <select
                required
                value={petData.gender}
                onChange={(e) => setPetData({ ...petData, gender: e.target.value })}
                className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20"
              >
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                Weight (kg)
              </label>
              <input
                type="number"
                step="0.1"
                placeholder="e.g. 14.5"
                value={petData.weight}
                onChange={(e) => setPetData({ ...petData, weight: e.target.value })}
                className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                Color / Markings
              </label>
              <input
                type="text"
                placeholder="e.g. Golden, Brown spots"
                value={petData.color}
                onChange={(e) => setPetData({ ...petData, color: e.target.value })}
                className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
              Medical / Handling Notes (Optional)
            </label>
            <input
              type="text"
              placeholder="Allergies, calm/nervous temperament, special diet..."
              value={petData.medical_conditions}
              onChange={(e) => setPetData({ ...petData, medical_conditions: e.target.value })}
              className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20"
            />
          </div>

          {/* Photo Preview & Upload */}
          <div className="flex items-center gap-3 pt-2">
            {petData.photo ? (
              <div className="relative">
                <img
                  src={petData.photo}
                  alt="Pet Preview"
                  className="w-14 h-14 rounded-xl object-cover border border-slate-300 shadow-xs"
                />
                <button
                  type="button"
                  onClick={() => setPetData({ ...petData, photo: '' })}
                  className="absolute -top-1.5 -right-1.5 bg-rose-600 text-white rounded-full p-1 hover:bg-rose-700"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <label className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100 cursor-pointer transition shadow-xs">
                <Camera className="w-4 h-4 text-brand-600" />
                <span>{uploadingPhoto ? 'Uploading...' : 'Attach Pet Photo'}</span>
                <input
                  ref={photoInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
              </label>
            )}
          </div>
        </div>

        {/* Modal Bottom Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading || uploadingPhoto}
            className="flex items-center gap-2 px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-sm font-bold shadow-md shadow-amber-600/20 transition-all disabled:opacity-50 cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>{loading ? 'Registering...' : 'Register Offline Pet'}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default OfflinePetModal;
