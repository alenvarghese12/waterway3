// const express = require('express');
// const router = express.Router();
// const Booking = require('../model/bookingboat');

// // Route to handle booking creation
// router.post('/bookingss', async (req, res) => {
//   try {
//     // Create a new booking from the request body
//     const booking = new Booking(req.body);
    
//     // Save the booking to the database
//     const savedBooking = await booking.save();
    
//     // Return a success response with the saved booking
//     res.status(201).json(savedBooking);
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ error: 'Failed to create booking' });
//   }
// });

// module.exports = router;



const express = require('express');
const router = express.Router();
const Booking = require('../model/bookingboat');
const CancellationRecord = require('../model/CancellationRecord');
const UserFraudProfile = require('../model/UserFraudProfile');
const { sendBookingEmailWithPDF } = require('../controllers/emailService'); // Assuming the email PDF function is in utils folder
const Boatreg = require('../model/boatreg');
const mongoose = require('mongoose');
const axios = require('axios');
const { checkReasonForFraudIndicators } = require('../utils/cancellationAnalysis');
const { predictFraud, compareWithHotelPatterns, notifyBoatOwner } = require('../ml/fraudDetectionService');

// Route to handle booking creation
router.post('/bookingss', async (req, res) => {
  try {
    const {
      boatId,
      userId,
      startDate,
      endDate,
      passengers,
      paymentId,
      name,
      email,
      phone,
      address,
      totalAmount,
      boatName,
      boatImage,
      location
    } = req.body;

    // Get IP address and user agent for fraud detection
    const ipAddress = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    const deviceInfo = req.headers['user-agent'];

    console.log('Received booking request:', req.body);
    
    // Calculate lead time (days between booking and start date)
    const leadTime = Math.floor((new Date(startDate) - new Date()) / (1000 * 60 * 60 * 24));
    
    // Get user's fraud profile if it exists
    let userFraudProfile = await UserFraudProfile.findOne({ userId });
    let fraudRiskAssessment = null;
    
    if (userFraudProfile) {
      // Check for suspicious patterns
      const suspiciousPatterns = [];
      
      // Check for multiple cancellations in last 24 hours
      if (userFraudProfile.cancellationsLast24Hours >= 5) {
        suspiciousPatterns.push('Multiple cancellations in last 24 hours');
      }
      
      // Check for high cancellation ratio
      if (userFraudProfile.cancellationRatio > 0.6 && userFraudProfile.totalBookings > 3) {
        suspiciousPatterns.push('High cancellation rate');
      }
      
      // Check for very short lead time combined with history of cancellations
      if (leadTime < 2 && userFraudProfile.totalCancellations > 2) {
        suspiciousPatterns.push('Short lead time with history of cancellations');
      }
      
      // Check for unusual adult to children ratio
      const childToAdultRatio = passengers.children / Math.max(passengers.adults, 1);
      if (childToAdultRatio > 3) {
        suspiciousPatterns.push('Unusual adult to children ratio');
      }
      
      // Create fraud risk assessment
      fraudRiskAssessment = {
        userId,
        fraudScore: userFraudProfile.currentFraudScore,
        suspiciousPatterns,
        leadTime,
        bookingTime: new Date(),
        adults: passengers.adults,
        children: passengers.children
      };
      
      // If fraud score is very high, reject the booking
      if (userFraudProfile.currentFraudScore >= 75) {
        console.log('Booking rejected due to high fraud risk:', fraudRiskAssessment);
        return res.status(403).json({
          error: 'Booking rejected by security system',
          message: 'This transaction appears suspicious. Please contact customer support for assistance.',
          fraudScore: userFraudProfile.currentFraudScore
        });
      }
    }
    
    // Prepare data for ML-based fraud detection
    try {
      // Only call ML service if user has a fraud profile or for random checks
      if (userFraudProfile || Math.random() < 0.1) { // 10% random checks for new users
        const fraudDetectionData = {
          userId: userId,
          leadTime: leadTime,
          adults: passengers.adults,
          children: passengers.children,
          totalAmount: totalAmount,
          isRepeatedGuest: userFraudProfile ? true : false,
          cancellationCount: userFraudProfile ? userFraudProfile.totalCancellations : 0,
          totalBookings: userFraudProfile ? userFraudProfile.totalBookings : 0,
          bookingTime: new Date().toISOString(),
          ipAddress: ipAddress
        };
        
        // Call Python fraud detection service
        try {
          const fraudResponse = await axios.post(
            'http://localhost:5000/api/detect-fraud', 
            fraudDetectionData
          );
          
          // If high probability of fraud, reject the booking
          if (fraudResponse.data.is_fraud) {
            console.log('Booking rejected by ML fraud detection:', fraudResponse.data);
            return res.status(403).json({ 
              error: 'Booking rejected by security system',
              message: 'This transaction appears suspicious. Please contact customer support.',
              fraudScore: fraudResponse.data.fraud_probability * 100
            });
          }
          
          console.log('ML Fraud detection passed:', fraudResponse.data);
        } catch (mlError) {
          // If ML service fails, log the error but continue with booking
          console.error('Error calling ML fraud detection service:', mlError.message);
        }
      }
    } catch (fraudError) {
      console.error('Error in fraud detection flow:', fraudError);
      // If fraud detection fails, log but continue with booking
    }

    // Create a new booking object with the correct passengers structure
    const booking = new Booking({
      boatId,
      userId,
      startDate,
      endDate,
      passengers: {
        adults: passengers.adults,
        children: passengers.children
      },
      paymentId,
      name,
      email,
      phone,
      address,
      totalAmount,
      boatName,
      boatImage,
      location,
      status: 'confirmed'
    });

    console.log('Created booking object:', booking);

    // Save the booking to the database
    const savedBooking = await booking.save();
    console.log('Saved booking:', savedBooking);
    
    // Update user's booking count in fraud profile
    if (userFraudProfile) {
      userFraudProfile.totalBookings += 1;
      userFraudProfile.lastBookingDate = new Date();
      await userFraudProfile.save();
    } else {
      // Create new fraud profile for first-time bookers
      await UserFraudProfile.create({
        userId,
        totalBookings: 1,
        totalCancellations: 0,
        lastBookingDate: new Date(),
        averageAdults: passengers.adults,
        averageChildren: passengers.children,
        currentFraudScore: 0
      });
    }

    // Send booking confirmation email
    const bookingDetails = {
      boatName: savedBooking.boatName,
      startDate: savedBooking.startDate,
      endDate: savedBooking.endDate,
      adults: savedBooking.passengers.adults,
      totalAmount: savedBooking.totalAmount,
      location: savedBooking.location
    };

    const userDetails = {
      name: savedBooking.name,
      email: savedBooking.email,
    };

    await sendBookingEmailWithPDF(userDetails, bookingDetails);

    res.status(201).json(savedBooking);
  } catch (err) {
    console.error('Error while creating booking:', err);
    res.status(500).json({ 
      error: 'Failed to create booking',
      details: err.message 
    });
  }
});

