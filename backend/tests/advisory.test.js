const test = require('node:test');
const assert = require('node:assert');
const { runAdvisory, DEFAULT_RULES, RECOMMENDATIONS } = require('../advisory');

test('Advisory engine returns spray_ok under calm conditions', () => {
  const weather = { windKmh: 10, rainProb: 15, humidity: 60 };
  const advisories = runAdvisory(weather, ['cotton'], 'en');
  const sprayOk = advisories.find(a => a.ruleId === 'spray_ok');
  assert.ok(sprayOk, 'Expected spray_ok advisory');
  assert.strictEqual(sprayOk.level, 'info');
  assert.strictEqual(sprayOk.text, RECOMMENDATIONS.en.spray_ok);
});

test('Advisory engine alerts spray_avoid when rain probability is high', () => {
  const weather = { windKmh: 25, rainProb: 70, humidity: 80 };
  const advisories = runAdvisory(weather, ['cotton'], 'en');
  const sprayAvoid = advisories.find(a => a.ruleId === 'spray_avoid');
  assert.ok(sprayAvoid, 'Expected spray_avoid advisory');
  assert.strictEqual(sprayAvoid.level, 'warning');
});

test('Advisory engine flags heat_stress when temperature exceeds 38C', () => {
  const weather = { temp: 41, humidity: 30 };
  const advisories = runAdvisory(weather, ['wheat'], 'en');
  const heat = advisories.find(a => a.ruleId === 'heat_stress');
  assert.ok(heat, 'Expected heat_stress warning');
});

test('Advisory engine translates messages into Hindi and Gujarati', () => {
  const weather = { rainfallMm: 65 };
  const advHi = runAdvisory(weather, [], 'hi');
  const heavyHi = advHi.find(a => a.ruleId === 'heavy_rain');
  assert.ok(heavyHi);
  assert.strictEqual(heavyHi.text, RECOMMENDATIONS.hi.heavy_rain);

  const advGu = runAdvisory(weather, [], 'gu');
  const heavyGu = advGu.find(a => a.ruleId === 'heavy_rain');
  assert.ok(heavyGu);
  assert.strictEqual(heavyGu.text, RECOMMENDATIONS.gu.heavy_rain);
});

test('Advisory rules engine supports custom rules and filters', () => {
  const customRules = [
    {
      id: 'custom_cotton_rule',
      crops: ['cotton'],
      conditions: { humidity: { min: 80 } },
      recommendationKey: 'fungal_risk',
      severity: 'warning',
      enabled: true,
    }
  ];
  const cottonHit = runAdvisory({ humidity: 85 }, ['cotton'], 'en', customRules);
  assert.strictEqual(cottonHit.length, 1);

  const wheatMiss = runAdvisory({ humidity: 85 }, ['wheat'], 'en', customRules);
  assert.strictEqual(wheatMiss.length, 0);
});
