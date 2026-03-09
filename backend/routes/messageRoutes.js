import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import multer from 'multer';
import Message from '../models/Message.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.join(__dirname, '..', 'uploads');

const router = express.Router();

// Multer config for audio uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'audio-' + uniqueSuffix + '.webm');
    }
});
const upload = multer({ storage });

import { requireAuth } from '../utils/jwtAuth.js';

router.use(requireAuth);

// Get chat history with a specific user
router.get('/history/:contactId', async (req, res) => {
    try {
        const currentUserId = req.userId;
        const { contactId } = req.params;

        const messages = await Message.find({
            $or: [
                { sender: currentUserId, receiver: contactId },
                { sender: contactId, receiver: currentUserId }
            ]
        }).sort({ createdAt: 1 });

        res.status(200).json(messages);
    } catch (error) {
        console.error('Error fetching messages:', error);
        res.status(500).json({ message: 'Error fetching messages' });
    }
});

// Upload audio message
router.post('/upload-audio', upload.single('audio'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        // URL publique du backend (pour les liens vers /uploads) — sur Render : PUBLIC_URL=https://matchy-ulk4.onrender.com
        const baseUrl = (process.env.PUBLIC_URL || 'http://localhost:5000').replace(/\/$/, '');
        const audioUrl = `${baseUrl}/uploads/${req.file.filename}`;
        res.status(200).json({ audioUrl });
    } catch (error) {
        console.error('Error uploading audio:', error);
        res.status(500).json({ message: 'Error uploading audio' });
    }
});

export default router;
