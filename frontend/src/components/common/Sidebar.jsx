import { useLanguage } from '../../context/LanguageContext';

export default function Sidebar({ activePage, setActivePage }) {
  const { t } = useLanguage();

  const navItems = [
    { id: 'dashboard', label: t.dashboard, icon: '📊' },
    { id: 'weather', label: t.weather, icon: '🌦️' },
    { id: 'myFarm', label: t.myFarm, icon: '🏡' },
    { id: 'crops', label: t.crops, icon: '🌱' },
    { id: 'irrigation', label: t.irrigation, icon: '💧' },
    { id: 'risk', label: t.risk, icon: '🛡️' },
    { id: 'market', label: t.market, icon: '📈' },
    { id: 'analytics', label: t.analytics, icon: '📉' },
    { id: 'alerts', label: t.alerts, icon: '🔔' },
    { id: 'landing', label: 'Public Site', icon: '🌐' },
  ];

  return (
    <aside
      className="bg-charcoal text-white p-3 d-none d-md-flex flex-column gap-2 border-end border-secondary border-opacity-25"
      style={{ width: '230px', minHeight: 'calc(100vh - 56px)', flexShrink: 0 }}
    >
      <div className="text-sage small fw-bold tracking-wider px-2 mb-2 uppercase" style={{ fontSize: '0.72rem' }}>
        PORTAL NAVIGATION
      </div>

      <nav className="d-flex flex-column gap-1">
        {navItems.map((item) => {
          const isActive = activePage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActivePage(item.id)}
              className={`portal-nav-link border-0 text-start w-100 ${isActive ? 'active' : ''}`}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="mt-auto pt-4 border-top border-secondary border-opacity-25 px-2">
        <div className="p-3 bg-black bg-opacity-25 rounded-1 small">
          <div className="fw-bold text-wheat mb-1">🌾 Cloud2Crop Engine</div>
          <p className="text-sage mb-0" style={{ fontSize: '0.78rem' }}>
            Real-time climate telemetry & agronomical modeling.
          </p>
        </div>
      </div>
    </aside>
  );
}
