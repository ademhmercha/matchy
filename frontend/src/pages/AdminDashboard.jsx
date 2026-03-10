import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import { API_URL } from '../config';
import './AdminDashboard.css';

const COMPLAINT_STATUS_LABELS = {
    pending: { label: 'En attente', color: '#ffc107' },
    in_review: { label: 'En cours', color: '#2196f3' },
    resolved: { label: 'Résolu', color: '#4caf50' },
    rejected: { label: 'Rejeté', color: '#f44336' },
};

const AdminDashboard = () => {
    const { t } = useTranslation();
    const [activeTab, setActiveTab] = useState('stats');
    const [stats, setStats] = useState(null);
    const [logs, setLogs] = useState([]);
    const [reports, setReports] = useState([]);
    const [users, setUsers] = useState([]);
    const [complaints, setComplaints] = useState([]);
    const [loading, setLoading] = useState(true);
    const [deleteConfirm, setDeleteConfirm] = useState(null); // userId to confirm delete
    const [complaintFilter, setComplaintFilter] = useState('');
    const [respondingTo, setRespondingTo] = useState(null); // complaintId
    const [responseText, setResponseText] = useState('');
    const [responseStatus, setResponseStatus] = useState('resolved');

    useEffect(() => {
        fetchData();
    }, [activeTab]);

    const fetchData = async () => {
        setLoading(true);
        try {
            if (activeTab === 'complaints') {
                const res = await axios.get(`${API_URL}/api/admin/complaints`);
                setComplaints(Array.isArray(res.data) ? res.data : []);
            } else {
                const res = await axios.get(`${API_URL}/api/admin/${activeTab}`, { withCredentials: true });
                if (activeTab === 'stats') setStats(res.data);
                else if (activeTab === 'logs') setLogs(Array.isArray(res.data?.logs) ? res.data.logs : []);
                else if (activeTab === 'reports') setReports(Array.isArray(res.data) ? res.data : []);
                else if (activeTab === 'users') setUsers(Array.isArray(res.data) ? res.data : []);
            }
        } catch (err) {
            console.error('Error fetching admin data:', err);
            if (err.response?.status === 403) alert(t('admin.accessDenied'));
        }
        setLoading(false);
    };

    const handleUserStatus = async (userId, currentStatus) => {
        const newStatus = currentStatus === 'active' ? 'banned' : 'active';
        try {
            await axios.post(`${API_URL}/api/admin/users/${userId}/status`, { status: newStatus }, { withCredentials: true });
            fetchData();
        } catch {
            alert(t('admin.statusUpdateError'));
        }
    };

    const handleDeleteUser = async (userId) => {
        try {
            await axios.delete(`${API_URL}/api/admin/users/${userId}`);
            setDeleteConfirm(null);
            fetchData();
        } catch {
            alert('Erreur lors de la suppression.');
        }
    };

    const handleComplaintResponse = async (complaintId) => {
        try {
            await axios.put(`${API_URL}/api/admin/complaints/${complaintId}`, {
                status: responseStatus,
                adminResponse: responseText,
            });
            setRespondingTo(null);
            setResponseText('');
            fetchData();
        } catch {
            alert('Erreur lors de la réponse.');
        }
    };

    const filteredComplaints = complaintFilter
        ? complaints.filter(c => c.status === complaintFilter)
        : complaints;

    return (
        <div className="admin-dashboard">
            {/* Delete confirmation dialog */}
            {deleteConfirm && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <div style={{ background: '#1a1a2e', borderRadius: 12, padding: 32, maxWidth: 360, width: '90%', textAlign: 'center', border: '1px solid #f44336' }}>
                        <h3 style={{ color: '#fff', marginBottom: 12 }}>⚠️ Supprimer cet utilisateur ?</h3>
                        <p style={{ color: '#aaa', marginBottom: 24, fontSize: 14 }}>Cette action est irréversible. Tous ses messages et données seront supprimés.</p>
                        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
                            <button onClick={() => setDeleteConfirm(null)} style={{ padding: '10px 20px', background: 'rgba(255,255,255,0.08)', color: '#ccc', border: 'none', borderRadius: 8, cursor: 'pointer' }}>Annuler</button>
                            <button onClick={() => handleDeleteUser(deleteConfirm)} style={{ padding: '10px 20px', background: '#f44336', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 'bold' }}>Supprimer</button>
                        </div>
                    </div>
                </div>
            )}

            <header className="admin-header">
                <h1>{t('admin.panelTitle')}</h1>
                <nav className="admin-nav">
                    <button className={activeTab === 'stats' ? 'active' : ''} onClick={() => setActiveTab('stats')}>📊 {t('admin.tabs.stats')}</button>
                    <button className={activeTab === 'users' ? 'active' : ''} onClick={() => setActiveTab('users')}>👥 {t('admin.tabs.users')}</button>
                    <button className={activeTab === 'logs' ? 'active' : ''} onClick={() => setActiveTab('logs')}>📜 {t('admin.tabs.logs')}</button>
                    <button className={activeTab === 'reports' ? 'active' : ''} onClick={() => setActiveTab('reports')}>🚩 {t('admin.tabs.reports')}</button>
                    <button className={activeTab === 'complaints' ? 'active' : ''} onClick={() => setActiveTab('complaints')}>📝 Réclamations</button>
                </nav>
            </header>

            <main className="admin-content">
                {loading ? (
                    <div className="loader">{t('common.loading')}</div>
                ) : (
                    <>
                        {activeTab === 'stats' && stats && (
                            <div className="stats-grid">
                                <div className="stat-card"><h3>{t('admin.stats.totalUsers')}</h3><p>{stats.totalUsers}</p></div>
                                <div className="stat-card"><h3>{t('admin.stats.active')}</h3><p className="success">{stats.activeUsers}</p></div>
                                <div className="stat-card"><h3>{t('admin.stats.banned')}</h3><p className="danger">{stats.bannedUsers}</p></div>
                                <div className="stat-card"><h3>En attente email</h3><p className="warning">{stats.pendingUsers ?? 0}</p></div>
                                <div className="stat-card"><h3>{t('admin.stats.pendingReports')}</h3><p className="warning">{stats.pendingReports} / {stats.totalReports}</p></div>
                                <div className="stat-card"><h3>Réclamations en attente</h3><p className="warning">{stats.pendingComplaints ?? 0}</p></div>
                                <div className="stat-card"><h3>{t('admin.stats.messages')}</h3><p>{stats.totalMessages}</p></div>
                                <div className="stat-card"><h3>{t('admin.stats.matches')}</h3><p>{stats.totalMatches}</p></div>
                            </div>
                        )}

                        {activeTab === 'users' && (
                            <div className="admin-table-container">
                                <table className="admin-table">
                                    <thead>
                                        <tr>
                                            <th>{t('admin.users.name')}</th>
                                            <th>{t('admin.users.emailPhone')}</th>
                                            <th>{t('admin.users.role')}</th>
                                            <th>{t('admin.users.status')}</th>
                                            <th>{t('admin.users.joined')}</th>
                                            <th>{t('admin.users.actions')}</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {Array.isArray(users) && users.map(user => (
                                            <tr key={user._id}>
                                                <td>{user.firstName}</td>
                                                <td>{user.emailOrPhone}</td>
                                                <td><span className={`badge ${user.role}`}>{user.role}</span></td>
                                                <td><span className={`status-dot ${user.status}`}></span> {user.status}</td>
                                                <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                                                <td style={{ display: 'flex', gap: 8 }}>
                                                    <button
                                                        className={user.status === 'active' ? 'btn-ban' : 'btn-unban'}
                                                        onClick={() => handleUserStatus(user._id, user.status)}
                                                    >
                                                        {user.status === 'active' ? t('admin.users.ban') : t('admin.users.unban')}
                                                    </button>
                                                    {user.role !== 'admin' && (
                                                        <button
                                                            style={{ background: '#f44336', color: '#fff', border: 'none', borderRadius: 6, padding: '4px 12px', cursor: 'pointer', fontSize: 13 }}
                                                            onClick={() => setDeleteConfirm(user._id)}
                                                        >
                                                            Supprimer
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {activeTab === 'logs' && (
                            <div className="logs-list">
                                {Array.isArray(logs) && logs.map(log => (
                                    <div key={log._id} className="log-item">
                                        <span className="log-time">{new Date(log.createdAt).toLocaleString()}</span>
                                        <span className="log-user">{log.performedBy?.firstName || t('admin.users.unknown')}</span>
                                        <span className={`log-action action-${log.action.toLowerCase()}`}>{log.action}</span>
                                        <span className="log-details">{JSON.stringify(log.details)}</span>
                                        {log.targetUser && <span className="log-target">@ {log.targetUser.firstName}</span>}
                                    </div>
                                ))}
                            </div>
                        )}

                        {activeTab === 'reports' && (
                            <div className="reports-list">
                                {(!Array.isArray(reports) || reports.length === 0) ? <p>{t('admin.reports.noReports')}</p> : reports.map(report => (
                                    <div key={report._id} className={`report-item status-${report.status}`}>
                                        <div className="report-header">
                                            {t('admin.reports.reportedBy', { reporter: report.reporter?.firstName, reported: report.reportedUser?.firstName })}
                                            <span className="report-date">{new Date(report.createdAt).toLocaleDateString()}</span>
                                        </div>
                                        <div className="report-reason">{t('admin.reports.reason')}: {report.reason}</div>
                                        {report.evidence && (
                                            <div className="report-evidence">
                                                <img src={`${API_URL}${report.evidence}`} alt="Evidence" className="admin-report-img" />
                                            </div>
                                        )}
                                        <div className="report-actions">
                                            {report.reportedUser?.status === 'active' && (
                                                <button className="btn-ban" onClick={() => handleUserStatus(report.reportedUser._id, 'active')}>{t('admin.reports.banUser')}</button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {activeTab === 'complaints' && (
                            <div>
                                {/* Filter bar */}
                                <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
                                    {['', 'pending', 'in_review', 'resolved', 'rejected'].map(s => (
                                        <button
                                            key={s}
                                            onClick={() => setComplaintFilter(s)}
                                            style={{
                                                padding: '6px 16px', borderRadius: 20, border: 'none', cursor: 'pointer', fontWeight: 500, fontSize: 13,
                                                background: complaintFilter === s ? '#e91e8c' : 'rgba(255,255,255,0.08)',
                                                color: complaintFilter === s ? '#fff' : '#ccc',
                                            }}
                                        >
                                            {s === '' ? 'Toutes' : COMPLAINT_STATUS_LABELS[s]?.label}
                                        </button>
                                    ))}
                                </div>

                                {filteredComplaints.length === 0 ? (
                                    <p style={{ color: '#666' }}>Aucune réclamation.</p>
                                ) : filteredComplaints.map(c => (
                                    <div key={c._id} style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 12, padding: 20, marginBottom: 16, border: '1px solid rgba(255,255,255,0.08)' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8 }}>
                                            <div>
                                                <span style={{ color: '#fff', fontWeight: 600 }}>{c.userId?.firstName}</span>
                                                <span style={{ color: '#666', fontSize: 13, marginLeft: 8 }}>{c.userId?.emailOrPhone}</span>
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                <span style={{ fontSize: 12, padding: '3px 10px', borderRadius: 12, background: 'rgba(0,0,0,0.3)', color: COMPLAINT_STATUS_LABELS[c.status]?.color }}>
                                                    {COMPLAINT_STATUS_LABELS[c.status]?.label}
                                                </span>
                                                <span style={{ color: '#555', fontSize: 12 }}>{new Date(c.createdAt).toLocaleDateString()}</span>
                                            </div>
                                        </div>
                                        <div style={{ color: '#e91e8c', fontWeight: 600, marginTop: 12, marginBottom: 4 }}>{c.subject}</div>
                                        <p style={{ color: '#bbb', fontSize: 14, margin: 0, lineHeight: 1.5 }}>{c.message}</p>

                                        {c.adminResponse && (
                                            <div style={{ marginTop: 12, padding: 12, background: 'rgba(233,30,140,0.08)', borderRadius: 8, borderLeft: '3px solid #e91e8c' }}>
                                                <div style={{ color: '#e91e8c', fontSize: 12, marginBottom: 4, fontWeight: 600 }}>Réponse admin :</div>
                                                <p style={{ color: '#ccc', fontSize: 13, margin: 0 }}>{c.adminResponse}</p>
                                            </div>
                                        )}

                                        {respondingTo === c._id ? (
                                            <div style={{ marginTop: 14 }}>
                                                <select
                                                    value={responseStatus}
                                                    onChange={e => setResponseStatus(e.target.value)}
                                                    style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.15)', background: '#1a1a2e', color: '#fff', marginBottom: 10, width: '100%' }}
                                                >
                                                    <option value="in_review">En cours d'examen</option>
                                                    <option value="resolved">Résolu</option>
                                                    <option value="rejected">Rejeté</option>
                                                </select>
                                                <textarea
                                                    placeholder="Votre réponse à l'utilisateur..."
                                                    value={responseText}
                                                    onChange={e => setResponseText(e.target.value)}
                                                    rows={3}
                                                    style={{ width: '100%', padding: 12, borderRadius: 8, border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.05)', color: '#fff', resize: 'vertical', boxSizing: 'border-box', marginBottom: 10 }}
                                                />
                                                <div style={{ display: 'flex', gap: 8 }}>
                                                    <button onClick={() => setRespondingTo(null)} style={{ padding: '8px 16px', background: 'rgba(255,255,255,0.08)', color: '#ccc', border: 'none', borderRadius: 8, cursor: 'pointer' }}>Annuler</button>
                                                    <button onClick={() => handleComplaintResponse(c._id)} style={{ padding: '8px 20px', background: 'linear-gradient(135deg,#e91e8c,#9c27b0)', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 'bold' }}>Envoyer</button>
                                                </div>
                                            </div>
                                        ) : (
                                            <button
                                                onClick={() => { setRespondingTo(c._id); setResponseText(c.adminResponse || ''); setResponseStatus(c.status === 'pending' ? 'in_review' : c.status); }}
                                                style={{ marginTop: 14, padding: '7px 18px', background: 'rgba(233,30,140,0.15)', color: '#e91e8c', border: '1px solid rgba(233,30,140,0.3)', borderRadius: 8, cursor: 'pointer', fontSize: 13 }}
                                            >
                                                Répondre
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </>
                )}
            </main>
        </div>
    );
};

export default AdminDashboard;
