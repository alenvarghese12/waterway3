// const express = require('express');
// const bcrypt = require('bcrypt');  // Add bcrypt for password hashing
// const router = express.Router();

// router.use(express.json());
// router.use(express.urlencoded({ extended: true }));
// const userData = require('../model/userData');

// // Login route
// router.post('/login', async (req, res) => {
//     const { email, password } = req.body;

//     try {
//         const user = await userData.findOne({ email });

//         if (!user) {
//             return res.status(404).json({ message: "User not found" });
//         }

//         // Use bcrypt to compare hashed passwords
//         const isMatch = await bcrypt.compare(password, user.password);
//         if (isMatch) {
//             return res.status(200).json({ message: "Login successful!", role: user.role });
//         } else {
//             return res.status(401).json({ message: "Login failed" });
//         }
//     } catch (error) {
//         console.error(error);
//         res.status(500).json({ message: "Server error" });
//     }
// });

// // Register route
// router.post('/register', async (req, res) => {
//     try {
//         const { name, email, password, role } = req.body;

//         // Validate the role
//         if (!['BoatOwner', 'user'].includes(role)) {
//             return res.status(400).json({ message: "Invalid role" });
//         }

//         // Check if the user already exists
//         const existingUser = await userData.findOne({ email });
//         if (existingUser) {
//             return res.status(400).json({ message: "User already exists" });
//         }

//         // Hash the password before saving
//         const hashedPassword = await bcrypt.hash(password, 10);

//         // Create and save the new user
//         const newUser = new userData({
//             name,
//             email,
//             password: hashedPassword,
//             role,
//         });

//         await newUser.save();
//         res.status(201).json({ message: "Registered successfully" });
//     } catch (error) {
//         console.error(error);
//         res.status(500).json({ message: "Unable to register" });
//     }
// });

// module.exports = router;


// const router = require("express").Router();
// const { User, validate } = require("../model/userData");
// const bcrypt = require("bcrypt");
// const nodemailer = require("nodemailer");
// const crypto = require("crypto");

// router.post("/", async (req, res) => {
//   try {
//     const { error } = validate(req.body);
//     if (error)
//       return res.status(400).send({ message: error.details[0].message });

//     const user = await User.findOne({ email: req.body.email });
//     if (user)
//       return res.status(409).send({ message: "User with given email already exists!" });

//     const salt = await bcrypt.genSalt(Number(process.env.SALT));
//     const hashPassword = await bcrypt.hash(req.body.password, salt);

//     await new User({ ...req.body, password: hashPassword }).save();
//     res.status(201).send({ message: "User created successfully" });
//   } catch (error) {
//     console.error("Error during user registration:", error); // Added detailed logging
//     res.status(500).send({ message: "Internal Server Error" });
//   }
// });

// module.exports = router;
require('dotenv').config();
const router = require("express").Router();
const { User, validate } = require("../model/userData");
const bcrypt = require("bcrypt");
const nodemailer = require("nodemailer");
const crypto = require("crypto");

router.post("/", async (req, res) => {
  try {
    const { error } = validate(req.body);
    if (error) return res.status(400).send({ message: error.details[0].message });

    const user = await User.findOne({ email: req.body.email });
    if (user) return res.status(409).send({ message: "User with given email already exists!" });

    const salt = await bcrypt.genSalt(Number(process.env.SALT));
    const hashPassword = await bcrypt.hash(req.body.password, salt);

    // Generate OTP
    const otp = crypto.randomBytes(3).toString("hex");
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // OTP expires in 10 minutes

    // Create User with OTP and Inactive status
    const newUser = new User({ 
      ...req.body, 
      password: hashPassword, 
      otp, 
      otpExpiresAt 
    });
    await newUser.save();

    // Send OTP via email
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL, // Your email
        pass: process.env.PASSWORD // Your email password
      }
    });

    const mailOptions = {
      from: process.env.EMAIL,
      to: req.body.email,
      subject: 'Email Verification - Waterway Bookings',
      text: `Your OTP is ${otp}. It will expire in 10 minutes.`
    };

    transporter.sendMail(mailOptions, (err, info) => {
      if (err) {
        console.error("Error sending OTP email:", err);
        return res.status(500).send({ message: "Failed to send OTP." });
      }
      res.status(201).send({ message: "OTP sent to email. Please verify." });
    });
  } catch (error) {
    console.error("Error during registration:", error);
    res.status(500).send({ message: "Internal Server Error" });
  }
});

router.post("/verify-otp", async (req, res) => {
  try {
    const { email, otp } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(404).send({ message: "User not found" });

    if (user.otp !== otp) return res.status(400).send({ message: "Invalid OTP" });

    if (user.otpExpiresAt < Date.now()) return res.status(400).send({ message: "OTP expired" });

    user.status = "Active";
    user.otp = undefined;  // Clear OTP after verification
    user.otpExpiresAt = undefined;
    await user.save();

    res.status(200).send({ message: "Email verified successfully" });
  } catch (error) {
    res.status(500).send({ message: "Internal Server Error" });
  }
});

module.exports = router;
