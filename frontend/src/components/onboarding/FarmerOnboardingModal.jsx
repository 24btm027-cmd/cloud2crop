import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';

/**
 * FarmerOnboardingModal – 3-step post-signup wizard.
 * Step 1: Farm size · Step 2: Crops · Step 3: Irrigation
 * Uses correct design system classes (charcoal, ivory, wheat).
 */
export default function FarmerOnboardingModal({ onClose, onComplete }) {
  const { user, updateProfile } = useAuth();
  const { t } = useLanguage();

  const [step, setStep] = useState(1);
  const [farmSize, setFarmSize] = useState(user?.farmSize || 5);
  const [selectedCrops, setSelectedCrops] = useState(user?.crops || []);
  const [irrigationMethod, setIrrigationMethod] = useState(user?.irrigationMethod || 'Drip');
  const [saving, setSaving] = useState(false);

  const availableCrops = [
    { id: 'Cotton', icon: '☁️', nameEn: 'Cotton', nameHi: 'कपास', nameGu: 'કપાસ' },
    { id: 'Wheat', icon: '🌾', nameEn: 'Wheat', nameHi: 'गेहूं', nameGu: 'ઘઉં' },
    { id: 'Groundnut', icon: '🥜', nameEn: 'Groundnut', nameHi: 'मूंगफली', nameGu: 'મગફળી' },
    { id: 'Cumin', icon: '🌿', nameEn: 'Cumin', nameHi: 'जीरा', nameGu: 'જીરૂ' },
    { id: 'Rice', icon: '🍚', nameEn: 'Rice', nameHi: 'धान', nameGu: 'ડાંગર' },
    { id: 'Bajra', icon: '🌾', nameEn: 'Bajra', nameHi: 'बाजरा', nameGu: 'બાજરો' },
    { id: 'Chickpea', icon: '🫘', nameEn: 'Chickpea', nameHi: 'चना', nameGu: 'ચણા' },
    { id: 'Sesame', icon: '🌻', nameEn: 'Sesame', nameHi: 'तिल', nameGu: 'તલ' },
  ];

  const irrigationMethods = [
    { id: 'Drip', label: t.drip || 'Drip', desc: 'Precision water emitters' },
    { id: 'Sprinkler', label: t.sprinkler || 'Sprinkler', desc: 'Overhead spray nozzles' },
    { id: 'Flood', label: t.flood || 'Flood/Furrow', desc: 'Surface flooding' },
    { id: 'Rainfed', label: t.rainfed || 'Rainfed', desc: 'Monsoon dependent' },
  ];

  const toggleCrop = (cropId) => {
    setSelectedCrops(prev =>
      prev.includes(cropId) ? prev.filter(c => c !== cropId) : [...prev, cropId]
    );
  };

  const handleFinish = async () => {
    setSaving(true);
    try {
      await updateProfile({ farmSize, crops: selectedCrops, irrigationMethod, setupDone: true });
      onComplete();
    } catch {
      onComplete(); // proceed even if profile update fails
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center p-3"
      style={{ background: 'rgba(23,35,29,0.85)', zIndex: 1080, backdropFilter: 'blur(6px)' }}
    >
      <div className="c2c-editorial-card p-4 p-md-5 w-100" style={{ maxWidth: 520 }}>

        {/* Header with steps */}
        <div className="d-flex align-items-center justify-content-between mb-4">
          <div>
            <div className="text-muted small fw-bold mb-1" style={{ letterSpacing: '0.05em' }}>
              {t.setupTitle} · {t.setupSubtitle}
            </div>
            <div className="d-flex gap-2">
              {[1, 2, 3].map(s => (
                <div key={s} style={{
                  width: 28, height: 28, borderRadius: '50%',
                  background: step > s ? 'var(--sage-dark)' : step === s ? 'var(--charcoal)' : 'var(--border-subtle)',
                  color: step >= s ? '#fff' : 'var(--muted-text)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.8rem', fontWeight: 700,
                  transition: 'background 0.2s',
                }}>
                  {step > s ? '✓' : s}
                </div>
              ))}
            </div>
          </div>
          <button onClick={onClose} className="btn btn-sm text-muted">
            {t.skip}
          </button>
        </div>

        {/* Step 1: Farm Size */}
        {step === 1 && (
          <div>
            <h2 className="h4 font-editorial fw-bold text-charcoal mb-1">🏡 {t.farmSize}</h2>
            <p className="text-muted small mb-4">What is your total land holding size?</p>

            <div className="mb-4">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <label className="form-label fw-semibold text-charcoal small mb-0">{t.farmSize}</label>
                <span className="fs-4 font-editorial fw-bold text-charcoal">{farmSize} acres</span>
              </div>
              <input
                type="range"
                className="form-range"
                min="0.5" max="50" step="0.5"
                value={farmSize}
                onChange={e => setFarmSize(parseFloat(e.target.value))}
              />
              <div className="d-flex justify-content-between text-muted small">
                <span>0.5 acre</span>
                <span>25 acres</span>
                <span>50+ acres</span>
              </div>
            </div>

            <button onClick={() => setStep(2)} className="btn btn-charcoal btn-lg w-100 fw-bold">
              {t.next}: {t.addYourCrop} →
            </button>
          </div>
        )}

        {/* Step 2: Crops */}
        {step === 2 && (
          <div>
            <h2 className="h4 font-editorial fw-bold text-charcoal mb-1">🌱 {t.addYourCrop}</h2>
            <p className="text-muted small mb-4">Select all primary crops cultivated on your land.</p>

            <div className="row g-2 mb-4">
              {availableCrops.map(c => {
                const isSelected = selectedCrops.includes(c.id);
                return (
                  <div className="col-6 col-sm-4" key={c.id}>
                    <button
                      type="button"
                      onClick={() => toggleCrop(c.id)}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        textAlign: 'left',
                        borderRadius: 4,
                        border: `1px solid ${isSelected ? 'var(--charcoal)' : 'var(--border-subtle)'}`,
                        background: isSelected ? 'var(--charcoal)' : 'var(--ivory-card)',
                        color: isSelected ? '#fff' : 'var(--charcoal)',
                        display: 'flex', alignItems: 'center', gap: '0.5rem',
                        cursor: 'pointer', minHeight: 56,
                        transition: 'all 0.15s',
                      }}
                    >
                      <span style={{ fontSize: '1.2rem' }}>{c.icon}</span>
                      <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>{c.nameEn}</span>
                    </button>
                  </div>
                );
              })}
            </div>

            <div className="d-flex gap-2">
              <button onClick={() => setStep(1)} className="btn border-subtle fw-semibold px-4"
                style={{ color: 'var(--charcoal)', minHeight: 52 }}>
                ← {t.back}
              </button>
              <button onClick={() => setStep(3)} className="btn btn-charcoal btn-lg flex-grow-1 fw-bold">
                {t.next}: {t.irrigation} →
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Irrigation */}
        {step === 3 && (
          <div>
            <h2 className="h4 font-editorial fw-bold text-charcoal mb-1">💧 {t.irrigation}</h2>
            <p className="text-muted small mb-3">Helps us generate precision watering recommendations.</p>

            <div className="d-flex flex-column gap-2 mb-4">
              {irrigationMethods.map(m => {
                const isSelected = irrigationMethod === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setIrrigationMethod(m.id)}
                    style={{
                      textAlign: 'left',
                      padding: '0.85rem 1rem',
                      borderRadius: 4,
                      border: `1px solid ${isSelected ? 'var(--charcoal)' : 'var(--border-subtle)'}`,
                      background: isSelected ? 'var(--charcoal)' : 'var(--ivory-card)',
                      color: isSelected ? '#fff' : 'var(--charcoal)',
                      cursor: 'pointer', minHeight: 56,
                      transition: 'all 0.15s',
                    }}
                  >
                    <div style={{ fontWeight: 700 }}>{m.label}</div>
                    <div style={{ fontSize: '0.8rem', opacity: 0.7 }}>{m.desc}</div>
                  </button>
                );
              })}
            </div>

            <div className="d-flex gap-2">
              <button onClick={() => setStep(2)} className="btn border-subtle fw-semibold px-4"
                style={{ color: 'var(--charcoal)', minHeight: 52 }}>
                ← {t.back}
              </button>
              <button
                onClick={handleFinish}
                className="btn btn-charcoal btn-lg flex-grow-1 fw-bold"
                disabled={saving}
              >
                {saving
                  ? <><span className="spinner-border spinner-border-sm me-2" />Saving…</>
                  : `🚀 ${t.finish}`}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
