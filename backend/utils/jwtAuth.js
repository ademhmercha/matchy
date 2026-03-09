import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'matchy-jwt-secret-key';

export const signToken = (userId) =>
    jwt.sign({ userId: userId.toString() }, JWT_SECRET, { expiresIn: '7d' });

export const requireAuth = (req, res, next) => {
    const auth = req.headers.authorization;
    if (!auth || !auth.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Unauthorized' });
    }
    try {
        const { userId } = jwt.verify(auth.slice(7), JWT_SECRET);
        req.userId = userId;
        next();
    } catch {
        res.status(401).json({ message: 'Invalid or expired token' });
    }
};

export const requireAdmin = async (req, res, next) => {
    const auth = req.headers.authorization;
    if (!auth || !auth.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Unauthorized' });
    }
    try {
        const { userId } = jwt.verify(auth.slice(7), JWT_SECRET);
        req.userId = userId;
        next();
    } catch {
        res.status(401).json({ message: 'Invalid or expired token' });
    }
};
