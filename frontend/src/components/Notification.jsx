import React, { useState } from 'react';
import { useSocket } from '../context/SocketContext';
import { useTranslation } from 'react-i18next';
import './Notification.css';

const Notification = ({ onShowProfile }) => {
    const { t } = useTranslation();
    const { notifications, clearNotifications } = useSocket();
    const [isOpen, setIsOpen] = useState(false);

    const handleNotifClick = (notif) => {
        const userId = notif.type === 'match' ? notif.data.matchId : notif.data.userId;
        if (userId) onShowProfile(userId);
        setIsOpen(false);
    };

    const unreadCount = notifications.length;

    return (
        <div className="notification-wrapper">
            <div className="notification-icon" onClick={() => setIsOpen(!isOpen)}>
                <span>🔔</span>
                {unreadCount > 0 && <span className="notification-badge">{unreadCount}</span>}
            </div>

            {isOpen && (
                <div className="notification-dropdown card">
                    <div className="notification-header">
                        <h3>{t('chat.notifications')}</h3>
                        {unreadCount > 0 && <button onClick={clearNotifications} className="btn-text">{t('chat.clearAll')}</button>}
                    </div>
                    <div className="notification-list">
                        {notifications.length === 0 ? (
                            <p className="no-notifications">{t('chat.noNotifications')}</p>
                        ) : (
                            notifications.map(notif => (
                                <div key={notif.id} className="notification-item" onClick={() => handleNotifClick(notif)}>
                                    <div className="notification-content">
                                        <p>{notif.message}</p>
                                        <span className="notification-time">
                                            {new Date(notif.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                    {notif.type === 'match' && (
                                        <div className="notification-avatar">
                                            <img src={`http://localhost:5000${notif.data.matchPhoto}`} alt="Match" />
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default Notification;