router.get('/user/:userId', async (req, res) => {
  const { userId } = req.params;
  try {
      const bookings = await Booking.find({ userId }); // Fetch bookings for the user
      if (bookings) {
          res.status(200).json(bookings);
      } else {
          res.status(404).json({ message: 'No bookings found for this user' });
      }
  } catch (error) {
      res.status(500).json({ message: 'Error fetching bookings', error });
  }
});


router.get('/owner/:ownerId', async (req, res) => {
  const { ownerId } = req.params;

  try {
    // Step 1: Get all boats owned by the specified owner
    const ownerBoats = await Boatreg.find({ boatOwnerId: ownerId }, '_id'); // Only fetch the IDs
    const boatIds = ownerBoats.map(boat => boat._id);

    console.log("Boat IDs for Owner:", boatIds); // Log the boat IDs

    // If boatIds is empty, return early with an informative message
    if (boatIds.length === 0) {
      return res.status(200).json({ message: 'No boats found for this owner', bookings: [] });
    }

    // Step 2: Find bookings where the `boatId` is in the list of owner's boat IDs
    const bookings = await Booking.find({ boatId: { $in: boatIds } })
      .populate('boatId', 'name type')     // Populate boat details as needed
      .populate('userId', 'name email')    // Populate user details if needed
      .exec();

    console.log("Bookings Found:", bookings); // Log the bookings found

    res.status(200).json(bookings);
  } catch (error) {
    console.error("Error fetching bookings for boat owner:", error);
    res.status(500).json({ error: 'Failed to fetch bookings' });
  }
});

router.get('/owner-boats-bookings', async (req, res) => {
  try {
    const ownerId = req.query.ownerId; // Get the ownerId from the query parameters

    // Check if ownerId is valid
    if (ownerId && !mongoose.Types.ObjectId.isValid(ownerId)) {
      return res.status(400).send({ message: 'Invalid owner ID' });
    }

    // Create query for boats based on ownerId
    const query = ownerId 
      ? { verified: true, ownerId: new mongoose.Types.ObjectId(ownerId), status: 'active' }
      : { verified: true, status: 'active' };

    // Fetch boats from the Boatreg model
    const boats = await Boatreg.find(query);

    if (!boats || boats.length === 0) {
      return res.status(404).send({ message: 'No boats found' });
    }

    // Fetch bookings related to the boats found
    const boatIds = boats.map(boat => boat._id); // Extract boat ids for booking lookup
    const bookings = await Booking.find({ boatId: { $in: boatIds } });

    if (!bookings || bookings.length === 0) {
      return res.status(404).send({ message: 'No bookings found for these boats' });
    }

    // Send the boats and bookings data in response
    res.status(200).json({ boats, bookings });

  } catch (error) {
    console.error('Error fetching boats and bookings:', error);
    res.status(500).send({ message: 'Failed to fetch boats and bookings', error: error.message });
  }
});

