import React, { useState, useEffect } from 'react';
import {
    Box,
    Paper,
    IconButton,
    Typography,
    Button,
    Menu,
    MenuItem,
    ListItemIcon,
    ListItemText,
    Divider,
    Chip
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import KeyboardArrowLeftIcon from '@mui/icons-material/KeyboardArrowLeft';
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';
import FilterListIcon from '@mui/icons-material/FilterList';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import PriorityHighIcon from '@mui/icons-material/PriorityHigh';
import EventIcon from '@mui/icons-material/Event';
import SortByAlphaIcon from '@mui/icons-material/SortByAlpha';
import { alpha } from '@mui/material/styles';
import { Column, BoardStatus, TaskType } from '../../../types/board';
import { TaskCard } from '../../task/TaskCard';
import { TaskModal } from '../../task/TaskModal';
import { Task, CreateTaskRequest } from '../../../types/task';
import { taskService } from '../../../services/taskService';
import { EditColumnModal } from '../EditColumnModal/EditColumnModal';
import { Droppable, Draggable } from 'react-beautiful-dnd';

interface BoardColumnProps {
    column: Column;
    onMove: (position: number) => void;
    canMoveLeft: boolean;
    canMoveRight: boolean;
    boardStatuses: BoardStatus[];
    taskTypes: TaskType[];
    onTasksChange?: (updatedColumn: Column) => void;
    onEdit?: (columnId: string, columnName: string, color?: string) => void;
    onDelete?: (columnId: string, columnName: string) => void;
}

type SortType = 'priority' | 'date' | 'name';

// Добавляем функцию для определения яркости цвета
const isLightColor = (color: string): boolean => {
    // Конвертируем hex в rgb
    const hex = color.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    
    // Вычисляем яркость по формуле
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    return brightness > 155;
};

export const BoardColumn: React.FC<BoardColumnProps> = (props) => {
    const { column, onMove, canMoveLeft, canMoveRight, boardStatuses, taskTypes = [], onTasksChange, onEdit, onDelete } = props;
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [sortAnchorEl, setSortAnchorEl] = useState<null | HTMLElement>(null);
    const [sortType, setSortType] = useState<SortType | null>(null);
    const [isAddingTask, setIsAddingTask] = useState(false);
    const [isEditingColumn, setIsEditingColumn] = useState(false);
    const [color, setColor] = useState(column.color || '#E0E0E0');

    useEffect(() => {
        setColor(column.color || '#E0E0E0');
    }, [column.color]);

    const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
    };

    const handleSortMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
        setSortAnchorEl(event.currentTarget);
    };

    const handleSortMenuClose = () => {
        setSortAnchorEl(null);
    };

    const handleSortChange = (newSortType: SortType) => {
        setSortType(sortType === newSortType ? null : newSortType);
        handleSortMenuClose();
    };

    const handleAddTask = async (taskData: Omit<CreateTaskRequest, 'columnId'>) => {
        try {
            const createData = {
                ...taskData,
                columnId: column.id.toString(),
                typeId: taskData.typeId || null,
                statusId: taskData.statusId || null
            };
            
            console.log("Данные для создания задачи:", createData);
            
            const createdTask = await taskService.createTask(createData);
            
            console.log("Созданная задача:", createdTask);

            if (onTasksChange && column.tasks) {
                onTasksChange({
                    ...column,
                    tasks: [...column.tasks, createdTask]
                });
            }
        } catch (error) {
            console.error('Failed to create task:', error);
        }
    };

    const handleEditClick = () => {
        setIsEditingColumn(true);
        handleMenuClose();
    };

    const handleTaskDelete = async (taskId: number) => {
        try {
            const updatedBoard = await taskService.deleteTask(taskId);
            if (onTasksChange && column.tasks) {
                onTasksChange({
                    ...column,
                    tasks: column.tasks.filter(task => task.id !== taskId)
                });
            }
        } catch (error) {
            console.error('Failed to delete task:', error);
        }
    };

    const textColor = isLightColor(color) ? 'rgba(0, 0, 0, 0.87)' : 'white';
    const headerBgColor = `linear-gradient(135deg, 
        ${alpha(color, 0.8)} 0%, 
        ${alpha(color, 0.6)} 100%
    )`;
    const iconBgHoverColor = isLightColor(color) ? alpha('#000', 0.08) : alpha('#fff', 0.15);

    // Функция для сортировки задач
    const getSortedTasks = () => {
        if (!sortType) return column.tasks;

        return [...column.tasks].sort((a, b) => {
            switch (sortType) {
                case 'priority':
                    const priorityOrder = { HIGH: 3, MEDIUM: 2, LOW: 1, NONE: 0 };
                    return (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0);
                case 'date':
                    if (!a.endDate && !b.endDate) return 0;
                    if (!a.endDate) return 1;
                    if (!b.endDate) return -1;
                    return new Date(a.endDate).getTime() - new Date(b.endDate).getTime();
                case 'name':
                    return a.title.localeCompare(b.title);
                default:
                    return 0;
            }
        });
    };

    return (
        <Paper
            elevation={2}
            sx={{
                width: 300,
                bgcolor: 'background.paper',
                borderRadius: '16px',
                display: 'flex',
                flexDirection: 'column',
                maxHeight: '100%',
                position: 'relative',
                overflow: 'visible',
                boxShadow: `0 0 0 1px ${alpha(color, 0.15)}`,
                transition: 'all 0.2s ease-in-out',
                '&:hover': {
                    boxShadow: `0 0 0 2px ${alpha(color, 0.25)}`,
                    transform: 'translateY(-2px)'
                }
            }}
        >
            <Box
                sx={{
                    p: 2,
                    background: headerBgColor,
                    backdropFilter: 'blur(8px)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    borderBottom: `1px solid ${alpha(color, 0.2)}`,
                    position: 'relative',
                    borderTopLeftRadius: '16px',
                    borderTopRightRadius: '16px',
                    '&::before': {
                        content: '""',
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: `linear-gradient(180deg, 
                            ${alpha('#fff', 0.1)} 0%, 
                            ${alpha('#fff', 0)} 100%
                        )`,
                        pointerEvents: 'none',
                        borderTopLeftRadius: '16px',
                        borderTopRightRadius: '16px'
                    }
                }}
            >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {canMoveLeft && (
                        <IconButton
                            size="small"
                            onClick={() => onMove(column.position - 1)}
                            sx={{
                                color: textColor,
                                opacity: 0.8,
                                '&:hover': { 
                                    bgcolor: iconBgHoverColor,
                                    opacity: 1
                                }
                            }}
                        >
                            <KeyboardArrowLeftIcon />
                        </IconButton>
                    )}
                    <Typography 
                        variant="h6" 
                        component="div" 
                        sx={{ 
                            fontWeight: 600,
                            color: textColor,
                            textShadow: isLightColor(color) ? 'none' : '0 1px 2px rgba(0,0,0,0.1)',
                            opacity: 0.9
                        }}
                    >
                        {column.name}
                    </Typography>
                    {canMoveRight && (
                        <IconButton
                            size="small"
                            onClick={() => onMove(column.position + 1)}
                            sx={{
                                color: textColor,
                                opacity: 0.8,
                                '&:hover': { 
                                    bgcolor: iconBgHoverColor,
                                    opacity: 1
                                }
                            }}
                        >
                            <KeyboardArrowRightIcon />
                        </IconButton>
                    )}
                </Box>
                <Box sx={{ display: 'flex', gap: 1 }}>
                    <Chip
                        size="small"
                        label={column.tasks.length}
                        sx={{ 
                            minWidth: 30,
                            bgcolor: isLightColor(color) ? alpha('#000', 0.06) : alpha('#fff', 0.15),
                            color: textColor,
                            fontWeight: 600,
                            opacity: 0.9,
                            border: isLightColor(color) ? `1px solid ${alpha('#000', 0.1)}` : 'none',
                            '&:hover': {
                                bgcolor: isLightColor(color) ? alpha('#000', 0.08) : alpha('#fff', 0.2)
                            }
                        }}
                    />
                    <IconButton
                        size="small"
                        onClick={handleSortMenuOpen}
                        sx={{
                            color: textColor,
                            opacity: 0.8,
                            '&:hover': { 
                                bgcolor: iconBgHoverColor,
                                opacity: 1
                            }
                        }}
                    >
                        <FilterListIcon />
                    </IconButton>
                    <IconButton
                        size="small"
                        onClick={handleMenuOpen}
                        sx={{
                            color: textColor,
                            opacity: 0.8,
                            '&:hover': { 
                                bgcolor: iconBgHoverColor,
                                opacity: 1
                            }
                        }}
                    >
                        <MoreVertIcon />
                    </IconButton>
                </Box>
            </Box>

            <Droppable droppableId={column.id.toString()} type="task">
                {(provided, snapshot) => (
                    <Box
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        sx={{
                            p: 2,
                            flexGrow: 1,
                            minHeight: 100,
                            maxHeight: 'calc(100vh - 200px)',
                            position: 'relative',
                            bgcolor: snapshot.isDraggingOver 
                                ? `${alpha(color, 0.15)} !important`
                                : 'transparent',
                            transition: 'all 0.2s ease',
                            borderRadius: 1,
                            overflowY: 'auto',
                            overflowX: 'visible',
                            '& > *': {
                                position: 'relative',
                                zIndex: 1
                            },
                            '&::-webkit-scrollbar': {
                                width: '6px'
                            },
                            '&::-webkit-scrollbar-track': {
                                bgcolor: alpha(color, 0.1),
                                borderRadius: '3px'
                            },
                            '&::-webkit-scrollbar-thumb': {
                                bgcolor: alpha(color, 0.3),
                                borderRadius: '3px',
                                '&:hover': {
                                    bgcolor: alpha(color, 0.5)
                                }
                            }
                        }}
                    >
                        {getSortedTasks().map((task, index) => (
                            <Draggable
                                key={task.id}
                                draggableId={`task-${task.id}`}
                                index={index}
                            >
                                {(provided, snapshot) => (
                                    <Box
                                        ref={provided.innerRef}
                                        {...provided.draggableProps}
                                        {...provided.dragHandleProps}
                                        sx={{
                                            mb: 1,
                                            transform: 'none',
                                            position: 'relative',
                                            zIndex: snapshot.isDragging ? 9999 : 'auto',
                                            pointerEvents: 'auto',
                                            '& > *': {
                                                transform: snapshot.isDragging 
                                                    ? 'rotate(2deg) scale(1.02)' 
                                                    : 'none',
                                                boxShadow: snapshot.isDragging 
                                                    ? '0 8px 16px rgba(0,0,0,0.15)' 
                                                    : 'none',
                                                transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                                            },
                                            '&:hover > *': {
                                                transform: 'translateY(-2px)',
                                                boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
                                            },
                                            '&:last-child': { mb: 0 }
                                        }}
                                    >
                                        <TaskCard
                                            task={task}
                                            boardStatuses={boardStatuses}
                                            taskTypes={taskTypes}
                                            onTaskStatusChange={(taskId: number, statusId: number) => {
                                                onTasksChange?.(column);
                                            }}
                                            onTaskUpdate={(updatedTask) => {
                                                const updatedTasks = column.tasks.map(t => 
                                                    t.id === updatedTask.id ? updatedTask : t
                                                );
                                                onTasksChange?.({
                                                    ...column,
                                                    tasks: updatedTasks
                                                });
                                            }}
                                            onTaskDelete={handleTaskDelete}
                                        />
                                    </Box>
                                )}
                            </Draggable>
                        ))}
                        {provided.placeholder}
                    </Box>
                )}
            </Droppable>

            <Box
                sx={{
                    p: 2,
                    borderTop: `1px solid ${alpha(color, 0.1)}`,
                    bgcolor: alpha(color, 0.02)
                }}
            >
                <Button
                    fullWidth
                    startIcon={<AddIcon />}
                    onClick={() => setIsAddingTask(true)}
                    sx={{
                        color: alpha(color, 0.8),
                        borderColor: alpha(color, 0.2),
                        '&:hover': {
                            bgcolor: alpha(color, 0.1),
                            borderColor: alpha(color, 0.3)
                        }
                    }}
                >
                    Добавить задачу
                </Button>
            </Box>

            <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleMenuClose}
            >
                <MenuItem onClick={handleEditClick}>
                    <ListItemIcon>
                        <EditOutlinedIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText>Редактировать</ListItemText>
                </MenuItem>
                <MenuItem
                    onClick={() => {
                        handleMenuClose();
                        onDelete?.(column.id.toString(), column.name);
                    }}
                    sx={{ color: 'error.main' }}
                >
                    <ListItemIcon>
                        <DeleteOutlineIcon fontSize="small" color="error" />
                    </ListItemIcon>
                    <ListItemText>Удалить</ListItemText>
                </MenuItem>
            </Menu>

            <Menu
                anchorEl={sortAnchorEl}
                open={Boolean(sortAnchorEl)}
                onClose={handleSortMenuClose}
            >
                <MenuItem
                    onClick={() => handleSortChange('priority')}
                    selected={sortType === 'priority'}
                >
                    <ListItemIcon>
                        <PriorityHighIcon fontSize="small" color={sortType === 'priority' ? 'primary' : 'inherit'} />
                    </ListItemIcon>
                    <ListItemText>По приоритету</ListItemText>
                </MenuItem>
                <MenuItem
                    onClick={() => handleSortChange('date')}
                    selected={sortType === 'date'}
                >
                    <ListItemIcon>
                        <EventIcon fontSize="small" color={sortType === 'date' ? 'primary' : 'inherit'} />
                    </ListItemIcon>
                    <ListItemText>По дате</ListItemText>
                </MenuItem>
                <MenuItem
                    onClick={() => handleSortChange('name')}
                    selected={sortType === 'name'}
                >
                    <ListItemIcon>
                        <SortByAlphaIcon fontSize="small" color={sortType === 'name' ? 'primary' : 'inherit'} />
                    </ListItemIcon>
                    <ListItemText>По названию</ListItemText>
                </MenuItem>
            </Menu>

            <EditColumnModal
                open={isEditingColumn}
                onClose={() => setIsEditingColumn(false)}
                onSubmit={async (name, newColor) => {
                    if (onEdit) {
                        await onEdit(column.id.toString(), name, newColor);
                        setColor(newColor);
                        setIsEditingColumn(false);
                    }
                }}
                initialName={column.name}
                initialColor={color}
            />

            <TaskModal
                open={isAddingTask}
                onClose={() => setIsAddingTask(false)}
                mode="create"
                columnId={column.id.toString()}
                onTaskCreate={handleAddTask}
                boardStatuses={boardStatuses}
                taskTypes={taskTypes}
            />
        </Paper>
    );
}; 