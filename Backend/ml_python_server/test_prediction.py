#!/usr/bin/env python3
import json
import sys
from predict_rules import predict_fraud

def test_predict_fraud():
    """
    Test the rule-based fraud detection model with various hotel booking scenarios.
    """
    # Define test cases
    test_cases = [
        {
            "name": "Normal booking - low risk",
            "data": {
                "lead_time": 30,
                "no_of_adults": 2,
                "no_of_children": 1,
                "no_of_weekend_nights": 2,
                "no_of_week_nights": 3,
                "type_of_meal_plan": "Meal Plan 1",
                "required_car_parking_space": 0,
                "room_type_reserved": "Standard",
                "market_segment_type": "Online",
                "repeated_guest": "Yes",
                "no_of_previous_cancellations": 0,
                "no_of_previous_bookings_not_canceled": 5,
                "avg_price_per_room": 120,
                "no_of_special_requests": 1,
                "no_of_booking_changes": 1
            }
        },
        {
            "name": "Suspicious booking - high risk",
            "data": {
                "lead_time": 1,
                "no_of_adults": 2,
                "no_of_children": 4,
                "no_of_weekend_nights": 2,
                "no_of_week_nights": 3,
                "type_of_meal_plan": "Meal Plan 1",
                "required_car_parking_space": 0,
                "room_type_reserved": "Standard",
                "market_segment_type": "Online",
                "repeated_guest": "No",
                "no_of_previous_cancellations": 3,
                "no_of_previous_bookings_not_canceled": 0,
                "avg_price_per_room": 50,
                "no_of_special_requests": 0,
                "no_of_booking_changes": 0
            }
        },
        {
            "name": "Edge case - very long lead time",
            "data": {
                "lead_time": 400,
                "no_of_adults": 1,
                "no_of_children": 0,
                "no_of_weekend_nights": 1,
                "no_of_week_nights": 0,
                "type_of_meal_plan": "Meal Plan 2",
                "required_car_parking_space": 1,
                "room_type_reserved": "Deluxe",
                "market_segment_type": "Online",
                "repeated_guest": "No",
                "no_of_previous_cancellations": 0,
                "no_of_previous_bookings_not_canceled": 0,
                "avg_price_per_room": 200,
                "no_of_special_requests": 2,
                "no_of_booking_changes": 0
            }
        },
        {
            "name": "Zero adults - suspicious",
            "data": {
                "lead_time": 15,
                "no_of_adults": 0,
                "no_of_children": 2,
                "no_of_weekend_nights": 2,
                "no_of_week_nights": 3,
                "type_of_meal_plan": "Meal Plan 1",
                "required_car_parking_space": 0,
                "room_type_reserved": "Standard",
                "market_segment_type": "Online",
                "repeated_guest": "No",
                "no_of_previous_cancellations": 1,
                "no_of_previous_bookings_not_canceled": 1,
                "avg_price_per_room": 100,
                "no_of_special_requests": 1,
                "no_of_booking_changes": 0
            }
        },
        {
            "name": "Very cheap - suspicious",
            "data": {
                "lead_time": 5,
                "no_of_adults": 3,
                "no_of_children": 2,
                "no_of_weekend_nights": 2,
                "no_of_week_nights": 3,
                "type_of_meal_plan": "Meal Plan 1",
                "required_car_parking_space": 0,
                "room_type_reserved": "Standard",
                "market_segment_type": "Online",
                "repeated_guest": "No",
                "no_of_previous_cancellations": 0,
                "no_of_previous_bookings_not_canceled": 0,
                "avg_price_per_room": 30,
                "no_of_special_requests": 0,
                "no_of_booking_changes": 0
            }
        }
    ]
    
    # Run predictions for each test case
    print("\n=== Testing Rule-Based Fraud Detection ===\n")
    
    for idx, test_case in enumerate(test_cases):
        print(f"Test Case {idx+1}: {test_case['name']}")
        print("-" * 50)
        
        # Run prediction
        result = predict_fraud(test_case['data'])
        
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

if __name__ == "__main__":
    test_predict_fraud() 