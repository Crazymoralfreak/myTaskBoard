import { Subtask } from './subtask';

export type DefaultTaskStatus = 'todo' | 'in_progress' | 'completed';
export type TaskPriority = 'NONE' | 'LOW' | 'MEDIUM' | 'HIGH';

export type TaskStatus = 'todo' | 'in_progress' | 'completed';

export interface TaskComment {
    id: number;
    content: string;
    createdAt: string;
    updatedAt: string;
    author: {
        id: number;
        username: string;
        avatarUrl?: string;
    };
}

export interface TaskAttachment {
    id: number;
    filename: string;
    url: string;
    size: number;
    mimeType: string;
    createdAt: string;
    uploadedBy: {
        id: number;
        username: string;
    };
}

export interface TaskHistory {
    id: number;
    username: string;
    avatarUrl?: string;
    action: 'created' | 'updated' | 'comment_added' | 'file_added';
    timestamp: string;
    changes?: {
        field?: string;
        oldValue?: string;
        newValue?: string;
    };
}

export interface Task {
    id: number;
    title: string;
    description: string;
    position: number | null;
    startDate: string | null;
    endDate: string | null;
    daysRemaining: number | null;
    customStatus?: {
        id: number;
        name: string;
        color: string;
        isDefault: boolean;
        isCustom: boolean;
        position: number;
    };
    columnId?: string;
    status?: 'todo' | 'in_progress' | 'completed';
    priority: 'NONE' | 'LOW' | 'MEDIUM' | 'HIGH';
    tags?: string[];
    comments?: TaskComment[];
    attachments?: TaskAttachment[];
    history?: TaskHistory[];
    checklist?: {
        id: number;
        title: string;
        items: Array<{
            id: number;
            content: string;
            completed: boolean;
            createdAt: string;
        }>;
    }[];
    timeTracking?: {
        estimate: number; // в минутах
        spent: number; // в минутах
        lastStarted?: string;
        isRunning: boolean;
    };
    linkedTasks?: Array<{
        id: number;
        title: string;
        type: 'blocks' | 'blocked_by' | 'relates_to';
    }>;
    watchers?: Array<{
        id: number;
        username: string;
        avatarUrl?: string;
    }>;
    subtasks?: Array<Subtask>;
}

export interface CreateTaskRequest {
    title: string;
    description?: string;
    startDate?: string;
    endDate?: string;
    dueDate?: string;
    status?: 'todo' | 'in_progress' | 'completed';
    statusId?: number;
    priority?: 'NONE' | 'LOW' | 'MEDIUM' | 'HIGH';
    tags?: string[];
    columnColor?: string;
    columnId: string;
} 