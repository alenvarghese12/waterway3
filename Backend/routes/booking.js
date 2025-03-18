// const express = require('express');
// const router = express.Router();
// const Booking = require('../model/bookingboat');

// // Route to handle booking creation
// router.post('/bookingss', async (req, res) => {
//   try {
//     // Create a new booking from the request body
//     const booking = new Booking(req.body);
    
//     // Save the booking to the database
//     const savedBooking = await booking.save();
    
//     // Return a success response with the saved booking
//     res.status(201).json(savedBooking);
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ error: 'Failed to create booking' });
//   }
// });

// module.exports = router;



const express = require('express');
const router = express.Router();
const Booking = require('../model/bookingboat');
const { sendBookingEmailWithPDF } = require('../controllers/emailService'); // Assuming the email PDF function is in utils folder
const Boatreg = require('../model/boatreg');
const mongoose = require('mongoose');

// Route to handle booking creation
router.post('/bookingss', async (req, res) => {
  try {
    const {
      boatId,
      userId,
      startDate,
      endDate,
      passengers,
      paymentId,
      name,
      email,
      phone,
      address,
      totalAmount,
      boatName,
      boatImage,
      location
    } = req.body;

    console.log('Received booking request:', req.body);

    // Create a new booking object with the correct passengers structure
    const booking = new Booking({
      boatId,
      userId,
      startDate,
      endDate,
      passengers: {
        adults: passengers.adults,
        children: passengers.children
      },
      paymentId,
      name,
      email,
      phone,
      address,
      totalAmount,
      boatName,
      boatImage,
      location
    });

    console.log('Created booking object:', booking);

    // Save the booking to the database
    const savedBooking = await booking.save();
    console.log('Saved booking:', savedBooking);

    // Send booking confirmation email
    const bookingDetails = {
      boatName: savedBooking.boatName,
      startDate: savedBooking.startDate,
      endDate: savedBooking.endDate,
      adults: savedBooking.passengers.adults,
      totalAmount: savedBooking.totalAmount,
      location: savedBooking.location
    };

    const userDetails = {
      name: savedBooking.name,
      email: savedBooking.email,
    };

    await sendBookingEmailWithPDF(userDetails, bookingDetails);

    res.status(201).json(savedBooking);
  } catch (err) {
    console.error('Error while creating booking:', err);
    res.status(500).json({ 
      error: 'Failed to create booking',
      details: err.message 
    });
  }
});

router.get('/user/:userId', async (req, res) => {
  const { userId } = req.params;
  try {
      const bookings = await Booking.find({ userId }); // Fetch bookings for the user
      if (bookings) {
          res.status(200).json(bookings);
      } else {
          res.status(404).json({ message: 'No bookings found for this user' });
      }
  } catch (error) {
      res.status(500).json({ message: 'Error fetching bookings', error });
  }
});


router.get('/owner/:ownerId', async (req, res) => {
  const { ownerId } = req.params;

  try {
    // Step 1: Get all boats owned by the specified owner
    const ownerBoats = await Boatreg.find({ boatOwnerId: ownerId }, '_id'); // Only fetch the IDs
    const boatIds = ownerBoats.map(boat => boat._id);

    console.log("Boat IDs for Owner:", boatIds); // Log the boat IDs

    // If boatIds is empty, return early with an informative message
    if (boatIds.length === 0) {
      return res.status(200).json({ message: 'No boats found for this owner', bookings: [] });
    }

    // Step 2: Find bookings where the `boatId` is in the list of owner's boat IDs
    const bookings = await Booking.find({ boatId: { $in: boatIds } })
      .populate('boatId', 'name type')     // Populate boat details as needed
      .populate('userId', 'name email')    // Populate user details if needed
      .exec();

    console.log("Bookings Found:", bookings); // Log the bookings found

    res.status(200).json(bookings);
  } catch (error) {
    console.error("Error fetching bookings for boat owner:", error);
    res.status(500).json({ error: 'Failed to fetch bookings' });
  }
});

router.get('/owner-boats-bookings', async (req, res) => {
  try {
    const ownerId = req.query.ownerId; // Get the ownerId from the query parameters

    // Check if ownerId is valid
    if (ownerId && !mongoose.Types.ObjectId.isValid(ownerId)) {
      return res.status(400).send({ message: 'Invalid owner ID' });
    }

    // Create query for boats based on ownerId
    const query = ownerId 
      ? { verified: true, ownerId: new mongoose.Types.ObjectId(ownerId), status: 'active' }
      : { verified: true, status: 'active' };

    // Fetch boats from the Boatreg model
    const boats = await Boatreg.find(query);

    if (!boats || boats.length === 0) {
      return res.status(404).send({ message: 'No boats found' });
    }

    // Fetch bookings related to the boats found
    const boatIds = boats.map(boat => boat._id); // Extract boat ids for booking lookup
    const bookings = await Booking.find({ boatId: { $in: boatIds } });

    if (!bookings || bookings.length === 0) {
      return res.status(404).send({ message: 'No bookings found for these boats' });
    }

    // Send the boats and bookings data in response
    res.status(200).json({ boats, bookings });

  } catch (error) {
    console.error('Error fetching boats and bookings:', error);
    res.status(500).send({ message: 'Failed to fetch boats and bookings', error: error.message });
  }
});


module.exports = router;
