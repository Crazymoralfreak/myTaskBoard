export type DefaultTaskStatus = 'todo' | 'in_progress' | 'completed';
export type TaskPriority = 'NONE' | 'LOW' | 'MEDIUM' | 'HIGH';

export type TaskStatus = 'todo' | 'in_progress' | 'completed';

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
    comments?: any[];
}

export interface CreateTaskRequest {
    title: string;
    description: string;
    status: string;
    priority: TaskPriority;
    startDate?: string;
    endDate?: string;
    statusId?: number;
    tags?: string[];
} 