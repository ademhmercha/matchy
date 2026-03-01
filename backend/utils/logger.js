import AuditLog from '../models/AuditLog.js';

export const createAuditLog = async (action, userId, details = {}, targetUserId = null) => {
    try {
        const log = new AuditLog({
            action,
            performedBy: userId,
            details,
            targetUser: targetUserId
        });
        await log.save();
    } catch (error) {
        console.error('Failed to create audit log:', error);
    }
};
