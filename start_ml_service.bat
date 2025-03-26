@echo off
echo =========================================================
echo    Starting Python ML Service for Fraud Detection
echo =========================================================
echo.

REM Store the current directory
set STARTING_DIR=%CD%

REM Navigate to the correct directory
cd %STARTING_DIR%\Backend\ml_python_server

REM Check if we're in the right directory
if not exist "simple_server.py" (
    echo ERROR: simple_server.py not found in %CD%
    echo.
    echo Current directory contents:
    dir
    echo.
    echo Please make sure all files are properly installed.
    pause
    exit /b 1
)

REM Check if Python is installed
python --version >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Python is not installed or not in PATH.
    echo.
    echo Please install Python 3.8 or higher from:
    echo https://www.python.org/downloads/
    echo Be sure to check "Add Python to PATH" during installation.
    pause
    exit /b 1
)

echo Using Python:
python --version
echo.

REM Install required packages
echo Installing required packages...
pip install flask flask-cors
echo.

REM Start the server
echo =========================================================
echo Starting ML Service on http://localhost:5001
echo =========================================================
echo.
echo DO NOT CLOSE THIS WINDOW while using the fraud detection system
echo Press Ctrl+C to stop the server when you're done
echo.

python simple_server.py

echo.
echo =========================================================
echo ML Service has stopped.
echo =========================================================
cd %STARTING_DIR%
pause 