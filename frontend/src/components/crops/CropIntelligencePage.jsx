import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { get, post } from '../../api/client';
import LoadingSkeleton from '../common/LoadingSkeleton';

export default function CropIntelligencePage({ weather }) {
  const { user } = useAuth();
  const { t, lang } = useLanguage();

  const c = weather?.current || { temperature: 30, humidity: 65 };
  const totalRain = weather?.forecast ? weather.forecast.reduce((s, f) => s + f.rainfallMm, 0) : 10;

  const [form, setForm] = useState({
    temperature: c.temperature,
    humidity: c.humidity,
    rainfall: Math.round(totalRain * 4),
    ph: user?.soil?.ph ?? 7,
    N: user?.soil?.N ?? 80,
    P: user?.soil?.P ?? 40,
    K: user?.soil?.K ?? 40,
  });

  const [results, setResults] = useState([]);
  const [allCrops, setAllCrops] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    get('/crops')
      .then(setAllCrops)
      .catch(() => {});
  }, []);

  const handleRecommend = async () => {
    setLoading(true);
    try {
      const res = await post('/recommend', form);
      setResults(res);
    } catch {
      // Handled
    } finally {
      setLoading(false);
    }
  };

  const getLocalizedCropName = (cropId) => {
    const found = allCrops.find((x) => x.id === cropId);
    if (!found) return cropId;
    return lang === 'hi' ? found.nameHi : lang === 'gu' ? found.nameGu : found.name;
  };

  const inputLabels = {
    temperature: t.temp,
    humidity: t.humidity,
    rainfall: t.rain,
    ph: 'Soil pH Level',
    N: 'Nitrogen (N) kg/ha',
    P: 'Phosphorus (P) kg/ha',
    K: 'Potassium (K) kg/ha',
  };

  return (
    <div className="crop-intelligence-page d-flex flex-column gap-4 pb-5">
      {/* Header */}
      <div className="c2c-dark-panel p-4 p-md-5 rounded-2 shadow-sm border border-secondary border-opacity-25">
        <span className="text-wheat small fw-bold tracking-wider uppercase">{t.crops} ENGINE</span>
        <h1 className="display-6 font-editorial fw-bold text-white mt-1 mb-1">🌱 Soil & Crop Intelligence</h1>
        <p className="text-sage mb-0">
          Analyze soil nitrogen, phosphorus, potassium, pH, and precipitation thresholds against agronomic fit curves.
        </p>
      </div>

      {/* Input Form */}
      <div className="c2c-editorial-card p-4">
        <h2 className="h5 font-editorial fw-bold text-charcoal mb-3 pb-2 border-bottom border-subtle">
          ⚙️ Soil & Meteorological Parameters
        </h2>

        <div className="row g-3 mb-4">
          {Object.keys(form).map((key) => (
            <div className="col-6 col-md-3" key={key}>
              <label className="form-label fw-semibold text-charcoal small">{inputLabels[key]}</label>
              <input
                type="number"
                step="any"
                className="form-control form-control-lg fs-6 border-subtle"
                value={form[key]}
                onChange={(e) => setForm({ ...form, [key]: +e.target.value })}
              />
            </div>
          ))}
        </div>

        <button
          onClick={handleRecommend}
          className="btn btn-wheat btn-lg w-100 fw-bold"
          disabled={loading}
        >
          {loading ? 'Analyzing Fit Score...' : `🌱 ${t.suggest}`}
        </button>
      </div>

      {/* Results */}
      {results.length > 0 && (
        <div className="c2c-editorial-card p-4">
          <h2 className="h4 font-editorial fw-bold text-charcoal mb-3 pb-2 border-bottom border-subtle">
            ✨ {t.result}
          </h2>

          <div className="d-flex flex-column gap-3">
            {results.map((r) => (
              <div key={r.id} className="p-3 bg-ivory-card rounded-1 border border-subtle">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <div>
                    <span className="fw-bold fs-5 text-charcoal">{getLocalizedCropName(r.id)}</span>
                    <span className="badge-editorial-success ms-2">{r.season} Season</span>
                  </div>
                  <div className="fs-4 font-editorial fw-bold text-wheat-dark">{r.score}% Fit Score</div>
                </div>

                <div className="progress bg-ivory mb-2" style={{ height: 8 }}>
                  <div className="progress-bar bg-wheat" style={{ width: `${r.score}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
