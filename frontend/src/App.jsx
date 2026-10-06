import { useState, useEffect } from 'react';
import { ComposedChart, Bar, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { LANGS, T } from './i18n';

const API_URL = 'https://cloud2crop.onrender.com';

const api = (p, o) => fetch(API_URL + '/api' + p, o).then(r => {
  if (!r.ok) throw new Error(r.status);
  return r.json();
});
const post = (p, body) => api(p, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
const icon = c => (/heavy/i.test(c) ? '⛈️' : /rain/i.test(c) ? '🌧️' : /cloud/i.test(c) ? '⛅' : '☀️');
const LEVEL = { good: ['✅', 'success'], warning: ['⚠️', 'warning'], danger: ['🚨', 'danger'] };
const speak = (text, lang) => { if (!('speechSynthesis' in window)) return; speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(text); u.lang = lang; speechSynthesis.speak(u); };
const adviceText = (a, l) => (l === 'hi' ? a.adviceHi : l === 'gu' ? a.adviceGu : a.advice);

export default function App() {
  const [lang, setLang] = useState('en');
  const [city, setCity] = useState('Ahmedabad');
  const [cities, setCities] = useState([]);
  const [w, setW] = useState(null);
  const [adv, setAdv] = useState([]);
  const [tab, setTab] = useState('weather');
  const [user, setUser] = useState(null);
  const [err, setErr] = useState('');
  const [login, setLogin] = useState(false);
  const t = T[lang], speech = LANGS[lang].speech;

  useEffect(() => { api('/locations').then(setCities).catch(() => setErr('apiDown')); }, []);
  useEffect(() => {
    setErr('');
    api('/weather/' + city).then(setW).catch(() => setErr('apiDown'));
    api('/advisory/' + city).then(setAdv).catch(() => {});
  }, [city]);

  const gps = () => navigator.geolocation?.getCurrentPosition(p => {
    const d = c => (c.lat - p.coords.latitude) ** 2 + (c.lon - p.coords.longitude) ** 2;
    setCity([...cities].sort((a, b) => d(a) - d(b))[0].name);
  });
  const doLogin = u => { setUser(u); setLang(u.language); setCity(u.location); setLogin(false); };
  // Mock data starts on 2026-10-03, so show the first 3 forecast days regardless of the real date
  const base = w ? new Date(w.forecast[0].date).getTime() : 0;
  const todayAdv = w ? adv.filter(a => { const d = new Date(a.date).getTime(); return d >= base && d <= base + 2 * 864e5; }) : [];

  return (
    <div className="container-md p-0 pb-5" style={{ maxWidth: 780 }}>
      <header className="bg-leaf text-white p-2 d-flex flex-wrap align-items-center gap-2">
        <h1 className="h3 fw-bold me-auto mb-0">Cloud2Crop</h1>
        <select aria-label="City" value={city} onChange={e => setCity(e.target.value)} className="form-select form-select-lg w-auto">
          {cities.map(c => <option key={c._id || c.id}>{c.name}</option>)}
        </select>
        <button onClick={gps} className="btn btn-outline-light btn-lg" title={t.gps}>📍</button>
        <div className="btn-group">
          {Object.entries(LANGS).map(([k, v]) => <button key={k} onClick={() => setLang(k)} className={`btn ${lang === k ? 'btn-light fw-bold' : 'btn-outline-light'}`}>{v.label}</button>)}
        </div>
        <button onClick={() => (user ? setUser(null) : setLogin(true))} className="btn btn-warning fw-bold">{user ? `${user.name.split(' ')[0]} · ${t.logout}` : t.login}</button>
      </header>

      {err && <div className="alert alert-danger m-2 fw-semibold">{t[err]}</div>}
      <VoiceBox t={t} speech={speech} city={city} setCity={setCity} />

      <ul className="nav nav-pills nav-fill mx-2 mb-2" role="tablist">
        {[['weather', '🌦️', t.weather], ['crops', '🌱', t.crops], ['market', '₹', t.market]].map(([k, i, l]) => (
          <li className="nav-item" key={k}><button role="tab" aria-selected={tab === k} onClick={() => setTab(k)} className={`nav-link w-100 fs-5 fw-bold ${tab === k ? 'active bg-success' : 'text-success'}`}>{i} {l}</button></li>
        ))}
      </ul>
      <main className="card mx-2 p-3 border-0 shadow-sm">
        {tab === 'weather' && w && <WeatherTab {...{ w, t, lang, speech, todayAdv }} />}
        {tab === 'crops' && w && <CropsTab {...{ w, t, lang, user }} />}
        {tab === 'market' && <MarketTab t={t} />}
      </main>
      {login && <LoginModal t={t} onClose={() => setLogin(false)} onOk={doLogin} />}
    </div>
  );
}

function VoiceBox({ t, speech, city, setCity }) {
  const [on, setOn] = useState(false);
  const [out, setOut] = useState(null);
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  const start = () => {
    if (!SR) return setOut({ reply: t.unsupported });
    const r = new SR(); r.lang = speech;
    r.onresult = async e => {
      const text = e.results[0][0].transcript;
      try { const res = await post('/voice/query', { text, city }); if (res.city) setCity(res.city); setOut({ heard: text, reply: res.reply }); speak(res.reply, 'en-IN'); }
      catch { setOut({ heard: text, reply: t.apiDown }); }
    };
    r.onend = () => setOn(false); r.onerror = () => setOn(false);
    r.start(); setOn(true);
  };
  return (
    <section className="bg-ink text-white rounded-4 m-2 p-4 d-flex flex-column align-items-center gap-2 text-center">
      <button onClick={start} aria-label={t.speak} className={`mic btn btn-danger rounded-circle ${on ? 'on' : ''}`}>🎤</button>
      <p className="h4 fw-bold mb-0">{on ? t.speaking : t.speak}</p>
      {out ? <div><p className="small opacity-75 mb-1">{out.heard && `“${out.heard}”`}</p><p className="fs-5 mb-0">{out.reply}</p></div> : <p className="small opacity-75 mb-0">{t.hint}</p>}
    </section>
  );
}

function WeatherTab({ w, t, lang, speech, todayAdv }) {
  const c = w.current;
  const data = w.forecast.map(f => ({ day: f.date.slice(5), rain: f.rainfallMm, max: f.tempMax, min: f.tempMin }));
  return (
    <div>
      <div className="d-flex align-items-center gap-3 mb-3">
        <span style={{ fontSize: '4.5rem' }}>{icon(c.condition)}</span>
        <div><div className="display-3 fw-bold lh-1">{c.temperature}°</div><div className="fs-5">{w.city} · {c.condition}</div></div>
      </div>
      <div className="row g-2 text-center mb-4">
        {[[t.humidity, `${c.humidity}%`, '💧'], [t.wind, `${c.windKmh} km/h`, '💨'], [t.uv, c.uvIndex, '🕶️']].map(([l, v, i]) => (
          <div className="col-4" key={l}><div className="bg-light rounded p-2"><div className="fs-3">{i}</div><div className="fw-bold fs-5">{v}</div><small>{l}</small></div></div>
        ))}
      </div>
      <h2 className="h4 fw-bold">{t.advice}</h2>
      {todayAdv.length === 0 && <p>{t.none}</p>}
      {todayAdv.map((a, i) => (
        <div key={i} className={`alert alert-${LEVEL[a.level][1]} d-flex align-items-center gap-3 border-0 border-start border-5 border-${LEVEL[a.level][1]}`}>
          <span className="fs-2">{LEVEL[a.level][0]}</span>
          <div className="flex-grow-1"><div className="fw-bold">{a.title} <small className="fw-normal">({a.date.slice(5)})</small></div><div>{adviceText(a, lang)}</div></div>
          <button onClick={() => speak(adviceText(a, lang), speech)} className="btn btn-success rounded-circle" aria-label={t.listen}>🔊</button>
        </div>
      ))}
      <h2 className="h4 fw-bold mt-4">{t.week}</h2>
      <div style={{ height: 260 }}><ResponsiveContainer>
        <ComposedChart data={data}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="day" /><YAxis yAxisId="l" /><YAxis yAxisId="r" orientation="right" /><Tooltip />
          <Bar yAxisId="r" dataKey="rain" name="Rain mm" fill="#2563a8" />
          <Line yAxisId="l" dataKey="max" name="Max °C" stroke="#c2362b" strokeWidth={3} />
          <Line yAxisId="l" dataKey="min" name="Min °C" stroke="#1f7a4d" strokeWidth={3} />
        </ComposedChart>
      </ResponsiveContainer></div>
      <div className="row g-1 text-center mt-2 small">
        {w.forecast.map(f => <div className="col" key={f.date}><div className="bg-light rounded p-1"><div>{f.date.slice(8)}</div><div className="fs-5">{icon(f.condition)}</div><div>{f.rainProbability}%</div></div></div>)}
      </div>
    </div>
  );
}

function CropsTab({ w, t, lang, user }) {
  const c = w.current, total = w.forecast.reduce((s, f) => s + f.rainfallMm, 0);
  const [f, setF] = useState({ temperature: c.temperature, humidity: c.humidity, rainfall: Math.round(total * 4), ph: user?.soil?.ph ?? 7, N: user?.soil?.N ?? 80, P: user?.soil?.P ?? 40, K: user?.soil?.K ?? 40 });
  const [res, setRes] = useState([]);
  const [crops, setCrops] = useState([]);
  useEffect(() => { api('/crops').then(setCrops); }, []);
  const name = id => { const x = crops.find(c => c.id === id); return x ? (lang === 'hi' ? x.nameHi : lang === 'gu' ? x.nameGu : x.name) : id; };
  const labels = { temperature: t.temp, humidity: t.hum, rainfall: t.rain, ph: 'pH', N: 'N', P: 'P', K: 'K' };
  return (
    <div>
      <div className="row g-3 mb-3">
        {Object.keys(f).map(k => (
          <div className="col-6" key={k}><label className="form-label fw-semibold">{labels[k]}</label>
            <input type="number" step="any" value={f[k]} onChange={e => setF({ ...f, [k]: +e.target.value })} className="form-control form-control-lg" /></div>
        ))}
      </div>
      <button onClick={() => post('/recommend', f).then(setRes)} className="btn btn-success btn-lg w-100 fw-bold">🌱 {t.suggest}</button>
      {res.length > 0 && <h2 className="h4 fw-bold mt-4">{t.result}</h2>}
      {res.map(r => (
        <div key={r.id} className="bg-light rounded p-3 mb-2">
          <div className="d-flex justify-content-between fw-bold fs-5"><span>{name(r.id)} <small className="fw-normal">({r.season})</small></span><span>{r.score}%</span></div>
          <div className="progress" style={{ height: 12 }}><div className="progress-bar bg-success" style={{ width: r.score + '%' }} /></div>
        </div>
      ))}
    </div>
  );
}

function MarketTab({ t }) {
  const [rows, setRows] = useState([]);
  const [crop, setCrop] = useState('cotton');
  useEffect(() => { api('/market?crop=' + crop).then(setRows); }, [crop]);
  return (
    <div>
      <select value={crop} onChange={e => setCrop(e.target.value)} className="form-select form-select-lg mb-3">
        {['cotton', 'groundnut', 'castor', 'bajra', 'wheat', 'cumin', 'mustard', 'chickpea', 'maize', 'rice'].map(c => <option key={c}>{c}</option>)}
      </select>
      <ul className="list-group">
        {rows.map(r => (
          <li key={r.market} className="list-group-item d-flex justify-content-between align-items-center">
            <span className="fw-bold fs-5">{r.market}</span>
            <span className="text-end"><span className="d-block fs-4 fw-bold">₹{r.modalPrice}</span><small>₹{r.minPrice} – ₹{r.maxPrice} · {t.price}</small></span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function LoginModal({ t, onClose, onOk }) {
  const [phone, setPhone] = useState('9876543210');
  const [password, setPassword] = useState('farmer123');
  const [e, setE] = useState('');
  const go = () => post('/auth/login', { phone, password }).then(r => onOk(r.user)).catch(() => setE('✗ Invalid phone or password'));
  return (
    <div className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center p-3" style={{ background: 'rgba(0,0,0,.5)', zIndex: 1050 }} onClick={onClose}>
      <div className="card p-4 w-100" style={{ maxWidth: 380 }} onClick={ev => ev.stopPropagation()}>
        <h2 className="h4 fw-bold">{t.login}</h2>
        <input value={phone} onChange={ev => setPhone(ev.target.value)} inputMode="numeric" placeholder={t.phone} className="form-control form-control-lg mb-2" />
        <input value={password} onChange={ev => setPassword(ev.target.value)} type="password" placeholder={t.password} className="form-control form-control-lg mb-2" />
        {e && <p className="text-danger fw-bold">{e}</p>}
        <button onClick={go} className="btn btn-success btn-lg fw-bold">{t.login}</button>
        <small className="text-muted mt-2">Demo: 9876543210 / farmer123 (Gujarati) · 9123456780 (Hindi)</small>
      </div>
    </div>
  );
}
