/**
 * Session Store Configuration
 * 
 * This file determines which session store to use:
 * - Firebase API (recommended for production) - Uses API Key
 * - Firebase Admin SDK (alternative) - Uses Service Account
 * - In-Memory (for development/testing only)
 * 
 * Priority:
 * 1. Firebase API Key (FIREBASE_API_KEY) - Simpler setup
 * 2. Firebase Admin SDK (FIREBASE_SERVICE_ACCOUNT) - Advanced features
 * 3. In-Memory (fallback)
 * 
 * IMPORTANT: All methods return Promises to ensure compatibility with both stores
 */

// Check if Firebase should be used
const USE_FIREBASE_API = process.env.FIREBASE_API_KEY && process.env.FIREBASE_PROJECT_ID;
const USE_FIREBASE_ADMIN = process.env.FIREBASE_SERVICE_ACCOUNT !== undefined;
const USE_FIREBASE = process.env.USE_FIREBASE === 'true' || USE_FIREBASE_API || USE_FIREBASE_ADMIN;

let baseStore;

if (USE_FIREBASE_API) {
  console.log('🔥 Using Firebase API Session Store (API Key) - Persistent');
  baseStore = require('./firebaseAPISessionStore');
} else if (USE_FIREBASE_ADMIN) {
  console.log('📦 Using Firebase Admin SDK Session Store (Service Account) - Persistent');
  baseStore = require('./firebaseSessionStore');
} else {
  console.log('⚠️  Using In-Memory Session Store (Data will be lost on restart)');
  const inMemoryStore = require('./sessionStore');
  
  // Wrap in-memory store methods to return Promises for consistency
  baseStore = {
    createSession: (userId, data) => Promise.resolve(inMemoryStore.createSession(userId, data)),
    getSession: (userId) => Promise.resolve(inMemoryStore.getSession(userId)),
    updateSession: (userId, updates) => Promise.resolve(inMemoryStore.updateSession(userId, updates)),
    deleteSession: (userId) => Promise.resolve(inMemoryStore.deleteSession(userId)),
    hasSession: (userId) => Promise.resolve(inMemoryStore.hasSession(userId)),
    cleanupExpiredSessions: (maxAge) => Promise.resolve(inMemoryStore.cleanupExpiredSessions(maxAge)),
    getAllSessions: () => Promise.resolve(inMemoryStore.getAllSessions()),
    getSessionCount: () => Promise.resolve(inMemoryStore.getSessionCount())
  };
}

/**
 * Unified Session Store Interface
 * All methods are async and return Promises
 */
const sessionStore = {
  /**
   * Create a new session
   * @param {string} walletAddress - Wallet address
   * @param {object} sessionData - Session data
   * @returns {Promise<object>} Created session
   */
  async createSession(walletAddress, sessionData = {}) {
    return await baseStore.createSession(walletAddress, sessionData);
  },

  /**
   * Get a session by wallet address
   * @param {string} walletAddress - Wallet address
   * @returns {Promise<object|null>} Session data or null
   */
  async getSession(walletAddress) {
    return await baseStore.getSession(walletAddress);
  },

  /**
   * Update session data
   * @param {string} walletAddress - Wallet address
   * @param {object} updates - Data to update
   * @returns {Promise<object|null>} Updated session or null
   */
  async updateSession(walletAddress, updates) {
    return await baseStore.updateSession(walletAddress, updates);
  },

  /**
   * Delete a session
   * @param {string} walletAddress - Wallet address
   * @returns {Promise<boolean>} Success status
   */
  async deleteSession(walletAddress) {
    return await baseStore.deleteSession(walletAddress);
  },

  /**
   * Check if a session exists
   * @param {string} walletAddress - Wallet address
   * @returns {Promise<boolean>} Exists status
   */
  async hasSession(walletAddress) {
    return await baseStore.hasSession(walletAddress);
  },

  /**
   * Clean up expired sessions
   * @param {number} maxAge - Maximum age in milliseconds
   * @returns {Promise<number>} Number of cleaned sessions
   */
  async cleanupExpiredSessions(maxAge) {
    return await baseStore.cleanupExpiredSessions(maxAge);
  },

  /**
   * Get all sessions
   * @returns {Promise<Array>} Array of sessions
   */
  async getAllSessions() {
    return await baseStore.getAllSessions();
  },

  /**
   * Get session count
   * @returns {Promise<number>} Number of sessions
   */
  async getSessionCount() {
    return await baseStore.getSessionCount();
  },

  /**
   * Get storage type being used
   * @returns {string} 'firebase' or 'memory'
   */
  getStorageType() {
    return USE_FIREBASE ? 'firebase' : 'memory';
  }
};

module.exports = sessionStore;
