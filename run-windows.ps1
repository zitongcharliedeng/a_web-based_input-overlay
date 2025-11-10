# Windows Quick Start Script (PowerShell)
# Pulls latest code, installs dependencies, and launches both web + Electron

Write-Host "====================================" -ForegroundColor Cyan
Write-Host "Analog Keyboard Overlay - Windows" -ForegroundColor Cyan
Write-Host "====================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Pull latest code
Write-Host "[1/5] Pulling latest code from GitHub..." -ForegroundColor Yellow
git pull origin uiohook-attempt
if ($LASTEXITCODE -ne 0) {
    Write-Host "WARNING: Git pull failed. Continuing with local code..." -ForegroundColor Red
}
Write-Host ""

# Step 2: Install/update dependencies
Write-Host "[2/5] Installing dependencies..." -ForegroundColor Yellow
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: npm install failed!" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}
Write-Host ""

# Step 3: Compile TypeScript
Write-Host "[3/5] Compiling TypeScript..." -ForegroundColor Yellow
npm run check
if ($LASTEXITCODE -ne 0) {
    Write-Host "WARNING: TypeScript check failed. Continuing anyway..." -ForegroundColor Red
}
Write-Host ""

# Step 4: Launch Web Version (in default browser)
Write-Host "[4/5] Launching web version in browser..." -ForegroundColor Yellow
Start-Process "index.html"
Start-Sleep -Seconds 2
Write-Host ""

# Step 5: Launch Electron App
Write-Host "[5/5] Launching Electron overlay..." -ForegroundColor Yellow
Write-Host ""
Write-Host "====================================" -ForegroundColor Green
Write-Host "TESTING INSTRUCTIONS:" -ForegroundColor Green
Write-Host "====================================" -ForegroundColor Green
Write-Host "1. Web version should open in your browser"
Write-Host "2. Electron window will appear shortly"
Write-Host "3. Try pressing WASD keys in BOTH:"
Write-Host "   - FOCUSED: Keys should register"
Write-Host "   - UNFOCUSED: Alt-tab away, then press keys"
Write-Host "4. Report which version captures unfocused input!"
Write-Host "====================================" -ForegroundColor Green
Write-Host ""

npm run start:win

# If Electron exits, pause so user can see any errors
Read-Host "Press Enter to exit"
