export default function AboutPage() {
  return (
    <div className="about-page py-5 px-3 px-md-5">
      <div className="container py-4">
        <div className="max-w-700 mb-5">
          <span className="text-wheat fw-bold uppercase tracking-wider small">OUR MISSION</span>
          <h1 className="display-4 font-editorial fw-bold text-charcoal mt-1 mb-3">
            Transforming Agricultural Resilience Through Science
          </h1>
          <p className="fs-5 text-muted">
            Cloud2Crop was built to bridge the gap between complex meteorological satellite data and practical, day-to-day decisions on the farm.
          </p>
        </div>

        <div className="row g-4 align-items-center mb-5">
          <div className="col-lg-6">
            <div className="c2c-editorial-card p-4 p-md-5">
              <h2 className="h3 font-editorial fw-bold text-charcoal mb-3">Science Meets Agronomy</h2>
              <p className="text-muted">
                By modeling real-time temperature, humidity, evapotranspiration indices, and soil chemistry against crop-specific biometric curves, Cloud2Crop empowers farmers to make precise watering, spraying, and harvesting decisions.
              </p>
              <div className="row g-3 mt-2">
                <div className="col-6">
                  <div className="fw-bold fs-3 text-charcoal font-editorial">10+</div>
                  <div className="small text-sage-dark">Agri Intelligence Engines</div>
                </div>
                <div className="col-6">
                  <div className="fw-bold fs-3 text-charcoal font-editorial">3 Languages</div>
                  <div className="small text-sage-dark">English, Hindi & Gujarati</div>
                </div>
              </div>
            </div>
          </div>
          <div className="col-lg-6">
            <div className="c2c-dark-panel p-5 rounded-2">
              <span className="text-wheat fw-bold uppercase tracking-wider small">CORE VALUES</span>
              <h3 className="h4 font-editorial fw-bold text-white mt-2 mb-3">Data Accuracy & Transparency</h3>
              <p className="text-sage mb-0">
                We believe in transparent algorithms. Every irrigation guidance, crop suitability score, and disease vulnerability warning clearly explains the underlying telemetry inputs behind it.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
