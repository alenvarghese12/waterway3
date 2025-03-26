// Use axios for making HTTP requests to Python service
const axios = require('axios');
const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');
const CancellationRecord = require('../model/CancellationRecord');
const UserFraudProfile = require('../model/UserFraudProfile');

// Python ML Service URL (configurable from environment variable)
const PYTHON_ML_SERVICE_URL = process.env.PYTHON_ML_SERVICE_URL || 'http://localhost:5001';

// Define fallback mode (true if Python service is unavailable)
let FALLBACK_MODE = true;
let serviceCheckInterval = null;

// Function to check if Python service is available
async function checkPythonService() {
  try {
    console.log(`Checking Python ML service at ${PYTHON_ML_SERVICE_URL}/status...`);
    const response = await axios.get(`${PYTHON_ML_SERVICE_URL}/status`, { 
      timeout: 3000,
      headers: { 'Accept': 'application/json' }
    });
    
    if (response.data && response.data.status === 'active') {
      if (FALLBACK_MODE) {
        console.log('ML Fraud Detection: Python service is now available - switching to ML-based fraud detection');
      }
      FALLBACK_MODE = false;
      return true;
    } else {
      console.log('ML Fraud Detection: Python service returned unexpected status - using rule-based detection fallback');
      FALLBACK_MODE = true;
      return false;
    }
  } catch (error) {
    const errorMessage = error.response ? 
      `Status: ${error.response.status}, Data: ${JSON.stringify(error.response.data)}` :
      error.message;
      
    console.log(`ML Fraud Detection: Python service unavailable - ${errorMessage}`);
    console.log('Using rule-based detection fallback');
    console.log('To enable ML-based detection, start the Python service (see Backend/ml_python_server/README.md)');
    FALLBACK_MODE = true;
    return false;
  }
}

// Initial service check
(async function initialServiceCheck() {
  await checkPythonService();
  
  // Setup periodic checking every 30 seconds
  if (!serviceCheckInterval) {
    serviceCheckInterval = setInterval(checkPythonService, 30000);
    // Prevent the interval from keeping the process alive
    if (serviceCheckInterval.unref) {
      serviceCheckInterval.unref();
    }
  }
})();

/**
 * Fallback rule-based fraud detection when ML model is not available
 */
function detectFraudRuleBased(userData) {
  console.log(`Using rule-based fraud detection for user ${userData.userId || 'unknown'}`);
  
  const signals = [];
  let probability = 0.0;
  
  // Rule 1: Check lead time
  if (userData.leadTime < 2 && userData.cancellationRatio > 0.3) {
    signals.push({
      feature: 'leadTime',
      value: userData.leadTime,
      message: 'Very short lead time with history of cancellations'
    });
    probability += 0.25;
  }
  
  // Rule 2: Check cancellation ratio
  if (userData.cancellationRatio > 0.5) {
    signals.push({
      feature: 'cancellationRatio',
      value: userData.cancellationRatio,
      message: 'High cancellation ratio (>50%)'
    });
    probability += 0.3;
  }
  
  // Rule 3: Check recent cancellations
  if (userData.cancellationsLast24Hours > 1) {
    signals.push({
      feature: 'cancellationsLast24Hours',
      value: userData.cancellationsLast24Hours,
      message: 'Multiple cancellations in last 24 hours'
    });
    probability += 0.25;
  }
  
  // Rule 4: Check booking-cancellation time
  if (userData.timeSinceBooking < 60 && userData.leadTime > 14) {
    signals.push({
      feature: 'timeSinceBooking',
      value: userData.timeSinceBooking,
      message: 'Very quick cancellation after booking for a trip far in the future'
    });
    probability += 0.2;
  }
  
  // Determine if booking is fraudulent based on probability threshold
  const threshold = 0.7; // 70% confidence
  const isFraudulent = probability >= threshold;
  
  return {
    isFraudulent,
    fraudProbability: probability,
    confidence: Math.round(probability * 100) / 100,
    message: isFraudulent 
      ? "This booking has been flagged as potentially fraudulent" 
      : "This booking appears to be legitimate",
    factors: signals.map(signal => signal.message),
    signals,
    source: 'rule-based',
    analysisTimestamp: new Date().toISOString()
  };
}

/**
 * Predict if a booking is fraudulent using Python ML service or rule-based detection
 */
