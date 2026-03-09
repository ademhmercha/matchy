import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { API_URL, getPhotoUrl } from '../config';
import './MainApp.css';

const MainApp = () => {
    const { t } = useTranslation();
    const [profiles, setProfiles] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [matchNotification, setMatchNotification] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        // Check auth and fetch profiles
        const initialize = async () => {
            try {
                const authRes = await axios.get(`${API_URL}/api/auth/check`, { withCredentials: true });
                if (!authRes.data.isAuthenticated) {
                    navigate('/login');
                    return;
                }

                const profilesRes = await axios.get(`${API_URL}/api/users/profiles`, { withCredentials: true });
                setProfiles(profilesRes.data);
            } catch (err) {
                if (err.response?.status === 401) {
                    navigate('/login');
                } else {
                    setError(t('mainApp.loadError'));
                }
            } finally {
                setLoading(false);
            }
        };

        initialize();
    }, [navigate]);

    const handleAction = async (action) => {
        if (currentIndex >= profiles.length) return;

        const profileId = profiles[currentIndex]._id;

        // Optimistic UI update
        setCurrentIndex(prev => prev + 1);

        try {
            const res = await axios.post(`${API_URL}/api/users/like/${profileId}`, { action }, { withCredentials: true });
            if (res.data.isMatch) {
                setMatchNotification(profiles[currentIndex]);
                setTimeout(() => setMatchNotification(null), 3000); // Hide after 3s
            }
        } catch (err) {
            console.error('Action failed:', err);
            // Ideally revert optimistic update here
        }
    };

    if (loading) return <div className="container min-h-screen pt-24 text-center">{t('mainApp.loadingProfiles')}</div>;
    if (error) return <div className="container min-h-screen pt-24 text-center text-red-500">{error}</div>;

    const currentProfile = profiles[currentIndex];

    return (
        <div className="main-app-container">
            {matchNotification && (
                <div className="match-overlay">
                    <h2>{t('mainApp.itsAMatch')}</h2>
                    <p>{t('mainApp.matchedWith', { name: matchNotification.firstName })}</p>
                </div>
            )}

            <div className="card-stack-container">
                {currentProfile ? (
                    <div className="tinder-card">
                        <div className="card-image-wrapper">
                            {currentProfile.photos && currentProfile.photos.length > 0 ? (
                                <img src={getPhotoUrl(currentProfile.photos[0])} alt={currentProfile.firstName} className="card-image" />
                            ) : (
                                <div className="card-image-placeholder bg-pink flex items-center justify-center">
                                    <span style={{ fontSize: '4rem', fontWeight: 800, color: 'rgba(255,255,255,0.5)' }}>
                                        {currentProfile.firstName[0]}
                                    </span>
                                </div>
                            )}
                            <div className="card-info-overlay">
                                <h2>{currentProfile.firstName}</h2>
                                <p className="card-bio">{currentProfile.bio}</p>
                            </div>
                        </div>

                        <div className="card-actions">
                            <button
                                className="action-btn nope-btn"
                                onClick={() => handleAction('dislike')}
                                aria-label={t('mainApp.nope')}
                            >
                                ✕
                            </button>
                            <button
                                className="action-btn like-btn"
                                onClick={() => handleAction('like')}
                                aria-label={t('mainApp.like')}
                            >
                                ♥
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="no-more-profiles">
                        <div className="radar-animation"></div>
                        <h3>{t('mainApp.noMoreTitle')}</h3>
                        <p>{t('mainApp.noMoreSubtitle')}</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MainApp;
