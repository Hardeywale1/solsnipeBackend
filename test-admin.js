/**
 * Admin API Test Script
 * Tests admin authentication and balance management endpoints
 * 
 * Usage: node test-admin.js
 * 
 * Prerequisites:
 * 1. Set up .env file with ADMIN_EMAIL, ADMIN_PASSWORD, SUPER_ADMIN_API_KEY
 * 2. Deploy to Netlify or run locally
 * 3. Have at least one wallet authenticated (run test-api.js first)
 */

const axios = require('axios');

// Configuration
const BASE_URL = 'http://localhost:8888/api'; // Change to your Netlify URL when deployed
const TEST_WALLET = '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb'; // Replace with your test wallet

// Admin credentials from .env
const ADMIN_EMAIL = 'admin@solsnipe.com';
const ADMIN_PASSWORD = 'your_secure_admin_password_here';
const SUPER_ADMIN_API_KEY = 'your_super_admin_api_key_here';

// Color codes for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  console.log('\n' + '='.repeat(60));
  log(title, 'bright');
  console.log('='.repeat(60) + '\n');
}

function logSuccess(message) {
  log(`✓ ${message}`, 'green');
}

function logError(message) {
  log(`✗ ${message}`, 'red');
}

function logInfo(message) {
  log(`ℹ ${message}`, 'cyan');
}

let adminToken = null;

/**
 * Test 1: Admin Login with Email/Password
 */
async function testAdminLogin() {
  logSection('TEST 1: Admin Login (Email/Password)');
  
  try {
    logInfo(`Logging in as: ${ADMIN_EMAIL}`);
    
    const response = await axios.post(`${BASE_URL}/admin/login`, {
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD
    });

    if (response.data.success && response.data.data.token) {
      adminToken = response.data.data.token;
      logSuccess('Admin login successful');
      console.log('Response:', JSON.stringify(response.data, null, 2));
      return true;
    } else {
      logError('Login failed: No token received');
      return false;
    }
  } catch (error) {
    logError(`Admin login failed: ${error.response?.data?.error || error.message}`);
    if (error.response?.data) {
      console.log('Error details:', JSON.stringify(error.response.data, null, 2));
    }
    return false;
  }
}

/**
 * Test 2: Credit Wallet (with Admin Token)
 */
