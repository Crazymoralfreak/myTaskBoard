import axios from 'axios';
import { AuthResponse, TelegramAuthRequest } from '../types/auth';

const API_URL = '/api/auth';

const axiosInstance = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    },
    withCredentials: true
});

export const authService = {
    async register(email: string, password: string, username: string): Promise<AuthResponse> {
        const response = await axiosInstance.post('/register', {
            email,
            password,
            username
        });
        return response.data;
    },

    async login(email: string, password: string): Promise<AuthResponse> {
        const response = await axiosInstance.post('/login', { 
            email, 
            password 
        });
        return response.data;
    },

    async telegramAuth(data: TelegramAuthRequest): Promise<AuthResponse> {
        const response = await axiosInstance.post('/telegram', data);
        return response.data;
    },

    logout() {
        localStorage.removeItem('token');
    }
}; 