// Cancel a booking and store cancellation data for fraud detection
router.put('/:id/cancel', async (req, res) => {
  try {
    const bookingId = req.params.id;
    const { deviceInfo, cancelTime, leadTime, cancellationReason } = req.body;
    
    // Get IP address for fraud detection
    const ipAddress = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    const userDeviceInfo = deviceInfo || req.headers['user-agent'];
    
    // Find the booking to be cancelled
    const booking = await Booking.findById(bookingId);
    
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }
    
    // Calculate important metrics for fraud detection
    const now = new Date();
    const bookingCreationTime = booking._id.getTimestamp(); // Extract creation time from ObjectId
    const plannedStartDate = new Date(booking.startDate);
    
    const timeSinceBooking = Math.floor((now - bookingCreationTime) / (1000 * 60)); // in minutes
    const timeBeforeDeparture = leadTime || Math.floor((plannedStartDate - now) / (1000 * 60 * 60 * 24)); // in days
    
    // Analyze cancellation reason for fraud indicators
    const reasonAnalysis = checkReasonForFraudIndicators(cancellationReason);
    
    // Create cancellation record for fraud detection
    const cancellationRecord = new CancellationRecord({
      userId: booking.userId,
      bookingId: booking._id,
      boatId: booking.boatId,
      cancellationDate: cancelTime ? new Date(cancelTime) : now,
      cancellationReason: 'user_cancelled',
      userProvidedReason: cancellationReason || '',
      originalBookingData: {
        startDate: plannedStartDate,
        endDate: new Date(booking.endDate),
        adults: booking.passengers.adults || 0,
        children: booking.passengers.children || 0,
        totalAmount: booking.totalAmount || 0,
        leadTime: timeBeforeDeparture
      },
      timeSinceBooking,
      timeBeforeDeparture,
      ipAddress,
      deviceInfo: userDeviceInfo
    });
    
    await cancellationRecord.save();
    console.log('Cancellation record saved for fraud detection');
    
    // Update user's fraud profile with new cancellation data
    const fraudProfile = await updateUserFraudProfile(booking.userId);
    
    // Check for suspicious cancellation patterns using multiple approaches
    let isSuspicious = false;
    let suspiciousReason = '';
    let mlResult = null;
    let hotelPatternComparison = null;
    
    if (fraudProfile) {
      // 1. Apply rule-based checks (existing code)
      // Quick cancellation after booking (< 30 minutes)
      if (timeSinceBooking < 30) {
        isSuspicious = true;
        suspiciousReason = 'Quick cancellation after booking';
      }
      
      // Multiple cancellations in a short period
      if (fraudProfile.cancellationsLast24Hours > 3) {
        isSuspicious = true;
        suspiciousReason = 'Multiple cancellations in 24 hours';
      }
      
      // If reason analysis indicates suspicious behavior
      if (reasonAnalysis.isSuspicious) {
        isSuspicious = true;
        suspiciousReason = 'Suspicious cancellation reason: ' + reasonAnalysis.indicators.join(', ');
      }
      
      // 2. Apply ML-based fraud detection
      try {
        const mlFeatures = {
          leadTime: timeBeforeDeparture,
          cancellationRatio: fraudProfile.cancellationRatio,
          timeSinceBooking: timeSinceBooking,
          timeBeforeDeparture: timeBeforeDeparture,
          adultsCount: booking.passengers.adults || 0,
          childrenCount: booking.passengers.children || 0,
          totalAmount: booking.totalAmount || 0,
          cancellationsLast24Hours: fraudProfile.cancellationsLast24Hours,
          totalCancellations: fraudProfile.totalCancellations,
          totalBookings: fraudProfile.totalBookings,
          averageTimeBetweenCancellations: fraudProfile.averageTimeBetweenCancellations || 0,
          distinctBoatsCancelled: fraudProfile.distinctBoatsCancelled || 0,
          averageLeadTime: fraudProfile.averageLeadTime || 0
        };
        
        mlResult = await predictFraud(mlFeatures);
        
        if (mlResult.isFraud) {
          isSuspicious = true;
          suspiciousReason = 'ML model detected fraudulent pattern';
          
          // Add additional context from ML result
          if (mlResult.signals && mlResult.signals.length > 0) {
            suspiciousReason += `: ${mlResult.signals.join(', ')}`;
          }
        }
      } catch (mlError) {
        console.error('Error in ML fraud detection:', mlError);
        // Continue with other checks if ML fails
      }
      
      // 3. Compare with hotel booking patterns
      try {
        hotelPatternComparison = await compareWithHotelPatterns(booking.userId);
        
        if (hotelPatternComparison.fraudRisk === 'high' || hotelPatternComparison.fraudRisk === 'medium') {
          isSuspicious = true;
          suspiciousReason += isSuspicious 
            ? `; Similar to hotel fraud patterns: ${hotelPatternComparison.patternMatches.join(', ')}`
            : `Similar to hotel fraud patterns: ${hotelPatternComparison.patternMatches.join(', ')}`;
        }
      } catch (comparisonError) {
        console.error('Error comparing with hotel patterns:', comparisonError);
        // Continue with other checks if comparison fails
      }
      
      // Update cancellation record with suspicious flag if needed
      if (isSuspicious) {
        cancellationRecord.isSuspicious = true;
        cancellationRecord.fraudScore = fraudProfile.currentFraudScore;
        await cancellationRecord.save();
        
        console.log(`Suspicious cancellation detected: ${suspiciousReason}`);
        
        // Notify boat owner if high or medium risk detected
        if (hotelPatternComparison && 
            (hotelPatternComparison.fraudRisk === 'high' || hotelPatternComparison.fraudRisk === 'medium')) {
          // Send notification asynchronously (don't await)
          notifyBoatOwner(booking.boatId, cancellationRecord, hotelPatternComparison)
            .then(sent => {
              if (sent) {
                console.log(`Fraud warning notification sent to boat owner for boat ID: ${booking.boatId}`);
              } else {
                console.log(`Failed to send fraud warning to boat owner for boat ID: ${booking.boatId}`);
              }
            })
            .catch(err => {
              console.error('Error in owner notification process:', err);
            });
        }
      }
    }
    
    // Update booking status to cancelled
    booking.status = 'cancelled';
    await booking.save();
    
    res.status(200).json({ 
      message: 'Booking cancelled successfully',
      booking,
      suspiciousActivity: isSuspicious ? {
        flagged: true,
        reason: suspiciousReason,
        reasonAnalysis: reasonAnalysis.isSuspicious ? reasonAnalysis : null,
        mlAnalysis: mlResult && mlResult.isFraud ? {
          confidence: mlResult.confidence,
          isRuleBased: mlResult.isRuleBased || false
        } : null,
        hotelPatternMatch: hotelPatternComparison && hotelPatternComparison.fraudRisk !== 'low' ? {
          riskLevel: hotelPatternComparison.fraudRisk,
          similarityScore: hotelPatternComparison.similarityScore,
          patternMatches: hotelPatternComparison.patternMatches
        } : null
      } : null
    });
    
  } catch (error) {
    console.error('Error cancelling booking:', error);
    res.status(500).json({ error: 'Failed to cancel booking' });
  }
});

