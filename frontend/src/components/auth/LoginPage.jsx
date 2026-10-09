import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';

export default function LoginPage({ onSwitchToSignup, onForgotPassword, onSuccess }) {
  const { login, loading, error } = useAuth();
  const { t } = useLanguage();
  const [phone, setPhone] = useState('9876543210');
  const [password, setPassword] = useState('farmer123');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await login(phone, password);
      onSuccess();
    } catch {
      // Error managed by AuthContext
    }
  };

  return (
    <div className="d-flex align-items-center justify-content-center py-5 px-3">
      <div className="c2c-editorial-card p-4 p-md-5 w-100" style={{ maxWidth: 440 }}>
        <div className="text-center mb-4">
          <span className="fs-2 text-wheat mb-2 d-inline-block">🌾</span>
          <h1 className="h3 font-editorial fw-bold text-charcoal mb-1">Welcome Back</h1>
          <p className="text-muted small">Access your personalized Cloud2Crop farmer portal</p>
        </div>

        {error && <div className="alert alert-danger py-2 px-3 small fw-semibold mb-3">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label fw-semibold text-charcoal small">{t.phone}</label>
            <input
              type="text"
              className="form-control form-control-lg fs-6 border-subtle"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="9876543210"
              required
            />
          </div>

          <div className="mb-3">
            <div className="d-flex justify-content-between align-items-center mb-1">
              <label className="form-label fw-semibold text-charcoal small mb-0">{t.password}</label>
              <button
                type="button"
                onClick={onForgotPassword}
                className="btn btn-link p-0 text-wheat-dark small text-decoration-none"
              >
                {t.forgotPassword}
              </button>
            </div>
            <input
              type="password"
              className="form-control form-control-lg fs-6 border-subtle"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-wheat btn-lg w-100 fw-bold mb-4"
            disabled={loading}
          >
            {loading ? 'Signing in...' : t.login}
          </button>
        </form>

        <div className="p-3 bg-ivory-card rounded-1 mb-4 border border-subtle text-muted small">
          <div className="fw-bold mb-1 text-charcoal">💡 Demo Login Credentials:</div>
          <div>Gujarati Farmer: <code>9876543210</code> / <code>farmer123</code></div>
          <div>Hindi Farmer: <code>9123456780</code> / <code>farmer123</code></div>
        </div>

        <div className="text-center small text-muted">
          Don't have an account?{' '}
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
