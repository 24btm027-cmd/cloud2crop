import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';

export default function FarmerOnboardingModal({ onClose, onComplete }) {
  const { user, updateProfile } = useAuth();
  const { t } = useLanguage();

  const [step, setStep] = useState(1);
  const [farmSize, setFarmSize] = useState(user?.farmSize || 5);
  const [selectedCrops, setSelectedCrops] = useState(user?.crops || ['Cotton', 'Wheat']);
  const [irrigationMethod, setIrrigationMethod] = useState(user?.irrigationMethod || 'Drip');
  const [saving, setSaving] = useState(false);

  const availableCrops = [
    { id: 'Cotton', icon: '☁️', name: 'Cotton' },
    { id: 'Wheat', icon: '🌾', name: 'Wheat' },
    { id: 'Groundnut', icon: '🥜', name: 'Groundnut' },
    { id: 'Cumin', icon: '🌿', name: 'Cumin' },
    { id: 'Rice', icon: '🍚', name: 'Rice' },
    { id: 'Mustard', icon: '🌼', name: 'Mustard' },
    { id: 'Chickpea', icon: '🫘', name: 'Chickpea' },
    { id: 'Tomato', icon: '🍅', name: 'Tomato' },
  ];

  const irrigationMethods = [
    { id: 'Drip', name: 'Drip Irrigation', desc: 'Precision water emitters' },
    { id: 'Sprinkler', name: 'Sprinkler System', desc: 'Overhead spray nozzles' },
    { id: 'Canal', name: 'Canal Water', desc: 'Gravity-fed channel' },
    { id: 'Flood', name: 'Traditional Flood', desc: 'Surface flooding' },
    { id: 'Rainfed', name: 'Rainfed Only', desc: 'Monsoon dependent' },
  ];

  const toggleCrop = (cropId) => {
    if (selectedCrops.includes(cropId)) {
      setSelectedCrops(selectedCrops.filter((c) => c !== cropId));
    } else {
      setSelectedCrops([...selectedCrops, cropId]);
    }
  };

  const handleFinish = async () => {
    setSaving(true);
    try {
      await updateProfile({
        farmSize,
        crops: selectedCrops,
        irrigationMethod,
      });
      onComplete();
    } catch {
      onComplete();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center p-3"
      style={{ background: 'rgba(11, 41, 26, 0.8)', zIndex: 1080, backdropFilter: 'blur(8px)' }}
    >
      <div
        className="c2c-card p-4 p-md-5 rounded-4 w-100 shadow-lg border border-emerald-900"
        style={{ maxWidth: 540 }}
      >
        {/* Step Indicators */}
        <div className="d-flex align-items-center justify-content-between mb-4">
          <div className="d-flex align-items-center gap-2">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`rounded-circle d-flex align-items-center justify-content-center fw-bold ${
                  step === s
                    ? 'bg-emerald text-white'
                    : step > s
                    ? 'bg-forest text-white'
                    : 'bg-light text-muted'
                }`}
                style={{ width: 32, height: 32, fontSize: '0.85rem' }}
              >
                {step > s ? '✓' : s}
              </div>
            ))}
          </div>
          <button onClick={onClose} className="btn btn-sm text-muted">Skip for now</button>
        </div>

        {/* Step 1: Farm Size */}
        {step === 1 && (
          <div>
            <h2 className="h4 fw-bold text-forest mb-1">🏡 Tell us about your farm</h2>
            <p className="text-muted small mb-4">What is your total land holding size?</p>

            <div className="mb-4">
              <label className="form-label fw-semibold text-forest">
                Farm Size: <span className="text-emerald fs-4 fw-bold">{farmSize} Acres</span>
              </label>
              <input
                type="range"
                className="form-range"
                min="0.5"
                max="50"
                step="0.5"
                value={farmSize}
                onChange={(e) => setFarmSize(parseFloat(e.target.value))}
              />
              <div className="d-flex justify-content-between text-muted small">
                <span>0.5 Acre</span>
                <span>25 Acres</span>
                <span>50+ Acres</span>
              </div>
            </div>

            <button onClick={() => setStep(2)} className="btn btn-emerald btn-lg w-100 fw-bold">
              Next: Select Crops →
            </button>
          </div>
        )}

        {/* Step 2: Crops Grown */}
        {step === 2 && (
          <div>
            <h2 className="h4 fw-bold text-forest mb-1">🌱 What crops do you grow?</h2>
            <p className="text-muted small mb-4">Select all primary crops cultivated on your land.</p>

            <div className="row g-2 mb-4">
              {availableCrops.map((c) => {
                const isSelected = selectedCrops.includes(c.id);
                return (
                  <div className="col-6 col-sm-4" key={c.id}>
                    <button
                      type="button"
                      onClick={() => toggleCrop(c.id)}
                      className={`btn w-100 p-3 text-start rounded-3 d-flex align-items-center gap-2 border ${
                        isSelected
                          ? 'btn-emerald text-white border-emerald shadow-sm'
                          : 'btn-light border-light text-dark'
                      }`}
                    >
                      <span className="fs-4">{c.icon}</span>
                      <span className="fw-semibold small">{c.name}</span>
                    </button>
                  </div>
                );
              })}
            </div>

            <div className="d-flex gap-2">
              <button onClick={() => setStep(1)} className="btn btn-outline-secondary btn-lg fw-bold">
                ← Back
              </button>
              <button onClick={() => setStep(3)} className="btn btn-emerald btn-lg flex-grow-1 fw-bold">
                Next: Irrigation →
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Irrigation System */}
        {step === 3 && (
          <div>
            <h2 className="h4 fw-bold text-forest mb-1">💧 What is your irrigation setup?</h2>
            <p className="text-muted small mb-3">Helps us generate precision watering recommendations.</p>

            <div className="d-flex flex-column gap-2 mb-4">
              {irrigationMethods.map((m) => {
                const isSelected = irrigationMethod === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setIrrigationMethod(m.id)}
                    className={`btn text-start p-3 rounded-3 border ${
                      isSelected
                        ? 'btn-emerald text-white border-emerald shadow-sm'
                        : 'btn-light border-light text-dark'
                    }`}
                  >
                    <div className="fw-bold">{m.name}</div>
                    <small className={isSelected ? 'text-white-50' : 'text-muted'}>{m.desc}</small>
                  </button>
                );
              })}
            </div>

            <div className="d-flex gap-2">
              <button onClick={() => setStep(2)} className="btn btn-outline-secondary btn-lg fw-bold">
                ← Back
              </button>
              <button
                onClick={handleFinish}
                className="btn btn-emerald btn-lg flex-grow-1 fw-bold"
                disabled={saving}
              >
                {saving ? 'Saving Profile...' : '🚀 Complete Onboarding'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
