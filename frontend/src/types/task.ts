import { Subtask } from './subtask';
import { TaskType, BoardStatus } from './board';

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
        email?: string;
        displayName?: string;
    };
}

export interface TaskAttachment {
    id: number;
    filename: string;
    size: number;
    mimeType: string;
    createdAt: string;
    url: string;
    uploadedBy: {
        id: number;
        username: string;
    };
}

export interface TaskHistory {
    id: number;
    username: string;
    email?: string;
    avatarUrl?: string;
    action: string;
    oldValue?: string;
    newValue?: string;
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
    customStatus?: BoardStatus;
    type?: TaskType;
    columnId?: string;
    boardId?: string;
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
    commentCount: number;
    attachmentCount: number;
}

export interface CreateTaskRequest {
    title: string;
    description?: string;
    startDate?: string;
    endDate?: string;
    dueDate?: string;
    status?: 'todo' | 'in_progress' | 'completed';
    statusId?: number | null;
    typeId?: number | null;
    priority?: 'NONE' | 'LOW' | 'MEDIUM' | 'HIGH';
    tags?: string[];
    columnColor?: string;
    columnId: string;
    boardId?: string | number;
}

export interface TaskTemplate {
    id: number;
    name: string;
    description?: string;
    taskData: {
        title: string;
        description?: string;
        typeId?: number;
        statusId?: number;
        priority: TaskPriority;
        dueDate?: string;
    };
    tags?: string[];
    boardId: string;
    createdBy: number;
    createdAt: string;
    updatedAt: string;
} 