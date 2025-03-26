#!/usr/bin/env python3
import numpy as np
import os
import pickle
import json
import tensorflow as tf
from tensorflow import keras
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler("ml_model.log"),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger("fraud_detection_ml")

class FraudDetectionModel:
    def __init__(self, model_path=None, scaler_path=None, label_encoders_path=None, feature_names_path=None):
        self.model = None
        self.scaler = None
        self.label_encoders = None
        self.feature_names = None
        self.is_loaded = False
        
        # Define paths or use defaults
        self.model_path = model_path or os.path.join(os.path.dirname(__file__), 'model', 'boat_fraud_detection_model')
        self.scaler_path = scaler_path or os.path.join(os.path.dirname(__file__), 'model', 'scaler.pkl')
        self.label_encoders_path = label_encoders_path or os.path.join(os.path.dirname(__file__), 'model', 'label_encoders.pkl')
        self.feature_names_path = feature_names_path or os.path.join(os.path.dirname(__file__), 'model', 'feature_names.pkl')
        
        # Try to load the model and preprocessing components
        self.load_model()
    
    def load_model(self):
        """Load the TensorFlow model and preprocessing components"""
        try:
            # Load TensorFlow model
            logger.info(f"Loading model from {self.model_path}")
            self.model = keras.models.load_model(self.model_path)
            
            # Load scaler
            logger.info(f"Loading scaler from {self.scaler_path}")
            with open(self.scaler_path, 'rb') as f:
                self.scaler = pickle.load(f)
            
            # Load label encoders
            logger.info(f"Loading label encoders from {self.label_encoders_path}")
            with open(self.label_encoders_path, 'rb') as f:
                self.label_encoders = pickle.load(f)
            
            # Try to load feature names from pickle file
            try:
                logger.info(f"Loading feature names from {self.feature_names_path}")
                with open(self.feature_names_path, 'rb') as f:
                    self.feature_names = pickle.load(f)
            except (FileNotFoundError, IOError) as e:
                logger.warning(f"Could not load feature names file: {str(e)}")
                # Define default feature names based on the model
                self.feature_names = [
                    'no_of_adults', 'no_of_children', 'lead_time', 
                    'no_of_previous_cancellations', 'no_of_previous_bookings_not_canceled',
                    'repeated_guest', 'avg_price_per_room', 'no_of_special_requests',
                    'cancellation_ratio', 'adult_child_ratio', 'very_short_lead', 
                    'suspicious_price', 'multiple_bookings_same_day'
                ]
                logger.info(f"Using default feature names: {self.feature_names}")
            
            self.is_loaded = True
            logger.info("Model and preprocessing components loaded successfully")
            return True
        except Exception as e:
            logger.error(f"Error loading model components: {str(e)}")
            self.is_loaded = False
            return False
    
    def _preprocess_data(self, data):
        """Preprocess booking data for model input"""
        # Create dictionary for processed data
        processed_data = {}
        
        # Direct feature mapping
        processed_data['no_of_adults'] = float(data.get('no_of_adults', 1))
        processed_data['no_of_children'] = float(data.get('no_of_children', 0))
        processed_data['lead_time'] = float(data.get('lead_time', 0))
        processed_data['no_of_previous_cancellations'] = float(data.get('no_of_previous_cancellations', 0))
        processed_data['no_of_previous_bookings_not_canceled'] = float(data.get('no_of_previous_bookings_not_canceled', 0))
        processed_data['repeated_guest'] = 1.0 if data.get('repeated_guest', 'No') == 'Yes' else 0.0
        processed_data['avg_price_per_room'] = float(data.get('avg_price_per_room', 100))
        processed_data['no_of_special_requests'] = float(data.get('no_of_special_requests', 0))
        
        # Derived features - specifically for fraud detection
        cancellation_ratio = 0.0
        if (processed_data['no_of_previous_cancellations'] + processed_data['no_of_previous_bookings_not_canceled']) > 0:
            cancellation_ratio = processed_data['no_of_previous_cancellations'] / (
                processed_data['no_of_previous_cancellations'] + processed_data['no_of_previous_bookings_not_canceled'] + 0.1
            )
        processed_data['cancellation_ratio'] = cancellation_ratio
        
        processed_data['adult_child_ratio'] = processed_data['no_of_adults'] / (processed_data['no_of_children'] + 0.1)
        processed_data['very_short_lead'] = 1.0 if processed_data['lead_time'] < 2 else 0.0
        
        price_per_person = processed_data['avg_price_per_room'] / (processed_data['no_of_adults'] + processed_data['no_of_children'] + 0.1)
        processed_data['suspicious_price'] = 1.0 if price_per_person < 25 else 0.0
        
        # Multiple bookings feature - this is critical for boat fraud detection
        processed_data['multiple_bookings_same_day'] = float(data.get('multiple_bookings_same_day', 0))
        
        # Convert to numpy array in the expected order
        features_array = np.array([processed_data[feature] for feature in self.feature_names]).reshape(1, -1)
        
        # Apply scaling
        scaled_features = self.scaler.transform(features_array)
        
        return scaled_features, processed_data
    
    def predict(self, booking_data):
        """
        Predict fraud probability for a booking using the ML model
        Returns fallback rule-based prediction if model not loaded
        """
        if not self.is_loaded or self.model is None:
            # Return a message indicating we'll use rule-based detection
            logger.warning("Model not loaded, using rule-based detection")
            return None
        
        try:
            # Extract features and preprocess
            preprocessed_data, processed_features = self._preprocess_data(booking_data)
            
            # Make prediction
            raw_prediction = self.model.predict(preprocessed_data)[0][0]
            fraud_probability = float(raw_prediction)
            
            # Include reasoning for ML prediction
            indicators = self._explain_prediction(processed_features, fraud_probability)
            
            # Determine risk level
            risk_level = self._determine_risk_level(fraud_probability)
            
            # Build result dictionary
            result = {
                "fraud_probability": fraud_probability,
                "is_fraud": fraud_probability > 0.5,
                "risk_level": risk_level,
                "indicators": indicators,
                "ml_probability": fraud_probability,
                "rules_probability": None,  # No rule-based detection used
                "rule_based": False
            }
            
            return result
        except Exception as e:
            logger.error(f"Error during ML prediction: {str(e)}")
            return None
    
    def _determine_risk_level(self, probability):
        """Convert probability to risk level"""
        if probability < 0.2:
            return "Low Risk"
        elif probability < 0.4:
            return "Low-Medium Risk"
        elif probability < 0.6:
            return "Medium Risk"
        elif probability < 0.8:
            return "High Risk"
        else:
            return "Very High Risk"
    
    def _explain_prediction(self, features, probability):
        """Generate human-readable explanations for the prediction"""
        indicators = []
        
        # Check for multiple bookings - a strong indicator of potential fraud
        if features['multiple_bookings_same_day'] > 1:
            indicators.append(f"User has made multiple bookings ({int(features['multiple_bookings_same_day'])}) on the same day")
        
        # Check cancellation patterns
        if features['cancellation_ratio'] > 0.5:
            indicators.append(f"High cancellation ratio ({features['cancellation_ratio']:.2f})")
        
        # Check lead time anomalies
        if features['very_short_lead'] == 1:
            indicators.append("Very short lead time (less than 2 days)")
        elif features['lead_time'] > 365:
            indicators.append("Unusually long lead time (over 1 year)")
        
        # Check adult/children ratio anomalies
        if features['no_of_adults'] == 0 and features['no_of_children'] > 0:
            indicators.append("Booking with zero adults")
        
        if features['no_of_children'] > features['no_of_adults'] * 2 and features['no_of_children'] > 1:
            indicators.append(f"Unusual ratio of children ({int(features['no_of_children'])}) to adults ({int(features['no_of_adults'])})")
        
        # Price anomalies
        if features['suspicious_price'] == 1:
            avg_price = features['avg_price_per_room']
            persons = features['no_of_adults'] + features['no_of_children']
            indicators.append(f"Unusually low price per person (${avg_price/persons:.2f})")
        
        # Previous cancellations
        if features['no_of_previous_cancellations'] > 2:
            indicators.append(f"User has {int(features['no_of_previous_cancellations'])} previous cancellations")
        
        # Highest risk combination
        if (features['no_of_previous_cancellations'] > 2 and 
            features['very_short_lead'] == 1 and 
            features['multiple_bookings_same_day'] > 0):
            indicators.append("High-risk pattern: Multiple previous cancellations, very short lead time, and multiple bookings")
        
        return indicators 