async function predictFraud(userData) {
  try {
    // If we're in fallback mode, use rule-based detection
    if (FALLBACK_MODE) {
      console.log('Using fallback rule-based fraud detection (Python ML service not available)');
      return detectFraudRuleBased(userData);
    }
    
    // Try to use ML service
    try {
      console.log(`Sending fraud prediction request to Python service for user ${userData.userId || 'unknown'}`);
      const response = await axios.post(`${PYTHON_ML_SERVICE_URL}/predict`, userData, {
        timeout: 5000,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });
      
      if (response.data && typeof response.data.fraudProbability === 'number') {
        console.log(`Successfully received fraud prediction from Python service`);
        return {
          ...response.data,
          source: 'ml-model'
        };
      } else {
        console.log('ML service returned invalid response, falling back to rule-based detection');
        return detectFraudRuleBased(userData);
      }
    } catch (error) {
      console.error(`Error in Python fraud prediction: ${error.message}`);
      
      // If connection issues, mark fallback mode and schedule check
      if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
        FALLBACK_MODE = true;
        setTimeout(checkPythonService, 5000);
      }
      
      // Fall back to rule-based detection on any error
      return detectFraudRuleBased(userData);
    }
  } catch (error) {
    console.error(`Error in fraud prediction: ${error.message}`);
    // Fall back to rule-based detection on any error
    return detectFraudRuleBased(userData);
  }
}

/**
 * Compare cancellation patterns with hotel data using Python ML service
 */
