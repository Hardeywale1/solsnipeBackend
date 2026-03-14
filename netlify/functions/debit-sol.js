/**
 * Debit SOL Endpoint (ADMIN ONLY)
 *
 * Subtracts SOL balance from a wallet.
 */

const jwt = require('jsonwebtoken');
const { FirebaseWalletStore } = require('./utils/firebaseWalletStore');
const { sendAdminNotificationEmail } = require('./utils/loopsEmail');

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@solsnipeai.xyz';

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json'
};

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const authHeader = event.headers.authorization || event.headers.Authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: 'Admin authorization required' })
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
        body: JSON.stringify({ error: 'Invalid or expired admin token' })
      };
    }

    if (decoded.type !== 'admin' && !decoded.isAdmin) {
      return {
        statusCode: 403,
        headers,
        body: JSON.stringify({ error: 'Admin access required' })
      };
    }

    const body = JSON.parse(event.body || '{}');
    const { walletAddress, amount } = body;

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

    const walletStore = new FirebaseWalletStore();
    const wallet = await walletStore.getWalletByAddress(walletAddress);

    if (!wallet) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: 'Wallet not found' })
      };
    }

    const previousBalance = wallet.balance || 0;
    if (amount > previousBalance) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: 'Insufficient SOL balance',
          currentBalance: previousBalance,
          debitAmount: amount
        })
      };
    }

    const newBalance = previousBalance - amount;

    await walletStore.updateBalanceByAddress(
      walletAddress,
      newBalance,
      decoded.adminId || 'admin',
      'debit',
      0
    );

    sendAdminNotificationEmail(ADMIN_EMAIL, {
      walletAddress,
      operation: 'Debit SOL',
      operationId: `debit-sol-${Date.now()}`,
      amount: `${amount} SOL (New: ${newBalance})`
    }).catch(err => console.error('Email notification failed:', err.message));

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: 'SOL debited successfully',
        walletAddress,
        previousBalance,
        debitAmount: amount,
        newBalance,
        adminId: decoded.adminId,
        timestamp: new Date().toISOString()
      })
    };
  } catch (error) {
    console.error('Debit SOL error:', error);

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