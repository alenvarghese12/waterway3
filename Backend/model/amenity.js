const mongoose = require('mongoose');

const amenityItemSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, required: true }
});

const amenityCategorySchema = new mongoose.Schema({
  category: { type: String, required: true },
  items: [amenityItemSchema]
});

const amenitiesSchema = new mongoose.Schema({
  boatId: { type: mongoose.Schema.Types.ObjectId, ref: 'Boatreg', required: true },
  amenities: [amenityCategorySchema]
});

module.exports = mongoose.model('Amenity', amenitiesSchema); 