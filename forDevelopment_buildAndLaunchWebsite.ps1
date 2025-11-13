# Build and Launch Web Version (Browser-Based)
# Compiles TypeScript and serves the web app on localhost

Write-Host "================================" -ForegroundColor Cyan
Write-Host "Build and Launch Web Version" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Install webApp dependencies
Write-Host "[1/3] Installing webApp dependencies..." -ForegroundColor Yellow
Set-Location webApp
npm install

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "  npm install failed!" -ForegroundColor Red
    Write-Host ""
    Set-Location ..
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host "  Dependencies installed" -ForegroundColor Green
Write-Host ""

# Step 2: Compile TypeScript
Write-Host "[2/3] Compiling TypeScript..." -ForegroundColor Yellow
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

# Step 3: Start web server
Write-Host "[3/3] Starting web server..." -ForegroundColor Yellow
Write-Host ""
Write-Host "================================" -ForegroundColor Green
Write-Host "Web Server Running" -ForegroundColor Green
Write-Host "================================" -ForegroundColor Green
Write-Host ""
Write-Host "  URL: http://localhost:8080" -ForegroundColor Cyan
Write-Host "  Press Ctrl+C to stop" -ForegroundColor Yellow
Write-Host ""

npm run serve
