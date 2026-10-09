import { useLanguage } from '../../context/LanguageContext';

export default function AlertCenterPage({ alerts, advisories, currentCity }) {
  const { t, speechLang } = useLanguage();

  const speakText = (text) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = speechLang;
    window.speechSynthesis.speak(u);
  };

  return (
    <div className="alert-center-page d-flex flex-column gap-4 pb-5">
      <div className="c2c-dark-panel p-4 p-md-5 rounded-2 shadow-sm border border-secondary border-opacity-25">
        <span className="text-wheat small fw-bold tracking-wider uppercase">DISASTER & PEST EARLY WARNING</span>
        <h1 className="display-6 font-editorial fw-bold text-white mt-1 mb-1">🔔 {t.alerts}</h1>
        <p className="text-sage mb-0">
          Categorized weather hazards, pest advisories, and emergency alerts for <strong className="text-white">{currentCity}</strong>.
        </p>
      </div>

      <div className="c2c-editorial-card p-4">
        <h2 className="h5 font-editorial fw-bold text-charcoal mb-3 pb-2 border-bottom border-subtle">
          📢 Active Telemetry Alerts
        </h2>

        {alerts.length === 0 ? (
          <div className="p-4 text-center bg-ivory-card rounded-1 border border-subtle">
            <div className="fs-1 mb-2">✅</div>
            <h3 className="h6 font-editorial fw-bold text-charcoal">No Active Risk Notifications</h3>
            <p className="small text-muted mb-0">Your location currently reflects normal weather telemetry.</p>
          </div>
        ) : (
          <div className="d-flex flex-column gap-3">
            {alerts.map((alt, idx) => (
              <div key={idx} className="p-3 bg-ivory-card rounded-1 border-start border-3 border-warning border border-subtle">
                <div className="d-flex justify-content-between align-items-center mb-1">
                  <span className="badge-editorial-warning">PRECAUTIONARY WARNING</span>
                  <small className="text-muted">{currentCity}</small>
                </div>
                <div className="fw-bold text-charcoal fs-5 mb-1 font-editorial">{alt.title || 'Weather Notification'}</div>
                <p className="text-dark small mb-2">{alt.message || alt.description}</p>
                <button
                  onClick={() => speakText(alt.message || alt.title)}
                  className="btn btn-sm btn-wheat fw-bold d-inline-flex align-items-center gap-1"
                >
                  🔊 {t.listen}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="c2c-editorial-card p-4">
        <h2 className="h5 font-editorial fw-bold text-charcoal mb-3 pb-2 border-bottom border-subtle">
          🌾 Agricultural Advisories
        </h2>

        {advisories.length === 0 ? (
          <p className="text-muted small">{t.none}</p>
        ) : (
          <div className="d-flex flex-column gap-3">
            {advisories.map((adv, idx) => (
              <div key={idx} className="p-3 bg-ivory-card rounded-1 border border-subtle">
                <div className="d-flex justify-content-between align-items-start mb-2">
                  <div>
                    <div className="fw-bold text-charcoal fs-5 font-editorial">{adv.title}</div>
                    <small className="text-muted">Issued for {adv.date || currentCity}</small>
                  </div>
                  <button
                    onClick={() => speakText(adv.advice)}
                    className="btn btn-sm btn-wheat rounded-circle p-2"
                    title={t.listen}
                  >
                    🔊
                  </button>
                </div>
                <p className="text-muted small mb-0">{adv.advice}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
