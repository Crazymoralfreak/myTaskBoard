import { useState, useEffect } from 'react';
import { authService } from '../services/authService';
import { AuthResponse } from '../types/auth';

export const useAuth = () => {
    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [user, setUser] = useState<AuthResponse['user'] | null>(null);

    useEffect(() => {
        const token = authService.getToken();
        setIsAuthenticated(!!token);
        setIsLoading(false);
    }, []);

    const login = async (email: string, password: string) => {
        try {
            const response = await authService.login(email, password);
            setIsAuthenticated(true);
            setUser(response.user);
            return response;
        } catch (error) {
            setIsAuthenticated(false);
            setUser(null);
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