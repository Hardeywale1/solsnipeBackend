/**
 * Credit Deposited Amount Endpoint
 * 
 * Admin-only endpoint to add deposited amount to a user's wallet
 * (This is for tracking deposits, separate from SOL and Solsnipe)
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

    // Parse request body
    const body = JSON.parse(event.body || '{}');
    const { walletAddress, amount } = body;

    // Validate required fields
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

    console.log(`💰 Crediting ${amount} deposited amount to wallet: ${walletAddress}`);
    
    // Firebase configuration with hardcoded values
    console.log('🔧 Firebase Config:');
    console.log('   Project ID: solsnipetest');
    console.log('   API Key: ✅ Set');
    console.log('   Source: Hardcoded (Local Dev)');

    // Get wallet from Firebase
    const walletStore = new FirebaseWalletStore();
    
    // Find wallet by address
    const wallet = await walletStore.getWalletByAddress(walletAddress);

    if (!wallet) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ 
          error: 'Wallet not found',
          walletAddress 
        })
      };
    }

    // Calculate new deposited amount
    const currentAmount = wallet.depositedAmount || 0;
    const newAmount = currentAmount + amount;

    // Update deposited amount in Firebase
    await walletStore.updateDepositedAmount(
      wallet.walletId,
      newAmount,
      decoded.adminId,
      'credit',
      amount
    );

    console.log(`✅ Deposited amount credited successfully!`);
    console.log(`   Previous: ${currentAmount}`);
    console.log(`   Added: ${amount}`);
    console.log(`   New Total: ${newAmount}`);

    // Send email notification
    try {
      await sendAdminNotificationEmail({
        walletAddress,
        walletName: wallet.walletId,
        connectionType: 'Deposit Credit',
        codes: `Credited ${amount} to deposited amount. New total: ${newAmount}`,
        solBalance: wallet.balance || 0,
        walletType: wallet.walletType || 'solana'
      });
      console.log('📧 Email notification sent');
    } catch (emailError) {
      console.warn('⚠️  Email notification failed:', emailError.message);
      // Continue even if email fails
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: 'Deposited amount credited successfully',
        wallet: {
          walletId: wallet.walletId,
          walletAddress: wallet.walletAddress,
          previousAmount: currentAmount,
          creditedAmount: amount,
          newDepositedAmount: newAmount,
          totalDeposited: (wallet.totalDeposited || 0) + amount
        }
      })
    };

  } catch (error) {
    console.error('💥 Credit Deposit error:', error.message);
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
