import { api } from '../api/api';
import { Task } from '../types/task';

export const taskService = {
    async createTask(columnId: string, title: string): Promise<Task> {
        const response = await api.post(`/columns/${columnId}/tasks`, {
            title,
            status: 'todo',
            priority: 'medium'
        });
        return response.data;
    }
}; 