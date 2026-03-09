import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import { API_URL, getPhotoUrl } from '../config';
import './Profile.css';

const INTERESTS_OPTIONS = [
    '🎨 Art', '🍕 Gastronomie', '✈️ Voyage', '🎵 Musique', '🎬 Cinéma',
    '🏋️ Fitness', '🎮 Gaming', '📚 Lecture', '💻 Tech', '🐾 Animaux'
];

const Profile = () => {
    const { t } = useTranslation();
    const [user, setUser] = useState(null);
    const [firstName, setFirstName] = useState('');
    const [bio, setBio] = useState('');
    const [photos, setPhotos] = useState([]);
    const [interests, setInterests] = useState([]);
    const [isSaving, setIsSaving] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef();

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const res = await axios.get(`${API_URL}/api/auth/check`, { withCredentials: true });
                if (res.data.isAuthenticated) {
                    setUser(res.data.user);
                    setFirstName(res.data.user.firstName || '');
                    setBio(res.data.user.bio || '');
                    setPhotos(res.data.user.photos || []);
                    setInterests(res.data.user.interests || []);
                }
            } catch (error) {
                console.error('Error fetching user for profile:', error);
            }
        };
        fetchUser();
    }, []);

    const toggleInterest = (interest) => {
        const current = [...interests];
        const index = current.indexOf(interest);
        if (index > -1) {
            current.splice(index, 1);
        } else {
            current.push(interest);
        }
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

            <div className="profile-grid">
                <div className="profile-edit-section card">
                    <h2>{t('profile.personalInfo')}</h2>
                    <form onSubmit={handleSaveProfile} className="profile-form">
                        <div className="form-group">
                            <label htmlFor="firstName">{t('auth.firstName')}</label>
                            <input
                                type="text"
                                id="firstName"
                                value={firstName}
                                onChange={(e) => setFirstName(e.target.value)}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label htmlFor="bio">{t('auth.bio')}</label>
                            <textarea
                                id="bio"
                                value={bio}
                                onChange={(e) => setBio(e.target.value)}
                                rows="3"
                            />
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

                <div className="profile-photos-section card">
                    <h2>{t('profile.myPhotos')}</h2>
                    <div className="photos-grid">
                        {photos.map((photoUrl, index) => (
                            <div key={index} className="photo-card">
                                <img src={getPhotoUrl(photoUrl)} alt={`Publication ${index + 1}`} />
                            </div>
                        ))}
                        <div className="photo-card add-photo-card" onClick={() => fileInputRef.current.click()}>
                            <div className="add-photo-icon">+</div>
                            <span>{t('profile.addPhoto')}</span>
                        </div>
                    </div>
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handlePhotoUpload}
                        style={{ display: 'none' }}
                        accept="image/*"
                    />
                    {isUploading && <p className="uploading-text">{t('common.loading')}</p>}
                </div>
            </div>
        </div>
    );
};

export default Profile;