// Helper function to update user's fraud profile
async function updateUserFraudProfile(userId) {
  try {
    // Get all cancellations for this user
    const allCancellations = await CancellationRecord.find({ userId }).sort({ cancellationDate: -1 });
    
    // Get all bookings for this user
    const allBookings = await Booking.find({ userId });
    
    if (allCancellations.length === 0 && allBookings.length === 0) {
      return null;
    }
    
    // Calculate basic metrics
    const totalCancellations = allCancellations.length;
    const totalBookings = allBookings.length;
    const cancellationRatio = totalBookings > 0 ? totalCancellations / totalBookings : 0;
    
    // Time-based patterns
    const now = new Date();
    const oneDayAgo = new Date(now - 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);
    
    const cancellationsLast24Hours = allCancellations.filter(c => c.cancellationDate >= oneDayAgo).length;
    const cancellationsLast7Days = allCancellations.filter(c => c.cancellationDate >= sevenDaysAgo).length;
    const cancellationsLast30Days = allCancellations.filter(c => c.cancellationDate >= thirtyDaysAgo).length;
    
    // Calculate time between cancellations (if multiple cancellations)
    let averageTimeBetweenCancellations = null;
    if (allCancellations.length > 1) {
      let totalTimeBetween = 0;
      for (let i = 0; i < allCancellations.length - 1; i++) {
        const timeDiff = Math.abs(allCancellations[i].cancellationDate - allCancellations[i+1].cancellationDate);
        totalTimeBetween += timeDiff;
      }
      averageTimeBetweenCancellations = totalTimeBetween / (allCancellations.length - 1) / (1000 * 60 * 60); // in hours
    }
    
    // Boat patterns
    const distinctBoatsBooked = new Set(allBookings.map(b => b.boatId.toString())).size;
    const distinctBoatsCancelled = new Set(allCancellations.map(c => c.boatId.toString())).size;
    
    // Create boat cancellation distribution map
    const boatCancellationCounts = {};
    allCancellations.forEach(c => {
      const boatId = c.boatId.toString();
      boatCancellationCounts[boatId] = (boatCancellationCounts[boatId] || 0) + 1;
    });
    
    // Passenger patterns
    const adultCounts = allBookings.map(b => b.passengers?.adults || 0);
    const childrenCounts = allBookings.map(b => b.passengers?.children || 0);
    
    const averageAdults = adultCounts.length > 0 ? adultCounts.reduce((a, b) => a + b, 0) / adultCounts.length : 0;
    const averageChildren = childrenCounts.length > 0 ? childrenCounts.reduce((a, b) => a + b, 0) / childrenCounts.length : 0;
    const adultChildrenRatio = averageAdults > 0 ? averageChildren / averageAdults : 0;
    
    // Calculate variance in passenger counts
    const totalPassengerCounts = allBookings.map(b => (b.passengers?.adults || 0) + (b.passengers?.children || 0));
    let passengerVariance = 0;
    if (totalPassengerCounts.length > 0) {
      const mean = totalPassengerCounts.reduce((a, b) => a + b, 0) / totalPassengerCounts.length;
      passengerVariance = totalPassengerCounts.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / totalPassengerCounts.length;
    }
    
    // Lead time patterns
    const leadTimes = allBookings.map(b => {
      const creationTime = b._id.getTimestamp();
      const startDate = new Date(b.startDate);
      return Math.floor((startDate - creationTime) / (1000 * 60 * 60 * 24)); // in days
    });
    
    const averageLeadTime = leadTimes.length > 0 ? leadTimes.reduce((a, b) => a + b, 0) / leadTimes.length : 0;
    let leadTimeVariance = 0;
    if (leadTimes.length > 0) {
      leadTimeVariance = leadTimes.reduce((sum, val) => sum + Math.pow(val - averageLeadTime, 2), 0) / leadTimes.length;
    }
    
    const shortLeadTimeBookings = leadTimes.filter(lt => lt < 2).length;
    
    // Calculate current fraud score based on patterns (simple heuristics)
    let currentFraudScore = 0;
    
    // If more than 5 cancellations in 24 hours, that's very suspicious
    if (cancellationsLast24Hours >= 5) {
      currentFraudScore += 40;
    } else if (cancellationsLast24Hours >= 3) {
      currentFraudScore += 25;
    } else if (cancellationsLast24Hours >= 1) {
      currentFraudScore += 10;
    }
    
    // High cancellation ratio is suspicious
    if (cancellationRatio > 0.8 && totalBookings > 5) {
      currentFraudScore += 20;
    } else if (cancellationRatio > 0.5 && totalBookings > 5) {
      currentFraudScore += 10;
    }
    
    // Very frequent cancellations (less than 1 hour apart on average)
    if (averageTimeBetweenCancellations !== null && averageTimeBetweenCancellations < 1) {
      currentFraudScore += 15;
    }
    
    // Unusually high passenger variance (keeps changing group size)
    if (passengerVariance > 4 && totalBookings > 3) {
      currentFraudScore += 10;
    }
    
    // Many short lead time bookings that get cancelled
    if (shortLeadTimeBookings > 3) {
      currentFraudScore += 15;
    }
    
    // Check if profile should be flagged
    const isFlagged = currentFraudScore >= 50;
    let flagReason = '';
    
    if (isFlagged) {
      if (cancellationsLast24Hours >= 5) {
        flagReason = 'High volume of cancellations in 24 hours';
      } else if (cancellationRatio > 0.8 && totalBookings > 5) {
        flagReason = 'Excessive cancellation rate';
      } else if (averageTimeBetweenCancellations !== null && averageTimeBetweenCancellations < 1) {
        flagReason = 'Rapid-fire booking and cancellation pattern';
      } else {
        flagReason = 'Multiple suspicious booking patterns';
      }
    }
    
    // Update or create user fraud profile
    const fraudProfile = await UserFraudProfile.findOneAndUpdate(
      { userId },
      {
        totalCancellations,
        totalBookings,
        cancellationRatio,
        cancellationsLast24Hours,
        cancellationsLast7Days,
        cancellationsLast30Days,
        averageTimeBetweenCancellations,
        distinctBoatsBooked,
        distinctBoatsCancelled,
        boatCancellationDistribution: boatCancellationCounts,
        averageAdults,
        averageChildren,
        adultChildrenRatio,
        passengerVariance,
        averageLeadTime,
        leadTimeVariance,
        shortLeadTimeBookings,
        currentFraudScore,
        isFlagged,
        flagReason,
        lastUpdated: now,
        lastBookingDate: allBookings.length > 0 ? allBookings[0].startDate : null,
        lastCancellationDate: allCancellations.length > 0 ? allCancellations[0].cancellationDate : null
      },
      { new: true, upsert: true }
    );
    
    return fraudProfile;
  } catch (error) {
    console.error(`Error updating user fraud profile: ${error.message}`);
    throw error;
  }
}

