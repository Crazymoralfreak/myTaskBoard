import { Column } from '../types/column';
import { AddTaskModal } from './AddTaskModal';
import { useState } from 'react';
import { Paper, Box, Typography, IconButton, Button } from '@mui/material';
import ArrowBack from '@mui/icons-material/ArrowBack';
import ArrowForward from '@mui/icons-material/ArrowForward';
import Add from '@mui/icons-material/Add';
import { TaskCard } from './TaskCard';
import { taskService } from '../services/taskService';

interface BoardColumnProps {
    column: Column;
    onMove: (position: number) => void;
    canMoveLeft: boolean;
    canMoveRight: boolean;
}

export const BoardColumn: React.FC<BoardColumnProps> = ({ column, onMove, canMoveLeft, canMoveRight }) => {
    const [isAddTaskModalOpen, setIsAddTaskModalOpen] = useState(false);

    const handleAddTask = async (title: string) => {
        try {
            const newTask = await taskService.createTask(column.id, title);
            // Обновляем список задач в колонке
            column.tasks = [...(column.tasks || []), newTask];
        } catch (error) {
            console.error('Failed to add task:', error);
        }
    };

    return (
        <Paper sx={{ width: 280, p: 1, bgcolor: 'grey.100' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" sx={{ flexGrow: 1 }}>
                    {column.name}
                </Typography>
                <IconButton
                    size="small"
                    onClick={() => onMove(column.position - 1)}
                    disabled={!canMoveLeft}
                >
                    <ArrowBack />
                </IconButton>
                <IconButton
                    size="small"
                    onClick={() => onMove(column.position + 1)}
                    disabled={!canMoveRight}
                >
                    <ArrowForward />
                </IconButton>
            </Box>
            
            {/* Список задач */}
            <Box sx={{ minHeight: 100 }}>
                {column.tasks?.map((task) => (
                    <TaskCard key={task.id} task={task} />
                ))}
            </Box>
            
            {/* Кнопка добавления задачи */}
            <Button
                fullWidth
                startIcon={<Add />}
                onClick={() => setIsAddTaskModalOpen(true)}
                sx={{ mt: 1 }}
            >
                Добавить карточку
            </Button>
            
            <AddTaskModal
                open={isAddTaskModalOpen}
                onClose={() => setIsAddTaskModalOpen(false)}
                onSubmit={handleAddTask}
            />
        </Paper>
    );
}; 