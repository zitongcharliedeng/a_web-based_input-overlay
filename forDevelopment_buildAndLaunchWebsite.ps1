# Build and Launch Web Version (Browser-Based)
# Compiles TypeScript and serves the web app on localhost

Write-Host "================================" -ForegroundColor Cyan
Write-Host "Build and Launch Web Version" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# Call shared build script (skip Electron dependencies)
& "$PSScriptRoot\forDevelopment_build.ps1" -SkipElectron

if ($LASTEXITCODE -ne 0) {
    Read-Host "Press Enter to exit"
    exit 1
}

# Start web server
Write-Host "Starting web server..." -ForegroundColor Yellow
Write-Host ""
Write-Host "================================" -ForegroundColor Green
Write-Host "Web Server Running" -ForegroundColor Green
Write-Host "================================" -ForegroundColor Green
Write-Host ""
Write-Host "  URL: http://localhost:8080" -ForegroundColor Cyan
Write-Host "  Press Ctrl+C to stop" -ForegroundColor Yellow
Write-Host ""

Set-Location webApp
npm run serve
