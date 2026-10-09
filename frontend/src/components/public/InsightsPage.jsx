export default function InsightsPage() {
  return (
    <div className="insights-page py-5 px-3 px-md-5">
      <div className="container py-4">
        <div className="max-w-700 mb-5">
          <span className="text-wheat fw-bold uppercase tracking-wider small">AGRONOMIC INSIGHTS & RESEARCH</span>
          <h1 className="display-4 font-editorial fw-bold text-charcoal mt-1 mb-3">
            Climate Trends & Agricultural Science
          </h1>
          <p className="fs-5 text-muted">
            Explore editorial research on seasonal precipitation shifts, pest mitigation strategies, and thermal stress impact on Indian crop yields.
          </p>
        </div>

        <div className="row g-4">
          <div className="col-md-4">
            <div className="c2c-editorial-card p-4 h-100">
              <span className="badge-editorial-warning mb-2 d-inline-block">CLIMATE SCIENCE</span>
              <h3 className="h5 font-editorial fw-bold text-charcoal mb-2">
                Managing Thermal Stress in Rabi Crop Cycles
              </h3>
              <p className="text-muted small">
                How rising unseasonal temperatures impact wheat flowering and how targeted early morning irrigation mitigates yield loss.
              </p>
            </div>
          </div>

          <div className="col-md-4">
            <div className="c2c-editorial-card p-4 h-100">
              <span className="badge-editorial-success mb-2 d-inline-block">PEST PROTECTION</span>
              <h3 className="h5 font-editorial fw-bold text-charcoal mb-2">
                Humidity Thresholds for Fungal Blight Control
              </h3>
              <p className="text-muted small">
                Understanding the 80%+ relative humidity window and timing pesticide applications before rainfall events.
              </p>
            </div>
          </div>

          <div className="col-md-4">
            <div className="c2c-editorial-card p-4 h-100">
              <span className="badge-editorial-warning mb-2 d-inline-block">MARKET DYNAMICS</span>
              <h3 className="h5 font-editorial fw-bold text-charcoal mb-2">
                APMC Mandi Price Fluctuations in Gujarat
              </h3>
              <p className="text-muted small">
                Analyzing modal price variations for Cotton and Groundnut to select optimal harvest shipping windows.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
