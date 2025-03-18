const express = require('express');
const router = express.Router();
const Food = require('../model/Food');
const multer = require('multer');
const path = require('path');
const FoodItem = require('../model/FoodItem')

// Add or Update Food for a Boat
router.post('/:boatId/food', async (req, res) => {
  const { boatId } = req.params;
  const { meals } = req.body; // meals for breakfast, lunch, dinner

  try {
    let food = await Food.findOne({ boatId });

    if (food) {
      // Update existing food entry
      food.meals = meals;
      await food.save();
      return res.json({ message: 'Food updated successfully', food });
    }

    // Create new food entry
    const newFood = new Food({ boatId, meals });
    await newFood.save();
    res.json({ message: 'Food added successfully', food: newFood });

  } catch (error) {
    console.error('Error adding/updating food:', error);
    res.status(500).json({ error: 'Server error' });
  }
});


// Configure multer for image upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/') // Make sure this directory exists
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname))
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: function (req, file, cb) {
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
      return cb(new Error('Only image files are allowed!'), false);
    }
    cb(null, true);
  }
});

// Get Food for a Boat
router.get('/:boatId/food', async (req, res) => {
  const { boatId } = req.params;

  try {
    const food = await Food.findOne({ boatId });
    if (!food) {
      return res.status(404).json({ message: 'Food options not found' });
    }
    res.json(food);
  } catch (error) {
    console.error('Error fetching food:', error);
    res.status(500).json({ error: 'Server error' });
  }
});


router.post('/food-items', upload.single('image'), async (req, res) => {
  try {
    const { name, description, price, category, customizations, boatOwnerId, boatId } = req.body;
    
    // Validate required fields
    if (!name || !description || !price || !category || !boatOwnerId || !boatId) {
      return res.status(400).json({ 
        message: 'Missing required fields',
        required: ['name', 'description', 'price', 'category', 'boatOwnerId', 'boatId']
      });
    }

    const newFoodItem = new FoodItem({
      name,
      description,
      price: Number(price),
      category,
      customizations: JSON.parse(customizations || '{}'),
      boatOwnerId,
      boatId, // Add boatId to the new food item
      image: req.file ? req.file.filename : undefined
    });

    await newFoodItem.save();
    res.status(201).json(newFoodItem);
  } catch (error) {
    console.error('Error adding food item:', error);
    res.status(400).json({ 
      message: 'Error adding food item', 
      error: error.message 
    });
  }
});

// Get all food items by boat owner ID
router.get('/food-items/:ownerId', async (req, res) => {
  try {
    const { ownerId } = req.params;
    
    const foodItems = await FoodItem.find({ boatOwnerId: ownerId })
      .select('name description price image category customizations')
      .sort({ category: 1, name: 1 });

    if (!foodItems || foodItems.length === 0) {
      return res.status(404).json({ message: 'No food items found for this boat owner' });
    }

    res.json(foodItems);
  } catch (error) {
    console.error('Error fetching food items:', error);
    res.status(500).json({ message: 'Server error while fetching food items' });
  }
});

// Get a single food item by ID
router.get('/food-items/item/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const foodItem = await FoodItem.findById(id)
      .select('name description price image category customizations');

    if (!foodItem) {
      return res.status(404).json({ message: 'Food item not found' });
    }

    res.json(foodItem);
  } catch (error) {
    console.error('Error fetching food item:', error);
    res.status(500).json({ message: 'Server error while fetching food item' });
  }
});

// Get food items by category
router.get('/food-items/category/:category', async (req, res) => {
  try {
    const { category } = req.params;
    const { ownerId } = req.query;

    const query = { category };
    if (ownerId) {
      query.boatOwnerId = ownerId;
    }

    const foodItems = await FoodItem.find(query)
      .select('name description price image category customizations')
      .sort({ name: 1 });

    if (!foodItems || foodItems.length === 0) {
      return res.status(404).json({ message: 'No food items found in this category' });
    }

    res.json(foodItems);
  } catch (error) {
    console.error('Error fetching food items by category:', error);
    res.status(500).json({ message: 'Server error while fetching food items' });
  }
});

// Search food items
router.get('/food-items/search', async (req, res) => {
  try {
    const { query, ownerId } = req.query;

    const searchQuery = {
      boatOwnerId: ownerId,
      $or: [
        { name: { $regex: query, $options: 'i' } },
        { description: { $regex: query, $options: 'i' } },
        { category: { $regex: query, $options: 'i' } }
      ]
    };

    const foodItems = await FoodItem.find(searchQuery)
      .select('name description price image category customizations')
      .sort({ category: 1, name: 1 });

    res.json(foodItems);
  } catch (error) {
    console.error('Error searching food items:', error);
    res.status(500).json({ message: 'Server error while searching food items' });
  }
});

// Get all food items for a specific boat
router.get('/boat/:boatId', async (req, res) => {
  try {
    const { boatId } = req.params;
    const foodItems = await FoodItem.find({ boatId })
      .select('name description price image category')
      .sort({ category: 1, name: 1 });

    res.json(foodItems || []);
  } catch (error) {
    console.error('Error fetching food items:', error);
    res.status(500).json({ message: 'Server error while fetching food items' });
  }
});

// Delete a food item
router.delete('/food-items/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const deletedItem = await FoodItem.findByIdAndDelete(id);
    
    if (!deletedItem) {
      return res.status(404).json({ message: 'Food item not found' });
    }
    
    res.json({ message: 'Food item deleted successfully', deletedItem });
  } catch (error) {
    console.error('Error deleting food item:', error);
    res.status(500).json({ message: 'Error deleting food item', error: error.message });
  }
});

module.exports = router;
