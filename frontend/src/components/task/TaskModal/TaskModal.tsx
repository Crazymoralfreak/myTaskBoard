import React, { useState, useRef, useEffect, useCallback } from 'react';
import ReactDOM from 'react-dom';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Box,
    TextField,
    Typography,
    Chip,
    IconButton,
    Tab,
    Tabs,
    Divider,
    FormHelperText,
    CircularProgress,
    useTheme,
    useMediaQuery,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Paper,
    Tooltip,
    Grid,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    Alert,
    Autocomplete
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import EventIcon from '@mui/icons-material/Event';
import TimerIcon from '@mui/icons-material/Timer';
import CategoryIcon from '@mui/icons-material/Category';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import SaveAltIcon from '@mui/icons-material/SaveAlt';
import StyleIcon from '@mui/icons-material/Style';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import { Task, CreateTaskRequest, TaskPriority, TaskTemplate } from '../../../types/task';
import { BoardStatus, TaskType } from '../../../types/board';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { ru } from 'date-fns/locale';
import { taskService } from '../../../services/taskService';
import { SubtaskList } from '../SubtaskList';
import { ConfirmDialog } from '../../shared/ConfirmDialog';
import { iconNameToComponent } from '../../shared/IconSelector/iconMapping';
import { TaskTemplateList } from '../TaskTemplateList';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { TaskComments } from '../TaskComments';
import { TaskHistory } from '../TaskHistory';
import { TaskAttachments } from '../TaskAttachments';
import PriorityHighIcon from '@mui/icons-material/PriorityHigh';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import CommentIcon from '@mui/icons-material/Comment';
import AttachmentIcon from '@mui/icons-material/Attachment';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import { useConfirmDialog } from '../../../context/ConfirmDialogContext';
import FullscreenIcon from '@mui/icons-material/Fullscreen';
import FullscreenExitIcon from '@mui/icons-material/FullscreenExit';
import { userService } from '../../../services/userService';
import { toast } from 'react-hot-toast';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';

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
            id={`task-tabpanel-${index}`}
            aria-labelledby={`task-tab-${index}`}
            {...other}
        >
            {value === index && (
                <Box sx={{ p: 3 }}>
                    {children}
                </Box>
            )}
        </div>
    );
}

interface TaskModalProps {
    open: boolean;
    onClose: () => void;
    mode: 'create' | 'edit' | 'view';
    task?: Task;
    columnId?: string;
    onTaskCreate?: (task: Omit<CreateTaskRequest, 'columnId'>) => void;
    onTaskUpdate?: (updatedTask: Task) => void;
    onTaskDelete?: (taskId: number) => void;
    boardStatuses?: BoardStatus[];
    taskTypes?: TaskType[];
    onTaskCopy?: (task: Task) => void;
    disableBackdropClick?: boolean;
    boardId?: number;
}

// Расширенный интерфейс для Task с новыми полями
interface ExtendedTask extends Task {
    createdAt?: string | Date;
    estimatedTime?: number;
}

// Расширенный интерфейс для TaskType с description
interface ExtendedTaskType extends TaskType {
    description?: string;
}

// Обновленный интерфейс для Task, включающий ExtendedTaskType
interface ExtendedTaskWithTypes extends Omit<ExtendedTask, 'type'> {
    type?: ExtendedTaskType;
}

// Тип для режима работы модального окна
type ModalMode = 'create' | 'edit' | 'view';

