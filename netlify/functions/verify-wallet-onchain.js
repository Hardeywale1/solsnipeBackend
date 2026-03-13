/**
 * Verify Wallet On-Chain Endpoint
 *
 * Performs lightweight Solana checks to confirm a wallet exists by checking:
 * 1) Account info existence
 * 2) Presence of at least one transaction signature
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
    const { walletAddress, txLimit = 1 } = body;

    if (!walletAddress || typeof walletAddress !== 'string') {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'walletAddress is required' })
      };
    }

    const rpc = createRPCInstance();
    const [accountInfo, txHistory] = await Promise.all([
      rpc.getAccountInfo(walletAddress),
      rpc.getTransactionHistory(walletAddress, txLimit)
    ]);

    const hasTransactions = (txHistory.transactions || []).length > 0;
    const existsOnChain = Boolean(accountInfo.exists || hasTransactions);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        walletAddress,
        existsOnChain,
        hasTransactions,
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
