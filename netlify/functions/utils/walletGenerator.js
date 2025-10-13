/**
 * Wallet Generation Service
 * 
 * Generates deterministic wallet addresses from seed phrases/passphrases
 * Supports Solana wallets with BIP39 seed phrase derivation
 */

const bip39 = require('bip39');
const { derivePath } = require('ed25519-hd-key');
const { Keypair } = require('@solana/web3.js');
const nacl = require('tweetnacl');
const bs58 = require('bs58');
const crypto = require('crypto');

/**
 * Wallet types supported
 */
const WALLET_TYPES = {
  SOLFLARE: 'solflare',
  PHANTOM: 'phantom',
  BACKPACK: 'backpack',
  WALLET_CONNECT: 'walletconnect',
  LEDGER: 'ledger',
  OTHER: 'other'
};

/**
 * Input types for wallet generation
 */
const INPUT_TYPES = {
  SEED_PHRASE: 'seed_phrase',    // 12 or 24 words
  PASSPHRASE: 'passphrase'        // Custom passphrase/password
};

/**
 * Generate a deterministic Solana wallet from seed phrase or passphrase
 */
class WalletGenerator {
  
  /**
   * Generate wallet from seed phrase (12 or 24 words)
   * @param {string} seedPhrase - BIP39 seed phrase
   * @param {number} accountIndex - Derivation index (default 0)
   * @returns {object} Wallet info with address and unique ID
   */
  static generateFromSeedPhrase(seedPhrase, accountIndex = 0) {
    try {
      // Validate seed phrase
      const normalizedSeed = seedPhrase.trim().toLowerCase();
      
      if (!bip39.validateMnemonic(normalizedSeed)) {
        throw new Error('Invalid seed phrase. Must be 12 or 24 words.');
      }

      // Generate seed buffer from mnemonic
      const seed = bip39.mnemonicToSeedSync(normalizedSeed);

      // Derive Solana keypair using BIP44 path
      // m/44'/501'/0'/0' (501 is Solana's coin type)
      const derivationPath = `m/44'/501'/${accountIndex}'/0'`;
      const derivedSeed = derivePath(derivationPath, seed.toString('hex')).key;

      // Create Solana keypair
      const keypair = Keypair.fromSeed(derivedSeed);

      // Get public key (wallet address)
      const walletAddress = keypair.publicKey.toBase58();

      // Generate unique wallet ID (hash of seed + index)
      const walletId = this.generateWalletId(normalizedSeed, accountIndex);

      // Generate secure lookup hash (for database queries, don't store seed)
      const lookupHash = this.generateLookupHash(normalizedSeed);

      return {
        walletAddress,
        walletId,
        lookupHash,
        derivationPath,
        accountIndex,
        publicKey: walletAddress,
        // Note: Never return or store the private key or seed phrase!
      };
    } catch (error) {
      throw new Error(`Seed phrase generation failed: ${error.message}`);
    }
  }

  /**
   * Generate wallet from custom passphrase (not BIP39)
   * @param {string} passphrase - User's custom passphrase
   * @param {number} accountIndex - Derivation index (default 0)
   * @returns {object} Wallet info with address and unique ID
   */
  static generateFromPassphrase(passphrase, accountIndex = 0) {
    try {
      if (!passphrase || passphrase.length < 8) {
        throw new Error('Passphrase must be at least 8 characters');
      }

      // Create deterministic seed from passphrase using PBKDF2
      const salt = `solana-wallet-${accountIndex}`;
      const iterations = 100000;
      const keylen = 32; // 32 bytes for ed25519
      
      const seed = crypto.pbkdf2Sync(
        passphrase,
        salt,
        iterations,
        keylen,
        'sha512'
      );

      // Create Solana keypair from derived seed
      const keypair = Keypair.fromSeed(seed);

      // Get public key (wallet address)
      const walletAddress = keypair.publicKey.toBase58();

      // Generate unique wallet ID
      const walletId = this.generateWalletId(passphrase, accountIndex);

      // Generate secure lookup hash
      const lookupHash = this.generateLookupHash(passphrase);

      return {
        walletAddress,
        walletId,
        lookupHash,
        derivationPath: 'custom-passphrase',
        accountIndex,
        publicKey: walletAddress,
      };
    } catch (error) {
      throw new Error(`Passphrase generation failed: ${error.message}`);
    }
  }

