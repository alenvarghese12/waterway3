const Boatreg = require('../model/boatreg');

// const registerBoat = async (req, res) => {
//   try {
//     const { boatType, boatName, price, priceType, capacity, engineType, description, licenseNumber, speed, status, discountPercentage, offerDescription, location } = req.body;
//     const image = req.files?.image?.[0]?.filename;
//     const licenseDocument = req.files?.licenseDocument?.[0]?.filename;

//     // Extract the owner's ID from the token
//     const ownerId = req.user._id; // The authenticated user ID
//       const discountAmount = (price * discountPercentage) / 100;
//       const finalPrice = price - discountAmount;
//     // Create a new boat entry with ownerId
//     const newBoat = new Boatreg({
//       boatName,
//       boatType,
//       price,
//       priceType,
//       capacity,
//       engineType,
//       description,
//       licenseNumber,
//       speed,
//       status,
//       image,
//       licenseDocument,
//       discountPercentage,
//       finalPrice,
//       offerDescription,
//       location,
//       ownerId,  // Assign the ownerId from the logged-in user
//       verified: false, // Boats need to be verified by admin
//     });

//     await newBoat.save();

//     res.status(201).json({ message: 'Boat registered successfully', boat: newBoat });
//   } catch (error) {
//     console.error('Error registering boat:', error);
//     res.status(500).send({ message: 'Failed to register boat', error: error.message });
//   }
// };

// module.exports = {
//   registerBoat
// };

const registerBoat = async (req, res) => {
  try {
    console.log('Raw request body:', req.body);
    console.log('Files received:', req.files);

    let boatData;
    try {
      boatData = JSON.parse(req.body.data);
      console.log('Parsed boat data:', boatData);
    } catch (error) {
      console.error('Error parsing request data:', error);
      return res.status(400).json({ message: 'Invalid request data format' });
    }

    // Validate required files
    if (!req.files?.image?.[0] || 
        !req.files?.licenseDocument?.[0] || 
        !req.files?.registrationDocument?.[0]) {
      return res.status(400).json({ 
        message: 'Required files are missing',
        filesReceived: req.files 
      });
    }

    // Create boat data object
    const boatDataToSave = {
      ...boatData,
      image: req.files.image[0].filename,
      licenseDocument: req.files.licenseDocument[0].filename,
      registrationDocument: req.files.registrationDocument[0].filename,
      ownerId: req.user.id,
      verified: false,
      finalPrice: boatData.price - (boatData.price * (boatData.discountPercentage || 0) / 100)
    };

    // Handle driver details if present
    if (boatData.hasDriver === 'yes') {
      if (!req.files?.driverLicenseDocument?.[0]) {
        return res.status(400).json({
          message: "Driver's license document is required when including driver details"
        });
      }

      boatDataToSave.driverDetails = {
        ...boatData.driverDetails,
        licenseDocument: req.files.driverLicenseDocument[0].filename
      };
    }

    const newBoat = new Boatreg(boatDataToSave);
    await newBoat.save();

    res.status(201).json({
      message: 'Boat registered successfully',
      boat: newBoat
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      message: 'Failed to register boat',
      error: error.message
    });
  }
};

module.exports = {
  registerBoat
};