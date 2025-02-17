import axios from 'axios';
import { AuthResponse, TelegramAuthRequest } from '../types/auth';

const API_URL = 'http://localhost:8081/api/auth';

const axiosInstance = axios.create({
    baseURL: 'http://localhost:8081',
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    },
    withCredentials: true
});

export const authService = {
    async register(email: string, password: string, username: string): Promise<AuthResponse> {
        const response = await axiosInstance.post(`${API_URL}/register`, {
            email,
            password,
            username
        });
        return response.data;
    },

    async login(email: string, password: string): Promise<AuthResponse> {
        const response = await axiosInstance.post(`${API_URL}/login`, { 
            email, 
            password 
        });
        return response.data;
    },

    async telegramAuth(data: TelegramAuthRequest): Promise<AuthResponse> {
        const response = await axiosInstance.post(`${API_URL}/telegram`, data);
        return response.data;
    },

    logout() {
        localStorage.removeItem('token');
    }
};

export const refreshToken = async (): Promise<string> => {
    const oldToken = localStorage.getItem('token');
    const response = await axiosInstance.post(`${API_URL}/refresh`, null, {
        headers: {
            Authorization: `Bearer ${oldToken}`
        }
    });
    return response.data.token;
}; 