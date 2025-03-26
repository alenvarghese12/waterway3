const express = require('express');
const router = express.Router();
const fraudDetectionController = require('../controllers/fraudDetectionController');

// Get fraud warnings for a boat owner
router.get('/notifications/fraud-warnings/:ownerId', fraudDetectionController.getFraudWarnings);

// Mark a notification as read
router.put('/notifications/:notificationId/mark-read', fraudDetectionController.markNotificationAsRead);

// Get user fraud profile
router.get('/user-profile/:userId', fraudDetectionController.getUserFraudProfile);

// Get user cancellation history
router.get('/user-cancellations/:userId', fraudDetectionController.getUserCancellations);

// Get complete user behavior analysis
router.get('/analyze-user/:userId', fraudDetectionController.analyzeUserBehavior);

module.exports = router; 