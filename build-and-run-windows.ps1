# Unified Build and Run Script for Windows
# Automatically installs CMake if needed, runs npm install, and launches Electron

Write-Host "================================" -ForegroundColor Cyan
Write-Host "Web-Based Input Overlay Builder" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Install dependencies
Write-Host "[1/2] Installing dependencies..." -ForegroundColor Yellow
npm install

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "  ✗ npm install failed!" -ForegroundColor Red
    Write-Host "  Check the error messages above." -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host "  ✓ Dependencies installed" -ForegroundColor Green
Write-Host ""

# Step 2: Launch Electron
Write-Host "[2/2] Launching Electron overlay..." -ForegroundColor Yellow
Write-Host ""
Write-Host "================================" -ForegroundColor Green
Write-Host "Starting Web-Based Input Overlay" -ForegroundColor Green
Write-Host "================================" -ForegroundColor Green
Write-Host ""

# Start Electron
npx electron . --with-dev-console

Write-Host ""
Write-Host "Overlay closed." -ForegroundColor Yellow
