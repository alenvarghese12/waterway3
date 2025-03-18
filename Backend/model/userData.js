// const mongoose = require("mongoose");
// const jwt = require("jsonwebtoken");
// const Joi = require("joi");
// const passwordComplexity = require("joi-password-complexity");

// const userSchema = new mongoose.Schema({
//   name: { type: String, required: true },
//   email: { type: String, required: true },
//   password: { type: String, required: true },
//   role: { type: String, enum: ['User', 'BoatOwner','Admin'], default: 'User', required: true },
//   status: { type: String, enum: ['Active', 'Inactive'], default: 'Active', required: true },
//   licenseNumber: { type: String },
//   resetPasswordToken: { type: String }, // New field for storing reset password token
//   resetPasswordExpires: { type: Date }   // New field for storing expiration time
// });

// userSchema.methods.generateAuthToken = function () {
//   const token = jwt.sign({ _id: this._id, role: this.role }, process.env.JWTPRIVATEKEY, {
//     expiresIn: "7d",
//   });
//   return token;
// };

// const User = mongoose.model("userw", userSchema);

// const validate = (data) => {
//   const schema = Joi.object({
//     name: Joi.string().required().label("Name"),
//     email: Joi.string().email().required().label("Email"),
//     password: passwordComplexity().required().label("Password"),
//     role: Joi.string().valid('User', 'BoatOwner','Admin').required().label("Role"),
//     status: Joi.string().valid('Active', 'Inactive').required().label("Status"),
//     licenseNumber: Joi.when('role', {
//       is: 'BoatOwner',
//       then: Joi.string().required().label("License Number"),
//       otherwise: Joi.string().optional()
//     }),
//   });
//   return schema.validate(data);
// };

// module.exports = { User, validate };





// // const mongoose = require("mongoose");
// // const jwt = require("jsonwebtoken");
// // const Joi = require("joi");
// // const passwordComplexity = require("joi-password-complexity");

// // const userSchema = new mongoose.Schema({
// //   name: { type: String, required: true },
// //   email: { type: String, required: true },
// //   password: { type: String },  // Not required for Google Sign-In
// //   googleId: { type: String },  // New field for storing Google ID
// //   profilePicture: { type: String },  // New field for storing Google profile picture URL
// //   role: { type: String, enum: ['User', 'BoatOwner'], default: 'User', required: true },
// //   status: { type: String, enum: ['Active', 'Inactive'], default: 'Active', required: true },
// //   licenseNumber: { type: String },
// // });

// // userSchema.methods.generateAuthToken = function () {
// //   const token = jwt.sign({ _id: this._id, role: this.role }, process.env.JWTPRIVATEKEY, {
// //     expiresIn: "7d",
// //   });
// //   return token;
// // };

// // const User = mongoose.model("userw", userSchema);

// // const validate = (data) => {
// //   const schema = Joi.object({
// //     name: Joi.string().required().label("Name"),
// //     email: Joi.string().email().required().label("Email"),
// //     password: Joi.string().optional(),  // Optional for Google Sign-In
// //     googleId: Joi.string().optional(),  // Optional field
// //     profilePicture: Joi.string().optional(),  // Optional field
// //     role: Joi.string().valid('User', 'BoatOwner').required().label("Role"),
// //     status: Joi.string().valid('Active', 'Inactive').required().label("Status"),
// //     licenseNumber: Joi.when('role', {
// //       is: 'BoatOwner',
// //       then: Joi.string().required().label("License Number"),
// //       otherwise: Joi.string().optional()
// //     }),
// //   });
// //   return schema.validate(data);
// // };

// // module.exports = { User, validate };


const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const Joi = require("joi");
const passwordComplexity = require("joi-password-complexity");

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },  // Name required, pulled from Google profile
  email: { type: String, required: true, unique: true },  // Email required, unique
  password: { type: String },  // Not required for Google Sign-In
  googleId: { type: String },  // Field for storing Google ID
  profilePicture: { type: String },  // Field for storing Google profile picture URL
  role: { type: String, enum: ['User', 'BoatOwner', 'Admin'], default: 'User', required: true },  // Default role 'User'
  status: { type: String, enum: ['Active', 'Inactive'], default: 'Active', required: true },  // Default status 'Active'
  licenseNumber: { type: String },  // Only required for BoatOwners
  resetPasswordToken: { type: String },  // For password reset
  resetPasswordExpires: { type: Date } , // Expiration time for reset token
  otp: { type: String },  // Store OTP
  otpExpiresAt: { type: Date },  // OTP expiration
});

// Method to generate JWT token
userSchema.methods.generateAuthToken = function () {
  const token = jwt.sign({ id: this._id, role: this.role, name: this.name }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });
  return token;
};

const User = mongoose.model("userw", userSchema);

// Validate data (applicable for manual registration and updating profiles)
const validate = (data) => {
  const schema = Joi.object({
    name: Joi.string().required().label("Name"),  // Name is required for all users
    email: Joi.string().email().required().label("Email"),  // Email is required
    password: passwordComplexity().optional().label("Password"),  // Password is optional for Google sign-in
    googleId: Joi.string().optional(),  // Google ID is optional for non-Google users
    profilePicture: Joi.string().optional(),  // Optional Google profile picture
    role: Joi.string().valid('User', 'BoatOwner', 'Admin').required().label("Role"),  // Role required
    status: Joi.string().valid('Active', 'Inactive').required().label("Status"),  // Status required
    licenseNumber: Joi.when('role', {
      is: 'BoatOwner',
      then: Joi.string().required().label("License Number"),  // License number required for BoatOwners
      otherwise: Joi.string().optional()  // Optional for other roles
    }),
  });
  return schema.validate(data);
};

module.exports = { User, validate };
