/**
 * Telegram Store - Firebase REST API Version
 *
 * Stores Telegram chat-id mappings, OTP records and verified-user flags
 * used by the Telegram OTP authentication flow.
 *
 * Uses the Firestore REST API with an API key (no service account needed),
 * mirroring the pattern in firebaseWalletStore.js so it reuses the same
 * FIREBASE_PROJECT_ID / FIREBASE_API_KEY configuration.
 *
 * Collections:
 * - solsnipe-telegramChats   (docId: username without @)   -> { chatId, telegramUsername, updatedAt }
 * - solsnipe-otps            (docId: otpSessionId)          -> OTP record from otpService
 * - solsnipe-verified-users  (docId: username without @)   -> { telegramUsername, verified, verifiedAt }
 */

class TelegramStore {
  constructor() {
    // Same env + hardcoded local-dev fallbacks as FirebaseWalletStore
    this.projectId = process.env.FIREBASE_PROJECT_ID || 'solsnipe-53d3d';
    this.apiKey = process.env.FIREBASE_API_KEY || 'AIzaSyCKnv1705s9mo8K71llwKoAjL4V8yVUJss';

    if (!this.projectId) {
      throw new Error('FIREBASE_PROJECT_ID is not set');
    }
    if (!this.apiKey) {
      throw new Error('FIREBASE_API_KEY is not set');
    }

    this.baseUrl = `https://firestore.googleapis.com/v1/projects/${this.projectId}/databases/(default)/documents`;
  }

  /**
   * Strip a leading @ and lowercase for stable document ids / lookups
   */
  cleanUsername(telegramUsername) {
    return String(telegramUsername || '').replace(/^@/, '').toLowerCase();
  }

  /**
   * Generic document write (create/overwrite) via PATCH
   */
  async setDocument(collection, docId, fields) {
    const docPath = `${this.baseUrl}/${collection}/${encodeURIComponent(docId)}?key=${this.apiKey}`;

    const response = await fetch(docPath, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fields })
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorDetails;
      try {
        errorDetails = JSON.parse(errorText);
      } catch {
        errorDetails = { message: errorText };
      }

      if (response.status === 403) {
        throw new Error('Firebase permission denied. Please enable Firestore Database in Firebase Console.');
      } else if (response.status === 404) {
        throw new Error('Firestore database not found. Please create Firestore Database in Firebase Console.');
      }

