import { useLanguage } from '../../context/LanguageContext';

export default function SolutionsPage({ onGetStarted }) {
  const { t } = useLanguage();

  return (
    <div className="solutions-page py-5 px-3 px-md-5">
      <div className="container py-4">
        {/* Header */}
        <div className="max-w-700 mb-5">
          <span className="text-wheat fw-bold uppercase tracking-wider small">CLIMATE & AGRI SOLUTIONS</span>
          <h1 className="display-4 font-editorial fw-bold text-charcoal mt-1 mb-3">
            Precision Climate Solutions Built for Modern Agriculture
          </h1>
          <p className="fs-5 text-muted">
            From hyper-local micro-climate forecasts to soil parameter matching, Cloud2Crop delivers end-to-end intelligence for every phase of crop cultivation.
          </p>
        </div>

        {/* Solutions Grid */}
        <div className="row g-4 mb-5">
          <div className="col-md-6">
            <div className="c2c-editorial-card p-4 p-md-5 h-100">
              <div className="text-wheat fs-1 mb-3">🌦️</div>
              <h3 className="h4 font-editorial fw-bold text-charcoal">Micro-Climate Telemetry</h3>
              <p className="text-muted">
                Hyper-local weather forecasts tailored to your exact district grid. Monitor 7-day temperature curves, rain probability, wind velocity, and evapotranspiration rates.
              </p>
            </div>
          </div>

          <div className="col-md-6">
            <div className="c2c-editorial-card p-4 p-md-5 h-100">
              <div className="text-wheat fs-1 mb-3">🌱</div>
              <h3 className="h4 font-editorial fw-bold text-charcoal">Soil & Crop Matching</h3>
              <p className="text-muted">
                Match your land's soil N, P, K, and pH values against optimal growth windows for Cotton, Wheat, Cumin, Groundnut, and regional crops.
              </p>
            </div>
          </div>

          <div className="col-md-6">
            <div className="c2c-editorial-card p-4 p-md-5 h-100">
              <div className="text-wheat fs-1 mb-3">💧</div>
              <h3 className="h4 font-editorial fw-bold text-charcoal">Precision Irrigation Timing</h3>
              <p className="text-muted">
                Conserve water and optimize root moisture. Our irrigation engine calculates exact watering windows based on rainfall forecasts and evaporation indices.
              </p>
            </div>
          </div>

          <div className="col-md-6">
            <div className="c2c-editorial-card p-4 p-md-5 h-100">
              <div className="text-wheat fs-1 mb-3">📈</div>
              <h3 className="h4 font-editorial fw-bold text-charcoal">Live Mandi Market Intelligence</h3>
              <p className="text-muted">
                Access modal, minimum, and maximum prices per quintal across APMC markets in Gujarat to maximize harvest profitability.
              </p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="c2c-dark-panel p-5 text-center rounded-2">
          <h2 className="h3 font-editorial fw-bold mb-3 text-white">Deploy Climate Intelligence on Your Farm</h2>
          <button onClick={onGetStarted} className="btn btn-wheat btn-lg fw-bold px-4">
            {t.getStarted} →
          </button>
        </div>
      </div>
    </div>
  );
}
