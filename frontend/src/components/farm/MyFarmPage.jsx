import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import StatCard from '../common/StatCard';

export default function MyFarmPage({ currentCity, weather, alerts, onOpenOnboarding }) {
  const { user } = useAuth();
  const { t } = useLanguage();

  const farmSize = user?.farmSize || 5;
  const crops = user?.crops || ['Cotton', 'Wheat'];
  const irrigationMethod = user?.irrigationMethod || 'Drip';

  // Compute transparent Farm Health Score
  let healthScore = 92;
  const healthFactors = [];

  if (weather) {
    const c = weather.current;
    if (c.temperature > 38) {
      healthScore -= 10;
      healthFactors.push('Extreme heat stress detected (-10 pts)');
    }
    if (c.humidity > 85) {
      healthScore -= 8;
      healthFactors.push('High humidity pest/fungal risk (-8 pts)');
    }
  }

  if (alerts && alerts.length > 0) {
    healthScore -= 12;
    healthFactors.push(`Active weather/pest alert active in ${currentCity} (-12 pts)`);
  }

  if (healthFactors.length === 0) {
    healthFactors.push('Optimal thermal, humidity, and weather conditions (+92 pts baseline)');
  }

  healthScore = Math.max(40, Math.min(100, healthScore));

  return (
    <div className="my-farm-page d-flex flex-column gap-4 pb-5">
      {/* Header */}
      <div className="c2c-dark-panel p-4 p-md-5 rounded-2 shadow-sm d-flex flex-wrap align-items-center justify-content-between gap-3 border border-secondary border-opacity-25">
        <div>
          <span className="text-wheat small fw-bold tracking-wider uppercase">{t.myFarm} PROFILE</span>
          <h1 className="display-6 font-editorial fw-bold text-white mt-1 mb-1">
            {user ? `${user.name}'s Farm` : 'My Agricultural Plot'}
          </h1>
          <p className="text-sage mb-0">
            Located in <strong className="text-white">{currentCity}</strong> · {farmSize} Acres Plot
          </p>
        </div>

        <button onClick={onOpenOnboarding} className="btn btn-wheat btn-sm fw-bold">
          ✏️ Edit Farm Profile
        </button>
      </div>

      {/* Farm Health Summary */}
      <div className="c2c-editorial-card p-4">
        <div className="row align-items-center g-4">
          <div className="col-md-5 text-center border-end-md">
            <div className="text-muted small fw-bold mb-1">{t.farmHealth}</div>
            <div className="display-3 font-editorial fw-bold text-charcoal mb-2">{healthScore}%</div>
            <div className="progress mx-auto bg-ivory" style={{ height: 8, maxWidth: 220 }}>
              <div
                className="progress-bar bg-wheat"
                style={{ width: `${healthScore}%` }}
              />
            </div>
            <span className="badge-editorial-warning mt-3 d-inline-block">
              {healthScore > 80 ? 'EXCELLENT HEALTH' : healthScore > 60 ? 'MODERATE RISK' : 'ATTENTION REQUIRED'}
            </span>
          </div>

          <div className="col-md-7">
            <h3 className="h6 font-editorial fw-bold text-charcoal mb-3">🔍 Telemetry Health Factors:</h3>
            <ul className="list-group list-group-flush">
              {healthFactors.map((f, i) => (
                <li key={i} className="list-group-item bg-transparent px-0 text-muted small d-flex align-items-center gap-2 border-0">
                  <span>📌</span> <span>{f}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Profile Specs */}
      <div className="row g-3">
        <div className="col-md-4">
          <StatCard icon="📏" value={`${farmSize} Acres`} label={t.farmSize} subtext="Total Cultivated Land" />
        </div>
        <div className="col-md-4">
          <StatCard icon="💧" value={irrigationMethod} label={t.irrigationMethod} subtext="Watering Setup" />
        </div>
        <div className="col-md-4">
          <StatCard icon="🌱" value={`${crops.length} Crops`} label={t.cropsGrown} subtext={crops.join(', ')} />
        </div>
      </div>
    </div>
  );
}
