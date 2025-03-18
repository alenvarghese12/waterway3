// module.exports = router;
const router = require('express').Router();
const express = require('express');
const { User } = require('../model/userData');
const bcrypt = require('bcrypt');
const Joi = require('joi');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
require('dotenv').config();
const passport = require('passport');
const jwt = require("jsonwebtoken");
const authenticateToken = require('../middleware/authMiddleware'); 
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure multer for handling file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/') // Make sure this directory exists
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname)
  }
});

// File filter to only allow images
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Not an image! Please upload only images.'), false);
  }
};

// Initialize multer
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: fileFilter
});

// Make sure uploads directory exists
if (!fs.existsSync('uploads')) {
    fs.mkdirSync('uploads');
}

// Validation schema for login
const validate = (data) => {
    const schema = Joi.object({
        name: Joi.string().min(2).required().label("Name"), 
        email: Joi.string().email().required().label("Email"),
        password: Joi.string().required().label("Password"),
    });
    return schema.validate(data);
};

// Validation schema for updating user
// Validation schema for updating user
const validateUpdate = (data) => {
    const schema = Joi.object({
        name: Joi.string().min(2).required().messages({
            'string.base': `"Name" should be a type of 'text'`,
            'string.empty': `"Name" cannot be an empty field`,
            'string.min': `"Name" should have a minimum length of {#limit}`,
            'any.required': `"Name" is a required field`
        }), 
        email: Joi.string().email().optional()
    });
    return schema.validate(data);
};


// User login route
// router.post("/login", async (req, res) => {
//     try {
//         // const { error } = validate(req.body);
//         // if (error) return res.status(400).send({ message: error.details[0].message });

//         const user = await User.findOne({ email: req.body.email });
//         if (!user) return res.status(401).send({ message: "Invalid Email or Password" });

//         const validPassword = await bcrypt.compare(req.body.password, user.password);
//         if (!validPassword) return res.status(401).send({ message: "Invalid Email or Password" });

//         req.session.user = {
//             id: user._id,
//             role: user.role
//         };
//         const token = user.generateAuthToken();
//         console.log('Session:', req.session);

//         let redirectUrl = '/';
//         if (user.role === 'Admin') {
//             redirectUrl = '/admin';
//         } else if (user.role === 'BoatOwner') {
//             redirectUrl = '/boatowner';
//         } else if (user.role === 'User') {
//             redirectUrl = '/userint';
//         }

//         res.status(200).send({ message: "Logged in successfully", user: req.session.user, redirectUrl });
//     } catch (error) {
//         res.status(500).send({ message: "Internal Server Error" });
//     }
// });
const isAuthenticated = (req, res, next) => {
    if (req.session && req.session.user) {
        return next(); // User is authenticated, proceed
    } else {
        return res.status(401).send('Unauthorized'); // User not authenticated
    }
};
const noCache = (req, res, next) => {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    res.set('Surrogate-Control', 'no-store');
    next();
};


router.post("/login", async (req, res) => {
    try {
        // Find the user by email
        const user = await User.findOne({ email: req.body.email });
        if (!user) return res.status(401).send({ message: "Invalid Email or Password" });

        // Check if the password is correct
        const validPassword = await bcrypt.compare(req.body.password, user.password);
        if (!validPassword) return res.status(401).send({ message: "Invalid Email or Password" });

        // Create a session for the user
        req.session.user = {
            id: user._id,
            role: user.role,
            name:user.name,
            

        };

        // Generate JWT token for the user
        const token = user.generateAuthToken();
        console.log('Session:', req.session);

        // Decide the redirection URL based on the user's role
        let redirectUrl = '/';
        if (user.role === 'Admin') {
            redirectUrl = '/admin';
        } else if (user.role === 'BoatOwner') {
            redirectUrl = '/boatowner/boatlist';
        } else if (user.role === 'User') {
            redirectUrl = '/userint/userboatl';
        }

        // Send the token and redirect URL to the client
        res.status(200).send({
            message: "Logged in successfully",
            token,  // Send JWT token
            redirectUrl  // Send redirect URL based on role
        });

    } catch (error) {
        res.status(500).send({ message: "Internal Server Error" });
    }
});




