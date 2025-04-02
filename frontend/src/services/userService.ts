import { api } from '../api/api';
import { User } from '../types/user';
import { UserSettings } from '../types/settings';

export const userService = {
    searchUsers: async (query: string): Promise<User[]> => {
        const response = await api.get(`/api/users/search?query=${query}`);
        return response.data;
    },

    getCurrentUser: async (): Promise<User> => {
        const response = await api.get('/api/users/current');
        return response.data;
    },

    updateUser: async (userId: number, updates: Partial<User>): Promise<User> => {
        const response = await api.put(`/api/users/${userId}`, updates);
        return response.data;
    },

    getUserSettings: async (): Promise<UserSettings> => {
        const response = await api.get('/api/users/settings');
        return response.data;
    },

    updateUserSettings: async (settings: UserSettings): Promise<UserSettings> => {
        const response = await api.put('/api/users/settings', settings);
        return response.data;
    },

    clearCache: async (): Promise<void> => {
        await api.post('/api/users/clear-cache');
    },

    deleteUserData: async (): Promise<void> => {
        await api.delete('/api/users/data');
    }
}; 