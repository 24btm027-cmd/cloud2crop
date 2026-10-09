import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';

export default function SignupPage({ onSwitchToLogin, onSuccess }) {
  const { signup, loading, error } = useAuth();
  const { t, lang } = useLanguage();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [location, setLocation] = useState('Ahmedabad');
  const [validationErr, setValidationErr] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setValidationErr('');

    if (password !== confirmPassword) {
      setValidationErr('Passwords do not match');
      return;
    }

    if (phone.length < 10) {
      setValidationErr('Please enter a valid 10-digit phone number');
      return;
    }

    try {
      await signup({ name, phone, password, language: lang, location });
      onSuccess();
    } catch {
      // Error managed by AuthContext
    }
  };

  return (
    <div className="d-flex align-items-center justify-content-center py-5 px-3">
      <div className="c2c-editorial-card p-4 p-md-5 w-100" style={{ maxWidth: 460 }}>
        <div className="text-center mb-4">
          <span className="fs-2 text-wheat mb-2 d-inline-block">🚜</span>
          <h1 className="h3 font-editorial fw-bold text-charcoal mb-1">Create Account</h1>
          <p className="text-muted small">Set up your Cloud2Crop agricultural profile</p>
        </div>

        {(error || validationErr) && (
          <div className="alert alert-danger py-2 px-3 small fw-semibold mb-3">
            {validationErr || error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label fw-semibold text-charcoal small">{t.name}</label>
            <input
              type="text"
              className="form-control form-control-lg fs-6 border-subtle"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ramesh Patel"
              required
            />
          </div>

          <div className="mb-3">
            <label className="form-label fw-semibold text-charcoal small">{t.phone}</label>
            <input
              type="tel"
              className="form-control form-control-lg fs-6 border-subtle"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="9876543210"
              required
            />
          </div>

          <div className="mb-3">
            <label className="form-label fw-semibold text-charcoal small">{t.city}</label>
            <select
              className="form-select form-select-lg fs-6 border-subtle"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            >
              {['Ahmedabad', 'Rajkot', 'Surat', 'Vadodara', 'Bhavnagar', 'Junagadh', 'Amreli', 'Jamnagar', 'Mehsana', 'Anand'].map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div className="mb-3">
            <label className="form-label fw-semibold text-charcoal small">{t.password}</label>
            <input
              type="password"
              className="form-control form-control-lg fs-6 border-subtle"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          <div className="mb-4">
            <label className="form-label fw-semibold text-charcoal small">{t.confirmPassword}</label>
            <input
              type="password"
              className="form-control form-control-lg fs-6 border-subtle"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-wheat btn-lg w-100 fw-bold mb-4"
            disabled={loading}
          >
            {loading ? 'Creating Profile...' : t.signup}
          </button>
        </form>

        <div className="text-center small text-muted">
          Already have an account?{' '}
          <button
            type="button"
            onClick={onSwitchToLogin}
            className="btn btn-link p-0 text-charcoal fw-bold text-decoration-none"
          >
            {t.login}
          </button>
        </div>
      </div>
    </div>
  );
}
