import { createContext, useContext, useState, useEffect } from 'react';
import { LANGS, T } from '../i18n';
import { useAuth } from './AuthContext';

const LanguageContext = createContext();

export function LanguageProvider({ children }) {
  const { user } = useAuth();
  const [lang, setLang] = useState(() => {
    return localStorage.getItem('c2c_lang') || user?.language || 'en';
  });

  useEffect(() => {
    if (user?.language && user.language !== lang) {
      setLang(user.language);
    }
  }, [user]);

  const changeLang = (newLang) => {
    setLang(newLang);
    localStorage.setItem('c2c_lang', newLang);
  };

  const t = T[lang] || T.en;
  const speechLang = LANGS[lang]?.speech || 'en-IN';

  return (
    <LanguageContext.Provider value={{ lang, setLang: changeLang, t, speechLang, LANGS }}>
      {children}
    </LanguageContext.Provider>
  );
}

export const useLanguage = () => useContext(LanguageContext);
