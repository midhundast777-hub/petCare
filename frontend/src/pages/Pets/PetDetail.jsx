import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { petService } from '../../services/petService';
import { vaccinationService } from '../../services/vaccinationService';
import { medicalService } from '../../services/medicalService';
import { appointmentService } from '../../services/appointmentService';
import { boardingService } from '../../services/boardingService';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../hooks/useAuth';
import LoadingSpinner from '../../components/LoadingSpinner';
import PetModal from './PetModal';
import {
  Dog,
  Syringe,
  Pill,
  Utensils,
  Stethoscope,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Clock,
  Edit,
  User,
  ShieldAlert,
  Plus
} from 'lucide-react';

export const PetDetail = () => {
  const { id } = useParams();
  const { isStaff, isAdmin } = useAuth();
  const { addToast } = useToast();
  const [pet, setPet] = useState(null);
  const [vaccinations, setVaccinations] = useState([]);
  const [medications, setMedications] = useState([]);
  const [feedingSchedules, setFeedingSchedules] = useState([]);
  const [medicalRecords, setMedicalRecords] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [boardings, setBoardings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const fetchPetData = async () => {
    try {
      setLoading(true);
      const [pData, vData, mData, fData, medRecData, aptData, brdData] = await Promise.all([
        petService.getById(id),
        vaccinationService.getAll({ pet: id }),
        medicalService.getMedications({ pet: id }),
        medicalService.getFeedingSchedules({ pet: id }),
        medicalService.getRecords({ pet: id }),
        appointmentService.getAll({ pet: id }),
        boardingService.getBookings({ pet: id }),
      ]);

      setPet(pData);
      setVaccinations(Array.isArray(vData) ? vData : vData.results || []);
      setMedications(Array.isArray(mData) ? mData : mData.results || []);
      setFeedingSchedules(Array.isArray(fData) ? fData : fData.results || []);
      setMedicalRecords(Array.isArray(medRecData) ? medRecData : medRecData.results || []);
      setAppointments(Array.isArray(aptData) ? aptData : aptData.results || []);
      setBoardings(Array.isArray(brdData) ? brdData : brdData.results || []);
    } catch (err) {
      console.error(err);
      addToast('Failed to load pet profile', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPetData();
  }, [id]);

  // Quick Action: Mark Medication Dose as Administered
  const handleAdministerDose = async (medId, medName) => {
    try {
      await medicalService.logMedicationDose(medId, 'Dose administered per schedule');
      addToast(`Recorded dose administration for ${medName}`, 'success');
      // Refresh medications
      const res = await medicalService.getMedications({ pet: id });
      setMedications(Array.isArray(res) ? res : res.results || []);
    } catch (err) {
      addToast('Failed to record dose', 'error');
    }
  };

  // Quick Action: Mark Feeding completed
  const handleMarkFed = async (schedId, foodType) => {
    try {
      await medicalService.logFeeding(schedId, 'All', 'Meal served and finished');
      addToast(`Logged feeding for ${foodType}`, 'success');
      // Refresh schedules
      const res = await medicalService.getFeedingSchedules({ pet: id });
      setFeedingSchedules(Array.isArray(res) ? res : res.results || []);
    } catch (err) {
      addToast('Failed to record feeding', 'error');
    }
  };

  if (loading) return <LoadingSpinner size="lg" text="Loading Pet 360 Health Profile..." />;
  if (!pet) return <div className="p-8 text-center text-slate-500">Pet not found</div>;

  return (
    <div className="space-y-6">
      {/* Top Banner Pet Profile */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          {pet.photo ? (
            <img
              src={pet.photo}
              alt={pet.name}
              className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl object-cover border-2 border-brand-100 shadow-md"
            />
          ) : (
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-gradient-to-tr from-brand-600 to-brand-400 text-white flex items-center justify-center font-black text-3xl shadow-md">
              🐾
            </div>
          )}

          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900">{pet.name}</h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-brand-100 text-brand-800 border border-brand-200 font-mono">
                {pet.pet_id}
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700">
                {pet.species} • {pet.breed || 'Mixed'}
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                {pet.status}
              </span>
            </div>

            <p className="text-xs text-slate-500 mt-2 flex items-center gap-4 flex-wrap">
              <span>Age: <strong className="text-slate-800">{pet.age}</strong></span>
              <span>Gender: <strong className="text-slate-800">{pet.gender}</strong></span>
              {pet.weight && <span>Weight: <strong className="text-slate-800">{pet.weight} kg</strong></span>}
              {pet.microchip_number && (
                <span className="font-mono bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                  Microchip: {pet.microchip_number}
                </span>
              )}
            </p>

            {/* Owner Info Bar */}
            <div className="mt-3 flex items-center gap-2 text-xs">
              <span className="text-slate-400">Pet Owner:</span>
              <Link
                to={`/customers/${pet.owner}`}
                className="font-bold text-brand-600 hover:text-brand-700 flex items-center gap-1"
              >
                <User className="w-3.5 h-3.5" />
                <span>{pet.owner_name}</span>
              </Link>
              {pet.owner_phone && (
                <span className="text-slate-400">({pet.owner_phone})</span>
              )}
            </div>
          </div>
        </div>

        {!isAdmin && (
          <button
            onClick={() => setIsEditModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-colors"
          >
            <Edit className="w-4 h-4" />
            <span>Edit Pet Details</span>
          </button>
        )}
      </div>

      {/* Health Alerts & Dietary Tags */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
          <p className="text-[11px] font-bold uppercase tracking-wider text-rose-600 mb-1 flex items-center gap-1">
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Allergies</span>
          </p>
          <p className="text-xs font-semibold text-slate-800">
            {pet.allergies || 'No known allergies reported'}
          </p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
          <p className="text-[11px] font-bold uppercase tracking-wider text-amber-600 mb-1 flex items-center gap-1">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>Medical Conditions</span>
          </p>
          <p className="text-xs font-semibold text-slate-800">
            {pet.medical_conditions || 'None reported'}
          </p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
          <p className="text-[11px] font-bold uppercase tracking-wider text-sky-600 mb-1 flex items-center gap-1">
            <Utensils className="w-3.5 h-3.5" />
            <span>Dietary Routine</span>
          </p>
          <p className="text-xs font-semibold text-slate-800 truncate">
            {pet.dietary_preferences || 'Standard feeding'}
          </p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
          <p className="text-[11px] font-bold uppercase tracking-wider text-brand-600 mb-1 flex items-center gap-1">
            <Dog className="w-3.5 h-3.5" />
            <span>Personality / Temperament</span>
          </p>
          <p className="text-xs font-semibold text-slate-800 truncate">
            {pet.personality_behavior || 'Friendly'}
          </p>
        </div>
      </div>

      {/* Main 2-Column Tabs/Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Vaccinations Module */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Syringe className="w-4 h-4 text-brand-600" />
              <span>Vaccination Records ({vaccinations.length})</span>
            </h3>
            <Link
              to="/vaccinations"
              className="text-xs font-bold text-brand-600 hover:text-brand-700"
            >
              View Registry
            </Link>
          </div>

          <div className="space-y-2.5">
            {vaccinations.map((vax) => (
              <div
                key={vax.id}
                className="p-3.5 rounded-xl border border-slate-200/70 bg-slate-50/40 flex items-center justify-between"
              >
                <div>
                  <p className="text-xs font-bold text-slate-800">{vax.vaccine_name}</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    Given: {vax.vaccination_date} • Expires: {vax.expiry_date}
                  </p>
                  {vax.veterinarian && (
                    <p className="text-[10px] text-slate-400">Administered by {vax.veterinarian}</p>
                  )}
                </div>

                <div className="text-right">
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                      vax.status === 'VALID'
                        ? 'bg-emerald-100 text-emerald-800'
                        : vax.status === 'EXPIRING_SOON'
                        ? 'bg-amber-100 text-amber-800 border border-amber-300'
                        : 'bg-rose-100 text-rose-800 border border-rose-300'
                    }`}
                  >
                    {vax.status === 'VALID' && <CheckCircle2 className="w-3 h-3" />}
                    {vax.status === 'EXPIRING_SOON' && <Clock className="w-3 h-3" />}
                    {vax.status === 'EXPIRED' && <AlertCircle className="w-3 h-3" />}
                    {vax.status}
                  </span>
                  <p className="text-[10px] text-slate-400 mt-1">
                    {vax.days_until_expiry >= 0 ? `${vax.days_until_expiry} days left` : `${Math.abs(vax.days_until_expiry)} days overdue`}
                  </p>
                </div>
              </div>
            ))}
            {vaccinations.length === 0 && (
              <p className="text-xs text-slate-400 py-4 text-center">No vaccination records logged yet.</p>
            )}
          </div>
        </div>

        {/* Medications Module */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Pill className="w-4 h-4 text-sky-600" />
              <span>Medications Tracker ({medications.length})</span>
            </h3>
            <Link to="/medical" className="text-xs font-bold text-sky-600 hover:text-sky-700">
              Manage Medical
            </Link>
          </div>

          <div className="space-y-3">
            {medications.map((med) => (
              <div key={med.id} className="p-3.5 rounded-xl border border-slate-200/70 bg-slate-50/40">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-bold text-slate-800">{med.medicine_name}</p>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        med.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {med.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mt-1">
                      Dosage: <strong>{med.dosage}</strong> • Frequency: {med.frequency}
                    </p>
                    {med.instructions && (
                      <p className="text-[11px] text-slate-500 mt-1 italic">
                        Instructions: "{med.instructions}"
                      </p>
                    )}
                  </div>

                  {isStaff && med.status === 'ACTIVE' && (
                    <button
                      onClick={() => handleAdministerDose(med.id, med.medicine_name)}
                      className="shrink-0 px-3 py-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-xs font-bold shadow-sm transition-colors"
                    >
                      Record Dose
                    </button>
                  )}
                </div>

                {med.administration_logs && med.administration_logs.length > 0 && (
                  <div className="mt-3 pt-2 border-t border-slate-200/60 text-[10px] text-slate-400">
                    Last given on {new Date(med.administration_logs[0].administered_at).toLocaleString()} by {med.administration_logs[0].staff_name}
                  </div>
                )}
              </div>
            ))}
            {medications.length === 0 && (
              <p className="text-xs text-slate-400 py-4 text-center">No ongoing medications required.</p>
            )}
          </div>
        </div>

        {/* Feeding Schedule Module */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Utensils className="w-4 h-4 text-amber-600" />
              <span>Feeding Schedules ({feedingSchedules.length})</span>
            </h3>
          </div>

          <div className="space-y-3">
            {feedingSchedules.map((feed) => (
              <div key={feed.id} className="p-3.5 rounded-xl border border-slate-200/70 bg-slate-50/40 flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-bold text-slate-800">{feed.food_type}</p>
                  <p className="text-xs text-slate-600 mt-1">
                    Portion: <strong>{feed.quantity}</strong> at <strong>{feed.feeding_time}</strong>
                  </p>
                  {feed.special_instructions && (
                    <p className="text-[11px] text-slate-500 mt-0.5">{feed.special_instructions}</p>
                  )}
                  {feed.last_fed_at && (
                    <p className="text-[10px] text-slate-400 mt-1.5">
                      Last fed: {new Date(feed.last_fed_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  )}
                </div>

                {isStaff && (
                  <button
                    onClick={() => handleMarkFed(feed.id, feed.food_type)}
                    className="shrink-0 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-bold shadow-sm transition-colors"
                  >
                    Mark Fed
                  </button>
                )}
              </div>
            ))}
            {feedingSchedules.length === 0 && (
              <p className="text-xs text-slate-400 py-4 text-center">Standard diet applies.</p>
            )}
          </div>
        </div>

        {/* Medical Records Visits History */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Stethoscope className="w-4 h-4 text-emerald-600" />
              <span>Veterinary Medical Visits ({medicalRecords.length})</span>
            </h3>
          </div>

          <div className="divide-y divide-slate-100">
            {medicalRecords.map((rec) => (
              <div key={rec.id} className="py-3 first:pt-0 last:pb-0 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800">{rec.diagnosis}</span>
                  <span className="text-[10px] text-slate-400">{rec.visit_date}</span>
                </div>
                <p className="text-slate-600 mt-1 text-xs">Treatment: {rec.treatment}</p>
                {rec.prescription && (
                  <p className="text-[11px] text-slate-500 mt-0.5">Rx: {rec.prescription}</p>
                )}
                <p className="text-[10px] text-slate-400 mt-1">Vet: {rec.veterinarian}</p>
              </div>
            ))}
            {medicalRecords.length === 0 && (
              <p className="text-xs text-slate-400 py-4 text-center">No past medical illnesses or visit notes.</p>
            )}
          </div>
        </div>
      </div>

      {/* Pet Edit Modal */}
      {isEditModalOpen && (
        <PetModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          pet={pet}
          onSaved={fetchPetData}
        />
      )}
    </div>
  );
};

export default PetDetail;
