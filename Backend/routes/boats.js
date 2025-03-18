const express = require('express');
const router = express.Router();
const multer = require('multer');
const Boat = require('../model/boat');  // Ensure this model is correct
const { registerBoat } = require('../controllers/boatController'); // Add your controllers if applicable
const Boatreg = require('../model/boatreg');
const authenticateToken = require('../middleware/authMiddleware'); 
const mongoose = require('mongoose');
const amenityRoutes = require('./amenityRoutes');
const policyRoutes = require('./policyRoutes');
const securityRoutes = require('./securityRoutes');
const cancellationRoutes = require('./cancellationRoutes');
const overviewRoutes = require('./overviewRoutes');
const overviewController = require('../controllers/overviewController');
// Make sure this line exists

// POST route to add a new boat type
router.post('/', async (req, res) => {
  try {
    const { type } = req.body;

    // Validation: Check if type is provided
    if (!type) {
      return res.status(400).send({ message: 'Boat type is required' });
    }

    // Validation: Check if the boat type already exists
    const existingBoat = await Boat.findOne({ type });
    if (existingBoat) {
      return res.status(400).send({ message: 'Boat type already exists' });
    }

    // Create new boat type
    const newBoat = new Boat({ type });
    await newBoat.save();

    res.status(201).send(newBoat);  // Send back the newly created boat
  } catch (error) {
    console.error('Failed to add boat type', error);
    res.status(500).send({ message: 'Failed to add boat type' });
  }
});

// GET route to fetch all unique boat types
// router.get('/types', async (req, res) => {
//   try {
//     const boats = await Boat.find().select('type -_id');
    
//     // Extract unique types
//     const boatTypes = [...new Set(boats.map(boat => boat.type))];

//     // Return unique boat types as an array of strings
//     res.status(200).json(boatTypes);
//   } catch (error) {
//     console.error('Failed to fetch boat types', error);
//     res.status(500).json({ message: 'Failed to fetch boat types' });
//   }
// });


router.get('/types', async (req, res) => {
  try {
    // Fetch all unique boat types directly
    const boats = await Boat.find().select('type -_id');

    // Return boat types as an array of strings
    res.status(200).json(boats.map(boat => boat.type));
  } catch (error) {
    console.error('Failed to fetch boat types', error);
    res.status(500).json({ message: 'Failed to fetch boat types' });
  }
});

// DELETE a boat type by ID
router.delete('/boatsde/:id', async (req, res) => {
  const { id } = req.params;
  console.log('Deleting boat with ID:', id); // Log the ID
  try {
    const boat = await Boat.findByIdAndDelete(id);
    if (!boat) {
      return res.status(404).json({ message: 'Boat not found' });
    }
    res.status(200).json({ message: 'Boat deleted successfully' });
  } catch (error) {
    console.error('Failed to delete boat:', error); // Log the error
    res.status(500).json({ message: 'Failed to delete boat' });
  }
});



// PUT route to update a boat type by ID
// router.put('/:id', async (req, res) => {
//   const { id } = req.params;
//   const { type } = req.body;

//   try {
//     const updatedBoat = await Boat.findByIdAndUpdate(id, { type }, { new: true });
//     if (!updatedBoat) {
//       return res.status(404).json({ message: 'Boat not found' });
//     }
//     res.status(200).json(updatedBoat);
//   } catch (error) {
//     console.error('Failed to update boat type', error);
//     res.status(500).json({ message: 'Failed to update boat type' });
//   }
// });

// Storage configuration for multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