// Example of the session route
// router.get('/sessionn', authenticateToken, async (req, res) => {
//     console.log('User ID from token:', req.user._id); // Log the user ID

//     try {
//         const user = await User.findById(req.user._id, 'name email licenseNumber'); // Use _id to fetch the user
//         console.log('Fetched user:', user); // Log the fetched user

//         if (!user) {
//             return res.status(404).json({ message: 'User not found' });
//         }

//         // The user ID is already available from the token
//         const userId = req.user._id;

//         res.json({
//             userId: userId, // Include the user ID in the response
//             name: user.name,
//             email: user.email,
//             licenseNumber: user.licenseNumber
//         });
//     } catch (error) {
//         console.error('Error fetching user:', error); // Log error for debugging
//         res.status(500).json({ message: 'Server error', error: error.message });
//     }
// });
router.get('/sessionn', authenticateToken, async (req, res) => {
    console.log('User ID from token:', req.user._id); // Log the user ID

    try {
        const user = await User.findById(req.user.id, 'name email licenseNumber'); // Use _id to fetch the user
        console.log('Fetched user:', user); // Log the fetched user

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Include the user ID in the response
        res.json({
            id: user.id,   // Send the user ID
            name: user.name,
            email: user.email,
            licenseNumber: user.licenseNumber,
            role:user.role
        });
    } catch (error) {
        console.error('Error fetching user:', error); // Log error for debugging
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});


router.get('/user-data', authenticateToken, async (req, res) => {
    try {
      const userId = req.user.id; // Assuming req.user contains the user ID after token verification
      const user = await User.findById(userId).select('_id name email licenseNumber');
      
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
  
      res.status(200).json(user);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch user data', error: error.message });
    }
  });


// router.post("/login", async (req, res) => {
//     try {
//         // Find the user by email
//         const user = await User.findOne({ email: req.body.email });
//         if (!user) return res.status(401).send({ message: "Invalid Email or Password" });

//         // Check if the password is correct
//         const validPassword = await bcrypt.compare(req.body.password, user.password);
//         if (!validPassword) return res.status(401).send({ message: "Invalid Email or Password" });

//         // // Create a session for the user
//         // req.session.user = {
//         //     id: user._id,
//         //     role: user.role
//         // };

//         // Prepare token data
//         const tokenData = {
//             _id: user._id,
//             email: user.email,
//             role: user.role // Include role in token data for redirection later
//         };

//         // Generate JWT token
//         const token = jwt.sign(tokenData, process.env.JWTPRIVATEKEY, { expiresIn: '90d' });

//         // Set cookie options
//         const tokenOptions = {
//             httpOnly: true,
//             secure: process.env.NODE_ENV === 'production', // Secure flag for production
//             sameSite: 'strict', // Helps prevent CSRF attacks
//             maxAge: 90 * 24 * 60 * 60 * 1000 // Max age for cookie (in milliseconds)
//         };

//         // Decide the redirection URL based on the user's role
//         let redirectUrl = '/';
//         if (user.role === 'Admin') {
//             redirectUrl = '/admin';
//         } else if (user.role === 'BoatOwner') {
//             redirectUrl = '/boatowner';
//         } else if (user.role === 'User') {
//             redirectUrl = '/userint';
//         }

//         // Send the response with the JWT token as a cookie
//         res.cookie("token", token, tokenOptions).status(200).json({
//             message: "Login successful",
//             token, // Include token in the response data
//             redirectUrl, // Include redirection URL
//             success: true,
//             error: false
//         });

//     } catch (error) {
//         console.error("Error during login:", error.message || error);
//         res.status(500).json({
//             message: "An error occurred during login",
//             error: true,
//             success: false
//         });
//     }
// });


// Logout endpoint
// router.post('/logout', (req, res) => {
//     req.session.destroy(err => {
//         if (err) {
//             return res.status(500).send({ message: "Error logging out" });
//         }
//         res.clearCookie('connect.sid'); // Clear session cookie
//         res.send({ message: "Logged out successfully" });
//     });
// });

router.post('/logoutp', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            console.error('Error destroying session:', err);
            return res.status(500).json({ message: 'Error logging out' });
        }
        res.clearCookie('mySessionId'); // Clear the session cookie
        console.log('Session destroyed, cookie cleared');
        res.status(200).json({ message: 'Logged out successfully' });
    });
});
// router.post('/logoutp', (req, res) => {
//     try {
//         // Clear the token cookie
//         res.clearCookie("token");

