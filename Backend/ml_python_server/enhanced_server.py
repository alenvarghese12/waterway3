#!/usr/bin/env python3
from flask import Flask, request, jsonify
from flask_cors import CORS
import json
import os
import traceback
import logging
from datetime import datetime
import random
from predict_rules import predict_fraud
from ml_model import FraudDetectionModel

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler("fraud_detection_server.log"),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger("fraud_detection_server")

# Initialize Flask app
app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Initialize ML model
ml_model = FraudDetectionModel()

# Check if model is successfully loaded
USE_ML = ml_model.is_loaded
if USE_ML:
    logger.info("Machine learning model loaded successfully - using ML for fraud detection")
else:
    logger.warning("Machine learning model could not be loaded - using rule-based detection")

@app.route('/status', methods=['GET'])
def get_status():
    """Get status of the fraud detection service"""
    now = datetime.now().isoformat()
    return jsonify({
        "status": "active",
        "modelLoaded": USE_ML,
        "featuresAvailable": True,
        "version": "1.2.0" + (" (ML Model)" if USE_ML else " (Rule-Based)"),
        "boatSpecific": True,
        "timestamp": now,
        "ml": USE_ML
    })

@app.route('/predict', methods=['POST'])
def predict():
    """Predict fraud based on boat reservation data"""
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
        
        # Try ML prediction first if model is loaded
        ml_result = None
        if USE_ML:
            ml_result = ml_model.predict(booking_data)
        
        # Use rule-based as fallback or if ML fails
        if ml_result is None:
            result = predict_fraud(booking_data)
            logger.info(f"Rule-based prediction: Fraud probability {result['fraud_probability']:.2f}, "
                      f"Risk level: {result['risk_level']}")
        else:
            result = ml_result
            logger.info(f"ML prediction: Fraud probability {result['fraud_probability']:.2f}, "
                      f"Risk level: {result['risk_level']}")
        
        # Add timestamp for tracking
        result["timestamp"] = datetime.now().isoformat()
        
        # Return prediction result
        return jsonify(result)
    
    except Exception as e:
        logger.error(f"Error in prediction: {str(e)}\n{traceback.format_exc()}")
        return jsonify({
            "error": "Server error during prediction",
            "details": str(e)
        }), 500

