/**
 * Solana RPC Integration
 * 
 * Fetches real-time blockchain data from Solana network
 * Supports balance queries, transaction history, and token accounts
 */

const { Connection, PublicKey, LAMPORTS_PER_SOL } = require('@solana/web3.js');

/**
 * Solana network endpoints
 */
const NETWORKS = {
  MAINNET: 'https://api.mainnet-beta.solana.com',
  DEVNET: 'https://api.devnet.solana.com',
  TESTNET: 'https://api.testnet.solana.com',
  // For production, consider using QuickNode, Alchemy, or Helius for better reliability
  QUICKNODE: process.env.QUICKNODE_RPC_URL || '',
  HELIUS: process.env.HELIUS_RPC_URL || '',
};

class SolanaRPC {
  constructor(network = 'DEVNET') {
    // Use custom RPC if provided, otherwise use public endpoints
    const endpoint = NETWORKS[network] || NETWORKS.DEVNET;
    this.connection = new Connection(endpoint, 'confirmed');
    this.network = network;
  }

  /**
   * Get SOL balance for a wallet address
   * @param {string} walletAddress - Base58 encoded wallet address
   * @returns {object} Balance information
   */
  async getBalance(walletAddress) {
    try {
      const publicKey = new PublicKey(walletAddress);
      const balance = await this.connection.getBalance(publicKey);

      return {
        walletAddress,
        balance: balance / LAMPORTS_PER_SOL, // Convert lamports to SOL
        balanceLamports: balance,
        network: this.network,
        currency: 'SOL',
        fetchedAt: new Date().toISOString()
      };
    } catch (error) {
      throw new Error(`Failed to fetch balance: ${error.message}`);
    }
  }

  /**
   * Get transaction history for a wallet
   * @param {string} walletAddress - Base58 encoded wallet address
   * @param {number} limit - Number of transactions to fetch (default 10)
   * @returns {array} Transaction history
   */
  async getTransactionHistory(walletAddress, limit = 10) {
    try {
      const publicKey = new PublicKey(walletAddress);
      
      // Get confirmed signatures
      const signatures = await this.connection.getSignaturesForAddress(
        publicKey,
        { limit }
      );

      // Fetch full transaction details
      const transactions = [];
      for (const sig of signatures) {
        const tx = await this.connection.getTransaction(sig.signature, {
          maxSupportedTransactionVersion: 0
        });

        if (tx) {
          transactions.push({
            signature: sig.signature,
            blockTime: sig.blockTime ? new Date(sig.blockTime * 1000).toISOString() : null,
            slot: sig.slot,
            err: sig.err,
            fee: tx.meta?.fee ? tx.meta.fee / LAMPORTS_PER_SOL : 0,
            status: sig.err ? 'failed' : 'success',
            confirmationStatus: sig.confirmationStatus
          });
        }
      }

      return {
        walletAddress,
        transactions,
        count: transactions.length,
        network: this.network,
        fetchedAt: new Date().toISOString()
      };
    } catch (error) {
      throw new Error(`Failed to fetch transaction history: ${error.message}`);
    }
  }

  /**
   * Get account info for a wallet
   * @param {string} walletAddress - Base58 encoded wallet address
   * @returns {object} Account information
   */
  async getAccountInfo(walletAddress) {
    try {
      const publicKey = new PublicKey(walletAddress);
      const accountInfo = await this.connection.getAccountInfo(publicKey);

      if (!accountInfo) {
        return {
          walletAddress,
          exists: false,
          balance: 0,
          network: this.network,
          fetchedAt: new Date().toISOString()
        };
      }

      return {
        walletAddress,
        exists: true,
        balance: accountInfo.lamports / LAMPORTS_PER_SOL,
        balanceLamports: accountInfo.lamports,
        owner: accountInfo.owner.toBase58(),
        executable: accountInfo.executable,
        rentEpoch: accountInfo.rentEpoch,
        network: this.network,
        fetchedAt: new Date().toISOString()
      };
    } catch (error) {
      throw new Error(`Failed to fetch account info: ${error.message}`);
    }
  }

  /**
   * Get comprehensive wallet data (balance + recent transactions)
   * @param {string} walletAddress - Base58 encoded wallet address
   * @param {number} txLimit - Number of transactions to fetch
   * @returns {object} Complete wallet information
   */
  async getWalletData(walletAddress, txLimit = 5) {
    try {
      // Fetch balance and transaction history in parallel
      const [balanceData, txHistory] = await Promise.all([
        this.getBalance(walletAddress),
        this.getTransactionHistory(walletAddress, txLimit)
      ]);

      return {
        walletAddress,
        balance: balanceData.balance,
        balanceLamports: balanceData.balanceLamports,
        currency: 'SOL',
        recentTransactions: txHistory.transactions,
        transactionCount: txHistory.count,
        network: this.network,
        fetchedAt: new Date().toISOString()
      };
    } catch (error) {
      throw new Error(`Failed to fetch wallet data: ${error.message}`);
    }
  }

  /**
   * Verify if a wallet address is valid
   * @param {string} walletAddress - Base58 encoded wallet address
   * @returns {boolean} True if valid
   */
  static isValidAddress(walletAddress) {
    try {
      new PublicKey(walletAddress);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get current network status
   * @returns {object} Network health info
   */
  async getNetworkStatus() {
    try {
      const version = await this.connection.getVersion();
      const slot = await this.connection.getSlot();
      const blockHeight = await this.connection.getBlockHeight();

      return {
        network: this.network,
        version: version['solana-core'],
        currentSlot: slot,
        blockHeight,
        healthy: true,
        checkedAt: new Date().toISOString()
      };
    } catch (error) {
      return {
        network: this.network,
        healthy: false,
        error: error.message,
        checkedAt: new Date().toISOString()
      };
    }
  }
}

/**
 * Create RPC instance based on environment
 */
function createRPCInstance() {
  const network = process.env.SOLANA_NETWORK || 'DEVNET';
  return new SolanaRPC(network);
}

module.exports = {
  SolanaRPC,
  NETWORKS,
  createRPCInstance
};
