# Build and Launch Electron Wrapper (Standalone Application)
# Compiles TypeScript and launches Electron with DevTools

Write-Host "================================" -ForegroundColor Cyan
Write-Host "Build and Launch Electron App" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# Call shared build script
& "$PSScriptRoot\forDevelopment_build.ps1"

if ($LASTEXITCODE -ne 0) {
    Read-Host "Press Enter to exit"
    exit 1
}

# Launch Electron with DevTools
Write-Host "Launching Electron overlay..." -ForegroundColor Yellow
Write-Host ""
Write-Host "================================" -ForegroundColor Green
Write-Host "Starting Electron Overlay" -ForegroundColor Green
Write-Host "================================" -ForegroundColor Green
Write-Host ""
Write-Host "Watch this terminal for SDL gamepad logs:" -ForegroundColor Cyan
Write-Host "  - Axis motion: [Main] SDL axis leftx: 0.XXX" -ForegroundColor White
Write-Host "  - Buttons: [Main] SDL button down: a (index 0)" -ForegroundColor White
Write-Host ""

try {
    Set-Location wrapWebAppAsStandaloneProgram
    npm run dev
} finally {
    Set-Location ..
    Write-Host ""
    Write-Host "Overlay closed." -ForegroundColor Yellow
}
