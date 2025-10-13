# 🎯 Solsnipe Backend - System Overview

## What You Have

A **production-ready** serverless backend system that uses **crypto wallet addresses** as unique user identifiers, with full balance management and transaction tracking capabilities.

---

## 🔑 Key Concepts

### 1. Wallet = User ID
Instead of traditional email/password:
- User connects their crypto wallet (MetaMask, WalletConnect, Phantom, etc.)
- Wallet address becomes their unique identifier
- Example: `0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb`

### 2. Sessions
- Each wallet address gets a persistent session
- Session stores balance, transactions, and metadata
- JWT tokens authenticate requests

### 3. Balance System
- Each wallet has a balance (starts at 0)
- **Credit**: Add funds (rewards, deposits, etc.)
- **Debit**: Subtract funds (purchases, fees, etc.)
- **Set**: Directly set balance (admin operations)

### 4. Transactions
- Every balance change is recorded
- Transaction types: `credit`, `debit`, `adjustment`
- Full history with timestamps, reasons, and metadata

---

## 📁 File Structure

```
SolsnipeBakend/
├── netlify/functions/          # All API endpoints
│   ├── utils/
│   │   ├── auth.js            # JWT & wallet validation
│   │   ├── response.js        # API response helpers  
│   │   └── sessionStore.js    # In-memory session storage
│   ├── anonymous-auth.js      # Connect wallet endpoint
│   ├── get-balance.js         # Get wallet balance
│   ├── credit-wallet.js       # Add funds
│   ├── debit-wallet.js        # Deduct funds
│   ├── set-balance.js         # Set balance directly
│   ├── get-transactions.js    # Transaction history
│   ├── verify-token.js        # Verify JWT
│   ├── refresh-token.js       # Refresh JWT
│   ├── get-session.js         # Get session data
│   ├── update-session.js      # Update session
│   └── delete-session.js      # Logout
├── public/
│   └── index.html             # API documentation page
├── test-api.js                # Automated test script
├── package.json               # Dependencies
├── netlify.toml               # Netlify config
├── .env.example               # Environment template
├── README.md                  # Full documentation
├── EXAMPLES.md                # Code examples
└── TESTING.md                 # Testing guide
```

---

## 🚀 API Endpoints Summary

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/anonymous-auth` | POST | Connect wallet & get token |
| `/api/get-balance` | GET | Get wallet balance |
| `/api/credit-wallet` | POST | Add funds |
| `/api/debit-wallet` | POST | Deduct funds |
| `/api/set-balance` | PUT | Set balance directly |
| `/api/get-transactions` | GET | Get transaction history |
| `/api/verify-token` | GET | Verify JWT token |
| `/api/refresh-token` | POST | Refresh access token |
| `/api/get-session` | GET | Get session data |
| `/api/update-session` | PUT | Update session metadata |
| `/api/delete-session` | DELETE | Logout/delete session |

---

## 💡 How It Works (User Flow)

```
1. User connects wallet (e.g., MetaMask)
   ↓
2. Frontend sends wallet address to /api/anonymous-auth
   ↓
3. Backend creates/retrieves session for that wallet
   ↓
4. Backend generates JWT token
   ↓
5. Frontend stores token & makes authenticated requests
   ↓
6. User performs actions (earn rewards, make purchases)
   ↓
7. Backend credits/debits their balance
   ↓
8. All transactions tracked in history
```

---

## 🎮 Real-World Use Cases

### Gaming Platform
```javascript
// User completes level → Credit reward
await creditWallet(50, 'Level 5 completed');

// User buys power-up → Debit cost
await debitWallet(30, 'Power-up purchase');
```

### DeFi/Trading
```javascript
// Track trading fees
await debitWallet(fee, 'Trading fee', { tradeAmount: 1000 });

// Distribute staking rewards
await creditWallet(reward, 'Staking reward', { apr: 5.5 });
```

### NFT Marketplace
```javascript
// User lists NFT → Deduct listing fee
await debitWallet(listingFee, 'NFT listing fee');

// NFT sells → Credit seller
await creditWallet(salePrice, 'NFT sale', { nftId: '123' });
```

### Social Platform
```javascript
// User tips content creator
await debitWallet(tipAmount, 'Tip to creator', { creatorId: 'abc' });
```

---

## 🔒 Security Features

✅ JWT-based authentication  
✅ Wallet address validation per chain  
✅ Balance checks prevent negative balances  
✅ CORS pre-configured  
✅ HTTPS (automatic on Netlify)  
✅ Token expiration & refresh  

---

## 🌐 Supported Blockchains

- **Ethereum** (and all EVM chains: Polygon, BSC, Avalanche, Arbitrum, Optimism)
- **Solana**
- **Bitcoin**
- Easily extensible for others

---

## 📊 Data Storage

**Current:** In-memory (development/testing)  
**Production:** Replace with database:
- MongoDB Atlas (recommended)
- PostgreSQL (Supabase/Neon)
- Redis (Upstash)
- FaunaDB

See `sessionStore.js` for integration point.

---

## 🚀 Quick Start

```bash
# Install
npm install

# Setup environment
copy .env.example .env
# Edit .env and add JWT_SECRET

# Start dev server
npm run dev

# Test all endpoints
npm test

# Deploy to Netlify
netlify login
netlify init
netlify env:set JWT_SECRET your-secret
netlify deploy --prod
```

---

## 🧪 Testing

### Automated Tests
```bash
npm test
```

### Manual Testing
See `TESTING.md` for PowerShell/cURL examples

### Frontend Examples
See `EXAMPLES.md` for JavaScript/React/Flutter code

---

## 📚 Documentation

- **README.md** - Full API documentation
- **EXAMPLES.md** - Frontend integration examples
- **TESTING.md** - Testing guide
- **index.html** - Beautiful web documentation

---

## 🎯 Next Steps

### For Development
1. Install dependencies: `npm install`
2. Set JWT secret in `.env`
3. Start server: `npm run dev`
4. Run tests: `npm test`

### For Production
1. Replace `sessionStore.js` with database
2. Set strong JWT secret
3. Deploy to Netlify
4. Monitor usage & performance

### For Integration
1. Check `EXAMPLES.md` for your framework
2. Implement wallet connection in frontend
3. Connect to API endpoints
4. Handle balance updates in UI

---

## 🤝 Support & Resources

- **API Docs:** Open `http://localhost:8888` after starting dev server
- **Testing Guide:** `TESTING.md`
- **Code Examples:** `EXAMPLES.md`
- **Full Docs:** `README.md`

---

## 🎉 What Makes This Special?

✅ **Wallet-First:** Built specifically for blockchain/Web3  
✅ **Battle-Tested:** Complete CRUD operations  
✅ **Developer-Friendly:** Extensive docs & examples  
✅ **Production-Ready:** Error handling, validation, security  
✅ **Serverless:** Zero infrastructure management  
✅ **Flexible:** Easy to extend & customize  

---

**Built for the future of Web3 applications! 🚀**
