/**
 * Cloud2Crop – Comprehensive Seed Script
 * Run: npm run seed
 * Seeds: 9 crops (3 languages), cotton/wheat/groundnut with stages+tasks,
 *        rules from advisory.js, sample prices, expert contacts, admin user.
 */
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const M = require('./models');
const { DEFAULT_RULES } = require('./advisory');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/cloud2crop';

/* ── Crops ────────────────────────────────────────────────────── */
const CROPS = [
  {
    key: 'cotton',
    names: { en: 'Cotton', hi: 'कपास', gu: 'કપાસ' },
    season: 'Kharif',
    temp: [25, 35], humidity: [50, 80], rain: [50, 100], ph: [6, 8], N: [60, 120], P: [30, 60], K: [30, 60],
    waterRequirement: 'Medium',
    stages: [
      { name: 'Germination', nameHi: 'अंकुरण', nameGu: 'અંકુરણ', startDay: 0, endDay: 7, tasks: ['Ensure soil moisture', 'Check for damping off disease', 'Avoid over-watering'] },
      { name: 'Seedling', nameHi: 'बीज अवस्था', nameGu: 'રોપ અવસ્થા', startDay: 8, endDay: 30, tasks: ['Thin seedlings to proper spacing', 'First weeding', 'Apply starter fertiliser if soil is deficient'] },
      { name: 'Vegetative', nameHi: 'वानस्पतिक', nameGu: 'વનસ્પતિ', startDay: 31, endDay: 60, tasks: ['Second weeding', 'Apply nitrogen fertiliser', 'Monitor for aphids and whitefly', 'Spray if necessary (check advisory first)'] },
      { name: 'Flowering', nameHi: 'फूल अवस्था', nameGu: 'ફૂલ અવસ્થા', startDay: 61, endDay: 90, tasks: ['Irrigate at flowering critical period', 'Monitor for bollworm', 'Avoid pesticide spray during pollination hours'] },
      { name: 'Boll Development', nameHi: 'टेंडा विकास', nameGu: 'ટેન્ડા વિકાસ', startDay: 91, endDay: 140, tasks: ['Irrigate regularly', 'Check for pink bollworm', 'Avoid heavy rain damage by improving drainage'] },
      { name: 'Harvest', nameHi: 'कटाई', nameGu: 'કાપણી', startDay: 141, endDay: 180, tasks: ['Pick when bolls open 60%+', 'Dry picked cotton before storage', 'Prepare storage shed'] },
    ],
  },
  {
    key: 'wheat',
    names: { en: 'Wheat', hi: 'गेहूं', gu: 'ઘઉં' },
    season: 'Rabi',
    temp: [15, 25], humidity: [40, 70], rain: [30, 70], ph: [6, 7.5], N: [80, 120], P: [40, 70], K: [40, 70],
    waterRequirement: 'Low-Medium',
    stages: [
      { name: 'Germination', nameHi: 'अंकुरण', nameGu: 'અંકુરણ', startDay: 0, endDay: 10, tasks: ['Sow at 5cm depth', 'Pre-irrigation if soil is dry', 'Check seed germination rate'] },
      { name: 'Tillering', nameHi: 'कंशिंग', nameGu: 'ટિલ', startDay: 11, endDay: 40, tasks: ['Apply first nitrogen dose', 'Irrigate if needed', 'Control weeds early'] },
      { name: 'Jointing', nameHi: 'गाँठ अवस्था', nameGu: 'સ્ટ્રૉ', startDay: 41, endDay: 65, tasks: ['Second irrigation at jointing', 'Apply second nitrogen dose', 'Monitor for rust disease'] },
      { name: 'Heading', nameHi: 'शीर्ष अवस्था', nameGu: 'સ્પાઇક', startDay: 66, endDay: 80, tasks: ['Third irrigation at heading', 'Spray for aphids if population high', 'Check for yellow rust'] },
      { name: 'Grain Fill', nameHi: 'दाना भरना', nameGu: 'દાણા ભરણ', startDay: 81, endDay: 110, tasks: ['Fourth irrigation at grain fill', 'Avoid late irrigation to prevent lodging', 'Monitor for termite'] },
      { name: 'Harvest', nameHi: 'कटाई', nameGu: 'કાપણી', startDay: 111, endDay: 130, tasks: ['Harvest at golden yellow stage', 'Thresh promptly to avoid shattering', 'Store at <12% moisture'] },
    ],
  },
  {
    key: 'groundnut',
    names: { en: 'Groundnut', hi: 'मूंगफली', gu: 'મગફળી' },
    season: 'Kharif',
    temp: [25, 35], humidity: [50, 75], rain: [50, 125], ph: [6.0, 7.0], N: [20, 40], P: [30, 50], K: [30, 50],
    waterRequirement: 'Medium',
    stages: [
      { name: 'Germination', nameHi: 'अंकुरण', nameGu: 'અંકુરણ', startDay: 0, endDay: 10, tasks: ['Ensure good soil contact', 'Pre-sowing irrigation', 'Use treated seed'] },
      { name: 'Vegetative', nameHi: 'वानस्पतिक', nameGu: 'વનસ્પતિ', startDay: 11, endDay: 35, tasks: ['First weeding', 'Apply gypsum for pod fill', 'Monitor for leaf minor'] },
      { name: 'Flowering & Pegging', nameHi: 'फूल और खूंटी', nameGu: 'ફૂલ અને ડૂંડ', startDay: 36, endDay: 65, tasks: ['Irrigate at pegging stage', 'Apply second gypsum dose', 'Avoid soil disturbance near pegs'] },
      { name: 'Pod Development', nameHi: 'फली विकास', nameGu: 'ઢોળ વિકાસ', startDay: 66, endDay: 100, tasks: ['Maintain soil moisture', 'Monitor for collar rot', 'Avoid waterlogging'] },
      { name: 'Harvest', nameHi: 'खुदाई', nameGu: 'ઉચ્છેદ', startDay: 101, endDay: 120, tasks: ['Dig when 70% pods mature', 'Dry in field for 2-3 days', 'Store at <8% moisture'] },
    ],
  },
  {
    key: 'rice',
    names: { en: 'Rice', hi: 'धान', gu: 'ડાંગર' },
    season: 'Kharif',
    temp: [20, 35], humidity: [60, 90], rain: [100, 200], ph: [5.5, 7.5], N: [80, 120], P: [40, 60], K: [40, 60],
    waterRequirement: 'High',
    stages: [],
  },
  {
    key: 'bajra',
    names: { en: 'Pearl Millet (Bajra)', hi: 'बाजरा', gu: 'બાજરો' },
    season: 'Kharif',
    temp: [25, 38], humidity: [40, 70], rain: [30, 60], ph: [6, 8], N: [60, 100], P: [30, 50], K: [20, 40],
    waterRequirement: 'Low',
    stages: [],
  },
  {
    key: 'maize',
    names: { en: 'Maize (Corn)', hi: 'मक्का', gu: 'મકાઈ' },
    season: 'Kharif',
    temp: [21, 30], humidity: [50, 75], rain: [60, 120], ph: [5.8, 7.0], N: [80, 120], P: [40, 70], K: [40, 70],
    waterRequirement: 'Medium',
    stages: [],
  },
  {
    key: 'cumin',
    names: { en: 'Cumin (Jeera)', hi: 'जीरा', gu: 'જીરૂ' },
    season: 'Rabi',
    temp: [10, 22], humidity: [30, 60], rain: [20, 40], ph: [7, 8.5], N: [20, 40], P: [20, 40], K: [20, 40],
    waterRequirement: 'Low',
    stages: [],
  },
  {
    key: 'chana',
    names: { en: 'Chickpea (Chana)', hi: 'चना', gu: 'ચણા' },
    season: 'Rabi',
    temp: [15, 25], humidity: [40, 65], rain: [30, 60], ph: [6, 8], N: [20, 30], P: [40, 60], K: [30, 50],
    waterRequirement: 'Low',
    stages: [],
  },
  {
    key: 'sesame',
    names: { en: 'Sesame (Til)', hi: 'तिल', gu: 'તલ' },
    season: 'Kharif',
    temp: [25, 38], humidity: [40, 70], rain: [40, 80], ph: [5.5, 7.5], N: [40, 60], P: [25, 40], K: [25, 40],
    waterRequirement: 'Low',
    stages: [],
  },
];

