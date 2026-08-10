const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { protect, subAdminOnly } = require('../middleware/authMiddleware');

// Middleware to ensure sub admin must change password first before accessing dashboard APIs
const checkPasswordChange = async (req, res, next) => {
    if (req.user.mustChangePassword) {
        return res.status(403).json({ message: 'Must change password before accessing APIs' });
    }
    next();
};

// GET /api/sub-admin/profile
router.get('/profile', protect, subAdminOnly, async (req, res) => {
    try {
        const subAdmin = await User.findById(req.user._id).select('-passwordHash');
        res.json(subAdmin);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching profile' });
    }
});

// PUT /api/sub-admin/profile
router.put('/profile', protect, subAdminOnly, checkPasswordChange, async (req, res) => {
    try {
        const subAdmin = await User.findById(req.user._id);

        if (req.body.fullName) subAdmin.fullName = req.body.fullName;
        if (req.body.mobile) subAdmin.mobile = req.body.mobile;
        if (req.body.email) subAdmin.email = req.body.email;

        if (req.body.profile) {
            subAdmin.profile = { ...subAdmin.profile, ...req.body.profile };
        }

        if (req.body.contact) {
            subAdmin.contact = { ...subAdmin.contact, ...req.body.contact };
        }

        await subAdmin.save();
        const responseData = subAdmin.toObject();
        delete responseData.passwordHash;

        res.json(responseData);
    } catch (error) {
        res.status(500).json({ message: 'Error updating profile' });
    }
});

// PUT /api/sub-admin/social-links
router.put('/social-links', protect, subAdminOnly, checkPasswordChange, async (req, res) => {
    try {
        const subAdmin = await User.findById(req.user._id);
        if (req.body.socialLinks) {
            subAdmin.socialLinks = { ...subAdmin.socialLinks, ...req.body.socialLinks };
        }
        await subAdmin.save();
        res.json({ message: 'Social links updated', socialLinks: subAdmin.socialLinks });
    } catch (error) {
        res.status(500).json({ message: 'Error updating social links' });
    }
});

// PUT /api/sub-admin/services
router.put('/services', protect, subAdminOnly, checkPasswordChange, async (req, res) => {
    try {
        const subAdmin = await User.findById(req.user._id);
        if (req.body.services && Array.isArray(req.body.services)) {
            subAdmin.services = req.body.services;
        }
        await subAdmin.save();
        res.json({ message: 'Services updated', services: subAdmin.services });
    } catch (error) {
        res.status(500).json({ message: 'Error updating services' });
    }
});

// PUT /api/sub-admin/products
router.put('/products', protect, subAdminOnly, checkPasswordChange, async (req, res) => {
    try {
        const subAdmin = await User.findById(req.user._id);
        if (req.body.products && Array.isArray(req.body.products)) {
            subAdmin.products = req.body.products;
        }
        await subAdmin.save();
        res.json({ message: 'Products updated', products: subAdmin.products });
    } catch (error) {
        res.status(500).json({ message: 'Error updating products' });
    }
});

// PUT /api/sub-admin/gallery
router.put('/gallery', protect, subAdminOnly, checkPasswordChange, async (req, res) => {
    try {
        const subAdmin = await User.findById(req.user._id);
        if (req.body.gallery && Array.isArray(req.body.gallery)) {
            subAdmin.gallery = req.body.gallery;
        }
        await subAdmin.save();
        res.json({ message: 'Gallery updated', gallery: subAdmin.gallery });
    } catch (error) {
        res.status(500).json({ message: 'Error updating gallery' });
    }
});

// GET /api/sub-admin/qr
router.get('/qr', protect, subAdminOnly, async (req, res) => {
    const user = await User.findById(req.user._id);
    res.json({ qrCodeUrl: user.qrCodeUrl });
});

// GET /api/sub-admin/nfc
router.get('/nfc', protect, subAdminOnly, async (req, res) => {
    const user = await User.findById(req.user._id);
    res.json({ nfcUrl: user.nfcUrl, nfcStatus: 'Active' });
});

module.exports = router;
