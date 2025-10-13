# Solsnipe Backend - Wallet-Based Authentication & Balance System

A complete serverless backend system built for Netlify Functions that provides **wallet-based authentication** with **balance management** and **transaction tracking** - perfect for blockchain/Web3 applications.

## 🚀 Features

- **🔗 Wallet-Based Authentication**: Use crypto wallet addresses as unique identifiers
- **� Admin Authentication**: Secure admin panel with email/password or API key
- **�💰 Balance Management**: Full CRUD operations for wallet balances (admin-controlled)
- **💳 Credit/Debit System**: Add or subtract funds with admin authorization
- **📊 Transaction History**: Complete audit trail with admin attribution
- **🌐 Multi-Chain Support**: Ethereum, Polygon, Solana, BSC, and more
- **🎫 JWT Tokens**: Secure token-based authentication (separate tokens for users and admins)
- **🔄 Session Management**: Persistent sessions tied to wallet addresses
- **⚡ Serverless**: Zero infrastructure management with Netlify Functions
- **🔐 Security**: Admin-only balance operations prevent unauthorized credits/debits

## 🎯 How It Works

### For Regular Users (Wallets)
1. **User connects their wallet** → System creates/retrieves session using wallet address as unique ID
2. **JWT token is issued** → User can make authenticated requests
3. **Check balance** → View current balance and transaction history
4. **Wait for admin operations** → Only admins can credit/debit balances

### For Administrators
1. **Admin logs in** → Using email/password or API key
2. **Admin JWT token issued** → Valid for 24 hours
3. **Manage wallets** → Credit, debit, or set balances for any wallet
4. **All actions tracked** → Every operation records which admin performed it

## 📋 API Endpoints

### 🔐 Authentication

#### 1. Connect Wallet
**POST** `/api/anonymous-auth`

Authenticate a user by wallet address. Creates a new session or returns existing one.

**Request Body:**
```json
{
  "walletAddress": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
  "chain": "ethereum",
  "metadata": {
    "device": "mobile",
    "platform": "ios"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "walletAddress": "0x742d35cc6634c0532925a3b844bc9e7595f0beb",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "balance": 0,
    "chain": "ethereum",
    "isNewUser": true,
    "expiresIn": "30 days",
    "createdAt": "2025-10-11T12:00:00.000Z",
    "lastLoginAt": "2025-10-11T12:00:00.000Z"
  }
}
```

**Supported Chains:** `ethereum`, `polygon`, `solana`, `bsc`, `avalanche`, `bitcoin`, and more

---

### 👑 Admin Authentication

#### 2. Admin Login
**POST** `/api/admin/login`

Authenticate as an administrator to perform balance management operations.

**Request Body:**
```json
{
  "email": "admin@solsnipe.com",
  "password": "your_secure_password"
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

**Alternative: API Key Authentication**

For service-to-service communication, you can use the Super Admin API Key instead of email/password:

**Headers:**
```
X-API-Key: your_super_admin_api_key_here
```

This works for all admin-protected endpoints (credit, debit, set-balance).

---

### 💰 Wallet Balance Operations

> **⚠️ ADMIN ONLY**: All balance modification endpoints require admin authentication (Bearer token or API key)

#### 3. Get Balance
**GET** `/api/get-balance`

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "data": {
    "walletAddress": "0x742d35cc6634c0532925a3b844bc9e7595f0beb",
    "balance": 1000,
    "chain": "ethereum",
    "lastUpdated": "2025-10-11T12:00:00.000Z"
  }
}
```

#### 4. Credit Wallet (Admin Only)
**POST** `/api/credit-wallet`

Add funds to any wallet. Requires admin authentication.

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

#### 5. Debit Wallet (Admin Only)
**POST** `/api/debit-wallet`

