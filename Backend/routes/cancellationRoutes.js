const express = require('express');
const router = express.Router();
const cancellationController = require('../controllers/cancellationController');

router.get('/:boatId/cancellation-policy', cancellationController.getCancellationPolicy);
router.put('/:boatId/cancellation-policy', cancellationController.updateCancellationPolicy);

module.exports = router; 