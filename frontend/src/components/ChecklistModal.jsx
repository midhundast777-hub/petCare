import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import { boardingService } from '../services/boardingService';
import { useToast } from '../context/ToastContext';
import { CheckCircle2, LogIn, LogOut, Home, Utensils, Pill, Phone, Scale, Package } from 'lucide-react';

export const ChecklistModal = ({ isOpen, onClose, booking, mode = 'checkin', onUpdated }) => {
  const { addToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [rooms, setRooms] = useState([]);

  // Form states for occupancy & care details
  const [selectedRoom, setSelectedRoom] = useState('');
  const [feedingInstructions, setFeedingInstructions] = useState('');
  const [medicationInstructions, setMedicationInstructions] = useState('');
  const [emergencyContact, setEmergencyContact] = useState('');

  const [checklist, setChecklist] = useState({
    // Check-in
    checkin_vaccination_verified: false,
    checkin_health_condition_checked: false,
    checkin_weight_recorded: '',
    checkin_belongings_received: false,
    checkin_belongings_notes: '',
    checkin_feeding_recorded: false,
    checkin_medication_recorded: false,
    checkin_emergency_verified: false,
    checkin_owner_instructions: false,
    checkin_payment_checked: false,
    checkin_completed: false,

    // Check-out
    checkout_condition_checked: false,
    checkout_belongings_returned: false,
    checkout_medication_completed: false,
    checkout_final_services_verified: false,
    checkout_invoice_generated: false,
    checkout_payment_completed: false,
    checkout_owner_confirmation: false,
    checkout_completed: false,
  });

  useEffect(() => {
    if (isOpen && booking?.id) {
      setLoading(true);
      setSelectedRoom(booking.room || '');
      setFeedingInstructions(booking.feeding_instructions || '');
      setMedicationInstructions(booking.medication_instructions || '');
      setEmergencyContact(booking.emergency_contact || '');

      Promise.all([
        boardingService.getChecklist(booking.id),
        boardingService.getRooms()
      ])
        .then(([checkData, roomData]) => {
          setChecklist((prev) => ({ ...prev, ...checkData }));
          setRooms(Array.isArray(roomData) ? roomData : roomData.results || []);
          setLoading(false);
        })
        .catch((err) => {
          console.error(err);
          setLoading(false);
        });
    }
  }, [isOpen, booking]);

  const handleCheckboxChange = (field) => {
    setChecklist((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  const handleComplete = async () => {
    setSaving(true);
    try {
      const payload = {
        ...checklist,
        room: selectedRoom || null,
        feeding_instructions: feedingInstructions,
        medication_instructions: medicationInstructions,
        emergency_contact: emergencyContact,
      };

      if (mode === 'checkin') {
        payload.checkin_completed = true;
      } else {
        payload.checkout_completed = true;
      }

      await boardingService.updateChecklist(booking.id, payload);
      addToast(
        mode === 'checkin'
          ? `Check-in and suite occupancy confirmed for ${booking.pet_name}!`
          : `Departure check-out completed for ${booking.pet_name}!`,
        'success'
      );
      if (onUpdated) onUpdated();
      onClose();
    } catch (err) {
      console.error(err);
      addToast(err.response?.data?.error || 'Failed to update check-in & occupancy', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (!booking) return null;

  const isCheckin = mode === 'checkin';

  // Calculate stay nights and selected room rate
  const roomObj = rooms.find((r) => r.id === parseInt(selectedRoom));
  const stayNights =
    booking.check_in_date && booking.expected_check_out_date
      ? Math.max(
          Math.round(
            (new Date(booking.expected_check_out_date) - new Date(booking.check_in_date)) /
              (1000 * 60 * 60 * 24)
          ),
          1
        )
      : 1;
  const estimatedCost = roomObj ? (parseFloat(roomObj.daily_rate) * stayNights).toFixed(2) : null;

  // Check-in items list
  const checkinItems = [
    { key: 'checkin_vaccination_verified', label: 'Pet vaccinations verified & valid (Rabies, DHPP, Bordetella)' },
    { key: 'checkin_health_condition_checked', label: 'Physical condition inspected (coat, eyes, ears, skin, demeanor)' },
    { key: 'checkin_belongings_received', label: 'Owner belongings received & tagged' },
    { key: 'checkin_feeding_recorded', label: 'Diet & feeding instructions confirmed' },
    { key: 'checkin_medication_recorded', label: 'Medication schedule & dosage verified' },
    { key: 'checkin_emergency_verified', label: 'Emergency contact details verified' },
    { key: 'checkin_owner_instructions', label: 'Special behavioral notes & owner requests confirmed' },
    { key: 'checkin_payment_checked', label: 'Payment status / deposit confirmed' },
  ];

  // Check-out items list
  const checkoutItems = [
    { key: 'checkout_condition_checked', label: 'Final pet health & wellbeing check completed' },
    { key: 'checkout_belongings_returned', label: 'All owner belongings, blankets & toys returned' },
    { key: 'checkout_medication_completed', label: 'Medication administration completed & leftovers returned' },
    { key: 'checkout_final_services_verified', label: 'Scheduled grooming / daycare services completed' },
    { key: 'checkout_invoice_generated', label: 'Final billing invoice verified' },
    { key: 'checkout_payment_completed', label: 'Full payment balance settled' },
    { key: 'checkout_owner_confirmation', label: 'Owner confirmation & pet release signed off' },
  ];

  const activeItems = isCheckin ? checkinItems : checkoutItems;
  const completedCount = activeItems.filter((i) => checklist[i.key]).length;
  const progressPercent = Math.round((completedCount / activeItems.length) * 100);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          {isCheckin ? <LogIn className="w-5 h-5 text-emerald-600" /> : <LogOut className="w-5 h-5 text-sky-600" />}
          <span>{isCheckin ? 'Check-In & Suite Occupancy Protocol' : 'Digital Check-Out Protocol'}</span>
        </div>
      }
      subtitle={`Guest: ${booking.pet_name} (${booking.pet_species}) • Owner: ${booking.customer_name} • Stay: ${booking.check_in_date} to ${booking.expected_check_out_date} (${stayNights} nights)`}
      maxWidth="max-w-2xl"
    >
      {loading ? (
        <div className="py-8 text-center text-slate-400">Loading occupancy and checklist...</div>
      ) : (
        <div className="space-y-5">
          {/* STEP 1: Occupancy Selection (For Check-in) */}
          {isCheckin && (
            <div className="p-4 bg-emerald-50/60 border border-emerald-200/80 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Home className="w-4 h-4 text-emerald-700" />
                  <h4 className="text-xs font-black uppercase tracking-wider text-emerald-900">
                    1. Select Kennel Suite Occupancy
                  </h4>
                </div>
                {roomObj && (
                  <span className="text-[11px] font-bold text-emerald-800 bg-emerald-100/80 px-2 py-0.5 rounded-md">
                    ${roomObj.daily_rate}/day × {stayNights} nights = ${estimatedCost}
                  </span>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Assign Suite / Room for this Pet *
                </label>
                <select
                  value={selectedRoom}
                  onChange={(e) => setSelectedRoom(e.target.value)}
                  className="w-full px-3.5 py-2 bg-white border border-emerald-300 rounded-xl text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none"
                >
                  <option value="">-- Choose Kennel Suite / Room --</option>
                  {rooms.map((r) => {
                    const isCurrent = r.id === booking.room;
                    const isOccupied = r.status === 'OCCUPIED' && !isCurrent;
                    return (
                      <option key={r.id} value={r.id} disabled={isOccupied}>
                        Room {r.room_number} — {r.room_type_display || r.room_type} (${r.daily_rate}/day)
                        {isCurrent ? ' [Currently Assigned]' : isOccupied ? ' (OCCUPIED)' : ' (Available)'}
                      </option>
                    );
                  })}
                </select>
              </div>

              {roomObj && (
                <div className="grid grid-cols-3 gap-2 pt-1 text-[11px]">
                  <div className="bg-white/80 p-2 rounded-lg border border-emerald-200">
                    <span className="text-slate-400 block text-[10px]">Suite Type</span>
                    <strong className="text-slate-800">{roomObj.room_type_display || roomObj.room_type}</strong>
                  </div>
                  <div className="bg-white/80 p-2 rounded-lg border border-emerald-200">
                    <span className="text-slate-400 block text-[10px]">Daily Rate</span>
                    <strong className="text-slate-800">${roomObj.daily_rate} / night</strong>
                  </div>
                  <div className="bg-white/80 p-2 rounded-lg border border-emerald-200">
                    <span className="text-slate-400 block text-[10px]">Total Stay Cost</span>
                    <strong className="text-emerald-700 font-extrabold">${estimatedCost}</strong>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 2: Care, Feeding, Medication & Belongings ("Other Things") */}
          {isCheckin && (
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
              <div className="flex items-center gap-2">
                <Utensils className="w-4 h-4 text-brand-600" />
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-800">
                  2. Intake Details, Diet & Medication
                </h4>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1 flex items-center gap-1">
                    <Utensils className="w-3 h-3 text-slate-400" />
                    <span>Feeding Instructions & Diet</span>
                  </label>
                  <textarea
                    rows={2}
                    value={feedingInstructions}
                    onChange={(e) => setFeedingInstructions(e.target.value)}
                    placeholder="e.g. 1 cup salmon kibble at 8am and 6pm"
                    className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1 flex items-center gap-1">
                    <Pill className="w-3 h-3 text-slate-400" />
                    <span>Medication Instructions</span>
                  </label>
                  <textarea
                    rows={2}
                    value={medicationInstructions}
                    onChange={(e) => setMedicationInstructions(e.target.value)}
                    placeholder="e.g. 1 joint chew with morning meal"
                    className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1 flex items-center gap-1">
                    <Scale className="w-3 h-3 text-slate-400" />
                    <span>Recorded Weight (kg)</span>
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={checklist.checkin_weight_recorded || ''}
                    onChange={(e) => setChecklist({ ...checklist, checkin_weight_recorded: e.target.value })}
                    placeholder="e.g. 24.5"
                    className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1 flex items-center gap-1">
                    <Phone className="w-3 h-3 text-slate-400" />
                    <span>Emergency Contact</span>
                  </label>
                  <input
                    type="text"
                    value={emergencyContact}
                    onChange={(e) => setEmergencyContact(e.target.value)}
                    placeholder="e.g. (555) 987-6543"
                    className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1 flex items-center gap-1">
                    <Package className="w-3 h-3 text-slate-400" />
                    <span>Belongings & Tags</span>
                  </label>
                  <input
                    type="text"
                    value={checklist.checkin_belongings_notes || ''}
                    onChange={(e) => setChecklist({ ...checklist, checkin_belongings_notes: e.target.value })}
                    placeholder="e.g. Red leash, blue blanket"
                    className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Verification Protocol Checkpoints */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-800">
                {isCheckin ? '3. Health & Intake Verification' : 'Departure Sign-Off Protocol'}
              </h4>
              <span className="text-xs font-bold text-slate-500">
                {completedCount} of {activeItems.length} verified ({progressPercent}%)
              </span>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
              <div
                className={`h-1.5 transition-all duration-300 ${
                  progressPercent === 100 ? 'bg-emerald-500' : 'bg-brand-500'
                }`}
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 max-h-56 overflow-y-auto pr-1">
              {activeItems.map((item) => (
                <label
                  key={item.key}
                  className={`flex items-start gap-2.5 p-2.5 rounded-xl border transition-colors cursor-pointer select-none text-xs ${
                    checklist[item.key]
                      ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900 font-semibold'
                      : 'bg-white border-slate-200/80 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={checklist[item.key] || false}
                    onChange={() => handleCheckboxChange(item.key)}
                    className="mt-0.5 w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
                  />
                  <span className="leading-tight">{item.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
            <div className="text-[11px] text-slate-400">
              {isCheckin ? 'Assigns room occupancy and records intake log' : 'Releases suite and archives stay history'}
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleComplete}
                disabled={saving}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white shadow-sm transition-all cursor-pointer ${
                  isCheckin
                    ? 'bg-emerald-600 hover:bg-emerald-700'
                    : 'bg-sky-600 hover:bg-sky-700'
                } disabled:opacity-50`}
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>
                  {saving
                    ? 'Saving...'
                    : isCheckin
                    ? 'Confirm Check-In & Occupancy'
                    : 'Confirm Check-Out & Release'}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
};

export default ChecklistModal;
