const mongoose = require('mongoose');
const dns = require('dns');



const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI);
        console.log(`MongoDB Connected: ${conn.connection.host}`);
        console.log(`Database Name: ${conn.connection.name}`);
    } catch (error) {
        console.error(`MongoDB Connection Error: ${error.message}`);
        console.log("Server will continue running. Endpoints can use fallback data.");
    }
};

module.exports = connectDB;
