# 🚀 Quick Reference Card

## 📦 What You Have Now

### 1. Firebase Storage (2 Methods)
- ✅ **API Key Method** (Recommended) - Simple setup
- ✅ **Service Account Method** - Advanced features
- ✅ Auto-switching based on env vars

### 2. Postman Collection
- ✅ 20+ ready-to-use requests
- ✅ Auto-token saving
- ✅ All endpoints covered
- ✅ Error testing included

## ⚡ 30-Second Setup

### Firebase API Key:
```env
FIREBASE_API_KEY=AIzaSyC_xxxxx
FIREBASE_PROJECT_ID=your-project-id
```

### Install & Run:
```bash
npm install
netlify dev
```

### Test:
Import `Solsnipe_Backend_API.postman_collection.json` to Postman

## 📁 Key Files

| File | What It Does |
|------|--------------|
| `firebaseAPISessionStore.js` | Firebase REST API integration |
| `sessionStoreConfig.js` | Auto-selects storage type |
| `Solsnipe_Backend_API.postman_collection.json` | Postman tests |
| `FIREBASE_API_KEY_SETUP.md` | 5-min setup guide |
| `POSTMAN_GUIDE.md` | How to use Postman |

## 🔑 Environment Variables

### Required:
```env
JWT_SECRET=your_secret
ADMIN_EMAIL=admin@solsnipe.com
ADMIN_PASSWORD=your_password
```

### Firebase (Choose ONE):

**Option 1: API Key (Easier)**
```env
FIREBASE_API_KEY=AIzaSyC_xxx
FIREBASE_PROJECT_ID=your-project-id
```

**Option 2: Service Account**
```env
FIREBASE_SERVICE_ACCOUNT={"type":"service_account"...}
```

## 📮 Postman Quick Start

1. Import `Solsnipe_Backend_API.postman_collection.json`
2. Update variables:
   - `testWallet`
   - `adminEmail`  
   - `adminPassword`
   - `superAdminApiKey`
3. Run "Connect Wallet" → Token auto-saved
4. Run "Admin Login" → Admin token auto-saved
5. Test all endpoints!

## 🎯 Testing Workflow

```
User Flow:
1. Connect Wallet → Get user token
2. Get Balance → View wallet balance
3. Get Transactions → See history

Admin Flow:
1. Admin Login → Get admin token
2. Credit Wallet → Add funds (requires admin)
3. Debit Wallet → Remove funds (requires admin)
4. Set Balance → Direct adjustment (requires admin)
```

## 🔒 Auth Methods

| Method | Header | Who Uses | Expires |
|--------|--------|----------|---------|
| User Token | `Bearer {{userToken}}` | Regular users | 30 days |
| Admin Token | `Bearer {{adminToken}}` | Admin dashboard | 24 hours |
| API Key | `X-API-Key: {{key}}` | Backend services | Never |

## 📊 Storage Priority

1. **Firebase API** (if `FIREBASE_API_KEY` set) ← Easiest
2. **Firebase Admin** (if `FIREBASE_SERVICE_ACCOUNT` set)
3. **In-Memory** (fallback - dev only)

## 💾 What's Saved

Every wallet session stores:
- Wallet address (document ID)
- Current balance
- All transactions with admin attribution
- Chain, metadata
- Created/accessed timestamps

## 🐛 Quick Fixes

**Not using Firebase?**
```bash
# Check console for:
🔥 Using Firebase API Session Store
# If not, check env vars
```

**Postman auth failing?**
```
1. Run "Connect Wallet" first
2. Check {{userToken}} variable is set
3. For admin ops, run "Admin Login"
```

**Tokens not saving?**
```
Check "Tests" tab in Postman requests
Scripts auto-save to variables
```

## 📚 Documentation

- **Setup:** `FIREBASE_API_KEY_SETUP.md`
- **Postman:** `POSTMAN_GUIDE.md`
- **Admin:** `ADMIN_SETUP.md`
- **API Docs:** `README.md`
- **Examples:** `EXAMPLES.md`

## ✅ Checklist

- [ ] Install: `npm install`
- [ ] Configure Firebase (get API key)
- [ ] Set env vars in `.env`
- [ ] Run: `netlify dev`
- [ ] Import Postman collection
- [ ] Test "Connect Wallet"
- [ ] Test "Admin Login"
- [ ] Test "Credit Wallet"
- [ ] Check Firebase Console for data

## 🎉 You're Done!

Everything works and is production-ready:
- ✅ Persistent Firebase storage
- ✅ Complete API testing suite
- ✅ Admin controls with tracking
- ✅ Full documentation

Just run `npm install` and `netlify dev` to start! 🚀

---

**Need help?** Check `IMPLEMENTATION_COMPLETE.md` for full details!
