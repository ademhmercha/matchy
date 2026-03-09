import React, { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import { API_URL, getPhotoUrl } from '../config';
import { useAuth } from '../context/AuthContext';
import './Auth.css';

const INTERESTS_OPTIONS = [
    '🎨 Art', '🍕 Gastronomie', '✈️ Voyage', '🎵 Musique', '🎬 Cinéma',
    '🏋️ Fitness', '🎮 Gaming', '📚 Lecture', '💻 Tech', '🐾 Animaux'
];

const Register = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { login } = useAuth();

    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({
        emailOrPhone: '',
        firstName: '',
        password: '',
        bio: '',
        interests: [],
        photos: []
    });

    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const toggleInterest = (interest) => {
        const current = [...formData.interests];
        const index = current.indexOf(interest);
        if (index > -1) {
            current.splice(index, 1);
        } else {
            current.push(interest);
        }
        setFormData({ ...formData, interests: current });
    };

    const handlePhotoUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setIsUploading(true);
        const uploadData = new FormData();
        uploadData.append('photo', file);

        try {
            const res = await axios.post(`${API_URL}/api/users/upload-photo`, uploadData, {
                headers: { 'Content-Type': 'multipart/form-data' },
                withCredentials: true,
            });
            setFormData({ ...formData, photos: [...formData.photos, res.data.url] });
        } catch (err) {
            setError(t('common.error'));
        } finally {
            setIsUploading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (formData.photos.length === 0) {
            setError(t('auth.photoRequired'));
            return;
        }

        setError('');
        setLoading(true);

        try {
            const res = await axios.post(`${API_URL}/api/auth/register`, formData, {
                withCredentials: true,
            });
            if (res.data?.token) {
                login(res.data.token, res.data.user);
                navigate('/app');
            }
        } catch (err) {
            setError(err.response?.data?.message || t('common.error'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <div className="glass-panel auth-card">
                <div className="auth-header">
                    <h2 className="auth-title text-gradient">{t('auth.createAccount')}</h2>
                    <p className="auth-subtitle">{t('auth.readyForMatches')}</p>
                </div>

                {error && <div className="form-error text-center" style={{ marginBottom: '1rem' }}>{error}</div>}

                <form onSubmit={handleSubmit} className="auth-form">
                    {step === 1 ? (
                        <div className="fade-in">
                            <div className="form-group">
                                <label className="form-label">{t('auth.firstName')}</label>
                                <input
                                    type="text"
                                    name="firstName"
                                    className="input-base"
                                    placeholder={t('auth.firstNamePlaceholder')}
                                    value={formData.firstName}
                                    onChange={handleChange}
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">{t('auth.emailOrPhone')}</label>
                                <input
                                    type="text"
                                    name="emailOrPhone"
                                    className="input-base"
                                    placeholder={t('auth.emailOrPhonePlaceholder')}
                                    value={formData.emailOrPhone}
                                    onChange={handleChange}
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">{t('auth.password')}</label>
                                <input
                                    type="password"
                                    name="password"
                                    className="input-base"
                                    placeholder={t('auth.passwordPlaceholder')}
                                    value={formData.password}
                                    onChange={handleChange}
                                    required
                                />
                            </div>

                            <button
                                type="button"
                                className="btn-primary auth-submit-btn"
                                onClick={() => {
                                    if (!formData.firstName || !formData.emailOrPhone || !formData.password) {
                                        setError(t('auth.fillAllFields'));
                                        return;
                                    }
                                    setError('');
                                    setStep(2);
                                }}
                            >
                                {t('auth.next')}
                            </button>
                        </div>
                    ) : (
                        <div className="fade-in">
                            <div className="form-group">
                                <label className="form-label">{t('auth.bio')}</label>
                                <textarea
                                    name="bio"
                                    className="input-base"
                                    placeholder={t('auth.bioPlaceholder')}
                                    value={formData.bio}
                                    onChange={handleChange}
                                    rows={2}
                                    style={{ resize: 'none' }}
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">{t('auth.interests')}</label>
                                <div className="interest-tags-picker">
                                    {INTERESTS_OPTIONS.map(interest => (
                                        <span
                                            key={interest}
                                            className={`interest-tag-selectable ${formData.interests.includes(interest) ? 'active' : ''}`}
                                            onClick={() => toggleInterest(interest)}
                                        >
                                            {interest}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            <div className="form-group">
                                <label className="form-label">{t('auth.profilePhotoObligatory')}</label>
                                <div className="registration-photos-grid">
                                    {formData.photos.map((url, idx) => (
                                        <div key={idx} className="reg-photo-preview">
                                            <img src={getPhotoUrl(url)} alt="Preview" />
                                        </div>
                                    ))}
                                    {formData.photos.length < 3 && (
                                        <div className="reg-photo-add" onClick={() => fileInputRef.current.click()}>
                                            {isUploading ? '...' : '+'}
                                        </div>
                                    )}
                                </div>
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    style={{ display: 'none' }}
                                    onChange={handlePhotoUpload}
                                    accept="image/*"
                                />
                            </div>

                            <div className="auth-step-buttons">
                                <button type="button" className="btn-outline" onClick={() => setStep(1)}>
                                    {t('auth.back')}
                                </button>
                                <button type="submit" className="btn-primary" disabled={loading || isUploading}>
                                    {loading ? t('auth.registering') : t('auth.createAccount')}
                                </button>
                            </div>
                        </div>
                    )}
                </form>

                <div className="auth-footer">
                    {t('auth.alreadyHaveAccount')}
                    <Link to="/login" className="auth-link">{t('auth.loginLink')}</Link>
                </div>
            </div>
        </div>
    );
};

export default Register;
