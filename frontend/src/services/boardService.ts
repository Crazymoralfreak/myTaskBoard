import axios from 'axios';
import { Board } from '../types/board';
import { Column } from '../types/column';
import { api } from '../api/api';

const API_URL = '/api/boards';

const axiosInstance = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    },
    withCredentials: true
});

// Добавляем интерцептор для установки токена
axiosInstance.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
        console.log('Token set:', token); // Для отладки
    } else {
        console.warn('No token found'); // Для отладки
    }
    return config;
});

export const boardService = {
    async createBoard(board: Partial<Board>): Promise<Board> {
        const response = await api.post('/boards', board);
        return response.data;
    },

    async getUserBoards(userId: number): Promise<Board[]> {
        const response = await api.get(`/boards/user/${userId}`);
        return response.data;
    },

    async updateBoard(id: number, board: Partial<Board>): Promise<Board> {
        const response = await axiosInstance.put(`/${id}`, board);
        return response.data;
    },

    async deleteBoard(id: number): Promise<void> {
        await axiosInstance.delete(`/${id}`);
    },

    async archiveBoard(id: number): Promise<Board> {
        const response = await axiosInstance.patch(`/${id}/archive`);
        return response.data;
    },

    async restoreBoard(id: number): Promise<Board> {
        const response = await axiosInstance.patch(`/${id}/restore`);
        return response.data;
    },

    async addColumn(boardId: string, column: Partial<Column>): Promise<Board> {
        const response = await api.post<Board>(`/boards/${boardId}/columns`, column);
        return response.data;
    },

    async removeColumn(boardId: string, columnId: string): Promise<Board> {
        const response = await axiosInstance.delete(`/boards/${boardId}/columns/${columnId}`);
        return response.data;
    },

    async moveColumn(boardId: string, columnId: string, newPosition: number): Promise<Board> {
        const response = await api.put<Board>(
            `/boards/${boardId}/columns/${columnId}/position`,
            { position: newPosition }
        );
        return response.data;
    },

    async getBoard(boardId: string): Promise<Board> {
        const response = await api.get<Board>(`/boards/${boardId}`);
        return response.data;
    }
}; 