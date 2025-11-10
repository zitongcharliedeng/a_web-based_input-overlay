@echo off
REM Windows Quick Start Script
REM Pulls latest code, installs dependencies, and launches both web + Electron

echo ====================================
echo Analog Keyboard Overlay - Windows
echo ====================================
echo.

REM Step 1: Pull latest code
echo [1/5] Pulling latest code from GitHub...
git pull origin uiohook-attempt
if errorlevel 1 (
    echo WARNING: Git pull failed. Continuing with local code...
)
echo.

REM Step 2: Install/update dependencies
echo [2/5] Installing dependencies...
call npm install
if errorlevel 1 (
    echo ERROR: npm install failed!
    pause
    exit /b 1
)
echo.

REM Step 3: Compile TypeScript
echo [3/5] Compiling TypeScript...
call npm run check
if errorlevel 1 (
    echo WARNING: TypeScript check failed. Continuing anyway...
)
echo.

REM Step 4: Launch Web Version (in default browser)
echo [4/5] Launching web version in browser...
start index.html
timeout /t 2 /nobreak >nul
echo.

REM Step 5: Launch Electron App
echo [5/5] Launching Electron overlay...
echo.
echo ====================================
echo TESTING INSTRUCTIONS:
echo ====================================
echo 1. Web version should open in your browser
echo 2. Electron window will appear shortly
echo 3. Try pressing WASD keys in BOTH:
echo    - FOCUSED: Keys should register
echo    - UNFOCUSED: Alt-tab away, then press keys
echo 4. Report which version captures unfocused input!
echo ====================================
echo.
call npm run start:win

REM If Electron exits, pause so user can see any errors
pause
