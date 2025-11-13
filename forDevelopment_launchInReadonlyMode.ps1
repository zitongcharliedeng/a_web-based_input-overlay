# Build and Launch Electron in Readonly/Click-Through Mode
# For overlay use - window stays on top and clicks pass through

Write-Host "================================" -ForegroundColor Cyan
Write-Host "Build and Launch Overlay (Readonly Mode)" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# Call shared build script
& "$PSScriptRoot\forDevelopment_build.ps1"

if ($LASTEXITCODE -ne 0) {
    Read-Host "Press Enter to exit"
    exit 1
}

# Launch Electron in readonly mode
Write-Host "Launching overlay in readonly mode..." -ForegroundColor Yellow
Write-Host ""
Write-Host "================================" -ForegroundColor Green
Write-Host "Overlay Active (Click-Through)" -ForegroundColor Green
Write-Host "================================" -ForegroundColor Green
Write-Host ""
Write-Host "  Mode: Click-through enabled" -ForegroundColor Cyan
Write-Host "  Editing: Disabled (read-only)" -ForegroundColor Yellow
Write-Host "  Close: Alt+F4 or Task Manager" -ForegroundColor White
Write-Host ""
Write-Host "Watch this terminal for SDL gamepad logs:" -ForegroundColor Cyan
Write-Host "  - Axis motion: [Main] SDL axis leftx: 0.XXX" -ForegroundColor White
Write-Host "  - Buttons: [Main] SDL button down: a (index 0)" -ForegroundColor White
Write-Host ""

try {
    Set-Location wrapWebAppAsStandaloneProgram
    npx electron . --in-clickthrough-readonly-mode
} finally {
    Set-Location ..
    Write-Host ""
    Write-Host "Overlay closed." -ForegroundColor Yellow
}
