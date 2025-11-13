# Shared Build Script - Installs dependencies and compiles TypeScript
# Called by other development scripts to follow DRY principles

param(
    [switch]$Silent,        # Suppress output for calling scripts
    [switch]$SkipElectron   # Skip Electron wrapper dependencies (for web-only)
)

if (-not $Silent) {
    Write-Host "================================" -ForegroundColor Cyan
    Write-Host "Building Web-Based Input Overlay" -ForegroundColor Cyan
    Write-Host "================================" -ForegroundColor Cyan
    Write-Host ""
}

# Store original location
$originalLocation = Get-Location

# Determine number of steps
$totalSteps = if ($SkipElectron) { 2 } else { 3 }

# Step 1: Install webApp dependencies
if (-not $Silent) { Write-Host "[1/$totalSteps] Installing webApp dependencies..." -ForegroundColor Yellow }
Set-Location webApp

if ($Silent) {
    npm install 2>&1 | Out-Null
} else {
    npm install
}

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "  npm install failed in webApp!" -ForegroundColor Red
    Write-Host ""
    Set-Location $originalLocation
    exit 1
}

if (-not $Silent) { Write-Host "  webApp dependencies installed" -ForegroundColor Green; Write-Host "" }

# Step 2: Compile TypeScript
if (-not $Silent) { Write-Host "[2/$totalSteps] Compiling TypeScript..." -ForegroundColor Yellow }

if ($Silent) {
    npm run build 2>&1 | Out-Null
} else {
    npm run build
}

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "  TypeScript compilation failed!" -ForegroundColor Red
    Write-Host ""
    Set-Location $originalLocation
    exit 1
}

if (-not $Silent) { Write-Host "  TypeScript compiled" -ForegroundColor Green; Write-Host "" }

# Step 3: Install Electron wrapper dependencies (optional)
if (-not $SkipElectron) {
    if (-not $Silent) { Write-Host "[3/3] Installing Electron wrapper dependencies..." -ForegroundColor Yellow }
    Set-Location ../wrapWebAppAsStandaloneProgram

    if ($Silent) {
        npm install 2>&1 | Out-Null
    } else {
        npm install
    }

    if ($LASTEXITCODE -ne 0) {
        Write-Host ""
        Write-Host "  npm install failed in wrapWebAppAsStandaloneProgram!" -ForegroundColor Red
        Write-Host ""
        Set-Location $originalLocation
        exit 1
    }

    if (-not $Silent) { Write-Host "  Electron dependencies installed" -ForegroundColor Green; Write-Host "" }
}

# Return to original location
Set-Location $originalLocation

if (-not $Silent) {
    Write-Host "================================" -ForegroundColor Green
    Write-Host "Build Complete" -ForegroundColor Green
    Write-Host "================================" -ForegroundColor Green
    Write-Host ""
}
