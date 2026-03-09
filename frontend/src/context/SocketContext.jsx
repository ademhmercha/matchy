import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';
import { SOCKET_URL } from '../config';
import { useAuth } from './AuthContext';

const SocketContext = createContext();

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
    const [socket, setSocket] = useState(null);
    const [notifications, setNotifications] = useState([]);
    const { user: currentUser, isAuthenticated } = useAuth();
    const socketRef = useRef();

    useEffect(() => {
        if (!isAuthenticated || !currentUser) {
            if (socketRef.current) socketRef.current.disconnect();
            setSocket(null);
            return;
        }

        const newSocket = io(SOCKET_URL);
        socketRef.current = newSocket;
        setSocket(newSocket);

        newSocket.emit('register', currentUser._id);

        newSocket.on('new_match', (data) => {
            addNotification({
                id: Date.now(),
                type: 'match',
                message: `🔥 Nouveau Match avec ${data.matchName} !`,
                data: data,
                timestamp: new Date()
            });
        });

        newSocket.on('profile_updated', (data) => {
            addNotification({
                id: Date.now(),
                type: 'profile',
                message: `${data.firstName} a mis à jour son profil.`,
                data: data,
                timestamp: new Date()
            });
        });

        return () => {
            newSocket.disconnect();
        };
    }, [isAuthenticated, currentUser?._id]);

    const addNotification = (notif) => {
        setNotifications(prev => [notif, ...prev].slice(0, 10));
    };

    const clearNotifications = () => {
        setNotifications([]);
    };

    return (
        <SocketContext.Provider value={{ socket, notifications, clearNotifications, currentUser }}>
            {children}
        </SocketContext.Provider>
    );
};
