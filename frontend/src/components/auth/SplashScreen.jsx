import { useEffect, useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';

/**
 * SplashScreen – shown for 1-3 seconds at app load.
 * If user has never picked a language, shows language picker first.
 */
export default function SplashScreen({ onDone }) {
  const { lang, setLang, LANGS } = useLanguage();
  const hasPickedLang = !!localStorage.getItem('c2c_lang');
  const [showLangPicker, setShowLangPicker] = useState(!hasPickedLang);
  const [progress, setProgress] = useState(0);
  const [canProceed, setCanProceed] = useState(false);

  // Progress bar animation
  useEffect(() => {
    let start = null;
    const duration = showLangPicker ? 0 : 2000;
    if (duration === 0) return;

    const animate = (ts) => {
      if (!start) start = ts;
      const elapsed = ts - start;
      setProgress(Math.min(100, (elapsed / duration) * 100));
      if (elapsed < duration) {
        requestAnimationFrame(animate);
      } else {
        setCanProceed(true);
      }
    };
    requestAnimationFrame(animate);
  }, [showLangPicker]);

  useEffect(() => {
    if (canProceed) {
      setTimeout(onDone, 300);
    }
  }, [canProceed, onDone]);

  const pickLanguage = (code) => {
    setLang(code);
    setShowLangPicker(false);
    // Start progress after language is picked
    let start = null;
    const duration = 1500;
    const animate = (ts) => {
      if (!start) start = ts;
      const elapsed = ts - start;
      setProgress(Math.min(100, (elapsed / duration) * 100));
      if (elapsed < duration) {
        requestAnimationFrame(animate);
      } else {
        setCanProceed(true);
      }
    };
    requestAnimationFrame(animate);
  };

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'var(--ivory)',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '2rem',
      }}
    >
      {/* Logo */}
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <div style={{
          width: 72, height: 72, borderRadius: '50%',
          background: 'var(--charcoal)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 1rem',
          fontSize: '2rem',
        }}>
          🌾
        </div>
        <div style={{ fontSize: '1.8rem', fontWeight: 700, color: 'var(--charcoal)', letterSpacing: '-0.02em' }}>
          Cloud2Crop
        </div>
        <div style={{ color: 'var(--sage-dark)', fontSize: '0.85rem', marginTop: '0.25rem' }}>
          {lang === 'gu' ? 'સ્માર્ટ કૃષિ' : lang === 'hi' ? 'स्मार्ट कृषि' : 'Smart Agriculture'}
        </div>
      </div>

      {/* Language picker (first time) */}
      {showLangPicker && (
        <div style={{ textAlign: 'center', width: '100%', maxWidth: 320 }}>
          <p style={{ color: 'var(--muted-text)', fontSize: '0.95rem', marginBottom: '1.5rem' }}>
            {lang === 'gu' ? 'ભાષા પસંદ કરો' : lang === 'hi' ? 'भाषा चुनें' : 'Choose your language'}
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {Object.entries(LANGS).map(([code, { label }]) => (
              <button
                key={code}
                onClick={() => pickLanguage(code)}
                style={{
                  padding: '1rem 1.5rem',
                  fontSize: '1.1rem',
                  fontWeight: 600,
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 6,
                  background: '#fff',
                  color: 'var(--charcoal)',
                  cursor: 'pointer',
                  minHeight: 48,
                  transition: 'all 0.15s',
                }}
                onMouseOver={e => e.target.style.background = 'var(--wheat)'}
                onMouseOut={e => e.target.style.background = '#fff'}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Progress indicator (after lang is picked) */}
      {!showLangPicker && (
        <div style={{ width: '100%', maxWidth: 280, marginTop: '2rem' }}>
          <div style={{
            height: 3,
            background: 'var(--border-subtle)',
            borderRadius: 3,
            overflow: 'hidden',
          }}>
            <div style={{
              height: '100%',
              width: `${progress}%`,
              background: 'var(--charcoal)',
              borderRadius: 3,
              transition: 'width 0.1s linear',
            }} />
          </div>
        </div>
      )}
    </div>
  );
}
