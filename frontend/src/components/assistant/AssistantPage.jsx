import { useState, useRef } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { post } from '../../api/client';

/**
 * AssistantPage – Full-page voice + text agriculture assistant.
 * Supports speech recognition (Web Speech API) and text fallback.
 * Calls /api/voice/query → rules engine + optional LLM.
 */
export default function AssistantPage({ currentCity }) {
  const { t, speechLang, lang } = useLanguage();
  const [listening, setListening] = useState(false);
  const [loading, setLoading] = useState(false);
  const [textInput, setTextInput] = useState('');
  const [history, setHistory] = useState([]); // [{role: 'user'|'assistant', text, source}]
  const recRef = useRef(null);

  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;

  const speakText = (text) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = speechLang;
    window.speechSynthesis.speak(u);
  };

  const handleQuery = async (text) => {
    if (!text.trim()) return;
    setLoading(true);
    setHistory(prev => [...prev, { role: 'user', text }]);
    try {
      const res = await post('/voice/query', { text, city: currentCity, lang });
      const reply = res.reply || t.error;
      setHistory(prev => [...prev, { role: 'assistant', text: reply, source: res.source }]);
      speakText(reply);
    } catch {
      setHistory(prev => [...prev, { role: 'assistant', text: t.apiDown, source: 'error' }]);
    } finally {
      setLoading(false);
    }
  };

  const startListening = () => {
    if (!SR) {
      setHistory(prev => [...prev, { role: 'assistant', text: t.unsupported, source: 'system' }]);
      return;
    }
    const r = new SR();
    r.lang = speechLang;
    r.onresult = (e) => {
      const text = e.results[0][0].transcript;
      setTextInput(text);
      handleQuery(text);
    };
    r.onend = () => setListening(false);
    r.onerror = () => setListening(false);
    r.start();
    recRef.current = r;
    setListening(true);
  };

  const stopListening = () => {
    recRef.current?.stop();
    setListening(false);
  };

  const handleTextSubmit = (e) => {
    e.preventDefault();
    if (!textInput.trim()) return;
    handleQuery(textInput);
    setTextInput('');
  };

  const sampleQueries = {
    en: [
      'Should I irrigate today?',
      'Will it rain tomorrow?',
      'Best time to spray pesticides?',
      'Cotton price in Rajkot today?',
      'Risk of frost this week?',
    ],
    hi: [
      'क्या आज सिंचाई करनी चाहिए?',
      'क्या कल बारिश होगी?',
      'कीटनाशक छिड़काव का सही समय?',
      'आज राजकोट में कपास का भाव?',
    ],
    gu: [
      'આજે સિંચાઈ કરવી?',
      'કાલ વરસાદ આવશે?',
      'જંતુનાશક ક્યારે છાંટવું?',
      'આજ રાજકોટ કપાસ ભાવ?',
    ],
  };

  const queries = sampleQueries[lang] || sampleQueries.en;

  return (
    <div className="d-flex flex-column gap-4 pb-5">
      {/* Header */}
      <div className="c2c-dark-panel p-4 p-md-5 rounded-2 border border-secondary border-opacity-25">
        <span className="text-wheat small fw-bold" style={{ letterSpacing: '0.08em' }}>
          AI AGRICULTURE ASSISTANT
        </span>
        <h1 className="display-6 font-editorial fw-bold text-white mt-1 mb-1">
          🎙️ {t.assistant}
        </h1>
        <p className="text-sage mb-0">
          {t.hint} · <strong className="text-white">{currentCity}</strong>
        </p>
      </div>

      <div className="row g-4">
        {/* Left: Mic + chat */}
        <div className="col-lg-8">
          <div className="c2c-editorial-card p-4 d-flex flex-column" style={{ minHeight: 480 }}>
            {/* Chat history */}
            <div
              className="flex-grow-1 d-flex flex-column gap-3 mb-4 overflow-y-auto pe-1"
              style={{ maxHeight: 340 }}
            >
              {history.length === 0 ? (
                <div className="text-center py-5 text-muted">
                  <div className="fs-1 mb-2">🌾</div>
                  <p className="small">{t.hint}</p>
                </div>
              ) : (
                history.map((msg, i) => (
                  <div
                    key={i}
                    className={`d-flex ${msg.role === 'user' ? 'justify-content-end' : 'justify-content-start'}`}
                  >
                    <div
                      style={{
                        maxWidth: '80%',
                        padding: '0.6rem 1rem',
                        borderRadius: msg.role === 'user' ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
                        background: msg.role === 'user' ? 'var(--charcoal)' : 'var(--ivory-card)',
                        color: msg.role === 'user' ? '#fff' : 'var(--dark-text)',
                        border: msg.role === 'assistant' ? '1px solid var(--border-subtle)' : 'none',
                        fontSize: '0.9rem',
                        lineHeight: 1.5,
                      }}
                    >
                      {msg.text}
                      {msg.source && msg.source !== 'error' && (
                        <div style={{ fontSize: '0.7rem', marginTop: 4, opacity: 0.6 }}>
                          {t.answerFrom || 'Source:'} {msg.source}
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
              {loading && (
                <div className="d-flex justify-content-start">
                  <div className="p-3 rounded-3 border border-subtle bg-ivory-card">
                    <div className="d-flex gap-1 align-items-center">
                      <span className="spinner-grow spinner-grow-sm text-sage" />
                      <span className="spinner-grow spinner-grow-sm text-sage" style={{ animationDelay: '0.15s' }} />
                      <span className="spinner-grow spinner-grow-sm text-sage" style={{ animationDelay: '0.3s' }} />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Mic button */}
            <div className="text-center mb-4">
              <button
                onClick={listening ? stopListening : startListening}
                className={`mic-btn-editorial ${listening ? 'on' : ''}`}
                title={listening ? t.stopSpeech : t.speak}
                disabled={loading}
              >
                {listening ? '⏹️' : '🎤'}
              </button>
              <p className="small text-muted mt-2 mb-0">
                {listening ? t.speaking : t.speak}
              </p>
            </div>

            {/* Text input */}
            <form onSubmit={handleTextSubmit} className="d-flex gap-2">
              <input
                type="text"
                className="form-control border-subtle"
                value={textInput}
                onChange={e => setTextInput(e.target.value)}
                placeholder={t.hint}
                disabled={loading || listening}
              />
              <button
                type="submit"
                className="btn btn-charcoal px-4 flex-shrink-0"
                disabled={loading || !textInput.trim()}
              >
                ↑
              </button>
            </form>
          </div>
        </div>

        {/* Right: Quick questions + expert CTA */}
        <div className="col-lg-4 d-flex flex-column gap-3">
          {/* Quick queries */}
          <div className="c2c-editorial-card p-4">
            <h2 className="h6 font-editorial fw-bold text-charcoal mb-3">
              💬 Quick Questions
            </h2>
            <div className="d-flex flex-column gap-2">
              {queries.map((q, i) => (
                <button
                  key={i}
                  onClick={() => { setTextInput(q); handleQuery(q); }}
                  className="btn text-start border-subtle rounded-1 py-2 px-3 small"
                  style={{ background: 'var(--ivory-card)', color: 'var(--charcoal)', fontWeight: 500 }}
                  disabled={loading}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>

          {/* Expert CTA */}
          <div className="c2c-dark-panel p-4 rounded-2">
            <h3 className="h6 font-editorial fw-bold text-white mb-2">
              👨‍🌾 {t.talkToExpert}
            </h3>
            <p className="text-sage small mb-3">
              Connect with a trained agronomist for personalised advice.
            </p>
            <a
              href="tel:18001801551"
              className="btn btn-wheat btn-sm w-100 fw-bold mb-2"
            >
              📞 {t.expertCta || '1800-180-1551'}
            </a>
            <p className="text-sage text-center mb-0" style={{ fontSize: '0.75rem' }}>
              Kisan Call Centre · Free · 24×7
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
