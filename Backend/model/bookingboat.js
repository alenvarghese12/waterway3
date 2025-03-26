const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  boatId: { type: mongoose.Schema.Types.ObjectId, ref: 'Boat', required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  passengers: {
    adults: {
      type: Number,
      required: true,
      min: 1
    },
    children: {
      type: Number,
      required: true,
      default: 0
    },
    totalPassengers: {
      type: Number,
      required: false
    }
  },
  paymentId: { type: String, required: true },
  name: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  address: { type: String, required: true },
  totalAmount: { type: Number, required: true },
  boatName: { type: String, required: true },
  boatImage: { type: String },
  location: {
    place: String,
    district: String,
    pincode: String,
    state: String,
    coordinates: {
      type: [Number],
      default: undefined
    }
  },
  status: {
    type: String,
    enum: ['confirmed', 'cancelled', 'completed'],
    default: 'confirmed'
  }
});

// Add pre-save middleware to calculate total passengers
bookingSchema.pre('save', function(next) {
  this.passengers.totalPassengers = this.passengers.adults + this.passengers.children;
  next();
});

module.exports = mongoose.model('Booking', bookingSchema);
