import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { API_URL } from '../config';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            setIsLoading(false);
            return;
        }
        axios.get(`${API_URL}/api/auth/check`, {
            validateStatus: (s) => s === 200 || s === 401,
        }).then((res) => {
            if (res.status === 200 && res.data?.isAuthenticated) {
                setUser(res.data.user);
                setIsAuthenticated(true);
            } else {
                localStorage.removeItem('token');
            }
        }).catch(() => {
            localStorage.removeItem('token');
        }).finally(() => {
            setIsLoading(false);
        });
    }, []);

    const login = (token, userData) => {
        localStorage.setItem('token', token);
        setUser(userData);
        setIsAuthenticated(true);
    };

    const logout = () => {
        localStorage.removeItem('token');
        setUser(null);
        setIsAuthenticated(false);
    };

    return (
        <AuthContext.Provider value={{ user, isAuthenticated, isLoading, login, logout, setUser }}>
            {children}
        </AuthContext.Provider>
    );
};
