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
import { Column, BoardStatus } from '../../../types/board';
import { TaskCard } from '../../task/TaskCard';
import { AddTaskModal } from '../../task/AddTaskModal/AddTaskModal';
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
    const { column, onMove, canMoveLeft, canMoveRight, boardStatuses, onTasksChange, onEdit, onDelete } = props;
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [sortAnchorEl, setSortAnchorEl] = useState<null | HTMLElement>(null);
    const [sortType, setSortType] = useState<SortType>('priority');
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
        setSortType(newSortType);
        handleSortMenuClose();
    };

    const handleAddTask = async (taskData: Omit<CreateTaskRequest, 'columnId'>) => {
        try {
            const defaultStatus = boardStatuses.find(status => status.isDefault);
            const createdTask = await taskService.createTask({
                ...taskData,
                columnId: column.id.toString(),
                statusId: defaultStatus?.id,
                columnColor: color
            });
            
            const updatedColumn = {
                ...column,
                tasks: [...column.tasks, createdTask]
            };
            
            onTasksChange?.(updatedColumn);
            setIsAddingTask(false);
        } catch (error) {
            console.error('Error creating task:', error);
        }
    };

    const handleEditClick = () => {
        setIsEditingColumn(true);
        handleMenuClose();
    };

    const textColor = isLightColor(color) ? 'rgba(0, 0, 0, 0.87)' : 'white';
    const headerBgColor = `linear-gradient(135deg, 
        ${alpha(color, 0.8)} 0%, 
        ${alpha(color, 0.6)} 100%
    )`;
    const iconBgHoverColor = isLightColor(color) ? alpha('#000', 0.08) : alpha('#fff', 0.15);

    return (
        <Paper
            elevation={2}
            sx={{
                width: 300,
                bgcolor: 'background.paper',
                borderRadius: 2,
                display: 'flex',
                flexDirection: 'column',
                maxHeight: '100%',
                position: 'relative',
                overflow: 'hidden',
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
                        pointerEvents: 'none'
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
                            overflowY: 'auto',
                            bgcolor: snapshot.isDraggingOver ? alpha(color, 0.05) : 'transparent',
                            transition: 'all 0.2s ease',
                            borderRadius: 1,
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
                        {column.tasks.map((task, index) => (
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
                                            transform: snapshot.isDragging ? 'rotate(2deg)' : 'none',
                                            opacity: snapshot.isDragging ? 0.9 : 1,
                                            transition: 'all 0.2s ease',
                                            '&:hover': {
                                                transform: 'translateY(-2px)',
                                                boxShadow: 2
                                            },
                                            '&:last-child': { mb: 0 }
                                        }}
                                    >
                                        <TaskCard
                                            task={task}
                                            boardStatuses={boardStatuses}
                                            onStatusChange={(status) => {
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
                                            onTaskDelete={(taskId) => {
                                                const updatedTasks = column.tasks.filter(t => t.id !== taskId);
                                                onTasksChange?.({
                                                    ...column,
                                                    tasks: updatedTasks
                                                });
                                            }}
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
                        <PriorityHighIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText>По приоритету</ListItemText>
                </MenuItem>
                <MenuItem
                    onClick={() => handleSortChange('date')}
                    selected={sortType === 'date'}
                >
                    <ListItemIcon>
                        <EventIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText>По дате</ListItemText>
                </MenuItem>
                <MenuItem
                    onClick={() => handleSortChange('name')}
                    selected={sortType === 'name'}
                >
                    <ListItemIcon>
                        <SortByAlphaIcon fontSize="small" />
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

            <AddTaskModal
                open={isAddingTask}
                onClose={() => setIsAddingTask(false)}
                onSubmit={handleAddTask}
                columnId={column.id.toString()}
            />
        </Paper>
    );
}; 