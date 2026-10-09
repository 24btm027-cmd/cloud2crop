import { useState, useEffect } from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { useLanguage } from '../../context/LanguageContext';
import { get } from '../../api/client';
import LoadingSkeleton from '../common/LoadingSkeleton';

export default function MarketIntelligencePage() {
  const { t } = useLanguage();
  const [selectedCrop, setSelectedCrop] = useState('cotton');
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);

  const availableCrops = [
    'cotton', 'groundnut', 'castor', 'bajra', 'wheat',
    'cumin', 'mustard', 'chickpea', 'maize', 'rice'
  ];

  useEffect(() => {
    setLoading(true);
    get(`/market?crop=${selectedCrop}`)
      .then((data) => {
        setRows(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [selectedCrop]);

  return (
    <div className="market-intelligence-page d-flex flex-column gap-4 pb-5">
      <div className="c2c-dark-panel p-4 p-md-5 rounded-2 shadow-sm border border-secondary border-opacity-25">
        <span className="text-wheat small fw-bold tracking-wider uppercase">MANDI PRICE TELEMETRY</span>
        <h1 className="display-6 font-editorial fw-bold text-white mt-1 mb-1">📈 {t.market}</h1>
        <p className="text-sage mb-0">
          Live Mandi modal, minimum, and maximum prices per quintal across key APMC markets.
        </p>
      </div>

      <div className="c2c-editorial-card p-4">
        <div className="d-flex flex-wrap align-items-center justify-content-between gap-3">
          <div>
            <label className="form-label fw-bold text-charcoal mb-1">Select Crop Category:</label>
            <select
              value={selectedCrop}
              onChange={(e) => setSelectedCrop(e.target.value)}
              className="form-select form-select-lg fw-bold text-charcoal border-subtle"
              style={{ minWidth: 220 }}
            >
              {availableCrops.map((c) => (
                <option key={c} value={c} className="text-capitalize">
                  {c.toUpperCase()}
                </option>
              ))}
            </select>
          </div>

          <span className="badge-editorial-warning">APMC TELEMETRY DATA</span>
        </div>
      </div>

      {!loading && rows.length > 0 && (
        <div className="c2c-editorial-card p-4">
          <h2 className="h5 font-editorial fw-bold text-charcoal mb-3 pb-2 border-bottom border-subtle">
            📊 Mandi Modal Price Comparison (₹/Quintal)
          </h2>
          <div style={{ width: '100%', height: 280 }}>
            <ResponsiveContainer>
              <BarChart data={rows}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                <XAxis dataKey="market" />
                <YAxis unit="₹" />
                <Tooltip formatter={(val) => `₹${val}`} />
                <Bar dataKey="modalPrice" name="Modal Price (₹)" fill="#17231d" radius={[2, 2, 0, 0]} />
                <Bar dataKey="minPrice" name="Min Price (₹)" fill="#c8a96b" radius={[2, 2, 0, 0]} />
                <Bar dataKey="maxPrice" name="Max Price (₹)" fill="#6e7966" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      <div className="c2c-editorial-card p-4">
        <h2 className="h5 font-editorial fw-bold text-charcoal mb-3 pb-2 border-bottom border-subtle">
          🏛️ APMC Mandi Listings
        </h2>

        {loading ? (
          <LoadingSkeleton count={3} height="80px" />
        ) : rows.length === 0 ? (
          <p className="text-muted">No price records found for this crop.</p>
        ) : (
          <div className="d-flex flex-column gap-2">
            {rows.map((r, i) => (
              <div key={i} className="p-3 bg-ivory-card rounded-1 d-flex align-items-center justify-content-between border border-subtle">
                <div>
                  <div className="fw-bold fs-5 text-charcoal font-editorial">{r.market} APMC</div>
                  <small className="text-muted">Graded Produce Pricing</small>
                </div>
                <div className="text-end">
                  <div className="fs-4 font-editorial fw-bold text-wheat-dark">₹{r.modalPrice}</div>
                  <small className="text-muted">
                    Range: ₹{r.minPrice} – ₹{r.maxPrice} / Quintal
                  </small>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
