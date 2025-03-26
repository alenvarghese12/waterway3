const express = require('express');
const router = express.Router();
const { getFraudStatistics } = require('../ml/fraudDetectionService'); 
const UserFraudProfile = require('../model/UserFraudProfile');
const CancellationRecord = require('../model/CancellationRecord');

// Add this new route to fetch fraud user details by ID
router.get('/fraud-user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    if (!userId) {
      return res.status(400).json({ message: 'User ID is required' });
    }
    
    // First try to get user from the User model
    const User = require('../model/userData').User;
    let user = null;
    
    try {
      user = await User.findById(userId);
    } catch (userErr) {
      console.log('Error finding user by ID:', userErr);
      // Try finding by other field if MongoDB ID lookup fails
      try {
        user = await User.findOne({ googleId: userId });
      } catch (err) {
        console.log('Error finding user by userId field:', err);
      }
    }
    
    if (user) {
      // Return basic user info
      return res.json({
        id: user._id || user.id,
        userId: user.googleId || user._id || user.id,
        email: user.email,
        name: user.name,
        createdAt: user.createdAt
      });
    }
    
    // If we couldn't find the user in the User model, check if there's info in UserFraudProfile
    let fraudProfile = null;
    
    try {
      fraudProfile = await UserFraudProfile.findOne({ userId: userId });
    } catch (profileErr) {
      console.log('Error finding fraud profile:', profileErr);
    }
    
    if (fraudProfile) {
      // Return what we know from the fraud profile
      return res.json({
        id: userId,
        userId: userId,
        email: fraudProfile.email || 'unknown@example.com',
        name: fraudProfile.userName || 'Unknown User',
        riskScore: fraudProfile.riskScore,
        isFlagged: fraudProfile.isFlagged
      });
    }
    
    // Check the flagged users list from statistics as a last resort
    try {
      const stats = await getFraudStatistics();
      const flaggedUser = stats.flaggedUsers.find(user => user.userId === userId);
      
      if (flaggedUser) {
        return res.json({
          id: userId,
          userId: userId,
          email: flaggedUser.email || 'unknown@example.com',
          name: flaggedUser.name || 'Flagged User',
          riskLevel: flaggedUser.riskLevel,
          totalCancellations: flaggedUser.totalCancellations
        });
      }
    } catch (statsErr) {
      console.log('Error checking fraud statistics:', statsErr);
    }
    
    // If we still don't have user details, return limited info
    return res.json({
      id: userId,
      userId: userId,
      email: 'unknown@example.com',
      name: 'Unknown User'
    });
    
  } catch (error) {
    console.error('Error fetching fraud user details:', error);
    res.status(500).json({ message: 'Error fetching fraud user details' });
  }
});

// Get fraud statistics with specific cancellation conditions
router.get('/fraud-statistics', async (req, res) => {
    try {
        console.log('Fetching fraud statistics...');
        
        // First, get all UserFraudProfile records
        const allProfiles = await UserFraudProfile.find({});
        console.log(`Found ${allProfiles.length} total UserFraudProfile records`);
        
        // Log a sample profile if any exist
        if (allProfiles.length > 0) {
            console.log('Sample UserFraudProfile:', JSON.stringify(allProfiles[0], null, 2));
        }
        
        // Get high risk users with less strict conditions
        const highRiskUsers = await UserFraudProfile.find({
            $or: [
                { currentFraudScore: { $gte: 25 } },
                { cancellationsLast24Hours: { $gte: 1 } },
                { cancellationsLast7Days: { $gte: 3 } },
                { cancellationsLast30Days: { $gte: 5 } }
            ]
        });
        
        console.log(`Found ${highRiskUsers.length} high risk users`);
        
        // Get recent cancellations
        const recentCancellations = await CancellationRecord.find({
            createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
        });
        
        console.log(`Found ${recentCancellations.length} recent cancellations`);
        
        // Enhance user data with cancellation details
        const enhancedUsers = await Promise.all(highRiskUsers.map(async (profile) => {
            const userCancellations = recentCancellations.filter(
                c => c.userId.toString() === profile.userId.toString()
            );
            
            return {
                ...profile.toObject(),
                isFlagged: true,
                flagReason: profile.currentFraudScore >= 25 ? 'High fraud score' :
                           profile.cancellationsLast24Hours >= 1 ? 'Recent cancellations' :
                           profile.cancellationsLast7Days >= 3 ? 'Multiple cancellations in last week' :
                           'Multiple cancellations in last month',
                recentCancellations: userCancellations.map(c => ({
                    date: c.createdAt,
                    reason: c.reason
                }))
            };
        }));
        
        // Calculate statistics
        const stats = {
            flaggedUsersCount: enhancedUsers.length,
            highRiskUsersCount: highRiskUsers.length,
            recentCancellationsCount: recentCancellations.length,
            suspiciousCancellationsCount: recentCancellations.filter(c => 
                c.reason.toLowerCase().includes('suspicious') || 
                c.reason.toLowerCase().includes('fraud')
            ).length,
            flaggedUsers: enhancedUsers,
            isRuleBased: true,
            detectionMethod: "rule-based"
        };
        
        console.log('Final statistics:', JSON.stringify(stats, null, 2));
        res.json(stats);
        
    } catch (error) {
        console.error('Error fetching fraud statistics:', error);
        res.status(500).json({ error: 'Failed to fetch fraud statistics', details: error.message });
    }
});

router.get('/fraud-profiles', async (req, res) => {
    try {
        console.log('Fetching fraud profiles...');
        
        // Get all profiles first to check if we have any data
        const allProfiles = await UserFraudProfile.find({});
        console.log(`Found ${allProfiles.length} total UserFraudProfile records`);
        
        if (allProfiles.length === 0) {
            console.log('No UserFraudProfile records found in database');
            return res.status(404).json({ 
                message: 'No fraud profiles found in database',
                details: 'The UserFraudProfile collection is empty'
            });
        }

        // Get profiles with high cancellation rates
        const fraudProfiles = await UserFraudProfile.find({
            $or: [
                { cancellationsLast24Hours: { $gt: 1 } },
                { cancellationsLast7Days: { $gt: 5 } },
                { currentFraudScore: { $gte: 25 } }
            ]
        }).lean();

        console.log(`Found ${fraudProfiles.length} profiles matching fraud criteria`);

        if (fraudProfiles.length === 0) {
            return res.status(404).json({ 
                message: 'No fraud profiles found matching criteria',
                details: 'No users found with high cancellation rates or fraud scores',
                totalProfiles: allProfiles.length
            });
        }

        // Log a sample profile for debugging
        console.log('Sample fraud profile:', JSON.stringify(fraudProfiles[0], null, 2));

        res.json(fraudProfiles);
    } catch (error) {
        console.error('Error fetching fraud profiles:', error);
        res.status(500).json({ 
            message: 'Server error',
            details: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
});

// Export the router
module.exports = router; 