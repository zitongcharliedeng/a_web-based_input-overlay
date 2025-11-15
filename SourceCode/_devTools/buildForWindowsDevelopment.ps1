param(
    [Parameter(Mandatory=$false)]
    [ValidateSet("build", "website", "webapp-interactive", "webapp-clickthrough")]
    [string]$Mode
)

if (-not $Mode) {
    Write-Host "`n=== Build & Launch Options ===" -ForegroundColor Cyan
    Write-Host "1. Build only"
    Write-Host "2. Build and launch website version"
    Write-Host "3. Build and launch webapp (interactive mode)"
    Write-Host "4. Build and launch webapp (clickthrough-readonly mode)"

    $choice = Read-Host "`nSelect (1-4)"
    $Mode = switch ($choice) {
        "1" { "build" }
        "2" { "website" }
        "3" { "webapp-interactive" }
        "4" { "webapp-clickthrough" }
        default {
            Write-Host "Invalid choice" -ForegroundColor Red
            exit 1
        }
    }
}

Set-Location $PSScriptRoot

# Check if node_modules exists, install if needed
if (-not (Test-Path "node_modules")) {
    Write-Host "`nInstalling dependencies..." -ForegroundColor Yellow
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "npm install failed" -ForegroundColor Red
        exit 1
    }
}

Write-Host "`nBuilding TypeScript..." -ForegroundColor Yellow
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "Build failed" -ForegroundColor Red
    exit 1
}

switch ($Mode) {
    "build" {
        Write-Host "Build complete" -ForegroundColor Green
    }
    "website" {
        Write-Host "`nLaunching website version at http://localhost:8080..." -ForegroundColor Green
        npm run serve
    }
    "webapp-interactive" {
        Write-Host "`nLaunching webapp in interactive mode..." -ForegroundColor Green
        npm run electron:dev
    }
    "webapp-clickthrough" {
        Write-Host "`nLaunching webapp in clickthrough-readonly mode..." -ForegroundColor Green
        npm run electron:clickthrough-readonly
    }
}