async function testCreditWallet() {
  logSection('TEST 2: Credit Wallet (Admin Token Auth)');
  
  if (!adminToken) {
    logError('No admin token available. Skipping test.');
    return false;
  }

  try {
    logInfo(`Crediting wallet: ${TEST_WALLET}`);
    logInfo('Amount: 500');
    
    const response = await axios.post(
      `${BASE_URL}/credit-wallet`,
      {
        walletAddress: TEST_WALLET,
        amount: 500,
        reason: 'Test credit via admin token'
      },
      {
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (response.data.success) {
      logSuccess('Credit successful');
      console.log('Response:', JSON.stringify(response.data, null, 2));
      return true;
    } else {
      logError('Credit failed');
      return false;
    }
  } catch (error) {
    logError(`Credit wallet failed: ${error.response?.data?.error || error.message}`);
    if (error.response?.data) {
      console.log('Error details:', JSON.stringify(error.response.data, null, 2));
    }
    return false;
  }
}

/**
 * Test 3: Debit Wallet (with Admin Token)
 */
async function testDebitWallet() {
  logSection('TEST 3: Debit Wallet (Admin Token Auth)');
  
  if (!adminToken) {
    logError('No admin token available. Skipping test.');
    return false;
  }

  try {
    logInfo(`Debiting wallet: ${TEST_WALLET}`);
    logInfo('Amount: 100');
    
    const response = await axios.post(
      `${BASE_URL}/debit-wallet`,
      {
        walletAddress: TEST_WALLET,
        amount: 100,
        reason: 'Test debit via admin token'
      },
      {
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (response.data.success) {
      logSuccess('Debit successful');
      console.log('Response:', JSON.stringify(response.data, null, 2));
      return true;
    } else {
      logError('Debit failed');
      return false;
    }
  } catch (error) {
    logError(`Debit wallet failed: ${error.response?.data?.error || error.message}`);
    if (error.response?.data) {
      console.log('Error details:', JSON.stringify(error.response.data, null, 2));
    }
    return false;
  }
}

/**
 * Test 4: Set Balance (with Admin Token)
 */
async function testSetBalance() {
  logSection('TEST 4: Set Balance (Admin Token Auth)');
  
  if (!adminToken) {
    logError('No admin token available. Skipping test.');
    return false;
  }

  try {
    logInfo(`Setting balance for wallet: ${TEST_WALLET}`);
    logInfo('New balance: 1000');
    
    const response = await axios.put(
      `${BASE_URL}/set-balance`,
      {
        walletAddress: TEST_WALLET,
        balance: 1000,
        reason: 'Test balance adjustment via admin token'
      },
      {
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (response.data.success) {
      logSuccess('Set balance successful');
      console.log('Response:', JSON.stringify(response.data, null, 2));
      return true;
    } else {
      logError('Set balance failed');
      return false;
    }
  } catch (error) {
    logError(`Set balance failed: ${error.response?.data?.error || error.message}`);
    if (error.response?.data) {
      console.log('Error details:', JSON.stringify(error.response.data, null, 2));
    }
    return false;
  }
}

/**
 * Test 5: Credit Wallet with API Key
 */
async function testCreditWithApiKey() {
  logSection('TEST 5: Credit Wallet (API Key Auth)');
  
  try {
    logInfo(`Crediting wallet: ${TEST_WALLET}`);
    logInfo('Amount: 250');
    logInfo('Auth: Using Super Admin API Key');
    
    const response = await axios.post(
      `${BASE_URL}/credit-wallet`,
      {
        walletAddress: TEST_WALLET,
        amount: 250,
        reason: 'Test credit via API key'
      },
      {
        headers: {
          'X-API-Key': SUPER_ADMIN_API_KEY,
          'Content-Type': 'application/json'
        }
      }
    );

    if (response.data.success) {
      logSuccess('Credit with API key successful');
      console.log('Response:', JSON.stringify(response.data, null, 2));
      return true;
    } else {
      logError('Credit with API key failed');
      return false;
    }
  } catch (error) {
    logError(`Credit with API key failed: ${error.response?.data?.error || error.message}`);
    if (error.response?.data) {
      console.log('Error details:', JSON.stringify(error.response.data, null, 2));
    }
    return false;
  }
}

/**
 * Test 6: Unauthorized Access Test (no auth)
 */
async function testUnauthorizedAccess() {
  logSection('TEST 6: Unauthorized Access (No Auth)');
  
  try {
    logInfo('Attempting to credit wallet without authentication...');
    
    const response = await axios.post(
      `${BASE_URL}/credit-wallet`,
      {
        walletAddress: TEST_WALLET,
        amount: 100,
        reason: 'Unauthorized attempt'
      }
    );

    // If we get here, the test failed (should have been rejected)
    logError('Security issue: Request was allowed without authentication!');
    return false;
  } catch (error) {
    if (error.response?.status === 403 || error.response?.status === 401) {
      logSuccess('Correctly rejected unauthorized request');
      console.log('Error:', error.response.data.error);
      return true;
    } else {
      logError(`Unexpected error: ${error.message}`);
      return false;
    }
  }
}

/**
 * Run all tests
 */
async function runAllTests() {
  log('\n🚀 Starting Admin API Tests\n', 'bright');
  log(`Base URL: ${BASE_URL}`, 'yellow');
  log(`Test Wallet: ${TEST_WALLET}\n`, 'yellow');

  const results = {
    total: 0,
    passed: 0,
    failed: 0
  };

  const tests = [
    { name: 'Admin Login', fn: testAdminLogin },
    { name: 'Credit Wallet (Token)', fn: testCreditWallet },
    { name: 'Debit Wallet (Token)', fn: testDebitWallet },
    { name: 'Set Balance (Token)', fn: testSetBalance },
    { name: 'Credit Wallet (API Key)', fn: testCreditWithApiKey },
    { name: 'Unauthorized Access', fn: testUnauthorizedAccess }
  ];

  for (const test of tests) {
    results.total++;
    const passed = await test.fn();
    if (passed) {
      results.passed++;
    } else {
      results.failed++;
    }
    
    // Wait a bit between tests
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  // Print summary
  logSection('TEST SUMMARY');
  log(`Total Tests: ${results.total}`, 'blue');
  log(`Passed: ${results.passed}`, 'green');
  log(`Failed: ${results.failed}`, results.failed > 0 ? 'red' : 'green');
  
  const passRate = ((results.passed / results.total) * 100).toFixed(1);
  log(`\nPass Rate: ${passRate}%`, passRate === '100.0' ? 'green' : 'yellow');
  
  if (results.failed === 0) {
    log('\n✓ All tests passed!', 'green');
  } else {
    log(`\n✗ ${results.failed} test(s) failed`, 'red');
  }
}

// Run tests if executed directly
if (require.main === module) {
  runAllTests().catch(error => {
    logError(`Fatal error: ${error.message}`);
    process.exit(1);
  });
}

module.exports = {
  testAdminLogin,
  testCreditWallet,
  testDebitWallet,
  testSetBalance,
  testCreditWithApiKey,
  testUnauthorizedAccess,
  runAllTests
};
