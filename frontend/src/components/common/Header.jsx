import { useState, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { get } from '../../api/client';

export default function Header({ currentCity, onCityChange, onOpenVoice, onOpenAuth, activePage, setActivePage }) {
  const { lang, setLang, t, LANGS } = useLanguage();
  const { user, logout } = useAuth();
  const [cities, setCities] = useState([]);

  useEffect(() => {
    get('/locations')
      .then(setCities)
      .catch(() => {});
  }, []);

  const handleGps = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((p) => {
        const d = (c) => (c.lat - p.coords.latitude) ** 2 + (c.lon - p.coords.longitude) ** 2;
        if (cities.length > 0) {
          const nearest = [...cities].sort((a, b) => d(a) - d(b))[0];
          onCityChange(nearest.name);
        }
      });
    }
  };

  return (
    <header className="navbar sticky-top bg-charcoal text-white py-2 px-3 border-bottom border-secondary border-opacity-25">
      <div className="container-fluid d-flex align-items-center justify-content-between gap-2">
        {/* Left: Brand / Logo */}
        <div className="d-flex align-items-center gap-3">
          <button
            onClick={() => setActivePage('landing')}
            className="bg-transparent border-0 text-white p-0 text-start d-flex align-items-center gap-2"
          >
            <span className="fs-3 text-wheat">🌾</span>
            <div>
              <span className="fw-bold fs-4 tracking-tight d-block lh-1 text-white font-editorial">
                Cloud2Crop
              </span>
              <span className="text-sage small" style={{ fontSize: '0.72rem', letterSpacing: '0.12em' }}>
                FARMER PORTAL
              </span>
            </div>
          </button>
        </div>

        {/* Center: Location & GPS Selector */}
        <div className="d-flex align-items-center gap-2">
          <div className="input-group input-group-sm">
            <span className="input-group-text bg-black bg-opacity-25 text-wheat border-secondary border-opacity-50">📍</span>
            <select
              aria-label="Select Location"
              value={currentCity}
              onChange={(e) => onCityChange(e.target.value)}
              className="form-select form-select-sm bg-black bg-opacity-25 text-white border-secondary border-opacity-50 fw-semibold"
              style={{ minWidth: '130px' }}
            >
              {cities.map((c) => (
                <option key={c._id || c.id} value={c.name} className="bg-charcoal text-white">
                  {c.name}
                </option>
              ))}
            </select>
            <button
              onClick={handleGps}
              className="btn btn-outline-light btn-sm text-wheat border-secondary border-opacity-50"
              title={t.gps}
              type="button"
            >
              🎯
            </button>
          </div>
        </div>

        {/* Right: Language, Voice Assistant & User Profile */}
        <div className="d-flex align-items-center gap-2">
          {/* Language Switcher */}
          <div className="btn-group btn-group-sm">
            {Object.entries(LANGS).map(([k, v]) => (
              <button
                key={k}
                onClick={() => setLang(k)}
                className={`btn ${lang === k ? 'btn-wheat fw-bold' : 'btn-outline-light text-white-50 border-secondary border-opacity-50'}`}
                style={{ padding: '0.2rem 0.5rem', fontSize: '0.78rem' }}
              >
                {v.label}
              </button>
            ))}
          </div>

          {/* Voice Assistant Button */}
          <button
            onClick={onOpenVoice}
            className="btn btn-outline-light btn-sm text-wheat border-wheat"
            title={t.voice}
          >
            🎙️ <span className="d-none d-md-inline">{t.voice}</span>
          </button>

          {/* User Profile / Auth */}
          {user ? (
            <div className="dropdown">
              <button
                className="btn btn-outline-light btn-sm dropdown-toggle fw-semibold border-secondary border-opacity-50"
                type="button"
                data-bs-toggle="dropdown"
                aria-expanded="false"
              >
                👨‍🌾 {user.name.split(' ')[0]}
              </button>
              <ul className="dropdown-menu dropdown-menu-end shadow-lg border-0 mt-2 bg-charcoal text-white">
                <li>
                  <div className="dropdown-header text-wheat">
                    <strong>{user.name}</strong>
                    <div className="small text-sage">{user.phone}</div>
                  </div>
                </li>
                <li><hr className="dropdown-divider border-secondary" /></li>
                <li>
                  <button onClick={() => setActivePage('myFarm')} className="dropdown-item text-white">
                    🏡 {t.myFarm}
                  </button>
                </li>
                <li>
                  <button onClick={logout} className="dropdown-item text-danger">
                    🚪 {t.logout}
                  </button>
                </li>
              </ul>
            </div>
          ) : (
            <button
              onClick={onOpenAuth}
              className="btn btn-wheat btn-sm fw-bold px-3"
            >
              {t.login}
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
