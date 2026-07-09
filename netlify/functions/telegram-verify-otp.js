/**
 * Verify OTP
 *
 * POST /telegram-verify-otp
 * Body: { otpSessionId: "...", otp: "123456" }
 * Returns: { success, verified: true, telegramUsername }
 *
 * This ONLY verifies the Telegram identity. Wallet creation/connection is
 * still handled separately by wallet-connect (unchanged).
 */

const { validateOTPRecord } = require('./utils/otpService');
const { TelegramStore } = require('./utils/telegramStore');
const { corsHeaders, parseBody } = require('./utils/response');

const jsonHeaders = { 'Content-Type': 'application/json', ...corsHeaders };

function respond(statusCode, payload) {
  return { statusCode, headers: jsonHeaders, body: JSON.stringify(payload) };
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: corsHeaders, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return respond(405, { success: false, error: 'Method not allowed' });
  }

  try {
    const { otpSessionId, otp } = parseBody(event.body);

    if (!otpSessionId || !otp) {
      return respond(400, { success: false, error: 'OTP session ID and OTP code are required' });
    }

    const store = new TelegramStore();

    const otpRecord = await store.getOtpRecord(otpSessionId);
    if (!otpRecord) {
      return respond(404, { success: false, error: 'Invalid or expired OTP session' });
    }

    const validation = validateOTPRecord(otpRecord, otp.toString());
    if (!validation.valid) {
      // Track failed attempt
      await store.incrementOtpAttempts(otpSessionId, otpRecord.attempts);
      return respond(400, { success: false, error: validation.error });
    }

    const telegramUsername = otpRecord.telegramUsername;

    // Mark OTP + user as verified
    await store.markOtpVerified(otpSessionId);
    await store.markUserVerified(telegramUsername);

    return respond(200, {
      success: true,
      verified: true,
      telegramUsername,
      message: 'OTP verified successfully. You can now connect your wallet.'
    });
  } catch (error) {
    console.error('Error in telegram-verify-otp:', error);
    return respond(500, { success: false, error: error.message });
  }
};
