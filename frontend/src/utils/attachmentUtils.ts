import { api } from '../api/api';

/**
 * Функция для формирования полного URL вложения на основе относительного пути
 * Аналогично avatarUtils, но для вложений к задачам
 * 
 * @param url Относительный путь к вложению
 * @returns Полный URL вложения для отображения, скачивания и предпросмотра
 */
export const getAttachmentUrl = (url?: string): string | undefined => {
  console.log('getAttachmentUrl исходный URL:', url);
  
  if (!url) return undefined;
  
  // Если это абсолютный URL или data URL, возвращаем как есть
  if (url.startsWith('http') || url.startsWith('data:')) {
    console.log('getAttachmentUrl: возвращаем абсолютный URL как есть');
    return url;
  }
  
  // Если это URL с /uploads/ или содержит uploads/attachments (загруженный файл)
  if (url.startsWith('/uploads/') || url.includes('uploads/attachments/')) {
    console.log('getAttachmentUrl: файл из uploads, формируем полный URL с baseURL API');
    
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
    console.log('getAttachmentUrl: сформированный URL:', result);
    return result;
  }
  
  // Если это просто имя файла без пути, предполагаем что это вложение из uploads/attachments
  if (!url.includes('/')) {
    console.log('getAttachmentUrl: просто имя файла, предполагаем путь /uploads/attachments/');
    const result = `${api.defaults.baseURL}/uploads/attachments/${url}`;
    console.log('getAttachmentUrl: сформированный URL:', result);
    return result;
  }
  
  // В остальных случаях предполагаем, что это URL относительно backend API
  const result = `${api.defaults.baseURL}${url.startsWith('/') ? '' : '/'}${url}`;
  console.log('getAttachmentUrl: относительный URL API, сформированный URL:', result);
  return result;
}; 