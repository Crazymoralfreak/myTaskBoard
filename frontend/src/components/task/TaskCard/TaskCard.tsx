import React, { useState, useRef, useEffect } from 'react';
import {
    Card,
    CardContent,
    Typography,
    Box,
    Chip,
    Tooltip,
    Badge,
    IconButton
} from '@mui/material';
import TimerIcon from '@mui/icons-material/Timer';
import EventIcon from '@mui/icons-material/Event';
import ErrorIcon from '@mui/icons-material/Error';
import CommentIcon from '@mui/icons-material/Comment';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import EditIcon from '@mui/icons-material/Edit';
import { Task } from '../../../types/task';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { TaskModal } from '../TaskModal';

interface TaskCardProps {
    task: Task;
    boardStatuses: Array<{
        id: number;
        name: string;
        color: string;
        isDefault: boolean;
        isCustom: boolean;
        position: number;
    }>;
    onStatusChange: (taskId: number, newStatusId: number) => void;
    onTaskUpdate: (updatedTask: Task) => void;
    onTaskDelete: (taskId: number) => void;
}

export const TaskCard: React.FC<TaskCardProps> = ({
    task,
    boardStatuses,
    onStatusChange,
    onTaskUpdate,
    onTaskDelete
}) => {
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const cardRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // Логируем время анимации
        const startTime = performance.now();
        
        if (cardRef.current) {
            cardRef.current.style.opacity = '0';
            cardRef.current.style.transform = 'translateY(20px)';
            
            // Форсируем reflow для корректной анимации
            cardRef.current.offsetHeight;
            
            requestAnimationFrame(() => {
                if (cardRef.current) {
                    cardRef.current.style.opacity = '1';
                    cardRef.current.style.transform = 'translateY(0)';
                    
                    // Логируем завершение анимации
                    cardRef.current.addEventListener('transitionend', () => {
                        const endTime = performance.now();
                        console.log(`Card animation completed in ${endTime - startTime}ms`);
                    }, { once: true });
                }
            });
        }
    }, []);

    const handleDelete = async (taskId: number) => {
        // Добавляем класс для анимации удаления
        if (cardRef.current) {
            cardRef.current.classList.add('deleting');
            // Ждем завершения анимации перед удалением
            await new Promise(resolve => setTimeout(resolve, 300));
            onTaskDelete(taskId);
        }
    };

    const getDaysRemainingColor = () => {
        if (task.daysRemaining === null) return 'default';
        if (task.daysRemaining < 0) return 'error';
        if (task.daysRemaining <= 3) return 'warning';
        return 'success';
    };

    const formatDate = (dateString: string) => {
        return format(new Date(dateString), 'dd MMM yyyy HH:mm', { locale: ru });
    };

    return (
        <>
            <Card 
                ref={cardRef}
                sx={{ 
                    mb: 1, 
                    cursor: 'pointer',
                    transition: 'all 0.3s ease-in-out',
                    opacity: 1,
                    transform: 'translateY(0)',
                    '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: 3
                    },
                    '&.deleting': {
                        opacity: 0,
                        transform: 'translateY(20px)'
                    }
                }}
                onClick={() => setIsDetailsOpen(true)}
            >
                <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                        <Typography variant="h6" component="div">
                            {task.title}
                        </Typography>
                        <Box>
                            <IconButton
                                size="small"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setIsEditOpen(true);
                                }}
                                color="primary"
                                sx={{ mr: 1 }}
                            >
                                <EditIcon fontSize="small" />
                            </IconButton>
                            <IconButton
                                size="small"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleDelete(task.id);
                                }}
                                color="error"
                            >
                                <DeleteOutlineIcon fontSize="small" />
                            </IconButton>
                        </Box>
                    </Box>

                    <Typography 
                        variant="body2" 
                        color="text.secondary" 
                        sx={{ mb: 2 }}
                    >
                        {task.description}
                    </Typography>

                    {(task.startDate || task.endDate) && (
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 2 }}>
                            {task.startDate && (
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <EventIcon fontSize="small" color="action" />
                                    <Typography variant="body2">
                                        Начало: {formatDate(task.startDate)}
                                    </Typography>
                                </Box>
                            )}
                            {task.endDate && (
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <TimerIcon fontSize="small" color="action" />
                                    <Typography variant="body2">
                                        Окончание: {formatDate(task.endDate)}
                                    </Typography>
                                </Box>
                            )}
                        </Box>
                    )}

                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                        {task.customStatus && (
                            <Chip
                                label={task.customStatus.name}
                                size="small"
                                sx={{ 
                                    backgroundColor: task.customStatus.color,
                                    color: '#fff'
                                }}
                            />
                        )}
                        {task.daysRemaining !== null && (
                            <Tooltip title={
                                task.daysRemaining < 0 
                                    ? "Задача просрочена" 
                                    : `Осталось ${task.daysRemaining} дн.`
                            }>
                                <Chip
                                    icon={task.daysRemaining < 0 ? <ErrorIcon /> : <TimerIcon />}
                                    label={
                                        task.daysRemaining < 0 
                                            ? "Просрочено" 
                                            : `${task.daysRemaining} дн.`
                                    }
                                    size="small"
                                    color={getDaysRemainingColor()}
                                />
                            </Tooltip>
                        )}
                        {task.comments && task.comments.length > 0 && (
                            <Tooltip title={`${task.comments.length} комментариев`}>
                                <Chip
                                    icon={<CommentIcon />}
                                    label={task.comments.length}
                                    size="small"
                                    color="default"
                                />
                            </Tooltip>
                        )}
                        {task.tags?.map((tag) => (
                            <Chip
                                key={tag}
                                label={tag}
                                size="small"
                                variant="outlined"
                            />
                        ))}
                    </Box>
                </CardContent>
            </Card>

            <TaskModal
                open={isDetailsOpen}
                onClose={() => setIsDetailsOpen(false)}
                mode="view"
                task={task}
                onTaskUpdate={onTaskUpdate}
                onTaskDelete={handleDelete}
                boardStatuses={boardStatuses}
            />

            <TaskModal
                open={isEditOpen}
                onClose={() => setIsEditOpen(false)}
                mode="edit"
                task={task}
                onTaskUpdate={onTaskUpdate}
                onTaskDelete={handleDelete}
                boardStatuses={boardStatuses}
            />
        </>
    );
}; 