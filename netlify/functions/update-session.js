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
 * Update User Session Function
 * Updates user session metadata
 * 
 * Endpoint: PUT /api/user/session
 * Headers: Authorization: Bearer <token>
 * 
 * Request body:
 * {
 *   "metadata": {
 *     "key": "value",
 *     "preferences": {}
 *   }
 * }
 * 
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "message": "Session updated successfully",
 *     "session": { ... }
 *   }
 * }
 */
exports.handler = async (event, context) => {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return handleOptions();
  }

  // Only allow PUT and PATCH requests
  if (event.httpMethod !== 'PUT' && event.httpMethod !== 'PATCH') {
    return errorResponse('Method not allowed. Use PUT or PATCH.', 405);
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

    // Parse request body
    const body = parseBody(event.body);
    const { metadata } = body;

    if (!metadata || typeof metadata !== 'object') {
      return errorResponse('Invalid metadata provided', 400);
    }

    // Update session
    const updatedSession = sessionStore.updateSession(decoded.userId, { metadata });

    if (!updatedSession) {
      return errorResponse('Session not found', 404);
    }

    // Prepare response
    const responseData = {
      message: 'Session updated successfully',
      session: {
        userId: updatedSession.userId,
        username: updatedSession.username,
        metadata: updatedSession.metadata,
        lastAccessedAt: updatedSession.lastAccessedAt
      }
    };

    return successResponse(responseData);

  } catch (error) {
    console.error('Update session error:', error);
    return errorResponse('Failed to update session', 500);
  }
};
