import express from 'express';
import User from '../models/User.js';
import AuditLog from '../models/AuditLog.js';
import Report from '../models/Report.js';
import Complaint from '../models/Complaint.js';
import Message from '../models/Message.js';
import { createAuditLog } from '../utils/logger.js';
import { requireAuth } from '../utils/jwtAuth.js';

const router = express.Router();

const requireAdmin = async (req, res, next) => {
    requireAuth(req, res, async () => {
        try {
            const user = await User.findById(req.userId);
            if (!user || user.role !== 'admin') {
                return res.status(403).json({ message: 'Forbidden: Admin access required' });
            }
            next();
        } catch (error) {
            res.status(500).json({ message: 'Server error during admin check' });
        }
    });
};

router.use(requireAdmin);

router.get('/stats', async (req, res) => {
    try {
        const totalUsers = await User.countDocuments();
        const activeUsers = await User.countDocuments({ status: 'active' });
        const bannedUsers = await User.countDocuments({ status: 'banned' });
        const pendingUsers = await User.countDocuments({ status: 'pending' });
        const totalReports = await Report.countDocuments();
        const pendingReports = await Report.countDocuments({ status: 'pending' });
        const totalMessages = await AuditLog.countDocuments({ action: 'SEND_MESSAGE' });
        const totalMatches = await AuditLog.countDocuments({ action: 'MATCH' });
        const pendingComplaints = await Complaint.countDocuments({ status: 'pending' });

        const countsByRole = await User.aggregate([{ $group: { _id: "$role", count: { $sum: 1 } } }]);

        res.status(200).json({
            totalUsers, activeUsers, bannedUsers, pendingUsers,
            totalReports, pendingReports,
            totalMessages, totalMatches,
            pendingComplaints,
            countsByRole
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

router.get('/logs', async (req, res) => {
    try {
        const { page = 1, limit = 50 } = req.query;
        const logs = await AuditLog.find()
            .populate('performedBy', 'firstName emailOrPhone')
            .populate('targetUser', 'firstName')
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const total = await AuditLog.countDocuments();

        res.status(200).json({
            logs,
            totalPages: Math.ceil(total / limit),
            currentPage: page
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

router.get('/reports', async (req, res) => {
    try {
        const reports = await Report.find()
            .populate('reporter', 'firstName')
            .populate('reportedUser', 'firstName status')
            .sort({ createdAt: -1 });
        res.status(200).json(reports);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

router.post('/users/:id/status', async (req, res) => {
    try {
        const { status } = req.body;
        const user = await User.findByIdAndUpdate(req.params.id, { status }, { new: true });
        await createAuditLog('BAN_UPDATE', req.userId, { newStatus: status }, req.params.id);
        res.status(200).json({ message: `User status updated to ${status}`, user });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

router.get('/users', async (req, res) => {
    try {
        const users = await User.find().select('-password').sort({ createdAt: -1 });
        res.status(200).json(users);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// DELETE user — removes user + their messages + reports + cleanup from other users' lists
router.delete('/users/:id', async (req, res) => {
    try {
        const targetId = req.params.id;
        const user = await User.findById(targetId);
        if (!user) return res.status(404).json({ message: 'Utilisateur introuvable.' });

        // Remove from other users' matches/likes/dislikes
        await User.updateMany(
            { $or: [{ matches: targetId }, { likes: targetId }, { dislikes: targetId }] },
            { $pull: { matches: targetId, likes: targetId, dislikes: targetId } }
        );

        // Delete messages
        await Message.deleteMany({ $or: [{ sender: targetId }, { receiver: targetId }] });

        // Delete reports involving this user
        await Report.deleteMany({ $or: [{ reporter: targetId }, { reportedUser: targetId }] });

        // Delete complaints
        await Complaint.deleteMany({ userId: targetId });

        // Delete user
        await User.findByIdAndDelete(targetId);

        await createAuditLog('USER_DELETED', req.userId, { deletedUser: user.emailOrPhone }, targetId);

        res.status(200).json({ message: 'Utilisateur supprimé avec succès.' });
    } catch (error) {
        console.error('Delete user error:', error);
        res.status(500).json({ message: 'Erreur serveur.' });
    }
});

// GET all complaints
router.get('/complaints', async (req, res) => {
    try {
        const { status } = req.query;
        const filter = status ? { status } : {};
        const complaints = await Complaint.find(filter)
            .populate('userId', 'firstName emailOrPhone')
            .sort({ createdAt: -1 });
        res.status(200).json(complaints);
    } catch (error) {
        res.status(500).json({ message: 'Erreur serveur.' });
    }
});

// UPDATE complaint status + response
router.put('/complaints/:id', async (req, res) => {
    try {
        const { status, adminResponse } = req.body;
        const complaint = await Complaint.findByIdAndUpdate(
            req.params.id,
            { status, adminResponse },
            { new: true }
        ).populate('userId', 'firstName emailOrPhone');

        if (!complaint) return res.status(404).json({ message: 'Réclamation introuvable.' });

        await createAuditLog('COMPLAINT_HANDLED', req.userId, { complaintId: req.params.id, newStatus: status });

        res.status(200).json(complaint);
    } catch (error) {
        res.status(500).json({ message: 'Erreur serveur.' });
    }
});

export default router;
