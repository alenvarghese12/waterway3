// Import routes
const userRoutes = require('./routes/users');
const boatRoutes = require('./routes/boatreg');
const bookingRoutes = require('./routes/booking');
const reviewRoutes = require('./routes/reviews');
const paymentRoutes = require('./routes/payment');
const fraudDetectionRoutes = require('./routes/fraudDetection');
const fraudUserRoutes = require('./routes/bookings');

// Use routes
app.use('/api/users', userRoutes);
app.use('/api/boats', boatRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/fraud-detection', fraudDetectionRoutes);
app.use('/api/fraud-users', fraudUserRoutes);

// Direct handler for fraud-user endpoint as a failsafe
app.get('/api/fraud-users/fraud-user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    if (!userId) {
      return res.status(400).json({ message: 'User ID is required' });
    }
    
    console.log("Direct handler for fraud-user endpoint called with userId:", userId);
    
    // First try to get user from the User model
    const User = require('./model/userData').User;
    let user = null;
    
    try {
      user = await User.findById(userId);
      if (!user) {
        user = await User.findOne({ googleId: userId });
      }
    } catch (userErr) {
      console.log('Error finding user by ID:', userErr);
    }
    
    if (user) {
      return res.json({
        id: user._id || user.id,
        userId: user.googleId || user._id || user.id,
        email: user.email,
        name: user.name,
        createdAt: user.createdAt,
        role: user.role
      });
    }
    
    // If no user found, return basic info
    return res.json({
      id: userId,
      userId: userId,
      email: 'unknown@example.com',
      name: 'Unknown User'
    });
    
  } catch (error) {
    console.error('Error in direct handler for fraud user details:', error);
    res.status(500).json({ message: 'Error fetching fraud user details' });
  }
}); 