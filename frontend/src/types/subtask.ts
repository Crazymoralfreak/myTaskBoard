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
        email?: string;
        avatarUrl?: string;
        displayName?: string;
    };
    createdAt: string;
    updatedAt: string;
}

export interface CreateSubtaskRequest {
    title: string;
    description?: string;
    dueDate?: string;
    estimatedHours?: number;
    assigneeId?: number;
}

export interface UpdateSubtaskRequest {
    title?: string;
    description?: string;
    completed?: boolean;
    position?: number;
    dueDate?: string;
    estimatedHours?: number;
    assigneeId?: number;
} 