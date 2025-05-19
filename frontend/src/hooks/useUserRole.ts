import { useMemo } from 'react';
import { SystemRoles } from '../types/Role';
import { Board } from '../types/board';

// Типы разрешений для действий на доске
export enum Permission {
  MANAGE_MEMBERS = 'manage_members',
  EDIT_MEMBERS_ROLES = 'edit_members_roles',
  ADD_COLUMNS = 'add_columns',
  EDIT_COLUMNS = 'edit_columns',
  DELETE_COLUMNS = 'delete_columns',
  EDIT_BOARD_SETTINGS = 'edit_board_settings',
  DELETE_BOARD = 'delete_board',
  ADD_TASKS = 'add_tasks',
  EDIT_TASKS = 'edit_tasks',
  DELETE_TASKS = 'delete_tasks',
  MOVE_TASKS = 'move_tasks'
}

// Интерфейс возвращаемого объекта хука
interface UserRoleHook {
  isOwner: boolean;
  isAdmin: boolean;
  userRole?: string;
  userRoleId?: number;
  hasPermission: (permission: Permission) => boolean;
  canManageRoles: () => boolean;
  canManageMembers: () => boolean;
  canManageBoard: () => boolean;
  canManageColumns: () => boolean;
  canManageTasks: () => boolean;
}

/**
 * Хук для работы с ролями пользователя и проверки прав доступа
 * @param board Текущая доска
 * @param userId ID текущего пользователя
 * @returns Объект с методами для проверки ролей и прав
 */
export function useUserRole(board: Board | null | undefined, userId?: number): UserRoleHook {
  // Получаем информацию о текущем пользователе из board
  const currentUser = useMemo(() => {
    if (!board) return null;
    return (board as any).currentUser as Board.CurrentUser | undefined;
  }, [board]);

  // Определяем, является ли пользователь владельцем доски
  const isOwner = useMemo(() => {
    if (!board || !userId) return false;
    return (board as any).owner?.id === userId;
  }, [board, userId]);

  // Получаем роль пользователя
  const userRole = useMemo(() => currentUser?.role, [currentUser]);
  const userRoleId = useMemo(() => currentUser?.roleId, [currentUser]);
  const isAdmin = useMemo(() => isOwner || !!currentUser?.isAdmin, [isOwner, currentUser]);

  /**
   * Проверяет наличие у пользователя определенного разрешения
   * @param permission Разрешение для проверки
   * @returns true, если пользователь имеет разрешение
   */
  const hasPermission = (permission: Permission): boolean => {
    // Владелец доски имеет все права
    if (isOwner) return true;

    // Проверяем роль и конкретное разрешение
    switch (permission) {
      // Права администратора
      case Permission.MANAGE_MEMBERS:
      case Permission.EDIT_MEMBERS_ROLES:
      case Permission.EDIT_BOARD_SETTINGS:
      case Permission.DELETE_BOARD:
        return isAdmin || userRole === SystemRoles.ADMIN;

      // Права редактора
      case Permission.ADD_COLUMNS:
      case Permission.EDIT_COLUMNS:
      case Permission.DELETE_COLUMNS:
      case Permission.ADD_TASKS:
      case Permission.EDIT_TASKS:
      case Permission.DELETE_TASKS:
      case Permission.MOVE_TASKS:
        return isAdmin || 
               userRole === SystemRoles.ADMIN || 
               userRole === SystemRoles.EDITOR;

      default:
        return false;
    }
  };

  // Вспомогательные функции для проверки групп разрешений
  const canManageRoles = (): boolean => hasPermission(Permission.EDIT_MEMBERS_ROLES);
  const canManageMembers = (): boolean => hasPermission(Permission.MANAGE_MEMBERS);
  const canManageBoard = (): boolean => hasPermission(Permission.EDIT_BOARD_SETTINGS);
  const canManageColumns = (): boolean => hasPermission(Permission.EDIT_COLUMNS);
  const canManageTasks = (): boolean => hasPermission(Permission.EDIT_TASKS);

  return {
    isOwner,
    isAdmin,
    userRole,
    userRoleId,
    hasPermission,
    canManageRoles,
    canManageMembers,
    canManageBoard,
    canManageColumns,
    canManageTasks
  };
} 