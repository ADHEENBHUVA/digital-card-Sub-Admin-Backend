const express = require('express');
const router = express.Router();
const User = require('../models/User');

const DigitalCard = require('../models/DigitalCard');

// GET /api/public/profile/:slug
router.get('/profile/:slug', async (req, res) => {
    try {
        const profile = await User.findOne({ slug: req.params.slug, role: 'SUB_ADMIN', isDeleted: false })
            .select('-passwordHash -mustChangePassword -usernameLocked');

        if (!profile) {
            return res.status(404).json({ message: 'Digital Card not found' });
        }

        let card = await DigitalCard.findOne({ ownerId: profile._id });
        if (!card) {
            // Lazy initialize if missing, with migration from old User Profile
            card = new DigitalCard({
                ownerId: profile._id,
                slug: profile.slug || (profile.username ? profile.username.split('@')[0] : 'card-' + Date.now()),
                hero: {
                    name: profile.fullName || '',
                    designation: profile.profile?.designation || '',
                    company: profile.profile?.companyName || '',
                    description: profile.profile?.description || '',
                    photo: profile.profile?.photo || '',
                    coverImage: profile.profile?.coverImage || ''
                },
                contact: {
                    phone: profile.contact?.phone || profile.mobile || '',
                    whatsapp: profile.contact?.whatsapp || '',
                    email: profile.contact?.email || profile.email || '',
                    website: profile.contact?.website || '',
                    googleMap: profile.contact?.maps || ''
                },
                socialLinks: profile.socialLinks || {}
            });
            await card.save();
        }

        // Increment Views
        profile.views.landingPage = (profile.views.landingPage || 0) + 1;
        if (req.query.source === 'card') {
            profile.views.digitalCard = (profile.views.digitalCard || 0) + 1;
        }
        await profile.save();

        const responseData = card.toObject();

        console.log(`\n--- PUBLIC DIGITAL CARD FETCH (SUB ADMIN BACKEND) ---`);
        console.log(`slug: ${req.params.slug}`);
        console.log(`ownerId: ${card.ownerId}`);
        console.log(`DigitalCard._id: ${card._id}`);
        console.log(`updatedAt: ${card.updatedAt}`);
        console.log(`hero.name: ${card.hero?.name}`);
        console.log(`contact.phone: ${card.contact?.phone}`);
        console.log(`design.primaryColor: ${card.design?.primaryColor}`);
        console.log(`-----------------------------------------------------\n`);

        responseData.qrCodeUrl = profile.qrCodeUrl;
        responseData.nfcUrl = profile.nfcUrl;

        res.set({
            'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
        });

        res.json(responseData);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching profile' });
    }
});

// POST /api/public/inquiry/:slug
router.post('/inquiry/:slug', async (req, res) => {
    const { name, mobile, email, message } = req.body;

    // Check if profile exists
    try {
        const profile = await User.findOne({ slug: req.params.slug, role: 'SUB_ADMIN', isDeleted: false });
        if (!profile) return res.status(404).json({ message: 'Profile not found' });

        // We can save inquiries to an Inquiry model that ties them to this User
        // Since we don't have the exact Inquiry schema connected to the user yet, we could either structure it or use existing Inquiry.

        res.status(201).json({ success: true, message: 'Inquiry submitted successfully!' });
    } catch (error) {
        res.status(500).json({ message: 'Error submitting inquiry' });
    }
});

module.exports = router;
