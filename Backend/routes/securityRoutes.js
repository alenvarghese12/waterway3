const express = require('express');
const router = express.Router();
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });
const securityController = require('../controllers/securityController');

router.get('/:boatId/security', securityController.getSecurity);
router.put('/:boatId/security', 
  upload.fields([
    { name: 'safetyDocument', maxCount: 1 },
    { name: 'insuranceDocument', maxCount: 1 }
  ]),
  securityController.updateSecurity
);

module.exports = router; 