import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import { API_URL } from '../config';
import './Auth.css';

const Login = () => {
    const { t } = useTranslation();
    const [formData, setFormData] = useState({ emailOrPhone: '', password: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const res = await axios.post(`${API_URL}/api/auth/login`, formData, {
                withCredentials: true,
            });
            if (res.data?.token) {
                localStorage.setItem('token', res.data.token);
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
                    <h2 className="auth-title text-gradient">{t('common.login')}</h2>
                    <p className="auth-subtitle">{t('auth.welcomeBack')}</p>
                </div>

                {error && <div className="form-error text-center" style={{ marginBottom: '1rem' }}>{error}</div>}

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
