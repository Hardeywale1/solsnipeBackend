const {
  generateToken,
  verifyToken,
  extractTokenFromHeader
} = require('./utils/auth');
const {
  successResponse,
  errorResponse,
  handleOptions,
  parseBody
} = require('./utils/response');

/**
 * Token Refresh Function
 * Refreshes an access token using a valid refresh token
 * 
 * Endpoint: POST /api/auth/refresh
 * 
 * Request body:
 * {
 *   "refreshToken": "refresh-jwt-token"
 * }
 * 
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "token": "new-jwt-token",
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
    const { refreshToken } = body;

    if (!refreshToken) {
      return errorResponse('Refresh token is required', 400);
    }

    // Verify refresh token
    const decoded = verifyToken(refreshToken);

    if (!decoded) {
      return errorResponse('Invalid or expired refresh token', 401);
    }

    // Check if it's a refresh token
    if (decoded.type !== 'refresh') {
      return errorResponse('Invalid token type. Expected refresh token.', 400);
    }

    // Generate new access token
    const newToken = generateToken(decoded.userId, {
      username: decoded.username
    });

    // Prepare response
    const responseData = {
      token: newToken,
      expiresIn: '30 days',
      refreshedAt: new Date().toISOString()
    };

    return successResponse(responseData);

  } catch (error) {
    console.error('Token refresh error:', error);
    return errorResponse('Failed to refresh token', 500);
  }
};
