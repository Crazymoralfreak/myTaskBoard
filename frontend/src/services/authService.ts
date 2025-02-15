import { api } from '../api/api';
import { AuthResponse, TelegramAuthRequest } from '../types/auth';

export const authService = {
    async register(email: string, password: string): Promise<AuthResponse> {
        const response = await api.post<AuthResponse>('/auth/register', { 
            email, 
            password 
        });
        return response.data;
    },

    async login(email: string, password: string): Promise<AuthResponse> {
        const response = await api.post<AuthResponse>('/auth/login', { email, password });
        return response.data;
    },

    async telegramAuth(data: TelegramAuthRequest): Promise<AuthResponse> {
        const response = await api.post<AuthResponse>('/auth/telegram', data);
        return response.data;
    },

    logout() {
        localStorage.removeItem('token');
    }
}; 