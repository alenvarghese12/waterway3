#!/usr/bin/env python3
import json
import sys
import requests
from predict_rules import predict_fraud

def test_boat_fraud_detection():
    """
    Test the boat-specific fraud detection model with various boat booking scenarios.
    """
    # Define test cases
    test_cases = [
        {
            "name": "Normal booking - low risk",
            "data": {
                "lead_time": 15,
                "no_of_adults": 2,
                "no_of_children": 1,
                "no_of_weekend_nights": 2,
                "no_of_week_nights": 0,
                "repeated_guest": "Yes",
                "no_of_previous_cancellations": 0,
                "no_of_previous_bookings_not_canceled": 3,
                "avg_price_per_room": 150,
                "no_of_special_requests": 1,
                "no_of_booking_changes": 1,
                "multiple_bookings_same_day": 0
            }
        },
        {
            "name": "Multiple bookings - suspicious",
            "data": {
                "lead_time": 7,
                "no_of_adults": 2,
                "no_of_children": 2,
                "no_of_weekend_nights": 2,
                "no_of_week_nights": 0,
                "repeated_guest": "No",
                "no_of_previous_cancellations": 1,
                "no_of_previous_bookings_not_canceled": 0,
                "avg_price_per_room": 120,
                "no_of_special_requests": 0,
                "no_of_booking_changes": 0,
                "multiple_bookings_same_day": 3
            }
        },
        {
            "name": "Short lead time with cancellations - high risk",
            "data": {
                "lead_time": 1,
                "no_of_adults": 4,
                "no_of_children": 0,
                "no_of_weekend_nights": 1,
                "no_of_week_nights": 2,
                "repeated_guest": "No",
                "no_of_previous_cancellations": 3,
                "no_of_previous_bookings_not_canceled": 0,
                "avg_price_per_room": 100,
                "no_of_special_requests": 0,
                "no_of_booking_changes": 0,
                "multiple_bookings_same_day": 1,
                "booking_to_departure_ratio": 0.05
            }
        },
        {
            "name": "Zero adults - invalid for boats",
            "data": {
                "lead_time": 10,
                "no_of_adults": 0,
                "no_of_children": 3,
                "no_of_weekend_nights": 2,
                "no_of_week_nights": 0,
                "repeated_guest": "No",
                "no_of_previous_cancellations": 0,
                "no_of_previous_bookings_not_canceled": 0,
                "avg_price_per_room": 150,
                "no_of_special_requests": 1,
                "no_of_booking_changes": 0,
                "multiple_bookings_same_day": 0
            }
        },
        {
            "name": "Extreme case - multiple bookings with cancellations",
            "data": {
                "lead_time": 2,
                "no_of_adults": 2,
                "no_of_children": 4,
                "no_of_weekend_nights": 1,
                "no_of_week_nights": 0,
                "repeated_guest": "No",
                "no_of_previous_cancellations": 4,
                "no_of_previous_bookings_not_canceled": 1,
                "avg_price_per_room": 80,
                "no_of_special_requests": 0,
                "no_of_booking_changes": 0,
                "multiple_bookings_same_day": 4,
                "booking_to_departure_ratio": 0.02
            }
        }
    ]
    
    # Run predictions for each test case
    print("\n=== Testing Boat-Specific Fraud Detection ===\n")
    
    # First try using the API if server is running
    server_available = False
    try:
        response = requests.get("http://localhost:5001/status", timeout=2)
        if response.status_code == 200:
            server_available = True
            print("Using ML server API for predictions\n")
        else:
            print("ML server is running but returned an error\n")
    except:
        print("ML server not available, using local rule-based prediction\n")
    
    for idx, test_case in enumerate(test_cases):
        print(f"Test Case {idx+1}: {test_case['name']}")
        print("-" * 50)
        
        result = None
        
        # Try to use API if server is available
        if server_available:
            try:
                response = requests.post(
                    "http://localhost:5001/predict",
                    json=test_case['data'],
                    timeout=5
                )
                if response.status_code == 200:
                    result = response.json()
                    print(f"Source: {result.get('rule_based', False)}")
            except Exception as e:
                print(f"Error using API: {str(e)}")
        
        # Fall back to local prediction if API failed
        if result is None:
            result = predict_fraud(test_case['data'])
            print("Source: Local rule-based")
        
        # Display results
        print(f"Risk Level: {result['risk_level']}")
        print(f"Fraud Probability: {result['fraud_probability']:.2f}")
        
        if result['indicators']:
            print("Suspicious Indicators:")
            for indicator in result['indicators']:
                print(f"  - {indicator}")
        else:
            print("No suspicious indicators detected.")
            
        print("\n")

    # Test multiple bookings analysis if server is available
    if server_available:
        print("\n=== Testing Multiple Bookings Analysis API ===\n")
        
        test_bookings = {
            "userId": "test123",
            "bookings": [
                {
                    "boatId": "boat1",
                    "bookingDate": "2023-08-10T14:30:00Z",
                    "leadTime": 5
                },
                {
                    "boatId": "boat2",
                    "bookingDate": "2023-08-10T14:45:00Z", 
                    "leadTime": 6
                },
                {
                    "boatId": "boat3",
                    "bookingDate": "2023-08-10T15:15:00Z",
                    "leadTime": 4
                }
            ],
            "cancellationRatio": 0.4
        }
        
        try:
            response = requests.post(
                "http://localhost:5001/analyze-multiple-bookings",
                json=test_bookings,
                timeout=5
            )
            
            if response.status_code == 200:
                result = response.json()
                print("Multiple Bookings Analysis:")
                print(f"Risk Level: {result.get('riskLevel')}")
                print(f"Fraud Probability: {result.get('fraudProbability')}")
                print(f"Message: {result.get('message')}")
                
                factors = result.get('factors', [])
                if factors:
                    print("Risk Factors:")
                    for factor in factors:
                        print(f"  - {factor}")
                
                print(f"Recommendation: {result.get('recommendation', '')}")
                
                details = result.get('details', {})
                if details:
                    print("\nDetails:")
                    for key, value in details.items():
                        print(f"  {key}: {value}")
            else:
                print(f"API Error: {response.status_code}")
                print(response.text)
        except Exception as e:
            print(f"Error using multiple bookings API: {str(e)}")

if __name__ == "__main__":
    test_boat_fraud_detection() 