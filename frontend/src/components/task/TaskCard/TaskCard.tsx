import React, { useState, useRef, useEffect } from 'react';
import {
    Card,
    CardContent,
    Typography,
    Box,
    IconButton,
    Chip,
    Tooltip,
    useTheme,
    ListItemIcon,
    ListItemText,
    Button,
    LinearProgress
} from '@mui/material';
import CategoryIcon from '@mui/icons-material/Category';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import AlarmIcon from '@mui/icons-material/Alarm';
import CommentIcon from '@mui/icons-material/Comment';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import PriorityHighIcon from '@mui/icons-material/PriorityHigh';
import ChecklistIcon from '@mui/icons-material/Checklist';
import { Task } from '../../../types/task';
import { format, formatDistance, differenceInDays, differenceInHours, isPast, addDays } from 'date-fns';
import { ru } from 'date-fns/locale';
import { TaskModal } from '../TaskModal/TaskModal';
import { ConfirmDialog } from '../../shared/ConfirmDialog';
import { TaskType, BoardStatus } from '../../../types/board';
import { iconNameToComponent } from '../../shared/IconSelector/iconMapping';
import { toast } from 'react-hot-toast';
import { useTaskDelete } from '../../../hooks/useTaskDelete';
import { useUserRole, Permission } from '../../../hooks/useUserRole';
import { getAvatarUrl } from '../../../utils/avatarUtils';
import { useLocalization } from '../../../hooks/useLocalization';

interface TaskCardProps {
    task: Task;
    onTaskStatusChange: (taskId: number, statusId: number) => void;
    onTaskUpdate: (task: Task) => void;
    onTaskDelete: (taskId: number) => void;
    boardStatuses: BoardStatus[];
    taskTypes: TaskType[];
    isCompact?: boolean;
    onTasksChange?: (column: any) => void;
}

// Компонент для отображения прогресса подзадач
const SubtaskProgress: React.FC<{ 
    completed: number; 
    total: number;
    isCompact?: boolean;
    t: (key: string) => string;
}> = ({ completed, total, isCompact = false, t }) => {
    const theme = useTheme();
    
    if (total === 0) return null;
    
    const progress = (completed / total) * 100;
    const allCompleted = completed === total;
    
    return (
        <Tooltip title={`${t('subtasks')}: ${completed} ${t('of')} ${total} ${t('completed')}`}>
            <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 0.5,
                minWidth: isCompact ? '40px' : '50px'
            }}>
                <ChecklistIcon 
                    sx={{ 
                        fontSize: isCompact ? 14 : 16,
                        color: allCompleted ? theme.palette.success.main : theme.palette.text.secondary
                    }} 
                />
                <Typography 
                    variant="caption" 
                    sx={{ 
                        fontSize: isCompact ? '0.65rem' : '0.7rem',
                        color: allCompleted ? theme.palette.success.main : theme.palette.text.secondary,
                        fontWeight: allCompleted ? 600 : 400,
                        minWidth: isCompact ? '20px' : '24px'
                    }}
                >
                    {completed}/{total}
                </Typography>
                <LinearProgress 
                    variant="determinate" 
                    value={progress}
                    sx={{ 
                        width: isCompact ? 20 : 30, 
                        height: isCompact ? 2 : 3,
                        borderRadius: 1,
                        backgroundColor: theme.palette.action.hover,
                        '& .MuiLinearProgress-bar': {
                            backgroundColor: allCompleted ? theme.palette.success.main : theme.palette.primary.main,
                            borderRadius: 1
                        }
                    }}
                />
            </Box>
        </Tooltip>
    );
};

