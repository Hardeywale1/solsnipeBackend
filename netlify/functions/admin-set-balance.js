/**
 * Admin Set Balance Endpoint
 * 
 * Allows super admin to set wallet balance directly
 * Requires admin JWT token
 */

const jwt = require('jsonwebtoken');
const { FirebaseWalletStore } = require('./utils/firebaseWalletStore');

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this';

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
    // Extract admin token
    const authHeader = event.headers.authorization || event.headers.Authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: 'Admin authorization required' })
      };
    }

    const token = authHeader.substring(7);

    // Verify admin token
    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
      
      if (decoded.role !== 'super_admin') {
        return {
          statusCode: 403,
          headers,
          body: JSON.stringify({ error: 'Admin access required' })
        };
      }
    } catch (error) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: 'Invalid or expired admin token' })
      };
    }

    // Parse request body
    const body = JSON.parse(event.body);
    const { walletAddress, balance } = body;

    // Validate input
    if (!walletAddress) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'walletAddress is required' })
      };
    }

    if (typeof balance !== 'number' || balance < 0) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Valid balance (>= 0) is required' })
      };
    }

    // Update balance in Firebase
    const walletStore = new FirebaseWalletStore();
    await walletStore.updateBalanceByAddress(
      walletAddress,
      balance,
      decoded.adminId,
      'set-balance'
    );

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: 'Balance set successfully',
        walletAddress,
        newBalance: balance,
        operation: 'set-balance',
        performedBy: decoded.adminId,
        timestamp: new Date().toISOString()
      })
    };
  } catch (error) {
    console.error('Set balance error:', error);

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
