import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../context/ToastContext';
import { boardingService } from '../services/boardingService';
import { User, Mail, Phone, Shield, Calendar, Camera, Home, Dog, Clock, CheckCircle2 } from 'lucide-react';

export const Profile = () => {
  const { user, updateProfile, isAdmin, isStaff } = useAuth();
  const { addToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [bookings, setBookings] = useState([]);
  const [loadingBookings, setLoadingBookings] = useState(true);

  const [formData, setFormData] = useState({
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    phone: user?.phone || '',
    avatar: user?.avatar || '',
  });

  const fetchBookings = async () => {
    try {
      const data = await boardingService.getBookings();
      const list = Array.isArray(data) ? data : data.results || [];
      setBookings(list);
    } catch (err) {
      console.error('Failed to load user bookings', err);
    } finally {
      setLoadingBookings(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await updateProfile(formData);
      addToast('Profile updated successfully!', 'success');
    } catch (err) {
      addToast('Failed to update profile', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Account & Profile Settings</h1>
        <p className="text-xs text-slate-500 mt-0.5">Manage your personal credentials and view your reservations</p>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
        {/* Banner */}
        <div className="h-28 bg-gradient-to-r from-brand-600 via-brand-500 to-teal-600 p-6 flex items-end">
          <div className="relative translate-y-12 flex items-end gap-4">
            {formData.avatar ? (
              <img
                src={formData.avatar}
                alt={user?.full_name}
                className="w-20 h-20 rounded-2xl object-cover border-4 border-white shadow-md bg-white"
              />
            ) : (
              <div className="w-20 h-20 rounded-2xl bg-slate-100 text-slate-600 font-bold text-2xl flex items-center justify-center border-4 border-white shadow-md">
                {user?.first_name?.[0] || 'U'}
              </div>
            )}
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="pt-16 p-6 sm:p-8 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-slate-100 text-slate-700">
              Role: {user?.role}
            </span>
            <span className="text-xs text-slate-400">
              Member since {user?.created_at ? new Date(user.created_at).toLocaleDateString() : '2026'}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                First Name
              </label>
              <input
                type="text"
                value={formData.first_name}
                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                Last Name
              </label>
              <input
                type="text"
                value={formData.last_name}
                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
              Email Address (Login ID)
            </label>
            <input
              type="email"
              disabled
              value={user?.email || ''}
              className="w-full px-3.5 py-2 bg-slate-100 border border-slate-200 rounded-xl text-sm text-slate-500 cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
              Phone Number
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
              Avatar Image URL
            </label>
            <input
              type="url"
              value={formData.avatar}
              onChange={(e) => setFormData({ ...formData, avatar: e.target.value })}
              placeholder="https://images.unsplash.com/..."
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20"
            />
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold shadow-sm transition-colors disabled:opacity-50 cursor-pointer"
            >
              {loading ? 'Saving...' : 'Save Profile Changes'}
            </button>
          </div>
        </form>
      </div>

      {/* Boarding Stays & Reservations Section */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden p-6 sm:p-8 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center font-bold">
              <Home className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 tracking-tight">
                My Boarding Stays & Reservations
              </h2>
              <p className="text-xs text-slate-500">
                Live status of stay requests sent to admin and staff
              </p>
            </div>
          </div>
          <span className="px-3 py-1 rounded-full text-xs font-black bg-brand-50 text-brand-700 border border-brand-200">
            {bookings.length} {bookings.length === 1 ? 'Stay' : 'Stays'}
          </span>
        </div>

        {loadingBookings ? (
          <div className="py-8 text-center text-xs text-slate-400">Loading your stay records...</div>
        ) : bookings.length === 0 ? (
          <div className="py-10 text-center space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <Dog className="w-6 h-6" />
            </div>
            <p className="text-sm font-bold text-slate-700">No Boarding Stays Yet</p>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              When you submit a booking from the Sanctuary booking section, your request details and staff confirmation appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {bookings.map((b) => (
              <div
                key={b.id}
                className="p-4 rounded-2xl border border-slate-200/80 bg-slate-50/70 hover:bg-white hover:border-slate-300 transition shadow-xs space-y-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-black text-brand-700 bg-brand-50 border border-brand-200 px-2.5 py-1 rounded-lg">
                      {b.booking_id || `#BRD-${b.id}`}
                    </span>
                    <span className="text-sm font-black text-slate-900 flex items-center gap-1.5">
                      <Dog className="w-4 h-4 text-brand-600" />
                      {b.pet_name || 'Pet'}
                    </span>
                    {b.pet_species && (
                      <span className="text-xs font-semibold text-slate-500 bg-slate-200/70 px-2 py-0.5 rounded-md">
                        {b.pet_species}
                      </span>
                    )}
                  </div>

                  <span
                    className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${
                      b.status === 'RESERVED'
                        ? 'bg-amber-100 text-amber-800 border border-amber-200'
                        : b.status === 'CHECKED_IN'
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        : b.status === 'CHECKED_OUT'
                        ? 'bg-slate-100 text-slate-700 border border-slate-200'
                        : 'bg-rose-100 text-rose-800 border border-rose-200'
                    }`}
                  >
                    {b.status_display || b.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-white p-3 rounded-xl border border-slate-200/60">
                  <div>
                    <span className="block text-[10px] uppercase font-bold text-slate-400">Check-In</span>
                    <span className="font-bold text-slate-800">{b.check_in_date || '-'}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] uppercase font-bold text-slate-400">Expected Check-Out</span>
                    <span className="font-bold text-slate-800">{b.expected_check_out_date || '-'}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] uppercase font-bold text-slate-400">Assigned Room</span>
                    <span className="font-bold text-slate-800">
                      {b.room_number ? `Room ${b.room_number}` : 'Pending Room'}
                    </span>
                  </div>
                  <div>
                    <span className="block text-[10px] uppercase font-bold text-slate-400">Package / Total</span>
                    <span className="font-bold text-brand-700">
                      {b.package} {Number(b.total_cost) > 0 ? `($${b.total_cost})` : ''}
                    </span>
                  </div>
                </div>

                {b.special_instructions && (
                  <div className="text-xs bg-slate-100/80 p-2.5 rounded-xl text-slate-600 border border-slate-200/50">
                    <span className="font-bold text-slate-700">Notes / Care Request: </span>
                    {b.special_instructions}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;
