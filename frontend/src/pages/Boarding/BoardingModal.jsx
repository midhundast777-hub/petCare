import React, { useState, useEffect } from 'react';
import Modal from '../../components/Modal';
import { boardingService } from '../../services/boardingService';
import { customerService } from '../../services/customerService';
import { petService } from '../../services/petService';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../context/ToastContext';

export const BoardingModal = ({ isOpen, onClose, booking, onSaved }) => {
  const { isCustomer } = useAuth();
  const { addToast } = useToast();
  const [loading, setLoading] = useState(false);

  const [customers, setCustomers] = useState([]);
  const [pets, setPets] = useState([]);
  const [rooms, setRooms] = useState([]);

  const todayStr = new Date().toISOString().split('T')[0];
  const nextWeekStr = new Date(Date.now() + 5 * 86400000).toISOString().split('T')[0];

  const [formData, setFormData] = useState({
    customer: '',
    pet: '',
    room: '',
    package: 'STANDARD',
    check_in_date: todayStr,
    check_in_time: '09:00',
    expected_check_out_date: nextWeekStr,
    check_out_time: '17:00',
    feeding_instructions: '',
    medication_instructions: '',
    special_instructions: '',
    emergency_contact: '',
    status: 'RESERVED',
  });

  useEffect(() => {
    const loadDropdowns = async () => {
      try {
        const roomData = await boardingService.getRooms();
        setRooms(Array.isArray(roomData) ? roomData : roomData.results || []);

        if (!isCustomer) {
          const custData = await customerService.getAll();
          setCustomers(Array.isArray(custData) ? custData : custData.results || []);
        } else {
          const myPets = await petService.getAll();
          const petList = Array.isArray(myPets) ? myPets : myPets.results || [];
          setPets(petList);
          if (petList.length > 0 && !formData.pet) {
            setFormData((prev) => ({ ...prev, pet: prev.pet || String(petList[0].id) }));
          }
        }
      } catch (err) {
        console.error(err);
      }
    };

    if (isOpen) {
      loadDropdowns();
    }
  }, [isOpen, isCustomer]);

  useEffect(() => {
    if (formData.customer && !isCustomer) {
      petService.getAll({ owner: formData.customer }).then((res) => {
        setPets(Array.isArray(res) ? res : res.results || []);
      }).catch(console.error);
    }
  }, [formData.customer, isCustomer]);

  useEffect(() => {
    if (booking) {
      setFormData({
        customer: booking.customer || '',
        pet: booking.pet || '',
        room: booking.room || '',
        package: booking.package || 'STANDARD',
        check_in_date: booking.check_in_date || todayStr,
        check_in_time: booking.check_in_time ? booking.check_in_time.slice(0, 5) : '09:00',
        expected_check_out_date: booking.expected_check_out_date || nextWeekStr,
        check_out_time: booking.check_out_time ? booking.check_out_time.slice(0, 5) : '17:00',
        feeding_instructions: booking.feeding_instructions || '',
        medication_instructions: booking.medication_instructions || '',
        special_instructions: booking.special_instructions || '',
        emergency_contact: booking.emergency_contact || '',
        status: booking.status || 'RESERVED',
      });
    } else {
      setFormData({
        customer: '',
        pet: '',
        room: '',
        package: 'STANDARD',
        check_in_date: todayStr,
        check_in_time: '09:00',
        expected_check_out_date: nextWeekStr,
        check_out_time: '17:00',
        feeding_instructions: '',
        medication_instructions: '',
        special_instructions: '',
        emergency_contact: '',
        status: 'RESERVED',
      });
    }
  }, [booking, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = { ...formData };
      if (!payload.customer) delete payload.customer;
      if (!payload.room) delete payload.room;
      if (!payload.check_out_time) delete payload.check_out_time;

      if (booking?.id) {
        await boardingService.updateBooking(booking.id, payload);
        addToast('Boarding reservation updated successfully!', 'success');
      } else {
        await boardingService.createBooking(payload);
        addToast('Boarding stay reserved successfully!', 'success');
      }
      if (onSaved) onSaved();
      onClose();
    } catch (err) {
      const msg = err.response?.data?.room?.[0] || err.response?.data?.expected_check_out_date?.[0] || err.response?.data?.detail || 'Booking error. Room might be occupied during these dates.';
      addToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={booking?.id ? 'Edit Boarding Booking' : 'Book a Boarding Stay'}
      subtitle="Select suite, dates, feeding and medical instructions"
      maxWidth="max-w-2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {!isCustomer && (
          <div>
            <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
              Pet Owner *
            </label>
            <select
              required
              value={formData.customer}
              onChange={(e) => setFormData({ ...formData, customer: e.target.value, pet: '' })}
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20"
            >
              <option value="">Select Owner...</option>
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
                  {p.name} ({p.species})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
              Assigned Room / Kennel Suite
            </label>
            <select
              value={formData.room}
              onChange={(e) => setFormData({ ...formData, room: e.target.value })}
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20"
            >
              <option value="">Auto-Assign Room...</option>
              {rooms.map((r) => (
                <option key={r.id} value={r.id}>
                  Room {r.room_number} ({r.room_type_display}) - ${r.daily_rate}/day
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
              Check-In Date *
            </label>
            <input
              type="date"
              required
              value={formData.check_in_date}
              onChange={(e) => setFormData({ ...formData, check_in_date: e.target.value })}
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
              Check-In Time
            </label>
            <input
              type="time"
              value={formData.check_in_time}
              onChange={(e) => setFormData({ ...formData, check_in_time: e.target.value })}
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
              Expected Check-Out Date *
            </label>
            <input
              type="date"
              required
              value={formData.expected_check_out_date}
              onChange={(e) => setFormData({ ...formData, expected_check_out_date: e.target.value })}
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
              Check-Out Time
            </label>
            <input
              type="time"
              value={formData.check_out_time}
              onChange={(e) => setFormData({ ...formData, check_out_time: e.target.value })}
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
              Feeding Instructions
            </label>
            <textarea
              rows={2}
              value={formData.feeding_instructions}
              onChange={(e) => setFormData({ ...formData, feeding_instructions: e.target.value })}
              placeholder="Brand, portions, feeding time preferences"
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
              Medication Instructions
            </label>
            <textarea
              rows={2}
              value={formData.medication_instructions}
              onChange={(e) => setFormData({ ...formData, medication_instructions: e.target.value })}
              placeholder="Medicine, dosage, timing requirements"
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
              Special Handling Instructions
            </label>
            <input
              type="text"
              value={formData.special_instructions}
              onChange={(e) => setFormData({ ...formData, special_instructions: e.target.value })}
              placeholder="e.g. Needs evening cuddle, separate play yard"
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
              Emergency Contact Info
            </label>
            <input
              type="text"
              value={formData.emergency_contact}
              onChange={(e) => setFormData({ ...formData, emergency_contact: e.target.value })}
              placeholder="Name and phone number"
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20"
            />
          </div>
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
            {loading ? 'Processing...' : booking?.id ? 'Save Changes' : 'Confirm Stay Reservation'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default BoardingModal;
