import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { customerService } from '../../services/customerService';
import { petService } from '../../services/petService';
import { appointmentService } from '../../services/appointmentService';
import { boardingService } from '../../services/boardingService';
import { billingService } from '../../services/billingService';
import { useToast } from '../../context/ToastContext';
import LoadingSpinner from '../../components/LoadingSpinner';
import CustomerModal from './CustomerModal';
import PetModal from '../Pets/PetModal';
import { useAuth } from '../../hooks/useAuth';
import {
  User,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Dog,
  Clock,
  DollarSign,
  Edit,
  Plus,
  MessageSquare,
  Receipt,
  Home,
  Send,
  AlertCircle
} from 'lucide-react';

export const CustomerDetail = () => {
  const { id } = useParams();
  const { isStaff, isAdmin } = useAuth();
  const { addToast } = useToast();
  const [customer, setCustomer] = useState(null);
  const [pets, setPets] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [boardingBookings, setBoardingBookings] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);

  // New Note Form
  const [newNoteText, setNewNoteText] = useState('');
  const [newNoteType, setNewNoteType] = useState('NOTE');
  const [addingNote, setAddingNote] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddPetModalOpen, setIsAddPetModalOpen] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [custData, petsData, aptsData, brdData, invData, notesData] = await Promise.all([
        customerService.getById(id),
        petService.getAll({ owner: id }),
        appointmentService.getAll({ customer: id }),
        boardingService.getBookings({ customer: id }),
        billingService.getInvoices({ customer: id }),
        customerService.getNotes(id),
      ]);

      setCustomer(custData);
      setPets(Array.isArray(petsData) ? petsData : petsData.results || []);
      setAppointments(Array.isArray(aptsData) ? aptsData : aptsData.results || []);
      setBoardingBookings(Array.isArray(brdData) ? brdData : brdData.results || []);
      setInvoices(Array.isArray(invData) ? invData : invData.results || []);
      setNotes(Array.isArray(notesData) ? notesData : notesData.results || []);
    } catch (err) {
      console.error(err);
      addToast('Failed to load customer profile details', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!newNoteText.trim()) return;
    setAddingNote(true);
    try {
      await customerService.addNote(id, {
        note: newNoteText,
        interaction_type: newNoteType,
      });
      addToast('CRM note recorded in customer history', 'success');
      setNewNoteText('');
      // Refresh notes
      const notesData = await customerService.getNotes(id);
      setNotes(Array.isArray(notesData) ? notesData : notesData.results || []);
    } catch (err) {
      addToast('Failed to add note', 'error');
    } finally {
      setAddingNote(false);
    }
  };

  if (loading) return <LoadingSpinner size="lg" text="Loading Customer 360 profile..." />;
  if (!customer) return <div className="p-8 text-center text-slate-500">Customer not found</div>;

  return (
    <div className="space-y-6">
      {/* Top Header Profile Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-brand-600 to-brand-400 text-white flex items-center justify-center font-black text-2xl shadow-md shadow-brand-500/20">
            {customer.first_name?.[0]}{customer.last_name?.[0]}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black text-slate-900">{customer.full_name}</h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-brand-100 text-brand-800 border border-brand-200">
                {customer.customer_id}
              </span>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                customer.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
              }`}>
                {customer.status}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1 flex items-center gap-4 flex-wrap">
              <span className="flex items-center gap-1"><Mail className="w-3.5 h-3.5" /> {customer.email}</span>
              <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5" /> {customer.phone}</span>
              {customer.city && <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {customer.city}</span>}
              <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> Member since {new Date(customer.registration_date).toLocaleDateString()}</span>
            </p>
          </div>
        </div>

        {!isAdmin && (
          <button
            onClick={() => setIsEditModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-colors"
          >
            <Edit className="w-4 h-4" />
            <span>Edit Profile</span>
          </button>
        )}
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm flex items-center gap-3">
          <div className="p-3 bg-brand-50 text-brand-600 rounded-xl">
            <Dog className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Pets</p>
            <p className="text-xl font-black text-slate-900">{pets.length}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm flex items-center gap-3">
          <div className="p-3 bg-sky-50 text-sky-600 rounded-xl">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Bookings</p>
            <p className="text-xl font-black text-slate-900">{appointments.length + boardingBookings.length}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm flex items-center gap-3">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Spent</p>
            <p className="text-xl font-black text-slate-900">
              ${invoices.filter((i) => i.payment_status === 'PAID').reduce((sum, i) => sum + parseFloat(i.total_amount), 0).toFixed(2)}
            </p>
          </div>
        </div>
      </div>

      {/* Main Grid: Left Details & Right CRM History */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Pets, Appointments, Stays, Invoices */}
        <div className="lg:col-span-2 space-y-6">
          {/* Customer's Pets */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Dog className="w-4 h-4 text-brand-600" />
                <span>Pets Belonging to Customer ({pets.length})</span>
              </h3>
              {!isAdmin && (
                <button
                  type="button"
                  onClick={() => setIsAddPetModalOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold transition-colors shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Pet</span>
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {pets.map((pet) => (
                <Link
                  key={pet.id}
                  to={`/pets/${pet.id}`}
                  className="p-3.5 rounded-xl border border-slate-200/80 hover:border-brand-500 hover:shadow-sm transition-all flex items-center gap-3 bg-slate-50/50"
                >
                  {pet.photo ? (
                    <img src={pet.photo} alt={pet.name} className="w-12 h-12 rounded-xl object-cover border" />
                  ) : (
                    <div className="w-12 h-12 rounded-xl bg-brand-100 text-brand-700 flex items-center justify-center font-bold text-sm">
                      🐾
                    </div>
                  )}
                  <div className="overflow-hidden">
                    <p className="text-xs font-extrabold text-slate-900 truncate">{pet.name}</p>
                    <p className="text-[11px] text-slate-500">{pet.species} • {pet.breed || 'Mixed'}</p>
                    <p className="text-[10px] text-brand-600 font-semibold mt-0.5">{pet.age} old</p>
                  </div>
                </Link>
              ))}
              {pets.length === 0 && (
                <p className="text-xs text-slate-400 col-span-2 py-4 text-center">No pets registered under this owner.</p>
              )}
            </div>
          </div>

          {/* Appointments History */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-sky-600" />
              <span>Service & Grooming Appointments ({appointments.length})</span>
            </h3>
            <div className="divide-y divide-slate-100">
              {appointments.map((apt) => (
                <div key={apt.id} className="py-2.5 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-slate-800">{apt.service_name}</span>
                    <span className="text-slate-500 ml-2">for {apt.pet_name}</span>
                    <p className="text-[10px] text-slate-400 mt-0.5">{apt.date} at {apt.start_time}</p>
                  </div>
                  <div className="text-right">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      apt.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-800' :
                      apt.status === 'CONFIRMED' ? 'bg-sky-100 text-sky-800' : 'bg-slate-100 text-slate-700'
                    }`}>
                      {apt.status}
                    </span>
                    <p className="text-xs font-bold text-slate-800 mt-0.5">${parseFloat(apt.amount).toFixed(2)}</p>
                  </div>
                </div>
              ))}
              {appointments.length === 0 && (
                <p className="text-xs text-slate-400 py-3 text-center">No appointments found.</p>
              )}
            </div>
          </div>

          {/* Invoices History */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
              <Receipt className="w-4 h-4 text-amber-600" />
              <span>Billing & Invoices ({invoices.length})</span>
            </h3>
            <div className="divide-y divide-slate-100">
              {invoices.map((inv) => (
                <div key={inv.id} className="py-2.5 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-slate-800">{inv.invoice_number}</span>
                    <p className="text-[10px] text-slate-400 mt-0.5">Date: {inv.invoice_date} • Due: {inv.due_date}</p>
                  </div>
                  <div className="text-right">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      inv.payment_status === 'PAID' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {inv.payment_status}
                    </span>
                    <p className="text-xs font-extrabold text-slate-900 mt-0.5">${parseFloat(inv.total_amount).toFixed(2)}</p>
                  </div>
                </div>
              ))}
              {invoices.length === 0 && (
                <p className="text-xs text-slate-400 py-3 text-center">No invoices recorded yet.</p>
              )}
            </div>
          </div>
        </div>

        {/* Right 1 Col: CRM Notes & Communication Timeline */}
        <div className="space-y-6">
          {/* Add CRM Note */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-brand-600" />
              <span>Log Communication / Note</span>
            </h3>

            <form onSubmit={handleAddNote} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">
                  Interaction Type
                </label>
                <select
                  value={newNoteType}
                  onChange={(e) => setNewNoteType(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-brand-500/20"
                >
                  <option value="NOTE">General Note</option>
                  <option value="CALL">Phone Call</option>
                  <option value="EMAIL">Email</option>
                  <option value="IN_PERSON">In-Person Conversation</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">
                  Note Details
                </label>
                <textarea
                  rows={3}
                  required
                  value={newNoteText}
                  onChange={(e) => setNewNoteText(e.target.value)}
                  placeholder="Details of client call, preference, instruction..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-brand-500/20"
                />
              </div>

              <button
                type="submit"
                disabled={addingNote}
                className="w-full flex items-center justify-center gap-1.5 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold transition-colors disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{addingNote ? 'Recording...' : 'Record to Timeline'}</span>
              </button>
            </form>
          </div>

          {/* CRM Timeline History */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 mb-3">
              Interaction Timeline ({notes.length})
            </h3>
            <div className="space-y-4">
              {notes.map((n) => (
                <div key={n.id} className="relative pl-5 border-l-2 border-slate-200 text-xs">
                  <div className="absolute -left-[5px] top-1 w-2 h-2 rounded-full bg-brand-500" />
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800 text-[11px] uppercase tracking-wider text-brand-700">
                      {n.interaction_type}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {new Date(n.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-slate-600 mt-1 text-xs">{n.note}</p>
                  {n.author_name && (
                    <p className="text-[10px] text-slate-400 mt-1">Logged by {n.author_name}</p>
                  )}
                </div>
              ))}
              {notes.length === 0 && (
                <p className="text-xs text-slate-400 py-3 text-center">No notes recorded yet.</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Customer Edit Modal */}
      {isEditModalOpen && (
        <CustomerModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          customer={customer}
          onSaved={fetchData}
        />
      )}

      {/* Pet Registration Modal for this Customer */}
      {isAddPetModalOpen && (
        <PetModal
          isOpen={isAddPetModalOpen}
          onClose={() => setIsAddPetModalOpen(false)}
          defaultOwnerId={customer?.id}
          onSaved={fetchData}
        />
      )}
    </div>
  );
};

export default CustomerDetail;
