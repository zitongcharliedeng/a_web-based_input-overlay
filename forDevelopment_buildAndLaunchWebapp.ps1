# Build and Launch Electron Wrapper (Standalone Application)
# Compiles TypeScript and launches Electron with DevTools

Write-Host "================================" -ForegroundColor Cyan
Write-Host "Build and Launch Electron App" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Install webApp dependencies
Write-Host "[1/4] Installing webApp dependencies..." -ForegroundColor Yellow
Set-Location webApp
npm install

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "  npm install failed in webApp!" -ForegroundColor Red
    Write-Host ""
    Set-Location ..
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host "  webApp dependencies installed" -ForegroundColor Green
Write-Host ""

# Step 2: Compile TypeScript
Write-Host "[2/4] Compiling TypeScript..." -ForegroundColor Yellow
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "  TypeScript compilation failed!" -ForegroundColor Red
    Write-Host ""
    Set-Location ..
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host "  TypeScript compiled" -ForegroundColor Green
Write-Host ""

# Step 3: Install Electron wrapper dependencies
Write-Host "[3/4] Installing Electron wrapper dependencies..." -ForegroundColor Yellow
Set-Location ../wrapWebAppAsStandaloneProgram
npm install

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "  npm install failed in wrapWebAppAsStandaloneProgram!" -ForegroundColor Red
    Write-Host ""
    Set-Location ..
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host "  Electron dependencies installed" -ForegroundColor Green
Write-Host ""

# Step 4: Launch Electron with DevTools
Write-Host "[4/4] Launching Electron overlay..." -ForegroundColor Yellow
Write-Host ""
Write-Host "================================" -ForegroundColor Green
Write-Host "Starting Electron Overlay" -ForegroundColor Green
Write-Host "================================" -ForegroundColor Green
Write-Host ""
Write-Host "Watch this terminal for SDL gamepad logs:" -ForegroundColor Cyan
Write-Host "  - Axis motion: [Main] SDL axis leftx: 0.XXX" -ForegroundColor White
Write-Host "  - Buttons: [Main] SDL button down: a (index 0)" -ForegroundColor White
Write-Host ""

# Start Electron with DevTools
npm run dev

Write-Host ""
Write-Host "Overlay closed." -ForegroundColor Yellow

# Return to root directory
Set-Location ..
