const mongoose = require('mongoose');

const DigitalCardSchema = new mongoose.Schema({
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    slug: { type: String, required: true, unique: true },

    // NFC Fields
    cardNumber: { type: String, unique: true, sparse: true },
    uniqueToken: { type: String, unique: true, sparse: true },
    nfcEnabled: { type: Boolean, default: false },
    nfcStatus: { type: String, enum: ['active', 'inactive', 'unassigned'], default: 'unassigned' },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    assignedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    isActive: { type: Boolean, default: true },

    hero: {
        image: { type: String, default: '' },
        logo: { type: String, default: '' },
        name: { type: String, default: '' },
        designation: { type: String, default: '' },
        company: { type: String, default: '' },
        tagline: { type: String, default: '' },
        description: { type: String, default: '' },
        coverType: { type: String, enum: ['image', 'video'], default: 'image' },
        coverImage: { type: String, default: '' },
        coverVideo: { type: String, default: '' }
    },

    mainSection: {
        about: { type: String, default: '' },
        services: [{ title: String, description: String, image: String }],
        products: [{ name: String, price: String, image: String, description: String, link: String }],
        highlights: { type: String, default: '' }
    },

    contact: {
        phone: { type: String, default: '' },
        whatsapp: { type: String, default: '' },
        email: { type: String, default: '' },
        website: { type: String, default: '' },
        address: { type: String, default: '' },
        googleMap: { type: String, default: '' },
        inquiry: { type: String, default: '' }
    },

    socialLinks: {
        facebook: { type: String, default: '' },
        instagram: { type: String, default: '' },
        youtube: { type: String, default: '' },
        linkedin: { type: String, default: '' },
        twitter: { type: String, default: '' },
        telegram: { type: String, default: '' }
    },

    footer: {
        logo: { type: String, default: '' },
        businessName: { type: String, default: '' },
        tagline: { type: String, default: '' },
        copyright: { type: String, default: '' },
        backgroundColor: { type: String, default: '' }
    },

    design: {
        primaryColor: { type: String, default: '#3b82f6' },
        secondaryColor: { type: String, default: '#2563eb' },
        backgroundColor: { type: String, default: '#ffffff' },
        textColor: { type: String, default: '#1e293b' },
        buttonColor: { type: String, default: '#3b82f6' },
        fontFamily: { type: String, default: 'Inter' },
        borderRadius: { type: String, default: '16px' },
        shadowStyle: { type: String, default: 'shadow-lg' },
        heroStyle: { type: String, default: 'modern' },
        cardLayout: { type: String, default: 'classic' }
    }
}, { timestamps: true });

module.exports = mongoose.model('DigitalCard', DigitalCardSchema);
