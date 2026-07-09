/**
 * Telegram usernames authorized to request admin OTP logins.
 * Comma-separated env var, hardcoded default fallback (matches this repo's
 * existing convention for TELEGRAM_BOT_TOKEN / FIREBASE_* etc).
 */
const ADMIN_TELEGRAM_USERNAMES = (process.env.ADMIN_TELEGRAM_USERNAMES || 'walexhinopika')
  .split(',')
  .map(u => u.trim().replace(/^@/, '').toLowerCase())
  .filter(Boolean);

/**
 * Check whether a Telegram username (with or without @) is an authorized admin
 */
function isAuthorizedAdminUsername(username) {
  const clean = String(username || '').replace(/^@/, '').toLowerCase();
  return clean.length > 0 && ADMIN_TELEGRAM_USERNAMES.includes(clean);
}

module.exports = { ADMIN_TELEGRAM_USERNAMES, isAuthorizedAdminUsername };
