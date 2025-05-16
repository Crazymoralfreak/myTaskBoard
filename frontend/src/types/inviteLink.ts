import { User } from './user';
import { Role } from './Role';

/**
 * Интерфейс для ссылки-приглашения
 */
export interface InviteLink {
  id: number;
  token: string;
  inviteUrl: string;
  createdBy: User;
  boardId: string;
  boardName: string;
  defaultRole: Role;
  maxUses?: number;
  useCount: number;
  expiresAt?: string;
  createdAt: string;
  isActive: boolean;
}

/**
 * Интерфейс для запроса на создание ссылки-приглашения
 */
export interface CreateInviteLinkRequest {
  defaultRoleId: number;
  maxUses?: number;
  expiresAt?: string;
}

/**
 * Интерфейс для ответа на запрос присоединения к доске по ссылке
 */
export interface JoinBoardByInviteResponse {
  boardId?: string;
  boardName?: string;
  invitedBy?: User;
  assignedRole?: Role;
  requiresAuthentication: boolean;
  alreadyMember?: boolean;
} 