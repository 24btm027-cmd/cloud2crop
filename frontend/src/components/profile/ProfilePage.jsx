import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';

/**
 * ProfilePage – view/edit farmer profile, language switcher, notification prefs,
 * and danger zone (delete account / logout).
 */
export default function ProfilePage() {
  const { user, updateProfile, logout, deleteAccount, loading, error } = useAuth();
  const { t, lang, setLang, LANGS } = useLanguage();

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    name: user?.name || '',
    location: user?.location || '',
    farmSize: user?.farmSize || '',
    irrigationMethod: user?.irrigationMethod || 'drip',
    language: lang,
    morningAlertTime: user?.morningAlertTime || '07:00',
    consentAlerts: user?.consentAlerts !== false,
  });
  const [saved, setSaved] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const handleChange = (field, val) => setForm(prev => ({ ...prev, [field]: val }));

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      await updateProfile({ ...form, language: form.language });
      setLang(form.language);
      setSaved(true);
      setEditing(false);
      setTimeout(() => setSaved(false), 3000);
    } catch {}
  };

  const handleLogout = async () => {
    await logout();
  };

  const handleDeleteAccount = async () => {
    try {
      await deleteAccount();
    } catch {}
  };

  const irrigationOptions = [
    { value: 'drip', label: t.drip || 'Drip' },
    { value: 'sprinkler', label: t.sprinkler || 'Sprinkler' },
    { value: 'flood', label: t.flood || 'Flood/Furrow' },
    { value: 'rainfed', label: t.rainfed || 'Rainfed' },
  ];

  return (
    <div className="d-flex flex-column gap-4 pb-5">
      {/* Header */}
      <div className="c2c-dark-panel p-4 p-md-5 rounded-2 border border-secondary border-opacity-25 d-flex align-items-center gap-4">
        <div
          style={{
            width: 64, height: 64, borderRadius: '50%',
            background: 'var(--wheat)', color: 'var(--charcoal)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.8rem', fontWeight: 700, flexShrink: 0,
          }}
        >
          {(user?.name || '?')[0].toUpperCase()}
        </div>
        <div>
          <h1 className="h3 font-editorial fw-bold text-white mb-0">
            {user?.name || 'Farmer'}
          </h1>
          <p className="text-sage mb-0 small">
            +91 {user?.phone || '—'} · {user?.location || '—'}
          </p>
        </div>
      </div>

      {saved && (
        <div className="alert py-2 px-3 fw-semibold small"
          style={{ background: 'rgba(110,121,102,0.15)', border: '1px solid rgba(110,121,102,0.3)', color: 'var(--sage-dark)' }}>
          ✅ {t.saved}
        </div>
      )}

      {error && (
        <div className="alert alert-danger py-2 px-3 small fw-semibold">{error}</div>
      )}

      {/* Profile form */}
      <div className="c2c-editorial-card p-4">
        <div className="d-flex align-items-center justify-content-between mb-4">
          <h2 className="h5 font-editorial fw-bold text-charcoal mb-0">
            {t.profileTitle}
          </h2>
          {!editing && (
            <button
              onClick={() => setEditing(true)}
              className="btn btn-sm border-subtle fw-semibold"
              style={{ background: 'var(--ivory-card)', color: 'var(--charcoal)', minHeight: 40 }}
            >
              ✏️ {t.editProfile}
            </button>
          )}
        </div>

        <form onSubmit={handleSave}>
          <div className="row g-3">
            {/* Name */}
            <div className="col-md-6">
              <label className="form-label fw-semibold text-charcoal small">{t.name}</label>
              {editing ? (
                <input
                  type="text"
                  className="form-control border-subtle"
                  value={form.name}
                  onChange={e => handleChange('name', e.target.value)}
                  required
                />
              ) : (
                <div className="p-2 rounded-1 bg-ivory-card border border-subtle">{form.name || '—'}</div>
              )}
            </div>

            {/* Location */}
            <div className="col-md-6">
              <label className="form-label fw-semibold text-charcoal small">{t.location}</label>
              {editing ? (
                <input
                  type="text"
                  className="form-control border-subtle"
                  value={form.location}
                  onChange={e => handleChange('location', e.target.value)}
                  placeholder="e.g. Rajkot"
                />
              ) : (
                <div className="p-2 rounded-1 bg-ivory-card border border-subtle">{form.location || '—'}</div>
              )}
            </div>

            {/* Farm size */}
            <div className="col-md-6">
              <label className="form-label fw-semibold text-charcoal small">{t.farmSize}</label>
              {editing ? (
                <input
                  type="number"
                  className="form-control border-subtle"
                  value={form.farmSize}
                  onChange={e => handleChange('farmSize', e.target.value)}
                  placeholder="5"
                  min="0"
                />
              ) : (
                <div className="p-2 rounded-1 bg-ivory-card border border-subtle">
                  {form.farmSize ? `${form.farmSize} acres` : '—'}
                </div>
              )}
            </div>

            {/* Irrigation */}
            <div className="col-md-6">
              <label className="form-label fw-semibold text-charcoal small">{t.irrigation}</label>
              {editing ? (
                <select
                  className="form-select border-subtle"
                  value={form.irrigationMethod}
                  onChange={e => handleChange('irrigationMethod', e.target.value)}
                >
                  {irrigationOptions.map(o => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              ) : (
                <div className="p-2 rounded-1 bg-ivory-card border border-subtle">
                  {irrigationOptions.find(o => o.value === form.irrigationMethod)?.label || form.irrigationMethod}
                </div>
              )}
            </div>

            {/* Language */}
            <div className="col-12">
              <label className="form-label fw-semibold text-charcoal small">{t.selectLanguage}</label>
              <div className="d-flex gap-2 flex-wrap">
                {Object.entries(LANGS).map(([code, { label }]) => (
                  <button
                    key={code}
                    type="button"
                    onClick={() => {
                      handleChange('language', code);
                      if (!editing) {
                        setLang(code);
                      }
                    }}
                    className={`btn btn-sm fw-bold px-3 py-2`}
                    style={{
                      minHeight: 44,
                      background: (editing ? form.language : lang) === code ? 'var(--charcoal)' : 'var(--ivory-card)',
                      color: (editing ? form.language : lang) === code ? '#fff' : 'var(--charcoal)',
                      border: `1px solid ${(editing ? form.language : lang) === code ? 'var(--charcoal)' : 'var(--border-subtle)'}`,
                      borderRadius: 4,
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {editing && (
            <div className="d-flex gap-2 mt-4">
              <button type="submit" className="btn btn-charcoal fw-bold px-4" disabled={loading}>
                {loading ? <span className="spinner-border spinner-border-sm me-2" /> : null}
                {t.save}
              </button>
              <button
                type="button"
                onClick={() => { setEditing(false); }}
                className="btn border-subtle"
                style={{ color: 'var(--charcoal)' }}
              >
                {t.cancel}
              </button>
            </div>
          )}
        </form>
      </div>

      {/* Notification preferences */}
      <div className="c2c-editorial-card p-4">
        <h2 className="h5 font-editorial fw-bold text-charcoal mb-4">{t.notificationPrefs}</h2>
        <div className="d-flex flex-column gap-3">
          <div className="d-flex align-items-center justify-content-between">
            <div>
              <div className="fw-semibold text-charcoal small">{t.consentAlerts}</div>
              <div className="text-muted" style={{ fontSize: '0.8rem' }}>
                Weather alerts, advisory updates
              </div>
            </div>
            <div className="form-check form-switch mb-0">
              <input
                type="checkbox"
                className="form-check-input"
                checked={form.consentAlerts}
                onChange={e => handleChange('consentAlerts', e.target.checked)}
                style={{ width: 44, height: 24 }}
              />
            </div>
          </div>
          <div className="d-flex align-items-center justify-content-between">
            <div>
              <div className="fw-semibold text-charcoal small">{t.morningTime}</div>
              <div className="text-muted" style={{ fontSize: '0.8rem' }}>Daily weather summary</div>
            </div>
            <input
              type="time"
              className="form-control border-subtle"
              value={form.morningAlertTime}
              onChange={e => handleChange('morningAlertTime', e.target.value)}
              style={{ width: 120 }}
            />
          </div>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="c2c-editorial-card p-4" style={{ border: '1px solid rgba(179,64,42,0.2)' }}>
        <h2 className="h5 font-editorial fw-bold mb-4" style={{ color: '#B3402A' }}>
          ⚠️ Account Actions
        </h2>
        <div className="d-flex flex-wrap gap-3">
          <button
            onClick={handleLogout}
            className="btn border-subtle fw-semibold px-4"
            style={{ color: 'var(--charcoal)', minHeight: 48 }}
          >
            🚪 {t.logout}
          </button>
          <button
            onClick={() => setConfirmDelete(true)}
            className="btn fw-semibold px-4"
            style={{ background: 'rgba(179,64,42,0.1)', color: '#B3402A', border: '1px solid rgba(179,64,42,0.25)', minHeight: 48 }}
          >
            🗑️ {t.deleteAccount}
          </button>
        </div>
      </div>

      {/* Delete confirm modal */}
      {confirmDelete && (
        <div
          className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center p-3"
          style={{ background: 'rgba(23,35,29,0.8)', zIndex: 1090, backdropFilter: 'blur(4px)' }}
        >
          <div className="c2c-editorial-card p-4 w-100" style={{ maxWidth: 400 }}>
            <h3 className="h5 font-editorial fw-bold text-charcoal mb-2">Delete Account</h3>
            <p className="text-muted small mb-4">{t.deleteAccountWarning}</p>
            <div className="d-flex gap-2">
              <button
                onClick={handleDeleteAccount}
                className="btn fw-bold flex-grow-1"
                style={{ background: '#B3402A', color: '#fff', border: 'none', minHeight: 48 }}
                disabled={loading}
              >
                {loading ? <span className="spinner-border spinner-border-sm me-2" /> : null}
                Yes, Delete
              </button>
              <button
                onClick={() => setConfirmDelete(false)}
                className="btn border-subtle flex-grow-1"
                style={{ color: 'var(--charcoal)', minHeight: 48 }}
              >
                {t.cancel}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
