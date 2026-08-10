const mongoose = require('mongoose');

const profileSchema = new mongoose.Schema({
    company: {
        name: { type: String, required: true },
        tagline: { type: String },
        description: { type: String },
        logoUrl: { type: String },
        coverUrl: { type: String }
    },
    contact: {
        phone: { type: String },
        whatsapp: { type: String },
        email: { type: String },
        website: { type: String },
        address: { type: String },
        mapUrl: { type: String }
    },
    social: {
        facebook: { type: String },
        instagram: { type: String },
        linkedin: { type: String },
        youtube: { type: String },
        twitter: { type: String }
    },
    services: [{
        title: { type: String },
        description: { type: String }
    }],
    products: [{
        name: { type: String },
        description: { type: String },
        price: { type: String }
    }],
    qrCodeUrl: { type: String },
    landingPageUrl: { type: String }
}, { timestamps: true });

const Profile = mongoose.model('Profile', profileSchema);

module.exports = Profile;