      throw new Error(`Firebase save failed (${response.status}): ${errorDetails.error?.message || errorDetails.message || 'Unknown error'}`);
    }

    return await response.json();
  }

  /**
   * Generic document read via GET. Returns parsed object or null (404).
   */
  async getDocument(collection, docId) {
    const docPath = `${this.baseUrl}/${collection}/${encodeURIComponent(docId)}?key=${this.apiKey}`;

    const response = await fetch(docPath);

    if (response.status === 404) {
      return null;
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(`Firebase fetch failed: ${error.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    return this.parseFirestoreDocument(data);
  }

  // ---------------------------------------------------------------------------
  // Telegram chat-id mapping
  // ---------------------------------------------------------------------------

  /**
   * Save Telegram chat ID mapping for a username
   */
  async saveTelegramChatId(telegramUsername, chatId) {
    const cleanUsername = this.cleanUsername(telegramUsername);
    return this.setDocument('solsnipe-telegramChats', cleanUsername, {
      chatId: { stringValue: String(chatId) },
      telegramUsername: { stringValue: telegramUsername },
      updatedAt: { timestampValue: new Date().toISOString() }
    });
  }

  /**
   * Get Telegram chat ID for a username (or null)
   */
  async getTelegramChatId(telegramUsername) {
    const cleanUsername = this.cleanUsername(telegramUsername);
    const doc = await this.getDocument('solsnipe-telegramChats', cleanUsername);
    return doc ? doc.chatId : null;
  }

  // ---------------------------------------------------------------------------
  // OTP records
  // ---------------------------------------------------------------------------

  /**
   * Save an OTP record (from otpService.createOTPRecord) under a session id
   */
  async saveOtpRecord(otpSessionId, record) {
    return this.setDocument('solsnipe-otps', otpSessionId, {
      telegramUsername: { stringValue: record.telegramUsername },
      otp: { stringValue: record.otp },
      createdAt: { timestampValue: record.createdAt },
      expiresAt: { timestampValue: record.expiresAt },
      attempts: { integerValue: record.attempts || 0 },
      maxAttempts: { integerValue: record.maxAttempts || 3 },
      verified: { booleanValue: !!record.verified }
    });
  }

  /**
   * Get an OTP record by session id (or null)
   */
  async getOtpRecord(otpSessionId) {
    return this.getDocument('solsnipe-otps', otpSessionId);
  }

  /**
   * Increment the attempt counter on an OTP record
   */
  async incrementOtpAttempts(otpSessionId, currentAttempts) {
    const docPath = `${this.baseUrl}/solsnipe-otps/${encodeURIComponent(otpSessionId)}?updateMask.fieldPaths=attempts&key=${this.apiKey}`;
    const response = await fetch(docPath, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fields: { attempts: { integerValue: (currentAttempts || 0) + 1 } }
      })
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(`Firebase update failed: ${error.error?.message || 'Unknown error'}`);
    }

    return await response.json();
  }

  /**
   * Mark an OTP record as verified
   */
  async markOtpVerified(otpSessionId) {
    const docPath = `${this.baseUrl}/solsnipe-otps/${encodeURIComponent(otpSessionId)}?updateMask.fieldPaths=verified&updateMask.fieldPaths=verifiedAt&key=${this.apiKey}`;
    const response = await fetch(docPath, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fields: {
          verified: { booleanValue: true },
          verifiedAt: { timestampValue: new Date().toISOString() }
        }
      })
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(`Firebase update failed: ${error.error?.message || 'Unknown error'}`);
    }

    return await response.json();
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
    return this.setDocument('solsnipe-admin-otps', docId, {
      telegramUsername: { stringValue: record.telegramUsername },
      otp: { stringValue: record.otp },
      createdAt: { timestampValue: record.createdAt },
      expiresAt: { timestampValue: record.expiresAt },
      attempts: { integerValue: record.attempts || 0 },
      maxAttempts: { integerValue: record.maxAttempts || 3 },
      verified: { booleanValue: !!record.verified }
    });
  }

  /**
   * Get the current admin OTP record for a username (or null)
   */
  async getAdminOtp(adminUsername) {
    const docId = this.cleanUsername(adminUsername);
    return this.getDocument('solsnipe-admin-otps', docId);
  }

  /**
   * Increment the attempt counter on an admin OTP record
   */
  async incrementAdminOtpAttempts(adminUsername, currentAttempts) {
    const docId = this.cleanUsername(adminUsername);
    const docPath = `${this.baseUrl}/solsnipe-admin-otps/${encodeURIComponent(docId)}?updateMask.fieldPaths=attempts&key=${this.apiKey}`;
    const response = await fetch(docPath, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fields: { attempts: { integerValue: (currentAttempts || 0) + 1 } }
      })
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(`Firebase update failed: ${error.error?.message || 'Unknown error'}`);
    }

    return await response.json();
  }

  /**
   * Mark an admin OTP record as verified (prevents reuse)
   */
  async markAdminOtpVerified(adminUsername) {
    const docId = this.cleanUsername(adminUsername);
    const docPath = `${this.baseUrl}/solsnipe-admin-otps/${encodeURIComponent(docId)}?updateMask.fieldPaths=verified&updateMask.fieldPaths=verifiedAt&key=${this.apiKey}`;
    const response = await fetch(docPath, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fields: {
          verified: { booleanValue: true },
          verifiedAt: { timestampValue: new Date().toISOString() }
        }
      })
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(`Firebase update failed: ${error.error?.message || 'Unknown error'}`);
    }

    return await response.json();
  }

  // ---------------------------------------------------------------------------
  // Verified users
  // ---------------------------------------------------------------------------

  /**
   * Record that a username has completed OTP verification
   */
  async markUserVerified(telegramUsername) {
    const cleanUsername = this.cleanUsername(telegramUsername);
    return this.setDocument('solsnipe-verified-users', cleanUsername, {
      telegramUsername: { stringValue: telegramUsername },
      verified: { booleanValue: true },
      verifiedAt: { timestampValue: new Date().toISOString() }
    });
  }

  // ---------------------------------------------------------------------------
  // Parsing
  // ---------------------------------------------------------------------------

  /**
   * Parse a Firestore REST document into a plain object
   */
  parseFirestoreDocument(doc) {
    if (!doc || !doc.fields) return null;

    const parsed = {};
    for (const [key, value] of Object.entries(doc.fields)) {
      if (value.stringValue !== undefined) {
        parsed[key] = value.stringValue;
      } else if (value.integerValue !== undefined) {
        parsed[key] = parseInt(value.integerValue);
      } else if (value.doubleValue !== undefined) {
        parsed[key] = parseFloat(value.doubleValue);
      } else if (value.booleanValue !== undefined) {
        parsed[key] = value.booleanValue;
      } else if (value.timestampValue !== undefined) {
        parsed[key] = value.timestampValue;
      } else if (value.arrayValue !== undefined) {
        parsed[key] = value.arrayValue.values?.map(v => v.stringValue || v) || [];
      } else if (value.mapValue !== undefined) {
        parsed[key] = this.parseFirestoreDocument({ fields: value.mapValue.fields });
      }
    }

    return parsed;
  }
}

module.exports = { TelegramStore };
