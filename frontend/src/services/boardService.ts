import axiosInstance from '../api/axiosConfig';
import { Board } from '../types/board';

export const boardService = {
    async getUserBoards(): Promise<Board[]> {
        const response = await axiosInstance.get('/boards');
        return response.data;
    },

    async createBoard(data: { name: string; description?: string }): Promise<Board> {
        const response = await axiosInstance.post('/boards', data);
        return response.data;
    },

    async getBoard(id: string): Promise<Board> {
        const response = await axiosInstance.get(`/boards/${id}`);
        return response.data;
    },

    async updateBoard(id: string, data: { name?: string; description?: string }): Promise<Board> {
        const response = await axiosInstance.put(`/boards/${id}`, data);
        return response.data;
    },

    async deleteBoard(id: string): Promise<void> {
        await axiosInstance.delete(`/boards/${id}`);
    },

    async addColumn(boardId: string, data: { name: string }): Promise<Board> {
        const response = await axiosInstance.post(`/boards/${boardId}/columns`, data);
        return response.data;
    },

    async removeColumn(boardId: string, columnId: string): Promise<Board> {
        const response = await axiosInstance.delete(`/boards/${boardId}/columns/${columnId}`);
        return response.data;
    },

    async moveColumn(boardId: string, columnId: string, newPosition: number): Promise<Board> {
        const response = await axiosInstance.patch(
            `/boards/${boardId}/columns/${columnId}/move/${newPosition}`
        );
        return response.data;
    }
}; 