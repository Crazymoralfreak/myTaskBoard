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