//         // Respond with a success message
//         res.json({
//             message: "Logged out successfully",
//             error: false,
//             success: true,
//             data: []
//         });

//         console.log('Token cleared, logged out successfully');
//     } catch (err) {
//         // Handle any errors that occur
//         console.error('Error during logout:', err);
//         res.json({
//             message: err.message || err,
//             error: true,
//             success: false,
//         });
//     }
// });






// Get all users
router.get("/users", async (req, res) => {
    try {
        const users = await User.find({});
        res.status(200).json(users);
    } catch (error) {
        console.error("Error fetching users:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
});

// Delete a user by ID
// Update user status to Inactive instead of deleting
router.delete('/users/:userId', async (req, res) => {
    try {
      const userId = req.params.userId;
      
      // Update user's status to 'Inactive'
      const updatedUser = await User.findByIdAndUpdate(
        userId, 
        { status: 'Inactive' }, 
        { new: true }
      );
  
      if (!updatedUser) {
        return res.status(404).json({ error: 'User not found' });
      }
  
      res.status(200).json({ message: 'User deactivated successfully', user: updatedUser });
    } catch (error) {
      res.status(500).json({ error: 'Failed to deactivate user' });
    }
  });
  

// Get a user by ID
router.get('/users/:id', async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).send({ message: 'User not found' });
        }
        res.send(user);
    } catch (error) {
        res.status(500).send({ message: 'Internal Server Error' });
    }
});

// Update a user by ID
router.put('/users/:id', async (req, res) => {
    try {
        const { name, email } = req.body;
        const userId = req.params.id;

        // Validate request body
        const { error } = validateUpdate(req.body);
        if (error) {
            return res.status(400).send({ message: error.details[0].message });
        }
        // Only check if email is taken if email is being updated
        if (email) {
            const existingUser = await User.findOne({ email });
            if (existingUser && existingUser._id.toString() !== userId) {
                return res.status(400).send({ message: 'Email is already taken by another user' });
            }
        }

        // Find and update the user
        const updatedUser = await User.findByIdAndUpdate(userId, { name, email }, { new: true });
        if (!updatedUser) return res.status(404).send({ message: 'User not found' });

        res.status(200).send({ message: 'User updated successfully', user: updatedUser });
    } catch (error) {
        console.error(error);
        res.status(500).send({ message: 'Internal Server Error' });
    }
});

router.post('/forgot-password', async (req, res) => {
    try {
        // Look for user by email
        const user = await User.findOne({ email: req.body.email });
        if (!user) {
            console.log("User not found for email:", req.body.email);
            return res.status(404).send({ message: "User not found" });
        }

        // Generate token
        const resetToken = crypto.randomBytes(32).toString('hex');
        user.resetPasswordToken = resetToken;
        user.resetPasswordExpires = Date.now() + 3600000; // 1 hour expiration

        await user.save(); // Save token and expiry in user document
        console.log("Reset token generated and saved:", resetToken);

        // Send email
        const transporter = nodemailer.createTransport({
            service: 'Gmail',
            auth: {
                user: process.env.EMAIL,
                pass: process.env.PASSWORD,
            },
        });

        const mailOptions = {
            to: user.email,
            from: process.env.EMAIL,
            subject: 'Password Reset Request',
            text: `You are receiving this because you (or someone else) have requested to reset your password.\n\n
            Please click on the following link, or paste this into your browser to complete the process:\n\n
            http://localhost:5173/reset-password/${encodeURIComponent(resetToken)}\n\n
            If you did not request this, please ignore this email and your password will remain unchanged.\n`
        };

        transporter.sendMail(mailOptions, (err) => {
            if (err) {
                console.error("Error sending email:", err);
                return res.status(500).send({ message: 'Error sending email' });
            }
            console.log("Reset password email sent successfully to:", user.email);
            res.status(200).send({ message: 'Reset link sent to email' });
        });

    } catch (error) {
        console.error("Error processing forgot password request:", error);
        res.status(500).send({ message: "Internal server error" });
    }
});

