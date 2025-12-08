# ═══════════════════════════════════════════════════════════════════════════
# I4IGUANA - Test Runner Script
# Run: .\tests\run-tests.ps1
# ═══════════════════════════════════════════════════════════════════════════

param(
    [switch]$SkipBuild,
    [switch]$Verbose,
    [switch]$Install
)

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host "        🦎 I4IGUANA Test Runner                                " -ForegroundColor Green
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host ""

# Change to project directory
$projectDir = Split-Path -Parent $PSScriptRoot
Set-Location $projectDir

# Install dependencies if needed
if ($Install) {
    Write-Host "📦 Installing test dependencies..." -ForegroundColor Cyan
    npm install --save-dev ts-node typescript @types/node
}

# Run the tests
$args = @()
if ($SkipBuild) { $args += "--skip-build" }

Write-Host "🧪 Running tests..." -ForegroundColor Cyan
Write-Host ""

try {
    npx ts-node ./tests/test-runner.ts $args
    $exitCode = $LASTEXITCODE
}
catch {
    Write-Host "❌ Error running tests: $_" -ForegroundColor Red
    $exitCode = 1
}

# Summary
Write-Host ""
if ($exitCode -eq 0) {
    Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Green
    Write-Host "        ✅ ALL TESTS PASSED!                                   " -ForegroundColor Green
    Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Green
} else {
    Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Red
    Write-Host "        ❌ SOME TESTS FAILED - Check email for details         " -ForegroundColor Red
    Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Red
}

exit $exitCode
