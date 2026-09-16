import React, { useState, useEffect } from 'react';
import { billingService } from '../../services/billingService';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../hooks/useAuth';
import DataTable from '../../components/DataTable';
import InvoiceModal from './InvoiceModal';
import InvoiceDetailModal from './InvoiceDetailModal';
import {
  Receipt,
  Plus,
  Printer,
  Eye,
  Trash2,
  DollarSign,
  CheckCircle2,
  Clock,
  User
} from 'lucide-react';

export const InvoiceList = () => {
  const { isStaff, isAdmin } = useAuth();
  const { addToast } = useToast();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const data = await billingService.getInvoices({
        status: statusFilter || undefined,
      });
      setInvoices(Array.isArray(data) ? data : data.results || []);
    } catch (err) {
      console.error(err);
      addToast('Failed to load invoices', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, [statusFilter]);

  const handleOpenDetail = (invoice) => {
    setSelectedInvoice(invoice);
    setIsDetailModalOpen(true);
  };

  const handleDelete = async (id, invNumber) => {
    if (window.confirm(`Delete invoice ${invNumber}?`)) {
      try {
        await billingService.deleteInvoice(id);
        addToast(`Invoice ${invNumber} removed`, 'info');
        fetchInvoices();
      } catch (err) {
        addToast('Failed to delete invoice', 'error');
      }
    }
  };

  const statusBadge = (status) => {
    const styles = {
      PAID: 'bg-emerald-100 text-emerald-800 border-emerald-300',
      PARTIALLY_PAID: 'bg-sky-100 text-sky-800 border-sky-300',
      PENDING: 'bg-amber-100 text-amber-800 border-amber-300',
      REFUNDED: 'bg-slate-100 text-slate-800 border-slate-300',
    };
    return (
      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${styles[status] || styles.PENDING}`}>
        {status.replace('_', ' ')}
      </span>
    );
  };

  const columns = [
    {
      header: 'Invoice # & Date',
      render: (row) => (
        <div>
          <button
            onClick={() => handleOpenDetail(row)}
            className="font-mono text-xs font-bold text-brand-600 hover:underline"
          >
            {row.invoice_number}
          </button>
          <p className="text-[11px] text-slate-500 mt-0.5">Date: {row.invoice_date}</p>
          <p className="text-[10px] text-slate-400">Due: {row.due_date}</p>
        </div>
      ),
    },
    {
      header: 'Customer & Pet',
      render: (row) => (
        <div className="text-xs">
          <p className="font-bold text-slate-900">{row.customer_name}</p>
          <p className="text-slate-500 text-[11px]">
            {row.pet_name ? `Patient: ${row.pet_name}` : 'General Account'}
          </p>
          <p className="text-[10px] text-slate-400">{row.customer_phone}</p>
        </div>
      ),
    },
    {
      header: 'Total Amount',
      render: (row) => (
        <div>
          <span className="font-black text-slate-900 text-sm">
            ${parseFloat(row.total_amount).toFixed(2)}
          </span>
          <span className="block text-[10px] text-slate-400">Method: {row.payment_method}</span>
        </div>
      ),
    },
    {
      header: 'Paid & Balance',
      render: (row) => (
        <div className="text-xs">
          <p className="text-emerald-700 font-semibold">
            Paid: ${parseFloat(row.paid_amount || 0).toFixed(2)}
          </p>
          {row.balance_due > 0 && (
            <p className="text-rose-600 font-bold text-[11px]">
              Due: ${parseFloat(row.balance_due).toFixed(2)}
            </p>
          )}
        </div>
      ),
    },
    {
      header: 'Status',
      render: (row) => statusBadge(row.payment_status),
    },
    {
      header: 'Actions',
      className: 'text-right',
      render: (row) => (
        <div className="flex items-center justify-end gap-1.5">
          <button
            onClick={() => handleOpenDetail(row)}
            title="View & Print Invoice"
            className="flex items-center gap-1 px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print / Pay</span>
          </button>
          {isAdmin && (
            <button
              onClick={() => handleDelete(row.id, row.invoice_number)}
              title="Delete Invoice"
              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Receipt className="w-6 h-6 text-brand-600" />
            <span>Billing & Invoice Management</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Generate itemized receipts, record card/cash payments, and print customer invoices
          </p>
        </div>

        {isStaff && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Generate New Invoice</span>
          </button>
        )}
      </div>

      <DataTable
        columns={columns}
        data={invoices}
        loading={loading}
        searchPlaceholder="Search invoices by number, client, or pet..."
        filterComponent={
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500/20 shadow-sm"
          >
            <option value="">All Statuses</option>
            <option value="PAID">Paid</option>
            <option value="PENDING">Pending Payment</option>
            <option value="PARTIALLY_PAID">Partially Paid</option>
            <option value="REFUNDED">Refunded</option>
          </select>
        }
      />

      {isModalOpen && (
        <InvoiceModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSaved={fetchInvoices}
        />
      )}

      {isDetailModalOpen && selectedInvoice && (
        <InvoiceDetailModal
          isOpen={isDetailModalOpen}
          onClose={() => setIsDetailModalOpen(false)}
          invoice={selectedInvoice}
          onUpdated={fetchInvoices}
        />
      )}
    </div>
  );
};

export default InvoiceList;
