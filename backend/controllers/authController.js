import User from '../models/User.js';
import { createAuditLog } from '../utils/logger.js';
import { signToken } from '../utils/jwtAuth.js';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'matchy-jwt-secret-key';

export const register = async (req, res) => {
    try {
        const { emailOrPhone, password, firstName, bio, interests, photos } = req.body;

        const existingUser = await User.findOne({ emailOrPhone });
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists with this email or phone number' });
        }

        const newUser = new User({
            emailOrPhone,
            password,
            firstName,
            bio,
            interests: interests || [],
            photos: photos || []
        });
        await newUser.save();

        const token = signToken(newUser._id);

        await createAuditLog('REGISTER', newUser._id, { email: emailOrPhone });

        res.status(201).json({
            message: 'User registered successfully',
            token,
            user: { _id: newUser._id, firstName: newUser.firstName }
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ message: 'Server error during registration' });
    }
};

export const login = async (req, res) => {
    try {
        const { emailOrPhone, password } = req.body;

        const user = await User.findOne({ emailOrPhone });
        if (!user) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        if (user.status === 'banned') {
            return res.status(403).json({ message: 'Your account has been banned' });
        }

        const token = signToken(user._id);

        await createAuditLog('LOGIN', user._id);

        res.status(200).json({
            message: 'Logged in successfully',
            token,
            user: { _id: user._id, firstName: user.firstName }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Server error during login' });
    }
};

export const logout = (req, res) => {
    // JWT is stateless — client just deletes the token
    res.status(200).json({ message: 'Logged out successfully' });
};

export const checkAuth = async (req, res) => {
    const auth = req.headers.authorization;
    if (!auth || !auth.startsWith('Bearer ')) {
        return res.status(401).json({ isAuthenticated: false });
    }
    try {
        const { userId } = jwt.verify(auth.slice(7), JWT_SECRET);
        const user = await User.findById(userId).select('-password');
        if (!user) return res.status(401).json({ isAuthenticated: false });
        return res.status(200).json({ isAuthenticated: true, user });
    } catch {
        return res.status(401).json({ isAuthenticated: false });
    }
};
