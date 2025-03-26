import pandas as pd
import numpy as np
import requests
import json
from datetime import datetime, timedelta
import logging
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    filename='fraud_notifications.log'
)
logger = logging.getLogger('fraud_notification')

# Email configuration (replace with your actual SMTP settings)
SMTP_SERVER = 'smtp.example.com'
SMTP_PORT = 587
SMTP_USERNAME = 'your_email@example.com'
SMTP_PASSWORD = 'your_password'
FROM_EMAIL = 'your_email@example.com'

def send_fraud_notification(owner_email, booking_data, fraud_score, risk_factors):
    """
    Send an email notification to boat owner when a potential fraudulent booking is detected
    """
    try:
        # Create email message
        msg = MIMEMultipart()
        msg['From'] = FROM_EMAIL
        msg['To'] = owner_email
        msg['Subject'] = f"ALERT: Potential Fraudulent Booking (Risk: {fraud_score:.1f}%)"
        
        # Format the email body
        email_body = f"""
        <html>
        <head>
            <style>
                body {{ font-family: Arial, sans-serif; }}
                .container {{ padding: 20px; }}
                .header {{ background-color: #ff9999; padding: 10px; color: #900; }}
                .booking-details {{ margin: 15px 0; padding: 10px; background-color: #f8f8f8; }}
                .risk-factors {{ margin: 15px 0; }}
                .risk-factor {{ color: #900; }}
                .footer {{ margin-top: 20px; font-size: 12px; color: #666; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h2>Potential Fraudulent Booking Detected</h2>
                    <p>Our system has flagged a recent booking as potentially fraudulent with a risk score of <strong>{fraud_score:.1f}%</strong></p>
                </div>
                
                <div class="booking-details">
                    <h3>Booking Details:</h3>
                    <p><strong>Booking ID:</strong> {booking_data.get('bookingId', 'N/A')}</p>
                    <p><strong>Booking Date:</strong> {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}</p>
                    <p><strong>Start Date:</strong> {booking_data.get('startDate')}</p>
                    <p><strong>End Date:</strong> {booking_data.get('endDate')}</p>
                    <p><strong>Adults:</strong> {booking_data.get('passengers', {}).get('adults', 0)}</p>
                    <p><strong>Children:</strong> {booking_data.get('passengers', {}).get('children', 0)}</p>
                    <p><strong>Total Amount:</strong> ₹{booking_data.get('totalAmount', 0):,.2f}</p>
                </div>
                
                <div class="risk-factors">
                    <h3>Risk Factors:</h3>
                    <ul>
        """
        
        # Add risk factors
        for factor in risk_factors:
            email_body += f'<li class="risk-factor">{factor}</li>\n'
        
        email_body += """
                    </ul>
                </div>
                
                <div>
                    <h3>Recommended Actions:</h3>
        """
        
        # Add recommendations based on fraud score
        if fraud_score > 75:
            email_body += """
                    <ul>
                        <li>Consider rejecting this booking</li>
                        <li>Request full payment in advance</li>
                        <li>Verify customer identity with additional documentation</li>
                        <li>Contact customer via phone to verify details</li>
                    </ul>
            """
        elif fraud_score > 50:
            email_body += """
                    <ul>
                        <li>Request additional customer verification</li>
                        <li>Increase the required security deposit</li>
                        <li>Request payment via more secure methods</li>
                    </ul>
            """
        else:
            email_body += """
                    <ul>
                        <li>Proceed with normal verification procedures</li>
                        <li>Keep an eye on any unusual communication patterns</li>
                    </ul>
            """
            
        email_body += """
                </div>
                
                <div class="footer">
                    <p>This is an automated notification from your Boat Booking Fraud Protection System.</p>
                    <p>Please do not reply to this email. For questions or assistance, contact support.</p>
                </div>
            </div>
        </body>
        </html>
        """
        
        # Attach the HTML email body
        msg.attach(MIMEText(email_body, 'html'))
        
        # Send the email
        with smtplib.SMTP(SMTP_SERVER, SMTP_PORT) as server:
            server.starttls()
            server.login(SMTP_USERNAME, SMTP_PASSWORD)
            server.send_message(msg)
            
        logger.info(f"Fraud notification sent to {owner_email} for booking {booking_data.get('bookingId', 'N/A')}")
        return True
        
    except Exception as e:
        logger.error(f"Error sending fraud notification: {str(e)}")
        return False

def analyze_booking_for_fraud(booking_data):
    """
    Analyze a booking for potential fraud and identify risk factors
    """
    try:
        # Call the fraud detection API
        response = requests.post("http://localhost:5000/api/detect-fraud", json=booking_data)
        
        if response.status_code == 200:
            result = response.json()
            fraud_probability = result.get('fraud_probability', 0) * 100
            
            # Identify risk factors
            risk_factors = []
            
            # User history
            cancellation_history = booking_data.get('cancellationHistory', {})
            previous_cancellations = cancellation_history.get('count', 0)
            if previous_cancellations > 2:
                risk_factors.append(f"High cancellation history ({previous_cancellations} cancellations)")
            
            # Lead time analysis
            start_date = datetime.strptime(booking_data.get('startDate', ''), '%Y-%m-%d')
            lead_time = (start_date - datetime.now()).days
            if lead_time < 2:
                risk_factors.append(f"Very short lead time ({lead_time} days)")
            elif lead_time > 180:
                risk_factors.append(f"Unusually long lead time ({lead_time} days)")
                
            # Price analysis
            amount = booking_data.get('totalAmount', 0)
            adults = booking_data.get('passengers', {}).get('adults', 0)
            children = booking_data.get('passengers', {}).get('children', 0)
            price_per_person = amount / max(adults + children, 1)
            if price_per_person < 1000:
                risk_factors.append(f"Low price per person (₹{price_per_person:.2f})")
                
            # Unusual passenger ratios
            if children > adults * 3:
                risk_factors.append(f"Unusual adult to children ratio ({adults} adults, {children} children)")
            
            return {
                'fraud_probability': fraud_probability,
                'is_fraud': fraud_probability > 50,
                'risk_factors': risk_factors
            }
        else:
            logger.error(f"Error calling fraud detection API: {response.text}")
            return None
            
    except Exception as e:
        logger.error(f"Error analyzing booking for fraud: {str(e)}")
        return None

def process_new_booking(booking_data, owner_email):
    """
    Process a new booking and send notification if it's potentially fraudulent
    """
    # Analyze the booking
    fraud_analysis = analyze_booking_for_fraud(booking_data)
    
    if fraud_analysis and fraud_analysis['fraud_probability'] > 30:  # Only notify for significant risk
        # Send notification
        send_fraud_notification(
            owner_email, 
            booking_data, 
            fraud_analysis['fraud_probability'],
            fraud_analysis['risk_factors']
        )
        
        logger.info(f"Fraud notification triggered for booking {booking_data.get('bookingId', 'N/A')}")
        return True
    else:
        logger.info(f"No fraud notification needed for booking {booking_data.get('bookingId', 'N/A')}")
        return False

# Example usage
if __name__ == '__main__':
    # Example booking data
    test_booking = {
        "bookingId": "BID12345",
        "startDate": "2023-08-15",
        "endDate": "2023-08-18",
        "passengers": {
            "adults": 2,
            "children": 1
        },
        "totalAmount": 15000,
        "specialRequests": True,
        "userId": "UID789",
        "cancellationHistory": {
            "count": 3,
            "totalBookings": 5
        }
    }
    
    # Test notification
    process_new_booking(test_booking, "boat_owner@example.com") 