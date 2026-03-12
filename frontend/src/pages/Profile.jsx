import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import { API_URL, getPhotoUrl } from '../config';
import { useAuth } from '../context/AuthContext';
import './Profile.css';

const INTERESTS_OPTIONS = [
    '🎨 Art', '🍕 Gastronomie', '✈️ Voyage', '🎵 Musique', '🎬 Cinéma',
    '🏋️ Fitness', '🎮 Gaming', '📚 Lecture', '💻 Tech', '🐾 Animaux'
];

const ACTION_LABELS = {
    LOGIN: { label: 'Connexion', icon: '🔑', color: '#4caf50' },
    LOGOUT: { label: 'Déconnexion', icon: '🚪', color: '#9e9e9e' },
    REGISTER: { label: 'Inscription', icon: '✨', color: '#2196f3' },
    EMAIL_VERIFIED: { label: 'Email vérifié', icon: '✅', color: '#4caf50' },
    PASSWORD_RESET: { label: 'Mot de passe réinitialisé', icon: '🔒', color: '#ff9800' },
    PROFILE_UPDATE: { label: 'Profil modifié', icon: '✏️', color: '#9c27b0' },
    PHOTO_UPLOAD: { label: 'Photo ajoutée', icon: '📸', color: '#e91e8c' },
    LIKE: { label: 'Like envoyé', icon: '❤️', color: '#e91e8c' },
    DISLIKE: { label: 'Pass', icon: '👋', color: '#607d8b' },
    MATCH: { label: 'Nouveau match !', icon: '💕', color: '#e91e8c' },
    UNMATCH: { label: 'Dématch', icon: '💔', color: '#f44336' },
    REPORT: { label: 'Signalement soumis', icon: '🚩', color: '#ff5722' },
};

