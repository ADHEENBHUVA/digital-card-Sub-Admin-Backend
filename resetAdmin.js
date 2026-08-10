require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');

mongoose.connect(process.env.MONGO_URI)
    .then(async () => {
        console.log("Connected to MongoDB via URI:", process.env.MONGO_URI.split('@')[1] || process.env.MONGO_URI);
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash('admin123', salt);

        let admin = await User.findOne({ role: 'MASTER_ADMIN' });
        if (admin) {
            admin.username = 'admin';
            admin.passwordHash = passwordHash;
            await admin.save();
            console.log("Master Admin reset successfully.");
            console.log(`Username: ${admin.username}`);
            console.log(`Password: admin123`);
        } else {
            console.log("No Master Admin found! Creating one...");
            admin = await User.create({
                role: 'MASTER_ADMIN',
                fullName: 'Super Admin',
                username: 'admin',
                passwordHash: passwordHash,
                mustChangePassword: false,
                status: 'active'
            });
            console.log("Master Admin created successfully.");
            console.log(`Username: ${admin.username}`);
            console.log(`Password: admin123`);
        }
        process.exit(0);
    })
    .catch(err => {
        console.error("MongoDB Connection Error:", err);
        process.exit(1);
    });
