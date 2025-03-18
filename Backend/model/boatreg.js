// // models/boatreg.js

// const mongoose = require('mongoose');

// const boatSchema = new mongoose.Schema({
//   boatName: { type: String, required: true },
//   boatType: { type: String, required: true },
//   description: { type: String, required: true },
//   price: { type: Number, required: true },
//   priceType: { type: String, enum: ['perNight', 'perHead'], required: true },
//   licenseNumber: { type: String, required: true },
//   licenseDocument: { type: String }, // File path for license document
//   speed: { type: Number, required: true },
//   capacity: { type: Number, required: true },
//   engineType: { type: String, required: true },
//   status: { type: String, enum: ['active', 'inactive', 'maintenance'], default: 'active' },
//   image: { type: String },// File path for the boat image
//   discountPercentage: { type: Number, required: true },
//   finalPrice: { type: Number, required: true },
//   // offerDescription: { type: String, required: true },
//   location: { type: String, required: true }, 
//   // ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
//   createdAt: { type: Date, default: Date.now },
//   verified: { type: Boolean, default: false }, 
//   unavailableDates: [Date],// New field for admin approval
//   ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true } // Reference to the boat owner
// });

// module.exports = mongoose.model('Boatreg', boatSchema);
const mongoose = require('mongoose');

const locationSchema = new mongoose.Schema({
  place: { type: String, required: true },
  district: { type: String, required: true },
  pincode: { type: String, required: true },
  state: { type: String, required: true },
  country: { type: String, required: true, default: 'India' },
  coordinates: {
    type: [Number], // [latitude, longitude]
    required: false
  }
});

const driverSchema = new mongoose.Schema({
  name: { type: String },
  address: { type: String },
  phoneNumber: { type: String },
  licenseNumber: { type: String },
  licenseDocument: { type: String }
});

const boatSchema = new mongoose.Schema({
  boatName: { type: String, required: true },
  boatType: { type: String, required: true },
  description: { type: String, required: true },
  price: { type: Number, required: true },
  priceType: { type: String, required: true, enum: ['perNight', 'perHead'] },
  licenseNumber: { type: String, required: true },
  speed: { type: Number, required: true },
  capacity: { type: Number, required: true },
  engineType: { type: String, required: true, enum: ['inboard', 'outboard', 'jetDrive'] },
  status: { type: String, default: 'active' },
  image: { type: String, required: true },
  licenseDocument: { type: String, required: true },
  discountPercentage: { type: Number, default: 0 },
  finalPrice: { type: Number },
  location: { type: locationSchema, required: true },
  ownerId: { type: mongoose.Schema.Types.ObjectId, required: true },
  verified: { type: Boolean, default: false },
  registrationNumber: { type: String, required: true },
  registrationDocument: { type: String, required: true },
  hasDriver: { type: String, enum: ['yes', 'no'], required: true },
  driverDetails: {
    name: String,
    address: String,
    phoneNumber: String,
    licenseNumber: String,
    licenseDocument: String
  }
});

module.exports = mongoose.model('Boatreg', boatSchema);