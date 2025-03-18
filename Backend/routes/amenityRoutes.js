const express = require('express');
const router = express.Router();
const amenityController = require('../controllers/amenityController');
const authenticateToken = require('../middleware/authMiddleware');

// Apply authentication middleware to all routes
router.use(authenticateToken);

router.get('/:boatId/amenities', amenityController.getAmenities);
router.put('/:boatId/amenities', amenityController.addAmenity);
router.delete('/:boatId/amenities/:category/:itemId', amenityController.deleteAmenity);
router.put('/:boatId/amenities/:itemId', amenityController.updateAmenity);

module.exports = router; 