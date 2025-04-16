import React, { useState, useRef, useEffect } from 'react';
import {
    Card,
    CardContent,
    Typography,
    Box,
    IconButton,
    Menu,
    MenuItem,
    Chip,
    Tooltip,
    useTheme,
    ListItemIcon,
    ListItemText
} from '@mui/material';
import CategoryIcon from '@mui/icons-material/Category';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import AlarmIcon from '@mui/icons-material/Alarm';
import CommentIcon from '@mui/icons-material/Comment';
import { Task } from '../../../types/task';
import { format, formatDistance, differenceInDays, differenceInHours, isPast, addDays } from 'date-fns';
import { ru } from 'date-fns/locale';
import { TaskModal } from '../TaskModal/TaskModal';
import { ConfirmDialog } from '../../shared/ConfirmDialog';
import { TaskType, BoardStatus } from '../../../types/board';
import { iconNameToComponent } from '../../shared/IconSelector/iconMapping';

interface TaskCardProps {
    task: Task;
    onTaskStatusChange: (taskId: number, statusId: number) => void;
    onTaskUpdate: (task: Task) => void;
    onTaskDelete: (taskId: number) => void;
    boardStatuses: BoardStatus[];
    taskTypes: TaskType[];
}

// Компонент для отображения тегов задачи
const TaskTags: React.FC<{ tags: string[] }> = ({ tags }) => {
    const theme = useTheme();
    if (!tags || tags.length === 0) return null;
    
    // Отображаем максимум 2 тега напрямую, остальные показываем через число
    const visibleTags = tags.slice(0, 2);
    const remainingCount = tags.length - visibleTags.length;
    
    return (
        <Box sx={{ 
            display: 'flex', 
            gap: 0.5, 
            flexWrap: 'wrap', 
            mt: 1,
            alignItems: 'center'
        }}>
            {visibleTags.map(tag => (
                <Chip
                    key={tag}
                    label={tag}
                    size="small"
                    variant="outlined"
                    sx={{ 
                        height: 20, 
                        borderColor: theme.palette.divider,
                        color: theme.palette.text.secondary,
                        '& .MuiChip-label': { 
                            px: 1, 
                            fontSize: '0.7rem' 
                        } 
                    }}
                />
            ))}
            {remainingCount > 0 && (
                <Tooltip 
                    title={
                        <Box>
                            {tags.slice(2).map(tag => (
                                <Typography key={tag} variant="caption" display="block">
                                    {tag}
                                </Typography>
                            ))}
                        </Box>
                    }
                >
                    <Chip
                        icon={<LocalOfferIcon sx={{ fontSize: '0.7rem', color: theme.palette.text.secondary }} />}
                        label={`+${remainingCount}`}
                        size="small"
                        sx={{ 
                            height: 20, 
                            bgcolor: theme.palette.action.hover,
                            color: theme.palette.text.secondary,
                            '& .MuiChip-label': { 
                                px: 0.5, 
                                fontSize: '0.7rem' 
                            } 
                        }}
                    />
                </Tooltip>
            )}
        </Box>
    );
};

