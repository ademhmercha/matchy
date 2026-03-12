import crypto from 'crypto';
import User from '../models/User.js';
import { createAuditLog } from '../utils/logger.js';
import { signToken } from '../utils/jwtAuth.js';
import jwt from 'jsonwebtoken';
import { sendVerificationEmail, sendPasswordResetEmail } from '../utils/emailService.js';

const JWT_SECRET = process.env.JWT_SECRET || 'matchy-jwt-secret-key';

const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,}$/;

export const register = async (req, res) => {
    try {
        const { emailOrPhone, password, firstName, bio, interests, photos } = req.body;

        if (!PASSWORD_REGEX.test(password)) {
            return res.status(400).json({
                message: 'Le mot de passe doit contenir au moins 8 caractères, une majuscule, une minuscule, un chiffre et un caractère spécial.',
                error: 'weak_password'
            });
        }

        const existingUser = await User.findOne({ emailOrPhone });
        if (existingUser) {
            return res.status(400).json({ message: 'Un compte existe déjà avec cet email ou numéro.' });
        }

        // Generate email verification token
        const rawToken = crypto.randomBytes(32).toString('hex');
        const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');

        const newUser = new User({
            emailOrPhone,
            password,
            firstName,
            bio,
            interests: interests || [],
            photos: photos || [],
            status: 'pending',
            emailVerificationToken: hashedToken,
            emailVerificationExpires: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
        });
        await newUser.save();

        await sendVerificationEmail(emailOrPhone, rawToken);
        await createAuditLog('REGISTER', newUser._id, { email: emailOrPhone });

        res.status(201).json({
            message: 'Compte créé. Vérifiez votre email pour activer votre compte.',
            emailSent: true
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ message: 'Erreur serveur lors de l\'inscription.' });
    }
};

export const login = async (req, res) => {
    try {
        const { emailOrPhone, password } = req.body;

        const user = await User.findOne({ emailOrPhone });
        if (!user) {
            return res.status(400).json({ message: 'Identifiants invalides.' });
        }

        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Identifiants invalides.' });
        }

        if (user.status === 'pending') {
            return res.status(403).json({
                message: 'Veuillez vérifier votre email avant de vous connecter.',
                error: 'email_not_verified'
            });
        }

        if (user.status === 'banned') {
            return res.status(403).json({
                message: 'Votre compte a été suspendu.',
                error: 'account_banned'
            });
        }

        const token = signToken(user._id);
        await createAuditLog('LOGIN', user._id);

        res.status(200).json({
            message: 'Connecté avec succès.',
            token,
            user: { _id: user._id, firstName: user.firstName, role: user.role, photos: user.photos }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Erreur serveur lors de la connexion.' });
    }
};

export const logout = async (req, res) => {
    try {
        // Extract userId from token if present to log the logout
        const auth = req.headers.authorization;
        if (auth?.startsWith('Bearer ')) {
            const jwt = (await import('jsonwebtoken')).default;
            const JWT_SECRET = process.env.JWT_SECRET || 'matchy-jwt-secret-key';
            try {
                const { userId } = jwt.verify(auth.slice(7), JWT_SECRET);
                await createAuditLog('LOGOUT', userId);
            } catch { /* token invalid, skip log */ }
        }
    } catch { /* ignore */ }
    res.status(200).json({ message: 'Déconnecté avec succès.' });
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

export const verifyEmail = async (req, res) => {
    try {
        const { token } = req.query;
        if (!token) return res.status(400).json({ message: 'Token manquant.' });

        const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
        const user = await User.findOne({
            emailVerificationToken: hashedToken,
            emailVerificationExpires: { $gt: Date.now() },
        });

        if (!user) {
            return res.status(400).json({ message: 'Lien invalide ou expiré.', error: 'invalid_token' });
        }

        user.status = 'active';
        user.emailVerificationToken = undefined;
        user.emailVerificationExpires = undefined;
        await user.save();

        const jwtToken = signToken(user._id);
        await createAuditLog('EMAIL_VERIFIED', user._id);

        res.status(200).json({
            message: 'Email vérifié avec succès.',
            token: jwtToken,
            user: { _id: user._id, firstName: user.firstName, role: user.role, photos: user.photos }
        });
    } catch (error) {
        console.error('verifyEmail error:', error);
        res.status(500).json({ message: 'Erreur serveur.' });
    }
};

export const forgotPassword = async (req, res) => {
    try {
        const { emailOrPhone } = req.body;
        const user = await User.findOne({ emailOrPhone });

        // Always return success to avoid user enumeration
        if (!user || user.status === 'banned') {
            return res.status(200).json({ message: 'Si ce compte existe, un email a été envoyé.' });
        }

        const rawToken = crypto.randomBytes(32).toString('hex');
        const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');

        user.resetPasswordToken = hashedToken;
        user.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
        await user.save();

        await sendPasswordResetEmail(user.emailOrPhone, rawToken);

        res.status(200).json({ message: 'Si ce compte existe, un email a été envoyé.' });
    } catch (error) {
        console.error('forgotPassword error:', error);
        res.status(500).json({ message: 'Erreur serveur.' });
    }
};

export const resetPassword = async (req, res) => {
    try {
        const { token, newPassword } = req.body;
        if (!token || !newPassword) {
            return res.status(400).json({ message: 'Token et nouveau mot de passe requis.' });
        }

        if (!PASSWORD_REGEX.test(newPassword)) {
            return res.status(400).json({
                message: 'Le mot de passe doit contenir au moins 8 caractères, une majuscule, une minuscule, un chiffre et un caractère spécial.',
                error: 'weak_password'
            });
        }

        const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
        const user = await User.findOne({
            resetPasswordToken: hashedToken,
            resetPasswordExpires: { $gt: Date.now() },
        });

        if (!user) {
            return res.status(400).json({ message: 'Lien invalide ou expiré.', error: 'invalid_token' });
        }

        user.password = newPassword;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
        await user.save();

        await createAuditLog('PASSWORD_RESET', user._id);

        res.status(200).json({ message: 'Mot de passe réinitialisé avec succès.' });
    } catch (error) {
        console.error('resetPassword error:', error);
        res.status(500).json({ message: 'Erreur serveur.' });
    }
};

export const resendVerification = async (req, res) => {
    try {
        const { emailOrPhone } = req.body;
        const user = await User.findOne({ emailOrPhone, status: 'pending' });

        if (!user) {
            return res.status(200).json({ message: 'Si ce compte est en attente, un email a été envoyé.' });
        }

        const rawToken = crypto.randomBytes(32).toString('hex');
        const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');

        user.emailVerificationToken = hashedToken;
        user.emailVerificationExpires = new Date(Date.now() + 60 * 60 * 1000);
        await user.save();

        await sendVerificationEmail(user.emailOrPhone, rawToken);

        res.status(200).json({ message: 'Email de vérification renvoyé.' });
    } catch (error) {
        console.error('resendVerification error:', error);
        res.status(500).json({ message: 'Erreur serveur.' });
    }
};
