/**
 * Firebase Connection Test
 * 
 * Tests Firebase connectivity and permissions
 * Run: node test-firebase.js
 */

require('dotenv').config();

const FIREBASE_PROJECT_ID = process.env.FIREBASE_PROJECT_ID;
const FIREBASE_API_KEY = process.env.FIREBASE_API_KEY;

async function testFirebaseConnection() {
  console.log('🔧 Testing Firebase Connection...\n');

  // Check environment variables
  console.log('1️⃣ Checking Environment Variables:');
  console.log(`   FIREBASE_PROJECT_ID: ${FIREBASE_PROJECT_ID ? '✅ Set' : '❌ Missing'}`);
  console.log(`   FIREBASE_API_KEY: ${FIREBASE_API_KEY ? '✅ Set' : '❌ Missing'}\n`);

  if (!FIREBASE_PROJECT_ID || !FIREBASE_API_KEY) {
    console.error('❌ Error: Missing Firebase credentials in .env file');
    process.exit(1);
  }

  // Test Firestore REST API
  console.log('2️⃣ Testing Firestore REST API Access:');
  
  const baseUrl = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents`;
  const testCollectionUrl = `${baseUrl}/test_connection/test_doc?key=${FIREBASE_API_KEY}`;

  try {
    // Try to write a test document
    console.log('   📝 Attempting to write test document...');
    
    const testData = {
      fields: {
        testField: { stringValue: 'test_value' },
        timestamp: { timestampValue: new Date().toISOString() }
      }
    };

    const writeResponse = await fetch(testCollectionUrl, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testData)
    });

    if (!writeResponse.ok) {
      const errorText = await writeResponse.text();
      let errorDetails;
      try {
        errorDetails = JSON.parse(errorText);
      } catch {
        errorDetails = { message: errorText };
      }

      console.error(`   ❌ Write failed (${writeResponse.status}):`, errorDetails.error?.message || errorDetails.message);
      
      if (writeResponse.status === 403) {
        console.log('\n📋 SOLUTION:');
        console.log('   Your Firebase API Key is valid, but Firestore is not enabled.');
        console.log('   Please follow these steps:');
        console.log('   1. Go to https://console.firebase.google.com');
        console.log('   2. Select your project:', FIREBASE_PROJECT_ID);
        console.log('   3. Click "Firestore Database" in the left menu');
        console.log('   4. Click "Create Database"');
        console.log('   5. Select "Start in production mode" (or test mode for development)');
        console.log('   6. Choose a location (e.g., us-central1)');
        console.log('   7. Click "Enable"\n');
      } else if (writeResponse.status === 404) {
        console.log('\n📋 SOLUTION:');
        console.log('   Firestore database not found.');
        console.log('   Please create a Firestore database in Firebase Console.\n');
      }
      
      process.exit(1);
    }

    console.log('   ✅ Write successful!\n');

    // Try to read the test document
    console.log('   📖 Attempting to read test document...');
    
    const readResponse = await fetch(testCollectionUrl, {
      method: 'GET'
    });

    if (!readResponse.ok) {
      console.error('   ❌ Read failed');
      process.exit(1);
    }

    console.log('   ✅ Read successful!\n');

    // Try to query (this is what the app uses)
    console.log('   🔍 Testing query functionality...');
    
    const queryUrl = `${baseUrl}:runQuery?key=${FIREBASE_API_KEY}`;
    const query = {
      structuredQuery: {
        from: [{ collectionId: 'test_connection' }],
        where: {
          fieldFilter: {
            field: { fieldPath: 'testField' },
            op: 'EQUAL',
            value: { stringValue: 'test_value' }
          }
        },
        limit: 1
      }
    };

    const queryResponse = await fetch(queryUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(query)
    });

    if (!queryResponse.ok) {
      console.error('   ❌ Query failed');
      process.exit(1);
    }

    const results = await queryResponse.json();
    console.log('   ✅ Query successful! Found', results.length, 'document(s)\n');

    // Clean up test document
    console.log('   🧹 Cleaning up test document...');
    await fetch(testCollectionUrl, { method: 'DELETE' });
    console.log('   ✅ Cleanup complete\n');

    console.log('✅ All Firebase tests passed!');
    console.log('🎉 Your Firebase setup is working correctly!\n');
    console.log('You can now use the wallet-connect endpoint.\n');

  } catch (error) {
    console.error('\n❌ Connection test failed:', error.message);
    console.log('\n📋 Please check:');
    console.log('   1. Your internet connection');
    console.log('   2. Firebase project ID is correct');
    console.log('   3. Firebase API key is valid');
    console.log('   4. Firestore Database is enabled in Firebase Console\n');
    process.exit(1);
  }
}

// Run the test
testFirebaseConnection().catch(console.error);
