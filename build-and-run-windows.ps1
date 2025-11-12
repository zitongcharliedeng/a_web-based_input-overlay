# Unified Build and Run Script for Windows
# Checks CMake, installs dependencies, compiles TypeScript, and launches Electron

Write-Host "================================" -ForegroundColor Cyan
Write-Host "Web-Based Input Overlay Builder" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Check CMake (required for sdl2-gamecontroller)
Write-Host "[1/4] Checking CMake installation..." -ForegroundColor Yellow

$cmakeExists = Get-Command cmake -ErrorAction SilentlyContinue
if ($cmakeExists) {
    Write-Host "  CMake found:" (cmake --version | Select-Object -First 1) -ForegroundColor Green
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "  CMake NOT FOUND" -ForegroundColor Red
    Write-Host ""
    Write-Host "  WHY NEEDED:" -ForegroundColor Yellow
    Write-Host "  - sdl2-gamecontroller requires CMake to compile SDL2 bindings" -ForegroundColor White
    Write-Host "  - SDL2 provides unfocused gamepad input (same as OBS input-overlay plugin)" -ForegroundColor White
    Write-Host ""
    Write-Host "  INSTALLATION OPTIONS:" -ForegroundColor Yellow
    Write-Host "  1. Via Chocolatey (if installed): choco install cmake -y" -ForegroundColor White
    Write-Host "  2. Manual download: https://cmake.org/download/" -ForegroundColor White
    Write-Host "     - Get 'Windows x64 Installer'" -ForegroundColor White
    Write-Host "     - During install: CHECK 'Add CMake to system PATH'" -ForegroundColor White
    Write-Host ""
    Write-Host "  After installing CMake:" -ForegroundColor Cyan
    Write-Host "  1. Close this terminal" -ForegroundColor White
    Write-Host "  2. Open NEW terminal (for PATH refresh)" -ForegroundColor White
    Write-Host "  3. Run this script again: .\build-and-run-windows.ps1" -ForegroundColor White
    Write-Host ""

    $choice = Read-Host "Install via Chocolatey now? (y/n)"
    if ($choice -eq "y" -or $choice -eq "Y") {
        $chocoExists = Get-Command choco -ErrorAction SilentlyContinue
        if ($chocoExists) {
            Write-Host ""
            Write-Host "  Installing CMake via Chocolatey..." -ForegroundColor Green
            choco install cmake -y

            if ($LASTEXITCODE -eq 0) {
                Write-Host ""
                Write-Host "  CMake installed successfully!" -ForegroundColor Green
                Write-Host "  IMPORTANT: Close this terminal and run script again in NEW terminal" -ForegroundColor Yellow
            } else {
                Write-Host ""
                Write-Host "  Chocolatey install failed. Try manual download." -ForegroundColor Red
            }
        } else {
            Write-Host ""
            Write-Host "  Chocolatey not found. Opening download page..." -ForegroundColor Yellow
            Start-Process "https://cmake.org/download/"
            Write-Host "  Follow manual installation steps above." -ForegroundColor Yellow
        }
    } else {
        Write-Host ""
        Write-Host "  Opening CMake download page..." -ForegroundColor Yellow
        Start-Process "https://cmake.org/download/"
    }

    Write-Host ""
    Read-Host "Press Enter to exit"
    exit 1
}

# Step 2: Install dependencies
Write-Host "[2/4] Installing npm dependencies..." -ForegroundColor Yellow

npm install

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "  npm install failed!" -ForegroundColor Red
    Write-Host ""
    Write-Host "  COMMON ISSUES:" -ForegroundColor Yellow
    Write-Host "  - CMake not in PATH (close terminal, open new one)" -ForegroundColor White
    Write-Host "  - Missing build tools (install Visual Studio Build Tools)" -ForegroundColor White
    Write-Host "  - Network error (check internet connection)" -ForegroundColor White
    Write-Host ""
    Write-Host "  Check error messages above for details." -ForegroundColor Yellow
    Write-Host ""
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host "  npm dependencies installed" -ForegroundColor Green
Write-Host ""

# Step 3: Compile TypeScript
Write-Host "[3/4] Compiling TypeScript..." -ForegroundColor Yellow

npx tsc

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "  TypeScript compilation failed!" -ForegroundColor Red
    Write-Host "  Check error messages above." -ForegroundColor Yellow
    Write-Host ""
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host "  TypeScript compiled successfully" -ForegroundColor Green
Write-Host ""

# Step 4: Launch Electron
Write-Host "[4/4] Launching Electron overlay..." -ForegroundColor Yellow
Write-Host ""
Write-Host "================================" -ForegroundColor Green
Write-Host "Starting Web-Based Input Overlay" -ForegroundColor Green
Write-Host "================================" -ForegroundColor Green
Write-Host ""
Write-Host "Watch this terminal for SDL gamepad logs:" -ForegroundColor Cyan
Write-Host "  - Axis motion: [Main] SDL axis leftx: 0.XXX" -ForegroundColor White
Write-Host "  - Buttons: [Main] SDL button down: a (index 0)" -ForegroundColor White
Write-Host ""

# Start Electron with DevTools
npx electron . --with-dev-console

Write-Host ""
Write-Host "Overlay closed." -ForegroundColor Yellow