export const TaskModal: React.FC<TaskModalProps> = ({
    open,
    onClose,
    mode: initialMode,
    task: initialTask,
    columnId,
    onTaskCreate,
    onTaskUpdate,
    onTaskDelete,
    boardStatuses = [],
    taskTypes = [],
    onTaskCopy,
    disableBackdropClick = false,
    boardId
}) => {
    const theme = useTheme();
    const fullScreen = useMediaQuery(theme.breakpoints.down('md'));
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [startDate, setStartDate] = useState<Date | null>(null);
    const [endDate, setEndDate] = useState<Date | null>(null);
    const [priority, setPriority] = useState<TaskPriority>('NONE');
    const [selectedTypeId, setSelectedTypeId] = useState<number | null>(null);
    const [selectedStatusId, setSelectedStatusId] = useState<number | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [tabValue, setTabValue] = useState(0);
    const [mode, setMode] = useState<ModalMode>(initialMode);
    const [selectedTab, setSelectedTab] = useState(0);
    const [errors, setErrors] = useState<{
        title?: string;
        dates?: string;
    }>({});
    const [showTemplateSelector, setShowTemplateSelector] = useState(false);
    const [saveTemplateDialogOpen, setSaveTemplateDialogOpen] = useState(false);
    const [templateName, setTemplateName] = useState('');
    const [tags, setTags] = useState<string[]>([]);
    const [availableTags, setAvailableTags] = useState<string[]>([]);
    const [newTag, setNewTag] = useState('');
    const [userSettings, setUserSettings] = useState<{compactMode?: boolean}>({});

    // Используем ExtendedTaskWithTypes вместо Task
    const [task, setTask] = useState<ExtendedTaskWithTypes | null>(initialTask || null);

    const quillModules = {
        toolbar: [
            ['bold', 'italic', 'underline', 'strike'],
            ['blockquote', 'code-block'],
            [{ 'header': 1 }, { 'header': 2 }],
            [{ 'list': 'ordered' }, { 'list': 'bullet' }],
            [{ 'script': 'sub' }, { 'script': 'super' }],
            [{ 'indent': '-1' }, { 'indent': '+1' }],
            ['link'],
            ['clean']
        ],
    };

    const quillFormats = [
        'bold', 'italic', 'underline', 'strike',
        'blockquote', 'code-block',
        'header',
        'list', 'bullet',
        'script',
        'indent',
        'link'
    ];

    const { showConfirmDialog } = useConfirmDialog();

    useEffect(() => {
        if (open) {
            if (initialMode === 'create') {
                setMode('create');
                setTitle('');
                setDescription('');
                setStartDate(null);
                setEndDate(null);
                setPriority('NONE');
                setTags([]);
                setSelectedTypeId(null);
                setSelectedStatusId(null);
            } else {
                // Для режимов edit и view используем initialTask (если есть)
                if (initialTask) {
                    setMode(initialMode);
                    setTask(initialTask as ExtendedTaskWithTypes);
                    setTitle(initialTask.title || '');
                    setDescription(initialTask.description || '');
                    setStartDate(initialTask.startDate ? new Date(initialTask.startDate) : null);
                    setEndDate(initialTask.endDate ? new Date(initialTask.endDate) : null);
                    setPriority(initialTask.priority || 'NONE');
                    setSelectedTypeId(initialTask.type?.id || null);
                    setSelectedStatusId(initialTask.customStatus?.id || null);
                    setTags(initialTask.tags || []);
                    
                    // Если в режиме просмотра, загружаем задачу по её ID для получения свежих данных
                    if (initialMode === 'view' && initialTask.id) {
                        const fetchTask = async () => {
                            try {
                                const loadedTask = await taskService.getTask(initialTask.id);
                                if (loadedTask) {
                                    setTask(loadedTask as ExtendedTaskWithTypes);
                                    setTitle(loadedTask.title || '');
                                    setDescription(loadedTask.description || '');
                                    setStartDate(loadedTask.startDate ? new Date(loadedTask.startDate) : null);
                                    setEndDate(loadedTask.endDate ? new Date(loadedTask.endDate) : null);
                                    setPriority(loadedTask.priority || 'NONE');
                                    setSelectedTypeId(loadedTask.type?.id || null);
                                    setSelectedStatusId(loadedTask.customStatus?.id || null);
                                    setTags(loadedTask.tags || []);
                                }
                            } catch (error) {
                                console.error('Ошибка при загрузке задачи:', error);
                                setError('Не удалось загрузить данные задачи');
                            }
                        };
                        
                        fetchTask();
                    }
                }
            }
            
            setSelectedTab(0);
            setErrors({});
            setError(null);
        }
    }, [open, initialMode, initialTask, boardStatuses, taskTypes]);

    useEffect(() => {
        const loadTags = async () => {
            try {
                const tags = await taskService.getAllTags();
                setAvailableTags(tags);
            } catch (error) {
                console.error('Ошибка при загрузке тегов:', error);
                setError('Не удалось загрузить теги');
            }
        };
        
        loadTags();
    }, []);

    useEffect(() => {
        if (task && mode !== 'create') {
            setTags(task.tags || []);
        } else if (mode === 'create') {
            // При создании новой задачи очищаем массив тегов
            setTags([]);
        }
    }, [task, mode]);

    const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
        setSelectedTab(newValue);
    };

    // Выносим проверку дат в отдельную функцию
    const validateDates = (start: Date | null, end: Date | null): string | undefined => {
        if (start && end && start > end) {
            return 'Дата окончания не может быть раньше даты начала';
        }
        return undefined; // Нет ошибки
    };

    // Обработчик изменения дат с немедленной валидацией
    const handleDateChange = (newStartDate: Date | null, newEndDate: Date | null) => {
        setStartDate(newStartDate);
        setEndDate(newEndDate);
        
        const dateError = validateDates(newStartDate, newEndDate);
        setErrors(prev => ({ ...prev, dates: dateError }));
    };
    
    const validateForm = (): boolean => {
        let valid = true;
        const newErrors: { title?: string; dates?: string } = {};
        
        if (!title.trim()) {
            newErrors.title = 'Название задачи обязательно';
            valid = false;
        }
        
        // Используем вынесенную функцию валидации дат
        const dateError = validateDates(startDate, endDate);
        if (dateError) {
            newErrors.dates = dateError;
            valid = false;
        }
        
        setErrors(newErrors);
        return valid;
    };

    const handleCreate = async () => {
        if (!validateForm()) return;
        
        setIsSubmitting(true);
        setError(null); 
        
        const taskData: Omit<CreateTaskRequest, 'columnId'> = {
            title: title.trim(),
            description,
            startDate: startDate?.toISOString(),
            endDate: endDate?.toISOString(),
            priority,
            typeId: selectedTypeId,
            statusId: selectedStatusId,
            tags
        };

        try {
            if (onTaskCreate) {
                await onTaskCreate(taskData);
            }
            onClose(); 
        } catch (error: any) {
            console.error('Ошибка при создании задачи:', error);
            // Оставляем обработку ошибки от бэкенда как запасной вариант
            if (error.response && error.response.status === 400 && error.response.data?.error?.includes('End date must be after start date')) {
                setErrors(prev => ({ ...prev, dates: 'Дата окончания не может быть раньше даты начала' }));
                setError(null); 
            } else {
                setError(error.response?.data?.message || error.message || 'Не удалось создать задачу');
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleUpdate = async () => {
        if (!validateForm()) return;
        if (!task) return;
        
        setIsSubmitting(true);
        setError(null);
        
        // ВОССТАНАВЛИВАЕМ ЛОГИКУ СБОРА ИЗМЕНЕННЫХ ДАННЫХ
        const updatedTaskData: Partial<CreateTaskRequest> = {}; // Используем Partial<CreateTaskRequest>

        if (title.trim() !== task.title) {
            updatedTaskData.title = title.trim();
        }
        if (description !== task.description) {
            updatedTaskData.description = description;
        }
        // Сравниваем даты как строки ISO или null
        const currentStartDateISO = startDate?.toISOString() || null;
        const originalStartDateISO = task.startDate ? new Date(task.startDate).toISOString() : null;
        if (currentStartDateISO !== originalStartDateISO) {
            updatedTaskData.startDate = currentStartDateISO ?? undefined; // Отправляем null как undefined
        }
        const currentEndDateISO = endDate?.toISOString() || null;
        const originalEndDateISO = task.endDate ? new Date(task.endDate).toISOString() : null;
        if (currentEndDateISO !== originalEndDateISO) {
            updatedTaskData.endDate = currentEndDateISO ?? undefined; // Отправляем null как undefined
        }
        if (priority !== task.priority) {
            updatedTaskData.priority = priority;
        }
        if (selectedTypeId !== (task.type?.id || null)) {
            updatedTaskData.typeId = selectedTypeId;
        }
        if (selectedStatusId !== (task.customStatus?.id || null)) {
            updatedTaskData.statusId = selectedStatusId;
        }
        if (JSON.stringify(tags.sort()) !== JSON.stringify((task.tags || []).sort())) {
            updatedTaskData.tags = tags;
        }
        
        // Проверяем, есть ли вообще изменения
        if (Object.keys(updatedTaskData).length === 0) {
            setError('Нет изменений для сохранения');
            setIsSubmitting(false);
            // Можно просто закрыть окно или остаться в режиме редактирования
            // onClose(); // Закрываем, если нет изменений
            setMode('view'); // Или просто возвращаемся в режим просмотра
            return;
        }

        try {
            const updatedTask = await taskService.updateTask(task.id, updatedTaskData);
            if (onTaskUpdate) {
                onTaskUpdate(updatedTask);
            }
            // setMode('view'); // Больше не нужно переключать режим здесь
            // setTask(updatedTask as ExtendedTaskWithTypes); // Обновлять локальное состояние не обязательно, т.к. окно закроется
            
            // ИСПРАВЛЕНИЕ: Вызываем onClose после успешного обновления
            onClose();

        } catch (error: any) {
            console.error('Ошибка при обновлении задачи:', error);
            if (error.response && error.response.status === 400 && error.response.data?.error?.includes('End date must be after start date')) {
                setErrors(prev => ({ ...prev, dates: 'Дата окончания не может быть раньше даты начала' }));
                setError(null); 
            } else {
                setError(error.response?.data?.message || error.message || 'Не удалось обновить задачу');
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async () => {
        if (!task || !onTaskDelete) {
            return;
        }

        try {
            setIsSubmitting(true);
            await taskService.deleteTask(task.id);
            onTaskDelete(task.id);
            handleClose();
        } catch (error) {
            console.error('Failed to delete task:', error);
            setError('Не удалось удалить задачу');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleClose = () => {
        // Перед закрытием, обновляем родительский компонент с текущими данными задачи
        if (task && mode === 'view' && onTaskUpdate) {
            // Создаем копию задачи для обновления
            const updatedTask = { ...task };
            onTaskUpdate(updatedTask);
        }
        
        // Сбрасываем состояние
        setTitle('');
        setDescription('');
        setStartDate(null);
        setEndDate(null);
        setPriority('NONE');
        setSelectedTypeId(null);
        setSelectedStatusId(null);
        setErrors({});
        setError(null);
        onClose();
    };

    const handleCopyTask = async () => {
        if (!task) return;
        
        try {
            setIsSubmitting(true);
            
            if (onTaskCopy) {
                // Если есть обработчик в родительском компоненте, используем его
                onTaskCopy(task);
                handleClose();
            } else {
                // Иначе делаем API запрос на создание копии задачи
                const newTask = await taskService.createTaskCopy(task);
                console.log('Задача скопирована:', newTask);
                
                // Перенаправляем на страницу с доской или закрываем модальное окно
                handleClose();
                
                // Обновляем список задач (если необходимо)
                if (onTaskCreate) {
                    // Уведомляем родительский компонент о создании новой задачи
                    const { columnId, ...taskData } = newTask;
                    onTaskCreate(taskData as any);
                }
            }
        } catch (error) {
            console.error('Ошибка при копировании задачи:', error);
            setError('Не удалось создать копию задачи');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleUseTemplate = (template: any) => {
        setTitle(template.taskData.title);
        setDescription(template.taskData.description || '');
        setPriority(template.taskData.priority || 'NONE');
        
        if (template.taskData.typeId && taskTypes.length > 0) {
            setSelectedTypeId(template.taskData.typeId);
        }
        
        if (template.taskData.statusId && boardStatuses.length > 0) {
            setSelectedStatusId(template.taskData.statusId);
        }
        
        setShowTemplateSelector(false);
    };
    
    const handleSaveAsTemplate = () => {
        if (!title.trim()) {
            setError('Название задачи обязательно для создания шаблона');
            return;
        }
        
        setSaveTemplateDialogOpen(true);
    };
    
    const saveTemplate = async () => {
        if (!templateName.trim()) {
            setError('Название шаблона обязательно');
            return;
        }
        
        try {
            if (boardId) {
                await taskService.createTaskTemplate(boardId, {
                    name: templateName.trim(),
                    taskData: {
                        title: title.trim(),
                        description: description.trim(),
                        typeId: selectedTypeId,
                        statusId: selectedStatusId,
                        priority: priority,
                        tags,
                    }
                } as TaskTemplate);
                setTemplateName('');
                setSaveTemplateDialogOpen(false);
            } else {
                setError('Не удалось определить доску для сохранения шаблона');
            }
        } catch (e) {
            console.error('Ошибка при сохранении шаблона:', e);
            setError('Не удалось сохранить шаблон');
        }
    };

    const renderDialogTitle = () => {
        switch (mode) {
            case 'create':
                return 'Создать задачу';
            case 'edit':
                return 'Редактировать задачу';
            case 'view':
                return 'Просмотр задачи';
            default:
                return 'Задача';
        }
    };

    const renderDialogActions = () => {
        const actionStyles = fullScreen ? {
            position: 'sticky',
            bottom: 0,
            backgroundColor: theme.palette.background.paper,
            zIndex: 10,
            paddingTop: 1,
            paddingBottom: 1,
            borderTop: `1px solid ${theme.palette.divider}`
        } : {};

        switch (mode) {
            case 'create':
                return (
                    <Box sx={actionStyles} width="100%">
                        <DialogActions>
                            <Button onClick={handleClose}>Отмена</Button>
                            <Button 
                                onClick={handleCreate} 
                                variant="contained" 
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? <CircularProgress size={24} /> : 'Создать'}
                            </Button>
                        </DialogActions>
                    </Box>
                );
            case 'edit':
                return (
                    <Box sx={actionStyles} width="100%">
                        <DialogActions>
                            <Button 
                                onClick={() => showConfirmDialog({
                                    title: "Удалить задачу",
                                    message: "Вы уверены, что хотите удалить эту задачу? Это действие нельзя отменить.",
                                    actionType: "delete",
                                    onConfirm: handleDelete,
                                    loading: isSubmitting
                                })} 
                                color="error"
                                disabled={isSubmitting}
                                startIcon={<DeleteOutlineIcon />}
                                sx={{ mr: 'auto' }}
                            >
                                Удалить
                            </Button>
                            <Button onClick={() => setMode('view')} disabled={isSubmitting}>
                                Отмена
                            </Button>
                            <Button 
                                onClick={handleUpdate} 
                                variant="contained" 
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? <CircularProgress size={24} /> : 'Сохранить'}
                            </Button>
                        </DialogActions>
                    </Box>
                );
            case 'view':
                return (
                    <Box sx={actionStyles} width="100%">
                        <DialogActions>
                            <Button 
                                onClick={() => showConfirmDialog({
                                    title: "Удалить задачу",
                                    message: "Вы уверены, что хотите удалить эту задачу? Это действие нельзя отменить.",
                                    actionType: "delete",
                                    onConfirm: handleDelete,
                                    loading: isSubmitting
                                })} 
                                color="error"
                                disabled={isSubmitting}
                                startIcon={<DeleteOutlineIcon />}
                                sx={{ mr: 1 }}
                            >
                                {isMobile ? '' : 'Удалить'}
                            </Button>
                            <Button 
                                onClick={handleCopyTask} 
                                disabled={isSubmitting}
                                startIcon={<ContentCopyIcon />}
                                sx={{ mr: isMobile ? 'auto' : 1 }}
                            >
                                {isMobile ? '' : 'Копировать'}
                            </Button>
                            {onTaskUpdate && (
                                <Button 
                                    onClick={() => {
                                        setMode('edit');
                                    }} 
                                    variant="contained"
                                >
                                    Редактировать
                                </Button>
                            )}
                            <Button onClick={handleClose}>Закрыть</Button>
                        </DialogActions>
                    </Box>
                );
            default:
                return (
                    <Box sx={actionStyles} width="100%">
                        <DialogActions>
                            <Button onClick={handleClose}>Закрыть</Button>
                        </DialogActions>
                    </Box>
                );
        }
    };

    const isEditable = mode === 'create' || mode === 'edit';

    // Добавляем компонент для отображения типа задачи и статуса в режиме просмотра
    const TaskInfoChips = ({ task, isEditable }: { task: Task, isEditable: boolean }) => {
        return (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                {task.type && (
                    <Chip
                        icon={
                            task.type.icon && iconNameToComponent[task.type.icon] 
                                ? React.cloneElement(iconNameToComponent[task.type.icon], { 
                                    style: { color: task.type.color || 'inherit' } 
                                  }) 
                                : <CategoryIcon style={{ color: task.type.color || 'inherit' }} />
                        }
                        label={task.type.name}
                        size="medium"
                        sx={{ 
                            backgroundColor: task.type.color ? `${task.type.color}20` : undefined,
                            color: task.type.color,
                            borderColor: task.type.color,
                            borderWidth: task.type.color ? 1 : 0,
                            borderStyle: 'solid',
                            fontWeight: '500',
                            pl: 0.5
                        }}
                        onClick={isEditable ? undefined : () => {}}
                    />
                )}
                {task.customStatus && (
                    <Chip
                        label={task.customStatus.name}
                        size="medium"
                        sx={{ 
                            backgroundColor: task.customStatus.color,
                            color: '#fff',
                            fontWeight: 'bold'
                        }}
                        onClick={isEditable ? undefined : () => {}}
                    />
                )}
                <Chip
                    label={
                        task.priority === 'HIGH' ? 'Высокий приоритет' :
                        task.priority === 'MEDIUM' ? 'Средний приоритет' :
                        task.priority === 'LOW' ? 'Низкий приоритет' :
                        'Без приоритета'
                    }
                    color={
                        task.priority === 'HIGH' ? 'error' :
                        task.priority === 'MEDIUM' ? 'warning' :
                        task.priority === 'LOW' ? 'info' :
                        'default'
                    }
                    size="medium"
                    variant="outlined"
                    onClick={isEditable ? undefined : () => {}}
                />
            </Box>
        );
    };

    // View mode - content display components
    const renderViewModeContent = () => {
        // Возвращаем пустое значение, чтобы использовать основную форму
        // с disabled полями вместо специальной отображения для режима просмотра
        return null;
    };

    // Функция форматирования даты
    const formatDate = (date: string | Date): string => {
        const d = typeof date === 'string' ? new Date(date) : date;
        return d.toLocaleString('ru-RU');
    };

    const handleAddNewTag = async (tag: string) => {
        try {
            if (!tag) return;
            
            // Добавляем новый тег в глобальный список, если он новый
            await taskService.addTag(tag, task?.id);
            
            // Обновляем теги в форме, если тег еще не добавлен
            if (!tags.includes(tag)) {
                setTags([...tags, tag]);
            }
        } catch (error) {
            console.error('Error adding tag:', error);
        }
    };

    const renderTagsSelector = () => (
        <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
                Теги
                <Tooltip title="Теги помогают категоризировать задачи и быстро их находить">
                    <IconButton size="small" sx={{ ml: 1 }}>
                        <HelpOutlineIcon fontSize="small" />
                    </IconButton>
                </Tooltip>
            </Typography>
            
            {mode === 'view' ? (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {tags.length > 0 ? (
                        tags.map(tag => (
                            <Chip
                                key={tag}
                                label={tag}
                                icon={<LocalOfferIcon />}
                                variant="outlined"
                                size="small"
                            />
                        ))
                    ) : (
                        <Typography variant="body2" color="text.secondary">
                            Нет тегов
                        </Typography>
                    )}
                </Box>
            ) : (
                <>
                    <Autocomplete
                        multiple
                        freeSolo
                        options={availableTags}
                        value={tags}
                        onChange={(event, newValue) => {
                            // Устанавливаем только выбранные теги, не добавляя их автоматически в доступные
                            setTags(newValue);
                            
                            // Добавляем новые теги в availableTags только если они действительно новые
                            newValue.forEach(tag => {
                                if (!availableTags.includes(tag)) {
                                    handleAddNewTag(tag);
                                }
                            });
                        }}
                        inputValue={newTag}
                        onInputChange={(event, newInputValue) => {
                            setNewTag(newInputValue);
                        }}
                        renderTags={(value, getTagProps) =>
                            value.map((option, index) => (
                                <Chip
                                    icon={<LocalOfferIcon />}
                                    variant="outlined"
                                    label={option}
                                    {...getTagProps({ index })}
                                    size="small"
                                />
                            ))
                        }
                        renderInput={(params) => (
                            <TextField
                                {...params}
                                variant="outlined"
                                placeholder="Добавить тег..."
                                size="small"
                                fullWidth
                                disabled={!isEditable}
                            />
                        )}
                        disabled={!isEditable}
                    />
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                        Введите текст и нажмите Enter для добавления нового тега
                    </Typography>
                </>
            )}
        </Box>
    );

    return (
        <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ru}>
            <Dialog 
                open={open} 
                onClose={handleClose} 
                maxWidth="md" 
                fullWidth
                fullScreen={fullScreen}
                disableEscapeKeyDown={disableBackdropClick}
                sx={{
                    '& .MuiDialog-paper': {
                        ...(fullScreen && {
                            display: 'flex',
                            flexDirection: 'column',
                            height: '100%'
                        })
                    },
                    '& .MuiDialogContent-root': {
                        ...(isMobile && {
                            padding: 2,
                            paddingTop: 2,
                            paddingBottom: 4
                        })
                    },
                    '& .MuiBox-root': {
                        ...(isMobile && {
                            gap: 1
                        })
                    },
                    '& .MuiTabs-root': {
                        ...(isMobile && {
                            minHeight: 40
                        })
                    },
                    '& .MuiTab-root': {
                        ...(isMobile && {
                            minHeight: 40,
                            padding: '6px 12px',
                            minWidth: 0,
                            fontSize: '0.8rem'
                        })
                    }
                }}
            >
                <DialogTitle sx={{ 
                    ...(fullScreen && {
                        position: 'sticky',
                        top: 0,
                        backgroundColor: theme.palette.background.paper,
                        zIndex: 10,
                        paddingBottom: 1,
                        borderBottom: `1px solid ${theme.palette.divider}`
                    })
                }}>
                    {renderDialogTitle()}
                    <IconButton
                        aria-label="close"
                        onClick={handleClose}
                        sx={{
                            position: 'absolute',
                            right: 8,
                            top: 8,
                            color: (theme) => theme.palette.grey[500],
                        }}
                    >
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>
                <DialogContent 
                    dividers 
                    sx={{ 
                        ...(fullScreen && {
                            flex: 1,
                            overflowY: 'auto',
                            pb: 8  // Добавляем отступ, чтобы содержимое не перекрывалось кнопками
                        })
                    }}
                >
                    {showTemplateSelector ? (
                        <Box>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                                <Typography variant="h6">Выберите шаблон задачи</Typography>
                                <Button onClick={() => setShowTemplateSelector(false)}>
                                    Вернуться к созданию задачи
                                </Button>
                            </Box>
                            <TaskTemplateList 
                                onUseTemplate={handleUseTemplate} 
                                boardStatuses={boardStatuses} 
                                taskTypes={taskTypes} 
                            />
                        </Box>
                    ) : (
                        <>
                            {mode !== 'create' && task && (
                                <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
                                    <Tabs value={selectedTab} onChange={handleTabChange}>
                                        <Tab label="Основное" />
                                        <Tab label="Подзадачи" />
                                        <Tab 
                                            label={
                                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                    <span>Комментарии</span>
                                                    {task.commentCount !== undefined && task.commentCount > 0 && (
                                                        <Chip 
                                                            label={task.commentCount} 
                                                            size="small" 
                                                            color="primary"
                                                            sx={{ 
                                                                ml: 1, 
                                                                height: 20, 
                                                                minWidth: 20, 
                                                                fontSize: '0.75rem',
                                                                '& .MuiChip-label': {
                                                                    px: 1
                                                                }
                                                            }}
                                                        />
                                                    )}
                                                </Box>
                                            }
                                        />
                                        <Tab label="История" />
                                        <Tab 
                                            label={
                                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                    <span>Вложения</span>
                                                    {task.attachmentCount !== undefined && task.attachmentCount > 0 && (
                                                        <Chip 
                                                            label={task.attachmentCount} 
                                                            size="small"
                                                            color="primary"
                                                            sx={{ 
                                                                ml: 1, 
                                                                height: 20, 
                                                                minWidth: 20, 
                                                                fontSize: '0.75rem',
                                                                '& .MuiChip-label': {
                                                                    px: 1
                                                                }
                                                            }}
                                                        />
                                                    )}
                                                </Box>
                                            } 
                                        />
                                    </Tabs>
                                </Box>
                            )}

                            {(mode === 'create' || mode === 'edit' || mode === 'view') && (selectedTab === 0 || mode === 'create') && (
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
                                    {mode === 'view' ? (
                                        // Используем общие поля для режима просмотра, но делаем их неактивными
                                        <>
                                            <TextField
                                                label="Название"
                                                value={title}
                                                fullWidth
                                                InputProps={{
                                                    readOnly: true
                                                }}
                                                sx={{
                                                    '& .MuiInputBase-input.Mui-disabled': {
                                                        WebkitTextFillColor: 'rgba(0, 0, 0, 0.87)',
                                                    },
                                                    '& .MuiOutlinedInput-notchedOutline': {
                                                        borderColor: 'rgba(0, 0, 0, 0.12)'
                                                    }
                                                }}
                                            />
                                            <Box sx={{ mb: 2 }}>
                                                <Typography variant="subtitle2" gutterBottom>Описание</Typography>
                                                <Paper 
                                                    variant="outlined" 
                                                    sx={{ 
                                                        p: 2, 
                                                        minHeight: '200px',
                                                        '& img': { maxWidth: '100%' } 
                                                    }}
                                                >
                                                    <div dangerouslySetInnerHTML={{ __html: description }} />
                                                </Paper>
                                            </Box>
                                            
                                            <Box sx={{ display: 'flex', gap: 2 }}>
                                                <Box sx={{ flex: 1 }}>
                                                    <FormControl fullWidth disabled={!isEditable}>
                                                        <InputLabel>Тип задачи</InputLabel>
                                                        <Select
                                                            value={selectedTypeId || ''}
                                                            label="Тип задачи"
                                                            onChange={(e) => {
                                                                const value = e.target.value;
                                                                setSelectedTypeId(value === '' ? null : Number(value));
                                                            }}
                                                            renderValue={(selected) => {
                                                                if (!selected) return <em>Не выбран</em>;
                                                                const selectedType = taskTypes.find(t => t.id === selected);
                                                                if (!selectedType) return <em>Не выбран</em>;
                                                                
                                                                return (
                                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                                        {selectedType.icon && iconNameToComponent[selectedType.icon] 
                                                                            ? React.cloneElement(iconNameToComponent[selectedType.icon], { 
                                                                                style: { color: selectedType.color || 'inherit' } 
                                                                            }) 
                                                                            : <CategoryIcon style={{ color: selectedType.color || 'inherit' }} />
                                                                        }
                                                                        <Typography>{selectedType.name}</Typography>
                                                                    </Box>
                                                                );
                                                            }}
                                                            inputProps={{
                                                                readOnly: !isEditable
                                                            }}
                                                            sx={{
                                                                '.MuiSelect-select.Mui-disabled': {
                                                                    WebkitTextFillColor: 'rgba(0, 0, 0, 0.87)',
                                                                }
                                                            }}
                                                        >
                                                            <MenuItem value="">
                                                                <em>Не выбран</em>
                                                            </MenuItem>
                                                            {taskTypes.map((type) => (
                                                                <MenuItem key={type.id} value={type.id}>
                                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                                        {type.icon && iconNameToComponent[type.icon] 
                                                                            ? React.cloneElement(iconNameToComponent[type.icon], { 
                                                                                style: { color: type.color || 'inherit' } 
                                                                            }) 
                                                                            : <CategoryIcon style={{ color: type.color || 'inherit' }} />
                                                                        }
                                                                        <Typography>{type.name}</Typography>
                                                                    </Box>
                                                                </MenuItem>
                                                            ))}
                                                        </Select>
                                                    </FormControl>
                                                </Box>
                                                
                                                <Box sx={{ flex: 1 }}>
                                                    <FormControl fullWidth disabled={!isEditable}>
                                                        <InputLabel>Статус</InputLabel>
                                                        <Select
                                                            value={selectedStatusId || ''}
                                                            label="Статус"
                                                            onChange={(e) => {
                                                                const value = e.target.value;
                                                                setSelectedStatusId(value === '' ? null : Number(value));
                                                            }}
                                                            renderValue={(selected) => {
                                                                if (!selected) return <em>Не выбран</em>;
                                                                const selectedStatus = boardStatuses.find(s => s.id === selected);
                                                                if (!selectedStatus) return <em>Не выбран</em>;
                                                                
                                                                return (
                                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                                        <Box
                                                                            sx={{
                                                                                width: 16,
                                                                                height: 16,
                                                                                borderRadius: '50%',
                                                                                bgcolor: selectedStatus.color,
                                                                            }}
                                                                        />
                                                                        <Typography>{selectedStatus.name}</Typography>
                                                                    </Box>
                                                                );
                                                            }}
                                                            inputProps={{
                                                                readOnly: !isEditable
                                                            }}
                                                            sx={{
                                                                '.MuiSelect-select.Mui-disabled': {
                                                                    WebkitTextFillColor: 'rgba(0, 0, 0, 0.87)',
                                                                }
                                                            }}
                                                        >
                                                            <MenuItem value="">
                                                                <em>Не выбран</em>
                                                            </MenuItem>
                                                            {boardStatuses.map((status) => (
                                                                <MenuItem key={status.id} value={status.id}>
                                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                                        <Box
                                                                            sx={{
                                                                                width: 16,
                                                                                height: 16,
                                                                                borderRadius: '50%',
                                                                                bgcolor: status.color,
                                                                            }}
                                                                        />
                                                                        <Typography>{status.name}</Typography>
                                                                    </Box>
                                                                </MenuItem>
                                                            ))}
                                                        </Select>
                                                    </FormControl>
                                                </Box>
                                            </Box>
                                            
                                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                                <Box sx={{ display: 'flex', gap: 2 }}>
                                                    <DateTimePicker
                                                        label="Дата начала"
                                                        value={startDate}
                                                        onChange={(newValue) => {}}
                                                        readOnly
                                                        slotProps={{
                                                            textField: { 
                                                                fullWidth: true,
                                                                InputProps: { readOnly: true },
                                                                sx: {
                                                                    '& .MuiInputBase-input.Mui-readOnly': {
                                                                        WebkitTextFillColor: 'rgba(0, 0, 0, 0.87)',
                                                                    }
                                                                }
                                                            }
                                                        }}
                                                    />
                                                    <DateTimePicker
                                                        label="Дата окончания"
                                                        value={endDate}
                                                        onChange={(newValue) => {}}
                                                        readOnly
                                                        slotProps={{
                                                            textField: { 
                                                                fullWidth: true,
                                                                InputProps: { readOnly: true },
                                                                sx: {
                                                                    '& .MuiInputBase-input.Mui-readOnly': {
                                                                        WebkitTextFillColor: 'rgba(0, 0, 0, 0.87)',
                                                                    }
                                                                }
                                                            }
                                                        }}
                                                    />
                                                </Box>
                                            </Box>
                                            <FormControl fullWidth disabled>
                                                <InputLabel>Приоритет</InputLabel>
                                                <Select
                                                    value={priority}
                                                    label="Приоритет"
                                                    readOnly
                                                    sx={{
                                                        '.MuiSelect-select.Mui-disabled': {
                                                            WebkitTextFillColor: 'rgba(0, 0, 0, 0.87)',
                                                        }
                                                    }}
                                                >
                                                    <MenuItem value="NONE">Без приоритета</MenuItem>
                                                    <MenuItem value="LOW">Низкий</MenuItem>
                                                    <MenuItem value="MEDIUM">Средний</MenuItem>
                                                    <MenuItem value="HIGH">Высокий</MenuItem>
                                                </Select>
                                            </FormControl>
                                        </>
                                    ) : (
                                        <>
                                            {mode === 'create' && (
                                                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1 }}>
                                                    <Button 
                                                        startIcon={<StyleIcon />} 
                                                        onClick={() => setShowTemplateSelector(true)}
                                                        color="primary"
                                                    >
                                                        Использовать шаблон
                                                    </Button>
                                                    <Button 
                                                        startIcon={<SaveAltIcon />} 
                                                        onClick={handleSaveAsTemplate}
                                                        color="secondary"
                                                        sx={{ ml: 2 }}
                                                        disabled={!title.trim()}
                                                    >
                                                        Сохранить как шаблон
                                                    </Button>
                                                </Box>
                                            )}
                                            
                                            <TextField
                                                label="Название"
                                                value={title}
                                                onChange={(e) => {
                                                    setTitle(e.target.value);
                                                    if (errors.title) {
                                                        setErrors(prev => ({ ...prev, title: undefined }));
                                                    }
                                                }}
                                                fullWidth
                                                required
                                                error={!!errors.title}
                                                helperText={errors.title}
                                                disabled={!isEditable}
                                            />
                                            {isEditable ? (
                                                <Box sx={{ mb: 2 }}>
                                                    <Typography variant="subtitle2" gutterBottom>Описание</Typography>
                                                    <ReactQuill
                                                        value={description}
                                                        onChange={setDescription}
                                                        modules={quillModules}
                                                        formats={quillFormats}
                                                        placeholder="Добавьте описание задачи..."
                                                        theme="snow"
                                                        style={{ height: '200px', marginBottom: '40px' }}
                                                    />
                                                </Box>
                                            ) : (
                                                <TextField
                                                    label="Описание"
                                                    value={description}
                                                    onChange={(e) => setDescription(e.target.value)}
                                                    fullWidth
                                                    multiline
                                                    rows={3}
                                                    disabled={!isEditable}
                                                />
                                            )}
                                            
                                            <Box sx={{ display: 'flex', gap: 2 }}>
                                                <Box sx={{ flex: 1 }}>
                                                    <FormControl fullWidth disabled={!isEditable}>
                                                        <InputLabel>Тип задачи</InputLabel>
                                                        <Select
                                                            value={selectedTypeId || ''}
                                                            label="Тип задачи"
                                                            onChange={(e) => {
                                                                const value = e.target.value;
                                                                setSelectedTypeId(value === '' ? null : Number(value));
                                                            }}
                                                            renderValue={(selected) => {
                                                                if (!selected) return <em>Не выбран</em>;
                                                                const selectedType = taskTypes.find(t => t.id === selected);
                                                                if (!selectedType) return <em>Не выбран</em>;
                                                                
                                                                return (
                                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                                        {selectedType.icon && iconNameToComponent[selectedType.icon] 
                                                                            ? React.cloneElement(iconNameToComponent[selectedType.icon], { 
                                                                                style: { color: selectedType.color || 'inherit' } 
                                                                            }) 
                                                                            : <CategoryIcon style={{ color: selectedType.color || 'inherit' }} />
                                                                        }
                                                                        <Typography>{selectedType.name}</Typography>
                                                                    </Box>
                                                                );
                                                            }}
                                                            inputProps={{
                                                                readOnly: !isEditable
                                                            }}
                                                            sx={{
                                                                '.MuiSelect-select.Mui-disabled': {
                                                                    WebkitTextFillColor: 'rgba(0, 0, 0, 0.87)',
                                                                }
                                                            }}
                                                        >
                                                            <MenuItem value="">
                                                                <em>Не выбран</em>
                                                            </MenuItem>
                                                            {taskTypes.map((type) => (
                                                                <MenuItem key={type.id} value={type.id}>
                                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                                        {type.icon && iconNameToComponent[type.icon] 
                                                                            ? React.cloneElement(iconNameToComponent[type.icon], { 
                                                                                style: { color: type.color || 'inherit' } 
                                                                            }) 
                                                                            : <CategoryIcon style={{ color: type.color || 'inherit' }} />
                                                                        }
                                                                        <Typography>{type.name}</Typography>
                                                                    </Box>
                                                                </MenuItem>
                                                            ))}
                                                        </Select>
                                                    </FormControl>
                                                </Box>
                                                
                                                <Box sx={{ flex: 1 }}>
                                                    <FormControl fullWidth disabled={!isEditable}>
                                                        <InputLabel>Статус</InputLabel>
                                                        <Select
                                                            value={selectedStatusId || ''}
                                                            label="Статус"
                                                            onChange={(e) => {
                                                                const value = e.target.value;
                                                                setSelectedStatusId(value === '' ? null : Number(value));
                                                            }}
                                                            renderValue={(selected) => {
                                                                if (!selected) return <em>Не выбран</em>;
                                                                const selectedStatus = boardStatuses.find(s => s.id === selected);
                                                                if (!selectedStatus) return <em>Не выбран</em>;
                                                                
                                                                return (
                                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                                        <Box
                                                                            sx={{
                                                                                width: 16,
                                                                                height: 16,
                                                                                borderRadius: '50%',
                                                                                bgcolor: selectedStatus.color,
                                                                            }}
                                                                        />
                                                                        <Typography>{selectedStatus.name}</Typography>
                                                                    </Box>
                                                                );
                                                            }}
                                                            inputProps={{
                                                                readOnly: !isEditable
                                                            }}
                                                            sx={{
                                                                '.MuiSelect-select.Mui-disabled': {
                                                                    WebkitTextFillColor: 'rgba(0, 0, 0, 0.87)',
                                                                }
                                                            }}
                                                        >
                                                            <MenuItem value="">
                                                                <em>Не выбран</em>
                                                            </MenuItem>
                                                            {boardStatuses.map((status) => (
                                                                <MenuItem key={status.id} value={status.id}>
                                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                                        <Box
                                                                            sx={{
                                                                                width: 16,
                                                                                height: 16,
                                                                                borderRadius: '50%',
                                                                                bgcolor: status.color,
                                                                            }}
                                                                        />
                                                                        <Typography>{status.name}</Typography>
                                                                    </Box>
                                                                </MenuItem>
                                                            ))}
                                                        </Select>
                                                    </FormControl>
                                                </Box>
                                            </Box>
                                            
                                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                                <Box sx={{ display: 'flex', gap: 2 }}>
                                                    <DateTimePicker
                                                        label="Дата начала"
                                                        value={startDate}
                                                        onChange={(newValue) => {
                                                            setStartDate(newValue);
                                                            if (errors.dates) {
                                                                setErrors(prev => ({ ...prev, dates: undefined }));
                                                            }
                                                        }}
                                                        slotProps={{
                                                            textField: { 
                                                                fullWidth: true,
                                                                error: !!errors.dates,
                                                                disabled: !isEditable
                                                            }
                                                        }}
                                                    />
                                                    <DateTimePicker
                                                        label="Дата окончания"
                                                        value={endDate}
                                                        onChange={(newValue) => {
                                                            setEndDate(newValue);
                                                            if (errors.dates) {
                                                                setErrors(prev => ({ ...prev, dates: undefined }));
                                                            }
                                                        }}
                                                        slotProps={{
                                                            textField: { 
                                                                fullWidth: true,
                                                                error: !!errors.dates,
                                                                disabled: !isEditable
                                                            }
                                                        }}
                                                    />
                                                </Box>
                                                {errors.dates && (
                                                    <FormHelperText error>{errors.dates}</FormHelperText>
                                                )}
                                            </Box>
                                            <FormControl fullWidth disabled={!isEditable}>
                                                <InputLabel>Приоритет</InputLabel>
                                                <Select
                                                    value={priority}
                                                    label="Приоритет"
                                                    onChange={(e) => setPriority(e.target.value as TaskPriority)}
                                                >
                                                    <MenuItem value="NONE">Без приоритета</MenuItem>
                                                    <MenuItem value="LOW">Низкий</MenuItem>
                                                    <MenuItem value="MEDIUM">Средний</MenuItem>
                                                    <MenuItem value="HIGH">Высокий</MenuItem>
                                                </Select>
                                            </FormControl>
                                        </>
                                    )}
                                    
                                    {renderTagsSelector()}
                                </Box>
                            )}

                            {mode !== 'create' && task && (
                                <>
                                    <TabPanel value={selectedTab} index={1}>
                                        <SubtaskList 
                                            task={task} 
                                            onTaskUpdate={(updatedTask: Task) => onTaskUpdate && onTaskUpdate(updatedTask)}
                                        />
                                    </TabPanel>
                                    <TabPanel value={selectedTab} index={2}>
                                        <TaskComments
                                            taskId={task.id}
                                            onTaskUpdate={(updatedTaskInfo) => {
                                                // Обновляем только счетчик комментариев, но не закрываем модальное окно
                                                if (task) {
                                                    // Если получили updatedTaskInfo, используем его
                                                    if (updatedTaskInfo) {
                                                        // Обновляем задачу, сохраняя все существующие данные и обновляя только счетчик комментариев
                                                        const updatedTask = {
                                                            ...task,
                                                            commentCount: updatedTaskInfo.commentCount || (task.commentCount || 0) + 1
                                                        };
                                                        
                                                        // Обновляем локальное состояние
                                                        setTask(updatedTask as ExtendedTaskWithTypes);
                                                        
                                                        // Важное изменение! НЕ передаем обновленную задачу родительскому компоненту
                                                        // Это может вызвать закрытие модального окна
                                                        
                                                        // УБИРАЕМ следующий код, чтобы предотвратить закрытие:
                                                        // if (onTaskUpdate) {
                                                        //     onTaskUpdate(updatedTask);
                                                        // }
                                                    } else {
                                                        // Если обновленная информация не получена, просто инкрементируем счетчик
                                                        const updatedTask = {
                                                            ...task,
                                                            commentCount: (task.commentCount || 0) + 1
                                                        };
                                                        setTask(updatedTask as ExtendedTaskWithTypes);
                                                    }
                                                }
                                            }}
                                        />
                                    </TabPanel>
                                    <TabPanel value={selectedTab} index={3}>
                                        <TaskHistory task={task} />
                                    </TabPanel>
                                    <TabPanel value={selectedTab} index={4}>
                                        <TaskAttachments
                                            taskId={task.id}
                                            onTaskUpdate={updatedTask => {
                                                if (onTaskUpdate) {
                                                    onTaskUpdate(updatedTask);
                                                }
                                            }}
                                        />
                                    </TabPanel>
                                </>
                            )}

                            {error && (
                                <Box sx={{ mt: 2 }}>
                                    <Typography color="error">{error}</Typography>
                                </Box>
                            )}
                        </>
                    )}
                </DialogContent>
                <DialogActions>
                    {!showTemplateSelector && renderDialogActions()}
                </DialogActions>
            </Dialog>

            <Dialog open={saveTemplateDialogOpen} onClose={() => setSaveTemplateDialogOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Сохранить задачу как шаблон</DialogTitle>
                <DialogContent>
                    <TextField
                        label="Название шаблона"
                        value={templateName}
                        onChange={(e) => setTemplateName(e.target.value)}
                        fullWidth
                        required
                        margin="normal"
                        helperText="Укажите имя шаблона для быстрого создания похожих задач в будущем"
                    />
                    <Box sx={{ mt: 2 }}>
                        <Typography variant="subtitle2">Шаблон будет включать:</Typography>
                        <ul>
                            <li>Название: {title}</li>
                            <li>Описание{description ? '' : ' (пусто)'}</li>
                            <li>Тип: {taskTypes.find(t => t.id === selectedTypeId)?.name || 'Не выбран'}</li>
                            <li>Статус: {boardStatuses.find(s => s.id === selectedStatusId)?.name || 'Не выбран'}</li>
                            <li>Приоритет: {
                                priority === 'HIGH' ? 'Высокий' :
                                priority === 'MEDIUM' ? 'Средний' :
                                priority === 'LOW' ? 'Низкий' :
                                'Без приоритета'
                            }</li>
                        </ul>
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setSaveTemplateDialogOpen(false)}>Отмена</Button>
                    <Button 
                        onClick={saveTemplate} 
                        variant="contained"
                        disabled={!templateName.trim()}
                    >
                        Сохранить шаблон
                    </Button>
                </DialogActions>
            </Dialog>
        </LocalizationProvider>
    );
}; 