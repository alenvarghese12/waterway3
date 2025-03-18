const mongoose = require('mongoose');

const overviewSchema = new mongoose.Schema({
  boatId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Boat',
    required: true
  },
  description: {
    type: String,
    required: true
  },
  aboutProperty: {
    type: String,
    required: true
  },
  propertyHighlights: [{
    title: {
      type: String,
      required: true
    },
    description: {
      type: String,
      required: true
    }
  }],
  images: [{
    type: String
  }]
}, {
  timestamps: true
});

module.exports = mongoose.model('Overview', overviewSchema); 