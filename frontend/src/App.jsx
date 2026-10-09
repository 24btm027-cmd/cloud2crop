import { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import { get } from './api/client';

import PublicNavbar from './components/common/PublicNavbar';
import Header from './components/common/Header';
import Sidebar from './components/common/Sidebar';
import MobileNav from './components/common/MobileNav';
import VoiceAssistantModal from './components/common/VoiceAssistantModal';
import SplashScreen from './components/auth/SplashScreen';

import LandingPage from './components/landing/LandingPage';
import SolutionsPage from './components/public/SolutionsPage';
import InsightsPage from './components/public/InsightsPage';
import AboutPage from './components/public/AboutPage';

import LoginPage from './components/auth/LoginPage';
import SignupPage from './components/auth/SignupPage';
import ForgotPasswordModal from './components/auth/ForgotPasswordModal';
import FarmerOnboardingModal from './components/onboarding/FarmerOnboardingModal';

import DashboardPage from './components/dashboard/DashboardPage';
import WeatherPage from './components/weather/WeatherPage';
import MyFarmPage from './components/farm/MyFarmPage';
import CropIntelligencePage from './components/crops/CropIntelligencePage';
import SmartIrrigationPage from './components/irrigation/SmartIrrigationPage';
import CropRiskPage from './components/risk/CropRiskPage';
import MarketIntelligencePage from './components/market/MarketIntelligencePage';
import WeatherAnalyticsPage from './components/analytics/WeatherAnalyticsPage';
import AlertCenterPage from './components/alerts/AlertCenterPage';
import AssistantPage from './components/assistant/AssistantPage';
import ExpertPage from './components/expert/ExpertPage';
import ProfilePage from './components/profile/ProfilePage';

const PUBLIC_PAGES = ['landing', 'solutions', 'insights', 'about', 'login', 'signup'];

function MainApp() {
  const { user } = useAuth();
  const [activePage, setActivePage] = useState('landing');
  const [city, setCity] = useState(user?.location || 'Ahmedabad');
  const [weather, setWeather] = useState(null);
  const [advisories, setAdvisories] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [showSplash, setShowSplash] = useState(true);

  // Modals
  const [showVoice, setShowVoice] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);

  const isPublicPage = PUBLIC_PAGES.includes(activePage);

  // If user logs in, jump to dashboard
  useEffect(() => {
    if (user && isPublicPage && activePage !== 'landing') {
      setActivePage('dashboard');
    }
  }, [user]);

  // Sync city with user profile
  useEffect(() => {
    if (user?.location) setCity(user.location);
  }, [user]);

  // Fetch weather + advisory data
  useEffect(() => {
    get(`/weather/${city}`)
      .then(setWeather)
      .catch(() => {});
    get(`/advisory/${city}`)
      .then(setAdvisories)
      .catch(() => {});
    get(`/alerts?city=${city}`)
      .then(setAlerts)
      .catch(() => {});
  }, [city]);

  const navigateTo = (page) => setActivePage(page);

  const handleLoginSuccess = (isNew) => {
    if (isNew) {
      setShowOnboarding(true);
    } else {
      setActivePage('dashboard');
    }
  };

  return (
    <>
      {/* Splash – shown once on first load */}
      {showSplash && <SplashScreen onDone={() => setShowSplash(false)} />}

      <div className="min-vh-100 d-flex flex-column bg-ivory text-dark">
        {/* PUBLIC WEBSITE LAYOUT */}
        {isPublicPage ? (
          <>
            <PublicNavbar
              activePage={activePage}
              setActivePage={setActivePage}
              onOpenVoice={() => setShowVoice(true)}
            />
            <main className="flex-grow-1">
              {activePage === 'landing' && (
                <LandingPage
                  onGetStarted={() => setActivePage(user ? 'dashboard' : 'signup')}
                  onExplore={() => setActivePage('dashboard')}
                  onOpenVoice={() => setShowVoice(true)}
                />
              )}
              {activePage === 'solutions' && (
                <SolutionsPage onGetStarted={() => setActivePage(user ? 'dashboard' : 'signup')} />
              )}
              {activePage === 'insights' && <InsightsPage />}
              {activePage === 'about' && <AboutPage />}
              {activePage === 'login' && (
                <LoginPage
                  onSwitchToSignup={() => setActivePage('signup')}
                  onSuccess={handleLoginSuccess}
                />
              )}
              {activePage === 'signup' && (
                <SignupPage
                  onSwitchToLogin={() => setActivePage('login')}
                  onSuccess={() => setShowOnboarding(true)}
                />
              )}
            </main>
          </>
        ) : (
          /* AUTHENTICATED FARMER PORTAL LAYOUT */
          <>
            <Header
              currentCity={city}
              onCityChange={setCity}
              onOpenVoice={() => setShowVoice(true)}
              onOpenAuth={() => setActivePage('login')}
              activePage={activePage}
              setActivePage={setActivePage}
            />
            <MobileNav activePage={activePage} setActivePage={setActivePage} />

            <div className="d-flex flex-grow-1">
              <Sidebar activePage={activePage} setActivePage={setActivePage} />

              <main
                className="flex-grow-1 p-3 p-md-4 overflow-x-hidden"
                style={{ maxWidth: '1280px', margin: '0 auto', width: '100%' }}
              >
                {activePage === 'dashboard' && (
                  <DashboardPage
                    currentCity={city}
                    weather={weather}
                    advisories={advisories}
                    alerts={alerts}
                    onNavigate={navigateTo}
                  />
                )}
                {activePage === 'weather' && (
                  <WeatherPage weather={weather} currentCity={city} />
                )}
                {activePage === 'myFarm' && (
                  <MyFarmPage
                    currentCity={city}
                    weather={weather}
                    alerts={alerts}
                    onOpenOnboarding={() => setShowOnboarding(true)}
                  />
                )}
                {activePage === 'crops' && (
                  <CropIntelligencePage weather={weather} />
                )}
                {activePage === 'irrigation' && (
                  <SmartIrrigationPage weather={weather} currentCity={city} />
                )}
                {activePage === 'risk' && (
                  <CropRiskPage weather={weather} currentCity={city} />
                )}
                {activePage === 'market' && <MarketIntelligencePage />}
                {activePage === 'analytics' && (
                  <WeatherAnalyticsPage currentCity={city} />
                )}
                {activePage === 'alerts' && (
                  <AlertCenterPage alerts={alerts} advisories={advisories} currentCity={city} />
                )}
                {activePage === 'assistant' && (
                  <AssistantPage currentCity={city} />
                )}
                {activePage === 'expert' && <ExpertPage />}
                {activePage === 'profile' && <ProfilePage />}
                {activePage === 'landing' && (
                  <LandingPage
                    onGetStarted={() => setActivePage('dashboard')}
                    onExplore={() => setActivePage('dashboard')}
                    onOpenVoice={() => setShowVoice(true)}
                  />
                )}
              </main>
            </div>
          </>
        )}

        {/* Floating Modals */}
        {showVoice && (
          <VoiceAssistantModal
            currentCity={city}
            onCityChange={setCity}
            onClose={() => setShowVoice(false)}
          />
        )}
        {showForgotPassword && (
          <ForgotPasswordModal onClose={() => setShowForgotPassword(false)} />
        )}
        {showOnboarding && (
          <FarmerOnboardingModal
            onClose={() => setShowOnboarding(false)}
            onComplete={() => {
              setShowOnboarding(false);
              setActivePage('dashboard');
            }}
          />
        )}
      </div>
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <LanguageProvider>
        <MainApp />
      </LanguageProvider>
    </AuthProvider>
  );
}
