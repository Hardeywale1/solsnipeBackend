# Test Wallet Connect Endpoint
# Quick PowerShell test for the wallet-connect API

Write-Host "🧪 Testing Wallet Connect Endpoint..." -ForegroundColor Cyan
Write-Host ""

# Test data
$body = @{
    seedPhrase = "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about"
} | ConvertTo-Json

Write-Host "📤 Request Body:" -ForegroundColor Yellow
Write-Host $body -ForegroundColor Gray
Write-Host ""

try {
    Write-Host "🌐 Calling http://localhost:8888/api/wallet-connect..." -ForegroundColor Cyan
    Write-Host ""
    
    $response = Invoke-RestMethod -Uri "http://localhost:8888/api/wallet-connect" -Method POST -Body $body -ContentType "application/json"
    
    Write-Host "✅ SUCCESS!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📥 Response:" -ForegroundColor Yellow
    $response | ConvertTo-Json -Depth 5 | Write-Host -ForegroundColor Green
    
    if ($response.success) {
        Write-Host ""
        Write-Host "🎉 Wallet connected successfully!" -ForegroundColor Green
        Write-Host "   Wallet Address: $($response.data.walletAddress)" -ForegroundColor Cyan
        Write-Host "   Balance: $($response.data.balance) SOL" -ForegroundColor Cyan
        Write-Host "   Network: $($response.data.network)" -ForegroundColor Cyan
        Write-Host "   New Wallet: $($response.data.isNewWallet)" -ForegroundColor Cyan
    }
} catch {
    Write-Host "❌ ERROR!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Error Message:" -ForegroundColor Yellow
    Write-Host $_.Exception.Message -ForegroundColor Red
    Write-Host ""
    Write-Host "Response:" -ForegroundColor Yellow
    Write-Host $_.ErrorDetails.Message -ForegroundColor Red
}

Write-Host ""
Write-Host "═══════════════════════════════════════" -ForegroundColor Cyan
