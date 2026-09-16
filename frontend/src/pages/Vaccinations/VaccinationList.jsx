import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { vaccinationService } from '../../services/vaccinationService';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../hooks/useAuth';
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
  Dog,
  FileSpreadsheet,
  Printer
} from 'lucide-react';

export const VaccinationList = () => {
  const { addToast } = useToast();
  const { isAdmin, isStaff } = useAuth();
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

  const handleExportCSV = () => {
    if (!vaccinations.length) {
      addToast('No vaccination records to export', 'info');
      return;
    }
    const headers = [
      'Pet Name',
      'Species',
      'Owner',
      'Vaccine Name',
      'Certificate Number',
      'Administered Date',
      'Expiry Date',
      'Status',
      'Days Until Expiry',
      'Veterinarian'
    ];

    const rows = vaccinations.map((v) => [
      `"${(v.pet_name || '').replace(/"/g, '""')}"`,
      `"${(v.pet_species || '').replace(/"/g, '""')}"`,
      `"${(v.owner_name || '').replace(/"/g, '""')}"`,
      `"${(v.vaccine_name || '').replace(/"/g, '""')}"`,
      `"${(v.certificate_number || '').replace(/"/g, '""')}"`,
      `"${v.vaccination_date || ''}"`,
      `"${v.expiry_date || ''}"`,
      `"${v.status || ''}"`,
      v.days_until_expiry ?? '',
      `"${(v.veterinarian || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `vaccination_registry_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    addToast('Vaccination registry exported to Excel CSV', 'success');
  };

  const handleExportPDF = () => {
    if (!vaccinations.length) {
      addToast('No vaccination records to export', 'info');
      return;
    }
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      addToast('Please allow popups to generate PDF report', 'error');
      return;
    }

    const tableRows = vaccinations
      .map(
        (v) => `
      <tr>
        <td style="padding: 8px 10px; border: 1px solid #e2e8f0;">${v.pet_name || ''} <span style="color:#64748b; font-size:11px;">(${v.pet_species || ''})</span></td>
        <td style="padding: 8px 10px; border: 1px solid #e2e8f0;">${v.owner_name || ''}</td>
        <td style="padding: 8px 10px; border: 1px solid #e2e8f0; font-weight:600;">${v.vaccine_name || ''}</td>
        <td style="padding: 8px 10px; border: 1px solid #e2e8f0; font-family: monospace;">${v.certificate_number || '—'}</td>
        <td style="padding: 8px 10px; border: 1px solid #e2e8f0;">${v.vaccination_date || ''}</td>
        <td style="padding: 8px 10px; border: 1px solid #e2e8f0; font-weight:600;">${v.expiry_date || ''}</td>
        <td style="padding: 8px 10px; border: 1px solid #e2e8f0;">
          <span style="display:inline-block; padding: 2px 8px; border-radius: 9999px; font-size: 10px; font-weight: bold; background: ${
            v.status === 'VALID'
              ? '#dcfce7; color: #166534;'
              : v.status === 'EXPIRING_SOON'
              ? '#fef3c7; color: #92400e;'
              : '#ffe4e6; color: #9f1239;'
          }">
            ${v.status || ''}
          </span>
        </td>
        <td style="padding: 8px 10px; border: 1px solid #e2e8f0;">${v.veterinarian || '—'}</td>
      </tr>
    `
      )
      .join('');

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Vaccination Registry Report - Pet Care</title>
          <style>
            @page { size: landscape; margin: 12mm; }
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #1e293b; margin: 0; padding: 20px; }
            .header { display: flex; justify-content: space-between; align-items: flex-end; border-bottom: 2px solid #0284c7; padding-bottom: 12px; margin-bottom: 20px; }
            .title { font-size: 20px; font-weight: 800; color: #0f172a; margin: 0; }
            .subtitle { font-size: 12px; color: #64748b; margin: 4px 0 0 0; }
            .meta { text-align: right; font-size: 11px; color: #64748b; }
            table { width: 100%; border-collapse: collapse; font-size: 12px; }
            th { background-color: #f8fafc; color: #475569; font-weight: 700; text-align: left; padding: 10px; border: 1px solid #cbd5e1; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; }
            tr:nth-child(even) { background-color: #f8fafc; }
            .footer { margin-top: 24px; font-size: 11px; color: #94a3b8; text-align: center; border-top: 1px solid #e2e8f0; padding-top: 12px; }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <div class="title">🐾 Pet Care — Official Vaccination Registry</div>
              <div class="subtitle">Complete patient immunization records and renewal compliance status</div>
            </div>
            <div class="meta">
              <div><strong>Generated:</strong> ${new Date().toLocaleString()}</div>
              <div><strong>Total Records:</strong> ${vaccinations.length}</div>
            </div>
          </div>
          <table>
            <thead>
              <tr>
                <th>Pet Patient</th>
                <th>Parent / Owner</th>
                <th>Vaccine Name</th>
                <th>Certificate #</th>
                <th>Given Date</th>
                <th>Expiry Date</th>
                <th>Status</th>
                <th>Veterinarian</th>
              </tr>
            </thead>
            <tbody>
              ${tableRows}
            </tbody>
          </table>
          <div class="footer">
            Confidential Pet Healthcare Record • Pet Care Clinic & Hospital System
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 250);
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
          {!isAdmin ? (
            <>
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
            </>
          ) : (
            <span className="text-[11px] font-semibold text-slate-400 italic px-2 py-0.5 bg-slate-50 border border-slate-200 rounded">
              View Only
            </span>
          )}
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

        {isAdmin ? (
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-3.5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm transition-colors"
              title="Download registry data as Excel CSV"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Download to Excel</span>
            </button>
            <button
              onClick={handleExportPDF}
              className="flex items-center gap-1.5 px-3.5 py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold shadow-sm transition-colors"
              title="Download or print registry as PDF"
            >
              <Printer className="w-4 h-4" />
              <span>Download / Print PDF</span>
            </button>
          </div>
        ) : (
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
        )}
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
