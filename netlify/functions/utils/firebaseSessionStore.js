/**
 * Firebase Firestore store for user sessions
 * Replaces in-memory storage with persistent Firebase Firestore database
 */

const admin = require('firebase-admin');

// Initialize Firebase Admin (singleton pattern)
let firebaseApp;

function initializeFirebase() {
  if (firebaseApp) {
    return firebaseApp;
  }

  try {
    // Check if Firebase is already initialized
    if (admin.apps.length > 0) {
      firebaseApp = admin.apps[0];
      return firebaseApp;
    }

    // Initialize with service account from environment variable
    const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT 
      ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
      : null;

    if (serviceAccount) {
      // Initialize with service account JSON
      firebaseApp = admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        databaseURL: process.env.FIREBASE_DATABASE_URL
      });
    } else {
      // For development: Initialize with default credentials
      // Make sure to set GOOGLE_APPLICATION_CREDENTIALS env var
      firebaseApp = admin.initializeApp({
        credential: admin.credential.applicationDefault(),
        databaseURL: process.env.FIREBASE_DATABASE_URL
      });
    }

    console.log('Firebase initialized successfully');
    return firebaseApp;
  } catch (error) {
    console.error('Firebase initialization error:', error);
    throw new Error('Failed to initialize Firebase');
  }
}

// Initialize Firebase
initializeFirebase();

// Get Firestore instance
const db = admin.firestore();

// Collection name for sessions
const SESSIONS_COLLECTION = 'wallet_sessions';

/**
 * Firebase-based Session Store
 */
class FirebaseSessionStore {
  constructor() {
    this.collection = db.collection(SESSIONS_COLLECTION);
  }

  /**
   * Create a new session
   * @param {string} walletAddress - Wallet address (used as document ID)
   * @param {object} sessionData - Session data
   */
  async createSession(walletAddress, sessionData = {}) {
    try {
      const session = {
        walletAddress,
        ...sessionData,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        lastAccessedAt: admin.firestore.FieldValue.serverTimestamp()
      };
      
      await this.collection.doc(walletAddress).set(session);
      
      // Return session with current timestamp for immediate use
      return {
        ...session,
        createdAt: Date.now(),
        lastAccessedAt: Date.now()
      };
    } catch (error) {
      console.error('Create session error:', error);
      throw error;
    }
  }

  /**
   * Get a session by wallet address
   * @param {string} walletAddress - Wallet address
   * @returns {object|null} Session data or null
   */
  async getSession(walletAddress) {
    try {
      const doc = await this.collection.doc(walletAddress).get();
      
      if (!doc.exists) {
        return null;
      }

      const session = doc.data();
      
      // Update last accessed time
      await this.collection.doc(walletAddress).update({
        lastAccessedAt: admin.firestore.FieldValue.serverTimestamp()
      });

      // Convert Firestore timestamps to numbers for consistency
      return {
        ...session,
        createdAt: session.createdAt?.toMillis() || Date.now(),
        lastAccessedAt: Date.now()
      };
    } catch (error) {
      console.error('Get session error:', error);
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
        ...updates,
        lastAccessedAt: admin.firestore.FieldValue.serverTimestamp()
      };

      await this.collection.doc(walletAddress).update(updateData);
      
      // Fetch and return updated session
      return await this.getSession(walletAddress);
    } catch (error) {
      console.error('Update session error:', error);
      return null;
    }
  }

  /**
   * Delete a session
   * @param {string} walletAddress - Wallet address
   */
  async deleteSession(walletAddress) {
    try {
      await this.collection.doc(walletAddress).delete();
      return true;
    } catch (error) {
      console.error('Delete session error:', error);
      return false;
    }
  }

  /**
   * Check if a session exists
   * @param {string} walletAddress - Wallet address
   * @returns {boolean}
   */
  async hasSession(walletAddress) {
    try {
      const doc = await this.collection.doc(walletAddress).get();
      return doc.exists;
    } catch (error) {
      console.error('Has session error:', error);
      return false;
    }
  }

  /**
   * Clean up expired sessions (older than specified time)
   * @param {number} maxAge - Maximum age in milliseconds (default: 30 days)
   */
  async cleanupExpiredSessions(maxAge = 30 * 24 * 60 * 60 * 1000) {
    try {
      const cutoffDate = new Date(Date.now() - maxAge);
      
      const snapshot = await this.collection
        .where('lastAccessedAt', '<', admin.firestore.Timestamp.fromDate(cutoffDate))
        .get();

      let cleanedCount = 0;
      const batch = db.batch();

      snapshot.forEach(doc => {
        batch.delete(doc.ref);
        cleanedCount++;
      });

      await batch.commit();
      
      console.log(`Cleaned up ${cleanedCount} expired sessions`);
      return cleanedCount;
    } catch (error) {
      console.error('Cleanup sessions error:', error);
      return 0;
    }
  }

  /**
   * Get all sessions (for admin purposes)
   * @returns {Array} Array of all sessions
   */
  async getAllSessions() {
    try {
      const snapshot = await this.collection.get();
      const sessions = [];
      
      snapshot.forEach(doc => {
        const data = doc.data();
        sessions.push({
          ...data,
          createdAt: data.createdAt?.toMillis() || Date.now(),
          lastAccessedAt: data.lastAccessedAt?.toMillis() || Date.now()
        });
      });
      
      return sessions;
    } catch (error) {
      console.error('Get all sessions error:', error);
      return [];
    }
  }

  /**
   * Get session count
   * @returns {number} Number of active sessions
   */
  async getSessionCount() {
    try {
      const snapshot = await this.collection.count().get();
      return snapshot.data().count;
    } catch (error) {
      console.error('Get session count error:', error);
      return 0;
    }
  }

  /**
   * Add transaction to wallet session
   * @param {string} walletAddress - Wallet address
   * @param {object} transaction - Transaction object
   */
  async addTransaction(walletAddress, transaction) {
    try {
      await this.collection.doc(walletAddress).update({
        transactions: admin.firestore.FieldValue.arrayUnion(transaction),
        lastAccessedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      
      return true;
    } catch (error) {
      console.error('Add transaction error:', error);
      return false;
    }
  }

  /**
   * Get transactions for a wallet
   * @param {string} walletAddress - Wallet address
   * @param {number} limit - Max transactions to return
   * @returns {Array} Array of transactions
   */
  async getTransactions(walletAddress, limit = 50) {
    try {
      const session = await this.getSession(walletAddress);
      if (!session || !session.transactions) {
        return [];
      }

      // Return most recent transactions first
      return session.transactions
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        .slice(0, limit);
    } catch (error) {
      console.error('Get transactions error:', error);
      return [];
    }
  }

  /**
   * Update wallet balance
   * @param {string} walletAddress - Wallet address
   * @param {number} newBalance - New balance amount
   */
  async updateBalance(walletAddress, newBalance) {
    try {
      await this.collection.doc(walletAddress).update({
        balance: newBalance,
        lastAccessedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      
      return true;
    } catch (error) {
      console.error('Update balance error:', error);
      return false;
    }
  }
}

// Create a singleton instance
const firebaseSessionStore = new FirebaseSessionStore();

module.exports = firebaseSessionStore;
