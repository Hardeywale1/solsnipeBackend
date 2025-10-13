# 🚀 Solsnipe Backend - Seed Phrase Wallet System

A complete serverless backend for Solana wallet management with **seed phrase-based authentication**. Built for Netlify Functions with Firebase storage and deterministic wallet generation.

## 🎯 Overview

This backend system enables users to:
- **Generate Solana wallets** from seed phrases (12/24 words) or custom passphrases
- **Authenticate** using their seed phrase (same seed = same wallet address every time)
- **Fetch real-time balance** from Solana blockchain
- **Admin control** for balance management (credit/debit operations)

### Key Features

✅ **Non-Custodial Wallet Generation**
- BIP39 seed phrase support (12 or 24 words)
- Custom passphrase support
- Deterministic wallet derivation (BIP44 paths)
- Never stores seed phrases (only hashed for lookup)

✅ **Multi-Wallet Type Support**
- Solflare
- Phantom
- Backpack
- WalletConnect
- Ledger
- Other

✅ **Solana Blockchain Integration**
- Real-time balance fetching
- Transaction history
- Devnet/Testnet/Mainnet support
- Custom RPC endpoints (QuickNode, Helius, etc.)

✅ **Admin System**
- Username/password + API key authentication
- Credit/debit wallet operations
- Balance management
- Operation logging in Firebase

✅ **Firebase Storage**
- Persistent wallet data
- Transaction history
- Admin operation logs
- Auto-switching between API Key and Service Account methods

## 📁 Project Structure

```
SolsnipeBakend/
├── netlify/
│   └── functions/
│       ├── wallet-connect.js          # Main wallet connection endpoint
│       ├── get-balance.js             # Get wallet balance
│       ├── admin-login.js             # Admin authentication
│       ├── credit-wallet.js           # Admin: credit wallet
│       ├── debit-wallet.js            # Admin: debit wallet (TODO)
│       └── utils/
│           ├── walletGenerator.js     # Seed phrase → wallet generation
│           ├── solanaRPC.js           # Solana blockchain interaction
│           ├── firebaseWalletStore.js # Firebase storage
│           └── auth.js                # JWT utilities
├── package.json
├── .env.example                       # Environment variables template
└── README.md                          # This file
```

## 🛠️ Installation

### 1. Clone and Install Dependencies

```bash
cd SolsnipeBakend
npm install
```

### 2. Configure Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

**Required Variables:**

```env
# JWT Secret (generate a strong random string)
JWT_SECRET=your-super-secret-jwt-key-change-this

# Firebase Configuration
FIREBASE_PROJECT_ID=your-firebase-project-id
FIREBASE_API_KEY=your-firebase-api-key

# Admin Credentials
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your-secure-password
ADMIN_API_KEY=your-admin-api-key

# Solana Network (MAINNET, DEVNET, or TESTNET)
SOLANA_NETWORK=DEVNET
```

### 3. Set Up Firebase

1. Create a Firebase project at https://console.firebase.google.com
2. Go to **Project Settings** → **General**
3. Copy your **Project ID** and **Web API Key**
4. Enable **Firestore Database** in Firebase Console

### 4. Deploy to Netlify

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login to Netlify
netlify login

