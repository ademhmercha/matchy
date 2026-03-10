import { useState } from 'react';
import axios from 'axios';
import { API_URL } from '../config';

export default function ComplaintModal({ onClose }) {
    const [subject, setSubject] = useState('');
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [done, setDone] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            await axios.post(`${API_URL}/api/complaints`, { subject, message });
            setDone(true);
        } catch (err) {
            setError(err.response?.data?.message || 'Erreur lors de l\'envoi.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={styles.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
            <div style={styles.modal}>
                <button style={styles.close} onClick={onClose}>✕</button>
                <h3 style={styles.title}>📝 Soumettre une réclamation</h3>

                {done ? (
                    <div style={styles.success}>
                        <div style={{ fontSize: 40, marginBottom: 12 }}>✅</div>
                        <p>Réclamation envoyée ! Notre équipe vous répondra dès que possible.</p>
                        <button style={styles.btn} onClick={onClose}>Fermer</button>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit}>
                        <label style={styles.label}>Sujet</label>
                        <input
                            type="text"
                            placeholder="Ex: Problème de compte, bug, autre..."
                            value={subject}
                            onChange={e => setSubject(e.target.value)}
                            required
                            maxLength={100}
                            style={styles.input}
                        />

                        <label style={styles.label}>Message</label>
                        <textarea
                            placeholder="Décrivez votre problème en détail..."
                            value={message}
                            onChange={e => setMessage(e.target.value)}
                            required
                            rows={5}
                            maxLength={1000}
                            style={{ ...styles.input, resize: 'vertical', minHeight: 100 }}
                        />

                        {error && <p style={styles.error}>{error}</p>}

                        <div style={styles.actions}>
                            <button type="button" onClick={onClose} style={styles.cancelBtn}>Annuler</button>
                            <button type="submit" disabled={loading} style={styles.btn}>
                                {loading ? 'Envoi...' : 'Envoyer'}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}

const styles = {
    overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 },
    modal: { background: '#1a1a2e', borderRadius: 16, padding: 32, maxWidth: 480, width: '100%', position: 'relative', border: '1px solid rgba(233,30,140,0.3)' },
    close: { position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', color: '#aaa', fontSize: 18, cursor: 'pointer' },
    title: { color: '#fff', fontSize: 20, margin: '0 0 24px', fontWeight: 700 },
    label: { display: 'block', color: '#ccc', fontSize: 13, marginBottom: 6, fontWeight: 500 },
    input: { width: '100%', padding: '12px 14px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.05)', color: '#fff', fontSize: 14, marginBottom: 16, boxSizing: 'border-box' },
    error: { color: '#ff6b6b', fontSize: 13, margin: '-8px 0 12px' },
    actions: { display: 'flex', gap: 12, justifyContent: 'flex-end' },
    cancelBtn: { padding: '10px 20px', background: 'rgba(255,255,255,0.08)', color: '#ccc', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 14 },
    btn: { padding: '10px 24px', background: 'linear-gradient(135deg,#e91e8c,#9c27b0)', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 'bold', fontSize: 14 },
    success: { textAlign: 'center', color: '#aaa', padding: '16px 0' },
};
