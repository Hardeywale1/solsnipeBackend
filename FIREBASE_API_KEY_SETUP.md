# 🔥 Firebase API Key Setup (Simplified Method)

This is the **EASIER** way to use Firebase - just use an API key instead of service account JSON!

## ✨ Why Use API Key Instead of Service Account?

| Feature | API Key ✅ | Service Account |
|---------|-----------|-----------------|
| **Setup Complexity** | Very Easy | Complex |
| **Configuration** | Just 2 variables | Long JSON string |
| **Security** | Good (restrict to IPs) | Better (role-based) |
| **Best For** | Small-medium projects | Enterprise apps |
| **Copy/Paste** | Simple strings | Huge JSON blob |

## 🚀 5-Minute Setup

### Step 1: Create Firebase Project (2 minutes)

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click **"Add project"**
3. Enter project name: `solsnipe-backend`
4. Disable Google Analytics (optional)
5. Click **"Create project"**

### Step 2: Enable Firestore (1 minute)

1. Click **"Firestore Database"** in sidebar
2. Click **"Create database"**
3. Choose **"Start in production mode"**
4. Select region (closest to you)
5. Click **"Enable"**

### Step 3: Get Your API Key (30 seconds)

1. Click ⚙️ (Settings) → **"Project settings"**
2. Scroll to **"Your apps"** section
3. Click **"Web"** icon (</>) 
4. Register app (name: "Solsnipe Backend")
5. Copy the `apiKey` and `projectId` values:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyC_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx",  // ← Copy this
  authDomain: "solsnipe-backend.firebaseapp.com",
  projectId: "solsnipe-backend",  // ← And this
  // ... other fields
};
```

### Step 4: Set Environment Variables (1 minute)

#### For Local Development (.env file):

Create `.env` file in your project root:

```env
# Firebase API Key Configuration
FIREBASE_API_KEY=AIzaSyC_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
FIREBASE_PROJECT_ID=solsnipe-backend

# Other required vars
JWT_SECRET=your_jwt_secret_here
ADMIN_EMAIL=admin@solsnipe.com
ADMIN_PASSWORD=your_secure_password
SUPER_ADMIN_API_KEY=your_api_key_here
```

#### For Netlify Deployment:

**Option A: Netlify CLI**
```bash
netlify env:set FIREBASE_API_KEY "AIzaSyC_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
netlify env:set FIREBASE_PROJECT_ID "solsnipe-backend"
```

**Option B: Netlify Dashboard**
1. Go to **Site settings → Environment variables**
2. Add:
   - `FIREBASE_API_KEY` = `AIzaSyC_xxx...`
   - `FIREBASE_PROJECT_ID` = `solsnipe-backend`

### Step 5: Install Dependencies & Test (1 minute)

```bash
# Install
npm install

# Test locally
netlify dev
```

You should see:
```
🔥 Using Firebase API Session Store (API Key) - Persistent
```

Done! ✅

## 🔒 Security Rules

Set up security rules to prevent direct client access:

1. Go to **Firestore Database → Rules**
2. Replace with:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Only server-side (API key from backend) can access
    match /wallet_sessions/{document=**} {
      allow read, write: if false;
    }
  }
}
```

3. Click **"Publish"**

**Why?** This blocks direct browser access. Only your Netlify Functions (backend) can read/write data.

## 📊 What Gets Saved

Your Firebase Firestore will have a collection called `wallet_sessions`:

```
📁 wallet_sessions (collection)
  └─ 📄 0x742d35cc... (document - wallet address)
      ├─ walletAddress: "0x742d35cc..."
      ├─ balance: 1000
      ├─ chain: "ethereum"
      ├─ transactions: [...]
      ├─ createdAt: Timestamp
      └─ lastAccessedAt: Timestamp
```

## 🧪 Test It Works

### Using Postman:

1. Import `Solsnipe_Backend_API.postman_collection.json`
2. Set variables:
   - `baseUrl` = `http://localhost:8888/api`
   - `testWallet` = your wallet address
3. Run **"Connect Wallet"** request
4. Check Firebase Console → Firestore → `wallet_sessions`
5. You should see your wallet data saved! 🎉

### Using cURL:

```bash
# Connect wallet
curl -X POST http://localhost:8888/api/anonymous-auth \
  -H "Content-Type: application/json" \
  -d '{
    "walletAddress": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
    "chain": "ethereum"
  }'
```

Check Firebase Console - data should appear instantly!

## 💰 Cost (Free!)

Firebase Free Tier:
- ✅ 50,000 reads per day
- ✅ 20,000 writes per day  
- ✅ 1 GB storage
- ✅ 10 GB bandwidth/month

**For most apps, this is FREE forever!** 🎉

Example:
- 1,000 users × 20 operations/day = 20,000 operations
- Well within free tier ✅

## 🔧 Troubleshooting

### Error: "Firebase API Key and Project ID are required"

**Fix:** Check your `.env` file has both:
```env
FIREBASE_API_KEY=AIzaSy...
FIREBASE_PROJECT_ID=your-project-id
```

### Error: "PERMISSION_DENIED"

**Fix:** 
1. Check security rules are set correctly
2. Make sure you're calling from backend (not browser)
3. Verify API key is correct

### Still using in-memory?

Check console logs:
- ✅ Should see: `🔥 Using Firebase API Session Store`
- ❌ If you see: `⚠️ Using In-Memory Session Store`

Fix: Verify environment variables are loaded

### Data not persisting?

1. Check Firebase Console → Firestore
2. Look for `wallet_sessions` collection
3. If empty, check API key permissions
4. Try creating a test document manually

## 🔄 Switching Between Methods

### Use API Key (Recommended for most projects):
```env
FIREBASE_API_KEY=AIzaSy...
FIREBASE_PROJECT_ID=your-project-id
# Don't set FIREBASE_SERVICE_ACCOUNT
```

### Use Service Account (Enterprise/Advanced):
```env
FIREBASE_SERVICE_ACCOUNT={"type":"service_account",...}
# Don't set FIREBASE_API_KEY
```

### Use In-Memory (Development only):
```env
# Don't set any Firebase vars
```

## 📚 Next Steps

1. ✅ Import Postman collection
2. ✅ Test all endpoints
3. ✅ Deploy to Netlify
4. ✅ Monitor usage in Firebase Console

## 🆘 Need Help?

- [Firebase Documentation](https://firebase.google.com/docs/firestore)
- [Postman Collection](./Solsnipe_Backend_API.postman_collection.json)
- Check `STORAGE_SUMMARY.md` for detailed comparison

---

**Your data is now persistent and production-ready! 🚀**
