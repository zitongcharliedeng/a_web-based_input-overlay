# Unified Build and Run Script for Windows
# Checks CMake, installs dependencies, compiles TypeScript, and launches Electron

Write-Host "================================" -ForegroundColor Cyan
Write-Host "Web-Based Input Overlay Builder" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Install dependencies
Write-Host "[1/3] Installing npm dependencies..." -ForegroundColor Yellow

npm install

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "  npm install failed!" -ForegroundColor Red
    Write-Host ""
    Write-Host "  COMMON ISSUES:" -ForegroundColor Yellow
    Write-Host "  - Missing build tools (install Visual Studio Build Tools)" -ForegroundColor White
    Write-Host "  - Network error (check internet connection)" -ForegroundColor White
    Write-Host ""
    Write-Host "  Check error messages above for details." -ForegroundColor Yellow
    Write-Host ""
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host "  npm dependencies installed" -ForegroundColor Green
Write-Host ""

# Step 2: Compile TypeScript
Write-Host "[2/3] Compiling TypeScript..." -ForegroundColor Yellow

npx tsc

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "  TypeScript compilation failed!" -ForegroundColor Red
    Write-Host "  Check error messages above." -ForegroundColor Yellow
    Write-Host ""
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host "  TypeScript compiled successfully" -ForegroundColor Green
Write-Host ""

# Step 3: Launch Electron
Write-Host "[3/3] Launching Electron overlay..." -ForegroundColor Yellow
Write-Host ""
Write-Host "================================" -ForegroundColor Green
Write-Host "Starting Web-Based Input Overlay" -ForegroundColor Green
Write-Host "================================" -ForegroundColor Green
Write-Host ""
Write-Host "Watch this terminal for SDL gamepad logs:" -ForegroundColor Cyan
Write-Host "  - Axis motion: [Main] SDL axis leftx: 0.XXX" -ForegroundColor White
Write-Host "  - Buttons: [Main] SDL button down: a (index 0)" -ForegroundColor White
Write-Host ""

# Start Electron with DevTools
npx electron . --with-dev-console

Write-Host ""
Write-Host "Overlay closed." -ForegroundColor Yellow
