import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { authService } from '../services/authService';
import { useToast } from '../context/ToastContext';
import { validateEmail } from '../utils/validation';
import {
  CheckCircle2,
  AlertTriangle,
  Mail,
  ArrowRight,
  RefreshCw,
  Sparkles,
  ShieldCheck,
  Home
} from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';

export const VerifyEmail = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [verifiedEmail, setVerifiedEmail] = useState('');

  // Resend state
  const [resendEmail, setResendEmail] = useState('');
  const [resending, setResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resendSuccessNotice, setResendSuccessNotice] = useState('');

  const searchParams = new URLSearchParams(location.search);
  const token = searchParams.get('token');

  // Cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      setSuccess(false);
      setErrorMessage(
        'This verification link is invalid or has expired. Please request a new verification email.'
      );
      return;
    }

    let isMounted = true;

    const performVerification = async () => {
      setLoading(true);
      try {
        const data = await authService.verifyEmailToken(token);
        if (!isMounted) return;

        setSuccess(true);
        setVerifiedEmail(data.email || '');
        addToast(
          data.message ||
            'Email verified successfully. You can now continue using your account.',
          'success'
        );
      } catch (err) {
        if (!isMounted) return;
        setSuccess(false);
        const detail =
          err.response?.data?.detail ||
          'This verification link is invalid or has expired. Please request a new verification email.';
        setErrorMessage(detail);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    performVerification();

    return () => {
      isMounted = false;
    };
  }, [token]);

  const handleResend = async (e) => {
    e.preventDefault();
    const emailToUse = resendEmail.trim().toLowerCase();
    const valid = validateEmail(emailToUse);

    if (!valid.isValid) {
      addToast(valid.error || 'Please enter a valid email address.', 'error');
      return;
    }

    if (resendCooldown > 0 || resending) return;

    setResending(true);
    setResendSuccessNotice('');
    try {
      const res = await authService.resendEmailVerification(emailToUse);
      setResendCooldown(60);
      const msg =
        res.detail ||
        'If an account exists with this email, a verification link has been sent.';
      setResendSuccessNotice(msg);
      addToast(msg, 'success');
    } catch (err) {
      const detail =
        err.response?.data?.detail ||
        'Failed to resend verification email. Please try again later.';
      addToast(detail, 'error');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-teal-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-teal-600 to-teal-400 flex items-center justify-center text-white shadow-xl shadow-teal-500/25">
            <span className="text-3xl">🐾</span>
          </div>
        </div>
        <h2 className="mt-4 text-center text-2xl sm:text-3xl font-black text-white tracking-tight">
          PetCare Sanctuary
        </h2>
        <p className="mt-1 text-center text-xs text-slate-400">
          Account Verification Portal
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-white py-8 px-6 sm:px-10 shadow-2xl rounded-3xl border border-slate-100">
          
          {/* LOADING STATE */}
          {loading && (
            <div className="py-12 text-center space-y-4">
              <LoadingSpinner size="lg" text="Verifying your email address..." />
              <p className="text-xs text-slate-500">
                Checking single-use security token and activation status...
              </p>
            </div>
          )}

          {/* SUCCESS STATE */}
          {!loading && success && (
            <div className="text-center space-y-5 animate-fade-in py-2">
              <div className="w-18 h-18 rounded-full bg-emerald-100 border-2 border-emerald-500 text-emerald-600 mx-auto flex items-center justify-center shadow-md">
                <CheckCircle2 className="w-10 h-10" />
              </div>

              <div>
                <h3 className="text-2xl font-black text-slate-900 tracking-tight">
                  Email Verified!
                </h3>
                {verifiedEmail && (
                  <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 bg-teal-50 text-teal-800 rounded-full text-xs font-mono font-bold border border-teal-200">
                    <Mail className="w-3.5 h-3.5 text-teal-600" />
                    <span>{verifiedEmail}</span>
                  </div>
                )}
              </div>

              <div className="bg-emerald-50/80 border border-emerald-200 rounded-2xl p-4 text-left">
                <p className="text-sm font-semibold text-emerald-950 leading-relaxed text-center">
                  Email verified successfully. You can now continue using your account.
                </p>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => navigate('/login?verified=true')}
                  className="w-full py-3.5 px-4 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-sm font-bold shadow-lg shadow-teal-600/30 transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Log In to Your Account</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* FAILURE / EXPIRED / INVALID STATE */}
          {!loading && !success && (
            <div className="text-center space-y-5 animate-fade-in py-2">
              <div className="w-18 h-18 rounded-full bg-rose-50 border-2 border-rose-400 text-rose-500 mx-auto flex items-center justify-center shadow-md">
                <AlertTriangle className="w-10 h-10" />
              </div>

              <div>
                <h3 className="text-xl font-black text-slate-900 tracking-tight">
                  Verification Failed
                </h3>
              </div>

              <div className="bg-rose-50/80 border border-rose-200 rounded-2xl p-4 text-left">
                <p className="text-xs font-semibold text-rose-950 leading-relaxed text-center">
                  {errorMessage ||
                    'This verification link is invalid or has expired. Please request a new verification email.'}
                </p>
              </div>

              {/* RESEND VERIFICATION FORM */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-left space-y-3">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Resend verification email
                </label>
                <form onSubmit={handleResend} className="space-y-2">
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      value={resendEmail}
                      onChange={(e) => setResendEmail(e.target.value)}
                      placeholder="Enter your registered email"
                      className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 text-slate-800"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={resendCooldown > 0 || resending}
                    className="w-full py-2.5 px-3 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${resending ? 'animate-spin' : ''}`} />
                    <span>
                      {resending
                        ? 'Sending...'
                        : resendCooldown > 0
                        ? `Resend verification email (${resendCooldown}s)`
                        : 'Resend verification email'}
                    </span>
                  </button>
                </form>

                {resendSuccessNotice && (
                  <p className="text-[11px] font-medium text-teal-800 bg-teal-50 border border-teal-200 rounded-lg p-2 text-center animate-fade-in">
                    {resendSuccessNotice}
                  </p>
                )}
              </div>

              <div className="flex items-center justify-between text-xs text-slate-500 pt-2">
                <Link
                  to="/register"
                  className="font-bold text-slate-600 hover:text-slate-900 transition"
                >
                  ← Back to Register
                </Link>
                <Link
                  to="/login"
                  className="font-bold text-teal-600 hover:text-teal-700 transition"
                >
                  Sign In →
                </Link>
              </div>
            </div>
          )}

          <div className="mt-6 pt-4 border-t border-slate-100 text-center">
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 transition"
            >
              <Home className="w-3.5 h-3.5" />
              <span>Back to Public Sanctuary Website</span>
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
};

export default VerifyEmail;
