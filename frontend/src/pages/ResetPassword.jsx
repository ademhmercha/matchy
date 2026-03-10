import { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_URL } from '../config';

const checks = [
    { label: '8 caractères minimum', test: p => p.length >= 8 },
    { label: 'Une majuscule', test: p => /[A-Z]/.test(p) },
    { label: 'Un chiffre', test: p => /\d/.test(p) },
    { label: 'Un caractère spécial', test: p => /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(p) },
];

export default function ResetPassword() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const token = searchParams.get('token');

    const [password, setPassword] = useState('');
    const [confirm, setConfirm] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [done, setDone] = useState(false);

    const allValid = checks.every(c => c.test(password));

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!allValid) { setError('Le mot de passe ne respecte pas les critères.'); return; }
        if (password !== confirm) { setError('Les mots de passe ne correspondent pas.'); return; }
        setLoading(true);
        setError('');
        try {
            await axios.post(`${API_URL}/api/auth/reset-password`, { token, newPassword: password });
            setDone(true);
            setTimeout(() => navigate('/login'), 2500);
        } catch (err) {
            setError(err.response?.data?.message || 'Lien invalide ou expiré.');
        } finally {
            setLoading(false);
        }
    };

    if (!token) return (
        <div style={styles.page}><div style={styles.card}><p style={styles.error}>Lien invalide.</p></div></div>
    );

    return (
        <div style={styles.page}>
            <div style={styles.card}>
                <h2 style={styles.title}>💕 Matchy</h2>
                <h3 style={styles.subtitle}>Nouveau mot de passe</h3>

                {done ? (
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: 40, marginBottom: 12 }}>✅</div>
                        <p style={{ color: '#aaa' }}>Mot de passe réinitialisé ! Redirection...</p>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit}>
                        <input
                            type="password"
                            placeholder="Nouveau mot de passe"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            required
                            style={styles.input}
                        />

                        {/* Password strength checklist */}
                        <div style={styles.checklist}>
                            {checks.map(c => (
                                <div key={c.label} style={{ ...styles.checkItem, color: c.test(password) ? '#4caf50' : '#666' }}>
                                    {c.test(password) ? '✓' : '○'} {c.label}
                                </div>
                            ))}
                        </div>

                        <input
                            type="password"
                            placeholder="Confirmer le mot de passe"
                            value={confirm}
                            onChange={e => setConfirm(e.target.value)}
                            required
                            style={{ ...styles.input, marginTop: 8 }}
                        />

                        {error && <p style={styles.error}>{error}</p>}

                        <button type="submit" disabled={loading || !allValid} style={{ ...styles.btn, opacity: (!allValid || loading) ? 0.6 : 1 }}>
                            {loading ? 'Réinitialisation...' : 'Réinitialiser'}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
}

const styles = {
    page: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0f0f1a' },
    card: { background: '#1a1a2e', borderRadius: 16, padding: '48px 40px', maxWidth: 420, width: '90%', border: '1px solid rgba(233,30,140,0.2)' },
    title: { color: '#e91e8c', fontSize: 28, margin: '0 0 8px', fontWeight: 800, textAlign: 'center' },
    subtitle: { color: '#fff', fontSize: 20, margin: '0 0 24px', fontWeight: 600, textAlign: 'center' },
    input: { width: '100%', padding: '14px 16px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.05)', color: '#fff', fontSize: 15, marginBottom: 4, boxSizing: 'border-box' },
    checklist: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, margin: '8px 0 12px', padding: '12px', background: 'rgba(0,0,0,0.2)', borderRadius: 8 },
    checkItem: { fontSize: 12, transition: 'color 0.2s' },
    btn: { width: '100%', padding: '14px', background: 'linear-gradient(135deg,#e91e8c,#9c27b0)', color: '#fff', border: 'none', borderRadius: 10, fontWeight: 'bold', fontSize: 16, cursor: 'pointer', marginTop: 12 },
    error: { color: '#ff6b6b', fontSize: 13, margin: '8px 0' },
};
