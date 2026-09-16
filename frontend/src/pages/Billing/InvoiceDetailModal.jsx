import React, { useState } from 'react';
import Modal from '../../components/Modal';
import PrintableInvoice from '../../components/PrintableInvoice';
import { billingService } from '../../services/billingService';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../context/ToastContext';
import { DollarSign, CreditCard } from 'lucide-react';

export const InvoiceDetailModal = ({ isOpen, onClose, invoice, onUpdated }) => {
  const { isStaff } = useAuth();
  const { addToast } = useToast();
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [paying, setPaying] = useState(false);

  const [paymentAmount, setPaymentAmount] = useState(
    invoice?.balance_due ? String(invoice.balance_due) : String(invoice?.total_amount || '')
  );
  const [paymentMethod, setPaymentMethod] = useState(invoice?.payment_method || 'CARD');
  const [transactionId, setTransactionId] = useState('');

  if (!invoice) return null;

  const handleRecordPayment = async (e) => {
    e.preventDefault();
    setPaying(true);
    try {
      await billingService.recordPayment(invoice.id, {
        amount: parseFloat(paymentAmount),
        payment_method: paymentMethod,
        transaction_id: transactionId || `TXN-${Date.now().toString().slice(-6)}`,
        notes: 'Recorded via CRM terminal',
      });
      addToast('Payment recorded successfully!', 'success');
      setShowPaymentForm(false);
      if (onUpdated) onUpdated();
      onClose();
    } catch (err) {
      addToast('Failed to record payment', 'error');
    } finally {
      setPaying(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Invoice #${invoice.invoice_number}`}
      subtitle={`Customer: ${invoice.customer_name} • Total: $${parseFloat(invoice.total_amount).toFixed(2)}`}
      maxWidth="max-w-3xl"
    >
      <div className="space-y-6">
        {/* Payment Action Banner for Staff */}
        {isStaff && invoice.payment_status !== 'PAID' && (
          <div className="no-print p-4 bg-amber-50 border border-amber-200 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <p className="text-xs font-bold text-amber-900">
                Payment Outstanding: <strong className="text-sm">${invoice.balance_due || invoice.total_amount}</strong>
              </p>
              <p className="text-[11px] text-amber-700">Status: {invoice.payment_status}</p>
            </div>

            <button
              onClick={() => setShowPaymentForm(!showPaymentForm)}
              className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm transition-colors"
            >
              <CreditCard className="w-4 h-4" />
              <span>{showPaymentForm ? 'Hide Form' : 'Record Payment'}</span>
            </button>
          </div>
        )}

        {/* Record Payment Form */}
        {showPaymentForm && (
          <form onSubmit={handleRecordPayment} className="no-print p-5 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Collect / Record Payment
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Payment Amount ($) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Payment Method
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                >
                  <option value="CARD">Credit / Debit Card</option>
                  <option value="CASH">Cash</option>
                  <option value="UPI">UPI</option>
                  <option value="BANK_TRANSFER">Bank Transfer</option>
                  <option value="ONLINE">Online</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Transaction / Receipt ID
                </label>
                <input
                  type="text"
                  placeholder="e.g. TXN-12345"
                  value={transactionId}
                  onChange={(e) => setTransactionId(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowPaymentForm(false)}
                className="px-3 py-1.5 text-xs font-semibold text-slate-600"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={paying}
                className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-sm"
              >
                {paying ? 'Recording...' : 'Confirm Payment'}
              </button>
            </div>
          </form>
        )}

        {/* Printable Invoice Component */}
        <PrintableInvoice invoice={invoice} onClose={onClose} />
      </div>
    </Modal>
  );
};

export default InvoiceDetailModal;
