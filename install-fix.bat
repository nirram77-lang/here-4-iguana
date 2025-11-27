@echo off
echo ============================================
echo    FIXING DISTANCE BUG - I4IGUANA
echo ============================================
echo.

REM Step 1: Check if lib directory exists
echo [1/5] Checking lib directory...
if not exist "lib" (
    echo Creating lib directory...
    mkdir lib
) else (
    echo lib directory exists ✓
)
echo.

REM Step 2: Backup existing location-service.ts if it exists
echo [2/5] Backing up existing files...
if exist "lib\location-service.ts" (
    echo Backing up location-service.ts...
    copy "lib\location-service.ts" "lib\location-service.ts.backup" >nul
    echo Backup created ✓
) else (
    echo No existing location-service.ts found
)
echo.

REM Step 3: Copy the fixed location-service.ts
echo [3/5] Installing fixed location-service.ts...
if exist "lib-location-service.ts" (
    copy "lib-location-service.ts" "lib\location-service.ts" >nul
    echo Fixed location-service.ts installed ✓
) else (
    echo ERROR: lib-location-service.ts not found!
    echo Please make sure you downloaded all files.
    pause
    exit /b 1
)
echo.

REM Step 4: Copy constants.ts if it exists
echo [4/5] Installing constants.ts...
if exist "constants.ts" (
    copy "constants.ts" "lib\constants.ts" >nul
    echo constants.ts installed ✓
) else (
    echo WARNING: constants.ts not found, skipping...
)
echo.

REM Step 5: Clean cache
echo [5/5] Cleaning cache...
if exist ".next" (
    echo Removing .next directory...
    rmdir /s /q ".next" 2>nul
    echo Cache cleaned ✓
) else (
    echo No cache to clean
)
echo.

echo ============================================
echo    ✅ INSTALLATION COMPLETE!
echo ============================================
echo.
echo Next steps:
echo 1. Run: npm run dev
echo 2. Test the app - distances should now show in meters (50m, 150m, etc.)
echo 3. If you see any errors, check the console
echo.
echo The backup of your old file is in: lib\location-service.ts.backup
echo.
pause
