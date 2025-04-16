import { useState, useEffect } from 'react';
import { authService } from '../services/authService';
import { AuthResponse } from '../types/auth';

export const useAuth = () => {
    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [user, setUser] = useState<AuthResponse['user'] | null>(null);

    useEffect(() => {
        setIsLoading(true);
        const token = authService.getToken();
        if (token) {
            const storedUser = localStorage.getItem('user');
            if (storedUser) {
                try {
                    const parsedUser = JSON.parse(storedUser);
                    setUser(parsedUser);
                    setIsAuthenticated(true);
                } catch (error) {
                    console.error("Ошибка парсинга данных пользователя из localStorage:", error);
                    authService.logout(); 
                    setUser(null);
                    setIsAuthenticated(false);
                }
            } else {
                console.warn("Токен найден, но данные пользователя отсутствуют в localStorage.");
                authService.logout(); 
                setUser(null);
                setIsAuthenticated(false);
            }
        } else {
            setUser(null);
            setIsAuthenticated(false);
        }
        setIsLoading(false);
    }, []);

    const login = async (email: string, password: string) => {
        try {
            const response = await authService.login(email, password);
            setIsAuthenticated(true);
            if (response.user) {
                 localStorage.setItem('user', JSON.stringify(response.user));
                 setUser(response.user);
            }
            return response;
        } catch (error) {
            setIsAuthenticated(false);
            setUser(null);
            localStorage.removeItem('user');
            throw error;
        }
    };

    const register = async (email: string, password: string, username: string) => {
        try {
            const response = await authService.register(email, password, username);
            setIsAuthenticated(true);
            setUser(response.user);
            return response;
        } catch (error) {
            setIsAuthenticated(false);
            setUser(null);
            throw error;
        }
    };

    const telegramAuth = async (data: any) => {
        try {
            const response = await authService.telegramAuth(data);
            setIsAuthenticated(true);
            setUser(response.user);
            return response;
        } catch (error) {
            setIsAuthenticated(false);
            setUser(null);
            throw error;
        }
    };

    const logout = () => {
        authService.logout();
        setIsAuthenticated(false);
        setUser(null);
    };

    return {
        isAuthenticated,
        isLoading,
        user,
        login,
        register,
        logout,
        telegramAuth
    };
}; 