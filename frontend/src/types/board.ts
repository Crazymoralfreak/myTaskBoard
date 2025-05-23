import { Task } from './task';

export interface Board {
    id: string;
    name: string;
    description?: string;
    createdAt: string;
    updatedAt: string;
    columns: Column[];
    taskStatuses: BoardStatus[];
    taskTypes: TaskType[];
}

export interface BoardStatus {
    id: number;
    name: string;
    color: string;
    isDefault: boolean;
    isCustom: boolean;
    position: number;
    boardId?: string;
}

export interface TaskType {
    id: number;
    name: string;
    color: string;
    icon: string;
    isDefault: boolean;
    isCustom: boolean;
    position: number;
    boardId?: string;
}

export interface Column {
    id: string;
    name: string;
    position: number;
    tasks: Task[];
    color?: string;
}

export namespace Board {
  export interface CurrentUser {
    id: number;
    isAdmin: boolean;
    role?: string;
    roleId?: number;
  }
} 