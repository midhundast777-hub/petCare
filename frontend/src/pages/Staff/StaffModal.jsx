import React, { useState, useEffect, useRef } from 'react';
import Modal from '../../components/Modal';
import { authService } from '../../services/authService';
import { useToast } from '../../context/ToastContext';
import { Eye, EyeOff, Upload, Trash2, Loader2, User } from 'lucide-react';

export const StaffModal = ({ isOpen, onClose, staffMember, onSaved }) => {
  const { addToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    role: 'STAFF',
    avatar: '',
    password: '',
  });

  const isEdit = !!staffMember?.id;

  useEffect(() => {
    if (isOpen) {
      if (staffMember) {
        setFormData({
          first_name: staffMember.first_name || '',
          last_name: staffMember.last_name || '',
          email: staffMember.email || '',
          phone: staffMember.phone || '',
          role: staffMember.role || 'STAFF',
          avatar: staffMember.avatar || '',
          password: '',
        });
      } else {
        setFormData({
          first_name: '',
          last_name: '',
          email: '',
          phone: '',
          role: 'STAFF',
          avatar: '',
          password: '',
        });
      }
      setShowPassword(false);
    }
  }, [isOpen, staffMember]);

  const handleImageChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      addToast('Please select a valid image file (JPG, PNG, GIF, WEBP).', 'error');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      addToast('Image size exceeds 10MB limit.', 'error');
      return;
    }

    // Instant local preview
    const previewUrl = URL.createObjectURL(file);
    setFormData((prev) => ({ ...prev, avatar: previewUrl }));

    setUploadingAvatar(true);
    try {
      const res = await authService.uploadAvatar(file);
      setFormData((prev) => ({ ...prev, avatar: res.url }));
      addToast('Staff photo uploaded successfully.', 'success');
    } catch (uploadErr) {
      console.warn('Backend avatar upload failed, falling back to data URL:', uploadErr);
      const reader = new FileReader();
      reader.onload = () => {
        setFormData((prev) => ({ ...prev, avatar: reader.result }));
        addToast('Staff photo loaded locally.', 'info');
      };
      reader.readAsDataURL(file);
    } finally {
      setUploadingAvatar(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemoveAvatar = () => {
    setFormData((prev) => ({ ...prev, avatar: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const payload = {
      first_name: formData.first_name.trim(),
      last_name: formData.last_name.trim(),
      email: formData.email.trim().toLowerCase(),
      phone: formData.phone.trim(),
      role: formData.role,
      avatar: formData.avatar || '',
    };

    if (formData.password && formData.password.trim()) {
      payload.password = formData.password.trim();
    } else if (!isEdit) {
      addToast('Please provide a password for new staff account.', 'error');
      setLoading(false);
      return;
    }

    try {
      if (isEdit) {
        await authService.updateUser(staffMember.id, payload);
        addToast('Staff member updated successfully!', 'success');
      } else {
        await authService.createUser(payload);
        addToast('Staff member account created successfully!', 'success');
      }
      if (onSaved) onSaved();
      onClose();
    } catch (err) {
      const errorData = err.response?.data;
      let msg = 'Failed to save staff details. Please verify inputs.';
      if (typeof errorData === 'string') {
        msg = errorData;
      } else if (errorData?.detail) {
        msg = errorData.detail;
      } else if (errorData && typeof errorData === 'object') {
        const firstKey = Object.keys(errorData)[0];
        const val = errorData[firstKey];
        msg = `${firstKey}: ${Array.isArray(val) ? val.join(', ') : val}`;
      }
      addToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? `Edit Staff Member (${staffMember?.full_name})` : 'Add New Staff Member'}
      subtitle={
        isEdit
          ? 'Update staff profile, contact number, role, photo, or reset password'
          : 'Register a new veterinary doctor, groomer, or facility team member'
      }
      maxWidth="max-w-xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Avatar Upload Section */}
        <div>
          <label className="block text-xs font-bold uppercase text-slate-700 mb-1.5">
            Staff Profile Photo
          </label>
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              {formData.avatar ? (
                <img
                  src={formData.avatar}
                  alt="Staff preview"
                  className="w-14 h-14 rounded-xl object-cover border border-slate-200 shadow-sm bg-white shrink-0"
                />
              ) : (
                <div className="w-14 h-14 rounded-xl bg-gradient-to-tr from-brand-600 to-brand-400 text-white flex items-center justify-center font-bold text-lg shadow-sm shrink-0">
                  {formData.first_name?.[0] || 'S'}{formData.last_name?.[0] || 'M'}
                </div>
              )}
              <div>
                <p className="text-xs font-bold text-slate-800">
                  {formData.avatar ? 'Photo selected' : 'No photo uploaded'}
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Click below to select a staff avatar or badge photo
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                className="hidden"
                onChange={handleImageChange}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingAvatar}
                className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold shadow-sm transition-colors cursor-pointer disabled:opacity-50"
              >
                {uploadingAvatar ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Uploading...</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-3.5 h-3.5" />
                    <span>{formData.avatar ? 'Change' : 'Upload'}</span>
                  </>
                )}
              </button>
              {formData.avatar && (
                <button
                  type="button"
                  onClick={handleRemoveAvatar}
                  title="Remove Photo"
                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors border border-slate-200"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
              First Name *
            </label>
            <input
              type="text"
              required
              value={formData.first_name}
              onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
              placeholder="e.g. Rachel"
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
              Last Name *
            </label>
            <input
              type="text"
              required
              value={formData.last_name}
              onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
              placeholder="e.g. Green"
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
              Email Address (Login ID) *
            </label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="rachel.vet@petcare.com"
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20"
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
              placeholder="+1 (555) 019-3344"
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
              Staff Role *
            </label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20 font-semibold"
            >
              <option value="STAFF">Staff (Vet / Caretaker / Groomer)</option>
              <option value="ADMIN">Administrator (Full Access)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
              {isEdit ? 'Reset Password (Optional)' : 'Temporary Password *'}
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required={!isEdit}
                minLength={6}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder={isEdit ? 'Leave blank to keep current password' : 'At least 6 characters'}
                className="w-full pl-3.5 pr-10 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none p-1"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-sm font-bold shadow-sm transition-colors disabled:opacity-50"
          >
            {loading ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Staff Member'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default StaffModal;
