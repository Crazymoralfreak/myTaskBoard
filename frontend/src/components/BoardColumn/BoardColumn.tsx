import React, { useState, useMemo } from 'react';
import { 
    Paper, 
    Typography, 
    IconButton, 
    Box,
    Button,
    Snackbar,
    Alert,
    Menu,
    MenuItem,
    Collapse,
    Badge,
    CircularProgress,
    LinearProgress,
    Tooltip,
    Divider,
    Chip,
    ButtonGroup,
    ListItemIcon,
    ListItemText
} from '@mui/material';
import {
    ChevronLeft as ChevronLeftIcon,
    ChevronRight as ChevronRightIcon,
    Add as AddIcon,
    MoreVert as MoreVertIcon,
    Add
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
    onEdit?: (columnId: string, name: string) => void;
    onDelete?: (columnId: string, name: string) => void;
}

type SortType = 'priority' | 'date' | 'name';
type GroupType = 'none' | 'priority' | 'status';

export const BoardColumn: React.FC<BoardColumnProps> = ({
    column,
    onMove,
    canMoveLeft,
    canMoveRight,
    boardStatuses,
    onTasksChange,
    onEdit,
    onDelete
}) => {
    const [isAddTaskModalOpen, setIsAddTaskModalOpen] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
    const [isExpanded, setIsExpanded] = useState(true);
    const [isLoading, setIsLoading] = useState(false);
    const [isHovered, setIsHovered] = useState(false);
    const [sortType, setSortType] = useState<SortType>('priority');
    const [groupType, setGroupType] = useState<GroupType>('none');
    const [sortAnchorEl, setSortAnchorEl] = useState<null | HTMLElement>(null);

    const handleMove = (position: number) => {
        onMove(position);
    };

    const handleStatusChange = async (taskId: number, newStatusId: number) => {
        setIsLoading(true);
        try {
            const newStatus = boardStatuses.find(status => status.id === newStatusId);
            if (!newStatus) return;

            await taskService.updateTask(taskId, { customStatus: newStatus });
            onTasksChange?.();
        } catch (error) {
            setError('Не удалось обновить статус задачи');
        } finally {
            setIsLoading(false);
        }
    };

    const handleAddTask = async (taskData: CreateTaskRequest) => {
        setIsLoading(true);
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
            
            onTasksChange?.();
            setIsAddTaskModalOpen(false);
        } catch (error) {
            setError('Не удалось создать задачу');
            console.error('Failed to create task:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
        event.stopPropagation();
        setMenuAnchorEl(event.currentTarget);
    };

    const handleMenuClose = () => {
        setMenuAnchorEl(null);
    };

    const handleSortMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
        setSortAnchorEl(event.currentTarget);
    };

    const handleSortMenuClose = () => {
        setSortAnchorEl(null);
    };

    const completedTasks = useMemo(() => {
        return column.tasks.filter(task => 
            task.customStatus?.name.toLowerCase() === 'завершено' || 
            task.customStatus?.name.toLowerCase() === 'выполнено' ||
            task.customStatus?.name.toLowerCase() === 'done' ||
            task.customStatus?.name.toLowerCase() === 'completed'
        ).length;
    }, [column.tasks]);

    const progress = useMemo(() => {
        return column.tasks.length > 0 
            ? (completedTasks / column.tasks.length) * 100 
            : 0;
    }, [column.tasks.length, completedTasks]);

    const sortedAndGroupedTasks = useMemo(() => {
        let tasks = [...column.tasks];

        // Сортировка
        switch (sortType) {
            case 'priority':
                tasks.sort((a, b) => {
                    const priorityOrder = { HIGH: 3, MEDIUM: 2, LOW: 1, NONE: 0 };
                    return priorityOrder[b.priority] - priorityOrder[a.priority];
                });
                break;
            case 'date':
                tasks.sort((a, b) => {
                    if (!a.endDate) return 1;
                    if (!b.endDate) return -1;
                    return new Date(a.endDate).getTime() - new Date(b.endDate).getTime();
                });
                break;
            case 'name':
                tasks.sort((a, b) => a.title.localeCompare(b.title));
                break;
        }

        // Группировка
        if (groupType === 'priority') {
            const groups = {
                HIGH: tasks.filter(t => t.priority === 'HIGH'),
                MEDIUM: tasks.filter(t => t.priority === 'MEDIUM'),
                LOW: tasks.filter(t => t.priority === 'LOW'),
                NONE: tasks.filter(t => t.priority === 'NONE')
            };
            return groups;
        }

        if (groupType === 'status') {
            return tasks.reduce((acc, task) => {
                const status = task.customStatus?.name || 'Без статуса';
                if (!acc[status]) acc[status] = [];
                acc[status].push(task);
                return acc;
            }, {} as Record<string, Task[]>);
        }

        return { all: tasks };
    }, [column.tasks, sortType, groupType]);

    const statistics = useMemo(() => {
        const total = column.tasks.length;
        const withDueDate = column.tasks.filter(t => t.endDate).length;
        const overdue = column.tasks.filter(t => 
            t.endDate && new Date(t.endDate) < new Date() && 
            !['completed', 'done', 'завершено', 'выполнено'].includes(t.customStatus?.name.toLowerCase() || '')
        ).length;
        const highPriority = column.tasks.filter(t => t.priority === 'HIGH').length;

        return { total, withDueDate, overdue, highPriority };
    }, [column.tasks]);

    return (
        <Paper 
            sx={{ 
                width: isExpanded ? 280 : 60,
                minWidth: isExpanded ? 280 : 60,
                maxHeight: '100%',
                display: 'flex',
                flexDirection: 'column',
                transition: 'all 0.3s ease',
                bgcolor: isHovered ? 'action.hover' : 'background.paper',
                position: 'relative',
                '&::after': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: 3,
                    bgcolor: 'primary.main',
                    opacity: isHovered ? 1 : 0,
                    transition: 'opacity 0.3s ease'
                }
            }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            elevation={isHovered ? 3 : 1}
        >
            {isLoading && (
                <Box
                    sx={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        bgcolor: 'rgba(255, 255, 255, 0.7)',
                        zIndex: 1
                    }}
                >
                    <CircularProgress />
                </Box>
            )}

            <Box sx={{ 
                p: 2, 
                display: 'flex', 
                alignItems: 'center',
                borderBottom: '1px solid',
                borderColor: 'divider',
                gap: 0.5,
                minHeight: 48
            }}>
                <IconButton 
                    size="small" 
                    disabled={!canMoveLeft}
                    onClick={() => handleMove(column.position - 1)}
                    sx={{ 
                        display: isExpanded ? 'flex' : 'none',
                        visibility: canMoveLeft ? 'visible' : 'hidden',
                        '& .MuiSvgIcon-root': {
                            fontSize: '1.2rem'
                        }
                    }}
                >
                    <ChevronLeftIcon />
                </IconButton>
                <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    flexGrow: 1,
                    position: 'relative'
                }}>
                    <Badge 
                        badgeContent={column.tasks.length} 
                        color="primary"
                        sx={{ 
                            '& .MuiBadge-badge': {
                                right: -8,
                                top: -8,
                                border: '2px solid',
                                borderColor: 'background.paper',
                                fontSize: '0.7rem'
                            }
                        }}
                    >
                        <Typography 
                            variant="subtitle1" 
                            sx={{ 
                                fontWeight: 'medium',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                maxWidth: isExpanded ? 180 : 40,
                                transition: 'max-width 0.3s ease',
                                fontSize: '0.9rem'
                            }}
                        >
                            {column.name}
                        </Typography>
                    </Badge>
                </Box>
                <IconButton 
                    size="small"
                    disabled={!canMoveRight}
                    onClick={() => handleMove(column.position + 1)}
                    sx={{ 
                        display: isExpanded ? 'flex' : 'none',
                        visibility: canMoveRight ? 'visible' : 'hidden',
                        '& .MuiSvgIcon-root': {
                            fontSize: '1.2rem'
                        }
                    }}
                >
                    <ChevronRightIcon />
                </IconButton>
                <IconButton
                    size="small"
                    onClick={handleMenuOpen}
                    sx={{
                        '& .MuiSvgIcon-root': {
                            fontSize: '1.2rem'
                        }
                    }}
                >
                    <MoreVertIcon />
                </IconButton>
            </Box>

            <Collapse in={isExpanded} orientation="horizontal">
                <Box sx={{ 
                    width: 280,
                    display: 'flex',
                    flexDirection: 'column'
                }}>
                    {column.tasks.length > 0 && (
                        <Tooltip title={`Выполнено: ${completedTasks} из ${column.tasks.length}`}>
                            <LinearProgress 
                                variant="determinate" 
                                value={progress}
                                sx={{ 
                                    height: 2,
                                    '& .MuiLinearProgress-bar': {
                                        transition: 'transform 0.5s ease'
                                    }
                                }}
                            />
                        </Tooltip>
                    )}

                    <Box sx={{ 
                        px: 1, 
                        py: 0.5, 
                        display: 'flex', 
                        gap: 0.5, 
                        flexWrap: 'wrap',
                        minHeight: statistics.total > 0 ? 'auto' : 0,
                        overflow: 'hidden'
                    }}>
                        <Tooltip title="Всего задач">
                            <Chip 
                                size="small" 
                                label={`Всего: ${statistics.total}`} 
                                color="default"
                            />
                        </Tooltip>
                        {statistics.overdue > 0 && (
                            <Tooltip title="Просроченные задачи">
                                <Chip 
                                    size="small" 
                                    label={`Просрочено: ${statistics.overdue}`} 
                                    color="error"
                                />
                            </Tooltip>
                        )}
                        {statistics.highPriority > 0 && (
                            <Tooltip title="Высокий приоритет">
                                <Chip 
                                    size="small" 
                                    label={`Важных: ${statistics.highPriority}`}
                                    color="warning"
                                    icon={<Add sx={{ transform: 'rotate(90deg)' }} />}
                                />
                            </Tooltip>
                        )}
                    </Box>

                    <Box sx={{ 
                        p: 1,
                        flexGrow: 1,
                        overflowY: 'auto',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 1,
                        minHeight: 100,
                        maxHeight: 'calc(100vh - 250px)',
                        '&::-webkit-scrollbar': {
                            width: 6,
                            height: 6
                        },
                        '&::-webkit-scrollbar-track': {
                            background: 'transparent'
                        },
                        '&::-webkit-scrollbar-thumb': {
                            background: 'rgba(0, 0, 0, 0.1)',
                            borderRadius: 3,
                            '&:hover': {
                                background: 'rgba(0, 0, 0, 0.2)'
                            }
                        }
                    }}>
                        {Object.entries(sortedAndGroupedTasks).map(([group, tasks]) => (
                            <React.Fragment key={group}>
                                {groupType !== 'none' && tasks.length > 0 && (
                                    <Box sx={{ mb: 1 }}>
                                        <Typography 
                                            variant="caption" 
                                            sx={{ 
                                                px: 1, 
                                                py: 0.5,
                                                display: 'block',
                                                color: 'text.secondary',
                                                fontWeight: 'medium',
                                                bgcolor: 'action.hover',
                                                borderRadius: 1
                                            }}
                                        >
                                            {group}
                                        </Typography>
                                    </Box>
                                )}
                                {tasks.map((task, index) => (
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
                                                    transform: snapshot.isDragging 
                                                        ? provided.draggableProps.style?.transform 
                                                        : 'none',
                                                    opacity: snapshot.isDragging ? 0.8 : 1,
                                                    transition: snapshot.isDragging 
                                                        ? undefined 
                                                        : 'transform 0.2s ease, opacity 0.2s ease'
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
                            </React.Fragment>
                        ))}
                        {column.tasks.length === 0 && (
                            <Box 
                                sx={{ 
                                    height: '100%', 
                                    minHeight: 200,
                                    display: 'flex', 
                                    flexDirection: 'column',
                                    alignItems: 'center', 
                                    justifyContent: 'center',
                                    p: 2,
                                    color: 'text.secondary',
                                    textAlign: 'center',
                                    borderRadius: 1,
                                    border: '1px dashed',
                                    borderColor: 'divider',
                                    bgcolor: 'action.hover',
                                    transition: 'all 0.3s ease',
                                    cursor: 'pointer',
                                    '&:hover': {
                                        borderColor: 'primary.main',
                                        bgcolor: 'action.selected'
                                    }
                                }}
                                onClick={() => setIsAddTaskModalOpen(true)}
                            >
                                <Add 
                                    sx={{ 
                                        fontSize: 40, 
                                        mb: 1,
                                        color: 'text.disabled',
                                        transition: 'transform 0.2s ease',
                                        '&:hover': {
                                            transform: 'scale(1.1)'
                                        }
                                    }} 
                                />
                                <Typography variant="body2" gutterBottom>
                                    В этой колонке пока нет задач
                                </Typography>
                                <Typography 
                                    variant="caption" 
                                    color="text.disabled"
                                >
                                    Нажмите для создания новой задачи
                                </Typography>
                            </Box>
                        )}
                    </Box>

                    <Button
                        startIcon={<AddIcon />}
                        sx={{ 
                            m: 1,
                            transition: 'all 0.2s ease',
                            '&:hover': {
                                bgcolor: 'primary.main',
                                color: 'primary.contrastText'
                            }
                        }}
                        variant="outlined"
                        size="small"
                        onClick={() => setIsAddTaskModalOpen(true)}
                    >
                        Создать задачу
                    </Button>
                </Box>
            </Collapse>

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

            <Menu
                anchorEl={menuAnchorEl}
                open={Boolean(menuAnchorEl)}
                onClose={handleMenuClose}
            >
                <MenuItem onClick={() => {
                    setIsExpanded(!isExpanded);
                    handleMenuClose();
                }}>
                    <ListItemIcon>
                        {isExpanded ? <ChevronLeftIcon fontSize="small" /> : <ChevronRightIcon fontSize="small" />}
                    </ListItemIcon>
                    <ListItemText>
                        {isExpanded ? 'Свернуть колонку' : 'Развернуть колонку'}
                    </ListItemText>
                </MenuItem>
                {isExpanded && (
                    <>
                        <MenuItem onClick={() => {
                            setSortAnchorEl(menuAnchorEl);
                            handleMenuClose();
                        }}>
                            <ListItemIcon>
                                <Add fontSize="small" sx={{ transform: 'rotate(90deg)' }} />
                            </ListItemIcon>
                            <ListItemText>
                                Сортировка и группировка
                            </ListItemText>
                        </MenuItem>
                        <MenuItem onClick={() => {
                            handleMenuClose();
                            onEdit?.(column.id.toString(), column.name);
                        }}>
                            <ListItemIcon>
                                <MoreVertIcon fontSize="small" />
                            </ListItemIcon>
                            <ListItemText>
                                Редактировать
                            </ListItemText>
                        </MenuItem>
                        <Divider />
                        <MenuItem 
                            onClick={() => {
                                handleMenuClose();
                                onDelete?.(column.id.toString(), column.name);
                            }}
                            sx={{ color: 'error.main' }}
                        >
                            <ListItemIcon>
                                <Add 
                                    fontSize="small" 
                                    sx={{ 
                                        transform: 'rotate(45deg)',
                                        color: 'error.main'
                                    }} 
                                />
                            </ListItemIcon>
                            <ListItemText>
                                Удалить
                            </ListItemText>
                        </MenuItem>
                    </>
                )}
            </Menu>

            <Menu
                anchorEl={sortAnchorEl}
                open={Boolean(sortAnchorEl)}
                onClose={handleSortMenuClose}
            >
                <MenuItem 
                    onClick={() => {
                        setSortType('priority');
                        handleSortMenuClose();
                    }}
                    selected={sortType === 'priority'}
                >
                    По приоритету
                </MenuItem>
                <MenuItem 
                    onClick={() => {
                        setSortType('date');
                        handleSortMenuClose();
                    }}
                    selected={sortType === 'date'}
                >
                    По сроку
                </MenuItem>
                <MenuItem 
                    onClick={() => {
                        setSortType('name');
                        handleSortMenuClose();
                    }}
                    selected={sortType === 'name'}
                >
                    По названию
                </MenuItem>
                <Divider />
                <MenuItem 
                    onClick={() => {
                        setGroupType(groupType === 'none' ? 'priority' : 'none');
                        handleSortMenuClose();
                    }}
                >
                    {groupType === 'none' ? 'Группировать по приоритету' : 'Отключить группировку'}
                </MenuItem>
            </Menu>
        </Paper>
    );
}; 