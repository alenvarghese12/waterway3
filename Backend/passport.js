
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const { User } = require('./model/userData'); // Adjust the path if necessary
require('dotenv').config();
const passport = require('passport');


passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: '/auth/google/callback'
}, async (accessToken, refreshToken, profile, done) => {
    try {
        let user = await User.findOne({ email: profile.emails[0].value });
        
        if (!user) {
            user = new User({
                name: profile.displayName,
                email: profile.emails[0].value,
                password: 'google_auth',
                role: 'User',
                status: 'Active'
            });
            await user.save();
        }
        
        done(null, user);
    } catch (error) {
        done(error, null);
    }
}));

passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
    const user = await User.findById(id);
    done(null, user);
});

// Export the passport instance
module.exports = passport;

require('dotenv').config();

// Check for necessary environment variables
if (!process.env.CLIENT_ID || !process.env.CLIENT_SECRET) {
    throw new Error("Google Client ID and Client Secret must be set in environment variables.");
}

// Configure Passport to use Google strategy
passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: '/auth/google/callback' // The URL where Google will redirect the user after authentication
}, async (accessToken, refreshToken, profile, done) => {
    try {
        // Check if user already exists
        let user = await User.findOne({ email: profile.emails[0].value });
        
        if (!user) {
            // If not, create a new user
            try {
                user = new User({
                    name: profile.displayName,
                    email: profile.emails[0].value,
                    // No password is required for Google users
                    role: 'User', // Set role as 'User'
                    status: 'Active', // Set status as needed
                    profilePicture: profile.photos[0].value // Optionally save the profile picture
                });
                await user.save();
            } catch (err) {
                console.error("Error saving new user:", err);
                return done(err, null);
            }
        }
        
        done(null, user); // Pass user to the next middleware
    } catch (error) {
        done(error, null);
    }
}));

// Serialize user instance to save user ID in session
passport.serializeUser((user, done) => {
    done(null, user.id);
});

// Deserialize user instance
passport.deserializeUser(async (id, done) => {
    try {
        const user = await User.findById(id);
        done(null, user);
    } catch (error) {
        done(error, null); // Handle any errors in user lookup
    }
});
