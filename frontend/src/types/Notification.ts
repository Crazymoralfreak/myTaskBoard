import { User } from './user';

/**
 * Тип уведомления
 */
export enum NotificationType {
  BOARD_INVITE = 'BOARD_INVITE',
  TASK_ASSIGNED = 'TASK_ASSIGNED',
  TASK_DUE_SOON = 'TASK_DUE_SOON',
  TASK_OVERDUE = 'TASK_OVERDUE',
  NEW_COMMENT_MENTION = 'NEW_COMMENT_MENTION',
  TASK_STATUS_CHANGED = 'TASK_STATUS_CHANGED'
}

/**
 * Интерфейс уведомления
 */
export interface Notification {
  id: number;
  user?: User;
  title: string;
  message: string;
  type: NotificationType | string;
  relatedEntityId?: string;
  relatedEntityType?: string;
  isRead: boolean;
  createdAt: string;
  updatedAt?: string;
}

/**
 * Интерфейс ответа с количеством уведомлений
 */
export interface NotificationCountResponse {
  count: number;
}

/**
 * Интерфейс ответа на отметку всех уведомлений как прочитанных
 */
export interface MarkAllAsReadResponse {
  updatedCount: number;
} 