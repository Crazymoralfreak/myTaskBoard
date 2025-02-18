export interface Subtask {
    id: number;
    title: string;
    description?: string;
    completed: boolean;
    position: number;
    dueDate?: string;
    estimatedHours?: number;
    assignee?: {
        id: number;
        username: string;
        avatarUrl?: string;
    };
    createdAt: string;
    updatedAt: string;
}

export interface CreateSubtaskRequest {
    title: string;
    description?: string;
    dueDate?: string;
    estimatedHours?: number;
}

export interface UpdateSubtaskRequest {
    title?: string;
    description?: string;
    completed?: boolean;
    position?: number;
    dueDate?: string;
    estimatedHours?: number;
} 