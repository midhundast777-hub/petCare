import React, { useState, useEffect } from 'react';
import { medicalService } from '../../services/medicalService';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../hooks/useAuth';
import MedicalRecordModal from './MedicalRecordModal';
import MedicationModal from './MedicationModal';
import FeedingModal from './FeedingModal';
import Modal from '../../components/Modal';
import {
  Stethoscope,
  Pill,
  Utensils,
  Plus,
  CheckCircle2,
  Clock,
  Dog,
  Calendar,
  Trash2,
  Activity,
  Eye
} from 'lucide-react';

export const MedicalList = () => {
  const { isStaff, isAdmin } = useAuth();
  const { addToast } = useToast();
  const [activeTab, setActiveTab] = useState('medications'); // 'medications', 'feeding', 'records'

  const [records, setRecords] = useState([]);
  const [medications, setMedications] = useState([]);
  const [feedingSchedules, setFeedingSchedules] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const [isMedModalOpen, setIsMedModalOpen] = useState(false);
  const [isFeedModalOpen, setIsFeedModalOpen] = useState(false);

  // View Details Modals (Admin & Staff read-only view)
  const [viewingMedication, setViewingMedication] = useState(null);
  const [viewingFeeding, setViewingFeeding] = useState(null);
  const [viewingRecord, setViewingRecord] = useState(null);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [rData, mData, fData] = await Promise.all([
        medicalService.getRecords(),
        medicalService.getMedications(),
        medicalService.getFeedingSchedules(),
      ]);
      setRecords(Array.isArray(rData) ? rData : rData.results || []);
      setMedications(Array.isArray(mData) ? mData : mData.results || []);
      setFeedingSchedules(Array.isArray(fData) ? fData : fData.results || []);
    } catch (err) {
      console.error(err);
      addToast('Failed to load medical records', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const handleAdministerDose = async (id, name) => {
    try {
      await medicalService.logMedicationDose(id, 'Administered scheduled dose');
      addToast(`Recorded medication administration for ${name}`, 'success');
      fetchAll();
    } catch (err) {
      addToast('Failed to record dose', 'error');
    }
  };

  const handleMarkFed = async (id, foodName) => {
    try {
      await medicalService.logFeeding(id, 'All', 'Fed on schedule');
      addToast(`Logged feeding for ${foodName}`, 'success');
      fetchAll();
    } catch (err) {
      addToast('Failed to record feeding', 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Stethoscope className="w-6 h-6 text-brand-600" />
            <span>Medical, Medications & Feeding</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Administer doses, log daily meals, and document veterinary treatments
          </p>
        </div>

        {/* Tab-specific action button - Staff Only */}
        {!isAdmin && isStaff && (
          <div className="flex items-center gap-2">
            {activeTab === 'medications' && (
              <button
                onClick={() => setIsMedModalOpen(true)}
                className="flex items-center gap-1.5 px-4 py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold shadow-sm transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Add Medication</span>
              </button>
            )}

            {activeTab === 'feeding' && (
              <button
                onClick={() => setIsFeedModalOpen(true)}
                className="flex items-center gap-1.5 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold shadow-sm transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Add Feeding Schedule</span>
              </button>
            )}

            {activeTab === 'records' && (
              <button
                onClick={() => setIsRecordModalOpen(true)}
                className="flex items-center gap-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>New Medical Visit</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab('medications')}
          className={`flex items-center gap-2 px-5 py-3 text-xs font-bold border-b-2 transition-all ${
            activeTab === 'medications'
              ? 'border-sky-600 text-sky-700 bg-sky-50/50'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Pill className="w-4 h-4" />
          <span>Active Medications ({medications.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('feeding')}
          className={`flex items-center gap-2 px-5 py-3 text-xs font-bold border-b-2 transition-all ${
            activeTab === 'feeding'
              ? 'border-amber-500 text-amber-700 bg-amber-50/50'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Utensils className="w-4 h-4" />
          <span>Daily Feeding Schedules ({feedingSchedules.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('records')}
          className={`flex items-center gap-2 px-5 py-3 text-xs font-bold border-b-2 transition-all ${
            activeTab === 'records'
              ? 'border-emerald-600 text-emerald-700 bg-emerald-50/50'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Stethoscope className="w-4 h-4" />
          <span>Veterinary Visits History ({records.length})</span>
        </button>
      </div>

      {/* Tab 1: Medications */}
      {activeTab === 'medications' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {medications.map((med) => (
            <div key={med.id} className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 text-sm">{med.medicine_name}</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                  med.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                }`}>
                  {med.status}
                </span>
              </div>

              <div className="text-xs space-y-1">
                <p className="text-slate-600">
                  Pet Patient: <strong className="text-slate-900">{med.pet_name}</strong> ({med.pet_species})
                </p>
                <p className="text-slate-600">
                  Dosage: <strong>{med.dosage}</strong>
                </p>
                <p className="text-slate-600">
                  Frequency: <strong>{med.frequency}</strong>
                </p>
                {med.instructions && (
                  <p className="text-[11px] text-slate-500 italic pt-1">
                    "{med.instructions}"
                  </p>
                )}
              </div>

              {/* Administration History & Quick Action */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2 flex-wrap">
                <button
                  onClick={() => setViewingMedication(med)}
                  className="flex items-center gap-1 px-2.5 py-1 bg-sky-50 hover:bg-sky-100 text-sky-700 rounded-lg text-xs font-bold transition-colors shadow-xs"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>View Details</span>
                </button>

                {!isAdmin && isStaff && med.status === 'ACTIVE' && (
                  <button
                    onClick={() => handleAdministerDose(med.id, med.medicine_name)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold shadow-sm transition-colors"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Give Dose</span>
                  </button>
                )}
              </div>
            </div>
          ))}
          {medications.length === 0 && (
            <div className="col-span-full py-12 text-center text-slate-400">
              No active pet medications logged.
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Feeding Schedules */}
      {activeTab === 'feeding' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {feedingSchedules.map((feed) => (
            <div key={feed.id} className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 text-sm">{feed.food_type}</span>
                <span className="p-2 rounded-xl bg-amber-50 text-amber-600">
                  <Utensils className="w-4 h-4" />
                </span>
              </div>

              <div className="text-xs space-y-1">
                <p className="text-slate-600">
                  Pet Patient: <strong className="text-slate-900">{feed.pet_name}</strong>
                </p>
                <p className="text-slate-600">
                  Portion: <strong>{feed.quantity}</strong>
                </p>
                <p className="text-slate-600">
                  Scheduled Time: <strong>{feed.feeding_time}</strong>
                </p>
                {feed.special_instructions && (
                  <p className="text-[11px] text-slate-500 italic pt-1">
                    "{feed.special_instructions}"
                  </p>
                )}
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2 flex-wrap">
                <button
                  onClick={() => setViewingFeeding(feed)}
                  className="flex items-center gap-1 px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-lg text-xs font-bold transition-colors shadow-xs"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>View Schedule</span>
                </button>

                {!isAdmin && isStaff && (
                  <button
                    onClick={() => handleMarkFed(feed.id, feed.food_type)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold shadow-sm transition-colors"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Record Meal Fed</span>
                  </button>
                )}
              </div>
            </div>
          ))}
          {feedingSchedules.length === 0 && (
            <div className="col-span-full py-12 text-center text-slate-400">
              No feeding schedules recorded.
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Veterinary Medical History */}
      {activeTab === 'records' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="divide-y divide-slate-100">
            {records.map((rec) => (
              <div key={rec.id} className="p-5 hover:bg-slate-50/50 transition-colors flex flex-col sm:flex-row justify-between items-start gap-4">
                <div>
                  <div className="flex items-center gap-2.5">
                    <span className="font-bold text-slate-900 text-sm">{rec.diagnosis}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-brand-100 text-brand-800">
                      {rec.pet_name}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1">
                    <strong>Treatment:</strong> {rec.treatment}
                  </p>
                  {rec.prescription && (
                    <p className="text-xs text-slate-500 mt-0.5">
                      <strong>Rx / Home Care:</strong> {rec.prescription}
                    </p>
                  )}
                  <p className="text-[11px] text-slate-400 mt-2">
                    Attending Vet: {rec.veterinarian} • Owner: {rec.owner_name}
                  </p>
                </div>

                <div className="flex flex-col sm:items-end justify-between gap-2 shrink-0">
                  <span className="text-xs font-bold text-slate-700">{rec.visit_date}</span>
                  <button
                    onClick={() => setViewingRecord(rec)}
                    className="flex items-center gap-1 px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-lg text-xs font-bold transition-colors shadow-xs"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>View Record</span>
                  </button>
                </div>
              </div>
            ))}
            {records.length === 0 && (
              <div className="py-12 text-center text-slate-400 text-xs">
                No past veterinary medical records found.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modals */}
      {isMedModalOpen && (
        <MedicationModal
          isOpen={isMedModalOpen}
          onClose={() => setIsMedModalOpen(false)}
          onSaved={fetchAll}
        />
      )}

      {isFeedModalOpen && (
        <FeedingModal
          isOpen={isFeedModalOpen}
          onClose={() => setIsFeedModalOpen(false)}
          onSaved={fetchAll}
        />
      )}

      {isRecordModalOpen && (
        <MedicalRecordModal
          isOpen={isRecordModalOpen}
          onClose={() => setIsRecordModalOpen(false)}
          onSaved={fetchAll}
        />
      )}

      {/* View Medication Details Modal */}
      {viewingMedication && (
        <Modal
          isOpen={!!viewingMedication}
          onClose={() => setViewingMedication(null)}
          title={`Medication Details: ${viewingMedication.medicine_name || ''}`}
          subtitle="Prescription dosage, administration instructions & logs"
          maxWidth="max-w-lg"
        >
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Status</p>
                <span className={`inline-block mt-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                  viewingMedication.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                }`}>
                  {viewingMedication.status}
                </span>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Dosage & Frequency</p>
                <p className="text-sm font-bold text-slate-900 mt-1">{viewingMedication.dosage} • {viewingMedication.frequency}</p>
              </div>
            </div>

            <div className="p-3.5 bg-white rounded-xl border border-slate-200 space-y-1">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Pet Patient</p>
              <p className="font-bold text-slate-900 text-sm">{viewingMedication.pet_name} ({viewingMedication.pet_species})</p>
            </div>

            {viewingMedication.instructions && (
              <div className="p-3.5 bg-sky-50/60 rounded-xl border border-sky-200 space-y-1">
                <p className="text-[10px] font-bold text-sky-900 uppercase tracking-wider">Veterinary Instructions</p>
                <p className="text-slate-700">{viewingMedication.instructions}</p>
              </div>
            )}

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setViewingMedication(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* View Feeding Schedule Modal */}
      {viewingFeeding && (
        <Modal
          isOpen={!!viewingFeeding}
          onClose={() => setViewingFeeding(null)}
          title={`Feeding Schedule: ${viewingFeeding.pet_name || ''}`}
          subtitle="Daily meal schedule, diet type, and special portion instructions"
          maxWidth="max-w-lg"
        >
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Diet / Food Type</p>
                <p className="text-sm font-bold text-slate-900 mt-1">{viewingFeeding.food_type}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Portion & Time</p>
                <p className="text-sm font-bold text-slate-900 mt-1">{viewingFeeding.quantity} at {viewingFeeding.feeding_time}</p>
              </div>
            </div>

            <div className="p-3.5 bg-white rounded-xl border border-slate-200 space-y-1">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Last Feeding Status</p>
              <p className="font-semibold text-slate-800">
                {viewingFeeding.last_fed_at ? `Last fed at ${new Date(viewingFeeding.last_fed_at).toLocaleString()}` : 'No feeding recorded today yet'}
              </p>
            </div>

            {viewingFeeding.special_instructions && (
              <div className="p-3.5 bg-amber-50/60 rounded-xl border border-amber-200 space-y-1">
                <p className="text-[10px] font-bold text-amber-900 uppercase tracking-wider">Special Dietary Instructions</p>
                <p className="text-slate-700">{viewingFeeding.special_instructions}</p>
              </div>
            )}

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setViewingFeeding(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* View Veterinary Record Modal */}
      {viewingRecord && (
        <Modal
          isOpen={!!viewingRecord}
          onClose={() => setViewingRecord(null)}
          title={`Veterinary Record: ${viewingRecord.diagnosis || 'Clinical Examination'}`}
          subtitle={`Pet: ${viewingRecord.pet_name || ''} • Visit Date: ${viewingRecord.visit_date || ''}`}
          maxWidth="max-w-xl"
        >
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Pet Patient</p>
                <p className="font-bold text-slate-900 mt-1">{viewingRecord.pet_name}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Attending Veterinarian</p>
                <p className="font-bold text-slate-900 mt-1">{viewingRecord.veterinarian}</p>
              </div>
            </div>

            <div className="p-3.5 bg-white rounded-xl border border-slate-200 space-y-1">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Clinical Diagnosis</p>
              <p className="font-bold text-slate-900 text-sm">{viewingRecord.diagnosis}</p>
            </div>

            <div className="p-3.5 bg-white rounded-xl border border-slate-200 space-y-1">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Treatment Administered</p>
              <p className="text-slate-700">{viewingRecord.treatment}</p>
            </div>

            {viewingRecord.prescription && (
              <div className="p-3.5 bg-emerald-50/60 rounded-xl border border-emerald-200 space-y-1">
                <p className="text-[10px] font-bold text-emerald-900 uppercase tracking-wider">Prescription & Home Care</p>
                <p className="text-slate-700">{viewingRecord.prescription}</p>
              </div>
            )}

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setViewingRecord(null)}
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

export default MedicalList;
