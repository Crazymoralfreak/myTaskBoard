import { taskService } from '../services/taskService';

/**
 * Утилита для миграции данных из localStorage в API
 */
export const migrateLocalStorageToApi = async (): Promise<void> => {
    try {
        console.log('Начало миграции данных из localStorage в API...');
        
        // Миграция тегов
        await migrateTagsToApi();
        
        // Миграция истории задач
        await migrateTaskHistoryToApi();
        
        // Миграция шаблонов задач
        await migrateTaskTemplatesToApi();
        
        console.log('Миграция данных успешно завершена!');
    } catch (error) {
        console.error('Ошибка при миграции данных:', error);
    }
};

/**
 * Миграция тегов из localStorage в API
 */
const migrateTagsToApi = async (): Promise<void> => {
    try {
        const storedTags = localStorage.getItem('taskTags');
        if (!storedTags) {
            console.log('Теги не найдены в localStorage, пропускаем миграцию тегов');
            return;
        }
        
        const tags = JSON.parse(storedTags) as string[];
        console.log(`Найдено ${tags.length} тегов для миграции`);
        
        // Добавляем каждый тег через API
        for (const tag of tags) {
            await taskService.addTag(tag);
        }
        
        console.log('Миграция тегов успешно завершена');
        
        // После успешной миграции можно удалить данные из localStorage
        // localStorage.removeItem('taskTags');
    } catch (error) {
        console.error('Ошибка при миграции тегов:', error);
        throw error;
    }
};

/**
 * Миграция истории задач из localStorage в API
 */
const migrateTaskHistoryToApi = async (): Promise<void> => {
    try {
        // Ищем все ключи localStorage, содержащие task_history_
        const historyKeys = Object.keys(localStorage).filter(key => key.startsWith('task_history_'));
        console.log(`Найдено ${historyKeys.length} записей истории для миграции`);
        
        if (historyKeys.length === 0) {
            console.log('История задач не найдена в localStorage, пропускаем миграцию истории');
            return;
        }
        
        // Для каждого ключа выполняем миграцию
        for (const key of historyKeys) {
            const taskId = key.replace('task_history_', '');
            const historyData = localStorage.getItem(key);
            
            if (historyData) {
                const history = JSON.parse(historyData);
                
                // Мигрируем каждую запись истории
                for (const entry of history) {
                    await taskService.addHistoryEntry(Number(taskId), {
                        action: entry.action || entry.fieldChanged,
                        oldValue: entry.oldValue,
                        newValue: entry.newValue,
                    });
                }
            }
        }
        
        console.log('Миграция истории задач успешно завершена');
        
        // После успешной миграции можно удалить данные из localStorage
        // historyKeys.forEach(key => localStorage.removeItem(key));
    } catch (error) {
        console.error('Ошибка при миграции истории задач:', error);
        throw error;
    }
};

/**
 * Миграция шаблонов задач из localStorage в API
 */
const migrateTaskTemplatesToApi = async (): Promise<void> => {
    try {
        const storedTemplates = localStorage.getItem('taskTemplates');
        if (!storedTemplates) {
            console.log('Шаблоны задач не найдены в localStorage, пропускаем миграцию шаблонов');
            return;
        }
        
        const templates = JSON.parse(storedTemplates);
        console.log(`Найдено ${templates.length} шаблонов для миграции`);
        
        // Так как шаблоны привязаны к доске, необходимо знать ID текущей доски
        // Для демонстрации предположим, что у нас есть ID доски
        const boardId = getBoardIdFromUrl();
        
        if (!boardId) {
            console.warn('Не удалось определить ID доски, миграция шаблонов невозможна');
            return;
        }
        
        // Мигрируем каждый шаблон
        for (const template of templates) {
            await taskService.createTaskTemplate(boardId, template);
        }
        
        console.log('Миграция шаблонов задач успешно завершена');
        
        // После успешной миграции можно удалить данные из localStorage
        // localStorage.removeItem('taskTemplates');
    } catch (error) {
        console.error('Ошибка при миграции шаблонов задач:', error);
        throw error;
    }
};

/**
 * Получение ID доски из URL
 */
const getBoardIdFromUrl = (): number | null => {
    const match = window.location.pathname.match(/\/boards\/(\d+)/);
    return match ? Number(match[1]) : null;
}; 