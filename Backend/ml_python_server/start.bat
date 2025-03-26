@echo off
echo Starting Python Fraud Detection Service...
echo.

REM Check if Python is installed
python --version >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo Python is not installed or not in PATH.
    echo Please install Python 3.8+ from https://www.python.org/downloads/
    pause
    exit /b 1
)

REM Check if requirements are installed
echo Checking and installing dependencies...
pip install -r requirements.txt

REM Start the server
echo.
echo Starting server on http://localhost:5001
echo Press Ctrl+C to stop the server
echo.
python server.py 