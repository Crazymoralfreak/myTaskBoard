import { api } from '../api/api';
import { Task, TaskPriority, CreateTaskRequest, TaskComment, TaskAttachment } from '../types/task';
import { CreateSubtaskRequest, UpdateSubtaskRequest } from '../types/subtask';
import { JwtService } from './jwtService';

const jwtService = JwtService.getInstance();
const axiosInstance = jwtService.getAxiosInstance();

interface MoveTaskRequest {
    taskId: number;
    sourceColumnId: number;
    destinationColumnId: number;
    newPosition: number;
}

export const taskService = {
    async getTasksByColumn(columnId: number): Promise<Task[]> {
        const response = await axiosInstance.get(`/api/tasks/column/${columnId}`);
        return response.data;
    },

    async createTask(task: CreateTaskRequest): Promise<Task> {
        const response = await axiosInstance.post('/api/tasks', task);
        return response.data;
    },

    async updateTask(taskId: number, task: Partial<Task>): Promise<Task> {
        const response = await axiosInstance.put(`/api/tasks/${taskId}`, task);
        return response.data;
    },

    async deleteTask(taskId: number): Promise<void> {
        await axiosInstance.delete(`/api/tasks/${taskId}`);
    },

    async moveTask(moveRequest: MoveTaskRequest): Promise<void> {
        await axiosInstance.post('/api/tasks/move', moveRequest);
    },

    async addComment(taskId: number, content: string): Promise<Task> {
        const token = localStorage.getItem('token');
        if (!token) {
            throw new Error('No authentication token found');
        }
        console.log('Sending comment with token:', token);
        const response = await api.post<Task>(
            `/api/tasks/${taskId}/comments`,
            { content }
        );
        return response.data;
    },

    async deleteComment(taskId: number, commentId: number): Promise<Task> {
        const response = await api.delete<Task>(`/api/tasks/${taskId}/comments/${commentId}`);
        return response.data;
    },

    async uploadFile(
        taskId: number, 
        file: File, 
        onProgress?: (progress: number) => void
    ): Promise<Task> {
        const formData = new FormData();
        formData.append('file', file);

        const response = await api.post<Task>(
            `/api/tasks/${taskId}/attachments`,
            formData,
            {
                headers: {
                    'Content-Type': 'multipart/form-data'
                },
                onUploadProgress: (progressEvent) => {
                    if (onProgress && progressEvent.total) {
                        const progress = Math.round(
                            (progressEvent.loaded * 100) / progressEvent.total
                        );
                        onProgress(progress);
                    }
                }
            }
        );
        return response.data;
    },

    async deleteFile(taskId: number, fileId: number): Promise<Task> {
        const response = await api.delete<Task>(`/api/tasks/${taskId}/attachments/${fileId}`);
        return response.data;
    },

    async addChecklist(taskId: number, title: string): Promise<Task> {
        const response = await api.post<Task>(`/api/tasks/${taskId}/checklists`, { title });
        return response.data;
    },

    async addChecklistItem(
        taskId: number, 
        checklistId: number, 
        content: string
    ): Promise<Task> {
        const response = await api.post<Task>(
            `/api/tasks/${taskId}/checklists/${checklistId}/items`,
            { content }
        );
        return response.data;
    },

    async toggleChecklistItem(
        taskId: number,
        checklistId: number,
        itemId: number,
        completed: boolean
    ): Promise<Task> {
        const response = await api.patch<Task>(
            `/api/tasks/${taskId}/checklists/${checklistId}/items/${itemId}`,
            { completed }
        );
        return response.data;
    },

    async startTimeTracking(taskId: number): Promise<Task> {
        const response = await api.post<Task>(`/api/tasks/${taskId}/time-tracking/start`);
        return response.data;
    },

    async stopTimeTracking(taskId: number): Promise<Task> {
        const response = await api.post<Task>(`/api/tasks/${taskId}/time-tracking/stop`);
        return response.data;
    },

    async updateTimeEstimate(taskId: number, estimate: number): Promise<Task> {
        const response = await api.patch<Task>(
            `/api/tasks/${taskId}/time-tracking/estimate`,
            { estimate }
        );
        return response.data;
    },

    async linkTask(
        taskId: number,
        linkedTaskId: number,
        type: 'blocks' | 'blocked_by' | 'relates_to'
    ): Promise<Task> {
        const response = await api.post<Task>(
            `/api/tasks/${taskId}/links`,
            { linkedTaskId, type }
        );
        return response.data;
    },

    async unlinkTask(taskId: number, linkedTaskId: number): Promise<Task> {
        const response = await api.delete<Task>(
            `/api/tasks/${taskId}/links/${linkedTaskId}`
        );
        return response.data;
    },

    async toggleWatcher(taskId: number): Promise<Task> {
        const response = await api.post<Task>(`/api/tasks/${taskId}/watchers/toggle`);
        return response.data;
    },

    async assignTask(taskId: string, userId: string): Promise<Task> {
        const response = await api.patch(`/api/tasks/${taskId}/assign/${userId}`);
        return response.data;
    },

    // Методы для работы с подзадачами
    async createSubtask(taskId: number, subtask: CreateSubtaskRequest): Promise<Task> {
        const response = await api.post<Task>(`/api/tasks/${taskId}/subtasks`, subtask);
        return response.data;
    },

    async updateSubtask(taskId: number, subtaskId: number, updates: UpdateSubtaskRequest): Promise<Task> {
        const response = await api.put<Task>(`/api/tasks/${taskId}/subtasks/${subtaskId}`, updates);
        return response.data;
    },

    async deleteSubtask(taskId: number, subtaskId: number): Promise<Task> {
        const response = await api.delete<Task>(`/api/tasks/${taskId}/subtasks/${subtaskId}`);
        return response.data;
    },

    async assignSubtask(taskId: number, subtaskId: number, userId: number): Promise<Task> {
        const response = await api.put<Task>(
            `/api/tasks/${taskId}/subtasks/${subtaskId}/assign?userId=${userId}`
        );
        return response.data;
    },

    async reorderSubtasks(taskId: number, subtaskIds: number[]): Promise<Task> {
        const response = await api.put<Task>(`/api/tasks/${taskId}/subtasks/reorder`, subtaskIds);
        return response.data;
    },
}; 