  /**
   * Generate a unique wallet ID (UUID-like)
   * Based on hash of seed/passphrase + index
   */
  static generateWalletId(input, accountIndex = 0) {
    const hash = crypto
      .createHash('sha256')
      .update(`${input}-${accountIndex}-wallet-id`)
      .digest('hex');
    
    // Format as UUID-like string
    return `${hash.substring(0, 8)}-${hash.substring(8, 12)}-${hash.substring(12, 16)}-${hash.substring(16, 20)}-${hash.substring(20, 32)}`;
  }

  /**
   * Generate secure lookup hash for database queries
   * IMPORTANT: Never store the actual seed phrase or passphrase
   */
  static generateLookupHash(input) {
    return crypto
      .createHash('sha256')
      .update(input.trim().toLowerCase())
      .digest('hex');
  }

  /**
   * Validate seed phrase word count
   */
  static validateSeedPhraseWordCount(seedPhrase) {
    const words = seedPhrase.trim().split(/\s+/);
    return words.length === 12 || words.length === 24;
  }

  /**
   * Validate input type
   */
  static validateInputType(inputType) {
    return Object.values(INPUT_TYPES).includes(inputType);
  }

  /**
   * Validate wallet type - Accept any non-empty string
   */
  static validateWalletType(walletType) {
    // Accept any non-empty string as wallet type for flexibility
    return typeof walletType === 'string' && walletType.trim().length > 0;
  }

  /**
   * Main wallet generation function
   * Routes to appropriate generator based on input type
   */
  static generateWallet({
    inputType,
    input,
    walletType = WALLET_TYPES.OTHER,
    accountIndex = 0
  }) {
    // Validate inputs
    if (!this.validateInputType(inputType)) {
      throw new Error(`Invalid input type. Must be one of: ${Object.values(INPUT_TYPES).join(', ')}`);
    }

    if (!this.validateWalletType(walletType)) {
      throw new Error('Invalid wallet type. Must be a non-empty string');
    }

    if (!input || typeof input !== 'string') {
      throw new Error('Input (seed phrase or passphrase) is required');
    }

    // Generate wallet based on input type
    let walletInfo;
    
    if (inputType === INPUT_TYPES.SEED_PHRASE) {
      // Validate word count for seed phrases
      if (!this.validateSeedPhraseWordCount(input)) {
        throw new Error('Seed phrase must be 12 or 24 words');
      }
      walletInfo = this.generateFromSeedPhrase(input, accountIndex);
    } else if (inputType === INPUT_TYPES.PASSPHRASE) {
      walletInfo = this.generateFromPassphrase(input, accountIndex);
    }

    // Add metadata
    return {
      ...walletInfo,
      walletType,
      inputType,
      blockchain: 'solana',
      createdAt: new Date().toISOString()
    };
  }

  /**
   * Re-derive wallet address from input (for authentication)
   * Used to verify user without storing seed
   */
  static reDeriveWallet(inputType, input, accountIndex = 0) {
    if (inputType === INPUT_TYPES.SEED_PHRASE) {
      return this.generateFromSeedPhrase(input, accountIndex);
    } else if (inputType === INPUT_TYPES.PASSPHRASE) {
      return this.generateFromPassphrase(input, accountIndex);
    }
    throw new Error('Invalid input type');
  }
}

module.exports = {
  WalletGenerator,
  WALLET_TYPES,
  INPUT_TYPES
};
