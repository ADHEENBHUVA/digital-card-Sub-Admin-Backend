const mongoose = require('mongoose');

const NfcCardSchema = new mongoose.Schema({
    cardId: { type: String, required: true, unique: true },
    subAdminId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    cardName: { type: String, default: 'Unnamed Card' },
    tapCount: { type: Number, default: 0 },
    customerEmail: { type: String },
    customerPhone: { type: String },
    status: { type: String, enum: ['Active', 'Disabled'], default: 'Active' },
    writeDate: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('NfcCard', NfcCardSchema);
