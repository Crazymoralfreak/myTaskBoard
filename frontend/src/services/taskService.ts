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
        try {
            const response = await axiosInstance.get(`/api/tasks/column/${columnId}`);
            return response.data;
        } catch (error) {
            console.error('Ошибка при получении задач:', error);
            throw error;
        }
    },

    async createTask(task: CreateTaskRequest): Promise<Task> {
        try {
            console.log('Создание задачи:', task);
            const response = await axiosInstance.post('/api/tasks', task);
            console.log('Задача успешно создана:', response.data);
            return response.data;
        } catch (error) {
            console.error('Ошибка при создании задачи:', error);
            throw error;
        }
    },

    async updateTask(taskId: number, task: Partial<Task>): Promise<Task> {
        try {
            console.log('Обновление задачи:', { taskId, task });
            const response = await axiosInstance.put(`/api/tasks/${taskId}`, task);
            console.log('Задача успешно обновлена:', response.data);
            return response.data;
        } catch (error) {
            console.error('Ошибка при обновлении задачи:', error);
            throw error;
        }
    },

    async deleteTask(taskId: number): Promise<void> {
        try {
            await axiosInstance.delete(`/api/tasks/${taskId}`);
            console.log('Задача успешно удалена:', taskId);
        } catch (error) {
            console.error('Ошибка при удалении задачи:', error);
            throw error;
        }
    },

    async moveTask(moveRequest: MoveTaskRequest): Promise<void> {
        try {
            console.log('Перемещение задачи:', moveRequest);
            await axiosInstance.post('/api/tasks/move', moveRequest);
            console.log('Задача успешно перемещена');
        } catch (error) {
            console.error('Ошибка при перемещении задачи:', error);
            throw error;
        }
    },

    async addComment(taskId: number, content: string): Promise<Task> {
        try {
            console.log('Добавление комментария к задаче:', { taskId, content });
            const response = await axiosInstance.post(
                `/api/tasks/${taskId}/comments`, 
                { content }
            );
            console.log('Комментарий успешно добавлен:', response.data);
            return response.data;
        } catch (error) {
            console.error('Ошибка при добавлении комментария:', error);
            throw error;
        }
    },

    async deleteComment(taskId: number, commentId: number): Promise<Task> {
        try {
            const response = await axiosInstance.delete(`/api/tasks/${taskId}/comments/${commentId}`);
            console.log('Комментарий успешно удален:', response.data);
            return response.data;
        } catch (error) {
            console.error('Ошибка при удалении комментария:', error);
            throw error;
        }
    },

    async uploadFile(
        taskId: number, 
        file: File, 
        onProgress?: (progress: number) => void
    ): Promise<Task> {
        try {
            const formData = new FormData();
            formData.append('file', file);
        
            const response = await axiosInstance.post(
                `/api/tasks/${taskId}/files`, 
                formData,
                {
                    headers: {
                        'Content-Type': 'multipart/form-data'
                    },
                    onUploadProgress: (progressEvent) => {
                        if (onProgress && progressEvent.total) {
                            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                            onProgress(percentCompleted);
                        }
                    }
                }
            );
            
            console.log('Файл успешно загружен:', response.data);
            return response.data;
        } catch (error) {
            console.error('Ошибка при загрузке файла:', error);
            throw error;
        }
    },

    async deleteFile(taskId: number, fileId: number): Promise<Task> {
        try {
            const response = await axiosInstance.delete(`/api/tasks/${taskId}/files/${fileId}`);
            console.log('Файл успешно удален:', response.data);
            return response.data;
        } catch (error) {
            console.error('Ошибка при удалении файла:', error);
            throw error;
        }
    },

    async addChecklist(taskId: number, title: string): Promise<Task> {
        try {
            console.log('Добавление чеклиста к задаче:', { taskId, title });
            const response = await axiosInstance.post(
                `/api/tasks/${taskId}/checklists`, 
                { title }
            );
            console.log('Чеклист успешно добавлен:', response.data);
            return response.data;
        } catch (error) {
            console.error('Ошибка при добавлении чеклиста:', error);
            throw error;
        }
    },

    async addChecklistItem(
        taskId: number, 
        checklistId: number, 
        content: string
    ): Promise<Task> {
        try {
            console.log('Добавление пункта в чеклист:', { taskId, checklistId, content });
            const response = await axiosInstance.post(
                `/api/tasks/${taskId}/checklists/${checklistId}/items`, 
                { content }
            );
            console.log('Пункт чеклиста успешно добавлен:', response.data);
            return response.data;
        } catch (error) {
            console.error('Ошибка при добавлении пункта в чеклист:', error);
            throw error;
        }
    },

    async toggleChecklistItem(
        taskId: number,
        checklistId: number,
        itemId: number,
        completed: boolean
    ): Promise<Task> {
        try {
            console.log('Изменение статуса пункта чеклиста:', { taskId, checklistId, itemId, completed });
            const response = await axiosInstance.put(
                `/api/tasks/${taskId}/checklists/${checklistId}/items/${itemId}`, 
                { completed }
            );
            console.log('Статус пункта чеклиста успешно изменен:', response.data);
            return response.data;
        } catch (error) {
            console.error('Ошибка при изменении статуса пункта чеклиста:', error);
            throw error;
        }
    },

    async startTimeTracking(taskId: number): Promise<Task> {
        try {
            const response = await axiosInstance.post(`/api/tasks/${taskId}/time/start`);
            console.log('Отслеживание времени начато:', response.data);
            return response.data;
        } catch (error) {
            console.error('Ошибка при начале отслеживания времени:', error);
            throw error;
        }
    },

    async stopTimeTracking(taskId: number): Promise<Task> {
        try {
            const response = await axiosInstance.post(`/api/tasks/${taskId}/time/stop`);
            console.log('Отслеживание времени остановлено:', response.data);
            return response.data;
        } catch (error) {
            console.error('Ошибка при остановке отслеживания времени:', error);
            throw error;
        }
    },

    async updateTimeEstimate(taskId: number, estimate: number): Promise<Task> {
        try {
            console.log('Обновление оценки времени:', { taskId, estimate });
            const response = await axiosInstance.put(
                `/api/tasks/${taskId}/time/estimate`, 
                { estimate }
            );
            console.log('Оценка времени успешно обновлена:', response.data);
            return response.data;
        } catch (error) {
            console.error('Ошибка при обновлении оценки времени:', error);
            throw error;
        }
    },

    async linkTask(
        taskId: number,
        linkedTaskId: number,
        type: 'blocks' | 'blocked_by' | 'relates_to'
    ): Promise<Task> {
        try {
            console.log('Связывание задач:', { taskId, linkedTaskId, type });
            const response = await axiosInstance.post(
                `/api/tasks/${taskId}/links`, 
                { linkedTaskId, type }
            );
            console.log('Задачи успешно связаны:', response.data);
            return response.data;
        } catch (error) {
            console.error('Ошибка при связывании задач:', error);
            throw error;
        }
    },

    async unlinkTask(taskId: number, linkedTaskId: number): Promise<Task> {
        try {
            const response = await axiosInstance.delete(`/api/tasks/${taskId}/links/${linkedTaskId}`);
            console.log('Связь между задачами успешно удалена:', response.data);
            return response.data;
        } catch (error) {
            console.error('Ошибка при удалении связи между задачами:', error);
            throw error;
        }
    },

    async toggleWatcher(taskId: number): Promise<Task> {
        try {
            const response = await axiosInstance.post(`/api/tasks/${taskId}/watchers/toggle`);
            console.log('Статус наблюдателя изменен:', response.data);
            return response.data;
        } catch (error) {
            console.error('Ошибка при изменении статуса наблюдателя:', error);
            throw error;
        }
    },

    async assignTask(taskId: string, userId: string): Promise<Task> {
        const response = await api.patch(`/api/tasks/${taskId}/assign/${userId}`);
        return response.data;
    },

    // Методы для работы с подзадачами
    async createSubtask(taskId: number, subtask: CreateSubtaskRequest): Promise<Task> {
        try {
            console.log('Создание подзадачи:', { taskId, subtask });
            const response = await axiosInstance.post(`/api/tasks/${taskId}/subtasks`, subtask);
            console.log('Подзадача успешно создана:', response.data);
            return response.data;
        } catch (error) {
            console.error('Ошибка при создании подзадачи:', error);
            throw error;
        }
    },

    async updateSubtask(taskId: number, subtaskId: number, updates: UpdateSubtaskRequest): Promise<Task> {
        try {
            console.log('Обновление подзадачи:', { taskId, subtaskId, updates });
            const response = await axiosInstance.put(`/api/tasks/${taskId}/subtasks/${subtaskId}`, updates);
            console.log('Подзадача успешно обновлена:', response.data);
            return response.data;
        } catch (error) {
            console.error('Ошибка при обновлении подзадачи:', error);
            throw error;
        }
    },

    async deleteSubtask(taskId: number, subtaskId: number): Promise<Task> {
        try {
            const response = await axiosInstance.delete(`/api/tasks/${taskId}/subtasks/${subtaskId}`);
            console.log('Подзадача успешно удалена:', response.data);
            return response.data;
        } catch (error) {
            console.error('Ошибка при удалении подзадачи:', error);
            throw error;
        }
    },

    async assignSubtask(taskId: number, subtaskId: number, userId: number): Promise<Task> {
        const response = await api.put<Task>(
            `/api/tasks/${taskId}/subtasks/${subtaskId}/assign?userId=${userId}`,
            JSON.stringify({}),
            {
                headers: {
                    'Content-Type': 'application/json'
                }
            }
        );
        return response.data;
    },

    async reorderSubtasks(taskId: number, subtaskIds: number[]): Promise<Task> {
        try {
            console.log('Изменение порядка подзадач:', { taskId, subtaskIds });
            const response = await axiosInstance.post(`/api/tasks/${taskId}/subtasks/reorder`, subtaskIds);
            console.log('Порядок подзадач успешно изменен:', response.data);
            return response.data;
        } catch (error) {
            console.error('Ошибка при изменении порядка подзадач:', error);
            throw error;
        }
    },
}; 