import { Board } from '../types/board';
import { Column } from '../types/column';
import { api } from '../api/api';

export const boardService = {
    async createBoard(board: Partial<Board>): Promise<Board> {
        const response = await api.post('/api/boards', board);
        return response.data;
    },

    async getUserBoards(userId: number): Promise<Board[]> {
        const response = await api.get(`/api/boards/user/${userId}`);
        return response.data;
    },

    async updateBoard(id: number, board: Partial<Board>): Promise<Board> {
        const response = await api.put(`/api/boards/${id}`, board);
        return response.data;
    },

    async deleteBoard(id: number): Promise<void> {
        await api.delete(`/api/boards/${id}`);
    },

    async archiveBoard(id: number): Promise<Board> {
        const response = await api.patch(`/api/boards/${id}/archive`);
        return response.data;
    },

    async restoreBoard(id: number): Promise<Board> {
        const response = await api.patch(`/api/boards/${id}/restore`);
        return response.data;
    },

    async addColumn(boardId: string, column: Partial<Column>): Promise<Board> {
        const response = await api.post<Board>(`/api/boards/${boardId}/columns`, column);
        return response.data;
    },

    async removeColumn(boardId: string, columnId: string): Promise<Board> {
        const response = await api.delete(`/api/boards/${boardId}/columns/${columnId}`);
        return response.data;
    },

    async moveColumn(boardId: string, columnId: string, newPosition: number): Promise<Board> {
        const response = await api.put<Board>(
            `/api/boards/${boardId}/columns/${columnId}/position`,
            { position: newPosition }
        );
        return response.data;
    },

    async getBoard(boardId: string): Promise<Board> {
        const response = await api.get<Board>(`/api/boards/${boardId}`);
        return response.data;
    }
}; 