// Get a user's fraud profile (admin only)
router.get('/fraud-profile/:userId', async (req, res) => {
  try {
    // TODO: Add admin authentication middleware to protect this endpoint
    
    const { userId } = req.params;
    
    // Get user's fraud profile
    const userFraudProfile = await UserFraudProfile.findOne({ userId });
    
    if (!userFraudProfile) {
      return res.status(404).json({ 
        message: 'No fraud profile found for this user',
        riskScore: 0,
        riskLevel: 'unknown'
      });
    }
    
    // Get recent cancellations
    const recentCancellations = await CancellationRecord.find({ userId })
      .sort({ cancellationDate: -1 })
      .limit(10);
    
    // Determine risk level
    let riskLevel = 'low';
    if (userFraudProfile.currentFraudScore >= 75) {
      riskLevel = 'high';
    } else if (userFraudProfile.currentFraudScore >= 50) {
      riskLevel = 'medium';
    } else if (userFraudProfile.currentFraudScore >= 25) {
      riskLevel = 'low-medium';
    }
    
    res.status(200).json({
      userId,
      riskScore: userFraudProfile.currentFraudScore,
      riskLevel,
      isFlagged: userFraudProfile.isFlagged,
      flagReason: userFraudProfile.flagReason,
      totalCancellations: userFraudProfile.totalCancellations,
      totalBookings: userFraudProfile.totalBookings,
      cancellationRatio: userFraudProfile.cancellationRatio,
      cancellationsLast24Hours: userFraudProfile.cancellationsLast24Hours,
      cancellationsLast7Days: userFraudProfile.cancellationsLast7Days,
      recentCancellations: recentCancellations.map(c => ({
        cancellationDate: c.cancellationDate,
        leadTime: c.originalBookingData.leadTime,
        adults: c.originalBookingData.adults,
        children: c.originalBookingData.children,
        timeSinceBooking: c.timeSinceBooking,
        timeBeforeDeparture: c.timeBeforeDeparture,
        cancellationReason: c.cancellationReason,
        userProvidedReason: c.userProvidedReason || 'No reason provided'
      }))
    });
  } catch (error) {
    console.error('Error getting fraud profile:', error);
    res.status(500).json({ error: 'Failed to get fraud profile' });
  }
});

