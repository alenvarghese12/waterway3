#!/usr/bin/env python3
import sys
import json
import argparse

def predict_fraud(input_data):
    """
    Rule-based fraud detection for boat reservations.
    Returns fraud probability and indicators of suspicious activity.
    """
    # Extract the features
    lead_time = float(input_data.get('lead_time', 0))
    cancellations = float(input_data.get('no_of_previous_cancellations', 0))
    price = float(input_data.get('avg_price_per_room', 0))
    adults = float(input_data.get('no_of_adults', 0))
    children = float(input_data.get('no_of_children', 0))
    repeated_guest = input_data.get('repeated_guest', 'No')
    repeated_guest_numeric = 1 if repeated_guest == 'Yes' else 0
    
    # Extract additional features if available
    weekend_nights = float(input_data.get('no_of_weekend_nights', 0))
    week_nights = float(input_data.get('no_of_week_nights', 0))
    total_stay = weekend_nights + week_nights
    required_car_parking = float(input_data.get('required_car_parking_space', 0))
    special_requests = float(input_data.get('no_of_special_requests', 0))
    booking_changes = float(input_data.get('no_of_booking_changes', 0))
    previous_bookings = float(input_data.get('no_of_previous_bookings_not_canceled', 0))
    
    # Special boat-specific features
    multiple_bookings_same_day = float(input_data.get('multiple_bookings_same_day', 0))
    booking_to_departure_ratio = float(input_data.get('booking_to_departure_ratio', 1.0))
    
    # Rule-based fraud score calculation
    fraud_score = 0
    indicators = []
    
    # High number of cancellations is suspicious
    if cancellations > 1:
        fraud_score += min(cancellations * 0.2, 0.5)
        indicators.append("High number of previous cancellations")
    
    # Very short lead times can be suspicious
    if lead_time < 2:
        fraud_score += 0.3
        indicators.append("Very short lead time (less than 2 days)")
    
    # Very long lead times can also be suspicious
    if lead_time > 365:
        fraud_score += 0.3
        indicators.append("Unusually long lead time (over 1 year)")
    
    # Very low prices compared to occupancy can be suspicious
    price_per_person = price / max(adults + children, 1)
    if price_per_person < 20:
        fraud_score += 0.4
        indicators.append(f"Unusually low price per person (${price_per_person:.2f})")
    
    # Being a repeated guest reduces fraud risk
    if repeated_guest_numeric == 1 and previous_bookings > 0:
        fraud_score -= min(0.3, previous_bookings * 0.1)
        # Not adding an indicator since this is a positive signal
    
    # Unusually high number of children compared to adults
    if children > adults * 2 and children > 1:
        fraud_score += 0.2
        indicators.append(f"Unusually high number of children ({children}) compared to adults ({adults})")
    
    # Very short stays with special requirements
    if total_stay == 1 and (special_requests > 2 or required_car_parking > 0):
        fraud_score += 0.2
        indicators.append("One-night stay with many special requests")
    
    # No booking changes is sometimes suspicious for fraud
    if booking_changes == 0 and lead_time > 30:
        fraud_score += 0.1
        indicators.append("No booking changes despite long lead time")
    
    # Multiple bookings on the same day is highly suspicious for boats
    if multiple_bookings_same_day >= 2:
        fraud_score += 0.3 + (0.1 * min(multiple_bookings_same_day - 2, 3))
        indicators.append(f"User has made {int(multiple_bookings_same_day)} bookings on the same day")
        # Extremely suspicious if combined with cancellations
        if cancellations > 1:
            fraud_score += 0.2
            indicators.append("Pattern of multiple bookings combined with history of cancellations")
    
    # Special case for high-risk patterns
    if cancellations > 2 and lead_time < 3 and special_requests == 0:
        fraud_score += 0.3
        indicators.append("High-risk pattern: Multiple previous cancellations, very short lead time, and no special requests")
    
    # Zero adult bookings are suspicious (boats require adults)
    if adults == 0:
        fraud_score += 0.5
        indicators.append("Booking with zero adults - invalid for boat rentals")
    
    # Quick cancellations after booking can indicate fraud
    if booking_to_departure_ratio < 0.1 and lead_time > 14:
        fraud_score += 0.2
        indicators.append("Pattern of very quick cancellations after booking")
    
    # Normalize to a probability (0-1)
    fraud_score = max(min(fraud_score, 1), 0)
    
    # For what appears to be a legitimate booking
    # force the score to be low for genuine-looking bookings
    if (lead_time >= 7 and lead_time <= 120 and
        cancellations == 0 and
        price >= 80 and
        adults >= 1 and
        adults + children <= 5 and
        special_requests > 0 and
        booking_changes > 0 and
        multiple_bookings_same_day == 0):
        fraud_score = max(fraud_score * 0.3, 0.05)  # 5-15% probability - very low risk
    
    # Determine risk level
    risk_level = "Low Risk"
    if fraud_score > 0.8:
        risk_level = "Very High Risk"
    elif fraud_score > 0.6:
        risk_level = "High Risk"
    elif fraud_score > 0.4:
        risk_level = "Medium Risk"
    elif fraud_score > 0.2:
        risk_level = "Low-Medium Risk"
    
    result = {
        'fraud_probability': fraud_score,
        'is_fraud': fraud_score > 0.5,
        'risk_level': risk_level,
        'indicators': indicators,
        'rules_probability': fraud_score,
        'ml_probability': None,  # No ML model used
        'rule_based': True
    }
    
    return result

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description='Rule-based fraud detection for boat reservations')
    parser.add_argument('input_json', nargs='?', type=str, help='JSON input data as string')
    parser.add_argument('--file', type=str, help='Read JSON input from file')
    
    args = parser.parse_args()
    
    # Get input data from arguments or file
    input_json = None
    if args.input_json:
        input_json = args.input_json
    elif args.file:
        with open(args.file, 'r') as f:
            input_json = f.read()
    elif not sys.stdin.isatty():
        input_json = sys.stdin.read()
    else:
        parser.print_help()
        sys.exit(1)
    
    # Parse JSON
    try:
        input_data = json.loads(input_json)
    except json.JSONDecodeError as e:
        print(json.dumps({
            "error": "Invalid JSON input",
            "details": str(e)
        }))
        sys.exit(1)
    
    # Process and print result
    result = predict_fraud(input_data)
    print(json.dumps(result)) 