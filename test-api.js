// 🧪 Automated Test Script for Solsnipe Backend
// Run with: node test-api.js

const baseURL = process.env.API_URL || 'http://localhost:8888/api';
const testWallet = '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb';

let authToken = '';
let refreshToken = '';

// Helper function for API calls
async function apiCall(endpoint, method = 'GET', body = null, token = null) {
  const headers = {
    'Content-Type': 'application/json'
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const options = {
    method,
    headers
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(`${baseURL}${endpoint}`, options);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`❌ API call failed: ${endpoint}`, error.message);
    throw error;
  }
}

// Test functions
async function test1_connectWallet() {
  console.log('\n📝 Test 1: Connect Wallet');
  console.log('━'.repeat(50));
  
  const result = await apiCall('/anonymous-auth', 'POST', {
    walletAddress: testWallet,
    chain: 'ethereum',
    metadata: {
      test: true,
      device: 'test-script'
    }
  });

  if (result.success) {
    authToken = result.data.token;
    refreshToken = result.data.refreshToken;
    console.log('✅ Wallet connected successfully');
    console.log(`   Wallet: ${result.data.walletAddress}`);
    console.log(`   Balance: ${result.data.balance}`);
    console.log(`   Is New User: ${result.data.isNewUser}`);
    console.log(`   Chain: ${result.data.chain}`);
    return true;
  } else {
    console.log('❌ Failed to connect wallet:', result.error);
    return false;
  }
}

async function test2_getBalance() {
  console.log('\n📝 Test 2: Get Balance');
  console.log('━'.repeat(50));
  
  const result = await apiCall('/get-balance', 'GET', null, authToken);

  if (result.success) {
    console.log('✅ Balance retrieved successfully');
    console.log(`   Current Balance: ${result.data.balance}`);
    return true;
  } else {
    console.log('❌ Failed to get balance:', result.error);
    return false;
  }
}

async function test3_creditWallet() {
  console.log('\n📝 Test 3: Credit Wallet (+100)');
  console.log('━'.repeat(50));
  
  const result = await apiCall('/credit-wallet', 'POST', {
    amount: 100,
    reason: 'Test credit - Initial deposit',
    metadata: {
      testId: 'credit-test-1'
    }
  }, authToken);

  if (result.success) {
    console.log('✅ Wallet credited successfully');
    console.log(`   Previous Balance: ${result.data.previousBalance}`);
    console.log(`   Amount Credited: ${result.data.amount}`);
    console.log(`   New Balance: ${result.data.newBalance}`);
    console.log(`   Transaction ID: ${result.data.transactionId}`);
    return true;
  } else {
    console.log('❌ Failed to credit wallet:', result.error);
    return false;
  }
}

async function test4_creditAgain() {
  console.log('\n📝 Test 4: Credit Wallet Again (+50)');
  console.log('━'.repeat(50));
  
  const result = await apiCall('/credit-wallet', 'POST', {
    amount: 50,
    reason: 'Test credit - Bonus',
    metadata: {
      testId: 'credit-test-2'
    }
  }, authToken);

  if (result.success) {
    console.log('✅ Wallet credited successfully');
    console.log(`   Amount Credited: ${result.data.amount}`);
    console.log(`   New Balance: ${result.data.newBalance}`);
    return true;
  } else {
    console.log('❌ Failed to credit wallet:', result.error);
    return false;
  }
}

async function test5_debitWallet() {
  console.log('\n📝 Test 5: Debit Wallet (-30)');
  console.log('━'.repeat(50));
  
  const result = await apiCall('/debit-wallet', 'POST', {
    amount: 30,
    reason: 'Test purchase',
    metadata: {
      itemId: 'item-123',
      testId: 'debit-test-1'
    }
  }, authToken);

  if (result.success) {
    console.log('✅ Wallet debited successfully');
    console.log(`   Previous Balance: ${result.data.previousBalance}`);
    console.log(`   Amount Debited: ${result.data.amount}`);
    console.log(`   New Balance: ${result.data.newBalance}`);
    console.log(`   Transaction ID: ${result.data.transactionId}`);
    return true;
  } else {
    console.log('❌ Failed to debit wallet:', result.error);
    return false;
  }
}

async function test6_debitInsufficient() {
  console.log('\n📝 Test 6: Debit More Than Balance (should fail)');
  console.log('━'.repeat(50));
  
  const result = await apiCall('/debit-wallet', 'POST', {
    amount: 99999,
    reason: 'Test insufficient balance'
  }, authToken);

  if (!result.success && result.error.includes('Insufficient')) {
    console.log('✅ Correctly rejected insufficient balance');
    console.log(`   Error: ${result.error}`);
    return true;
  } else {
    console.log('❌ Should have failed with insufficient balance error');
    return false;
  }
}

