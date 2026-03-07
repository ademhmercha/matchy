import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';
import axios from 'axios';
import { API_URL } from '../config';

const SocketContext = createContext();

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
    const [socket, setSocket] = useState(null);
    const [notifications, setNotifications] = useState([]);
    const [currentUser, setCurrentUser] = useState(null);
    const socketRef = useRef();

    useEffect(() => {
        // Fetch current user and initialize socket (401 = pas connecté, on ne log pas d'erreur)
        const initSocket = async () => {
            try {
                const res = await axios.get(`${API_URL}/api/auth/check`, {
                    withCredentials: true,
                    validateStatus: (status) => status === 200 || status === 401,
                });
                if (res.status === 200 && res.data?.isAuthenticated) {
                    const user = res.data.user;
                    setCurrentUser(user);

                    const newSocket = io(API_URL);
                    socketRef.current = newSocket;
                    setSocket(newSocket);

                    newSocket.emit('register', user._id);

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
                }
            } catch (err) {
                // 401 = pas connecté, c'est normal → pas d'erreur en console
                if (err.response?.status !== 401) {
                    console.error('Socket initialization error:', err);
                }
            }
        };

        initSocket();

        return () => {
            if (socketRef.current) socketRef.current.disconnect();
        };
    }, []);

    const addNotification = (notif) => {
        setNotifications(prev => [notif, ...prev].slice(0, 10)); // Keep last 10
    };

    const clearNotifications = () => {
        setNotifications([]);
    };

    return (
        <SocketContext.Provider value={{ socket, notifications, clearNotifications, currentUser, setCurrentUser }}>
            {children}
        </SocketContext.Provider>
    );
};