Deduct funds from any wallet (with balance check). Requires admin authentication.

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
  "reason": "Purchase item",
  "metadata": { "itemId": "456" }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "walletAddress": "0x742d35cc6634c0532925a3b844bc9e7595f0beb",
    "previousBalance": 100,
    "amount": 50,
    "newBalance": 50,
    "debitedBy": "admin@solsnipe.com",
    "transactionId": "uuid",
    "reason": "Purchase item",
    "timestamp": "2025-10-11T12:05:00.000Z"
  }
}
```

#### 6. Set Balance (Admin Only)
**PUT** `/api/set-balance`

Directly set wallet balance to a specific value. Requires admin authentication.

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

**Response:**
```json
{
  "success": true,
  "data": {
    "walletAddress": "0x742d35cc6634c0532925a3b844bc9e7595f0beb",
    "previousBalance": 50,
    "newBalance": 1000,
    "difference": 950,
    "adjustedBy": "admin@solsnipe.com",
    "transactionId": "uuid",
    "reason": "Admin adjustment",
    "timestamp": "2025-10-11T12:10:00.000Z"
  }
}
```

#### 7. Get Transaction History
**GET** `/api/get-transactions?limit=10&offset=0&type=credit`

**Headers:** `Authorization: Bearer <user-token>`

**Query Parameters:**
- `limit`: Number of transactions (default: 50)
- `offset`: Pagination offset (default: 0)
- `type`: Filter by `credit`, `debit`, or omit for all

**Response:**
```json
{
  "success": true,
  "data": {
    "walletAddress": "0x742d35cc6634c0532925a3b844bc9e7595f0beb",
    "currentBalance": 1000,
    "totalTransactions": 5,
    "totalCredits": 1100,
    "totalDebits": 100,
    "transactions": [...]
  }
}
```

### 🔑 Token & Session Management

#### 7. Verify Token
**GET** `/api/verify-token`

Verifies if a token is valid.

**Headers:**
```
Authorization: Bearer <your-token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "valid": true,
    "userId": "550e8400-e29b-41d4-a716-446655440000",
    "username": "SwiftFox4532",
    "type": "anonymous",
    "createdAt": 1728648000000,
    "sessionInfo": {
      "lastAccessedAt": 1728648000000,
      "isAnonymous": true
    }
  }
}
```

### 3. Refresh Token
**POST** `/api/refresh-token`

Refresh an access token using a refresh token.

**Request Body:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": "30 days",
    "refreshedAt": "2025-10-11T12:00:00.000Z"
  }
}
```

### 4. Get User Session
**GET** `/api/get-session`

Retrieve user session information.

**Headers:**
```
Authorization: Bearer <your-token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "userId": "550e8400-e29b-41d4-a716-446655440000",
    "username": "SwiftFox4532",
    "createdAt": 1728648000000,
    "lastAccessedAt": 1728648000000,
    "isAnonymous": true,
    "metadata": {}
  }
}
```

### 5. Update Session
**PUT/PATCH** `/api/update-session`

Update user session metadata.

**Headers:**
```
Authorization: Bearer <your-token>
```

**Request Body:**
```json
{
  "metadata": {
    "theme": "dark",
    "language": "en",
    "preferences": {
      "notifications": true
    }
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "message": "Session updated successfully",
    "session": {
      "userId": "550e8400-e29b-41d4-a716-446655440000",
      "username": "SwiftFox4532",
      "metadata": {
        "theme": "dark",
        "language": "en"
      },
      "lastAccessedAt": 1728648000000
    }
  }
}
```

### 6. Delete Session (Logout)
**DELETE** `/api/delete-session`

Delete a user session (logout).

**Headers:**
```
Authorization: Bearer <your-token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "message": "Session deleted successfully",
    "userId": "550e8400-e29b-41d4-a716-446655440000"
  }
}
```

## 🛠️ Installation & Setup

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn
- Netlify account (for deployment)

### Local Development

1. **Clone or navigate to the project directory:**
```bash
cd c:\Users\HP\SolsnipeBakend
```

2. **Install dependencies:**
```bash
npm install
```

3. **Create environment file:**
```bash
copy .env.example .env
```

4. **Edit `.env` and set your JWT secret:**
```env
JWT_SECRET=your-super-secret-key-change-in-production
```

To generate a secure JWT secret:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

5. **Start development server:**
```bash
npm run dev
```

The API will be available at: `http://localhost:8888/api/`

### Testing Endpoints Locally

**Basic User Flow:**
```powershell
# 1. Connect wallet (user authentication)
curl -X POST http://localhost:8888/api/anonymous-auth -H "Content-Type: application/json" -d '{\"walletAddress\":\"0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb\",\"chain\":\"ethereum\"}'

# 2. Check balance (save the user token from step 1)
curl -X GET http://localhost:8888/api/get-balance -H "Authorization: Bearer <user-token>"
```

**Admin Flow:**
```powershell
# 1. Admin login
curl -X POST http://localhost:8888/api/admin/login -H "Content-Type: application/json" -d '{\"email\":\"admin@solsnipe.com\",\"password\":\"your_password\"}'

# 2. Credit a wallet (save admin token from step 1)
curl -X POST http://localhost:8888/api/credit-wallet -H "Authorization: Bearer <admin-token>" -H "Content-Type: application/json" -d '{\"walletAddress\":\"0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb\",\"amount\":100,\"reason\":\"Test credit\"}'

# 3. Or use API key instead
curl -X POST http://localhost:8888/api/credit-wallet -H "X-API-Key: <super-admin-api-key>" -H "Content-Type: application/json" -d '{\"walletAddress\":\"0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb\",\"amount\":100,\"reason\":\"Test credit\"}'
```

