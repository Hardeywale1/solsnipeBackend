# ⚡ START HERE - Quick Start Guide

## 🚨 Got an Error? Follow These 3 Steps:

### 1️⃣ Open PowerShell in the Project Folder

**Choose one method:**

**Method A - From File Explorer (Easiest):**
1. Open File Explorer
2. Go to: `C:\Users\HP\SolsnipeBakend`
3. Click in the address bar and type: `powershell`
4. Press Enter

**Method B - From PowerShell:**
```powershell
cd C:\Users\HP\SolsnipeBakend
```

---

### 2️⃣ Run the Verification Script

```powershell
.\verify-setup.ps1
```

This checks if everything is configured correctly.

**If all checks pass** → Go to Step 3  
**If some checks fail** → Follow the instructions shown

---

### 3️⃣ Start the Server

```powershell
.\start-dev.ps1
```

**Wait for this message:**
```
Local dev server ready: http://localhost:8888
```

---

## ✅ Test It Works

Open a **NEW** PowerShell window and run:

```powershell
$body = @{
    seedPhrase = "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:8888/api/wallet-connect" -Method POST -Body $body -ContentType "application/json"
```

**You should get:** A JSON response with `"success": true` and a wallet address! 🎉

---

## 📚 Full Documentation

- **HOW_TO_START.md** - Complete step-by-step guide
- **QUICK_FIX.md** - Fix environment variable issues
- **SETUP_GUIDE.md** - Initial project setup
- **POSTMAN_TESTING_GUIDE.md** - Test with Postman
- **README_NEW.md** - Full API documentation

---

## 🆘 Common Issues

### "Cannot find path"
**Solution:** Make sure you're in `C:\Users\HP\SolsnipeBakend`

### "Scripts disabled"
**Solution:** 
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### "Environment variable not set"
**Solution:**
```powershell
Copy-Item .env .env.development
.\start-dev.ps1
```

---

## 🎯 That's It!

**Just 3 steps:**
1. Open PowerShell in `C:\Users\HP\SolsnipeBakend`
2. Run `.\verify-setup.ps1`
3. Run `.\start-dev.ps1`

**Then test and you're done!** ✨
