const mongoose = require('mongoose');

const foodSchema = new mongoose.Schema({
  boatId: { type: mongoose.Schema.Types.ObjectId, ref: 'Boat', required: true }, // Link food to boat
  meals: {
    breakfast: [
      {
        itemName: { type: String, required: true },
        description: { type: String },
        price: { type: Number, required: true },
        isVegetarian: { type: Boolean, required: true }, // Veg/Non-veg flag
        options: [
          {
            optionName: { type: String },
            choices: [String], // Extra choices for customization (e.g., sides, sauces)
          }
        ],
      }
    ],
    lunch: [
      {
        itemName: { type: String, required: true },
        description: { type: String },
        price: { type: Number, required: true },
        isVegetarian: { type: Boolean, required: true },
        options: [
          {
            optionName: { type: String },
            choices: [String]
          }
        ],
      }
    ],
    dinner: [
      {
        itemName: { type: String, required: true },
        description: { type: String },
        price: { type: Number, required: true },
        isVegetarian: { type: Boolean, required: true },
        options: [
          {
            optionName: { type: String },
            choices: [String]
          }
        ],
      }
    ]
  }
});

module.exports = mongoose.model('Food', foodSchema);
