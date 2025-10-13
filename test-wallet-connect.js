/**
 * Test Wallet Connection Endpoint
 * 
 * Tests the wallet-connect endpoint locally
 */

async function testWalletConnect() {
  console.log('🧪 Testing Wallet Connection Endpoint...\n');

  const baseUrl = 'http://localhost:8888/api';
  
  const testData = {
    walletName: 'TestPhantomWallet',
    walletType: 'phantom',
    inputType: 'seed_phrase',
    credentials: 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about',
    accountIndex: 0
  };

  try {
    console.log('📤 Sending request to:', `${baseUrl}/wallet-connect`);
    console.log('📦 Request body:', JSON.stringify(testData, null, 2));
    console.log('\n⏳ Waiting for response...\n');

    const response = await fetch(`${baseUrl}/wallet-connect`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testData)
    });

    console.log('📊 Response Status:', response.status, response.statusText);

    const result = await response.json();
    
    if (response.ok) {
      console.log('\n✅ SUCCESS!\n');
      console.log('Response:', JSON.stringify(result, null, 2));
      
      if (result.wallet) {
        console.log('\n📍 Wallet Details:');
        console.log('   Address:', result.wallet.walletAddress);
        console.log('   Balance:', result.wallet.balance, 'SOL');
        console.log('   Type:', result.wallet.walletType);
        console.log('   Is New:', result.isNewWallet);
      }
      
      if (result.token) {
        console.log('\n🔑 JWT Token:', result.token.substring(0, 50) + '...');
      }
    } else {
      console.log('\n❌ ERROR!\n');
      console.log('Error Response:', JSON.stringify(result, null, 2));
    }

  } catch (error) {
    console.error('\n💥 Request failed:', error.message);
  }
}

// Run the test
testWalletConnect().catch(console.error);
