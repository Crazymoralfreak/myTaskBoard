import { Task } from './board';

export interface Column {
    id: string;
    name: string;
    position: number;
    tasks: Task[];
} 