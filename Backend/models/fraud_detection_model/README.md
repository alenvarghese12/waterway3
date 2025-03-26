# Fraud Detection Model

## Dynamic Mode Selection

The fraud detection system now **dynamically selects** between machine learning and rule-based detection based on the availability of TensorFlow.js and the trained model.

To enable the full TensorFlow-based machine learning detection:

1. Install the required TensorFlow.js package:
   ```
   npm install @tensorflow/tfjs-node
   ```

2. Train the model using the training script:
   ```
   node Backend/scripts/trainFraudModel.js
   ```

3. Restart the application - it will automatically detect and use the TensorFlow model.

## Rule-Based Detection

If TensorFlow.js is not available or the model fails to load, the system automatically falls back to rule-based detection with the following rules:

1. Very short lead time (< 2 days) with history of cancellations (25% weight)
2. High cancellation ratio (> 50%) (30% weight) 
3. Multiple cancellations in the last 24 hours (25% weight)
4. Quick cancellation after booking for a trip far in the future (20% weight)

Bookings with a combined score of 70% or higher are flagged as potentially fraudulent.

## Machine Learning Detection

When operating in ML mode, the system:
1. Normalizes features using the statistics in `feature_stats.json`
2. Applies the trained TensorFlow model to predict the probability of fraud
3. Returns both the prediction and relevant signals for interpretability
4. Uses a default threshold of 70% to flag bookings as potentially fraudulent

## Hotel Comparison

The hotel comparison functionality remains fully operational in both modes, comparing user cancellation patterns with typical hotel booking cancellation patterns.

## Model Retraining

The model should be retrained periodically as more data becomes available by running the training script. 