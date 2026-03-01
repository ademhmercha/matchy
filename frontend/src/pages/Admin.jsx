import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import './Admin.css';

const Admin = () => {
    const { t } = useTranslation();
    const [stats, setStats] = useState({ userCount: 0 });
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchAdminData();
    }, []);

    const fetchAdminData = async () => {
        try {
            // Intentionally omitting sophisticated error handling here for brevity since it's a demo
            const statsRes = await axios.get('http://localhost:5000/api/admin/stats', { withCredentials: true });
            const usersRes = await axios.get('http://localhost:5000/api/admin/users', { withCredentials: true });

            setStats(statsRes.data);
            setUsers(usersRes.data);
        } catch (err) {
            console.error('Admin fetching error', err);
        } finally {
            setLoading(false);
        }
    };

    const deleteUser = async (id) => {
        if (!window.confirm(t('admin.deleteConfirm'))) return;

        try {
            await axios.delete(`http://localhost:5000/api/admin/users/${id}`, { withCredentials: true });
            setUsers(users.filter(u => u._id !== id));
            setStats(prev => ({ userCount: prev.userCount - 1 }));
        } catch (err) {
            console.error('Delete failed', err);
        }
    };

    if (loading) return <div className="container min-h-screen pt-24">{t('common.loading')}</div>;

    return (
        <div className="admin-container container">
            <div className="admin-header">
                <h2 className="text-gradient">{t('admin.panelTitle')}</h2>
                <p>{t('admin.panelSubtitle')}</p>
            </div>

            <div className="admin-stats">
                <div className="stat-card">
                    <h3>{t('admin.stats.totalUsers')}</h3>
                    <div className="stat-value">{stats.userCount}</div>
                </div>
                {/* Add more stat cards as needed */}
            </div>

            <div className="admin-users-list">
                <h3>{t('admin.users.recentUsers')}</h3>
                <div className="users-table-container">
                    <table className="users-table">
                        <thead>
                            <tr>
                                <th>{t('auth.firstName')}</th>
                                <th>{t('admin.users.emailPhone')}</th>
                                <th>{t('auth.bio')}</th>
                                <th>{t('admin.users.joined')}</th>
                                <th>{t('admin.users.actions')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map(u => (
                                <tr key={u._id}>
                                    <td>{u.firstName}</td>
                                    <td>{u.emailOrPhone}</td>
                                    <td>{u.bio ? (u.bio.substring(0, 30) + '...') : '-'}</td>
                                    <td>{new Date(u.createdAt).toLocaleDateString()}</td>
                                    <td>
                                        <button onClick={() => deleteUser(u._id)} className="btn-outline delete-btn">
                                            {t('admin.users.delete')}
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {users.length === 0 && (
                                <tr>
                                    <td colSpan="5" className="text-center py-4">{t('admin.users.noUsers')}</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Admin;
