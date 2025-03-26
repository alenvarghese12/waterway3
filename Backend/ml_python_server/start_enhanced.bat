@echo off
echo Starting Enhanced Fraud Detection Service...

:: Check if Python is installed
python --version 2>NUL
if %ERRORLEVEL% NEQ 0 (
    echo Python is not installed or not in your PATH
    echo Please install Python 3.8 or higher from https://www.python.org/downloads/
    pause
    exit /b 1
)

:: Create model directory if it doesn't exist
if not exist "model" mkdir model

:: Install required packages
echo Installing required packages...
pip install flask flask-cors tensorflow scikit-learn numpy pandas

:: Start the server
echo Starting enhanced fraud detection server on http://localhost:5001
python enhanced_server.py

echo.
echo Server is now running. Press Ctrl+C to stop. 