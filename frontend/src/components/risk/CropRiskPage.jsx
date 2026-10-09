import { useLanguage } from '../../context/LanguageContext';
import StatCard from '../common/StatCard';
import LoadingSkeleton from '../common/LoadingSkeleton';

export default function CropRiskPage({ weather, currentCity }) {
  const { t } = useLanguage();

  if (!weather) return <LoadingSkeleton count={2} height="180px" />;

  const c = weather.current;
  const tm = weather.forecast[1] || weather.forecast[0];

  const fungalRisk = c.humidity > 80 && c.temperature >= 24 && c.temperature <= 32 ? 'HIGH' : c.humidity > 65 ? 'MEDIUM' : 'LOW';
  const heatStressRisk = c.temperature > 38 ? 'HIGH' : c.temperature > 34 ? 'MEDIUM' : 'LOW';
  const rainfallRisk = tm.rainProbability >= 70 ? 'HIGH' : tm.rainProbability >= 40 ? 'MEDIUM' : 'LOW';
  const pestInfestationRisk = c.humidity > 75 && c.temperature > 28 ? 'MEDIUM-HIGH' : 'LOW';

  return (
    <div className="crop-risk-page d-flex flex-column gap-4 pb-5">
      <div className="c2c-dark-panel p-4 p-md-5 rounded-2 shadow-sm border border-secondary border-opacity-25">
        <span className="text-wheat small fw-bold tracking-wider uppercase">CROP PROTECTION ENGINE</span>
        <h1 className="display-6 font-editorial fw-bold text-white mt-1 mb-1">🛡️ {t.risk}</h1>
        <p className="text-sage mb-0">
          Vulnerability modeling based on humidity thresholds, thermal stress, and precipitation forecasts for <strong className="text-white">{currentCity}</strong>.
        </p>
      </div>

      <div className="row g-3">
        <div className="col-md-3">
          <StatCard icon="🍄" value={fungalRisk} label="Fungal Disease Risk" subtext={`Humidity ${c.humidity}%`} badge={fungalRisk} />
        </div>
        <div className="col-md-3">
          <StatCard icon="🔥" value={heatStressRisk} label="Thermal Heat Stress" subtext={`Current ${c.temperature}°C`} badge={heatStressRisk} />
        </div>
        <div className="col-md-3">
          <StatCard icon="🌧️" value={rainfallRisk} label="Rainfall Damage Risk" subtext={`${tm.rainProbability}% Chance`} badge={rainfallRisk} />
        </div>
        <div className="col-md-3">
          <StatCard icon="🐛" value={pestInfestationRisk} label="Pest Vector Risk" subtext="Moisture Level" badge={pestInfestationRisk} />
        </div>
      </div>

      <div className="c2c-editorial-card p-4">
        <h2 className="h5 font-editorial fw-bold text-charcoal mb-3 pb-2 border-bottom border-subtle">
          🔍 Agronomic Risk Breakdown & Mitigation
        </h2>

        <div className="d-flex flex-column gap-3">
          <div className="p-3 bg-ivory-card rounded-1 border border-subtle">
            <div className="d-flex justify-content-between align-items-center mb-1">
              <div className="fw-bold text-charcoal fs-6">🍄 Fungal Spore & Blight Vulnerability</div>
              <span className="badge-editorial-warning">{fungalRisk} RISK</span>
            </div>
            <p className="small text-muted mb-0">
              Relative humidity exceeding 65% triggers fungal spore germination in Cotton, Wheat, and Tomato crops. Ensure adequate canopy spacing and field drainage.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
