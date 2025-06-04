import { User } from './user';
import { RoleDto } from './role';
import { Role } from './Role';

export interface BoardMemberDto {
    id: string;
    user: User; // Assuming User interface from user.ts is equivalent to UserDTO
    role: RoleDto;
    boardId: string;
    joinedAt: string; // ISO 8601 date string, mapped from createdAt in BoardMember entity
}

/**
 * Интерфейс для представления участника доски
 */
export interface BoardMember {
  userId: number;
  username: string;
  email: string;
  avatarUrl?: string;
  displayName?: string;
  role: Role;
  joinedAt: string; // ISO 8601 date string
  user: {
    id: number;
    username: string;
    email: string;
    avatarUrl?: string;
  };
}

/**
 * Интерфейс для запроса на добавление участника к доске
 */
export interface AddBoardMemberRequest {
  userId: number;
  roleId: number;
}

/**
 * Интерфейс для запроса на обновление роли участника доски
 */
export interface UpdateMemberRoleRequest {
  roleId: number;
} 