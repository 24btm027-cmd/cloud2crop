import { useLanguage } from '../../context/LanguageContext';

export default function MobileNav({ activePage, setActivePage }) {
  const { t } = useLanguage();

  const mobileTabs = [
    { id: 'dashboard', label: t.dashboard, icon: '📊' },
    { id: 'weather', label: t.weather, icon: '🌦️' },
    { id: 'crops', label: t.crops, icon: '🌱' },
    { id: 'market', label: t.market, icon: '📈' },
    { id: 'alerts', label: t.alerts, icon: '🔔' },
    { id: 'assistant', label: t.assistant, icon: '🎙️' },
    { id: 'expert', label: t.expert, icon: '👨‍🌾' },
    { id: 'profile', label: t.profile, icon: '👤' },
  ];

  return (
    <nav className="d-md-none bg-charcoal text-white p-2 border-bottom border-secondary border-opacity-25 overflow-x-auto">
      <div className="d-flex align-items-center justify-content-between gap-1" style={{ minWidth: 'max-content' }}>
        {mobileTabs.map((tab) => {
          const isActive = activePage === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActivePage(tab.id)}
              className={`btn btn-sm px-3 py-1 rounded-1 d-flex align-items-center gap-1 border-0 ${
                isActive ? 'btn-wheat fw-bold shadow-sm' : 'text-sage'
              }`}
            >
              <span>{tab.icon}</span>
              <span style={{ fontSize: '0.85rem' }}>{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