// Create two separate multer instances
// 1. For handling multiple fields (boat registration)
const uploadFields = multer({ 
  storage: storage,
  fileFilter: function (req, file, cb) {
    if (file.fieldname === 'image') {
      if (!file.mimetype.startsWith('image/')) {
        return cb(new Error('Only image files are allowed!'), false);
      }
    } else if (file.fieldname === 'licenseDocument' || 
               file.fieldname === 'registrationDocument' || 
               file.fieldname === 'driverLicenseDocument') {
      if (file.mimetype !== 'application/pdf') {
        return cb(new Error('Only PDF files are allowed for documents!'), false);
      }
    }
    cb(null, true);
  }
}).fields([
  { name: 'image', maxCount: 1 },
  { name: 'licenseDocument', maxCount: 1 },
  { name: 'registrationDocument', maxCount: 1 },
  { name: 'driverLicenseDocument', maxCount: 1 }
]);

// 2. For handling arrays of images (overview)
const uploadArray = multer({
  storage: storage,
  fileFilter: function (req, file, cb) {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Only image files are allowed!'), false);
    }
    cb(null, true);
  }
});

// Use uploadFields for boat registration
router.post('/register', authenticateToken, (req, res, next) => {
  uploadFields(req, res, function(err) {
    if (err instanceof multer.MulterError) {
      return res.status(400).json({ message: `Multer error: ${err.message}` });
    } else if (err) {
      return res.status(500).json({ message: `Error: ${err.message}` });
    }
    next();
  });
}, registerBoat);

// Use uploadArray for overview images
router.put('/boatsdg/:boatId/overview', uploadArray.array('images'), overviewController.createOrUpdateOverview);

// GET route for fetching available boat types
// router.get('/boatTypes', getBoatTypes);

// Export router (remove duplicate)

// Define your routes here
router.get('/boatsd', async (req, res) => {
  try {
    const boats = await Boatreg.find({ verified: true }); // Fetch only verified boats
    res.status(200).json(boats); // Send the fetched boats
  } catch (error) {
    res.status(500).send({ message: 'Failed to fetch boats', error: error.message });
  }
});



router.get('/boatsdb', async (req, res) => {
  try {
      const ownerId = req.query.ownerId; // Get the ownerId from the query parameters

      if (ownerId && !mongoose.Types.ObjectId.isValid(ownerId)) {
          return res.status(400).send({ message: 'Invalid owner ID' });
      }

      // Properly create ObjectId for querying
      const query = ownerId ? { verified: true, ownerId: new mongoose.Types.ObjectId(ownerId), status:'active' } : { verified: true, status:'active' };
      
      console.log('OwnerId:', ownerId);  // For debugging
      console.log('Query:', query);      // For debugging

      const boats = await Boatreg.find(query);
      
      console.log('Boats found:', boats); // Log found boats for debugging

      if (!boats || boats.length === 0) {
          return res.status(404).send({ message: 'No boats found' });
      }

      res.status(200).json(boats);
  } catch (error) {
      console.error('Error fetching boats:', error);
      res.status(500).send({ message: 'Failed to fetch boats', error: error.message });
  }
});


// DELETE Route to Remove a Boat
// router.delete('/boatsde/:id', async (req, res) => {
//   try {
//     const { id } = req.params;
//     await Boatreg.findByIdAndDelete(id);
//     res.status(200).send({ message: 'Boat deleted successfully' });
//   } catch (error) {
//     res.status(500).send({ message: 'Failed to delete boat', error: error.message });
//   }
// });


router.put('/boatsde/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Update the boat's status to 'Inactive'
    const updatedBoat = await Boatreg.findByIdAndUpdate(id, { status: 'Inactive' }, { new: true });

    if (!updatedBoat) {
      return res.status(404).send({ message: 'Boat not found' });
    }

    res.status(200).send({ message: 'Boat status updated to Inactive', boat: updatedBoat });
  } catch (error) {
    res.status(500).send({ message: 'Failed to update boat status', error: error.message });
  }
});



router.put('/boatsd/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { boatName, boatType, description, price, priceType, capacity,location } = req.body;

    // Find the boat by ID and update it
    const updatedBoat = await Boatreg.findByIdAndUpdate(id, {
      boatName,
      boatType,
      description,
      price,
      priceType, 
      capacity,
      location
    }, { new: true, runValidators: true });

    if (!updatedBoat) {
      return res.status(404).send({ message: 'Boat not found' });
    }

    res.status(200).json(updatedBoat);
  } catch (error) {
    console.error('Error updating boat:', error);
    res.status(500).send({ message: 'Failed to update boat', error: error.message });
  }
});


