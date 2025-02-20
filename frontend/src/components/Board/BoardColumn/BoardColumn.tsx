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
import PaletteIcon from '@mui/icons-material/Palette';
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
            console.log('Creating task with data:', {
                ...taskData,
                columnId: column.id.toString(),
                statusId: defaultStatus?.id,
                columnColor: color
            });
            const createdTask = await taskService.createTask({
                ...taskData,
                columnId: column.id.toString(),
                statusId: defaultStatus?.id,
                columnColor: color
            });
            
            console.log('Task created successfully:', createdTask);
            
            // Обновляем состояние локально
            const updatedColumn = {
                ...column,
                tasks: [...column.tasks, createdTask]
            };
            
            // Вызываем onTasksChange с обновленной колонкой
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

    return (
        <Draggable draggableId={`column-${column.id}`} index={column.position}>
            {(provided) => (
                <Paper
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    elevation={1}
                    sx={{
                        width: 300,
                        bgcolor: 'background.paper',
                        borderRadius: 2,
                        display: 'flex',
                        flexDirection: 'column',
                        maxHeight: '100%'
                    }}
                >
                    <Box
                        {...provided.dragHandleProps}
                        sx={{
                            p: 2,
                            borderTopLeftRadius: 8,
                            borderTopRightRadius: 8,
                            bgcolor: color,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between'
                        }}
                    >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            {canMoveLeft && (
                                <IconButton
                                    size="small"
                                    onClick={() => onMove(column.position - 1)}
                                >
                                    <KeyboardArrowLeftIcon />
                                </IconButton>
                            )}
                            <Typography variant="h6" component="div" sx={{ fontWeight: 600 }}>
                                {column.name}
                            </Typography>
                            {canMoveRight && (
                                <IconButton
                                    size="small"
                                    onClick={() => onMove(column.position + 1)}
                                >
                                    <KeyboardArrowRightIcon />
                                </IconButton>
                            )}
                        </Box>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                            <Chip
                                size="small"
                                label={column.tasks.length}
                                color="primary"
                                sx={{ minWidth: 30 }}
                            />
                            <IconButton
                                size="small"
                                onClick={handleSortMenuOpen}
                                color="inherit"
                            >
                                <FilterListIcon />
                            </IconButton>
                            <IconButton
                                size="small"
                                onClick={handleMenuOpen}
                                color="inherit"
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
                                    p: 1,
                                    flexGrow: 1,
                                    minHeight: 100,
                                    overflowY: 'auto',
                                    bgcolor: snapshot.isDraggingOver ? alpha(color, 0.1) : 'inherit',
                                    transition: 'all 0.2s ease',
                                    border: snapshot.isDraggingOver ? `2px dashed ${color}` : '2px solid transparent',
                                    borderRadius: 1,
                                    '&::-webkit-scrollbar': {
                                        width: '8px',
                                    },
                                    '&::-webkit-scrollbar-track': {
                                        bgcolor: 'background.paper',
                                    },
                                    '&::-webkit-scrollbar-thumb': {
                                        bgcolor: 'action.hover',
                                        borderRadius: '4px',
                                    },
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
                                                        console.log('Status changed:', status);
                                                        onTasksChange?.(column);
                                                    }}
                                                    onTaskUpdate={(updatedTask) => {
                                                        console.log('Task updated:', updatedTask);
                                                        const updatedTasks = column.tasks.map(t => 
                                                            t.id === updatedTask.id ? updatedTask : t
                                                        );
                                                        onTasksChange?.({
                                                            ...column,
                                                            tasks: updatedTasks
                                                        });
                                                    }}
                                                    onTaskDelete={(taskId) => {
                                                        console.log('Task deleted:', taskId);
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
                            p: 1,
                            borderTop: '1px solid',
                            borderColor: 'divider',
                            bgcolor: 'background.paper'
                        }}
                    >
                        <Button
                            fullWidth
                            startIcon={<AddIcon />}
                            onClick={() => setIsAddingTask(true)}
                            sx={{
                                color: 'text.secondary',
                                '&:hover': {
                                    bgcolor: alpha(color, 0.1)
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
            )}
        </Draggable>
    );
}; 