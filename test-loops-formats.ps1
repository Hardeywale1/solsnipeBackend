# Quick Test - Loops API Direct Call
# Test the exact payload format Loops expects

Write-Host "🧪 Testing Loops API Payload Formats" -ForegroundColor Cyan
Write-Host ""

$apiKey = "0de67ebcc5e8d98792c780ed52b714ee"
$email = "admin@solsnipeai.xyz"
$templateId = "cmgn2tzu5fqc41q0ivqlmuqf4"
$endpoint = "https://app.loops.so/api/v1/transactional"

# Test different payload formats
$payloadFormats = @(
    @{
        Name = "Format 1: transactionalId"
        Payload = @{
            transactionalId = $templateId
            email = $email
            dataVariables = @{
                walletName = "TestWallet"
                connectionType = "Test"
                codes = "TEST123"
                solBalance = "0"
            }
        }
    },
    @{
        Name = "Format 2: transactionId (no 'al')"
        Payload = @{
            transactionId = $templateId
            email = $email
            dataVariables = @{
                walletName = "TestWallet"
                connectionType = "Test"
                codes = "TEST123"
                solBalance = "0"
            }
        }
    },
    @{
        Name = "Format 3: templateId"
        Payload = @{
            templateId = $templateId
            email = $email
            dataVariables = @{
                walletName = "TestWallet"
                connectionType = "Test"
                codes = "TEST123"
                solBalance = "0"
            }
        }
    },
    @{
        Name = "Format 4: transactionalId with addToAudience"
        Payload = @{
            transactionalId = $templateId
            email = $email
            addToAudience = $false
            dataVariables = @{
                walletName = "TestWallet"
                connectionType = "Test"
                codes = "TEST123"
                solBalance = "0"
            }
        }
    }
)

foreach ($format in $payloadFormats) {
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
    Write-Host "Testing: $($format.Name)" -ForegroundColor Yellow
    Write-Host ""
    
    $body = $format.Payload | ConvertTo-Json -Depth 5
    
    Write-Host "Payload:" -ForegroundColor Cyan
    Write-Host $body -ForegroundColor Gray
    Write-Host ""
    
    try {
        $headers = @{
            "Authorization" = "Bearer $apiKey"
            "Content-Type" = "application/json"
        }
        
        $response = Invoke-WebRequest -Uri $endpoint -Method POST -Body $body -Headers $headers -ErrorAction Stop
        
        Write-Host "✅ SUCCESS!" -ForegroundColor Green
        Write-Host "   Status: $($response.StatusCode)" -ForegroundColor Green
        Write-Host "   Response:" -ForegroundColor Cyan
        Write-Host $response.Content -ForegroundColor Green
        Write-Host ""
        Write-Host "🎉 THIS FORMAT WORKS!" -ForegroundColor Green
        Write-Host ""
        break
        
    } catch {
        $statusCode = $_.Exception.Response.StatusCode.value__
        Write-Host "❌ Failed" -ForegroundColor Red
        Write-Host "   Status: $statusCode" -ForegroundColor Red
        
        try {
            $errorResponse = $_.ErrorDetails.Message
            if ($errorResponse) {
                # Try to parse as JSON
                try {
                    $errorJson = $errorResponse | ConvertFrom-Json
                    Write-Host "   Error: $($errorJson.message)" -ForegroundColor Red
                } catch {
                    # Show first 200 chars if it's HTML
                    if ($errorResponse.Contains("<!DOCTYPE")) {
                        Write-Host "   Error: HTML 404 page (endpoint not found)" -ForegroundColor Red
                    } else {
                        Write-Host "   Error: $($errorResponse.Substring(0, [Math]::Min(200, $errorResponse.Length)))" -ForegroundColor Red
                    }
                }
            }
        } catch {
            Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
        }
        Write-Host ""
    }
}

Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host ""
Write-Host "💡 If all formats failed, check:" -ForegroundColor Yellow
Write-Host "   1. API key is valid: https://app.loops.so/settings?page=api" -ForegroundColor Gray
Write-Host "   2. Template ID exists and is published" -ForegroundColor Gray
Write-Host "   3. Email address is verified in Loops" -ForegroundColor Gray
Write-Host "   4. Check Loops documentation: https://loops.so/docs" -ForegroundColor Gray
Write-Host ""
