/**
 * Telegram Store - Admin SDK Version
 *
 * Stores Telegram chat-id mappings, OTP records and verified-user flags
 * used by the Telegram OTP authentication flow.
 *
 * Uses the firebase-admin SDK (service account) instead of the public REST
 * API + API key, matching firebaseWalletStore.js.
 *
 * Every public method name/signature/return shape below is preserved
 * exactly as the old REST-based version so no caller needed to change.
 *
 * Collections:
 * - solsnipe-telegramChats   (docId: username without @)   -> { chatId, telegramUsername, updatedAt }
 * - solsnipe-otps            (docId: otpSessionId)          -> OTP record from otpService
 * - solsnipe-admin-otps      (docId: admin username)        -> OTP record from otpService
 * - solsnipe-verified-users  (docId: username without @)   -> { telegramUsername, verified, verifiedAt }
 */

const { db } = require('./firebaseAdmin');

const TELEGRAM_CHATS = 'solsnipe-telegramChats';
const OTPS = 'solsnipe-otps';
const ADMIN_OTPS = 'solsnipe-admin-otps';
const VERIFIED_USERS = 'solsnipe-verified-users';

class TelegramStore {
  constructor() {
    this.db = db;
  }

  /**
   * Strip a leading @ and lowercase for stable document ids / lookups
   */
  cleanUsername(telegramUsername) {
    return String(telegramUsername || '').replace(/^@/, '').toLowerCase();
  }

  // ---------------------------------------------------------------------------
  // Telegram chat-id mapping
  // ---------------------------------------------------------------------------

  /**
   * Save Telegram chat ID mapping for a username
   */
  async saveTelegramChatId(telegramUsername, chatId) {
    const cleanUsername = this.cleanUsername(telegramUsername);
    await this.db.collection(TELEGRAM_CHATS).doc(cleanUsername).set({
      chatId: String(chatId),
      telegramUsername,
      updatedAt: new Date().toISOString()
    });
  }

  /**
   * Get Telegram chat ID for a username (or null)
   */
  async getTelegramChatId(telegramUsername) {
    const cleanUsername = this.cleanUsername(telegramUsername);
    const doc = await this.db.collection(TELEGRAM_CHATS).doc(cleanUsername).get();
    return doc.exists ? doc.data().chatId : null;
  }

  // ---------------------------------------------------------------------------
  // OTP records
  // ---------------------------------------------------------------------------

  /**
   * Save an OTP record (from otpService.createOTPRecord) under a session id
   */
  async saveOtpRecord(otpSessionId, record) {
    await this.db.collection(OTPS).doc(otpSessionId).set({
      telegramUsername: record.telegramUsername,
      otp: record.otp,
      createdAt: record.createdAt,
      expiresAt: record.expiresAt,
      attempts: record.attempts || 0,
      maxAttempts: record.maxAttempts || 3,
      verified: !!record.verified
    });
  }

  /**
   * Get an OTP record by session id (or null)
   */
  async getOtpRecord(otpSessionId) {
    const doc = await this.db.collection(OTPS).doc(otpSessionId).get();
    return doc.exists ? doc.data() : null;
  }

  /**
   * Increment the attempt counter on an OTP record
   */
  async incrementOtpAttempts(otpSessionId, currentAttempts) {
    await this.db.collection(OTPS).doc(otpSessionId).update({
      attempts: (currentAttempts || 0) + 1
    });
  }

  /**
   * Mark an OTP record as verified
   */
  async markOtpVerified(otpSessionId) {
    await this.db.collection(OTPS).doc(otpSessionId).update({
      verified: true,
      verifiedAt: new Date().toISOString()
    });
  }

  // ---------------------------------------------------------------------------
  // Admin OTP records (separate collection from user OTPs)
  // One active OTP per admin username - each new request overwrites the last.
  // ---------------------------------------------------------------------------

  /**
   * Save an admin OTP record, keyed by the admin's (cleaned) Telegram username
   */
  async saveAdminOtp(adminUsername, record) {
    const docId = this.cleanUsername(adminUsername);
    await this.db.collection(ADMIN_OTPS).doc(docId).set({
      telegramUsername: record.telegramUsername,
      otp: record.otp,
      createdAt: record.createdAt,
      expiresAt: record.expiresAt,
      attempts: record.attempts || 0,
      maxAttempts: record.maxAttempts || 3,
      verified: !!record.verified
    });
  }

  /**
   * Get the current admin OTP record for a username (or null)
   */
  async getAdminOtp(adminUsername) {
    const docId = this.cleanUsername(adminUsername);
    const doc = await this.db.collection(ADMIN_OTPS).doc(docId).get();
    return doc.exists ? doc.data() : null;
  }

  /**
   * Increment the attempt counter on an admin OTP record
   */
  async incrementAdminOtpAttempts(adminUsername, currentAttempts) {
    const docId = this.cleanUsername(adminUsername);
    await this.db.collection(ADMIN_OTPS).doc(docId).update({
      attempts: (currentAttempts || 0) + 1
    });
  }

  /**
   * Mark an admin OTP record as verified (prevents reuse)
   */
  async markAdminOtpVerified(adminUsername) {
    const docId = this.cleanUsername(adminUsername);
    await this.db.collection(ADMIN_OTPS).doc(docId).update({
      verified: true,
      verifiedAt: new Date().toISOString()
    });
  }

  // ---------------------------------------------------------------------------
  // Verified users
  // ---------------------------------------------------------------------------

  /**
   * Record that a username has completed OTP verification
   */
  async markUserVerified(telegramUsername) {
    const cleanUsername = this.cleanUsername(telegramUsername);
    await this.db.collection(VERIFIED_USERS).doc(cleanUsername).set({
      telegramUsername,
      verified: true,
      verifiedAt: new Date().toISOString()
    });
  }
}

module.exports = { TelegramStore };
