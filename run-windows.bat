@echo off
REM Run script for Windows testing
REM Pulls latest code and launches both web + Electron versions

echo Analog Keyboard Overlay - Windows Test
echo.

REM Pull latest
echo [1/3] Pulling latest code...
git pull origin uiohook-attempt
if errorlevel 1 (
    echo WARNING: Git pull failed. Continuing anyway...
)
echo.

REM Install/update dependencies
echo [2/3] Installing dependencies...
call npm install
if errorlevel 1 (
    echo ERROR: npm install failed!
    pause
    exit /b 1
)
echo.

REM Launch both versions
echo [3/3] Launching web + Electron...
echo.
echo TEST: Press WASD keys when focused, then Alt+Tab away and press again
echo QUESTION: Does Electron still capture keys when unfocused?
echo.

start index.html
timeout /t 1 /nobreak >nul
call npm run start:win

pause
