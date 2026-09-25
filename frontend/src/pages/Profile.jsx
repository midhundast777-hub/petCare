import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../context/ToastContext';
import { boardingService } from '../services/boardingService';
import { authService } from '../services/authService';
import { validatePhone, formatPhoneInput } from '../utils/validation';
import VerificationModal from '../components/VerificationModal';
import {
  User,
  Mail,
  Phone,
  Shield,
  Calendar,
  Camera,
  Home,
  Dog,
  Clock,
  CheckCircle2,
  Upload,
  Trash2,
  Loader2,
  Image as ImageIcon,
  Bell,
  ShieldCheck,
  AlertCircle,
  Sparkles,
  BookOpen
} from 'lucide-react';
import DigitalDiaryModal from '../components/DigitalDiaryModal';

export const Profile = () => {
  const { user, updateProfile, isAdmin, isStaff } = useAuth();
  const { addToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [bookings, setBookings] = useState([]);
  const [loadingBookings, setLoadingBookings] = useState(true);
  const [selectedBookingForDiary, setSelectedBookingForDiary] = useState(null);
  const [isDiaryOpen, setIsDiaryOpen] = useState(false);


  const [formData, setFormData] = useState({
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    phone: user?.phone || '',
    avatar: user?.avatar || '',
  });

  const [verificationModal, setVerificationModal] = useState({
    isOpen: false,
    type: 'EMAIL',
    destination: '',
  });

  const fileInputRef = useRef(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);

  const handleAvatarFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      addToast('Please select a valid image file (PNG, JPG, WEBP, GIF, SVG)', 'error');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      addToast('Image size exceeds 10MB limit', 'error');
      return;
    }

    // Instant local preview
    const previewUrl = URL.createObjectURL(file);
    setFormData((prev) => ({ ...prev, avatar: previewUrl }));

    setUploadingAvatar(true);
    try {
      const res = await authService.uploadAvatar(file);
      setFormData((prev) => ({ ...prev, avatar: res.url }));
      addToast('Avatar uploaded successfully! Remember to save profile changes.', 'success');
    } catch (uploadErr) {
      console.warn('Backend avatar upload failed, falling back to local base64:', uploadErr);
      const reader = new FileReader();
      reader.onload = () => {
        setFormData((prev) => ({ ...prev, avatar: reader.result }));
        addToast('Avatar loaded. Remember to click "Save Profile Changes".', 'info');
      };
      reader.readAsDataURL(file);
    } finally {
      setUploadingAvatar(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemoveAvatar = () => {
    setFormData((prev) => ({ ...prev, avatar: '' }));
    addToast('Avatar removed. Click "Save Profile Changes" to confirm.', 'info');
  };

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

    const phoneDigits = (formData.phone || '').replace(/\D/g, '');
    if (formData.phone && phoneDigits.length !== 10) {
      addToast(`Phone number must contain exactly 10 digits (currently ${phoneDigits.length} digits).`, 'error');
      return;
    }

    setLoading(true);
    try {
      await updateProfile({
        ...formData,
        phone: phoneDigits,
      });
      addToast('Profile updated successfully!', 'success');
    } catch (err) {
      const detail = err.response?.data?.phone?.[0] || err.response?.data?.detail || 'Failed to update profile';
      addToast(detail, 'error');
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
            <div className="relative group">
              {formData.avatar ? (
                <img
                  src={formData.avatar}
                  alt={user?.full_name}
                  className="w-24 h-24 rounded-2xl object-cover border-4 border-white shadow-md bg-white"
                />
              ) : (
                <div className="w-24 h-24 rounded-2xl bg-slate-100 text-slate-600 font-bold text-3xl flex items-center justify-center border-4 border-white shadow-md">
                  {user?.first_name?.[0] || 'U'}
                </div>
              )}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingAvatar}
                className="absolute -bottom-1 -right-1 p-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl shadow-md border-2 border-white transition-all transform hover:scale-105 cursor-pointer disabled:opacity-50"
                title="Upload image"
                aria-label="Upload image"
              >
                {uploadingAvatar ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
              </button>
            </div>
            <div className="mb-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingAvatar}
                className="text-xs font-bold text-white bg-black/40 hover:bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/20 shadow transition cursor-pointer flex items-center gap-1.5"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>{uploadingAvatar ? 'Uploading...' : 'Upload Photo'}</span>
              </button>
            </div>
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
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-bold uppercase text-slate-700">
                Email Address (Login ID)
              </label>
              {user?.is_email_verified ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-black text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-200">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>Verified</span>
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() =>
                    setVerificationModal({
                      isOpen: true,
                      type: 'EMAIL',
                      destination: user?.email || '',
                    })
                  }
                  className="inline-flex items-center gap-1 text-[10px] font-bold text-brand-700 hover:text-brand-800 bg-brand-50 hover:bg-brand-100 px-2.5 py-0.5 rounded-full border border-brand-200 transition-colors cursor-pointer"
                >
                  <Bell className="w-3 h-3 text-brand-600 animate-bounce" />
                  <span>Verify Email (Push Alert)</span>
                </button>
              )}
            </div>
            <div className="relative">
              <input
                type="email"
                disabled
                value={user?.email || ''}
                className="w-full px-3.5 py-2 bg-slate-100 border border-slate-200 rounded-xl text-sm text-slate-500 cursor-not-allowed"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-bold uppercase text-slate-700">
                Phone Number (10 Digits)
              </label>
              <div className="flex items-center gap-2">
                {user?.is_phone_verified ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-black text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-200">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>10-Digit Verified</span>
                  </span>
                ) : (formData.phone || '').replace(/\D/g, '').length === 10 ? (
                  <button
                    type="button"
                    onClick={() =>
                      setVerificationModal({
                        isOpen: true,
                        type: 'PHONE',
                        destination: (formData.phone || '').replace(/\D/g, ''),
                      })
                    }
                    className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-100 hover:bg-emerald-200 px-2.5 py-0.5 rounded-full border border-emerald-300 transition-colors cursor-pointer"
                  >
                    <ShieldCheck className="w-3 h-3 text-emerald-700" />
                    <span>Verify 10-Digit Phone</span>
                  </button>
                ) : (
                  <span className="text-[10px] font-bold text-amber-600">
                    {(formData.phone || '').replace(/\D/g, '').length}/10 digits
                  </span>
                )}
              </div>
            </div>
            <input
              type="tel"
              maxLength={14}
              value={formData.phone}
              onChange={(e) =>
                setFormData({ ...formData, phone: formatPhoneInput(e.target.value) })
              }
              placeholder="(555) 012-3456"
              className={`w-full px-3.5 py-2 bg-slate-50 border rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20 transition-colors ${
                (formData.phone || '').replace(/\D/g, '').length === 10
                  ? 'border-emerald-300 bg-emerald-50/10'
                  : (formData.phone || '').length > 0
                  ? 'border-amber-300'
                  : 'border-slate-200'
              }`}
            />
            {(formData.phone || '').replace(/\D/g, '').length !== 10 && formData.phone ? (
              <p className="text-[11px] text-amber-700 mt-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3 text-amber-600" />
                <span>Phone number must have exactly 10 digits.</span>
              </p>
            ) : null}
          </div>

          {/* Avatar Image Upload */}
          <div>
            <label className="block text-xs font-bold uppercase text-slate-700 mb-1.5">
              Avatar Image
            </label>
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                {formData.avatar ? (
                  <img
                    src={formData.avatar}
                    alt="Avatar preview"
                    className="w-14 h-14 rounded-xl object-cover border border-slate-200 shadow-sm bg-white shrink-0"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-xl bg-slate-200 text-slate-500 flex items-center justify-center font-bold text-xl shrink-0">
                    <User className="w-6 h-6 text-slate-400" />
                  </div>
                )}
                <div>
                  <p className="text-xs font-bold text-slate-800">
                    {formData.avatar ? 'Avatar image selected' : 'No avatar image uploaded'}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Click "Upload Image" to select a photo from your computer
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingAvatar}
                  className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3.5 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold shadow-sm transition-colors cursor-pointer disabled:opacity-50"
                >
                  {uploadingAvatar ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Uploading...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-3.5 h-3.5" />
                      <span>{formData.avatar ? 'Change Image' : 'Upload Image'}</span>
                    </>
                  )}
                </button>
                {formData.avatar && (
                  <button
                    type="button"
                    onClick={handleRemoveAvatar}
                    disabled={uploadingAvatar}
                    className="inline-flex items-center justify-center gap-1 px-3 py-2 bg-white hover:bg-rose-50 text-rose-600 border border-rose-200 rounded-xl text-xs font-bold transition-colors cursor-pointer disabled:opacity-50"
                    title="Remove avatar"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Remove</span>
                  </button>
                )}
              </div>
            </div>

            {/* Hidden native file input */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleAvatarFileChange}
              accept="image/png, image/jpeg, image/webp, image/gif, image/svg+xml, image/*"
              className="hidden"
            />

            <div className="mt-2 text-right">
              <button
                type="button"
                onClick={() => setShowUrlInput(!showUrlInput)}
                className="text-[11px] text-slate-500 hover:text-brand-600 font-semibold underline underline-offset-2 transition-colors cursor-pointer"
              >
                {showUrlInput ? 'Hide image URL link input' : 'Or paste an image URL instead'}
              </button>
            </div>
            {showUrlInput && (
              <div className="mt-2">
                <input
                  type="url"
                  value={formData.avatar}
                  onChange={(e) => setFormData({ ...formData, avatar: e.target.value })}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-brand-500/20"
                />
              </div>
            )}
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
                    <span className="font-bold text-slate-800">
                      {b.check_in_date || '-'} {b.check_in_time ? `(${b.check_in_time.slice(0, 5)})` : ''}
                    </span>
                  </div>
                  <div>
                    <span className="block text-[10px] uppercase font-bold text-slate-400">Expected Check-Out</span>
                    <span className="font-bold text-slate-800">
                      {b.expected_check_out_date || '-'} {b.check_out_time ? `(${b.check_out_time.slice(0, 5)})` : ''}
                    </span>
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

                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-200/60">
                  <span className="text-[11px] text-slate-500 font-medium">
                    Live digital care logs, arrival details, photos & departure summary
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedBookingForDiary(b);
                      setIsDiaryOpen(true);
                    }}
                    className="px-3.5 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
                  >
                    <BookOpen className="w-3.5 h-3.5 text-amber-600" />
                    <span>View Pet Stay Diary</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pet Digital Stay Diary Modal for Pet Parent */}
      {isDiaryOpen && selectedBookingForDiary && (
        <DigitalDiaryModal
          isOpen={isDiaryOpen}
          onClose={() => {
            setIsDiaryOpen(false);
            setSelectedBookingForDiary(null);
          }}
          booking={selectedBookingForDiary}
          onUpdated={fetchBookings}
        />
      )}

      {/* Verification Modal for Push Notification Email & 10-Digit Phone */}
      {verificationModal.isOpen && (
        <VerificationModal
          isOpen={verificationModal.isOpen}
          onClose={() => setVerificationModal((prev) => ({ ...prev, isOpen: false }))}
          type={verificationModal.type}
          destination={verificationModal.destination}
          onVerified={() => {
            if (verificationModal.type === 'EMAIL') {
              if (user) user.is_email_verified = true;
            } else {
              if (user) user.is_phone_verified = true;
            }
          }}
        />
      )}
    </div>
  );

};

export default Profile;