// Get overall fraud statistics (admin only)
router.get('/fraud-statistics', async (req, res) => {
  try {
    // Calculate date thresholds
    const now = new Date();
    const last24Hours = new Date(now);
    last24Hours.setHours(now.getHours() - 24);
    
    const lastWeek = new Date(now);
    lastWeek.setDate(now.getDate() - 7);
    
    // Count flagged users
    const flaggedUsers = await UserFraudProfile.find({ 
      isFlagged: true 
    }, 'userId currentFraudScore totalCancellations')
      .sort({ currentFraudScore: -1 })
      .limit(10)
      .lean()
      .exec();
    
    // Format the flagged users for display
    const formattedFlaggedUsers = flaggedUsers.map(user => {
      // Make sure we have a userId at minimum
      const userId = user.userId || 'unknown';
      
      return {
        userId: userId,
        email: 'User-' + userId.toString().substr(-6), // Just use a derived placeholder
        fraudScore: user.currentFraudScore || 0,
        totalCancellations: user.totalCancellations || 0,
        riskLevel: user.currentFraudScore >= 75 ? 'high' : 
                   user.currentFraudScore >= 50 ? 'medium' : 'low'
      };
    });
    
    // Count high risk users
    const highRiskUsersCount = await UserFraudProfile.countDocuments({ 
      currentFraudScore: { $gte: 75 } 
    });
    
    // Get recent cancellations
    const recentCancellations = await CancellationRecord.find({
      cancellationDate: { $gte: last24Hours }
    })
    .limit(20)
    .lean()
    .exec();
    
    // Count suspicious cancellations
    const suspiciousCancellationsCount = await CancellationRecord.countDocuments({
      isSuspicious: true,
      cancellationDate: { $gte: lastWeek }
    });
    
    // Get cancellations by day for the last week
    const cancellationsByDay = await CancellationRecord.aggregate([
      { 
        $match: { 
          cancellationDate: { $gte: lastWeek } 
        } 
      },
      {
        $group: {
          _id: { 
            $dateToString: { 
              format: "%Y-%m-%d", 
              date: "$cancellationDate" 
            } 
          },
          count: { $sum: 1 },
          suspicious: { 
            $sum: { $cond: [{ $eq: ["$isSuspicious", true] }, 1, 0] } 
          }
        }
      },
      { $sort: { "_id": 1 } }
    ]);
    
    // Check if we're in fallback mode
    let isRuleBased = true;
    let detectionMethod = 'rule-based';
    try {
      const { FALLBACK_MODE } = require('../ml/fraudDetectionService');
      isRuleBased = FALLBACK_MODE;
      detectionMethod = FALLBACK_MODE ? 'rule-based' : 'ml-model';
    } catch (error) {
      console.error('Error getting FALLBACK_MODE:', error);
      isRuleBased = true;
      detectionMethod = 'rule-based';
    }
    
    // Return all stats
    res.status(200).json({
      flaggedUsersCount: flaggedUsers.length,
      highRiskUsersCount,
      recentCancellationsCount: recentCancellations.length,
      suspiciousCancellationsCount,
      flaggedUsers: formattedFlaggedUsers,
      cancellationsByDay,
      dataCollectionDate: new Date(),
      isRuleBased: isRuleBased,
      detectionMethod: detectionMethod
    });
  } catch (error) {
    console.error('Error getting fraud statistics:', error);
    res.status(500).json({ 
      error: 'Failed to retrieve fraud statistics',
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      isRuleBased: true,
      detectionMethod: 'rule-based'
    });
  }
});

