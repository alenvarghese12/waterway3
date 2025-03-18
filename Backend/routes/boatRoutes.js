// // routes/boatRoutes.js

// const express = require('express');
// const multer = require('multer');
// const { registerBoat, getBoatTypes } = require('../controllers/boatController');
// const router = express.Router();

// // Configure multer for file uploads
// const storage = multer.diskStorage({
//   destination: function (req, file, cb) {
//     cb(null, 'uploads/'); // Uploads directory for saving files
//   },
//   filename: function (req, file, cb) {
//     cb(null, Date.now() + '-' + file.originalname); // Unique file name
//   }
// });
// const upload = multer({ storage: storage });

// // POST route for registering a boat
// router.post('/register', upload.fields([{ name: 'image' }, { name: 'licenseDocument' }]), registerBoat);

// // GET route for fetching available boat types
// router.get('/boatTypes', getBoatTypes);

// module.exports = router;
