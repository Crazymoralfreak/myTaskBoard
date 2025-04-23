import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
    Container, 
    Typography, 
    Box, 
    IconButton, 
    CircularProgress,
    Button,
    Menu,
    MenuItem,
    Snackbar,
    Alert,
    TextField,
    InputAdornment,
    Chip,
    Popover,
    FormGroup,
    FormControlLabel,
    Checkbox,
    Tabs,
    Tab
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AddIcon from '@mui/icons-material/Add';
import SettingsIcon from '@mui/icons-material/Settings';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import FilterListIcon from '@mui/icons-material/FilterList';
import RefreshIcon from '@mui/icons-material/Refresh';
import { Board } from '../types/board';
import { boardService } from '../services/boardService';
import { BoardColumn } from '../components/Board/BoardColumn';
import { Column, BoardStatus, TaskType } from '../types/board';
import { AddColumnModal } from '../components/Board/AddColumnModal/AddColumnModal';
import { Task } from '../types/task';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import { taskService } from '../services/taskService';
import { EditBoardModal } from '../components/Board/EditBoardModal/EditBoardModal';
import { EditColumnModal } from '../components/Board/EditColumnModal/EditColumnModal';
import { ConfirmDialog } from '../components/shared/ConfirmDialog/ConfirmDialog';
import { useHotkeys } from 'react-hotkeys-hook';
import { TaskFilters } from '../components/task/TaskFilters';
import { toast } from 'react-hot-toast';
import { userService } from '../services/userService';
import { useTheme, useMediaQuery } from '@mui/material';

// Определяем тип для события горячих клавиш
interface HotkeyEvent {
    preventDefault(): void;
}

interface EditColumnData {
    id: string;
    name: string;
    color?: string;
}

interface BoardUpdate {
    name: string;
    description: string;
}

// Добавить TabPanel компонент
interface TabPanelProps {
    children?: React.ReactNode;
    index: number;
    value: number;
}

function TabPanel(props: TabPanelProps) {
    const { children, value, index, ...other } = props;

    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`filter-tabpanel-${index}`}
            aria-labelledby={`filter-tab-${index}`}
            {...other}
        >
            {value === index && (
                <Box sx={{ pt: 2 }}>
                    {children}
                </Box>
            )}
        </div>
    );
}

