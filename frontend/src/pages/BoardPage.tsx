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
    Checkbox
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AddIcon from '@mui/icons-material/Add';
import SettingsIcon from '@mui/icons-material/Settings';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import FilterListIcon from '@mui/icons-material/FilterList';
import { Board } from '../types/board';
import { boardService } from '../services/boardService';
import { BoardColumn } from '../components/board/BoardColumn';
import { Column } from '../types/board';
import { AddColumnModal } from '../components/board/AddColumnModal/AddColumnModal';
import { Task } from '../types/task';
import { DragDropContext, Droppable, DropResult } from 'react-beautiful-dnd';
import { taskService } from '../services/taskService';
import { EditBoardModal } from '../components/board/EditBoardModal/EditBoardModal';
import { EditColumnModal } from '../components/board/EditColumnModal/EditColumnModal';
import { ConfirmDialog } from '../components/shared/ConfirmDialog/ConfirmDialog';
import { useHotkeys } from 'react-hotkeys-hook';

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

                // Фильтрация по тегам
                const matchesTags = selectedTags.length === 0 ||
                    selectedTags.every(tag => task.tags?.includes(tag));

                return matchesSearch && matchesStatus && matchesTags;
            })
        }));

        setFilteredColumns([...filtered]);
    }, [searchQuery, board, selectedStatuses, selectedTags]);

    const loadBoard = async () => {
        if (!boardId) return;
        try {
            setLoading(true);
            const boardData = await boardService.getBoard(boardId);
            setBoard(boardData);
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
        if (!boardId) return;
        try {
            const updatedBoard = await boardService.moveColumn(boardId, columnId, newPosition);
            setBoard(updatedBoard);
        } catch (error) {
            console.error('Failed to move column:', error instanceof Error ? error.message : error);
            setError('Не удалось переместить колонку');
        }
    };

    const handleDragEnd = async (result: DropResult) => {
        const { source, destination, draggableId } = result;
        
        if (!destination || 
            (source.droppableId === destination.droppableId && 
             source.index === destination.index) ||
            !board
        ) {
            return;
        }

        const taskId = parseInt(draggableId.replace('task-', ''));
        const sourceColumnId = parseInt(source.droppableId);
        const destinationColumnId = parseInt(destination.droppableId);

        try {
            const prevColumns = [...board.columns];
            
            // Оптимистичное обновление UI
            const newBoard = { ...board };
            const sourceColumn = newBoard.columns.find(col => col.id === sourceColumnId);
            const destinationColumn = newBoard.columns.find(col => col.id === destinationColumnId);

            if (!sourceColumn || !destinationColumn) {
                console.error('Source or destination column not found');
                return;
            }

            const task = sourceColumn.tasks.find(t => t.id === taskId);
            if (!task) {
                console.error('Task not found:', taskId);
                return;
            }

            // Удаляем задачу из исходной колонки
            sourceColumn.tasks = sourceColumn.tasks.filter(t => t.id !== taskId);

            // Добавляем задачу в целевую колонку
            destinationColumn.tasks.splice(destination.index, 0, task);

            // Обновляем состояние для мгновенной реакции UI
            setBoard(newBoard);

            // Отправляем запрос на сервер
            await taskService.moveTask({
                taskId,
                sourceColumnId,
                destinationColumnId,
                newPosition: destination.index
            });
            setSuccess('Задача успешно перемещена');
        } catch (error) {
            console.error('Failed to move task:', error instanceof Error ? error.message : error);
            setError('Не удалось переместить задачу. Изменения отменены.');
            // Откатываем изменения в состоянии
            if (board) {
                setBoard({ ...board, columns: board.columns });
            }
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

    const clearFilters = () => {
        setSelectedStatuses([]);
        setSelectedTags([]);
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
        <Container maxWidth={false}>
            <Box sx={{ mt: 2, mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <IconButton 
                        onClick={() => navigate('/')}
                        title="Вернуться к списку досок (Esc)"
                    >
                        <ArrowBackIcon />
                    </IconButton>
                    <Typography variant="h5">{board?.name}</Typography>
                    <Box sx={{ flexGrow: 1 }} />
                    <TextField
                        placeholder="Поиск задач..."
                        size="small"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        sx={{ width: 300 }}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <SearchIcon color="action" />
                                </InputAdornment>
                            ),
                            endAdornment: searchQuery && (
                                <InputAdornment position="end">
                                    <IconButton
                                        size="small"
                                        onClick={() => setSearchQuery('')}
                                        title="Очистить поиск (Esc)"
                                    >
                                        <ClearIcon />
                                    </IconButton>
                                </InputAdornment>
                            )
                        }}
                        title="Поиск задач (Ctrl+F)"
                    />
                    <IconButton 
                        onClick={handleFilterOpen}
                        color={selectedStatuses.length > 0 || selectedTags.length > 0 ? "primary" : "default"}
                        aria-label="Фильтры"
                        title="Открыть фильтры (Ctrl+/)"
                    >
                        <FilterListIcon />
                    </IconButton>
                    <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={() => setIsAddColumnModalOpen(true)}
                        title="Добавить колонку (Ctrl+N)"
                    >
                        Добавить колонку
                    </Button>
                    <IconButton 
                        onClick={handleBoardMenuOpen}
                        title="Настройки доски (Ctrl+E)"
                    >
                        <SettingsIcon />
                    </IconButton>
                </Box>
                {(selectedStatuses.length > 0 || selectedTags.length > 0) && (
                    <Box sx={{ mt: 2, ml: 6, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                        {selectedStatuses.map(statusId => {
                            const status = board.taskStatuses.find(s => s.id === statusId);
                            if (!status) return null;
                            return (
                                <Chip
                                    key={status.id}
                                    label={status.name}
                                    onDelete={() => handleStatusToggle(statusId)}
                                    sx={{ 
                                        backgroundColor: status.color,
                                        color: '#fff'
                                    }}
                                />
                            );
                        })}
                        {selectedTags.map(tag => (
                            <Chip
                                key={tag}
                                label={tag}
                                onDelete={() => handleTagToggle(tag)}
                                variant="outlined"
                            />
                        ))}
                        <Chip
                            label="Сбросить все"
                            onDelete={clearFilters}
                            color="default"
                        />
                    </Box>
                )}
                {board.description && (
                    <Typography 
                        variant="body2" 
                        color="text.secondary" 
                        sx={{ mt: 1, ml: 6 }}
                    >
                        {board.description}
                    </Typography>
                )}
            </Box>

            <Popover
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
            >
                <Box sx={{ p: 2, width: 300 }}>
                    <Typography variant="subtitle1" sx={{ mb: 1 }}>Статусы</Typography>
                    <FormGroup>
                        {board.taskStatuses.map(status => (
                            <FormControlLabel
                                key={status.id}
                                control={
                                    <Checkbox
                                        checked={selectedStatuses.includes(status.id)}
                                        onChange={() => handleStatusToggle(status.id)}
                                    />
                                }
                                label={
                                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                        <Box
                                            sx={{
                                                width: 12,
                                                height: 12,
                                                borderRadius: '50%',
                                                backgroundColor: status.color,
                                                mr: 1
                                            }}
                                        />
                                        {status.name}
                                    </Box>
                                }
                            />
                        ))}
                    </FormGroup>

                    {availableTags.length > 0 && (
                        <>
                            <Typography variant="subtitle1" sx={{ mt: 2, mb: 1 }}>Теги</Typography>
                            <FormGroup>
                                {availableTags.map(tag => (
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
                        </>
                    )}

                    <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
                        <Button onClick={clearFilters} sx={{ mr: 1 }}>
                            Сбросить
                        </Button>
                        <Button variant="contained" onClick={handleFilterClose}>
                            Применить
                        </Button>
                    </Box>
                </Box>
            </Popover>

            <Menu
                anchorEl={menuAnchorEl}
                open={Boolean(menuAnchorEl)}
                onClose={handleBoardMenuClose}
            >
                <MenuItem onClick={() => {
                    handleBoardMenuClose();
                    setIsEditBoardModalOpen(true);
                }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                        <span>Редактировать доску</span>
                        <Typography variant="body2" color="text.secondary" sx={{ ml: 2 }}>
                            Ctrl+E
                        </Typography>
                    </Box>
                </MenuItem>
                <MenuItem 
                    onClick={() => {
                        handleBoardMenuClose();
                        setIsDeleteBoardDialogOpen(true);
                    }}
                    sx={{ color: 'error.main' }}
                >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                        <span>Удалить доску</span>
                        <Typography variant="body2" color="text.secondary" sx={{ ml: 2 }}>
                            Del
                        </Typography>
                    </Box>
                </MenuItem>
            </Menu>

            <DragDropContext onDragEnd={handleDragEnd}>
                <Box 
                    sx={{ 
                        display: 'flex', 
                        gap: 2, 
                        overflowX: 'auto', 
                        pb: 2, 
                        px: 2 
                    }}
                >
                    {filteredColumns && filteredColumns.length > 0 ? (
                        filteredColumns.map((column: Column) => (
                            <Droppable key={column.id} droppableId={column.id.toString()}>
                                {(provided) => (
                                    <div
                                        ref={provided.innerRef}
                                        {...provided.droppableProps}
                                    >
                                        <BoardColumn
                                            key={column.id}
                                            column={column}
                                            onMove={(newPosition) => handleColumnMove(column.id.toString(), newPosition)}
                                            canMoveLeft={board.columns.indexOf(column) > 0}
                                            canMoveRight={board.columns.indexOf(column) < board.columns.length - 1}
                                            boardStatuses={board.taskStatuses}
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
                                            onDelete={(columnId, name) => setDeleteColumnData({ id: columnId, name })}
                                        />
                                        {provided.placeholder}
                                    </div>
                                )}
                            </Droppable>
                        ))
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
  