import React, { useState, useEffect } from 'react';
import Modal from '../../components/Modal';
import { billingService } from '../../services/billingService';
import { customerService } from '../../services/customerService';
import { petService } from '../../services/petService';
import { serviceService } from '../../services/serviceService';
import { useToast } from '../../context/ToastContext';
import { Plus, Trash2 } from 'lucide-react';

export const InvoiceModal = ({ isOpen, onClose, onSaved }) => {
  const { addToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [pets, setPets] = useState([]);
  const [servicesCatalog, setServicesCatalog] = useState([]);

  const todayStr = new Date().toISOString().split('T')[0];
  const dueStr = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0];

  const [formData, setFormData] = useState({
    customer: '',
    pet: '',
    invoice_date: todayStr,
    due_date: dueStr,
    discount: '0.00',
    tax_rate: '5.00',
    payment_method: 'CARD',
    payment_status: 'PENDING',
    notes: '',
  });

  const [items, setItems] = useState([
    { description: 'Pet Care & Boarding Service', quantity: 1, unit_price: 50.00, total: 50.00 }
  ]);

  useEffect(() => {
    if (isOpen) {
      customerService.getAll().then((res) => {
        setCustomers(Array.isArray(res) ? res : res.results || []);
      }).catch(console.error);

      serviceService.getAll({ status: 'ACTIVE' }).then((res) => {
        setServicesCatalog(Array.isArray(res) ? res : res.results || []);
      }).catch(console.error);
    }
  }, [isOpen]);

  useEffect(() => {
    if (formData.customer) {
      petService.getAll({ owner: formData.customer }).then((res) => {
        setPets(Array.isArray(res) ? res : res.results || []);
      }).catch(console.error);
    }
  }, [formData.customer]);

  const handleAddItem = () => {
    setItems([...items, { description: '', quantity: 1, unit_price: 0, total: 0 }]);
  };

  const handleRemoveItem = (index) => {
    setItems(items.filter((_, idx) => idx !== index));
  };

  const handleItemChange = (index, field, value) => {
    const updated = [...items];
    updated[index][field] = value;
    if (field === 'quantity' || field === 'unit_price') {
      const q = parseFloat(updated[index].quantity) || 0;
      const p = parseFloat(updated[index].unit_price) || 0;
      updated[index].total = roundTwo(q * p);
    }
    setItems(updated);
  };

  const handlePresetSelect = (index, serviceId) => {
    const srv = servicesCatalog.find((s) => s.id === parseInt(serviceId));
    if (srv) {
      const updated = [...items];
      updated[index].description = srv.name;
      updated[index].unit_price = parseFloat(srv.price);
      updated[index].total = roundTwo(parseFloat(srv.price) * (parseFloat(updated[index].quantity) || 1));
      setItems(updated);
    }
  };

  const roundTwo = (num) => Math.round(num * 100) / 100;

  const subtotal = items.reduce((sum, item) => sum + (parseFloat(item.total) || 0), 0);
  const discountVal = parseFloat(formData.discount) || 0;
  const taxable = Math.max(subtotal - discountVal, 0);
  const taxVal = roundTwo(taxable * ((parseFloat(formData.tax_rate) || 0) / 100));
  const grandTotal = roundTwo(taxable + taxVal);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (items.length === 0) {
      addToast('Please add at least one line item to the invoice', 'error');
      return;
    }
    setLoading(true);
    try {
      const payload = {
        ...formData,
        items_data: items,
        subtotal: roundTwo(subtotal),
        discount: discountVal,
        tax_amount: taxVal,
        total_amount: grandTotal,
      };

      await billingService.createInvoice(payload);
      addToast('Invoice created successfully!', 'success');
      if (onSaved) onSaved();
      onClose();
    } catch (err) {
      addToast('Failed to create invoice', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create Commercial Invoice"
      subtitle="Itemize services, apply discounts, tax calculation, and assign payment terms"
      maxWidth="max-w-2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
              Customer / Pet Parent *
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

          <div>
            <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
              Pet Patient (Optional)
            </label>
            <select
              value={formData.pet}
              onChange={(e) => setFormData({ ...formData, pet: e.target.value })}
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20"
            >
              <option value="">None / General Account</option>
              {pets.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.species})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
              Invoice Date *
            </label>
            <input
              type="date"
              required
              value={formData.invoice_date}
              onChange={(e) => setFormData({ ...formData, invoice_date: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
              Due Date *
            </label>
            <input
              type="date"
              required
              value={formData.due_date}
              onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
              Payment Method
            </label>
            <select
              value={formData.payment_method}
              onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20"
            >
              <option value="CARD">Credit / Debit Card</option>
              <option value="CASH">Cash</option>
              <option value="UPI">UPI</option>
              <option value="BANK_TRANSFER">Bank Transfer</option>
              <option value="ONLINE">Online Payment</option>
            </select>
          </div>
        </div>

        {/* Itemized Line Items */}
        <div className="pt-2">
          <div className="flex items-center justify-between mb-2">
            <label className="block text-xs font-bold uppercase text-slate-700">
              Line Items & Services
            </label>
            <button
              type="button"
              onClick={handleAddItem}
              className="text-xs font-bold text-brand-600 hover:text-brand-800 flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Line Item</span>
            </button>
          </div>

          <div className="space-y-2.5">
            {items.map((item, idx) => (
              <div key={idx} className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200">
                <div className="flex-1">
                  <input
                    type="text"
                    required
                    placeholder="Description / Service Name"
                    value={item.description}
                    onChange={(e) => handleItemChange(idx, 'description', e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                  />
                  {/* Preset quick selector */}
                  {servicesCatalog.length > 0 && (
                    <select
                      onChange={(e) => handlePresetSelect(idx, e.target.value)}
                      className="mt-1 w-full text-[10px] text-slate-500 bg-white border border-slate-200 rounded px-1.5 py-0.5"
                    >
                      <option value="">Quick select from Catalog...</option>
                      {servicesCatalog.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name} (${s.price})
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                <div className="w-16">
                  <input
                    type="number"
                    min="1"
                    required
                    placeholder="Qty"
                    value={item.quantity}
                    onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                    className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-center"
                  />
                </div>

                <div className="w-24">
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="Unit Price"
                    value={item.unit_price}
                    onChange={(e) => handleItemChange(idx, 'unit_price', e.target.value)}
                    className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-right"
                  />
                </div>

                <div className="w-20 text-right font-bold text-xs text-slate-800">
                  ${parseFloat(item.total).toFixed(2)}
                </div>

                {items.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveItem(idx)}
                    className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Financial Calculation Summary */}
        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2 text-xs">
          <div className="flex justify-between text-slate-600">
            <span>Subtotal:</span>
            <span className="font-semibold text-slate-800">${subtotal.toFixed(2)}</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-slate-600">Discount ($):</span>
            <input
              type="number"
              step="0.01"
              value={formData.discount}
              onChange={(e) => setFormData({ ...formData, discount: e.target.value })}
              className="w-24 px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs text-right"
            />
          </div>

          <div className="flex items-center justify-between">
            <span className="text-slate-600">Tax Rate (%):</span>
            <input
              type="number"
              step="0.1"
              value={formData.tax_rate}
              onChange={(e) => setFormData({ ...formData, tax_rate: e.target.value })}
              className="w-24 px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs text-right"
            />
          </div>

          <div className="flex justify-between text-slate-600">
            <span>Calculated Tax:</span>
            <span className="font-semibold text-slate-800">${taxVal.toFixed(2)}</span>
          </div>

          <div className="flex justify-between text-sm font-black text-slate-900 pt-2 border-t border-slate-200">
            <span>Grand Total Due:</span>
            <span className="text-brand-700">${grandTotal.toFixed(2)}</span>
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
            {loading ? 'Creating...' : 'Issue Invoice'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default InvoiceModal;
