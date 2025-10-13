const {
  verifyAdminToken,
  verifySuperAdminApiKey,
  extractTokenFromHeader
} = require('./auth');

/**
 * Middleware to verify admin authentication
 * Checks for either admin JWT token or super admin API key
 * 
 * @param {object} event - Netlify function event
 * @returns {object|null} Admin data if authenticated, null otherwise
 */
const verifyAdminAuth = (event) => {
  // Method 1: Check for Bearer token (admin login)
  const token = extractTokenFromHeader(event.headers);
  
  if (token) {
    const adminData = verifyAdminToken(token);
    
    if (adminData) {
      return {
        authenticated: true,
        method: 'token',
        email: adminData.email,
        role: adminData.role
      };
    }
  }

  // Method 2: Check for API key (service-to-service)
  const apiKey = event.headers['x-api-key'] || event.headers['X-API-Key'];
  
  if (apiKey && verifySuperAdminApiKey(apiKey)) {
    return {
      authenticated: true,
      method: 'api-key',
      email: 'system',
      role: 'super_admin'
    };
  }

  return null;
};

/**
 * Check if request has admin privileges
 * @param {object} event - Netlify function event
 * @returns {boolean} Whether request is from admin
 */
const isAdmin = (event) => {
  const adminAuth = verifyAdminAuth(event);
  return adminAuth !== null && adminAuth.authenticated;
};

/**
 * Extract admin info from request
 * @param {object} event - Netlify function event
 * @returns {object|null} Admin info or null
 */
const getAdminInfo = (event) => {
  return verifyAdminAuth(event);
};

module.exports = {
  verifyAdminAuth,
  isAdmin,
  getAdminInfo
};
