import axiosInstance from '../api/axiosConfig';
import { InviteLink, CreateInviteLinkRequest, JoinBoardByInviteResponse } from '../types/inviteLink';

/**
 * Сервис для работы с ссылками-приглашениями
 */
export class InviteLinkService {
  /**
   * Создает новую ссылку-приглашение
   * @param boardId ID доски
   * @param request параметры создания ссылки
   * @returns созданная ссылка-приглашение
   */
  static async createInviteLink(boardId: string, request: CreateInviteLinkRequest): Promise<InviteLink> {
    const response = await axiosInstance.post<InviteLink>(`/api/boards/${boardId}/invite-links`, request);
    return response.data;
  }
  
  /**
   * Получает все активные ссылки-приглашения для доски
   * @param boardId ID доски
   * @returns список ссылок-приглашений
   */
  static async getBoardInviteLinks(boardId: string): Promise<InviteLink[]> {
    const response = await axiosInstance.get<InviteLink[]>(`/api/boards/${boardId}/invite-links`);
    return response.data;
  }
  
  /**
   * Деактивирует ссылку-приглашение
   * @param boardId ID доски
   * @param linkId ID ссылки
   */
  static async deactivateInviteLink(boardId: string, linkId: number): Promise<void> {
    await axiosInstance.delete(`/api/boards/${boardId}/invite-links/${linkId}`);
  }
  
  /**
   * Получает информацию о ссылке-приглашении
   * @param token токен приглашения
   * @returns информация о доске и приглашении
   */
  static async getInviteLinkInfo(token: string): Promise<JoinBoardByInviteResponse> {
    const response = await axiosInstance.get<JoinBoardByInviteResponse>(`/api/invite/${token}`);
    return response.data;
  }
  
  /**
   * Присоединяется к доске по ссылке-приглашению
   * @param token токен приглашения
   * @returns информация о доске и приглашении
   */
  static async joinByInviteLink(token: string): Promise<JoinBoardByInviteResponse> {
    const response = await axiosInstance.post<JoinBoardByInviteResponse>(`/api/invite/${token}`);
    return response.data;
  }
  
  /**
   * Копирует ссылку-приглашение в буфер обмена
   * @param inviteUrl ссылка для копирования
   * @returns успешность операции
   */
  static async copyInviteLinkToClipboard(inviteUrl: string): Promise<boolean> {
    try {
      await navigator.clipboard.writeText(inviteUrl);
      return true;
    } catch (error) {
      console.error('Failed to copy: ', error);
      return false;
    }
  }
} 