const mongoose = require('mongoose');

const policySchema = new mongoose.Schema({
  boatId: { type: mongoose.Schema.Types.ObjectId, ref: 'Boatreg', required: true },
  title: { type: String, required: true },
  points: [{ type: String, required: true }],
  type: { 
    type: String, 
    required: true,
    enum: ['general', 'cancellation', 'safety', 'house_rules', 'payment']
  }
});

module.exports = mongoose.model('Policy', policySchema); 