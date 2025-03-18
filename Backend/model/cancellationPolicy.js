const mongoose = require('mongoose');

const cancellationPolicySchema = new mongoose.Schema({
  boatId: { type: mongoose.Schema.Types.ObjectId, ref: 'Boatreg', required: true },
  type: { 
    type: String, 
    required: true,
    enum: ['no_free_cancellation', 'free_cancellation']
  },
  freeWindow: { 
    type: String,
    enum: ['24h', '14h', '6h', 'anytime'],
    required: function() { return this.type === 'free_cancellation'; }
  },
  description: { type: String, required: true },
  terms: { type: String, required: true }
});

module.exports = mongoose.model('CancellationPolicy', cancellationPolicySchema); 