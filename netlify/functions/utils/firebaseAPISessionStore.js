/**
 * Firebase Authentication using API Key (Web SDK)
 * This is simpler than Admin SDK - uses Firebase Web API
 */

const axios = require('axios');

// Firebase configuration from environment
const FIREBASE_CONFIG = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN || `${process.env.FIREBASE_PROJECT_ID}.firebaseapp.com`,
  projectId: process.env.FIREBASE_PROJECT_ID,
  databaseURL: process.env.FIREBASE_DATABASE_URL || `https://${process.env.FIREBASE_PROJECT_ID}.firebaseio.com`
};

/**
 * Firebase REST API Session Store
 * Uses Firebase REST API instead of Admin SDK
 */
class FirebaseAPISessionStore {
  constructor() {
    this.apiKey = FIREBASE_CONFIG.apiKey;
    this.projectId = FIREBASE_CONFIG.projectId;
    this.baseURL = `https://firestore.googleapis.com/v1/projects/${this.projectId}/databases/(default)/documents`;
    
    if (!this.apiKey || !this.projectId) {
      throw new Error('Firebase API Key and Project ID are required');
    }
  }

  /**
   * Create a new session
   * @param {string} walletAddress - Wallet address
   * @param {object} sessionData - Session data
   */
  async createSession(walletAddress, sessionData = {}) {
    try {
      const session = {
        walletAddress: { stringValue: walletAddress },
        ...this._convertToFirestoreFormat(sessionData),
        createdAt: { timestampValue: new Date().toISOString() },
        lastAccessedAt: { timestampValue: new Date().toISOString() }
      };

      const response = await axios.patch(
        `${this.baseURL}/wallet_sessions/${walletAddress}?key=${this.apiKey}`,
        { fields: session },
        { headers: { 'Content-Type': 'application/json' } }
      );

      return this._convertFromFirestoreFormat(response.data.fields);
    } catch (error) {
      console.error('Create session error:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Get a session by wallet address
   * @param {string} walletAddress - Wallet address
   */
  async getSession(walletAddress) {
    try {
      const response = await axios.get(
        `${this.baseURL}/wallet_sessions/${walletAddress}?key=${this.apiKey}`
      );

      // Update last accessed time
      await this.updateSession(walletAddress, {
        lastAccessedAt: new Date().toISOString()
      });

      return this._convertFromFirestoreFormat(response.data.fields);
    } catch (error) {
      if (error.response?.status === 404) {
        return null;
      }
      console.error('Get session error:', error.response?.data || error.message);
      return null;
    }
  }

  /**
   * Update session data
   * @param {string} walletAddress - Wallet address
   * @param {object} updates - Data to update
   */
  async updateSession(walletAddress, updates) {
    try {
      const updateData = {
        ...this._convertToFirestoreFormat(updates),
        lastAccessedAt: { timestampValue: new Date().toISOString() }
      };

      const response = await axios.patch(
        `${this.baseURL}/wallet_sessions/${walletAddress}?key=${this.apiKey}&updateMask.fieldPaths=${Object.keys(updates).join('&updateMask.fieldPaths=')}`,
        { fields: updateData },
        { headers: { 'Content-Type': 'application/json' } }
      );

      return this._convertFromFirestoreFormat(response.data.fields);
    } catch (error) {
      console.error('Update session error:', error.response?.data || error.message);
      return null;
    }
  }

  /**
   * Delete a session
   * @param {string} walletAddress - Wallet address
   */
  async deleteSession(walletAddress) {
    try {
      await axios.delete(
        `${this.baseURL}/wallet_sessions/${walletAddress}?key=${this.apiKey}`
      );
      return true;
    } catch (error) {
      console.error('Delete session error:', error.response?.data || error.message);
      return false;
    }
  }

  /**
   * Check if a session exists
   * @param {string} walletAddress - Wallet address
   */
  async hasSession(walletAddress) {
    try {
      await axios.get(
        `${this.baseURL}/wallet_sessions/${walletAddress}?key=${this.apiKey}`
      );
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get all sessions (admin purposes)
   */
  async getAllSessions() {
    try {
      const response = await axios.get(
        `${this.baseURL}/wallet_sessions?key=${this.apiKey}`
      );

      if (!response.data.documents) {
        return [];
      }

      return response.data.documents.map(doc => 
        this._convertFromFirestoreFormat(doc.fields)
      );
    } catch (error) {
      console.error('Get all sessions error:', error.response?.data || error.message);
      return [];
    }
  }

  /**
   * Get session count
   */
  async getSessionCount() {
    try {
      const sessions = await this.getAllSessions();
      return sessions.length;
    } catch (error) {
      return 0;
    }
  }

  /**
   * Clean up expired sessions
   */
  async cleanupExpiredSessions(maxAge = 30 * 24 * 60 * 60 * 1000) {
    try {
      const cutoffDate = new Date(Date.now() - maxAge).toISOString();
      const sessions = await this.getAllSessions();
      
      let cleanedCount = 0;
      for (const session of sessions) {
        if (session.lastAccessedAt < cutoffDate) {
          await this.deleteSession(session.walletAddress);
          cleanedCount++;
        }
      }

      return cleanedCount;
    } catch (error) {
      console.error('Cleanup error:', error);
      return 0;
    }
  }

  /**
   * Convert JavaScript object to Firestore format
   */
  _convertToFirestoreFormat(obj) {
    const result = {};
    
    for (const [key, value] of Object.entries(obj)) {
      if (value === null || value === undefined) continue;

      if (typeof value === 'string') {
        result[key] = { stringValue: value };
      } else if (typeof value === 'number') {
        result[key] = { doubleValue: value };
      } else if (typeof value === 'boolean') {
        result[key] = { booleanValue: value };
      } else if (Array.isArray(value)) {
        result[key] = {
          arrayValue: {
            values: value.map(item => {
              if (typeof item === 'object') {
                return { mapValue: { fields: this._convertToFirestoreFormat(item) } };
              }
              return this._convertToFirestoreFormat({ temp: item }).temp;
            })
          }
        };
      } else if (typeof value === 'object') {
        result[key] = { mapValue: { fields: this._convertToFirestoreFormat(value) } };
      }
    }

    return result;
  }

  /**
   * Convert Firestore format to JavaScript object
   */
  _convertFromFirestoreFormat(fields) {
    const result = {};

    for (const [key, value] of Object.entries(fields)) {
      if (value.stringValue !== undefined) {
        result[key] = value.stringValue;
      } else if (value.doubleValue !== undefined) {
        result[key] = value.doubleValue;
      } else if (value.integerValue !== undefined) {
        result[key] = parseInt(value.integerValue);
      } else if (value.booleanValue !== undefined) {
        result[key] = value.booleanValue;
      } else if (value.timestampValue !== undefined) {
        result[key] = value.timestampValue;
      } else if (value.arrayValue !== undefined) {
        result[key] = (value.arrayValue.values || []).map(item => {
          if (item.mapValue) {
            return this._convertFromFirestoreFormat(item.mapValue.fields);
          }
          return this._convertFromFirestoreFormat({ temp: item }).temp;
        });
      } else if (value.mapValue !== undefined) {
        result[key] = this._convertFromFirestoreFormat(value.mapValue.fields || {});
      }
    }

    return result;
  }
}

// Create singleton instance
const firebaseAPISessionStore = new FirebaseAPISessionStore();

module.exports = firebaseAPISessionStore;
