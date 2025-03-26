const axios = require('axios');
const HotelCancellation = require('../models/hotelCancellation');

// Python ML Service URL (configurable from environment variable)
const PYTHON_ML_SERVICE_URL = process.env.PYTHON_ML_SERVICE_URL || 'http://localhost:5001';

// Get comparison with hotel cancellation patterns
exports.compareWithHotelData = async (req, res) => {
  try {
    console.log('Requesting hotel cancellation pattern comparison');
    
    // Try using Python service first
    try {
      console.log('Attempting to use Python service for hotel data comparison');
      const pythonResponse = await axios.get(`${PYTHON_ML_SERVICE_URL}/compare-hotel-patterns`, {
        timeout: 5000,
        headers: { 'Accept': 'application/json' }
      });
      
      if (pythonResponse.data) {
        console.log('Successfully received hotel pattern comparison from Python service');
        return res.status(200).json(pythonResponse.data);
      }
    } catch (pythonError) {
      console.log(`Python service unavailable for hotel comparison: ${pythonError.message}`);
      console.log('Falling back to database query for hotel comparison');
    }
    
    // Fallback to direct database queries if Python service failed
    const hotelCancellations = await HotelCancellation.find({});
    
    if (!hotelCancellations || hotelCancellations.length === 0) {
      return res.status(404).json({ message: 'No hotel cancellation data found' });
    }
    
    // Calculate statistics
    const leadTimeAvg = hotelCancellations.reduce((sum, record) => sum + record.leadTime, 0) / hotelCancellations.length;
    const cancellationRatio = hotelCancellations.filter(r => r.isCancelled).length / hotelCancellations.length;
    
    // Prepare response with basic statistics
    const response = {
      hotelStatistics: {
        totalBookings: hotelCancellations.length,
        cancellationRatio: cancellationRatio.toFixed(2),
        averageLeadTime: Math.round(leadTimeAvg),
        comparisonInsights: [
          "Hotel bookings typically have different cancellation patterns than boat rentals",
          "Seasonal variations affect both industries but in different ways",
          "Weekend vs. weekday patterns show distinct differences"
        ]
      },
      source: 'database-fallback'
    };
    
    res.status(200).json(response);
  } catch (error) {
    console.error('Error comparing with hotel data:', error);
    res.status(500).json({ message: 'Error comparing with hotel data', error: error.message });
  }
}; 