// models/Boat.js
const mongoose = require('mongoose');

const boatSchema = new mongoose.Schema({
  type: { type: String, required: true, unique: true }, // Ensures unique boat types
});

const Boat = mongoose.model('Boat', boatSchema);

module.exports = Boat;