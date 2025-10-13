# Seed Phrase Validation Test Suite
# Tests various seed phrases to demonstrate validation

Write-Host "🧪 SEED PHRASE VALIDATION TEST SUITE" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

$baseUrl = "http://localhost:8888/api/wallet-connect"

# Test cases
$tests = @(
    @{
        Name = "Valid 12-word BIP39 seed (Test Seed #1)"
        Seed = "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about"
        ShouldPass = $true
        ExpectedAddress = "9we6kjtbcZ2vy3GSLLsZTEhbAqXPTRvEyoxa8wxSqKp5"
    },
    @{
        Name = "Valid 12-word BIP39 seed (Test Seed #2)"
        Seed = "witch collapse practice feed shame open despair creek road again ice least"
        ShouldPass = $true
        ExpectedAddress = $null  # We don't know this one yet
    },
    @{
        Name = "Valid 24-word BIP39 seed"
        Seed = "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon art"
        ShouldPass = $true
        ExpectedAddress = $null
    },
    @{
        Name = "Invalid - Only 2 words"
        Seed = "hello world"
        ShouldPass = $false
        ExpectedError = "Invalid seed phrase"
    },
    @{
        Name = "Invalid - 12 words but not in BIP39 wordlist"
        Seed = "apple banana xyz123 hello world test foo bar baz qux lorem ipsum"
        ShouldPass = $false
        ExpectedError = "Invalid seed phrase"
    },
    @{
        Name = "Invalid - 12 words with invalid checksum"
        Seed = "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon"
        ShouldPass = $false
        ExpectedError = "Invalid seed phrase"
    },
    @{
        Name = "Invalid - Random valid words but wrong checksum"
        Seed = "cat dog bird fish tree house car book phone water fire moon"
        ShouldPass = $false
        ExpectedError = "Invalid seed phrase"
    },
    @{
        Name = "Invalid - Empty seed phrase"
        Seed = ""
        ShouldPass = $false
        ExpectedError = "seedPhrase is required"
    }
)

$passed = 0
$failed = 0

foreach ($test in $tests) {
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
    Write-Host "Test: $($test.Name)" -ForegroundColor Yellow
    Write-Host "Seed: $($test.Seed.Substring(0, [Math]::Min(60, $test.Seed.Length)))..." -ForegroundColor Gray
    Write-Host "Expected: $(if($test.ShouldPass){'✅ PASS'}else{'❌ FAIL'})" -ForegroundColor Gray
    Write-Host ""
    
    try {
        $body = @{
            seedPhrase = $test.Seed
        } | ConvertTo-Json
        
        $response = Invoke-RestMethod -Uri $baseUrl -Method POST -Body $body -ContentType "application/json" -ErrorAction Stop
        
        if ($test.ShouldPass) {
            # Should succeed
            Write-Host "✅ PASSED - Got wallet address" -ForegroundColor Green
            Write-Host "   Address: $($response.data.walletAddress)" -ForegroundColor Cyan
            Write-Host "   Balance: $($response.data.balance) SOL" -ForegroundColor Cyan
            Write-Host "   Network: $($response.data.network)" -ForegroundColor Cyan
            
            # Verify expected address if provided
            if ($test.ExpectedAddress -and $response.data.walletAddress -ne $test.ExpectedAddress) {
                Write-Host "   ⚠️  Warning: Address mismatch!" -ForegroundColor Yellow
                Write-Host "   Expected: $($test.ExpectedAddress)" -ForegroundColor Yellow
                Write-Host "   Got: $($response.data.walletAddress)" -ForegroundColor Yellow
                $failed++
            } else {
                if ($test.ExpectedAddress) {
                    Write-Host "   ✅ Address matches expected!" -ForegroundColor Green
                }
                $passed++
            }
        } else {
            # Should have failed but passed
            Write-Host "❌ FAILED - Should have been rejected but was accepted!" -ForegroundColor Red
            $failed++
        }
    } catch {
        if (-not $test.ShouldPass) {
            # Expected to fail
            $errorMsg = $_.ErrorDetails.Message | ConvertFrom-Json
            Write-Host "✅ PASSED - Correctly rejected" -ForegroundColor Green
            Write-Host "   Error: $($errorMsg.error)" -ForegroundColor Cyan
            
            if ($test.ExpectedError -and $errorMsg.error -notlike "*$($test.ExpectedError)*") {
                Write-Host "   ⚠️  Warning: Different error than expected" -ForegroundColor Yellow
                Write-Host "   Expected: $($test.ExpectedError)" -ForegroundColor Yellow
            }
            $passed++
        } else {
            # Should have passed but failed
            Write-Host "❌ FAILED - Should have been accepted but was rejected!" -ForegroundColor Red
            Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
            $failed++
        }
    }
    
    Write-Host ""
}

Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host ""
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "FINAL RESULTS" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
Write-Host "Total Tests: $($tests.Count)" -ForegroundColor White
Write-Host "Passed: $passed" -ForegroundColor Green
Write-Host "Failed: $failed" -ForegroundColor $(if($failed -eq 0){'Green'}else{'Red'})
Write-Host ""

if ($failed -eq 0) {
    Write-Host "🎉 ALL TESTS PASSED!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Your seed phrase validation is working correctly!" -ForegroundColor Green
    Write-Host "✅ BIP39 validation is functional" -ForegroundColor Green
    Write-Host "✅ Invalid phrases are rejected" -ForegroundColor Green
    Write-Host "✅ Valid phrases generate correct addresses" -ForegroundColor Green
} else {
    Write-Host "⚠️  SOME TESTS FAILED" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Review the errors above to identify issues." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
