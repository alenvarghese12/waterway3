#!/usr/bin/env python3
from flask import Flask, request, jsonify
from flask_cors import CORS
import json
import os
import logging
from datetime import datetime
import traceback
from predict_rules import predict_fraud

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler('fraud_detection_server.log')
    ]
)
logger = logging.getLogger('fraud_detection')

# Initialize Flask app
app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})

@app.route('/status', methods=['GET'])
def status():
    """Return the status of the fraud detection service"""
    return jsonify({
        "status": "active",
        "modelLoaded": True,
        "featuresAvailable": True,
        "version": "1.0.0 (Rule-Based)",
        "timestamp": datetime.now().isoformat()
    })

@app.route('/predict', methods=['POST'])
def predict():
    """Predict fraud based on hotel reservation data"""
    try:
        # Get request data
        if not request.is_json:
            logger.warning("Request contains no JSON data")
            return jsonify({
                "error": "Request must contain JSON data"
            }), 400
        
        # Get booking data from request
        booking_data = request.json
        logger.info(f"Received prediction request: {json.dumps(booking_data)[:200]}...")
        
        # Validate required fields
        required_fields = ['lead_time', 'no_of_adults']
        missing_fields = [field for field in required_fields if field not in booking_data]
        
        if missing_fields:
            logger.warning(f"Missing required fields: {missing_fields}")
            return jsonify({
                "error": "Missing required fields",
                "details": f"The following fields are required: {', '.join(missing_fields)}"
            }), 400
        
        # Process with rule-based model
        result = predict_fraud(booking_data)
        logger.info(f"Prediction result: Fraud probability {result['fraud_probability']:.2f}, "
                   f"Risk level: {result['risk_level']}")
        
        # Return prediction result
        return jsonify(result)
        
    except Exception as e:
        logger.error(f"Error in prediction: {str(e)}\n{traceback.format_exc()}")
        return jsonify({
            "error": "Server error during prediction",
            "details": str(e)
        }), 500

@app.route('/compare-hotel-patterns', methods=['POST'])
def compare_patterns():
    """Compare booking patterns with hotel industry averages"""
    try:
        # This is a placeholder for future ML functionality
        # For now, return mock data based on user ID
        user_id = 'unknown'
        if request.is_json:
            user_id = request.json.get('userId', 'unknown')
        
        logger.info(f"Received pattern comparison request for user: {user_id}")
        
        # Create a mock response
        response = {
            "similarityScore": 65,  # Moderate similarity score
            "isSuspicious": False,
            "message": "User's booking patterns are generally within normal parameters",
            "recommendation": "No unusual patterns detected; routine monitoring recommended",
            "source": "rule-based",
            "dataPoints": {
                "user": {
                    "averageLeadTime": 22.5,
                    "cancellationRatio": 0.13,
                    "totalBookings": 8,
                    "totalCancellations": 1
                },
                "industry": {
                    "averageLeadTime": 21,
                    "cancellationRatio": 0.15,
                    "peakBookingDays": ["Monday", "Tuesday"]
                }
            }
        }
        
        logger.info(f"Returning pattern comparison with similarity score: {response['similarityScore']}")
        return jsonify(response)
        
    except Exception as e:
        logger.error(f"Error in pattern comparison: {str(e)}\n{traceback.format_exc()}")
        return jsonify({
            "error": "Server error during pattern comparison",
            "details": str(e)
        }), 500

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5001))
    logger.info(f"Starting Fraud Detection Server on port {port}")
    app.run(host='0.0.0.0', port=port, debug=True) 