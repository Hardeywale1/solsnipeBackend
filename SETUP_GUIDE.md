# 🚀 Quick Setup Guide - Solsnipe Wallet Backend

Follow these steps to get your seed phrase-based wallet backend running.

## Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Firebase account
- Netlify account (for deployment)

---

## Step 1: Install Dependencies

```bash
cd SolsnipeBakend
npm install
```

This will install:
- `jsonwebtoken` - JWT authentication
- `@solana/web3.js` - Solana blockchain interaction
- `bip39` - Seed phrase generation/validation
- `ed25519-hd-key` - HD wallet derivation
- `tweetnacl` - Cryptographic operations
- `bs58` - Base58 encoding

---

## Step 2: Configure Environment Variables

### Create .env file

```bash
cp .env.example .env
```

### Edit .env with your values

```env
# 1. Generate a secure JWT secret
# Run: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
JWT_SECRET=paste-generated-secret-here

# 2. Firebase Configuration
FIREBASE_PROJECT_ID=your-firebase-project-id
FIREBASE_API_KEY=your-firebase-api-key

# 3. Admin Credentials (CHANGE THESE!)
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your-secure-password
ADMIN_API_KEY=your-admin-api-key

# 4. Solana Network
SOLANA_NETWORK=DEVNET
```

---

## Step 3: Set Up Firebase

### 3.1 Create Firebase Project

1. Go to https://console.firebase.google.com
2. Click **Add Project**
3. Enter project name (e.g., "solsnipe-backend")
4. Disable Google Analytics (optional)
5. Click **Create Project**

### 3.2 Get Firebase Credentials

1. Go to **Project Settings** (gear icon)
2. Copy **Project ID** → paste in `.env` as `FIREBASE_PROJECT_ID`
3. Scroll to **Web API Key** → paste in `.env` as `FIREBASE_API_KEY`

### 3.3 Enable Firestore Database

1. In Firebase Console, go to **Firestore Database**
2. Click **Create Database**
3. Select **Start in production mode** (we'll add rules later)
4. Choose a location (e.g., `us-central1`)
5. Click **Enable**

### 3.4 Configure Firestore Rules

In Firestore → Rules tab, paste:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow backend service to read/write everything
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

⚠️ **Note:** These rules allow all access. For production, restrict to your Netlify domain.

---

## Step 4: Test Locally with Netlify Dev

### 4.1 Install Netlify CLI

```bash
npm install -g netlify-cli
```

### 4.2 Run Development Server

```bash
netlify dev
```

This starts a local server at `http://localhost:8888`

### 4.3 Test Wallet Connection

Using curl or Postman:

```bash
curl -X POST http://localhost:8888/api/wallet-connect \
  -H "Content-Type: application/json" \
  -d '{
    "walletName": "TestWallet",
    "walletType": "phantom",
    "inputType": "seed_phrase",
    "credentials": "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about"
  }'
```

Expected response:
```json
{
  "success": true,
  "message": "New wallet created successfully",
  "isNewWallet": true,
  "wallet": {
    "walletId": "...",
    "walletAddress": "...",
    "balance": 0,
    ...
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

---

## Step 5: Deploy to Netlify

### 5.1 Login to Netlify

```bash
netlify login
```

This opens a browser for authentication.

### 5.2 Initialize Site

```bash
netlify init
```

Follow prompts:
- **Create & configure a new site**
- Choose team
- Enter site name (e.g., `solsnipe-backend`)
- Build command: (leave empty)
- Publish directory: (leave empty)

### 5.3 Configure Environment Variables in Netlify

```bash
# Set all environment variables
netlify env:set JWT_SECRET "your-secret"
netlify env:set FIREBASE_PROJECT_ID "your-project-id"
netlify env:set FIREBASE_API_KEY "your-api-key"
netlify env:set ADMIN_USERNAME "admin"
netlify env:set ADMIN_PASSWORD "your-password"
netlify env:set ADMIN_API_KEY "your-api-key"
netlify env:set SOLANA_NETWORK "DEVNET"
```

**OR** use Netlify UI:
1. Go to https://app.netlify.com
2. Select your site
3. Go to **Site Settings** → **Environment Variables**
4. Add each variable manually

### 5.4 Deploy

```bash
netlify deploy --prod
```

Your backend is now live! 🎉

Netlify will give you a URL like: `https://solsnipe-backend.netlify.app`

---

## Step 6: Test Production Deployment

### Test Wallet Connection

```bash
curl -X POST https://your-site.netlify.app/api/wallet-connect \
  -H "Content-Type: application/json" \
  -d '{
    "walletName": "ProductionWallet",
    "walletType": "phantom",
    "inputType": "seed_phrase",
    "credentials": "your twelve word seed phrase here"
  }'
```

### Test Admin Login

```bash
curl -X POST https://your-site.netlify.app/api/admin-login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "your-admin-password",
    "apiKey": "your-admin-api-key"
  }'
```

---

## Step 7: Verify Firebase Data

1. Go to Firebase Console → **Firestore Database**
2. You should see collections:
   - `wallets` - User wallet data
   - `admin_operations` - Admin operation logs

---

## Common Issues & Solutions

### Issue: "Invalid Firebase credentials"

**Solution:** 
- Verify `FIREBASE_PROJECT_ID` and `FIREBASE_API_KEY` in `.env`
- Check Firebase Console → Project Settings

### Issue: "Wallet not found" after connection

**Solution:**
- Check Firestore rules allow write access
- Verify Firebase API key is correct
- Check Netlify function logs for errors

### Issue: "Invalid seed phrase"

**Solution:**
- Ensure seed phrase is exactly 12 or 24 words
- Words must be valid BIP39 words
- Use lowercase, space-separated

### Issue: Netlify function timeout

**Solution:**
- Default timeout is 10 seconds
- For slow RPC connections, use custom RPC provider (QuickNode/Helius)
- Check Solana network status

---

## Next Steps

✅ **Setup Complete!** Your backend is running.

Now you can:

1. **Integrate with Frontend**
   - Use wallet-connect endpoint for user login
   - Store JWT token in localStorage
   - Use get-balance endpoint with token

2. **Set Up Admin Dashboard**
   - Create admin UI for credit/debit operations
   - Use admin-login endpoint
   - Build balance management interface

3. **Production Hardening**
   - Switch to `SOLANA_NETWORK=MAINNET`
   - Use paid RPC provider (QuickNode recommended)
   - Enable rate limiting
   - Add Firebase security rules
   - Set up monitoring/logging

4. **Add Features**
   - Transaction history endpoint
   - Wallet transfer functionality
   - Multi-token support (SPL tokens)
   - NFT balance queries

---

## Support Resources

- **Netlify Functions Logs:** `netlify functions:log`
- **Firebase Console:** https://console.firebase.google.com
- **Solana Explorer (Devnet):** https://explorer.solana.com/?cluster=devnet
- **Test Seed Phrase Generator:** https://iancoleman.io/bip39/

---

**Need Help?** Check the main README.md for detailed API documentation.
