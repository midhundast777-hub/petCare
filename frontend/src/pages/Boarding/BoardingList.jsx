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
  Sparkles,
  Eye
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
  const [viewingBooking, setViewingBooking] = useState(null);

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

  const handleQuickStatusChange = async (booking, newStatus) => {
    try {
      await boardingService.updateBooking(booking.id, { status: newStatus });
      const label =
        newStatus === 'CHECKED_IN'
          ? 'Checked In (Active Stay)'
          : newStatus === 'CHECKED_OUT'
          ? 'Checked Out (Completed)'
          : 'Reserved (Awaiting Arrival)';
      addToast(`Stay ${booking.booking_id} updated to ${label}!`, 'success');
      fetchBoardingData();
    } catch (err) {
      console.error(err);
      addToast('Failed to update stay status', 'error');
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
      addToast('Daily care log recorded successfully!', 'success');
      setCareNotes('');
      // Refresh logs
      const logs = await boardingService.getCareLogs(careLogTarget.id);
      setCareLogs(Array.isArray(logs) ? logs : logs.results || []);
    } catch (err) {
      console.error(err);
      const msg = err.response?.data?.notes?.[0] || err.response?.data?.error || 'Failed to save care log';
      addToast(msg, 'error');
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
    if (status === 'RESERVED') {
      return (
        <div>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-100 text-amber-800 border border-amber-200 shadow-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
            Reserved
          </span>
          <span className="block text-[10px] text-amber-700/80 font-bold mt-1">
            Awaiting Check-in
          </span>
        </div>
      );
    }
    if (status === 'CHECKED_IN') {
      return (
        <div>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-indigo-100 text-indigo-800 border border-indigo-200 shadow-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
            Checked In
          </span>
          <span className="block text-[10px] text-indigo-700 font-bold mt-1">
            Active Guest
          </span>
        </div>
      );
    }
    if (status === 'CHECKED_OUT') {
      return (
        <div>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-200 shadow-xs">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            Checked Out
          </span>
          <span className="block text-[10px] text-emerald-700 font-bold mt-1">
            Stay Completed (Saved)
          </span>
        </div>
      );
    }
    return (
      <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-100 text-rose-800 border border-rose-200">
        Cancelled
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
          {/* View Stay Details */}
          <button
            onClick={() => setViewingBooking(row)}
            title="View Stay Details"
            className="flex items-center gap-1.5 px-2.5 py-1 bg-brand-50 hover:bg-brand-100 text-brand-700 rounded-lg text-xs font-bold transition-colors shadow-xs cursor-pointer"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>View</span>
          </button>

          {/* Daily Care Logs */}
          <button
            onClick={() => openCareLogs(row)}
            title="View Daily Care Logs"
            className="flex items-center gap-1 px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
          >
            <Activity className="w-3.5 h-3.5 text-brand-600" />
            <span>Care Logs</span>
          </button>

          {/* For RESERVED: Check-In Option */}
          {row.status === 'RESERVED' && !isAdmin && isStaff && (
            <div className="flex items-center gap-1">
              <button
                onClick={() => handleQuickStatusChange(row, 'CHECKED_IN')}
                title="Direct Check-In for this pet upon arrival"
                className="flex items-center gap-1 px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-sm transition-colors cursor-pointer"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Check In</span>
              </button>
              <button
                onClick={() => openChecklist(row, 'checkin')}
                title="Intake Verification Protocol Checklist"
                className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-lg text-[11px] font-bold transition-colors cursor-pointer"
              >
                Checklist
              </button>
            </div>
          )}

          {/* For CHECKED_IN: Check-Out Option */}
          {row.status === 'CHECKED_IN' && !isAdmin && isStaff && (
            <div className="flex items-center gap-1">
              <button
                onClick={() => handleQuickStatusChange(row, 'CHECKED_OUT')}
                title="Direct Check-Out (complete stay)"
                className="flex items-center gap-1 px-2.5 py-1 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-xs font-bold shadow-sm transition-colors cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Check Out</span>
              </button>
              <button
                onClick={() => openChecklist(row, 'checkout')}
                title="Departure Verification Protocol Checklist"
                className="px-2 py-1 bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-200 rounded-lg text-[11px] font-bold transition-colors cursor-pointer"
              >
                Checklist
              </button>
            </div>
          )}

          {/* For CHECKED_OUT: Option to Check In (re-check in / re-open stay) */}
          {row.status === 'CHECKED_OUT' && !isAdmin && isStaff && (
            <button
              onClick={() => handleQuickStatusChange(row, 'CHECKED_IN')}
              title="Re-check in this pet (stay remains permanently saved in records)"
              className="flex items-center gap-1 px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-300 rounded-lg text-xs font-bold shadow-xs transition-colors cursor-pointer"
            >
              <LogIn className="w-3.5 h-3.5 text-emerald-600" />
              <span>Check In</span>
            </button>
          )}

          {!isAdmin && (
            <button
              onClick={() => {
                setEditingBooking(row);
                setIsBookingModalOpen(true);
              }}
              title="Edit Stay"
              className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            >
              <Edit2 className="w-4 h-4" />
            </button>
          )}

          {!isAdmin && (
            <button
              onClick={() => handleDeleteBooking(row.id, row.booking_id)}
              title="Cancel / Delete Stay"
              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
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

        {!isAdmin && (
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
        )}
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

      {/* Boarding Stay Status Workflow & Legend */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-brand-600 animate-pulse" />
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-900">
              Boarding Stay Lifecycle & Status Definitions
            </h3>
          </div>
          <span className="text-[11px] text-slate-400 font-medium">
            Checked-out stays remain permanently preserved in records and are never removed
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
          {/* Reserved Explainer */}
          <div className="p-3 bg-amber-50/70 border border-amber-200/70 rounded-xl space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-amber-100 text-amber-900 border border-amber-300">
                Reserved
              </span>
              <span className="text-[10px] font-extrabold text-amber-700">Step 1: Booking Confirmed</span>
            </div>
            <p className="text-xs text-slate-700 leading-relaxed font-medium">
              <strong className="text-slate-900">What it means:</strong> The stay was booked by the pet owner and confirmed on schedule, but the pet has <span className="underline font-bold">not yet arrived</span> at the facility.
            </p>
            <div className="text-[11px] font-bold text-amber-800 bg-amber-100/60 px-2 py-1 rounded-lg">
              👉 Action: When the pet physically arrives, click <span className="text-emerald-700 font-black">"Check In"</span> to activate the stay.
            </div>
          </div>

          {/* Checked In Explainer */}
          <div className="p-3 bg-indigo-50/70 border border-indigo-200/70 rounded-xl space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-indigo-100 text-indigo-900 border border-indigo-300">
                Checked In
              </span>
              <span className="text-[10px] font-extrabold text-indigo-700">Step 2: Active Guest</span>
            </div>
            <p className="text-xs text-slate-700 leading-relaxed font-medium">
              <strong className="text-slate-900">What it means:</strong> The pet has physically arrived and is currently residing in their assigned suite. Staff logs daily feedings, walks, medications, and care logs during this stay.
            </p>
            <div className="text-[11px] font-bold text-indigo-800 bg-indigo-100/60 px-2 py-1 rounded-lg">
              👉 Action: When stay completes and owner picks up pet, click <span className="text-sky-700 font-black">"Check Out"</span>.
            </div>
          </div>

          {/* Checked Out Explainer */}
          <div className="p-3 bg-emerald-50/70 border border-emerald-200/70 rounded-xl space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-100 text-emerald-900 border border-emerald-300">
                Checked Out
              </span>
              <span className="text-[10px] font-extrabold text-emerald-700">Step 3: Completed Stay</span>
            </div>
            <p className="text-xs text-slate-700 leading-relaxed font-medium">
              <strong className="text-slate-900">What it means:</strong> The stay has concluded and the pet has departed. The stay record is <span className="font-bold text-emerald-800">permanently kept</span> in history and never deleted.
            </p>
            <div className="text-[11px] font-bold text-emerald-800 bg-emerald-100/60 px-2 py-1 rounded-lg">
              👉 Action: Stays remain visible. If pet returns or stay is re-opened, click <span className="text-emerald-700 font-black">"Check In"</span>.
            </div>
          </div>
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
            {!isAdmin && isStaff && (
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

      {/* View Stay Details Modal */}
      {viewingBooking && (
        <Modal
          isOpen={!!viewingBooking}
          onClose={() => setViewingBooking(null)}
          title={`Boarding Stay: ${viewingBooking.booking_id || ''}`}
          subtitle="Complete kennel reservation & boarding profile"
          maxWidth="max-w-xl"
        >
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Status</p>
                <div className="mt-1">{statusBadge(viewingBooking.status)}</div>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Kennel / Room</p>
                <p className="text-sm font-black text-brand-700 mt-1">
                  {viewingBooking.room_number ? `Room ${viewingBooking.room_number}` : 'Standard Suite'}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Amount</p>
                <p className="text-sm font-black text-slate-900 mt-1">
                  ${parseFloat(viewingBooking.total_cost || 0).toFixed(2)}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3.5 bg-white rounded-xl border border-slate-200 space-y-1">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Pet Guest</p>
                <p className="font-bold text-slate-900 text-sm">{viewingBooking.pet_name}</p>
                <p className="text-slate-500">{viewingBooking.pet_species || 'Dog'} • {viewingBooking.package || 'Standard Package'}</p>
              </div>

              <div className="p-3.5 bg-white rounded-xl border border-slate-200 space-y-1">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Pet Parent / Owner</p>
                <p className="font-bold text-slate-900 text-sm">{viewingBooking.customer_name}</p>
                <p className="text-slate-500">Emergency: {viewingBooking.emergency_contact_phone || 'On file'}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3.5 bg-white rounded-xl border border-slate-200 space-y-1">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Check-In Date</p>
                <p className="font-bold text-slate-900">{viewingBooking.check_in_date}</p>
                <p className="text-[11px] text-slate-400">{viewingBooking.actual_check_in_time ? `Checked in: ${viewingBooking.actual_check_in_time}` : 'Pending Check-In'}</p>
              </div>

              <div className="p-3.5 bg-white rounded-xl border border-slate-200 space-y-1">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Expected Check-Out</p>
                <p className="font-bold text-slate-900">{viewingBooking.expected_check_out_date}</p>
                <p className="text-[11px] text-slate-400">{viewingBooking.actual_check_out_time ? `Checked out: ${viewingBooking.actual_check_out_time}` : 'Active Stay'}</p>
              </div>
            </div>

            {viewingBooking.special_instructions && (
              <div className="p-3.5 bg-amber-50/60 rounded-xl border border-amber-200 space-y-1">
                <p className="text-[10px] font-bold text-amber-800 uppercase tracking-wider">Dietary, Medication & Special Instructions</p>
                <p className="text-slate-700">{viewingBooking.special_instructions}</p>
              </div>
            )}

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => {
                  const target = viewingBooking;
                  setViewingBooking(null);
                  openCareLogs(target);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-brand-50 text-slate-700 hover:text-brand-700 font-bold rounded-xl transition-colors"
              >
                <Activity className="w-4 h-4 text-brand-600" />
                <span>Open Care Logs</span>
              </button>

              <button
                type="button"
                onClick={() => setViewingBooking(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default BoardingList;
