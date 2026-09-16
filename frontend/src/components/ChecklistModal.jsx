import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import { boardingService } from '../services/boardingService';
import { useToast } from '../context/ToastContext';
import { CheckCircle2, ShieldCheck, LogIn, LogOut } from 'lucide-react';

export const ChecklistModal = ({ isOpen, onClose, booking, mode = 'checkin', onUpdated }) => {
  const { addToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
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
      boardingService
        .getChecklist(booking.id)
        .then((res) => {
          setChecklist((prev) => ({ ...prev, ...res }));
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
      const payload = { ...checklist };
      if (mode === 'checkin') {
        payload.checkin_completed = true;
      } else {
        payload.checkout_completed = true;
      }

      await boardingService.updateChecklist(booking.id, payload);
      addToast(
        mode === 'checkin'
          ? `Digital check-in completed for ${booking.pet_name}!`
          : `Digital check-out completed for ${booking.pet_name}!`,
        'success'
      );
      if (onUpdated) onUpdated();
      onClose();
    } catch (err) {
      addToast(err.response?.data?.error || 'Failed to update checklist', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (!booking) return null;

  const isCheckin = mode === 'checkin';

  // Check-in items list
  const checkinItems = [
    { key: 'checkin_vaccination_verified', label: 'Pet vaccinations verified & valid' },
    { key: 'checkin_health_condition_checked', label: 'Physical health condition inspected (coat, eyes, ears, skin)' },
    { key: 'checkin_belongings_received', label: 'Owner belongings received & safely tagged' },
    { key: 'checkin_feeding_recorded', label: 'Feeding instructions verified & scheduled' },
    { key: 'checkin_medication_recorded', label: 'Medication dosage & timing confirmed' },
    { key: 'checkin_emergency_verified', label: 'Emergency contact details verified' },
    { key: 'checkin_owner_instructions', label: 'Special owner requests & habits recorded' },
    { key: 'checkin_payment_checked', label: 'Payment status or deposit confirmed' },
  ];

  // Check-out items list
  const checkoutItems = [
    { key: 'checkout_condition_checked', label: 'Final pet health & wellbeing check completed' },
    { key: 'checkout_belongings_returned', label: 'All owner belongings, blankets & toys returned' },
    { key: 'checkout_medication_completed', label: 'Medication administration completed & remaining returned' },
    { key: 'checkout_final_services_verified', label: 'Scheduled grooming / daycare services verified' },
    { key: 'checkout_invoice_generated', label: 'Final invoice generated with daily stay charges' },
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
          <span>Digital {isCheckin ? 'Check-In' : 'Check-Out'} Protocol</span>
        </div>
      }
      subtitle={`Pet: ${booking.pet_name} (${booking.pet_species}) • Room: ${booking.room_number || 'Standard'}`}
      maxWidth="max-w-xl"
    >
      {loading ? (
        <div className="py-8 text-center text-slate-400">Loading checklist items...</div>
      ) : (
        <div className="space-y-6">
          {/* Progress Banner */}
          <div className="p-4 bg-slate-50 border border-slate-200/70 rounded-xl">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-700 mb-2">
              <span>Verification Checklist Progress</span>
              <span>{progressPercent}% Complete ({completedCount}/{activeItems.length})</span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
              <div
                className={`h-2 transition-all duration-300 ${
                  progressPercent === 100 ? 'bg-emerald-500' : 'bg-brand-500'
                }`}
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* Checklist Form */}
          <div className="space-y-3">
            {activeItems.map((item) => (
              <label
                key={item.key}
                className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 hover:bg-slate-50/80 cursor-pointer transition-colors"
              >
                <input
                  type="checkbox"
                  checked={checklist[item.key] || false}
                  onChange={() => handleCheckboxChange(item.key)}
                  className="mt-0.5 w-4 h-4 text-brand-600 rounded border-slate-300 focus:ring-brand-500"
                />
                <span className="text-sm font-medium text-slate-700 select-none">
                  {item.label}
                </span>
              </label>
            ))}

            {/* Extra inputs for check-in */}
            {isCheckin && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                    Recorded Weight (kg)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={checklist.checkin_weight_recorded || ''}
                    onChange={(e) => setChecklist({ ...checklist, checkin_weight_recorded: e.target.value })}
                    placeholder="e.g. 24.5"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                    Belongings Inventory Notes
                  </label>
                  <input
                    type="text"
                    value={checklist.checkin_belongings_notes || ''}
                    onChange={(e) => setChecklist({ ...checklist, checkin_belongings_notes: e.target.value })}
                    placeholder="e.g. Blue leash, favorite blanket"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleComplete}
              disabled={saving}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white shadow-sm transition-all ${
                isCheckin
                  ? 'bg-emerald-600 hover:bg-emerald-700'
                  : 'bg-sky-600 hover:bg-sky-700'
              } disabled:opacity-50`}
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{saving ? 'Processing...' : `Submit & Complete ${isCheckin ? 'Check-In' : 'Check-Out'}`}</span>
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
};

export default ChecklistModal;
