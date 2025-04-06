import React, { useState, useEffect } from 'react';
import { Box, Typography, Button, Grid } from '@mui/material';
import { DragDropContext, Droppable } from 'react-beautiful-dnd';
import { BoardColumn } from '../BoardColumn';
import { AddColumnModal } from '../AddColumnModal/AddColumnModal';
import { Board as BoardType, BoardStatus, TaskType, Column } from '../../../types/board';
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
    const [columns, setColumns] = useState<Column[]>(board.columns || []);

    useEffect(() => {
        setColumns(board.columns || []);
    }, [board.columns]);

    const handleOpenCreateColumnModal = () => {
        setIsCreateColumnModalOpen(true);
    };
    
    const handleCloseCreateColumnModal = () => {
        setIsCreateColumnModalOpen(false);
    };

    const handleAddColumn = (name: string) => {
        // Здесь будет логика для добавления колонки
        console.log('Adding column:', name);
        handleCloseCreateColumnModal();
    };

    return (
        <Box>
            <Button 
                variant="contained" 
                color="primary" 
                startIcon={<AddIcon />}
                onClick={handleOpenCreateColumnModal}
            >
                Добавить колонку
            </Button>
            <Grid container spacing={2} sx={{ mt: 2 }}>
                {columns.map((column) => (
                    <Grid item key={column.id}>
                        <Box sx={{ 
                            width: 280, 
                            bgcolor: 'background.paper', 
                            borderRadius: 1,
                            boxShadow: 1,
                            p: 2
                        }}>
                            <Typography variant="h6">{column.name}</Typography>
                        </Box>
                    </Grid>
                ))}
            </Grid>
            
            <AddColumnModal
                open={isCreateColumnModalOpen}
                onClose={handleCloseCreateColumnModal}
                onSubmit={handleAddColumn}
            />
        </Box>
    );
};

export default Board; 