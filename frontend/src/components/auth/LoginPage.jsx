import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';

/**
 * LoginPage – 2-step OTP flow
 * Step 1: Enter phone number → Send OTP
 * Step 2: Enter 6-digit OTP → Verify
 */
export default function LoginPage({ onSwitchToSignup, onSuccess }) {
  const { sendOtp, verifyOtp, loading, error, clearError } = useAuth();
  const { t } = useLanguage();

  const [step, setStep] = useState(1); // 1 = phone, 2 = OTP
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [countdown, setCountdown] = useState(0);
  const [devCode, setDevCode] = useState(null); // shown in dev mode
  const inputRefs = useRef([]);
  const timerRef = useRef(null);

  useEffect(() => {
    clearError && clearError();
  }, [step]);

  // Countdown for resend
  useEffect(() => {
    if (countdown <= 0) {
      clearInterval(timerRef.current);
      return;
    }
    timerRef.current = setInterval(() => setCountdown(c => c - 1), 1000);
    return () => clearInterval(timerRef.current);
  }, [countdown]);

  const handleSendOtp = async (e) => {
    e?.preventDefault();
    if (phone.replace(/\D/g, '').length !== 10) return;
    try {
      const res = await sendOtp(phone.replace(/\D/g, ''));
      setStep(2);
      setCountdown(30);
      if (res?.devCode) setDevCode(res.devCode); // dev mode
      setTimeout(() => inputRefs.current[0]?.focus(), 100);
    } catch {
      // error from context
    }
  };

  const handleOtpChange = (idx, val) => {
    if (!/^\d*$/.test(val)) return;
    const next = [...otp];
    next[idx] = val.slice(-1);
    setOtp(next);
    if (val && idx < 5) inputRefs.current[idx + 1]?.focus();
    if (next.every(d => d !== '') && next.join('').length === 6) {
      handleVerify(next.join(''));
    }
  };

  const handleOtpKeyDown = (idx, e) => {
    if (e.key === 'Backspace' && !otp[idx] && idx > 0) {
      inputRefs.current[idx - 1]?.focus();
    }
  };

  const handleVerify = async (code) => {
    const finalCode = code || otp.join('');
    if (finalCode.length !== 6) return;
    try {
      const res = await verifyOtp(phone.replace(/\D/g, ''), finalCode);
      onSuccess(res?.isNew);
    } catch {
      // error from context
    }
  };

  const handleResend = () => {
    if (countdown > 0) return;
    setOtp(['', '', '', '', '', '']);
    setDevCode(null);
    handleSendOtp();
  };

  return (
    <div className="d-flex align-items-center justify-content-center py-5 px-3" style={{ minHeight: '80vh' }}>
      <div className="c2c-editorial-card p-4 p-md-5 w-100" style={{ maxWidth: 440 }}>

        {/* Header */}
        <div className="text-center mb-4">
          <span className="fs-2 mb-2 d-inline-block">🌾</span>
          <h1 className="h3 font-editorial fw-bold text-charcoal mb-1">
            {step === 1 ? t.hello || 'Welcome Back' : t.verifyOtp}
          </h1>
          <p className="text-muted small">
            {step === 1
              ? 'Enter your mobile number to log in or sign up'
              : `OTP sent to +91 ${phone}`}
          </p>
        </div>

        {/* Step indicator */}
        <div className="d-flex gap-2 mb-4 justify-content-center">
          <div style={{ width: 32, height: 3, borderRadius: 2, background: 'var(--charcoal)' }} />
          <div style={{ width: 32, height: 3, borderRadius: 2, background: step === 2 ? 'var(--charcoal)' : 'var(--border-subtle)' }} />
        </div>

        {error && (
          <div className="alert alert-danger py-2 px-3 small fw-semibold mb-3">
            {error}
          </div>
        )}

        {/* STEP 1 – Phone */}
        {step === 1 && (
          <form onSubmit={handleSendOtp}>
            <div className="mb-4">
              <label className="form-label fw-semibold text-charcoal small">{t.phone}</label>
              <div className="input-group">
                <span className="input-group-text bg-ivory border-subtle text-charcoal fw-bold">+91</span>
                <input
                  type="tel"
                  className="form-control form-control-lg fs-6 border-subtle"
                  value={phone}
                  onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  placeholder="9876543210"
                  inputMode="numeric"
                  maxLength={10}
                  required
                  autoFocus
                />
              </div>
              <div className="form-text text-muted small mt-1">
                A 6-digit OTP will be sent via SMS
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-charcoal btn-lg w-100 fw-bold mb-4"
              disabled={loading || phone.length < 10}
            >
              {loading ? (
                <><span className="spinner-border spinner-border-sm me-2" />Sending…</>
              ) : (
                t.sendOtp
              )}
            </button>
          </form>
        )}

        {/* STEP 2 – OTP */}
        {step === 2 && (
          <div>
            {/* Dev mode: show OTP code */}
            {devCode && (
              <div className="alert py-2 px-3 small mb-3 text-center"
                style={{ background: 'rgba(200,169,107,0.15)', border: '1px solid rgba(200,169,107,0.3)', color: 'var(--wheat-dark)' }}>
                🔧 <strong>Dev OTP:</strong> {devCode}
              </div>
            )}

            {/* 6-box OTP input */}
            <div className="d-flex gap-2 justify-content-center mb-4">
              {otp.map((digit, idx) => (
                <input
                  key={idx}
                  ref={el => (inputRefs.current[idx] = el)}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={e => handleOtpChange(idx, e.target.value)}
                  onKeyDown={e => handleOtpKeyDown(idx, e)}
                  style={{
                    width: 48, height: 56,
                    textAlign: 'center',
                    fontSize: '1.5rem',
                    fontWeight: 700,
                    border: `1px solid ${digit ? 'var(--charcoal)' : 'var(--border-subtle)'}`,
                    borderRadius: 4,
                    outline: 'none',
                    background: digit ? 'var(--ivory)' : '#fff',
                    color: 'var(--charcoal)',
                    transition: 'border-color 0.2s',
                  }}
                />
              ))}
            </div>

            <button
              className="btn btn-charcoal btn-lg w-100 fw-bold mb-3"
              onClick={() => handleVerify()}
              disabled={loading || otp.join('').length < 6}
            >
              {loading ? (
                <><span className="spinner-border spinner-border-sm me-2" />Verifying…</>
              ) : (
                t.verifyOtp
              )}
            </button>

            {/* Resend */}
            <div className="text-center small">
              <button
                type="button"
                onClick={handleResend}
                disabled={countdown > 0 || loading}
                className="btn btn-link p-0 text-charcoal fw-semibold text-decoration-none"
                style={{ opacity: countdown > 0 ? 0.5 : 1 }}
              >
                {countdown > 0
                  ? `${t.resendIn || 'Resend in'} ${countdown}s`
                  : t.resendOtp}
              </button>
            </div>

            {/* Back */}
            <div className="text-center mt-3">
              <button
                type="button"
                onClick={() => { setStep(1); setOtp(['', '', '', '', '', '']); }}
                className="btn btn-link p-0 text-muted small text-decoration-none"
              >
                ← {t.back} ({phone})
              </button>
            </div>
          </div>
        )}

        {/* Demo hint */}
        {step === 1 && (
          <div className="p-3 bg-ivory-card rounded-1 border border-subtle text-muted small">
            <div className="fw-bold mb-1 text-charcoal">💡 Demo:</div>
            <div>Enter <code>9876543210</code> — OTP will appear on screen in dev mode.</div>
          </div>
        )}

        {/* Switch to signup */}
        <div className="text-center small text-muted mt-4">
          {`Don't have an account? `}
          <button
            type="button"
            onClick={onSwitchToSignup}
            className="btn btn-link p-0 text-charcoal fw-bold text-decoration-none"
          >
            {t.signup}
          </button>
        </div>
      </div>
    </div>
  );
}
