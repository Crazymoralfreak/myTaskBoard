import React, { useState } from 'react';
import { 
    Paper, 
    Typography, 
    IconButton, 
    Box,
    Button,
    Snackbar,
    Alert
} from '@mui/material';
import {
    ChevronLeft as ChevronLeftIcon,
    ChevronRight as ChevronRightIcon,
    Add as AddIcon
} from '@mui/icons-material';
import { Column } from '../../types/board';
import { TaskCard } from '../TaskCard';
import { AddTaskModal } from '../AddTaskModal';
import { taskService } from '../../services/taskService';
import { Task, CreateTaskRequest } from '../../types/task';
import { Draggable } from 'react-beautiful-dnd';

interface BoardColumnProps {
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
    onTasksChange?: () => void;
}

export const BoardColumn: React.FC<BoardColumnProps> = ({
    column,
    onMove,
    canMoveLeft,
    canMoveRight,
    boardStatuses,
    onTasksChange
}) => {
    const [isAddTaskModalOpen, setIsAddTaskModalOpen] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleMove = (position: number) => {
        onMove(position);
    };

    const handleStatusChange = async (taskId: number, newStatusId: number) => {
        const newStatus = boardStatuses.find(status => status.id === newStatusId);
        if (!newStatus) return;

        try {
            await taskService.updateTask(taskId, { customStatus: newStatus });
            onTasksChange?.();
        } catch (error) {
            setError('Не удалось обновить статус задачи');
        }
    };

    const handleAddTask = async (taskData: CreateTaskRequest) => {
        try {
            const defaultStatus = boardStatuses.find(status => status.isDefault);
            await taskService.createTask(
                String(column.id),
                {
                    ...taskData,
                    status: 'todo',
                    priority: 'MEDIUM',
                    statusId: defaultStatus?.id,
                    tags: []
                }
            );
            
            // Обновляем список задач
            onTasksChange?.();
            
            // Закрываем модальное окно
            setIsAddTaskModalOpen(false);
        } catch (error) {
            setError('Не удалось создать задачу');
            console.error('Failed to create task:', error);
        }
    };

    return (
        <Paper 
            sx={{ 
                width: 280,
                minWidth: 280,
                maxHeight: '100%',
                display: 'flex',
                flexDirection: 'column'
            }}
        >
            <Box sx={{ 
                p: 2, 
                display: 'flex', 
                alignItems: 'center',
                borderBottom: '1px solid',
                borderColor: 'divider'
            }}>
                <IconButton 
                    size="small" 
                    disabled={!canMoveLeft}
                    onClick={() => handleMove(column.position - 1)}
                >
                    <ChevronLeftIcon />
                </IconButton>
                <Typography 
                    variant="subtitle1" 
                    sx={{ 
                        flexGrow: 1,
                        textAlign: 'center',
                        fontWeight: 'medium'
                    }}
                >
                    {column.name}
                </Typography>
                <IconButton 
                    size="small"
                    disabled={!canMoveRight}
                    onClick={() => handleMove(column.position + 1)}
                >
                    <ChevronRightIcon />
                </IconButton>
            </Box>

            <Box sx={{ 
                p: 1,
                flexGrow: 1,
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                gap: 1
            }}>
                {column.tasks.map((task, index) => (
                    <Draggable 
                        key={task.id} 
                        draggableId={task.id.toString()} 
                        index={index}
                    >
                        {(provided, snapshot) => (
                            <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                style={{
                                    ...provided.draggableProps.style,
                                    opacity: snapshot.isDragging ? 0.8 : 1
                                }}
                            >
                                <TaskCard 
                                    task={task} 
                                    boardStatuses={boardStatuses}
                                    onStatusChange={handleStatusChange}
                                />
                            </div>
                        )}
                    </Draggable>
                ))}
            </Box>

            <Button
                startIcon={<AddIcon />}
                sx={{ m: 1 }}
                variant="outlined"
                size="small"
                onClick={() => setIsAddTaskModalOpen(true)}
            >
                Добавить карточку
            </Button>

            <AddTaskModal
                open={isAddTaskModalOpen}
                onClose={() => setIsAddTaskModalOpen(false)}
                onSubmit={handleAddTask}
            />

            <Snackbar 
                open={!!error} 
                autoHideDuration={6000} 
                onClose={() => setError(null)}
            >
                <Alert severity="error" onClose={() => setError(null)}>
                    {error}
                </Alert>
            </Snackbar>
        </Paper>
    );
}; 