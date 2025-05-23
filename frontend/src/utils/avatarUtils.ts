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
  console.log('getAvatarUrl исходный URL:', url);
  
  if (!url) return undefined;
  
  // Если это абсолютный URL или data URL, возвращаем как есть
  if (url.startsWith('http') || url.startsWith('data:')) {
    console.log('getAvatarUrl: возвращаем абсолютный URL как есть');
    return url;
  }
  
  // Если это стандартная аватарка из директории /avatars (локальные в приложении)
  if (url.startsWith('/avatars/') || url.includes('/avatars/') && !url.includes('/uploads/')) {
    console.log('getAvatarUrl: стандартная аватарка из директории /avatars');
    // Формируем URL относительно корня frontend приложения
    return url;
  }
  
  // Если это URL с /uploads/ или содержит uploads/avatars (загруженный пользователем файл)
  if (url.startsWith('/uploads/') || url.includes('uploads/avatars/')) {
    console.log('getAvatarUrl: файл из uploads, формируем полный URL с baseURL API');
    
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
    const result = `${api.defaults.baseURL}${normalizedPath}`;
    console.log('getAvatarUrl: сформированный URL:', result);
    return result;
  }
  
  // Если это просто имя файла без пути, предполагаем что это аватарка из uploads/avatars
  if (!url.includes('/')) {
    console.log('getAvatarUrl: просто имя файла, предполагаем путь /uploads/avatars/');
    const result = `${api.defaults.baseURL}/uploads/avatars/${url}`;
    console.log('getAvatarUrl: сформированный URL:', result);
    return result;
  }
  
  // В остальных случаях предполагаем, что это URL относительно backend API
  const result = `${api.defaults.baseURL}${url.startsWith('/') ? '' : '/'}${url}`;
  console.log('getAvatarUrl: относительный URL API, сформированный URL:', result);
  return result;
}; 