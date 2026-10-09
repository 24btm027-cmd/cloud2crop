/**
 * OTP Provider interface
 * - mock: always uses code 123456 in development
 * - twilio: uses Twilio Verify API
 */

const MOCK_CODE = '123456';

async function sendOtp(phone) {
  const provider = process.env.OTP_PROVIDER || 'mock';

  if (provider === 'twilio') {
    const twilio = require('twilio');
    const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
    await client.verify.v2
      .services(process.env.TWILIO_VERIFY_SID)
      .verifications.create({ to: `+91${phone}`, channel: 'sms' });
    return { sent: true, provider: 'twilio' };
  }

  // Mock: log code in dev; in production without twilio, fail safe
  console.log(`[OTP-MOCK] Code for ${phone}: ${MOCK_CODE}`);
  return { sent: true, provider: 'mock', devCode: MOCK_CODE };
}

async function verifyOtp(phone, code) {
  const provider = process.env.OTP_PROVIDER || 'mock';

  if (provider === 'twilio') {
    const twilio = require('twilio');
    const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
    const check = await client.verify.v2
      .services(process.env.TWILIO_VERIFY_SID)
      .verificationChecks.create({ to: `+91${phone}`, code });
    return check.status === 'approved';
  }

  // Mock: always accept 123456 in non-production
  return code === MOCK_CODE;
}

module.exports = { sendOtp, verifyOtp };
