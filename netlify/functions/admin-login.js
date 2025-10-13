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
    if (!username || !password || !apiKey) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Username, password, and apiKey are required' })
      };
    }

    // Validate credentials
    if (username !== ADMIN_USERNAME || password !== ADMIN_PASSWORD || apiKey !== ADMIN_API_KEY) {
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
