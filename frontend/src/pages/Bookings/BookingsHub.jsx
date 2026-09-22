import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Calendar, Home, UserPlus } from 'lucide-react';
import { AppointmentList } from '../Appointments/AppointmentList';
import { BoardingList } from '../Boarding/BoardingList';
import { OfflinePetModal } from '../Pets/OfflinePetModal';
import { useAuth } from '../../hooks/useAuth';

export const BookingsHub = ({ initialTab = 'appointments' }) => {
  const { isAdmin, isStaff } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Determine initial active tab based on prop or pathname / query param
  const getInitialTab = () => {
    const params = new URLSearchParams(location.search);
    if (params.get('tab') === 'boarding' || location.pathname.includes('/boarding')) {
      return 'boarding';
    }
    if (params.get('tab') === 'appointments' || location.pathname.includes('/appointments')) {
      return 'appointments';
    }
    return initialTab;
  };

  const [activeTab, setActiveTab] = useState(getInitialTab);
  const [isOfflinePetModalOpen, setIsOfflinePetModalOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // Sync tab if URL changes
  useEffect(() => {
    const tabFromUrl = getInitialTab();
    setActiveTab(tabFromUrl);
  }, [location.pathname, location.search]);

  const handleTabSwitch = (tab) => {
    setActiveTab(tab);
    navigate(`/bookings?tab=${tab}`, { replace: true });
  };

  return (
    <div className="space-y-6">
      {/* Unified Main Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-brand-600 to-brand-400 flex items-center justify-center text-white text-2xl shadow-md shadow-brand-500/20 shrink-0">
            🐾
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <span>Bookings & Boarding</span>
            </h1>
            <p className="text-xs text-slate-500 mt-1 max-w-xl">
              Unified management for pet clinic visits, day appointments, and overnight kennel stays.
            </p>
          </div>
        </div>

        {/* Staff & Admin Offline Pet Registration Button */}
        {(isAdmin || isStaff) && (
          <button
            onClick={() => setIsOfflinePetModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all hover:shadow-md cursor-pointer shrink-0"
          >
            <UserPlus className="w-4 h-4" />
            <span>Register Offline Pet</span>
          </button>
        )}
      </div>

      {/* Tabs Switcher */}
      <div className="flex items-center gap-2 p-1.5 bg-slate-200/70 rounded-2xl w-fit">
        <button
          onClick={() => handleTabSwitch('appointments')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'appointments'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Calendar className={`w-4 h-4 ${activeTab === 'appointments' ? 'text-brand-600' : 'text-slate-500'}`} />
          <span>Appointments & Day Visits</span>
        </button>

        <button
          onClick={() => handleTabSwitch('boarding')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'boarding'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Home className={`w-4 h-4 ${activeTab === 'boarding' ? 'text-emerald-600' : 'text-slate-500'}`} />
          <span>Boarding Stays & Kennels</span>
        </button>
      </div>

      {/* Active Tab View */}
      <div key={refreshKey}>
        {activeTab === 'appointments' ? (
          <AppointmentList isEmbedded={true} />
        ) : (
          <BoardingList isEmbedded={true} />
        )}
      </div>

      {/* Offline Pet Registration Modal for Staff & Admin */}
      {(isAdmin || isStaff) && (
        <OfflinePetModal
          isOpen={isOfflinePetModalOpen}
          onClose={() => setIsOfflinePetModalOpen(false)}
          onSaved={() => setRefreshKey((k) => k + 1)}
        />
      )}
    </div>
  );
};

export default BookingsHub;
