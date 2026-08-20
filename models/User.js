const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    role: { type: String, enum: ['MASTER_ADMIN', 'SUB_ADMIN'], required: true },
    fullName: { type: String, required: true },
    username: { type: String },
    usernameLocked: { type: Boolean, default: false },
    email: { type: String },
    mobile: { type: String },
    passwordHash: { type: String, required: true },
    mustChangePassword: { type: Boolean, default: false },
    tokenVersion: { type: Number, default: 0 },
    status: { type: String, enum: ['active', 'inactive', 'deleted'], default: 'active' },
    isDeleted: { type: Boolean, default: false },

    // Sub Admin Profile Info
    profile: {
        photo: String,
        coverImage: String,
        designation: String,
        companyName: String,
        description: String,
        address: String
    },
    contact: {
        phone: String,
        whatsapp: String,
        email: String,
        website: String,
        maps: String
    },
    socialLinks: {
        facebook: String,
        instagram: String,
        youtube: String,
        linkedin: String,
        twitter: String
    },
    services: [
        {
            title: String,
            description: String,
            image: String
        }
    ],
    products: [
        {
            name: String,
            price: String,
            image: String,
            description: String,
            link: String
        }
    ],
    gallery: [String],
    documents: [
        {
            title: String,
            fileUrl: String
        }
    ],

    slug: String,
    landingPageUrl: String,
    qrCodeUrl: String,
    nfcUrl: String,

    views: {
        digitalCard: { type: Number, default: 0 },
        landingPage: { type: Number, default: 0 }
    },

    dailyViews: [
        {
            date: String,
            digitalCard: { type: Number, default: 0 },
            landingPage: { type: Number, default: 0 }
        }
    ]

}, { timestamps: true });

UserSchema.index({ username: 1 }, { unique: true, partialFilterExpression: { username: { $type: "string" } } });
UserSchema.index({ slug: 1 }, { unique: true, partialFilterExpression: { slug: { $type: "string" } } });

module.exports = mongoose.model('User', UserSchema);
