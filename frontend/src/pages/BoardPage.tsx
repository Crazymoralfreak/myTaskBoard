import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
    Container, 
    Typography, 
    Box, 
    IconButton, 
    CircularProgress,
    Button
} from '@mui/material';
import { 
    ArrowBack as ArrowBackIcon,
    Add as AddIcon,
    Settings as SettingsIcon 
} from '@mui/icons-material';
import { Board } from '../types/board';
import { boardService } from '../services/boardService';
import { BoardColumn } from '../components/BoardColumn/BoardColumn';
import { Column } from '../types/column';
import { AddColumnModal } from '../components/AddColumnModal';
import { Task } from '../types/task';
import { DragDropContext, Droppable, DropResult } from 'react-beautiful-dnd';
import { taskService } from '../services/taskService';

export const BoardPage: React.FC = () => {
    const { boardId } = useParams<{ boardId: string }>();
    const [board, setBoard] = useState<Board | null>(null);
    const [loading, setLoading] = useState(true);
    const [isAddColumnModalOpen, setIsAddColumnModalOpen] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        if (boardId) {
            loadBoard();
        }
    }, [boardId]);

    const loadBoard = async () => {
        if (!boardId) return;
        try {
            setLoading(true);
            const boardData = await boardService.getBoard(boardId);
            setBoard(boardData);
        } catch (error) {
            console.error('Failed to load board:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddColumn = async (columnName: string) => {
        try {
            if (!board || !boardId) return;
            const updatedBoard = await boardService.addColumn(boardId, { name: columnName });
            setBoard(updatedBoard);
        } catch (error) {
            console.error('Failed to add column:', error);
        }
    };

    const handleColumnMove = async (columnId: string, newPosition: number): Promise<void> => {
        if (!boardId) return;
        try {
            const updatedBoard = await boardService.moveColumn(boardId, columnId, newPosition);
            setBoard(updatedBoard);
        } catch (error) {
            console.error('Failed to move column:', error);
        }
    };

    const handleDragEnd = async (result: DropResult) => {
        const { source, destination, draggableId } = result;
        console.log('Drag end event:', result);

        // Если нет места назначения или место назначения то же самое, что и источник
        if (!destination || 
            (source.droppableId === destination.droppableId && 
             source.index === destination.index)
        ) {
            console.log('Invalid drop destination or same position');
            return;
        }

        try {
            console.log(`Moving task ${draggableId} from column ${source.droppableId} to ${destination.droppableId}`);

            // Оптимистичное обновление UI
            if (!board) return;
            const newBoard = { ...board };
            const sourceColumn = newBoard.columns.find(col => col.id.toString() === source.droppableId);
            const destinationColumn = newBoard.columns.find(col => col.id.toString() === destination.droppableId);

            if (!sourceColumn || !destinationColumn) {
                console.error('Source or destination column not found');
                return;
            }

            // Находим задачу
            const task = sourceColumn.tasks.find(t => t.id.toString() === draggableId);
            if (!task) {
                console.error('Task not found:', draggableId);
                return;
            }

            // Удаляем задачу из исходной колонки
            sourceColumn.tasks = sourceColumn.tasks.filter(t => t.id.toString() !== draggableId);

            // Добавляем задачу в целевую колонку
            const updatedTask = { ...task };
            destinationColumn.tasks.splice(destination.index, 0, updatedTask);

            // Обновляем состояние для мгновенной реакции UI
            setBoard(newBoard);

            // Отправляем запрос на сервер
            try {
                const movedTask = await taskService.moveTask(draggableId, destination.droppableId);
                console.log('Task moved successfully:', movedTask);
            } catch (error) {
                console.error('Failed to move task on server:', error);
                // В случае ошибки отменяем оптимистичное обновление
                await loadBoard();
            }
        } catch (error) {
            console.error('Error in handleDragEnd:', error);
            // В случае любой ошибки перезагружаем доску
            await loadBoard();
        }
    };

    if (loading) {
        return (
            <Container sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                <CircularProgress />
            </Container>
        );
    }

    if (!board) {
        return (
            <Container>
                <Typography>Доска не найдена</Typography>
            </Container>
        );
    }

    return (
        <Container maxWidth={false}>
            <Box sx={{ mt: 2, mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <IconButton onClick={() => navigate('/')}>
                        <ArrowBackIcon />
                    </IconButton>
                    <Typography variant="h5">{board.name}</Typography>
                    <Box sx={{ flexGrow: 1 }} />
                    <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={() => setIsAddColumnModalOpen(true)}
                    >
                        Добавить колонку
                    </Button>
                    <IconButton>
                        <SettingsIcon />
                    </IconButton>
                </Box>
                {board.description && (
                    <Typography 
                        variant="body2" 
                        color="text.secondary" 
                        sx={{ mt: 1, ml: 6 }}
                    >
                        {board.description}
                    </Typography>
                )}
            </Box>

            <DragDropContext onDragEnd={handleDragEnd}>
                <Box 
                    sx={{ 
                        display: 'flex', 
                        gap: 2, 
                        overflowX: 'auto', 
                        pb: 2, 
                        px: 2 
                    }}
                >
                    {board.columns && board.columns.length > 0 ? (
                        board.columns.map((column: Column, index: number) => (
                            <Droppable key={column.id} droppableId={column.id.toString()}>
                                {(provided) => (
                                    <div
                                        ref={provided.innerRef}
                                        {...provided.droppableProps}
                                    >
                                        <BoardColumn
                                            column={column}
                                            onMove={(position: number) => handleColumnMove(column.id.toString(), position)}
                                            canMoveLeft={index > 0}
                                            canMoveRight={index < board.columns.length - 1}
                                            boardStatuses={board.taskStatuses}
                                            onTasksChange={loadBoard}
                                        />
                                        {provided.placeholder}
                                    </div>
                                )}
                            </Droppable>
                        ))
                    ) : (
                        <Box sx={{ 
                            display: 'flex', 
                            flexDirection: 'column', 
                            alignItems: 'center',
                            width: '100%',
                            mt: 4 
                        }}>
                            <Typography variant="h6" color="text.secondary">
                                На этой доске пока нет колонок
                            </Typography>
                            <Button
                                variant="contained"
                                startIcon={<AddIcon />}
                                onClick={() => setIsAddColumnModalOpen(true)}
                                sx={{ mt: 2 }}
                            >
                                Создать первую колонку
                            </Button>
                        </Box>
                    )}
                </Box>
            </DragDropContext>
            <AddColumnModal
                open={isAddColumnModalOpen}
                onClose={() => setIsAddColumnModalOpen(false)}
                onSubmit={handleAddColumn}
            />
        </Container>
    );
};
  