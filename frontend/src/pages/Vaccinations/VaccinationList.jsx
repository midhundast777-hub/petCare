import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { vaccinationService } from '../../services/vaccinationService';
import { useToast } from '../../context/ToastContext';
import DataTable from '../../components/DataTable';
import VaccinationModal from './VaccinationModal';
import {
  Syringe,
  Plus,
  AlertTriangle,
  CheckCircle2,
  Clock,
  AlertCircle,
  Edit2,
  Trash2,
  Dog
} from 'lucide-react';

export const VaccinationList = () => {
  const { addToast } = useToast();
  const [vaccinations, setVaccinations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVaccination, setEditingVaccination] = useState(null);

  const fetchVaccinations = async () => {
    setLoading(true);
    try {
      const data = await vaccinationService.getAll({
        status: statusFilter || undefined,
      });
      setVaccinations(Array.isArray(data) ? data : data.results || []);
    } catch (err) {
      console.error(err);
      addToast('Failed to fetch vaccinations registry', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVaccinations();
  }, [statusFilter]);

  const handleDelete = async (id, name) => {
    if (window.confirm(`Delete vaccination record for ${name}?`)) {
      try {
        await vaccinationService.delete(id);
        addToast('Vaccination record deleted', 'info');
        fetchVaccinations();
      } catch (err) {
        addToast('Failed to delete vaccination', 'error');
      }
    }
  };

  const statusBadge = (status, days) => {
    if (status === 'VALID') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-300">
          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
          Valid ({days}d)
        </span>
      );
    }
    if (status === 'EXPIRING_SOON') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-100 text-amber-800 border border-amber-300">
          <Clock className="w-3 h-3 text-amber-600" />
          Expiring Soon ({days}d)
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-100 text-rose-800 border border-rose-300">
        <AlertCircle className="w-3 h-3 text-rose-600" />
        Expired ({Math.abs(days)}d ago)
      </span>
    );
  };

  const columns = [
    {
      header: 'Pet Patient',
      render: (row) => (
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-brand-100 text-brand-700 flex items-center justify-center font-bold text-xs">
            🐾
          </div>
          <div>
            <Link
              to={`/pets/${row.pet}`}
              className="font-bold text-slate-900 hover:text-brand-600 transition-colors text-xs"
            >
              {row.pet_name}
            </Link>
            <p className="text-[11px] text-slate-400">{row.pet_species} • {row.owner_name}</p>
          </div>
        </div>
      ),
    },
    {
      header: 'Vaccine & Certificate',
      render: (row) => (
        <div className="text-xs">
          <span className="font-bold text-slate-800">{row.vaccine_name}</span>
          {row.certificate_number && (
            <p className="text-[10px] text-slate-400 font-mono">Cert: {row.certificate_number}</p>
          )}
        </div>
      ),
    },
    {
      header: 'Administered Date',
      render: (row) => <span className="text-xs text-slate-600">{row.vaccination_date}</span>,
    },
    {
      header: 'Expiry Date',
      render: (row) => <span className="text-xs font-bold text-slate-800">{row.expiry_date}</span>,
    },
    {
      header: 'Status & Remaining',
      render: (row) => statusBadge(row.status, row.days_until_expiry),
    },
    {
      header: 'Veterinarian',
      render: (row) => <span className="text-xs text-slate-600">{row.veterinarian || '—'}</span>,
    },
    {
      header: 'Actions',
      className: 'text-right',
      render: (row) => (
        <div className="flex items-center justify-end gap-1.5">
          <button
            onClick={() => {
              setEditingVaccination(row);
              setIsModalOpen(true);
            }}
            title="Edit Record"
            className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleDelete(row.id, row.vaccine_name)}
            title="Delete Record"
            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  const expiredCount = vaccinations.filter((v) => v.status === 'EXPIRED').length;
  const expiringSoonCount = vaccinations.filter((v) => v.status === 'EXPIRING_SOON').length;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Syringe className="w-6 h-6 text-brand-600" />
            <span>Vaccination Tracking Registry</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Monitor immunizations, automated expiration calculations, and compliance alerts
          </p>
        </div>

        <button
          onClick={() => {
            setEditingVaccination(null);
            setIsModalOpen(true);
          }}
          className="flex items-center gap-2 px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold shadow-sm transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Record Vaccination</span>
        </button>
      </div>

      {/* Expiration Alert Banners */}
      {(expiredCount > 0 || expiringSoonCount > 0) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {expiredCount > 0 && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-3 text-xs text-rose-900">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
              <div>
                <strong className="block text-sm font-bold text-rose-950">{expiredCount} Pets Have Expired Vaccinations!</strong>
                <span>Overdue immunizations may prevent boarding and daycare reservations.</span>
              </div>
            </div>
          )}

          {expiringSoonCount > 0 && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-center gap-3 text-xs text-amber-900">
              <Clock className="w-5 h-5 text-amber-600 shrink-0" />
              <div>
                <strong className="block text-sm font-bold text-amber-950">{expiringSoonCount} Vaccinations Expiring Within 30 Days</strong>
                <span>Automatic renewal notices have been generated for pet parents.</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Table */}
      <DataTable
        columns={columns}
        data={vaccinations}
        loading={loading}
        searchPlaceholder="Search by pet name, vaccine, veterinarian, or certificate..."
        filterComponent={
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500/20 shadow-sm"
          >
            <option value="">All Statuses</option>
            <option value="VALID">Valid Only</option>
            <option value="EXPIRING_SOON">Expiring Soon (&lt; 30d)</option>
            <option value="EXPIRED">Expired</option>
          </select>
        }
      />

      {/* Vaccination Modal */}
      {isModalOpen && (
        <VaccinationModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          vaccination={editingVaccination}
          onSaved={fetchVaccinations}
        />
      )}
    </div>
  );
};

export default VaccinationList;
