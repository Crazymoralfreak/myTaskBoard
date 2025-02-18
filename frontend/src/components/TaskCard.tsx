import React from 'react';
import {
    Card,
    CardContent,
    Typography,
    Box,
    Chip,
    IconButton,
    Menu,
    MenuItem,
    Tooltip
} from '@mui/material';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import TimerIcon from '@mui/icons-material/Timer';
import EventIcon from '@mui/icons-material/Event';
import ErrorIcon from '@mui/icons-material/Error';
import { Task } from '../types/task';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { taskService } from '../services/taskService';

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
}

export const TaskCard: React.FC<TaskCardProps> = ({
    task,
    boardStatuses,
    onStatusChange
}) => {
    const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
    const [loading, setLoading] = React.useState(false);

    const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
    };

    const handleStatusChange = async (statusId: number) => {
        if (loading) return;
        setLoading(true);
        try {
            const newStatus = boardStatuses.find(status => status.id === statusId);
            if (!newStatus) throw new Error('Status not found');
            
            await taskService.updateTask(task.id, { 
                customStatus: {
                    id: newStatus.id,
                    name: newStatus.name,
                    color: newStatus.color,
                    isDefault: newStatus.isDefault,
                    isCustom: newStatus.isCustom,
                    position: newStatus.position
                }
            });
            onStatusChange(task.id, statusId);
        } catch (error) {
            console.error('Failed to update task status:', error);
        } finally {
            setLoading(false);
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
        <Card sx={{ mb: 1 }}>
            <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="h6" component="div">
                        {task.title}
                    </Typography>
                    <IconButton size="small" onClick={handleMenuOpen}>
                        <MoreVertIcon />
                    </IconButton>
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

            <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleMenuClose}
            >
                {boardStatuses.map((status) => (
                    <MenuItem
                        key={status.id}
                        onClick={() => handleStatusChange(status.id)}
                        selected={task.customStatus?.id === status.id}
                    >
                        {status.name}
                    </MenuItem>
                ))}
            </Menu>
        </Card>
    );
}; 