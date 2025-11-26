@echo off
REM Image Encryption & Decryption System - Run Script for Windows

echo.
echo ============================================
echo  ImageVault - Starting Application
echo ============================================
echo.

REM Check if Python is installed
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Python is not installed or not in PATH
    pause
    exit /b 1
)

echo Starting Flask application...
echo.
echo 🌐 The application will be available at:
echo    http://localhost:5000
echo.
echo 📝 Logs will appear below:
echo.
echo ============================================
echo.

python app.py

pause
