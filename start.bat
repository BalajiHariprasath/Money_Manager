@echo off
REM Quick Start Script for Money Manager
REM This script sets up and runs the Money Manager application

echo.
echo ╔════════════════════════════════════════════════╗
echo ║         Money Manager - Quick Start            ║
echo ╚════════════════════════════════════════════════╝
echo.

REM Check if Node.js is installed
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed!
    echo Please download it from: https://nodejs.org/
    pause
    exit /b 1
)

echo ✅ Node.js found
echo.

REM Check if node_modules exists
if not exist "node_modules\" (
    echo 📦 Installing dependencies...
    echo This may take a few minutes...
    echo.
    call npm install
    echo.
)

echo ✅ All dependencies ready
echo.
echo 🚀 Starting Money Manager...
echo.
echo ╔════════════════════════════════════════════════╗
echo ║  Server will start on http://localhost:3000    ║
echo ║  Open this URL in your web browser             ║
echo ║  Press Ctrl+C to stop the server               ║
echo ╚════════════════════════════════════════════════╝
echo.

call npm start

pause
