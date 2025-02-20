import React, { useState } from 'react';
import {
    Card,
    CardContent,
    Typography,
    Box,
    Chip,
    Tooltip,
    Badge
} from '@mui/material';
import TimerIcon from '@mui/icons-material/Timer';
import EventIcon from '@mui/icons-material/Event';
import ErrorIcon from '@mui/icons-material/Error';
import CommentIcon from '@mui/icons-material/Comment';
import { Task } from '../types/task';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { TaskDetailsModal } from './TaskDetailsModal';

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
                sx={{ mb: 1, cursor: 'pointer' }}
                onClick={() => setIsDetailsOpen(true)}
            >
                <CardContent>
                    <Typography variant="h6" component="div" sx={{ mb: 1 }}>
                        {task.title}
                    </Typography>

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

            <TaskDetailsModal
                open={isDetailsOpen}
                onClose={() => setIsDetailsOpen(false)}
                task={task}
                onTaskUpdate={onTaskUpdate}
                onTaskDelete={onTaskDelete}
                boardStatuses={boardStatuses}
            />
        </>
    );
}; 