export const TaskCard: React.FC<TaskCardProps> = ({
    task,
    onTaskStatusChange,
    onTaskUpdate,
    onTaskDelete,
    boardStatuses,
    taskTypes
}) => {
    const theme = useTheme();
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [isHovered, setIsHovered] = useState(false);
    const cardRef = useRef<HTMLDivElement>(null);
    
    const handleMenuOpen = (event: React.MouseEvent<HTMLButtonElement>) => {
        event.stopPropagation();
        setAnchorEl(event.currentTarget);
    };
    
    const handleMenuClose = () => {
        setAnchorEl(null);
    };
    
    const handleEdit = (event: React.MouseEvent<HTMLLIElement>) => {
        event.stopPropagation();
        handleMenuClose();
        setIsEditOpen(true);
    };
    
    const handleDelete = (event: React.MouseEvent<HTMLLIElement>) => {
        event.stopPropagation();
        handleMenuClose();
        setIsDeleteOpen(true);
    };
    
    const handleConfirmDelete = async () => {
        try {
            await onTaskDelete(task.id);
            setIsDeleteOpen(false);
        } catch (error) {
            console.error('Ошибка при удалении задачи:', error);
        }
    };
    
    const handleTaskUpdate = (updatedTask: Task) => {
        onTaskUpdate(updatedTask);
        setIsEditOpen(false);
    };
    
    const handleActionClick = (event: React.MouseEvent) => {
        event.stopPropagation();
    };
    
    const formatDate = (date: string) => {
        if (!date) return '';
        return format(new Date(date), 'dd MMM', { locale: ru });
    };
    
    // Функция для расчета оставшегося времени до дедлайна
    const getRemainingTime = () => {
        if (!task.endDate) return null;
        
        const endDate = new Date(task.endDate);
        const now = new Date();
        
        // Проверяем, прошла ли дата окончания
        if (isPast(endDate)) {
            const overdueDays = Math.abs(differenceInDays(now, endDate));
            const overdueHours = Math.abs(differenceInHours(now, endDate) % 24);
            
            if (overdueDays > 0) {
                return { 
                    text: `Просрочено на ${overdueDays} ${getDayText(overdueDays)}`, 
                    isOverdue: true 
                };
            } else {
                return { 
                    text: `Просрочено на ${overdueHours} ${getHourText(overdueHours)}`, 
                    isOverdue: true 
                };
            }
        } else {
            // Осталось времени
            const remainingDays = differenceInDays(endDate, now);
            const remainingHours = differenceInHours(endDate, now) % 24;
            
            if (remainingDays > 0) {
                return { 
                    text: `Осталось ${remainingDays} ${getDayText(remainingDays)}`, 
                    isOverdue: false 
                };
            } else {
                return { 
                    text: `Осталось ${remainingHours} ${getHourText(remainingHours)}`, 
                    isOverdue: false 
                };
            }
        }
    };
    
    // Вспомогательные функции для правильного склонения
    const getDayText = (days: number) => {
        if (days % 10 === 1 && days % 100 !== 11) return 'день';
        if ([2, 3, 4].includes(days % 10) && ![12, 13, 14].includes(days % 100)) return 'дня';
        return 'дней';
    };
    
    const getHourText = (hours: number) => {
        if (hours % 10 === 1 && hours % 100 !== 11) return 'час';
        if ([2, 3, 4].includes(hours % 10) && ![12, 13, 14].includes(hours % 100)) return 'часа';
        return 'часов';
    };
    
    // Получаем информацию об оставшемся времени
    const remainingTime = getRemainingTime();
    
    // Создаем строку для описания с очисткой от HTML
    const cleanDescription = task.description 
        ? task.description.replace(/<[^>]*>/g, '') 
        : '';
    
    const truncatedDescription = cleanDescription.length > 100
        ? `${cleanDescription.substring(0, 100)}...`
        : cleanDescription;
    
    // Показываем статус задачи, если он существует и не "todo"
    const shouldShowStatus = task.customStatus && task.customStatus.name.toLowerCase() !== 'todo';

    // Определяем цвет заголовка в соответствии с типом задачи
    const titleStyle = {
        color: task.type?.color && theme.palette.mode === 'dark' 
               ? theme.palette.getContrastText(task.type.color)
               : task.type?.color || theme.palette.text.primary
    };
    
    return (
        <>
            <Card 
                ref={cardRef}
                elevation={isHovered ? 4 : 1}
                sx={{
                    mb: 2,
                    cursor: 'pointer',
                    position: 'relative',
                    backgroundColor: theme.palette.background.paper,
                    border: `1px solid ${theme.palette.divider}`,
                    borderRadius: 2,
                    '&:hover': {
                        borderColor: theme.palette.primary.main
                    },
                    transition: 'box-shadow 0.3s, border-color 0.3s, transform 0.2s',
                    transform: isHovered ? 'translateY(-2px)' : 'none',
                }}
                onClick={() => setIsEditOpen(true)}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
            >
                {/* Цветная полоса с типом задачи */}
                {task.type && (
                    <Box 
                        sx={{ 
                            position: 'absolute', 
                            top: -1,
                            left: -1,
                            width: 'calc(100% + 2px)', 
                            height: '4px', 
                            bgcolor: task.type.color || theme.palette.divider
                        }} 
                    />
                )}
                
                <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 }, position: 'relative', zIndex: 1 }}>
                    <Box>
                        {/* Заголовок и кнопка действий */}
                        <Box sx={{ 
                            display: 'flex', 
                            justifyContent: 'space-between', 
                            alignItems: 'flex-start',
                            mb: 1
                        }}>
                            <Typography 
                                variant="subtitle1" 
                                sx={{ 
                                    fontWeight: 500,
                                    color: theme.palette.text.primary
                                }}
                            >
                                {task.title}
                            </Typography>
                            
                            <IconButton 
                                size="small" 
                                onClick={handleMenuOpen}
                                sx={{ 
                                    p: 0.5,
                                    mt: -0.5,
                                    mr: -0.5,
                                    visibility: isHovered ? 'visible' : 'hidden'
                                }}
                            >
                                <MoreVertIcon fontSize="small" sx={{ color: theme.palette.action.active }} />
                            </IconButton>
                        </Box>
                        
                        {/* Тип и статус задачи */}
                        <Box sx={{ display: 'flex', gap: 0.5, mb: 1, flexWrap: 'wrap', alignItems: 'center' }}>
                            {task.type && (
                                <Tooltip title={task.type.name}>
                                    <Chip
                                        icon={
                                            task.type.icon && iconNameToComponent[task.type.icon] 
                                                ? React.cloneElement(iconNameToComponent[task.type.icon], { 
                                                    style: { color: task.type.color || 'inherit', fontSize: '1rem' } 
                                                }) 
                                                : <CategoryIcon style={{ color: task.type.color || 'inherit', fontSize: '1rem' }} />
                                        }
                                        label={task.type.name}
                                        size="small"
                                        sx={{
                                            height: 20,
                                            bgcolor: theme.palette.mode === 'dark' 
                                                ? theme.palette.grey[700]
                                                : `${task.type.color || theme.palette.grey[300]}20`,
                                            color: theme.palette.getContrastText(
                                                theme.palette.mode === 'dark' 
                                                ? theme.palette.grey[700]
                                                : `${task.type.color || theme.palette.grey[300]}20`
                                            ),
                                            '& .MuiChip-label': { 
                                                px: 1, 
                                                fontSize: '0.7rem' 
                                            },
                                            '& .MuiChip-icon': {
                                                ml: 0.5,
                                                mr: -0.25
                                            }
                                        }}
                                    />
                                </Tooltip>
                            )}
                            
                            {shouldShowStatus && task.customStatus && (
                                <Chip
                                    size="small"
                                    label={task.customStatus.name}
                                    sx={{
                                        height: 20,
                                        bgcolor: theme.palette.mode === 'dark' 
                                            ? theme.palette.grey[700]
                                            : `${task.customStatus.color || theme.palette.grey[300]}20`,
                                        color: theme.palette.getContrastText(
                                            theme.palette.mode === 'dark' 
                                            ? theme.palette.grey[700]
                                            : `${task.customStatus.color || theme.palette.grey[300]}20`
                                        ),
                                        '& .MuiChip-label': { 
                                            px: 1, 
                                            py: 0,
                                            fontSize: '0.7rem'
                                        }
                                    }}
                                />
                            )}
                        </Box>
                        
                        {/* Описание задачи */}
                        {truncatedDescription && (
                            <Typography 
                                variant="body2" 
                                color="text.secondary"
                                sx={{
                                    fontSize: '0.75rem',
                                    lineHeight: 1.3,
                                    mb: 1,
                                    display: '-webkit-box',
                                    WebkitLineClamp: 2,
                                    WebkitBoxOrient: 'vertical',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis'
                                }}
                            >
                                {truncatedDescription}
                            </Typography>
                        )}
                        
                        {/* Метаданные задачи */}
                        <Box sx={{ 
                            display: 'flex', 
                            flexDirection: 'column',
                            gap: 0.5,
                            mt: 1
                        }}>
                            {/* Даты и комментарии */}
                            <Box sx={{ 
                                display: 'flex', 
                                justifyContent: 'space-between',
                                alignItems: 'center',
                            }}>
                                {/* Даты начала и окончания - показываем только если есть хотя бы одна дата */}
                                {(task.startDate || task.endDate) && (
                                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                        <CalendarTodayIcon sx={{ fontSize: '0.8rem', mr: 0.5, color: theme.palette.text.secondary }} />
                                        <Typography 
                                            variant="caption" 
                                            color="text.secondary"
                                            sx={{ fontSize: '0.7rem' }}
                                        >
                                            {task.startDate && formatDate(task.startDate)}
                                            {task.startDate && task.endDate && ' - '}
                                            {task.endDate && formatDate(task.endDate)}
                                        </Typography>
                                    </Box>
                                )}
                                
                                {/* ВОЗВРАЩАЕМ ИНДИКАТОР КОММЕНТАРИЕВ ЗДЕСЬ */}
                                {task.commentCount > 0 && (
                                    <Tooltip title={`${task.commentCount} комментариев`}>
                                        <Box sx={{ 
                                            display: 'flex', 
                                            alignItems: 'center',
                                            color: theme.palette.text.secondary, // Используем вторичный цвет текста для единообразия
                                            // bgcolor: theme.palette.action.hover, // Убираем фон, чтобы сделать менее выделяющимся
                                            borderRadius: '12px',
                                            px: 1,
                                            py: 0.25
                                        }}>
                                            <CommentIcon sx={{ fontSize: '0.9rem', mr: 0.5 }} />
                                            <Typography
                                                variant="caption"
                                                sx={{ 
                                                    fontSize: '0.7rem',
                                                    fontWeight: 'medium',
                                                    lineHeight: 1
                                                }}
                                            >
                                                {task.commentCount}
                                            </Typography>
                                        </Box>
                                    </Tooltip>
                                )}
                            </Box>
                            
                            {/* Счетчик оставшегося времени */}
                            {remainingTime && (
                                <Box sx={{ 
                                    display: 'flex', 
                                    alignItems: 'center',
                                    mt: 0.5,
                                    backgroundColor: remainingTime.isOverdue 
                                        ? theme.palette.error.light + '30'
                                        : theme.palette.info.light + '30',
                                    borderRadius: '4px',
                                    py: 0.25,
                                    px: 0.5,
                                    color: remainingTime.isOverdue ? theme.palette.error.main : theme.palette.info.main
                                }}>
                                    <AlarmIcon sx={{ 
                                        fontSize: '0.8rem', 
                                        mr: 0.5, 
                                        color: 'inherit' 
                                    }} />
                                    <Typography 
                                        variant="caption" 
                                        sx={{ 
                                            fontSize: '0.7rem',
                                            color: 'inherit',
                                            fontWeight: 'medium'
                                        }}
                                    >
                                        {remainingTime.text}
                                    </Typography>
                                </Box>
                            )}
                            
                            {/* Теги задачи */}
                            <TaskTags tags={task.tags || []} />
                        </Box>
                    </Box>
                </CardContent>
            </Card>

            {/* Модальное окно просмотра/редактирования */}
            <TaskModal
                open={isEditOpen}
                onClose={() => setIsEditOpen(false)}
                mode="view"
                task={task}
                boardStatuses={boardStatuses}
                taskTypes={taskTypes}
                onTaskUpdate={handleTaskUpdate}
            />
            
            {/* Диалог подтверждения удаления */}
            <ConfirmDialog
                open={isDeleteOpen}
                title="Удалить задачу"
                message={`Вы уверены, что хотите удалить задачу "${task.title}"?`}
                onClose={() => setIsDeleteOpen(false)}
                onConfirm={handleConfirmDelete}
                actionType="delete"
            />
            
            {/* Меню действий */}
            <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleMenuClose}
                onClick={handleActionClick}
            >
                <MenuItem onClick={handleEdit}>
                    <ListItemIcon>
                        <EditIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText>Редактировать</ListItemText>
                </MenuItem>
                <MenuItem onClick={handleDelete} sx={{ color: 'error.main' }}>
                    <ListItemIcon>
                        <DeleteIcon fontSize="small" color="error" />
                    </ListItemIcon>
                    <ListItemText>Удалить</ListItemText>
                </MenuItem>
            </Menu>
            
            {/* Кнопки редактирования и удаления */}
            <Box
                sx={{
                    display: 'flex',
                    gap: 1,
                    marginTop: 'auto',
                    visibility: 'visible', // Изменили на 'visible' для тестирования
                }}
            >
                {/* Убираем кнопки редактирования и удаления */}
            </Box>
        </>
    );
}; 