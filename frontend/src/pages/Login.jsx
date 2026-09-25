import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../context/ToastContext';
import { Lock, Mail, ArrowRight, Eye, EyeOff, CheckCircle2, AlertCircle, ShieldCheck, ExternalLink, RefreshCw, Sparkles, Bell, BellRing } from 'lucide-react';
import { boardingService } from '../services/boardingService';
import { authService } from '../services/authService';

export const Login = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { login, setUser } = useAuth();
  const { addToast } = useToast();

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

  // Verification state: 'FORM' | 'WAITING_GMAIL' | 'VERIFIED_SUCCESS'
  const [stage, setStage] = useState('FORM');
  const [sessionToken, setSessionToken] = useState('');
  const [verifiedEmail, setVerifiedEmail] = useState('');
  const [verifyUrl, setVerifyUrl] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resending, setResending] = useState(false);
  const [verifiedUser, setVerifiedUser] = useState(null);
  const [pendingVerificationEmail, setPendingVerificationEmail] = useState('');
  const [resendRegCooldown, setResendRegCooldown] = useState(0);
  const [resendingReg, setResendingReg] = useState(false);

  // Read ?verified=true from query string
  const isEmailVerifiedQuery = new URLSearchParams(location.search).get('verified') === 'true';

  useEffect(() => {
    if (resendRegCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendRegCooldown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendRegCooldown]);

  const handleResendRegistrationEmail = async () => {
    if (!pendingVerificationEmail || resendRegCooldown > 0 || resendingReg) return;
    setResendingReg(true);
    try {
      await authService.resendEmailVerification(pendingVerificationEmail);
      setResendRegCooldown(60);
      addToast('If an account exists with this email, a verification link has been sent.', 'success');
    } catch (err) {
      addToast(err.response?.data?.detail || 'Failed to resend verification email.', 'error');
    } finally {
      setResendingReg(false);
    }
  };

  const [desktopNotifPermission, setDesktopNotifPermission] = useState(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      return Notification.permission;
    }
    return 'denied';
  });

  const pollingRef = useRef(null);

  // Play realistic notification sound chime via Web Audio API
  const playNotificationChime = () => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const now = ctx.currentTime;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, now); // D5
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.12); // A5

      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.4);
    } catch (e) {
      console.log('Audio chime not allowed yet:', e);
    }
  };

  // Trigger Windows Native Push Notification
  const triggerNativeDesktopNotification = async (targetEmail, tokenToUse) => {
    playNotificationChime();

    if ('Notification' in window) {
      let perm = Notification.permission;
      if (perm === 'default') {
        try {
          perm = await Notification.requestPermission();
          setDesktopNotifPermission(perm);
        } catch (e) {}
      }

      if (perm === 'granted') {
        try {
          const notif = new Notification("🔔 PetCare Security: Sign-In Attempt", {
            body: `Did you just sign in to ${targetEmail}?\n👉 Click here: "Yes, it's me"`,
            icon: 'https://cdn-icons-png.flaticon.com/512/281/281769.png',
            requireInteraction: true,
            tag: 'petcare-signin-confirmation',
          });

          notif.onclick = () => {
            window.focus();
            handleDirectApprove(tokenToUse);
            notif.close();
          };
        } catch (e) {
          console.warn('Native notification dispatch error:', e);
        }
      }
    }
  };

  // Complete sign-in navigation and pending booking handler
  const completeLoginFlow = async (userData) => {
    addToast("Identity verified with 'Yes, it's me'! Welcome back.", 'success');

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
  };

  // Poll backend while waiting for user to click "Yes, it's me" in Gmail
  useEffect(() => {
    if (stage !== 'WAITING_GMAIL' || !sessionToken) return;

    pollingRef.current = setInterval(async () => {
      try {
        const res = await authService.checkLoginStatus(sessionToken);
        if (res.status === 'APPROVED' && res.user) {
          clearInterval(pollingRef.current);
          setVerifiedUser(res.user);
          if (setUser) setUser(res.user);
          setStage('VERIFIED_SUCCESS');

          setTimeout(() => {
            completeLoginFlow(res.user);
          }, 2000);
        } else if (res.status === 'EXPIRED') {
          clearInterval(pollingRef.current);
          addToast('Verification session expired. Please sign in again.', 'error');
          setStage('FORM');
        }
      } catch (err) {
        // Continue polling silently
      }
    }, 1500);

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [stage, sessionToken]);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await login(identifier, password);

      if (res?.require_verification) {
        setSessionToken(res.session_token);
        setVerifiedEmail(res.email);
        setVerifyUrl(res.verify_url);
        setStage('WAITING_GMAIL');
        setResendCooldown(30);

        // Fire native desktop notification and sound chime
        await triggerNativeDesktopNotification(res.email, res.session_token);
        addToast(`Notification dispatched for ${res.email}! Click 'Yes, it's me'`, 'info');
      } else if (res?.user || res?.access) {
        addToast('Welcome back! Successfully logged in.', 'success');
        navigate('/dashboard');
      }
    } catch (err) {
      if (!err.response) {
        addToast('Cannot connect to backend server. Please ensure the Django server is running at http://127.0.0.1:8000.', 'error');
      } else {
        const errorData = err.response?.data;
        if (errorData?.requires_email_verification) {
          setPendingVerificationEmail(errorData.email || identifier);
        }
        addToast(errorData?.detail || 'Invalid email/phone or password', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResendEmail = async () => {
    if (resendCooldown > 0 || resending || !sessionToken) return;
    setResending(true);
    try {
      const res = await authService.resendLoginEmail(sessionToken);
      addToast(res.message || 'Fresh notification dispatched for your Gmail!', 'success');
      setResendCooldown(30);
      triggerNativeDesktopNotification(verifiedEmail, sessionToken);
    } catch (err) {
      addToast(err.response?.data?.detail || 'Failed to resend confirmation.', 'error');
    } finally {
      setResending(false);
    }
  };

  // Direct approval (invoked by clicking "Yes, it's me" on notification or button)
  const handleDirectApprove = async (overrideToken) => {
    const t = overrideToken || sessionToken;
    if (!t) return;
    setLoading(true);
    try {
      const res = await authService.approveLogin(t);
      if (res.user) {
        setVerifiedUser(res.user);
        if (setUser) setUser(res.user);
        setStage('VERIFIED_SUCCESS');
        setTimeout(() => {
          completeLoginFlow(res.user);
        }, 1800);
      }
    } catch (err) {
      addToast(err.response?.data?.detail || 'Verification error.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleRequestNotifPermission = async () => {
    if ('Notification' in window) {
      try {
        const perm = await Notification.requestPermission();
        setDesktopNotifPermission(perm);
        if (perm === 'granted') {
          playNotificationChime();
          new Notification("🐾 PetCare Sanctuary", {
            body: "Desktop notifications enabled! You'll receive real-time 'Yes, it's me' alerts.",
            icon: 'https://cdn-icons-png.flaticon.com/512/281/281769.png'
          });
          addToast('Desktop notifications successfully enabled!', 'success');
        }
      } catch (e) {
        console.error(e);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-brand-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative">

      {/* FLOATING DESKTOP GMAIL NOTIFICATION BANNER (Arrives like Windows OS Notification) */}
      {stage === 'WAITING_GMAIL' && (
        <div className="fixed top-5 right-5 z-50 max-w-sm w-[90%] sm:w-96 animate-bounce-short">
          <div className="bg-slate-900/95 backdrop-blur-md text-white p-4 sm:p-5 rounded-2xl shadow-2xl border-2 border-emerald-500/80 space-y-3 ring-4 ring-emerald-500/20">
            <div className="flex items-center justify-between text-xs border-b border-slate-800 pb-2">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-md bg-rose-500 flex items-center justify-center text-[10px] font-black text-white shadow">
                  M
                </span>
                <span className="font-bold text-slate-200">Gmail • Security Notification</span>
              </div>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-800">
                Arrived Just Now
              </span>
            </div>

            <div className="space-y-1">
              <div className="text-sm font-black text-white flex items-center gap-1.5">
                <BellRing className="w-4 h-4 text-emerald-400 animate-pulse" />
                <span>Did you just try to sign in?</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Sign-in request for <span className="font-mono text-brand-300 font-bold">{verifiedEmail}</span>. Confirm your identity to continue:
              </p>
            </div>

            {/* Prominent Action Button: "Yes, it's me" */}
            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => handleDirectApprove()}
                className="flex-1 py-2.5 px-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-black text-xs rounded-xl shadow-lg shadow-emerald-500/30 transition-all flex items-center justify-center gap-1.5 cursor-pointer transform hover:scale-[1.02] active:scale-95"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Yes, it's me</span>
              </button>
              <button
                type="button"
                onClick={() => setStage('FORM')}
                className="py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white font-bold text-xs rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Container */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-brand-600 to-brand-400 flex items-center justify-center text-white shadow-xl shadow-brand-500/25">
            <span className="text-3xl">🐾</span>
          </div>
        </div>
        <h2 className="mt-4 text-center text-2xl sm:text-3xl font-black text-white tracking-tight">
          PET CARE <span className="text-brand-400">SANCTUARY</span>
        </h2>
        <p className="mt-1 text-center text-xs text-slate-400">
          Commercial Pet Care & Sanctuary Management System
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-white py-8 px-6 sm:px-10 shadow-2xl rounded-3xl border border-slate-100 relative overflow-hidden">

          {/* STAGE 1: Standard Login Form */}
          {stage === 'FORM' && (
            <>
              {isEmailVerifiedQuery && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3.5 flex items-start gap-2.5 text-xs text-emerald-800 font-semibold mb-4 animate-fade-in">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold">Email verified successfully!</p>
                    <p className="text-[11px] text-emerald-700 font-normal">You can now continue using your account.</p>
                  </div>
                </div>
              )}

              {pendingVerificationEmail && (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-xs text-amber-900 space-y-2 mb-4 animate-fade-in text-left">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-amber-900">Email verification required</p>
                      <p className="text-[11px] text-amber-800 leading-relaxed mt-0.5">
                        Please click <strong>"Yes, It's Me"</strong> in the verification email sent to <strong>{pendingVerificationEmail}</strong> to activate your account.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleResendRegistrationEmail}
                    disabled={resendRegCooldown > 0 || resendingReg}
                    className="w-full mt-2 py-2 px-3 bg-white border border-amber-300 rounded-xl text-xs font-bold text-amber-800 hover:bg-amber-50/60 transition cursor-pointer flex items-center justify-center gap-1.5 shadow-2xs"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                    <span>
                      {resendingReg
                        ? 'Sending...'
                        : resendRegCooldown > 0
                        ? `Resend verification email (${resendRegCooldown}s)`
                        : 'Resend verification email'}
                    </span>
                  </button>
                </div>
              )}

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
                      placeholder="name@gmail.com or Phone number"
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
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none p-1 cursor-pointer"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Notification Info Banner */}
                <div className="bg-brand-50/80 border border-brand-200/70 rounded-xl p-3 flex items-start justify-between gap-2.5">
                  <div className="flex items-start gap-2.5">
                    <ShieldCheck className="w-4 h-4 text-brand-700 shrink-0 mt-0.5" />
                    <p className="text-[11px] text-brand-900 leading-relaxed font-medium">
                      A notification with the <span className="font-bold">"Yes, it's me"</span> option will arrive for this email to verify sign-in.
                    </p>
                  </div>
                  {desktopNotifPermission !== 'granted' && (
                    <button
                      type="button"
                      onClick={handleRequestNotifPermission}
                      className="text-[10px] font-black text-brand-700 hover:text-brand-800 bg-white border border-brand-200 px-2 py-1 rounded-md shrink-0 cursor-pointer shadow-xs"
                      title="Enable browser notifications"
                    >
                      Enable Desktop Alerts
                    </button>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-2 flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-xl shadow-md text-sm font-bold text-white bg-brand-600 hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 transition-colors disabled:opacity-50 cursor-pointer"
                >
                  <span>{loading ? 'Sending notification...' : 'Sign in & Send Notification'}</span>
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
            </>
          )}

          {/* STAGE 2: Waiting for "Yes, it's me" Confirmation */}
          {stage === 'WAITING_GMAIL' && (
            <div className="text-center space-y-5 py-2">
              <div className="relative inline-flex items-center justify-center">
                <div className="w-16 h-16 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center shadow-inner border border-brand-100">
                  <Mail className="w-8 h-8 text-brand-600 animate-bounce" />
                </div>
                <span className="absolute -top-1 -right-1 flex h-4 w-4">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500 border-2 border-white"></span>
                </span>
              </div>

              <div>
                <h3 className="text-xl font-black text-slate-900 tracking-tight">
                  Notification Sent
                </h3>
                <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                  A verification notification arrived for the given email:
                </p>
                <div className="mt-2 inline-block px-3 py-1 bg-slate-100 rounded-full text-xs font-mono font-bold text-slate-800 border border-slate-200">
                  {verifiedEmail}
                </div>
              </div>

              {/* Instructional Banner */}
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-left space-y-2">
                <div className="flex items-center gap-2 text-amber-900 font-bold text-xs">
                  <Sparkles className="w-4 h-4 text-amber-600" />
                  <span>Action Required:</span>
                </div>
                <p className="text-xs text-amber-800 leading-relaxed">
                  Click the green <span className="font-black bg-amber-100 px-1.5 py-0.5 rounded border border-amber-300">"Yes, it's me"</span> option on the notification or button below to immediately approve this login.
                </p>
                <div className="flex items-center gap-2 text-[11px] text-amber-700/80 pt-1 border-t border-amber-200/50">
                  <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span>Listening for your approval in real-time...</span>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="space-y-2.5 pt-1">
                {/* Immediate Click Action */}
                <button
                  type="button"
                  onClick={() => handleDirectApprove()}
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-lg shadow-emerald-600/30 transition-all cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{loading ? 'Confirming...' : "Confirm: 'Yes, it's me'"}</span>
                </button>

                {/* Open Gmail button */}
                <a
                  href="https://mail.google.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors cursor-pointer border border-slate-200"
                >
                  <span>Open Gmail Inbox</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>

              {/* Footer Resend and Cancel */}
              <div className="flex items-center justify-between text-xs pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleResendEmail}
                  disabled={resendCooldown > 0 || resending}
                  className="text-brand-600 hover:text-brand-700 font-bold flex items-center gap-1 disabled:opacity-40 cursor-pointer"
                >
                  <RefreshCw className={`w-3 h-3 ${resending ? 'animate-spin' : ''}`} />
                  <span>
                    {resendCooldown > 0 ? `Resend notification (${resendCooldown}s)` : 'Resend notification'}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (pollingRef.current) clearInterval(pollingRef.current);
                    setStage('FORM');
                  }}
                  className="text-slate-400 hover:text-slate-600 font-medium cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* STAGE 3: Clear Success Message Screen */}
          {stage === 'VERIFIED_SUCCESS' && (
            <div className="text-center space-y-6 py-6 animate-fade-in">
              {/* Big Animated Success Badge */}
              <div className="relative inline-flex items-center justify-center">
                <div className="w-20 h-20 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shadow-xl shadow-emerald-500/25 animate-scale-up">
                  <CheckCircle2 className="w-12 h-12" />
                </div>
                <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-1 shadow-md">
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
                <p className="text-xs text-slate-600 mt-2 max-w-sm mx-auto leading-relaxed">
                  Welcome back, <span className="font-bold text-slate-900">{verifiedUser?.full_name || verifiedEmail}</span>. Your identity verification is complete.
                </p>
              </div>

              {/* Status Banner */}
              <div className="bg-emerald-50 border border-emerald-200/80 rounded-2xl p-4 text-xs font-semibold text-emerald-800 flex items-center justify-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                <span>Signing you in to PetCare Sanctuary...</span>
              </div>

              <button
                type="button"
                onClick={() => completeLoginFlow(verifiedUser)}
                className="w-full flex items-center justify-center gap-2 py-3.5 px-4 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-xl text-xs shadow-lg shadow-brand-600/30 transition-all cursor-pointer"
              >
                <span>Continue to Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default Login;
