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
 * Token Verification Function
 * Verifies the validity of a JWT token and returns user information
 * 
 * Endpoint: GET /api/auth/verify
 * Headers: Authorization: Bearer <token>
 * 
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "valid": true,
 *     "userId": "uuid-v4",
 *     "username": "AnonymousUser1234",
 *     "type": "anonymous",
 *     "createdAt": 1234567890
 *   }
 * }
 */
exports.handler = async (event, context) => {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return handleOptions();
  }

  // Allow GET and POST methods
  if (event.httpMethod !== 'GET' && event.httpMethod !== 'POST') {
    return errorResponse('Method not allowed. Use GET or POST.', 405);
  }

  try {
    // Extract token from Authorization header
    const token = extractTokenFromHeader(event.headers);

    if (!token) {
      return errorResponse('No token provided', 401);
    }

    // Verify token
    const decoded = verifyToken(token);

    if (!decoded) {
      return errorResponse('Invalid or expired token', 401);
    }

    // Get session data if available
    const session = sessionStore.getSession(decoded.userId);

    // Prepare response
    const responseData = {
      valid: true,
      userId: decoded.userId,
      username: decoded.username || session?.username,
      type: decoded.type,
      createdAt: decoded.createdAt,
      ...(session && {
        sessionInfo: {
          lastAccessedAt: session.lastAccessedAt,
          isAnonymous: session.isAnonymous
        }
      })
    };

    return successResponse(responseData);

  } catch (error) {
    console.error('Token verification error:', error);
    return errorResponse('Token verification failed', 500);
  }
};
