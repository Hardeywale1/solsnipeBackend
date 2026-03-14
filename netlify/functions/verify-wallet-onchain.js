/**
 * Verify Wallet On-Chain Endpoint
 *
 * Performs lightweight Solana check to confirm a wallet exists by checking
 * account info only (no transaction-history calls).
 */

const { createRPCInstance } = require('./utils/solanaRPC');

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
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
    const body = JSON.parse(event.body || '{}');
    const { walletAddress } = body;

    if (!walletAddress || typeof walletAddress !== 'string') {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'walletAddress is required' })
      };
    }

    const rpc = createRPCInstance();
    const accountInfo = await rpc.getAccountInfo(walletAddress);
    const existsOnChain = Boolean(accountInfo.exists);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        walletAddress,
        existsOnChain,
        accountInfo,
        checkedAt: new Date().toISOString()
      })
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Failed to verify wallet on-chain',
        message: error.message
      })
    };
  }
};
