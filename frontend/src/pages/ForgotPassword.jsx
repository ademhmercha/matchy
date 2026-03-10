import { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { API_URL } from '../config';

export default function ForgotPassword() {
    const [emailOrPhone, setEmailOrPhone] = useState('');
    const [sent, setSent] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            await axios.post(`${API_URL}/api/auth/forgot-password`, { emailOrPhone });
            setSent(true);
        } catch {
            setError('Une erreur est survenue. Réessayez.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={styles.page}>
            <div style={styles.card}>
                <h2 style={styles.title}>💕 Matchy</h2>
                <h3 style={styles.subtitle}>Mot de passe oublié</h3>

                {sent ? (
                    <div style={styles.successBox}>
                        <div style={{ fontSize: 40, marginBottom: 12 }}>📧</div>
                        <p style={styles.successText}>Email envoyé ! Vérifiez votre boîte de réception pour réinitialiser votre mot de passe.</p>
                        <Link to="/login" style={styles.link}>Retour à la connexion</Link>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit}>
                        <p style={styles.desc}>Entrez votre email ou numéro de téléphone. Nous vous enverrons un lien de réinitialisation.</p>
                        <input
                            type="text"
                            placeholder="Email ou téléphone"
                            value={emailOrPhone}
                            onChange={e => setEmailOrPhone(e.target.value)}
                            required
                            style={styles.input}
                        />
                        {error && <p style={styles.error}>{error}</p>}
                        <button type="submit" disabled={loading} style={styles.btn}>
                            {loading ? 'Envoi...' : 'Envoyer le lien'}
                        </button>
                        <Link to="/login" style={styles.link}>Retour à la connexion</Link>
                    </form>
                )}
            </div>
        </div>
    );
}

const styles = {
    page: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0f0f1a' },
    card: { background: '#1a1a2e', borderRadius: 16, padding: '48px 40px', maxWidth: 420, width: '90%', border: '1px solid rgba(233,30,140,0.2)', textAlign: 'center' },
    title: { color: '#e91e8c', fontSize: 28, margin: '0 0 8px', fontWeight: 800 },
    subtitle: { color: '#fff', fontSize: 20, margin: '0 0 16px', fontWeight: 600 },
    desc: { color: '#aaa', fontSize: 14, margin: '0 0 20px', lineHeight: 1.5 },
    input: { width: '100%', padding: '14px 16px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.05)', color: '#fff', fontSize: 15, marginBottom: 12, boxSizing: 'border-box' },
    btn: { width: '100%', padding: '14px', background: 'linear-gradient(135deg,#e91e8c,#9c27b0)', color: '#fff', border: 'none', borderRadius: 10, fontWeight: 'bold', fontSize: 16, cursor: 'pointer', marginBottom: 16 },
    error: { color: '#ff6b6b', fontSize: 13, margin: '0 0 12px' },
    link: { display: 'block', color: '#e91e8c', textDecoration: 'none', fontSize: 14, marginTop: 8 },
    successBox: { color: '#fff' },
    successText: { color: '#aaa', fontSize: 14, lineHeight: 1.6, marginBottom: 20 },
};
