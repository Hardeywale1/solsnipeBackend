/**
 * In-memory store for user sessions
 * In production, replace this with a database (MongoDB, PostgreSQL, etc.)
 */
class SessionStore {
  constructor() {
    this.sessions = new Map();
  }

  /**
   * Create a new session
   * @param {string} userId - User ID
   * @param {object} sessionData - Session data
   */
  createSession(userId, sessionData = {}) {
    const session = {
      userId,
      ...sessionData,
      createdAt: Date.now(),
      lastAccessedAt: Date.now()
    };
    
    this.sessions.set(userId, session);
    return session;
  }

  /**
   * Get a session by user ID
   * @param {string} userId - User ID
   * @returns {object|null} Session data or null
   */
  getSession(userId) {
    const session = this.sessions.get(userId);
    
    if (session) {
      // Update last accessed time
      session.lastAccessedAt = Date.now();
      this.sessions.set(userId, session);
    }
    
    return session || null;
  }

  /**
   * Update session data
   * @param {string} userId - User ID
   * @param {object} updates - Data to update
   */
  updateSession(userId, updates) {
    const session = this.sessions.get(userId);
    
    if (session) {
      const updatedSession = {
        ...session,
        ...updates,
        lastAccessedAt: Date.now()
      };
      this.sessions.set(userId, updatedSession);
      return updatedSession;
    }
    
    return null;
  }

  /**
   * Delete a session
   * @param {string} userId - User ID
   */
  deleteSession(userId) {
    return this.sessions.delete(userId);
  }

  /**
   * Check if a session exists
   * @param {string} userId - User ID
   * @returns {boolean}
   */
  hasSession(userId) {
    return this.sessions.has(userId);
  }

  /**
   * Clean up expired sessions (older than specified time)
   * @param {number} maxAge - Maximum age in milliseconds (default: 30 days)
   */
  cleanupExpiredSessions(maxAge = 30 * 24 * 60 * 60 * 1000) {
    const now = Date.now();
    let cleanedCount = 0;
    
    for (const [userId, session] of this.sessions.entries()) {
      if (now - session.lastAccessedAt > maxAge) {
        this.sessions.delete(userId);
        cleanedCount++;
      }
    }
    
    return cleanedCount;
  }

  /**
   * Get all sessions (for debugging purposes)
   * @returns {Array} Array of all sessions
   */
  getAllSessions() {
    return Array.from(this.sessions.values());
  }

  /**
   * Get session count
   * @returns {number} Number of active sessions
   */
  getSessionCount() {
    return this.sessions.size;
  }
}

// Create a singleton instance
const sessionStore = new SessionStore();

module.exports = sessionStore;
