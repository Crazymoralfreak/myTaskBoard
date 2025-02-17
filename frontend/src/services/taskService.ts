import { api } from '../api/api';
import { Task, TaskPriority } from '../types/task';

export const taskService = {
    async createTask(columnId: string, taskData: {
        title: string;
        description: string;
        status: string;
        priority: TaskPriority;
    }): Promise<Task> {
        const response = await api.post('/api/tasks', {
            ...taskData,
            column: { id: columnId },
        });
        return response.data;
    },

    async updateTask(taskId: number, updates: Partial<Task>): Promise<Task> {
        const response = await api.put(`/api/tasks/${taskId}`, updates, {
            headers: {
                'Content-Type': 'application/json'
            }
        });
        return response.data;
    },

    async deleteTask(taskId: string): Promise<void> {
        await api.delete(`/api/tasks/${taskId}`);
    },

    async moveTask(taskId: string, newColumnId: string): Promise<Task> {
        const response = await api.patch(`/api/tasks/${taskId}/move/${newColumnId}`);
        return response.data;
    },

    async assignTask(taskId: string, userId: string): Promise<Task> {
        const response = await api.patch(`/api/tasks/${taskId}/assign/${userId}`);
        return response.data;
    }
}; 