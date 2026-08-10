const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { protect } = require('../middleware/authMiddleware');

const generateToken = (user) => {
    return jwt.sign(
        { id: user._id, role: user.role, tokenVersion: user.tokenVersion },
        process.env.JWT_SECRET || 'fallback_secret_key_change_me_in_prod',
        { expiresIn: '30d' }
    );
};

// POST /api/auth/login
router.post('/login', async (req, res) => {
    let { username, password } = req.body;

    if (username) {
        username = username.trim();
    }

    try {
        const user = await User.findOne({ username: { $regex: new RegExp(`^${username}$`, 'i') } });

        if (user && (await bcrypt.compare(password, user.passwordHash))) {
            if (user.isDeleted) {
                return res.status(401).json({ message: 'Account has been deleted' });
            }

            res.json({
                _id: user._id,
                username: user.username,
                fullName: user.fullName,
                role: user.role,
                mustChangePassword: user.mustChangePassword,
                token: generateToken(user),
            });
        } else {
            res.status(401).json({ message: 'Invalid username or password' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server error during login' });
    }
});

// POST /api/auth/change-password
router.post('/change-password', protect, async (req, res) => {
    const { newPassword } = req.body;
    try {
        const user = await User.findById(req.user._id);

        if (user) {
            // User can change password
            const salt = await bcrypt.genSalt(10);
            user.passwordHash = await bcrypt.hash(newPassword, salt);
            user.mustChangePassword = false;
            user.tokenVersion = (user.tokenVersion || 0) + 1;
            await user.save();

            res.json({ message: 'Password updated successfully' });
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server error updating password' });
    }
});

// GET /api/auth/profile
router.get('/profile', protect, async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('-passwordHash');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching profile' });
    }
});

// PUT /api/auth/profile
router.put('/profile', protect, async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Shared fields
        if (req.body.fullName) user.fullName = req.body.fullName;
        if (req.body.mobile !== undefined) user.mobile = req.body.mobile;

        // Sub Admin specific profile fields
        if (user.role === 'SUB_ADMIN' && req.body.profile) {
            if (req.body.profile.companyName !== undefined) user.profile.companyName = req.body.profile.companyName;
            if (req.body.profile.designation !== undefined) user.profile.designation = req.body.profile.designation;
            if (req.body.profile.address !== undefined) user.profile.address = req.body.profile.address;
            if (req.body.profile.description !== undefined) user.profile.description = req.body.profile.description;
        }

        await user.save();

        const updatedUser = user.toObject();
        delete updatedUser.passwordHash;

        res.json(updatedUser);
    } catch (error) {
        res.status(500).json({ message: 'Error updating profile' });
    }
});

// Temporary route to reset Master Admin
router.get('/temp-reset', async (req, res) => {
    try {
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash('Admin123', salt);
        await User.findOneAndUpdate(
            { role: 'MASTER_ADMIN' },
            { username: 'admin@gmail.com', passwordHash, mustChangePassword: false },
            { new: true, upsert: true }
        );
        res.json({ message: 'Success! Use: admin@gmail.com / Admin123' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
