import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import { API_URL } from '../config';
import { useAuth } from '../context/AuthContext';
import './Auth.css';

const Login = () => {
    const { t } = useTranslation();
    const [formData, setFormData] = useState({ emailOrPhone: '', password: '' });
    const [error, setError] = useState('');
    const [errorCode, setErrorCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [resendLoading, setResendLoading] = useState(false);
    const [resendDone, setResendDone] = useState(false);
    const navigate = useNavigate();
    const { login } = useAuth();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setErrorCode('');
        setLoading(true);
        try {
            const res = await axios.post(`${API_URL}/api/auth/login`, formData, { withCredentials: true });
            if (res.data?.token) {
                login(res.data.token, res.data.user);
                navigate('/app');
            }
        } catch (err) {
            setError(err.response?.data?.message || t('common.error'));
            setErrorCode(err.response?.data?.error || '');
        } finally {
            setLoading(false);
        }
    };

    const handleResendVerification = async () => {
        setResendLoading(true);
        try {
            await axios.post(`${API_URL}/api/auth/resend-verification`, { emailOrPhone: formData.emailOrPhone });
            setResendDone(true);
        } catch {
            // fail silently — server always returns 200
            setResendDone(true);
        } finally {
            setResendLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <div className="glass-panel auth-card">
                <div className="auth-header">
                    <h2 className="auth-title text-gradient">{t('common.login')}</h2>
                    <p className="auth-subtitle">{t('auth.welcomeBack')}</p>
                </div>

                {error && (
                    <div className="form-error text-center" style={{ marginBottom: '1rem' }}>
                        {error}
                        {errorCode === 'email_not_verified' && !resendDone && (
                            <div style={{ marginTop: 10 }}>
                                <button
                                    onClick={handleResendVerification}
                                    disabled={resendLoading}
                                    style={{ background: 'none', border: '1px solid #e91e8c', color: '#e91e8c', borderRadius: 6, padding: '6px 14px', cursor: 'pointer', fontSize: 13 }}
                                >
                                    {resendLoading ? 'Envoi...' : 'Renvoyer l\'email de vérification'}
                                </button>
                            </div>
                        )}
                        {resendDone && (
                            <p style={{ color: '#4caf50', fontSize: 13, marginTop: 8 }}>Email renvoyé ! Vérifiez votre boîte.</p>
                        )}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="auth-form">
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
                        <div style={{ textAlign: 'right', marginTop: 6 }}>
                            <Link to="/forgot-password" style={{ color: '#e91e8c', fontSize: 13, textDecoration: 'none' }}>
                                Mot de passe oublié ?
                            </Link>
                        </div>
                    </div>

                    <button type="submit" className="btn-primary auth-submit-btn" disabled={loading}>
                        {loading ? t('common.loading') : t('common.login')}
                    </button>
                </form>

                <div className="auth-footer">
                    {t('auth.alreadyHaveAccount')}
                    <Link to="/register" className="auth-link">{t('common.register')}</Link>
                </div>
            </div>
        </div>
    );
};

export default Login;
