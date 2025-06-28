import { ru, enUS } from 'date-fns/locale';

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