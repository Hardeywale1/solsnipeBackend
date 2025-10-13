# 📮 Postman Collection Guide - Seed Wallet API

Complete guide for testing the Solsnipe Seed Wallet API with Postman.

## 📦 Files Included

1. **Solsnipe_Seed_Wallet_API.postman_collection.json** - Main API collection
2. **Solsnipe_Local.postman_environment.json** - Local development environment
3. **Solsnipe_Production.postman_environment.json** - Production environment

---

## 🚀 Quick Start

### Step 1: Import Collection and Environments

1. Open **Postman**
2. Click **Import** button (top left)
3. Drag and drop all 3 JSON files:
   - `Solsnipe_Seed_Wallet_API.postman_collection.json`
   - `Solsnipe_Local.postman_environment.json`
   - `Solsnipe_Production.postman_environment.json`
4. Click **Import**

### Step 2: Select Environment

**For Local Testing:**
1. Click environment dropdown (top right)
2. Select **"Solsnipe Local Development"**
3. Verify `baseUrl` is `http://localhost:8888/api`

**For Production Testing:**
1. Select **"Solsnipe Production"**
2. Update `baseUrl` with your Netlify URL:
   - Click environment name → Edit
   - Change `baseUrl` to: `https://your-site.netlify.app/api`
   - Save

### Step 3: Start Local Server (if testing locally)

```bash
cd SolsnipeBakend
netlify dev
```

Wait for: `Server now ready on http://localhost:8888`

### Step 4: Run Requests

Navigate through the collection folders:
- **User Endpoints** - Wallet connection and balance queries
- **Admin Endpoints** - Admin authentication and balance management
- **Error Cases** - Test error handling

---

## 📋 Collection Structure

### 1️⃣ User Endpoints (5 requests)

#### 1. Connect Wallet (Seed Phrase - New User)
- **Purpose:** Create a new wallet from BIP39 seed phrase
- **Auto-saves:** `userToken` and `testWalletAddress` for subsequent requests
- **Test seed:** `abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about`

#### 2. Connect Wallet (Seed Phrase - Returning User)
- **Purpose:** Test deterministic wallet generation (same seed = same wallet)
- **Expected:** `isNewWallet: false`, `loginCount > 1`

#### 3. Connect Wallet (Custom Passphrase)
- **Purpose:** Test passphrase-based wallet generation
- **Uses:** PBKDF2 derivation instead of BIP39

#### 4. Connect Wallet (Solflare - Different Wallet Type)
- **Purpose:** Test different wallet type support
- **Wallet types:** phantom, solflare, backpack, walletconnect, ledger

#### 5. Get Balance (Authenticated)
- **Purpose:** Fetch real Solana balance from blockchain
- **Requires:** User JWT token (auto-set from request #1)
- **Returns:** Balance in SOL, transaction history

---

### 2️⃣ Admin Endpoints (3 requests)

#### 1. Admin Login
- **Purpose:** Authenticate as admin
- **Auto-saves:** `adminToken` for subsequent requests
- **Default credentials:**
  - Username: `admin`
  - Password: `admin123`
  - API Key: `super-secret-admin-key`
- **⚠️ IMPORTANT:** Change these in your `.env` file!

#### 2. Credit Wallet (Admin Only)
- **Purpose:** Add SOL to wallet balance
- **Requires:** Admin JWT token
- **Uses:** `{{testWalletAddress}}` from user login
- **Logs:** Operation saved to Firebase `admin_operations` collection

#### 3. Credit Wallet (Specific Address)
- **Purpose:** Credit a specific wallet address
- **Replace:** `walletAddress` with actual address from your system

---

### 3️⃣ Error Cases (6 requests)

Tests validation and error handling:
- Invalid seed phrase (wrong word count)
- Invalid BIP39 words
- Missing authentication token
- User token on admin endpoint
- Wrong admin credentials
- Missing required fields

---

## 🧪 Testing Workflow

### Complete Test Flow (Run in Order)

1. **User Endpoints → 1. Connect Wallet (Seed Phrase - New User)**
   - Creates new wallet
   - Saves `userToken` and `testWalletAddress`
   - ✅ Check: `isNewWallet: true`, `loginCount: 1`

2. **User Endpoints → 2. Connect Wallet (Seed Phrase - Returning User)**
   - Same seed, should retrieve existing wallet
   - ✅ Check: `isNewWallet: false`, `loginCount: 2`

3. **User Endpoints → 5. Get Balance (Authenticated)**
   - Fetches balance using saved `userToken`
   - ✅ Check: Balance in SOL, wallet address matches

4. **Admin Endpoints → 1. Admin Login**
   - Authenticates as admin
   - Saves `adminToken`
   - ✅ Check: `role: 'super_admin'`, token received

5. **Admin Endpoints → 2. Credit Wallet (Admin Only)**
   - Credits wallet using `testWalletAddress`
   - ✅ Check: `newBalance > previousBalance`

6. **User Endpoints → 5. Get Balance (Authenticated)** (again)
   - Verify credited amount appears
   - ✅ Check: Balance increased by credit amount

---

## 🔐 Authentication Flow

### User Authentication
```
1. POST /wallet-connect
   Body: { walletName, walletType, inputType, credentials }
   
2. Response includes JWT token
   
3. Token auto-saved to {{userToken}}
   
4. Use token in Authorization header:
   Authorization: Bearer {{userToken}}
```

### Admin Authentication
```
1. POST /admin-login
   Body: { username, password, apiKey }
   
2. Response includes admin JWT token
   
3. Token auto-saved to {{adminToken}}
   
4. Use token in Authorization header:
   Authorization: Bearer {{adminToken}}
```

---

## 🌐 BIP39 Seed Phrases for Testing

### Valid Test Seeds (12 words)
```
abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about
```

```
waste urban wealth drip lizard work clog cycle motor bamboo good rebel
```

### Valid Test Seeds (24 words)
```
abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon art
```

### Generate Your Own
Use: https://iancoleman.io/bip39/
- Select **12 or 24 words**
- Click **Generate**
- Copy mnemonic

⚠️ **NEVER use real seed phrases in testing!**

---

## 🐛 Troubleshooting

### Issue: "Could not send request"

**Solution:**
- Ensure local server is running: `netlify dev`
- Check `baseUrl` in environment settings
- Verify port is `8888` (Netlify default)

### Issue: "Invalid or expired token"

**Solution:**
- Tokens expire (user: 30d, admin: 24h)
- Re-run login requests to get fresh tokens
- Check environment has saved tokens

### Issue: "Wallet not found" in credit endpoint

**Solution:**
- Ensure you've connected a wallet first
- Check `{{testWalletAddress}}` variable is set
- Or manually enter a valid wallet address

### Issue: Admin login fails

**Solution:**
- Verify credentials match `.env` file:
  - `ADMIN_USERNAME`
  - `ADMIN_PASSWORD`
  - `ADMIN_API_KEY`
- Check for typos in request body

---

## 🎯 Tips for Effective Testing

1. **Run requests in order** - Later requests depend on earlier ones (tokens, addresses)
2. **Check console** - Test scripts log helpful debugging info
3. **Watch environment** - Variables update automatically
4. **Use test seeds** - Don't risk real funds
5. **Test error cases** - Ensure proper validation
6. **Compare balances** - Verify credit/debit operations

---

**Happy Testing! 🚀**

See `README_NEW.md` for complete API documentation.
