import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { customerService } from '../../services/customerService';
import { useToast } from '../../context/ToastContext';
import DataTable from '../../components/DataTable';
import CustomerModal from './CustomerModal';
import { useAuth } from '../../hooks/useAuth';
import { Users, Plus, Eye, Edit2, Trash2, Phone, Mail, Dog } from 'lucide-react';

export const CustomerList = () => {
  const { isStaff, isAdmin } = useAuth();
  const { addToast } = useToast();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const data = await customerService.getAll({
        status: statusFilter || undefined,
      });
      setCustomers(Array.isArray(data) ? data : data.results || []);
    } catch (err) {
      console.error(err);
      addToast('Failed to fetch customers list', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [statusFilter]);

  const handleDelete = async (id, name) => {
    if (window.confirm(`Are you sure you want to delete customer ${name}?`)) {
      try {
        await customerService.delete(id);
        addToast(`Customer ${name} deleted`, 'info');
        fetchCustomers();
      } catch (err) {
        addToast('Failed to delete customer', 'error');
      }
    }
  };

  const columns = [
    {
      header: 'Customer',
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-brand-400 text-white flex items-center justify-center font-bold text-xs shadow-sm">
            {row.first_name?.[0]}{row.last_name?.[0]}
          </div>
          <div>
            <Link
              to={`/customers/${row.id}`}
              className="font-bold text-slate-900 hover:text-brand-600 transition-colors"
            >
              {row.full_name}
            </Link>
            <p className="text-[11px] text-slate-400 font-mono">{row.customer_id}</p>
          </div>
        </div>
      ),
    },
    {
      header: 'Contact',
      render: (row) => (
        <div className="text-xs space-y-0.5">
          <p className="text-slate-700 flex items-center gap-1.5">
            <Mail className="w-3.5 h-3.5 text-slate-400" />
            <span>{row.email}</span>
          </p>
          <p className="text-slate-500 flex items-center gap-1.5">
            <Phone className="w-3.5 h-3.5 text-slate-400" />
            <span>{row.phone}</span>
          </p>
        </div>
      ),
    },
    {
      header: 'City',
      render: (row) => <span className="text-xs text-slate-600">{row.city || '—'}</span>,
    },
    {
      header: 'Pets',
      render: (row) => (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700">
          <Dog className="w-3.5 h-3.5 text-slate-500" />
          {row.total_pets}
        </span>
      ),
    },
    {
      header: 'Bookings',
      render: (row) => (
        <span className="text-xs font-semibold text-slate-700">
          {row.total_bookings} stays/visits
        </span>
      ),
    },
    {
      header: 'Total Spent',
      render: (row) => (
        <span className="text-xs font-black text-slate-900">
          ${parseFloat(row.total_spent || 0).toFixed(2)}
        </span>
      ),
    },
    {
      header: 'Status',
      render: (row) => (
        <span
          className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider ${
            row.status === 'ACTIVE'
              ? 'bg-emerald-100 text-emerald-800'
              : 'bg-slate-100 text-slate-600'
          }`}
        >
          {row.status}
        </span>
      ),
    },
    {
      header: 'Actions',
      className: 'text-right',
      render: (row) => (
        <div className="flex items-center justify-end gap-1.5">
          <Link
            to={`/customers/${row.id}`}
            title="View 360 Profile"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-50 hover:bg-brand-100 text-brand-700 rounded-lg text-xs font-bold transition-colors shadow-xs"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>View</span>
          </Link>
          {!isAdmin && (
            <>
              <button
                onClick={() => {
                  setEditingCustomer(row);
                  setIsModalOpen(true);
                }}
                title="Edit Customer"
                className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <Edit2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleDelete(row.id, row.full_name)}
                title="Delete Customer"
                className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </>
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
            <Users className="w-6 h-6 text-brand-600" />
            <span>Customer Management</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Directory of pet owners, contact history, and cumulative spending
          </p>
        </div>

        {!isAdmin && (
          <button
            onClick={() => {
              setEditingCustomer(null);
              setIsModalOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Customer</span>
          </button>
        )}
      </div>

      {/* Table Component with Filters */}
      <DataTable
        columns={columns}
        data={customers}
        loading={loading}
        searchPlaceholder="Search by name, email, phone, or customer ID..."
        filterComponent={
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
          >
            <option value="">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </select>
        }
      />

      {/* Customer Modal */}
      {isModalOpen && (
        <CustomerModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          customer={editingCustomer}
          onSaved={fetchCustomers}
        />
      )}
    </div>
  );
};

export default CustomerList;
