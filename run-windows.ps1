# Run script for Windows testing
# Pulls latest code and launches both web + Electron versions

Write-Host "Analog Keyboard Overlay - Windows Test" -ForegroundColor Cyan
Write-Host ""

# Pull latest
Write-Host "[1/3] Pulling latest code..." -ForegroundColor Yellow
git pull
if ($LASTEXITCODE -ne 0) {
    Write-Host "WARNING: Git pull failed. Continuing anyway..." -ForegroundColor Red
}
Write-Host ""

# Install/update dependencies
Write-Host "[2/3] Installing dependencies..." -ForegroundColor Yellow
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: npm install failed!" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}
Write-Host ""

# Launch both versions
Write-Host "[3/3] Launching web server + Electron..." -ForegroundColor Yellow
Write-Host ""
Write-Host "Web version will open at http://localhost:8080" -ForegroundColor Green
Write-Host "Electron window will also appear" -ForegroundColor Green
Write-Host ""
Write-Host "TEST: Press WASD keys when focused, then Alt+Tab away and press again" -ForegroundColor Cyan
Write-Host "QUESTION: Does Electron still capture keys when unfocused?" -ForegroundColor Cyan
Write-Host ""

# Start web server in background
Start-Process -NoNewWindow powershell -ArgumentList "npm run start:web"
Start-Sleep -Seconds 2

# Start Electron in foreground
npm run start:win

Read-Host "Press Enter to exit"
