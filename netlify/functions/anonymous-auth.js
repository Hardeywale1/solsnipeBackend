const {
  generateToken,
  generateRefreshToken,
  validateWalletAddress
} = require('./utils/auth');
const {
  successResponse,
  errorResponse,
  handleOptions,
  parseBody
} = require('./utils/response');
const sessionStore = require('./utils/sessionStore');

/**
 * Wallet-Based Authentication Function
 * Creates/authenticates a user based on their wallet address
 * 
 * Endpoint: POST /api/anonymous-auth
 * 
 * Request body:
 * {
 *   "walletAddress": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
 *   "chain": "ethereum", // optional: ethereum, solana, polygon, etc.
 *   "metadata": { "key": "value" } // optional
 * }
 * 
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "walletAddress": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
 *     "token": "jwt-token",
 *     "refreshToken": "refresh-jwt-token",
 *     "balance": 0,
 *     "isNewUser": true,
 *     "expiresIn": "30d"
 *   }
 * }
 */
exports.handler = async (event, context) => {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return handleOptions();
  }

  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return errorResponse('Method not allowed. Use POST.', 405);
  }

  try {
    // Parse request body
    const body = parseBody(event.body);
    const { walletAddress, chain = 'ethereum', metadata = {} } = body;

    // Validate wallet address
    if (!walletAddress) {
      return errorResponse('Wallet address is required', 400);
    }

    // Normalize wallet address (lowercase for consistency)
    const normalizedWallet = walletAddress.toLowerCase().trim();

    // Validate wallet format (basic validation)
    if (!validateWalletAddress(normalizedWallet, chain)) {
      return errorResponse('Invalid wallet address format', 400);
    }

    // Check if user already exists
    const existingSession = sessionStore.getSession(normalizedWallet);
    const isNewUser = !existingSession;

    // Prepare token data
    const tokenData = {
      walletAddress: normalizedWallet,
      chain
    };

    // Generate JWT token
    const token = generateToken(normalizedWallet, tokenData);

    // Generate refresh token
    const refreshToken = generateRefreshToken(normalizedWallet);

    // Create or update session in store
    const sessionData = {
      walletAddress: normalizedWallet,
      chain,
      metadata,
      balance: existingSession?.balance || 0,
      transactions: existingSession?.transactions || [],
      isWalletAuth: true
    };
    
    if (isNewUser) {
      sessionStore.createSession(normalizedWallet, sessionData);
    } else {
      sessionStore.updateSession(normalizedWallet, sessionData);
    }

    // Prepare response
    const responseData = {
      walletAddress: normalizedWallet,
      token,
      refreshToken,
      balance: sessionData.balance,
      chain,
      isNewUser,
      expiresIn: '30 days',
      createdAt: isNewUser ? new Date().toISOString() : existingSession.createdAt,
      lastLoginAt: new Date().toISOString()
    };

    return successResponse(responseData, isNewUser ? 201 : 200);

  } catch (error) {
    console.error('Wallet authentication error:', error);
    return errorResponse('Failed to authenticate wallet', 500);
  }
};
