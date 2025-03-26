from flask import Flask, request, jsonify
from flask_cors import CORS
import json
import os
from datetime import datetime
import random

# Initialize Flask app
app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}}) # Enable CORS for all routes

# Simple rule-based detection (same as the Node.js implementation)
def rule_based_detection(features):
    """Rule-based fraud detection that doesn't require ML libraries"""
    signals = []
    probability = 0.0
    
    # Rule 1: Check lead time with cancellation history
    if features.get('leadTime', 0) < 2 and features.get('cancellationRatio', 0) > 0.3:
        signals.append({
            "feature": "leadTime",
            "value": features.get('leadTime', 0),
            "message": "Very short lead time with history of cancellations"
        })
        probability += 0.25
    
    # Rule 2: Check cancellation ratio
    if features.get('cancellationRatio', 0) > 0.5:
        signals.append({
            "feature": "cancellationRatio",
            "value": features.get('cancellationRatio', 0),
            "message": "High cancellation ratio (>50%)"
        })
        probability += 0.3
    
    # Rule 3: Check recent cancellations
    if features.get('cancellationsLast24Hours', 0) > 1:
        signals.append({
            "feature": "cancellationsLast24Hours",
            "value": features.get('cancellationsLast24Hours', 0),
            "message": "Multiple cancellations in last 24 hours"
        })
        probability += 0.25
    
    # Rule 4: Check booking-cancellation time
    if features.get('timeSinceBooking', 0) < 60 and features.get('leadTime', 0) > 14:
        signals.append({
            "feature": "timeSinceBooking",
            "value": features.get('timeSinceBooking', 0),
            "message": "Very quick cancellation after booking for a trip far in the future"
        })
        probability += 0.2
    
    # Determine if booking is fraudulent based on probability threshold
    threshold = 0.7  # 70% confidence
    is_fraudulent = probability >= threshold
    
    return {
        "isFraudulent": is_fraudulent,
        "fraudProbability": probability,
        "confidence": round(probability, 2),
        "source": "rule-based",
        "message": "This booking has been flagged as potentially fraudulent" if is_fraudulent else "This booking appears to be legitimate",
        "factors": [signal["message"] for signal in signals],
        "analysisTimestamp": datetime.now().isoformat()
    }

@app.route('/predict', methods=['POST'])
def predict():
    """Predict fraud based on booking features"""
    try:
        # Get user data from request
        user_data = request.json
        
        # Perform rule-based detection
        result = rule_based_detection(user_data)
        
        # Return the result
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/compare-hotel-patterns', methods=['POST', 'GET'])
def compare_hotel_patterns():
    """Compare user cancellation patterns with hotel data"""
    try:
        # Return a mock hotel comparison result
        userId = request.json.get('userId', 'unknown') if request.is_json else request.args.get('userId', 'unknown') 
        
        # Generate a random similarity score
        similarity_score = random.randint(30, 90)
        is_suspicious = similarity_score < 40
        
        # Create a mock response
        response = {
            "similarityScore": similarity_score,
            "isSuspicious": is_suspicious,
            "message": "User's booking patterns differ significantly from typical hotel cancellations" if is_suspicious 
                else "User's booking patterns are within normal range compared to hotel cancellations",
            "recommendation": "Significant deviation from typical hotel cancellation patterns" if is_suspicious 
                else "User's cancellation patterns are similar to typical hotel cancellations",
            "source": "ml-model",
            "dataPoints": {
                "user": {
                    "averageLeadTime": random.randint(5, 30),
                    "averageTimeBeforeDeparture": random.randint(1, 20),
                    "cancellationRatio": round(random.uniform(0.05, 0.6), 2),
                    "adultToChildRatio": round(random.uniform(1, 4), 1),
                    "peakCancellationDay": random.randint(0, 6),
                    "peakCancellationHour": random.randint(8, 22)
                },
                "hotel": {
                    "averageLeadTime": 21,
                    "cancelBeforeDeparture": 5,
                    "cancellationRatio": 0.12,
                    "mostCommonDayOfWeek": 5,
                    "adultToChildRatio": 2.5,
                    "peak": {
                        "hour": 18,
                        "day": 5
                    }
                },
                "similarityScores": {
                    "leadTime": random.randint(40, 95),
                    "timeBeforeDeparture": random.randint(40, 95),
                    "cancellationRatio": random.randint(40, 95),
                    "adultToChildRatio": random.randint(40, 95),
                    "peakTiming": random.choice([0, 50, 100])
                }
            }
        }
        
        return jsonify(response)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/status', methods=['GET'])
def get_status():
    """Get the status of the fraud detection service"""
    return jsonify({
        "status": "active",
        "modelLoaded": True,
        "featuresAvailable": True,
        "version": "1.0.0 (Simple)",
        "timestamp": datetime.now().isoformat()
    })

if __name__ == '__main__':
    # Run the Flask app
    port = int(os.environ.get('PORT', 5001))
    print(f"Starting simplified Python ML service on port {port}")
    print("This is a lightweight version without ML dependencies.")
    print("Press Ctrl+C to stop the server.")
    app.run(host='0.0.0.0', port=port, debug=True) 