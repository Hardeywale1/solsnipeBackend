/**
 * Generate VSN Codes Endpoint (ADMIN ONLY)
 *
 * Creates one-time VSN codes for a specific wallet and stores them in Firebase.
 */

const jwt = require('jsonwebtoken');
const { FirebaseWalletStore } = require('./utils/firebaseWalletStore');
const crypto = require('crypto');

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this';

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json'
};

function randomVsnCode() {
  return `VSN-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
}

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

    if (!decoded.isAdmin && decoded.type !== 'admin') {
      return {
        statusCode: 403,
        headers,
        body: JSON.stringify({ error: 'Admin access required' })
      };
    }

    const body = JSON.parse(event.body || '{}');
    const { walletAddress, count = 1 } = body;

    if (!walletAddress || typeof walletAddress !== 'string') {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'walletAddress is required' })
      };
    }

    if (!Number.isInteger(count) || count < 1 || count > 20) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'count must be an integer between 1 and 20' })
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

    let existingCodes = [];
    if (wallet.vsnCodes && wallet.vsnCodes.trim() !== '') {
      try {
        existingCodes = JSON.parse(wallet.vsnCodes);
        if (!Array.isArray(existingCodes)) {
          existingCodes = [];
        }
      } catch (e) {
        existingCodes = [];
      }
    }

    const generatedCodes = [];
    const existingSet = new Set(existingCodes);
    while (generatedCodes.length < count) {
      const candidate = randomVsnCode();
      if (!existingSet.has(candidate)) {
        generatedCodes.push(candidate);
        existingSet.add(candidate);
      }
    }

    const updatedCodes = [...existingCodes, ...generatedCodes];
    await walletStore.updateWalletVsnCodes(wallet.walletId, updatedCodes, decoded.adminId || 'admin');

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: 'VSN code(s) generated successfully',
        walletAddress,
        generatedCount: generatedCodes.length,
        generatedCodes,
        totalCodesForWallet: updatedCodes.length,
        generatedBy: decoded.adminId || 'admin',
        timestamp: new Date().toISOString()
      })
    };
  } catch (error) {
    console.error('Generate VSN code error:', error.message);
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