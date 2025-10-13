# 🚨 QUICK FIX - Environment Variables Not Loading

## Problem
Getting error: `FIREBASE_PROJECT_ID environment variable is not set`

## ✅ Solution

### Step 1: Make sure you're in the correct directory

```powershell
cd C:\Users\HP\SolsnipeBakend
```

**This is CRITICAL!** The `netlify dev` command must be run from inside the `SolsnipeBakend` folder.

### Step 2: Use the startup script

```powershell
.\start-dev.ps1
```

This script will:
- ✅ Ensure you're in the correct directory
- ✅ Check for `.env.development` file
- ✅ Show which environment variables will be loaded
- ✅ Start the Netlify Dev server

### Step 3: Test the endpoint

Once you see:
```
Local dev server ready: http://localhost:8888
```

Test with Postman or PowerShell:

```powershell
$body = @{
    seedPhrase = "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:8888/api/wallet-connect" -Method POST -Body $body -ContentType "application/json"
```

---

## Alternative: Manual Start (if script doesn't work)

```powershell
# 1. Navigate to project directory
cd C:\Users\HP\SolsnipeBakend

# 2. Verify you're in the right place
Get-Location
# Should show: C:\Users\HP\SolsnipeBakend

# 3. Check .env.development exists
Test-Path .env.development
# Should show: True

# 4. Start server
netlify dev
```

---

## Why This Happens

Netlify CLI looks for `.env.development` **in the current directory**. If you run `netlify dev` from the wrong folder (like `C:\Users\HP`), it won't find your environment variables.

The `start-dev.ps1` script ensures you're always in the correct directory before starting the server.

---

## ✅ Success Indicators

When it works, you'll see:

```
⬥ Injecting environment variable values for all scopes
⬥ Loaded .env.development file
⬥ Local dev server ready: http://localhost:8888
⬥ Loaded function wallet-connect
```

And in your function logs:
```
🔧 Firebase Config:
   Project ID: solsnipetest
   API Key: ✅ Set
```

---

**Run the script now:** `.\start-dev.ps1`
