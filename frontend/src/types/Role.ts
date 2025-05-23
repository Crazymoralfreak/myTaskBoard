/**
 * Интерфейс для представления роли пользователя в системе
 */
export interface Role {
  id: number;
  name: string;
  description?: string;
  isSystem?: boolean;
}

/**
 * Системные роли пользователей на доске
 */
export enum SystemRoles {
  ADMIN = 'ADMIN',
  EDITOR = 'EDITOR',
  VIEWER = 'VIEWER'
}

export interface RoleDto {
    id: string;
    name: string;
    description?: string;
    boardId?: string | null;
    isSystemRole: boolean;
    permissions: Record<string, boolean>; // Corresponds to Map<String, Boolean>
    createdAt: string; // ISO 8601 date string
    updatedAt: string; // ISO 8601 date string
} 