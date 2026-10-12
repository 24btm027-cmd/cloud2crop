const test = require('node:test');
const assert = require('node:assert');
const { sendOtp, verifyOtp } = require('../lib/otp');

test('OTP helper sends dev OTP and validates correct code', async () => {
  const phone = '9876543210';
  const res = await sendOtp(phone);
  assert.strictEqual(res.sent, true);
  assert.strictEqual(res.devCode, '123456');

  const isValid = await verifyOtp(phone, '123456');
  assert.strictEqual(isValid, true);

  const isInvalid = await verifyOtp(phone, '000000');
  assert.strictEqual(isInvalid, false);
});

test('OTP helper passes custom code and falls back safely when Twilio env vars are missing', async () => {
  const originalProvider = process.env.OTP_PROVIDER;
  try {
    process.env.OTP_PROVIDER = 'twilio';
    delete process.env.TWILIO_ACCOUNT_SID;
    delete process.env.TWILIO_AUTH_TOKEN;
    delete process.env.TWILIO_VERIFY_SID;

    const phone = '9876543210';
    const customCode = '654321';
    const res = await sendOtp(phone, customCode);

    assert.strictEqual(res.sent, true);
    assert.strictEqual(res.provider, 'mock');
    assert.strictEqual(res.devCode, customCode);

    const validCheck = await verifyOtp(phone, '123456');
    assert.strictEqual(validCheck, true);
  } finally {
    process.env.OTP_PROVIDER = originalProvider;
  }
});

