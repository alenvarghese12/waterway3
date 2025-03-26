@echo off
echo Training Boat Fraud Detection ML Model...

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
pip install tensorflow scikit-learn numpy pandas imblearn

:: Run the training script
echo Starting model training...
python train_boat_fraud_model.py

echo.
echo Model training complete. Press any key to exit.
pause 