**Automated Testing:**
```bash
# Run user wallet tests
node test-api.js

# Run admin tests
node test-admin.js
```

## 🚢 Deployment to Netlify

### Option 1: Netlify CLI

1. **Install Netlify CLI:**
```bash
npm install -g netlify-cli
```

2. **Login to Netlify:**
```bash
netlify login
```

3. **Initialize site:**
```bash
netlify init
```

4. **Set environment variables:**
```bash
netlify env:set JWT_SECRET your-generated-secret-key
netlify env:set ADMIN_EMAIL admin@solsnipe.com
netlify env:set ADMIN_PASSWORD your_secure_admin_password
netlify env:set SUPER_ADMIN_API_KEY your_super_admin_api_key
```

5. **Deploy:**
```bash
npm run deploy
```

### Option 2: Git Integration

1. Push your code to GitHub/GitLab
2. Go to [Netlify](https://app.netlify.com)
3. Click "New site from Git"
4. Connect your repository
5. Set build settings:
   - Build command: (leave empty)
   - Publish directory: `public`
   - Functions directory: `netlify/functions`
6. Add environment variables in Site settings → Environment variables:
   - `JWT_SECRET`
   - `ADMIN_EMAIL`
   - `ADMIN_PASSWORD`
   - `SUPER_ADMIN_API_KEY` (optional)
7. Deploy!

## 📁 Project Structure

```
SolsnipeBakend/
├── netlify/
│   └── functions/
│       ├── utils/
│       │   ├── auth.js              # Authentication utilities
│       │   ├── response.js          # Response helpers
│       │   └── sessionStore.js      # Session management
│       ├── anonymous-auth.js        # Create anonymous user
│       ├── verify-token.js          # Verify JWT token
│       ├── refresh-token.js         # Refresh access token
│       ├── get-session.js           # Get user session
│       ├── update-session.js        # Update session
│       └── delete-session.js        # Delete session
├── public/
│   └── index.html                   # API documentation page
├── .env.example                      # Environment variables template
├── .gitignore                        # Git ignore file
├── netlify.toml                      # Netlify configuration
├── package.json                      # Dependencies
└── README.md                         # This file
```

## 🔒 Security Considerations

1. **JWT Secret**: Always use a strong, random secret in production
2. **HTTPS**: Netlify provides HTTPS by default - always use it
3. **Token Storage**: Store tokens securely on the client (httpOnly cookies recommended)
4. **Rate Limiting**: Consider adding rate limiting for production
5. **Session Storage**: Replace in-memory storage with a database for production

## 🗄️ Upgrading to Database Storage

The current implementation uses in-memory session storage. For production, replace `sessionStore.js` with a database connector:

**Supported databases:**
- MongoDB (via MongoDB Atlas)
- PostgreSQL (via Supabase/Neon)
- Redis (via Upstash)
- FaunaDB

Example MongoDB integration:
```javascript
// Replace sessionStore.js with MongoDB connector
const { MongoClient } = require('mongodb');
const client = new MongoClient(process.env.MONGODB_URI);
// ... implement CRUD operations
```

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `JWT_SECRET` | Secret key for JWT signing | - | ✅ Yes |
| `ADMIN_EMAIL` | Admin login email | - | ✅ Yes (for admin) |
| `ADMIN_PASSWORD` | Admin login password | - | ✅ Yes (for admin) |
| `SUPER_ADMIN_API_KEY` | API key for service-to-service admin auth | - | ⚠️ Optional |
| `NODE_ENV` | Environment (development/production) | development | No |

**Setup Instructions:**

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Fill in the required values:
   ```env
   JWT_SECRET=your_very_secure_random_string_here
   ADMIN_EMAIL=admin@solsnipe.com
   ADMIN_PASSWORD=your_secure_admin_password_here
   SUPER_ADMIN_API_KEY=your_super_admin_api_key_here
   ```

3. For Netlify deployment, add these in:
   - Site settings → Environment variables
   - Or use Netlify CLI: `netlify env:set JWT_SECRET "your_secret"`

### Token Expiration

Default token expiration can be modified in `utils/auth.js`:
- **User Access Token**: 30 days
- **User Refresh Token**: 90 days
- **Admin Token**: 24 hours (more restrictive for security)

## 📝 License

MIT

## 🤝 Contributing

Feel free to submit issues and pull requests!

## 📞 Support

For issues or questions, please open an issue in the repository.

---

**Built with ❤️ for Netlify Functions**
