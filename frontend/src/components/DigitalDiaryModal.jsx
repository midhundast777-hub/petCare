import React, { useState, useEffect } from 'react';
import { boardingService } from '../services/boardingService';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../hooks/useAuth';
import Modal from './Modal';
import {
  BookOpen,
  Calendar,
  Clock,
  Camera,
  Plus,
  Trash2,
  Edit3,
  Heart,
  Sparkles,
  Smile,
  ShieldCheck,
  CheckCircle2,
  LogIn,
  LogOut,
  Utensils,
  Pill,
  Activity,
  Footprints,
  Printer,
  X,
  Package,
  Scale,
  FileText,
  AlertCircle,
  UploadCloud,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

const MOOD_OPTIONS = [
  { value: 'HAPPY', label: 'Happy & Wagging', emoji: '🐶', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  { value: 'PLAYFUL', label: 'Playful & Energetic', emoji: '🎾', color: 'bg-amber-50 text-amber-700 border-amber-200' },
  { value: 'CALM', label: 'Calm & Relaxed', emoji: '🧘', color: 'bg-teal-50 text-teal-700 border-teal-200' },
  { value: 'AFFECTIONATE', label: 'Cuddly & Affectionate', emoji: '💖', color: 'bg-rose-50 text-rose-700 border-rose-200' },
  { value: 'SHY', label: 'Shy / Settling In', emoji: '🙈', color: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  { value: 'SLEEPY', label: 'Sleepy & Resting', emoji: '💤', color: 'bg-slate-100 text-slate-700 border-slate-200' },
];

const CARE_TYPES = [
  { value: 'ARRIVAL', label: 'Arrival & Welcome Intake', stage: 'ARRIVAL', icon: LogIn, color: 'text-brand-600' },
  { value: 'FEEDING', label: 'Feeding & Treats', stage: 'DAILY', icon: Utensils, color: 'text-amber-600' },
  { value: 'EXERCISE', label: 'Exercise & Agility Yard Play', stage: 'DAILY', icon: Activity, color: 'text-emerald-600' },
  { value: 'WALK', label: 'Outdoor Walk & Stroll', stage: 'DAILY', icon: Footprints, color: 'text-teal-600' },
  { value: 'MEDICATION', label: 'Medication Administered', stage: 'DAILY', icon: Pill, color: 'text-rose-600' },
  { value: 'GROOMING', label: 'Grooming & Bathing', stage: 'DAILY', icon: Sparkles, color: 'text-purple-600' },
  { value: 'POTTY', label: 'Potty Break', stage: 'DAILY', icon: CheckCircle2, color: 'text-blue-600' },
  { value: 'BEHAVIOR', label: 'Behavior & Mood Observation', stage: 'DAILY', icon: Smile, color: 'text-amber-500' },
  { value: 'HEALTH_CHECK', label: 'Health & Vital Check', stage: 'DAILY', icon: ShieldCheck, color: 'text-indigo-600' },
  { value: 'PHOTO', label: 'Photo Moment', stage: 'DAILY', icon: Camera, color: 'text-pink-600' },
  { value: 'DEPARTURE', label: 'Departure & Checkout Farewell', stage: 'DEPARTURE', icon: LogOut, color: 'text-emerald-700' },
];

export const DigitalDiaryModal = ({ isOpen, onClose, booking, onUpdated }) => {
  const { isStaff, isAdmin } = useAuth();
  const canManage = isStaff || isAdmin;
  const { addToast } = useToast();

  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStage, setFilterStage] = useState('ALL'); // ALL, ARRIVAL, DAILY, DEPARTURE
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editingEntryId, setEditingEntryId] = useState(null);

  // Form State
  const initialForm = {
    stage: 'DAILY',
    care_type: 'FEEDING',
    activity_title: '',
    mood: 'HAPPY',
    notes: '',
    photo: '',
    activity_time: new Date().toISOString().slice(0, 16),
    weight: '',
    belongings_notes: '',
    health_notes: '',
    dietary_notes: '',
  };
  const [formData, setFormData] = useState(initialForm);

  const fetchEntries = async () => {
    if (!booking) return;
    setLoading(true);
    try {
      const data = await boardingService.getCareLogs(booking.id, { ordering: 'activity_time' });
      const list = Array.isArray(data) ? data : data.results || [];
      setEntries(list);
    } catch (err) {
      console.error(err);
      addToast('Failed to load digital diary entries', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && booking) {
      fetchEntries();
      setFormData(initialForm);
      setIsFormOpen(false);
      setEditingEntryId(null);
    }
  }, [isOpen, booking]);

  const handleStageSelect = (stage) => {
    setFilterStage(stage);
  };

  const handleTypeChange = (e) => {
    const selectedType = e.target.value;
    const match = CARE_TYPES.find((c) => c.value === selectedType);
    let stage = match ? match.stage : 'DAILY';
    if (selectedType === 'ARRIVAL') stage = 'ARRIVAL';
    if (selectedType === 'DEPARTURE') stage = 'DEPARTURE';

    let defaultTitle = '';
    if (selectedType === 'ARRIVAL') defaultTitle = `${booking?.pet_name || 'Pet'} Arrived at Sanctuary`;
    else if (selectedType === 'DEPARTURE') defaultTitle = `${booking?.pet_name || 'Pet'} Ready for Home Departure`;
    else if (selectedType === 'FEEDING') defaultTitle = `Yummy Meal Time`;
    else if (selectedType === 'EXERCISE') defaultTitle = `Playtime in Exercise Yard`;
    else if (selectedType === 'WALK') defaultTitle = `Nature Stroll & Exploration`;
    else if (selectedType === 'GROOMING') defaultTitle = `Fresh & Fluffy Grooming`;
    else if (selectedType === 'MEDICATION') defaultTitle = `Medication Administered`;
    else if (selectedType === 'PHOTO') defaultTitle = `Adorable Stay Moment`;

    setFormData((prev) => ({
      ...prev,
      care_type: selectedType,
      stage,
      activity_title: prev.activity_title || defaultTitle,
    }));
  };

  const handlePhotoUpload = (file) => {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      addToast('Image size should be less than 5MB', 'error');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      setFormData((prev) => ({ ...prev, photo: e.target.result }));
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.notes.trim()) {
      addToast('Please provide notes or observations for this activity', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        ...formData,
        weight: formData.weight ? parseFloat(formData.weight) : null,
      };

      if (editingEntryId) {
        await boardingService.updateCareLog(editingEntryId, payload);
        addToast('Diary entry updated successfully!', 'success');
      } else {
        await boardingService.addCareLog(booking.id, payload);
        addToast('New activity recorded in digital diary!', 'success');
      }

      setFormData(initialForm);
      setIsFormOpen(false);
      setEditingEntryId(null);
      fetchEntries();
      if (onUpdated) onUpdated();
    } catch (err) {
      console.error(err);
      addToast('Failed to save diary entry', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (entry) => {
    setEditingEntryId(entry.id);
    setFormData({
      stage: entry.stage || 'DAILY',
      care_type: entry.care_type || 'FEEDING',
      activity_title: entry.activity_title || '',
      mood: entry.mood || 'HAPPY',
      notes: entry.notes || '',
      photo: entry.photo || '',
      activity_time: entry.activity_time ? entry.activity_time.slice(0, 16) : new Date().toISOString().slice(0, 16),
      weight: entry.weight || '',
      belongings_notes: entry.belongings_notes || '',
      health_notes: entry.health_notes || '',
      dietary_notes: entry.dietary_notes || '',
    });
    setIsFormOpen(true);
  };

  const handleDelete = async (entryId) => {
    if (!window.confirm('Delete this diary activity record?')) return;
    try {
      await boardingService.deleteCareLog(entryId);
      addToast('Diary activity removed', 'info');
      fetchEntries();
      if (onUpdated) onUpdated();
    } catch (err) {
      console.error(err);
      addToast('Failed to delete diary record', 'error');
    }
  };

  const handlePrintReport = () => {
    window.print();
  };

  if (!isOpen || !booking) return null;

  const filteredEntries = entries.filter((item) => {
    if (filterStage === 'ALL') return true;
    return item.stage === filterStage;
  });

  const arrivalCount = entries.filter((e) => e.stage === 'ARRIVAL').length;
  const dailyCount = entries.filter((e) => e.stage === 'DAILY').length;
  const departureCount = entries.filter((e) => e.stage === 'DEPARTURE').length;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title=""
      maxWidth="max-w-4xl"
    >
      <div className="space-y-6 printable-pet-diary">
        {/* Diary Header Banner */}
        <div className="relative overflow-hidden bg-gradient-to-r from-brand-900 via-brand-800 to-slate-900 text-white rounded-3xl p-6 sm:p-7 shadow-xl border border-brand-700/50">
          <div className="absolute top-0 right-0 w-80 h-80 bg-brand-500/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white/10 backdrop-blur-md border-2 border-white/20 overflow-hidden flex items-center justify-center shadow-lg">
                  {booking.pet_photo || booking.stay_photo ? (
                    <img
                      src={booking.stay_photo || booking.pet_photo}
                      alt={booking.pet_name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <BookOpen className="w-8 h-8 text-brand-300" />
                  )}
                </div>
                <span className="absolute -bottom-1 -right-1 p-1 bg-amber-400 text-amber-950 rounded-full shadow-md text-xs">
                  ✨
                </span>
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-brand-500/30 text-brand-200 border border-brand-400/30">
                    Stay #{booking.booking_id || booking.id}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-white/20 text-white backdrop-blur-xs">
                    {booking.status_display || booking.status}
                  </span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-black tracking-tight mt-1 text-white flex items-center gap-2">
                  <span>{booking.pet_name}'s Digital Stay Diary</span>
                </h2>
                <p className="text-xs sm:text-sm text-brand-200/90 mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1">
                  <span>🐾 {booking.pet_species || 'Pet'} • {booking.pet_breed || 'Beloved Companion'}</span>
                  <span>🏠 {booking.room_number ? `Suite ${booking.room_number}` : 'Boarding Suite'}</span>
                  <span>📅 {booking.check_in_date} to {booking.expected_check_out_date}</span>
                </p>
              </div>
            </div>

            {/* Top Action Buttons */}
            <div className="flex items-center gap-2 w-full sm:w-auto justify-end pt-2 sm:pt-0 no-print">
              <button
                type="button"
                onClick={handlePrintReport}
                className="px-3.5 py-2 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-bold transition-all flex items-center gap-1.5 backdrop-blur-md border border-white/20 cursor-pointer shadow-xs"
                title="Print official Pet Boarding Stay Diary & Report Card"
              >
                <Printer className="w-4 h-4" />
                <span>Print Report Card</span>
              </button>

              {canManage && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingEntryId(null);
                    setFormData(initialForm);
                    setIsFormOpen(!isFormOpen);
                  }}
                  className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black transition-all flex items-center gap-1.5 shadow-lg shadow-emerald-500/20 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>{isFormOpen ? 'Close Form' : 'Log Activity'}</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Phase Filter Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3 no-print">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => handleStageSelect('ALL')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                filterStage === 'ALL'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              🌟 Complete Journey ({entries.length})
            </button>

            <button
              type="button"
              onClick={() => handleStageSelect('ARRIVAL')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer ${
                filterStage === 'ARRIVAL'
                  ? 'bg-brand-600 text-white shadow-xs'
                  : 'bg-brand-50 text-brand-700 hover:bg-brand-100'
              }`}
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>When They Came ({arrivalCount})</span>
            </button>

            <button
              type="button"
              onClick={() => handleStageSelect('DAILY')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer ${
                filterStage === 'DAILY'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>Daily Stay Activities ({dailyCount})</span>
            </button>

            <button
              type="button"
              onClick={() => handleStageSelect('DEPARTURE')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer ${
                filterStage === 'DEPARTURE'
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
              }`}
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>When They Leaves ({departureCount})</span>
            </button>
          </div>

          <div className="text-xs font-bold text-slate-400">
            Owner: <span className="text-slate-700">{booking.customer_name}</span>
          </div>
        </div>

        {/* Staff Recording Panel (Collapse/Expand) */}
        {isFormOpen && canManage && (
          <form
            onSubmit={handleSubmit}
            className="p-5 sm:p-6 bg-slate-50/90 rounded-2xl border-2 border-brand-200/80 shadow-md space-y-4 transition-all no-print"
          >
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-brand-600 text-white flex items-center justify-center font-bold">
                  <Edit3 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900">
                    {editingEntryId ? 'Update Diary Activity' : 'Record Pet Stay Activity'}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Captures live moments, meals, wellness observations, arrival, and departure
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsFormOpen(false);
                  setEditingEntryId(null);
                }}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Activity Stage
                </label>
                <select
                  value={formData.stage}
                  onChange={(e) => setFormData((prev) => ({ ...prev, stage: e.target.value }))}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-brand-500/20"
                >
                  <option value="ARRIVAL">📥 Arrival & Intake (When Pet Came)</option>
                  <option value="DAILY">🎾 Daily Stay Activity (During Stay)</option>
                  <option value="DEPARTURE">📤 Departure & Checkout (When Pet Leaves)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Activity Category
                </label>
                <select
                  value={formData.care_type}
                  onChange={handleTypeChange}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-brand-500/20"
                >
                  {CARE_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Pet Mood & Energy
                </label>
                <select
                  value={formData.mood}
                  onChange={(e) => setFormData((prev) => ({ ...prev, mood: e.target.value }))}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-brand-500/20"
                >
                  {MOOD_OPTIONS.map((m) => (
                    <option key={m.value} value={m.value}>
                      {m.emoji} {m.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Activity Headline / Title
                </label>
                <input
                  type="text"
                  required
                  value={formData.activity_title}
                  onChange={(e) => setFormData((prev) => ({ ...prev, activity_title: e.target.value }))}
                  placeholder="e.g. Agility Sprint in Sunny Yard, Arrival Health Check"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-brand-500/20"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Activity Timestamp
                </label>
                <input
                  type="datetime-local"
                  required
                  value={formData.activity_time}
                  onChange={(e) => setFormData((prev) => ({ ...prev, activity_time: e.target.value }))}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:ring-2 focus:ring-brand-500/20"
                />
              </div>
            </div>

            {/* Contextual fields for Arrival or Departure */}
            {(formData.stage === 'ARRIVAL' || formData.stage === 'DEPARTURE' || formData.care_type === 'ARRIVAL' || formData.care_type === 'DEPARTURE') && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-brand-50/60 rounded-xl border border-brand-100">
                <div>
                  <label className="block text-[11px] font-bold text-brand-900 mb-1 flex items-center gap-1">
                    <Package className="w-3.5 h-3.5 text-brand-700" />
                    <span>Personal Belongings & Items ({formData.stage === 'ARRIVAL' ? 'Received' : 'Returned'})</span>
                  </label>
                  <input
                    type="text"
                    value={formData.belongings_notes}
                    onChange={(e) => setFormData((prev) => ({ ...prev, belongings_notes: e.target.value }))}
                    placeholder="e.g. Leash, favorite blanket, 1 bag kibble, salmon treats"
                    className="w-full px-3 py-1.5 bg-white border border-brand-200 rounded-lg text-xs"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-brand-900 mb-1 flex items-center gap-1">
                    <Scale className="w-3.5 h-3.5 text-brand-700" />
                    <span>Recorded Weight (kg / lbs)</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.weight}
                    onChange={(e) => setFormData((prev) => ({ ...prev, weight: e.target.value }))}
                    placeholder="e.g. 28.5"
                    className="w-full px-3 py-1.5 bg-white border border-brand-200 rounded-lg text-xs"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Detailed Activity Log & Story for Pet Parent
              </label>
              <textarea
                required
                rows={2}
                value={formData.notes}
                onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
                placeholder="Describe how the pet responded, their mood, interaction with staff/toys, appetites, or medical details..."
                className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-normal text-slate-800 focus:ring-2 focus:ring-brand-500/20"
              />
            </div>

            {/* Photo Attachment */}
            <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-2">
              <label className="block text-[11px] font-bold text-slate-700 flex items-center gap-1.5">
                <Camera className="w-3.5 h-3.5 text-brand-600" />
                <span>Attach Activity Photo (Visible to Pet Parent)</span>
              </label>
              <div className="flex flex-col sm:flex-row items-center gap-3">
                <label className="cursor-pointer px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors border border-slate-200">
                  <UploadCloud className="w-4 h-4 text-brand-600" />
                  <span>Upload Image File</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handlePhotoUpload(e.target.files?.[0])}
                  />
                </label>
                <span className="text-[11px] text-slate-400">or paste image URL:</span>
                <input
                  type="text"
                  value={formData.photo}
                  onChange={(e) => setFormData((prev) => ({ ...prev, photo: e.target.value }))}
                  placeholder="https://..."
                  className="flex-1 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                />
              </div>

              {formData.photo && (
                <div className="relative inline-block mt-2 rounded-xl overflow-hidden border border-slate-200 w-28 h-20 bg-slate-900">
                  <img src={formData.photo} alt="Preview" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => setFormData((prev) => ({ ...prev, photo: '' }))}
                    className="absolute top-1 right-1 p-1 bg-rose-600 text-white rounded-full hover:bg-rose-700 text-xs shadow-xs"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
              <button
                type="button"
                onClick={() => {
                  setIsFormOpen(false);
                  setEditingEntryId(null);
                }}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold shadow-sm transition-colors disabled:opacity-50 cursor-pointer"
              >
                {submitting ? 'Saving Activity...' : editingEntryId ? 'Update Activity' : 'Post to Pet Diary'}
              </button>
            </div>
          </form>
        )}

        {/* Timeline Activities List */}
        {loading ? (
          <div className="py-16 text-center text-xs text-slate-400">
            <div className="w-8 h-8 border-2 border-brand-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            Loading {booking.pet_name}'s digital diary timeline...
          </div>
        ) : filteredEntries.length === 0 ? (
          <div className="py-16 text-center space-y-3 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
            <div className="w-12 h-12 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center mx-auto">
              <BookOpen className="w-6 h-6" />
            </div>
            <p className="text-sm font-bold text-slate-800">
              No diary entries for {filterStage === 'ALL' ? 'this stay' : filterStage.toLowerCase()} yet
            </p>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              When the pet arrives, completes meals, takes outdoor agility strolls, or leaves, staff entries appear here in chronological order.
            </p>
            {canManage && (
              <button
                type="button"
                onClick={() => {
                  setFormData((prev) => ({
                    ...initialForm,
                    stage: filterStage === 'ALL' ? 'ARRIVAL' : filterStage,
                    care_type: filterStage === 'DEPARTURE' ? 'DEPARTURE' : 'ARRIVAL',
                  }));
                  setIsFormOpen(true);
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-xs"
              >
                <Plus className="w-4 h-4" />
                <span>Record First Diary Entry</span>
              </button>
            )}
          </div>
        ) : (
          <div className="relative pl-6 sm:pl-8 space-y-6 before:absolute before:left-3 sm:before:left-4 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200">
            {filteredEntries.map((entry, index) => {
              const moodMatch = MOOD_OPTIONS.find((m) => m.value === entry.mood) || MOOD_OPTIONS[0];
              const isArrival = entry.stage === 'ARRIVAL';
              const isDeparture = entry.stage === 'DEPARTURE';

              return (
                <div
                  key={entry.id || index}
                  className={`relative p-5 rounded-2xl border transition-all shadow-xs ${
                    isArrival
                      ? 'bg-brand-50/50 border-brand-200/90 ring-1 ring-brand-500/10'
                      : isDeparture
                      ? 'bg-emerald-50/50 border-emerald-200/90 ring-1 ring-emerald-500/10'
                      : 'bg-white border-slate-200/80 hover:border-slate-300'
                  }`}
                >
                  {/* Timeline Node Badge */}
                  <div
                    className={`absolute -left-6 sm:-left-8 top-5 w-6 h-6 sm:w-8 sm:h-8 rounded-full border-2 flex items-center justify-center shadow-xs ${
                      isArrival
                        ? 'bg-brand-600 border-white text-white'
                        : isDeparture
                        ? 'bg-emerald-600 border-white text-white'
                        : 'bg-white border-brand-500 text-brand-600'
                    }`}
                  >
                    {isArrival ? (
                      <LogIn className="w-3.5 h-3.5" />
                    ) : isDeparture ? (
                      <LogOut className="w-3.5 h-3.5" />
                    ) : (
                      <Activity className="w-3.5 h-3.5" />
                    )}
                  </div>

                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                          isArrival
                            ? 'bg-brand-600 text-white'
                            : isDeparture
                            ? 'bg-emerald-700 text-white'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {isArrival ? '📥 When Pet Came (Arrival)' : isDeparture ? '📤 When Pet Leaves (Departure)' : '🎾 Daily Activity'}
                      </span>

                      <span className="text-xs font-black text-slate-800">
                        {entry.care_type_display || entry.care_type}
                      </span>

                      {entry.mood && (
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border flex items-center gap-1 ${moodMatch.color}`}>
                          <span>{moodMatch.emoji}</span>
                          <span>{moodMatch.label}</span>
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{new Date(entry.activity_time || entry.logged_at).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</span>

                      {canManage && (
                        <div className="flex items-center gap-1 ml-2 no-print">
                          <button
                            type="button"
                            onClick={() => handleEdit(entry)}
                            className="p-1 text-slate-400 hover:text-brand-600 rounded-md hover:bg-slate-100"
                            title="Edit activity"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(entry.id)}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded-md hover:bg-rose-50"
                            title="Delete activity"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Title & Notes */}
                  <div className="mt-3 space-y-2">
                    {entry.activity_title && (
                      <h4 className="text-sm font-black text-slate-900 tracking-tight flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-amber-500" />
                        <span>{entry.activity_title}</span>
                      </h4>
                    )}

                    <p className="text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-line">
                      {entry.notes}
                    </p>

                    {/* Specialized Cards for Arrival / Departure metadata */}
                    {(entry.belongings_notes || entry.weight || entry.health_notes || entry.dietary_notes) && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 text-xs">
                        {entry.belongings_notes && (
                          <div className="p-2.5 bg-white/80 rounded-xl border border-slate-200/80 flex items-start gap-2">
                            <Package className="w-4 h-4 text-brand-600 shrink-0 mt-0.5" />
                            <div>
                              <span className="font-bold text-slate-800 block text-[11px]">
                                {isArrival ? 'Belongings Handed In' : 'Belongings Returned'}
                              </span>
                              <span className="text-slate-600">{entry.belongings_notes}</span>
                            </div>
                          </div>
                        )}

                        {entry.weight && (
                          <div className="p-2.5 bg-white/80 rounded-xl border border-slate-200/80 flex items-start gap-2">
                            <Scale className="w-4 h-4 text-brand-600 shrink-0 mt-0.5" />
                            <div>
                              <span className="font-bold text-slate-800 block text-[11px]">Recorded Weight</span>
                              <span className="text-slate-600">{entry.weight} kg</span>
                            </div>
                          </div>
                        )}

                        {entry.health_notes && (
                          <div className="p-2.5 bg-white/80 rounded-xl border border-slate-200/80 flex items-start gap-2">
                            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                            <div>
                              <span className="font-bold text-slate-800 block text-[11px]">Health / Vital Observation</span>
                              <span className="text-slate-600">{entry.health_notes}</span>
                            </div>
                          </div>
                        )}

                        {entry.dietary_notes && (
                          <div className="p-2.5 bg-white/80 rounded-xl border border-slate-200/80 flex items-start gap-2">
                            <Utensils className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                            <div>
                              <span className="font-bold text-slate-800 block text-[11px]">Diet & Appetite</span>
                              <span className="text-slate-600">{entry.dietary_notes}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Attached Photo */}
                    {entry.photo && (
                      <div className="mt-3 rounded-2xl overflow-hidden border border-slate-200 max-h-72 aspect-video bg-slate-950 shadow-xs">
                        <img
                          src={entry.photo}
                          alt={entry.activity_title || 'Diary photo'}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}

                    {entry.staff_name && (
                      <div className="pt-2 flex items-center justify-between text-[11px] text-slate-400">
                        <span>Staff Caretaker: <strong className="text-slate-600 font-semibold">{entry.staff_name}</strong></span>
                        <span className="text-[10px] text-slate-400">Verified Sanctuary Care Log</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Modal Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-200 text-xs no-print">
          <div className="text-slate-500">
            Total of <strong className="text-slate-800">{entries.length}</strong> logged activities across stay
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors cursor-pointer"
          >
            Close Diary
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default DigitalDiaryModal;
