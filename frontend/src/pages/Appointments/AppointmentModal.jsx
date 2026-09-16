import React, { useState, useEffect } from 'react';
import Modal from '../../components/Modal';
import { appointmentService } from '../../services/appointmentService';
import { customerService } from '../../services/customerService';
import { petService } from '../../services/petService';
import { serviceService } from '../../services/serviceService';
import { authService } from '../../services/authService';
import { vaccinationService } from '../../services/vaccinationService';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../context/ToastContext';
import { AlertTriangle, ShieldCheck } from 'lucide-react';

export const AppointmentModal = ({ isOpen, onClose, appointment, onSaved }) => {
  const { isCustomer } = useAuth();
  const { addToast } = useToast();
  const [loading, setLoading] = useState(false);

  const [customers, setCustomers] = useState([]);
  const [pets, setPets] = useState([]);
  const [services, setServices] = useState([]);
  const [staffMembers, setStaffMembers] = useState([]);
  const [vaxWarning, setVaxWarning] = useState(null);

  const [formData, setFormData] = useState({
    customer: '',
    pet: '',
    service: '',
    staff: '',
    date: new Date().toISOString().split('T')[0],
    start_time: '10:00',
    end_time: '11:00',
    status: 'PENDING',
    notes: '',
  });

  useEffect(() => {
    // Fetch dropdown options
    const loadDropdowns = async () => {
      try {
        const [servData, staffData] = await Promise.all([
          serviceService.getAll({ status: 'ACTIVE' }),
          authService.getUsers({ role: 'STAFF' }),
        ]);
        setServices(Array.isArray(servData) ? servData : servData.results || []);
        setStaffMembers(Array.isArray(staffData) ? staffData : staffData.results || []);

        if (!isCustomer) {
          const custData = await customerService.getAll();
          setCustomers(Array.isArray(custData) ? custData : custData.results || []);
        } else {
          const myPets = await petService.getAll();
          setPets(Array.isArray(myPets) ? myPets : myPets.results || []);
        }
      } catch (err) {
        console.error(err);
      }
    };

    if (isOpen) {
      loadDropdowns();
    }
  }, [isOpen, isCustomer]);

  // When customer is selected, load customer's pets
  useEffect(() => {
    if (formData.customer && !isCustomer) {
      petService.getAll({ owner: formData.customer }).then((res) => {
        setPets(Array.isArray(res) ? res : res.results || []);
      }).catch(console.error);
    }
  }, [formData.customer, isCustomer]);

  // Check vaccination safety when pet is selected
  useEffect(() => {
    if (formData.pet) {
      vaccinationService.checkPetVaccinations(formData.pet).then((res) => {
        if (!res.is_safe_to_book) {
          setVaxWarning(`Vaccine Warning: Pet has expired vaccines (${res.expired_vaccines?.join(', ')}). Proceed with caution.`);
        } else if (res.expiring_soon_count > 0) {
          setVaxWarning(`Notice: Pet has vaccines expiring soon (${res.expiring_soon_vaccines?.join(', ')}).`);
        } else {
          setVaxWarning(null);
        }
      }).catch(() => setVaxWarning(null));
    }
  }, [formData.pet]);

  useEffect(() => {
    if (appointment) {
      setFormData({
        customer: appointment.customer || '',
        pet: appointment.pet || '',
        service: appointment.service || '',
        staff: appointment.staff || '',
        date: appointment.date || '',
        start_time: appointment.start_time || '10:00',
        end_time: appointment.end_time || '11:00',
        status: appointment.status || 'PENDING',
        notes: appointment.notes || '',
      });
    } else {
      setFormData({
        customer: '',
        pet: '',
        service: '',
        staff: '',
        date: new Date().toISOString().split('T')[0],
        start_time: '10:00',
        end_time: '11:00',
        status: 'PENDING',
        notes: '',
      });
      setVaxWarning(null);
    }
  }, [appointment, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (appointment?.id) {
        await appointmentService.update(appointment.id, formData);
        addToast('Appointment updated successfully!', 'success');
      } else {
        await appointmentService.create(formData);
        addToast('Appointment scheduled successfully!', 'success');
      }
      if (onSaved) onSaved();
      onClose();
    } catch (err) {
      const msg = err.response?.data?.staff?.[0] || err.response?.data?.end_time?.[0] || 'Booking error. Please verify staff availability.';
      addToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={appointment?.id ? 'Reschedule / Edit Appointment' : 'Book New Pet Service Visit'}
      subtitle="Select pet, care service package, preferred time, and care staff"
      maxWidth="max-w-xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Vaccination Warning Banner */}
        {vaxWarning && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2.5 text-xs text-amber-800">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Vaccination Notice</p>
              <p>{vaxWarning}</p>
            </div>
          </div>
        )}

        {!isCustomer && (
          <div>
            <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
              Customer / Pet Owner *
            </label>
            <select
              required
              value={formData.customer}
              onChange={(e) => setFormData({ ...formData, customer: e.target.value, pet: '' })}
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20"
            >
              <option value="">Select Customer...</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.full_name} ({c.phone})
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                  {p.name} ({p.species})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
              Care Service *
            </label>
            <select
              required
              value={formData.service}
              onChange={(e) => setFormData({ ...formData, service: e.target.value })}
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20"
            >
              <option value="">Select Service...</option>
              {services.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} (${s.price})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
              Appointment Date *
            </label>
            <input
              type="date"
              required
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
              Start Time *
            </label>
            <input
              type="time"
              required
              value={formData.start_time}
              onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
              End Time *
            </label>
            <input
              type="time"
              required
              value={formData.end_time}
              onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20"
            />
          </div>
        </div>

        {!isCustomer && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                Assigned Staff Member
              </label>
              <select
                value={formData.staff}
                onChange={(e) => setFormData({ ...formData, staff: e.target.value })}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20"
              >
                <option value="">Auto-Assign / Any Available</option>
                {staffMembers.map((sm) => (
                  <option key={sm.id} value={sm.id}>
                    {sm.full_name} ({sm.email})
                  </option>
                ))}
              </select>
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
                <option value="PENDING">Pending</option>
                <option value="CONFIRMED">Confirmed</option>
                <option value="CHECKED_IN">Checked In</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="COMPLETED">Completed</option>
                <option value="CANCELLED">Cancelled</option>
                <option value="NO_SHOW">No-Show</option>
              </select>
            </div>
          </div>
        )}

        <div>
          <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
            Special Notes / Instructions
          </label>
          <textarea
            rows={2}
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            placeholder="Grooming style preferences, handling instructions..."
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
            {loading ? 'Processing...' : appointment?.id ? 'Save Changes' : 'Confirm Booking'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default AppointmentModal;
