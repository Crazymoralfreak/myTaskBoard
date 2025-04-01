import * as React from 'react';
import { Column } from '../../../types/board';
import { Task } from '../../../types/task';

export interface BoardColumnProps {
    column: Column;
    onMove: (newPosition: number) => void;
    canMoveLeft: boolean;
    canMoveRight: boolean;
    boardStatuses: Array<{
        id: number;
        name: string;
        color: string;
        isDefault: boolean;
        isCustom: boolean;
        position: number;
    }>;
    onTasksChange?: (columnId: string, tasks: Task[]) => void;
}

export declare const BoardColumn: React.FC<BoardColumnProps>; 