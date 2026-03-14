/**
 * Admin Login Function
 * Authenticates admin users with username/password and returns admin JWT token
 * 
 * Endpoint: POST /api/admin/login
 * 
 * Request body:
 * {
 *   "username": "admin",
 *   "password": "your-secure-password",
 *   "apiKey": "your-admin-api-key"
 * }
 * 
 * Response:
 * {
 *   "success": true,
 *   "token": "admin-jwt-token",
 *   "adminId": "admin",
 *   "role": "super_admin",
 *   "expiresIn": "24h"
 * }
 */

const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this';
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';
const ADMIN_API_KEY = process.env.ADMIN_API_KEY || 'super-secret-admin-key';
const ADMIN_API_KEY_REQUIRED = (process.env.ADMIN_API_KEY_REQUIRED || 'false').toLowerCase() === 'true';

exports.handler = async (event) => {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  // Handle preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  // Only accept POST
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const body = JSON.parse(event.body);
    const { username, password, apiKey } = body;

    // Validate input
    if (!username || !password) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Username and password are required' })
      };
    }

    const apiKeyProvided = typeof apiKey === 'string' && apiKey.trim() !== '';
    const apiKeyMatches = !apiKeyProvided || apiKey === ADMIN_API_KEY;

    // Backward compatible login: username/password is enough unless API key is explicitly required.
    const invalidCredentials = username !== ADMIN_USERNAME || password !== ADMIN_PASSWORD;
    const missingRequiredApiKey = ADMIN_API_KEY_REQUIRED && !apiKeyProvided;
    const invalidApiKey = apiKeyProvided && !apiKeyMatches;

    if (invalidCredentials || missingRequiredApiKey || invalidApiKey) {
      // Delay response to prevent brute force
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: 'Invalid credentials' })
      };
    }

    // Generate admin JWT token
    const token = jwt.sign(
      {
        adminId: username,
        role: 'super_admin',
        type: 'admin',
        isAdmin: true
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        token,
        adminId: username,
        role: 'super_admin',
        expiresIn: '24h',
        loginAt: new Date().toISOString()
      })
    };
  } catch (error) {
    console.error('Admin login error:', error);

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Internal server error',
        message: error.message
      })
    };
  }
};
