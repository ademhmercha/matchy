import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import { API_URL } from '../config';
import './AdminDashboard.css';

const AdminDashboard = () => {
    const { t } = useTranslation();
    const [activeTab, setActiveTab] = useState('stats');
    const [stats, setStats] = useState(null);
    const [logs, setLogs] = useState([]);
    const [reports, setReports] = useState([]);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, [activeTab]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const endpoint = `${API_URL}/api/admin/${activeTab}`;
            const res = await axios.get(endpoint, { withCredentials: true });

            if (activeTab === 'stats') setStats(res.data);
            else if (activeTab === 'logs') setLogs(Array.isArray(res.data?.logs) ? res.data.logs : []);
            else if (activeTab === 'reports') setReports(Array.isArray(res.data) ? res.data : []);
            else if (activeTab === 'users') setUsers(Array.isArray(res.data) ? res.data : []);
        } catch (err) {
            console.error('Error fetching admin data:', err);
            if (err.response?.status === 403) {
                alert(t('admin.accessDenied'));
            }
        }
        setLoading(false);
    };

    const handleUserStatus = async (userId, currentStatus) => {
        const newStatus = currentStatus === 'active' ? 'banned' : 'active';
        try {
            await axios.post(`${API_URL}/api/admin/users/${userId}/status`, { status: newStatus }, { withCredentials: true });
            fetchData();
        } catch (err) {
            alert(t('admin.statusUpdateError'));
        }
    };

    return (
        <div className="admin-dashboard">
            <header className="admin-header">
                <h1>{t('admin.panelTitle')}</h1>
                <nav className="admin-nav">
                    <button className={activeTab === 'stats' ? 'active' : ''} onClick={() => setActiveTab('stats')}>📊 {t('admin.tabs.stats')}</button>
                    <button className={activeTab === 'users' ? 'active' : ''} onClick={() => setActiveTab('users')}>👥 {t('admin.tabs.users')}</button>
                    <button className={activeTab === 'logs' ? 'active' : ''} onClick={() => setActiveTab('logs')}>📜 {t('admin.tabs.logs')}</button>
                    <button className={activeTab === 'reports' ? 'active' : ''} onClick={() => setActiveTab('reports')}>🚩 {t('admin.tabs.reports')}</button>
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
                                <div className="stat-card"><h3>{t('admin.stats.pendingReports')}</h3><p className="warning">{stats.pendingReports} / {stats.totalReports}</p></div>
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
                                                <td>
                                                    <button
                                                        className={user.status === 'active' ? 'btn-ban' : 'btn-unban'}
                                                        onClick={() => handleUserStatus(user._id, user.status)}
                                                    >
                                                        {user.status === 'active' ? t('admin.users.ban') : t('admin.users.unban')}
                                                    </button>
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
                    </>
                )}
            </main>
        </div>
    );
};

export default AdminDashboard;
