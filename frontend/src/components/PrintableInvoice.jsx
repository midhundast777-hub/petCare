import React from 'react';
import { Printer, Download, CheckCircle, Clock } from 'lucide-react';

export const PrintableInvoice = ({ invoice, onClose }) => {
  if (!invoice) return null;

  const handlePrint = () => {
    window.print();
  };

  const isPaid = invoice.payment_status === 'PAID';

  return (
    <div className="space-y-6">
      {/* Action Bar (hidden in print) */}
      <div className="no-print flex items-center justify-between pb-4 border-b border-slate-100">
        <div className="text-xs text-slate-500">
          Ready to print or save as PDF
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-sm font-semibold shadow-sm transition-colors"
          >
            <Printer className="w-4 h-4" />
            <span>Print Invoice</span>
          </button>
        </div>
      </div>

      {/* Printable Area */}
      <div id="printable-invoice-area" className="p-6 sm:p-8 bg-white rounded-xl border border-slate-200">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start gap-4 pb-8 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center text-white font-black text-base">
                🐾
              </div>
              <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">PET CARE CRM</h2>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Pet Wellness & Boarding Sanctuary<br />
              100 Paw Print Way, Suite 400<br />
              Springfield, Phone: (555) 019-2000
            </p>
          </div>

          <div className="text-right">
            <h1 className="text-2xl font-black text-slate-800 tracking-wider">INVOICE</h1>
            <p className="text-sm font-bold text-brand-600 mt-0.5">{invoice.invoice_number}</p>
            <div className="mt-2 text-xs text-slate-500">
              <p>Invoice Date: <span className="font-semibold text-slate-700">{invoice.invoice_date}</span></p>
              <p>Due Date: <span className="font-semibold text-slate-700">{invoice.due_date}</span></p>
            </div>
            {/* Status Stamp */}
            <div className="mt-3">
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${
                  isPaid
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    : 'bg-amber-100 text-amber-800 border border-amber-300'
                }`}
              >
                {isPaid ? <CheckCircle className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
                {invoice.status_display || invoice.payment_status}
              </span>
            </div>
          </div>
        </div>

        {/* Bill To & Pet Info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 py-6 border-b border-slate-100 text-sm">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Billed To</p>
            <p className="font-bold text-slate-800 text-base">{invoice.customer_name}</p>
            <p className="text-slate-600 text-xs mt-0.5">{invoice.customer_email}</p>
            <p className="text-slate-600 text-xs">{invoice.customer_phone}</p>
            {invoice.customer_address && (
              <p className="text-slate-600 text-xs mt-1">
                {invoice.customer_address}{invoice.customer_city ? `, ${invoice.customer_city}` : ''}
              </p>
            )}
          </div>

          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Patient Details</p>
            <p className="font-bold text-slate-800">{invoice.pet_name || 'General Care'}</p>
            <p className="text-slate-600 text-xs mt-0.5">Species: {invoice.pet_species || 'Pet'}</p>
            <p className="text-slate-600 text-xs mt-1">
              Payment Method: <span className="font-semibold">{invoice.payment_method}</span>
            </p>
          </div>
        </div>

        {/* Line Items Table */}
        <div className="py-6">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-[11px] font-bold uppercase text-slate-500">
                <th className="pb-3 text-left">Description</th>
                <th className="pb-3 text-center w-20">Qty</th>
                <th className="pb-3 text-right w-28">Unit Price</th>
                <th className="pb-3 text-right w-28">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {Array.isArray(invoice.items_data) && invoice.items_data.length > 0 ? (
                invoice.items_data.map((item, idx) => (
                  <tr key={idx}>
                    <td className="py-3 font-medium text-slate-800">{item.description}</td>
                    <td className="py-3 text-center text-slate-600">{item.quantity}</td>
                    <td className="py-3 text-right text-slate-600">${parseFloat(item.unit_price).toFixed(2)}</td>
                    <td className="py-3 text-right font-semibold text-slate-800">${parseFloat(item.total).toFixed(2)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="py-3 font-medium text-slate-800">Pet Care & Boarding Services</td>
                  <td className="py-3 text-center text-slate-600">1</td>
                  <td className="py-3 text-right text-slate-600">${parseFloat(invoice.subtotal).toFixed(2)}</td>
                  <td className="py-3 text-right font-semibold text-slate-800">${parseFloat(invoice.subtotal).toFixed(2)}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Summary Breakdown */}
        <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-start gap-4">
          <div className="text-xs text-slate-500 max-w-sm">
            <p className="font-bold text-slate-700 mb-1">Notes & Terms</p>
            <p>{invoice.notes || 'Thank you for choosing our Pet Care CRM sanctuary! Payment is due upon receipt.'}</p>
          </div>

          <div className="w-full sm:w-64 space-y-2 text-sm">
            <div className="flex justify-between text-slate-600 text-xs">
              <span>Subtotal:</span>
              <span className="font-medium">${parseFloat(invoice.subtotal).toFixed(2)}</span>
            </div>
            {parseFloat(invoice.discount) > 0 && (
              <div className="flex justify-between text-emerald-600 text-xs">
                <span>Discount:</span>
                <span className="font-medium">-${parseFloat(invoice.discount).toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-slate-600 text-xs">
              <span>Tax ({invoice.tax_rate}%):</span>
              <span className="font-medium">${parseFloat(invoice.tax_amount).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-base font-black text-slate-900 pt-2 border-t border-slate-200">
              <span>Total:</span>
              <span className="text-brand-700">${parseFloat(invoice.total_amount).toFixed(2)}</span>
            </div>
            {invoice.paid_amount > 0 && (
              <div className="flex justify-between text-xs text-emerald-700 font-semibold">
                <span>Paid to Date:</span>
                <span>${parseFloat(invoice.paid_amount).toFixed(2)}</span>
              </div>
            )}
            {invoice.balance_due > 0 && (
              <div className="flex justify-between text-xs text-rose-700 font-bold">
                <span>Balance Due:</span>
                <span>${parseFloat(invoice.balance_due).toFixed(2)}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrintableInvoice;
