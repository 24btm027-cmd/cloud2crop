import { ResponsiveContainer, ComposedChart, Bar, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { useLanguage } from '../../context/LanguageContext';
import StatCard from '../common/StatCard';
import LoadingSkeleton from '../common/LoadingSkeleton';

const icon = (c) => (/heavy/i.test(c) ? '⛈️' : /rain/i.test(c) ? '🌧️' : /cloud/i.test(c) ? '⛅' : '☀️');

export default function WeatherPage({ weather, currentCity }) {
  const { t } = useLanguage();

  if (!weather) return <LoadingSkeleton count={3} height="200px" />;

  const c = weather.current;
  const chartData = weather.forecast.map((f) => ({
    day: f.date.slice(5),
    rain: f.rainfallMm,
    max: f.tempMax,
    min: f.tempMin,
  }));

  return (
    <div className="weather-page d-flex flex-column gap-4 pb-5">
      {/* Editorial Header */}
      <div className="c2c-dark-panel p-4 p-md-5 rounded-2 shadow-sm border border-secondary border-opacity-25">
        <div className="row align-items-center g-4">
          <div className="col-md-7 d-flex align-items-center gap-3">
            <span style={{ fontSize: '4.5rem' }}>{icon(c.condition)}</span>
            <div>
              <div className="display-3 font-editorial fw-bold text-white lh-1">{c.temperature}°C</div>
              <div className="fs-5 text-sage mt-1">
                {currentCity} · {c.condition}
              </div>
            </div>
          </div>
          <div className="col-md-5">
            <div className="p-3 bg-black bg-opacity-30 rounded-1 border border-secondary border-opacity-25 text-sage small">
              <div className="d-flex justify-content-between border-bottom border-secondary border-opacity-25 pb-2 mb-2">
                <span>{t.feelsLike}:</span> <strong className="text-white">{c.temperature + 2}°C</strong>
              </div>
              <div className="d-flex justify-content-between border-bottom border-secondary border-opacity-25 pb-2 mb-2">
                <span>{t.humidity}:</span> <strong className="text-white">{c.humidity}%</strong>
              </div>
              <div className="d-flex justify-content-between">
                <span>{t.wind}:</span> <strong className="text-white">{c.windKmh} km/h</strong>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="row g-3">
        <div className="col-4">
          <StatCard icon="💧" value={`${c.humidity}%`} label={t.humidity} />
        </div>
        <div className="col-4">
          <StatCard icon="💨" value={`${c.windKmh} km/h`} label={t.wind} />
        </div>
        <div className="col-4">
          <StatCard icon="🕶️" value={c.uvIndex} label={t.uv} />
        </div>
      </div>

      {/* Recharts Chart */}
      <div className="c2c-editorial-card p-4">
        <div className="d-flex align-items-center justify-content-between mb-3 pb-2 border-bottom border-subtle">
          <h2 className="h5 font-editorial fw-bold text-charcoal mb-0">📈 7-Day Temperature & Rainfall Trends</h2>
          <div className="small text-muted">
            <span className="text-danger fw-bold">■ Max °C</span> ·{' '}
            <span className="text-success fw-bold">■ Min °C</span> ·{' '}
            <span className="text-primary fw-bold">■ Rain mm</span>
          </div>
        </div>

        <div style={{ width: '100%', height: 300 }}>
          <ResponsiveContainer>
            <ComposedChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
              <XAxis dataKey="day" />
              <YAxis yAxisId="l" unit="°C" />
              <YAxis yAxisId="r" orientation="right" unit="mm" />
              <Tooltip />
              <Bar yAxisId="r" dataKey="rain" name="Rainfall (mm)" fill="#17231d" radius={[2, 2, 0, 0]} />
              <Line yAxisId="l" dataKey="max" name="Max Temp (°C)" stroke="#c8a96b" strokeWidth={3} dot={{ r: 4 }} />
              <Line yAxisId="l" dataKey="min" name="Min Temp (°C)" stroke="#6e7966" strokeWidth={3} dot={{ r: 4 }} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 7-Day Grid Cards */}
      <div className="c2c-editorial-card p-4">
        <h2 className="h5 font-editorial fw-bold text-charcoal mb-3 pb-2 border-bottom border-subtle">📅 {t.week}</h2>
        <div className="row row-cols-2 row-cols-sm-4 row-cols-md-7 g-2 text-center">
          {weather.forecast.map((f) => (
            <div className="col" key={f.date}>
              <div className="p-2 bg-ivory-card rounded-1 border border-subtle h-100">
                <div className="fw-bold small text-charcoal">{f.date.slice(5)}</div>
                <div className="fs-3 my-1">{icon(f.condition)}</div>
                <div className="small fw-semibold text-charcoal">{f.tempMax}° / {f.tempMin}°</div>
                <small className="text-muted d-block mt-1">💧 {f.rainProbability}%</small>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
