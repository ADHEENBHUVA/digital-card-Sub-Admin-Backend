require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const QRCode = require('qrcode');
const connectDB = require('./config/db');
const Profile = require('./models/Profile');
const Inquiry = require('./models/Inquiry');

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to MongoDB
connectDB();

app.use(cors());
app.use(express.json({ limit: '200mb' }));
app.use(express.urlencoded({ limit: '200mb', extended: true }));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Data file paths
const DATA_FILE = path.join(__dirname, 'data', 'appifly.json');
const QR_DIR = path.join(__dirname, '../uploads', 'qr');
const QR_FILE = path.join(QR_DIR, 'appifly.png');
const PERMANENT_URL = 'https://yourdomain.com/appifly';

// Ensure directories exist
if (!fs.existsSync(QR_DIR)) {
    fs.mkdirSync(QR_DIR, { recursive: true });
}

// Generate single permanent QR Code if it doesn't already exist
if (!fs.existsSync(QR_FILE)) {
    QRCode.toFile(QR_FILE, PERMANENT_URL, {
        width: 1024, // High Resolution
        margin: 2,
        color: {
            dark: '#000000',
            light: '#ffffff'
        }
    }, function (err) {
        if (err) console.error('Error generating QR Code:', err);
        else console.log('Permanent QR Code successfully generated at', QR_FILE);
    });
} else {
    console.log('Permanent QR Code already exists at', QR_FILE);
}

const mongoose = require('mongoose');

const bcrypt = require('bcryptjs');
const User = require('./models/User');

// Optional Seeder for Master Admin
const seedDatabase = async () => {
    try {
        if (mongoose.connection.readyState !== 1) return;
        const count = await User.countDocuments();
        if (count === 0) {
            console.log("No users found. Seeding first Master Admin...");
            const salt = await bcrypt.genSalt(10);
            const passwordHash = await bcrypt.hash('Admin', salt);

            await User.create({
                role: 'MASTER_ADMIN',
                fullName: 'Super Admin',
                username: 'admin@gmail.com',
                passwordHash,
                mustChangePassword: false,
                status: 'active'
            });
            console.log("Master Admin seeded successfully. (username: admin@gmail.com, pass: Admin)");

            // Seed a Sub Admin so the landing page has something to show
            await User.create({
                role: 'SUB_ADMIN',
                fullName: 'Vishal Patel',
                username: 'vishal',
                slug: 'vishal',
                passwordHash,
                mustChangePassword: false,
                status: 'active',
                profile: {
                    companyName: 'Appifly Infotech',
                    designation: 'CEO & Founder',
                    photo: '/uploads/logo.jpg',
                    themeColor: '#3b82f6',
                    coverImage: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809'
                },
                contact: {
                    phone: '+91 8347640423',
                    whatsapp: '+91 8347640423',
                    email: 'vishal@appifly.com',
                    website: 'https://appifly.com'
                }
            });
            console.log("Test Sub Admin seeded successfully. (username: vishal, slug: /vishal)");
        }
    } catch (err) {
        console.error("Error seeding database:", err);
    }
};
seedDatabase();

// Helper for fallback
const getFallbackProfile = () => {
    const rawData = fs.readFileSync(DATA_FILE, 'utf8');
    const data = JSON.parse(rawData);
    data.qrCodeUrl = `/uploads/qr/appifly.png`;
    data.landingPageUrl = PERMANENT_URL;
    return data;
};

// Health check endpoints for Vercel/Monitoring
app.get("/", (req, res) => {
    res.status(200).json({
        success: true,
        message: "Backend API is running"
    });
});

app.get("/api/health", (req, res) => {
    res.status(200).json({
        success: true,
        message: "API is healthy"
    });
});

// API Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/sub-admin', require('./routes/subAdminRoutes'));
app.use('/api/public', require('./routes/publicRoutes'));
app.use('/api/digital-card', require('./routes/digitalCardRoutes'));

// Error handling middleware can go here

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
