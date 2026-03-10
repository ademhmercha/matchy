import express from 'express';
import Complaint from '../models/Complaint.js';
import { requireAuth } from '../utils/jwtAuth.js';

const router = express.Router();

router.use(requireAuth);

// Submit a complaint
router.post('/', async (req, res) => {
    try {
        const { subject, message } = req.body;
        if (!subject || !message) {
            return res.status(400).json({ message: 'Sujet et message requis.' });
        }

        const complaint = new Complaint({
            userId: req.userId,
            subject,
            message,
        });
        await complaint.save();

        res.status(201).json({ message: 'Réclamation envoyée avec succès.' });
    } catch (error) {
        console.error('Complaint error:', error);
        res.status(500).json({ message: 'Erreur serveur.' });
    }
});

// Get my complaints
router.get('/mine', async (req, res) => {
    try {
        const complaints = await Complaint.find({ userId: req.userId }).sort({ createdAt: -1 });
        res.status(200).json(complaints);
    } catch (error) {
        res.status(500).json({ message: 'Erreur serveur.' });
    }
});

export default router;
