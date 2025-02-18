import { api } from '../api/api';

interface User {
    id: number;
    username: string;
    avatarUrl?: string;
}

export const userService = {
    async searchUsers(query: string): Promise<User[]> {
        const response = await api.get<User[]>(`/api/users/search?query=${encodeURIComponent(query)}`);
        return response.data;
    },

    async getCurrentUser(): Promise<User> {
        const response = await api.get<User>('/api/users/current');
        return response.data;
    },

    async updateUser(userId: number, updates: Partial<User>): Promise<User> {
        const response = await api.put<User>(`/api/users/${userId}`, updates);
        return response.data;
    }
}; 