router.get('/pending-boats', async (req, res) => {
  try {
    const pendingBoats = await Boatreg.find({ verified: false });
    res.json(pendingBoats);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch pending boats' });
  }
});


router.put('/approve/:boatId', async (req, res) => {
  try {
    const updatedBoat = await Boatreg.findByIdAndUpdate(
      req.params.boatId,
      { verified: true },
      { new: true }
    );
    res.json(updatedBoat);
  } catch (error) {
    res.status(500).json({ error: 'Failed to approve boat' });
  }
});


router.delete('/disapprove/:boatId', async (req, res) => {
  try {
    await Boat.findByIdAndDelete(req.params.boatId);
    res.json({ message: 'Boat disapproved and deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to disapprove boat' });
  }
});

// Route to check boat name
router.post('/checkName', async (req, res) => {
  const { boatName } = req.body;

  try {
    const boat = await Boatreg.findOne({ boatName: new RegExp(`^${boatName}$`, 'i') }); // Case insensitive search
    if (boat) {
      return res.json({ isTaken: true });
    } else {
      return res.json({ isTaken: false });
    }
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error' });
  }
});


router.post('/:boatId/unavailable-dates', async (req, res) => {
  const { boatId } = req.params;
  const { dates } = req.body; // Expecting an array of dates from the request body

  if (!Array.isArray(dates) || dates.length === 0) {
    return res.status(400).json({ error: 'Invalid dates format or no dates provided' });
  }

  try {
    const updatedBoat = await Boatreg.findByIdAndUpdate(
      boatId,
      { $addToSet: { unavailableDates: { $each: dates } } }, // Add the provided dates to unavailableDates
      { new: true } // Return the updated document
    );

    if (!updatedBoat) {
      return res.status(404).json({ error: 'Boat not found' });
    }

    res.json(updatedBoat);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


router.get('/:boatId/unavailable-dates', (req, res) => {
  const { boatId } = req.params;
  
  Boatreg.findById(boatId, 'unavailableDates') // Fetch only the unavailableDates field
    .then(boat => {
      if (!boat) {
        return res.status(404).json({ error: 'Boat not found' });
      }
      res.json(boat.unavailableDates); // Return only the unavailableDates field
    })
    .catch(err => res.status(500).json({ error: err.message }));
});

router.get('/menu/:boatId', async (req, res) => {
  try {
    const { boatId } = req.params;

    // Fetch the boat by its ID from the database
    const boat = await Boatreg.findById(boatId);

    if (!boat) {
      return res.status(404).json({ message: 'Boat not found' });
    }

    // Respond with the boat details
    res.json(boat);
  } catch (error) {
    console.error('Error fetching boat details:', error);
    res.status(500).json({ message: 'Server error, could not fetch boat details' });
  }
});

// Add this route if it doesn't exist
router.get('/boatsdg/:id', async (req, res) => {
  try {
    const boat = await Boatreg.findById(req.params.id);
    if (!boat) {
      return res.status(404).json({ message: 'Boat not found' });
    }
    res.json(boat);
  } catch (error) {
    console.error('Error fetching boat:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Use the route modules
router.use('/boatsdg', authenticateToken, amenityRoutes);
router.use('/boatsdg', authenticateToken, policyRoutes);
router.use('/boatsdg', authenticateToken, securityRoutes);
router.use('/boatsdg', authenticateToken, cancellationRoutes);

// Add overview routes
router.get('/boatsdg/:boatId/overview', overviewController.getOverview);
router.delete('/boatsdg/:boatId/overview/images/:imageIndex', overviewController.deleteImage);
router.delete('/boatsdg/:boatId/overview/highlights/:highlightIndex', overviewController.deleteHighlight);

module.exports = router;
