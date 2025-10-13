# Test Script: Verify Data Persistence After Admin Operations
# This tests that wallet fields are NOT lost when admin credits/debits

Write-Host "🧪 TESTING DATA PERSISTENCE AFTER ADMIN OPERATIONS" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

$baseUrl = "http://localhost:8888/api"

try {
    # Step 1: Connect Wallet
    Write-Host "Step 1: Connecting wallet..." -ForegroundColor Yellow
    $walletBody = @{
        seedPhrase = "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about"
    } | ConvertTo-Json

    $walletResponse = Invoke-RestMethod -Uri "$baseUrl/wallet-connect" -Method POST -Body $walletBody -ContentType "application/json"
    
    Write-Host "✅ Wallet connected" -ForegroundColor Green
    Write-Host "   Address: $($walletResponse.data.walletAddress)" -ForegroundColor Cyan
    Write-Host "   Balance: $($walletResponse.data.balance) SOL" -ForegroundColor Cyan
    Write-Host "   Network: $($walletResponse.data.network)" -ForegroundColor Cyan
    Write-Host ""

    $userToken = $walletResponse.token
    $walletAddress = $walletResponse.data.walletAddress

    # Step 2: Get Admin Token
    Write-Host "Step 2: Getting admin token..." -ForegroundColor Yellow
    $adminBody = @{
        username = "admin"
        password = "admin123"
        apiKey = "super-secret-admin-key"
    } | ConvertTo-Json

    $adminResponse = Invoke-RestMethod -Uri "$baseUrl/admin-login" -Method POST -Body $adminBody -ContentType "application/json"
    
    Write-Host "✅ Admin authenticated" -ForegroundColor Green
    Write-Host "   Admin ID: $($adminResponse.adminId)" -ForegroundColor Cyan
    Write-Host ""

    $adminToken = $adminResponse.token

    # Step 3: Get Initial Balance
    Write-Host "Step 3: Getting initial wallet state..." -ForegroundColor Yellow
    $initialBalance = Invoke-RestMethod -Uri "$baseUrl/get-balance" -Method GET -Headers @{Authorization = "Bearer $userToken"}
    
    Write-Host "✅ Initial state retrieved" -ForegroundColor Green
    Write-Host "   Balance: $($initialBalance.balance) SOL" -ForegroundColor Cyan
    Write-Host ""

    # Step 4: Credit Wallet
    Write-Host "Step 4: Crediting wallet with 10 SOL..." -ForegroundColor Yellow
    $creditBody = @{
        walletAddress = $walletAddress
        amount = 10
    } | ConvertTo-Json

    $creditResponse = Invoke-RestMethod -Uri "$baseUrl/credit-wallet" -Method POST -Body $creditBody -ContentType "application/json" -Headers @{Authorization = "Bearer $adminToken"}
    
    Write-Host "✅ Wallet credited" -ForegroundColor Green
    Write-Host "   Previous Balance: $($creditResponse.previousBalance) SOL" -ForegroundColor Cyan
    Write-Host "   Credit Amount: $($creditResponse.creditAmount) SOL" -ForegroundColor Cyan
    Write-Host "   New Balance: $($creditResponse.newBalance) SOL" -ForegroundColor Cyan
    Write-Host ""

    # Step 5: Verify ALL Fields Still Exist
    Write-Host "Step 5: Verifying all wallet fields persist..." -ForegroundColor Yellow
    $finalBalance = Invoke-RestMethod -Uri "$baseUrl/get-balance" -Method GET -Headers @{Authorization = "Bearer $userToken"}
    
    Write-Host ""
    Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
    Write-Host "VERIFICATION RESULTS:" -ForegroundColor Cyan
    Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
    Write-Host ""

    # Check each critical field
    $allGood = $true

    # Check walletAddress
    if ($finalBalance.walletAddress) {
        Write-Host "✅ walletAddress: $($finalBalance.walletAddress)" -ForegroundColor Green
    } else {
        Write-Host "❌ walletAddress: MISSING!" -ForegroundColor Red
        $allGood = $false
    }

    # Check balance
    if ($finalBalance.balance -eq $creditResponse.newBalance) {
        Write-Host "✅ balance: $($finalBalance.balance) SOL (correctly updated)" -ForegroundColor Green
    } else {
        Write-Host "❌ balance: $($finalBalance.balance) SOL (expected $($creditResponse.newBalance))" -ForegroundColor Red
        $allGood = $false
    }

    # Check network
    if ($finalBalance.network) {
        Write-Host "✅ network: $($finalBalance.network)" -ForegroundColor Green
    } else {
        Write-Host "❌ network: MISSING!" -ForegroundColor Red
        $allGood = $false
    }

    # Additional checks if API returns more data
    $expectedFields = @('walletAddress', 'balance', 'network')
    $presentFields = $finalBalance.PSObject.Properties.Name

    Write-Host ""
    Write-Host "All fields present in response:" -ForegroundColor Yellow
    foreach ($field in $presentFields) {
        if ($finalBalance.$field) {
            Write-Host "   ✅ $field" -ForegroundColor Green
        } else {
            Write-Host "   ⚠️  $field (null/empty)" -ForegroundColor Yellow
        }
    }

    Write-Host ""
    Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
    
    if ($allGood) {
        Write-Host "🎉 SUCCESS! All data persisted correctly!" -ForegroundColor Green
        Write-Host ""
        Write-Host "The bug fix is working:" -ForegroundColor Green
        Write-Host "  ✅ Wallet address preserved" -ForegroundColor Green
        Write-Host "  ✅ Balance updated correctly" -ForegroundColor Green
        Write-Host "  ✅ Network info maintained" -ForegroundColor Green
        Write-Host "  ✅ No data loss after admin operation" -ForegroundColor Green
    } else {
        Write-Host "⚠️  ISSUE DETECTED!" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "Some fields may still be missing." -ForegroundColor Yellow
        Write-Host "Check the Firebase console to verify the document structure." -ForegroundColor Yellow
    }

    Write-Host ""
    Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan

} catch {
    Write-Host ""
    Write-Host "❌ TEST FAILED!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    
    if ($_.ErrorDetails.Message) {
        $errorDetails = $_.ErrorDetails.Message | ConvertFrom-Json
        Write-Host "Details: $($errorDetails.error)" -ForegroundColor Red
    }
    
    Write-Host ""
    Write-Host "Make sure:" -ForegroundColor Yellow
    Write-Host "  1. Netlify dev server is running (netlify dev)" -ForegroundColor Gray
    Write-Host "  2. Server is listening on http://localhost:8888" -ForegroundColor Gray
    Write-Host "  3. Firebase credentials are set" -ForegroundColor Gray
}
