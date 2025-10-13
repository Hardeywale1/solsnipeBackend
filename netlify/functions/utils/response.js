/**
 * CORS headers for API responses
 */
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
};

/**
 * Create a successful response
 * @param {object} data - Response data
 * @param {number} statusCode - HTTP status code (default: 200)
 * @returns {object} Netlify function response
 */
const successResponse = (data, statusCode = 200) => {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders
    },
    body: JSON.stringify({
      success: true,
      data
    })
  };
};

/**
 * Create an error response
 * @param {string} message - Error message
 * @param {number} statusCode - HTTP status code (default: 400)
 * @returns {object} Netlify function response
 */
const errorResponse = (message, statusCode = 400) => {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders
    },
    body: JSON.stringify({
      success: false,
      error: message
    })
  };
};

/**
 * Handle OPTIONS requests for CORS preflight
 * @returns {object} Netlify function response
 */
const handleOptions = () => {
  return {
    statusCode: 204,
    headers: corsHeaders,
    body: ''
  };
};

/**
 * Parse request body (supports both JSON string and object)
 * @param {string|object} body - Request body
 * @returns {object} Parsed body
 */
const parseBody = (body) => {
  if (!body) {
    return {};
  }
  
  if (typeof body === 'string') {
    try {
      return JSON.parse(body);
    } catch (error) {
      return {};
    }
  }
  
  return body;
};

module.exports = {
  corsHeaders,
  successResponse,
  errorResponse,
  handleOptions,
  parseBody
};
