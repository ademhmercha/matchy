import express from 'express';
import multer from 'multer';
import Message from '../models/Message.js';

const router = express.Router();

// Multer config for audio uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'audio-' + uniqueSuffix + '.webm');
    }
});
const upload = multer({ storage });

const requireAuth = (req, res, next) => {
    if (!req.session.userId) {
        return res.status(401).json({ message: 'Unauthorized' });
    }
    next();
};

router.use(requireAuth);

// Get chat history with a specific user
router.get('/history/:contactId', async (req, res) => {
    try {
        const currentUserId = req.session.userId;
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

        const audioUrl = `http://localhost:5000/uploads/${req.file.filename}`;
        res.status(200).json({ audioUrl });
    } catch (error) {
        console.error('Error uploading audio:', error);
        res.status(500).json({ message: 'Error uploading audio' });
    }
});

export default router;
