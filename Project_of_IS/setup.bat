@echo off
REM Image Encryption & Decryption System - Setup Script for Windows

echo.
echo ============================================
echo  ImageVault - Setup Script
echo ============================================
echo.

REM Check if Python is installed
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Python is not installed or not in PATH
    echo Please install Python 3.8+ from https://www.python.org/
    pause
    exit /b 1
)

echo ✅ Python is installed
python --version

echo.
echo Installing dependencies...
echo.

REM Install requirements
pip install -r requirements.txt

if %errorlevel% neq 0 (
    echo ❌ Failed to install dependencies
    pause
    exit /b 1
)

echo.
echo ✅ All dependencies installed successfully!
echo.
echo ============================================
echo  Setup Complete!
echo ============================================
echo.
echo To start the application, run:
echo     python app.py
echo.
echo Then open your browser to:
echo     http://localhost:5000
echo.
echo Press any key to exit...
pause
