import { useLanguage } from '../../context/LanguageContext';

export default function LandingPage({ onGetStarted, onExplore, onOpenVoice }) {
  const { t } = useLanguage();

  return (
    <div className="landing-page pb-5">
      {/* Editorial Hero Section */}
      <section className="position-relative overflow-hidden py-5 px-3 px-md-5 mb-5 bg-charcoal text-white rounded-2 border border-secondary border-opacity-25">
        <div
          className="position-absolute top-0 start-0 w-100 h-100 opacity-20 pointer-events-none"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1500382017468-9049fed747ef?q=80&w=1600&auto=format&fit=crop')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
        <div className="container py-5 position-relative z-1">
          <div className="row align-items-center g-5">
            <div className="col-lg-7">
              <span className="badge-editorial-warning text-wheat border-wheat mb-3 d-inline-block">
                CLIMATE & AGRICULTURE INTELLIGENCE
              </span>
              <h1 className="display-3 font-editorial fw-bold lh-1 mb-3 text-white">
                Smarter decisions for every acre.
              </h1>
              <p className="fs-5 text-sage mb-4" style={{ maxWidth: 600 }}>
                Cloud2Crop combines weather intelligence, crop insights and agricultural advisory to help farmers make better decisions at the right time.
              </p>
              <div className="d-flex flex-wrap gap-3">
                <button onClick={onGetStarted} className="btn btn-wheat btn-lg fw-bold px-4 py-3">
                  Get Started →
                </button>
                <button onClick={onExplore} className="btn btn-outline-light text-white border-secondary px-4 py-3">
                  Explore Platform
                </button>
                <button onClick={onOpenVoice} className="btn btn-link text-wheat text-decoration-none fw-semibold">
                  🎙️ Voice Assistant
                </button>
              </div>
            </div>
            <div className="col-lg-5">
              <div className="c2c-dark-panel p-4 rounded-2 border border-wheat border-opacity-25 shadow-lg">
                <div className="d-flex align-items-center justify-content-between mb-3 border-bottom border-secondary border-opacity-25 pb-2">
                  <span className="text-wheat small fw-bold tracking-wider uppercase">LIVE TELEMETRY SNAPSHOT</span>
                  <span className="small text-sage">AHMEDABAD</span>
                </div>
                <div className="row g-2 mb-3">
                  <div className="col-6">
                    <div className="p-3 bg-black bg-opacity-25 rounded-1">
                      <div className="text-sage small">Temperature</div>
                      <div className="display-6 font-editorial fw-bold text-white">32°C</div>
                    </div>
                  </div>
                  <div className="col-6">
                    <div className="p-3 bg-black bg-opacity-25 rounded-1">
                      <div className="text-sage small">Rain Probability</div>
                      <div className="display-6 font-editorial fw-bold text-wheat">85%</div>
                    </div>
                  </div>
                </div>
                <div className="p-3 bg-wheat bg-opacity-10 border border-wheat border-opacity-25 rounded-1 text-wheat small">
                  <strong>⚠️ Field Decision Alert:</strong> High rain probability expected. Delay irrigation & hold pesticide spraying for the next 24 hours.
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 01: Weather Intelligence */}
      <section className="container mb-5 py-4">
        <div className="row align-items-center g-5">
          <div className="col-lg-5">
            <span className="text-wheat fw-bold uppercase tracking-wider small">01 / WEATHER INTELLIGENCE</span>
            <h2 className="display-5 font-editorial fw-bold text-charcoal mt-2 mb-3">
              Transforming raw weather data into clear field action.
            </h2>
            <p className="text-muted fs-6">
              Standard forecasts tell you the temperature. Cloud2Crop models how temperature, humidity, wind velocity, and solar radiation directly impact your crop's root moisture and fungal vulnerability.
            </p>
          </div>
          <div className="col-lg-7">
            <div className="row g-3">
              <div className="col-md-6">
                <div className="c2c-editorial-card p-4 h-100">
                  <div className="fw-bold text-charcoal mb-1">🌦️ Micro-Climate Telemetry</div>
                  <p className="text-muted small mb-0">District-level precision forecast grids tracking hourly rain probability and heat stress windows.</p>
                </div>
              </div>
              <div className="col-md-6">
                <div className="c2c-editorial-card p-4 h-100">
                  <div className="fw-bold text-charcoal mb-1">📈 7-Day Trend Analysis</div>
                  <p className="text-muted small mb-0">Visual temperature curves and precipitation indices mapped directly against crop stage maturity.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 02: Decisions, Not Just Data */}
      <section className="bg-ivory-card py-5 px-3 px-md-5 mb-5 border-top border-bottom border-subtle">
        <div className="container py-3">
          <div className="text-center max-w-700 mx-auto mb-5">
            <span className="text-wheat fw-bold uppercase tracking-wider small">02 / ACTIONABLE GUIDANCE</span>
            <h2 className="display-6 font-editorial fw-bold text-charcoal mt-1">Decisions, not just data.</h2>
            <p className="text-muted">Cloud2Crop synthesizes meteorological telemetry into plain-language field recommendations.</p>
          </div>

          <div className="row g-3">
            <div className="col-md-3">
              <div className="c2c-editorial-card p-4 h-100 border-start border-3 border-warning">
                <div className="text-wheat fw-bold mb-1">🌧️ Rain Expected</div>
                <div className="fw-bold text-charcoal fs-5 mb-2">Delay Irrigation</div>
                <p className="text-muted small mb-0">Prevents root waterlogging and saves water energy costs prior to precipitation.</p>
              </div>
            </div>
            <div className="col-md-3">
              <div className="c2c-editorial-card p-4 h-100 border-start border-3 border-danger">
                <div className="text-danger fw-bold mb-1">💨 High Wind</div>
                <div className="fw-bold text-charcoal fs-5 mb-2">Avoid Spraying</div>
                <p className="text-muted small mb-0">Prevents chemical drift loss and ensures maximum spray adherence to crop canopy.</p>
              </div>
            </div>
            <div className="col-md-3">
              <div className="c2c-editorial-card p-4 h-100 border-start border-3 border-warning">
                <div className="text-wheat fw-bold mb-1">💧 High Humidity</div>
                <div className="fw-bold text-charcoal fs-5 mb-2">Monitor Disease Risk</div>
                <p className="text-muted small mb-0">Alerts farmers to fungal spore germination risk in Cotton, Wheat and Tomato crops.</p>
              </div>
            </div>
            <div className="col-md-3">
              <div className="c2c-editorial-card p-4 h-100 border-start border-3 border-success">
                <div className="text-success fw-bold mb-1">🔥 Extreme Heat</div>
                <div className="fw-bold text-charcoal fs-5 mb-2">Adjust Watering Window</div>
                <p className="text-muted small mb-0">Shifts watering to early morning/evening to minimize thermal evapotranspiration.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 03: Built Around Your Farm */}
      <section className="container mb-5 py-3">
        <div className="row align-items-center g-5">
          <div className="col-lg-6">
            <span className="text-wheat fw-bold uppercase tracking-wider small">03 / PERSONALIZATION</span>
            <h2 className="display-5 font-editorial fw-bold text-charcoal mt-2 mb-3">
              Built around your farm profile.
            </h2>
            <p className="text-muted fs-6 mb-4">
              Configure your farm acreage, crops grown, and irrigation setup. Cloud2Crop adapts recommendations to your specific land parameters and soil profile.
            </p>
            <button onClick={onGetStarted} className="btn btn-charcoal fw-bold">
              Configure Your Farm Profile →
            </button>
          </div>
          <div className="col-lg-6">
            <div className="c2c-editorial-card p-4 p-md-5">
              <div className="d-flex justify-content-between align-items-center mb-3 pb-2 border-bottom border-subtle">
                <span className="fw-bold text-charcoal">FARM SPECIFICATIONS</span>
                <span className="badge-editorial-success">ACTIVE PROFILE</span>
              </div>
              <div className="row g-3 text-muted small">
                <div className="col-6">
                  <strong>Acreage:</strong> 5.0 Acres
                </div>
                <div className="col-6">
                  <strong>Irrigation:</strong> Drip System
                </div>
                <div className="col-6">
                  <strong>Primary Crops:</strong> Cotton, Wheat
                </div>
                <div className="col-6">
                  <strong>Soil pH:</strong> 7.2 (Optimal)
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 04: One Platform. Multiple Decisions */}
      <section className="container mb-5">
        <div className="text-center max-w-700 mx-auto mb-5">
          <span className="text-wheat fw-bold uppercase tracking-wider small">04 / INTEGRATED ENGINE</span>
          <h2 className="display-6 font-editorial fw-bold text-charcoal mt-1">One platform. Multiple decisions.</h2>
        </div>

        <div className="row g-4 text-center">
          {[
            { title: 'Weather', desc: 'Hourly & 7-day micro forecasts', icon: '🌦️' },
            { title: 'Crops', desc: 'Soil N-P-K suitability matching', icon: '🌱' },
            { title: 'Irrigation', desc: 'Evapotranspiration watering windows', icon: '💧' },
            { title: 'Advisory', desc: 'Pest and disease warnings', icon: '🛡️' },
            { title: 'Market', desc: 'Live APMC Mandi prices', icon: '📈' },
            { title: 'Analytics', desc: 'Historical climate trend curves', icon: '📉' },
          ].map((item, idx) => (
            <div className="col-6 col-md-4" key={idx}>
              <div className="c2c-editorial-card p-4 h-100">
                <div className="fs-2 mb-2">{item.icon}</div>
                <h3 className="h5 font-editorial fw-bold text-charcoal mb-1">{item.title}</h3>
                <p className="text-muted small mb-0">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Section 05: Product UI Preview */}
      <section className="bg-charcoal text-white py-5 px-3 px-md-5 mb-5 rounded-2">
        <div className="container py-3">
          <div className="row align-items-center g-5">
            <div className="col-lg-6">
              <span className="text-wheat fw-bold uppercase tracking-wider small">05 / PLATFORM INTERFACE</span>
              <h2 className="display-6 font-editorial fw-bold text-white mt-2 mb-3">
                Agriculture intelligence at a glance.
              </h2>
              <p className="text-sage mb-4">
                Designed for clarity, quick decision-making, and effortless navigation across mobile and desktop devices.
              </p>
              <button onClick={onExplore} className="btn btn-wheat fw-bold px-4 py-3">
                View Interactive Demo →
              </button>
            </div>
            <div className="col-lg-6">
              <div className="c2c-dark-panel p-4 rounded-2 border border-secondary border-opacity-25">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <span className="fw-bold text-white">FARM HEALTH SCORE</span>
                  <span className="text-wheat fw-bold">92%</span>
                </div>
                <div className="progress bg-secondary bg-opacity-25 mb-3" style={{ height: 6 }}>
                  <div className="progress-bar bg-wheat" style={{ width: '92%' }} />
                </div>
                <small className="text-sage d-block">
                  Optimal thermal and humidity conditions verified for active cotton growth cycle.
                </small>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 06: Final CTA */}
      <section className="container text-center py-5">
        <div className="c2c-editorial-card p-5 max-w-800 mx-auto">
          <h2 className="display-6 font-editorial fw-bold text-charcoal mb-3">
            Make every farming decision with better information.
          </h2>
          <p className="text-muted fs-5 mb-4">
            Join thousands of agricultural producers making data-backed crop choices.
          </p>
          <button onClick={onGetStarted} className="btn btn-wheat btn-lg fw-bold px-5 py-3">
            Get Started Free →
          </button>
        </div>
      </section>
    </div>
  );
}
