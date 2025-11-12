# Install CMake for Windows (required by sdl2-gamecontroller)

Write-Host "CMake Installation for Windows" -ForegroundColor Cyan
Write-Host ""
Write-Host "sdl2-gamecontroller requires CMake to compile native bindings." -ForegroundColor Yellow
Write-Host ""

# Check if CMake is already installed
$cmakeExists = Get-Command cmake -ErrorAction SilentlyContinue
if ($cmakeExists) {
    Write-Host "✓ CMake is already installed!" -ForegroundColor Green
    cmake --version
    Write-Host ""
    Write-Host "You can now run: .\run-windows.ps1" -ForegroundColor Cyan
    exit 0
}

Write-Host "CMake is not installed. Choose installation method:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Install via Chocolatey (recommended if you have it)" -ForegroundColor White
Write-Host "2. Download installer manually" -ForegroundColor White
Write-Host ""

$choice = Read-Host "Enter choice (1 or 2)"

if ($choice -eq "1") {
    Write-Host ""
    Write-Host "Checking for Chocolatey..." -ForegroundColor Yellow
    $chocoExists = Get-Command choco -ErrorAction SilentlyContinue

    if ($chocoExists) {
        Write-Host "Installing CMake via Chocolatey..." -ForegroundColor Green
        choco install cmake -y

        Write-Host ""
        Write-Host "✓ CMake installed!" -ForegroundColor Green
        Write-Host "IMPORTANT: Close this terminal and open a new one for PATH changes to take effect." -ForegroundColor Yellow
        Write-Host "Then run: .\run-windows.ps1" -ForegroundColor Cyan
    } else {
        Write-Host "ERROR: Chocolatey is not installed." -ForegroundColor Red
        Write-Host "Install Chocolatey first: https://chocolatey.org/install" -ForegroundColor Yellow
        Write-Host "Or choose option 2 to download the installer manually." -ForegroundColor Yellow
    }
} elseif ($choice -eq "2") {
    Write-Host ""
    Write-Host "Opening CMake download page in browser..." -ForegroundColor Green
    Start-Process "https://cmake.org/download/"
    Write-Host ""
    Write-Host "Download the 'Windows x64 Installer' and run it." -ForegroundColor Yellow
    Write-Host "During installation, make sure to select 'Add CMake to system PATH'." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "After installation:" -ForegroundColor Cyan
    Write-Host "1. Close this terminal" -ForegroundColor White
    Write-Host "2. Open a new terminal" -ForegroundColor White
    Write-Host "3. Run: .\run-windows.ps1" -ForegroundColor White
} else {
    Write-Host "Invalid choice. Exiting." -ForegroundColor Red
}

Read-Host "Press Enter to exit"
