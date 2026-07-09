const crypto = require('crypto');

/**
 * Generate a random 6-digit OTP
 */
function generateOTP() {
  return crypto.randomInt(100000, 999999).toString();
}

/**
 * Create OTP record for storage in Firestore
 */
function createOTPRecord(telegramUsername, otp) {
  const expiryMinutes = parseInt(process.env.OTP_EXPIRY_MINUTES || '5');
  const expiryTime = new Date(Date.now() + expiryMinutes * 60 * 1000);

  return {
    telegramUsername,
    otp,
    createdAt: new Date().toISOString(),
    expiresAt: expiryTime.toISOString(),
    attempts: 0,
    maxAttempts: 3,
    verified: false
  };
}

/**
 * Validate OTP format and expiry
 */
function validateOTPRecord(record, providedOTP) {
  if (!record) {
    return { valid: false, error: 'No OTP found. Request a new one.' };
  }

  if (record.verified) {
    return { valid: false, error: 'OTP already used.' };
  }

  if (record.attempts >= record.maxAttempts) {
    return { valid: false, error: 'Too many attempts. Request a new OTP.' };
  }

  const now = new Date();
  const expiryTime = new Date(record.expiresAt);
  if (now > expiryTime) {
    return { valid: false, error: 'OTP expired. Request a new one.' };
  }

  if (record.otp !== providedOTP) {
    return { valid: false, error: 'Invalid OTP.' };
  }

  return { valid: true };
}

module.exports = {
  generateOTP,
  createOTPRecord,
  validateOTPRecord
};
