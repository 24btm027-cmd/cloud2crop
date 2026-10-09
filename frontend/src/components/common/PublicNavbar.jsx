import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';

export default function PublicNavbar({ activePage, setActivePage, onOpenVoice }) {
  const { lang, setLang, t, LANGS } = useLanguage();
  const { user } = useAuth();

  return (
    <nav className="navbar navbar-expand-lg bg-charcoal text-white py-3 border-bottom border-secondary border-opacity-25 sticky-top">
      <div className="container-fluid px-3 px-md-5">
        {/* Brand Logo / Wordmark */}
        <button
          onClick={() => setActivePage('landing')}
          className="navbar-brand bg-transparent border-0 text-white p-0 d-flex align-items-center gap-2"
        >
          <span className="fs-3 text-wheat">🌾</span>
          <div className="text-start">
            <span className="fw-bold fs-4 tracking-tight d-block lh-1 text-white font-editorial">
              Cloud2Crop
            </span>
            <span className="text-sage small" style={{ fontSize: '0.72rem', letterSpacing: '0.12em' }}>
              CLIMATE INTELLIGENCE
            </span>
          </div>
        </button>

        {/* Mobile Toggle Button */}
        <button
          className="navbar-toggler text-white border-0 p-0"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#publicNav"
          aria-controls="publicNav"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="fs-2 text-white">☰</span>
        </button>

        {/* Navbar Links */}
        <div className="collapse navbar-collapse" id="publicNav">
          <ul className="navbar-menu navbar-nav mx-auto mb-2 mb-lg-0 gap-md-4">
            <li className="nav-item">
              <button
                onClick={() => setActivePage('landing')}
                className={`nav-link bg-transparent border-0 text-white-50 px-0 ${activePage === 'landing' ? 'active text-white fw-semibold border-bottom border-wheat' : ''}`}
              >
                Platform
              </button>
            </li>
            <li className="nav-item">
              <button
                onClick={() => setActivePage('solutions')}
                className={`nav-link bg-transparent border-0 text-white-50 px-0 ${activePage === 'solutions' ? 'active text-white fw-semibold border-bottom border-wheat' : ''}`}
              >
                Solutions
              </button>
            </li>
            <li className="nav-item">
              <button
                onClick={() => setActivePage('insights')}
                className={`nav-link bg-transparent border-0 text-white-50 px-0 ${activePage === 'insights' ? 'active text-white fw-semibold border-bottom border-wheat' : ''}`}
              >
                Insights
              </button>
            </li>
            <li className="nav-item">
              <button
                onClick={() => setActivePage('about')}
                className={`nav-link bg-transparent border-0 text-white-50 px-0 ${activePage === 'about' ? 'active text-white fw-semibold border-bottom border-wheat' : ''}`}
              >
                About
              </button>
            </li>
          </ul>

          {/* Right Actions: Lang Switcher, Voice & Auth */}
          <div className="d-flex align-items-center gap-3">
            {/* Language Selection */}
            <div className="btn-group btn-group-sm">
              {Object.entries(LANGS).map(([k, v]) => (
                <button
                  key={k}
                  onClick={() => setLang(k)}
                  className={`btn ${lang === k ? 'btn-wheat fw-bold' : 'btn-outline-light text-white-50 border-secondary'}`}
                  style={{ padding: '0.2rem 0.5rem', fontSize: '0.78rem' }}
                >
                  {v.label}
                </button>
              ))}
            </div>

            {/* Voice Assistant Trigger */}
            <button
              onClick={onOpenVoice}
              className="btn btn-outline-light btn-sm text-wheat border-wheat"
              title={t.voice}
            >
              🎙️ {t.voice}
            </button>

            {/* Auth Buttons */}
            {user ? (
              <button
                onClick={() => setActivePage('dashboard')}
                className="btn btn-wheat btn-sm fw-bold px-3"
              >
                Enter Portal →
              </button>
            ) : (
              <div className="d-flex align-items-center gap-2">
                <button
                  onClick={() => setActivePage('login')}
                  className="btn btn-link text-white text-decoration-none fw-semibold"
                >
                  {t.login}
                </button>
                <button
                  onClick={() => setActivePage('signup')}
                  className="btn btn-wheat btn-sm fw-bold px-3"
                >
                  {t.getStarted}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
