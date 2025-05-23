import axiosInstance from '../api/axiosConfig';
import { Role } from '../types/Role';

/**
 * Сервис для работы с ролями
 */
export class RolesService {
  /**
   * Получает все системные роли
   * @returns Список системных ролей
   */
  static async getAllSystemRoles(): Promise<Role[]> {
    console.log('Получаем системные роли');
    try {
      const url = '/api/roles';
      console.log('URL запроса:', url);
      
      const response = await axiosInstance.get<Role[]>(url);
      console.log('Получены системные роли:', response.data);
      return response.data;
    } catch (error) {
      console.error('Ошибка при получении системных ролей:', error);
      throw error;
    }
  }
  
  /**
   * Получает роли для конкретной доски
   * @param boardId ID доски
   * @returns Список ролей
   */
  static async getBoardRoles(boardId: string): Promise<Role[]> {
    console.log('Получаем роли для доски:', boardId);
    try {
      const url = `/api/roles/boards/${boardId}`;
      console.log('URL запроса:', url);
      
      const response = await axiosInstance.get<Role[]>(url);
      console.log('Получены роли для доски:', response.data);
      return response.data;
    } catch (error) {
      console.error('Ошибка при получении ролей доски:', error);
      throw error;
    }
  }
} 