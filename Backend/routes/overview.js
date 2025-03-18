const express = require('express');
const router = express.Router();
const overviewController = require('../controllers/overviewController');
const auth = require('../middleware/auth');

// Get overview by boat ID
router.get('/:boatId', auth, overviewController.getOverview);

// Create or update overview
router.post('/:boatId', auth, overviewController.createOrUpdateOverview);

// Delete image from overview
router.delete('/:boatId/images/:imageIndex', auth, overviewController.deleteImage);

// Delete highlight from overview
router.delete('/:boatId/highlights/:highlightIndex', auth, overviewController.deleteHighlight);

module.exports = router; 