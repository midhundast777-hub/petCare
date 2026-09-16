import React, { useState, useEffect } from 'react';
import { serviceService } from '../../services/serviceService';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../hooks/useAuth';
import DataTable from '../../components/DataTable';
import ServiceModal from './ServiceModal';
import {
  Scissors,
  Plus,
  Clock,
  DollarSign,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle
} from 'lucide-react';

export const ServiceList = () => {
  const { isAdmin, isStaff } = useAuth();
  const { addToast } = useToast();
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingService, setEditingService] = useState(null);

  const fetchServices = async () => {
    setLoading(true);
    try {
      const data = await serviceService.getAll({
        category: categoryFilter || undefined,
      });
      setServices(Array.isArray(data) ? data : data.results || []);
    } catch (err) {
      console.error(err);
      addToast('Failed to load services catalog', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
  }, [categoryFilter]);

  const handleToggleStatus = async (service) => {
    const newStatus = service.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      await serviceService.update(service.id, { ...service, status: newStatus });
      addToast(`Service marked ${newStatus.toLowerCase()}`, 'success');
      fetchServices();
    } catch (err) {
      addToast('Failed to toggle status', 'error');
    }
  };

  const handleDelete = async (id, name) => {
    if (window.confirm(`Delete service "${name}"?`)) {
      try {
        await serviceService.delete(id);
        addToast('Service removed from catalog', 'info');
        fetchServices();
      } catch (err) {
        addToast('Failed to delete service', 'error');
      }
    }
  };

  const categoryBadge = (cat) => {
    const map = {
      GROOMING: 'bg-purple-100 text-purple-800',
      BATHING: 'bg-sky-100 text-sky-800',
      BOARDING: 'bg-amber-100 text-amber-800',
      DAYCARE: 'bg-emerald-100 text-emerald-800',
      TRAINING: 'bg-indigo-100 text-indigo-800',
      VETERINARY: 'bg-rose-100 text-rose-800',
      NAIL_TRIMMING: 'bg-teal-100 text-teal-800',
      TRANSPORTATION: 'bg-slate-100 text-slate-800',
    };
    return (
      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${map[cat] || 'bg-slate-100 text-slate-800'}`}>
        {cat}
      </span>
    );
  };

  const columns = [
    {
      header: 'Service Name & Category',
      render: (row) => (
        <div>
          <span className="font-bold text-slate-900 text-xs">{row.name}</span>
          <div className="mt-1">{categoryBadge(row.category)}</div>
          {row.description && (
            <p className="text-[11px] text-slate-500 mt-1 line-clamp-1">{row.description}</p>
          )}
        </div>
      ),
    },
    {
      header: 'Price',
      render: (row) => (
        <span className="font-black text-slate-900 text-sm">
          ${parseFloat(row.price).toFixed(2)}
        </span>
      ),
    },
    {
      header: 'Standard Duration',
      render: (row) => (
        <span className="text-xs text-slate-600 flex items-center gap-1">
          <Clock className="w-3.5 h-3.5 text-slate-400" />
          <span>{row.duration_minutes} mins</span>
        </span>
      ),
    },
    {
      header: 'Status',
      render: (row) => (
        <button
          onClick={() => isStaff && handleToggleStatus(row)}
          disabled={!isStaff}
          className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider transition-colors ${
            row.status === 'ACTIVE'
              ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          {row.status}
        </button>
      ),
    },
    {
      header: 'Actions',
      className: 'text-right',
      render: (row) => (
        <div className="flex items-center justify-end gap-1.5">
          {isStaff && (
            <button
              onClick={() => {
                setEditingService(row);
                setIsModalOpen(true);
              }}
              title="Edit Service"
              className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <Edit2 className="w-4 h-4" />
            </button>
          )}
          {isAdmin && (
            <button
              onClick={() => handleDelete(row.id, row.name)}
              title="Delete Service"
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
            <Scissors className="w-6 h-6 text-brand-600" />
            <span>Pet Care Services Catalog</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure groomings, boarding rates, daycare options, and clinical treatments
          </p>
        </div>

        {isStaff && (
          <button
            onClick={() => {
              setEditingService(null);
              setIsModalOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Service</span>
          </button>
        )}
      </div>

      <DataTable
        columns={columns}
        data={services}
        loading={loading}
        searchPlaceholder="Search services by name or description..."
        filterComponent={
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500/20 shadow-sm"
          >
            <option value="">All Categories</option>
            <option value="GROOMING">Grooming</option>
            <option value="BATHING">Bathing & Spa</option>
            <option value="BOARDING">Boarding</option>
            <option value="DAYCARE">Daycare</option>
            <option value="TRAINING">Training</option>
            <option value="VETERINARY">Veterinary</option>
            <option value="NAIL_TRIMMING">Nail Trimming</option>
            <option value="TRANSPORTATION">Transportation</option>
          </select>
        }
      />

      {isModalOpen && (
        <ServiceModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          service={editingService}
          onSaved={fetchServices}
        />
      )}
    </div>
  );
};

export default ServiceList;
