import axiosInstance from '../api/axiosConfig';
import { User } from '../types/user';

/**
 * Сервис для поиска пользователей
 */
export class UserSearchService {
  /**
   * Выполняет поиск пользователей по запросу
   * @param query Строка поиска
   * @param searchType Тип поиска (username, email, any)
   * @param limit Ограничение количества результатов
   * @returns Список пользователей
   */
  static async searchUsers(query: string, searchType?: string, limit: number = 10): Promise<User[]> {
    console.log('Поиск пользователей с параметрами:', { query, searchType, limit });
    
    try {
      const params = new URLSearchParams();
      params.append('query', query);
      
      if (searchType) {
        params.append('searchType', searchType);
      }
      
      params.append('limit', limit.toString());
      
      console.log('Отправляем запрос на:', '/api/users/search', { params });
      const response = await axiosInstance.get<User[]>('/api/users/search', { params });
      console.log('Результаты поиска пользователей:', response.data);
      return response.data;
    } catch (error) {
      console.error('Ошибка при поиске пользователей:', error);
      throw error;
    }
  }
  
  /**
   * Выполняет поиск пользователей по имени пользователя
   * @param username Имя пользователя
   * @returns Список пользователей
   */
  static async searchByUsername(username: string): Promise<User[]> {
    console.log('Поиск пользователей по имени пользователя:', username);
    
    try {
      const params = new URLSearchParams();
      params.append('username', username);
      
      const response = await axiosInstance.get<User[]>('/api/users/search/by-username', { params });
      console.log('Результаты поиска по имени пользователя:', response.data);
      return response.data;
    } catch (error) {
      console.error('Ошибка при поиске пользователей по имени:', error);
      throw error;
    }
  }
  
  /**
   * Выполняет поиск пользователей по email
   * @param email Email
   * @returns Список пользователей
   */
  static async searchByEmail(email: string): Promise<User[]> {
    console.log('Поиск пользователей по email:', email);
    
    try {
      const params = new URLSearchParams();
      params.append('email', email);
      
      const response = await axiosInstance.get<User[]>('/api/users/search/by-email', { params });
      console.log('Результаты поиска по email:', response.data);
      return response.data;
    } catch (error) {
      console.error('Ошибка при поиске пользователей по email:', error);
      throw error;
    }
  }
} 