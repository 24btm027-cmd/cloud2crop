import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import StatCard from '../common/StatCard';
import LoadingSkeleton from '../common/LoadingSkeleton';

export default function DashboardPage({ currentCity, weather, advisories, alerts, onNavigate }) {
  const { user } = useAuth();
  const { t } = useLanguage();

  if (!weather) {
    return <LoadingSkeleton count={3} height="160px" />;
  }

  const c = weather.current;
  const tm = weather.forecast[1] || weather.forecast[0];
  const rainProb = tm.rainProbability || 0;
  const isRainy = rainProb >= 50;

  // Today's Agricultural Actions
  const farmActions = [
    {
      id: 'irrigation',
      title: t.irrigationAction,
      status: isRainy ? 'DELAY IRRIGATION' : 'REGULAR IRRIGATION',
      badgeClass: isRainy ? 'badge-editorial-warning' : 'badge-editorial-success',
      icon: '💧',
      reason: isRainy
        ? `Rain probability is ${rainProb}% tomorrow with ${tm.rainfallMm}mm expected. Conserve moisture & energy.`
        : `Dry conditions ahead (${rainProb}% rain chance). Execute regular irrigation schedule.`,
    },
    {
      id: 'spray',
      title: t.sprayAction,
      status: isRainy ? 'AVOID SPRAYING' : 'SAFE TO SPRAY',
      badgeClass: isRainy ? 'badge-editorial-warning' : 'badge-editorial-success',
      icon: '🧪',
      reason: isRainy
        ? 'Incoming precipitation will wash off chemical sprays and reduce application efficiency.'
        : 'Low wind velocity provides an optimal window for chemical adherence.',
    },
    {
      id: 'drainage',
      title: t.drainageAction,
      status: isRainy ? 'INSPECT DRAINAGE' : 'NOMINAL',
      badgeClass: isRainy ? 'badge-editorial-warning' : 'badge-editorial-success',
      icon: '🚜',
      reason: isRainy
        ? 'Clear field drainage channels to prevent waterlogging in low-lying crop zones.'
        : 'Field drainage channels operating within nominal flow capacity.',
    },
    {
      id: 'fieldwork',
      title: t.fieldworkAction,
      status: c.temperature > 38 ? 'EVENING FIELDWORK' : 'SUITABLE',
      badgeClass: c.temperature > 38 ? 'badge-editorial-warning' : 'badge-editorial-success',
      icon: '🌤️',
      reason: c.temperature > 38
        ? `High temperature (${c.temperature}°C). Schedule labor and field tractor operations during early hours.`
        : 'Favorable environmental operating conditions throughout daytime.',
    },
  ];

  return (
    <div className="dashboard-page d-flex flex-column gap-4 pb-5">
      {/* Header Banner */}
      <div className="c2c-dark-panel p-4 p-md-5 rounded-2 shadow-sm d-flex flex-wrap align-items-center justify-content-between gap-3 border border-secondary border-opacity-25">
        <div>
          <span className="text-wheat small fw-bold tracking-wider uppercase">FARMER PORTAL DASHBOARD</span>
          <h1 className="display-6 font-editorial fw-bold text-white mt-1 mb-1">
            {t.hello}, {user ? user.name : 'Farmer'} 👋
          </h1>
          <p className="text-sage mb-0">
            Real-Time Farm Telemetry for <strong className="text-white">{currentCity}</strong> ·{' '}
            {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short' })}
          </p>
        </div>

        <div className="d-flex align-items-center gap-2">
          <button onClick={() => onNavigate('weather')} className="btn btn-wheat btn-sm fw-bold">
            🌦️ {t.weather}
          </button>
          <button onClick={() => onNavigate('irrigation')} className="btn btn-outline-light text-wheat border-wheat btn-sm fw-bold">
            💧 {t.irrigation}
          </button>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="row g-3">
        <div className="col-6 col-md-3">
          <StatCard
            icon="🌡️"
            value={`${c.temperature}°C`}
            label={t.temp}
            subtext={`${c.condition}`}
          />
        </div>
        <div className="col-6 col-md-3">
          <StatCard
            icon="💧"
            value={`${c.humidity}%`}
            label={t.humidity}
            subtext="Relative Moisture"
          />
        </div>
        <div className="col-6 col-md-3">
          <StatCard
            icon="💨"
            value={`${c.windKmh} km/h`}
            label={t.wind}
            subtext="Wind Velocity"
          />
        </div>
        <div className="col-6 col-md-3">
          <StatCard
            icon="🌧️"
            value={`${rainProb}%`}
            label={t.rainProb}
            subtext={`${tm.rainfallMm} mm Expected`}
            badge={isRainy ? 'RAIN RISK' : 'DRY'}
          />
        </div>
      </div>

      {/* TODAY'S AGRICULTURAL ACTIONS */}
      <section className="c2c-editorial-card p-4">
        <div className="d-flex align-items-center justify-content-between mb-4 pb-2 border-bottom border-subtle">
          <div>
            <h2 className="h4 font-editorial fw-bold text-charcoal mb-0">⚡ {t.actionsHeader}</h2>
            <small className="text-muted">High-priority agronomical recommendations for today</small>
          </div>
          <span className="badge-editorial-warning">DECISION ENGINE</span>
        </div>

        <div className="row g-3">
          {farmActions.map((act) => (
            <div className="col-md-6" key={act.id}>
              <div className="p-3 rounded-1 bg-ivory-card border border-subtle h-100">
                <div className="d-flex align-items-center justify-content-between mb-2">
                  <div className="fw-bold fs-6 text-charcoal d-flex align-items-center gap-2">
                    <span>{act.icon}</span> <span>{act.title}</span>
                  </div>
                  <span className={act.badgeClass}>{act.status}</span>
                </div>
                <p className="small text-muted mb-0">{act.reason}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Field Advisories & Alerts */}
      <div className="row g-4">
        <div className="col-lg-7">
          <div className="c2c-editorial-card p-4 h-100">
            <div className="d-flex align-items-center justify-content-between mb-3 pb-2 border-bottom border-subtle">
              <h2 className="h5 font-editorial fw-bold text-charcoal mb-0">🌾 Active Field Advisories</h2>
              <button onClick={() => onNavigate('advisory')} className="btn btn-sm btn-link text-wheat-dark fw-bold p-0">
                View All →
              </button>
            </div>
            {advisories.length === 0 ? (
              <p className="text-muted small mb-0">{t.none}</p>
            ) : (
              <div className="d-flex flex-column gap-3">
                {advisories.slice(0, 3).map((a, idx) => (
                  <div key={idx} className="p-3 bg-ivory-card rounded-1 border border-subtle">
                    <div className="fw-bold text-charcoal mb-1">{a.title}</div>
                    <p className="small text-muted mb-0">{a.advice}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="col-lg-5">
          <div className="c2c-editorial-card p-4 h-100">
            <div className="d-flex align-items-center justify-content-between mb-3 pb-2 border-bottom border-subtle">
              <h2 className="h5 font-editorial fw-bold text-charcoal mb-0">🔔 Weather & Pest Alerts</h2>
            </div>
            {alerts.length === 0 ? (
              <p className="text-muted small">No active emergency alerts for your location.</p>
            ) : (
              <div className="d-flex flex-column gap-2">
                {alerts.map((alt, i) => (
                  <div key={i} className="p-3 bg-ivory-card rounded-1 border-start border-3 border-warning">
                    <div className="fw-bold text-charcoal small">{alt.title || alt.message}</div>
                    <small className="text-muted">{alt.city} · Alert Telemetry</small>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
