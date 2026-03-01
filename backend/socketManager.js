const userSockets = new Map();
let io = null;

export const socketManager = {
    init: (ioInstance) => {
        io = ioInstance;
    },
    getIo: () => io,
    registerUser: (userId, socketId) => {
        userSockets.set(userId, socketId);
    },
    removeSocket: (socketId) => {
        for (const [userId, id] of userSockets.entries()) {
            if (id === socketId) {
                userSockets.delete(userId);
                break;
            }
        }
    },
    getSocketId: (userId) => userSockets.get(userId),
    userSockets // Export for direct access if needed
};
