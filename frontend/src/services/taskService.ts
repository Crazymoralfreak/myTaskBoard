import { api } from '../api/api';
import { Task, TaskPriority, CreateTaskRequest, TaskComment, TaskAttachment, TaskTemplate, TaskHistory } from '../types/task';
import { CreateSubtaskRequest, UpdateSubtaskRequest } from '../types/subtask';
import { JwtService } from './jwtService';
import { AxiosResponse } from 'axios';
import { Board } from '../types/board';
import { boardService } from '../services/boardService';

const jwtService = JwtService.getInstance();
const axiosInstance = jwtService.getAxiosInstance();

// Кэш для хранения тегов
let tagsCache: string[] | null = null;

interface MoveTaskRequest {
    taskId: number;
    sourceColumnId: number;
    destinationColumnId: number;
    newPosition: number;
    typeId?: number | null;
    statusId?: number | null;
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

    async getTask(taskId: number): Promise<Task> {
        try {
            const response = await axiosInstance.get(`/api/tasks/${taskId}`);
            console.log('Получены данные задачи:', response.data);
            
            // Проверяем, есть ли тип и статус задачи в ответе
            // Если тип задачи null, но есть typeId, загружаем информацию о типе
            if (response.data.type === null && response.data.typeId) {
                try {
                    // Находим board ID для запроса типов
                    const boardId = response.data.boardId || this.getBoardIdFromUrl();
                    if (boardId) {
                        const boardTypesResponse = await axiosInstance.get(`/api/boards/${boardId}/entities/types`);
                        const typeInfo = boardTypesResponse.data.find((t: any) => t.id === response.data.typeId);
                        if (typeInfo) {
                            response.data.type = {
                                id: typeInfo.id,
                                name: typeInfo.name,
                                color: typeInfo.color,
                                icon: typeInfo.icon
                            };
                            console.log('Добавлен тип задачи из дополнительного запроса:', response.data.type);
                        }
                    }
                } catch (typeError) {
                    console.error('Ошибка при загрузке типа задачи:', typeError);
                }
            }
            
            // Аналогично для статуса
            if (response.data.customStatus === null && response.data.statusId) {
                try {
                    const boardId = response.data.boardId || this.getBoardIdFromUrl();
                    if (boardId) {
                        const boardStatusesResponse = await axiosInstance.get(`/api/boards/${boardId}/entities/statuses`);
                        const statusInfo = boardStatusesResponse.data.find((s: any) => s.id === response.data.statusId);
                        if (statusInfo) {
                            response.data.customStatus = {
                                id: statusInfo.id,
                                name: statusInfo.name,
                                color: statusInfo.color
                            };
                            console.log('Добавлен статус задачи из дополнительного запроса:', response.data.customStatus);
                        }
                    }
                } catch (statusError) {
                    console.error('Ошибка при загрузке статуса задачи:', statusError);
                }
            }
            
            // Санитизируем ответ, чтобы избежать проблем с рекурсивными ссылками
            return this.sanitizeTaskData(response.data);
        } catch (error) {
            console.error('Failed to fetch task:', error);
            throw new Error('Failed to fetch task');
        }
    },

