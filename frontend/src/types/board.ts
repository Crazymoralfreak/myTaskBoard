export interface Board {
    id: string;
    name: string;
    description?: string;
    createdAt: string;
    updatedAt: string;
    columns: Column[];
}

export interface Column {
    id: string;
    name: string;
    position: number;
    tasks: Task[];
}

export interface Task {
    id: string;
    title: string;
    description?: string;
    status: 'todo' | 'in_progress' | 'completed';
    priority: 'low' | 'medium' | 'high';
    dueDate?: string;
} 