import User from '../models/User.js';
import Report from '../models/Report.js';
import { socketManager } from '../socketManager.js';
import { createAuditLog } from '../utils/logger.js';

export const getProfiles = async (req, res) => {
    try {
        const currentUserId = req.userId;
        const currentUser = await User.findById(currentUserId);

        if (currentUser.status === 'banned') {
            return res.status(403).json({ message: 'Banned' });
        }

        const excludedIds = [
            currentUserId,
            ...(currentUser.likes || []),
            ...(currentUser.dislikes || []),
            ...(currentUser.matches || [])
        ];

        const profiles = await User.find({
            _id: { $nin: excludedIds },
            status: 'active' // Only show active users
        }).select('-password'); // Exclude password from results

        res.status(200).json(profiles);
    } catch (error) {
        console.error('Error fetching profiles:', error);
        res.status(500).json({ message: 'Error fetching profiles' });
    }
};

export const likeProfile = async (req, res) => {
    try {
        const currentUserId = req.userId;
        const targetUserId = req.params.id;
        const { action } = req.body; // 'like' or 'dislike'

        const currentUser = await User.findById(currentUserId);
        const targetUser = await User.findById(targetUserId);

        if (!targetUser) return res.status(404).json({ message: 'User not found' });

        // Log action
        await createAuditLog(action === 'like' ? 'LIKE' : 'DISLIKE', currentUserId, {}, targetUserId);

        if (action === 'like') {
            if (!currentUser.likes.includes(targetUserId)) {
                currentUser.likes.push(targetUserId);
            }

            // Check if it's a match
            if (targetUser.likes.includes(currentUserId)) {
                currentUser.matches.push(targetUserId);
                targetUser.matches.push(currentUserId);
                await targetUser.save();
                await currentUser.save();

                // Log match
                await createAuditLog('MATCH', currentUserId, {}, targetUserId);

                // Emit notifications
                const io = socketManager.getIo();
                if (io) {
                    const targetSocketId = socketManager.getSocketId(targetUserId);
                    const currentSocketId = socketManager.getSocketId(currentUserId);

                    if (targetSocketId) {
                        io.to(targetSocketId).emit('new_match', {
                            matchId: currentUserId,
                            matchName: currentUser.firstName,
                            matchPhoto: currentUser.photos[0]
                        });
                    }
                    if (currentSocketId) {
                        io.to(currentSocketId).emit('new_match', {
                            matchId: targetUserId,
                            matchName: targetUser.firstName,
                            matchPhoto: targetUser.photos[0]
                        });
                    }
                }

                return res.status(200).json({ isMatch: true, message: 'It\'s a match!' });
            }
        } else if (action === 'dislike') {
            if (!currentUser.dislikes.includes(targetUserId)) {
                currentUser.dislikes.push(targetUserId);
            }
        }

        await currentUser.save();
        res.status(200).json({ isMatch: false, message: `Profile ${action}d` });
    } catch (error) {
        console.error(`Error processing action:`, error);
        res.status(500).json({ message: 'Server error' });
    }
};

export const getMatches = async (req, res) => {
    try {
        const currentUserId = req.userId;
        const user = await User.findById(currentUserId).populate('matches', '-password');
        res.status(200).json(user.matches);
    } catch (error) {
        console.error('Error fetching matches:', error);
        res.status(500).json({ message: 'Error fetching matches' });
    }
};

export const updateProfile = async (req, res) => {
    try {
        const currentUserId = req.userId;
        const { firstName, bio, photos } = req.body; // Expecting an array of photo URLs

        const user = await User.findByIdAndUpdate(
            currentUserId,
            { firstName, bio, photos },
            { new: true }
        ).select('-password');

        await createAuditLog('PROFILE_UPDATE', currentUserId, { updatedFields: Object.keys(req.body) });

        // Notify all matches
        const io = socketManager.getIo();
        if (io && user.matches && user.matches.length > 0) {
            user.matches.forEach(matchId => {
                const socketId = socketManager.getSocketId(matchId.toString());
                if (socketId) {
                    io.to(socketId).emit('profile_updated', {
                        userId: currentUserId,
                        firstName: user.firstName,
                        photo: user.photos[0]
                    });
                }
            });
        }

        res.status(200).json(user);
    } catch (error) {
        console.error('Error updating profile:', error);
        res.status(500).json({ message: 'Error updating profile' });
    }
};

export const uploadPhoto = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No photo uploaded' });
        }

        const photoUrl = `/uploads/${req.file.filename}`;

        if (req.userId) {
            await createAuditLog('PHOTO_UPLOAD', req.userId, { url: photoUrl });
        }

        res.status(200).json({ url: photoUrl });
    } catch (error) {
        console.error('Error uploading photo:', error);
        res.status(500).json({ message: 'Error uploading photo' });
    }
};

export const reportUser = async (req, res) => {
    try {
        const { reportedUserId, reason, evidence } = req.body;
        const reporterId = req.userId;

        const report = new Report({
            reporter: reporterId,
            reportedUser: reportedUserId,
            reason,
            evidence: evidence || ''
        });
        await report.save();

        await createAuditLog('REPORT', reporterId, { reason, hasEvidence: !!evidence }, reportedUserId);

        res.status(201).json({ message: 'Report submitted successfully' });
    } catch (error) {
        console.error('Error reporting user:', error);
        res.status(500).json({ message: 'Error reporting user' });
    }
};

export const getMatchProfile = async (req, res) => {
    try {
        const { id } = req.params;
        const user = await User.findById(id).select('-password');
        if (!user) return res.status(404).json({ message: 'User not found' });
        res.status(200).json(user);
    } catch (error) {
        console.error('Error fetching match profile:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

export const unmatchUser = async (req, res) => {
    try {
        const currentUserId = req.userId;
        const { id: targetUserId } = req.params;

        const currentUser = await User.findById(currentUserId);
        const targetUser = await User.findById(targetUserId);

        if (!targetUser) return res.status(404).json({ message: 'User not found' });

        // Remove from matches
        currentUser.matches = currentUser.matches.filter(id => id.toString() !== targetUserId);
        targetUser.matches = targetUser.matches.filter(id => id.toString() !== currentUserId);

        // Also remove the "like" to allow swiping again OR just leave it as disliked?
        // Let's remove the like so they don't match again immediately if they swipe.
        currentUser.likes = currentUser.likes.filter(id => id.toString() !== targetUserId);
        targetUser.likes = targetUser.likes.filter(id => id.toString() !== currentUserId);

        // Add to dislikes to avoid seeing them again immediately
        if (!currentUser.dislikes.includes(targetUserId)) {
            currentUser.dislikes.push(targetUserId);
        }

        await currentUser.save();
        await targetUser.save();

        res.status(200).json({ message: 'Unmatched successfully' });
    } catch (error) {
        console.error('Error unmatching:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
