// backend/routes/chatbotRoutes.js
const express = require('express');
const { chatbotResponse, generateImage } = require('../controllers/chatbotController');
const router = express.Router();

// Route for chatbot responses
router.post('/chatbot', chatbotResponse);

// Route for generating images
router.post('/generate-image', generateImage);

module.exports = router;