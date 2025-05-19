import { api } from '../api/api';

/**
 * Функция для формирования полного URL аватарки на основе относительного пути
 * Поддерживает два типа аватарок:
 * 1. Стандартные аватарки из директории /avatars
 * 2. Загруженные пользователем аватарки из /uploads/avatars
 * 
 * @param url Относительный путь к аватарке
 * @returns Полный URL аватарки для отображения
 */
export const getAvatarUrl = (url?: string): string | undefined => {
  if (!url) return undefined;
  
  // Если это абсолютный URL или data URL, возвращаем как есть
  if (url.startsWith('http') || url.startsWith('data:')) {
    return url;
  }
  
  // Если это стандартная аватарка из директории /avatars (локальные в приложении)
  if (url.startsWith('/avatars/') || url.includes('/avatars/') && !url.includes('/uploads/')) {
    // Формируем URL относительно корня frontend приложения
    return url;
  }
  
  // Если это URL с /uploads/ или содержит uploads/avatars (загруженный пользователем файл)
  if (url.startsWith('/uploads/') || url.includes('uploads/avatars/')) {
    // Нормализуем путь - убеждаемся, что он начинается с /
    let normalizedPath = url;
    if (url.includes('uploads/avatars/') && !url.startsWith('/')) {
      normalizedPath = '/' + url.substring(url.indexOf('uploads/avatars/'));
    }
    
    // Удаляем дублирующийся слеш, если есть
    if (normalizedPath.startsWith('//')) {
      normalizedPath = normalizedPath.substring(1);
    }
    
    // Добавляем baseURL API
    return `${api.defaults.baseURL}${normalizedPath}`;
  }
  
  // Если это просто имя файла без пути, предполагаем что это аватарка из uploads/avatars
  if (!url.includes('/')) {
    return `${api.defaults.baseURL}/uploads/avatars/${url}`;
  }
  
  // В остальных случаях предполагаем, что это URL относительно backend API
  return `${api.defaults.baseURL}${url.startsWith('/') ? '' : '/'}${url}`;
}; 