const {
  verifyToken,
  extractTokenFromHeader
} = require('./utils/auth');
const {
  successResponse,
  errorResponse,
  handleOptions,
  parseBody
} = require('./utils/response');
const sessionStore = require('./utils/sessionStore');

/**
 * Get Transaction History Function
 * Retrieves all transactions for a wallet
 * 
 * Endpoint: GET /api/wallet/transactions
 * Headers: Authorization: Bearer <token>
 * Query params: ?limit=10&offset=0&type=credit|debit
 * 
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "walletAddress": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
 *     "currentBalance": 100,
 *     "totalTransactions": 5,
 *     "transactions": [...]
 *   }
 * }
 */
exports.handler = async (event, context) => {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return handleOptions();
  }

  // Only allow GET requests
  if (event.httpMethod !== 'GET') {
    return errorResponse('Method not allowed. Use GET.', 405);
  }

  try {
    // Extract and verify token
    const token = extractTokenFromHeader(event.headers);

    if (!token) {
      return errorResponse('No token provided', 401);
    }

    const decoded = verifyToken(token);

    if (!decoded) {
      return errorResponse('Invalid or expired token', 401);
    }

    const walletAddress = decoded.userId || decoded.walletAddress;

    // Parse query parameters
    const params = event.queryStringParameters || {};
    const limit = parseInt(params.limit) || 50;
    const offset = parseInt(params.offset) || 0;
    const typeFilter = params.type; // 'credit', 'debit', or undefined for all

    // Get session from store
    const session = sessionStore.getSession(walletAddress);

    if (!session) {
      return errorResponse('Wallet not found', 404);
    }

    // Get transactions
    let transactions = session.transactions || [];

    // Filter by type if specified
    if (typeFilter && ['credit', 'debit'].includes(typeFilter)) {
      transactions = transactions.filter(tx => tx.type === typeFilter);
    }

    // Sort by timestamp (newest first)
    transactions.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    // Apply pagination
    const totalTransactions = transactions.length;
    const paginatedTransactions = transactions.slice(offset, offset + limit);

    // Calculate totals
    const totalCredits = transactions
      .filter(tx => tx.type === 'credit')
      .reduce((sum, tx) => sum + tx.amount, 0);

    const totalDebits = transactions
      .filter(tx => tx.type === 'debit')
      .reduce((sum, tx) => sum + tx.amount, 0);

    // Prepare response
    const responseData = {
      walletAddress: session.walletAddress || walletAddress,
      currentBalance: session.balance || 0,
      totalTransactions,
      totalCredits,
      totalDebits,
      limit,
      offset,
      hasMore: offset + limit < totalTransactions,
      transactions: paginatedTransactions
    };

    return successResponse(responseData);

  } catch (error) {
    console.error('Get transactions error:', error);
    return errorResponse('Failed to retrieve transactions', 500);
  }
};
