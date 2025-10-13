/**
 * Get Wallet Balance Endpoint
 * 
 * Fetches current Solana balance for authenticated wallet
 * Requires JWT token from wallet-connect
 */

const jwt = require('jsonwebtoken');
const { createRPCInstance } = require('./utils/solanaRPC');
const { FirebaseWalletStore } = require('./utils/firebaseWalletStore');

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this';

exports.handler = async (event) => {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Content-Type': 'application/json'
  };

  // Handle preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  // Only accept GET
  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    // Extract token from Authorization header
    const authHeader = event.headers.authorization || event.headers.Authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: 'Authorization token required' })
      };
    }

    const token = authHeader.substring(7);

    // Verify JWT token
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

    const { walletId, walletAddress } = decoded;

    // Fetch balance from Solana blockchain
    const rpc = createRPCInstance();
    const balanceData = await rpc.getBalance(walletAddress);

    // Update Firebase with latest balance
    const walletStore = new FirebaseWalletStore();
    await walletStore.updateWalletBalance(walletId, balanceData.balance);

    // Get wallet details from Firebase
    const wallet = await walletStore.getWalletById(walletId);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        wallet: {
          walletId,
          walletAddress,
          balance: balanceData.balance,
          balanceLamports: balanceData.balanceLamports,
          currency: 'SOL',
          network: balanceData.network,
          walletType: wallet?.walletType,
          lastUpdated: balanceData.fetchedAt
        }
      })
    };
  } catch (error) {
    console.error('Get balance error:', error);

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
