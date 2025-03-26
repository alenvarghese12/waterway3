const mongoose = require('mongoose');

const cancellationRecordSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  bookingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking',
    required: true
  },
  boatId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Boat',
    required: true
  },
  // Cancellation metadata
  cancellationDate: {
    type: Date,
    default: Date.now,
    required: true
  },
  cancellationReason: {
    type: String,
    enum: ['user_cancelled', 'payment_failed', 'system_cancelled', 'owner_cancelled', 'other'],
    default: 'user_cancelled'
  },
  userProvidedReason: {
    type: String,
    trim: true,
    maxlength: 1000
  },
  // Original booking details
  originalBookingData: {
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    adults: { type: Number, required: true },
    children: { type: Number, default: 0 },
    totalAmount: { type: Number, required: true },
    leadTime: { type: Number, required: true } // Days between booking and start date
  },
  // Timing information
  timeSinceBooking: { type: Number, required: true }, // Minutes between booking creation and cancellation
  timeBeforeDeparture: { type: Number, required: true }, // Days between cancellation and planned start date
  
  // IP and device information for additional fraud checks
  ipAddress: { type: String },
  deviceInfo: { type: String },
  
  // Denormalized fraud signals for quick querying
  isSuspicious: { type: Boolean, default: false },
  fraudScore: { type: Number, default: 0 }, // 0-100 scale
  
  // Timestamps
  createdAt: { type: Date, default: Date.now }
});

// Compound indexes for efficient querying
cancellationRecordSchema.index({ userId: 1, cancellationDate: -1 });
cancellationRecordSchema.index({ boatId: 1, cancellationDate: -1 });
cancellationRecordSchema.index({ userId: 1, boatId: 1 });
cancellationRecordSchema.index({ ipAddress: 1, cancellationDate: -1 });

// Virtual field to calculate cancellations per day rate
cancellationRecordSchema.virtual('cancellationsPerDay').get(function() {
  // This will be calculated when needed
});

module.exports = mongoose.model('CancellationRecord', cancellationRecordSchema); 