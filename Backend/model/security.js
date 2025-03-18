const mongoose = require('mongoose');

const securitySchema = new mongoose.Schema({
  boatId: { type: mongoose.Schema.Types.ObjectId, ref: 'Boatreg', required: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  certificateNumber: { type: String, required: true },
  validUntil: { type: Date, required: true },
  safetyDocument: { type: String, required: true },
  insuranceNumber: { type: String, required: true },
  insuranceValidUntil: { type: Date, required: true },
  insuranceDocument: { type: String, required: true }
});

module.exports = mongoose.model('Security', securitySchema); 