/* ── Prices ───────────────────────────────────────────────────── */
const PRICES = [
  { cropKey: 'cotton', market: 'Rajkot APMC', district: 'Rajkot', modalPrice: 7100, minPrice: 6800, maxPrice: 7400, source: 'manual', date: new Date() },
  { cropKey: 'cotton', market: 'Surendranagar APMC', district: 'Surendranagar', modalPrice: 6950, minPrice: 6700, maxPrice: 7200, source: 'manual', date: new Date() },
  { cropKey: 'wheat', market: 'Ahmedabad APMC', district: 'Ahmedabad', modalPrice: 2250, minPrice: 2100, maxPrice: 2400, source: 'manual', date: new Date() },
  { cropKey: 'groundnut', market: 'Junagadh APMC', district: 'Junagadh', modalPrice: 6200, minPrice: 5900, maxPrice: 6500, source: 'manual', date: new Date() },
  { cropKey: 'bajra', market: 'Mehsana APMC', district: 'Mehsana', modalPrice: 2000, minPrice: 1850, maxPrice: 2150, source: 'manual', date: new Date() },
  { cropKey: 'cumin', market: 'Unjha APMC', district: 'Mehsana', modalPrice: 32000, minPrice: 30000, maxPrice: 35000, source: 'manual', date: new Date() },
  // Also seed legacy format
  { crop: 'cotton', market: 'Rajkot APMC', modalPrice: 7100, minPrice: 6800, maxPrice: 7400, cropKey: 'cotton', date: new Date() },
  { crop: 'wheat', market: 'Ahmedabad APMC', modalPrice: 2250, minPrice: 2100, maxPrice: 2400, cropKey: 'wheat', date: new Date() },
  { crop: 'groundnut', market: 'Junagadh APMC', modalPrice: 6200, minPrice: 5900, maxPrice: 6500, cropKey: 'groundnut', date: new Date() },
];