async function compareWithHotelPatterns(userId) {
  try {
    console.log(`Comparing cancellation patterns with hotel data for user ${userId}`);
    
    // Get user's fraud profile
    const userProfile = await UserFraudProfile.findOne({ userId });
    
    if (!userProfile) {
      console.log(`No fraud profile found for user ${userId}`);
      return {
        similarityScore: 0,
        message: "No user profile found",
        recommendation: "Not enough data to compare with hotel patterns",
        dataPoints: {}
      };
    }
    
    // Get user's cancellations
    const cancellations = await CancellationRecord.find({ userId })
      .sort({ cancellationDate: -1 })
      .limit(10);
    
    if (cancellations.length === 0) {
      console.log(`No cancellation history found for user ${userId}`);
      return {
        similarityScore: 0,
        message: "No cancellation history found",
        recommendation: "User has no cancellations to analyze",
        dataPoints: {}
      };
    }
    
    // If not in fallback mode, try to use Python service for hotel comparison
    if (!FALLBACK_MODE) {
      try {
        console.log('Attempting to use Python service for hotel data comparison');
        
        // Format data for the Python service
        const requestData = {
          userId,
          userProfile: {
            cancellationRatio: userProfile.cancellationRatio,
            totalCancellations: userProfile.totalCancellations,
            totalBookings: userProfile.totalBookings,
            averageLeadTime: userProfile.averageLeadTime
          },
          cancellations: cancellations.map(c => ({
            cancellationDate: c.cancellationDate,
            timeBeforeDeparture: c.timeBeforeDeparture,
            timeSinceBooking: c.timeSinceBooking,
            originalBookingData: c.originalBookingData
          }))
        };
        
        const response = await axios.post(`${PYTHON_ML_SERVICE_URL}/compare-hotel-patterns`, requestData, {
          timeout: 5000,
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        });
        
        if (response.data) {
          console.log(`Successfully received hotel pattern comparison from Python service for user ${userId}`);
          return response.data;
        } else {
          throw new Error('Invalid response from Python service');
        }
      } catch (error) {
        const errorMessage = error.response ? 
          `Status: ${error.response.status}, Data: ${JSON.stringify(error.response.data)}` :
          error.message;
          
        console.error(`Error in Python hotel comparison: ${errorMessage}`);
        console.log('Falling back to rule-based hotel comparison');
        
        // Mark fallback mode if connection issue and schedule a check
        if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
          FALLBACK_MODE = true;
          setTimeout(checkPythonService, 5000);
        }
      }
    } else {
      console.log('Using fallback rule-based hotel comparison (Python ML service not available)');
    }
    
    // Fallback to built-in comparison logic
    
    // Calculate key metrics from user's cancellations
    const leadTimes = cancellations.map(c => c.originalBookingData.leadTime || 0);
    const averageLeadTime = leadTimes.reduce((sum, val) => sum + val, 0) / leadTimes.length;
    
    const timeBeforeDepartures = cancellations.map(c => c.timeBeforeDeparture || 0);
    const avgTimeBeforeDeparture = timeBeforeDepartures.reduce((sum, val) => sum + val, 0) / timeBeforeDepartures.length;
    
    // Calculate time patterns
    const cancellationDates = cancellations.map(c => new Date(c.cancellationDate));
    let dayOfWeekDistribution = Array(7).fill(0);
    let timeOfDayDistribution = Array(24).fill(0);
    
    cancellationDates.forEach(date => {
      dayOfWeekDistribution[date.getDay()]++;
      timeOfDayDistribution[date.getHours()]++;
    });
    
    // Normalize distributions
    dayOfWeekDistribution = dayOfWeekDistribution.map(count => count / cancellationDates.length);
    timeOfDayDistribution = timeOfDayDistribution.map(count => count / cancellationDates.length);
    
    // Calculate passenger patterns
    const adultCounts = cancellations.map(c => c.originalBookingData.adults || 0);
    const childCounts = cancellations.map(c => c.originalBookingData.children || 0);
    const avgAdults = adultCounts.reduce((sum, val) => sum + val, 0) / adultCounts.length;
    const avgChildren = childCounts.reduce((sum, val) => sum + val, 0) / childCounts.length;
    
    // Mock hotel data comparison
    const hotelPatterns = {
      averageLeadTime: 21, // days
      cancelBeforeDeparture: 5, // days
      cancellationRatio: 0.12, // 12%
      mostCommonDayOfWeek: 5, // Friday
      adultToChildRatio: 2.5, // 2.5 adults per child
      peak: {
        hour: 18, // 6pm
        day: 5 // Friday
      }
    };
    
    // Calculate similarity scores
    const leadTimeSimScore = Math.min(averageLeadTime / hotelPatterns.averageLeadTime, 
                            hotelPatterns.averageLeadTime / averageLeadTime);
    
    const depTimeSimScore = Math.min(avgTimeBeforeDeparture / hotelPatterns.cancelBeforeDeparture,
                            hotelPatterns.cancelBeforeDeparture / avgTimeBeforeDeparture);
    
    const cancRatioSimScore = Math.min(userProfile.cancellationRatio / hotelPatterns.cancellationRatio,
                            hotelPatterns.cancellationRatio / userProfile.cancellationRatio);
    
    const adultChildRatio = avgChildren > 0 ? avgAdults / avgChildren : avgAdults;
    const ratioSimScore = Math.min(adultChildRatio / hotelPatterns.adultToChildRatio,
                        hotelPatterns.adultToChildRatio / adultChildRatio);
    
    // Calculate peak similarity
    const userPeakDay = dayOfWeekDistribution.indexOf(Math.max(...dayOfWeekDistribution));
    const userPeakHour = timeOfDayDistribution.indexOf(Math.max(...timeOfDayDistribution));
    const peakDayMatch = userPeakDay === hotelPatterns.peak.day;
    const peakHourMatch = Math.abs(userPeakHour - hotelPatterns.peak.hour) <= 2; // Within 2 hours
    
    // Overall similarity score (0-100)
    const overallSimilarity = Math.round(
      (leadTimeSimScore * 0.25 + 
       depTimeSimScore * 0.2 + 
       cancRatioSimScore * 0.3 + 
       ratioSimScore * 0.15 +
       (peakDayMatch ? 0.05 : 0) + 
       (peakHourMatch ? 0.05 : 0)) * 100
    );
    
    // Determine if patterns are suspicious
    const isSuspicious = overallSimilarity < 40; // Less than 40% similarity is suspicious
    
    // Generate recommendation
    let recommendation;
    if (overallSimilarity > 70) {
      recommendation = "User's cancellation patterns are similar to typical hotel cancellations, suggesting normal behavior.";
    } else if (overallSimilarity > 40) {
      recommendation = "Some differences from typical hotel cancellation patterns detected. Monitor but no immediate action required.";
    } else {
      recommendation = "Significant deviation from typical hotel cancellation patterns. Consider implementing additional verification steps for this user.";
    }
    
    // Return comparison results
    return {
      similarityScore: overallSimilarity,
      isSuspicious,
      message: isSuspicious 
        ? "User's booking patterns differ significantly from typical hotel cancellations" 
        : "User's booking patterns are within normal range compared to hotel cancellations",
      recommendation,
      dataPoints: {
        user: {
          averageLeadTime,
          averageTimeBeforeDeparture: avgTimeBeforeDeparture,
          cancellationRatio: userProfile.cancellationRatio,
          adultToChildRatio: adultChildRatio,
          peakCancellationDay: userPeakDay,
          peakCancellationHour: userPeakHour
        },
        hotel: hotelPatterns,
        similarityScores: {
          leadTime: Math.round(leadTimeSimScore * 100),
          timeBeforeDeparture: Math.round(depTimeSimScore * 100),
          cancellationRatio: Math.round(cancRatioSimScore * 100),
          adultToChildRatio: Math.round(ratioSimScore * 100),
          peakTiming: (peakDayMatch && peakHourMatch) ? 100 : 
                      (peakDayMatch || peakHourMatch) ? 50 : 0
        },
        source: 'fallback'
      }
    };
  } catch (error) {
    console.error('Error comparing with hotel patterns:', error);
    return {
      error: 'Failed to compare with hotel patterns',
      message: error.message
    };
  }
}

