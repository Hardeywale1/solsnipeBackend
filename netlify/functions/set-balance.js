const {
  verifyToken,
  extractTokenFromHeader
} = require('./utils/auth');
const {
  verifyAdminAuth
} = require('./utils/adminMiddleware');
const {
  successResponse,
  errorResponse,
  handleOptions,
  parseBody
} = require('./utils/response');
const sessionStore = require('./utils/sessionStore');

/**
 * Set Wallet Balance Function (ADMIN ONLY)
 * Directly sets the balance for a wallet (admin operation)
 * 
 * Endpoint: PUT /api/set-balance
 * Headers: Authorization: Bearer <admin-token> OR X-API-Key: <super-admin-key>
 * 
 * Request body:
 * {
 *   "walletAddress": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
 *   "balance": 1000,
 *   "reason": "Admin adjustment" // optional
 * }
 * 
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "walletAddress": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
 *     "previousBalance": 100,
 *     "newBalance": 1000,
 *     "timestamp": "2025-10-11T12:00:00.000Z"
 *   }
 * }
 */
exports.handler = async (event, context) => {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return handleOptions();
  }

  // Only allow PUT requests
  if (event.httpMethod !== 'PUT') {
    return errorResponse('Method not allowed. Use PUT.', 405);
  }

  try {
    // ADMIN AUTHENTICATION REQUIRED
    const adminAuth = verifyAdminAuth(event);
    
    if (!adminAuth || !adminAuth.authenticated) {
      return errorResponse('Unauthorized. Admin access required.', 403);
    }

    // Parse request body
    const body = parseBody(event.body);
    const { walletAddress, balance, reason = 'Balance adjustment' } = body;

    // Validate wallet address
    if (!walletAddress) {
      return errorResponse('Wallet address is required', 400);
    }

    const normalizedWallet = walletAddress.toLowerCase().trim();

    // Validate balance
    if (typeof balance !== 'number' || balance < 0) {
      return errorResponse('Balance must be a non-negative number', 400);
    }

    // Get session from store
    const session = sessionStore.getSession(normalizedWallet);

    if (!session) {
      return errorResponse('Wallet not found. Please ensure the wallet has been authenticated first.', 404);
    }

    // Store previous balance
    const previousBalance = session.balance || 0;

    // Get admin info
    const adminEmail = adminAuth.email || 'API Key Admin';
    const adminMethod = adminAuth.method || 'unknown';

    // Create transaction record
    const transaction = {
      id: require('uuid').v4(),
      type: 'adjustment',
      amount: balance - previousBalance,
      previousBalance,
      newBalance: balance,
      reason,
      adminEmail,
      adminMethod,
      timestamp: new Date().toISOString()
    };

    // Update session with new balance and transaction
    const transactions = session.transactions || [];
    transactions.push(transaction);

    sessionStore.updateSession(normalizedWallet, {
      balance,
      transactions,
      lastAdjustment: {
        by: adminEmail,
        at: transaction.timestamp,
        reason
      }
    });

    // Prepare response
    const responseData = {
      walletAddress: session.walletAddress || normalizedWallet,
      previousBalance,
      newBalance: balance,
      difference: balance - previousBalance,
      reason,
      adjustedBy: adminEmail,
      transactionId: transaction.id,
      timestamp: transaction.timestamp
    };

    return successResponse(responseData);

  } catch (error) {
    console.error('Set balance error:', error);
    return errorResponse('Failed to set balance', 500);
  }
};
