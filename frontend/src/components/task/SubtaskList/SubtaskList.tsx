import React, { useState, useRef, useEffect } from 'react';
import {
    List,
    ListItem,
    ListItemText,
    ListItemSecondaryAction,
    IconButton,
    Checkbox,
    Typography,
    Box,
    Button,
    TextField,
    Avatar,
    Tooltip,
    Menu,
    MenuItem,
    CircularProgress,
    ListItemAvatar,
    Chip,
    Divider,
    FormControl,
    InputLabel,
    Select,
    Paper,
    Zoom,
    Fab,
    LinearProgress
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import PersonOffIcon from '@mui/icons-material/PersonOff';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import AddIcon from '@mui/icons-material/Add';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { Subtask } from '../../../types/subtask';
import { Task } from '../../../types/task';
import { taskService } from '../../../services/taskService';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { getAvatarUrl } from '../../../utils/avatarUtils';
import { BoardMembersService } from '../../../services/BoardMembersService';
import { BoardMember } from '../../../types/BoardMember';
import { useTheme } from '@mui/material/styles';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { TextRenderer } from '../../../utils/textUtils';
import { useLocalization } from '../../../hooks/useLocalization';

interface SubtaskListProps {
    task: Task;
    onTaskUpdate: (updatedTask: Task) => void;
    onLocalUpdate?: (subtasks: Subtask[]) => void; // Локальные обновления без закрытия модального окна
}

export const SubtaskList: React.FC<SubtaskListProps> = ({ task, onTaskUpdate, onLocalUpdate }) => {
    const theme = useTheme();
    const { t } = useLocalization();
    const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
    const [newSubtaskDescription, setNewSubtaskDescription] = useState('');
    const [editingSubtask, setEditingSubtask] = useState<number | null>(null);
    const [editTitle, setEditTitle] = useState('');
    const [editDescription, setEditDescription] = useState('');
    const [loading, setLoading] = useState(false);
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [selectedSubtask, setSelectedSubtask] = useState<number | null>(null);
    const [subtasks, setSubtasks] = useState<Subtask[]>([]);
    const [boardMembers, setBoardMembers] = useState<BoardMember[]>([]);
    const [showDescriptionForm, setShowDescriptionForm] = useState(false);

    // Конфигурация для ReactQuill
    const quillModules = {
        toolbar: [
            ['bold', 'italic', 'underline', 'strike'],
            ['blockquote', 'code-block'],
            [{ 'header': [1, 2, false] }],
            [{ 'list': 'ordered'}, { 'list': 'bullet' }],
            [{ 'script': 'sub'}, { 'script': 'super' }],
            ['link'],
            ['clean']
        ]
    };

    const quillFormats = [
        'bold', 'italic', 'underline', 'strike',
        'blockquote', 'code-block',
        'header',
        'list', 'bullet',
        'script',
        'link'
    ];

    // Синхронизируем подзадачи с пропсами task
    useEffect(() => {
        if (task.subtasks) {
            // Сортируем подзадачи по порядку (position), а затем по ID для стабильности
            const sortedSubtasks = [...task.subtasks].sort((a, b) => {
                if (a.position !== undefined && b.position !== undefined) {
                    return a.position - b.position;
                }
                if (a.position !== undefined) return -1;
                if (b.position !== undefined) return 1;
                return a.id - b.id; // Fallback на ID
            });
            setSubtasks(sortedSubtasks);
            console.log('SubtaskList: Обновлены подзадачи из props:', sortedSubtasks);
        } else {
            setSubtasks([]);
        }
    }, [task.subtasks]);

    const formatDate = (date: string) => {
        return format(new Date(date), 'dd MMM yyyy HH:mm', { locale: ru });
    };

    // Загружаем участников доски
    useEffect(() => {
        const loadBoardMembers = async () => {
            // Пытаемся получить boardId из различных источников
            const boardId = task.boardId || 
                           (task as any).board?.id || 
                           (typeof window !== 'undefined' && window.location.pathname.match(/\/boards\/([a-zA-Z0-9_-]+)/)?.[1]);
            
            console.log('SubtaskList: Попытка загрузки участников доски. boardId:', boardId, 'task:', task);
            
            if (!boardId) {
                console.warn('SubtaskList: Не удалось определить boardId для загрузки участников');
                return;
            }
            
            try {
                console.log('SubtaskList: Загружаем участников доски:', boardId);
                const members = await BoardMembersService.getBoardMembers(boardId);
                console.log('SubtaskList: Загружены участники доски:', members);
                if (Array.isArray(members)) {
                    setBoardMembers(members);
                } else {
                    console.warn('SubtaskList: Получены некорректные данные участников:', members);
                    setBoardMembers([]);
                }
            } catch (error) {
                console.error('SubtaskList: Не удалось загрузить участников доски:', error);
                setBoardMembers([]);
            }
        };
        
        loadBoardMembers();
    }, [task.boardId, task]);

    const updateTaskSubtasks = (newSubtasks: Subtask[], shouldUpdateTask: boolean = false) => {
        // Сортируем подзадачи для корректного отображения
        const sortedSubtasks = [...newSubtasks].sort((a, b) => {
            if (a.position !== undefined && b.position !== undefined) {
                return a.position - b.position;
            }
            if (a.position !== undefined) return -1;
            if (b.position !== undefined) return 1;
            return a.id - b.id;
        });
        
        setSubtasks(sortedSubtasks);
        
        // Обновляем задачу только когда явно указано (например, для особых случаев автообновления статуса)
        if (shouldUpdateTask) {
            const updatedTask = {
                ...task,
                subtasks: sortedSubtasks,
                subtaskCount: sortedSubtasks.length
            };
            onTaskUpdate(updatedTask);
        } else if (onLocalUpdate) {
            // Используем локальное обновление для обычных операций
            onLocalUpdate(sortedSubtasks);
        }
    };

    const handleAddSubtask = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newSubtaskTitle.trim() || loading) return;

        try {
            setLoading(true);
            const newSubtask = await taskService.createSubtask(task.id, {
                title: newSubtaskTitle.trim(),
                description: newSubtaskDescription.trim() || undefined
            });
            
            const updatedSubtasks = [...subtasks, newSubtask];
            updateTaskSubtasks(updatedSubtasks, false); // false - не закрываем модальное окно
            setNewSubtaskTitle('');
            setNewSubtaskDescription('');
            setShowDescriptionForm(false);
        } catch (error) {
            console.error('Failed to create subtask:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleToggleComplete = async (subtaskId: number, completed: boolean) => {
        if (loading) return;

        try {
            setLoading(true);
            const updatedSubtask = await taskService.updateSubtask(task.id, subtaskId, {
                completed: !completed
            });
            
            const updatedSubtasks = subtasks.map(st => 
                st.id === subtaskId ? updatedSubtask : st
            );
            updateTaskSubtasks(updatedSubtasks, false); // false - не закрываем модальное окно
            
            // Проверяем, завершены ли все подзадачи
            const allSubtasksCompleted = updatedSubtasks.every(subtask => subtask.completed);
            
            // Если все подзадачи завершены и статус задачи еще не "Завершено"
            if (allSubtasksCompleted && task.customStatus?.name !== "Завершено") {
                // Логика автоматического изменения статуса остается прежней
                const completedStatusNames = ["завершено", "выполнено", "готово"];
                
                const currentStatus = task.customStatus;
                
                if (currentStatus) {
                    try {
                        const tasksInColumn = await taskService.getTasksByColumn(Number(task.columnId));
                        
                        const availableStatuses = tasksInColumn
                            .map(t => t.customStatus)
                            .filter((status, index, self) => 
                                status && self.findIndex(s => s?.id === status?.id) === index
                            );
                        
                        const doneStatus = availableStatuses.find(status => 
                            status && completedStatusNames.includes(status.name.toLowerCase())
                        );
                        
                        if (doneStatus) {
                            console.log('Автоматически изменяем статус на:', doneStatus.name);
                            const finalTask = await taskService.updateTask(task.id, {
                                statusId: doneStatus.id
                            });
                            // Используем локальное обновление вместо onTaskUpdate для предотвращения закрытия модального окна
                            if (onLocalUpdate) {
                                onLocalUpdate(updatedSubtasks);
                            }
                            return;
                        }
                    } catch (error) {
                        console.error('Ошибка при автоматическом обновлении статуса:', error);
                    }
                }
            }
        } catch (error) {
            console.error('Failed to update subtask:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteSubtask = async (subtaskId: number) => {
        if (loading) return;

        try {
            setLoading(true);
            await taskService.deleteSubtask(task.id, subtaskId);
            
            const updatedSubtasks = subtasks.filter(st => st.id !== subtaskId);
            updateTaskSubtasks(updatedSubtasks, false); // false - не закрываем модальное окно
        } catch (error) {
            console.error('Failed to delete subtask:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleStartEdit = (subtask: Subtask) => {
        setEditingSubtask(subtask.id);
        setEditTitle(subtask.title);
        setEditDescription(subtask.description || '');
    };

    const handleSaveEdit = async () => {
        if (!editingSubtask || !editTitle.trim() || loading) return;

        try {
            setLoading(true);
            const updatedSubtask = await taskService.updateSubtask(task.id, editingSubtask, {
                title: editTitle.trim(),
                description: editDescription.trim() || undefined
            });
            
            const updatedSubtasks = subtasks.map(st => 
                st.id === editingSubtask ? updatedSubtask : st
            );
            updateTaskSubtasks(updatedSubtasks, false); // false - не закрываем модальное окно
            setEditingSubtask(null);
            setEditTitle('');
            setEditDescription('');
        } catch (error) {
            console.error('Failed to update subtask:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDragEnd = async (result: any) => {
        if (!result.destination || loading) return;

        const items = Array.from(subtasks);
        const [reorderedItem] = items.splice(result.source.index, 1);
        items.splice(result.destination.index, 0, reorderedItem);

        // Оптимистично обновляем UI
        setSubtasks(items);

        try {
            setLoading(true);
            const reorderedSubtasks = await taskService.reorderSubtasks(
                task.id,
                items.map(item => item.id)
            );
            
            console.log('SubtaskList: Получен ответ от reorderSubtasks:', reorderedSubtasks);
            
            // Обновляем состояние с правильным порядком из API
            if (reorderedSubtasks && Array.isArray(reorderedSubtasks)) {
                updateTaskSubtasks(reorderedSubtasks, false); // false - используем локальное обновление
            } else {
                // Если API не вернул обновленные подзадачи, используем локальный порядок
                console.warn('SubtaskList: API не вернул обновленные подзадачи, используем локальный порядок');
                updateTaskSubtasks(items, false); // false - используем локальное обновление
            }
        } catch (error) {
            console.error('Failed to reorder subtasks:', error);
            // Откатываем изменения при ошибке
            updateTaskSubtasks(subtasks, false); // false - не обновляем задачу при откате
        } finally {
            setLoading(false);
        }
    };

    const handleAssigneeClick = (event: React.MouseEvent<HTMLElement>, subtaskId: number) => {
        setAnchorEl(event.currentTarget);
        setSelectedSubtask(subtaskId);
    };

    const handleAssigneeClose = () => {
        setAnchorEl(null);
        setSelectedSubtask(null);
    };

    const handleAssignSubtask = async (userId: number) => {
        if (!selectedSubtask || loading) return;

        try {
            setLoading(true);
            let updatedSubtask;
            
            if (userId === 0) {
                // Снимаем назначение - передаем 0 как специальное значение
                updatedSubtask = await taskService.updateSubtask(task.id, selectedSubtask, {
                    assigneeId: 0
                });
            } else {
                // Назначаем пользователя
                updatedSubtask = await taskService.assignSubtask(task.id, selectedSubtask, userId);
            }
            
            const updatedSubtasks = subtasks.map(st => 
                st.id === selectedSubtask ? updatedSubtask : st
            );
            updateTaskSubtasks(updatedSubtasks, false); // false - не закрываем модальное окно
        } catch (error) {
            console.error('Failed to assign subtask:', error);
        } finally {
            setLoading(false);
            handleAssigneeClose();
        }
    };

    // Подсчет статистики
    const completedCount = subtasks.filter(st => st.completed).length;
    const totalCount = subtasks.length;
    const progressPercentage = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

    return (
        <Box sx={{ position: 'relative' }}>
            {/* Заголовок с статистикой */}
            <Paper 
                elevation={1} 
                sx={{ 
                    p: 2, 
                    mb: 3,
                    background: theme.palette.mode === 'dark' 
                        ? 'linear-gradient(135deg, rgba(25, 118, 210, 0.1) 0%, rgba(156, 39, 176, 0.1) 100%)'
                        : 'linear-gradient(135deg, rgba(25, 118, 210, 0.05) 0%, rgba(156, 39, 176, 0.05) 100%)',
                    borderRadius: 2
                }}
            >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        {t('subtasksTitle')}
                    </Typography>
                    <Chip 
                        icon={<CheckCircleIcon />}
                        label={`${completedCount} / ${totalCount}`}
                        color={completedCount === totalCount && totalCount > 0 ? 'success' : 'primary'}
                        variant={completedCount === totalCount && totalCount > 0 ? 'filled' : 'outlined'}
                    />
                </Box>
                
                {totalCount > 0 && (
                    <Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                            <Typography variant="body2" color="text.secondary">
                                {t('subtasksProgress')}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                {Math.round(progressPercentage)}%
                            </Typography>
                        </Box>
                        <LinearProgress 
                            variant="determinate" 
                            value={progressPercentage}
                            sx={{ 
                                height: 8, 
                                borderRadius: 4,
                                backgroundColor: theme.palette.mode === 'dark' 
                                    ? 'rgba(255, 255, 255, 0.1)' 
                                    : 'rgba(0, 0, 0, 0.1)',
                                '& .MuiLinearProgress-bar': {
                                    borderRadius: 4,
                                    background: completedCount === totalCount && totalCount > 0
                                        ? 'linear-gradient(90deg, #4caf50, #66bb6a)'
                                        : 'linear-gradient(90deg, #2196f3, #21cbf3)'
                                }
                            }}
                        />
                    </Box>
                )}
            </Paper>

            {/* Форма добавления новой подзадачи */}
            <Paper elevation={1} sx={{ p: 2, mb: 3, borderRadius: 2 }}>
                <form onSubmit={handleAddSubtask}>
                    <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                        <TextField
                            size="small"
                            fullWidth
                            placeholder={t('addSubtask')}
                            value={newSubtaskTitle}
                            onChange={(e) => setNewSubtaskTitle(e.target.value)}
                            disabled={loading}
                            autoFocus
                            variant="outlined"
                            sx={{
                                '& .MuiOutlinedInput-root': {
                                    borderRadius: 2
                                }
                            }}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey && newSubtaskTitle.trim() && !showDescriptionForm) {
                                    e.preventDefault();
                                    handleAddSubtask(e as any);
                                }
                            }}
                        />
                        <Button
                            variant="outlined"
                            onClick={() => setShowDescriptionForm(!showDescriptionForm)}
                            disabled={loading}
                            sx={{ 
                                minWidth: '100px',
                                borderRadius: 2,
                                textTransform: 'none'
                            }}
                        >
                            {showDescriptionForm ? t('subtasksHide') : t('subtasksDescription')}
                        </Button>
                        <Button
                            variant="contained"
                            type="submit"
                            disabled={!newSubtaskTitle.trim() || loading}
                            startIcon={loading ? <CircularProgress size={16} /> : <AddIcon />}
                            sx={{ 
                                minWidth: '120px',
                                borderRadius: 2,
                                textTransform: 'none',
                                fontWeight: 600
                            }}
                        >
                                                            {loading ? t('adding') : t('add')}
                        </Button>
                    </Box>
                    
                    {showDescriptionForm && (
                        <Box sx={{ mb: 2 }}>
                            <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600 }}>
                                {t('subtasksDescriptionLabel')}
                            </Typography>
                            <ReactQuill
                                value={newSubtaskDescription}
                                onChange={setNewSubtaskDescription}
                                modules={quillModules}
                                formats={quillFormats}
                                                                    placeholder={t('subtasksAddDescription')}
                                theme="snow"
                                style={{ 
                                    height: '150px', 
                                    marginBottom: '50px',
                                    borderRadius: '8px'
                                }}
                            />
                        </Box>
                    )}
                </form>
            </Paper>

            {/* Список подзадач */}
            {subtasks.length > 0 ? (
                <DragDropContext onDragEnd={handleDragEnd}>
                    <Droppable droppableId="subtasks">
                        {(provided, snapshot) => (
                            <Box 
                                {...provided.droppableProps} 
                                ref={provided.innerRef}
                                sx={{
                                    minHeight: snapshot.isDraggingOver ? 100 : 'auto',
                                    transition: 'min-height 0.2s ease',
                                    borderRadius: 2,
                                    backgroundColor: snapshot.isDraggingOver 
                                        ? theme.palette.action.hover 
                                        : 'transparent'
                                }}
                            >
                                {subtasks.map((subtask, index) => (
                                    <Draggable
                                        key={subtask.id}
                                        draggableId={String(subtask.id)}
                                        index={index}
                                        isDragDisabled={loading}
                                    >
                                        {(provided, snapshot) => (
                                            <Paper
                                                ref={provided.innerRef}
                                                {...provided.draggableProps}
                                                elevation={snapshot.isDragging ? 4 : 1}
                                                sx={{
                                                    mb: 2,
                                                    borderRadius: 2,
                                                    border: '1px solid',
                                                    borderColor: subtask.completed 
                                                        ? theme.palette.success.light 
                                                        : theme.palette.divider,
                                                    backgroundColor: subtask.completed 
                                                        ? theme.palette.mode === 'dark'
                                                            ? 'rgba(76, 175, 80, 0.08)'
                                                            : 'rgba(76, 175, 80, 0.04)'
                                                        : theme.palette.background.paper,
                                                    transition: 'all 0.2s ease-in-out',
                                                    transform: snapshot.isDragging 
                                                        ? 'rotate(3deg)' 
                                                        : 'none',
                                                    '&:hover': {
                                                        boxShadow: theme.shadows[3],
                                                        transform: snapshot.isDragging 
                                                            ? 'rotate(3deg)' 
                                                            : 'translateY(-2px)'
                                                    },
                                                    overflow: 'hidden'
                                                }}
                                            >
                                                <Box sx={{ display: 'flex', alignItems: 'center', p: 2 }}>
                                                    {/* Drag handle */}
                                                    <Box 
                                                        {...provided.dragHandleProps}
                                                        sx={{ 
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            mr: 2,
                                                            cursor: 'grab',
                                                            color: theme.palette.text.secondary,
                                                            '&:active': {
                                                                cursor: 'grabbing'
                                                            }
                                                        }}
                                                    >
                                                        <DragIndicatorIcon fontSize="small" />
                                                    </Box>

                                                    {/* Checkbox */}
                                                    <Checkbox
                                                        checked={subtask.completed}
                                                        onChange={() => handleToggleComplete(subtask.id, subtask.completed)}
                                                        disabled={loading}
                                                        color="success"
                                                        sx={{
                                                            '&.Mui-checked': {
                                                                color: theme.palette.success.main
                                                            },
                                                            mr: 2
                                                        }}
                                                    />

                                                    {/* Content */}
                                                    <Box sx={{ flex: 1, minWidth: 0 }}>
                                                        {editingSubtask === subtask.id ? (
                                                            <Box sx={{ width: '100%' }}>
                                                                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mb: 2 }}>
                                                                    <TextField
                                                                        fullWidth
                                                                        size="small"
                                                                        label="Название"
                                                                        value={editTitle}
                                                                        onChange={(e) => setEditTitle(e.target.value)}
                                                                        disabled={loading}
                                                                        variant="outlined"
                                                                        sx={{
                                                                            '& .MuiOutlinedInput-root': {
                                                                                borderRadius: 1
                                                                            }
                                                                        }}
                                                                    />
                                                                </Box>
                                                                
                                                                <Box sx={{ mb: 2 }}>
                                                                    <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600 }}>
                                                                        Описание
                                                                    </Typography>
                                                                    <ReactQuill
                                                                        value={editDescription}
                                                                        onChange={setEditDescription}
                                                                        modules={quillModules}
                                                                        formats={quillFormats}
                                                                        placeholder={t('subtasksEditDescription')}
                                                                        theme="snow"
                                                                        style={{ 
                                                                            height: '120px', 
                                                                            marginBottom: '50px'
                                                                        }}
                                                                    />
                                                                </Box>
                                                                
                                                                <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                                                                    <Button
                                                                        variant="outlined"
                                                                        size="small"
                                                                        onClick={() => {
                                                                            setEditingSubtask(null);
                                                                            setEditTitle('');
                                                                            setEditDescription('');
                                                                        }}
                                                                        sx={{ 
                                                                            minWidth: 80,
                                                                            textTransform: 'none'
                                                                        }}
                                                                    >
                                                                        {t('subtasksCancel')}
                                                                    </Button>
                                                                    <Button
                                                                        variant="contained"
                                                                        size="small"
                                                                        onClick={handleSaveEdit}
                                                                        disabled={!editTitle.trim() || loading}
                                                                        sx={{ 
                                                                            minWidth: 80,
                                                                            textTransform: 'none'
                                                                        }}
                                                                    >
                                                                        {t('subtasksSave')}
                                                                    </Button>
                                                                </Box>
                                                            </Box>
                                                        ) : (
                                                            <>
                                                                <Typography
                                                                    variant="body1"
                                                                    sx={{
                                                                        textDecoration: subtask.completed ? 'line-through' : 'none',
                                                                        color: subtask.completed 
                                                                            ? theme.palette.text.secondary 
                                                                            : theme.palette.text.primary,
                                                                        fontWeight: 500,
                                                                        mb: 0.5
                                                                    }}
                                                                >
                                                                    {subtask.title}
                                                                </Typography>
                                                                
                                                                {/* Описание подзадачи */}
                                                                {subtask.description && (
                                                                    <Box sx={{ mt: 1, mb: 1 }}>
                                                                        <TextRenderer 
                                                                            content={subtask.description}
                                                                            variant="body2"
                                                                            maxHeight="150px"
                                                                            enableScroll={true}
                                                                        />
                                                                    </Box>
                                                                )}
                                                                
                                                                {/* Metadata */}
                                                                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
                                                                    {subtask.dueDate && (
                                                                        <Chip
                                                                            size="small"
                                                                            label={`${t('subtasksDueDate')}: ${format(new Date(subtask.dueDate), 'dd MMM yyyy', { locale: ru })}`}
                                                                            variant="outlined"
                                                                            sx={{ height: 24, fontSize: '0.75rem' }}
                                                                        />
                                                                    )}
                                                                    {subtask.estimatedHours && (
                                                                        <Chip
                                                                            size="small"
                                                                            label={`${subtask.estimatedHours}ч`}
                                                                            variant="outlined"
                                                                            color="info"
                                                                            sx={{ height: 24, fontSize: '0.75rem' }}
                                                                        />
                                                                    )}
                                                                </Box>
                                                            </>
                                                        )}
                                                    </Box>

                                                    {/* Actions */}
                                                    {editingSubtask !== subtask.id && (
                                                        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', ml: 2 }}>
                                                            {/* Assignee */}
                                                            {subtask.assignee ? (
                                                                <Tooltip title={`${t('subtasksAssignedTo')}: ${subtask.assignee.username}`}>
                                                                    <Avatar
                                                                        src={getAvatarUrl(subtask.assignee.avatarUrl)}
                                                                        sx={{ 
                                                                            width: 32, 
                                                                            height: 32, 
                                                                            cursor: 'pointer',
                                                                            border: `2px solid ${theme.palette.divider}`,
                                                                            '&:hover': {
                                                                                borderColor: theme.palette.primary.main
                                                                            }
                                                                        }}
                                                                        onClick={(e) => handleAssigneeClick(e, subtask.id)}
                                                                    >
                                                                        {subtask.assignee.username?.charAt(0)?.toUpperCase()}
                                                                    </Avatar>
                                                                </Tooltip>
                                                            ) : (
                                                                <Tooltip title={t('subtasksAssignMember')}>
                                                                    <IconButton
                                                                        size="small"
                                                                        onClick={(e) => handleAssigneeClick(e, subtask.id)}
                                                                        disabled={loading}
                                                                        sx={{
                                                                            border: `1px dashed ${theme.palette.divider}`,
                                                                            '&:hover': {
                                                                                borderColor: theme.palette.primary.main,
                                                                                backgroundColor: theme.palette.action.hover
                                                                            }
                                                                        }}
                                                                    >
                                                                        <PersonAddIcon fontSize="small" />
                                                                    </IconButton>
                                                                </Tooltip>
                                                            )}
                                                            
                                                            <Tooltip title={t('subtasksEditTooltip')}>
                                                                <IconButton
                                                                    size="small"
                                                                    onClick={() => handleStartEdit(subtask)}
                                                                    disabled={loading}
                                                                >
                                                                    <EditIcon fontSize="small" />
                                                                </IconButton>
                                                            </Tooltip>
                                                            
                                                            <Tooltip title={t('delete')}>
                                                                <IconButton
                                                                    size="small"
                                                                    onClick={() => handleDeleteSubtask(subtask.id)}
                                                                    disabled={loading}
                                                                    color="error"
                                                                >
                                                                    <DeleteIcon fontSize="small" />
                                                                </IconButton>
                                                            </Tooltip>
                                                        </Box>
                                                    )}
                                                </Box>
                                            </Paper>
                                        )}
                                    </Draggable>
                                ))}
                                {provided.placeholder}
                            </Box>
                        )}
                    </Droppable>
                </DragDropContext>
            ) : (
                <Paper 
                    elevation={0} 
                    sx={{ 
                        p: 4, 
                        textAlign: 'center',
                        border: `2px dashed ${theme.palette.divider}`,
                        borderRadius: 2,
                        backgroundColor: theme.palette.action.hover
                    }}
                >
                    <Typography variant="h6" color="text.secondary" gutterBottom>
                        {t('subtasksEmpty')}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        {t('subtasksEmptyDescription')}
                    </Typography>
                </Paper>
            )}

            {/* Menu для назначения участников */}
            <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleAssigneeClose}
                PaperProps={{
                    sx: { 
                        maxWidth: 320,
                        maxHeight: 400,
                        '& .MuiMenuItem-root': {
                            py: 1.5,
                            px: 2
                        }
                    }
                }}
            >
                <Typography variant="subtitle2" sx={{ px: 2, py: 1, color: 'text.secondary', fontWeight: 600 }}>
                    {t('subtasksAssignMember')}
                </Typography>
                <Divider />
                
                {/* Опция "Не назначено" */}
                <MenuItem
                    onClick={() => handleAssignSubtask(0)}
                    disabled={loading}
                    sx={{ 
                        '&:hover': { bgcolor: 'action.hover' },
                        transition: 'background-color 0.2s'
                    }}
                >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Avatar sx={{ width: 36, height: 36, bgcolor: 'grey.400' }}>
                            <PersonOffIcon fontSize="small" />
                        </Avatar>
                        <Box>
                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                {t('subtasksUnassigned')}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                {t('subtasksRemoveAssignment')}
                            </Typography>
                        </Box>
                    </Box>
                </MenuItem>
                
                <Divider sx={{ my: 1 }} />
                
                {/* Список участников доски */}
                {boardMembers.length > 0 ? (
                    boardMembers
                        .filter(member => member && (member.user || member.userId))
                        .map((member) => {
                            const user = member.user || member;
                            const userId = user.id || member.userId;
                            const username = user.username || member.username;
                            const avatarUrl = user.avatarUrl || member.avatarUrl;
                            
                            return (
                                <MenuItem
                                    key={userId}
                                    onClick={() => handleAssignSubtask(userId)}
                                    disabled={loading}
                                    sx={{ 
                                        '&:hover': { bgcolor: 'action.hover' },
                                        transition: 'background-color 0.2s'
                                    }}
                                >
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                        <Avatar
                                            src={getAvatarUrl(avatarUrl)}
                                            sx={{ width: 36, height: 36 }}
                                        >
                                            {username?.charAt(0)?.toUpperCase() || 'U'}
                                        </Avatar>
                                        <Box>
                                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                                {username || user.email?.split('@')[0] || t('subtasksUser')}
                                            </Typography>
                                            {member.role && (
                                                <Chip 
                                                    label={member.role.name} 
                                                    size="small" 
                                                    variant="outlined"
                                                    sx={{ height: 20, fontSize: '0.75rem' }}
                                                />
                                            )}
                                        </Box>
                                    </Box>
                                </MenuItem>
                            );
                        })
                ) : (
                    <MenuItem disabled>
                        <Typography variant="body2" color="text.secondary">
                            {t('subtasksNoMembersFound')}
                        </Typography>
                    </MenuItem>
                )}
            </Menu>
            
            {/* Плавающий индикатор загрузки */}
            {loading && (
                <Zoom in={loading}>
                    <Fab
                        size="small"
                        sx={{
                            position: 'absolute',
                            bottom: 16,
                            right: 16,
                            bgcolor: theme.palette.primary.main,
                            '&:hover': {
                                bgcolor: theme.palette.primary.dark
                            }
                        }}
                    >
                        <CircularProgress size={24} sx={{ color: 'white' }} />
                    </Fab>
                </Zoom>
            )}
        </Box>
    );
}; 