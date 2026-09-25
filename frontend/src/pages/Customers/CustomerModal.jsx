import React, { useState, useEffect } from 'react';
import Modal from '../../components/Modal';
import { customerService } from '../../services/customerService';
import { useToast } from '../../context/ToastContext';
import { validatePhone, validateEmail, formatPhoneInput } from '../../utils/validation';

export const CustomerModal = ({ isOpen, onClose, customer, onSaved }) => {
  const { addToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    alternate_phone: '',
    address: '',
    city: '',
    date_of_birth: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
    notes: '',
    status: 'ACTIVE',
  });

  useEffect(() => {
    if (customer) {
      setFormData({
        first_name: customer.first_name || '',
        last_name: customer.last_name || '',
        email: customer.email || '',
        phone: customer.phone || '',
        alternate_phone: customer.alternate_phone || '',
        address: customer.address || '',
        city: customer.city || '',
        date_of_birth: customer.date_of_birth || '',
        emergency_contact_name: customer.emergency_contact_name || '',
        emergency_contact_phone: customer.emergency_contact_phone || '',
        notes: customer.notes || '',
        status: customer.status || 'ACTIVE',
      });
    } else {
      setFormData({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        alternate_phone: '',
        address: '',
        city: '',
        date_of_birth: '',
        emergency_contact_name: '',
        emergency_contact_phone: '',
        notes: '',
        status: 'ACTIVE',
      });
    }
  }, [customer, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Strict email validation
    const emailVal = validateEmail(formData.email);
    if (!emailVal.valid) {
      addToast(emailVal.message, 'error');
      return;
    }

    // Strict 10-digit primary phone validation
    const phoneVal = validatePhone(formData.phone);
    if (!phoneVal.valid) {
      addToast(phoneVal.message, 'error');
      return;
    }

    // Strict 10-digit alternate phone if provided
    if (formData.alternate_phone) {
      const altVal = validatePhone(formData.alternate_phone);
      if (!altVal.valid) {
        addToast(`Alternate phone: ${altVal.message}`, 'error');
        return;
      }
    }

    // Strict 10-digit emergency contact phone if provided
    if (formData.emergency_contact_phone) {
      const emgVal = validatePhone(formData.emergency_contact_phone);
      if (!emgVal.valid) {
        addToast(`Emergency contact phone: ${emgVal.message}`, 'error');
        return;
      }
    }

    setLoading(true);
    try {
      if (customer?.id) {
        await customerService.update(customer.id, formData);
        addToast('Customer profile updated successfully!', 'success');
      } else {
        await customerService.create(formData);
        addToast('Customer created successfully!', 'success');
      }
      if (onSaved) onSaved();
      onClose();
    } catch (err) {
      const errorMsg = err.response?.data?.email?.[0] || err.response?.data?.phone?.[0] || 'Failed to save customer. Check inputs.';
      addToast(errorMsg, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={customer?.id ? 'Edit Customer Profile' : 'Register New Customer'}
      subtitle="Fill in customer contact, location, and emergency information"
      maxWidth="max-w-2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
              First Name *
            </label>
            <input
              type="text"
              required
              value={formData.first_name}
              onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
              Last Name *
            </label>
            <input
              type="text"
              required
              value={formData.last_name}
              onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
              Email Address *
            </label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
            />
          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-bold uppercase text-slate-700">
                Primary Phone *
              </label>
              <span className={`text-[11px] font-mono font-bold ${
                formData.phone.replace(/\D/g, '').length === 10
                  ? 'text-emerald-600'
                  : 'text-slate-400'
              }`}>
                {formData.phone.replace(/\D/g, '').length}/10 digits
              </span>
            </div>
            <input
              type="tel"
              required
              maxLength={14}
              placeholder="e.g. 9876543210"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: formatPhoneInput(e.target.value) })}
              className={`w-full px-3.5 py-2 bg-slate-50 border rounded-xl text-sm focus:ring-2 ${
                formData.phone && formData.phone.replace(/\D/g, '').length === 10
                  ? 'border-emerald-300 focus:border-emerald-500 focus:ring-emerald-500/20'
                  : 'border-slate-200 focus:ring-brand-500/20 focus:border-brand-500'
              }`}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-bold uppercase text-slate-700">
                Alternate Phone
              </label>
              {formData.alternate_phone && (
                <span className={`text-[11px] font-mono font-bold ${
                  formData.alternate_phone.replace(/\D/g, '').length === 10
                    ? 'text-emerald-600'
                    : 'text-slate-400'
                }`}>
                  {formData.alternate_phone.replace(/\D/g, '').length}/10 digits
                </span>
              )}
            </div>
            <input
              type="tel"
              maxLength={14}
              placeholder="Optional 10-digit number"
              value={formData.alternate_phone}
              onChange={(e) => setFormData({ ...formData, alternate_phone: formatPhoneInput(e.target.value) })}
              className={`w-full px-3.5 py-2 bg-slate-50 border rounded-xl text-sm focus:ring-2 ${
                formData.alternate_phone && formData.alternate_phone.replace(/\D/g, '').length === 10
                  ? 'border-emerald-300 focus:border-emerald-500 focus:ring-emerald-500/20'
                  : 'border-slate-200 focus:ring-brand-500/20 focus:border-brand-500'
              }`}
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
              City
            </label>
            <input
              type="text"
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
            Street Address
          </label>
          <input
            type="text"
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
              Emergency Contact Name
            </label>
            <input
              type="text"
              value={formData.emergency_contact_name}
              onChange={(e) => setFormData({ ...formData, emergency_contact_name: e.target.value })}
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
            />
          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-bold uppercase text-slate-700">
                Emergency Contact Phone
              </label>
              {formData.emergency_contact_phone && (
                <span className={`text-[11px] font-mono font-bold ${
                  formData.emergency_contact_phone.replace(/\D/g, '').length === 10
                    ? 'text-emerald-600'
                    : 'text-slate-400'
                }`}>
                  {formData.emergency_contact_phone.replace(/\D/g, '').length}/10 digits
                </span>
              )}
            </div>
            <input
              type="tel"
              maxLength={14}
              placeholder="Optional 10-digit number"
              value={formData.emergency_contact_phone}
              onChange={(e) => setFormData({ ...formData, emergency_contact_phone: formatPhoneInput(e.target.value) })}
              className={`w-full px-3.5 py-2 bg-slate-50 border rounded-xl text-sm focus:ring-2 ${
                formData.emergency_contact_phone && formData.emergency_contact_phone.replace(/\D/g, '').length === 10
                  ? 'border-emerald-300 focus:border-emerald-500 focus:ring-emerald-500/20'
                  : 'border-slate-200 focus:ring-brand-500/20 focus:border-brand-500'
              }`}
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
            Customer Profile Notes
          </label>
          <textarea
            rows={2}
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            placeholder="Special preferences, habits, or account notes"
            className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
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
            {loading ? 'Saving...' : customer?.id ? 'Update Customer' : 'Create Customer'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default CustomerModal;
