import { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { post } from '../../api/client';

export default function VoiceAssistantModal({ currentCity, onCityChange, onClose }) {
  const { t, speechLang } = useLanguage();
  const [listening, setListening] = useState(false);
  const [queryOutput, setQueryOutput] = useState(null);
  const [loading, setLoading] = useState(false);

  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;

  const speakText = (text) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = speechLang;
    window.speechSynthesis.speak(u);
  };

  const handleQuery = async (text) => {
    setLoading(true);
    try {
      const res = await post('/voice/query', { text, city: currentCity });
      if (res.city) onCityChange(res.city);
      setQueryOutput({ heard: text, reply: res.reply });
      speakText(res.reply);
    } catch {
      setQueryOutput({ heard: text, reply: t.apiDown });
    } finally {
      setLoading(false);
    }
  };

  const startListening = () => {
    if (!SR) {
      setQueryOutput({ heard: '', reply: t.unsupported });
      return;
    }
    const r = new SR();
    r.lang = speechLang;
    r.onresult = (e) => {
      const text = e.results[0][0].transcript;
      handleQuery(text);
    };
    r.onend = () => setListening(false);
    r.onerror = () => setListening(false);
    r.start();
    setListening(true);
  };

  const sampleQueries = [
    'Will it rain tomorrow?',
    'Should I irrigate my crops tomorrow?',
    'What is the price of cotton today?',
    'Show current weather forecast',
  ];

  return (
    <div
      className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center p-3"
      style={{ background: 'rgba(23, 35, 29, 0.85)', zIndex: 1080, backdropFilter: 'blur(6px)' }}
      onClick={onClose}
    >
      <div
        className="c2c-dark-panel p-4 rounded-2 w-100 border border-wheat border-opacity-25"
        style={{ maxWidth: 500 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h2 className="h4 font-editorial fw-bold text-white mb-0 d-flex align-items-center gap-2">
            <span>🎙️</span> <span>{t.voice}</span>
          </h2>
          <button onClick={onClose} className="btn-close btn-close-white" aria-label="Close"></button>
        </div>

        <div className="d-flex flex-column align-items-center text-center my-4">
          <button
            onClick={startListening}
            className={`mic-btn-editorial ${listening ? 'on' : ''} mb-3`}
            title={t.speak}
            disabled={loading}
          >
            🎤
          </button>
          <p className="fs-5 font-editorial fw-bold mb-1 text-white">{listening ? t.speaking : t.speak}</p>
          <p className="small text-sage mb-0">{t.hint}</p>
        </div>

        {queryOutput && (
          <div className="bg-black bg-opacity-30 p-3 rounded-1 mb-3 border border-secondary border-opacity-50 text-start">
            {queryOutput.heard && (
              <p className="small text-sage mb-1 fst-italic">“{queryOutput.heard}”</p>
            )}
            <p className="fs-6 mb-0 text-wheat fw-semibold">{queryOutput.reply}</p>
          </div>
        )}

        <div className="border-top border-secondary border-opacity-25 pt-3 mt-2">
          <div className="small text-sage fw-semibold mb-2">QUICK VOICE SUGGESTIONS:</div>
          <div className="d-flex flex-wrap gap-2">
            {sampleQueries.map((q, idx) => (
              <button
                key={idx}
                onClick={() => handleQuery(q)}
                className="btn btn-sm btn-outline-light text-wheat border-secondary rounded-1 px-3 py-1"
                style={{ fontSize: '0.8rem' }}
              >
                💬 {q}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
