# Fraud Detection System

This system provides fraud detection capabilities for boat rentals, including both rule-based and machine learning approaches.

## Getting Started

To use the advanced ML-based fraud detection features, you need to start the Python ML service:

### Starting the ML Service

**Option 1: Use the Easy Start Script**
1. Double-click on `start_ml_service.bat` in the root directory
2. Keep the command window open while using the application

**Option 2: Start Manually**
1. Open a command prompt
2. Navigate to `Backend\ml_python_server`
3. Run `start_simple.bat` or simply run `python simple_server.py`

### Verifying the Service

Once started, the ML service will be available at http://localhost:5001

You can verify it's running by opening your browser and navigating to:
http://localhost:5001/status

You should see a JSON response indicating the service is active.

## Troubleshooting

If you see "ML Service Unavailable" in the Fraud Detection Panel:

1. Make sure you've started the Python ML service using one of the methods above
2. Check that port 5001 is not being used by another application
3. Ensure Python 3.8+ is installed on your system
4. Verify that Flask and Flask-CORS are installed (the start scripts will install these automatically)

## Using the Fraud Detection System

1. Navigate to the Fraud Detection Panel in the application
2. Enter a user ID or booking ID to analyze
3. View the results of fraud analysis, including risk factors and comparison with hotel patterns
4. Examine flagged users and their risk scores

The system will use ML-based detection if the Python service is running, or fall back to rule-based detection if it's not available. 