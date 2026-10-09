import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';

/**
 * SignupPage – simplified: just collects name + location,
 * then triggers OTP flow via LoginPage redirect.
 * Full OTP auth = same as login (phone sends OTP, OTP creates new user).
 */
export default function SignupPage({ onSwitchToLogin, onSuccess }) {
  const { sendOtp, verifyOtp, updateProfile, loading, error, clearError } = useAuth();
  const { t, lang } = useLanguage();

  const [step, setStep] = useState(1); // 1=name+location, 2=phone, 3=otp
  const [name, setName] = useState('');
  const [location, setLocation] = useState('Ahmedabad');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [devCode, setDevCode] = useState(null);
  const [countdown, setCountdown] = useState(0);

  const CITIES = [
    'Ahmedabad', 'Rajkot', 'Surat', 'Vadodara', 'Bhavnagar',
    'Junagadh', 'Amreli', 'Jamnagar', 'Mehsana', 'Anand',
    'Surendranagar', 'Gandhinagar', 'Bharuch', 'Ankleshwar',
  ];

  const handleStep1 = (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    setStep(2);
  };

  const handleSendOtp = async (e) => {
    e?.preventDefault();
    const digits = phone.replace(/\D/g, '');
    if (digits.length < 10) return;
    clearError && clearError();
    try {
      const res = await sendOtp(digits);
      setStep(3);
      setCountdown(30);
      if (res?.devCode) setDevCode(res.devCode);
      // Start countdown
      const interval = setInterval(() => setCountdown(c => {
        if (c <= 1) { clearInterval(interval); return 0; }
        return c - 1;
      }), 1000);
    } catch {}
  };

  const handleVerify = async (e) => {
    e?.preventDefault();
    if (otp.length < 6) return;
    try {
      const res = await verifyOtp(phone.replace(/\D/g, ''), otp, lang);
      // Save the name + location after OTP verification
      try {
        await updateProfile({ name, location, language: lang });
      } catch {}
      onSuccess(res?.isNew);
    } catch {}
  };

  return (
    <div className="d-flex align-items-center justify-content-center py-5 px-3" style={{ minHeight: '80vh' }}>
      <div className="c2c-editorial-card p-4 p-md-5 w-100" style={{ maxWidth: 460 }}>

        {/* Header */}
        <div className="text-center mb-4">
          <span className="fs-2 mb-2 d-inline-block">🚜</span>
          <h1 className="h3 font-editorial fw-bold text-charcoal mb-1">
            {t.welcomeNew || 'Join Cloud2Crop'}
          </h1>
          <p className="text-muted small">Set up your agricultural profile</p>
        </div>

        {/* Step bar */}
        <div className="d-flex gap-2 justify-content-center mb-4">
          {[1, 2, 3].map(s => (
            <div
              key={s}
              style={{
                width: 32, height: 3, borderRadius: 2,
                background: step >= s ? 'var(--charcoal)' : 'var(--border-subtle)',
              }}
            />
          ))}
        </div>

        {error && (
          <div className="alert alert-danger py-2 px-3 small fw-semibold mb-3">{error}</div>
        )}

        {/* Step 1: Name + Location */}
        {step === 1 && (
          <form onSubmit={handleStep1}>
            <div className="mb-3">
              <label className="form-label fw-semibold text-charcoal small">{t.name}</label>
              <input
                type="text"
                className="form-control form-control-lg fs-6 border-subtle"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Ramesh Patel"
                required
                autoFocus
              />
            </div>
            <div className="mb-4">
              <label className="form-label fw-semibold text-charcoal small">{t.location}</label>
              <select
                className="form-select form-select-lg fs-6 border-subtle"
                value={location}
                onChange={e => setLocation(e.target.value)}
              >
                {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <button type="submit" className="btn btn-charcoal btn-lg w-100 fw-bold">
              {t.next} →
            </button>
          </form>
        )}

        {/* Step 2: Phone */}
        {step === 2 && (
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
              <div className="form-text text-muted small mt-1">A 6-digit OTP will be sent via SMS</div>
            </div>
            <div className="d-flex gap-2">
              <button type="button" onClick={() => setStep(1)}
                className="btn border-subtle fw-semibold" style={{ color: 'var(--charcoal)', minHeight: 52 }}>
                ← {t.back}
              </button>
              <button type="submit" className="btn btn-charcoal btn-lg fw-bold flex-grow-1"
                disabled={loading || phone.length < 10}>
                {loading ? <><span className="spinner-border spinner-border-sm me-2" />Sending…</> : t.sendOtp}
              </button>
            </div>
          </form>
        )}

        {/* Step 3: OTP */}
        {step === 3 && (
          <form onSubmit={handleVerify}>
            {devCode && (
              <div className="alert py-2 px-3 small mb-3 text-center"
                style={{ background: 'rgba(200,169,107,0.15)', border: '1px solid rgba(200,169,107,0.3)', color: 'var(--wheat-dark)' }}>
                🔧 <strong>Dev OTP:</strong> {devCode}
              </div>
            )}
            <p className="text-muted small text-center mb-3">OTP sent to +91 {phone}</p>
            <div className="mb-4">
              <label className="form-label fw-semibold text-charcoal small">{t.otp}</label>
              <input
                type="text"
                inputMode="numeric"
                className="form-control form-control-lg fs-4 border-subtle text-center fw-bold"
                value={otp}
                onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000"
                maxLength={6}
                autoFocus
              />
            </div>
            <div className="d-flex gap-2">
              <button type="button" onClick={() => { setStep(2); setOtp(''); }}
                className="btn border-subtle fw-semibold" style={{ color: 'var(--charcoal)', minHeight: 52 }}>
                ← {t.back}
              </button>
              <button type="submit" className="btn btn-charcoal btn-lg fw-bold flex-grow-1"
                disabled={loading || otp.length < 6}>
                {loading ? <><span className="spinner-border spinner-border-sm me-2" />Verifying…</> : t.verifyOtp}
              </button>
            </div>
            <div className="text-center mt-3 small">
              <button type="button" onClick={handleSendOtp} disabled={countdown > 0 || loading}
                className="btn btn-link p-0 text-muted text-decoration-none small"
                style={{ opacity: countdown > 0 ? 0.5 : 1 }}>
                {countdown > 0 ? `Resend in ${countdown}s` : t.resendOtp}
              </button>
            </div>
          </form>
        )}

        {/* Switch to login */}
        <div className="text-center small text-muted mt-4">
          Already have an account?{' '}
          <button type="button" onClick={onSwitchToLogin}
            className="btn btn-link p-0 text-charcoal fw-bold text-decoration-none">
            {t.login}
          </button>
        </div>
      </div>
    </div>
  );
}
