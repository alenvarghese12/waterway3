const mongoose = require("mongoose");

module.exports = () => {
    try {
        mongoose.connect(process.env.DB);
        console.log("Connected to MongoDB");
    } catch (error) {
        console.log(error);
        console.log("Couldn't connect to database");
    }
};
