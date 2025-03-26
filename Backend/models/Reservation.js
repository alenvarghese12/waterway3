const mongoose = require('mongoose');

const ReservationSchema = new mongoose.Schema({
  // Hotel booking features
  no_of_adults: { type: Number, required: true },
  no_of_children: { type: Number, default: 0 },
  no_of_weekend_nights: { type: Number, default: 0 },
  no_of_week_nights: { type: Number, default: 0 },
  type_of_meal_plan: { type: String },
  required_car_parking_space: { type: Number, default: 0 },
  room_type_reserved: { type: String },
  lead_time: { type: Number, required: true },
  arrival_year: { type: Number },
  arrival_month: { type: Number },
  arrival_date: { type: Number },
  market_segment_type: { type: String },
  repeated_guest: { type: String, enum: ['Yes', 'No'], default: 'No' },
  no_of_previous_cancellations: { type: Number, default: 0 },
  no_of_previous_bookings_not_canceled: { type: Number, default: 0 },
  avg_price_per_room: { type: Number },
  no_of_special_requests: { type: Number, default: 0 },
  no_of_booking_changes: { type: Number, default: 0 },
  
  // Derived features
  pricePerPerson: { type: Number },
  totalStay: { type: Number },
  totalGuests: { type: Number },
  
  // Fraud prediction results
  fraudProbability: { type: Number, required: true },
  mlProbability: { type: Number },
  rulesProbability: { type: Number, required: true },
  isHighRisk: { type: Boolean, required: true },
  riskLevel: { 
    type: String, 
    enum: ['Low Risk', 'Low-Medium Risk', 'Medium Risk', 'High Risk', 'Very High Risk'],
    required: true 
  },
  indicators: [{ type: String }],
  
  // Management fields
  confirmedFraud: { type: Boolean, default: false },
  notes: { type: String },
  timestamp: { type: Date, default: Date.now },
  
  // Optional extended fields for future use
  booking_id: { type: String },
  email: { type: String },
  phone: { type: String },
  payment_method: { type: String },
  total_price: { type: Number },
  deposit_type: { type: String },
  initial_deposit: { type: Number }
});

// Add indexes for better performance
ReservationSchema.index({ isHighRisk: 1, timestamp: -1 });
ReservationSchema.index({ riskLevel: 1 });
ReservationSchema.index({ timestamp: -1 });
ReservationSchema.index({ confirmedFraud: 1 });

module.exports = mongoose.model('Reservation', ReservationSchema); 