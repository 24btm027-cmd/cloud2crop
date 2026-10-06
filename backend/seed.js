// Loads the JSON files in ./data into MongoDB.  Run: npm run seed
require('dotenv').config();
const fs = require('fs'), path = require('path');
const mongoose = require('mongoose'), bcrypt = require('bcryptjs');
const M = require('./models');
const read = n => JSON.parse(fs.readFileSync(path.join(__dirname, 'data', n + '.json'), 'utf8'));

(async () => {
  await mongoose.connect((process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/cloud2crop'));
  const users = read('users').map(u => ({ ...u, password: bcrypt.hashSync(u.password, 10) })); // passwords are hashed
  const weather = Object.values(read('weather')).map(w => ({ ...w, cachedAt: new Date() }));
  const jobs = [['User', users], ['Location', read('locations')], ['Weather', weather], ['WeatherHistory', read('weatherHistory')],
    ['Crop', read('crops')], ['Advisory', read('advisories')], ['Alert', read('alerts')], ['MarketPrice', read('marketPrices')], ['VoiceIntent', read('voiceIntents')]];
  for (const [name, docs] of jobs) {
    await M[name].deleteMany({}); await M[name].syncIndexes(); await M[name].insertMany(docs);
    console.log(`${name}: ${docs.length} documents`);
  }
  await mongoose.disconnect(); console.log('Seeding done');
})().catch(e => { console.error('Seed failed:', e.message); process.exit(1); });
