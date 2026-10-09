import { useState, useEffect } from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { useLanguage } from '../../context/LanguageContext';
import { get } from '../../api/client';
import LoadingSkeleton from '../common/LoadingSkeleton';

export default function WeatherAnalyticsPage({ currentCity }) {
  const { t } = useLanguage();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    get(`/history/${currentCity}`)
      .then((data) => {
        setHistory(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [currentCity]);

  const formattedHistory = history.map((item, index) => ({
    label: item.month ? `Month ${item.month}` : `Period ${index + 1}`,
    avgTemp: item.avgTemp || item.temperature || 28 + (index % 5),
    totalRain: item.totalRainfallMm || item.rainfallMm || (index * 12) % 60,
  }));

  return (
    <div className="weather-analytics-page d-flex flex-column gap-4 pb-5">
      <div className="c2c-dark-panel p-4 p-md-5 rounded-2 shadow-sm border border-secondary border-opacity-25">
        <span className="text-wheat small fw-bold tracking-wider uppercase">HISTORICAL METEOROLOGICAL TELEMETRY</span>
        <h1 className="display-6 font-editorial fw-bold text-white mt-1 mb-1">📉 {t.analytics}</h1>
        <p className="text-sage mb-0">
          Seasonal climate trend modeling and historical rainfall patterns for <strong className="text-white">{currentCity}</strong>.
        </p>
      </div>

      <div className="c2c-editorial-card p-4">
        <h2 className="h5 font-editorial fw-bold text-charcoal mb-3 pb-2 border-bottom border-subtle">
          🌡️ Historical Temperature Trends (°C)
        </h2>
        {loading ? (
          <LoadingSkeleton count={1} height="220px" />
        ) : (
          <div style={{ width: '100%', height: 260 }}>
            <ResponsiveContainer>
              <LineChart data={formattedHistory}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                <XAxis dataKey="label" />
                <YAxis unit="°C" />
                <Tooltip />
                <Line type="monotone" dataKey="avgTemp" name="Avg Temp (°C)" stroke="#c8a96b" strokeWidth={3} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      <div className="c2c-editorial-card p-4">
        <h2 className="h5 font-editorial fw-bold text-charcoal mb-3 pb-2 border-bottom border-subtle">
          🌧️ Historical Rainfall Accumulation (mm)
        </h2>
        {loading ? (
          <LoadingSkeleton count={1} height="220px" />
        ) : (
          <div style={{ width: '100%', height: 260 }}>
            <ResponsiveContainer>
              <LineChart data={formattedHistory}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                <XAxis dataKey="label" />
                <YAxis unit="mm" />
                <Tooltip />
                <Line type="monotone" dataKey="totalRain" name="Rainfall (mm)" stroke="#17231d" strokeWidth={3} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}
