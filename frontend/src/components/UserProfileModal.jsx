import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import './UserProfileModal.css';

import ReportModal from './ReportModal';

const UserProfileModal = ({ userId, onClose, onUnmatch }) => {
    const { t } = useTranslation();
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activePhoto, setActivePhoto] = useState(0);
    const [showReportModal, setShowReportModal] = useState(false);

    useEffect(() => {
        if (!userId) return;
        const fetchProfile = async () => {
            try {
                const res = await axios.get(`http://localhost:5000/api/users/profile/${userId}`, { withCredentials: true });
                setUser(res.data);
            } catch (error) {
                console.error('Error fetching user profile:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, [userId]);

    const handleScroll = (e) => {
        const scrollLeft = e.target.scrollLeft;
        const width = e.target.clientWidth;
        const activeIndex = Math.round(scrollLeft / width);
        setActivePhoto(activeIndex);
    };

    const handleUnmatch = async () => {
        if (window.confirm(t('profile.unmatchConfirm', { name: user.firstName }))) {
            try {
                await axios.delete(`http://localhost:5000/api/users/unmatch/${userId}`, { withCredentials: true });
                onUnmatch(userId);
                onClose();
            } catch (error) {
                console.error('Error unmatching:', error);
                alert(t('common.error'));
            }
        }
    };

    if (!userId) return null;

    if (showReportModal) {
        return (
            <ReportModal
                reportedUserId={userId}
                reportedUserName={user?.firstName}
                onClose={() => setShowReportModal(false)}
            />
        );
    }

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content profile-modal" onClick={e => e.stopPropagation()}>
                <button className="modal-close" onClick={onClose} aria-label={t('common.close')}>
                    <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>

                {loading ? (
                    <div className="loading-spinner">
                        <div className="pulse-loader"></div>
                    </div>
                ) : user ? (
                    <div className="profile-view">
                        <div className="profile-photos-container">
                            <div className="photo-indicators">
                                {(user.photos || []).map((_, idx) => (
                                    <div key={idx} className={`indicator-dot ${idx === activePhoto ? 'active' : ''}`}></div>
                                ))}
                            </div>
                            <div className="profile-photos-carousel" onScroll={handleScroll}>
                                {user.photos && user.photos.map((url, idx) => (
                                    <img key={idx} src={`http://localhost:5000${url}`} alt={user.firstName} className="profile-carousel-img" />
                                ))}
                            </div>
                            <div className="photos-overlay-gradient"></div>
                        </div>

                        <div className="profile-details-info">
                            <div className="profile-drawer-header">
                                <div className="badges-row">
                                    <span className="online-badge">{t('profile.online')}</span>
                                </div>
                                <h2>{user.firstName}</h2>
                            </div>

                            <div className="profile-section-title">{t('profile.about')}</div>
                            <p className="profile-bio">{user.bio || t('auth.bioPlaceholder')}</p>

                            {user.interests && user.interests.length > 0 && (
                                <>
                                    <div className="profile-section-title">{t('profile.interestsTitle')}</div>
                                    <div className="interest-tags">
                                        {user.interests.map(interest => (
                                            <span key={interest} className="interest-tag">{interest}</span>
                                        ))}
                                    </div>
                                </>
                            )}

                            <div className="danger-zone">
                                <button onClick={handleUnmatch} className="btn-unmatch-premium">
                                    {t('profile.unmatch')}
                                </button>
                                <button onClick={() => setShowReportModal(true)} className="btn-report">
                                    <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"></path>
                                        <line x1="4" y1="22" x2="4" y2="15"></line>
                                    </svg>
                                    {t('chat.report')}
                                </button>
                            </div>
                        </div>
                    </div>
                ) : (
                    <p className="not-found">{t('profile.userNotFound')}</p>
                )}
            </div>
        </div>
    );
};

export default UserProfileModal;
