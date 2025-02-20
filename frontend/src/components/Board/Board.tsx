import React from 'react';
import { DragDropContext, DropResult } from 'react-beautiful-dnd';
import { Box, Button } from '@mui/material';
import BoardColumn from '../BoardColumn/BoardColumn';
import { Column } from '../../types/board';
import { Task } from '../../types/task';
import { AddColumnModal } from '../AddColumnModal';
import AddIcon from '@mui/icons-material/Add';
import { BoardStatus } from '../../types/board';

interface BoardProps {
    columns: Column[];
    boardStatuses: BoardStatus[];
    onColumnAdd: (name: string) => void;
    onColumnEdit: (columnId: string, name: string, color?: string) => void;
    onColumnDelete: (columnId: string) => void;
    onTaskMove: (result: DropResult) => void;
    onColumnMove: (columnId: string, newPosition: number) => void;
}

export const Board: React.FC<BoardProps> = ({
    columns,
    boardStatuses,
    onColumnAdd,
    onColumnEdit,
    onColumnDelete,
    onTaskMove,
    onColumnMove
}) => {
    const handleDragEnd = (result: DropResult) => {
        if (!result.destination) {
            return;
        }

        onTaskMove(result);
    };

    return (
        <DragDropContext onDragEnd={handleDragEnd}>
            <Box
                sx={{
                    display: 'flex',
                    gap: 2,
                    p: 2,
                    overflowX: 'auto',
                    minHeight: 'calc(100vh - 64px)', // Высота экрана минус высота AppBar
                    bgcolor: 'background.default',
                    '&::-webkit-scrollbar': {
                        height: '8px',
                    },
                    '&::-webkit-scrollbar-track': {
                        bgcolor: 'background.paper',
                    },
                    '&::-webkit-scrollbar-thumb': {
                        bgcolor: 'action.hover',
                        borderRadius: '4px',
                    },
                }}
            >
                {columns.map((column, index) => (
                    <BoardColumn
                        key={column.id}
                        column={column}
                        onMove={(newPosition) => onColumnMove(column.id.toString(), newPosition)}
                        canMoveLeft={index > 0}
                        canMoveRight={index < columns.length - 1}
                        boardStatuses={boardStatuses}
                        onTasksChange={(updatedColumn) => {
                            // Обновление задач в колонке
                            console.log('Tasks updated in column:', updatedColumn);
                        }}
                        onEdit={onColumnEdit}
                        onDelete={onColumnDelete}
                    />
                ))}
                <Box
                    sx={{
                        minWidth: 300,
                        height: 'fit-content',
                        display: 'flex',
                        justifyContent: 'center',
                        pt: 2
                    }}
                >
                    <Button
                        variant="outlined"
                        startIcon={<AddIcon />}
                        onClick={() => onColumnAdd('Новая колонка')}
                        sx={{ width: '100%' }}
                    >
                        Добавить колонку
                    </Button>
                </Box>
            </Box>
        </DragDropContext>
    );
}; 