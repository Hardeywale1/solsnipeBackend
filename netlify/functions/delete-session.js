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
 * Delete User Session Function
 * Deletes/logs out a user session
 * 
 * Endpoint: DELETE /api/user/session
 * Headers: Authorization: Bearer <token>
 * 
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "message": "Session deleted successfully"
 *   }
 * }
 */
exports.handler = async (event, context) => {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return handleOptions();
  }

  // Only allow DELETE requests
  if (event.httpMethod !== 'DELETE') {
    return errorResponse('Method not allowed. Use DELETE.', 405);
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

    // Delete session
    const deleted = sessionStore.deleteSession(decoded.userId);

    if (!deleted) {
      return errorResponse('Session not found', 404);
    }

    // Prepare response
    const responseData = {
      message: 'Session deleted successfully',
      userId: decoded.userId
    };

    return successResponse(responseData);

  } catch (error) {
    console.error('Delete session error:', error);
    return errorResponse('Failed to delete session', 500);
  }
};
