# Deploy Environment Variables to Vercel
# Usage: .\deploy-env.ps1

Write-Host "🚀 Starting Vercel Environment Variables Upload..." -ForegroundColor Green
Write-Host ""

# Read .env file
$envFile = ".env"

if (-Not (Test-Path $envFile)) {
    Write-Host "❌ Error: .env file not found!" -ForegroundColor Red
    exit 1
}

Write-Host "📖 Reading .env file..." -ForegroundColor Cyan

$envVars = @()
Get-Content $envFile | ForEach-Object {
    $line = $_.Trim()
    
    # Skip empty lines and comments
    if ($line -eq "" -or $line.StartsWith("#")) {
        return
    }
    
    # Parse KEY=VALUE
    if ($line -match '^([^=]+)=(.*)$') {
        $key = $matches[1].Trim()
        $value = $matches[2].Trim()
        
        # Remove quotes if present
        $value = $value -replace '^["'']|["'']$', ''
        
        $envVars += @{
            Key = $key
            Value = $value
        }
    }
}

Write-Host "✅ Found $($envVars.Count) environment variables" -ForegroundColor Green
Write-Host ""

# Upload each variable to Vercel
$successful = 0
$failed = 0

foreach ($env in $envVars) {
    $key = $env.Key
    $value = $env.Value
    
    Write-Host "📤 Uploading: $key" -ForegroundColor Yellow
    
    try {
        # Execute vercel env add command
        $output = $value | vercel env add $key production 2>&1
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "   ✅ Success" -ForegroundColor Green
            $successful++
        } else {
            Write-Host "   ⚠️  Warning: May already exist or failed" -ForegroundColor Yellow
            $failed++
        }
    } catch {
        Write-Host "   ❌ Error: $($_.Exception.Message)" -ForegroundColor Red
        $failed++
    }
    
    # Small delay to avoid rate limiting
    Start-Sleep -Milliseconds 500
}

Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "📊 Summary:" -ForegroundColor Cyan
Write-Host "   ✅ Successful: $successful" -ForegroundColor Green
Write-Host "   ❌ Failed: $failed" -ForegroundColor Red
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host ""

if ($successful -gt 0) {
    Write-Host "🎉 Environment variables uploaded successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "🔄 Next step: Redeploy your project" -ForegroundColor Yellow
    Write-Host "   Run: vercel --prod" -ForegroundColor Cyan
} else {
    Write-Host "⚠️  No variables were uploaded. Check for errors above." -ForegroundColor Yellow
}

Write-Host ""