async function test7_getTransactions() {
  console.log('\n📝 Test 7: Get Transaction History');
  console.log('━'.repeat(50));
  
  const result = await apiCall('/get-transactions?limit=10', 'GET', null, authToken);

  if (result.success) {
    console.log('✅ Transaction history retrieved');
    console.log(`   Current Balance: ${result.data.currentBalance}`);
    console.log(`   Total Transactions: ${result.data.totalTransactions}`);
    console.log(`   Total Credits: ${result.data.totalCredits}`);
    console.log(`   Total Debits: ${result.data.totalDebits}`);
    console.log('\n   Recent Transactions:');
    
    result.data.transactions.slice(0, 5).forEach((tx, index) => {
      console.log(`   ${index + 1}. ${tx.type.toUpperCase()} | ${tx.amount} | ${tx.reason}`);
    });
    
    return true;
  } else {
    console.log('❌ Failed to get transactions:', result.error);
    return false;
  }
}

async function test8_verifyToken() {
  console.log('\n📝 Test 8: Verify Token');
  console.log('━'.repeat(50));
  
  const result = await apiCall('/verify-token', 'GET', null, authToken);

  if (result.success && result.data.valid) {
    console.log('✅ Token verified successfully');
    console.log(`   Valid: ${result.data.valid}`);
    console.log(`   User ID: ${result.data.userId}`);
    console.log(`   Type: ${result.data.type}`);
    return true;
  } else {
    console.log('❌ Token verification failed');
    return false;
  }
}

async function test9_setBalance() {
  console.log('\n📝 Test 9: Set Balance Directly (to 1000)');
  console.log('━'.repeat(50));
  
  const result = await apiCall('/set-balance', 'PUT', {
    balance: 1000,
    reason: 'Test - Admin adjustment'
  }, authToken);

  if (result.success) {
    console.log('✅ Balance set successfully');
    console.log(`   Previous Balance: ${result.data.previousBalance}`);
    console.log(`   New Balance: ${result.data.newBalance}`);
    console.log(`   Difference: ${result.data.difference}`);
    return true;
  } else {
    console.log('❌ Failed to set balance:', result.error);
    return false;
  }
}

async function test10_refreshToken() {
  console.log('\n📝 Test 10: Refresh Token');
  console.log('━'.repeat(50));
  
  const result = await apiCall('/refresh-token', 'POST', {
    refreshToken: refreshToken
  });

  if (result.success) {
    console.log('✅ Token refreshed successfully');
    console.log(`   New Token: ${result.data.token.substring(0, 30)}...`);
    authToken = result.data.token; // Update token
    return true;
  } else {
    console.log('❌ Failed to refresh token:', result.error);
    return false;
  }
}

async function test11_updateSession() {
  console.log('\n📝 Test 11: Update Session Metadata');
  console.log('━'.repeat(50));
  
  const result = await apiCall('/update-session', 'PUT', {
    metadata: {
      theme: 'dark',
      language: 'en',
      testCompleted: true
    }
  }, authToken);

  if (result.success) {
    console.log('✅ Session updated successfully');
    console.log(`   Message: ${result.data.message}`);
    return true;
  } else {
    console.log('❌ Failed to update session:', result.error);
    return false;
  }
}

async function test12_getSession() {
  console.log('\n📝 Test 12: Get Session');
  console.log('━'.repeat(50));
  
  const result = await apiCall('/get-session', 'GET', null, authToken);

  if (result.success) {
    console.log('✅ Session retrieved successfully');
    console.log(`   Wallet: ${result.data.walletAddress}`);
    console.log(`   Balance: ${result.data.balance || 0}`);
    console.log(`   Metadata: ${JSON.stringify(result.data.metadata || {})}`);
    return true;
  } else {
    console.log('❌ Failed to get session:', result.error);
    return false;
  }
}

// Run all tests
async function runAllTests() {
  console.log('\n');
  console.log('═'.repeat(50));
  console.log('🚀 SOLSNIPE BACKEND API TEST SUITE');
  console.log('═'.repeat(50));
  console.log(`Testing API at: ${baseURL}`);
  console.log(`Test Wallet: ${testWallet}`);
  
  const tests = [
    test1_connectWallet,
    test2_getBalance,
    test3_creditWallet,
    test4_creditAgain,
    test5_debitWallet,
    test6_debitInsufficient,
    test7_getTransactions,
    test8_verifyToken,
    test9_setBalance,
    test10_refreshToken,
    test11_updateSession,
    test12_getSession
  ];

  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    try {
      const result = await test();
      if (result) {
        passed++;
      } else {
        failed++;
      }
    } catch (error) {
      console.log(`❌ Test failed with error: ${error.message}`);
      failed++;
    }
    
    // Small delay between tests
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  // Summary
  console.log('\n');
  console.log('═'.repeat(50));
  console.log('📊 TEST RESULTS SUMMARY');
  console.log('═'.repeat(50));
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📈 Success Rate: ${((passed / tests.length) * 100).toFixed(1)}%`);
  console.log('═'.repeat(50));

  if (failed === 0) {
    console.log('\n🎉 All tests passed! Your API is working perfectly!');
  } else {
    console.log('\n⚠️  Some tests failed. Please check the errors above.');
  }

  console.log('\n');
}

// Start tests
runAllTests().catch(error => {
  console.error('\n💥 Fatal error running tests:', error);
  process.exit(1);
});