// Компонент для отображения тегов задачи
const TaskTags: React.FC<{ tags: string[], isCompact?: boolean }> = ({ tags, isCompact }) => {
    const theme = useTheme();
    if (!tags || tags.length === 0) return null;
    
    // В компактном режиме показываем только 1 тег
    const visibleTags = isCompact ? tags.slice(0, 1) : tags.slice(0, 2);
    const remainingCount = tags.length - visibleTags.length;
    
    return (
        <Box sx={{ 
            display: 'flex', 
            gap: 0.5, 
            flexWrap: 'wrap', 
            mt: isCompact ? 0.5 : 1,
            alignItems: 'center'
        }}>
            {visibleTags.map(tag => (
                <Chip
                    key={tag}
                    label={tag}
                    size="small"
                    variant="outlined"
                    sx={{ 
                        height: isCompact ? 16 : 20, 
                        borderColor: theme.palette.divider,
                        color: theme.palette.text.secondary,
                        '& .MuiChip-label': { 
                            px: 1, 
                            fontSize: isCompact ? '0.65rem' : '0.7rem'
                        } 
                    }}
                />
            ))}
            {remainingCount > 0 && (
                <Tooltip 
                    title={
                        <Box>
                            {tags.slice(isCompact ? 1 : 2).map(tag => (
                                <Typography key={tag} variant="caption" display="block">
                                    {tag}
                                </Typography>
                            ))}
                        </Box>
                    }
                >
                    <Chip
                        icon={<LocalOfferIcon sx={{ fontSize: isCompact ? '0.65rem' : '0.7rem', color: theme.palette.text.secondary }} />}
                        label={`+${remainingCount}`}
                        size="small"
                        sx={{ 
                            height: isCompact ? 16 : 20, 
                            bgcolor: theme.palette.action.hover,
                            color: theme.palette.text.secondary,
                            '& .MuiChip-label': { 
                                px: 0.5, 
                                fontSize: isCompact ? '0.65rem' : '0.7rem'
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
    taskTypes,
    isCompact = false,
    onTasksChange
}) => {
    const theme = useTheme();
    const { t } = useLocalization();
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [isHovered, setIsHovered] = useState(false);
    const cardRef = useRef<HTMLDivElement>(null);
    const [isRemoving, setIsRemoving] = useState(false);
    
    const { deleteTask, isDeleting } = useTaskDelete();
    
    // Получаем информацию о правах пользователя
    const userRoles = useUserRole(null, Number(task.boardId));
    
    // Компонент аватара - УПРОЩЕННЫЙ
    const AssigneeAvatar: React.FC<{ 
        assignee: NonNullable<Task['assignee']>, 
        size: number,
        compactMode?: boolean 
    }> = ({ assignee, size, compactMode = false }) => {
        return (
            <Tooltip title={`Назначена на: ${assignee.displayName || assignee.username}`}>
                <Box
                    sx={{
                        width: `${size}px`,
                        height: `${size}px`,
                        minWidth: `${size}px`,
                        minHeight: `${size}px`,
                        borderRadius: '50%',
                        border: `2px solid ${theme.palette.divider}`,
                        overflow: 'hidden',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        bgcolor: theme.palette.background.paper,
                        boxShadow: theme.shadows[1],
                        flexShrink: 0,
                        position: 'relative'
                    }}
                >
                    {assignee.avatarUrl ? (
                        <img 
                            src={getAvatarUrl(assignee.avatarUrl)} 
                            alt={assignee.username}
                            style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover',
                                display: 'block'
                            }}
                            onError={(e) => {
                                console.error('Ошибка загрузки аватара:', assignee.avatarUrl);
                                // При ошибке показываем инициалы
                                e.currentTarget.style.display = 'none';
                            }}
                        />
                    ) : (
                        <Typography
                            sx={{
                                fontSize: compactMode ? '10px' : size > 24 ? '14px' : '11px',
                                fontWeight: 600,
                                color: theme.palette.text.secondary,
                                lineHeight: 1,
                                userSelect: 'none'
                            }}
                        >
                            {assignee.username.charAt(0).toUpperCase()}
                        </Typography>
                    )}
                </Box>
            </Tooltip>
        );
    };

    // Проверяем права на редактирование задачи
    const canEditTask = (): boolean => {
        if (task.boardId) {
            return userRoles.hasPermission(Permission.EDIT_TASKS);
        }
        return true; // По умолчанию разрешаем, если нет информации о правах
    };
    
    // Проверяем права на удаление задачи
    const canDeleteTask = (): boolean => {
        if (task.boardId) {
            return userRoles.hasPermission(Permission.DELETE_TASKS);
        }
        return true; // По умолчанию разрешаем, если нет информации о правах
    };
    
    const handleConfirmDelete = () => {
        deleteTask(task.id, {
            onDeleteStart: () => setIsRemoving(true),
            onSuccess: () => {
                setIsDeleteOpen(false);
                onTaskDelete(task.id);
            },
            onError: () => setIsRemoving(false)
        });
    };
    
    const handleTaskUpdate = (updatedTask: Task) => {
        onTaskUpdate(updatedTask);
        setIsEditOpen(false);
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

    // Стили карточки для компактного режима
    const compactCardStyles = {
        mb: 0.5,
        cursor: 'pointer',
        position: 'relative',
        backgroundColor: theme.palette.background.paper,
        border: `1px solid ${theme.palette.divider}`,
        borderRadius: 1,
        '&:hover': {
            borderColor: theme.palette.primary.main,
            backgroundColor: theme.palette.action.hover
        },
        display: 'flex',
        alignItems: 'center',
        pl: 1,
        pr: 1,
        py: 0,
        transition: 'all 0.3s ease',
        // Анимация удаления
        opacity: isRemoving ? 0 : 1,
        transform: isRemoving ? 'translateX(-20px)' : 'none',
        height: isRemoving ? 0 : '24px',
        overflow: isRemoving ? 'hidden' : 'visible',
        margin: isRemoving ? 0 : '0 0 4px 0',
        ...(isRemoving ? { p: 0 } : {})
    };

    // Стили карточки для стандартного режима
    const standardCardStyles = {
        mb: 2,
        cursor: 'pointer',
        position: 'relative',
        backgroundColor: theme.palette.background.paper,
        border: `1px solid ${theme.palette.divider}`,
        borderRadius: 2,
        '&:hover': {
            borderColor: theme.palette.primary.main
        },
        transition: 'all 0.3s ease',
        // Комбинированная логика для transform
        transform: isRemoving 
            ? 'translateX(-20px)' 
            : (isHovered ? 'translateY(-2px)' : 'none'),
        // Анимация удаления
        opacity: isRemoving ? 0 : 1,
        height: isRemoving ? 0 : 'auto',
        overflow: isRemoving ? 'hidden' : 'visible',
        margin: isRemoving ? 0 : '0 0 16px 0',
        ...(isRemoving ? { p: 0 } : {})
    };

    // Обработка приоритета для иконки в компактном режиме
    const getPriorityIcon = () => {
        if (!task.priority) return <></>;
        
        switch (task.priority) {
            case 'HIGH':
                return <PriorityHighIcon sx={{ fontSize: '14px', color: theme.palette.error.main }} />;
            case 'MEDIUM':
                return <PriorityHighIcon sx={{ fontSize: '14px', color: theme.palette.warning.main }} />;
            case 'LOW':
                return <PriorityHighIcon sx={{ fontSize: '14px', color: theme.palette.info.main }} />;
            default:
                return <></>;
        }
    };
    
    // Ультра-компактный режим
    if (isCompact) {
        // Проверяем длину названия задачи
        const displayTitle = task.title.length > 32 
            ? `${task.title.substring(0, 32)}...` 
            : task.title;
            
        return (
            <>
                <Card 
                    ref={cardRef}
                    elevation={isHovered ? 2 : 0}
                    sx={compactCardStyles}
                    onClick={() => setIsEditOpen(true)}
                    onMouseEnter={() => setIsHovered(true)}
                    onMouseLeave={() => setIsHovered(false)}
                >
                    {/* Цветная полоса слева */}
                    <Box 
                        sx={{ 
                            position: 'absolute', 
                            top: 0,
                            left: 0,
                            width: '3px', 
                            height: '100%',
                            bgcolor: task.type?.color || theme.palette.primary.main
                        }} 
                    />
                    
                    {/* Аватар и название задачи */}
                    <Box sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: 0.5,
                        flexGrow: 1,
                        ml: 0.5,
                        overflow: 'hidden'
                    }}>
                        {/* Аватар назначенного пользователя перед названием */}
                        {task.assignee && (
                            <AssigneeAvatar 
                                assignee={task.assignee} 
                                size={16} 
                                compactMode={true}
                            />
                        )}
                        
                        <Typography 
                            sx={{ 
                                fontWeight: 500,
                                color: theme.palette.text.primary,
                                fontSize: '0.75rem',
                                lineHeight: '24px',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                flex: 1
                            }}
                        >
                            {displayTitle}
                        </Typography>
                    </Box>
                    
                    {/* Иконки атрибутов в правой части */}
                    <Box sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: 0.5,
                        ml: 'auto'
                    }}>
                        {/* Иконка срока */}
                        {task.endDate && (
                            <Tooltip title={`Срок: ${formatDate(task.endDate)}`}>
                                <CalendarTodayIcon 
                                    sx={{ 
                                        fontSize: '14px', 
                                        color: remainingTime?.isOverdue 
                                            ? theme.palette.error.main 
                                            : theme.palette.text.secondary
                                    }} 
                                />
                            </Tooltip>
                        )}
                        
                        {/* Иконка комментариев */}
                        {((task.comments && task.comments.length > 0) || task.commentCount > 0) && (
                            <Tooltip title={`Комментариев: ${task.comments?.length || task.commentCount || 0}`}>
                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                    <CommentIcon sx={{ fontSize: '14px', color: theme.palette.text.secondary }} />
                                    {((task.comments && task.comments.length > 1) || task.commentCount > 1) && (
                                        <Typography
                                            variant="caption"
                                            sx={{
                                                fontSize: '10px',
                                                lineHeight: 1,
                                                ml: 0.1
                                            }}
                                        >
                                            {task.comments?.length || task.commentCount || 0}
                                        </Typography>
                                    )}
                                </Box>
                            </Tooltip>
                        )}
                        
                        {/* Иконка вложений */}
                        {(task.attachmentCount > 0 || (task.attachments && task.attachments.length > 0)) && (
                            <Tooltip title={`Вложений: ${task.attachmentCount || task.attachments?.length || 0}`}>
                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                    <AttachFileIcon sx={{ fontSize: '14px', color: theme.palette.text.secondary }} />
                                    {(task.attachmentCount > 1 || (task.attachments && task.attachments.length > 1)) && (
                                        <Typography
                                            variant="caption"
                                            sx={{
                                                fontSize: '10px',
                                                lineHeight: 1,
                                                ml: 0.1
                                            }}
                                        >
                                            {task.attachmentCount || task.attachments?.length || 0}
                                        </Typography>
                                    )}
                                </Box>
                            </Tooltip>
                        )}
                        
                        {/* Индикатор подзадач */}
                        {((task.subtaskCount && task.subtaskCount > 0) || (task.subtasks && task.subtasks.length > 0)) && (
                            <SubtaskProgress 
                                completed={task.subtasks?.filter(st => st.completed).length || 0}
                                total={(task.subtaskCount && task.subtaskCount > 0 ? task.subtaskCount : 0) || task.subtasks?.length || 0}
                                isCompact={true}
                                t={t}
                            />
                        )}
                        
                        {/* Иконка приоритета */}
                        {task.priority && task.priority !== 'NONE' && (
                            <Tooltip title={`${t('priority')}: ${task.priority}`}>
                                {getPriorityIcon()}
                            </Tooltip>
                        )}
                        
                        {/* Иконка статуса */}
                        {shouldShowStatus && task.customStatus && (
                            <Tooltip title={`${t('status')}: ${task.customStatus.name}`}>
                                <Box
                                    sx={{
                                        width: '14px',
                                        height: '14px',
                                        borderRadius: '50%',
                                        bgcolor: task.customStatus.color || theme.palette.primary.main
                                    }}
                                />
                            </Tooltip>
                        )}
                        
                        {/* Иконка тегов */}
                        {task.tags && task.tags.length > 0 && (
                            <Tooltip title={`${t('tags')}: ${task.tags.join(', ')}`}>
                                <LocalOfferIcon sx={{ fontSize: '14px', color: theme.palette.text.secondary }} />
                            </Tooltip>
                        )}
                    </Box>
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
                    title={t('deleteTask')}
                    message={`${t('confirmDeleteTaskNamed')}"${task.title}"?`}
                    onClose={() => setIsDeleteOpen(false)}
                    onConfirm={handleConfirmDelete}
                    actionType="delete"
                />
            </>
        );
    }

    // Стандартный режим отображения
    return (
        <>
            <Card 
                ref={cardRef}
                elevation={isHovered ? 4 : 1}
                sx={standardCardStyles}
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
                
                <CardContent sx={{ 
                    p: 1.5, 
                    '&:last-child': { pb: 1.5 }, 
                    position: 'relative', 
                    zIndex: 1 
                }}>
                    <Box>
                        {/* Заголовок с аватаром */}
                        <Box sx={{ 
                            display: 'flex', 
                            alignItems: 'center',
                            gap: 1,
                            mb: 1
                        }}>
                            {/* Аватар назначенного пользователя перед названием */}
                            {task.assignee && (
                                <AssigneeAvatar 
                                    assignee={task.assignee} 
                                    size={32} 
                                    compactMode={false}
                                />
                            )}
                            
                            <Typography 
                                variant="subtitle1"
                                sx={{ 
                                    fontWeight: 500,
                                    color: theme.palette.text.primary,
                                    flex: 1
                                }}
                            >
                                {task.title}
                            </Typography>
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
                                        <CalendarTodayIcon sx={{ 
                                            fontSize: '0.8rem', 
                                            mr: 0.5, 
                                            color: theme.palette.text.secondary 
                                        }} />
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
                                
                                {/* Индикатор комментариев */}
                                {((task.comments && task.comments.length > 0) || task.commentCount > 0) && (
                                    <Tooltip title={`${task.comments?.length || task.commentCount || 0} ${t('comments')}`}>
                                        <Box sx={{ 
                                            display: 'flex', 
                                            alignItems: 'center',
                                            color: theme.palette.text.secondary,
                                            borderRadius: '12px',
                                            px: 1,
                                            py: 0.25
                                        }}>
                                            <CommentIcon sx={{ 
                                                fontSize: '0.9rem', 
                                                mr: 0.5 
                                            }} />
                                            <Typography
                                                variant="caption"
                                                sx={{ 
                                                    fontSize: '0.7rem',
                                                    fontWeight: 'medium',
                                                    lineHeight: 1
                                                }}
                                            >
                                                {task.comments?.length || task.commentCount || 0}
                                            </Typography>
                                        </Box>
                                    </Tooltip>
                                )}

                                {/* Индикатор вложений */}
                                {(task.attachmentCount > 0 || (task.attachments && task.attachments.length > 0)) && (
                                    <Tooltip title={`${task.attachmentCount || task.attachments?.length || 0} ${t('attachments')}`}>
                                        <Box sx={{ 
                                            display: 'flex', 
                                            alignItems: 'center',
                                            color: theme.palette.text.secondary,
                                            borderRadius: '12px',
                                            px: 1,
                                            py: 0.25
                                        }}>
                                            <AttachFileIcon sx={{ 
                                                fontSize: '0.9rem', 
                                                mr: 0.5 
                                            }} />
                                            <Typography
                                                variant="caption"
                                                sx={{ 
                                                    fontSize: '0.7rem',
                                                    fontWeight: 'medium',
                                                    lineHeight: 1
                                                }}
                                            >
                                                {task.attachmentCount || task.attachments?.length || 0}
                                            </Typography>
                                        </Box>
                                    </Tooltip>
                                )}

                                {/* Индикатор подзадач */}
                                {(task.subtaskCount || (task.subtasks && task.subtasks.length > 0)) && (
                                    <SubtaskProgress 
                                        completed={task.subtasks?.filter(st => st.completed).length || 0}
                                        total={(task.subtaskCount && task.subtaskCount > 0 ? task.subtaskCount : 0) || task.subtasks?.length || 0}
                                        isCompact={false}
                                        t={t}
                                    />
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
                            {task.tags && task.tags.length > 0 && (
                                <Box sx={{ 
                                    display: 'flex', 
                                    gap: 0.5, 
                                    flexWrap: 'wrap', 
                                    mt: 1,
                                    alignItems: 'center'
                                }}>
                                    {task.tags.slice(0, 2).map(tag => (
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
                                    {task.tags.length > 2 && (
                                        <Tooltip 
                                            title={
                                                <Box>
                                                    {task.tags.slice(2).map(tag => (
                                                        <Typography key={tag} variant="caption" display="block">
                                                            {tag}
                                                        </Typography>
                                                    ))}
                                                </Box>
                                            }
                                        >
                                            <Chip
                                                icon={<LocalOfferIcon sx={{ fontSize: '0.7rem', color: theme.palette.text.secondary }} />}
                                                label={`+${task.tags.length - 2}`}
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
                            )}
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
        
        </>
    );
}; 