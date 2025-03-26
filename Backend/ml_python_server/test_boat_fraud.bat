@echo off
echo Testing Boat Fraud Detection System...

:: Check if Python is installed
python --version 2>NUL
if %ERRORLEVEL% NEQ 0 (
    echo Python is not installed or not in your PATH
    echo Please install Python 3.8 or higher from https://www.python.org/downloads/
    pause
    exit /b 1
)

:: Install required packages
echo Checking dependencies...
pip install requests

:: Run the test script
echo Running tests...
python test_boat_fraud.py

echo.
echo Test complete. Press any key to exit.
pause 