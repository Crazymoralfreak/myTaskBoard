import axiosInstance from '../api/axiosConfig';
import { Notification, NotificationCountResponse, MarkAllAsReadResponse } from '../types/notification';

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
   * Отмечает все уведомления как прочитанные
   * @returns количество обновленных уведомлений
   */
  static async markAllAsRead(): Promise<number> {
    const response = await axiosInstance.put<MarkAllAsReadResponse>('/api/notifications/read-all');
    return response.data.updatedCount;
  }
} 