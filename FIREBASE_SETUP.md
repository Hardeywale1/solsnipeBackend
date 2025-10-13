# 🔥 Firebase Integration Guide

This guide explains how to integrate Firebase Firestore for persistent storage of wallet sessions and transactions.

## 🎯 Why Firebase?

**Current Problem (In-Memory Storage):**
- ❌ Data lost on server restart
- ❌ Serverless functions get fresh instances each time
- ❌ No data persistence between deployments
- ❌ Can't scale across multiple instances

**Firebase Solution:**
- ✅ Persistent data storage
- ✅ Real-time synchronization
- ✅ Automatic scaling
- ✅ Built-in security rules
- ✅ Easy querying and indexing
- ✅ Free tier available (up to 1GB storage)

## 📊 Data Structure in Firebase

### Collection: `wallet_sessions`

Each document is keyed by wallet address (lowercase):

```javascript
{
  walletAddress: "0x742d35cc6634c0532925a3b844bc9e7595f0beb",
  chain: "ethereum",
  balance: 1000,
  metadata: {
    device: "mobile",
    platform: "ios"
  },
  transactions: [
    {
      id: "uuid-1",
      type: "credit",
      amount: 100,
      previousBalance: 0,
      newBalance: 100,
      reason: "Reward",
      adminEmail: "admin@solsnipe.com",
      adminMethod: "bearer_token",
      timestamp: "2025-10-11T12:00:00.000Z"
    },
    {
      id: "uuid-2",
      type: "debit",
      amount: 50,
      previousBalance: 100,
      newBalance: 50,
      reason: "Purchase",
      adminEmail: "admin@solsnipe.com",
      adminMethod: "api_key",
      timestamp: "2025-10-11T12:05:00.000Z"
    }
  ],
  isWalletAuth: true,
  createdAt: Timestamp,
  lastAccessedAt: Timestamp,
  lastAdjustment: {
    by: "admin@solsnipe.com",
    at: "2025-10-11T12:10:00.000Z",
    reason: "Balance correction"
  }
}
```

## 🚀 Setup Instructions

### Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project"
3. Enter project name (e.g., "solsnipe-backend")
4. Disable Google Analytics (optional)
5. Click "Create project"

### Step 2: Enable Firestore Database

1. In Firebase Console, click "Firestore Database"
2. Click "Create database"
3. Choose "Start in production mode" (we'll add security rules later)
4. Select a location closest to your users
5. Click "Enable"

### Step 3: Generate Service Account

1. Go to Project Settings (⚙️ icon)
2. Navigate to "Service accounts" tab
3. Click "Generate new private key"
4. Save the downloaded JSON file securely
5. **IMPORTANT:** Never commit this file to Git!

### Step 4: Configure Environment Variables

**For Local Development:**

Create `.env` file in project root:

```env
# Copy the entire contents of the service account JSON file
# Remove all line breaks and make it a single line
FIREBASE_SERVICE_ACCOUNT={"type":"service_account","project_id":"solsnipe-backend-abc123","private_key_id":"...","private_key":"-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n","client_email":"firebase-adminsdk-xyz@solsnipe-backend-abc123.iam.gserviceaccount.com",...}

# Enable Firebase storage
USE_FIREBASE=true

# Other existing env vars
JWT_SECRET=your_jwt_secret
ADMIN_EMAIL=admin@solsnipe.com
ADMIN_PASSWORD=your_password
```

**For Netlify Deployment:**

Option A: Using Netlify CLI
```bash
# Set the service account (paste entire JSON as single line)
netlify env:set FIREBASE_SERVICE_ACCOUNT '{"type":"service_account",...}'
netlify env:set USE_FIREBASE true
```

Option B: Using Netlify Dashboard
1. Go to Site settings → Environment variables
2. Add `FIREBASE_SERVICE_ACCOUNT` with the entire JSON content (single line)
3. Add `USE_FIREBASE` with value `true`

### Step 5: Install Dependencies

```bash
npm install
```

This will install `firebase-admin` package.

### Step 6: Test Locally

```bash
# Start local server
netlify dev

# Run test script
node test-api.js
```

Check the console output - you should see:
```
📦 Using Firebase Session Store (Persistent)
Firebase initialized successfully
```

## 🔒 Firebase Security Rules

Set up security rules to protect your data:

1. Go to Firestore Database → Rules
2. Add these rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Wallet sessions collection
    match /wallet_sessions/{walletAddress} {
      // Only backend (admin SDK) can read/write
      // This prevents direct client access
      allow read, write: if false;
    }
  }
}
```

**Why?** These rules prevent direct client access. All operations must go through your Netlify Functions (which use the admin SDK with full access).

## 📈 Firebase Console Usage

### View All Sessions

1. Go to Firestore Database
2. Navigate to `wallet_sessions` collection
3. You'll see all wallet sessions with their data

### Query Specific Wallet

1. Click on a document (wallet address)
2. View all fields: balance, transactions, metadata
3. Edit manually if needed (admin operations)

### Monitor Usage

1. Go to Usage tab in Firestore
2. Monitor:
   - Document reads
   - Document writes
   - Storage used

**Free Tier Limits:**
- 50,000 document reads/day
- 20,000 document writes/day
- 1 GB storage

## 🔄 Migrating Existing Data

If you have existing in-memory data you want to migrate:

```javascript
// Create migration script: migrate-to-firebase.js
const inMemoryStore = require('./netlify/functions/utils/sessionStore');
const firebaseStore = require('./netlify/functions/utils/firebaseSessionStore');

