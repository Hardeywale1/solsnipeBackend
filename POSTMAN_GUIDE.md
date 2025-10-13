# 📮 Postman Collection Guide

This guide explains how to use the Postman collection to test all Solsnipe Backend API endpoints.

## 📥 Import Collection

### Method 1: Import File
1. Open Postman
2. Click **"Import"** button
3. Select `Solsnipe_Backend_API.postman_collection.json`
4. Click **"Import"**

### Method 2: Drag & Drop
1. Open Postman
2. Drag `Solsnipe_Backend_API.postman_collection.json` into Postman window
3. Collection imported! ✅

## ⚙️ Configure Variables

After importing, configure these variables:

### Click on Collection → Variables tab:

| Variable | Current Value | Description |
|----------|---------------|-------------|
| `baseUrl` | `http://localhost:8888/api` | Local dev server |
| `productionUrl` | `https://your-site.netlify.app/api` | Production URL |
| `testWallet` | `0x742d35Cc...` | Test wallet address |
| `adminEmail` | `admin@solsnipe.com` | Your admin email |
| `adminPassword` | `your_password` | Your admin password |
| `superAdminApiKey` | `your_api_key` | Your super admin API key |
| `userToken` | (auto-filled) | User auth token |
| `adminToken` | (auto-filled) | Admin auth token |
| `refreshToken` | (auto-filled) | Refresh token |

**Important:** Update `testWallet`, `adminEmail`, `adminPassword`, and `superAdminApiKey` with your actual values!

## 🚀 Testing Workflow

### 1️⃣ User Flow (Wallet Authentication)

**Step 1: Connect Wallet**
- Open **"1. User Authentication" → "Connect Wallet (Ethereum)"**
- Click **"Send"**
- ✅ Token automatically saved to `{{userToken}}`

**Step 2: Get Balance**
- Open **"3. Wallet Balance" → "Get Balance"**
- Click **"Send"**
- See your current balance

**Step 3: View Transactions**
- Open **"3. Wallet Balance" → "Get Transactions"**
- Click **"Send"**
- See transaction history

### 2️⃣ Admin Flow (Balance Management)

**Step 1: Admin Login**
- Open **"2. Admin Authentication" → "Admin Login"**
- Update `adminEmail` and `adminPassword` variables first!
- Click **"Send"**
- ✅ Admin token automatically saved to `{{adminToken}}`

**Step 2: Credit a Wallet**
- Open **"4. Admin - Balance Management (Token Auth)" → "Credit Wallet (Admin Token)"**
- Update `walletAddress` in body if needed
- Click **"Send"**
- ✅ Wallet credited!

**Step 3: Check Updated Balance**
- Go back to **"Get Balance"** request
- Click **"Send"**
- See updated balance ✅

### 3️⃣ Admin API Key Flow (Backend Services)

**Step 1: Set API Key**
- Update `superAdminApiKey` variable
- No login required!

**Step 2: Credit with API Key**
- Open **"5. Admin - Balance Management (API Key)" → "Credit Wallet (API Key)"**
- Click **"Send"**
- ✅ Works without login!

## 📂 Collection Structure

```
Solsnipe Backend API
├─ 1. User Authentication
│  ├─ Connect Wallet (Ethereum)
│  ├─ Connect Wallet (Solana)
│  ├─ Verify Token
│  └─ Refresh Token
│
├─ 2. Admin Authentication
│  └─ Admin Login
│
├─ 3. Wallet Balance
│  ├─ Get Balance
│  └─ Get Transactions
│
├─ 4. Admin - Balance Management (Token Auth)
│  ├─ Credit Wallet (Admin Token)
│  ├─ Debit Wallet (Admin Token)
│  └─ Set Balance (Admin Token)
│
├─ 5. Admin - Balance Management (API Key)
│  ├─ Credit Wallet (API Key)
│  ├─ Debit Wallet (API Key)
│  └─ Set Balance (API Key)
│
├─ 6. Session Management
│  ├─ Get Session
│  ├─ Update Session
│  └─ Delete Session
│
└─ 7. Error Cases & Testing
   ├─ Unauthorized Credit (No Auth)
   ├─ Insufficient Balance Debit
   └─ Invalid Wallet Address
```

## 🎯 Common Test Scenarios

### Scenario 1: New User Journey
1. **Connect Wallet** → Gets user token
2. **Get Balance** → Shows 0
3. **Admin Login** → Gets admin token
4. **Credit Wallet** → Adds 500
5. **Get Balance** → Shows 500
6. **Get Transactions** → See credit transaction

