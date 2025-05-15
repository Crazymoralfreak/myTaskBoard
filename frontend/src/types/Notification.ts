import { User } from './user';

export interface Notification {
    id: number;
    user?: User;
    title: string;
    message: string;
    type: string; // Например: BOARD_INVITE, TASK_ASSIGNED
    relatedEntityId?: string;
    relatedEntityType?: string; // Например: BOARD, TASK
    isRead: boolean;
    createdAt: string; // ISO date string
    updatedAt: string; // ISO date string
} 