@app.route('/compare-boat-patterns', methods=['POST'])
def compare_patterns():
    """Compare booking patterns with typical boat rental patterns"""
    try:
        if not request.is_json:
            return jsonify({"error": "Request must be JSON"}), 400
        
        data = request.json
        user_id = data.get('userId')
        
        if not user_id:
            return jsonify({"error": "User ID is required"}), 400
        
        logger.info(f"Comparing patterns for user: {user_id}")
        
        # Get user data if provided
        user_profile = data.get('userProfile', {})
        cancellations = data.get('cancellations', [])
        
        # Analyze cancellation patterns
        if len(cancellations) == 0:
            return jsonify({
                "similarityScore": 0,
                "message": "No cancellation history found",
                "recommendation": "User has no cancellations to analyze",
                "dataPoints": {}
            })
        
        # Extract useful metrics from cancellations
        lead_times = [c.get('timeBeforeDeparture', 0) for c in cancellations]
        avg_lead_time = sum(lead_times) / len(lead_times) if lead_times else 0
        
        booking_to_cancel_times = [c.get('timeSinceBooking', 0) for c in cancellations]
        avg_booking_to_cancel = sum(booking_to_cancel_times) / len(booking_to_cancel_times) if booking_to_cancel_times else 0
        
        # Get cancellation ratio from profile or calculate
        cancellation_ratio = user_profile.get('cancellationRatio', 0)
        
        # Get multiple bookings data if available
        multiple_bookings = user_profile.get('multipleBookingsCount', 0)
        multiple_bookings_canceled = user_profile.get('multipleBookingsCanceled', 0)
        
        # Extract passenger data
        adults = [c.get('originalBookingData', {}).get('adults', 0) for c in cancellations]
        children = [c.get('originalBookingData', {}).get('children', 0) for c in cancellations]
        avg_adults = sum(adults) / len(adults) if adults else 0
        avg_children = sum(children) / len(children) if children else 0
        
        # Calculate ratios and patterns
        cancellation_speed_ratio = 0
        if avg_lead_time > 0:
            cancellation_speed_ratio = avg_booking_to_cancel / avg_lead_time
        
        # Boat rental industry typical patterns (for comparison)
        industry_patterns = {
            "avgLeadTime": 14.0,  # days
            "cancellationRatio": 0.15,  # 15%
            "avgBookingToCancelTime": 48.0,  # hours
            "multipleBookingsRatio": 0.05,  # 5% of users make multiple bookings
            "avgAdults": 2.5,
            "avgChildren": 0.8,
            "adultToChildRatio": 3.1,
            "peakBookingDays": ["Friday", "Saturday"]
        }
        
        # Calculate similarity scores
        lead_time_sim = min(avg_lead_time / industry_patterns["avgLeadTime"], 
                        industry_patterns["avgLeadTime"] / avg_lead_time) if avg_lead_time > 0 else 0
        
        cancel_ratio_sim = min(cancellation_ratio / industry_patterns["cancellationRatio"],
                           industry_patterns["cancellationRatio"] / cancellation_ratio) if cancellation_ratio > 0 else 1
        
        # Calculate similarity for adult/child ratio
        actual_adult_child_ratio = avg_adults / (avg_children + 0.1)
        adult_child_sim = min(actual_adult_child_ratio / industry_patterns["adultToChildRatio"],
                          industry_patterns["adultToChildRatio"] / actual_adult_child_ratio)
        
        # Multiple bookings is a strong fraud indicator
        multiple_bookings_factor = 1.0
        if multiple_bookings > 1:
            if multiple_bookings_canceled / (multiple_bookings + 0.1) > 0.5:
                # Penalize if multiple bookings are often canceled
                multiple_bookings_factor = 0.2
            else:
                multiple_bookings_factor = 0.7
        
        # Calculate overall similarity (0-100)
        similarity_score = int((lead_time_sim * 0.3 + 
                            cancel_ratio_sim * 0.3 + 
                            adult_child_sim * 0.2 + 
                            multiple_bookings_factor * 0.2) * 100)
        
        # Determine if patterns are suspicious
        is_suspicious = similarity_score < 50
        
        # Generate message and recommendation
        if similarity_score > 70:
            message = "User's booking patterns are similar to typical boat rental patterns"
            recommendation = "No unusual patterns detected; routine monitoring recommended"
        elif similarity_score > 50:
            message = "User's booking patterns show some differences from typical boat rental patterns"
            recommendation = "Consider monitoring future bookings, but no immediate action needed"
        else:
            message = "User's booking patterns differ significantly from typical boat rental patterns"
            if multiple_bookings > 1:
                message += ", particularly regarding multiple bookings"
                recommendation = "High likelihood of fraudulent behavior. Consider implementing additional verification steps for this user, especially for multiple bookings made in a short period."
            else:
                recommendation = "Consider implementing additional verification steps for future bookings from this user"
        
        # Prepare response
        response = {
            "similarityScore": similarity_score,
            "isSuspicious": is_suspicious,
            "message": message,
            "recommendation": recommendation,
            "source": "ml" if USE_ML else "rule-based",
            "dataPoints": {
                "user": {
                    "avgLeadTime": round(avg_lead_time, 1),
                    "cancellationRatio": round(cancellation_ratio, 2),
                    "avgBookingToCancelTime": round(avg_booking_to_cancel, 1),
                    "multipleBookings": int(multiple_bookings),
                    "multipleBookingsCanceled": int(multiple_bookings_canceled),
                    "avgAdults": round(avg_adults, 1),
                    "avgChildren": round(avg_children, 1),
                    "adultToChildRatio": round(actual_adult_child_ratio, 1)
                },
                "industry": industry_patterns,
                "similarityScores": {
                    "leadTime": round(lead_time_sim * 100),
                    "cancellationRatio": round(cancel_ratio_sim * 100),
                    "adultChildRatio": round(adult_child_sim * 100),
                    "multipleBookings": round(multiple_bookings_factor * 100)
                }
            }
        }
        
        return jsonify(response)
    
    except Exception as e:
        logger.error(f"Error in pattern comparison: {str(e)}\n{traceback.format_exc()}")
        return jsonify({
            "error": "Server error during pattern comparison",
            "details": str(e)
        }), 500

