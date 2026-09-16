import React, { useState, useEffect } from 'react';
import { boardingService } from '../../services/boardingService';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../hooks/useAuth';
import DataTable from '../../components/DataTable';
import BoardingModal from './BoardingModal';
import ChecklistModal from '../../components/ChecklistModal';
import Modal from '../../components/Modal';
import {
  Home,
  Plus,
  LogIn,
  LogOut,
  ClipboardList,
  Edit2,
  Trash2,
  Calendar,
  Activity,
  User,
  ShieldCheck,
  CheckCircle2,
  Sparkles
} from 'lucide-react';

export const BoardingList = () => {
  const { isStaff, isAdmin } = useAuth();
  const { addToast } = useToast();
  const [bookings, setBookings] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');

  // Modals
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [editingBooking, setEditingBooking] = useState(null);

  // Digital Checklist modal
  const [checklistTarget, setChecklistTarget] = useState(null);
  const [checklistMode, setChecklistMode] = useState('checkin');
  const [isChecklistModalOpen, setIsChecklistModalOpen] = useState(false);

  // Daily Care Log modal
  const [careLogTarget, setCareLogTarget] = useState(null);
  const [careLogs, setCareLogs] = useState([]);
  const [isCareLogModalOpen, setIsCareLogModalOpen] = useState(false);
  const [careType, setCareType] = useState('FEEDING');
  const [careNotes, setCareNotes] = useState('');
  const [loggingCare, setLoggingCare] = useState(false);

  const fetchBoardingData = async () => {
    setLoading(true);
    try {
      const [bookingsData, roomsData] = await Promise.all([
        boardingService.getBookings({ status: statusFilter || undefined }),
        boardingService.getRooms(),
      ]);
      setBookings(Array.isArray(bookingsData) ? bookingsData : bookingsData.results || []);
      setRooms(Array.isArray(roomsData) ? roomsData : roomsData.results || []);
    } catch (err) {
      console.error(err);
      addToast('Failed to load boarding data', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBoardingData();
  }, [statusFilter]);

  const openChecklist = (booking, mode) => {
    setChecklistTarget(booking);
    setChecklistMode(mode);
    setIsChecklistModalOpen(true);
  };

  const openCareLogs = async (booking) => {
    setCareLogTarget(booking);
    setIsCareLogModalOpen(true);
    try {
      const logs = await boardingService.getCareLogs(booking.id);
      setCareLogs(Array.isArray(logs) ? logs : logs.results || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddCareLog = async (e) => {
    e.preventDefault();
    if (!careNotes.trim() || !careLogTarget) return;
    setLoggingCare(true);
    try {
      await boardingService.addCareLog(careLogTarget.id, {
        care_type: careType,
        notes: careNotes,
      });
      addToast('Daily care log recorded!', 'success');
      setCareNotes('');
      // Refresh logs
      const logs = await boardingService.getCareLogs(careLogTarget.id);
      setCareLogs(Array.isArray(logs) ? logs : logs.results || []);
    } catch (err) {
      addToast('Failed to save care log', 'error');
    } finally {
      setLoggingCare(false);
    }
  };

  const handleDeleteBooking = async (id, bookingId) => {
    if (window.confirm(`Delete boarding reservation ${bookingId}?`)) {
      try {
        await boardingService.deleteBooking(id);
        addToast('Reservation deleted', 'info');
        fetchBoardingData();
      } catch (err) {
        addToast('Failed to delete booking', 'error');
      }
    }
  };

  const statusBadge = (status) => {
    const styles = {
      RESERVED: 'bg-amber-100 text-amber-800 border-amber-200',
      CHECKED_IN: 'bg-indigo-100 text-indigo-800 border-indigo-200',
      CHECKED_OUT: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      CANCELLED: 'bg-rose-100 text-rose-800 border-rose-200',
    };
    return (
      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${styles[status] || styles.RESERVED}`}>
        {status.replace('_', ' ')}
      </span>
    );
  };

  const columns = [
    {
      header: 'Booking ID & Room',
      render: (row) => (
        <div>
          <span className="font-mono text-xs font-bold text-slate-900">{row.booking_id}</span>
          <p className="text-xs font-bold text-brand-700 mt-0.5">
            {row.room_number ? `Room ${row.room_number}` : 'Room Pending'}
          </p>
          <span className="text-[10px] text-slate-400 uppercase tracking-wider">{row.package}</span>
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
        </div>
      ),
    },
    {
      header: 'Stay Dates',
      render: (row) => (
        <div className="text-xs">
          <p className="text-slate-800 font-semibold">In: {row.check_in_date}</p>
          <p className="text-slate-500">Out: {row.expected_check_out_date}</p>
        </div>
      ),
    },
    {
      header: 'Status',
      render: (row) => statusBadge(row.status),
    },
    {
      header: 'Cost & Payment',
      render: (row) => (
        <div className="text-xs">
          <span className="font-black text-slate-900">${parseFloat(row.total_cost).toFixed(2)}</span>
          <span className={`block text-[10px] font-bold uppercase mt-0.5 ${
            row.payment_status === 'PAID' ? 'text-emerald-600' : 'text-amber-600'
          }`}>
            {row.payment_status}
          </span>
        </div>
      ),
    },
    {
      header: 'Digital Protocols & Actions',
      className: 'text-right',
      render: (row) => (
        <div className="flex items-center justify-end gap-1.5 flex-wrap">
          {/* Digital Check-In Button */}
          {row.status === 'RESERVED' && isStaff && (
            <button
              onClick={() => openChecklist(row, 'checkin')}
              className="flex items-center gap-1 px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-sm transition-colors"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Digital Check-In</span>
            </button>
          )}

          {/* Digital Check-Out Button */}
          {row.status === 'CHECKED_IN' && isStaff && (
            <button
              onClick={() => openChecklist(row, 'checkout')}
              className="flex items-center gap-1 px-2.5 py-1 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-xs font-bold shadow-sm transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Digital Check-Out</span>
            </button>
          )}

          {/* Daily Care Logs */}
          <button
            onClick={() => openCareLogs(row)}
            title="Daily Care Logs"
            className="p-1.5 text-slate-600 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors"
          >
            <Activity className="w-4 h-4" />
          </button>

          <button
            onClick={() => {
              setEditingBooking(row);
              setIsBookingModalOpen(true);
            }}
            title="Edit Stay"
            className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <Edit2 className="w-4 h-4" />
          </button>

          {isAdmin && (
            <button
              onClick={() => handleDeleteBooking(row.id, row.booking_id)}
              title="Delete Stay"
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Home className="w-6 h-6 text-brand-600" />
            <span>Pet Boarding & Kennels</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage kennels, room availability, digital check-in protocols, and daily care logs
          </p>
        </div>

        <button
          onClick={() => {
            setEditingBooking(null);
            setIsBookingModalOpen(true);
          }}
          className="flex items-center gap-2 px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold shadow-sm transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>New Boarding Stay</span>
        </button>
      </div>

      {/* Kennel / Room Status Overview Board */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Kennel & Suite Occupancy Board</h3>
            <p className="text-[11px] text-slate-400">Live physical room statuses and current guests</p>
          </div>
          <div className="flex items-center gap-3 text-[11px] font-semibold text-slate-500">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Available
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" /> Occupied
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Cleaning / Maint.
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          {rooms.map((room) => {
            const isOccupied = room.status === 'OCCUPIED';
            const isMaintenance = room.status === 'MAINTENANCE';
            return (
              <div
                key={room.id}
                className={`p-3 rounded-xl border text-center transition-all ${
                  isOccupied
                    ? 'bg-indigo-50/70 border-indigo-200 text-indigo-900'
                    : isMaintenance
                    ? 'bg-amber-50/70 border-amber-200 text-amber-900'
                    : 'bg-emerald-50/60 border-emerald-200 text-emerald-900'
                }`}
              >
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  {room.room_type}
                </div>
                <div className="text-lg font-black mt-0.5">{room.room_number}</div>
                <span
                  className={`inline-block mt-1 text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                    isOccupied
                      ? 'bg-indigo-200/60 text-indigo-800'
                      : isMaintenance
                      ? 'bg-amber-200/60 text-amber-800'
                      : 'bg-emerald-200/60 text-emerald-800'
                  }`}
                >
                  {room.status}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Boarding Stays Table */}
      <DataTable
        columns={columns}
        data={bookings}
        loading={loading}
        searchPlaceholder="Search by booking ID, room, pet, or client..."
        filterComponent={
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500/20 shadow-sm"
          >
            <option value="">All Statuses</option>
            <option value="RESERVED">Reserved</option>
            <option value="CHECKED_IN">Checked In</option>
            <option value="CHECKED_OUT">Checked Out</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        }
      />

      {/* Boarding Add/Edit Modal */}
      {isBookingModalOpen && (
        <BoardingModal
          isOpen={isBookingModalOpen}
          onClose={() => setIsBookingModalOpen(false)}
          booking={editingBooking}
          onSaved={fetchBoardingData}
        />
      )}

      {/* Digital Check-In / Check-Out Checklist Modal */}
      {isChecklistModalOpen && checklistTarget && (
        <ChecklistModal
          isOpen={isChecklistModalOpen}
          onClose={() => setIsChecklistModalOpen(false)}
          booking={checklistTarget}
          mode={checklistMode}
          onUpdated={fetchBoardingData}
        />
      )}

      {/* Daily Care Log Modal */}
      {isCareLogModalOpen && careLogTarget && (
        <Modal
          isOpen={isCareLogModalOpen}
          onClose={() => setIsCareLogModalOpen(false)}
          title={`Daily Care Logs: ${careLogTarget.pet_name}`}
          subtitle={`Booking: ${careLogTarget.booking_id} • Room: ${careLogTarget.room_number || 'Standard'}`}
          maxWidth="max-w-xl"
        >
          <div className="space-y-5">
            {/* New Care Log Form */}
            {isStaff && (
              <form onSubmit={handleAddCareLog} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <p className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Log New Care Activity
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      Activity Type
                    </label>
                    <select
                      value={careType}
                      onChange={(e) => setCareType(e.target.value)}
                      className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium focus:ring-2 focus:ring-brand-500/20"
                    >
                      <option value="FEEDING">Feeding</option>
                      <option value="MEDICATION">Medication Administered</option>
                      <option value="EXERCISE">Exercise / Playtime</option>
                      <option value="GROOMING">Grooming / Brushing</option>
                      <option value="POTTY">Potty Break</option>
                      <option value="HEALTH_CHECK">Health Check</option>
                      <option value="BEHAVIOR">Behavior Observation</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      Notes & Observations
                    </label>
                    <input
                      type="text"
                      required
                      value={careNotes}
                      onChange={(e) => setCareNotes(e.target.value)}
                      placeholder="e.g. Ate all kibble, brisk walk in yard"
                      className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-brand-500/20"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loggingCare}
                  className="w-full py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-xs font-bold shadow-sm transition-colors disabled:opacity-50"
                >
                  {loggingCare ? 'Logging...' : 'Record Activity'}
                </button>
              </form>
            )}

            {/* Existing Logs List */}
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {careLogs.map((log) => (
                <div key={log.id} className="p-3 bg-white border border-slate-200 rounded-xl text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-brand-700 uppercase text-[10px] tracking-wider">
                      {log.care_type}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {new Date(log.logged_at).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-slate-700">{log.notes}</p>
                  {log.staff_name && (
                    <p className="text-[10px] text-slate-400">Logged by: {log.staff_name}</p>
                  )}
                </div>
              ))}
              {careLogs.length === 0 && (
                <p className="text-xs text-slate-400 text-center py-4">No care logs recorded for this stay yet.</p>
              )}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default BoardingList;
