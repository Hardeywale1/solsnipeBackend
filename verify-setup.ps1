# Environment Verification Script
# Checks if everything is set up correctly before starting Netlify Dev

Write-Host "🔍 Verifying Solsnipe Backend Setup..." -ForegroundColor Cyan
Write-Host ""

$allGood = $true

# Check 1: Current Directory
Write-Host "📁 Checking current directory..." -ForegroundColor Yellow
$currentDir = Get-Location
if ($currentDir.Path -eq "C:\Users\HP\SolsnipeBakend") {
    Write-Host "   ✅ Correct directory: $currentDir" -ForegroundColor Green
} else {
    Write-Host "   ❌ Wrong directory: $currentDir" -ForegroundColor Red
    Write-Host "   Expected: C:\Users\HP\SolsnipeBakend" -ForegroundColor Red
    $allGood = $false
}
Write-Host ""

# Check 2: .env.development file
Write-Host "📄 Checking .env.development file..." -ForegroundColor Yellow
if (Test-Path ".env.development") {
    Write-Host "   ✅ File exists" -ForegroundColor Green
    
    # Read and check for required variables
    $envContent = Get-Content ".env.development" -Raw
    $requiredVars = @("FIREBASE_PROJECT_ID", "FIREBASE_API_KEY", "JWT_SECRET", "ADMIN_USERNAME", "ADMIN_PASSWORD")
    
    foreach ($var in $requiredVars) {
        if ($envContent -match $var) {
            Write-Host "   ✅ $var found" -ForegroundColor Green
        } else {
            Write-Host "   ❌ $var missing" -ForegroundColor Red
            $allGood = $false
        }
    }
} else {
    Write-Host "   ❌ .env.development not found" -ForegroundColor Red
    Write-Host "   Creating from .env file..." -ForegroundColor Yellow
    
    if (Test-Path ".env") {
        Copy-Item ".env" ".env.development"
        Write-Host "   ✅ Created .env.development" -ForegroundColor Green
    } else {
        Write-Host "   ❌ .env file also not found!" -ForegroundColor Red
        $allGood = $false
    }
}
Write-Host ""

# Check 3: netlify.toml
Write-Host "⚙️  Checking netlify.toml..." -ForegroundColor Yellow
if (Test-Path "netlify.toml") {
    Write-Host "   ✅ File exists" -ForegroundColor Green
} else {
    Write-Host "   ❌ netlify.toml not found" -ForegroundColor Red
    $allGood = $false
}
Write-Host ""

# Check 4: Functions directory
Write-Host "📦 Checking functions directory..." -ForegroundColor Yellow
if (Test-Path "netlify\functions") {
    $functionFiles = Get-ChildItem "netlify\functions\*.js" -File
    Write-Host "   ✅ Found $($functionFiles.Count) function files" -ForegroundColor Green
    
    # Check for wallet-connect.js specifically
    if (Test-Path "netlify\functions\wallet-connect.js") {
        Write-Host "   ✅ wallet-connect.js found" -ForegroundColor Green
    } else {
        Write-Host "   ❌ wallet-connect.js not found" -ForegroundColor Red
        $allGood = $false
    }
} else {
    Write-Host "   ❌ netlify\functions directory not found" -ForegroundColor Red
    $allGood = $false
}
Write-Host ""

# Check 5: Node modules
Write-Host "📚 Checking node_modules..." -ForegroundColor Yellow
if (Test-Path "node_modules") {
    Write-Host "   ✅ node_modules exists" -ForegroundColor Green
    
    # Check for key dependencies
    $keyDeps = @("@solana/web3.js", "bip39", "bs58")
    foreach ($dep in $keyDeps) {
        if (Test-Path "node_modules\$dep") {
            Write-Host "   ✅ $dep installed" -ForegroundColor Green
        } else {
            Write-Host "   ⚠️  $dep not found (might need npm install)" -ForegroundColor Yellow
        }
    }
} else {
    Write-Host "   ❌ node_modules not found - Run: npm install" -ForegroundColor Red
    $allGood = $false
}
Write-Host ""

# Check 6: Netlify CLI
Write-Host "🛠️  Checking Netlify CLI..." -ForegroundColor Yellow
try {
    $netlifyVersion = netlify --version 2>&1
    Write-Host "   ✅ Netlify CLI installed: $netlifyVersion" -ForegroundColor Green
} catch {
    Write-Host "   ❌ Netlify CLI not found" -ForegroundColor Red
    $allGood = $false
}
Write-Host ""

# Final verdict
Write-Host "═══════════════════════════════════════" -ForegroundColor Cyan
if ($allGood) {
    Write-Host "✅ ALL CHECKS PASSED!" -ForegroundColor Green
    Write-Host ""
    Write-Host "You can now start the server with:" -ForegroundColor White
    Write-Host "   .\start-dev.ps1" -ForegroundColor Cyan
    Write-Host "or" -ForegroundColor White
    Write-Host "   netlify dev" -ForegroundColor Cyan
} else {
    Write-Host "❌ SOME CHECKS FAILED" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please fix the issues above before starting the server." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Common fixes:" -ForegroundColor White
    Write-Host "   1. Make sure you're in C:\Users\HP\SolsnipeBakend" -ForegroundColor Gray
    Write-Host "   2. Run: npm install" -ForegroundColor Gray
    Write-Host "   3. Copy .env to .env.development" -ForegroundColor Gray
}
Write-Host "═══════════════════════════════════════" -ForegroundColor Cyan
