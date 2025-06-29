import { SystemRoles } from '../types/Role';

/**
 * Получает отображаемое имя роли для пользователя
 * @param roleName системное имя роли
 * @param t функция перевода
 * @returns локализованное отображаемое имя роли
 */
export const getRoleDisplayName = (roleName: string, t: (key: string) => string): string => {
  switch (roleName) {
    case SystemRoles.ADMIN:
      return t('roleDisplayAdmin');
    case SystemRoles.EDITOR:
      return t('roleDisplayEditor'); // Отображается как "Участник/Member"
    case SystemRoles.VIEWER:
      return t('roleDisplayViewer');
    default:
      return roleName; // Возвращаем оригинальное имя для неизвестных ролей
  }
};

/**
 * Получает локализованное описание роли
 * @param roleName системное имя роли
 * @param t функция перевода
 * @returns локализованное описание роли
 */
export const getRoleDescription = (roleName: string, t: (key: string) => string): string => {
  switch (roleName) {
    case SystemRoles.ADMIN:
      return t('roleDescriptionAdmin');
    case SystemRoles.EDITOR:
      return t('roleDescriptionEditor');
    case SystemRoles.VIEWER:
      return t('roleDescriptionViewer');
    default:
      return t('roleDescriptionMissing');
  }
};

/**
 * Получает цвета для роли с учетом темы (фон и текст)
 * @param roleName системное имя роли
 * @param isDarkMode является ли тема темной
 * @returns объект с цветами фона и текста
 */
export const getRoleColors = (roleName?: string, isDarkMode: boolean = false): { 
  background: string; 
  color: string; 
  border?: string;
} => {
  if (!roleName) {
    return isDarkMode 
      ? { background: '#424242', color: '#e0e0e0' }
      : { background: '#f5f5f5', color: '#616161' };
  }

  switch (roleName) {
    case SystemRoles.ADMIN:
      return isDarkMode 
        ? { background: '#d32f2f', color: '#ffffff', border: '#f44336' }
        : { background: '#ffebee', color: '#c62828', border: '#e57373' };
        
    case SystemRoles.EDITOR:
      return isDarkMode 
        ? { background: '#1976d2', color: '#ffffff', border: '#2196f3' }
        : { background: '#e3f2fd', color: '#1565c0', border: '#64b5f6' };
        
    case SystemRoles.VIEWER:
      return isDarkMode 
        ? { background: '#388e3c', color: '#ffffff', border: '#4caf50' }
        : { background: '#e8f5e8', color: '#2e7d32', border: '#81c784' };
        
    default:
      return isDarkMode 
        ? { background: '#616161', color: '#ffffff', border: '#9e9e9e' }
        : { background: '#f5f5f5', color: '#424242', border: '#bdbdbd' };
  }
};

/**
 * Получает цвет фона для роли (обратная совместимость)
 * @param roleName системное имя роли
 * @param isDarkMode является ли тема темной
 * @returns цвет фона
 */
export const getRoleColor = (roleName?: string, isDarkMode: boolean = false): string => {
  return getRoleColors(roleName, isDarkMode).background;
};

/**
 * Получает цвет текста для роли
 * @param roleName системное имя роли
 * @param isDarkMode является ли тема темной
 * @returns цвет текста
 */
export const getRoleTextColor = (roleName?: string, isDarkMode: boolean = false): string => {
  return getRoleColors(roleName, isDarkMode).color;
};

/**
 * Проверяет, может ли роль управлять участниками
 * @param roleName системное имя роли
 * @returns true если роль может управлять участниками
 */
export const canManageMembers = (roleName: string): boolean => {
  return roleName === SystemRoles.ADMIN;
};

/**
 * Проверяет, может ли роль редактировать задачи
 * @param roleName системное имя роли
 * @returns true если роль может редактировать задачи
 */
export const canEditTasks = (roleName: string): boolean => {
  return roleName === SystemRoles.ADMIN || roleName === SystemRoles.EDITOR;
};

/**
 * Проверяет, может ли роль просматривать доску
 * @param roleName системное имя роли
 * @returns true если роль может просматривать доску
 */
export const canViewBoard = (roleName: string): boolean => {
  return roleName === SystemRoles.ADMIN || 
         roleName === SystemRoles.EDITOR || 
         roleName === SystemRoles.VIEWER;
}; 