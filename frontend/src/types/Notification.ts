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
  TASK_STATUS_CHANGED = 'TASK_STATUS_CHANGED',
  TASK_CREATED = 'TASK_CREATED',
  TASK_UPDATED = 'TASK_UPDATED',
  TASK_DELETED = 'TASK_DELETED',
  TASK_COMMENT_ADDED = 'TASK_COMMENT_ADDED',
  SUBTASK_CREATED = 'SUBTASK_CREATED',
  SUBTASK_COMPLETED = 'SUBTASK_COMPLETED',
  BOARD_MEMBER_ADDED = 'BOARD_MEMBER_ADDED',
  BOARD_MEMBER_REMOVED = 'BOARD_MEMBER_REMOVED',
  ATTACHMENT_ADDED = 'ATTACHMENT_ADDED',
  DEADLINE_REMINDER = 'DEADLINE_REMINDER',
  ROLE_CHANGED = 'ROLE_CHANGED'
}

/**
 * Приоритет уведомления
 */
export enum NotificationPriority {
  CRITICAL = 'CRITICAL',
  HIGH = 'HIGH',
  NORMAL = 'NORMAL',
  LOW = 'LOW'
}

/**
 * Интерфейс уведомления (соответствует backend DTO)
 */
export interface Notification {
  id: number;
  user?: User;
  title: string;
  message: string;
  type: NotificationType | string;
  priority: NotificationPriority;
  relatedEntityId?: string;
  relatedEntityType?: string;
  groupKey?: string;
  read: boolean;
  archived: boolean;
  createdAt: string;
  updatedAt?: string;
  readAt?: string;
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

/**
 * Настройки уведомлений пользователя
 */
export interface NotificationPreferences {
  id?: number;
  
  // Глобальные настройки
  globalNotificationsEnabled: boolean;
  emailNotificationsEnabled: boolean;
  telegramNotificationsEnabled: boolean;
  browserNotificationsEnabled: boolean;
  
  // Настройки по типам уведомлений
  boardInviteNotifications: boolean;
  taskAssignedNotifications: boolean;
  taskStatusChangedNotifications: boolean;
  taskCreatedNotifications: boolean;
  taskUpdatedNotifications: boolean;
  taskDeletedNotifications: boolean;
  taskCommentAddedNotifications: boolean;
  mentionNotifications: boolean;
  subtaskCreatedNotifications: boolean;
  subtaskCompletedNotifications: boolean;
  boardMemberAddedNotifications: boolean;
  boardMemberRemovedNotifications: boolean;
  attachmentAddedNotifications: boolean;
  deadlineReminderNotifications: boolean;
  roleChangedNotifications: boolean;
  taskDueSoonNotifications: boolean;
  taskOverdueNotifications: boolean;
  
  // Настройки приоритетов
  onlyHighPriorityNotifications: boolean;
  groupSimilarNotifications: boolean;
} 