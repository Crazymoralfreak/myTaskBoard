import axiosInstance from '../api/axiosConfig';
import { 
  Notification, 
  NotificationCountResponse, 
  MarkAllAsReadResponse, 
  NotificationPreferences 
} from '../types/Notification';

/**
 * Сервис для работы с уведомлениями
 */
export class NotificationsService {
  /**
   * Получает уведомления пользователя
   * @param page номер страницы
   * @param size размер страницы
   * @returns страница с уведомлениями
   */
  static async getNotifications(page: number = 0, size: number = 20): Promise<{
    content: Notification[];
    totalElements: number;
    totalPages: number;
    size: number;
    number: number;
  }> {
    const response = await axiosInstance.get(`/api/notifications?page=${page}&size=${size}`);
    return response.data;
  }
  
  /**
   * Получает архивированные уведомления пользователя
   * @param page номер страницы
   * @param size размер страницы
   * @returns страница с архивированными уведомлениями
   */
  static async getArchivedNotifications(page: number = 0, size: number = 20): Promise<{
    content: Notification[];
    totalElements: number;
    totalPages: number;
    size: number;
    number: number;
  }> {
    const response = await axiosInstance.get(`/api/notifications/archived?page=${page}&size=${size}`);
    return response.data;
  }
  
  /**
   * Получает непрочитанные уведомления пользователя
   * @returns список непрочитанных уведомлений
   */
  static async getUnreadNotifications(): Promise<Notification[]> {
    const response = await axiosInstance.get('/api/notifications/unread');
    return response.data;
  }
  
  /**
   * Получает количество непрочитанных уведомлений пользователя
   * @returns количество непрочитанных уведомлений
   */
  static async getUnreadCount(): Promise<number> {
    const response = await axiosInstance.get<NotificationCountResponse>('/api/notifications/unread/count');
    return response.data.count;
  }
  
  /**
   * Отмечает уведомление как прочитанное
   * @param notificationId ID уведомления
   * @returns обновленное уведомление
   */
  static async markAsRead(notificationId: number): Promise<Notification> {
    const response = await axiosInstance.put<Notification>(`/api/notifications/${notificationId}/read`);
    return response.data;
  }
  
  /**
   * Архивирует уведомление
   * @param notificationId ID уведомления
   * @returns обновленное уведомление
   */
  static async archiveNotification(notificationId: number): Promise<Notification> {
    const response = await axiosInstance.put<Notification>(`/api/notifications/${notificationId}/archive`);
    return response.data;
  }
  
  /**
   * Отмечает все уведомления как прочитанные
   * @returns количество обновленных уведомлений
   */
  static async markAllAsRead(): Promise<number> {
    const response = await axiosInstance.put<MarkAllAsReadResponse>('/api/notifications/read-all');
    return response.data.updatedCount;
  }
  
  /**
   * Получает настройки уведомлений пользователя
   * @returns настройки уведомлений
   */
  static async getNotificationPreferences(): Promise<NotificationPreferences> {
    const response = await axiosInstance.get<NotificationPreferences>('/api/notifications/preferences');
    return response.data;
  }
  
  /**
   * Обновляет настройки уведомлений пользователя
   * @param preferences настройки уведомлений
   * @returns обновленные настройки
   */
  static async updateNotificationPreferences(preferences: NotificationPreferences): Promise<NotificationPreferences> {
    const response = await axiosInstance.put<NotificationPreferences>('/api/notifications/preferences', preferences);
    return response.data;
  }

  /**
   * Удаляет уведомление
   * @param notificationId ID уведомления
   */
  static async deleteNotification(notificationId: number): Promise<void> {
    await axiosInstance.delete(`/api/notifications/${notificationId}`);
  }

  /**
   * Удаляет несколько уведомлений
   * @param notificationIds массив ID уведомлений
   */
  static async deleteNotifications(notificationIds: number[]): Promise<void> {
    await axiosInstance.delete('/api/notifications/bulk', {
      data: { ids: notificationIds }
    });
  }

  /**
   * Отмечает несколько уведомлений как прочитанные
   * @param notificationIds массив ID уведомлений
   */
  static async markMultipleAsRead(notificationIds: number[]): Promise<void> {
    await axiosInstance.put('/api/notifications/bulk/read', {
      ids: notificationIds
    });
  }
} 