import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { useAuth } from './hooks/useAuth';

// Layout
import AppLayout from './layouts/AppLayout';

// Pages
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import CustomerList from './pages/Customers/CustomerList';
import CustomerDetail from './pages/Customers/CustomerDetail';
import PetList from './pages/Pets/PetList';
import PetDetail from './pages/Pets/PetDetail';
import AppointmentList from './pages/Appointments/AppointmentList';
import BoardingList from './pages/Boarding/BoardingList';
import VaccinationList from './pages/Vaccinations/VaccinationList';
import MedicalList from './pages/Medical/MedicalList';
import ServiceList from './pages/Services/ServiceList';
import InvoiceList from './pages/Billing/InvoiceList';
import ReportsPage from './pages/Reports/ReportsPage';
import Profile from './pages/Profile';
import LoadingSpinner from './components/LoadingSpinner';

// Protected Route Wrapper
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <LoadingSpinner size="lg" text="Authenticating session..." />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <Routes>
            {/* Public Landing Page (Pet Care) */}
            <Route path="/" element={<LandingPage />} />

            {/* Public Auth Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Direct App Redirect */}
            <Route path="/app" element={<Navigate to="/dashboard" replace />} />

            {/* Protected CRM Application Routes */}
            <Route
              element={
                <ProtectedRoute>
                  <AppLayout />
                </ProtectedRoute>
              }
            >
              <Route path="/dashboard" element={<Dashboard />} />
              
              {/* Customers */}
              <Route path="/customers" element={<CustomerList />} />
              <Route path="/customers/:id" element={<CustomerDetail />} />

              {/* Pets */}
              <Route path="/pets" element={<PetList />} />
              <Route path="/pets/:id" element={<PetDetail />} />

              {/* Appointments */}
              <Route path="/appointments" element={<AppointmentList />} />

              {/* Boarding */}
              <Route path="/boarding" element={<BoardingList />} />

              {/* Vaccinations */}
              <Route path="/vaccinations" element={<VaccinationList />} />

              {/* Medical & Feeding */}
              <Route path="/medical" element={<MedicalList />} />

              {/* Services */}
              <Route path="/services" element={<ServiceList />} />

              {/* Billing & Invoices */}
              <Route path="/billing" element={<InvoiceList />} />

              {/* Reports */}
              <Route path="/reports" element={<ReportsPage />} />

              {/* Profile */}
              <Route path="/profile" element={<Profile />} />
            </Route>

            {/* Catch-all */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}


export default App;
