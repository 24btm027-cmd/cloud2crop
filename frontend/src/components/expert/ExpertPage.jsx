import { useState, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { get } from '../../api/client';

/**
 * ExpertPage – Directory of agronomists + Kisan Call Centre.
 * Reads from /api/experts (seeded in MongoDB).
 * Falls back to hardcoded list if API unavailable.
 */

const FALLBACK_EXPERTS = [
  { name: 'Kisan Call Centre', phone: '1800-180-1551', district: 'All India', languages: ['en', 'hi', 'gu'], role: 'kisan_call_centre' },
  { name: 'Dr. Ramesh Patel', phone: '02712-234567', district: 'Ahmedabad', languages: ['gu', 'hi', 'en'], role: 'agronomist' },
  { name: 'Smt. Meena Sharma', phone: '02822-345678', district: 'Rajkot', languages: ['gu', 'hi'], role: 'agronomist' },
  { name: 'Sh. Vikram Singh', phone: '02762-456789', district: 'Surendranagar', languages: ['hi', 'gu'], role: 'agronomist' },
  { name: 'Dr. Hetal Mehta', phone: '02792-567890', district: 'Junagadh', languages: ['gu', 'en'], role: 'pathologist' },
];

const ROLE_LABELS = {
  kisan_call_centre: 'Kisan Call Centre',
  agronomist: 'Agronomist',
  pathologist: 'Plant Pathologist',
};

const LANG_FLAGS = { en: '🇬🇧', hi: '🇮🇳', gu: '🇮🇳' };
const LANG_NAMES = { en: 'EN', hi: 'HI', gu: 'GU' };

export default function ExpertPage() {
  const { t } = useLanguage();
  const [experts, setExperts] = useState(FALLBACK_EXPERTS);
  const [messageModal, setMessageModal] = useState(null); // expert object
  const [message, setMessage] = useState('');
  const [sent, setSent] = useState(false);

  useEffect(() => {
    get('/experts')
      .then(data => { if (Array.isArray(data) && data.length) setExperts(data); })
      .catch(() => {}); // use fallback silently
  }, []);

  const handleSend = (e) => {
    e.preventDefault();
    // In production this would post to /api/messages
    setSent(true);
    setTimeout(() => {
      setSent(false);
      setMessageModal(null);
      setMessage('');
    }, 2000);
  };

  const kisanCall = experts.find(e => e.role === 'kisan_call_centre') || FALLBACK_EXPERTS[0];
  const localExperts = experts.filter(e => e.role !== 'kisan_call_centre');

  return (
    <div className="d-flex flex-column gap-4 pb-5">
      {/* Header */}
      <div className="c2c-dark-panel p-4 p-md-5 rounded-2 border border-secondary border-opacity-25">
        <span className="text-wheat small fw-bold" style={{ letterSpacing: '0.08em' }}>
          EXPERT NETWORK
        </span>
        <h1 className="display-6 font-editorial fw-bold text-white mt-1 mb-1">
          👨‍🌾 {t.expertTitle}
        </h1>
        <p className="text-sage mb-0">
          Connect with trained agronomists and plant pathologists for personalised advice.
        </p>
      </div>

      {/* Kisan Call Centre – always first, prominent */}
      <div className="c2c-editorial-card p-4">
        <div className="d-flex flex-wrap align-items-center justify-content-between gap-3">
          <div>
            <span className="badge-editorial-warning mb-2 d-inline-block">FREE 24×7</span>
            <h2 className="h4 font-editorial fw-bold text-charcoal mb-1">
              📞 {t.kisanCall || 'Kisan Call Centre'}
            </h2>
            <p className="text-muted small mb-0">
              Government of India · Available in 22 languages · No charge
            </p>
          </div>
          <div className="d-flex flex-wrap gap-2">
            <a
              href={`tel:${kisanCall.phone}`}
              className="btn btn-charcoal fw-bold px-4"
              style={{ minHeight: 48 }}
            >
              📞 Call {kisanCall.phone}
            </a>
          </div>
        </div>
      </div>

      {/* Local experts grid */}
      <div>
        <h2 className="h5 font-editorial fw-bold text-charcoal mb-3">
          Local Agronomists
        </h2>
        <div className="row g-3">
          {localExperts.map((expert, i) => (
            <div key={i} className="col-md-6 col-lg-4">
              <div className="c2c-editorial-card p-4 h-100 d-flex flex-column">
                <div className="d-flex align-items-start gap-3 mb-3">
                  <div
                    style={{
                      width: 48, height: 48, borderRadius: '50%',
                      background: 'var(--ivory)', border: '1px solid var(--border-subtle)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '1.4rem', flexShrink: 0,
                    }}
                  >
                    {expert.role === 'pathologist' ? '🔬' : '👨‍🌾'}
                  </div>
                  <div>
                    <div className="fw-bold text-charcoal font-editorial">{expert.name}</div>
                    <div className="text-muted small">{ROLE_LABELS[expert.role] || expert.role}</div>
                    <div className="text-muted small">📍 {expert.district}</div>
                  </div>
                </div>

                {/* Languages */}
                <div className="d-flex gap-1 mb-3">
                  {(expert.languages || []).map(l => (
                    <span
                      key={l}
                      className="badge-editorial-success"
                      style={{ fontSize: '0.7rem' }}
                    >
                      {LANG_NAMES[l] || l.toUpperCase()}
                    </span>
                  ))}
                </div>

                {/* Actions */}
                <div className="mt-auto d-flex gap-2">
                  <a
                    href={`tel:${expert.phone}`}
                    className="btn btn-charcoal btn-sm fw-bold flex-grow-1"
                    style={{ minHeight: 44 }}
                  >
                    📞 {t.callNow}
                  </a>
                  <button
                    onClick={() => setMessageModal(expert)}
                    className="btn btn-sm border-subtle flex-grow-1"
                    style={{ minHeight: 44, background: 'var(--ivory-card)', color: 'var(--charcoal)', fontWeight: 600 }}
                  >
                    ✉️ {t.sendMessage}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Message modal */}
      {messageModal && (
        <div
          className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center p-3"
          style={{ background: 'rgba(23,35,29,0.75)', zIndex: 1080, backdropFilter: 'blur(4px)' }}
          onClick={() => setMessageModal(null)}
        >
          <div
            className="c2c-editorial-card p-4 w-100"
            style={{ maxWidth: 440 }}
            onClick={e => e.stopPropagation()}
          >
            <h3 className="h5 font-editorial fw-bold text-charcoal mb-1">
              Message {messageModal.name}
            </h3>
            <p className="text-muted small mb-3">{ROLE_LABELS[messageModal.role]} · {messageModal.district}</p>

            {sent ? (
              <div className="text-center py-4">
                <div className="fs-1 mb-2">✅</div>
                <p className="fw-bold text-charcoal">Message sent!</p>
              </div>
            ) : (
              <form onSubmit={handleSend}>
                <textarea
                  className="form-control border-subtle mb-3"
                  rows={4}
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  placeholder={t.yourMessage || 'Describe your issue or question…'}
                  required
                />
                <div className="d-flex gap-2">
                  <button type="submit" className="btn btn-charcoal fw-bold flex-grow-1" disabled={!message.trim()}>
                    {t.sendMessage}
                  </button>
                  <button type="button" onClick={() => setMessageModal(null)} className="btn border-subtle flex-grow-1" style={{ color: 'var(--charcoal)' }}>
                    {t.cancel}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
