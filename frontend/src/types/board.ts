import { Task } from './task';

export interface Board {
    id: string;
    name: string;
    description?: string;
    createdAt: string;
    updatedAt: string;
    columns: Column[];
    taskStatuses: Array<{
        id: number;
        name: string;
        color: string;
        isDefault: boolean;
        isCustom: boolean;
        position: number;
    }>;
}

export interface BoardStatus {
    id: number;
    name: string;
    color: string;
    isDefault: boolean;
    isCustom: boolean;
    position: number;
}

export interface Column {
    id: number;
    name: string;
    position: number;
    tasks: Task[];
    color?: string;
} 