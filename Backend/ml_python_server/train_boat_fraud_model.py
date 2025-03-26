#!/usr/bin/env python3
import pandas as pd
import numpy as np
import tensorflow as tf
from tensorflow import keras
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler, LabelEncoder
from imblearn.over_sampling import SMOTE
import pickle
import os

print("Starting boat fraud detection model training...")

# Create model directory if it doesn't exist
model_dir = os.path.join(os.path.dirname(__file__), 'model')
os.makedirs(model_dir, exist_ok=True)

# Load hotel dataset
try:
    df = pd.read_csv(r"D:\react1\hotel\Hotel_Reservations.csv")
    print(f"Successfully loaded dataset with {len(df)} records")
except Exception as e:
    print(f"Error loading dataset: {str(e)}")
    print("Please ensure the Hotel_Reservations.csv file exists in the specified path")
    print("Attempting to use sample data for demonstration...")
    
    # Create synthetic data if file not found
    np.random.seed(42)
    n_samples = 1000
    
    # Create synthetic data that mimics hotel booking data
    df = pd.DataFrame({
        'booking_id': range(1, n_samples + 1),
        'no_of_adults': np.random.randint(1, 5, n_samples),
        'no_of_children': np.random.randint(0, 4, n_samples),
        'no_of_weekend_nights': np.random.randint(0, 3, n_samples),
        'no_of_week_nights': np.random.randint(0, 5, n_samples),
        'type_of_meal_plan': np.random.choice(['Meal Plan 1', 'Meal Plan 2', 'Meal Plan 3'], n_samples),
        'required_car_parking_space': np.random.choice([0, 1], n_samples, p=[0.8, 0.2]),
        'room_type_reserved': np.random.choice(['Room_Type 1', 'Room_Type 2', 'Room_Type 3', 'Room_Type 4'], n_samples),
        'lead_time': np.random.gamma(5, 5, n_samples).astype(int) + 1,  # Skewed toward shorter lead times
        'market_segment_type': np.random.choice(['Online', 'Offline', 'Corporate', 'Complementary', 'Aviation'], n_samples),
        'repeated_guest': np.random.choice(['No', 'Yes'], n_samples, p=[0.9, 0.1]),
        'no_of_previous_cancellations': np.random.choice([0, 1, 2, 3, 4], n_samples, p=[0.8, 0.1, 0.05, 0.03, 0.02]),
        'no_of_previous_bookings_not_canceled': np.random.choice([0, 1, 2, 3, 4, 5], n_samples, p=[0.7, 0.1, 0.1, 0.05, 0.03, 0.02]),
        'avg_price_per_room': np.random.normal(120, 30, n_samples).clip(min=50),
        'no_of_special_requests': np.random.choice([0, 1, 2, 3, 4], n_samples, p=[0.4, 0.3, 0.2, 0.05, 0.05]),
        'booking_status': np.random.choice(['Canceled', 'Not_Canceled'], n_samples, p=[0.3, 0.7])
    })
    
    # Add multiple bookings feature (simulate a user booking multiple boats)
    df['multiple_bookings_same_day'] = np.random.choice([0, 1, 2, 3], n_samples, p=[0.8, 0.1, 0.07, 0.03])
    
    print(f"Created synthetic dataset with {len(df)} records for demonstration")

# Clean up the dataset
df.columns = df.columns.str.strip()
print("Dataset columns:", df.columns.tolist())

# Check for the target column
if 'booking_status' not in df.columns:
    print("Warning: 'booking_status' column not found in dataset")
    # Handle missing target column (create it if necessary)
    if 'canceled' in df.columns.str.lower():
        target_column = df.columns[df.columns.str.lower() == 'canceled'][0]
        print(f"Using '{target_column}' as the target column instead")
    else:
        print("Creating synthetic target column for demonstration")
        # Create synthetic target column based on cancellation features
        conditions = (
            (df['no_of_previous_cancellations'] > 1) | 
            (df['lead_time'] < 3) | 
            (df['avg_price_per_room'] < 70)
        )
        df['booking_status'] = np.where(conditions, 'Canceled', 'Not_Canceled')
else:
    target_column = 'booking_status'
    print(f"Using '{target_column}' as the target column")

# Handle missing values
df.dropna(inplace=True)
print(f"Dataset after dropping NA values: {len(df)} records")

# Add derived features specifically for fraud detection in boat bookings
df['cancellation_ratio'] = df['no_of_previous_cancellations'] / (df['no_of_previous_cancellations'] + df['no_of_previous_bookings_not_canceled'] + 0.1)
df['adult_child_ratio'] = df['no_of_adults'] / (df['no_of_children'] + 0.1)
df['very_short_lead'] = (df['lead_time'] < 2).astype(int)
df['suspicious_price'] = ((df['avg_price_per_room'] / (df['no_of_adults'] + df['no_of_children'] + 0.1)) < 25).astype(int)

