const mongoose = require('mongoose');

const foodItemSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  image: {
    type: String
  },
  category: {
    type: String,
    enum: ['breakfast', 'lunch', 'dinner', 'fresh_juice', 'soft_drinks'],
    default: 'breakfast'
  },
  customizations: {
    type: Map,
    of: {
      type: Boolean,
      default: false
    }
  },
  boatId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Boat',
    required: true
  },
  boatOwnerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  isAvailable: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Add indexes for better query performance
foodItemSchema.index({ boatOwnerId: 1, category: 1 });
foodItemSchema.index({ name: 'text', description: 'text' });

const FoodItem = mongoose.model('FoodItem', foodItemSchema);

module.exports = FoodItem;