/* ── Expert contacts ──────────────────────────────────────────── */
const EXPERTS = [
  { name: 'Dr. Ramesh Patel', phone: '02712-234567', district: 'Ahmedabad', languages: ['gu', 'hi', 'en'], role: 'agronomist' },
  { name: 'Smt. Meena Sharma', phone: '02822-345678', district: 'Rajkot', languages: ['gu', 'hi'], role: 'agronomist' },
  { name: 'Sh. Vikram Singh', phone: '02762-456789', district: 'Surendranagar', languages: ['hi', 'gu'], role: 'agronomist' },
  { name: 'Dr. Hetal Mehta', phone: '02792-567890', district: 'Junagadh', languages: ['gu', 'en'], role: 'pathologist' },
  { name: 'ATMA Advisor', phone: '1800-180-1551', district: 'All', languages: ['en', 'hi', 'gu'], role: 'kisan_call_centre' },
];

/* ── Announcements ────────────────────────────────────────────── */
const ANNOUNCEMENTS = [
  {
    title: { en: 'Kharif 2024-25 Crop Loan Scheme', hi: 'खरीफ 2024-25 फसल ऋण योजना', gu: 'ખરીફ 2024-25 પાક ધિરાણ યોજના' },
    body: {
      en: 'Apply for zero-interest crop loans up to ₹3 lakh before October 31. Visit your nearest cooperative bank.',
      hi: '31 अक्टूबर से पहले ₹3 लाख तक के शून्य-ब्याज फसल ऋण के लिए आवेदन करें।',
      gu: '31 ઓક્ટોબર પહેલા ₹3 લાખ સુધીની શૂન્ય-વ્યાજ પાક ધિરાણ માટે અરજી કરો.',
    },
    publishedAt: new Date(),
    expiresAt: new Date('2024-10-31'),
  },
  {
    title: { en: 'Cotton Bollworm Alert – Saurashtra', hi: 'कपास में बॉलवर्म चेतावनी – सौराष्ट्र', gu: 'કપાસ બૉલવર્મ ચેતવણી – સૌરાષ્ટ્ર' },
    body: {
      en: 'Increased pink bollworm activity reported in Rajkot and Surendranagar districts. Monitor crops, use pheromone traps. Contact local agronomist.',
      hi: 'राजकोट और सुरेंद्रनगर जिलों में गुलाबी बॉलवर्म की गतिविधि बढ़ी है। फसल की निगरानी करें।',
      gu: 'રાજકોટ અને સુરેન્દ્રનગર જિલ્લામાં ગુલાબી ઇળ (bollworm)ની પ્રવૃત્તિ વધી છે. ફેરોમૉન ટ્રૅપ વાપરો.',
    },
    district: 'Rajkot',
    cropKey: 'cotton',
    publishedAt: new Date(),
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  },
];

