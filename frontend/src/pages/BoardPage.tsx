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

    const handleTasksChange = async (columnId: string, tasks: Task[]) => {
        if (!board) return;
        
        const updatedColumns = board.columns.map(col => 
            col.id === columnId 
                ? { ...col, tasks }
                : col
        );
        
        setBoard({
            ...board,
            columns: updatedColumns
        });

        // Опционально: обновляем всю доску с сервера
        loadBoard();
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
                        <BoardColumn
                            key={column.id}
                            column={column}
                            onMove={(position: number) => handleColumnMove(column.id, position)}
                            canMoveLeft={index > 0}
                            canMoveRight={index < board.columns.length - 1}
                            boardStatuses={board.taskStatuses}
                            onTasksChange={handleTasksChange}
                        />
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
            <AddColumnModal
                open={isAddColumnModalOpen}
                onClose={() => setIsAddColumnModalOpen(false)}
                onSubmit={handleAddColumn}
            />
        </Container>
    );
};
  