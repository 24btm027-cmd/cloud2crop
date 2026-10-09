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
