import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../hooks/useAuth';
import { reportService } from '../services/reportService';
import { boardingService } from '../services/boardingService';
import { authService } from '../services/authService';
import { useToast } from '../context/ToastContext';
import StatCard from '../components/StatCard';
import LoadingSpinner from '../components/LoadingSpinner';
import Modal from '../components/Modal';
import {
  Users,
  Dog,
  Calendar,
  Home,
  Receipt,
  DollarSign,
  TrendingUp,
  PlusCircle,
  LogIn,
  Sparkles,
  Camera,
  UploadCloud,
  CheckCircle2,
  Clock,
  Eye,
  Maximize2,
  Heart,
  Phone,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

export const Dashboard = () => {
  const { user, isAdmin, isStaff, isCustomer } = useAuth();
  const { addToast } = useToast();
  const [summary, setSummary] = useState(null);
  const [charts, setCharts] = useState(null);
  const [boardingStays, setBoardingStays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploadingBookingId, setUploadingBookingId] = useState(null);
  const [boardingFilter, setBoardingFilter] = useState('ALL'); // 'ALL' | 'CHECKED_IN' | 'RESERVED'
  const [selectedPhotoModal, setSelectedPhotoModal] = useState(null);

  const fileInputRefs = useRef({});

  const fetchDashboardData = async () => {
    try {
      const [sumRes, chartRes, boardingRes] = await Promise.all([
        reportService.getSummary().catch((e) => {
          console.error(e);
          return null;
        }),
        reportService.getCharts().catch((e) => {
          console.error(e);
          return null;
        }),
        boardingService.getBookings().catch((e) => {
          console.error(e);
          return [];
        }),
      ]);
      setSummary(sumRes);
      setCharts(chartRes);

      const allBookings = Array.isArray(boardingRes) ? boardingRes : boardingRes?.results || [];
      // If customer, show customer stays (active ones first)
      // If staff/admin, filter active stays (CHECKED_IN and RESERVED)
      if (isCustomer || sumRes?.is_customer) {
        setBoardingStays(allBookings);
      } else {
        const activeStays = allBookings.filter(
          (b) => b.status === 'CHECKED_IN' || b.status === 'RESERVED'
        );
        setBoardingStays(activeStays);
      }
    } catch (err) {
      console.error('Failed to load dashboard data', err);
      addToast('Error loading dashboard data', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [isCustomer]);

  // Direct Photo Upload Handler
  const handlePhotoUpload = async (booking, file) => {
    if (!file) return;

    // Validate type and size (<= 10MB)
    if (!file.type.startsWith('image/')) {
      addToast('Please choose an image file (JPG, PNG, WEBP, GIF).', 'error');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      addToast('Image size exceeds 10MB limit.', 'error');
      return;
    }

    setUploadingBookingId(booking.id);
    try {
      let photoUrl = '';
      try {
        const uploadRes = await authService.uploadImage(file);
        photoUrl = uploadRes.url || uploadRes.avatar_url || uploadRes.file_url;
      } catch (uploadErr) {
        console.warn('API image upload failed, falling back to FileReader base64:', uploadErr);
        // Fallback to reading file as base64 string
        photoUrl = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
      }

      if (!photoUrl) {
        throw new Error('Could not process photo URL');
      }

      const nowIso = new Date().toISOString();
      await boardingService.updateBooking(booking.id, {
        stay_photo: photoUrl,
        stay_photo_updated_at: nowIso,
      });

      // Update local state immediately
      setBoardingStays((prev) =>
        prev.map((b) =>
          b.id === booking.id
            ? { ...b, stay_photo: photoUrl, stay_photo_updated_at: nowIso }
            : b
        )
      );

      addToast(
        `📸 Stay photo for ${booking.pet_name || 'pet'} updated! Visible to the pet owner.`,
        'success'
      );
    } catch (err) {
      console.error('Failed to upload stay photo:', err);
      addToast('Failed to upload stay photo. Please try again.', 'error');
    } finally {
      setUploadingBookingId(null);
    }
  };

  if (loading) return <LoadingSpinner size="lg" text="Loading sanctuary dashboard..." />;

  // ==========================================
  // CUSTOMER DASHBOARD VIEW
  // ==========================================
  if (isCustomer || summary?.is_customer) {
    const activeCustomerStays = boardingStays.filter(
      (b) => b.status === 'CHECKED_IN' || b.status === 'RESERVED'
    );

    return (
      <div className="space-y-6">
        {/* Welcome Banner */}
        <div className="bg-gradient-to-r from-brand-700 via-brand-600 to-teal-500 rounded-3xl p-6 sm:p-8 text-white shadow-lg relative overflow-hidden">
          <div className="relative z-10 max-w-xl">
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-white/20 uppercase tracking-widest text-brand-100 border border-white/20">
              Customer Sanctuary Portal
            </span>
            <h1 className="text-2xl sm:text-3xl font-black mt-3">
              Welcome back, {user?.first_name || 'Pet Parent'}! 🐾
            </h1>
            <p className="text-brand-100 text-sm mt-1">
              Track your pet's wellness schedule, upcoming boarding reservations, and live stay photo updates from staff.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link
                to="/appointments"
                className="px-4 py-2 bg-white text-brand-800 rounded-xl font-bold text-xs shadow hover:bg-brand-50 transition-colors"
              >
                Book Appointment
              </Link>
              <Link
                to="/boarding"
                className="px-4 py-2 bg-brand-800/40 text-white rounded-xl font-bold text-xs border border-white/30 hover:bg-brand-800/60 transition-colors"
              >
                Book Boarding Stay
              </Link>
              <Link
                to="/pets"
                className="px-4 py-2 bg-brand-800/40 text-white rounded-xl font-bold text-xs border border-white/30 hover:bg-brand-800/60 transition-colors"
              >
                View My Pets
              </Link>
            </div>
          </div>
        </div>

        {/* CUSTOMER: LIVE BOARDING STAY PHOTO UPDATES */}
        {activeCustomerStays.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                  <Camera className="w-5 h-5 text-brand-600" />
                  <span>Live Boarding Stay Updates & Daily Photos</span>
                </h2>
                <p className="text-xs text-slate-500">
                  Real-time photo updates and kennel suite status directly from our boarding care team
                </p>
              </div>
              <Link
                to="/boarding"
                className="text-xs font-bold text-brand-600 hover:text-brand-700 flex items-center gap-1"
              >
                <span>View All Stays</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {activeCustomerStays.map((stay) => {
                const hasPhoto = Boolean(stay.stay_photo);
                return (
                  <div
                    key={stay.id}
                    className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden flex flex-col transition-all hover:shadow-md"
                  >
                    {/* Stay Card Header */}
                    <div className="p-4 bg-slate-50/70 border-b border-slate-100 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-brand-100 text-brand-700 flex items-center justify-center font-black text-sm">
                          {stay.pet_name?.charAt(0) || '🐾'}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-extrabold text-slate-900 text-base">{stay.pet_name}</h3>
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                                stay.status === 'CHECKED_IN'
                                  ? 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                                  : 'bg-amber-100 text-amber-800 border border-amber-200'
                              }`}
                            >
                              {stay.status === 'CHECKED_IN' ? '● In Residence' : 'Upcoming Stay'}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500">
                            {stay.room_number ? `Suite ${stay.room_number}` : 'Standard Suite'} • {stay.package || 'Boarding'}
                          </p>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Duration</span>
                        <span className="text-xs font-bold text-slate-700">
                          {stay.check_in_date} → {stay.expected_check_out_date}
                        </span>
                      </div>
                    </div>

                    {/* Stay Photo Area */}
                    <div className="p-4 flex-1 flex flex-col justify-center">
                      {hasPhoto ? (
                        <div className="space-y-3">
                          <div
                            className="relative group rounded-xl overflow-hidden bg-slate-900 border border-slate-200 cursor-pointer shadow-xs aspect-video max-h-72"
                            onClick={() =>
                              setSelectedPhotoModal({
                                isOpen: true,
                                photoUrl: stay.stay_photo,
                                petName: stay.pet_name,
                                roomNumber: stay.room_number,
                                date: stay.stay_photo_updated_at,
                              })
                            }
                          >
                            <img
                              src={stay.stay_photo}
                              alt={`Stay photo of ${stay.pet_name}`}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-90 group-hover:opacity-100 transition-opacity flex items-end justify-between p-3.5 text-white">
                              <div className="flex items-center gap-2">
                                <span className="px-2 py-1 rounded-lg bg-emerald-500/90 backdrop-blur-xs text-[11px] font-black uppercase tracking-wider flex items-center gap-1 shadow-sm">
                                  <Sparkles className="w-3 h-3" />
                                  <span>Daily Photo Update</span>
                                </span>
                              </div>
                              <span className="p-1.5 rounded-lg bg-white/20 backdrop-blur-xs hover:bg-white/40 text-white transition-colors">
                                <Maximize2 className="w-4 h-4" />
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
                            <span className="flex items-center gap-1.5 text-emerald-700 font-semibold">
                              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                              <span>Uploaded by Boarding Care Staff</span>
                            </span>
                            {stay.stay_photo_updated_at && (
                              <span className="text-[11px] text-slate-400">
                                {new Date(stay.stay_photo_updated_at).toLocaleString([], {
                                  dateStyle: 'medium',
                                  timeStyle: 'short',
                                })}
                              </span>
                            )}
                          </div>

                          <div className="p-3 bg-emerald-50/70 border border-emerald-100 rounded-xl text-xs text-emerald-900 leading-relaxed font-medium">
                            🐾 <strong>Pet Wellness Note:</strong> {stay.pet_name} is having a comfortable and joyful stay with us in Suite {stay.room_number || '101'}. Our veterinary care team is ensuring routine feeding, playtime, and close supervision.
                          </div>
                        </div>
                      ) : (
                        <div className="p-6 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50/50 text-center space-y-2">
                          <div className="w-12 h-12 mx-auto rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                            <Camera className="w-6 h-6" />
                          </div>
                          <h4 className="text-xs font-bold text-slate-700">
                            Daily Stay Photo In Progress
                          </h4>
                          <p className="text-[11px] text-slate-500 max-w-xs mx-auto">
                            Our staff takes regular daily photos of {stay.pet_name} during playtime and kennel care. Check back soon for the next picture!
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Customer Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Registered Pets"
            value={summary?.total_pets || 0}
            icon={Dog}
            color="brand"
          />
          <StatCard
            title="Upcoming Bookings"
            value={summary?.upcoming_appointments || 0}
            icon={Calendar}
            color="blue"
          />
          <StatCard
            title="Active Boarding Stays"
            value={summary?.active_boardings || activeCustomerStays.length || 0}
            icon={Home}
            color="amber"
          />
          <StatCard
            title="Pending Invoices"
            value={`$${summary?.unpaid_balance || '0.00'}`}
            subtitle={`${summary?.pending_invoices || 0} unpaid invoices`}
            icon={Receipt}
            color="rose"
          />
        </div>

        {/* Full Image Preview Modal */}
        {selectedPhotoModal && (
          <Modal
            isOpen={selectedPhotoModal.isOpen}
            onClose={() => setSelectedPhotoModal(null)}
            title={`Stay Photo: ${selectedPhotoModal.petName}`}
            subtitle={
              selectedPhotoModal.roomNumber
                ? `Suite ${selectedPhotoModal.roomNumber}`
                : 'Sanctuary Boarding Stay'
            }
            maxWidth="max-w-3xl"
          >
            <div className="space-y-4">
              <div className="rounded-2xl overflow-hidden bg-slate-950 flex items-center justify-center max-h-[75vh]">
                <img
                  src={selectedPhotoModal.photoUrl}
                  alt={`Stay photo of ${selectedPhotoModal.petName}`}
                  className="max-h-[75vh] w-auto object-contain"
                />
              </div>
              <div className="flex items-center justify-between text-xs text-slate-500 px-1">
                <span>Boarding Pet Guest: <strong>{selectedPhotoModal.petName}</strong></span>
                {selectedPhotoModal.date && (
                  <span>
                    Uploaded on: {new Date(selectedPhotoModal.date).toLocaleString()}
                  </span>
                )}
              </div>
            </div>
          </Modal>
        )}
      </div>
    );
  }

  // ==========================================
  // SIMPLIFIED ADMIN & STAFF DASHBOARD VIEW
  // ==========================================
  const filteredBoardingStays = boardingStays.filter((b) => {
    if (boardingFilter === 'CHECKED_IN') return b.status === 'CHECKED_IN';
    if (boardingFilter === 'RESERVED') return b.status === 'RESERVED';
    return true; // 'ALL'
  });

  return (
    <div className="space-y-6">
      {/* Top Welcome & Clean Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <span>Welcome back, {user?.first_name || 'Admin'}</span>
            <Sparkles className="w-5 h-5 text-amber-500" />
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Overview of active boarding guests, daily stay photos, appointments & revenue
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <Link
            to="/appointments"
            className="flex items-center gap-1.5 px-3.5 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold shadow-sm transition-colors"
          >
            <PlusCircle className="w-4 h-4" />
            <span>New Appointment</span>
          </Link>
          <Link
            to="/boarding"
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold shadow-sm transition-colors"
          >
            <LogIn className="w-4 h-4" />
            <span>Boarding & Check-In</span>
          </Link>
          <Link
            to="/pets"
            className="flex items-center gap-1.5 px-3.5 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold shadow-xs transition-colors"
          >
            <Dog className="w-4 h-4 text-brand-600" />
            <span>Register Pet</span>
          </Link>
        </div>
      </div>

      {/* SIMPLIFIED 4-KPI BAR */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Active Boarding Guests"
          value={summary?.pets_currently_boarding || summary?.occupied_rooms || boardingStays.filter(s => s.status === 'CHECKED_IN').length}
          subtitle={`${summary?.occupied_rooms || 0} of ${summary?.total_rooms || 0} suites occupied (${summary?.occupancy_rate || 0}%)`}
          icon={Home}
          color="brand"
        />
        <StatCard
          title="Today's Appointments"
          value={summary?.today_appointments || 0}
          subtitle={`${summary?.upcoming_appointments || 0} upcoming scheduled`}
          icon={Calendar}
          color="blue"
        />
        <StatCard
          title="Total Pets & Clients"
          value={`${summary?.total_pets || 0} Pets`}
          subtitle={`${summary?.total_customers || 0} registered pet parents`}
          icon={Dog}
          color="amber"
        />
        <StatCard
          title="Monthly Revenue"
          value={`$${(summary?.monthly_revenue || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
          subtitle={`Today: $${(summary?.today_revenue || 0).toFixed(2)}`}
          icon={DollarSign}
          color="emerald"
        />
      </div>

      {/* ⭐ HERO SECTION: LIVE BOARDING GUESTS & STAY PHOTO UPLOADING */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Section Header with Filters */}
        <div className="p-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-50/60">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <Camera className="w-5 h-5 text-brand-600" />
                <span>Live Boarding Guests & Daily Stay Photos</span>
              </h2>
              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-brand-100 text-brand-800">
                {filteredBoardingStays.length} active
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Upload daily photos for each boarding pet. Uploaded photos are instantly visible to the pet parent on their customer dashboard!
            </p>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-2">
            <div className="inline-flex p-1 bg-slate-200/70 rounded-xl text-xs font-bold text-slate-600">
              <button
                type="button"
                onClick={() => setBoardingFilter('ALL')}
                className={`px-3 py-1 rounded-lg transition-colors ${
                  boardingFilter === 'ALL'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'hover:text-slate-900'
                }`}
              >
                All ({boardingStays.length})
              </button>
              <button
                type="button"
                onClick={() => setBoardingFilter('CHECKED_IN')}
                className={`px-3 py-1 rounded-lg transition-colors ${
                  boardingFilter === 'CHECKED_IN'
                    ? 'bg-white text-indigo-800 shadow-xs'
                    : 'hover:text-slate-900'
                }`}
              >
                Checked In ({boardingStays.filter((b) => b.status === 'CHECKED_IN').length})
              </button>
              <button
                type="button"
                onClick={() => setBoardingFilter('RESERVED')}
                className={`px-3 py-1 rounded-lg transition-colors ${
                  boardingFilter === 'RESERVED'
                    ? 'bg-white text-amber-800 shadow-xs'
                    : 'hover:text-slate-900'
                }`}
              >
                Reserved ({boardingStays.filter((b) => b.status === 'RESERVED').length})
              </button>
            </div>

            <Link
              to="/boarding"
              className="px-3 py-1.5 bg-brand-50 hover:bg-brand-100 text-brand-700 rounded-xl text-xs font-bold transition-colors"
            >
              Manage Stays →
            </Link>
          </div>
        </div>

        {/* Boarding Guests Photo Cards Grid */}
        <div className="p-5">
          {filteredBoardingStays.length === 0 ? (
            <div className="py-12 text-center space-y-3">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center">
                <Home className="w-7 h-7" />
              </div>
              <h3 className="text-sm font-bold text-slate-800">
                No boarding guests found for this filter
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                No pets are currently in this status. You can book a new stay or check in arriving guests from the boarding hub.
              </p>
              <Link
                to="/boarding"
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold shadow-sm transition-colors"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Book / Check-In Boarding Stay</span>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredBoardingStays.map((booking) => {
                const isUploading = uploadingBookingId === booking.id;
                const hasPhoto = Boolean(booking.stay_photo);

                return (
                  <div
                    key={booking.id}
                    className="border border-slate-200/90 rounded-2xl overflow-hidden bg-white shadow-xs hover:shadow-md transition-all flex flex-col justify-between relative"
                  >
                    {/* Pet & Stay Header */}
                    <div className="p-4 border-b border-slate-100 bg-slate-50/50">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-3">
                          <div className="w-11 h-11 rounded-xl bg-brand-100 text-brand-700 font-black text-sm flex items-center justify-center shrink-0">
                            {booking.pet_name?.charAt(0) || '🐾'}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="text-sm font-black text-slate-900">
                                {booking.pet_name}
                              </h3>
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                                  booking.status === 'CHECKED_IN'
                                    ? 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                                    : 'bg-amber-100 text-amber-800 border border-amber-200'
                                }`}
                              >
                                {booking.status === 'CHECKED_IN' ? 'In Suite' : 'Reserved'}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-500">
                              {booking.pet_breed || booking.pet_species || 'Pet Guest'} •{' '}
                              <strong className="text-brand-700">
                                {booking.room_number ? `Suite ${booking.room_number}` : 'Standard Suite'}
                              </strong>
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Client Info & Dates */}
                      <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
                        <div className="text-slate-600 truncate">
                          <span className="font-semibold text-slate-800">{booking.customer_name}</span>
                          {booking.customer_phone && (
                            <span className="text-slate-400 block text-[10px]">{booking.customer_phone}</span>
                          )}
                        </div>
                        <div className="text-right text-[11px] text-slate-500 font-medium">
                          <span>{booking.check_in_date}</span>
                          <span className="text-slate-300 mx-1">→</span>
                          <span>{booking.expected_check_out_date}</span>
                        </div>
                      </div>
                    </div>

                    {/* PHOTO UPLOAD & PREVIEW AREA */}
                    <div className="p-4 flex-1 flex flex-col justify-center">
                      {hasPhoto ? (
                        <div className="space-y-2.5">
                          {/* Image Thumbnail with Overlay */}
                          <div
                            className="relative group rounded-xl overflow-hidden bg-slate-950 aspect-video cursor-pointer border border-slate-200 shadow-xs"
                            onClick={() =>
                              setSelectedPhotoModal({
                                isOpen: true,
                                photoUrl: booking.stay_photo,
                                petName: booking.pet_name,
                                roomNumber: booking.room_number,
                                date: booking.stay_photo_updated_at,
                              })
                            }
                          >
                            <img
                              src={booking.stay_photo}
                              alt={`Stay photo of ${booking.pet_name}`}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                            {/* Overlay Badge */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-90 group-hover:opacity-100 transition-opacity flex items-end justify-between p-2.5 text-white">
                              <span className="px-2 py-0.5 rounded-md bg-emerald-500/90 text-[10px] font-black uppercase tracking-wider flex items-center gap-1 shadow-xs">
                                <Eye className="w-3 h-3" />
                                <span>Visible to Owner</span>
                              </span>
                              <span className="p-1 rounded-md bg-white/20 hover:bg-white/40 text-white transition-colors">
                                <Maximize2 className="w-3.5 h-3.5" />
                              </span>
                            </div>

                            {isUploading && (
                              <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center">
                                <LoadingSpinner size="sm" text="Uploading photo..." />
                              </div>
                            )}
                          </div>

                          {/* Timestamp & Change Button */}
                          <div className="flex items-center justify-between pt-1">
                            <span className="text-[10px] text-slate-400">
                              {booking.stay_photo_updated_at ? (
                                `Updated: ${new Date(booking.stay_photo_updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                              ) : (
                                'Photo uploaded'
                              )}
                            </span>

                            {/* Hidden File Input for Changing Photo */}
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              ref={(el) => (fileInputRefs.current[booking.id] = el)}
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) handlePhotoUpload(booking, file);
                                e.target.value = '';
                              }}
                            />

                            <button
                              type="button"
                              disabled={isUploading}
                              onClick={() => fileInputRefs.current[booking.id]?.click()}
                              className="px-2.5 py-1 bg-slate-100 hover:bg-brand-50 text-slate-700 hover:text-brand-700 rounded-lg text-xs font-bold transition-colors flex items-center gap-1"
                            >
                              <Camera className="w-3.5 h-3.5 text-brand-600" />
                              <span>{isUploading ? 'Uploading...' : 'Change Photo'}</span>
                            </button>
                          </div>
                        </div>
                      ) : (
                        /* Upload Prompt / Dropzone */
                        <div className="space-y-3">
                          {/* Hidden File Input */}
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            ref={(el) => (fileInputRefs.current[booking.id] = el)}
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handlePhotoUpload(booking, file);
                              e.target.value = '';
                            }}
                          />

                          <div
                            onClick={() => !isUploading && fileInputRefs.current[booking.id]?.click()}
                            className={`p-5 rounded-xl border-2 border-dashed transition-all text-center cursor-pointer ${
                              isUploading
                                ? 'border-brand-300 bg-brand-50/50'
                                : 'border-slate-200 hover:border-brand-400 bg-slate-50/70 hover:bg-brand-50/30'
                            }`}
                          >
                            {isUploading ? (
                              <LoadingSpinner size="sm" text="Uploading stay photo..." />
                            ) : (
                              <div className="space-y-1.5">
                                <div className="w-9 h-9 mx-auto rounded-full bg-brand-100 text-brand-700 flex items-center justify-center shadow-xs">
                                  <Camera className="w-4 h-4" />
                                </div>
                                <p className="text-xs font-bold text-slate-800">
                                  Upload Daily Stay Photo
                                </p>
                                <p className="text-[10px] text-slate-400 leading-tight max-w-[190px] mx-auto">
                                  Click to select a photo of {booking.pet_name}. It will be shared with the owner.
                                </p>
                              </div>
                            )}
                          </div>

                          <button
                            type="button"
                            disabled={isUploading}
                            onClick={() => fileInputRefs.current[booking.id]?.click()}
                            className="w-full py-1.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
                          >
                            <UploadCloud className="w-3.5 h-3.5" />
                            <span>{isUploading ? 'Uploading...' : 'Upload Photo for Owner'}</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* SIMPLIFIED LOWER SECTION (2 Balanced Columns) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Revenue Trend & Service Highlights */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Monthly Revenue Trend</h3>
              <p className="text-[11px] text-slate-400">Total collected revenue over the last 6 months</p>
            </div>
            <span className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <TrendingUp className="w-4 h-4" />
            </span>
          </div>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={charts?.monthly_revenue || []}>
                <defs>
                  <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0D9488" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#0D9488" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis
                  stroke="#94a3b8"
                  fontSize={11}
                  tickLine={false}
                  tickFormatter={(v) => `$${v}`}
                />
                <Tooltip
                  formatter={(value) => [`$${value.toFixed(2)}`, 'Revenue']}
                  contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#0D9488"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#revGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Top Services Mini Summary */}
          {(charts?.service_popularity || []).length > 0 && (
            <div className="pt-2 border-t border-slate-100">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                Top Requested Services
              </p>
              <div className="flex flex-wrap gap-2">
                {(charts?.service_popularity || []).slice(0, 3).map((srv, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 border border-slate-200/80 rounded-lg text-xs font-semibold text-slate-700"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-brand-500"></span>
                    {srv.name} ({srv.bookings} bookings)
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Recent CRM Activity */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Recent CRM Activity</h3>
                <p className="text-[11px] text-slate-400">Live feed of bookings, stays, and check-ins</p>
              </div>
              <Link
                to="/appointments"
                className="text-xs font-bold text-brand-600 hover:text-brand-700"
              >
                View Hub →
              </Link>
            </div>

            <div className="divide-y divide-slate-100">
              {(summary?.recent_activities || []).slice(0, 5).map((act) => (
                <div key={act.id} className="py-2.5 first:pt-0 last:pb-0 flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-xl bg-brand-50 text-brand-600 mt-0.5">
                      {act.type === 'APPOINTMENT' ? (
                        <Calendar className="w-3.5 h-3.5" />
                      ) : (
                        <Home className="w-3.5 h-3.5" />
                      )}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-800">{act.title}</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">{act.description}</p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-100 text-slate-700">
                      {act.status}
                    </span>
                    <p className="text-[10px] text-slate-400 mt-1">
                      {new Date(act.time).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
              {(!summary?.recent_activities || summary?.recent_activities.length === 0) && (
                <p className="text-xs text-slate-400 text-center py-6">No recent activity recorded.</p>
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Vaccinations alert: <strong>{summary?.vaccinations_expiring_soon || 0}</strong> soon</span>
            <span>Pending Invoices: <strong>{summary?.pending_invoices_count || 0}</strong></span>
          </div>
        </div>
      </div>

      {/* Full Resolution Photo Modal */}
      {selectedPhotoModal && (
        <Modal
          isOpen={selectedPhotoModal.isOpen}
          onClose={() => setSelectedPhotoModal(null)}
          title={`Boarding Guest: ${selectedPhotoModal.petName}`}
          subtitle={
            selectedPhotoModal.roomNumber
              ? `Suite ${selectedPhotoModal.roomNumber} Stay Photo`
              : 'Daily Boarding Stay Photo'
          }
          maxWidth="max-w-3xl"
        >
          <div className="space-y-4">
            <div className="rounded-2xl overflow-hidden bg-slate-950 flex items-center justify-center max-h-[75vh]">
              <img
                src={selectedPhotoModal.photoUrl}
                alt={`Stay photo of ${selectedPhotoModal.petName}`}
                className="max-h-[75vh] w-auto object-contain"
              />
            </div>
            <div className="flex items-center justify-between text-xs text-slate-500 px-1">
              <span className="flex items-center gap-1.5 text-emerald-700 font-semibold">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Live on customer sanctuary portal</span>
              </span>
              {selectedPhotoModal.date && (
                <span>
                  Updated on: {new Date(selectedPhotoModal.date).toLocaleString()}
                </span>
              )}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default Dashboard;
