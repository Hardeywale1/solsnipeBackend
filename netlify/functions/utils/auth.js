const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');

// Secret key for JWT signing (should be loaded from environment variables)
const getJwtSecret = () => {
  return process.env.JWT_SECRET || 'your-super-secret-key-change-in-production';
};

/**
 * Generate a unique user ID
 * @returns {string} A unique UUID v4
 */
const generateUserId = () => {
  return uuidv4();
};

/**
 * Generate a JWT token for anonymous authentication
 * @param {string} userId - The unique user ID
 * @param {object} additionalData - Additional data to include in the token
 * @returns {string} JWT token
 */
const generateToken = (userId, additionalData = {}) => {
  const secret = getJwtSecret();
  const timestamp = Date.now();
  
  const payload = {
    userId,
    type: 'anonymous',
    createdAt: timestamp,
    ...additionalData
  };

  // Token expires in 30 days by default
  const expiresIn = additionalData.expiresIn || '30d';
  
  return jwt.sign(payload, secret, { expiresIn });
};

/**
 * Verify and decode a JWT token
 * @param {string} token - The JWT token to verify
 * @returns {object} Decoded token payload or null if invalid
 */
const verifyToken = (token) => {
  try {
    const secret = getJwtSecret();
    const decoded = jwt.verify(token, secret);
    return decoded;
  } catch (error) {
    console.error('Token verification failed:', error.message);
    return null;
  }
};

/**
 * Generate a refresh token
 * @param {string} userId - The unique user ID
 * @returns {string} Refresh token (valid for 90 days)
 */
const generateRefreshToken = (userId) => {
  const secret = getJwtSecret();
  
  const payload = {
    userId,
    type: 'refresh',
    createdAt: Date.now()
  };

  return jwt.sign(payload, secret, { expiresIn: '90d' });
};

/**
 * Extract token from Authorization header
 * @param {object} headers - HTTP headers object
 * @returns {string|null} Extracted token or null
 */
const extractTokenFromHeader = (headers) => {
  const authHeader = headers.authorization || headers.Authorization;
  
  if (!authHeader) {
    return null;
  }

  // Support both "Bearer token" and just "token"
  if (authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  
  return authHeader;
};

/**
 * Generate a short anonymous user name
 * @returns {string} Anonymous user name
 */
const generateAnonymousName = () => {
  const adjectives = ['Swift', 'Brave', 'Wise', 'Silent', 'Quick', 'Bold', 'Clever', 'Bright'];
  const nouns = ['Fox', 'Eagle', 'Wolf', 'Tiger', 'Hawk', 'Lion', 'Bear', 'Dragon'];
  
  const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  const number = Math.floor(Math.random() * 9999);
  
  return `${adjective}${noun}${number}`;
};

/**
 * Validate wallet address format
 * @param {string} walletAddress - The wallet address to validate
 * @param {string} chain - The blockchain (ethereum, solana, polygon, etc.)
 * @returns {boolean} Whether the wallet address is valid
 */
const validateWalletAddress = (walletAddress, chain = 'ethereum') => {
  if (!walletAddress || typeof walletAddress !== 'string') {
    return false;
  }

  const trimmedAddress = walletAddress.trim();

  // Ethereum-like chains (Ethereum, Polygon, BSC, etc.)
  if (['ethereum', 'polygon', 'bsc', 'avalanche', 'arbitrum', 'optimism'].includes(chain.toLowerCase())) {
    // EVM addresses: 0x followed by 40 hexadecimal characters
    const evmRegex = /^0x[a-fA-F0-9]{40}$/;
    return evmRegex.test(trimmedAddress);
  }

  // Solana addresses
  if (chain.toLowerCase() === 'solana') {
    // Solana addresses: base58 encoded, 32-44 characters
    const solanaRegex = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;
    return solanaRegex.test(trimmedAddress);
  }

  // Bitcoin addresses
  if (chain.toLowerCase() === 'bitcoin') {
    // Bitcoin addresses start with 1, 3, or bc1
    const bitcoinRegex = /^(1|3|bc1)[a-zA-HJ-NP-Z0-9]{25,62}$/;
    return bitcoinRegex.test(trimmedAddress);
  }

  // Default: accept any non-empty string (for custom chains)
  return trimmedAddress.length > 0;
};

/**
 * Generate an admin JWT token
 * @param {string} adminEmail - Admin email
 * @param {object} additionalData - Additional data to include
 * @returns {string} Admin JWT token
 */
const generateAdminToken = (adminEmail, additionalData = {}) => {
  const secret = getJwtSecret();
  const timestamp = Date.now();
  
  const payload = {
    email: adminEmail,
    type: 'admin',
    role: 'super_admin',
    createdAt: timestamp,
    ...additionalData
  };

  // Admin tokens expire in 24 hours by default
  const expiresIn = additionalData.expiresIn || '24h';
  
  return jwt.sign(payload, secret, { expiresIn });
};

/**
 * Verify if a token belongs to an admin
 * @param {string} token - The JWT token to verify
 * @returns {object|null} Decoded admin token or null if not admin
 */
const verifyAdminToken = (token) => {
  const decoded = verifyToken(token);
  
  if (!decoded) {
    return null;
  }

  // Check if token is admin type
  if (decoded.type !== 'admin' || decoded.role !== 'super_admin') {
    return null;
  }

  return decoded;
};

/**
 * Validate admin credentials
 * @param {string} email - Admin email
 * @param {string} password - Admin password
 * @returns {boolean} Whether credentials are valid
 */
const validateAdminCredentials = (email, password) => {
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@solsnipe.com';
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
  
  return email === adminEmail && password === adminPassword;
};

/**
 * Verify super admin API key
 * @param {string} apiKey - The API key to verify
 * @returns {boolean} Whether API key is valid
 */
const verifySuperAdminApiKey = (apiKey) => {
  const superAdminKey = process.env.SUPER_ADMIN_API_KEY;
  
  if (!superAdminKey) {
    return false;
  }
  
  return apiKey === superAdminKey;
};

module.exports = {
  generateUserId,
  generateToken,
  verifyToken,
  generateRefreshToken,
  extractTokenFromHeader,
  generateAnonymousName,
  validateWalletAddress,
  generateAdminToken,
  verifyAdminToken,
  validateAdminCredentials,
  verifySuperAdminApiKey,
  getJwtSecret
};
