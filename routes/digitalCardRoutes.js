const express = require('express');
const router = express.Router();
const DigitalCard = require('../models/DigitalCard');
const { protect } = require('../middleware/authMiddleware');
const fs = require('fs');
const path = require('path');

// Get my digital card
router.get('/my-card', protect, async (req, res) => {
    try {
        let card = await DigitalCard.findOne({ ownerId: req.user._id });
        if (!card) {
            // Lazy initialize if missing
            const cardSlug = req.user.slug || (req.user.username ? req.user.username.split('@')[0] : 'card-' + Date.now());
            card = new DigitalCard({
                ownerId: req.user._id,
                slug: cardSlug,
                hero: {
                    name: req.user.fullName || '',
                    designation: req.user.profile?.designation || '',
                    company: req.user.profile?.companyName || '',
                    description: req.user.profile?.description || '',
                    photo: req.user.profile?.photo || '',
                    coverImage: req.user.profile?.coverImage || ''
                },
                contact: {
                    phone: req.user.contact?.phone || req.user.mobile || '',
                    whatsapp: req.user.contact?.whatsapp || '',
                    email: req.user.contact?.email || req.user.email || '',
                    website: req.user.contact?.website || '',
                    googleMap: req.user.contact?.maps || ''
                },
                socialLinks: req.user.socialLinks || {}
            });
            await card.save();
        }
        res.json(card);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching digital card' });
    }
});

// Update my digital card
router.put('/my-card', protect, async (req, res) => {
    try {
        const { hero, mainSection, contact, socialLinks, footer, design } = req.body;

        let card = await DigitalCard.findOne({ ownerId: req.user._id });

        if (!card) {
            const cardSlug = req.user.slug || (req.user.username ? req.user.username.split('@')[0] : 'card-' + Date.now());
            card = new DigitalCard({
                ownerId: req.user._id,
                slug: cardSlug,
                hero: {
                    name: req.user.fullName || '',
                    designation: req.user.profile?.designation || '',
                    company: req.user.profile?.companyName || '',
                    description: req.user.profile?.description || '',
                    photo: req.user.profile?.photo || '',
                    coverImage: req.user.profile?.coverImage || ''
                },
                contact: {
                    phone: req.user.contact?.phone || req.user.mobile || '',
                    whatsapp: req.user.contact?.whatsapp || '',
                    email: req.user.contact?.email || req.user.email || '',
                    website: req.user.contact?.website || '',
                    googleMap: req.user.contact?.maps || ''
                },
                socialLinks: req.user.socialLinks || {}
            });
            await card.save();
        }

        const { uploadToCloudinary } = require('../config/cloudinary');
        const processBase64Media = async (base64String, fieldName) => {
            if (!base64String || !base64String.startsWith('data:')) return base64String;
            try {
                return await uploadToCloudinary(base64String, 'digital-card');
            } catch (err) {
                console.error(`Error saving ${fieldName} to Cloudinary:`, err);
                throw new Error(`Failed to save uploaded ${fieldName} media.`);
            }
        };

        if (hero) {
            if (hero.coverVideo) hero.coverVideo = await processBase64Media(hero.coverVideo, 'cover_video');
            if (hero.coverImage) hero.coverImage = await processBase64Media(hero.coverImage, 'cover_image');
            if (hero.image) hero.image = await processBase64Media(hero.image, 'image');
            if (hero.logo) hero.logo = await processBase64Media(hero.logo, 'logo');
            if (hero.photo) hero.photo = await processBase64Media(hero.photo, 'photo');
        }

        const currentCard = card.toObject();
        const updatePayload = {};
        if (hero) updatePayload.hero = { ...currentCard.hero, ...hero };
        if (mainSection) updatePayload.mainSection = { ...currentCard.mainSection, ...mainSection };
        if (contact) updatePayload.contact = { ...currentCard.contact, ...contact };
        if (socialLinks) updatePayload.socialLinks = { ...currentCard.socialLinks, ...socialLinks };
        if (footer) updatePayload.footer = { ...currentCard.footer, ...footer };
        if (design) updatePayload.design = { ...currentCard.design, ...design };

        const updatedCard = await DigitalCard.findOneAndUpdate(
            { _id: card._id },
            { $set: updatePayload },
            { returnDocument: 'after', runValidators: true }
        );

        if (!updatedCard) {
            return res.status(404).json({ message: 'Target digital card not found for update' });
        }

        console.log(`\n--- SUB ADMIN: DIGITAL CARD UPDATE ---`);
        console.log(`ownerId: ${updatedCard.ownerId}`);
        console.log(`slug: ${updatedCard.slug}`);
        console.log(`DigitalCard._id: ${updatedCard._id}`);
        console.log(`updatedAt: ${updatedCard.updatedAt}`);
        console.log(`hero.name: ${updatedCard.hero?.name}`);
        console.log(`contact.phone: ${updatedCard.contact?.phone}`);
        console.log(`design.primaryColor: ${updatedCard.design?.primaryColor}`);
        console.log(`--------------------------------------\n`);

        res.json(updatedCard);

    } catch (error) {
        console.error("Card Update Error", error);
        fs.writeFileSync(path.join(__dirname, '../error_log.txt'), String(error.stack || error));
        if (error.message === 'Unable to process this media file. Please try another image or video.') {
            return res.status(400).json({ message: error.message });
        }
        res.status(500).json({ message: String(error.message || error) });
    }
});

// GET /inquiries
router.get('/inquiries', protect, async (req, res) => {
    try {
        const Inquiry = require('../models/Inquiry');
        const inquiries = await Inquiry.find({ ownerId: req.user._id }).sort({ createdAt: -1 });
        res.json(inquiries);
    } catch (err) {
        res.status(500).json({ message: 'Failed to fetch inquiries', error: err.message });
    }
});

// PATCH /inquiries/:id/read
router.patch('/inquiries/:id/read', protect, async (req, res) => {
    try {
        const Inquiry = require('../models/Inquiry');
        const inquiry = await Inquiry.findOneAndUpdate(
            { _id: req.params.id, ownerId: req.user._id },
            { $set: { isRead: true } },
            { new: true }
        );
        if (!inquiry) return res.status(404).json({ message: 'Inquiry not found' });
        res.json(inquiry);
    } catch (err) {
        res.status(500).json({ message: 'Failed to update inquiry status', error: err.message });
    }
});

module.exports = router;
