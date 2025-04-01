import React, { useState, useEffect } from 'react';
import { Box, Typography, Button, Grid } from '@mui/material';
import { DragDropContext, Droppable } from 'react-beautiful-dnd';
import BoardColumn from '../BoardColumn';
import CreateColumnModal from '../CreateColumnModal';
import { Board as BoardType, BoardColumn as BoardColumnType, BoardStatus, TaskType } from '../../../types/board';
import { Task } from '../../../types/task';
import { boardService } from '../../../services/boardService';
import { taskService } from '../../../services/taskService';
import AddIcon from '@mui/icons-material/Add';

interface BoardProps {
    board: BoardType;
    boardStatuses: BoardStatus[];
    taskTypes: TaskType[];
    onBoardUpdate: (updatedBoard: BoardType) => void;
}

const Board: React.FC<BoardProps> = ({ board, boardStatuses, taskTypes, onBoardUpdate }) => {
    const [isCreateColumnModalOpen, setIsCreateColumnModalOpen] = useState(false);
    const [columns, setColumns] = useState<BoardColumnType[]>(board.columns || []);

    useEffect(() => {
        setColumns(board.columns || []);
    }, [board.columns]);

    // ... existing code ...

    return (
        // ... existing JSX ...
    );
};

export default Board; 