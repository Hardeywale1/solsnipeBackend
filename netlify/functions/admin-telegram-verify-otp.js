/**
 * Admin Telegram OTP Verification
 *
 * Replaces username/password admin login. An authorized admin sends
 * /adminlogin to the bot (see telegram-webhook.js), receives a 6-digit code,
 * and submits it here to receive the same admin JWT admin-login.js used to
 * issue - so every other admin-protected endpoint keeps working unchanged.
 *
 * POST /admin-telegram-verify-otp
 * Body: { otp: "123456" }
 * Response matches admin-login.js: { success, token, adminId, role, expiresIn, loginAt }
 */

const jwt = require('jsonwebtoken');
const { validateOTPRecord } = require('./utils/otpService');
const { TelegramStore } = require('./utils/telegramStore');
const { ADMIN_TELEGRAM_USERNAMES } = require('./utils/adminTelegramConfig');

// Same fallback literal used by admin-login.js / get-all-wallets.js for consistency
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this';

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json'
};

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    const { otp } = JSON.parse(event.body || '{}');

    if (!otp) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'OTP code is required' }) };
    }

    if (ADMIN_TELEGRAM_USERNAMES.length === 0) {
      return { statusCode: 500, headers, body: JSON.stringify({ error: 'No admin Telegram usernames configured' }) };
    }

    const store = new TelegramStore();

    // Only a handful of admin usernames are ever configured, so checking each
    // one's current OTP record is cheap and avoids requiring the client to
    // know which admin the code belongs to.
    for (const adminUsername of ADMIN_TELEGRAM_USERNAMES) {
      const record = await store.getAdminOtp(adminUsername);
      if (!record) continue;

      const validation = validateOTPRecord(record, otp.toString());
      if (!validation.valid) {
        continue;
      }

      // Valid match - mark used so it can't be replayed
      await store.markAdminOtpVerified(adminUsername);

      const token = jwt.sign(
        {
          adminId: record.telegramUsername,
          role: 'super_admin',
          type: 'admin',
          isAdmin: true
        },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          token,
          adminId: record.telegramUsername,
          role: 'super_admin',
          expiresIn: '24h',
          loginAt: new Date().toISOString()
        })
      };
    }

    // No admin record matched this code - increment attempts on any
    // outstanding (unverified, unexpired) record so brute-forcing is bounded
    for (const adminUsername of ADMIN_TELEGRAM_USERNAMES) {
      const record = await store.getAdminOtp(adminUsername);
      if (record && !record.verified) {
        await store.incrementAdminOtpAttempts(adminUsername, record.attempts).catch(() => {});
      }
    }

    await new Promise(resolve => setTimeout(resolve, 500));
    return { statusCode: 401, headers, body: JSON.stringify({ error: 'Invalid or expired code' }) };
  } catch (error) {
    console.error('Admin Telegram OTP verify error:', error);
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Internal server error', message: error.message }) };
  }
};
