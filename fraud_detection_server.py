import os
import pickle
import numpy as np
import pandas as pd
import tensorflow as tf
from flask import Flask, request, jsonify
from flask_cors import CORS
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger('fraud_detection_server')

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Define file paths
model_path = r"D:\react1\hotel\fraud_detection_model.keras"
scaler_path = r"D:\react1\hotel\scaler.pkl"
encoders_path = r"D:\react1\hotel\label_encoders.pkl"

# Global variables for loaded components
model = None
scaler = None
label_encoders = None
expected_columns = None

@app.before_first_request
def load_model_components():
    global model, scaler, label_encoders, expected_columns
    
    try:
        logger.info("Loading TensorFlow model...")
        model = tf.keras.models.load_model(model_path)
        logger.info("Model loaded successfully")
        
        logger.info("Loading scaler...")
        with open(scaler_path, 'rb') as f:
            scaler = pickle.load(f)
        logger.info("Scaler loaded successfully")
        
        logger.info("Loading label encoders...")
        with open(encoders_path, 'rb') as f:
            label_encoders = pickle.load(f)
        logger.info("Label encoders loaded successfully")
        
        # Expected model input columns based on your training data
        expected_columns = [
            'no_of_adults', 'no_of_children', 'no_of_weekend_nights', 'no_of_week_nights',
            'type_of_meal_plan', 'required_car_parking_space', 'room_type_reserved',
            'lead_time', 'arrival_year', 'arrival_month', 'arrival_date',
            'market_segment_type', 'repeated_guest', 'no_of_previous_cancellations',
            'no_of_previous_bookings_not_canceled', 'avg_price_per_room',
            'no_of_special_requests'
        ]
        logger.info(f"Expected columns: {expected_columns}")
        
    except Exception as e:
        logger.error(f"Error loading model components: {str(e)}")
        raise

@app.route('/api/detect-fraud', methods=['POST'])
def detect_fraud():
    try:
        # Ensure model components are loaded
        global model, scaler, label_encoders, expected_columns
        if model is None or scaler is None or label_encoders is None:
            load_model_components()
        
        # Get booking data from request
        booking_data = request.json
        logger.info(f"Received booking data: {booking_data}")
        
        # Preprocess booking data
        processed_data = preprocess_booking_data(booking_data)
        
        # Apply scaling
        scaled_data = scaler.transform(processed_data)
        
        # Make prediction
        fraud_probability = float(model.predict(scaled_data)[0][0])
        is_fraud = fraud_probability > 0.5
        
        # Log the prediction
        logger.info(f"Fraud prediction: {fraud_probability:.4f}, is_fraud: {is_fraud}")
        
        # Return the result
        return jsonify({
            'fraud_probability': fraud_probability,
            'is_fraud': bool(is_fraud),
            'status': 'success'
        })
        
    except Exception as e:
        logger.error(f"Error in fraud detection: {str(e)}")
        return jsonify({
            'error': str(e),
            'status': 'error'
        }), 500

def preprocess_booking_data(booking_data):
    """
    Transform booking data into the format expected by the model
    """
    try:
        # Extract start and end dates
        start_date = pd.to_datetime(booking_data.get('startDate'))
        end_date = pd.to_datetime(booking_data.get('endDate'))
        
        # Calculate night counts
        total_nights = (end_date - start_date).days
        # Assuming weekends are Saturday and Sunday
        weekend_nights = sum(1 for d in range(total_nights) if (start_date + pd.Timedelta(days=d)).weekday() >= 5)
        week_nights = total_nights - weekend_nights
        
        # Get customer history info (if available)
        customer_id = booking_data.get('userId', '')
        cancellation_history = booking_data.get('cancellationHistory', {})
        previous_cancellations = cancellation_history.get('count', 0)
        previous_bookings = cancellation_history.get('totalBookings', 0)
        
        # Create a DataFrame with expected columns
        processed_data = {
            'no_of_adults': booking_data.get('passengers', {}).get('adults', 1),
            'no_of_children': booking_data.get('passengers', {}).get('children', 0),
            'no_of_weekend_nights': weekend_nights,
            'no_of_week_nights': week_nights,
            'type_of_meal_plan': 0,  # Default value
            'required_car_parking_space': 0,  # Default value
            'room_type_reserved': 0,  # Default for boat booking context
            'lead_time': (start_date - pd.Timestamp.now()).days,
            'arrival_year': start_date.year,
            'arrival_month': start_date.month,
            'arrival_date': start_date.day,
            'market_segment_type': 0,  # Default value
            'repeated_guest': 1 if previous_bookings > 0 else 0,
            'no_of_previous_cancellations': previous_cancellations,
            'no_of_previous_bookings_not_canceled': max(0, previous_bookings - previous_cancellations),
            'avg_price_per_room': booking_data.get('totalAmount', 0) / max(1, total_nights),
            'no_of_special_requests': 1 if booking_data.get('specialRequests') else 0
        }
        
        # Create a DataFrame and ensure column order matches what the model expects
        df = pd.DataFrame([processed_data])
        
        # Ensure all expected columns are present
        for col in expected_columns:
            if col not in df.columns:
                df[col] = 0  # Default value for missing columns
        
        # Return DataFrame with columns in the expected order
        return df[expected_columns]
        
    except Exception as e:
        logger.error(f"Error preprocessing booking data: {str(e)}")
        raise

@app.route('/api/healthcheck', methods=['GET'])
def healthcheck():
    """
    Endpoint to check if the server is running
    """
    components_loaded = all([model is not None, scaler is not None, label_encoders is not None])
    return jsonify({
        'status': 'ok',
        'model_loaded': components_loaded
    })

# New endpoint to get cancellation history for a user
@app.route('/api/user-cancellation-history/<user_id>', methods=['GET'])
def get_user_cancellation_history(user_id):
    try:
        # In a real application, you'd query your database here
        # For now, we'll return mock data
        
        # Get user info from database (mocked)
        # In production, connect to your actual database
        mock_history = {
            'count': 0,  # Number of cancellations
            'totalBookings': 5,  # Total number of bookings
            'lastCancellation': None  # Date of last cancellation
        }
        
        return jsonify({
            'userId': user_id,
            'cancellationHistory': mock_history,
            'status': 'success'
        })
        
    except Exception as e:
        logger.error(f"Error getting cancellation history: {str(e)}")
        return jsonify({
            'error': str(e),
            'status': 'error'
        }), 500

if __name__ == '__main__':
    # Load model components on startup
    load_model_components()
    app.run(host='0.0.0.0', port=5000, debug=True) 