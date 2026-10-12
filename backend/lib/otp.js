/**
 * OTP Provider interface
 * - mock: always uses code 123456 in development
 * - twilio: uses Twilio Verify API
 */

const MOCK_CODE = '123456';

async function sendOtp(phone, code) {
  const provider = (process.env.OTP_PROVIDER || 'mock').toLowerCase();

  if (provider === 'twilio') {
    if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN || !process.env.TWILIO_VERIFY_SID) {
      console.warn('[OTP] Twilio credentials missing; falling back to mock provider');
      const otpCode = code || MOCK_CODE;
      return { sent: true, provider: 'mock', devCode: otpCode };
    }
    const twilio = require('twilio');
    const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
    await client.verify.v2
      .services(process.env.TWILIO_VERIFY_SID)
      .verifications.create({ to: `+91${phone}`, channel: 'sms' });
    return { sent: true, provider: 'twilio' };
  }

  // Mock / Dev provider: log code and return devCode for testing/demo
  const otpCode = code || MOCK_CODE;
  console.log(`[OTP-MOCK] Code for ${phone}: ${otpCode}`);
  return { sent: true, provider: 'mock', devCode: otpCode };
}

async function verifyOtp(phone, code) {
  const provider = (process.env.OTP_PROVIDER || 'mock').toLowerCase();

  if (provider === 'twilio') {
    if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN || !process.env.TWILIO_VERIFY_SID) {
      console.warn('[OTP] Twilio credentials missing in verifyOtp; falling back to mock check');
      return code === MOCK_CODE;
    }
    const twilio = require('twilio');
    const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
    const check = await client.verify.v2
      .services(process.env.TWILIO_VERIFY_SID)
      .verificationChecks.create({ to: `+91${phone}`, code });
    return check.status === 'approved';
  }

  // Mock: accept 123456
  return code === MOCK_CODE;
}

module.exports = { sendOtp, verifyOtp };
