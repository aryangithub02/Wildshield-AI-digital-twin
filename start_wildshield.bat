@echo off
title WildShield AI - System Launcher
color 0A

echo ================================================================
echo               WILDSHIELD AI - SYSTEM LAUNCHER
echo ================================================================
echo.

:: 1. Backend and Web Dashboard Directory
for %%I in ("%~dp0.") do set "BACKEND_DIR=%%~fI"

:: 2. Mobile App (Expo) Directory
if exist "%~dp0..\WildShieldAI App\package.json" (
    for %%I in ("%~dp0..\WildShieldAI App") do set "MOBILE_DIR=%%~fI"
) else if exist "%USERPROFILE%\OneDrive\Desktop\WildShieldAI App\package.json" (
    set "MOBILE_DIR=%USERPROFILE%\OneDrive\Desktop\WildShieldAI App"
) else if exist "%USERPROFILE%\Desktop\WildShieldAI App\package.json" (
    set "MOBILE_DIR=%USERPROFILE%\Desktop\WildShieldAI App"
) else (
    set "MOBILE_DIR=C:\Users\lenovo\OneDrive\Desktop\WildShieldAI App"
)

echo [INFO] Backend and Web Directory : %BACKEND_DIR%
echo [INFO] Mobile App Directory      : %MOBILE_DIR%
echo.

:: Check and free port 8000 if occupied by an orphaned process
echo [INFO] Checking port 8000 availability...
powershell -NoProfile -Command "$conns = Get-NetTCPConnection -LocalPort 8000 -State Listen -ErrorAction SilentlyContinue; if ($conns) { foreach ($c in $conns) { if ($c.OwningProcess -gt 0) { Write-Host '[INFO] Releasing port 8000 from PID:' $c.OwningProcess; Stop-Process -Id $c.OwningProcess -Force -ErrorAction SilentlyContinue } } }"

:: Detect Python executable (.venv preferred)
if exist "%BACKEND_DIR%\.venv\Scripts\python.exe" (
    set "PYTHON_CMD="%BACKEND_DIR%\.venv\Scripts\python.exe""
) else (
    set "PYTHON_CMD=python"
)

:: 1. Launch FastAPI Backend Server
echo.
echo [1/3] Starting FastAPI Backend Server on port 8000...
start "WildShield AI - Backend (Port 8000)" /D "%BACKEND_DIR%" cmd /k %PYTHON_CMD% -m uvicorn backend.server:app --host 0.0.0.0 --port 8000 --reload

:: 2. Launch Vite Web Dashboard directly via Node (Bypasses 7s npm wrapper overhead)
echo [2/3] Starting Web Dashboard Frontend (Vite Instant Engine)...
start "WildShield AI - Web Dashboard" /D "%BACKEND_DIR%" cmd /k node node_modules\vite\bin\vite.js

:: 3. Launch Expo Mobile App (Optional or Fast Mode)
echo.
echo Launching options:
echo  [1] Web + Backend Only (Instant - Recommended)
echo  [2] Full System with Expo Mobile App
choice /C 12 /N /T 2 /D 1 /M "Select option [1 or 2] (Defaulting to 1 in 2s): "
if errorlevel 2 (
    if exist "%MOBILE_DIR%\package.json" (
        echo [3/3] Starting Expo Mobile App Server...
        start "WildShield AI - Mobile App (Expo)" /D "%MOBILE_DIR%" cmd /k npx expo start
    ) else (
        echo [WARNING] Mobile app directory not found at: %MOBILE_DIR%
    )
) else (
    echo [INFO] Web & Backend mode active. Skipping heavy Expo mobile bundler.
)

echo.
echo ================================================================
echo  WildShield AI servers started in < 2 seconds!
echo   - Backend API & WebSockets: http://localhost:8000
echo   - Live Camera Feed:         http://localhost:8000/api/camera/stream
echo   - Web Dashboard:            http://localhost:5173
echo ================================================================
echo.
timeout /t 1 /nobreak >nul
start http://localhost:5173

