const express = require('express');
const router = express.Router();
const NfcCard = require('../models/NfcCard');
const DigitalCard = require('../models/DigitalCard');
const { protect, subAdminOnly } = require('../middleware/authMiddleware');

// @route   POST /api/nfc-cards/write
// @desc    Register a newly written NFC card
router.post('/write', protect, subAdminOnly, async (req, res) => {
    try {
        const { cardId, cardName } = req.body;
        
        if (!cardId) {
            return res.status(400).json({ error: 'Card ID is required' });
        }

        const existingCard = await NfcCard.findOne({ cardId });
        if (existingCard) {
            return res.status(400).json({ error: 'Card ID already exists' });
        }

        const newCard = new NfcCard({
            cardId,
            subAdminId: req.user._id,
            cardName: cardName || 'Unnamed Card'
        });

        await newCard.save();
        res.status(201).json({ message: 'Card successfully registered', card: newCard });
    } catch (error) {
        console.error('Error writing card:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// @route   GET /api/nfc-cards
// @desc    Get all NFC cards written by the logged-in sub-admin
router.get('/', protect, subAdminOnly, async (req, res) => {
    try {
        const cards = await NfcCard.find({ subAdminId: req.user._id }).lean().sort({ writeDate: -1 });
        let totalCount = await NfcCard.countDocuments({ subAdminId: req.user._id });

        // Fetch Master Admin assigned card from DigitalCard
        const digitalCard = await DigitalCard.findOne({ ownerId: req.user._id, nfcEnabled: true });
        if (digitalCard) {
            cards.unshift({
                _id: `MASTER_${digitalCard._id}`,
                cardId: digitalCard.cardNumber || 'N/A',
                cardName: 'Master Admin Card (Default)',
                tapCount: 'N/A',
                status: digitalCard.isActive ? 'Active' : 'Disabled',
                writeDate: digitalCard.updatedAt,
                isMasterCard: true
            });
            totalCount += 1;
        }

        res.json({ totalCount, cards });
    } catch (error) {
        console.error('Error fetching cards:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// @route   PUT /api/nfc-cards/:id/toggle-status
// @desc    Toggle card status between Active and Disabled
router.put('/:id/toggle-status', protect, subAdminOnly, async (req, res) => {
    try {
        if (req.params.id.startsWith('MASTER_')) {
            const dcId = req.params.id.replace('MASTER_', '');
            const digitalCard = await DigitalCard.findOne({ _id: dcId, ownerId: req.user._id });
            if (!digitalCard) return res.status(404).json({ error: 'Master card not found' });
            
            digitalCard.isActive = !digitalCard.isActive;
            digitalCard.nfcStatus = digitalCard.isActive ? 'active' : 'inactive';
            await digitalCard.save();
            return res.json({ message: 'Status updated successfully', card: digitalCard });
        }

        const card = await NfcCard.findOne({ _id: req.params.id, subAdminId: req.user._id });
        if (!card) {
            return res.status(404).json({ error: 'Card not found' });
        }

        card.status = card.status === 'Active' ? 'Disabled' : 'Active';
        await card.save();

        res.json({ message: `Card ${card.status.toLowerCase()} successfully`, card });
    } catch (error) {
        console.error('Error toggling card status:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// @route   PUT /api/nfc-cards/:id/name
// @desc    Update card name
router.put('/:id/name', protect, subAdminOnly, async (req, res) => {
    try {
        if (req.params.id.startsWith('MASTER_')) {
            return res.status(400).json({ error: 'Cannot rename the Master Admin default card' });
        }

        const { cardName } = req.body;
        if (!cardName) {
            return res.status(400).json({ error: 'Card name is required' });
        }

        // Fix: req.user._id instead of req.user.id because protect middleware uses req.user._id
        const card = await NfcCard.findOne({ _id: req.params.id, subAdminId: req.user._id });
        if (!card) {
            return res.status(404).json({ error: 'Card not found' });
        }

        card.cardName = cardName;
        await card.save();

        res.json({ message: 'Card name updated successfully', card });
    } catch (error) {
        console.error('Error updating card name:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
