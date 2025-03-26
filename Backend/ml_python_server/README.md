# Hotel Fraud Detection ML Service

This service provides APIs for detecting potential fraud in hotel reservations using rule-based detection algorithms.

## Features

- Rule-based fraud detection with weighted risk indicators
- REST API for easy integration
- Detailed fraud risk indicators with explanations
- Booking pattern comparison with industry averages
- Logging and error handling for reliability

## Setup Instructions

### Prerequisites

- Python 3.8 or higher
- Flask and Flask-CORS packages
- MongoDB (for storing reservation data and predictions)

### Installation

1. Clone this repository or download the source code
2. Install required Python packages:

```bash
pip install flask flask-cors
```

3. Configure MongoDB connection in the server configuration (if using the Node.js integration)

### Running the Service

To start the service, run:

```bash
python server.py
```

The service will be available at http://localhost:5001 by default.

You can test the service using the test script:

```bash
python test_prediction.py
```

## API Endpoints

### Status Check

- **URL**: `/status`
- **Method**: `GET`
- **Response**:
  ```json
  {
    "status": "active",
    "modelLoaded": true,
    "featuresAvailable": true,
    "version": "1.0.0 (Rule-Based)",
    "timestamp": "2025-03-22T12:34:56.789Z"
  }
  ```

### Fraud Prediction

- **URL**: `/predict`
- **Method**: `POST`
- **Body**:
  ```json
  {
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
    "no_of_previous_bookings_not_canceled": 2,
    "avg_price_per_room": 120,
    "no_of_special_requests": 2,
    "no_of_booking_changes": 1
  }
  ```
- **Response**:
  ```json
  {
    "fraud_probability": 0.05,
    "is_fraud": false,
    "risk_level": "Low Risk",
    "indicators": [],
    "rules_probability": 0.05,
    "ml_probability": null,
    "rule_based": true
  }
  ```

### Pattern Comparison

- **URL**: `/compare-hotel-patterns`
- **Method**: `POST`
- **Body**:
  ```json
  {
    "userId": "user123"
  }
  ```
- **Response**:
  ```json
  {
    "similarityScore": 65,
    "isSuspicious": false,
    "message": "User's booking patterns are generally within normal parameters",
    "recommendation": "No unusual patterns detected; routine monitoring recommended",
    "source": "rule-based",
    "dataPoints": {
      "user": {
        "averageLeadTime": 22.5,
        "cancellationRatio": 0.13,
        "totalBookings": 8,
        "totalCancellations": 1
      },
      "industry": {
        "averageLeadTime": 21,
        "cancellationRatio": 0.15,
        "peakBookingDays": ["Monday", "Tuesday"]
      }
    }
  }
  ```

## Command-Line Usage

You can also use the fraud detection algorithm directly from the command line:

```bash
python predict_simple.py '{"lead_time": 30, "no_of_adults": 2, "no_of_children": 1, "avg_price_per_room": 120}'
```

Or using a file with JSON input:

```bash
python predict_rules.py --file booking_data.json
```

## Integration with Node.js

This service is designed to be called from a Node.js backend. Example integration:

```javascript
const { spawn } = require('child_process');
const path = require('path');

function predictFraud(bookingData) {
  return new Promise((resolve, reject) => {
    const pythonProcess = spawn('python', [
      path.join(__dirname, 'predict_simple.py'),
      JSON.stringify(bookingData)
    ]);
    
    let result = '';
    let error = '';
    
    pythonProcess.stdout.on('data', (data) => {
      result += data.toString();
    });
    
    pythonProcess.stderr.on('data', (data) => {
      error += data.toString();
    });
    
    pythonProcess.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`Process exited with code ${code}: ${error}`));
      } else {
        try {
          resolve(JSON.parse(result));
        } catch (e) {
          reject(new Error(`Failed to parse result: ${e.message}`));
        }
      }
    });
  });
}
```

## Risk Detection Rules

The fraud detection algorithm uses the following rules to determine risk:

1. **Short lead time**: Bookings made less than 2 days before arrival
2. **Very long lead time**: Bookings made more than 365 days in advance
3. **Previous cancellations**: Users with a history of cancellations
4. **Low price per person**: Unusually low prices compared to normal rates
5. **Zero adults**: Bookings with no adults specified
6. **High ratio of children to adults**: Unusual occupancy patterns
7. **One-night stays with special requests**: Potential test bookings by fraudsters
8. **No booking changes**: Lack of changes despite long lead time

Each rule contributes to an overall fraud score which determines the risk level:
- 0.0-0.2: Low Risk
- 0.2-0.4: Low-Medium Risk
- 0.4-0.6: Medium Risk
- 0.6-0.8: High Risk
- 0.8-1.0: Very High Risk

## Future Enhancements

- Machine learning model integration (TensorFlow/scikit-learn)
- API authentication and rate limiting
- More advanced pattern recognition for known fraud patterns
- Integration with external fraud databases
- Real-time alerting for high-risk bookings

## License

This project is licensed under the MIT License - see the LICENSE file for details. 