export const BoardPage: React.FC = () => {
    const { boardId } = useParams<{ boardId: string }>();
    const [board, setBoard] = useState<Board | null>(null);
    const [loading, setLoading] = useState(true);
    const [isAddColumnModalOpen, setIsAddColumnModalOpen] = useState(false);
    const [isEditBoardModalOpen, setIsEditBoardModalOpen] = useState(false);
    const [isDeleteBoardDialogOpen, setIsDeleteBoardDialogOpen] = useState(false);
    const [editColumnData, setEditColumnData] = useState<EditColumnData | null>(null);
    const [deleteColumnData, setDeleteColumnData] = useState<{ id: string; name: string } | null>(null);
    const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
    const navigate = useNavigate();
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [deletingBoard, setDeletingBoard] = useState(false);
    const [deletingColumn, setDeletingColumn] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [filteredColumns, setFilteredColumns] = useState<Column[]>([]);
    const [selectedStatuses, setSelectedStatuses] = useState<number[]>([]);
    const [selectedTags, setSelectedTags] = useState<string[]>([]);
    const [filterAnchorEl, setFilterAnchorEl] = useState<null | HTMLElement>(null);
    const [availableTags, setAvailableTags] = useState<string[]>([]);
    const [taskTypes, setTaskTypes] = useState<TaskType[]>([]);
    const [selectedTypes, setSelectedTypes] = useState<number[]>([]);
    const [filterTabValue, setFilterTabValue] = useState(0);
    const [isRefreshing, setIsRefreshing] = useState(false);
    // Добавляем состояние для компактного режима карточек
    const [isCompactMode, setIsCompactMode] = useState(false);
    const theme = useTheme();
    // Добавляем определение мобильного устройства
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    // Загружаем настройки пользователя при монтировании компонента
    useEffect(() => {
        const loadUserSettings = async () => {
            try {
                const settings = await userService.getUserSettings();
                if (settings && settings.compactMode !== undefined) {
                    setIsCompactMode(settings.compactMode);
                }
            } catch (error) {
                console.error('Не удалось загрузить настройки пользователя:', error);
                // В случае ошибки, используем false как значение по умолчанию
                setIsCompactMode(false);
            }
        };
        
        loadUserSettings();
    }, []);

    useEffect(() => {
        if (boardId) {
            loadBoard();
        }
    }, [boardId]);

    useEffect(() => {
        if (!board) return;

        if (!searchQuery.trim()) {
            setFilteredColumns([...board.columns]);
            return;
        }

        const query = searchQuery.toLowerCase().trim();
        const filtered = board.columns.map(column => ({
            ...column,
            tasks: column.tasks.filter(task => 
                task.title.toLowerCase().includes(query) ||
                task.description.toLowerCase().includes(query) ||
                task.tags?.some(tag => tag.toLowerCase().includes(query)) ||
                task.customStatus?.name.toLowerCase().includes(query)
            )
        }));

        setFilteredColumns([...filtered]);
    }, [searchQuery, board]);

    useEffect(() => {
        if (!board) return;
        const tags = new Set<string>();
        board.columns.forEach(column => {
            column.tasks.forEach(task => {
                task.tags?.forEach(tag => tags.add(tag));
            });
        });
        setAvailableTags(Array.from(tags));
    }, [board]);

    useEffect(() => {
        if (!board) return;

        const query = searchQuery.toLowerCase().trim();
        const filtered = board.columns.map(column => ({
            ...column,
            tasks: column.tasks.filter(task => {
                // Фильтрация по поисковому запросу
                const matchesSearch = !query || 
                    task.title.toLowerCase().includes(query) ||
                    task.description.toLowerCase().includes(query) ||
                    task.tags?.some(tag => tag.toLowerCase().includes(query)) ||
                    task.customStatus?.name.toLowerCase().includes(query);

                // Фильтрация по статусам
                const matchesStatus = selectedStatuses.length === 0 || 
                    (task.customStatus && selectedStatuses.includes(task.customStatus.id));

                // Фильтрация по типам
                const matchesType = selectedTypes.length === 0 ||
                    (task.type && selectedTypes.includes(task.type.id));

                // Фильтрация по тегам
                const matchesTags = selectedTags.length === 0 ||
                    selectedTags.every(tag => task.tags?.includes(tag));

                return matchesSearch && matchesStatus && matchesType && matchesTags;
            })
        }));

        setFilteredColumns([...filtered]);
    }, [searchQuery, board, selectedStatuses, selectedTypes, selectedTags]);

    // Обновление TaskCards при изменении типов задач
    useEffect(() => {
        if (board && board.columns) {
            const updatedColumns = board.columns.map(column => ({
                ...column,
                tasks: column.tasks.map(task => {
                    if (task.type && board.taskTypes) {
                        const updatedType = board.taskTypes.find(t => t.id === task.type?.id);
                        if (updatedType) {
                            return {
                                ...task,
                                type: updatedType
                            };
                        }
                    }
                    return task;
                })
            }));
            
            setFilteredColumns(updatedColumns);
        }
    }, [board?.taskTypes]);

    // Обновление TaskCards при изменении статусов задач
    useEffect(() => {
        if (board && board.columns) {
            const updatedColumns = board.columns.map(column => ({
                ...column,
                tasks: column.tasks.map(task => {
                    if (task.customStatus && board.taskStatuses) {
                        const updatedStatus = board.taskStatuses.find(s => s.id === task.customStatus?.id);
                        if (updatedStatus) {
                            return {
                                ...task,
                                customStatus: updatedStatus
                            };
                        }
                    }
                    return task;
                })
            }));
            
            setFilteredColumns(updatedColumns);
        }
    }, [board?.taskStatuses]);

    const loadBoard = async () => {
        if (!boardId) return;
        try {
            setLoading(true);
            
            // Загружаем параллельно доску, типы задач и статусы
            const [boardData, taskTypesData, taskStatusesData] = await Promise.all([
                boardService.getBoard(boardId),
                boardService.getBoardTaskTypes(boardId),
                boardService.getBoardStatuses(boardId)
            ]);
            
            // Обогащаем задачи на доске типами и статусами
            const enrichedColumns = boardData.columns.map(column => ({
                ...column,
                tasks: column.tasks.map(task => {
                    // Обновляем тип задачи
                    let enrichedTask = { ...task };
                    
                    if (task.type && task.type.id) {
                        const fullType = taskTypesData.find(t => t.id === task.type?.id);
                        if (fullType) {
                            enrichedTask.type = fullType;
                        }
                    }
                    
                    // Обновляем статус задачи
                    if (task.customStatus && task.customStatus.id) {
                        const fullStatus = taskStatusesData.find(s => s.id === task.customStatus?.id);
                        if (fullStatus) {
                            enrichedTask.customStatus = fullStatus;
                        }
                    }
                    
                    return enrichedTask;
                })
            }));
            
            // Обновляем доску с обогащенными данными
            const enrichedBoard = {
                ...boardData,
                columns: enrichedColumns,
                taskTypes: taskTypesData,
                taskStatuses: taskStatusesData
            };
            
            setBoard(enrichedBoard);
            setTaskTypes(taskTypesData);
            
        } catch (error) {
            console.error('Failed to load board:', error instanceof Error ? error.message : error);
            setError('Не удалось загрузить доску');
        } finally {
            setLoading(false);
        }
    };

    const handleAddColumn = async (columnName: string) => {
        try {
            if (!board || !boardId) return;
            const updatedBoard = await boardService.addColumn(boardId, { name: columnName });
            setBoard(updatedBoard);
        } catch (error) {
            console.error('Failed to add column:', error instanceof Error ? error.message : error);
            setError('Не удалось добавить колонку');
        }
    };

    const handleColumnMove = async (columnId: string, newPosition: number): Promise<void> => {
        console.log(`Перемещение колонки ${columnId} на позицию ${newPosition}`);
        
        if (!board) {
            console.error('Доска не загружена');
            return;
        }
        
        // Проверяем, что новая позиция корректна
        if (newPosition < 0 || newPosition >= board.columns.length) {
            setError(`Некорректная позиция: ${newPosition}. Допустимый диапазон: 0-${board.columns.length - 1}`);
            return;
        }
        
        try {
            // Оптимистично обновляем UI
            const updatedColumns = [...board.columns];
            console.log('Колонки доски:', updatedColumns.map(c => `id:${c.id} (${typeof c.id}), name:${c.name}, position:${c.position}`));
            
            // Поиск колонки с приведением типов
            const columnIndex = updatedColumns.findIndex(c => c.id.toString() === columnId.toString());
            
            if (columnIndex === -1) {
                console.error(`Колонка с ID ${columnId} не найдена`);
                console.error(`Типы: ID в аргументе: ${typeof columnId}, ID колонок: ${typeof updatedColumns[0]?.id}`);
                return;
            }
            
            console.log(`Колонка найдена: ${updatedColumns[columnIndex].name} на позиции ${columnIndex}`);
            
            const [column] = updatedColumns.splice(columnIndex, 1);
            updatedColumns.splice(newPosition, 0, column);
            
            // Обновляем позиции
            const columnsWithNewPositions = updatedColumns.map((col, index) => ({
                ...col,
                position: index
            }));
            
            setBoard({
                ...board,
                columns: columnsWithNewPositions
            });
            
            // Отправляем запрос на сервер
            console.log(`Отправка запроса на перемещение колонки ${columnId} на позицию ${newPosition}`);
            const updatedBoard = await boardService.moveColumn(board.id.toString(), columnId, newPosition);
            console.log('Получен ответ от сервера:', updatedBoard);
            
            // Обновляем доску с данными с сервера
            setBoard(updatedBoard);
        } catch (error) {
            console.error('Ошибка при перемещении колонки:', error);
            setError('Не удалось переместить колонку. Пожалуйста, попробуйте еще раз.');
            
            // Загружаем актуальное состояние доски с сервера
            if (!board) return;
            
            try {
                const refreshedBoard = await boardService.getBoard(board.id.toString());
                setBoard(refreshedBoard);
            } catch (refreshError) {
                console.error('Не удалось обновить доску:', refreshError);
            }
        }
    };

    const onDragEnd = async (result: DropResult) => {
        const { destination, source, draggableId } = result;

        if (!destination) {
            return;
        }

        if (
            destination.droppableId === source.droppableId &&
            destination.index === source.index
        ) {
            return;
        }

        try {
            const taskId = parseInt(draggableId.replace('task-', ''));
            const sourceColumnId = parseInt(source.droppableId.replace('column-', ''));
            const destinationColumnId = parseInt(destination.droppableId.replace('column-', ''));

            // Находим задачу в исходной колонке
            const sourceColumn = board?.columns.find(col => Number(col.id) === sourceColumnId);
            if (!sourceColumn) {
                console.error('Исходная колонка не найдена');
                return;
            }

            const task = sourceColumn.tasks[source.index];
            if (!task) {
                console.error('Задача не найдена');
                return;
            }

            console.log('Moving task:', {
                taskId,
                sourceColumnId,
                destinationColumnId,
                newPosition: destination.index,
                typeId: task.type?.id,
                statusId: task.customStatus?.id
            });

            const movedTask = await taskService.moveTask({
                taskId,
                sourceColumnId,
                destinationColumnId,
                newPosition: destination.index,
                typeId: task.type?.id || null,
                statusId: task.customStatus?.id || null
            });

            console.log('Task moved successfully:', movedTask);

            // Обновляем состояние доски с новой задачей
            setBoard(prevBoard => {
                const newColumns = [...prevBoard!.columns];
                const sourceColumn = newColumns.find(col => Number(col.id) === sourceColumnId);
                const destinationColumn = newColumns.find(col => Number(col.id) === destinationColumnId);

                if (!sourceColumn || !destinationColumn) {
                    return prevBoard;
                }

                // Удаляем задачу из исходной колонки
                const [movedTask] = sourceColumn.tasks.splice(source.index, 1);

                // Добавляем задачу в целевую колонку
                destinationColumn.tasks.splice(destination.index, 0, movedTask);

                return {
                    ...prevBoard!,
                    columns: newColumns
                };
            });
        } catch (error) {
            console.error('Error moving task:', error);
            // Показываем уведомление об ошибке
            toast.error('Ошибка при перемещении задачи');
        }
    };

    const handleBoardMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
        setMenuAnchorEl(event.currentTarget);
    };

    const handleBoardMenuClose = () => {
        setMenuAnchorEl(null);
    };

    const handleEditBoard = async (updates: BoardUpdate) => {
        try {
            if (!boardId) return;
            setLoading(true);
            const updatedBoard = await boardService.updateBoardDetails(boardId, updates);
            setBoard(updatedBoard);
            setSuccess('Доска успешно обновлена');
            setIsEditBoardModalOpen(false);
            // Обновляем локальное состояние taskTypes для немедленного применения в интерфейсе
            setTaskTypes(updatedBoard.taskTypes || []);
        } catch (error) {
            console.error('Failed to update board:', error instanceof Error ? error.message : error);
            setError('Не удалось обновить доску');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteBoard = async () => {
        try {
            if (!boardId) return;
            setDeletingBoard(true);
            await boardService.deleteBoard(boardId);
            setSuccess('Доска успешно удалена');
            navigate('/');
        } catch (error) {
            console.error('Failed to delete board:', error instanceof Error ? error.message : error);
            setError('Не удалось удалить доску');
        } finally {
            setDeletingBoard(false);
            setIsDeleteBoardDialogOpen(false);
        }
    };

    const handleEditColumn = async (columnId: string, name: string, color?: string) => {
        try {
            if (!boardId) return;
            setLoading(true);
            const updatedBoard = await boardService.updateColumn(boardId, columnId, { name, color });
            setBoard(updatedBoard);
            setSuccess('Колонка успешно обновлена');
            setEditColumnData(null);
        } catch (error) {
            console.error('Failed to update column:', error instanceof Error ? error.message : error);
            setError('Не удалось обновить колонку');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteColumn = async (columnId: string, name: string) => {
        try {
            if (!boardId) return;
            setDeletingColumn(true);
            const updatedBoard = await boardService.deleteColumn(boardId, columnId);
            setBoard(updatedBoard);
            setSuccess('Колонка успешно удалена');
            setDeleteColumnData(null);
        } catch (error) {
            console.error('Failed to delete column:', error instanceof Error ? error.message : error);
            setError('Не удалось удалить колонку');
        } finally {
            setDeletingColumn(false);
        }
    };

    const handleFilterOpen = (event: React.MouseEvent<HTMLElement>) => {
        setFilterAnchorEl(event.currentTarget);
    };

    const handleFilterClose = () => {
        setFilterAnchorEl(null);
    };

    const handleStatusToggle = (statusId: number) => {
        setSelectedStatuses(prev => 
            prev.includes(statusId)
                ? prev.filter(id => id !== statusId)
                : [...prev, statusId]
        );
    };

    const handleTagToggle = (tag: string) => {
        setSelectedTags(prev =>
            prev.includes(tag)
                ? prev.filter(t => t !== tag)
                : [...prev, tag]
        );
    };

    const handleTypeToggle = (typeId: number) => {
        setSelectedTypes(prev => 
            prev.includes(typeId)
                ? prev.filter(id => id !== typeId)
                : [...prev, typeId]
        );
    };

    const clearFilters = () => {
        setSelectedStatuses([]);
        setSelectedTags([]);
        setSelectedTypes([]);
        handleFilterClose();
    };

    // Добавляем горячие клавиши
    useHotkeys('ctrl+f, cmd+f', (e: KeyboardEvent) => {
        e.preventDefault();
        const searchInput = document.querySelector('input[placeholder="Поиск задач..."]') as HTMLInputElement;
        if (searchInput) {
            searchInput.focus();
        }
    }, { enableOnFormTags: true }, []);

    useHotkeys('ctrl+/, cmd+/', (e: KeyboardEvent) => {
        e.preventDefault();
        const filterButton = document.querySelector('[aria-label="Фильтры"]') as HTMLElement;
        if (filterButton) {
            setFilterAnchorEl(filterButton);
        }
    }, { enableOnFormTags: true }, []);

    useHotkeys('esc', (e: KeyboardEvent) => {
        e.preventDefault();
        setSearchQuery('');
        setFilterAnchorEl(null);
        setSelectedStatuses([]);
        setSelectedTags([]);
    }, { enableOnFormTags: true }, []);

    // Обновляем типы в хуках горячих клавиш
    useHotkeys('ctrl+n, cmd+n', (e: any) => {
        e.preventDefault();
        setIsAddColumnModalOpen(true);
    }, { enableOnFormTags: true }, []);

    useHotkeys('ctrl+e, cmd+e', (e: any) => {
        e.preventDefault();
        setIsEditBoardModalOpen(true);
    }, { enableOnFormTags: true }, []);

    // Добавляем новый компонент для индикатора синхронизации
    const SyncIndicator = () => (
        <Box
            sx={{
                position: 'fixed',
                bottom: 16,
                right: 16,
                zIndex: 1000
            }}
        >
            {success === 'Синхронизация...' && (
                <CircularProgress size={20} sx={{ mr: 1 }} />
            )}
            {success && (
                <Alert 
                    severity={success === 'Синхронизация...' ? 'info' : 'success'}
                    sx={{ 
                        boxShadow: 3,
                        opacity: 0.9,
                        '&:hover': { opacity: 1 }
                    }}
                >
                    {success}
                </Alert>
            )}
        </Box>
    );

    const handleFilterTabChange = (event: React.SyntheticEvent, newValue: number) => {
        setFilterTabValue(newValue);
    };

    // Функция для принудительного обновления доски
    const handleRefreshBoard = async () => {
        if (!boardId) return;
        
        try {
            setIsRefreshing(true);
            
            // Загружаем параллельно доску, типы задач и статусы
            const [boardData, taskTypesData, taskStatusesData] = await Promise.all([
                boardService.getBoard(boardId),
                boardService.getBoardTaskTypes(boardId),
                boardService.getBoardStatuses(boardId)
            ]);
            
            // Обновляем состояние доски с полными данными
            const updatedBoard = {
                ...boardData,
                taskTypes: taskTypesData || boardData.taskTypes || [],
                taskStatuses: taskStatusesData || boardData.taskStatuses || []
            };
            
            // Обрабатываем доску, чтобы добавить связи между задачами, типами и статусами
            const processedBoard = boardService.processBoard(updatedBoard);
            
            setBoard(processedBoard);
            setTaskTypes(taskTypesData || []); // Обновляем отдельно список типов задач
            
            toast.success('Доска обновлена');
        } catch (error) {
            console.error('Ошибка при обновлении доски:', error);
            toast.error('Не удалось обновить доску');
        } finally {
            setIsRefreshing(false);
        }
    };

    // Добавляем эффект для прослушивания событий обновления доски
    useEffect(() => {
        // Обработчик события обновления доски
        const handleBoardUpdate = (event: CustomEvent) => {
            console.log('Получено событие board:update:', event.detail);
            
            // Проверяем, что событие касается текущей доски
            if (event.detail.boardId && event.detail.boardId.toString() === boardId) {
                console.log('Обновляем текущую доску из-за события');
                // Если требуется принудительное обновление
                if (event.detail.forceRefresh) {
                    handleRefreshBoard();
                } else {
                    // Иначе просто загружаем доску
                    loadBoard();
                }
            }
        };

        // Обработчик события удаления задачи
        const handleTaskDelete = (event: CustomEvent) => {
            console.log('Получено событие task:delete:', event.detail);
            
            // Проверяем, что событие касается текущей доски
            if (event.detail.boardId && event.detail.boardId.toString() === boardId) {
                console.log('Обновляем текущую доску из-за удаления задачи');
                handleRefreshBoard();
            }
        };

        // Добавляем обработчики событий
        window.addEventListener('board:update', handleBoardUpdate as EventListener);
        window.addEventListener('task:delete', handleTaskDelete as EventListener);
        
        // Обработчик события удаления задачи
        const handleTaskDeleted = (event: Event) => {
            console.log('Получено событие task-deleted');
            const customEvent = event as CustomEvent;
            const taskId = customEvent.detail?.taskId;
            
            // Если есть ID задачи, удаляем задачу из локального состояния доски
            if (taskId && board) {
                console.log('Удаляем задачу из состояния:', taskId);
                const updatedBoard = { ...board };
                
                // Удаляем задачу из всех колонок
                updatedBoard.columns = updatedBoard.columns.map(column => ({
                    ...column,
                    tasks: column.tasks.filter(task => task.id !== taskId)
                }));
                
                // Обновляем состояние без запроса к серверу
                setBoard(updatedBoard);
            } else {
                // Если нет ID задачи или доски, обновляем через API
                handleRefreshBoard();
            }
        };
        
        window.addEventListener('task-deleted', handleTaskDeleted as EventListener);

        // Удаляем обработчики при размонтировании
        return () => {
            window.removeEventListener('board:update', handleBoardUpdate as EventListener);
            window.removeEventListener('task:delete', handleTaskDelete as EventListener);
            window.removeEventListener('task-deleted', handleTaskDeleted as EventListener);
        };
    }, [boardId]);

    if (loading) {
        return (
            <Container sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                <CircularProgress />
            </Container>
        );
    }

    if (!board) {
        return (
            <Container>
                <Typography>Доска не найдена</Typography>
            </Container>
        );
    }

    return (
        <Container sx={{ mt: 2, mb: 4, p: {xs: 1, sm: 2} }} maxWidth={false}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <IconButton onClick={() => navigate('/boards')} aria-label="back">
                        <ArrowBackIcon />
                    </IconButton>
                    <Typography variant="h5" component="h1" noWrap sx={{ maxWidth: { xs: 200, sm: 300, md: 500 } }}>
                        {board?.name || 'Загрузка...'}
                    </Typography>
                    <IconButton 
                        onClick={handleBoardMenuOpen} 
                        aria-label="board settings"
                        aria-haspopup="true"
                    >
                        <SettingsIcon />
                    </IconButton>
                </Box>

                <Box sx={{ display: 'flex', gap: 1, ml: 'auto', flexWrap: 'wrap' }}>
                    <TextField
                        size="small"
                        placeholder="Поиск задач..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <SearchIcon />
                                </InputAdornment>
                            ),
                            endAdornment: searchQuery && (
                                <InputAdornment position="end">
                                    <IconButton size="small" onClick={() => setSearchQuery('')}>
                                        <ClearIcon fontSize="small" />
                                    </IconButton>
                                </InputAdornment>
                            ),
                            sx: { height: 40 }
                        }}
                        sx={{ width: { xs: '100%', sm: 200 } }}
                    />
                    
                    <Button 
                        variant="outlined" 
                        onClick={handleFilterOpen}
                        startIcon={<FilterListIcon />}
                        aria-label="Фильтры"
                        aria-haspopup="true"
                        aria-expanded={Boolean(filterAnchorEl) ? 'true' : undefined}
                        aria-controls={Boolean(filterAnchorEl) ? 'filter-menu' : undefined}
                        size="small"
                        sx={{ height: 40, display: { xs: 'none', sm: 'flex' } }}
                    >
                        Фильтры
                        {(selectedStatuses.length > 0 || selectedTags.length > 0 || selectedTypes.length > 0) && (
                            <Chip 
                                label={selectedStatuses.length + selectedTags.length + selectedTypes.length} 
                                size="small" 
                                color="primary"
                                sx={{ ml: 1, height: 20, minWidth: 20 }}
                            />
                        )}
                    </Button>
                    
                    <IconButton 
                        onClick={handleFilterOpen}
                        aria-label="Фильтры"
                        sx={{ display: { xs: 'flex', sm: 'none' } }}
                    >
                        <FilterListIcon />
                        {(selectedStatuses.length > 0 || selectedTags.length > 0 || selectedTypes.length > 0) && (
                            <Box 
                                sx={{ 
                                    position: 'absolute', 
                                    top: 0, 
                                    right: 0, 
                                    width: 12, 
                                    height: 12, 
                                    bgcolor: 'primary.main', 
                                    borderRadius: '50%' 
                                }} 
                            />
                        )}
                    </IconButton>
                    
                    <IconButton 
                        onClick={handleRefreshBoard}
                        aria-label="Обновить доску"
                        disabled={isRefreshing}
                    >
                        <RefreshIcon />
                    </IconButton>
                </Box>

                <Menu
                    id="board-menu"
                    anchorEl={menuAnchorEl}
                    open={Boolean(menuAnchorEl)}
                    onClose={handleBoardMenuClose}
                >
                    <MenuItem 
                        onClick={() => {
                            setIsEditBoardModalOpen(true);
                            handleBoardMenuClose();
                        }}
                    >
                        Редактировать доску
                    </MenuItem>
                    <MenuItem 
                        onClick={() => {
                            setIsDeleteBoardDialogOpen(true);
                            handleBoardMenuClose();
                        }}
                        sx={{ color: 'error.main' }}
                    >
                        Удалить доску
                    </MenuItem>
                </Menu>
                
                <Popover
                    id="filter-menu"
                    open={Boolean(filterAnchorEl)}
                    anchorEl={filterAnchorEl}
                    onClose={handleFilterClose}
                    anchorOrigin={{
                        vertical: 'bottom',
                        horizontal: 'right',
                    }}
                    transformOrigin={{
                        vertical: 'top',
                        horizontal: 'right',
                    }}
                    PaperProps={{
                        sx: { 
                            width: { xs: 300, sm: 450 },
                            maxHeight: { xs: '80vh', sm: 600 },
                            overflow: 'auto',
                            p: 2
                        }
                    }}
                >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Typography variant="h6">Фильтры</Typography>
                        <Button 
                            onClick={clearFilters}
                            disabled={selectedStatuses.length === 0 && selectedTags.length === 0 && selectedTypes.length === 0}
                        >
                            Сбросить все
                        </Button>
                    </Box>
                    
                    <Tabs 
                        value={filterTabValue} 
                        onChange={handleFilterTabChange}
                        variant="fullWidth"
                        sx={{ mb: 2 }}
                    >
                        <Tab label="Статусы" />
                        <Tab label="Теги" />
                        <Tab label="Типы" />
                    </Tabs>
                    
                    <TabPanel value={filterTabValue} index={0}>
                        <FormGroup>
                            {board?.taskStatuses.map((status) => (
                                <FormControlLabel
                                    key={status.id}
                                    control={
                                        <Checkbox
                                            checked={selectedStatuses.includes(status.id)}
                                            onChange={() => handleStatusToggle(status.id)}
                                            sx={{
                                                color: status.color,
                                                '&.Mui-checked': {
                                                    color: status.color,
                                                },
                                            }}
                                        />
                                    }
                                    label={status.name}
                                />
                            ))}
                        </FormGroup>
                    </TabPanel>
                    
                    <TabPanel value={filterTabValue} index={1}>
                        <FormGroup>
                            {availableTags.map((tag) => (
                                <FormControlLabel
                                    key={tag}
                                    control={
                                        <Checkbox
                                            checked={selectedTags.includes(tag)}
                                            onChange={() => handleTagToggle(tag)}
                                        />
                                    }
                                    label={tag}
                                />
                            ))}
                        </FormGroup>
                    </TabPanel>
                    
                    <TabPanel value={filterTabValue} index={2}>
                        <FormGroup>
                            {taskTypes.map((type) => (
                                <FormControlLabel
                                    key={type.id}
                                    control={
                                        <Checkbox
                                            checked={selectedTypes.includes(type.id)}
                                            onChange={() => handleTypeToggle(type.id)}
                                            sx={{
                                                color: type.color || undefined,
                                                '&.Mui-checked': {
                                                    color: type.color || undefined,
                                                },
                                            }}
                                        />
                                    }
                                    label={type.name}
                                />
                            ))}
                        </FormGroup>
                    </TabPanel>
                </Popover>
            </Box>
            
            {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                </Alert>
            )}

            <DragDropContext onDragEnd={onDragEnd}>
                <Box
                    sx={{
                        display: 'flex',
                        flexDirection: isMobile ? 'column' : 'row',
                        gap: 2,
                        overflow: 'auto',
                        pb: 2,
                        // Для мобильных, задаем максимальную высоту колонок
                        '& > div': isMobile ? {
                            maxHeight: 'none',
                            width: '100%'
                        } : {}
                    }}
                >
                    {board && filteredColumns && filteredColumns.length > 0 ? (
                        <>
                            {filteredColumns.map((column, index) => (
                                <Droppable key={column.id} droppableId={column.id.toString()} type="task">
                                    {(provided) => (
                                        <div
                                            ref={provided.innerRef}
                                            {...provided.droppableProps}
                                            style={{ height: '100%' }}
                                        >
                                            <BoardColumn
                                                column={column}
                                                onMove={(newPosition) => handleColumnMove(column.id.toString(), newPosition)}
                                                canMoveLeft={index > 0}
                                                canMoveRight={index < filteredColumns.length - 1}
                                                boardStatuses={board.taskStatuses}
                                                taskTypes={taskTypes}
                                                isCompactMode={isCompactMode}
                                                onTasksChange={(updatedColumn) => {
                                                    if (!board) return;
                                                    const updatedColumns = board.columns.map(col =>
                                                        col.id === updatedColumn.id ? updatedColumn : col
                                                    );
                                                    setBoard({
                                                        ...board,
                                                        columns: updatedColumns
                                                    });
                                                }}
                                                onEdit={(columnId, name, color) => handleEditColumn(columnId, name, color)}
                                                onDelete={(columnId, name) => handleDeleteColumn(columnId, name)}
                                                boardId={boardId}
                                            />
                                            {provided.placeholder}
                                        </div>
                                    )}
                                </Droppable>
                            ))}
                            {/* Кнопка добавления новой колонки */}
                            <Box 
                                sx={{ 
                                    minWidth: isMobile ? '100%' : 280,
                                    maxWidth: isMobile ? '100%' : 280,
                                    height: 80,
                                    border: '2px dashed',
                                    borderColor: 'primary.light',
                                    borderRadius: 1,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    cursor: 'pointer',
                                    mt: 0.5,
                                    transition: 'all 0.2s',
                                    bgcolor: 'background.paper',
                                    '&:hover': {
                                        borderColor: 'primary.main',
                                        bgcolor: 'primary.lighter',
                                    }
                                }}
                                onClick={() => setIsAddColumnModalOpen(true)}
                            >
                                <Button
                                    startIcon={<AddIcon />}
                                    color="primary"
                                >
                                    Добавить колонку
                                </Button>
                            </Box>
                        </>
                    ) : (
                        searchQuery ? (
                            <Box sx={{ 
                                display: 'flex', 
                                flexDirection: 'column', 
                                alignItems: 'center',
                                width: '100%',
                                mt: 4 
                            }}>
                                <Typography variant="h6" color="text.secondary">
                                    Задачи не найдены
                                </Typography>
                                <Button
                                    variant="text"
                                    onClick={() => setSearchQuery('')}
                                    sx={{ mt: 1 }}
                                >
                                    Сбросить поиск
                                </Button>
                            </Box>
                        ) : (
                            <Box sx={{ 
                                display: 'flex', 
                                flexDirection: 'column', 
                                alignItems: 'center',
                                width: '100%',
                                mt: 4 
                            }}>
                                <Typography variant="h6" color="text.secondary">
                                    На этой доске пока нет колонок
                                </Typography>
                                <Button
                                    variant="contained"
                                    startIcon={<AddIcon />}
                                    onClick={() => setIsAddColumnModalOpen(true)}
                                    sx={{ mt: 2 }}
                                >
                                    Создать первую колонку
                                </Button>
                            </Box>
                        )
                    )}
                </Box>
            </DragDropContext>

            <EditBoardModal
                open={isEditBoardModalOpen}
                onClose={() => setIsEditBoardModalOpen(false)}
                onSubmit={async (updates: BoardUpdate) => {
                    await handleEditBoard(updates);
                    setIsEditBoardModalOpen(false);
                }}
                initialName={board?.name || ''}
                initialDescription={board?.description || ''}
                board={board}
                onBoardUpdate={(updatedBoard) => {
                    setBoard(updatedBoard);
                    // Обновляем локальное состояние taskTypes для немедленного применения в интерфейсе
                    setTaskTypes(updatedBoard.taskTypes || []);
                }}
            />

            <EditColumnModal
                open={!!editColumnData}
                onClose={() => setEditColumnData(null)}
                onSubmit={async (name, color) => {
                    if (editColumnData) {
                        await handleEditColumn(editColumnData.id, name, color);
                        setEditColumnData(null);
                    }
                }}
                initialName={editColumnData?.name || ''}
                initialColor={board?.columns.find(col => col.id.toString() === editColumnData?.id)?.color || '#E0E0E0'}
            />

            <ConfirmDialog
                open={isDeleteBoardDialogOpen}
                onClose={() => setIsDeleteBoardDialogOpen(false)}
                onConfirm={handleDeleteBoard}
                title="Удалить доску"
                message="Вы уверены, что хотите удалить эту доску? Это действие нельзя отменить."
                loading={deletingBoard}
                actionType="delete"
            />

            <ConfirmDialog
                open={!!deleteColumnData}
                onClose={() => setDeleteColumnData(null)}
                onConfirm={() => {
                    if (deleteColumnData) {
                        handleDeleteColumn(deleteColumnData.id, deleteColumnData.name);
                        setDeleteColumnData(null);
                    }
                }}
                title="Удалить колонку"
                message={`Вы уверены, что хотите удалить колонку "${deleteColumnData?.name}"? Все задачи в этой колонке также будут удалены.`}
                loading={deletingColumn}
                actionType="delete"
            />

            <Snackbar 
                open={!!error} 
                autoHideDuration={6000} 
                onClose={() => setError(null)}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            >
                <Alert severity="error" onClose={() => setError(null)}>
                    {error}
                </Alert>
            </Snackbar>

            <Snackbar 
                open={!!success} 
                autoHideDuration={3000} 
                onClose={() => setSuccess(null)}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            >
                <Alert severity="success" onClose={() => setSuccess(null)}>
                    {success}
                </Alert>
            </Snackbar>

            <AddColumnModal
                open={isAddColumnModalOpen}
                onClose={() => setIsAddColumnModalOpen(false)}
                onSubmit={handleAddColumn}
            />

            <SyncIndicator />
        </Container>
    );
};
  
  