const Profile = () => {
    const { t } = useTranslation();
    const { user: authUser } = useAuth();
    const [user, setUser] = useState(null);
    const [activeTab, setActiveTab] = useState('edit');
    const [firstName, setFirstName] = useState('');
    const [bio, setBio] = useState('');
    const [photos, setPhotos] = useState([]);
    const [interests, setInterests] = useState([]);
    const [isSaving, setIsSaving] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [logs, setLogs] = useState([]);
    const [logsLoading, setLogsLoading] = useState(false);
    const fileInputRef = useRef();

    useEffect(() => {
        if (authUser) {
            setUser(authUser);
            setFirstName(authUser.firstName || '');
            setBio(authUser.bio || '');
            setPhotos(authUser.photos || []);
            setInterests(authUser.interests || []);
        }
    }, [authUser]);

    useEffect(() => {
        if (activeTab === 'activity') fetchLogs();
    }, [activeTab]);

    const fetchLogs = async () => {
        setLogsLoading(true);
        try {
            const res = await axios.get(`${API_URL}/api/users/my-logs`);
            setLogs(res.data);
        } catch {
            setLogs([]);
        } finally {
            setLogsLoading(false);
        }
    };

    const toggleInterest = (interest) => {
        const current = [...interests];
        const index = current.indexOf(interest);
        if (index > -1) { current.splice(index, 1); } else { current.push(interest); }
        setInterests(current);
    };

    const handleSaveProfile = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            const res = await axios.put(`${API_URL}/api/users/profile`,
                { firstName, bio, photos, interests },
                { withCredentials: true }
            );
            setUser(res.data);
            alert(t('common.save'));
        } catch (error) {
            console.error('Error saving profile:', error);
        } finally {
            setIsSaving(false);
        }
    };

    const handlePhotoUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setIsUploading(true);
        const formData = new FormData();
        formData.append('photo', file);
        try {
            const res = await axios.post(`${API_URL}/api/users/upload-photo`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
                withCredentials: true,
            });
            const newPhotoUrl = res.data.url;
            const updatedPhotos = [...photos, newPhotoUrl];
            setPhotos(updatedPhotos);
            await axios.put(`${API_URL}/api/users/profile`,
                { firstName, bio, photos: updatedPhotos, interests },
                { withCredentials: true }
            );
        } catch (error) {
            console.error('Error uploading photo:', error);
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    if (!user) return <div className="profile-container flex items-center justify-center">{t('common.loading')}</div>;

    return (
        <div className="profile-container container">
            <h1 className="profile-title">{t('profile.title')}</h1>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 28 }}>
                {[
                    { key: 'edit', label: '✏️ Mon profil' },
                    { key: 'photos', label: '📸 Mes photos' },
                    { key: 'activity', label: '📋 Mon activité' },
                ].map(tab => (
                    <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key)}
                        style={{
                            padding: '9px 20px', borderRadius: 20, border: 'none', cursor: 'pointer',
                            fontWeight: 600, fontSize: 14,
                            background: activeTab === tab.key ? 'linear-gradient(135deg,#e91e8c,#9c27b0)' : 'rgba(255,255,255,0.06)',
                            color: activeTab === tab.key ? '#fff' : '#aaa',
                            transition: 'all 0.2s',
                        }}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Edit profile tab */}
            {activeTab === 'edit' && (
                <div className="profile-edit-section card">
                    <h2>{t('profile.personalInfo')}</h2>
                    <form onSubmit={handleSaveProfile} className="profile-form">
                        <div className="form-group">
                            <label htmlFor="firstName">{t('auth.firstName')}</label>
                            <input type="text" id="firstName" value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
                        </div>
                        <div className="form-group">
                            <label htmlFor="bio">{t('auth.bio')}</label>
                            <textarea id="bio" value={bio} onChange={(e) => setBio(e.target.value)} rows="3" />
                        </div>
                        <div className="form-group">
                            <label>{t('auth.interests')}</label>
                            <div className="interest-tags-picker">
                                {INTERESTS_OPTIONS.map(interest => (
                                    <span
                                        key={interest}
                                        className={`interest-tag-selectable ${interests.includes(interest) ? 'active' : ''}`}
                                        onClick={() => toggleInterest(interest)}
                                    >
                                        {interest}
                                    </span>
                                ))}
                            </div>
                        </div>
                        <button type="submit" className="btn-primary" disabled={isSaving}>
                            {isSaving ? t('common.loading') : t('common.save')}
                        </button>
                    </form>
                </div>
            )}

            {/* Photos tab */}
            {activeTab === 'photos' && (
                <div className="profile-photos-section card">
                    <h2>{t('profile.myPhotos')}</h2>
                    <div className="photos-grid">
                        {photos.map((photoUrl, index) => (
                            <div key={index} className="photo-card">
                                <img src={getPhotoUrl(photoUrl)} alt={`Photo ${index + 1}`} />
                            </div>
                        ))}
                        <div className="photo-card add-photo-card" onClick={() => fileInputRef.current.click()}>
                            <div className="add-photo-icon">+</div>
                            <span>{t('profile.addPhoto')}</span>
                        </div>
                    </div>
                    <input type="file" ref={fileInputRef} onChange={handlePhotoUpload} style={{ display: 'none' }} accept="image/*" />
                    {isUploading && <p className="uploading-text">{t('common.loading')}</p>}
                </div>
            )}

            {/* Activity tab */}
            {activeTab === 'activity' && (
                <div className="card" style={{ padding: 24 }}>
                    <h2 style={{ marginBottom: 20 }}>Mon activité récente</h2>
                    {logsLoading ? (
                        <p style={{ color: '#666' }}>Chargement...</p>
                    ) : logs.length === 0 ? (
                        <p style={{ color: '#666' }}>Aucune activité enregistrée.</p>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                            {logs.map(log => {
                                const meta = ACTION_LABELS[log.action] || { label: log.action, icon: '📌', color: '#888' };
                                return (
                                    <div key={log._id} style={{
                                        display: 'flex', alignItems: 'center', gap: 14,
                                        padding: '12px 16px', borderRadius: 10,
                                        background: 'rgba(255,255,255,0.04)',
                                        borderLeft: `3px solid ${meta.color}`,
                                    }}>
                                        <span style={{ fontSize: 22 }}>{meta.icon}</span>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ color: '#fff', fontWeight: 600, fontSize: 14 }}>{meta.label}</div>
                                            {log.targetUser && (
                                                <div style={{ color: '#888', fontSize: 12 }}>avec {log.targetUser.firstName}</div>
                                            )}
                                        </div>
                                        <div style={{ color: '#555', fontSize: 12, whiteSpace: 'nowrap' }}>
                                            {new Date(log.createdAt).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default Profile;