/* ── Main ─────────────────────────────────────────────────────── */
(async () => {
  await mongoose.connect(MONGO_URI);
  console.log('[Seed] Connected to MongoDB:', MONGO_URI);

  // --- Crops ---
  for (const crop of CROPS) {
    await M.Crop.findOneAndUpdate({ key: crop.key }, crop, { upsert: true, new: true });
    console.log(`[Seed] Crop: ${crop.key} (${crop.names.en})`);
  }

  // --- Rules from advisory.js ---
  for (const rule of DEFAULT_RULES) {
    await M.Rule.findOneAndUpdate({ id: rule.id }, rule, { upsert: true, new: true });
    console.log(`[Seed] Rule: ${rule.id}`);
  }

  // --- Prices ---
  for (const price of PRICES) {
    await M.Price.create(price);
  }
  // Also seed legacy MarketPrice format
  await M.MarketPrice.deleteMany({});
  await M.MarketPrice.insertMany([
    { crop: 'cotton', city: 'Rajkot', price: 7100, unit: '₹/quintal', change: '+2.3%', trend: [6800, 6900, 7000, 7050, 7100], date: new Date() },
    { crop: 'wheat', city: 'Ahmedabad', price: 2250, unit: '₹/quintal', change: '+0.8%', trend: [2100, 2150, 2180, 2220, 2250], date: new Date() },
    { crop: 'groundnut', city: 'Junagadh', price: 6200, unit: '₹/quintal', change: '-1.2%', trend: [6400, 6350, 6300, 6250, 6200], date: new Date() },
    { crop: 'bajra', city: 'Mehsana', price: 2000, unit: '₹/quintal', change: '+1.5%', trend: [1900, 1930, 1960, 1980, 2000], date: new Date() },
    { crop: 'cumin', city: 'Unjha', price: 32000, unit: '₹/quintal', change: '+5.2%', trend: [28000, 29000, 30000, 31000, 32000], date: new Date() },
  ]);
  console.log(`[Seed] Prices: ${PRICES.length}`);

  // --- Expert contacts ---
  await M.ExpertContact.deleteMany({});
  await M.ExpertContact.insertMany(EXPERTS);
  console.log(`[Seed] Experts: ${EXPERTS.length}`);

  // --- Announcements ---
  await M.Announcement.deleteMany({});
  await M.Announcement.insertMany(ANNOUNCEMENTS);
  console.log(`[Seed] Announcements: ${ANNOUNCEMENTS.length}`);

  // --- Admin user ---
  const adminEmail = (process.env.ADMIN_EMAIL || 'admin@cloud2crop.in').toLowerCase();
  const adminPass = process.env.ADMIN_PASSWORD || 'Admin@123456';
  const existing = await M.User.findOne({ email: adminEmail });
  if (!existing) {
    await M.User.create({
      name: 'Admin',
      email: adminEmail,
      passwordHash: bcrypt.hashSync(adminPass, 10),
      role: 'admin',
      language: 'en',
    });
    console.log(`[Seed] Admin user created: ${adminEmail}`);
  } else {
    console.log(`[Seed] Admin user already exists: ${adminEmail}`);
  }

  // --- Seed legacy data from JSON files if they exist ---
  const fs = require('fs');
  const path = require('path');
  const dataDir = path.join(__dirname, 'data');

  const seedJSON = async (name, Model) => {
    const file = path.join(dataDir, name + '.json');
    if (!fs.existsSync(file)) return;
    const docs = JSON.parse(fs.readFileSync(file, 'utf8'));
    const arr = Array.isArray(docs) ? docs : Object.values(docs);
    await Model.deleteMany({});
    await Model.insertMany(arr.map(d => ({ ...d, cachedAt: new Date() })));
    console.log(`[Seed] ${name}: ${arr.length} documents`);
  };

  // Seed legacy collections (skip crops and prices we already seeded)
  try {
    await seedJSON('users', M.User);
    await seedJSON('locations', M.Location);
    await seedJSON('weather', M.Weather);
    await seedJSON('weatherHistory', M.WeatherHistory);
    await seedJSON('advisories', M.Advisory);
    await seedJSON('alerts', M.Alert);
    await seedJSON('voiceIntents', M.VoiceIntent);
    // Re-create admin after user seed
    const adminExists = await M.User.findOne({ email: adminEmail });
    if (!adminExists) {
      await M.User.create({ name: 'Admin', email: adminEmail, passwordHash: bcrypt.hashSync(adminPass, 10), role: 'admin', language: 'en' });
    }
  } catch (e) {
    console.warn('[Seed] Legacy JSON seed skipped:', e.message);
  }

  await mongoose.disconnect();
  console.log('[Seed] Done!');
})().catch(e => { console.error('[Seed] Failed:', e.message); process.exit(1); });
