import { useLanguage } from '../../context/LanguageContext';
import StatCard from '../common/StatCard';
import LoadingSkeleton from '../common/LoadingSkeleton';

export default function SmartIrrigationPage({ weather, currentCity }) {
  const { t } = useLanguage();

  if (!weather) return <LoadingSkeleton count={2} height="180px" />;

  const c = weather.current;
  const tm = weather.forecast[1] || weather.forecast[0];
  const rainProb = tm.rainProbability || 0;
  const rainMm = tm.rainfallMm || 0;

  const isRainy = rainProb >= 50 || rainMm >= 5;
  const isHighEvap = c.temperature > 35 && c.humidity < 50;

  let recommendation = 'STANDARD IRRIGATION';
  let badgeClass = 'badge-editorial-success';
  let reasonText = 'Weather telemetry indicates normal evapotranspiration. Irrigate according to standard crop schedule.';
  let recommendedWindow = '06:00 AM – 09:00 AM (Early Morning)';

  if (isRainy) {
    recommendation = 'HOLD / DELAY IRRIGATION';
    badgeClass = 'badge-editorial-warning';
    reasonText = `High rain probability (${rainProb}%) with ${rainMm}mm expected tomorrow. Natural precipitation will cover root moisture.`;
    recommendedWindow = 'No irrigation required for the next 36 hours.';
  } else if (isHighEvap) {
    recommendation = 'INCREASE WATERING VOLUME (+20%)';
    badgeClass = 'badge-editorial-warning';
    reasonText = `High temperature (${c.temperature}°C) combined with low humidity (${c.humidity}%) increases evapotranspiration loss.`;
    recommendedWindow = '06:00 PM – 09:00 PM (Late Evening to minimize heat loss)';
  }

  return (
    <div className="smart-irrigation-page d-flex flex-column gap-4 pb-5">
      <div className="c2c-dark-panel p-4 p-md-5 rounded-2 shadow-sm border border-secondary border-opacity-25">
        <span className="text-wheat small fw-bold tracking-wider uppercase">PRECISION WATER MANAGEMENT</span>
        <h1 className="display-6 font-editorial fw-bold text-white mt-1 mb-1">💧 {t.irrigation}</h1>
        <p className="text-sage mb-0">
          Smart watering schedules calculated from real-time climate telemetry for <strong className="text-white">{currentCity}</strong>.
        </p>
      </div>

      <div className="c2c-editorial-card p-4 border-start border-4 border-warning">
        <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-3 pb-2 border-bottom border-subtle">
          <div>
            <div className="text-muted small fw-bold uppercase">RECOMMENDED ACTION:</div>
            <h2 className="h3 font-editorial fw-bold text-charcoal mb-0">{recommendation}</h2>
          </div>
          <span className={badgeClass}>{recommendation}</span>
        </div>

        <p className="fs-6 text-charcoal mb-4">{reasonText}</p>

        <div className="p-3 bg-ivory-card rounded-1 border border-subtle">
          <div className="fw-bold text-charcoal mb-1">⏰ Recommended Watering Window:</div>
          <div className="fs-5 font-editorial fw-semibold text-wheat-dark">{recommendedWindow}</div>
        </div>
      </div>

      <div className="c2c-editorial-card p-4">
        <h3 className="h5 font-editorial fw-bold text-charcoal mb-3 pb-2 border-bottom border-subtle">
          📊 Telemetry Inputs & Reasoning Breakdown
        </h3>

        <div className="row g-3">
          <div className="col-md-3">
            <StatCard icon="🌧️" value={`${rainProb}%`} label="Rain Probability" subtext={`${rainMm} mm Expected`} />
          </div>
          <div className="col-md-3">
            <StatCard icon="🌡️" value={`${c.temperature}°C`} label="Temperature" subtext="Thermal Factor" />
          </div>
          <div className="col-md-3">
            <StatCard icon="💧" value={`${c.humidity}%`} label="Humidity" subtext="Relative Moisture" />
          </div>
          <div className="col-md-3">
            <StatCard icon="💨" value={`${c.windKmh} km/h`} label="Wind Speed" subtext="Evaporation Rate" />
          </div>
        </div>
      </div>
    </div>
  );
}
