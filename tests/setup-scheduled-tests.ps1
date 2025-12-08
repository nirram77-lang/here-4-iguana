# ═══════════════════════════════════════════════════════════════════════════
# I4IGUANA - Setup Scheduled Tests (Windows Task Scheduler)
# Run this ONCE as Administrator to set up hourly tests
# ═══════════════════════════════════════════════════════════════════════════

# Must run as Administrator
if (-NOT ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")) {
    Write-Host "❌ Please run this script as Administrator!" -ForegroundColor Red
    Write-Host "Right-click PowerShell -> Run as Administrator" -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host "        🦎 I4IGUANA - Setup Scheduled Tests                    " -ForegroundColor Green
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host ""

# Configuration
$TaskName = "I4IGUANA-Hourly-Tests"
$ProjectPath = "C:\Users\nirra\OneDrive\Desktop\HERE4IGUANA App\here-4-iguana"
$ScriptPath = "$ProjectPath\tests\run-tests.ps1"

# Remove existing task if exists
$existingTask = Get-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue
if ($existingTask) {
    Write-Host "🗑️ Removing existing task..." -ForegroundColor Yellow
    Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false
}

# Create the action
$Action = New-ScheduledTaskAction -Execute "powershell.exe" `
    -Argument "-ExecutionPolicy Bypass -File `"$ScriptPath`" -SkipBuild" `
    -WorkingDirectory $ProjectPath

# Create the trigger (every hour)
$Trigger = New-ScheduledTaskTrigger -Once -At (Get-Date) -RepetitionInterval (New-TimeSpan -Hours 1) -RepetitionDuration (New-TimeSpan -Days 365)

# Create settings
$Settings = New-ScheduledTaskSettingsSet `
    -StartWhenAvailable `
    -DontStopOnIdleEnd `
    -AllowStartIfOnBatteries `
    -DontStopIfGoingOnBatteries `
    -ExecutionTimeLimit (New-TimeSpan -Minutes 30)

# Register the task
Write-Host "📅 Creating scheduled task..." -ForegroundColor Cyan
Register-ScheduledTask -TaskName $TaskName `
    -Action $Action `
    -Trigger $Trigger `
    -Settings $Settings `
    -Description "I4IGUANA automated tests - runs every hour" `
    -User "SYSTEM" `
    -RunLevel Highest

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host "        ✅ Scheduled task created successfully!                 " -ForegroundColor Green
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host ""
Write-Host "Task Name: $TaskName" -ForegroundColor Cyan
Write-Host "Frequency: Every 1 hour" -ForegroundColor Cyan
Write-Host "Script: $ScriptPath" -ForegroundColor Cyan
Write-Host ""
Write-Host "To view/edit: Open Task Scheduler -> I4IGUANA-Hourly-Tests" -ForegroundColor Yellow
Write-Host "To run now: Get-ScheduledTask '$TaskName' | Start-ScheduledTask" -ForegroundColor Yellow
Write-Host "To remove: Unregister-ScheduledTask -TaskName '$TaskName'" -ForegroundColor Yellow
Write-Host ""
