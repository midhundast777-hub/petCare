import React, { useState, useEffect } from 'react';
import { authService } from '../services/authService';
import { useToast } from '../context/ToastContext';
import {
  Mail,
  Phone,
  CheckCircle2,
  X,
  Bell,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  Copy,
  Check
} from 'lucide-react';

export const VerificationModal = ({
  isOpen,
  onClose,
  type = 'EMAIL', // 'EMAIL' | 'PHONE'
  destination = '',
  onVerified,
}) => {
  const { addToast } = useToast();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [pushNotification, setPushNotification] = useState(null);
  const [copied, setCopied] = useState(false);

  // Send verification code on open or resend
  const sendCode = async () => {
    if (!destination) return;
    setSending(true);
    try {
      const res = await authService.sendVerificationCode(type, destination);
      setCooldown(60);

      if (type === 'EMAIL') {
        // Prepare Rich Push Notification banner
        const notifData = res.notification || {
          title: '🔔 Email Verification Code',
          message: `Your Pet Care email verification code is ${res.code}. Enter this code to complete verification.`,
        };
        setPushNotification({
          ...notifData,
          code: res.code,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        });
        addToast(`🔔 Push Notification: Verification code dispatched for ${destination}!`, 'info', 6000);
      } else {
        // Phone verification
        setPushNotification({
          title: '📱 SMS Verification Alert',
          message: `Your Pet Care phone verification code is ${res.code}. (10-Digit Number: ${res.formatted || destination})`,
          code: res.code,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        });
        addToast(`📱 SMS Code sent to 10-digit phone ${res.formatted || destination}`, 'info', 6000);
      }
    } catch (err) {
      const detail = err.response?.data?.detail || 'Failed to send verification code.';
      addToast(detail, 'error');
    } finally {
      setSending(false);
    }
  };

  useEffect(() => {
    if (isOpen && destination) {
      setCode('');
      setPushNotification(null);
      sendCode();
    }
  }, [isOpen, destination, type]);

  // Countdown timer for resend
  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown((prev) => prev - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  const handleVerify = async (e) => {
    e?.preventDefault();
    if (!code || code.trim().length !== 6) {
      addToast('Please enter the 6-digit verification code.', 'error');
      return;
    }

    setLoading(true);
    try {
      const res = await authService.verifyCode(type, destination, code.trim());
      addToast(res.message || 'Verification successful!', 'success');
      if (onVerified) {
        onVerified({ type, destination, code: code.trim() });
      }
      onClose();
    } catch (err) {
      const detail = err.response?.data?.detail || 'Invalid or expired code. Please try again.';
      addToast(detail, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleAutoFill = () => {
    if (pushNotification?.code) {
      setCode(pushNotification.code);
      addToast('Code auto-filled from push notification!', 'success');
    }
  };

  const handleCopyCode = () => {
    if (pushNotification?.code) {
      navigator.clipboard.writeText(pushNotification.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      addToast('Verification code copied to clipboard!', 'info');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 sm:p-6">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Card */}
      <div className="relative bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-md overflow-hidden transform transition-all z-10 flex flex-col my-8 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-6 pb-4 bg-gradient-to-br from-slate-900 via-slate-800 to-brand-950 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-brand-500/20 border border-brand-400/30 flex items-center justify-center text-brand-300 shadow-inner">
              {type === 'EMAIL' ? <Mail className="w-6 h-6" /> : <Phone className="w-6 h-6" />}
            </div>
            <div>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-white/20 text-brand-200 border border-white/10">
                {type === 'EMAIL' ? 'Push Notification Verification' : '10-Digit Phone Check'}
              </span>
              <h3 className="text-lg font-black mt-1">
                {type === 'EMAIL' ? 'Verify Email Address' : 'Verify Phone Number'}
              </h3>
            </div>
          </div>
          <p className="text-xs text-slate-300 mt-2">
            Target: <strong className="text-white font-bold">{destination}</strong>
          </p>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          
          {/* PUSH NOTIFICATION BANNER (Real Push Notification for Email & SMS for Phone) */}
          {pushNotification && (
            <div className="bg-gradient-to-r from-amber-500/10 via-brand-500/10 to-emerald-500/10 border-2 border-brand-500/30 rounded-2xl p-4 shadow-sm relative overflow-hidden animate-in slide-in-from-top-2">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-xl bg-brand-600 text-white shadow-xs shrink-0">
                  <Bell className="w-5 h-5 animate-bounce" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                      <span>{pushNotification.title}</span>
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    </span>
                    <span className="text-[10px] text-slate-400">{pushNotification.time}</span>
                  </div>
                  <p className="text-xs text-slate-700 mt-1 leading-relaxed">
                    {pushNotification.message}
                  </p>

                  {/* Push Action Pills */}
                  <div className="mt-3 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleAutoFill}
                      className="px-3 py-1 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Auto-Fill Code ({pushNotification.code})</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleCopyCode}
                      className="px-2.5 py-1 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-lg text-xs font-semibold shadow-2xs transition-colors flex items-center gap-1"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copied ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleVerify} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5 text-center">
                Enter 6-Digit Code
              </label>
              <input
                type="text"
                maxLength={6}
                required
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                placeholder="• • • • • •"
                className="w-full text-center tracking-[0.5em] text-2xl font-black py-3 px-4 bg-slate-50 border-2 border-slate-200 rounded-2xl focus:outline-none focus:border-brand-500 focus:bg-white text-slate-900 transition-all placeholder:text-slate-300"
              />
              <p className="text-[11px] text-slate-400 text-center mt-1.5">
                {type === 'EMAIL'
                  ? 'Check the push notification above or your email inbox'
                  : 'Check the 10-digit phone verification alert'}
              </p>
            </div>

            <button
              type="submit"
              disabled={loading || code.length !== 6}
              className="w-full py-3 bg-brand-600 hover:bg-brand-700 text-white rounded-2xl font-bold text-sm shadow-md shadow-brand-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>{loading ? 'Verifying...' : 'Verify Code & Confirm'}</span>
            </button>
          </form>

          {/* Resend Action */}
          <div className="pt-2 text-center text-xs text-slate-500 border-t border-slate-100 flex items-center justify-between">
            <span>Didn't receive the code?</span>
            {cooldown > 0 ? (
              <span className="font-bold text-slate-400">Resend in {cooldown}s</span>
            ) : (
              <button
                type="button"
                disabled={sending}
                onClick={sendCode}
                className="font-bold text-brand-600 hover:text-brand-700 flex items-center gap-1 transition-colors"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${sending ? 'animate-spin' : ''}`} />
                <span>Resend Code</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerificationModal;
