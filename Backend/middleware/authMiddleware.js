const jwt = require('jsonwebtoken');
require('dotenv').config();

function authenticateToken(req, res, next) {
    const token = req.headers['authorization']?.split(' ')[1]; // Extract token

    if (!token) return res.sendStatus(401); // No token, unauthorized

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) return res.sendStatus(403); // Token is invalid, forbidden
        console.log('Decoded user ID:', user.id); // Log the decoded user ID for debugging
        req.user = user; // Attach user data to request
        next();
    });
}

module.exports = authenticateToken;