### Scenario 2: Admin Management
1. **Admin Login** → Authenticate
2. **Credit Wallet** → Add funds
3. **Debit Wallet** → Remove funds
4. **Set Balance** → Direct adjustment
5. Check user's **Get Transactions** → See all admin operations with admin attribution

### Scenario 3: Error Testing
1. **Unauthorized Credit** → Should get 403 error
2. **Insufficient Balance Debit** → Should get 400 error
3. **Invalid Wallet** → Should get 400 error

## 🔑 Authentication Explained

### User Token (Bearer)
```
Authorization: Bearer {{userToken}}
```
- Used by: Regular users
- Expires: 30 days
- Can: View balance, transactions, update session
- Cannot: Credit/debit balances

### Admin Token (Bearer)
```
Authorization: Bearer {{adminToken}}
```
- Used by: Admins via dashboard
- Expires: 24 hours
- Can: All user actions + credit/debit/set balance
- Requires: Login with email/password

### Admin API Key
```
X-API-Key: {{superAdminApiKey}}
```
- Used by: Backend services
- Expires: Never (until rotated)
- Can: All admin operations
- Requires: No login (just the key)

## 📊 Response Examples

### Successful Response
```json
{
  "success": true,
  "data": {
    "walletAddress": "0x742d35cc...",
    "balance": 1000,
    "previousBalance": 500,
    "newBalance": 1000,
    "creditedBy": "admin@solsnipe.com",
    "timestamp": "2025-10-11T12:00:00.000Z"
  }
}
```

### Error Response
```json
{
  "success": false,
  "error": "Unauthorized. Admin access required.",
  "timestamp": "2025-10-11T12:00:00.000Z"
}
```

## 🧪 Testing Tips

### 1. Use Environment Switcher
- Create separate environments for:
  - **Local** (`http://localhost:8888/api`)
  - **Staging** (`https://staging.netlify.app/api`)
  - **Production** (`https://your-site.netlify.app/api`)

### 2. Use Pre-request Scripts
Some requests automatically save tokens in variables. Check the **Tests** tab to see the scripts.

### 3. Use Collection Runner
1. Click **"Run collection"**
2. Select all requests
3. Click **"Run"**
4. See all tests execute in sequence

### 4. Monitor Responses
- Check **Status** (should be 200, 201)
- Check **Time** (should be < 1000ms)
- Check **Size** (response body size)

### 5. Save Requests
After editing a request, click **"Save"** to persist changes.

## 🔄 Environment Setup

### Local Development
```
baseUrl: http://localhost:8888/api
```

Run: `netlify dev`

### Production
```
baseUrl: https://your-site.netlify.app/api
```

Update variable and test!

## 📝 Variable Auto-Population

These requests automatically update variables:

1. **Connect Wallet** → Sets `userToken` and `refreshToken`
2. **Admin Login** → Sets `adminToken`

Check the **Tests** tab in each request to see the script.

## 🐛 Troubleshooting

### "Unauthorized" Error
- Check token is set in variable
- Token might be expired (re-login)
- Using wrong auth method (Bearer vs API Key)

### "Wallet not found" Error
- Wallet hasn't connected yet
- Run **Connect Wallet** first
- Check `testWallet` variable is correct

### "Insufficient balance" Error
- Wallet balance is too low
- Credit wallet first as admin
- Check current balance

### "Invalid token" Error
- Token expired
- Token corrupted
- Re-login to get fresh token

### Connection Refused
- Server not running
- Check `baseUrl` is correct
- Run `netlify dev` for local testing

## 📚 Additional Resources

- **API Documentation**: `README.md`
- **Setup Guide**: `FIREBASE_API_KEY_SETUP.md`
- **Admin Guide**: `ADMIN_SETUP.md`
- **Examples**: `EXAMPLES.md`

## 💡 Pro Tips

1. **Save Responses** - Click "Save Response" for documentation
2. **Use Tests** - Add assertions in Tests tab
3. **Organize** - Create folders for different test scenarios
4. **Document** - Add descriptions to each request
5. **Share** - Export and share with team

## 🎉 Quick Start Checklist

- [ ] Import collection to Postman
- [ ] Update variables (wallet, admin credentials)
- [ ] Start local server (`netlify dev`)
- [ ] Test **Connect Wallet**
- [ ] Test **Admin Login**
- [ ] Test **Credit Wallet**
- [ ] Test **Get Balance**
- [ ] Check Firebase Console for data

---

**Happy Testing! 🚀**
