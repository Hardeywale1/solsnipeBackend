# Start Netlify Dev Server
# This script ensures we're in the correct directory

Write-Host "🚀 Starting Netlify Dev Server..." -ForegroundColor Cyan
Write-Host ""

# Change to project directory
Set-Location -Path "C:\Users\HP\SolsnipeBakend"

# Show current directory
Write-Host "📁 Working Directory: $(Get-Location)" -ForegroundColor Green
Write-Host ""

# Check if .env.development exists
if (Test-Path ".env.development") {
    Write-Host "✅ Found .env.development file" -ForegroundColor Green
} else {
    Write-Host "⚠️  .env.development not found" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "🔧 Environment Variables that will be loaded:" -ForegroundColor Cyan
Write-Host "   - FIREBASE_PROJECT_ID" -ForegroundColor Gray
Write-Host "   - FIREBASE_API_KEY" -ForegroundColor Gray
Write-Host "   - JWT_SECRET" -ForegroundColor Gray
Write-Host "   - ADMIN credentials" -ForegroundColor Gray
Write-Host "   - SOLANA_NETWORK" -ForegroundColor Gray
Write-Host ""

# Start netlify dev
Write-Host "🌐 Starting server on http://localhost:8888..." -ForegroundColor Cyan
Write-Host ""

netlify dev