router.post('/resetpassword/:token', async (req, res) => {
    const { token } = req.params;
    const { password } = req.body;

    // Log the received token and password
    console.log("Token received in request:", token);
    console.log("Password received:", password);

    if (!password) {
        return res.status(400).send({ message: "Password is required" });
    }

    try {
        // Find the user with the matching token and ensure token is not expired
        const user = await User.findOne({
            resetPasswordToken: token,
            resetPasswordExpires: { $gt: Date.now() }
        });

        if (!user) {
            console.log(`Token: ${token}, Date.now(): ${Date.now()}`);
            const tokenInDb = await User.findOne({ resetPasswordToken: token });
            console.log('Token found in DB:', tokenInDb?.resetPasswordToken);
            return res.status(400).send({ message: "Invalid or expired token" });
        }

        // Log user found and proceed to reset password
        console.log("User found:", user);

        // Hash the new password
        user.password = await bcrypt.hash(password, 10);
        user.resetPasswordToken = undefined; // Clear the token
        user.resetPasswordExpires = undefined; // Clear the expiration time

        // Save the updated user details
        await user.save();

        res.status(200).send({ message: "Password reset successful" });
    } catch (error) {
        console.error("Error resetting password:", error);
        res.status(500).send({ message: "Internal server error" });
    }
});

// Google login route
router.get('/google', passport.authenticate('google', {
    scope: ['profile', 'email'] // Specify the data you want to access
}));

// Google callback route
router.get('/google/callback', passport.authenticate('google', { failureRedirect: '/login' }), (req, res) => {
    // Successful authentication
    req.session.user = {
        id: req.user._id,
        role: req.user.role
    };
    const redirectUrl = req.user.role === 'User' ? '/userint' : '/'; // Redirect based on role
    res.redirect(redirectUrl);
});

router.get('/admin', isAuthenticated, noCache, (req, res) => {
    res.send('Admin Interface');
});

router.get('/userint', isAuthenticated, noCache, (req, res) => {
    res.send('User Interface');
});



// Protected route example (for testing, replace with actual admin or user pages)
router.get('/admin', (req, res) => {
    if (req.session.role === 'admin') {
        res.status(200).json({ message: 'Welcome Admin' });
    } else {
        res.status(403).json({ message: 'Access denied' });
    }
});


// In your Backend/routes/auth.js
router.put('/update-profile', authenticateToken, upload.single('profilePicture'), async (req, res) => {
  try {
    const userId = req.user.id;
    const updates = {
      name: req.body.name,
      phone: req.body.phone,
      address: req.body.address
    };

    if (req.file) {
      updates.profilePicture = req.file.filename;
    }

    if (req.body.currentPassword && req.body.newPassword) {
      // Add password validation and update logic here
      // Make sure to hash the new password before saving
    }

    const updatedUser = await User.findByIdAndUpdate(userId, updates, { new: true });
    
    res.json({
      message: 'Profile updated successfully',
      user: {
        name: updatedUser.name,
        email: updatedUser.email,
        phone: updatedUser.phone,
        address: updatedUser.address,
        profilePicture: updatedUser.profilePicture
      }
    });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(400).json({ message: error.message });
  }
});

module.exports = router;

