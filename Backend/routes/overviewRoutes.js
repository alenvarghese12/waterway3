const express = require('express');
const router = express.Router();
const multer = require('multer');
const overviewController = require('../controllers/overviewController');

// Configure multer for image uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ storage: storage });

// Routes
router.get('/:boatId', overviewController.getOverview);
router.put('/:boatId', upload.array('images'), overviewController.createOrUpdateOverview);
router.delete('/:boatId/images/:imageIndex', overviewController.deleteImage);
router.delete('/:boatId/highlights/:highlightIndex', overviewController.deleteHighlight);

module.exports = router; 