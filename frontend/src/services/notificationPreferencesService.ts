import { api } from '../api/api';

export interface NotificationPreferences {
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

export const notificationPreferencesService = {
    /**
     * Получает настройки уведомлений текущего пользователя
     */
    getNotificationPreferences: async (): Promise<NotificationPreferences> => {
        const response = await api.get('/api/notifications/preferences');
        return response.data;
    },

    /**
     * Обновляет все настройки уведомлений
     */
    updateNotificationPreferences: async (preferences: Partial<NotificationPreferences>): Promise<NotificationPreferences> => {
        const response = await api.put('/api/notifications/preferences', preferences);
        return response.data;
    },

    /**
     * Обновляет отдельную настройку уведомлений
     * @param settingKey ключ настройки
     * @param value значение настройки
     * @returns обновленные настройки
     */
    updateNotificationSetting: async (settingKey: string, value: boolean): Promise<NotificationPreferences> => {
        const response = await api.patch(`/api/notifications/preferences/${settingKey}`, { value });
        return response.data;
    }
};

// Экспортируем функции для обратной совместимости
export const getNotificationPreferences = notificationPreferencesService.getNotificationPreferences;
export const updateNotificationPreferences = notificationPreferencesService.updateNotificationPreferences;
export const updateNotificationSetting = notificationPreferencesService.updateNotificationSetting;

export default notificationPreferencesService; 