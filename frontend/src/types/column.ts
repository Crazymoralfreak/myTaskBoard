import { Task } from './task';

export interface Column {
    id: string;
    name: string;
    position: number;
    tasks: Task[];
    color?: string;
} 