@app.route('/analyze-multiple-bookings', methods=['POST'])
def analyze_multiple_bookings():
    """Special endpoint to analyze multiple bookings made by the same user"""
    try:
        if not request.is_json:
            return jsonify({"error": "Request must be JSON"}), 400
        
        data = request.json
        user_id = data.get('userId')
        bookings = data.get('bookings', [])
        
        if not user_id:
            return jsonify({"error": "User ID is required"}), 400
        
        if not bookings or len(bookings) < 2:
            return jsonify({
                "riskLevel": "Low Risk",
                "fraudProbability": 0.1,
                "message": "Not enough bookings to analyze multiple booking patterns",
                "factors": []
            })
        
        logger.info(f"Analyzing multiple bookings for user: {user_id}, Count: {len(bookings)}")
        
        # Extract key features
        booking_dates = [b.get('bookingDate') for b in bookings]
        lead_times = [b.get('leadTime', 0) for b in bookings]
        boat_ids = [b.get('boatId') for b in bookings]
        unique_boat_ids = len(set(boat_ids))
        
        # Time between bookings
        time_between_bookings = []
        if len(booking_dates) >= 2:
            dates = sorted([datetime.fromisoformat(d.replace('Z', '+00:00')) if d else datetime.now() 
                           for d in booking_dates if d])
            for i in range(1, len(dates)):
                diff_hours = (dates[i] - dates[i-1]).total_seconds() / 3600
                time_between_bookings.append(diff_hours)
        
        avg_time_between = sum(time_between_bookings) / len(time_between_bookings) if time_between_bookings else 24
        
        # Analyze risk factors
        risk_factors = []
        fraud_probability = 0.0
        
        # 1. Very short time between bookings
        if avg_time_between < 1:  # Less than 1 hour
            risk_factors.append("Multiple bookings made within a very short time period (less than 1 hour)")
            fraud_probability += 0.3
        elif avg_time_between < 4:  # Less than 4 hours
            risk_factors.append(f"Multiple bookings made within {avg_time_between:.1f} hours")
            fraud_probability += 0.2
        
        # 2. Very similar lead times (potential automated booking)
        if len(lead_times) >= 2:
            lead_time_std = (sum((x - (sum(lead_times)/len(lead_times)))**2 for x in lead_times) / len(lead_times))**0.5
            if lead_time_std < 1 and sum(lead_times)/len(lead_times) < 7:
                risk_factors.append("Multiple bookings with nearly identical short lead times - potential automated fraud")
                fraud_probability += 0.3
        
        # 3. Many different boats
        if unique_boat_ids > 2:
            risk_factors.append(f"Booking {unique_boat_ids} different boats simultaneously")
            fraud_probability += min(0.1 * unique_boat_ids, 0.4)
        
        # 4. Previous cancellation history
        cancellation_ratio = data.get('cancellationRatio', 0)
        if cancellation_ratio > 0.5 and len(bookings) > 2:
            risk_factors.append(f"High cancellation ratio ({cancellation_ratio:.2f}) combined with multiple bookings")
            fraud_probability += 0.2
        
        # Cap probability
        fraud_probability = min(fraud_probability, 0.95)
        
        # Determine risk level
        risk_level = "Low Risk"
        if fraud_probability > 0.7:
            risk_level = "Very High Risk"
        elif fraud_probability > 0.5:
            risk_level = "High Risk"
        elif fraud_probability > 0.3:
            risk_level = "Medium Risk"
        
        # Generate recommendation
        if fraud_probability > 0.5:
            recommendation = "Consider requiring additional verification or payment confirmation for these bookings"
        else:
            recommendation = "Normal multiple booking pattern, no immediate action required"
        
        return jsonify({
            "riskLevel": risk_level,
            "fraudProbability": round(fraud_probability, 2),
            "message": f"Analysis of {len(bookings)} bookings shows {risk_level.lower()} of fraud",
            "factors": risk_factors,
            "recommendation": recommendation,
            "details": {
                "uniqueBoatCount": unique_boat_ids,
                "avgTimeBetweenBookings": round(avg_time_between, 1),
                "bookingCount": len(bookings)
            }
        })
    
    except Exception as e:
        logger.error(f"Error in multiple bookings analysis: {str(e)}\n{traceback.format_exc()}")
        return jsonify({
            "error": "Server error during multiple bookings analysis",
            "details": str(e)
        }), 500

# Run the server
if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5001))
    logger.info(f"Starting boat fraud detection server on port {port}")
    app.run(host='0.0.0.0', port=port, debug=False) 