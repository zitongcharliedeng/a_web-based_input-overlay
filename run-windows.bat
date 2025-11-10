@echo off
REM Run script for Windows testing
REM Pulls latest code and launches both web + Electron versions

echo Analog Keyboard Overlay - Windows Test
echo.

REM Pull latest
echo [1/3] Pulling latest code...
git pull
if errorlevel 1 (
    echo WARNING: Git pull failed. Continuing anyway...
)
echo.

REM Install/update dependencies
echo [2/4] Installing dependencies...
call npm install
if errorlevel 1 (
    echo ERROR: npm install failed!
    pause
    exit /b 1
)
echo.

REM Compile TypeScript
echo [3/4] Compiling TypeScript...
call npx tsc
if errorlevel 1 (
    echo WARNING: TypeScript compilation had errors. Continuing anyway...
)
echo.

REM Launch both versions
echo [4/4] Launching web server + Electron...
echo.
echo Web version will open at http://localhost:8080
echo Electron window will also appear
echo.
echo TEST: Press WASD keys when focused, then Alt+Tab away and press again
echo QUESTION: Does Electron still capture keys when unfocused?
echo.

REM Start web server in background
start /b npm run start:web
timeout /t 2 /nobreak >nul

REM Start Electron in foreground
call npm run start:win

pause
