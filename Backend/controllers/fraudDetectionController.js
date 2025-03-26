const mongoose = require('mongoose');
const UserFraudProfile = require('../model/UserFraudProfile');
const CancellationRecord = require('../model/CancellationRecord');
const { detectFraud, compareWithHotelPatterns } = require('../ml/fraudDetectionService');

// Get fraud warnings/notifications for a boat owner
exports.getFraudWarnings = async (req, res) => {
  try {
    const { ownerId } = req.params;
    
    // Get notifications from the database
    const Notification = require('../model/notification');
    const notifications = await Notification.find({
      userId: ownerId,
      type: 'fraud_warning'
    }).sort({ createdAt: -1 });
    
    return res.status(200).json({
      success: true,
      notifications
    });
  } catch (error) {
    console.error('Error fetching fraud warnings:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch fraud warnings',
      error: error.message
    });
  }
};

// Mark a notification as read
exports.markNotificationAsRead = async (req, res) => {
  try {
    const { notificationId } = req.params;
    
    const Notification = require('../model/notification');
    const notification = await Notification.findByIdAndUpdate(
      notificationId,
      { isRead: true },
      { new: true }
    );
    
    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }
    
    return res.status(200).json({
      success: true,
      notification
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to mark notification as read',
      error: error.message
    });
  }
};

// Get user fraud profile data
exports.getUserFraudProfile = async (req, res) => {
  try {
    const { userId } = req.params;
    
    const userProfile = await UserFraudProfile.findOne({ userId });
    
    if (!userProfile) {
      return res.status(404).json({
        success: false,
        message: 'User fraud profile not found'
      });
    }
    
    return res.status(200).json({
      success: true,
      userProfile
    });
  } catch (error) {
    console.error('Error fetching user fraud profile:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch user fraud profile',
      error: error.message
    });
  }
};

// Get user cancellation history
exports.getUserCancellations = async (req, res) => {
  try {
    const { userId } = req.params;
    
    const cancellations = await CancellationRecord.find({ userId })
      .sort({ cancellationDate: -1 })
      .limit(20);
    
    return res.status(200).json({
      success: true,
      cancellations
    });
  } catch (error) {
    console.error('Error fetching user cancellations:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch user cancellations',
      error: error.message
    });
  }
};

// Get holistic fraud analysis for a user
exports.analyzeUserBehavior = async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Get user profile
    const userProfile = await UserFraudProfile.findOne({ userId });
    
    if (!userProfile) {
      return res.status(404).json({
        success: false,
        message: 'User fraud profile not found'
      });
    }
    
    // Get cancellation history
    const cancellations = await CancellationRecord.find({ userId })
      .sort({ cancellationDate: -1 })
      .limit(10);
    
    // Get hotel pattern comparison
    const hotelComparison = await compareWithHotelPatterns(userId);
    
    // Prepare analysis data
    const analysis = {
      userProfile,
      cancellationPatterns: {
        userId: userProfile.userId,
        recentCancellations: cancellations.length,
        avgLeadTime: userProfile.averageLeadTime,
        cancellationRatio: userProfile.cancellationRatio,
        riskLevel: userProfile.currentFraudScore > 70 ? 'high' : 
                  userProfile.currentFraudScore > 40 ? 'medium' : 'low'
      },
      hotelComparison,
      recommendations: []
    };
    
    // Generate recommendations based on profile
    if (userProfile.cancellationRatio > 0.5) {
      analysis.recommendations.push({
        priority: 'high',
        message: 'Consider requiring a higher deposit for future bookings'
      });
    }
    
    if (userProfile.cancellationsLast24Hours > 1) {
      analysis.recommendations.push({
        priority: 'high',
        message: 'Multiple same-day cancellations detected. Consider implementing a temporary booking restriction.'
      });
    }
    
    if (userProfile.shortLeadTimeBookings > 3) {
      analysis.recommendations.push({
        priority: 'medium',
        message: 'User frequently books with short lead times. Consider requiring full payment for short-notice bookings.'
      });
    }
    
    return res.status(200).json({
      success: true,
      analysis
    });
  } catch (error) {
    console.error('Error analyzing user behavior:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to analyze user behavior',
      error: error.message
    });
  }
}; 