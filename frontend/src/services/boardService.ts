import { Board } from '../types/board';
import { Column } from '../types/column';
import { api } from '../api/api';
import { BoardStatus, TaskType } from '../types/board';

export const boardService = {
    async createBoard(board: Partial<Board>): Promise<Board> {
        const response = await api.post('/api/boards', board);
        return response.data;
    },

    async getUserBoards(userId: number): Promise<Board[]> {
        const response = await api.get(`/api/boards/user/${userId}`);
        return response.data;
    },

    async updateBoard(id: string, board: Partial<Board>): Promise<Board> {
        const response = await api.put(`/api/boards/${id}`, board);
        return response.data;
    },

    async deleteBoard(id: string): Promise<void> {
        try {
            console.log('Deleting board:', id);
            await api.delete(`/api/boards/${id}`);
            console.log('Доска успешно удалена');
        } catch (error) {
            console.error('Ошибка при удалении доски:', error);
            throw error;
        }
    },

    async archiveBoard(id: string): Promise<Board> {
        const response = await api.patch(`/api/boards/${id}/archive`);
        return response.data;
    },

    async restoreBoard(id: string): Promise<Board> {
        const response = await api.patch(`/api/boards/${id}/restore`);
        return response.data;
    },

    async addColumn(boardId: string, column: Partial<Column>): Promise<Board> {
        const response = await api.post<Board>(`/api/boards/${boardId}/columns`, column);
        return response.data;
    },

    async removeColumn(boardId: string, columnId: string): Promise<Board> {
        const response = await api.delete(`/api/boards/${boardId}/columns/${columnId}`);
        return response.data;
    },

    async moveColumn(boardId: string, columnId: string, newPosition: number): Promise<Board> {
        try {
            console.log(`Отправка запроса moveColumn: boardId=${boardId}, columnId=${columnId}, newPosition=${newPosition}`);
            
            // Не отправляем пустое тело в запросе
            const response = await api.patch<Board>(
                `/api/boards/${boardId}/columns/${columnId}/move/${newPosition}`
            );
            
            console.log('Ответ от сервера на moveColumn:', response.data);
            return response.data;
        } catch (error: any) {
            console.error('Error moving column:', error.response?.data || error.message);
            throw error;
        }
    },

    async getBoard(boardId: string): Promise<Board> {
        const response = await api.get<Board>(`/api/boards/${boardId}`);
        return response.data;
    },

    async updateBoardDetails(boardId: string, updates: { name?: string; description?: string }): Promise<Board> {
        try {
            console.log('Updating board details:', updates);
            const response = await api.put<Board>(`/api/boards/${boardId}`, updates);
            console.log('Обновление данных доски успешно:', response.data);
            return response.data;
        } catch (error) {
            console.error('Ошибка при обновлении данных доски:', error);
            throw error;
        }
    },

    async updateColumn(boardId: string, columnId: string, updates: { name: string; color?: string }): Promise<Board> {
        try {
            console.log('Updating column:', { boardId, columnId, updates });
            const response = await api.put<Board>(`/api/boards/${boardId}/columns/${columnId}`, updates);
            console.log('Обновление колонки успешно:', response.data);
            return response.data;
        } catch (error) {
            console.error('Ошибка при обновлении колонки:', error);
            throw error;
        }
    },

    async deleteColumn(boardId: string, columnId: string): Promise<Board> {
        try {
            console.log('Deleting column:', { boardId, columnId });
            const response = await api.delete<Board>(`/api/boards/${boardId}/columns/${columnId}`);
            console.log('Удаление колонки успешно:', response.data);
            return response.data;
        } catch (error) {
            console.error('Ошибка при удалении колонки:', error);
            throw error;
        }
    },

    // Методы для работы со статусами задач
    async getBoardStatuses(boardId: string): Promise<BoardStatus[]> {
        const response = await api.get<BoardStatus[]>(`/api/boards/${boardId}/entities/statuses`);
        return response.data;
    },

    async createTaskStatus(boardId: string, status: Partial<BoardStatus>): Promise<BoardStatus> {
        console.log('Отправка запроса на создание статуса задачи:', status);
        
        try {
            // Отправляем только необходимые поля
            const payload: Partial<BoardStatus> = {
                name: status.name || '',
                color: status.color || '#000000'
                // position, isDefault и isCustom будут установлены на сервере
            };
            
            console.log('Подготовленные данные:', payload);
            
            // Важно: не преобразовываем данные в JSON строку, axios сделает это автоматически
            const response = await api.post<BoardStatus>(
                `/api/boards/${boardId}/entities/statuses`, 
                payload
            );
            console.log('Ответ сервера:', response.data);
            return response.data;
        } catch (error) {
            console.error('Ошибка при создании статуса задачи:', error);
            throw error;
        }
    },

    async updateTaskStatus(boardId: string, statusId: number, status: Partial<BoardStatus>): Promise<BoardStatus> {
        console.log('Отправка запроса на обновление статуса задачи:', status);
        
        try {
            // Проверяем, что все поля имеют правильные типы
            const payload: Partial<BoardStatus> = {
                name: status.name || '',
                color: status.color || '#000000'
            };
            
            // Добавляем другие поля только если они указаны
            if (status.position !== undefined) {
                payload.position = status.position;
            }
            if (status.isDefault !== undefined) {
                payload.isDefault = status.isDefault;
            }
            if (status.isCustom !== undefined) {
                payload.isCustom = status.isCustom;
            }
            
            console.log('Подготовленные данные:', payload);
            
            // Важно: не преобразовываем данные в JSON строку, axios сделает это автоматически
            const response = await api.put<BoardStatus>(
                `/api/boards/${boardId}/entities/statuses/${statusId}`, 
                payload
            );
            console.log('Ответ сервера:', response.data);
            return response.data;
        } catch (error) {
            console.error('Ошибка при обновлении статуса задачи:', error);
            throw error;
        }
    },

    async deleteTaskStatus(boardId: string, statusId: number): Promise<void> {
        try {
            console.log(`Удаление статуса задачи id=${statusId} с доски id=${boardId}`);
            await api.delete(`/api/boards/${boardId}/entities/statuses/${statusId}`);
            console.log('Статус задачи успешно удален');
        } catch (error) {
            console.error('Ошибка при удалении статуса задачи:', error);
            throw error;
        }
    },

    // Методы для работы с типами задач
    async getBoardTaskTypes(boardId: string): Promise<TaskType[]> {
        const response = await api.get<TaskType[]>(`/api/boards/${boardId}/entities/types`);
        return response.data;
    },

    async createTaskType(boardId: string, type: Partial<TaskType>): Promise<TaskType> {
        try {
            console.log('Отправка запроса на создание типа задачи:', type);
            
            // Формируем объект данных с нужными полями
            const payload = {
                name: type.name || '',
                color: type.color || '#000000',
                icon: type.icon || ''
            };
            
            console.log('Отправляемые данные:', payload);
            
            // Отправляем запрос без явного указания заголовка Content-Type
            const response = await api.post<TaskType>(
                `/api/boards/${boardId}/entities/types`,
                payload
            );
            
            console.log('Ответ сервера:', response.data);
            return response.data;
        } catch (error) {
            console.error('Ошибка при создании типа задачи:', error);
            throw error;
        }
    },

    async updateTaskType(boardId: string, typeId: number, type: Partial<TaskType>): Promise<TaskType> {
        try {
            console.log('Отправка запроса на обновление типа задачи:', type);
            
            // Формируем объект данных с нужными полями
            const payload: Partial<TaskType> = {
                name: type.name || '',
                color: type.color || '#000000'
            };
            
            // Добавляем иконку только если она указана
            if (type.icon) {
                payload.icon = type.icon;
            }
            
            console.log('Отправляемые данные:', payload);
            
            // Отправляем запрос без явного указания заголовка Content-Type
            const response = await api.put<TaskType>(
                `/api/boards/${boardId}/entities/types/${typeId}`,
                payload
            );
            
            console.log('Ответ сервера:', response.data);
            return response.data;
        } catch (error) {
            console.error('Ошибка при обновлении типа задачи:', error);
            throw error;
        }
    },

    async deleteTaskType(boardId: string, typeId: number): Promise<void> {
        try {
            console.log(`Удаление типа задачи id=${typeId} с доски id=${boardId}`);
            await api.delete(`/api/boards/${boardId}/entities/types/${typeId}`);
            console.log('Тип задачи успешно удален');
        } catch (error) {
            console.error('Ошибка при удалении типа задачи:', error);
            throw error;
        }
    }
}; 