/**
 * Send warning notification to boat owner about potential fraudulent activity
 */
async function notifyBoatOwner(boatId, cancellationRecord, fraudAnalysis) {
  try {
    // Get boat details to find owner
    const Boat = require('../model/boatreg');
    const boat = await Boat.findById(boatId).populate('boatOwnerId', 'email name');
    
    if (!boat || !boat.boatOwnerId) {
      console.error('Could not find boat owner for notification');
      return false;
    }
    
    const owner = boat.boatOwnerId;
    
    // Prepare notification data
    const notificationData = {
      ownerEmail: owner.email,
      ownerName: owner.name,
      boatName: boat.name || 'Your boat',
      fraudRisk: fraudAnalysis.fraudRisk || 'unknown',
      similarityScore: fraudAnalysis.similarityScore || 0,
      cancellationTime: cancellationRecord.cancellationDate,
      userReason: cancellationRecord.userProvidedReason || 'No reason provided',
      warningDetails: fraudAnalysis.patternMatches || fraudAnalysis.signals?.map(s => s.message) || [],
      recommendation: fraudAnalysis.recommendation || 'Monitor for suspicious activity'
    };
    
    // Save notification to database for reference
    const Notification = require('../model/notification');
    await Notification.create({
      userId: boat.boatOwnerId,
      type: 'fraud_warning',
      title: `Potential fraud detected for ${boat.name}`,
      message: `A booking cancellation for ${boat.name} has been flagged as potentially fraudulent (${fraudAnalysis.fraudRisk} risk).`,
      metadata: {
        cancellationId: cancellationRecord._id,
        boatId: boat._id,
        fraudRisk: fraudAnalysis.fraudRisk,
        similarityScore: fraudAnalysis.similarityScore
      },
      isRead: false
    });
    
    // Try to send email, but continue even if it fails
    try {
      const { sendFraudWarningEmail } = require('../controllers/emailService');
      await sendFraudWarningEmail(notificationData);
    } catch (emailError) {
      console.error('Error sending fraud warning email:', emailError);
      // Continue execution even if email fails
    }
    
    console.log(`Fraud warning notification saved for boat owner (${owner.email})`);
    return true;
  } catch (error) {
    console.error('Error creating fraud notification:', error);
    return false;
  }
}

// Detect fraud using Python service
async function predictFraudUsingPython(userData) {
  if (FALLBACK_MODE) {
    // If already in fallback mode, don't try the Python service
    return null;
  }

  try {
    console.log(`Sending fraud prediction request to Python service for user ${userData.userId}`);
    console.log(`Request data: ${JSON.stringify(userData)}`);
    
    const response = await axios.post(`${PYTHON_ML_SERVICE_URL}/predict`, userData, {
      timeout: 5000, // 5-second timeout
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });

    console.log(`Received prediction response: ${JSON.stringify(response.data)}`);
    
    if (response.data && typeof response.data.fraudProbability === 'number') {
      return {
        fraudProbability: response.data.fraudProbability,
        isFraudulent: response.data.isFraudulent,
        source: 'ml-model',
        confidence: response.data.confidence || 0.8,
        factors: response.data.factors || []
      };
    } else {
      console.log(`Unexpected response format from Python service: ${JSON.stringify(response.data)}`);
      return null;
    }
  } catch (error) {
    // Handle connection/timeout errors
    if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
      console.log(`Python service connection failed (${error.code}): ${error.message}`);
      // Set fallback mode and schedule a check to see if it comes back online
      FALLBACK_MODE = true;
      setTimeout(checkPythonService, 5000);
    } else if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.log(`Python service error: ${error.response.status} - ${JSON.stringify(error.response.data)}`);
    } else if (error.request) {
      // The request was made but no response was received
      console.log(`Python service no response: ${error.message}`);
    } else {
      // Something happened in setting up the request that triggered an Error
      console.log(`Python service request error: ${error.message}`);
    }
    
    return null;
  }
}

// Main fraud detection function
async function detectFraud(userData) {
  // First try to use Python ML Service
  const pythonPrediction = await predictFraudUsingPython(userData);
  
  // If successful Python prediction, return it
  if (pythonPrediction) {
    return pythonPrediction;
  }
  
  // Otherwise use rule-based fallback
  return detectFraudRuleBased(userData);
}

module.exports = {
  predictFraud,
  compareWithHotelPatterns,
  notifyBoatOwner,
  detectFraud,
  detectFraudRuleBased,
  checkPythonService,
  FALLBACK_MODE
}; 