# 👑 Admin System Setup Guide

This guide explains how to set up and use the super admin system for controlling wallet balances.

## 🎯 What Changed?

Previously, users could credit/debit their own wallets. Now, **only authorized administrators** can modify balances. This provides:

- ✅ **Better security** - Prevents unauthorized balance manipulation
- ✅ **Full audit trail** - Every operation tracked with admin attribution
- ✅ **Centralized control** - Admins manage all balance operations
- ✅ **Flexible auth** - Login with email/password OR use API keys

## 🔧 Environment Setup

### 1. Configure Environment Variables

Create/update your `.env` file with these required variables:

```env
# Required for all JWT operations
JWT_SECRET=your_very_secure_random_string_here

# Admin authentication credentials
ADMIN_EMAIL=admin@solsnipe.com
ADMIN_PASSWORD=your_secure_admin_password_here

# Optional: For service-to-service communication
SUPER_ADMIN_API_KEY=your_super_admin_api_key_here
```

### 2. Generate Secure Values

**JWT_SECRET:**
```bash
# Generate a random 32-byte hex string
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**SUPER_ADMIN_API_KEY:**
```bash
# Generate a random API key
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

**ADMIN_PASSWORD:**
- Use a strong password (12+ characters)
- Include uppercase, lowercase, numbers, and symbols
- Consider using a password manager

### 3. Deploy to Netlify

**Option A: Netlify CLI**
```bash
netlify env:set JWT_SECRET "your_jwt_secret"
netlify env:set ADMIN_EMAIL "admin@solsnipe.com"
netlify env:set ADMIN_PASSWORD "your_password"
netlify env:set SUPER_ADMIN_API_KEY "your_api_key"
```

**Option B: Netlify Dashboard**
1. Go to Site settings → Environment variables
2. Add each variable with its value
3. Redeploy your site

## 🚀 Usage

### Admin Login

**Endpoint:** `POST /api/admin/login`

**Request:**
```json
{
  "email": "admin@solsnipe.com",
  "password": "your_password"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "email": "admin@solsnipe.com",
    "role": "admin",
    "expiresIn": "24 hours",
    "loginAt": "2025-10-11T12:00:00.000Z"
  }
}
```

**Token expiration:** 24 hours (more restrictive than user tokens for security)

### Credit Wallet

**Endpoint:** `POST /api/credit-wallet`

**Headers:**
```
Authorization: Bearer <admin-token>
OR
X-API-Key: <super-admin-api-key>
```

**Request:**
```json
{
  "walletAddress": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
  "amount": 100,
  "reason": "Reward for completing task",
  "metadata": { "taskId": "123" }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "walletAddress": "0x742d35cc6634c0532925a3b844bc9e7595f0beb",
    "previousBalance": 0,
    "amount": 100,
    "newBalance": 100,
    "creditedBy": "admin@solsnipe.com",
    "transactionId": "uuid",
    "reason": "Reward for completing task",
    "timestamp": "2025-10-11T12:00:00.000Z"
  }
}
```

### Debit Wallet

**Endpoint:** `POST /api/debit-wallet`

**Headers:**
```
Authorization: Bearer <admin-token>
OR
X-API-Key: <super-admin-api-key>
```

**Request:**
```json
{
  "walletAddress": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
  "amount": 50,
  "reason": "Purchase item"
}
```

### Set Balance

**Endpoint:** `PUT /api/set-balance`

**Headers:**
```
Authorization: Bearer <admin-token>
OR
X-API-Key: <super-admin-api-key>
```

**Request:**
```json
{
  "walletAddress": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
  "balance": 1000,
  "reason": "Admin adjustment"
}
```

## 🔑 Authentication Methods

### Method 1: Email/Password (Interactive Admin Panel)

**Best for:** Admin dashboard, manual operations

**Flow:**
1. Admin logs in via `/api/admin/login`
2. Receives JWT token (valid 24h)
3. Uses token in `Authorization: Bearer <token>` header
4. Token expires after 24 hours

**Example:**
```javascript
// Login
const loginResponse = await fetch('/api/admin/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'admin@solsnipe.com',
    password: 'your_password'
  })
});

const { token } = (await loginResponse.json()).data;

// Use token
await fetch('/api/credit-wallet', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    walletAddress: '0x742d35Cc...',
    amount: 100,
    reason: 'Reward'
  })
});
```

### Method 2: API Key (Backend Services)

**Best for:** Automated systems, backend services, cron jobs

**Flow:**
1. Configure `SUPER_ADMIN_API_KEY` in environment
2. Use key in `X-API-Key` header
3. No expiration (until key is rotated)

**Example:**
```javascript
// No login needed
await fetch('/api/credit-wallet', {
  method: 'POST',
  headers: {
    'X-API-Key': process.env.SUPER_ADMIN_API_KEY,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    walletAddress: '0x742d35Cc...',
    amount: 100,
    reason: 'Automated reward'
  })
});
```

## 📊 Transaction Tracking

All admin operations are tracked in transaction records:

```json
{
  "id": "uuid",
  "type": "credit",
  "amount": 100,
  "previousBalance": 0,
  "newBalance": 100,
  "reason": "Reward for completing task",
  "adminEmail": "admin@solsnipe.com",
  "adminMethod": "bearer_token",
  "timestamp": "2025-10-11T12:00:00.000Z"
}
```

