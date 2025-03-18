const express = require('express');
const router = express.Router();
const Chat = require('../model/Chat');

// Get chat messages between boat owner and customer
router.get('/:boatId/:customerId', async (req, res) => {
  try {
    const { boatId, customerId } = req.params;
    const chat = await Chat.findOne({ boatId, customerId }).populate('messages.senderId', 'name');

    if (!chat) return res.status(404).json({ message: 'No chat found' });

    res.json(chat);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Send a new message
router.post('/send', async (req, res) => {
  try {
    const { boatId, boatOwnerId, customerId, senderId, message } = req.body;

    let chat = await Chat.findOne({ boatId, customerId });

    if (!chat) {
      chat = new Chat({ boatId, boatOwnerId, customerId, messages: [] });
    }

    chat.messages.push({ senderId, message });
    await chat.save();

    res.json(chat);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
