import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../context/ToastContext';
import { Lock, Mail, Shield, Briefcase, HeartHandshake, ArrowRight } from 'lucide-react';

export const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      addToast('Welcome back! Successfully logged in.', 'success');
      navigate('/dashboard');
    } catch (err) {
      addToast(err.response?.data?.detail || 'Invalid email or password', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (demoEmail, demoPassword) => {
    setEmail(demoEmail);
    setPassword(demoPassword);
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
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
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
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all text-slate-800"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-xl shadow-md text-sm font-bold text-white bg-brand-600 hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 transition-colors disabled:opacity-50"
            >
              <span>{loading ? 'Authenticating...' : 'Sign In to Dashboard'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Demo Login Credentials Buttons */}
          <div className="mt-6 pt-5 border-t border-slate-100">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 text-center mb-3">
              One-Click Demo Role Accounts
            </p>
            <div className="grid grid-cols-1 gap-2">
              <button
                type="button"
                onClick={() => handleQuickLogin('admin@petcare.com', 'Admin@123')}
                className="flex items-center justify-between px-3.5 py-2 rounded-xl bg-purple-50 hover:bg-purple-100/80 border border-purple-200 text-left transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <Shield className="w-4 h-4 text-purple-600" />
                  <div>
                    <p className="text-xs font-bold text-purple-900">Admin Account</p>
                    <p className="text-[10px] text-purple-600 font-mono">admin@petcare.com</p>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-purple-700 uppercase bg-white px-2 py-0.5 rounded border border-purple-200">
                  Select
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('staff@petcare.com', 'Staff@123')}
                className="flex items-center justify-between px-3.5 py-2 rounded-xl bg-sky-50 hover:bg-sky-100/80 border border-sky-200 text-left transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <Briefcase className="w-4 h-4 text-sky-600" />
                  <div>
                    <p className="text-xs font-bold text-sky-900">Staff Account (Sarah)</p>
                    <p className="text-[10px] text-sky-600 font-mono">staff@petcare.com</p>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-sky-700 uppercase bg-white px-2 py-0.5 rounded border border-sky-200">
                  Select
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('customer@petcare.com', 'Customer@123')}
                className="flex items-center justify-between px-3.5 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100/80 border border-emerald-200 text-left transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <HeartHandshake className="w-4 h-4 text-emerald-600" />
                  <div>
                    <p className="text-xs font-bold text-emerald-900">Customer Account (Emily)</p>
                    <p className="text-[10px] text-emerald-600 font-mono">customer@petcare.com</p>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-emerald-700 uppercase bg-white px-2 py-0.5 rounded border border-emerald-200">
                  Select
                </span>
              </button>
            </div>
          </div>

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