    async createTask(task: CreateTaskRequest): Promise<Task> {
        try {
            // Убедимся, что typeId корректный - если он существует, но равен 0, устанавливаем null
            const cleanedTask = { ...task };
            
            if (cleanedTask.typeId !== undefined) {
                // Преобразуем typeId в число для корректной проверки
                const typeIdNum = Number(cleanedTask.typeId);
                
                // Если typeId равен 0 или не является числом (NaN), устанавливаем null
                if (isNaN(typeIdNum) || typeIdNum === 0) {
                    cleanedTask.typeId = null;
                } else {
                    // Убедимся, что typeId сохранен как число, а не строка
                    cleanedTask.typeId = typeIdNum;
                }
            }
            
            // Аналогично для statusId
            if (cleanedTask.statusId !== undefined) {
                const statusIdNum = Number(cleanedTask.statusId);
                
                if (isNaN(statusIdNum) || statusIdNum === 0) {
                    cleanedTask.statusId = null;
                } else {
                    cleanedTask.statusId = statusIdNum;
                }
            }
            
            console.log('Отправка запроса на создание задачи (очищенные данные):', cleanedTask);
            const response = await axiosInstance.post('/api/tasks', cleanedTask);
            console.log('Задача успешно создана:', response.data);
            
            // Добавляем запись в историю о создании задачи
            try {
                if (response.data && response.data.id) {
                    // Создаем структуру с исходными параметрами задачи для записи в историю
                    const taskDetails = {
                        title: response.data.title || cleanedTask.title,
                        type: response.data.type?.name,
                        status: response.data.customStatus?.name,
                        priority: response.data.priority || cleanedTask.priority,
                        tags: response.data.tags || cleanedTask.tags || [],
                        dates: response.data.startDate || response.data.endDate ? 
                            `${response.data.startDate || 'не указана'} - ${response.data.endDate || 'не указана'}` : 
                            undefined
                    };
                    
                    await this.addHistoryEntry(response.data.id, {
                        action: 'task_created',
                        newValue: JSON.stringify(taskDetails)
                    });
                    console.log('Добавлена запись в историю о создании задачи с параметрами');
                }
            } catch (historyError) {
                console.error('Ошибка при записи истории создания задачи:', historyError);
                // Не выбрасываем ошибку, так как создание задачи уже успешно выполнено
            }
            
            return response.data;
        } catch (error) {
            console.error('Failed to create task:', error);
            throw new Error('Failed to create task');
        }
    },

    async updateTask(taskId: number, updatedTask: any): Promise<Task> {
        try {
            console.log('Отправка запроса на обновление задачи:', updatedTask);
            
            // Создаем копию объекта для модификации перед отправкой
            const taskToUpdate = { ...updatedTask };
            
            // Обрабатываем typeId - проверяем и преобразуем в число 
            if (taskToUpdate.typeId !== undefined) {
                const typeIdNum = Number(taskToUpdate.typeId);
                
                if (isNaN(typeIdNum) || typeIdNum === 0) {
                    console.log('Коррекция typeId: установлен null вместо некорректного значения');
                    taskToUpdate.typeId = null;
                } else {
                    console.log('Обновляем typeId:', typeIdNum);
                    taskToUpdate.typeId = typeIdNum;
                }
            }
            
            // Обрабатываем statusId - проверяем и преобразуем в число
            if (taskToUpdate.statusId !== undefined) {
                const statusIdNum = Number(taskToUpdate.statusId);
                
                if (isNaN(statusIdNum) || statusIdNum === 0) {
                    console.log('Коррекция statusId: установлен null вместо некорректного значения');
                    taskToUpdate.statusId = null;
                } else {
                    console.log('Обновляем statusId:', statusIdNum);
                    taskToUpdate.statusId = statusIdNum;
                }
            }
            
            // Если изменилась колонка, записываем это в историю
            const previousColumnId = updatedTask.previousColumnId;
            if (previousColumnId && previousColumnId !== updatedTask.columnId) {
                try {
                    // Получаем информацию о колонках для записи в историю
                    await this.addHistoryEntry(taskId, {
                        action: 'column_changed',
                        oldValue: `Колонка ID: ${previousColumnId}`,
                        newValue: `Колонка ID: ${updatedTask.columnId}`
                    });
                    console.log('Добавлена запись в историю о перемещении задачи');
                } catch (historyError) {
                    console.error('Ошибка при записи истории перемещения задачи:', historyError);
                }
            }
            
            // Удаляем временные поля перед отправкой
            delete taskToUpdate.previousColumnId;
            
            const response = await axiosInstance.put(`/api/tasks/${taskId}`, taskToUpdate);
            console.log('Задача успешно обновлена:', response.data);
            
            // Создаем записи истории для каждого измененного поля
            // Оборачиваем в try-catch, чтобы ошибки не блокировали основной поток
            try {
                // Получаем текущую задачу, чтобы сравнить поля
                const currentTask = await this.getTask(taskId);
                
                // Проверяем, что было изменено
                if (updatedTask.title && updatedTask.title !== currentTask.title) {
                    await this.addHistoryEntry(taskId, {
                        action: 'title_changed',
                        oldValue: currentTask.title,
                        newValue: updatedTask.title
                    });
                }
                
                if (updatedTask.description && updatedTask.description !== currentTask.description) {
                    await this.addHistoryEntry(taskId, {
                        action: 'description_changed',
                        oldValue: currentTask.description || '',
                        newValue: updatedTask.description
                    });
                }
                
                if (updatedTask.startDate && updatedTask.startDate !== currentTask.startDate) {
                    await this.addHistoryEntry(taskId, {
                        action: 'startDate_changed',
                        oldValue: currentTask.startDate || '',
                        newValue: updatedTask.startDate
                    });
                }
                
                if (updatedTask.endDate && updatedTask.endDate !== currentTask.endDate) {
                    await this.addHistoryEntry(taskId, {
                        action: 'endDate_changed',
                        oldValue: currentTask.endDate || '',
                        newValue: updatedTask.endDate
                    });
                }
                
                if (updatedTask.priority && updatedTask.priority !== currentTask.priority) {
                    await this.addHistoryEntry(taskId, {
                        action: 'priority_changed',
                        oldValue: currentTask.priority,
                        newValue: updatedTask.priority
                    });
                }
                
                if (updatedTask.typeId !== undefined && updatedTask.typeId !== (currentTask.type?.id || null)) {
                    await this.addHistoryEntry(taskId, {
                        action: 'type_changed',
                        oldValue: currentTask.type?.name || 'Без типа',
                        newValue: updatedTask.typeId ? `Тип ID: ${updatedTask.typeId}` : 'Без типа'
                    });
                }
                
                if (updatedTask.statusId !== undefined && updatedTask.statusId !== (currentTask.customStatus?.id || null)) {
                    await this.addHistoryEntry(taskId, {
                        action: 'status_changed',
                        oldValue: currentTask.customStatus?.name || 'Без статуса',
                        newValue: updatedTask.statusId ? `Статус ID: ${updatedTask.statusId}` : 'Без статуса'
                    });
                }

                // Проверяем, изменились ли теги
                if (updatedTask.tags && Array.isArray(updatedTask.tags)) {
                    // Преобразуем массивы в множества для сравнения
                    const oldTags = new Set<string>(currentTask.tags || []);
                    const newTags = new Set<string>(updatedTask.tags);
                    
                    // Проверяем, действительно ли теги изменились
                    if (oldTags.size !== newTags.size || 
                        [...oldTags].some(tag => !newTags.has(tag)) || 
                        [...newTags].some(tag => !oldTags.has(tag))) {
                        
                        const oldTagsStr = Array.isArray(currentTask.tags) ? (currentTask.tags as string[]).join(', ') : 'Без тегов';
                        const newTagsStr = (updatedTask.tags as string[]).join(', ') || 'Без тегов';
                        
                        await this.addHistoryEntry(taskId, {
                            action: 'tags_changed',
                            oldValue: oldTagsStr,
                            newValue: newTagsStr
                        });
                    }
                }
            } catch (historyError) {
                console.error('Ошибка при создании записей истории:', historyError);
                // Игнорируем ошибки истории, основное обновление задачи уже выполнено
            }
            
            // Возвращаем безопасную копию данных
            return this.sanitizeTaskData(response.data);
        } catch (error) {
            console.error('Failed to update task:', error);
            throw new Error('Failed to update task');
        }
    },

