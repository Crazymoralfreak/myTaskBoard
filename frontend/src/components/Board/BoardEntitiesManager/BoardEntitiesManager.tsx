import React, { useState, useEffect } from 'react';
import {
    Box,
    Tabs,
    Tab,
    Typography,
    Paper,
    List,
    ListItem,
    ListItemText,
    ListItemSecondaryAction,
    IconButton,
    Button,
    TextField,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    CircularProgress,
    Chip,
    Tooltip,
    Divider,
    InputAdornment
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import RefreshIcon from '@mui/icons-material/Refresh';
import { Board, BoardStatus, TaskType } from '../../../types/board';
import { boardService } from '../../../services/boardService';
import { ConfirmDialog } from '../../shared/ConfirmDialog';
import { IconSelector } from '../../shared/IconSelector';
import { iconNameToComponent } from '../../shared/IconSelector/iconMapping';

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
            id={`entities-tabpanel-${index}`}
            aria-labelledby={`entities-tab-${index}`}
            {...other}
        >
            {value === index && (
                <Box sx={{ p: 2 }}>
                    {children}
                </Box>
            )}
        </div>
    );
}

interface EntityFormData {
    id?: number;
    name: string;
    color: string;
    icon?: string;
    isDefault?: boolean;
}

interface BoardEntitiesManagerProps {
    board: Board;
    onBoardUpdate: (updatedBoard: Board) => void;
}

