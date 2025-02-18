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
import { BoardColumn } from '../components/BoardColumn/BoardColumn';
import { Column } from '../types/column';
import { AddColumnModal } from '../components/AddColumnModal';
import { Task } from '../types/task';
import { DragDropContext, Droppable, DropResult } from 'react-beautiful-dnd';
import { taskService } from '../services/taskService';
import { EditBoardModal } from '../components/EditBoardModal';
import { EditColumnModal } from '../components/EditColumnModal';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { useHotkeys } from 'react-hotkeys-hook';

// Определяем тип для события горячих клавиш
interface HotkeyEvent {
    preventDefault(): void;
}

export const BoardPage: React.FC = () => {
    const { boardId } = useParams<{ boardId: string }>();
    const [board, setBoard] = useState<Board | null>(null);
    const [loading, setLoading] = useState(true);
    const [isAddColumnModalOpen, setIsAddColumnModalOpen] = useState(false);
    const [isEditBoardModalOpen, setIsEditBoardModalOpen] = useState(false);
    const [isDeleteBoardDialogOpen, setIsDeleteBoardDialogOpen] = useState(false);
    const [editColumnData, setEditColumnData] = useState<{ id: string; name: string } | null>(null);
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
            setFilteredColumns(board.columns);
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

        setFilteredColumns(filtered);
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

        setFilteredColumns(filtered);
    }, [searchQuery, board, selectedStatuses, selectedTags]);

    const loadBoard = async () => {
        if (!boardId) return;
        try {
            setLoading(true);
            const boardData = await boardService.getBoard(boardId);
            setBoard(boardData);
        } catch (error) {
            console.error('Failed to load board:', error);
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
            console.error('Failed to add column:', error);
        }
    };

    const handleColumnMove = async (columnId: string, newPosition: number): Promise<void> => {
        if (!boardId) return;
        try {
            const updatedBoard = await boardService.moveColumn(boardId, columnId, newPosition);
            setBoard(updatedBoard);
        } catch (error) {
            console.error('Failed to move column:', error);
        }
    };

    const handleDragEnd = async (result: DropResult) => {
        const { source, destination, draggableId } = result;
        console.log('Drag end event:', result);

        // Если нет места назначения или место назначения то же самое, что и источник
        if (!destination || 
            (source.droppableId === destination.droppableId && 
             source.index === destination.index)
        ) {
            console.log('Invalid drop destination or same position');
            return;
        }

        try {
            console.log(`Moving task ${draggableId} from column ${source.droppableId} to ${destination.droppableId}`);

            // Оптимистичное обновление UI
            if (!board) return;
            const newBoard = { ...board };
            const sourceColumn = newBoard.columns.find(col => col.id.toString() === source.droppableId);
            const destinationColumn = newBoard.columns.find(col => col.id.toString() === destination.droppableId);

            if (!sourceColumn || !destinationColumn) {
                console.error('Source or destination column not found');
                return;
            }

            // Находим задачу
            const task = sourceColumn.tasks.find(t => t.id.toString() === draggableId);
            if (!task) {
                console.error('Task not found:', draggableId);
                return;
            }

            // Удаляем задачу из исходной колонки
            sourceColumn.tasks = sourceColumn.tasks.filter(t => t.id.toString() !== draggableId);

            // Добавляем задачу в целевую колонку
            const updatedTask = { ...task };
            destinationColumn.tasks.splice(destination.index, 0, updatedTask);

            // Обновляем состояние для мгновенной реакции UI
            setBoard(newBoard);

            // Отправляем запрос на сервер
            try {
                const movedTask = await taskService.moveTask(draggableId, destination.droppableId);
                console.log('Task moved successfully:', movedTask);
            } catch (error) {
                console.error('Failed to move task on server:', error);
                // В случае ошибки отменяем оптимистичное обновление
                await loadBoard();
            }
        } catch (error) {
            console.error('Error in handleDragEnd:', error);
            // В случае любой ошибки перезагружаем доску
            await loadBoard();
        }
    };

    const handleBoardMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
        setMenuAnchorEl(event.currentTarget);
    };

    const handleBoardMenuClose = () => {
        setMenuAnchorEl(null);
    };

    const handleEditBoard = async (updates: { name: string; description: string }) => {
        try {
            if (!boardId) return;
            setLoading(true);
            const updatedBoard = await boardService.updateBoardDetails(boardId, updates);
            setBoard(updatedBoard);
            setSuccess('Доска успешно обновлена');
            setIsEditBoardModalOpen(false);
        } catch (error) {
            console.error('Failed to update board:', error);
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
            console.error('Failed to delete board:', error);
            setError('Не удалось удалить доску');
        } finally {
            setDeletingBoard(false);
            setIsDeleteBoardDialogOpen(false);
        }
    };

    const handleEditColumn = async (columnId: string, newName: string) => {
        try {
            if (!boardId) return;
            setLoading(true);
            const updatedBoard = await boardService.updateColumn(boardId, columnId, { name: newName });
            setBoard(updatedBoard);
            setSuccess('Колонка успешно обновлена');
            setEditColumnData(null);
        } catch (error) {
            console.error('Failed to update column:', error);
            setError('Не удалось обновить колонку');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteColumn = async (columnId: string) => {
        try {
            if (!boardId) return;
            setDeletingColumn(true);
            const updatedBoard = await boardService.deleteColumn(boardId, columnId);
            setBoard(updatedBoard);
            setSuccess('Колонка успешно удалена');
            setDeleteColumnData(null);
        } catch (error) {
            console.error('Failed to delete column:', error);
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

    // Обновляем типы в хуках горячих клавиш
    useHotkeys('ctrl+n, cmd+n', (e: any) => {
        e.preventDefault();
        setIsAddColumnModalOpen(true);
    }, { enableOnFormTags: true }, []);

    useHotkeys('esc', () => {
        if (menuAnchorEl) handleBoardMenuClose();
        if (isAddColumnModalOpen) setIsAddColumnModalOpen(false);
        if (isEditBoardModalOpen) setIsEditBoardModalOpen(false);
        if (editColumnData) setEditColumnData(null);
        if (deleteColumnData) setDeleteColumnData(null);
        if (isDeleteBoardDialogOpen) setIsDeleteBoardDialogOpen(false);
    }, [menuAnchorEl, isAddColumnModalOpen, isEditBoardModalOpen, editColumnData, deleteColumnData, isDeleteBoardDialogOpen]);

    useHotkeys('ctrl+e, cmd+e', (e: any) => {
        e.preventDefault();
        setIsEditBoardModalOpen(true);
    }, { enableOnFormTags: true }, []);

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
                    <IconButton onClick={() => navigate('/')}>
                        <ArrowBackIcon />
                    </IconButton>
                    <Typography variant="h5">{board.name}</Typography>
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
                                    >
                                        <ClearIcon />
                                    </IconButton>
                                </InputAdornment>
                            )
                        }}
                    />
                    <IconButton 
                        onClick={handleFilterOpen}
                        color={selectedStatuses.length > 0 || selectedTags.length > 0 ? "primary" : "default"}
                    >
                        <FilterListIcon />
                    </IconButton>
                    <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={() => setIsAddColumnModalOpen(true)}
                    >
                        Добавить колонку
                    </Button>
                    <IconButton onClick={handleBoardMenuOpen}>
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
                        filteredColumns.map((column: Column, index: number) => (
                            <Droppable key={column.id} droppableId={column.id.toString()}>
                                {(provided) => (
                                    <div
                                        ref={provided.innerRef}
                                        {...provided.droppableProps}
                                    >
                                        <BoardColumn
                                            column={column}
                                            onMove={(position: number) => handleColumnMove(column.id.toString(), position)}
                                            canMoveLeft={index > 0}
                                            canMoveRight={index < board.columns.length - 1}
                                            boardStatuses={board.taskStatuses}
                                            onTasksChange={loadBoard}
                                            onEdit={(columnId, name) => setEditColumnData({ id: columnId, name })}
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
                onSubmit={async (updates) => {
                    await handleEditBoard(updates);
                    setIsEditBoardModalOpen(false);
                }}
                initialName={board?.name || ''}
                initialDescription={board?.description || ''}
            />

            <EditColumnModal
                open={!!editColumnData}
                onClose={() => setEditColumnData(null)}
                onSubmit={async (name) => {
                    if (editColumnData) {
                        await handleEditColumn(editColumnData.id, name);
                        setEditColumnData(null);
                    }
                }}
                initialName={editColumnData?.name || ''}
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
                        handleDeleteColumn(deleteColumnData.id);
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
        </Container>
    );
};
  