// Analyze cancellation reasons (admin only)
router.get('/cancellation-reason-analysis', async (req, res) => {
  try {
    // TODO: Add admin authentication middleware to protect this endpoint
    const { analyzeCancellationReasons } = require('../utils/cancellationAnalysis');
    
    // Get the optional userId parameter
    const { userId } = req.query;
    
    // Perform the analysis
    const analysis = await analyzeCancellationReasons(userId || null);
    
    res.status(200).json(analysis);
  } catch (error) {
    console.error('Error analyzing cancellation reasons:', error);
    res.status(500).json({ error: 'Failed to analyze cancellation reasons' });
  }
});

// Analyze cancellation reasons for a specific user (admin only)
router.get('/cancellation-reason-analysis/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }
    
    // Get cancellations for the user
    const cancellations = await CancellationRecord.find({ userId })
      .sort({ cancellationDate: -1 })
      .limit(20);
    
    if (cancellations.length === 0) {
      return res.status(404).json({ 
        message: 'No cancellation history found for this user' 
      });
    }
    
    // Analyze reasons provided
    const reasons = cancellations.map(c => c.userProvidedReason || 'No reason provided');
    
    // Count frequency of words in reasons (simple analysis)
    const wordFrequency = {};
    reasons
      .filter(reason => reason !== 'No reason provided')
      .forEach(reason => {
        const words = reason.toLowerCase().split(/\W+/).filter(w => w.length > 3);
        words.forEach(word => {
          wordFrequency[word] = (wordFrequency[word] || 0) + 1;
        });
      });
    
    // Sort by frequency
    const commonWords = Object.entries(wordFrequency)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([word, count]) => ({ word, count }));
    
    // Calculate simple stats
    const noReasonCount = reasons.filter(r => r === 'No reason provided').length;
    const withReasonCount = cancellations.length - noReasonCount;
    
    res.status(200).json({
      totalCancellations: cancellations.length,
      withReasonProvided: withReasonCount,
      withoutReasonProvided: noReasonCount,
      commonWords,
      reasons: cancellations.map(c => ({
        date: c.cancellationDate,
        reason: c.userProvidedReason || 'No reason provided',
        isSuspicious: c.isSuspicious,
        leadTime: c.originalBookingData.leadTime
      }))
    });
  } catch (error) {
    console.error('Error analyzing cancellation reasons:', error);
    res.status(500).json({ error: 'Failed to analyze cancellation reasons' });
  }
});

