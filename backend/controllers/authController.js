import User from '../models/User.js';
import { createAuditLog } from '../utils/logger.js';

export const register = async (req, res) => {
    try {
        const { emailOrPhone, password, firstName, bio, interests, photos } = req.body;

        // Check if user exists
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

        // Set session
        req.session.userId = newUser._id;

        // Log activity
        await createAuditLog('REGISTER', newUser._id, { email: emailOrPhone });

        res.status(201).json({ message: 'User registered successfully', user: { _id: newUser._id, firstName: newUser.firstName } });
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

        // Check if banned
        if (user.status === 'banned') {
            return res.status(403).json({ message: 'Your account has been banned' });
        }

        // Set session
        req.session.userId = user._id;

        // Log activity
        await createAuditLog('LOGIN', user._id);

        res.status(200).json({ message: 'Logged in successfully', user: { _id: user._id, firstName: user.firstName } });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Server error during login' });
    }
};

export const logout = (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({ message: 'Could not log out' });
        }
        res.clearCookie('connect.sid');
        res.status(200).json({ message: 'Logged out successfully' });
    });
};

export const checkAuth = async (req, res) => {
    if (req.session.userId) {
        try {
            const user = await User.findById(req.session.userId).select('-password');
            if (!user) return res.status(401).json({ isAuthenticated: false });
            return res.status(200).json({ isAuthenticated: true, user });
        } catch (error) {
            return res.status(500).json({ message: 'Error checking auth' });
        }
    }
    res.status(401).json({ isAuthenticated: false });
};
