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
        // Обрабатываем полученную доску, чтобы сохранить связи задач с типами и статусами
        return this.processBoard(response.data);
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
            
            // Обрабатываем полученную доску, чтобы сохранить связи задач с типами и статусами
            const processedBoard = this.processBoard(response.data);
            return processedBoard;
        } catch (error: any) {
            console.error('Error moving column:', error.response?.data || error.message);
            throw error;
        }
    },

    async getBoard(boardId: string): Promise<Board> {
        const response = await api.get<Board>(`/api/boards/${boardId}`);
        const processedBoard = this.processBoard(response.data);
        return processedBoard;
    },

    // Обрабатывает доску, добавляя типы и статусы к задачам
    processBoard(board: Board): Board {
        if (!board || !board.columns) return board;

        console.log('Обработка доски:', board.id);
        
        // Создаем копию доски для изменения
        const processedBoard = { ...board };
        
        // Создаем быстрый доступ к задачам по id
        const tasksMap: Record<number, any> = {};
        
        // Сначала собираем все задачи из всех колонок
        processedBoard.columns.forEach(column => {
            if (column.tasks) {
                column.tasks.forEach(task => {
                    tasksMap[task.id] = task;
                });
            }
        });
        
        // Устанавливаем типы задач - проверяем, соответствуют ли задачи в списке taskTypes
        if (processedBoard.taskTypes) {
            // В API могут быть задачи внутри taskTypes, даже если в типах они не объявлены
            processedBoard.taskTypes.forEach(taskType => {
                // Проверяем задачи в колонках, которые соответствуют данному типу
                Object.values(tasksMap).forEach((task: any) => {
                    // TypeId может прийти в ответе от сервера
                    if (task.typeId === taskType.id) {
                        task.type = {
                            id: taskType.id,
                            name: taskType.name,
                            color: taskType.color,
                            icon: taskType.icon
                        };
                        console.log(`Установлен тип ${taskType.name} для задачи ${task.id}`);
                    }
                });
                
                // В некоторых API-ответах задачи могут быть вложены в тип
                if ((taskType as any).tasks && Array.isArray((taskType as any).tasks)) {
                    (taskType as any).tasks.forEach((taskWithType: any) => {
                        if (tasksMap[taskWithType.id]) {
                            tasksMap[taskWithType.id].type = {
                                id: taskType.id,
                                name: taskType.name,
                                color: taskType.color,
                                icon: taskType.icon
                            };
                            console.log(`Установлен тип ${taskType.name} для задачи ${taskWithType.id} (из списка типов)`);
                        }
                    });
                }
            });
        }
        
        // Устанавливаем статусы задач
        if (processedBoard.taskStatuses) {
            processedBoard.taskStatuses.forEach(status => {
                // Проверяем задачи в колонках, которые соответствуют данному статусу
                Object.values(tasksMap).forEach((task: any) => {
                    // StatusId может прийти в ответе от сервера
                    if (task.statusId === status.id) {
                        task.customStatus = {
                            id: status.id,
                            name: status.name,
                            color: status.color
                        };
                        console.log(`Установлен статус ${status.name} для задачи ${task.id}`);
                    }
                });
                
                // В некоторых API-ответах задачи могут быть вложены в статус
                if ((status as any).tasks && Array.isArray((status as any).tasks)) {
                    (status as any).tasks.forEach((taskWithStatus: any) => {
                        if (tasksMap[taskWithStatus.id]) {
                            tasksMap[taskWithStatus.id].customStatus = {
                                id: status.id,
                                name: status.name,
                                color: status.color
                            };
                            console.log(`Установлен статус ${status.name} для задачи ${taskWithStatus.id} (из списка статусов)`);
                        }
                    });
                }
            });
        }
        
        console.log('Обработка доски завершена, задачи обновлены с типами и статусами');
        return processedBoard;
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
            
            // Обрабатываем полученную доску, чтобы сохранить связи задач с типами и статусами
            const processedBoard = this.processBoard(response.data);
            return processedBoard;
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
            
            // Обрабатываем полученную доску, чтобы сохранить связи задач с типами и статусами
            const processedBoard = this.processBoard(response.data);
            return processedBoard;
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
            
            // Обновляем кэш доски, чтобы получить актуальные данные для всех компонентов
            try {
                // Получаем обновленные данные доски
                await this.getBoard(boardId);
                console.log('Состояние доски обновлено после создания статуса');
            } catch (refreshError) {
                console.error('Ошибка при обновлении состояния доски:', refreshError);
                // Не выбрасываем ошибку, так как основной запрос успешно выполнен
            }
            
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
            
            // Обновляем данные доски, чтобы обновить связи задач со статусами
            try {
                // Получаем обновленные данные доски
                await this.getBoard(boardId);
                console.log('Состояние доски обновлено после изменения статуса задачи');
            } catch (refreshError) {
                console.error('Ошибка при обновлении состояния доски:', refreshError);
                // Не выбрасываем ошибку, так как основной запрос успешно выполнен
            }
            
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
            
            // Обновляем кэш доски, чтобы получить актуальные данные для всех компонентов
            try {
                // Получаем обновленные данные доски
                await this.getBoard(boardId);
                console.log('Состояние доски обновлено после создания типа задачи');
            } catch (refreshError) {
                console.error('Ошибка при обновлении состояния доски:', refreshError);
                // Не выбрасываем ошибку, так как основной запрос успешно выполнен
            }
            
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
            
            // Обновляем данные доски, чтобы обновить связи задач с типами
            try {
                // Получаем обновленные данные доски
                await this.getBoard(boardId);
                console.log('Состояние доски обновлено после изменения типа задачи');
            } catch (refreshError) {
                console.error('Ошибка при обновлении состояния доски:', refreshError);
                // Не выбрасываем ошибку, так как основной запрос успешно выполнен
            }
            
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
    },

    // Получение информации о колонке по ID
    getColumnById(boardId: string | number, columnId: string | number): Promise<{ id: string | number, name: string } | null> {
        return new Promise(async (resolve) => {
            try {
                console.log(`Получение информации о колонке id=${columnId} на доске id=${boardId}`);
                // Получаем доску целиком
                const board = await this.getBoard(String(boardId));
                
                if (board && board.columns) {
                    // Ищем колонку по ID
                    const column = board.columns.find(col => 
                        String(col.id) === String(columnId) || Number(col.id) === Number(columnId)
                    );
                    
                    if (column) {
                        console.log(`Найдена колонка: ${column.name} (ID: ${column.id})`);
                        resolve({ id: column.id, name: column.name });
                        return;
                    }
                }
                
                console.warn(`Колонка с ID ${columnId} не найдена на доске ${boardId}`);
                resolve(null);
            } catch (error) {
                console.error('Ошибка при получении информации о колонке:', error);
                resolve(null); // Возвращаем null вместо ошибки
            }
        });
    }
}; 