# Get Wallet Details API Reference

## Endpoint
```
GET /.netlify/functions/get-wallet-details
```

## Authentication
**Required:** JWT token (obtained from `/wallet-connect`)

Include in header:
```
Authorization: Bearer <your-jwt-token>
```

## Request Example

### cURL
```bash
curl -X GET http://localhost:8888/.netlify/functions/get-wallet-details \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### PowerShell
```powershell
$token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
Invoke-WebRequest -Uri "http://localhost:8888/.netlify/functions/get-wallet-details" `
  -Method GET `
  -Headers @{"Authorization"="Bearer $token"}
```

### JavaScript
```javascript
const response = await fetch('http://localhost:8888/.netlify/functions/get-wallet-details', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

const data = await response.json();
console.log(data.wallet);
```

## Response

### Success (200 OK)
```json
{
  "success": true,
  "wallet": {
    "walletId": "550e8400-e29b-41d4-a716-446655440000",
    "walletAddress": "8xY7nZqW9rKvZp3D4qX2hF5mT6sL9kE3pR4jC8wN1aB2",
    "walletType": "solana",
    "inputType": "seed_phrase",
    "blockchain": "solana",
    
    "balance": 1.5,
    "solsnipeBalance": 0,
    "balanceLastUpdated": "2025-10-13T10:30:00.000Z",
    
    "credentials": "pill tomorrow foster begin walnut blade pen area slab bean forest liar",
    
    "derivationPath": "m/44'/501'/0'/0'",
    "accountIndex": 0,
    
    "transactions": [
      "4xZ7nY...signature1",
      "5pK2mL...signature2"
    ],
    
    "createdAt": "2025-10-13T10:00:00.000Z",
    "lastLoginAt": "2025-10-13T10:30:00.000Z",
    "loginCount": 5,
    
    "metadata": {}
  }
}
```

### Error Responses

#### 401 Unauthorized - Missing Token
```json
{
  "error": "Missing or invalid authorization token",
  "message": "Please provide a valid JWT token in Authorization header"
}
```

#### 401 Unauthorized - Invalid Token
```json
{
  "error": "Invalid or expired token",
  "message": "Please login again to get a new token"
}
```

#### 404 Not Found - Wallet Not Found
```json
{
  "error": "Wallet not found",
  "message": "The wallet associated with this token does not exist"
}
```

#### 500 Internal Server Error
```json
{
  "error": "Internal server error",
  "message": "Error details here"
}
```

## Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `walletId` | string | Unique wallet identifier (UUID) |
| `walletAddress` | string | Solana public key |
| `walletType` | string | Wallet type (e.g., "solana") |
| `inputType` | string | "seed_phrase" or "passphrase" |
| `blockchain` | string | Blockchain network ("solana") |
| `balance` | number | Current SOL balance |
| `solsnipeBalance` | number | Solsnipe platform balance |
| `balanceLastUpdated` | string | ISO timestamp of last balance update |
| `credentials` | string | Seed phrase or passphrase (plain text) |
| `derivationPath` | string | BIP44 derivation path |
| `accountIndex` | number | Account derivation index |
| `transactions` | array | Recent transaction signatures |
| `createdAt` | string | ISO timestamp of wallet creation |
| `lastLoginAt` | string | ISO timestamp of last login |
| `loginCount` | number | Total number of logins |
| `metadata` | object | Additional wallet metadata |

## Security Notes

⚠️ **IMPORTANT:** The `credentials` field contains the **unencrypted** seed phrase or passphrase.

**Recommendations:**
1. **Use HTTPS** in production
2. **Implement encryption** for credentials field before production deployment
3. **Rate limit** this endpoint to prevent abuse
4. **Log access** to this endpoint for security auditing
5. **Consider removing** credentials from response or requiring additional authentication

## Usage Flow

```mermaid
sequenceDiagram
    participant User
    participant API
    participant Firebase
    
    User->>API: POST /wallet-connect (seed phrase)
    API->>Firebase: Save wallet + credentials
    API->>User: Return JWT token
    
    User->>API: GET /get-wallet-details (JWT)
    API->>API: Verify JWT
    API->>Firebase: Query wallet by walletId
    Firebase->>API: Return wallet data
    API->>User: Return complete wallet details
```

## Example Use Cases

### 1. Display User Dashboard
```javascript
// Fetch wallet details when user logs in
const token = localStorage.getItem('jwt_token');
const response = await fetch('/api/get-wallet-details', {
  headers: { 'Authorization': `Bearer ${token}` }
});
const { wallet } = await response.json();

// Display balances
console.log(`SOL: ${wallet.balance}`);
console.log(`Solsnipe: ${wallet.solsnipeBalance}`);
```

### 2. Backup Seed Phrase
```javascript
// Allow user to view/backup their seed phrase
const { wallet } = await getWalletDetails();
if (wallet.inputType === 'seed_phrase') {
  displaySeedPhrase(wallet.credentials);
}
```

### 3. Transaction History
```javascript
// Show recent transactions
const { wallet } = await getWalletDetails();
wallet.transactions.forEach(txSig => {
  console.log(`Transaction: ${txSig}`);
});
```

### 4. Account Statistics
```javascript
// Display account info
const { wallet } = await getWalletDetails();
console.log(`Member since: ${wallet.createdAt}`);
console.log(`Total logins: ${wallet.loginCount}`);
console.log(`Last active: ${wallet.lastLoginAt}`);
```

## Testing

Run the test script:
```powershell
.\test-new-features.ps1
```

This will:
1. Create a new wallet
2. Fetch wallet details
3. Verify all fields are present
4. Display complete wallet information

## Production Deployment

Before deploying to production:

1. **Add environment variable:**
   ```bash
   netlify env:set JWT_SECRET "your-production-secret-key-here"
   ```

2. **Enable HTTPS** (automatic on Netlify)

3. **Implement encryption:**
   ```javascript
   // Encrypt credentials before storage
   const encrypted = encrypt(credentials, ENCRYPTION_KEY);
   
   // Decrypt when retrieving
   const decrypted = decrypt(wallet.credentials, ENCRYPTION_KEY);
   ```

4. **Add rate limiting** to prevent abuse

5. **Monitor usage** and set up alerts for suspicious activity