    async deleteTask(taskId: number): Promise<Board> {
        try {
            const response = await axiosInstance.delete(`/api/tasks/${taskId}`);
            console.log('Задача успешно удалена:', taskId);
            return response.data;
        } catch (error) {
            console.error('Ошибка при удалении задачи:', error);
            throw error;
        }
    },

    async moveTask(
        taskIdOrRequest: number | MoveTaskRequest,
        columnId?: string | number,
        position?: number,
        previousColumnId?: string | number
    ): Promise<Task> {
        try {
            let taskId: number;
            let targetColumnId: string | number;
            let targetPosition: number;
            let sourcePreviousColumnId: string | number | undefined;
            let typeId: number | null | undefined;
            let statusId: number | null | undefined;
            let boardId: string | number | null = null;
            
            // Проверяем, передан ли объект или отдельные параметры
            if (typeof taskIdOrRequest === 'object') {
                // Используем объект MoveTaskRequest
                const request = taskIdOrRequest;
                taskId = request.taskId;
                targetColumnId = request.destinationColumnId;
                targetPosition = request.newPosition;
                sourcePreviousColumnId = request.sourceColumnId;
                typeId = request.typeId;
                statusId = request.statusId;
                
                console.log(`Перемещение задачи ${taskId} в колонку ${targetColumnId}, позиция ${targetPosition}`);
            } else {
                // Используем отдельные параметры
                taskId = taskIdOrRequest;
                targetColumnId = columnId!;
                targetPosition = position!;
                sourcePreviousColumnId = previousColumnId;
                
                console.log(`Перемещение задачи ${taskId} в колонку ${targetColumnId}, позиция ${targetPosition}`);
            }
            
            const moveData = {
                taskId,
                columnId: targetColumnId,
                position: targetPosition
            };
            
            // Добавляем typeId и statusId в запрос
            if (typeId !== undefined) {
                // @ts-ignore
                moveData.typeId = typeId;
            }
            
            if (statusId !== undefined) {
                // @ts-ignore
                moveData.statusId = statusId;
            }
            
            console.log('Отправка данных для перемещения задачи:', moveData);
            const response = await axiosInstance.post('/api/tasks/move', {
                taskId,
                sourceColumnId: sourcePreviousColumnId,
                destinationColumnId: targetColumnId,
                newPosition: targetPosition,
                typeId: typeId !== undefined ? typeId : null,
                statusId: statusId !== undefined ? statusId : null
            });
            console.log('Задача успешно перемещена:', response.data);
            
            // Создаем безопасную копию данных для возврата, чтобы избежать проблем с рекурсивными ссылками
            const safeTaskData = this.sanitizeTaskData(response.data);
            
            // Если передан параметр previousColumnId, значит задача переместилась между колонками
            if (sourcePreviousColumnId && sourcePreviousColumnId !== targetColumnId) {
                try {
                    // Попробуем получить ID доски
                    const rawBoardId = safeTaskData.boardId || this.getBoardIdFromUrl();
                    boardId = rawBoardId ? String(rawBoardId) : null;
                    
                    // Находим имена колонок для логирования
                    let sourceColumnName = `Колонка ID: ${sourcePreviousColumnId}`;
                    let targetColumnName = `Колонка ID: ${targetColumnId}`;
                    
                    // Получаем информацию о колонках через API
                    if (boardId) {
                        try {
                            const sourceColumn = await boardService.getColumnById(boardId, sourcePreviousColumnId);
                            const targetColumn = await boardService.getColumnById(boardId, targetColumnId);
                            
                            if (sourceColumn) {
                                sourceColumnName = sourceColumn.name;
                            }
                            
                            if (targetColumn) {
                                targetColumnName = targetColumn.name;
                            }
                        } catch (colErr) {
                            console.warn('Не удалось получить информацию о колонках:', colErr);
                        }
                    }
                    
                    // Добавляем запись в историю о перемещении между колонками
                    await this.addHistoryEntry(taskId, {
                        action: 'moved_between_columns',
                        oldValue: sourceColumnName,
                        newValue: targetColumnName
                    });
                    console.log('Добавлена запись в историю о перемещении задачи между колонками');
                } catch (historyError) {
                    console.error('Ошибка при добавлении записи в историю:', historyError);
                    // Не выбрасываем ошибку, так как перемещение задачи уже выполнено
                }
            }
            
            return safeTaskData;
        } catch (error) {
            console.error('Failed to move task:', error);
            throw new Error('Failed to move task');
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

    async updateComment(taskId: number, commentId: number, content: string): Promise<Task> {
        try {
            console.log('Обновление комментария:', { taskId, commentId, content });
            const response = await axiosInstance.put(
                `/api/tasks/${taskId}/comments/${commentId}`, 
                { content }
            );
            console.log('Комментарий успешно обновлен:', response.data);
            return response.data;
        } catch (error) {
            console.error('Ошибка при обновлении комментария:', error);
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
                `/api/tasks/${taskId}/attachments`, 
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
            const response = await axiosInstance.delete(`/api/tasks/${taskId}/attachments/${fileId}`);
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

    async createTaskCopy(task: Task): Promise<Task> {
        try {
            console.log('Создание копии задачи:', task);
            
            // Формируем данные новой задачи на основе копируемой
            const newTaskData: CreateTaskRequest = {
                title: `Копия: ${task.title}`,
                description: task.description,
                columnId: task.columnId || '',
                priority: task.priority,
                tags: task.tags || [],
                statusId: task.customStatus?.id,
                typeId: task.type?.id
            };
            
            if (task.startDate) {
                newTaskData.startDate = task.startDate;
            }
            
            if (task.endDate) {
                newTaskData.endDate = task.endDate;
            }
            
            // Создаем новую задачу
            const response = await axiosInstance.post('/api/tasks', newTaskData);
            console.log('Копия задачи успешно создана:', response.data);
            return response.data;
        } catch (error) {
            console.error('Ошибка при создании копии задачи:', error);
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
            const response = await axiosInstance.post(`/api/tasks/${taskId}/subtasks`, subtask, {
                headers: {
                    'Content-Type': 'application/json'
                }
            });
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
            const response = await axiosInstance.put(`/api/tasks/${taskId}/subtasks/${subtaskId}`, updates, {
                headers: {
                    'Content-Type': 'application/json'
                }
            });
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
        try {
            const response = await axiosInstance.put(
                `/api/tasks/${taskId}/subtasks/${subtaskId}/assign?userId=${userId}`,
                {},
                {
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
            );
            console.log('Подзадача успешно назначена:', response.data);
            return response.data;
        } catch (error) {
            console.error('Ошибка при назначении подзадачи:', error);
            throw error;
        }
    },

    async reorderSubtasks(taskId: number, subtaskIds: number[]): Promise<Task> {
        try {
            console.log('Изменение порядка подзадач:', { taskId, subtaskIds });
            const response = await axiosInstance.put(`/api/tasks/${taskId}/subtasks/reorder`, subtaskIds, {
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            console.log('Порядок подзадач успешно изменен:', response.data);
            return response.data;
        } catch (error) {
            console.error('Ошибка при изменении порядка подзадач:', error);
            throw error;
        }
    },

    // Методы для работы с шаблонами задач
    getTaskTemplates(boardId: number): Promise<AxiosResponse<TaskTemplate[]>> {
        return axiosInstance.get(`/api/boards/${boardId}/templates`);
    },

    createTaskTemplate(boardId: number, template: TaskTemplate): Promise<AxiosResponse<TaskTemplate>> {
        return axiosInstance.post(`/api/boards/${boardId}/templates`, template);
    },

    updateTaskTemplate(templateId: number, template: TaskTemplate): Promise<AxiosResponse<TaskTemplate>> {
        return axiosInstance.put(`/api/templates/${templateId}`, template);
    },

    deleteTaskTemplate(templateId: number): Promise<AxiosResponse<void>> {
        return axiosInstance.delete(`/api/templates/${templateId}`);
    },

    // Методы для работы с тегами
    async getAllTags(): Promise<string[]> {
        try {
            // Если теги уже были загружены, возвращаем их из кэша
            if (tagsCache !== null) {
                return tagsCache;
            }
            
            console.log('Запрашиваем теги с сервера...');
            const response = await axiosInstance.get(`/api/tasks/tags`);
            
            // Сохраняем результат в кэш
            tagsCache = response.data;
            return response.data;
        } catch (error) {
            console.error('Ошибка при получении тегов:', error);
            return [];
        }
    },
    
    async addTag(tag: string, taskId?: number): Promise<string[]> {
        try {
            const response = await axiosInstance.post(`/api/tasks/tags`, { tag });
            
            // Обновляем кэш при добавлении нового тега
            tagsCache = response.data;
            
            // Если тег добавлен к задаче (передан taskId в параметрах)
            if (taskId) {
                // Добавляем запись в историю о добавлении тега
                try {
                    await this.addHistoryEntry(taskId, {
                        action: 'tag_added',
                        newValue: tag
                    });
                    console.log(`Добавлена запись в историю о добавлении тега "${tag}" к задаче ${taskId}`);
                } catch (historyError) {
                    console.error('Ошибка при записи истории добавления тега:', historyError);
                }
            }
            
            return response.data;
        } catch (error) {
            console.error('Ошибка при добавлении тега:', error);
            return [];
        }
    },

    // Методы для работы с историей задач
    async getTaskHistory(taskId: number): Promise<TaskHistory[]> {
        try {
            console.log(`Запрашиваем историю задачи ${taskId}...`);
            try {
                const response = await axiosInstance.get(`/api/tasks/${taskId}/history`);
                
                // Проверяем, что ответ это массив
                if (Array.isArray(response.data)) {
                    // Извлечение только безопасных полей для каждой записи истории
                    const optimizedHistory: TaskHistory[] = response.data.map((item: any) => {
                        // Проверяем и выбираем наиболее подходящие значения для имени пользователя
                        const username = item.changedBy?.name || 
                                         item.changedBy?.username || 
                                         item.username || 
                                         (item.changedBy?.email ? item.changedBy.email.split('@')[0] : 'Система');
                        
                        return {
                            id: item.id || Math.random(),
                            username: username,
                            email: item.changedBy?.email,
                            avatarUrl: item.avatarUrl,
                            action: item.action || 'unknown_action',
                            oldValue: item.oldValue,
                            newValue: item.newValue,
                            timestamp: item.timestamp || new Date().toISOString()
                        };
                    });
                    
                    console.log('Получены данные истории (безопасная версия):', optimizedHistory);
                    return optimizedHistory;
                } else {
                    console.warn('Ответ от сервера не является массивом:', response.data);
                    return [];
                }
            } catch (error) {
                console.error('Ошибка при запросе истории задачи:', error);
                return [];
            }
        } catch (error) {
            console.error('Ошибка при получении истории задачи:', error);
            return [];
        }
    },
    
    async addHistoryEntry(taskId: number, entry: {action: string, oldValue?: string, newValue?: string}): Promise<TaskHistory> {
        try {
            // Если старое и новое значение одинаковые, пропускаем запись события (кроме создания задачи и некоторых типов событий)
            if (entry.oldValue !== undefined && 
                entry.newValue !== undefined && 
                this.areValuesEqual(entry.oldValue, entry.newValue) &&
                entry.action !== 'task_created' && 
                !entry.action.includes('added') &&
                !entry.action.includes('deleted') &&
                !entry.action.includes('removed')) {
                console.log(`Запись истории пропущена для задачи ${taskId} (значения идентичны):`, entry);
                // Возвращаем пустой объект, соответствующий интерфейсу TaskHistory
                return {
                    id: Math.random(),
                    username: 'Система',
                    action: 'skipped',
                    timestamp: new Date().toISOString()
                } as TaskHistory;
            }
            
            // Копируем объект entry, чтобы не изменять оригинал
            const sanitizedEntry = {
                action: entry.action,
                oldValue: entry.oldValue ? this.sanitizeHtmlContent(entry.oldValue) : undefined,
                newValue: entry.newValue ? this.sanitizeHtmlContent(entry.newValue) : undefined
            };
            
            console.log(`Добавляем запись в историю задачи ${taskId}:`, sanitizedEntry);
            
            try {
                // Делаем запрос с обработкой ошибок
                const response = await axiosInstance.post(`/api/tasks/${taskId}/history`, sanitizedEntry);
                
                // Выбираем подходящее значение для username
                const username = response.data?.username || 
                                 response.data?.changedBy?.name || 
                                 response.data?.changedBy?.username || 
                                 (response.data?.changedBy?.email ? response.data.changedBy.email.split('@')[0] : 'Система');
                
                // Проверяем результат и создаем безопасный объект даже если ответ некорректный
                const historyEntry: TaskHistory = {
                    id: response.data?.id || Math.random(),
                    username: username,
                    email: response.data?.changedBy?.email,
                    avatarUrl: response.data?.avatarUrl,
                    action: response.data?.action || entry.action,
                    oldValue: response.data?.oldValue || entry.oldValue,
                    newValue: response.data?.newValue || entry.newValue,
                    timestamp: response.data?.timestamp || new Date().toISOString()
                };
                
                console.log('Запись в историю добавлена (безопасная версия):', historyEntry);
                return historyEntry;
            } catch (requestError) {
                // В случае ошибки при запросе создаем локальную запись
                console.warn('Не удалось отправить запись в историю на сервер:', requestError);
                const localHistoryEntry: TaskHistory = {
                    id: Math.random(),
                    username: 'Система (локально)',
                    action: entry.action,
                    oldValue: entry.oldValue,
                    newValue: entry.newValue,
                    timestamp: new Date().toISOString()
                };
                console.log('Создана локальная запись истории:', localHistoryEntry);
                return localHistoryEntry;
            }
        } catch (error) {
            console.error('Ошибка при добавлении записи в историю:', error);
            // Игнорируем ошибку, чтобы не ломать основной поток
            console.log('Запись истории будет пропущена из-за ошибки');
            // Возвращаем минимальный объект, чтобы поддержать интерфейс
            return {
                id: Math.random(),
                username: 'Ошибка',
                action: entry.action || 'unknown_action',
                timestamp: new Date().toISOString()
            } as TaskHistory;
        }
    },
    
    // Вспомогательный метод для удаления HTML-тегов с сохранением форматирования
    sanitizeHtmlContent(html: string): string {
        // Если строка содержит HTML-теги, обрабатываем ее
        if (html.includes('<') && html.includes('>')) {
            // Заменяем HTML-теги переноса строк на их текстовые эквиваленты
            let processedHtml = html
                .replace(/<br\s*\/?>/gi, '\n')
                .replace(/<\/p>\s*<p>/gi, '\n\n')
                .replace(/<\/div>\s*<div>/gi, '\n')
                .replace(/<p>/gi, '')
                .replace(/<\/p>/gi, '\n')
                .replace(/<div>/gi, '')
                .replace(/<\/div>/gi, '\n');
            
            // Удаляем все оставшиеся HTML-теги
            processedHtml = processedHtml.replace(/<[^>]*>/g, '');
            
            // Возвращаем текстовое содержимое с сохраненными переносами строк
            return processedHtml.trim();
        }
        return html;
    },

    // Метод для создания безопасной копии задачи без рекурсивных ссылок
    sanitizeTaskData(taskData: any): Task {
        // Создаем копию данных
        const safeTask = { ...taskData };
        
        // Удаляем потенциально рекурсивные ссылки
        if (safeTask.column && typeof safeTask.column === 'object') {
            // Сохраняем только id и name колонки, удаляем рекурсивные ссылки
            const columnId = safeTask.column.id;
            const columnName = safeTask.column.name;
            safeTask.column = { id: columnId, name: columnName };
        }
        
        // Упрощаем связи с пользователями
        if (safeTask.assignedUsers && Array.isArray(safeTask.assignedUsers)) {
            safeTask.assignedUsers = safeTask.assignedUsers.map((user: any) => ({
                id: user.id,
                username: user.username,
                email: user.email,
                avatarUrl: user.avatarUrl
            }));
        }
        
        // Упрощаем связи с комментариями
        if (safeTask.comments && Array.isArray(safeTask.comments)) {
            safeTask.comments = safeTask.comments.map((comment: any) => {
                const safeComment = { ...comment };
                if (safeComment.author) {
                    safeComment.author = {
                        id: comment.author.id,
                        username: comment.author.username,
                        avatarUrl: comment.author.avatarUrl
                    };
                }
                return safeComment;
            });
        }
        
        return safeTask;
    },

    getBoardIdFromUrl(): number | null {
        try {
            // Пытаемся извлечь ID доски из URL
            const url = window.location.pathname;
            
            // Поддержка различных форматов URL: /boards/123, /boards/123/tasks, /boards/123/columns, и т.д.
            const boardPathRegex = /\/boards\/(\d+)(?:\/.*)?/;
            const match = url.match(boardPathRegex);
            
            if (match && match[1]) {
                return parseInt(match[1], 10);
            }
            
            // Если не удалось найти ID в URL, проверяем наличие query-параметра boardId
            const urlParams = new URLSearchParams(window.location.search);
            const boardIdParam = urlParams.get('boardId');
            
            if (boardIdParam) {
                return parseInt(boardIdParam, 10);
            }
            
            console.log('Не удалось извлечь boardId из URL:', url);
            return null;
        } catch (error) {
            console.error('Ошибка при получении ID доски из URL:', error);
            return null;
        }
    },

    // Специальный метод для сравнения значений в истории с учетом HTML-форматирования
    areValuesEqual(oldValue?: string, newValue?: string): boolean {
        // Если оба значения отсутствуют или равны undefined/null, считаем их равными
        if (!oldValue && !newValue) return true;
        
        // Если только одно из значений отсутствует, они не равны
        if (!oldValue || !newValue) return false;
        
        // Если это простые строки без HTML, сравниваем напрямую
        if (!oldValue.includes('<') && !newValue.includes('<')) {
            return oldValue.trim() === newValue.trim();
        }
        
        // Для HTML-контента - сравниваем очищенные версии
        const cleanOldValue = this.sanitizeHtmlContent(oldValue).trim();
        const cleanNewValue = this.sanitizeHtmlContent(newValue).trim();
        
        return cleanOldValue === cleanNewValue;
    }
}; 