async function migrate() {
  const sessions = inMemoryStore.getAllSessions();
  
  console.log(`Migrating ${sessions.length} sessions...`);
  
  for (const session of sessions) {
    await firebaseStore.createSession(session.walletAddress, session);
    console.log(`✓ Migrated ${session.walletAddress}`);
  }
  
  console.log('Migration complete!');
}

migrate().catch(console.error);
```

Run: `node migrate-to-firebase.js`

## 🧪 Testing Firebase Integration

### Test Script

```javascript
// test-firebase.js
const sessionStore = require('./netlify/functions/utils/sessionStoreConfig');

async function test() {
  console.log('Storage type:', sessionStore.getStorageType());
  
  // Create session
  const session = await sessionStore.createSession('0x123...', {
    balance: 100,
    chain: 'ethereum'
  });
  console.log('Created:', session);
  
  // Get session
  const retrieved = await sessionStore.getSession('0x123...');
  console.log('Retrieved:', retrieved);
  
  // Update session
  const updated = await sessionStore.updateSession('0x123...', {
    balance: 200
  });
  console.log('Updated:', updated);
  
  // Count
  const count = await sessionStore.getSessionCount();
  console.log('Total sessions:', count);
}

test().catch(console.error);
```

Run: `node test-firebase.js`

## 🔧 Troubleshooting

### Error: "Failed to initialize Firebase"

**Cause:** Invalid service account JSON or missing environment variable

**Solution:**
1. Verify `FIREBASE_SERVICE_ACCOUNT` is set correctly
2. Ensure JSON is valid (use JSON validator)
3. Check that all newlines in private key are preserved as `\n`

### Error: "PERMISSION_DENIED"

**Cause:** Security rules blocking access

**Solution:**
1. Ensure you're using Firebase Admin SDK (not client SDK)
2. Check security rules allow backend access
3. Verify service account has proper permissions

### Sessions Not Persisting

**Cause:** Using in-memory store instead of Firebase

**Solution:**
1. Verify `USE_FIREBASE=true` in environment
2. Check console logs for storage type being used
3. Ensure `FIREBASE_SERVICE_ACCOUNT` is set

### Slow Performance

**Cause:** Too many Firestore operations

**Solution:**
1. Enable caching for frequently accessed data
2. Use batch operations for multiple updates
3. Consider indexing frequently queried fields

## 💡 Best Practices

### 1. Index Creation

Create indexes for common queries:

```javascript
// In Firebase Console → Indexes
// Create composite index:
- Collection: wallet_sessions
- Fields: lastAccessedAt (Descending)
```

### 2. Batch Operations

For bulk updates, use batches:

```javascript
const batch = db.batch();
batch.update(ref1, data1);
batch.update(ref2, data2);
await batch.commit();
```

### 3. Error Handling

Always handle Firebase errors:

```javascript
try {
  await sessionStore.updateSession(wallet, data);
} catch (error) {
  console.error('Firebase error:', error);
  // Fallback or retry logic
}
```

### 4. Monitoring

Set up Firebase monitoring:
1. Go to Firebase Console → Performance
2. Enable performance monitoring
3. Set up alerts for errors

## 📊 Cost Estimation

**Free Tier:**
- 50k reads/day
- 20k writes/day
- 1 GB storage

**Example Usage:**
- 1,000 active users
- 10 operations per user per day
- = 10,000 operations/day (well within free tier)

**Paid Tier (if needed):**
- $0.06 per 100k reads
- $0.18 per 100k writes
- $0.18 per GB storage

## 🔄 Switching Between Stores

To switch back to in-memory (for testing):

```env
# .env
USE_FIREBASE=false
```

Or remove the `FIREBASE_SERVICE_ACCOUNT` variable.

The system will automatically use in-memory storage.

## 📚 Additional Resources

- [Firebase Admin SDK Documentation](https://firebase.google.com/docs/admin/setup)
- [Firestore Documentation](https://firebase.google.com/docs/firestore)
- [Security Rules Guide](https://firebase.google.com/docs/firestore/security/get-started)
- [Firebase Pricing](https://firebase.google.com/pricing)

## 🆘 Support

If you encounter issues:
1. Check Firebase Console for errors
2. Review Firestore logs
3. Verify environment variables
4. Test with the provided test scripts

---

**Your data is now persistent and scalable! 🎉**