**Admin attribution fields:**
- `adminEmail`: Email of admin who performed the operation (or "API Key Admin")
- `adminMethod`: Authentication method used (`bearer_token` or `api_key`)

Users can view their transaction history via `/api/get-transactions` to see which admin credited/debited their wallet.

## 🧪 Testing

### Automated Tests

Run the admin test suite:

```bash
# Install dependencies
npm install

# Configure test variables in test-admin.js
# - BASE_URL
# - TEST_WALLET
# - ADMIN_EMAIL
# - ADMIN_PASSWORD
# - SUPER_ADMIN_API_KEY

# Run tests
node test-admin.js
```

**Tests included:**
1. ✅ Admin login with email/password
2. ✅ Credit wallet with admin token
3. ✅ Debit wallet with admin token
4. ✅ Set balance with admin token
5. ✅ Credit wallet with API key
6. ✅ Unauthorized access prevention

### Manual Testing (PowerShell)

```powershell
# 1. Admin login
$loginResponse = curl -X POST http://localhost:8888/api/admin/login `
  -H "Content-Type: application/json" `
  -d '{\"email\":\"admin@solsnipe.com\",\"password\":\"your_password\"}'

# Extract token (parse JSON response)
$token = "paste_token_here"

# 2. Credit wallet
curl -X POST http://localhost:8888/api/credit-wallet `
  -H "Authorization: Bearer $token" `
  -H "Content-Type: application/json" `
  -d '{\"walletAddress\":\"0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb\",\"amount\":100,\"reason\":\"Test\"}'

# 3. Using API key instead
curl -X POST http://localhost:8888/api/credit-wallet `
  -H "X-API-Key: your_api_key" `
  -H "Content-Type: application/json" `
  -d '{\"walletAddress\":\"0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb\",\"amount\":100,\"reason\":\"Test\"}'
```

## 🔒 Security Considerations

### Admin Credentials

1. **Use strong passwords** - 12+ characters with mixed case, numbers, symbols
2. **Never commit credentials** - Always use environment variables
3. **Rotate API keys** - Change keys if compromised or periodically
4. **Limit admin access** - Only trusted personnel should have credentials

### Token Security

1. **Tokens expire** - Admin tokens expire after 24 hours
2. **HTTPS required** - Always use HTTPS in production
3. **Secure storage** - Store tokens securely (httpOnly cookies, secure storage)
4. **Monitor usage** - Log and monitor all admin operations

### API Key Best Practices

1. **Backend only** - Never expose API keys in frontend code
2. **Environment variables** - Store keys in `.env` files
3. **Service accounts** - Use different keys for different services
4. **Rotation schedule** - Rotate keys every 90 days or when compromised

## 🚨 Common Issues & Solutions

### Issue: "Unauthorized. Admin access required."

**Cause:** Missing or invalid authentication

**Solutions:**
- Check that you're using `Authorization: Bearer <token>` OR `X-API-Key: <key>`
- Verify token hasn't expired (24h for admin tokens)
- Ensure environment variables are set correctly
- Re-login to get a fresh token

### Issue: "Wallet not found"

**Cause:** Trying to credit/debit a wallet that hasn't authenticated yet

**Solution:** 
- User must connect their wallet first via `/api/anonymous-auth`
- Verify the wallet address is correct (case-insensitive)

### Issue: "Insufficient balance"

**Cause:** Trying to debit more than available balance

**Solution:**
- Check current balance via `/api/get-balance`
- Use `/api/set-balance` to adjust balance if needed
- Or credit the wallet before debiting

## 📖 Additional Resources

- **Full API Documentation:** [README.md](./README.md)
- **Code Examples:** [EXAMPLES.md](./EXAMPLES.md)
- **Testing Guide:** [TESTING.md](./TESTING.md)
- **Test Script:** `test-admin.js`

## 💡 Integration Patterns

### Pattern 1: Admin Dashboard (Frontend)

```javascript
// Admin logs in
const admin = new SolsnipeAdminAPI(BASE_URL);
await admin.login('admin@solsnipe.com', 'password');

// Manage wallets from dashboard
await admin.creditWallet(walletAddress, amount, reason);
```

### Pattern 2: Automated Backend Service

```javascript
// Backend service with API key
const adminService = {
  apiKey: process.env.SUPER_ADMIN_API_KEY,
  
  async rewardUser(walletAddress, rewardType) {
    const amounts = {
      'daily': 10,
      'referral': 50,
      'quest': 100
    };
    
    return await fetch('/api/credit-wallet', {
      method: 'POST',
      headers: {
        'X-API-Key': this.apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        walletAddress,
        amount: amounts[rewardType],
        reason: `Reward: ${rewardType}`
      })
    });
  }
};
```

### Pattern 3: Hybrid (User Request → Backend Admin Action)

```javascript
// User requests purchase (frontend)
await fetch('/backend/purchase-item', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${userToken}` },
  body: JSON.stringify({ itemId: 123 })
});

// Backend validates and debits (your backend server)
async function handlePurchase(userWalletAddress, itemId) {
  const item = await getItem(itemId);
  
  // Backend uses admin API to debit user
  await adminAPI.debitWallet(
    userWalletAddress,
    item.price,
    `Purchase: ${item.name}`,
    { itemId }
  );
  
  // Grant item to user
  await grantItem(userWalletAddress, itemId);
}
```

---

**Questions?** Check the main [README.md](./README.md) or open an issue!
