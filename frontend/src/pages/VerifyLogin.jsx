import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { authService } from '../services/authService';
import { useAuth } from '../hooks/useAuth';
import { CheckCircle2, ShieldCheck, ArrowRight, AlertCircle, Loader2 } from 'lucide-react';

export const VerifyLogin = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();
  const { setUser } = useAuth();

  const [loading, setLoading] = useState(true);
  const [verifiedData, setVerifiedData] = useState(null);
  const [error, setError] = useState('');
  const [countdown, setCountdown] = useState(4);

  useEffect(() => {
    if (!token) {
      setError('No verification token provided in URL. Please click the link directly from your confirmation email.');
      setLoading(false);
      return;
    }

    let isMounted = true;

    const performVerification = async () => {
      try {
        const res = await authService.approveLogin(token);
        if (!isMounted) return;

        setVerifiedData(res);
        if (res.user && setUser) {
          setUser(res.user);
        }
      } catch (err) {
        if (!isMounted) return;
        const msg = err.response?.data?.detail || 'This confirmation link is invalid or has expired. Please sign in again to receive a fresh email.';
        setError(msg);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    performVerification();

    return () => {
      isMounted = false;
    };
  }, [token, setUser]);

  // Auto-redirect timer once verified
  useEffect(() => {
    if (!verifiedData) return;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          navigate('/dashboard');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [verifiedData, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-brand-950 flex flex-col justify-center items-center p-4 sm:p-6">
      <div className="w-full max-w-lg">
        {/* Brand header */}
        <div className="text-center mb-6">
          <div className="inline-flex w-16 h-16 rounded-2xl bg-gradient-to-tr from-brand-600 to-brand-400 items-center justify-center text-white shadow-xl shadow-brand-500/25 mb-3">
            <span className="text-3xl">🐾</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            PET CARE <span className="text-brand-400">SANCTUARY</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">Secure Sign-In Verification</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 p-8 sm:p-10 relative overflow-hidden">
          {loading && (
            <div className="py-12 text-center space-y-4">
              <div className="w-16 h-16 mx-auto rounded-full bg-brand-50 flex items-center justify-center text-brand-600">
                <Loader2 className="w-8 h-8 animate-spin" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Verifying Your Sign-In</h3>
                <p className="text-xs text-slate-500 mt-1">Confirming 'Yes, it's me' security token with PetCare...</p>
              </div>
            </div>
          )}

          {!loading && verifiedData && (
            <div className="text-center space-y-6">
              {/* Big Success Badge */}
              <div className="relative inline-flex items-center justify-center">
                <div className="w-20 h-20 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                  <CheckCircle2 className="w-12 h-12" />
                </div>
                <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-1 shadow-sm">
                  <ShieldCheck className="w-5 h-5 text-emerald-600" />
                </div>
              </div>

              <div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-200 mb-2">
                  <span>✅ "Yes, it's me" Confirmed</span>
                </div>
                <h3 className="text-2xl font-black text-slate-900 tracking-tight">
                  Identity Verified Successfully!
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 mt-2 max-w-sm mx-auto leading-relaxed">
                  Your sign-in request has been approved. You are now securely authenticated and logged in to PetCare.
                </p>
              </div>

              {/* Verified Account Details Card */}
              {verifiedData.user && (
                <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 text-left space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400 font-bold uppercase tracking-wider">Signed In As</span>
                    <span className="font-bold text-slate-800">
                      {verifiedData.user.full_name || verifiedData.user.email}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400 font-bold uppercase tracking-wider">Verified Email</span>
                    <span className="font-mono font-bold text-brand-700 bg-brand-50 px-2 py-0.5 rounded-md border border-brand-200">
                      {verifiedData.user.email}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400 font-bold uppercase tracking-wider">Role</span>
                    <span className="font-bold uppercase text-slate-700 bg-slate-200 px-2 py-0.5 rounded-md text-[11px]">
                      {verifiedData.user.role}
                    </span>
                  </div>
                </div>
              )}

              {/* Action Button */}
              <div className="space-y-3 pt-2">
                <button
                  type="button"
                  onClick={() => navigate('/dashboard')}
                  className="w-full flex items-center justify-center gap-2 py-3.5 px-4 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-xl shadow-lg shadow-brand-600/30 transition-all cursor-pointer text-sm"
                >
                  <span>Continue to Dashboard</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
                <p className="text-[11px] text-slate-400">
                  Redirecting automatically in <span className="font-bold text-slate-700">{countdown}s</span>...
                </p>
              </div>
            </div>
          )}

          {!loading && error && (
            <div className="text-center space-y-5">
              <div className="w-16 h-16 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto shadow-md shadow-rose-500/10">
                <AlertCircle className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-900 tracking-tight">Verification Failed</h3>
                <p className="text-xs text-rose-600 mt-2 bg-rose-50 border border-rose-200 p-3 rounded-xl max-w-sm mx-auto">
                  {error}
                </p>
              </div>
              <div className="pt-2">
                <Link
                  to="/login"
                  className="inline-flex items-center justify-center gap-2 py-2.5 px-5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow transition"
                >
                  <span>Back to Login</span>
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VerifyLogin;
