const mongoose = require('mongoose');

const userFraudProfileSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  // Cancellation patterns
  totalCancellations: { type: Number, default: 0 },
  totalBookings: { type: Number, default: 0 },
  cancellationRatio: { type: Number, default: 0 }, // totalCancellations / totalBookings
  
  // Time-based patterns
  cancellationsLast24Hours: { type: Number, default: 0 },
  cancellationsLast7Days: { type: Number, default: 0 },
  cancellationsLast30Days: { type: Number, default: 0 },
  averageTimeBetweenCancellations: { type: Number, default: null }, // In hours
  
  // Boat patterns
  distinctBoatsBooked: { type: Number, default: 0 },
  distinctBoatsCancelled: { type: Number, default: 0 },
  boatCancellationDistribution: {
    type: Map,
    of: Number,
    default: new Map() // BoatId -> cancellation count
  },
  
  // Passenger patterns
  averageAdults: { type: Number, default: 0 },
  averageChildren: { type: Number, default: 0 },
  adultChildrenRatio: { type: Number, default: 0 },
  passengerVariance: { type: Number, default: 0 }, // Measures how much passenger counts vary
  
  // Lead time patterns
  averageLeadTime: { type: Number, default: 0 }, // In days
  leadTimeVariance: { type: Number, default: 0 },
  shortLeadTimeBookings: { type: Number, default: 0 }, // Less than 2 days
  
  // Current fraud assessment
  currentFraudScore: { type: Number, default: 0 }, // 0-100
  isFlagged: { type: Boolean, default: false },
  flagReason: { type: String, default: '' },
  
  // Timestamps and metadata
  lastUpdated: { type: Date, default: Date.now },
  lastBookingDate: { type: Date, default: null },
  lastCancellationDate: { type: Date, default: null }
});

// Index for quick lookup
userFraudProfileSchema.index({ userId: 1 });
userFraudProfileSchema.index({ currentFraudScore: -1 });
userFraudProfileSchema.index({ cancellationsLast24Hours: -1 });

module.exports = mongoose.model('UserFraudProfile', userFraudProfileSchema); 