export const BoardEntitiesManager: React.FC<BoardEntitiesManagerProps> = ({ board, onBoardUpdate }) => {
    const [tabValue, setTabValue] = useState(0);
    const [statuses, setStatuses] = useState<BoardStatus[]>([]);
    const [types, setTypes] = useState<TaskType[]>([]);
    
    // Разделяем состояния загрузки для разных действий
    const [isLoading, setIsLoading] = useState(false); // Общая загрузка данных
    const [isSubmitting, setIsSubmitting] = useState(false); // Загрузка при отправке формы
    const [isDeleting, setIsDeleting] = useState(false); // Загрузка при удалении
    const [isRefreshing, setIsRefreshing] = useState(false); // Состояние для обновления списка сущностей
    
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    
    // Диалоги
    const [statusDialogOpen, setStatusDialogOpen] = useState(false);
    const [typeDialogOpen, setTypeDialogOpen] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [currentEntity, setCurrentEntity] = useState<EntityFormData>({ name: '', color: '#1976d2' });
    const [deleteEntityId, setDeleteEntityId] = useState<number | null>(null);
    const [isEditing, setIsEditing] = useState(false);

    const loadEntities = React.useCallback(async () => {
        setIsLoading(true);
        try {
            const [loadedStatuses, loadedTypes] = await Promise.all([
                boardService.getBoardStatuses(board.id),
                boardService.getBoardTaskTypes(board.id)
            ]);
            setStatuses(loadedStatuses);
            setTypes(loadedTypes);
        } catch (err) {
            console.error('Ошибка при загрузке сущностей:', err);
            setError('Не удалось загрузить сущности доски');
        } finally {
            setIsLoading(false);
        }
    }, [board.id]);

    useEffect(() => {
        loadEntities();
    }, [loadEntities]);

    const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
        setTabValue(newValue);
    };

    // Обработчики для статусов
    const handleAddStatus = () => {
        setCurrentEntity({ name: '', color: '#1976d2' });
        setIsEditing(false);
        setStatusDialogOpen(true);
    };

    const handleEditStatus = (status: BoardStatus) => {
        setCurrentEntity({
            id: status.id,
            name: status.name,
            color: status.color,
            isDefault: status.isDefault
        });
        setIsEditing(true);
        setStatusDialogOpen(true);
    };

    const handleDeleteStatus = (statusId: number) => {
        setDeleteEntityId(statusId);
        setDeleteDialogOpen(true);
    };

    const confirmDeleteStatus = async () => {
        if (!deleteEntityId) return;
        
        setIsDeleting(true);
        try {
            console.log('Удаление статуса id=' + deleteEntityId + ' с доски id=' + board.id);
            await boardService.deleteTaskStatus(board.id, deleteEntityId);
            
            // Обновляем список статусов после успешного удаления
            const newStatuses = statuses.filter(s => s.id !== deleteEntityId);
            setStatuses(newStatuses);
            
            setSuccess('Статус задачи успешно удален');
        } catch (err) {
            console.error('Ошибка при удалении статуса задачи:', err);
            setError('Не удалось удалить статус задачи: ' + (err as Error).message);
        } finally {
            setIsDeleting(false);
            setDeleteDialogOpen(false);
            // Сбрасываем ID сущности для удаления
            setDeleteEntityId(null);
        }
    };

    const saveStatus = async () => {
        if (!currentEntity.name.trim()) {
            setError('Название статуса обязательно');
            return;
        }

        setIsSubmitting(true);
        try {
            if (isEditing && currentEntity.id) {
                const updatedStatus = await boardService.updateTaskStatus(
                    board.id,
                    currentEntity.id,
                    {
                        name: currentEntity.name,
                        color: currentEntity.color
                    }
                );
                const updatedStatuses = statuses.map(s => s.id === currentEntity.id ? updatedStatus : s);
                setStatuses(updatedStatuses);
                onBoardUpdate({
                    ...board,
                    taskStatuses: updatedStatuses
                });
                setSuccess('Статус успешно обновлен');
            } else {
                const newStatus = await boardService.createTaskStatus(
                    board.id,
                    {
                        name: currentEntity.name,
                        color: currentEntity.color
                    }
                );
                const updatedStatuses = [...statuses, newStatus];
                setStatuses(updatedStatuses);
                
                // Обновляем всю доску после создания нового статуса
                try {
                    const updatedBoard = await boardService.getBoard(board.id);
                    if (updatedBoard) {
                        onBoardUpdate(updatedBoard);
                    }
                } catch (refreshErr) {
                    console.error('Ошибка при обновлении доски после создания статуса:', refreshErr);
                }
                
                setSuccess('Статус успешно создан');
            }
            setStatusDialogOpen(false);
        } catch (err) {
            console.error('Ошибка при сохранении статуса:', err);
            setError('Не удалось сохранить статус');
        } finally {
            setIsSubmitting(false);
        }
    };

    // Обработчики для типов задач
    const handleAddType = () => {
        setCurrentEntity({ name: '', color: '#1976d2', icon: '' });
        setIsEditing(false);
        setTypeDialogOpen(true);
    };

    const handleEditType = (type: TaskType) => {
        setCurrentEntity({
            id: type.id,
            name: type.name,
            color: type.color,
            icon: type.icon,
            isDefault: type.isDefault
        });
        setIsEditing(true);
        setTypeDialogOpen(true);
    };

    const handleDeleteType = (typeId: number) => {
        setDeleteEntityId(typeId);
        setDeleteDialogOpen(true);
    };

    const confirmDeleteType = async () => {
        if (!deleteEntityId) return;
        
        setIsDeleting(true);
        try {
            console.log('Удаление типа задачи id=' + deleteEntityId + ' с доски id=' + board.id);
            await boardService.deleteTaskType(board.id, deleteEntityId);
            
            // Обновляем список типов после успешного удаления
            const newTypes = types.filter(t => t.id !== deleteEntityId);
            setTypes(newTypes);
            
            setSuccess('Тип задачи успешно удален');
        } catch (err) {
            console.error('Ошибка при удалении типа задачи:', err);
            setError('Не удалось удалить тип задачи');
        } finally {
            setIsDeleting(false);
            setDeleteDialogOpen(false);
            // Сбрасываем ID сущности для удаления
            setDeleteEntityId(null);
        }
    };

    const handleTypeSubmit = async () => {
        if (!currentEntity.name.trim()) {
            setError('Название типа обязательно');
            return;
        }

        setIsSubmitting(true);
        try {
            if (isEditing && currentEntity.id) {
                const updatedType = await boardService.updateTaskType(
                    board.id,
                    currentEntity.id,
                    {
                        name: currentEntity.name,
                        color: currentEntity.color,
                        icon: currentEntity.icon || 'task_alt'
                    }
                );
                const updatedTypes = types.map(t => t.id === currentEntity.id ? updatedType : t);
                setTypes(updatedTypes);
                onBoardUpdate({
                    ...board,
                    taskTypes: updatedTypes
                });
                setSuccess('Тип успешно обновлен');
            } else {
                const newType = await boardService.createTaskType(
                    board.id,
                    {
                        name: currentEntity.name,
                        color: currentEntity.color,
                        icon: currentEntity.icon || 'task_alt'
                    }
                );
                const updatedTypes = [...types, newType];
                setTypes(updatedTypes);
                
                // Обновляем всю доску после создания нового типа задачи
                try {
                    const updatedBoard = await boardService.getBoard(board.id);
                    if (updatedBoard) {
                        onBoardUpdate(updatedBoard);
                    }
                } catch (refreshErr) {
                    console.error('Ошибка при обновлении доски после создания типа задачи:', refreshErr);
                }
                
                setSuccess('Тип успешно создан');
            }
            setTypeDialogOpen(false);
        } catch (err) {
            console.error('Ошибка при сохранении типа:', err);
            setError('Не удалось сохранить тип');
        } finally {
            setIsSubmitting(false);
        }
    };

    // Сбрасываем deleteEntityId когда закрывается диалог
    useEffect(() => {
        if (!deleteDialogOpen) {
            // Небольшая задержка для анимации закрытия диалога
            const timeout = setTimeout(() => {
                setDeleteEntityId(null);
                setIsDeleting(false); // Сбрасываем состояние удаления
            }, 300);
            return () => clearTimeout(timeout);
        }
    }, [deleteDialogOpen]);

    // Функция для обновления сущностей
    const refreshEntities = async () => {
        setIsRefreshing(true);
        try {
            await loadEntities();
            
            // Также получаем обновленную доску для обновления всего интерфейса
            const updatedBoard = await boardService.getBoard(board.id);
            if (updatedBoard) {
                onBoardUpdate(updatedBoard);
            }
            
            setSuccess('Сущности доски обновлены');
        } catch (err) {
            console.error('Ошибка при обновлении сущностей:', err);
            setError('Не удалось обновить сущности доски');
        } finally {
            setIsRefreshing(false);
        }
    };

    return (
        <Box sx={{ width: '100%' }}>
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                <Tabs value={tabValue} onChange={handleTabChange}>
                    <Tab label="Статусы задач" />
                    <Tab label="Типы задач" />
                </Tabs>
            </Box>

            {/* Панель статусов */}
            <TabPanel value={tabValue} index={0}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6">Статусы задач</Typography>
                    <Box>
                        <Button 
                            startIcon={<RefreshIcon />} 
                            onClick={refreshEntities} 
                            disabled={isRefreshing || isLoading}
                            sx={{ mr: 1 }}
                        >
                            {isRefreshing ? <CircularProgress size={24} /> : 'Обновить'}
                        </Button>
                        <Button 
                            startIcon={<AddIcon />} 
                            variant="contained" 
                            onClick={handleAddStatus}
                        >
                            Добавить статус
                        </Button>
                    </Box>
                </Box>
                
                {isLoading && <CircularProgress />}
                
                {!isLoading && statuses.length === 0 && (
                    <Typography color="textSecondary">
                        Нет доступных статусов. Создайте новый статус.
                    </Typography>
                )}
                
                {!isLoading && statuses.length > 0 && (
                    <Paper elevation={2}>
                        <List>
                            {statuses.map((status) => (
                                <React.Fragment key={status.id}>
                                    <ListItem>
                                        <Chip 
                                            sx={{ 
                                                mr: 2, 
                                                bgcolor: status.color,
                                                color: theme => 
                                                    theme.palette.getContrastText(status.color)
                                            }} 
                                            label=" " 
                                        />
                                        <ListItemText 
                                            primary={status.name}
                                            secondary={status.isDefault ? 'Системный статус' : ''}
                                        />
                                        <ListItemSecondaryAction>
                                            <Tooltip title="Редактировать">
                                                <IconButton 
                                                    edge="end" 
                                                    onClick={() => handleEditStatus(status)}
                                                    disabled={status.isDefault}
                                                >
                                                    <EditIcon />
                                                </IconButton>
                                            </Tooltip>
                                            <Tooltip title="Удалить">
                                                <IconButton 
                                                    edge="end" 
                                                    onClick={() => handleDeleteStatus(status.id)}
                                                    disabled={status.isDefault}
                                                >
                                                    <DeleteIcon />
                                                </IconButton>
                                            </Tooltip>
                                        </ListItemSecondaryAction>
                                    </ListItem>
                                    <Divider />
                                </React.Fragment>
                            ))}
                        </List>
                    </Paper>
                )}
            </TabPanel>

            {/* Панель типов задач */}
            <TabPanel value={tabValue} index={1}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6">Типы задач</Typography>
                    <Box>
                        <Button 
                            startIcon={<RefreshIcon />} 
                            onClick={refreshEntities} 
                            disabled={isRefreshing || isLoading}
                            sx={{ mr: 1 }}
                        >
                            {isRefreshing ? <CircularProgress size={24} /> : 'Обновить'}
                        </Button>
                        <Button 
                            startIcon={<AddIcon />} 
                            variant="contained" 
                            onClick={handleAddType}
                        >
                            Добавить тип
                        </Button>
                    </Box>
                </Box>
                
                {isLoading && <CircularProgress />}
                
                {!isLoading && types.length === 0 && (
                    <Typography color="textSecondary">
                        Нет доступных типов задач. Создайте новый тип.
                    </Typography>
                )}
                
                {!isLoading && types.length > 0 && (
                    <Paper elevation={2}>
                        <List>
                            {types.map((type) => (
                                <React.Fragment key={type.id}>
                                    <ListItem>
                                        <Chip 
                                            sx={{ 
                                                mr: 2, 
                                                bgcolor: type.color,
                                                color: theme => 
                                                    theme.palette.getContrastText(type.color)
                                            }} 
                                            icon={type.icon && iconNameToComponent[type.icon] 
                                                ? React.cloneElement(iconNameToComponent[type.icon], { 
                                                    style: { color: 'inherit' } 
                                                  }) 
                                                : undefined}
                                            label={type.icon ? undefined : " "} 
                                        />
                                        <ListItemText 
                                            primary={type.name}
                                            secondary={type.isDefault ? 'Системный тип' : ''}
                                        />
                                        <ListItemSecondaryAction>
                                            <Tooltip title="Редактировать">
                                                <IconButton 
                                                    edge="end" 
                                                    onClick={() => handleEditType(type)}
                                                    disabled={type.isDefault}
                                                >
                                                    <EditIcon />
                                                </IconButton>
                                            </Tooltip>
                                            <Tooltip title="Удалить">
                                                <IconButton 
                                                    edge="end" 
                                                    onClick={() => handleDeleteType(type.id)}
                                                    disabled={type.isDefault}
                                                >
                                                    <DeleteIcon />
                                                </IconButton>
                                            </Tooltip>
                                        </ListItemSecondaryAction>
                                    </ListItem>
                                    <Divider />
                                </React.Fragment>
                            ))}
                        </List>
                    </Paper>
                )}
            </TabPanel>

            {/* Диалог для статусов */}
            <Dialog open={statusDialogOpen} onClose={() => !isSubmitting && setStatusDialogOpen(false)}>
                <DialogTitle>
                    {isEditing ? 'Редактировать статус' : 'Добавить статус'}
                </DialogTitle>
                <DialogContent>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1, minWidth: '300px' }}>
                        <TextField
                            label="Название"
                            value={currentEntity.name}
                            onChange={(e) => setCurrentEntity({...currentEntity, name: e.target.value})}
                            fullWidth
                            required
                            error={!currentEntity.name.trim()}
                            helperText={!currentEntity.name.trim() ? 'Название обязательно' : ''}
                        />
                        <TextField
                            label="Цвет"
                            type="color"
                            value={currentEntity.color}
                            onChange={(e) => setCurrentEntity({...currentEntity, color: e.target.value})}
                            fullWidth
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <Box 
                                            sx={{ 
                                                width: 20, 
                                                height: 20, 
                                                bgcolor: currentEntity.color,
                                                borderRadius: '4px'
                                            }} 
                                        />
                                    </InputAdornment>
                                ),
                            }}
                        />
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setStatusDialogOpen(false)} disabled={isSubmitting}>Отмена</Button>
                    <Button 
                        onClick={saveStatus} 
                        variant="contained"
                        disabled={isSubmitting || !currentEntity.name.trim()}
                    >
                        {isSubmitting ? <CircularProgress size={24} /> : 'Сохранить'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Диалог для типов задач */}
            <Dialog open={typeDialogOpen} onClose={() => !isSubmitting && setTypeDialogOpen(false)}>
                <DialogTitle>
                    {isEditing ? 'Редактировать тип задачи' : 'Добавить тип задачи'}
                </DialogTitle>
                <DialogContent>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1, minWidth: '300px' }}>
                        <TextField
                            label="Название"
                            value={currentEntity.name}
                            onChange={(e) => setCurrentEntity({...currentEntity, name: e.target.value})}
                            fullWidth
                            required
                            error={!currentEntity.name.trim()}
                            helperText={!currentEntity.name.trim() ? 'Название обязательно' : ''}
                        />
                        <TextField
                            label="Цвет"
                            type="color"
                            value={currentEntity.color}
                            onChange={(e) => setCurrentEntity({...currentEntity, color: e.target.value})}
                            fullWidth
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <Box 
                                            sx={{ 
                                                width: 20, 
                                                height: 20, 
                                                bgcolor: currentEntity.color,
                                                borderRadius: '4px'
                                            }} 
                                        />
                                    </InputAdornment>
                                ),
                            }}
                        />
                        <IconSelector
                            label="Выберите иконку"
                            value={currentEntity.icon || ''}
                            onChange={(value) => setCurrentEntity({...currentEntity, icon: value})}
                        />
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setTypeDialogOpen(false)} disabled={isSubmitting}>Отмена</Button>
                    <Button 
                        onClick={handleTypeSubmit} 
                        variant="contained"
                        disabled={isSubmitting || !currentEntity.name.trim()}
                    >
                        {isSubmitting ? <CircularProgress size={24} /> : 'Сохранить'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Диалог подтверждения удаления */}
            <ConfirmDialog
                open={deleteDialogOpen}
                onClose={() => !isDeleting && setDeleteDialogOpen(false)}
                onConfirm={tabValue === 0 ? confirmDeleteStatus : confirmDeleteType}
                title="Подтверждение удаления"
                message={`Вы уверены, что хотите удалить этот ${tabValue === 0 ? 'статус' : 'тип задачи'}? Это действие нельзя отменить.`}
                actionType="delete"
                loading={isDeleting}
            />
        </Box>
    );
}; 