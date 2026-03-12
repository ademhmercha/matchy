import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import Notification from './Notification';
import ComplaintModal from './ComplaintModal';
import './Navbar.css';

const Navbar = ({ onShowProfile }) => {
    const { t, i18n } = useTranslation();
    const { isAuthenticated, user, logout } = useAuth();
    const navigate = useNavigate();
    const [showComplaint, setShowComplaint] = useState(false);

    const changeLanguage = (lng) => {
        i18n.changeLanguage(lng);
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <>
        {showComplaint && <ComplaintModal onClose={() => setShowComplaint(false)} />}
        <nav className="navbar">
            <div className="navbar-container container flex justify-between items-center">
                <div className="navbar-left flex items-center gap-6">
                    <Link to="/" className="navbar-logo flex items-center gap-2">
                        <svg viewBox="0 0 24 24" width="32" height="32" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" className="logo-icon">
                            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"></path>
                        </svg>
                        <span className="logo-text">{t('common.appName')}</span>
                    </Link>
                    <div className="navbar-links flex gap-4 hidden-mobile">
                        <Link to="/app" className="nav-link">{t('common.discover')}</Link>
                        <Link to="/chat" className="nav-link">{t('common.messages')}</Link>
                        {isAuthenticated && user?.role === 'admin' && (
                            <Link to="/admin" className="nav-link" style={{ color: '#fd297b' }}>🛡️ {t('admin.tabs.stats')}</Link>
                        )}
                    </div>
                </div>
                <div className="navbar-right flex items-center gap-4">
                    <div className="nav-language flex items-center gap-3">
                        <button onClick={() => changeLanguage('fr')} className={`lang-btn ${i18n.language.startsWith('fr') ? 'active' : ''}`}>FR</button>
                        <button onClick={() => changeLanguage('en')} className={`lang-btn ${i18n.language.startsWith('en') ? 'active' : ''}`}>EN</button>
                    </div>
                    {isAuthenticated ? (
                        <div className="flex items-center gap-4">
                            <Notification onShowProfile={onShowProfile} />
                            <button onClick={() => setShowComplaint(true)} className="nav-link hidden-mobile" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', fontSize: 'inherit' }}>
                                📝 Réclamation
                            </button>
                            <Link to="/profile" className="nav-link hidden-mobile">{t('common.profile')}</Link>
                            <button onClick={handleLogout} className="btn-outline hidden-mobile">{t('common.logout')}</button>
                        </div>
                    ) : (
                        <div className="flex items-center gap-4">
                            <Link to="/login" className="btn-outline">{t('common.login')}</Link>
                            <Link to="/register" className="btn-primary">{t('common.register')}</Link>
                        </div>
                    )}
                </div>
            </div>
        </nav>

        {/* Mobile bottom navigation */}
        {isAuthenticated && (
            <nav className="mobile-bottom-nav">
                <Link to="/app" className="mobile-nav-item">
                    <span>🔥</span>
                    <span>{t('common.discover')}</span>
                </Link>
                <Link to="/chat" className="mobile-nav-item">
                    <span>💬</span>
                    <span>{t('common.messages')}</span>
                </Link>
                <button onClick={() => setShowComplaint(true)} className="mobile-nav-item">
                    <span>📝</span>
                    <span>Réclamation</span>
                </button>
                <Link to="/profile" className="mobile-nav-item">
                    <span>👤</span>
                    <span>{t('common.profile')}</span>
                </Link>
                <button onClick={handleLogout} className="mobile-nav-item">
                    <span>🚪</span>
                    <span>{t('common.logout')}</span>
                </button>
            </nav>
        )}
        </>
    );
};

export default Navbar;
