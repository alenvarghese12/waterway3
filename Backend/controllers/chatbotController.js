// backend/controllers/chatbotController.js
const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config();

// Initialize the Generative AI client with the API key
const genAI = new GoogleGenerativeAI(process.env.API_KEY);

const responses = {
  bookingInquiry: "You can book houseboats and speed boats through our platform. Would you like to know more about a specific type?",
  boatFeatures: "Houseboats offer unique accommodation experiences with various amenities. Speed boats are perfect for quick rides. What specific features are you interested in?",
  userRegistration: "To register, simply click on the 'Register' button on our homepage. You can manage your profile after logging in.",
  paymentProcessing: "We offer secure payment options through various gateways, including credit and debit cards. Your payment information is protected.",
  bookingManagement: "You can view and manage your bookings in your profile. If you need to cancel a booking, please check our cancellation policy.",
  fraudDetection: "We have automated systems in place to detect unusual booking patterns and ensure the security of your transactions.",
  reviewsAndRatings: "You can leave a review after your booking is complete. Your feedback helps other users make informed decisions.",
  boatOwnerFeatures: "As a boat owner, you can manage your listings and bookings through your profile. Would you like to know how to register as a boat owner?",
  adminFeatures: "Admins can manage user accounts, monitor bookings, and ensure the quality of listings. If you have specific questions, feel free to ask!"
};

const callGenerativeAI = async (message) => {
  try {
    // Initialize the Gemini model
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    const prompt = `
      You are a chatbot for a WaterWay Booking. Answer user queries in simple and clear sentences, limited to 2–3 lines. 
      Message: ${message}.
    `;

    // Generate content based on the user input
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    console.log(text);
    return text;
  } catch (error) {
    console.error("Error calling Generative AI:", error);
    throw error; // Rethrow the error to handle it in the route
  }
};

const chatbotResponse = async (req, res) => {
  try {
    const { message } = req.body;

    // Call Gemini API
    const botReply = await callGenerativeAI(message);
    console.log(botReply);

    // Send the response back to the client
    res.json({ response: botReply });
  } catch (error) {
    console.error("Error with Gemini API:", error);
    res.status(500).json({ error: "Failed to get response from chatbot" });
  }
};

const generateImage = async (req, res) => {
  try {
    const { description } = req.body;

    // Placeholder: Gemini does not natively support image generation
    res.status(501).json({
      error: "Image generation is not supported by Gemini at this time.",
    });
  } catch (error) {
    console.error("Error generating image:", error);
    res.status(500).json({ error: "Failed to generate image" });
  }
};

// Example function to handle user input
const handleUserInput = (input) => {
  // Logic to determine intent from user input
  const intent = determineIntent(input); // Implement this function based on your logic

  // Respond based on the identified intent
  return responses[intent] || "I'm sorry, I didn't understand that. Can you please rephrase?";
};

module.exports = { chatbotResponse, generateImage };