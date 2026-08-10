const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { protect, adminOnly } = require('../middleware/authMiddleware');
const QRCode = require('qrcode');
const path = require('path');
const fs = require('fs');

// Ensure QR directory exists
const QR_DIR = path.join(__dirname, '..', 'uploads', 'qr');
if (!fs.existsSync(QR_DIR)) {
    fs.mkdirSync(QR_DIR, { recursive: true });
}

// GET /api/admin/sub-admins
router.get('/sub-admins', protect, adminOnly, async (req, res) => {
    try {
        const subAdmins = await User.find({ role: 'SUB_ADMIN', isDeleted: false }).select('-passwordHash');
        res.json(subAdmins);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching sub admins' });
    }
});

// POST /api/admin/sub-admins
router.post('/sub-admins', protect, adminOnly, async (req, res) => {
    const { fullName, username, email, mobile, companyName, designation } = req.body;

    try {
        const existingUsername = await User.findOne({ username });
        if (existingUsername) {
            return res.status(400).json({ message: 'Username already exists' });
        }

        const slug = username;
        const existingSlug = await User.findOne({ slug });
        if (existingSlug) {
            return res.status(400).json({ message: 'Slug already generated' });
        }

        const temporaryPassword = `${username}@Previous`;
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(temporaryPassword, salt);

        const permanentUrl = `https://yourdomain.com/${slug}`;
        const nfcUrl = permanentUrl;

        // Generate QR code
        const qrFilename = `${slug}-qr.png`;
        const qrPath = path.join(QR_DIR, qrFilename);
        const qrCodeUrl = `/uploads/qr/${qrFilename}`;

        await QRCode.toFile(qrPath, permanentUrl, {
            width: 1024,
            margin: 2
        });

        const newSubAdmin = new User({
            role: 'SUB_ADMIN',
            fullName,
            username,
            usernameLocked: true,
            email,
            mobile,
            passwordHash,
            mustChangePassword: true,
            profile: {
                companyName,
                designation,
                themeColor: req.body.themeColor || '#3b82f6'
            },
            slug,
            landingPageUrl: permanentUrl,
            nfcUrl,
            qrCodeUrl
        });

        const createdSubAdmin = await newSubAdmin.save();

        const responseData = createdSubAdmin.toObject();
        delete responseData.passwordHash;

        res.status(201).json(responseData);
    } catch (error) {
        res.status(500).json({ message: 'Error creating sub admin', error: error.message });
    }
});

// POST /api/admin/sub-admins/:id/reset-password
router.post('/sub-admins/:id/reset-password', protect, adminOnly, async (req, res) => {
    try {
        const subAdmin = await User.findOne({ _id: req.params.id, role: 'SUB_ADMIN', isDeleted: false });
        if (!subAdmin) {
            return res.status(404).json({ message: 'Sub Admin not found' });
        }

        const { newPassword } = req.body;
        const finalPassword = newPassword || `${subAdmin.username}@Previous`;
        const salt = await bcrypt.genSalt(10);

        subAdmin.passwordHash = await bcrypt.hash(finalPassword, salt);
        subAdmin.mustChangePassword = !newPassword;
        subAdmin.tokenVersion = (subAdmin.tokenVersion || 0) + 1;

        await subAdmin.save();

        res.json({ message: 'Password updated successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error resetting password' });
    }
});

// GET /api/admin/sub-admins/:id
router.get('/sub-admins/:id', protect, adminOnly, async (req, res) => {
    try {
        const subAdmin = await User.findOne({ _id: req.params.id, role: 'SUB_ADMIN', isDeleted: false }).select('-passwordHash');
        if (subAdmin) {
            res.json(subAdmin);
        } else {
            res.status(404).json({ message: 'Sub admin not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Error fetching sub admin' });
    }
});

// PUT /api/admin/sub-admins/:id
router.put('/sub-admins/:id', protect, adminOnly, async (req, res) => {
    try {
        const subAdmin = await User.findOne({ _id: req.params.id, role: 'SUB_ADMIN', isDeleted: false });
        if (!subAdmin) {
            return res.status(404).json({ message: 'Sub Admin not found' });
        }

        // Allowed fields to update
        if (req.body.fullName) subAdmin.fullName = req.body.fullName;
        if (req.body.email) subAdmin.email = req.body.email;
        if (req.body.mobile) subAdmin.mobile = req.body.mobile;

        if (req.body.profile) {
            if (req.body.profile.companyName) subAdmin.profile.companyName = req.body.profile.companyName;
            if (req.body.profile.designation) subAdmin.profile.designation = req.body.profile.designation;
        }

        await subAdmin.save();

        const responseData = subAdmin.toObject();
        delete responseData.passwordHash;

        res.json(responseData);
    } catch (error) {
        res.status(500).json({ message: 'Error updating sub admin' });
    }
});

// DELETE /api/admin/sub-admins/:id
router.delete('/sub-admins/:id', protect, adminOnly, async (req, res) => {
    try {
        const subAdmin = await User.findOne({ _id: req.params.id, role: 'SUB_ADMIN' });
        if (!subAdmin) {
            return res.status(404).json({ message: 'Sub Admin not found' });
        }

        subAdmin.isDeleted = true;
        subAdmin.status = 'deleted';
        await subAdmin.save();

        res.json({ message: 'Sub Admin successfully deleted' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting sub admin' });
    }
});

// GET /api/admin/sub-admins/:id/qr
router.get('/sub-admins/:id/qr', protect, adminOnly, async (req, res) => {
    try {
        const subAdmin = await User.findOne({ _id: req.params.id, role: 'SUB_ADMIN' });
        if (!subAdmin) {
            return res.status(404).json({ message: 'Sub Admin not found' });
        }
        res.json({ qrCodeUrl: subAdmin.qrCodeUrl });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching QR URL' });
    }
});

// GET /api/admin/sub-admins/:id/nfc
router.get('/sub-admins/:id/nfc', protect, adminOnly, async (req, res) => {
    try {
        const subAdmin = await User.findOne({ _id: req.params.id, role: 'SUB_ADMIN' });
        if (!subAdmin) {
            return res.status(404).json({ message: 'Sub Admin not found' });
        }
        res.json({ nfcUrl: subAdmin.nfcUrl, nfcStatus: 'Active' });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching NFC URL' });
    }
});

module.exports = router;
