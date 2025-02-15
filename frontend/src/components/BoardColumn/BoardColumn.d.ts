import { Column } from '../../types/board';

export interface BoardColumnProps {
    column: Column;
    onMove: (newPosition: number) => void;
    canMoveLeft: boolean;
    canMoveRight: boolean;
}

export declare const BoardColumn: React.FC<BoardColumnProps>; 