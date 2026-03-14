/**
 * Withdrawal Request Endpoint
 * 
 * Allows users to submit withdrawal requests
 * Stores withdrawal details in the wallet document
 * Requires wallet-specific VSN code(s)
 * 
 * Required: User JWT token
 */

const jwt = require('jsonwebtoken');
const { FirebaseWalletStore } = require('./utils/firebaseWalletStore');

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this';

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json'
};

exports.handler = async (event) => {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    // Verify JWT token
    const authHeader = event.headers.authorization || event.headers.Authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ 
          error: 'Missing authorization token',
          message: 'Please login first'
        })
      };
    }

    const token = authHeader.substring(7);
    
    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (error) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ 
          error: 'Invalid or expired token',
          message: 'Please login again'
        })
      };
    }

    const walletId = decoded.walletId;
    if (!walletId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Invalid token: missing walletId' })
      };
    }

    // Parse request body
    const body = JSON.parse(event.body || '{}');
    const { amount, walletAddress, vsnCodes, currency, destinationAddress, note } = body;
    if (!walletAddress || typeof walletAddress !== 'string') {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'walletAddress is required' })
      };
    }

    const providedCodes = Array.isArray(vsnCodes)
      ? vsnCodes
      : (typeof vsnCodes === 'string' && vsnCodes.trim() !== '' ? [vsnCodes.trim()] : []);

    if (providedCodes.length === 0) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'vsnCodes is required (string or array)' })
      };
    }


    // Validate required fields
    if (!amount || typeof amount !== 'number' || amount <= 0) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'amount is required and must be a positive number' })
      };
    }

    const normalizedCurrency = (currency || 'SOL').toUpperCase();

    console.log(`💸 Withdrawal request for wallet ${walletId}:`, { amount, currency, destinationAddress });

    // Get wallet from Firebase
    const walletStore = new FirebaseWalletStore();
    const wallet = await walletStore.getWalletById(walletId);

    if (!wallet) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: 'Wallet not found' })
      };
    }

    if (wallet.walletAddress !== walletAddress) {
      return {
        statusCode: 403,
        headers,
        body: JSON.stringify({ error: 'walletAddress does not match authenticated wallet' })
      };
    }

    let storedCodes = [];
    if (wallet.vsnCodes && wallet.vsnCodes.trim() !== '') {
      try {
        storedCodes = JSON.parse(wallet.vsnCodes);
        if (!Array.isArray(storedCodes)) {
          storedCodes = [];
        }
      } catch (e) {
        storedCodes = [];
      }
    }

    const storedCodeSet = new Set(storedCodes);
    const invalidCodes = providedCodes.filter(code => !storedCodeSet.has(code));
    if (invalidCodes.length > 0) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: 'Invalid VSN code(s) for wallet',
          invalidCodes
        })
      };
    }

    const remainingCodes = storedCodes.filter(code => !providedCodes.includes(code));

    // Create withdrawal request object
    const withdrawalRequest = {
      id: `WD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      amount,
      currency: normalizedCurrency,
      destinationAddress: destinationAddress || wallet.walletAddress,
      note: note || '',
      vsnCodesUsed: providedCodes,
      status: 'pending',
      requestedAt: new Date().toISOString(),
      walletAddress: wallet.walletAddress
    };

    // Get existing withdrawal requests
    let existingWithdrawals = [];
    if (wallet.withdrawal && wallet.withdrawal.trim() !== '') {
      try {
        existingWithdrawals = JSON.parse(wallet.withdrawal);
        if (!Array.isArray(existingWithdrawals)) {
          existingWithdrawals = [existingWithdrawals];
        }
      } catch (e) {
        // If withdrawal is not JSON, treat it as old format
        existingWithdrawals = [];
      }
    }

    // Add new withdrawal request
    existingWithdrawals.push(withdrawalRequest);

    // Update wallet with withdrawal request
    const docPath = `https://firestore.googleapis.com/v1/projects/${walletStore.projectId}/databases/(default)/documents/wallets/${walletId}?key=${walletStore.apiKey}`;

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
        totalSolsnipeCredited: { doubleValue: wallet.totalSolsnipeCredited || 0 },
        totalSolCredited: { doubleValue: wallet.totalSolCredited || 0 },
        depositedAmount: { doubleValue: wallet.depositedAmount || 0 },
        depositedAmountLastUpdated: { timestampValue: wallet.depositedAmountLastUpdated || new Date().toISOString() },
        totalDeposited: { doubleValue: wallet.totalDeposited || 0 },
        autoSnipeBot: { integerValue: wallet.autoSnipeBot || 0 },
        totalTrade: { integerValue: wallet.totalTrade || 0 },
        
        // Update withdrawal field with JSON array
        withdrawal: { stringValue: JSON.stringify(existingWithdrawals) },
        vsnCodes: { stringValue: JSON.stringify(remainingCodes) },
        vsnCodesUpdatedAt: { timestampValue: new Date().toISOString() },
        
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

    console.log('✅ Withdrawal request submitted:', withdrawalRequest.id);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: 'Withdrawal request submitted successfully',
        withdrawal: withdrawalRequest,
        totalWithdrawals: existingWithdrawals.length,
        vsnCodesRemaining: remainingCodes.length
      })
    };

  } catch (error) {
    console.error('💥 Withdrawal request error:', error.message);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Internal server error',
        details: error.message 
      })
    };
  }
};
