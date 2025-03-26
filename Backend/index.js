// require('dotenv').config();
// const express = require('express');
// const app = express();
// const cors = require("cors");
// const connection = require("./db/connection"); // Corrected spelling
// const userRoutes = require("./routes/users");
// const authRoutes = require("./routes/auth");
// const session = require('express-session');
// const MongoStore = require('connect-mongo');
// const boatRoutes = require('./routes/boats'); 
// const path = require('path'); 
// // const mongoose = require('mongoose');

// connection(); // Call the function using the correct name

// app.use(express.json());
// app.use(cors());
// app.use(express.urlencoded({ extended: true }));


// // Configure session (move this up before the routes)
// app.use(session({
//     name: 'mySessionId',
//     secret: process.env.SESSION_SECRET || 'yourSecretKey',
//     resave: false,
//     saveUninitialized:  false,
//     store: MongoStore.create({ mongoUrl: process.env.MONGODB_URI || 'mongodb+srv://reg:reg1@cluster0.3eg1v.mongodb.net/demo?retryWrites=true&w=majority&appName=Cluster0', 
//         ttl: 24 * 60 * 60, // Session expiration (1 day in seconds)
//         autoRemove: 'native',   
//     }), // Store session in MongoDB
//     cookie: {
//         maxAge: 1000 * 60 * 60 * 24, // 1 day
//         httpOnly: true,
//         secure: false, // Set to true if using HTTPS
//         sameSite: 'lax'
//     }
// // 1 day
// }));

// // routes
// app.use("/api/users", userRoutes);
// app.use("/api/auth", authRoutes);
// app.use('/api/boats', boatRoutes);
// app.use('/api/auth', userRoutes);

// app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
// // app.use('/api/boatRoutes', boatRoutes);
// // app.use('/api/auth', require('./routes/auth'));


// const port = process.env.PORT || 8080;
// app.listen(port, () => console.log(`listening on port ${port}..`));




require('dotenv').config();
const express = require('express');
const cors = require("cors");
const connection = require("./db/connection");
const userRoutes = require("./routes/users");
const authRoutes = require("./routes/auth");
const session = require('express-session');
const MongoStore = require('connect-mongo');
const boatRoutes = require('./routes/boats'); 
const bookingRoutes = require('./routes/booking');
const foodRoutes = require('./routes/food');
const path = require('path'); 
// const passport = require('passport');
const passport = require('./passport'); 
const { User } = require('./model/userData');
const OAuth2Strategy = require("passport-google-oauth2").Strategy;
// Import Passport configuration
const chatbotRoutess = require('./routes/chatbotRoutes');
const chatRoutes = require('./routes/chat')
const bookingRou = require('./routes/bookings');


const app = express();
connection(); // Connect to MongoDB


const isAuthenticated = (req, res, next) => {
    if (req.session && req.session.user) {
        return next(); // User is authenticated, continue to the next middleware or route handler
    } else {
        return res.status(401).send('Unauthorized'); // User is not authenticated
    }
};



  
// Middleware to prevent browser caching
const preventCache = (req, res, next) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('Surrogate-Control', 'no-store');
    next();
};


app.use(express.json());
app.use(cors({
    origin: "http://localhost:5173",
    // origin: "https://waterway3-1.onrender.com",
    methods: "GET,POST,PUT,DELETE",
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.urlencoded({ extended: true }));

// Configure session
app.use(session({
    name: 'mySessionId',
    secret: process.env.SESSION_SECRET || 'yourSecretKey',
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({ 
        mongoUrl: process.env.DB, 
        ttl: 24 * 60 * 60, // 1 day
        autoRemove: 'native'   
    }),
    cookie: {
        maxAge: 1000 * 60 * 60 * 24, // 1 day
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax'
    }
}));

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

passport.use(
    new OAuth2Strategy({
        clientID: process.env.CLIENT_ID,
        clientSecret: process.env.CLIENT_SECRET,
        callbackURL:"/auth/google/callback",
        scope:["profile","email"]
    },
    async(accessToken,refreshToken,profile,done)=>{
        try {
            let user = await User.findOne({googleId:profile.id});

            if (!user) {
                user = new User({
                  googleId: profile.id,
                  name: profile.displayName || profile.emails[0].value.split('@')[0], // Fallback to email username
                  email: profile.emails[0].value,
                  profilePicture: profile.photos[0].value,
                  role: 'User',
                  status: 'Active'
                });

                await user.save();
            }

            return done(null,user)
        } catch (error) {
            return done(error,null)
        }
    }
    )
)

passport.serializeUser((user,done)=>{
    done(null,user.id);
})

passport.deserializeUser(async (id, done) => {
    try {
      const user = await User.findById(id);  // Find the user by ID from the session
      done(null, user);  // Pass the user object to the next middleware
    } catch (error) {
      done(error, null);  // Handle errors
    }
  });




// initial google ouath login
app.get("/auth/google",passport.authenticate("google",{scope:["profile","email"]}));

app.get("/auth/google/callback", 
    passport.authenticate('google', { failureRedirect: '/login' }), 
    (req, res) => {
      try {
          // Check if the authenticated user has the 'User' role
          if (req.user.role === 'User') {
              req.session.user = {
                  id: req.user._id,
                  role: req.user.role
                  
              };
              res.redirect('http://localhost:5173/userint'); // Redirect to user interface
          } else {
              // If the user is not a 'User', redirect to a different page or show an error
              res.status(403).send('Access denied: Only users can log in with Google.');
          }
      } catch (error) {
          console.error('Error in Google callback:', error);
          res.status(500).send('Internal Server Error');
      }
  });
  app.get('/login/success', (req, res) => {
    if (req.isAuthenticated() && req.user) {
        return res.status(200).json({ user: req.user });
    } else {
        return res.status(404).json({ message: 'User not found' });
    }
});




// Routes
app.use("/api/users", userRoutes);
app.use("/api/auth", authRoutes);
app.use('/api/boats', boatRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/chatbotRoutes',chatbotRoutess)
app.use('/api/food', foodRoutes);
app.use('/api/chat',chatRoutes)
app.use('/api/book', bookingRou);
// app.use('/api/food-items', foodRoutes);
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something went wrong!');
});

const port = process.env.PORT || 8080;
app.listen(port, () => console.log(`Listening on port ${port}..`));
