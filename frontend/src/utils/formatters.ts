import { ru, enUS } from 'date-fns/locale';
import { formatInTimeZone } from 'date-fns-tz';

export function formatDuration(minutes: number): string {
    if (minutes < 60) {
        return `${minutes} мин`;
    }

    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;

    if (remainingMinutes === 0) {
        return `${hours} ч`;
    }

    return `${hours} ч ${remainingMinutes} мин`;
}

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

export function getDateFnsLocale(language: string) {
    switch (language) {
        case 'ru':
            return ru;
        case 'en':
            return enUS;
        default:
            return enUS;
    }
}

/**
 * Форматирует дату с учетом таймзоны пользователя
 * @param date - дата (Date или строка)
 * @param timeZone - таймзона (например, 'Europe/Moscow')
 * @param formatStr - строка формата date-fns (например, 'dd.MM.yyyy HH:mm')
 * @param language - язык ('ru' | 'en')
 */
export function formatDateWithTZ(date: Date | string, timeZone: string, formatStr: string, language: string) {
  // Создаем дату и интерпретируем её как UTC, если она не содержит информацию о часовом поясе
  let dateObj = new Date(date);
  
  // Если дата приходит без информации о часовом поясе (например, "2025-06-28T18:12:56.122465"),
  // то интерпретируем её как UTC
  if (typeof date === 'string' && !date.includes('Z') && !date.includes('+') && !date.includes('-', 10)) {
    dateObj = new Date(date + 'Z'); // Добавляем Z чтобы интерпретировать как UTC
  }
  
  const result = formatInTimeZone(dateObj, timeZone, formatStr, { locale: getDateFnsLocale(language) });
  
  // Отладочная информация
  if (process.env.NODE_ENV === 'development') {
    console.log('formatDateWithTZ:', {
      originalDate: date,
      parsedDate: dateObj.toISOString(),
      timeZone,
      formatStr,
      language,
      result
    });
  }
  
  return result;
} 