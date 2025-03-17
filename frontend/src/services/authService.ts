import { AuthResponse, TelegramAuthRequest } from '../types/auth';
import { JwtService } from './jwtService';

const jwtService = JwtService.getInstance();
const axiosInstance = jwtService.getAxiosInstance();

export const authService = {
    async register(email: string, password: string, username: string): Promise<AuthResponse> {
        const response = await axiosInstance.post('/api/auth/register', {
            email,
            password,
            username
        });
        if (response.data.token) {
            localStorage.setItem('token', response.data.token);
        }
        return response.data;
    },

    async login(email: string, password: string): Promise<AuthResponse> {
        const response = await axiosInstance.post('/api/auth/login', { 
            email, 
            password 
        });
        if (response.data.token) {
            localStorage.setItem('token', response.data.token);
        }
        return response.data;
    },

    async telegramAuth(data: TelegramAuthRequest): Promise<AuthResponse> {
        const response = await axiosInstance.post('/api/auth/telegram', data);
        if (response.data.token) {
            localStorage.setItem('token', response.data.token);
        }
        return response.data;
    },

    logout() {
        localStorage.removeItem('token');
        window.location.href = '/login';
    },

    isAuthenticated(): boolean {
        return !!localStorage.getItem('token');
    },

    getToken(): string | null {
        return localStorage.getItem('token');
    }
};

export const refreshToken = async (): Promise<string> => {
    try {
        const response = await axiosInstance.post('/api/auth/refresh', {}, {
            withCredentials: true
        });
        
        const newToken = response.data.token;
        localStorage.setItem('token', newToken);
        return newToken;
    } catch (error) {
        console.error('Failed to refresh token:', error);
        localStorage.removeItem('token');
        window.location.href = '/login';
        throw error;
    }
}; 