import express from 'express';
import User from '../models/User.js';
import AuditLog from '../models/AuditLog.js';
import Report from '../models/Report.js';
import { createAuditLog } from '../utils/logger.js';

const router = express.Router();


import { requireAuth } from '../utils/jwtAuth.js';

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
        const totalReports = await Report.countDocuments();
        const pendingReports = await Report.countDocuments({ status: 'pending' });
        const totalMessages = await AuditLog.countDocuments({ action: 'SEND_MESSAGE' });
        const totalMatches = await AuditLog.countDocuments({ action: 'MATCH' });


        const countsByRole = await User.aggregate([{ $group: { _id: "$role", count: { $sum: 1 } } }]);

        res.status(200).json({
            totalUsers,
            activeUsers,
            bannedUsers,
            totalReports,
            pendingReports,
            totalMessages,
            totalMatches,
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
        const { status } = req.body; // 'active' or 'banned'
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

export default router;
