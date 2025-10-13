# 🧪 Quick Test Guide

Test your Solsnipe Backend locally before deployment!

## Prerequisites

Make sure you've completed the setup:
```bash
npm install
copy .env.example .env
# Edit .env and add your JWT_SECRET
```

## Start Development Server

```bash
npm run dev
```

Server will start at: `http://localhost:8888`

---

## 🔥 Test API Endpoints (PowerShell)

### 1. Connect a Wallet (Ethereum)

```powershell
$body = @{
    walletAddress = "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"
    chain = "ethereum"
    metadata = @{
        device = "desktop"
        browser = "chrome"
    }
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "http://localhost:8888/api/anonymous-auth" -Method Post -Body $body -ContentType "application/json"

# Save the token
$token = $response.data.token

# Display result
$response.data
```

### 2. Get Balance

```powershell
$headers = @{
    Authorization = "Bearer $token"
}

$balance = Invoke-RestMethod -Uri "http://localhost:8888/api/get-balance" -Headers $headers
$balance.data
```

### 3. Credit Wallet

```powershell
$headers = @{
    Authorization = "Bearer $token"
}

$body = @{
    amount = 100
    reason = "Test credit"
    metadata = @{
        testId = "test123"
    }
} | ConvertTo-Json

$credit = Invoke-RestMethod -Uri "http://localhost:8888/api/credit-wallet" -Method Post -Body $body -Headers $headers -ContentType "application/json"
$credit.data
```

### 4. Debit Wallet

```powershell
$headers = @{
    Authorization = "Bearer $token"
}

$body = @{
    amount = 30
    reason = "Test purchase"
} | ConvertTo-Json

$debit = Invoke-RestMethod -Uri "http://localhost:8888/api/debit-wallet" -Method Post -Body $body -Headers $headers -ContentType "application/json"
$debit.data
```

### 5. Get Transaction History

```powershell
$headers = @{
    Authorization = "Bearer $token"
}

$transactions = Invoke-RestMethod -Uri "http://localhost:8888/api/get-transactions?limit=10" -Headers $headers
$transactions.data
```

### 6. Verify Token

```powershell
$headers = @{
    Authorization = "Bearer $token"
}

$verify = Invoke-RestMethod -Uri "http://localhost:8888/api/verify-token" -Headers $headers
$verify.data
```

---

## 🧪 Using cURL (Cross-platform)

### 1. Connect Wallet

```bash
curl -X POST http://localhost:8888/api/anonymous-auth \
  -H "Content-Type: application/json" \
  -d '{"walletAddress":"0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb","chain":"ethereum"}'
```

### 2. Get Balance

```bash
# Replace YOUR_TOKEN with actual token
curl http://localhost:8888/api/get-balance \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 3. Credit Wallet

```bash
curl -X POST http://localhost:8888/api/credit-wallet \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"amount":100,"reason":"Test credit"}'
```

### 4. Debit Wallet

```bash
curl -X POST http://localhost:8888/api/debit-wallet \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"amount":30,"reason":"Test purchase"}'
```

### 5. Get Transactions

```bash
curl "http://localhost:8888/api/get-transactions?limit=10" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 🌐 Using Postman

### 1. Create New Request

**Connect Wallet:**
- Method: `POST`
- URL: `http://localhost:8888/api/anonymous-auth`
- Headers: `Content-Type: application/json`
- Body (raw JSON):
```json
{
  "walletAddress": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
  "chain": "ethereum"
}
```

### 2. Save Token

After connecting, copy the `token` from response and use it in subsequent requests.

### 3. Other Requests

**Get Balance:**
- Method: `GET`
- URL: `http://localhost:8888/api/get-balance`
- Headers: `Authorization: Bearer YOUR_TOKEN`

**Credit Wallet:**
- Method: `POST`
- URL: `http://localhost:8888/api/credit-wallet`
- Headers: 
  - `Content-Type: application/json`
  - `Authorization: Bearer YOUR_TOKEN`
- Body:
```json
{
  "amount": 100,
  "reason": "Test credit"
}
```

---

## 📊 Expected Test Flow

```
1. Connect Wallet
   └─→ Receive token & balance: 0

2. Credit +100
   └─→ New balance: 100

3. Credit +50
   └─→ New balance: 150

4. Debit -30
   └─→ New balance: 120

5. Get Transactions
   └─→ See 3 transactions (2 credits, 1 debit)

6. Get Balance
   └─→ Confirm balance: 120
```

---

## ✅ Test Checklist

- [ ] Connect wallet (Ethereum address)
- [ ] Verify initial balance is 0
- [ ] Credit wallet successfully
- [ ] Get balance shows updated amount
- [ ] Debit wallet successfully
- [ ] Try to debit more than balance (should fail)
- [ ] Get transaction history
- [ ] Verify token is valid
- [ ] Test with different wallet address (creates new session)
- [ ] Test with Solana address
- [ ] Check balance persists across requests
- [ ] Verify CORS headers are present

---

## 🐛 Troubleshooting

### Token Not Working?
```powershell
# Verify token structure
$token
```
Make sure it's in format: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

### Insufficient Balance Error?
Check current balance first:
```powershell
$balance = Invoke-RestMethod -Uri "http://localhost:8888/api/get-balance" -Headers @{Authorization="Bearer $token"}
$balance.data.balance
```

### Server Not Starting?
```bash
# Make sure port 8888 is not in use
netstat -ano | findstr :8888

# Kill the process if needed
taskkill /PID <PID> /F
```

---

## 🚀 Ready for Production?

Once all tests pass, you're ready to deploy to Netlify!

```bash
netlify login
netlify init
netlify env:set JWT_SECRET your-production-secret
netlify deploy --prod
```

---

**Happy Testing! 🎉**
