/**
 * Weather fetcher – calls Open-Meteo and caches to MongoDB (3-hour TTL).
 * Returns cached payload if fresh; fetches if stale or missing.
 */
const fetch = require('node-fetch');
const M = require('../models');

const OPEN_METEO_BASE = 'https://api.open-meteo.com/v1/forecast';
const TTL_MS = 3 * 60 * 60 * 1000; // 3 hours

function locationKey(lat, lon) {
  return `${(+lat).toFixed(2)},${(+lon).toFixed(2)}`;
}

async function fetchFromOpenMeteo(lat, lon) {
  const params = new URLSearchParams({
    latitude: lat,
    longitude: lon,
    hourly: 'temperature_2m,relative_humidity_2m,precipitation_probability,precipitation,wind_speed_10m,uv_index,soil_temperature_0cm,et0_fao_evapotranspiration',
    daily: 'temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max,wind_speed_10m_max,uv_index_max,weathercode',
    current_weather: true,
    timezone: 'Asia/Kolkata',
    forecast_days: 14,
  });

  const url = `${OPEN_METEO_BASE}?${params}`;
  const res = await fetch(url, { timeout: 10000 });
  if (!res.ok) throw new Error(`Open-Meteo HTTP ${res.status}`);
  return res.json();
}

function normalisePayload(raw) {
  const cw = raw.current_weather || {};
  const h = raw.hourly || {};
  const d = raw.daily || {};

  // Build daily forecast array (14 days)
  const daily = (d.time || []).map((date, i) => ({
    date,
    tempMax: d.temperature_2m_max?.[i],
    tempMin: d.temperature_2m_min?.[i],
    rainfallMm: d.precipitation_sum?.[i] ?? 0,
    rainProb: d.precipitation_probability_max?.[i] ?? 0,
    windKmh: d.wind_speed_10m_max?.[i] ?? 0,
    uvIndex: d.uv_index_max?.[i] ?? 0,
    weatherCode: d.weathercode?.[i],
  }));

  // Build hourly array (48 h)
  const hourly = (h.time || []).slice(0, 48).map((ts, i) => ({
    time: ts,
    temp: h.temperature_2m?.[i],
    humidity: h.relative_humidity_2m?.[i],
    rainProb: h.precipitation_probability?.[i] ?? 0,
    rain: h.precipitation?.[i] ?? 0,
    wind: h.wind_speed_10m?.[i] ?? 0,
    uv: h.uv_index?.[i] ?? 0,
    soilTemp: h.soil_temperature_0cm?.[i],
    et0: h.et0_fao_evapotranspiration?.[i],
  }));

  return {
    lat: raw.latitude,
    lon: raw.longitude,
    current: {
      temperature: cw.temperature ?? null,
      windKmh: cw.windspeed ?? 0,
      weatherCode: cw.weathercode,
      isDay: cw.is_day,
      humidity: hourly[0]?.humidity ?? null,
      rainProb: hourly[0]?.rainProb ?? 0,
      rainfallMm: hourly[0]?.rain ?? 0,
      uvIndex: hourly[0]?.uv ?? 0,
    },
    hourly,
    daily,
    // Keep legacy forecast array for backward compat
    forecast: daily.map(d => ({
      date: d.date,
      rainProbability: d.rainProb,
      rainfallMm: d.rainfallMm,
      tempMax: d.tempMax,
      tempMin: d.tempMin,
    })),
  };
}

/**
 * Get weather for lat/lon – from cache if fresh, else fetch and cache.
 * @param {number} lat
 * @param {number} lon
 * @param {boolean} forceRefresh
 */
async function getWeather(lat, lon, forceRefresh = false) {
  const key = locationKey(lat, lon);
  const now = new Date();

  if (!forceRefresh) {
    const cached = await M.WeatherCache.findOne({ locationKey: key }).lean();
    if (cached && cached.expiresAt > now) {
      return { ...cached.payload, _cached: true, _cachedAt: cached.fetchedAt };
    }
  }

  // Fetch fresh
  let raw;
  try {
    raw = await fetchFromOpenMeteo(lat, lon);
  } catch (err) {
    // Return last good cache even if expired, with timestamp warning
    const stale = await M.WeatherCache.findOne({ locationKey: key }).lean();
    if (stale) return { ...stale.payload, _cached: true, _stale: true, _cachedAt: stale.fetchedAt };
    throw err;
  }

  const payload = normalisePayload(raw);
  const expiresAt = new Date(now.getTime() + TTL_MS);

  await M.WeatherCache.findOneAndUpdate(
    { locationKey: key },
    { locationKey: key, payload, fetchedAt: now, expiresAt },
    { upsert: true, new: true }
  );

  return { ...payload, _cached: false, _cachedAt: now };
}

module.exports = { getWeather, locationKey };
