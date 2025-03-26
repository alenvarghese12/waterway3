

REM Check if Python is installed
python --version >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo Python is not installed or not in PATH.
    echo Please install Python 3.8+ from https://www.python.org/downloads/
    pause
    exit /b 1
)

REM Save current directory and change to script directory
pushd %~dp0

REM Install only the minimal required packages
echo Installing minimal required packages...
pip install flask flask-cors

REM Start the simplified server
echo.
echo 