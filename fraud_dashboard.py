import pandas as pd
import streamlit as st
import requests
import json
import matplotlib.pyplot as plt
from datetime import datetime, timedelta

# Set page title
st.set_page_config(page_title="Boat Booking Fraud Detection Dashboard", layout="wide")

# Header
st.title("Boat Booking Fraud Detection Dashboard")

# Sidebar
st.sidebar.header("Filters")
date_range = st.sidebar.selectbox(
    "Time Period",
    ["Last 7 days", "Last 30 days", "Last 90 days", "All time"]
)

risk_level = st.sidebar.slider(
    "Minimum Risk Level",
    min_value=0.0, 
    max_value=1.0,
    value=0.5,
    step=0.05
)

# Function to load recent fraud detection data
# In a real application, this would connect to your database
def load_fraud_data():
    # This is mock data - replace with actual database query
    fraud_data = []
    for i in range(20):
        days_ago = i % 30
        date = (datetime.now() - timedelta(days=days_ago)).strftime("%Y-%m-%d")
        fraud_data.append({
            "booking_id": f"BID{10000+i}",
            "user_id": f"UID{5000+i}",
            "date": date,
            "amount": round(1000 + (i * 500 * (i % 3)), 2),
            "fraud_probability": round(0.1 + (i % 10) * 0.09, 2),
            "status": "Flagged" if (i % 10) * 0.09 > 0.5 else "Approved"
        })
    return pd.DataFrame(fraud_data)

# Load data
df = load_fraud_data()

# Apply filters
if date_range == "Last 7 days":
    cutoff_date = (datetime.now() - timedelta(days=7)).strftime("%Y-%m-%d")
    df = df[df['date'] >= cutoff_date]
elif date_range == "Last 30 days":
    cutoff_date = (datetime.now() - timedelta(days=30)).strftime("%Y-%m-%d")
    df = df[df['date'] >= cutoff_date]
elif date_range == "Last 90 days":
    cutoff_date = (datetime.now() - timedelta(days=90)).strftime("%Y-%m-%d")
    df = df[df['date'] >= cutoff_date]

# Filter by risk level
df_filtered = df[df['fraud_probability'] >= risk_level]

# Dashboard metrics
col1, col2, col3, col4 = st.columns(4)
with col1:
    st.metric(label="Total Bookings", value=len(df))
with col2:
    st.metric(label="Flagged as Fraudulent", value=len(df[df['status'] == 'Flagged']))
with col3:
    st.metric(label="High Risk (>0.7)", value=len(df[df['fraud_probability'] > 0.7]))
with col4:
    st.metric(label="Total Amount", value=f"₹{df['amount'].sum():,.2f}")

# Charts
st.subheader("Fraud Risk Distribution")
fig, ax = plt.subplots(figsize=(10, 6))
ax.hist(df['fraud_probability'], bins=10, alpha=0.7)
ax.set_xlabel('Fraud Probability')
ax.set_ylabel('Number of Bookings')
st.pyplot(fig)

# Flagged transactions table
st.subheader(f"Bookings with Risk Level ≥ {risk_level}")
if len(df_filtered) > 0:
    st.dataframe(df_filtered.sort_values(by='fraud_probability', ascending=False))
else:
    st.info("No bookings match the current filters")

# Test fraud detection
st.subheader("Test Fraud Detection for Boat Booking")
with st.form("fraud_test_form"):
    col1, col2 = st.columns(2)
    with col1:
        adults = st.number_input("Number of Adults", min_value=1, max_value=20, value=2)
        children = st.number_input("Number of Children", min_value=0, max_value=10, value=0)
        start_date = st.date_input("Start Date", value=datetime.now())
        end_date = st.date_input("End Date", value=datetime.now() + timedelta(days=3))
    with col2:
        amount = st.number_input("Total Amount", min_value=0, max_value=100000, value=10000)
        special_requests = st.checkbox("Special Requests")
        phone = st.text_input("Phone Number", value="9876543210")
        
        # Additional fields specific to boat bookings
        previous_cancellations = st.number_input("Previous Cancellations", min_value=0, max_value=10, value=0)
        previous_bookings = st.number_input("Previous Bookings", min_value=0, max_value=20, value=0)
        
    submitted = st.form_submit_button("Test Fraud Detection")
    
    if submitted:
        try:
            # Prepare test data
            test_data = {
                "passengers": {
                    "adults": adults,
                    "children": children
                },
                "startDate": start_date.isoformat(),
                "endDate": end_date.isoformat(),
                "totalAmount": amount,
                "specialRequests": special_requests,
                "phone": phone,
                "cancellationHistory": {
                    "count": previous_cancellations,
                    "totalBookings": previous_bookings
                }
            }
            
            # Make request to fraud detection API
            response = requests.post("http://localhost:5000/api/detect-fraud", json=test_data)
            
            if response.status_code == 200:
                result = response.json()
                fraud_probability = result.get('fraud_probability', 0) * 100
                
                # Display result with appropriate color coding
                if fraud_probability > 75:
                    st.error(f"⚠️ High Fraud Risk: {fraud_probability:.1f}%")
                    st.error("Recommendation: Reject the booking or require full payment in advance.")
                elif fraud_probability > 50:
                    st.warning(f"⚠️ Medium Fraud Risk: {fraud_probability:.1f}%")
                    st.warning("Recommendation: Request additional verification or higher deposit.")
                elif fraud_probability > 25:
                    st.info(f"ℹ️ Low Fraud Risk: {fraud_probability:.1f}%")
                    st.info("Recommendation: Normal verification procedures.")
                else:
                    st.success(f"✅ Very Low Fraud Risk: {fraud_probability:.1f}%")
                    st.success("Recommendation: Standard booking process.")
                
                # Show key risk factors (this would be more detailed in a real system)
                st.subheader("Key Risk Factors:")
                
                risk_factors = []
                if previous_cancellations > 2:
                    risk_factors.append(f"High cancellation history ({previous_cancellations} cancellations)")
                
                lead_time = (start_date - datetime.now().date()).days
                if lead_time < 2:
                    risk_factors.append(f"Very short lead time ({lead_time} days)")
                elif lead_time > 180:
                    risk_factors.append(f"Unusually long lead time ({lead_time} days)")
                    
                price_per_person = amount / max(adults + children, 1)
                if price_per_person < 1000:
                    risk_factors.append(f"Low price per person (₹{price_per_person:.2f})")
                
                if not risk_factors:
                    st.write("No significant risk factors identified.")
                else:
                    for factor in risk_factors:
                        st.write(f"• {factor}")
                
            else:
                st.error(f"Error: {response.text}")
        except Exception as e:
            st.error(f"Error: {str(e)}") 