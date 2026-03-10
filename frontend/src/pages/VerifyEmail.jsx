import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { API_URL } from '../config';

export default function VerifyEmail() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { login } = useAuth();
    const [status, setStatus] = useState('loading'); // loading | success | error

    useEffect(() => {
        const token = searchParams.get('token');
        if (!token) { setStatus('error'); return; }

        axios.get(`${API_URL}/api/auth/verify-email?token=${token}`)
            .then(res => {
                login(res.data.token, res.data.user);
                setStatus('success');
                setTimeout(() => navigate('/app'), 2000);
            })
            .catch(() => setStatus('error'));
    }, []);

    return (
        <div style={styles.page}>
            <div style={styles.card}>
                {status === 'loading' && (
                    <>
                        <div style={styles.spinner} />
                        <p style={styles.text}>Vérification en cours...</p>
                    </>
                )}
                {status === 'success' && (
                    <>
                        <div style={styles.icon}>✅</div>
                        <h2 style={styles.title}>Email vérifié !</h2>
                        <p style={styles.text}>Votre compte est activé. Redirection...</p>
                    </>
                )}
                {status === 'error' && (
                    <>
                        <div style={styles.icon}>❌</div>
                        <h2 style={styles.title}>Lien invalide</h2>
                        <p style={styles.text}>Ce lien est expiré ou invalide.</p>
                        <button style={styles.btn} onClick={() => navigate('/login')}>
                            Retour à la connexion
                        </button>
                    </>
                )}
            </div>
        </div>
    );
}

const styles = {
    page: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0f0f1a' },
    card: { background: '#1a1a2e', borderRadius: 16, padding: '48px 40px', textAlign: 'center', maxWidth: 400, width: '90%', border: '1px solid rgba(233,30,140,0.2)' },
    icon: { fontSize: 48, marginBottom: 16 },
    title: { color: '#fff', fontSize: 24, margin: '0 0 12px' },
    text: { color: '#aaa', margin: '0 0 24px' },
    spinner: { width: 40, height: 40, border: '3px solid rgba(233,30,140,0.3)', borderTop: '3px solid #e91e8c', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' },
    btn: { background: 'linear-gradient(135deg,#e91e8c,#9c27b0)', color: '#fff', border: 'none', borderRadius: 8, padding: '12px 28px', cursor: 'pointer', fontWeight: 'bold', fontSize: 15 },
};
