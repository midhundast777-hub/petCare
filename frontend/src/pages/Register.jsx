import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../context/ToastContext';
import { authService } from '../services/authService';
import { validateEmail, formatPhoneInput } from '../utils/validation';
import {
  Mail,
  Lock,
  Phone,
  ArrowRight,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Sparkles,
  RefreshCw,
  Send,
  Clock,
  ArrowLeft
} from 'lucide-react';

export const Register = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { register, logout } = useAuth();
  const { addToast } = useToast();

  const [formData, setFormData] = useState(() => {
    const initial = {
      email: location.state?.email || '',
      password: '',
      password_confirm: '',
      first_name: '',
      last_name: '',
      phone: location.state?.phone || '',
      role: 'CUSTOMER',
    };
    try {
      const pending = localStorage.getItem('pending_booking');
      if (pending) {
        const parsed = JSON.parse(pending);
        if (!initial.email && parsed.email) initial.email = parsed.email;
        if (!initial.phone && parsed.phone) initial.phone = parsed.phone;
        const nameParts = ((location.state?.ownerName || parsed.ownerName) || '').trim().split(' ');
        initial.first_name = nameParts[0] || '';
        initial.last_name = nameParts.slice(1).join(' ') || '';
      }
    } catch (e) {}
    return initial;
  });

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Post-registration verification pending state
  const [registeredEmail, setRegisteredEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resending, setResending] = useState(false);
  const [existingUnverifiedEmail, setExistingUnverifiedEmail] = useState('');

  // Derived validation states
  const emailValidation = validateEmail(formData.email);
  const phoneDigits = (formData.phone || '').replace(/\D/g, '');

  // Cooldown countdown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const handlePhoneChange = (e) => {
    const formatted = formatPhoneInput(e.target.value);
    setFormData((prev) => ({ ...prev, phone: formatted }));
  };

  const handleEmailChange = (e) => {
    const newEmail = e.target.value;
    setFormData((prev) => ({ ...prev, email: newEmail }));
    if (existingUnverifiedEmail) {
      setExistingUnverifiedEmail('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // 1. Email format validation
    if (!emailValidation.isValid) {
      addToast(emailValidation.error || 'Please enter a valid email address.', 'error');
      return;
    }

    // 2. 10-digit Phone validation
    if (phoneDigits.length !== 10) {
      addToast(
        `Phone number must contain exactly 10 digits (currently ${phoneDigits.length} digits).`,
        'error'
      );
      return;
    }

    // 3. Password match validation
    if (formData.password_confirm && formData.password !== formData.password_confirm) {
      addToast('Passwords do not match. Please verify your password.', 'error');
      return;
    }

    setLoading(true);
    setExistingUnverifiedEmail('');
    try {
      logout(); // Clear any existing session
      const targetEmail = formData.email.trim().toLowerCase();
      const payload = {
        ...formData,
        email: targetEmail,
        phone: phoneDigits,
        password_confirm: formData.password_confirm || formData.password,
      };

      const res = await authService.register(payload);
      setRegisteredEmail(targetEmail);
      setIsSubmitted(true);
      setResendCooldown(60); // 60s cooldown for resend

      addToast(
        'Registration successful! Please check your inbox for the "Yes, It\'s Me" verification email.',
        'success'
      );
    } catch (err) {
      const errorData = err.response?.data;
      let msg = 'Registration failed. Please check inputs.';
      if (!err.response) {
        msg = 'Cannot connect to backend server. Please ensure the Django server is running at http://127.0.0.1:8000.';
      } else if (typeof errorData === 'string') {
        msg = errorData;
      } else if (errorData?.detail) {
        msg = errorData.detail;
      } else if (errorData && typeof errorData === 'object') {
        const firstKey = Object.keys(errorData)[0];
        const val = errorData[firstKey];
        const valStr = Array.isArray(val) ? val.join(', ') : String(val);

        if (firstKey === 'email' && valStr.includes('already exists but is not yet verified')) {
          setExistingUnverifiedEmail(formData.email.trim().toLowerCase());
          msg = valStr;
        } else if (firstKey === 'email' && valStr.toLowerCase().includes('already exists')) {
          msg = 'An account with this email already exists. Please log in.';
        } else {
          msg = `${firstKey}: ${valStr}`;
        }
      }
      addToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async (emailToUse) => {
    const target = emailToUse || registeredEmail || formData.email.trim().toLowerCase();
    if (!target || resendCooldown > 0 || resending) return;

    setResending(true);
    try {
      const res = await authService.resendEmailVerification(target);
      setResendCooldown(60);
      addToast(
        res.detail || 'If an account exists with this email, a verification link has been sent.',
        'success'
      );
    } catch (err) {
      const detail = err.response?.data?.detail || 'Failed to resend verification email.';
      addToast(detail, 'error');
    } finally {
      setResending(false);
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
          {isSubmitted ? 'Verify your email address' : 'Create Pet Owner Account'}
        </h2>
        <p className="mt-1 text-center text-xs text-slate-400">
          {isSubmitted
            ? "Confirm email ownership by clicking 'Yes, It's Me' in your inbox"
            : 'Register to book boarding suites, track daily diaries & medical records'}
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-white py-8 px-6 sm:px-10 shadow-2xl rounded-3xl border border-slate-100">
          
          {/* STATE 1: POST-REGISTRATION VERIFICATION PENDING */}
          {isSubmitted ? (
            <div className="space-y-6 text-center animate-fade-in">
              <div className="relative inline-flex items-center justify-center">
                <div className="w-20 h-20 rounded-3xl bg-teal-50 text-teal-600 flex items-center justify-center border-2 border-teal-200 shadow-sm">
                  <Mail className="w-10 h-10 text-teal-600 animate-bounce" />
                </div>
                <span className="absolute -top-1 -right-1 flex h-5 w-5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-5 w-5 bg-teal-500 border-2 border-white"></span>
                </span>
              </div>

              <div>
                <h3 className="text-xl font-black text-slate-900 tracking-tight">
                  Verification Email Sent
                </h3>
                <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 text-slate-800 rounded-full text-xs font-mono font-bold border border-slate-200">
                  <Mail className="w-3.5 h-3.5 text-slate-500" />
                  <span>{registeredEmail}</span>
                </div>
              </div>

              <div className="bg-teal-50/80 border border-teal-200 rounded-2xl p-4 text-left space-y-2">
                <p className="text-xs text-teal-950 leading-relaxed font-semibold">
                  Welcome! We have sent a verification email to activate your account.
                </p>
                <div className="bg-white/80 rounded-xl p-3 border border-teal-100">
                  <p className="text-[11px] text-teal-900 leading-relaxed">
                    👉 Open the email and click the prominent <span className="font-extrabold text-teal-700 bg-teal-100/70 px-1.5 py-0.5 rounded">[ YES, IT'S ME ]</span> button to confirm your account.
                  </p>
                </div>
                <div className="flex items-center gap-1.5 text-[11px] text-teal-700 font-medium pt-1">
                  <Clock className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                  <span>This verification link will expire in <strong>30 minutes</strong>.</span>
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <button
                  type="button"
                  onClick={() => handleResendVerification(registeredEmail)}
                  disabled={resendCooldown > 0 || resending}
                  className="w-full py-3 px-4 bg-slate-800 hover:bg-slate-900 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${resending ? 'animate-spin' : ''}`} />
                  <span>
                    {resending
                      ? 'Resending verification email...'
                      : resendCooldown > 0
                      ? `Resend verification email (${resendCooldown}s)`
                      : 'Resend verification email'}
                  </span>
                </button>

                <div className="flex items-center justify-between text-xs text-slate-500 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsSubmitted(false);
                      setRegisteredEmail('');
                    }}
                    className="inline-flex items-center gap-1 font-semibold text-slate-600 hover:text-slate-900 cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Change email address</span>
                  </button>
                  <Link
                    to="/login"
                    className="font-bold text-brand-600 hover:text-brand-700"
                  >
                    Go to Sign In →
                  </Link>
                </div>
              </div>
            </div>
          ) : (
            /* STATE 2: REGISTRATION FORM */
            <form className="space-y-4" onSubmit={handleSubmit}>
              
              {/* If an unverified account already exists with this email */}
              {existingUnverifiedEmail && (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3.5 space-y-2 animate-fade-in">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <p className="text-xs text-amber-900 font-semibold leading-relaxed">
                      An account with this email already exists but is not yet verified.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleResendVerification(existingUnverifiedEmail)}
                    disabled={resendCooldown > 0 || resending}
                    className="w-full py-2 px-3 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>
                      {resending
                        ? 'Sending...'
                        : resendCooldown > 0
                        ? `Resend verification email (${resendCooldown}s)`
                        : 'Resend verification email'}
                    </span>
                  </button>
                </div>
              )}

              {/* First & Last Name */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    First Name
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.first_name}
                    onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                    placeholder="Jane"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Last Name
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.last_name}
                    onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                    placeholder="Doe"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 text-slate-800"
                  />
                </div>
              </div>

              {/* Email Address */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                    Email Address <span className="text-rose-500">*</span>
                  </label>
                  {emailValidation.isValid && (
                    <span className="text-[11px] font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-200 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-teal-600" />
                      <span>Valid Email</span>
                    </span>
                  )}
                </div>

                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={handleEmailChange}
                    placeholder="name@gmail.com"
                    className={`w-full pl-10 pr-4 py-2 bg-slate-50 border rounded-xl text-sm focus:outline-none transition-colors text-slate-800 ${
                      !emailValidation.isValid && formData.email
                        ? 'border-rose-300 bg-rose-50/20'
                        : 'border-slate-200 focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500'
                    }`}
                  />
                </div>
                {!emailValidation.isValid && formData.email && (
                  <p className="text-[11px] text-rose-600 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3 text-rose-500" />
                    <span>{emailValidation.error}</span>
                  </p>
                )}
              </div>

              {/* Phone Number (10 Digits) */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                    Phone Number (10 Digits)
                  </label>
                  {phoneDigits.length === 10 ? (
                    <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      ✓ 10 Digits
                    </span>
                  ) : (
                    <span
                      className={`text-[10px] font-bold ${
                        phoneDigits.length > 10 ? 'text-rose-600' : 'text-amber-600'
                      }`}
                    >
                      {phoneDigits.length}/10 digits
                    </span>
                  )}
                </div>

                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    required
                    maxLength={14}
                    value={formData.phone}
                    onChange={handlePhoneChange}
                    placeholder="(555) 012-3456"
                    className={`w-full pl-10 pr-4 py-2 bg-slate-50 border rounded-xl text-sm focus:outline-none transition-colors text-slate-800 ${
                      phoneDigits.length === 10
                        ? 'border-emerald-300 bg-emerald-50/10'
                        : phoneDigits.length > 0
                        ? 'border-amber-300 bg-amber-50/10'
                        : 'border-slate-200 focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500'
                    }`}
                  />
                </div>

                {phoneDigits.length !== 10 && formData.phone ? (
                  <p className="text-[11px] text-amber-700 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3 text-amber-600" />
                    <span>Phone number must have exactly 10 digits ({phoneDigits.length} entered).</span>
                  </p>
                ) : null}
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="At least 6 characters"
                    className="w-full pl-10 pr-10 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 text-slate-800"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none p-1 cursor-pointer"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Password Confirmation */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    value={formData.password_confirm}
                    onChange={(e) => setFormData({ ...formData, password_confirm: e.target.value })}
                    placeholder="Confirm your password"
                    className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 text-slate-800"
                  />
                </div>
              </div>

              {/* Verification Process Notice */}
              <div className="bg-teal-50/70 border border-teal-200 rounded-xl p-3 flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 text-teal-700 shrink-0 mt-0.5" />
                <p className="text-[11px] text-teal-900 leading-relaxed font-medium">
                  After creating your account, a secure verification email with a <span className="font-bold">"Yes, It's Me"</span> button will be sent to activate your account.
                </p>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full mt-3 flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-xl shadow-md text-sm font-bold text-white bg-brand-600 hover:bg-brand-700 cursor-pointer shadow-brand-500/20 disabled:opacity-50 transition-all"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>{loading ? 'Creating account...' : 'Create Account'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

          <div className="mt-5 text-center text-xs text-slate-500 space-y-2">
            <div>
              Already have an account?{' '}
              <Link to="/login" className="font-bold text-brand-600 hover:text-brand-700">
                Sign in here
              </Link>
            </div>
            <div>
              <Link
                to="/"
                className="inline-flex items-center gap-1.5 font-bold text-slate-500 hover:text-slate-800 transition"
              >
                <span>← Back to Public Sanctuary Website</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
