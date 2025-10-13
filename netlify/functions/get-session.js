const {
  verifyToken,
  extractTokenFromHeader
} = require('./utils/auth');
const {
  successResponse,
  errorResponse,
  handleOptions
} = require('./utils/response');
const sessionStore = require('./utils/sessionStore');

/**
 * Get User Session Function
 * Retrieves user session information
 * 
 * Endpoint: GET /api/user/session
 * Headers: Authorization: Bearer <token>
 * 
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "userId": "uuid-v4",
 *     "username": "AnonymousUser1234",
 *     "createdAt": 1234567890,
 *     "lastAccessedAt": 1234567890,
 *     "isAnonymous": true
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

    // Get session from store
    const session = sessionStore.getSession(decoded.userId);

    if (!session) {
      return errorResponse('Session not found', 404);
    }

    // Prepare response (exclude sensitive data)
    const responseData = {
      userId: session.userId,
      username: session.username,
      createdAt: session.createdAt,
      lastAccessedAt: session.lastAccessedAt,
      isAnonymous: session.isAnonymous,
      metadata: session.metadata || {}
    };

    return successResponse(responseData);

  } catch (error) {
    console.error('Get session error:', error);
    return errorResponse('Failed to retrieve session', 500);
  }
};
