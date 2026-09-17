import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../context/ToastContext';
import { Lock, Mail, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { boardingService } from '../services/boardingService';

export const Login = () => {
  const location = useLocation();
  const [identifier, setIdentifier] = useState(() => {
    if (location.state?.identifier) return location.state.identifier;
    if (location.state?.email) return location.state.email;
    if (location.state?.phone) return location.state.phone;
    try {
      const pending = localStorage.getItem('pending_booking');
      if (pending) {
        const parsed = JSON.parse(pending);
        return parsed.email || parsed.phone || '';
      }
    } catch (e) {}
    return '';
  });
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(identifier, password);
      addToast('Welcome back! Successfully logged in.', 'success');

      // Process pending booking if user submitted before registering/logging in
      const pendingStr = localStorage.getItem('pending_booking');
      if (pendingStr) {
        try {
          const pending = JSON.parse(pendingStr);
          await boardingService.createBooking({
            dogName: pending.dogName,
            breedSize: pending.breedSize,
            check_in_date: pending.dropOffDate,
            expected_check_out_date: pending.pickUpDate || pending.dropOffDate,
            special_instructions: pending.note || '',
            emergency_contact: pending.phone || '',
            package: 'STANDARD',
          });
          localStorage.removeItem('pending_booking');
          addToast('Booking request submitted to admin and staff!', 'success');
          navigate('/profile');
          return;
        } catch (bookingErr) {
          console.error('Auto booking submission error:', bookingErr);
          localStorage.removeItem('pending_booking');
          navigate('/profile');
          return;
        }
      }

      navigate('/dashboard');
    } catch (err) {
      addToast(err.response?.data?.detail || 'Invalid email/phone or password', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-brand-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-brand-600 to-brand-400 flex items-center justify-center text-white shadow-xl shadow-brand-500/25">
            <span className="text-3xl">🐾</span>
          </div>
        </div>
        <h2 className="mt-4 text-center text-2xl sm:text-3xl font-black text-white tracking-tight">
          PET CARE <span className="text-brand-400">CRM</span>
        </h2>
        <p className="mt-1 text-center text-xs text-slate-400">
          Commercial Pet Care & Sanctuary Management System
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-white py-8 px-6 sm:px-10 shadow-2xl rounded-3xl border border-slate-100">
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Email Address or Phone
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="name@example.com or Phone number"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all text-slate-800"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all text-slate-800"
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

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-xl shadow-md text-sm font-bold text-white bg-brand-600 hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 transition-colors disabled:opacity-50"
            >
              <span>{loading ? 'Authenticating...' : 'Sign in'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="mt-5 text-center text-xs text-slate-500 space-y-2">
            <div>
              Don't have an account?{' '}
              <Link to="/register" className="font-bold text-brand-600 hover:text-brand-700">
                Register here
              </Link>
            </div>
            <div>
              <Link to="/" className="inline-flex items-center gap-1.5 font-bold text-slate-500 hover:text-slate-800 transition">
                <span>← Back to Public Sanctuary Website</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};

export default Login;