# Deploy
netlify deploy --prod
```

## 📡 API Endpoints

### 1. **Connect Wallet** (User Authentication)

Generate or retrieve wallet using seed phrase/passphrase.

**Endpoint:** `POST /api/wallet-connect`

**Request Body:**
```json
{
  "walletName": "MyWallet",
  "walletType": "phantom",
  "inputType": "seed_phrase",
  "credentials": "your twelve word seed phrase goes here like this example",
  "accountIndex": 0
}
```

**Response:**
```json
{
  "success": true,
  "message": "Wallet connected successfully",
  "isNewWallet": false,
  "wallet": {
    "walletId": "unique-wallet-id",
    "walletAddress": "5vK8F...xyz123",
    "walletType": "phantom",
    "balance": 1.25,
    "balanceLastUpdated": "2025-10-11T12:00:00.000Z",
    "recentTransactions": [...],
    "loginCount": 5
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": "30d"
}
```

**Supported Wallet Types:**
- `solflare`
- `phantom`
- `backpack`
- `walletconnect`
- `ledger`
- `other`

**Supported Input Types:**
- `seed_phrase` - BIP39 mnemonic (12 or 24 words)
- `passphrase` - Custom passphrase (min 8 characters)

---

### 2. **Get Balance** (Authenticated User)

Fetch current Solana balance for authenticated wallet.

**Endpoint:** `GET /api/get-balance`

**Headers:**
```
Authorization: Bearer <user-jwt-token>
```

**Response:**
```json
{
  "success": true,
  "wallet": {
    "walletId": "unique-wallet-id",
    "walletAddress": "5vK8F...xyz123",
    "balance": 1.25,
    "balanceLamports": 1250000000,
    "currency": "SOL",
    "network": "DEVNET",
    "walletType": "phantom",
    "lastUpdated": "2025-10-11T12:00:00.000Z"
  }
}
```

---

### 3. **Admin Login**

Authenticate as admin to perform balance operations.

**Endpoint:** `POST /api/admin-login`

**Request Body:**
```json
{
  "username": "admin",
  "password": "your-admin-password",
  "apiKey": "your-admin-api-key"
}
```

**Response:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "adminId": "admin",
  "role": "super_admin",
  "expiresIn": "24h",
  "loginAt": "2025-10-11T12:00:00.000Z"
}
```

---

### 4. **Credit Wallet** (Admin Only)

Add SOL to a wallet balance.

**Endpoint:** `POST /api/credit-wallet`

**Headers:**
```
Authorization: Bearer <admin-jwt-token>
```

**Request Body:**
```json
{
  "walletAddress": "5vK8F...xyz123",
  "amount": 10.5
}
```

**Response:**
```json
{
  "success": true,
  "message": "Wallet credited successfully",
  "walletAddress": "5vK8F...xyz123",
  "previousBalance": 1.25,
  "creditAmount": 10.5,
  "newBalance": 11.75,
  "adminId": "admin",
  "timestamp": "2025-10-11T12:00:00.000Z"
}
```

---

## 🔐 Security Features

### Seed Phrase Protection

1. **Never Stored in Plaintext**
   - Seed phrases are NEVER saved to database
   - Only SHA-256 hash stored for lookup
   - Hash is one-way (cannot reverse to get seed)

2. **Deterministic Generation**
   - Same seed phrase → same wallet address (every time)
   - BIP39/BIP44 standard derivation paths
   - Compatible with all major Solana wallets

3. **Secure Authentication**
   - User provides seed phrase → system generates wallet
   - Wallet address verified against blockchain
   - JWT token issued for authenticated sessions

### Admin Protection

1. **Triple Authentication**
   - Username + Password + API Key required
   - JWT tokens expire after 24 hours
   - Rate limiting on login attempts (1-second delay on failure)

2. **Operation Logging**
   - All admin operations logged to Firebase
   - Includes: wallet address, admin ID, operation type, amount, timestamp

## 🧪 Testing with Postman

### Test Wallet Connection

1. **Generate a Test Seed Phrase**
   ```javascript
   // Use BIP39 library or an online tool
   // Example 12-word seed:
   "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about"
   ```

2. **Connect Wallet**
   - Method: `POST`
   - URL: `https://your-netlify-site.netlify.app/api/wallet-connect`
   - Body:
     ```json
     {
       "walletName": "TestWallet",
       "walletType": "phantom",
       "inputType": "seed_phrase",
       "credentials": "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about"
     }
     ```

3. **Get Balance**
   - Method: `GET`
   - URL: `https://your-netlify-site.netlify.app/api/get-balance`
   - Headers:
     ```
     Authorization: Bearer <token-from-wallet-connect>
     ```

## 🌐 Solana Network Configuration

### Using Public RPC (Default)

The system uses free public Solana RPC endpoints:

- **Devnet:** `https://api.devnet.solana.com`
- **Testnet:** `https://api.testnet.solana.com`
- **Mainnet:** `https://api.mainnet-beta.solana.com`

⚠️ **Note:** Public endpoints have rate limits and may be slow.

### Using Custom RPC (Recommended for Production)

For better performance and reliability, use a dedicated RPC provider:

**QuickNode:**
```env
QUICKNODE_RPC_URL=https://your-endpoint.solana-mainnet.quiknode.pro/your-key/
SOLANA_NETWORK=QUICKNODE
```

**Helius:**
```env
HELIUS_RPC_URL=https://rpc.helius.xyz/?api-key=your-api-key
SOLANA_NETWORK=HELIUS
```

## 📊 Firebase Data Structure

### Wallets Collection

```javascript
{
  "walletId": "unique-uuid",
  "walletAddress": "5vK8F...xyz123",
  "seedHash": "sha256-hash-of-seed",
  "walletType": "phantom",
  "inputType": "seed_phrase",
  "derivationPath": "m/44'/501'/0'/0'",
  "accountIndex": 0,
  "blockchain": "solana",
  "balance": 1.25,
  "balanceLastUpdated": "2025-10-11T12:00:00.000Z",
  "transactions": ["sig1", "sig2", ...],
  "createdAt": "2025-10-01T10:00:00.000Z",
  "lastLoginAt": "2025-10-11T12:00:00.000Z",
  "loginCount": 5
}
```

### Admin Operations Collection

```javascript
{
  "operationId": "unique-id",
  "walletAddress": "5vK8F...xyz123",
  "adminId": "admin",
  "operation": "credit",
  "amount": 10.5,
  "timestamp": "2025-10-11T12:00:00.000Z"
}
```

## 🚨 Important Notes

### ⚠️ Development vs Production

**Development (Current Setup):**
- Uses Solana **Devnet** (test network)
- Balances are not real SOL
- Free public RPC endpoints

**Production (Recommended Changes):**
1. Change `SOLANA_NETWORK=MAINNET`
2. Use paid RPC provider (QuickNode/Helius)
3. Update `JWT_SECRET` to strong random value
4. Change all admin credentials
5. Enable Firebase security rules

### 🔒 Security Checklist

- [ ] Changed `JWT_SECRET` to strong random string
- [ ] Changed `ADMIN_PASSWORD` from default
- [ ] Changed `ADMIN_API_KEY` from default
- [ ] Configured Firebase security rules
- [ ] Using HTTPS in production
- [ ] Never log seed phrases in code
- [ ] Rate limiting enabled
- [ ] Using custom RPC for production

## 📚 Additional Resources

- [Solana Web3.js Docs](https://solana-labs.github.io/solana-web3.js/)
- [BIP39 Specification](https://github.com/bitcoin/bips/blob/master/bip-0039.mediawiki)
- [BIP44 Specification](https://github.com/bitcoin/bips/blob/master/bip-0044.mediawiki)
- [Firebase Firestore Docs](https://firebase.google.com/docs/firestore)
- [Netlify Functions Docs](https://docs.netlify.com/functions/overview/)

## 🆘 Support

If you encounter issues:

1. Check `.env` configuration
2. Verify Firebase setup
3. Test with Solana Devnet first
4. Check Netlify function logs
5. Ensure all dependencies are installed

## 📝 License

MIT License - See LICENSE file for details

---

**Built with ❤️ for Solana developers**
