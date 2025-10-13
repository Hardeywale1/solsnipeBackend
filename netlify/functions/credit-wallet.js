/**
 * Credit Wallet Endpoint (ADMIN ONLY)
 * 
 * Adds SOL to a wallet balance (admin operation)
 * Requires admin JWT token
 */

const jwt = require('jsonwebtoken');
const { FirebaseWalletStore } = require('./utils/firebaseWalletStore');
const { sendAdminNotificationEmail } = require('./utils/loopsEmail');

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@solsnipeai.xyz';

exports.handler = async (event) => {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  // Handle preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  // Only accept POST
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    // Extract and verify admin token
    const authHeader = event.headers.authorization || event.headers.Authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: 'Admin authorization required' })
      };
    }

    const token = authHeader.substring(7);

    // Verify admin JWT
    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (error) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: 'Invalid or expired admin token' })
      };
    }

    // Check if token is admin type
    if (decoded.type !== 'admin') {
      return {
        statusCode: 403,
        headers,
        body: JSON.stringify({ error: 'Admin access required' })
      };
    }

    // Parse request body
    const body = JSON.parse(event.body);
    const { walletAddress, amount } = body;

    // Validate inputs
    if (!walletAddress) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'walletAddress is required' })
      };
    }

    if (typeof amount !== 'number' || amount <= 0) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'amount must be a positive number' })
      };
    }

    // Get wallet from Firebase
    const walletStore = new FirebaseWalletStore();
    
    // Use hardcoded values with environment variable fallback
    const FIREBASE_PROJECT_ID = process.env.FIREBASE_PROJECT_ID || 'solsnipetest';
    const FIREBASE_API_KEY = process.env.FIREBASE_API_KEY || 'AIzaSyDCNm_YPQen7StRUm1rZUX2L0ni_INkKk8';
    
    // Query by wallet address to find the wallet
    const queryUrl = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents:runQuery?key=${FIREBASE_API_KEY}`;
    
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
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: 'Wallet not found' })
      };
    }

    const wallet = walletStore.parseFirestoreDocument(results[0].document);
    const previousBalance = wallet.balance || 0;
    const newBalance = previousBalance + amount;

    // Update wallet balance
    await walletStore.updateBalanceByAddress(
      walletAddress,
      newBalance,
      decoded.adminId,
      'credit',
      amount // Pass credit amount to track totalSolCredited
    );

    // Send email notification (async, don't wait)
    sendAdminNotificationEmail(ADMIN_EMAIL, {
      walletAddress,
      operation: 'Credit Wallet',
      operationId: `credit-${Date.now()}`,
      amount: newBalance
    }).catch(err => console.error('Email notification failed:', err.message));

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: 'Wallet credited successfully',
        walletAddress,
        previousBalance,
        creditAmount: amount,
        newBalance,
        adminId: decoded.adminId,
        timestamp: new Date().toISOString()
      })
    };
  } catch (error) {
    console.error('Credit wallet error:', error);

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Internal server error',
        message: error.message
      })
    };
  }
};
