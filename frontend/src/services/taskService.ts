import { api } from '../api/api';
import { Task, TaskPriority, CreateTaskRequest } from '../types/task';

export const taskService = {
    async createTask(columnId: string, taskData: CreateTaskRequest): Promise<Task> {
        const response = await api.post<Task>(
            `/api/tasks`,
            {
                ...taskData,
                column: { id: columnId }
            }
        );
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
        console.log(`Moving task ${taskId} to column ${newColumnId}`);
        const response = await api.patch<Task>(`/api/tasks/${taskId}/move/${newColumnId}`, {
            columnId: newColumnId
        });
        console.log('Move task response:', response.data);
        return response.data;
    },

    async assignTask(taskId: string, userId: string): Promise<Task> {
        const response = await api.patch(`/api/tasks/${taskId}/assign/${userId}`);
        return response.data;
    }
}; 