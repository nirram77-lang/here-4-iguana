# ═══════════════════════════════════════════════════════════════════════════
# I4IGUANA - GitHub Setup Script
# Run this in PowerShell from your project folder
# ═══════════════════════════════════════════════════════════════════════════

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host "        🦎 I4IGUANA - GitHub Setup Script                      " -ForegroundColor Green
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host ""

# Check if git is installed
$gitVersion = git --version 2>$null
if (-not $gitVersion) {
    Write-Host "❌ Git is not installed!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please install Git from: https://git-scm.com/download/win" -ForegroundColor Yellow
    Write-Host ""
    exit 1
}

Write-Host "✅ Git found: $gitVersion" -ForegroundColor Green
Write-Host ""

# Check if already a git repo
if (Test-Path ".git") {
    Write-Host "⚠️  This folder is already a Git repository" -ForegroundColor Yellow
    Write-Host ""
} else {
    Write-Host "📁 Initializing Git repository..." -ForegroundColor Cyan
    git init
    Write-Host "✅ Git repository initialized" -ForegroundColor Green
    Write-Host ""
}

# Check for .gitignore
if (Test-Path ".gitignore") {
    Write-Host "✅ .gitignore file exists" -ForegroundColor Green
} else {
    Write-Host "⚠️  No .gitignore file found - please add one!" -ForegroundColor Yellow
}
Write-Host ""

# Show status
Write-Host "📊 Current Git Status:" -ForegroundColor Cyan
Write-Host "─────────────────────────────────────────────────" -ForegroundColor Gray
git status --short
Write-Host ""

# Instructions
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host "        📋 NEXT STEPS                                          " -ForegroundColor Green
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host ""
Write-Host "1. Create a GitHub account (if you don't have one):" -ForegroundColor White
Write-Host "   https://github.com/signup" -ForegroundColor Cyan
Write-Host ""
Write-Host "2. Create a new repository on GitHub:" -ForegroundColor White
Write-Host "   https://github.com/new" -ForegroundColor Cyan
Write-Host "   - Name: i4iguana" -ForegroundColor Gray
Write-Host "   - Private: YES (recommended)" -ForegroundColor Gray
Write-Host "   - Don't add README or .gitignore" -ForegroundColor Gray
Write-Host ""
Write-Host "3. Run these commands (replace YOUR_USERNAME):" -ForegroundColor White
Write-Host ""
Write-Host '   git add .' -ForegroundColor Yellow
Write-Host '   git commit -m "Initial commit - I4IGUANA"' -ForegroundColor Yellow
Write-Host '   git branch -M main' -ForegroundColor Yellow
Write-Host '   git remote add origin https://github.com/YOUR_USERNAME/i4iguana.git' -ForegroundColor Yellow
Write-Host '   git push -u origin main' -ForegroundColor Yellow
Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host ""

# Ask if user wants to proceed with add and commit
$response = Read-Host "Do you want to add all files and commit now? (y/n)"
if ($response -eq 'y' -or $response -eq 'Y') {
    Write-Host ""
    Write-Host "📦 Adding all files..." -ForegroundColor Cyan
    git add .
    
    Write-Host "💾 Creating commit..." -ForegroundColor Cyan
    git commit -m "Initial commit - I4IGUANA v1.0"
    
    Write-Host ""
    Write-Host "✅ Files committed!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Now create your GitHub repo and run:" -ForegroundColor White
    Write-Host '   git remote add origin https://github.com/YOUR_USERNAME/i4iguana.git' -ForegroundColor Yellow
    Write-Host '   git push -u origin main' -ForegroundColor Yellow
    Write-Host ""
}

Write-Host "🦎 Good luck! - I4IGUANA Backup System" -ForegroundColor Green
Write-Host ""
