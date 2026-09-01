@echo off
title WildShield AI - System Launcher
color 0A

echo ================================================================
echo               WILDSHIELD AI - SYSTEM LAUNCHER
echo ================================================================
echo.

:: Determine root paths
set "SCRIPT_DIR=%~dp0"

:: 1. Backend & Web Dashboard Directory
if exist "%SCRIPT_DIR%backend\server.py" (
    set "BACKEND_DIR=%SCRIPT_DIR%"
) else if exist "%USERPROFILE%\OneDrive\Desktop\Wildshield AI digital twin\backend\server.py" (
    set "BACKEND_DIR=%USERPROFILE%\OneDrive\Desktop\Wildshield AI digital twin"
) else if exist "%USERPROFILE%\Desktop\Wildshield AI digital twin\backend\server.py" (
    set "BACKEND_DIR=%USERPROFILE%\Desktop\Wildshield AI digital twin"
) else (
    set "BACKEND_DIR=C:\Users\lenovo\OneDrive\Desktop\Wildshield AI digital twin"
)

:: 2. Mobile App (Expo) Directory
if exist "%SCRIPT_DIR%..\WildShieldAI App\package.json" (
    pushd "%SCRIPT_DIR%..\WildShieldAI App"
    set "MOBILE_DIR=%CD%"
    popd
) else if exist "%USERPROFILE%\OneDrive\Desktop\WildShieldAI App\package.json" (
    set "MOBILE_DIR=%USERPROFILE%\OneDrive\Desktop\WildShieldAI App"
) else if exist "%USERPROFILE%\Desktop\WildShieldAI App\package.json" (
    set "MOBILE_DIR=%USERPROFILE%\Desktop\WildShieldAI App"
) else (
    set "MOBILE_DIR=C:\Users\lenovo\OneDrive\Desktop\WildShieldAI App"
)

echo [INFO] Backend & Web Directory : %BACKEND_DIR%
echo [INFO] Mobile App Directory    : %MOBILE_DIR%
echo.

:: 1. Launch FastAPI Backend Server
echo [1/3] Starting FastAPI Backend Server on port 8000...
start "WildShield AI - Backend (Port 8000)" cmd /k "cd /d "%BACKEND_DIR%" && python -m uvicorn backend.server:app --host 0.0.0.0 --port 8000 --reload"

timeout /t 2 /nobreak >nul

:: 2. Launch Vite Web Dashboard
echo [2/3] Starting Web Dashboard Frontend (Vite)...
start "WildShield AI - Web Dashboard" cmd /k "cd /d "%BACKEND_DIR%" && npm run dev"

timeout /t 2 /nobreak >nul

:: 3. Launch Expo Mobile App
if exist "%MOBILE_DIR%" (
    echo [3/3] Starting Expo Mobile App Server...
    start "WildShield AI - Mobile App (Expo)" cmd /k "cd /d "%MOBILE_DIR%" && npx expo start"
) else (
    echo [WARNING] Mobile app directory not found at: %MOBILE_DIR%
)

echo.
echo ================================================================
echo  All WildShield AI servers have been started successfully!
echo   - Backend API & WebSockets: http://localhost:8000
echo   - Swagger API Docs:         http://localhost:8000/docs
echo   - Web Dashboard:            http://localhost:5173
echo   - Expo Metro Bundler:       Running in Expo terminal window
echo ================================================================
echo.
pause
