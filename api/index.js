const mongoose = require('mongoose');
const app = require('../server'); // Path for api/index.js

let connPromise = null;

async function ensureDb() {
    if (mongoose.connection.readyState === 1) return;

    const uri = process.env.MONGODB_URI || process.env.MONGO_URI;

    if (!uri) {
        throw new Error('MONGODB_URI environment variable is missing on Vercel.');
    }

    if (!connPromise || mongoose.connection.readyState === 0) {
        connPromise = mongoose.connect(uri, {
            serverSelectionTimeoutMS: 8000,
        }).catch(err => {
            connPromise = null;
            throw err;
        });
    }

    await connPromise;
}

module.exports = async (req, res) => {
    try {
        await ensureDb();
    } catch (e) {
        console.error('DB connect (serverless) failed:', e.message);
        return res.status(500).json({
            success: false,
            error_code: "FUNCTION_INVOCATION_FAILED",
            message: `Database Connection Error: ${e.message}. Please verify MONGODB_URI and MongoDB Atlas Network Access (0.0.0.0/0).`
        });
    }
    return app(req, res);
};
