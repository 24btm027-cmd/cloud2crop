const mongoose = require('mongoose');
// Flexible schemas (strict:false) keep the project short; add field types later if your teacher asks.
const make = (name, setup) => { const s = new mongoose.Schema({}, { strict: false }); if (setup) setup(s); return mongoose.model(name, s); };

module.exports = {
  User: make('User', s => s.index({ phone: 1 }, { unique: true })),
  Location: make('Location', s => s.index({ location: '2dsphere' })),            // geospatial index
  Weather: make('Weather', s => s.index({ cachedAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 30 })), // TTL cache: auto-deletes after 30 days
  WeatherHistory: make('WeatherHistory', s => s.index({ location: 1, year: 1, month: 1 })),
  Crop: make('Crop'),
  Advisory: make('Advisory', s => s.index({ city: 1, date: 1 })),
  Alert: make('Alert', s => s.index({ city: 1 })),
  MarketPrice: make('MarketPrice', s => s.index({ crop: 1 })),
  VoiceIntent: make('VoiceIntent'),
};
