# 🔧 Environment Variables Setup - Quick Fix

## Problem: "projects/undefined" Error

This happens when Netlify Dev doesn't load environment variables from `.env` file.

---

## ✅ Solution Applied

### 1. Updated `netlify.toml`

Added environment variables directly to the config file:

```toml
[dev.env]
  FIREBASE_PROJECT_ID = "solsnipetest"
  FIREBASE_API_KEY = "AIzaSyDCNm_YPQen7StRUm1rZUX2L0ni_INkKk8"
  JWT_SECRET = "dev-secret-key-change-in-production-use-crypto-randomBytes"
  ADMIN_USERNAME = "admin"
  ADMIN_PASSWORD = "admin123"
  ADMIN_API_KEY = "super-secret-admin-key"
  SOLANA_NETWORK = "DEVNET"
```

### 2. Enhanced Error Detection

Added validation in `firebaseWalletStore.js` to catch missing environment variables early.

---

## 🚀 How to Apply the Fix

### Step 1: Restart Netlify Dev

Stop the current server (Ctrl + C) and restart:

```powershell
netlify dev
```

### Step 2: Test Again

Run your wallet connection test. You should now see:

```
🔧 Firebase Config:
   Project ID: solsnipetest
   API Key: ✅ Set
```

Instead of `projects/undefined`.

---

## 🔍 Verify Environment Variables are Loaded

When the server starts, check the logs for:

```
⬥ Injecting environment variable values for all scopes
```

And when you make a request, you should see:

```
🔧 Firebase Config:
   Project ID: solsnipetest
   API Key: ✅ Set
🔍 Querying Firebase for wallet with seed hash: c557eec878...
```

---

## 📋 Alternative Methods (if above doesn't work)

### Method 1: Use .env.development

Netlify Dev prefers `.env.development` over `.env`:

```powershell
# Copy .env to .env.development
Copy-Item .env .env.development
```

Then restart `netlify dev`.

### Method 2: Set Environment Variables in Netlify CLI

```powershell
# Set variables one by one
netlify env:set FIREBASE_PROJECT_ID "solsnipetest"
netlify env:set FIREBASE_API_KEY "AIzaSyDCNm_YPQen7StRUm1rZUX2L0ni_INkKk8"
netlify env:set JWT_SECRET "dev-secret-key-change-in-production"
netlify env:set ADMIN_USERNAME "admin"
netlify env:set ADMIN_PASSWORD "admin123"
netlify env:set ADMIN_API_KEY "super-secret-admin-key"
netlify env:set SOLANA_NETWORK "DEVNET"
```

### Method 3: Link Netlify Site and Pull Environment Variables

If you've already deployed:

```powershell
netlify link
netlify env:pull
```

---

## ⚠️ Important Notes

### For Production Deployment

When deploying to Netlify, set environment variables in:
1. **Netlify Dashboard** → Your Site → **Site Settings** → **Environment Variables**

Or use CLI:
```powershell
netlify deploy --prod
```

### Security

**DO NOT** commit sensitive keys to git. The `netlify.toml` file with environment variables should be added to `.gitignore` if it contains real credentials.

For production, use Netlify's environment variable UI instead.

---

## ✅ After Restart, You Should See

```
✅ All Firebase tests passed!
🎉 Your Firebase setup is working correctly!

🔧 Firebase Config:
   Project ID: solsnipetest
   API Key: ✅ Set

🔍 Querying Firebase for wallet with seed hash: c557eec878...
ℹ️  No wallet found for this seed hash (new user)
💾 Saving wallet to Firebase: 5vK8F2H7K3xQn7...
✅ Wallet saved successfully
```

---

**Restart `netlify dev` now and test again!** 🚀
