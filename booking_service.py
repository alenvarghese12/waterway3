import requests
from fraud_notification import process_new_booking

def confirm_booking(booking_data):
    """
    Process a booking confirmation and check for fraud
    """
    # 1. Process the booking normally (save to database, etc.)
    # ... Your existing booking confirmation code ...
    
    # 2. Get boat owner's email from your database
    owner_email = get_boat_owner_email(booking_data.get('boatId'))
    
    # 3. Process the booking for fraud detection
    process_new_booking(booking_data, owner_email)
    
    # 4. Continue with your normal confirmation process
    # ... Rest of your existing booking confirmation code ...
    
    return {
        'status': 'success',
        'booking_id': booking_data.get('bookingId'),
        'message': 'Booking confirmed successfully'
    }

def get_boat_owner_email(boat_id):
    """
    Get the boat owner's email (replace with your database query)
    """
    # In a real system, you'd query your database
    # For now, return a mock email
    return "boat_owner@example.com" 