/**
 * Script to train a TensorFlow.js model for boat cancellation fraud detection
 * Uses both boat cancellation data and imported hotel reservation data
 */

const tf = require('@tensorflow/tfjs-node');
const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/waterway')
  .then(() => {
    console.log('MongoDB connected successfully');
    trainModel();
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

// Import models
const CancellationRecord = require('../model/CancellationRecord');
const UserFraudProfile = require('../model/UserFraudProfile');
const HotelReservation = mongoose.model('HotelReservation');

// Main training function
async function trainModel() {
  try {
    console.log('Starting fraud detection model training...');
    
    // 1. Fetch and prepare data
    const { trainingData, testingData } = await prepareData();
    
    console.log(`Total training examples: ${trainingData.xs.length}`);
    console.log(`Total testing examples: ${testingData.xs.length}`);
    
    // 2. Prepare tensors
    const { trainXs, trainYs, testXs, testYs } = prepareTrainingTensors(trainingData, testingData);
    
    // 3. Create and train model
    const model = createModel(trainXs.shape[1]); // input shape
    await trainModelWithData(model, trainXs, trainYs, testXs, testYs);
    
    // 4. Save the model
    const modelSavePath = path.join(__dirname, '../model/fraud_detection_model');
    await model.save(`file://${modelSavePath}`);
    console.log(`Model saved to ${modelSavePath}`);
    
    // 5. Save feature stats for normalization
    saveFeatureStats(trainingData);
    
    // Disconnect from MongoDB
    mongoose.disconnect();
    console.log('Training completed successfully');
  } catch (error) {
    console.error('Error training model:', error);
    mongoose.disconnect();
    process.exit(1);
  }
}

// Function to prepare training and testing data
async function prepareData() {
  console.log('Fetching and preparing data...');
  
  // 1. Get boat cancellation data
  const cancellations = await CancellationRecord.find()
    .populate('userId', 'name email') // Add fields you need
    .sort({ cancellationDate: -1 });
  
  console.log(`Fetched ${cancellations.length} boat cancellation records`);
  
  // Get fraud profiles for additional features
  const userIds = [...new Set(cancellations.map(c => c.userId.toString()))];
  const userProfiles = await UserFraudProfile.find({ userId: { $in: userIds } });
  
  console.log(`Fetched ${userProfiles.length} user fraud profiles`);
  
  // Create a map for quick lookup
  const userProfileMap = {};
  userProfiles.forEach(profile => {
    userProfileMap[profile.userId.toString()] = profile;
  });
  
  // 2. Get hotel reservation data
  const hotelCancellations = await HotelReservation.find({ bookingStatus: 'Cancelled' }).limit(5000);
  const hotelNotCancelled = await HotelReservation.find({ bookingStatus: 'Not_Cancelled' }).limit(5000);
  
  console.log(`Fetched ${hotelCancellations.length} cancelled hotel reservations`);
  console.log(`Fetched ${hotelNotCancelled.length} non-cancelled hotel reservations`);
  
  // 3. Create training features from boat cancellations
  const boatFeatures = cancellations.map(cancellation => {
    const userProfile = userProfileMap[cancellation.userId.toString()] || {};
    
    // Label as fraud if marked suspicious
    const isFraud = cancellation.isSuspicious;
    
    return {
      features: [
        cancellation.originalBookingData.leadTime || 0,
        userProfile.cancellationRatio || 0,
        cancellation.timeSinceBooking || 0,
        cancellation.timeBeforeDeparture || 0,
        cancellation.originalBookingData.adults || 0,
        cancellation.originalBookingData.children || 0,
        cancellation.originalBookingData.totalAmount || 0,
        userProfile.cancellationsLast24Hours || 0,
        userProfile.totalCancellations || 0,
        userProfile.totalBookings || 0,
        userProfile.averageTimeBetweenCancellations || 0,
        userProfile.distinctBoatsCancelled || 0,
        userProfile.averageLeadTime || 0
      ],
      label: isFraud ? 1 : 0,
      source: 'boat'
    };
  });
  
  // 4. Create training features from hotel reservations
  const hotelFeatures = [
    ...hotelCancellations.map(hotel => {
      // For hotel data, we use the "no_of_previous_cancellations" as an indicator
      // Higher values increase likelihood of being classified as potential fraud
      const isFraud = hotel.noOfPreviousCancellations > 2 || 
                     (hotel.noOfPreviousCancellations > 0 && hotel.leadTime < 3);
      
      return {
        features: [
          hotel.leadTime || 0,
          hotel.noOfPreviousCancellations > 0 ? hotel.noOfPreviousCancellations / (hotel.noOfPreviousCancellations + hotel.noOfPreviousBookingsNotCancelled) : 0,
          0, // We don't have timeSinceBooking for hotel data
          hotel.leadTime || 0, // Use leadTime as timeBeforeDeparture
          hotel.noOfAdults || 0,
          hotel.noOfChildren || 0,
          hotel.avgPricePerRoom || 0,
          hotel.noOfPreviousCancellations > 0 ? 1 : 0, // Simulate cancellationsLast24Hours
          hotel.noOfPreviousCancellations || 0,
          hotel.noOfPreviousCancellations + hotel.noOfPreviousBookingsNotCancelled || 0,
          0, // No averageTimeBetweenCancellations
          hotel.noOfPreviousCancellations > 0 ? 1 : 0, // Assume 1 distinct hotel if there are cancellations
          hotel.leadTime || 0  // Use leadTime as averageLeadTime
        ],
        label: isFraud ? 1 : 0,
        source: 'hotel'
      };
    }),
    ...hotelNotCancelled.map(hotel => {
      return {
        features: [
          hotel.leadTime || 0,
          0, // cancellationRatio
          0, // timeSinceBooking
          hotel.leadTime || 0, // Use leadTime as timeBeforeDeparture
          hotel.noOfAdults || 0,
          hotel.noOfChildren || 0,
          hotel.avgPricePerRoom || 0,
          0, // cancellationsLast24Hours
          hotel.noOfPreviousCancellations || 0,
          hotel.noOfPreviousCancellations + hotel.noOfPreviousBookingsNotCancelled || 0,
          0, // No averageTimeBetweenCancellations
          hotel.noOfPreviousCancellations > 0 ? 1 : 0, // Assume 1 distinct hotel if there are cancellations
          hotel.leadTime || 0  // Use leadTime as averageLeadTime
        ],
        label: 0, // Not fraud
        source: 'hotel'
      };
    })
  ];
  
  // 5. Combine and shuffle data
  const allFeatures = [...boatFeatures, ...hotelFeatures];
  shuffle(allFeatures);
  
  // 6. Split into training and testing sets (80% training, 20% testing)
  const splitIndex = Math.floor(allFeatures.length * 0.8);
  const trainingData = {
    xs: allFeatures.slice(0, splitIndex).map(d => d.features),
    ys: allFeatures.slice(0, splitIndex).map(d => d.label),
    sources: allFeatures.slice(0, splitIndex).map(d => d.source)
  };
  
  const testingData = {
    xs: allFeatures.slice(splitIndex).map(d => d.features),
    ys: allFeatures.slice(splitIndex).map(d => d.label),
    sources: allFeatures.slice(splitIndex).map(d => d.source)
  };
  
  console.log(`Created ${trainingData.xs.length} training examples and ${testingData.xs.length} testing examples`);
  
  return { trainingData, testingData };
}

// Convert data to TensorFlow tensors
function prepareTrainingTensors(trainingData, testingData) {
  console.log('Preparing tensors...');
  
  // Convert to tensors
  const trainXs = tf.tensor2d(trainingData.xs);
  const trainYs = tf.tensor1d(trainingData.ys);
  
  const testXs = tf.tensor2d(testingData.xs);
  const testYs = tf.tensor1d(testingData.ys);
  
  return { trainXs, trainYs, testXs, testYs };
}

// Create the model
function createModel(inputShape) {
  console.log('Creating model...');
  
  const model = tf.sequential();
  
  // Add layers
  model.add(tf.layers.dense({
    inputShape: [inputShape],
    units: 32,
    activation: 'relu'
  }));
  
  model.add(tf.layers.dropout({ rate: 0.2 }));
  
  model.add(tf.layers.dense({
    units: 16,
    activation: 'relu'
  }));
  
  model.add(tf.layers.dense({
    units: 1,
    activation: 'sigmoid'
  }));
  
  // Compile the model
  model.compile({
    optimizer: tf.train.adam(0.001),
    loss: 'binaryCrossentropy',
    metrics: ['accuracy']
  });
  
  model.summary();
  return model;
}

// Train the model with the data
async function trainModelWithData(model, trainXs, trainYs, testXs, testYs) {
  console.log('Training model...');
  
  // Callback for logging
  const callbacks = {
    onEpochEnd: (epoch, logs) => {
      console.log(`Epoch ${epoch + 1}: loss = ${logs.loss.toFixed(4)}, accuracy = ${logs.acc.toFixed(4)}`);
    }
  };
  
  // Train the model
  await model.fit(trainXs, trainYs, {
    epochs: 50,
    batchSize: 32,
    validationData: [testXs, testYs],
    callbacks: callbacks,
    class_weight: { 0: 1, 1: 3 } // Weigh fraudulent cases more heavily
  });
  
  // Evaluate the model
  const evalResult = model.evaluate(testXs, testYs);
  
  console.log(`\nEvaluation result:`);
  console.log(`Loss: ${evalResult[0].dataSync()[0].toFixed(4)}`);
  console.log(`Accuracy: ${evalResult[1].dataSync()[0].toFixed(4)}`);
  
  // Calculate precision and recall on test data
  const predictions = model.predict(testXs);
  const predictionValues = predictions.dataSync();
  const threshold = 0.65;  // Same threshold used in prediction service
  
  let truePositives = 0;
  let falsePositives = 0;
  let falseNegatives = 0;
  let trueNegatives = 0;
  
  const testLabels = testYs.dataSync();
  
  for (let i = 0; i < predictionValues.length; i++) {
    const predicted = predictionValues[i] >= threshold ? 1 : 0;
    const actual = testLabels[i];
    
    if (predicted === 1 && actual === 1) truePositives++;
    if (predicted === 1 && actual === 0) falsePositives++;
    if (predicted === 0 && actual === 1) falseNegatives++;
    if (predicted === 0 && actual === 0) trueNegatives++;
  }
  
  const precision = truePositives / (truePositives + falsePositives);
  const recall = truePositives / (truePositives + falseNegatives);
  const f1Score = 2 * precision * recall / (precision + recall);
  
  console.log(`\nPrecision: ${precision.toFixed(4)}`);
  console.log(`Recall: ${recall.toFixed(4)}`);
  console.log(`F1 Score: ${f1Score.toFixed(4)}`);
  
  return model;
}

// Save feature statistics for normalization
function saveFeatureStats(trainingData) {
  console.log('Saving feature statistics for normalization...');
  
  const numFeatures = trainingData.xs[0].length;
  const featureStats = {
    means: Array(numFeatures).fill(0),
    stdDevs: Array(numFeatures).fill(0)
  };
  
  // Calculate means
  for (let i = 0; i < numFeatures; i++) {
    let sum = 0;
    for (let j = 0; j < trainingData.xs.length; j++) {
      sum += trainingData.xs[j][i];
    }
    featureStats.means[i] = sum / trainingData.xs.length;
  }
  
  // Calculate standard deviations
  for (let i = 0; i < numFeatures; i++) {
    let sumSquaredDiffs = 0;
    for (let j = 0; j < trainingData.xs.length; j++) {
      sumSquaredDiffs += Math.pow(trainingData.xs[j][i] - featureStats.means[i], 2);
    }
    featureStats.stdDevs[i] = Math.sqrt(sumSquaredDiffs / trainingData.xs.length);
  }
  
  // Save to a file
  const modelDir = path.join(__dirname, '../model/fraud_detection_model');
  
  // Create directory if it doesn't exist
  if (!fs.existsSync(modelDir)) {
    fs.mkdirSync(modelDir, { recursive: true });
  }
  
  const statsPath = path.join(modelDir, 'feature_stats.json');
  fs.writeFileSync(statsPath, JSON.stringify(featureStats, null, 2));
  
  console.log(`Feature stats saved to ${statsPath}`);
}

// Utility function to shuffle an array
function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

// Handle application termination
process.on('SIGINT', () => {
  mongoose.disconnect();
  console.log('Training process interrupted');
  process.exit(0);
}); 