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
 * Debit Wallet Function (ADMIN ONLY)
 * Deducts funds from a wallet balance
 * 
 * Endpoint: POST /api/debit-wallet
 * Headers: Authorization: Bearer <admin-token> OR X-API-Key: <super-admin-key>
 * 
 * Request body:
 * {
 *   "walletAddress": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
 *   "amount": 50,
 *   "reason": "Purchase item", // optional
 *   "metadata": { "itemId": "456" } // optional
 * }
 * 
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "walletAddress": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
 *     "previousBalance": 100,
 *     "amount": 50,
 *     "newBalance": 50,
 *     "transactionId": "uuid",
 *     "timestamp": "2025-10-11T12:00:00.000Z"
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
    // ADMIN AUTHENTICATION REQUIRED
    const adminAuth = verifyAdminAuth(event);
    
    if (!adminAuth || !adminAuth.authenticated) {
      return errorResponse('Unauthorized. Admin access required.', 403);
    }

    // Parse request body
    const body = parseBody(event.body);
    const { walletAddress, amount, reason = 'Debit', metadata = {} } = body;

    // Validate wallet address
    if (!walletAddress) {
      return errorResponse('Wallet address is required', 400);
    }

    const normalizedWallet = walletAddress.toLowerCase().trim();

    // Validate amount
    if (typeof amount !== 'number' || amount <= 0) {
      return errorResponse('Amount must be a positive number', 400);
    }

    // Get session from store
    const session = sessionStore.getSession(normalizedWallet);

    if (!session) {
      return errorResponse('Wallet not found. User must connect wallet first.', 404);
    }

    // Check sufficient balance
    const previousBalance = session.balance || 0;
    
    if (previousBalance < amount) {
      return errorResponse(`Insufficient balance. Current: ${previousBalance}, Required: ${amount}`, 400);
    }

    // Calculate new balance
    const newBalance = previousBalance - amount;

    // Create transaction record
    const transaction = {
      id: require('uuid').v4(),
      type: 'debit',
      amount,
      previousBalance,
      newBalance,
      reason,
      metadata,
      adminEmail: adminAuth.email,
      adminMethod: adminAuth.method,
      timestamp: new Date().toISOString()
    };

    // Update session with new balance and transaction
    const transactions = session.transactions || [];
    transactions.push(transaction);

    sessionStore.updateSession(normalizedWallet, {
      balance: newBalance,
      transactions
    });

    // Prepare response
    const responseData = {
      walletAddress: session.walletAddress || normalizedWallet,
      previousBalance,
      amount,
      newBalance,
      transactionId: transaction.id,
      reason,
      debitedBy: adminAuth.email,
      timestamp: transaction.timestamp
    };

    return successResponse(responseData);

  } catch (error) {
    console.error('Debit wallet error:', error);
    return errorResponse('Failed to debit wallet', 500);
  }
};
