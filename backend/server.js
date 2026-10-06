require('dotenv').config();
const express = require('express'), cors = require('cors');
const mongoose = require('mongoose'), bcrypt = require('bcryptjs'), jwt = require('jsonwebtoken');
const M = require('./models');

const app = express();
app.use(cors()); app.use(express.json());
const wrap = fn => (req, res) => fn(req, res).catch(e => res.status(500).json({ message: e.message }));
const ci = v => new RegExp('^' + String(v).replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '$', 'i'); // case-insensitive exact match

// ---- Auth (bcrypt + JWT) ----
app.post('/api/auth/login', wrap(async (req, res) => {
  const u = await M.User.findOne({ phone: req.body.phone }).lean();
  if (!u || !bcrypt.compareSync(req.body.password || '', u.password)) return res.status(401).json({ message: 'Invalid phone or password' });
  const { password, ...user } = u;
  res.json({ token: jwt.sign({ id: u._id, role: u.role }, process.env.JWT_SECRET || 'dev', { expiresIn: '7d' }), user });
}));

// ---- Weather ----
app.get('/api/locations', wrap(async (req, res) => res.json(await M.Location.find().lean())));
app.get('/api/weather/:city', wrap(async (req, res) => {
  const w = await M.Weather.findOne({ city: ci(req.params.city) }).lean();
  w ? res.json(w) : res.status(404).json({ message: 'City not found' });
}));
app.get('/api/history/:city', wrap(async (req, res) => res.json(await M.WeatherHistory.find({ location: ci(req.params.city) }).lean())));

// ---- Advisory & alerts ----
app.get('/api/advisory/:city', wrap(async (req, res) => res.json(await M.Advisory.find({ city: ci(req.params.city) }).sort({ date: 1 }).lean())));
app.get('/api/alerts', wrap(async (req, res) => res.json(await M.Alert.find(req.query.city ? { city: ci(req.query.city) } : {}).lean())));

// ---- Crops ----
app.get('/api/crops', wrap(async (req, res) => res.json(await M.Crop.find().lean())));
const fit = (v, [lo, hi]) => (v >= lo && v <= hi ? 1 : Math.max(0, 1 - Math.min(Math.abs(v - lo), Math.abs(v - hi)) / ((hi - lo) || 1)));
app.post('/api/recommend', wrap(async (req, res) => {
  const { temperature, humidity, rainfall, ph, N, P, K } = req.body, crops = await M.Crop.find().lean();
  res.json(crops.map(c => {
    const s = [fit(temperature, c.temp), fit(humidity, c.humidity), fit(rainfall, c.rain), fit(ph, c.ph), fit(N, c.N), fit(P, c.P), fit(K, c.K)];
    return { crop: c.name, id: c.id, season: c.season, score: Math.round(s.reduce((a, b) => a + b, 0) / s.length * 100) };
  }).sort((a, b) => b.score - a.score).slice(0, 3));
}));

// ---- Market ----
app.get('/api/market', wrap(async (req, res) => res.json(await M.MarketPrice.find(req.query.crop ? { crop: req.query.crop.toLowerCase() } : {}).lean())));

// ---- Voice ----
app.post('/api/voice/query', wrap(async (req, res) => {
  const text = String(req.body.text || '').toLowerCase();
  const cities = (await M.Location.find().lean()).map(l => l.name);
  const city = cities.find(c => text.includes(c.toLowerCase())) || req.body.city || 'Ahmedabad';
  const intents = await M.VoiceIntent.find().lean();
  const hit = intents.find(i => i.phrases.some(p => text.includes(p.toLowerCase().split(' ')[0])));
  const w = await M.Weather.findOne({ city }).lean(), tm = w.forecast[1];
  const replies = {
    CURRENT_WEATHER: `${city}: ${w.current.temperature}°C, ${w.current.condition}, humidity ${w.current.humidity}%.`,
    RAIN_FORECAST: tm.rainProbability >= 50 ? `Yes, rain is likely tomorrow in ${city} (${tm.rainfallMm} mm).` : `No heavy rain expected tomorrow in ${city}.`,
    SPRAY_ADVICE: tm.rainProbability >= 50 ? 'Do not spray tomorrow. Rain is expected.' : 'You can spray tomorrow. Weather looks dry.',
    CROP_RECOMMENDATION: 'For this season, Rabi crops like wheat, cumin and chickpea suit Gujarat.',
    MARKET_PRICE: 'Cotton is about 7100 rupees per quintal today.',
  };
  res.json({ heard: req.body.text, city, intent: hit ? hit.intent : 'UNKNOWN', reply: (hit && replies[hit.intent]) || 'Sorry, I did not understand. Please try again.' });
}));

mongoose.connect((process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/cloud2crop'))
  .then(() => { console.log('MongoDB connected'); app.listen(process.env.PORT || 5001, () => console.log('API running on port ' + (process.env.PORT || 5001))); })
  .catch(e => { console.error('MongoDB connection failed:', e.message); process.exit(1); });