# If dataset doesn't have multiple bookings feature, create a synthetic one
if 'multiple_bookings_same_day' not in df.columns:
    print("Adding synthetic 'multiple_bookings_same_day' feature")
    # Simulate users who make multiple bookings on the same day (potential fraud indicator)
    df['multiple_bookings_same_day'] = np.random.choice([0, 1, 2, 3], len(df), p=[0.8, 0.1, 0.07, 0.03])

# Encode categorical variables
label_encoders = {}
for column in df.select_dtypes(include=['object']).columns:
    le = LabelEncoder()
    df[column] = le.fit_transform(df[column])
    label_encoders[column] = le

# Binary label for prediction: 1 for Canceled, 0 for Not_Canceled
if target_column == 'booking_status':
    df['is_canceled'] = (df[target_column] == le.transform(['Canceled'])[0]).astype(int)
else:
    df['is_canceled'] = df[target_column]  # Assume it's already binary

# Define features and target
features = [
    'no_of_adults', 'no_of_children', 'lead_time', 
    'no_of_previous_cancellations', 'no_of_previous_bookings_not_canceled',
    'repeated_guest', 'avg_price_per_room', 'no_of_special_requests',
    'cancellation_ratio', 'adult_child_ratio', 'very_short_lead', 
    'suspicious_price', 'multiple_bookings_same_day'
]

X = df[features]
y = df['is_canceled']

print(f"Feature set shape: {X.shape}")
print(f"Target distribution: {y.value_counts().to_dict()}")

# Handle class imbalance using SMOTE
print("Applying SMOTE to handle class imbalance...")
smote = SMOTE(sampling_strategy='auto', random_state=42)
X_resampled, y_resampled = smote.fit_resample(X, y)

# Split the dataset
X_train, X_test, y_train, y_test = train_test_split(X_resampled, y_resampled, test_size=0.2, random_state=42)
print(f"Training set: {X_train.shape[0]} samples, Test set: {X_test.shape[0]} samples")

# Normalize features
scaler = StandardScaler()
X_train_scaled = scaler.fit_transform(X_train)
X_test_scaled = scaler.transform(X_test)

print("Building ANN model...")
# Define ANN model with additional regularization to prevent overfitting
model = keras.Sequential([
    keras.layers.Input(shape=(X_train_scaled.shape[1],)),
    keras.layers.Dense(64, activation='relu', kernel_regularizer=keras.regularizers.l2(0.001)),
    keras.layers.Dropout(0.3),
    keras.layers.Dense(32, activation='relu', kernel_regularizer=keras.regularizers.l2(0.001)),
    keras.layers.Dropout(0.2),
    keras.layers.Dense(16, activation='relu'),
    keras.layers.Dense(1, activation='sigmoid')  # Binary classification (fraud or not)
])

# Early stopping to prevent overfitting
early_stopping = keras.callbacks.EarlyStopping(
    monitor='val_loss',
    patience=5,
    restore_best_weights=True
)

# Compile the model
model.compile(
    optimizer=keras.optimizers.Adam(learning_rate=0.001),
    loss='binary_crossentropy',
    metrics=['accuracy', 
             keras.metrics.Precision(name='precision'),
             keras.metrics.Recall(name='recall'),
             keras.metrics.AUC(name='auc')]
)

# Train the model
print("Training the model...")
history = model.fit(
    X_train_scaled, y_train,
    epochs=30,
    batch_size=32,
    validation_data=(X_test_scaled, y_test),
    callbacks=[early_stopping],
    verbose=1
)

# Evaluate the model
print("Evaluating the model...")
loss, accuracy, precision, recall, auc = model.evaluate(X_test_scaled, y_test)
print(f'Test Accuracy: {accuracy:.4f}')
print(f'Precision: {precision:.4f}, Recall: {recall:.4f}, AUC: {auc:.4f}')

# Save feature names for prediction
feature_names = features

# Save the trained model
model_path = os.path.join(model_dir, 'boat_fraud_detection_model')
model.save(model_path)
print(f"Model saved to {model_path}")

# Save the scaler
scaler_path = os.path.join(model_dir, 'scaler.pkl')
with open(scaler_path, 'wb') as f:
    pickle.dump(scaler, f)
print(f"Scaler saved to {scaler_path}")

# Save the label encoders
encoders_path = os.path.join(model_dir, 'label_encoders.pkl')
with open(encoders_path, 'wb') as f:
    pickle.dump(label_encoders, f)
print(f"Label encoders saved to {encoders_path}")

# Save feature names
features_path = os.path.join(model_dir, 'feature_names.pkl')
with open(features_path, 'wb') as f:
    pickle.dump(feature_names, f)
print(f"Feature names saved to {features_path}")

print("Model training complete!") 