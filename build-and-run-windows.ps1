# Unified Build and Run Script for Windows
# Automatically installs CMake if needed, runs npm install, and launches Electron

Write-Host "================================" -ForegroundColor Cyan
Write-Host "Web-Based Input Overlay Builder" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Check CMake
Write-Host "[1/3] Checking CMake..." -ForegroundColor Yellow
$cmakeExists = Get-Command cmake -ErrorAction SilentlyContinue

if (-not $cmakeExists) {
    Write-Host "  ✗ CMake not found" -ForegroundColor Red
    Write-Host ""
    Write-Host "  Attempting automatic installation via Chocolatey..." -ForegroundColor Yellow

    $chocoExists = Get-Command choco -ErrorAction SilentlyContinue
    if ($chocoExists) {
        Write-Host "  Installing CMake..." -ForegroundColor Green
        choco install cmake -y

        # Refresh environment variables
        $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")

        # Check again
        $cmakeExists = Get-Command cmake -ErrorAction SilentlyContinue
        if ($cmakeExists) {
            Write-Host "  ✓ CMake installed successfully!" -ForegroundColor Green
        } else {
            Write-Host ""
            Write-Host "  ✓ CMake installed, but PATH not updated yet." -ForegroundColor Yellow
            Write-Host "  SOLUTION: Close this terminal, open a new one, and run this script again." -ForegroundColor Cyan
            Read-Host "Press Enter to exit"
            exit 1
        }
    } else {
        Write-Host ""
        Write-Host "  ERROR: Cannot auto-install CMake (Chocolatey not found)" -ForegroundColor Red
        Write-Host ""
        Write-Host "  MANUAL INSTALLATION OPTIONS:" -ForegroundColor Yellow
        Write-Host "  1. Install Chocolatey: https://chocolatey.org/install" -ForegroundColor White
        Write-Host "     Then run this script again" -ForegroundColor White
        Write-Host "  2. Download CMake manually: https://cmake.org/download/" -ForegroundColor White
        Write-Host "     Install and add to PATH, then run this script again" -ForegroundColor White
        Write-Host ""
        $openBrowser = Read-Host "Open CMake download page? (y/n)"
        if ($openBrowser -eq "y") {
            Start-Process "https://cmake.org/download/"
        }
        Read-Host "Press Enter to exit"
        exit 1
    }
} else {
    Write-Host "  ✓ CMake found:" -ForegroundColor Green
    cmake --version | Select-Object -First 1
}

Write-Host ""

# Step 2: Install dependencies
Write-Host "[2/3] Installing dependencies..." -ForegroundColor Yellow
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

# Step 3: Launch Electron
Write-Host "[3/3] Launching Electron overlay..." -ForegroundColor Yellow
Write-Host ""
Write-Host "================================" -ForegroundColor Green
Write-Host "Starting Web-Based Input Overlay" -ForegroundColor Green
Write-Host "================================" -ForegroundColor Green
Write-Host ""

# Start Electron
npx electron . --with-dev-console

Write-Host ""
Write-Host "Overlay closed." -ForegroundColor Yellow
