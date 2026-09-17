import React, { useState, useEffect } from 'react';
import { appointmentService } from '../../services/appointmentService';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../hooks/useAuth';
import DataTable from '../../components/DataTable';
import AppointmentModal from './AppointmentModal';
import Modal from '../../components/Modal';
import {
  Calendar,
  Clock,
  Plus,
  CheckCircle,
  LogIn,
  Check,
  XCircle,
  Edit2,
  Trash2,
  ListFilter,
  CalendarDays,
  Eye
} from 'lucide-react';

export const AppointmentList = () => {
  const { isStaff, isAdmin } = useAuth();
  const { addToast } = useToast();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'schedule'
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState(null);
  const [viewingAppointment, setViewingAppointment] = useState(null);

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      const data = await appointmentService.getAll({
        status: statusFilter || undefined,
        date: dateFilter || undefined,
      });
      setAppointments(Array.isArray(data) ? data : data.results || []);
    } catch (err) {
      console.error(err);
      addToast('Failed to load appointments', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, [statusFilter, dateFilter]);

  const handleStatusChange = async (id, newStatus, petName) => {
    try {
      await appointmentService.updateStatus(id, newStatus);
      addToast(`Appointment for ${petName} updated to ${newStatus}`, 'success');
      fetchAppointments();
    } catch (err) {
      addToast('Failed to update status', 'error');
    }
  };

  const handleDelete = async (id, aptId) => {
    if (window.confirm(`Delete appointment ${aptId}?`)) {
      try {
        await appointmentService.delete(id);
        addToast('Appointment cancelled and removed', 'info');
        fetchAppointments();
      } catch (err) {
        addToast('Failed to delete appointment', 'error');
      }
    }
  };

  const statusBadge = (status) => {
    const styles = {
      PENDING: 'bg-amber-100 text-amber-800 border-amber-200',
      CONFIRMED: 'bg-sky-100 text-sky-800 border-sky-200',
      CHECKED_IN: 'bg-indigo-100 text-indigo-800 border-indigo-200',
      IN_PROGRESS: 'bg-purple-100 text-purple-800 border-purple-200',
      COMPLETED: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      CANCELLED: 'bg-rose-100 text-rose-800 border-rose-200',
      NO_SHOW: 'bg-slate-100 text-slate-800 border-slate-200',
    };
    return (
      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${styles[status] || styles.PENDING}`}>
        {status.replace('_', ' ')}
      </span>
    );
  };

  const columns = [
    {
      header: 'ID & Date',
      render: (row) => (
        <div>
          <span className="font-mono text-xs font-bold text-slate-900">{row.appointment_id}</span>
          <p className="text-xs text-slate-600 font-semibold mt-0.5">{row.date}</p>
          <p className="text-[11px] text-slate-400">
            {row.start_time} - {row.end_time}
          </p>
        </div>
      ),
    },
    {
      header: 'Pet & Owner',
      render: (row) => (
        <div>
          <span className="font-bold text-slate-900 text-xs">{row.pet_name}</span>
          <span className="text-[11px] text-slate-400 ml-1.5">({row.pet_species})</span>
          <p className="text-xs text-slate-600 mt-0.5">{row.customer_name}</p>
          <p className="text-[11px] text-slate-400">{row.customer_phone}</p>
        </div>
      ),
    },
    {
      header: 'Care Service',
      render: (row) => (
        <div>
          <span className="font-bold text-slate-800 text-xs">{row.service_name}</span>
          <p className="text-xs font-semibold text-brand-700 mt-0.5">${parseFloat(row.amount).toFixed(2)}</p>
        </div>
      ),
    },
    {
      header: 'Staff Specialist',
      render: (row) => (
        <span className="text-xs text-slate-700 font-medium">
          {row.staff_name || 'Unassigned'}
        </span>
      ),
    },
    {
      header: 'Status',
      render: (row) => statusBadge(row.status),
    },
    {
      header: 'Actions',
      className: 'text-right',
      render: (row) => (
        <div className="flex items-center justify-end gap-1.5 flex-wrap">
          <button
            onClick={() => setViewingAppointment(row)}
            title="View Appointment Details"
            className="flex items-center gap-1.5 px-2.5 py-1 bg-brand-50 hover:bg-brand-100 text-brand-700 rounded-lg text-xs font-bold transition-colors shadow-xs"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>View</span>
          </button>

          {!isAdmin && (
            <>
              {row.status === 'PENDING' && isStaff && (
                <button
                  onClick={() => handleStatusChange(row.id, 'CONFIRMED', row.pet_name)}
                  title="Confirm Appointment"
                  className="p-1.5 text-sky-600 hover:bg-sky-50 rounded-lg transition-colors"
                >
                  <Check className="w-4 h-4" />
                </button>
              )}

              {row.status === 'CONFIRMED' && isStaff && (
                <button
                  onClick={() => handleStatusChange(row.id, 'CHECKED_IN', row.pet_name)}
                  title="Mark Checked-In"
                  className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                >
                  <LogIn className="w-4 h-4" />
                </button>
              )}

              {row.status === 'CHECKED_IN' && isStaff && (
                <button
                  onClick={() => handleStatusChange(row.id, 'IN_PROGRESS', row.pet_name)}
                  title="Start Service"
                  className="p-1.5 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                >
                  <Clock className="w-4 h-4" />
                </button>
              )}

              {row.status === 'IN_PROGRESS' && isStaff && (
                <button
                  onClick={() => handleStatusChange(row.id, 'COMPLETED', row.pet_name)}
                  title="Mark Completed"
                  className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                >
                  <CheckCircle className="w-4 h-4" />
                </button>
              )}

              {['PENDING', 'CONFIRMED'].includes(row.status) && (
                <button
                  onClick={() => handleStatusChange(row.id, 'CANCELLED', row.pet_name)}
                  title="Cancel Visit"
                  className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                >
                  <XCircle className="w-4 h-4" />
                </button>
              )}

              <button
                onClick={() => {
                  setEditingAppointment(row);
                  setIsModalOpen(true);
                }}
                title="Edit / Reschedule"
                className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <Edit2 className="w-4 h-4" />
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
            <Calendar className="w-6 h-6 text-brand-600" />
            <span>Appointment Management</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Book visits, manage check-ins, resolve conflicts, and track staff assignments
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* View Mode Toggle */}
          <div className="flex p-1 bg-slate-200/80 rounded-xl">
            <button
              onClick={() => setViewMode('list')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                viewMode === 'list' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ListFilter className="w-3.5 h-3.5" />
              <span>List</span>
            </button>
            <button
              onClick={() => setViewMode('calendar')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                viewMode === 'calendar' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <CalendarDays className="w-3.5 h-3.5" />
              <span>Schedule</span>
            </button>
          </div>

          {!isAdmin && (
            <button
              onClick={() => {
                setEditingAppointment(null);
                setIsModalOpen(true);
              }}
              className="flex items-center gap-2 px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold shadow-sm transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Schedule Appointment</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter Row */}
      <div className="flex flex-wrap items-center gap-3">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500/20 shadow-sm"
        >
          <option value="">All Statuses</option>
          <option value="PENDING">Pending</option>
          <option value="CONFIRMED">Confirmed</option>
          <option value="CHECKED_IN">Checked In</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="COMPLETED">Completed</option>
          <option value="CANCELLED">Cancelled</option>
        </select>

        <input
          type="date"
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
          className="px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500/20 shadow-sm"
        />

        {dateFilter && (
          <button
            onClick={() => setDateFilter('')}
            className="text-xs text-rose-600 hover:underline font-semibold"
          >
            Clear Date
          </button>
        )}
      </div>

      {/* View Mode: List Table vs Day Schedule Grid */}
      {viewMode === 'list' ? (
        <DataTable
          columns={columns}
          data={appointments}
          loading={loading}
          searchPlaceholder="Search by appointment ID, pet, client, or service..."
        />
      ) : (
        /* Calendar / Schedule Cards Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {appointments.map((apt) => (
            <div
              key={apt.id}
              className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-slate-500">{apt.appointment_id}</span>
                {statusBadge(apt.status)}
              </div>

              <div>
                <h4 className="text-base font-bold text-slate-900">{apt.service_name}</h4>
                <p className="text-xs text-slate-600 mt-0.5">
                  Pet: <strong className="text-slate-900">{apt.pet_name}</strong> ({apt.customer_name})
                </p>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl space-y-1 text-xs text-slate-600">
                <p className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-brand-600" />
                  <span>Date: <strong>{apt.date}</strong></span>
                </p>
                <p className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-brand-600" />
                  <span>Time: <strong>{apt.start_time} - {apt.end_time}</strong></span>
                </p>
                {apt.staff_name && (
                  <p className="text-[11px] text-slate-500 pt-1">Specialist: {apt.staff_name}</p>
                )}
              </div>

              <div className="pt-2 flex items-center justify-between">
                <span className="text-sm font-black text-brand-700">${parseFloat(apt.amount).toFixed(2)}</span>
                {isAdmin ? (
                  <button
                    onClick={() => setViewingAppointment(apt)}
                    className="flex items-center gap-1 px-3 py-1 bg-brand-50 hover:bg-brand-100 text-brand-700 rounded-lg text-xs font-bold transition-colors shadow-xs"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>View</span>
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      setEditingAppointment(apt);
                      setIsModalOpen(true);
                    }}
                    className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-bold transition-colors"
                  >
                    Manage
                  </button>
                )}
              </div>
            </div>
          ))}
          {appointments.length === 0 && (
            <div className="col-span-full py-12 text-center text-slate-400">
              No appointments scheduled for selected filters.
            </div>
          )}
        </div>
      )}

      {/* View Appointment Details Modal */}
      {viewingAppointment && (
        <Modal
          isOpen={!!viewingAppointment}
          onClose={() => setViewingAppointment(null)}
          title={`Appointment Details: ${viewingAppointment.appointment_id || ''}`}
          subtitle="Complete appointment scheduling & visit information"
          maxWidth="max-w-xl"
        >
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Status</p>
                <div className="mt-1">{statusBadge(viewingAppointment.status)}</div>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Service Fee</p>
                <p className="text-sm font-black text-slate-900 mt-1">${parseFloat(viewingAppointment.amount || 0).toFixed(2)}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3.5 bg-white rounded-xl border border-slate-200 space-y-1">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Pet Patient</p>
                <p className="font-bold text-slate-900 text-sm">{viewingAppointment.pet_name}</p>
                <p className="text-slate-500">{viewingAppointment.pet_species || 'Pet'}</p>
              </div>

              <div className="p-3.5 bg-white rounded-xl border border-slate-200 space-y-1">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Pet Parent / Owner</p>
                <p className="font-bold text-slate-900 text-sm">{viewingAppointment.customer_name}</p>
                <p className="text-slate-500">{viewingAppointment.customer_phone || viewingAppointment.customer_email || '—'}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3.5 bg-white rounded-xl border border-slate-200 space-y-1">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Service Scheduled</p>
                <p className="font-bold text-slate-900">{viewingAppointment.service_name}</p>
                <p className="text-slate-500">Duration: {viewingAppointment.service_duration || 30} mins</p>
              </div>

              <div className="p-3.5 bg-white rounded-xl border border-slate-200 space-y-1">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Date & Time</p>
                <p className="font-bold text-slate-900">{viewingAppointment.date}</p>
                <p className="text-slate-500">{viewingAppointment.start_time} - {viewingAppointment.end_time}</p>
              </div>
            </div>

            <div className="p-3.5 bg-white rounded-xl border border-slate-200 space-y-1">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Assigned Specialist</p>
              <p className="font-medium text-slate-800">{viewingAppointment.staff_name || 'General Clinic Staff'}</p>
            </div>

            {viewingAppointment.notes && (
              <div className="p-3.5 bg-amber-50/60 rounded-xl border border-amber-200 space-y-1">
                <p className="text-[10px] font-bold text-amber-800 uppercase tracking-wider">Special Instructions / Notes</p>
                <p className="text-slate-700">{viewingAppointment.notes}</p>
              </div>
            )}

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setViewingAppointment(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Appointment Modal */}
      {isModalOpen && (
        <AppointmentModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          appointment={editingAppointment}
          onSaved={fetchAppointments}
        />
      )}
    </div>
  );
};

export default AppointmentList;
