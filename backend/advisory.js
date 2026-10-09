/**
 * Advisory Rules Engine
 * Evaluates current weather + crop stage → returns advisory objects
 */

const DEFAULT_RULES = [
  {
    id: 'spray_ok',
    crops: [],
    stages: [],
    conditions: { windKmh: { max: 20 }, rainProb: { max: 30 }, humidity: { max: 85 } },
    recommendationKey: 'spray_ok',
    severity: 'info',
    enabled: true,
  },
  {
    id: 'spray_avoid',
    crops: [],
    stages: [],
    conditions: { rainProb: { min: 50 } },
    recommendationKey: 'spray_avoid',
    severity: 'warning',
    enabled: true,
  },
  {
    id: 'irrigate_delay',
    crops: [],
    stages: [],
    conditions: { rainProb: { min: 60 } },
    recommendationKey: 'irrigate_delay',
    severity: 'info',
    enabled: true,
  },
  {
    id: 'fungal_risk',
    crops: [],
    stages: [],
    conditions: { humidity: { min: 85 }, temp: { min: 22, max: 32 } },
    recommendationKey: 'fungal_risk',
    severity: 'warning',
    enabled: true,
  },
  {
    id: 'heat_stress',
    crops: [],
    stages: [],
    conditions: { temp: { min: 38 } },
    recommendationKey: 'heat_stress',
    severity: 'warning',
    enabled: true,
  },
  {
    id: 'heavy_rain',
    crops: [],
    stages: [],
    conditions: { rainfallMm: { min: 50 } },
    recommendationKey: 'heavy_rain',
    severity: 'critical',
    enabled: true,
  },
];

const RECOMMENDATIONS = {
  en: {
    spray_ok: 'Conditions are suitable for spraying today. Wind is calm and rain is unlikely.',
    spray_avoid: 'Avoid spraying today. Rain is expected which will wash off chemicals.',
    irrigate_delay: 'Rain is likely. Delay irrigation to conserve water and energy.',
    fungal_risk: 'High humidity and warm temperatures increase fungal disease risk. Monitor crops closely.',
    heat_stress: 'Temperature above 38°C. Schedule fieldwork in early morning or evening. Ensure adequate irrigation.',
    heavy_rain: 'Heavy rain expected (50mm+). Clear drainage channels to prevent waterlogging.',
  },
  hi: {
    spray_ok: 'आज छिड़काव के लिए उपयुक्त स्थितियाँ हैं। हवा शांत है और बारिश की संभावना कम है।',
    spray_avoid: 'आज छिड़काव से बचें। बारिश की उम्मीद है जो रसायनों को धो देगी।',
    irrigate_delay: 'बारिश की संभावना है। पानी और ऊर्जा बचाने के लिए सिंचाई में देरी करें।',
    fungal_risk: 'अधिक नमी और गर्म तापमान फंगल रोग का खतरा बढ़ाते हैं। फसलों की बारीकी से निगरानी करें।',
    heat_stress: 'तापमान 38°C से ऊपर। सुबह जल्दी या शाम को खेत का काम करें। पर्याप्त सिंचाई सुनिश्चित करें।',
    heavy_rain: 'भारी बारिश की उम्मीद है (50मिमी+)। जलभराव से बचने के लिए जल निकासी चैनल साफ करें।',
  },
  gu: {
    spray_ok: 'આજે છંટકાવ માટે અનુકૂળ સ્થિતિ છે. પવન શાંત છે અને વરસાદ ઓછો થવાની શક્યતા છે.',
    spray_avoid: 'આજે છંટકાવ ટાળો. વરસાદ અપેક્ષિત છે જે રસાયણો ધોઈ નાખશે.',
    irrigate_delay: 'વરસાદ થવાની શક્યતા છે. પાણી અને ઊર્જા બચાવવા સિંચાઈ મોડી કરો.',
    fungal_risk: 'વધારે ભેજ અને ગરમ તાપમાન ફૂગ રોગનું જોખમ વધારે છે. પાક ઉપર ધ્યાન રાખો.',
    heat_stress: 'તાપમાન 38°C ઉપર. ખેતર કામ વહેલી સવારે અથવા સાંજે કરો. પૂરતી સિંચાઈ કરો.',
    heavy_rain: 'ભારે વરસાદ અપેક્ષિત (50 મિ.મી.+). પાણી ભરાઈ ન જાય તે માટે ડ્રેનેજ ચેનલ સાફ કરો.',
  },
};

/**
 * Check a single condition object against weather values
 * conditions: { windKmh: { max: 20 }, rainProb: { min: 50 } }
 */
function matchesCondition(conditions, weather) {
  for (const [field, constraint] of Object.entries(conditions)) {
    const val = weather[field];
    if (val === undefined || val === null) continue;
    if (constraint.min !== undefined && val < constraint.min) return false;
    if (constraint.max !== undefined && val > constraint.max) return false;
  }
  return true;
}

/**
 * Run rules engine against current weather + optional crop/stage filter
 * @param {object} weather - { temp, humidity, windKmh, rainfallMm, rainProb, ... }
 * @param {string[]} cropKeys - farmer's crop keys
 * @param {string} lang - 'en'|'hi'|'gu'
 * @param {object[]} dbRules - rules from DB (optional, falls back to DEFAULT_RULES)
 */
function runAdvisory(weather, cropKeys = [], lang = 'en', dbRules = null) {
  const rules = dbRules || DEFAULT_RULES;
  const enabled = rules.filter(r => r.enabled !== false);
  const results = [];

  for (const rule of enabled) {
    // crop filter (empty array means applies to all)
    if (rule.crops && rule.crops.length > 0) {
      if (!cropKeys.some(k => rule.crops.includes(k))) continue;
    }

    if (matchesCondition(rule.conditions || {}, weather)) {
      const msgs = RECOMMENDATIONS[lang] || RECOMMENDATIONS.en;
      results.push({
        ruleId: rule.id,
        key: rule.recommendationKey,
        level: rule.severity,
        text: msgs[rule.recommendationKey] || rule.recommendationKey,
      });
    }
  }

  return results;
}

module.exports = { runAdvisory, DEFAULT_RULES, RECOMMENDATIONS };
