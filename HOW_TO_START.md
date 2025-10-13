# 🚀 How to Start Netlify Dev Server - Complete Guide

## The Problem You're Experiencing

Error: `FIREBASE_PROJECT_ID environment variable is not set`

**Root Cause:** The `netlify dev` command is being run from the wrong directory, so it can't find your `.env.development` file.

---

## ✅ THE SOLUTION (3 Simple Steps)

### Step 1: Open PowerShell in the Project Folder

**Option A: From File Explorer**
1. Open File Explorer
2. Navigate to: `C:\Users\HP\SolsnipeBakend`
3. In the address bar, type: `powershell` and press Enter
4. A PowerShell window will open in the correct folder

**Option B: From Existing PowerShell**
```powershell
cd C:\Users\HP\SolsnipeBakend
```

### Step 2: Verify Everything is Set Up

Run the verification script:

```powershell
.\verify-setup.ps1
```

This will check:
- ✅ You're in the correct directory
- ✅ .env.development file exists with all required variables
- ✅ netlify.toml is present
- ✅ Functions directory exists
- ✅ Node modules are installed
- ✅ Netlify CLI is available

**If any checks fail**, the script will tell you exactly what to fix.

### Step 3: Start the Server

Once all checks pass, run:

```powershell
.\start-dev.ps1
```

Or simply:

```powershell
netlify dev
```

---

## 🎯 What You Should See

### When Starting:
```
🚀 Starting Netlify Dev Server...

📁 Working Directory: C:\Users\HP\SolsnipeBakend

✅ Found .env.development file

🔧 Environment Variables that will be loaded:
   - FIREBASE_PROJECT_ID
   - FIREBASE_API_KEY
   - JWT_SECRET
   - ADMIN credentials
   - SOLANA_NETWORK

🌐 Starting server on http://localhost:8888...

⬥ Injecting environment variable values for all scopes
⬥ Loaded .env.development file
⬥ Setting up local dev server

   ╭─────────────────────── ⬥  ────────────────────────╮
   │                                                   │
   │   Local dev server ready: http://localhost:8888   │
   │                                                   │
   ╰───────────────────────────────────────────────────╯

⬥ Loaded function wallet-connect
⬥ Loaded function get-balance
⬥ Loaded function admin-login
⬥ Loaded function credit-wallet
```

### When Testing the Endpoint:

You should see logs like:
```
Request from ::1: POST /.netlify/functions/wallet-connect
🔧 Firebase Config:
   Project ID: solsnipetest
   API Key: ✅ Set
🔍 Querying Firebase for wallet with seed hash: c557eec878...
ℹ️  No wallet found for this seed hash (new user)
💾 Saving wallet to Firebase: 5vK8F2H7K3xQn7...
✅ Wallet saved successfully
Response with status 200
```

---

## 🧪 Testing After Server Starts

### Option 1: Using Postman (Recommended)

1. Import the collection: `Solsnipe_Seed_Wallet_API.postman_collection.json`
2. Import the environment: `Solsnipe_Local.postman_environment.json`
3. Select "Solsnipe Local" environment in Postman
4. Run: "User Endpoints → 1. Connect Wallet (Seed Phrase - New User)"

### Option 2: Using PowerShell

```powershell
$body = @{
    seedPhrase = "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about"
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "http://localhost:8888/api/wallet-connect" -Method POST -Body $body -ContentType "application/json"

# View the response
$response | ConvertTo-Json -Depth 5
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Wallet connected successfully",
  "data": {
    "walletAddress": "9we6kjtbcZ2vy3GSLLsZTEhbAqXPTRvEyoxa8wxSqKp5",
    "balance": 0,
    "isNewWallet": true,
    "network": "DEVNET"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

---

## 🔧 Troubleshooting

### Problem: "Cannot find path 'C:\Users\HP\SolsnipeBakend'"

**Solution:**
```powershell
# Check if folder exists
Test-Path "C:\Users\HP\SolsnipeBakend"

# If False, navigate to where your project actually is
cd "path\to\your\project"
```

### Problem: "verify-setup.ps1 cannot be loaded because running scripts is disabled"

**Solution:**
```powershell
# Allow script execution (run as Administrator)
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

# Then try again
.\verify-setup.ps1
```

### Problem: ".env.development not found"

**Solution:**
```powershell
# Copy from .env
Copy-Item .env .env.development

# Verify it was created
Test-Path .env.development
```

### Problem: "node_modules not found"

**Solution:**
```powershell
npm install
```

### Problem: Still getting "FIREBASE_PROJECT_ID environment variable is not set"

**Solution:**
```powershell
# Stop the server (Ctrl + C)

# Verify .env.development has the variable
Get-Content .env.development | Select-String "FIREBASE_PROJECT_ID"

# Should show: FIREBASE_PROJECT_ID=solsnipetest

# If not found, add it manually
Add-Content .env.development "`nFIREBASE_PROJECT_ID=solsnipetest"

# Restart server
.\start-dev.ps1
```

---

## 📋 Quick Reference Commands

```powershell
# Navigate to project
cd C:\Users\HP\SolsnipeBakend

# Verify setup
.\verify-setup.ps1

# Start server
.\start-dev.ps1

# Or start normally
netlify dev

# Test endpoint
$body = @{seedPhrase = "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about"} | ConvertTo-Json
Invoke-RestMethod -Uri "http://localhost:8888/api/wallet-connect" -Method POST -Body $body -ContentType "application/json"

# Stop server
# Press Ctrl + C
```

---

## 🎯 Summary

1. **Always** run from `C:\Users\HP\SolsnipeBakend`
2. **Always** verify with `.\verify-setup.ps1` first
3. **Use** `.\start-dev.ps1` to start the server
4. **Test** with Postman or PowerShell
5. **Check logs** for "🔧 Firebase Config: Project ID: solsnipetest"

---

**Ready to start? Run:** `.\verify-setup.ps1` **now!** ✨