// Analyze user against hotel cancellation patterns (admin only)
router.get('/compare-with-hotel/:userId', async (req, res) => {
  try {
    // TODO: Add admin authentication middleware to protect this endpoint
    const { userId } = req.params;
    
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }
    
    // Use the ML service to compare with hotel patterns
    try {
      console.log(`Processing hotel comparison request for user ${userId}`);
      
      const { compareWithHotelPatterns } = require('../ml/fraudDetectionService');
      const comparisonResult = await compareWithHotelPatterns(userId);
      
      if (!comparisonResult || comparisonResult.error) {
        console.error('Error in hotel comparison:', comparisonResult?.error || 'Unknown error');
        throw new Error(comparisonResult?.message || 'Failed to compare with hotel patterns');
      }
      
      // Get user details - safely, without using mongoose.model directly
      let userData = { id: userId };
      
      // Get recent cancellations
      const recentCancellations = await CancellationRecord.find({ userId })
        .sort({ cancellationDate: -1 })
        .limit(5)
        .lean()
        .exec();
      
      // Return the comparison results
      res.status(200).json({
        user: userData,
        analysisDate: new Date().toISOString(),
        comparisonResult,
        recentCancellations: recentCancellations.map(c => ({
          cancellationDate: c.cancellationDate,
          boatId: c.boatId,
          leadTime: c.originalBookingData.leadTime,
          timeBeforeDeparture: c.timeBeforeDeparture,
          isSuspicious: c.isSuspicious,
          userProvidedReason: c.userProvidedReason || 'No reason provided'
        })),
        recommendation: comparisonResult.recommendation || 'No specific recommendation',
        detectionMethod: comparisonResult.source || 'unknown'
      });
    } catch (error) {
      console.error('Error in fraud detection service:', error);
      return res.status(500).json({ 
        error: 'Fraud detection service error', 
        message: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  } catch (error) {
    console.error('Error comparing with hotel patterns:', error);
    res.status(500).json({ 
      error: 'Failed to compare with hotel patterns',
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Run ML fraud detection analysis on a booking or user (admin only)
router.post('/analyze-fraud', async (req, res) => {
  try {
    // TODO: Add admin authentication middleware to protect this endpoint
    const { userId, bookingId, featureData } = req.body;
    
    let mlFeatures = featureData;
    
    // If userId is provided but not full feature data, collect data from profile
    if (userId && !featureData) {
      const userProfile = await UserFraudProfile.findOne({ userId });
      const cancellations = await CancellationRecord.find({ userId })
        .sort({ cancellationDate: -1 })
        .limit(10);
      
      if (!userProfile || cancellations.length === 0) {
        return res.status(404).json({ 
          error: 'Insufficient data', 
          message: 'Not enough cancellation data available for analysis'
        });
      }
      
      // Get the most recent cancellation
      const latestCancellation = cancellations[0];
      
      mlFeatures = {
        leadTime: latestCancellation.originalBookingData.leadTime || 0,
        cancellationRatio: userProfile.cancellationRatio || 0,
        timeSinceBooking: latestCancellation.timeSinceBooking || 0,
        timeBeforeDeparture: latestCancellation.timeBeforeDeparture || 0,
        adultsCount: latestCancellation.originalBookingData.adults || 0,
        childrenCount: latestCancellation.originalBookingData.children || 0,
        totalAmount: latestCancellation.originalBookingData.totalAmount || 0,
        cancellationsLast24Hours: userProfile.cancellationsLast24Hours || 0,
        totalCancellations: userProfile.totalCancellations || 0,
        totalBookings: userProfile.totalBookings || 0,
        averageTimeBetweenCancellations: userProfile.averageTimeBetweenCancellations || 0,
        distinctBoatsCancelled: userProfile.distinctBoatsCancelled || 0,
        averageLeadTime: userProfile.averageLeadTime || 0
      };
    }
    
    // If bookingId is provided, get specific booking data
    if (bookingId && !featureData) {
      const booking = await Booking.findById(bookingId);
      
      if (!booking) {
        return res.status(404).json({ error: 'Booking not found' });
      }
      
      const userProfile = await UserFraudProfile.findOne({ userId: booking.userId });
      
      if (!userProfile) {
        return res.status(404).json({ 
          error: 'User profile not found', 
          message: 'No fraud profile exists for this user yet'
        });
      }
      
      // Calculate time since booking
      const bookingCreationTime = booking._id.getTimestamp();
      const timeSinceBooking = Math.floor((new Date() - bookingCreationTime) / (1000 * 60));
      
      // Calculate time before departure
      const timeBeforeDeparture = Math.floor((new Date(booking.startDate) - new Date()) / (1000 * 60 * 60 * 24));
      
      mlFeatures = {
        leadTime: timeBeforeDeparture,
        cancellationRatio: userProfile.cancellationRatio || 0,
        timeSinceBooking: timeSinceBooking,
        timeBeforeDeparture: timeBeforeDeparture,
        adultsCount: booking.adults || 0,
        childrenCount: booking.children || 0,
        totalAmount: booking.totalAmount || 0,
        cancellationsLast24Hours: userProfile.cancellationsLast24Hours || 0,
        totalCancellations: userProfile.totalCancellations || 0,
        totalBookings: userProfile.totalBookings || 0,
        averageTimeBetweenCancellations: userProfile.averageTimeBetweenCancellations || 0,
        distinctBoatsCancelled: userProfile.distinctBoatsCancelled || 0,
        averageLeadTime: userProfile.averageLeadTime || 0
      };
    }
    
    // If we still don't have feature data, return error
    if (!mlFeatures) {
      return res.status(400).json({ 
        error: 'Missing data', 
        message: 'Please provide userId, bookingId, or direct feature data for analysis' 
      });
    }
    
    // Run the ML prediction or fallback rule-based system
    const { predictFraud } = require('../ml/fraudDetectionService');
    const fraudResult = await predictFraud(mlFeatures);
    
    // Compare with hotel patterns if userId is available
    let hotelComparison = null;
    if (userId) {
      const { compareWithHotelPatterns } = require('../ml/fraudDetectionService');
      hotelComparison = await compareWithHotelPatterns(userId);
    }
    
    // Return the combined results
    res.status(200).json({
      mlAnalysis: {
        isFraud: fraudResult.isFraud,
        confidence: fraudResult.confidence,
        probability: fraudResult.probability,
        signals: fraudResult.signals || [],
        isRuleBased: fraudResult.isRuleBased || false
      },
      hotelComparison: hotelComparison,
      analysisTimestamp: new Date(),
      featureData: mlFeatures
    });
  } catch (error) {
    console.error('Error running fraud analysis:', error);
    res.status(500).json({ 
      error: 'Failed to run fraud analysis',
      message: error.message || 'Internal server error',
      isRuleBased: true
    });
  }
});

// Check Python ML service status
router.get('/python-service-status', async (req, res) => {
  try {
    const { checkPythonService, FALLBACK_MODE } = require('../ml/fraudDetectionService');
    
    // Get the current status
    const isAvailable = await checkPythonService();
    
    res.status(200).json({
      available: isAvailable,
      usingFallback: FALLBACK_MODE,
      lastChecked: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error checking Python service status:', error);
    res.status(500).json({
      available: false,
      usingFallback: true,
      errorMessage: error.message,
      lastChecked: new Date().toISOString()
    });
  }
});

module.exports = router;
