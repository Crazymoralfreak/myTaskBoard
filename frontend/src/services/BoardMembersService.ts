import axiosInstance from '../api/axiosConfig';
import { BoardMember, AddBoardMemberRequest, UpdateMemberRoleRequest } from '../types/BoardMember';

/**
 * Сервис для работы с участниками доски
 */
export class BoardMembersService {
  /**
   * Получает всех участников доски
   * @param boardId ID доски
   * @returns Список участников
   */
  static async getBoardMembers(boardId: string): Promise<BoardMember[]> {
    console.log('Вызываем getBoardMembers для boardId:', boardId);
    try {
      // Используем относительный путь с префиксом /api
      const url = `/api/boards/${boardId}/members`;
      console.log('URL запроса:', url);
      
      const response = await axiosInstance.get<BoardMember[]>(url);
      console.log('Получен ответ:', response.data);
      return response.data;
    } catch (error) {
      console.error('Ошибка при получении участников доски:', error);
      throw error;
    }
  }
  
  /**
   * Добавляет пользователя к доске
   * @param boardId ID доски
   * @param request Запрос на добавление пользователя
   * @returns Добавленный участник
   */
  static async addMemberToBoard(boardId: string, request: AddBoardMemberRequest): Promise<BoardMember> {
    try {
      const url = `/api/boards/${boardId}/members`;
      console.log('Добавление участника:', url, request);
      
      const response = await axiosInstance.post<BoardMember>(url, request);
      return response.data;
    } catch (error) {
      console.error('Ошибка при добавлении участника:', error);
      throw error;
    }
  }
  
  /**
   * Обновляет роль участника доски
   * @param boardId ID доски
   * @param userId ID пользователя
   * @param request Запрос на обновление роли
   * @returns Обновленный участник
   */
  static async updateMemberRole(boardId: string, userId: number, request: UpdateMemberRoleRequest): Promise<BoardMember> {
    try {
      const url = `/api/boards/${boardId}/members/${userId}/role`;
      console.log('Обновление роли участника:', url, request);
      
      const response = await axiosInstance.put<BoardMember>(url, request);
      return response.data;
    } catch (error) {
      console.error('Ошибка при обновлении роли участника:', error);
      throw error;
    }
  }
  
  /**
   * Удаляет пользователя из доски
   * @param boardId ID доски
   * @param userId ID пользователя
   */
  static async removeMemberFromBoard(boardId: string, userId: number): Promise<void> {
    try {
      const url = `/api/boards/${boardId}/members/${userId}`;
      console.log('Удаление участника:', url);
      
      await axiosInstance.delete(url);
    } catch (error) {
      console.error('Ошибка при удалении участника:', error);
      throw error;
    }
  }
} 