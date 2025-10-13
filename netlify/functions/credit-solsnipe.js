/**
 * Credit Solsnipe Balance Endpoint
 * 
 * Admin-only endpoint to add Solsnipe credits to a user's wallet
 * (This is for platform credits, not SOL cryptocurrency)
 * 
 * Required: Admin JWT token
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
    // Verify admin JWT token
    const authHeader = event.headers.authorization || event.headers.Authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: 'Missing authorization token' })
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
        body: JSON.stringify({ error: 'Invalid or expired token' })
      };
    }

    // Verify admin role
    if (!decoded.isAdmin) {
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

    console.log(`💰 Crediting ${amount} Solsnipe to wallet: ${walletAddress}`);

    // Get wallet from Firebase
    const walletStore = new FirebaseWalletStore();
    const wallet = await walletStore.getWalletByAddress(walletAddress);

    if (!wallet) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: 'Wallet not found' })
      };
    }

    const previousBalance = wallet.solsnipeBalance || 0;
    const newBalance = previousBalance + amount;

    console.log(`   Previous Solsnipe balance: ${previousBalance}`);
    console.log(`   Credit amount: ${amount}`);
    console.log(`   New Solsnipe balance: ${newBalance}`);

    // Update Solsnipe balance
    await walletStore.updateSolsnipeBalance(
      wallet.walletId,
      newBalance,
      decoded.adminId,
      'credit',
      amount
    );

    // Send email notification (async, don't wait)
    sendAdminNotificationEmail(ADMIN_EMAIL, {
      walletAddress,
      operation: 'Credit Solsnipe Balance',
      operationId: `solsnipe-credit-${Date.now()}`,
      amount: `${amount} credits (Total: ${newBalance})`
    }).catch(err => console.error('Email notification failed:', err.message));

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: 'Solsnipe balance credited successfully',
        walletAddress,
        previousBalance,
        creditAmount: amount,
        newBalance,
        creditedBy: decoded.adminId,
        timestamp: new Date().toISOString()
      })
    };

  } catch (error) {
    console.error('💥 Credit Solsnipe error:', error.message);
    
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
