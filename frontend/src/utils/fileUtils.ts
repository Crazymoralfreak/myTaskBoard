import api from '../api/axiosConfig';

/**
 * Форматирует размер файла в более читаемый вид
 * @param bytes размер в байтах
 * @returns отформатированная строка с размером
 */
export function formatFileSize(bytes: number): string {
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
        size /= 1024;
        unitIndex++;
    }

    return `${size.toFixed(1)} ${units[unitIndex]}`;
}

/**
 * Формирует корректный URL для доступа к прикрепленному файлу 
 * с учетом базового URL API и структуры путей
 * @param url URL или путь к файлу
 * @returns полный URL для доступа к файлу
 */
export function getFileUrl(url?: string): string | undefined {
    if (!url) {
        console.log('getFileUrl: URL не определен');
        return undefined;
    }
    
    if (url.startsWith('http://') || url.startsWith('https://')) {
        console.log('getFileUrl: абсолютный URL, возвращаем как есть:', url);
        return url;
    }
    
    // Если это URL с /uploads/ или содержит uploads/attachments (загруженный пользователем файл)
    if (url.startsWith('/uploads/') || url.includes('uploads/attachments/')) {
        console.log('getFileUrl: файл из uploads, формируем полный URL с baseURL API');
        
        // Нормализуем путь - убеждаемся, что он начинается с /
        let normalizedPath = url;
        if (url.includes('uploads/attachments/') && !url.startsWith('/')) {
            normalizedPath = '/' + url.substring(url.indexOf('uploads/attachments/'));
        }
        
        // Удаляем дублирующийся слеш, если есть
        if (normalizedPath.startsWith('//')) {
            normalizedPath = normalizedPath.substring(1);
        }
        
        // Добавляем baseURL API
        const result = `${api.defaults.baseURL}${normalizedPath}`;
        console.log('getFileUrl: сформированный URL:', result);
        return result;
    }
    
    // Если это просто имя файла без пути, предполагаем что это вложение из uploads/attachments
    if (!url.includes('/')) {
        console.log('getFileUrl: просто имя файла, предполагаем путь /uploads/attachments/');
        const result = `${api.defaults.baseURL}/uploads/attachments/${url}`;
        console.log('getFileUrl: сформированный URL:', result);
        return result;
    }
    
    // В остальных случаях предполагаем, что это URL относительно backend API
    const result = `${api.defaults.baseURL}${url.startsWith('/') ? '' : '/'}${url}`;
    console.log('getFileUrl: относительный URL API, сформированный URL:', result);
    return result;
} 