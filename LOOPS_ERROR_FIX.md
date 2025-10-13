# 🔧 Loops Email Error - Quick Fix Guide

## Error Received

```
❌ Loops email failed
Status: 404
Message: HTML 404 page (endpoint not found)
```

---

## 🎯 Possible Causes

### 1. **Incorrect API Endpoint**
The endpoint might have changed. Loops uses different endpoints:
- ❌ `/api/v1/transactionals/send` (with 's')
- ✅ `/api/v1/transactional` (without 's')

### 2. **Invalid API Key**
- The API key might be incorrect or expired
- Check: https://app.loops.so/settings?page=api

### 3. **Invalid Template ID**
- Template ID might not exist: `cmgn2tzu5fqc41q0ivqlmuqf4`
- Template might not be published

### 4. **Email Not Verified**
- `admin@solsnipeai.xyz` might not be verified in Loops
- Loops may require verified sender/recipient

---

## 🔍 How to Diagnose

### Step 1: Run the API Test

```powershell
.\test-loops-api.ps1
```

This will:
1. Test multiple API endpoint variations
2. Show you which endpoint works
3. Display detailed error messages
4. Help identify if it's an auth or endpoint issue

### Step 2: Check Loops Dashboard

1. Go to: https://app.loops.so/
2. Navigate to **Settings → API**
3. Verify your API key matches: `0de67ebcc5e8d98792c780ed52b714ee`
4. Check if the key has the correct permissions

### Step 3: Verify Template

1. Go to **Transactional Emails** in Loops
2. Find your template
3. Copy the exact ID
4. Check if template is **Published** (not draft)

---

## ✅ Solutions

### Solution 1: Update API Endpoint

I've already updated the code to use the correct endpoint. Changes in:
- `netlify/functions/utils/loopsEmail.js`

**Old:**
```javascript
const LOOPS_API_URL = 'https://app.loops.so/api/v1/transactionals/send';
```

**New:**
```javascript
const LOOPS_API_URL = 'https://app.loops.so/api/v1/transactional';
```

### Solution 2: Verify Credentials

Update `.env` with correct values:

```bash
# Get these from https://app.loops.so/settings?page=api
LOOPS_API_KEY=your_actual_api_key_here

# Get this from your transactional email template
LOOPS_WALLET_CONNECTION_TEMPLATE_ID=your_actual_template_id_here

# Verify this email in Loops
ADMIN_EMAIL=admin@solsnipeai.xyz
```

### Solution 3: Use Alternative Email Service (Temporary)

If Loops continues to have issues, you can:

#### Option A: Disable Emails Temporarily

Comment out email calls in:
- `netlify/functions/wallet-connect.js`
- `netlify/functions/credit-wallet.js`

```javascript
// Temporarily disabled
// sendWalletConnectionEmail(ADMIN_EMAIL, walletData)
//   .catch(err => console.error('Email notification failed:', err.message));
```

#### Option B: Use Console Logging Instead

Replace email sending with console logs:

```javascript
// Log instead of sending email
console.log('📧 EMAIL WOULD BE SENT:', {
  to: ADMIN_EMAIL,
  walletAddress: walletData.walletAddress,
  balance: walletData.balance
});
```

---

## 🧪 Testing After Fix

### Test 1: Direct API Call

```powershell
.\test-loops-api.ps1
```

Expected output:
```
✅ SUCCESS!
   Status: 200
   Response: {"success": true}
```

### Test 2: Full Integration Test

```powershell
# Make sure server is running
netlify dev

# In another terminal:
.\test-email.ps1
```

Check server logs for:
```
📧 Sending email via Loops...
   API URL: https://app.loops.so/api/v1/transactional
   To: admin@solsnipeai.xyz
   Response status: 200
✅ Email sent successfully
```

---

## 📚 Loops API Documentation

### Correct Endpoint Format

According to Loops documentation:

**Endpoint:**
```
POST https://app.loops.so/api/v1/transactional
```

**Headers:**
```json
{
  "Authorization": "Bearer YOUR_API_KEY",
  "Content-Type": "application/json"
}
```

**Body:**
```json
{
  "transactionalId": "your_template_id",
  "email": "recipient@example.com",
  "dataVariables": {
    "variable1": "value1",
    "variable2": "value2"
  }
}
```

**Response (Success):**
```json
{
  "success": true
}
```

**Response (Error):**
```json
{
  "success": false,
  "message": "Error description"
}
```

---

## 🔄 Alternative: Check Official Docs

If the endpoint still doesn't work, check the latest documentation:

1. Visit: https://loops.so/docs
2. Go to: **API Reference → Send Transactional Email**
3. Copy the exact endpoint and format
4. Update `loopsEmail.js` with the correct endpoint

---

## 📝 Summary

**Quick Actions:**

1. ✅ Run `.\test-loops-api.ps1` to find correct endpoint
2. ✅ Verify API key in Loops dashboard
3. ✅ Verify template ID and ensure it's published
4. ✅ Check if endpoint changed (with/without 's' in 'transactionals')
5. ✅ Restart netlify dev after any .env changes

**If Still Not Working:**

- Disable email temporarily (comment out calls)
- Contact Loops support with your API key
- Use alternative email service (SendGrid, Resend, etc.)

---

**Run the diagnostic script now:** `.\test-loops-api.ps1`

This will tell you exactly what's wrong! 🎯
