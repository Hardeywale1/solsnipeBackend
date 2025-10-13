# Test Loops API Configuration
# This script directly tests the Loops API to verify credentials

Write-Host "🔍 TESTING LOOPS API CONFIGURATION" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

$apiKey = "0de67ebcc5e8d98792c780ed52b714ee"
$email = "admin@solsnipeai.xyz"
$transactionalId = "cmgn2tzu5fqc41q0ivqlmuqf4"

Write-Host "Configuration:" -ForegroundColor Yellow
Write-Host "  API Key: $($apiKey.Substring(0, 8))..." -ForegroundColor Gray
Write-Host "  Email: $email" -ForegroundColor Gray
Write-Host "  Template ID: $transactionalId" -ForegroundColor Gray
Write-Host ""

# Test different API endpoints
$endpoints = @(
    "https://app.loops.so/api/v1/transactional",
    "https://app.loops.so/api/v1/transactionals/send",
    "https://loops.so/api/v1/transactional"
)

foreach ($endpoint in $endpoints) {
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
    Write-Host "Testing endpoint: $endpoint" -ForegroundColor Yellow
    Write-Host ""
    
    $payload = @{
        transactionalId = $transactionalId
        email = $email
        dataVariables = @{
            walletName = "TestWallet123"
            connectionType = "Test"
            codes = "TEST123"
            solBalance = "0"
        }
    } | ConvertTo-Json

    Write-Host "Payload:" -ForegroundColor Cyan
    Write-Host $payload -ForegroundColor Gray
    Write-Host ""

    try {
        $response = Invoke-WebRequest -Uri $endpoint -Method POST -Body $payload -ContentType "application/json" -Headers @{
            "Authorization" = "Bearer $apiKey"
        } -ErrorAction Stop

        Write-Host "✅ SUCCESS!" -ForegroundColor Green
        Write-Host "   Status: $($response.StatusCode)" -ForegroundColor Green
        Write-Host "   Response:" -ForegroundColor Cyan
        Write-Host $response.Content -ForegroundColor Green
        Write-Host ""
        Write-Host "🎉 This is the correct endpoint: $endpoint" -ForegroundColor Green
        break
    } catch {
        $statusCode = $_.Exception.Response.StatusCode.value__
        Write-Host "❌ FAILED" -ForegroundColor Red
        Write-Host "   Status: $statusCode" -ForegroundColor Red
        
        if ($statusCode -eq 404) {
            Write-Host "   Error: Endpoint not found (404)" -ForegroundColor Red
        } elseif ($statusCode -eq 401) {
            Write-Host "   Error: Unauthorized (401) - API key may be invalid" -ForegroundColor Red
        } elseif ($statusCode -eq 400) {
            Write-Host "   Error: Bad Request (400)" -ForegroundColor Red
            try {
                $errorBody = $_.ErrorDetails.Message | ConvertFrom-Json
                Write-Host "   Details: $($errorBody.message)" -ForegroundColor Red
            } catch {
                Write-Host "   Details: $($_.ErrorDetails.Message)" -ForegroundColor Red
            }
        } else {
            Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
        }
        Write-Host ""
    }
}

Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host ""
Write-Host "💡 Troubleshooting Tips:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Verify API Key:" -ForegroundColor White
Write-Host "   - Go to https://app.loops.so/settings?page=api" -ForegroundColor Gray
Write-Host "   - Check if API key is: 0de67ebcc5e8d98792c780ed52b714ee" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Verify Template ID:" -ForegroundColor White
Write-Host "   - Go to your Loops dashboard" -ForegroundColor Gray
Write-Host "   - Check Transactional emails section" -ForegroundColor Gray
Write-Host "   - Verify ID is: cmgn2tzu5fqc41q0ivqlmuqf4" -ForegroundColor Gray
Write-Host ""
Write-Host "3. Check Email Address:" -ForegroundColor White
Write-Host "   - Ensure admin@solsnipeai.xyz is verified in Loops" -ForegroundColor Gray
Write-Host "   - Or use a test mode if available" -ForegroundColor Gray
Write-Host ""
Write-Host "4. API Documentation:" -ForegroundColor White
Write-Host "   - Visit: https://loops.so/docs/api-reference" -ForegroundColor Gray
Write-Host "   - Check the latest endpoint format" -ForegroundColor Gray
Write-Host ""
