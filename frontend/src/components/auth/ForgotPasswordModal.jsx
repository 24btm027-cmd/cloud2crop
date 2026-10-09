import { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';

export default function ForgotPasswordModal({ onClose }) {
  const { t } = useLanguage();
  const [phone, setPhone] = useState('');
  const [sent, setSent] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSent(true);
  };

  return (
    <div
      className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center p-3"
      style={{ background: 'rgba(11, 41, 26, 0.75)', zIndex: 1080, backdropFilter: 'blur(8px)' }}
      onClick={onClose}
    >
      <div
        className="c2c-card p-4 rounded-4 w-100 shadow-lg"
        style={{ maxWidth: 420 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h2 className="h5 fw-bold text-forest mb-0">{t.forgotPassword}</h2>
          <button onClick={onClose} className="btn-close" aria-label="Close"></button>
        </div>

        {sent ? (
          <div className="text-center py-3">
            <div className="fs-1 mb-2">✅</div>
            <h3 className="h6 fw-bold text-forest">Password Reset Instructions Sent</h3>
            <p className="small text-muted mb-3">
              If an account exists for {phone}, an SMS verification code has been dispatched.
            </p>
            <button onClick={onClose} className="btn btn-emerald btn-sm w-100 fw-bold">
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <p className="small text-muted mb-3">
              Enter your registered mobile number below to receive password reset instructions.
            </p>
            <div className="mb-3">
              <label className="form-label fw-semibold text-forest small">{t.phone}</label>
              <input
                type="tel"
                className="form-control"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="9876543210"
                required
              />
            </div>
            <button type="submit" className="btn btn-emerald w-100 fw-bold">
              Send Reset Code
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
