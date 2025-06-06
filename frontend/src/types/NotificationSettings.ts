export interface NotificationSettings {
  id?: number;
  globalNotificationsEnabled: boolean;
  emailNotificationsEnabled: boolean;
  telegramNotificationsEnabled: boolean;
  browserNotificationsEnabled: boolean;
  
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
  onlyHighPriorityNotifications: boolean;
  groupSimilarNotifications: boolean;
}

// Для совместимости с существующим кодом
export type NotificationPreferences = NotificationSettings; 