import React, { useState, useRef } from 'react';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import './ReportModal.css';

const ReportModal = ({ reportedUserId, reportedUserName, onClose }) => {
    const { t } = useTranslation();
    const [reason, setReason] = useState('harassment');
    const [details, setDetails] = useState('');
    const [evidence, setEvidence] = useState(null);
    const [evidencePreview, setEvidencePreview] = useState('');
    const [loading, setLoading] = useState(false);
    const fileInputRef = useRef();

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setEvidence(file);
        setEvidencePreview(URL.createObjectURL(file));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            let photoUrl = '';
            if (evidence) {
                const formData = new FormData();
                formData.append('photo', evidence);
                const uploadRes = await axios.post('http://localhost:5000/api/users/upload-photo', formData, {
                    withCredentials: true,
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                photoUrl = uploadRes.data.url;
            }

            await axios.post('http://localhost:5000/api/users/report', {
                reportedUserId,
                reason: `${reason}: ${details}`,
                evidence: photoUrl
            }, { withCredentials: true });

            alert(t('chat.reportSuccess'));
            onClose();
        } catch (error) {
            console.error('Error reporting user:', error);
            alert(t('common.error'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose} style={{ zIndex: 3000 }}>
            <div className="modal-content report-modal" onClick={e => e.stopPropagation()}>
                <div className="report-modal-header">
                    <h3>{t('chat.report')}</h3>
                    <p>{t('chat.reportingUser', { name: reportedUserName })}</p>
                </div>

                <form onSubmit={handleSubmit} className="report-form">
                    <div className="form-group">
                        <label className="form-label">{t('chat.reportReasonLabel')}</label>
                        <select
                            className="reason-select"
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                        >
                            <option value="harassment">{t('chat.reasons.harassment')}</option>
                            <option value="fake">{t('chat.reasons.fake')}</option>
                            <option value="offensive">{t('chat.reasons.offensive')}</option>
                            <option value="spam">{t('chat.reasons.spam')}</option>
                            <option value="other">{t('chat.reasons.other')}</option>
                        </select>
                    </div>

                    <div className="form-group">
                        <label className="form-label">{t('chat.reportDetailsLabel')}</label>
                        <textarea
                            className="report-textarea"
                            placeholder={t('chat.reportReasonPlaceholder')}
                            value={details}
                            onChange={(e) => setDetails(e.target.value)}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">{t('chat.reportEvidenceLabel')}</label>
                        <div
                            className={`evidence-upload ${evidence ? 'has-file' : ''}`}
                            onClick={() => fileInputRef.current.click()}
                        >
                            <input
                                type="file"
                                ref={fileInputRef}
                                style={{ display: 'none' }}
                                onChange={handleFileChange}
                                accept="image/*"
                            />
                            {evidencePreview ? (
                                <img src={evidencePreview} alt="Preview" className="evidence-preview" />
                            ) : (
                                <>
                                    <span className="upload-icon">📸</span>
                                    <span className="upload-text">{t('chat.reportUploadScreenshot')}</span>
                                </>
                            )}
                        </div>
                    </div>

                    <div className="flex flex-col gap-3">
                        <button type="submit" className="report-submit-btn" disabled={loading}>
                            {loading ? t('common.loading') : t('chat.submitReport')}
                        </button>
                        <button type="button" className="btn-cancel" onClick={onClose}>
                            {t('common.cancel')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ReportModal;
