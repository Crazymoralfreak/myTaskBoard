import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
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
import { getDateFnsLocale } from '../../../utils/formatters';
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
import { useUserRole, Permission } from '../../../hooks/useUserRole';
import { boardService } from '../../../services/boardService';
import { useRoleContext } from '../../../contexts/RoleContext';
import { BoardMembersService } from '../../../services/BoardMembersService';
import { getAvatarUrl } from '../../../utils/avatarUtils';
import { TextRenderer } from '../../../utils/textUtils';
import { useLocalization } from '../../../hooks/useLocalization';
import { showTaskNotification, showGeneralNotification } from '../../../utils/notifications';
import { useSnackbar } from 'notistack';

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
    boardId?: string;
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
    const { t, language } = useLocalization();
    const { enqueueSnackbar } = useSnackbar();
    
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
    const [mode, setMode] = useState<ModalMode>(initialMode);
    const [selectedTab, setSelectedTab] = useState(0);
    const [errors, setErrors] = useState<{
        title?: string;
        dates?: string;
    }>({});
    const [showTemplateSelector, setShowTemplateSelector] = useState(false);
    const [saveTemplateDialogOpen, setSaveTemplateDialogOpen] = useState(false);
    const [templateName, setTemplateName] = useState('');
    const [isSavingTemplate, setIsSavingTemplate] = useState(false);
    const [templateError, setTemplateError] = useState<string | null>(null);
    const [tags, setTags] = useState<string[]>([]);
    const [availableTags, setAvailableTags] = useState<string[]>([]);
    const [newTag, setNewTag] = useState('');
    const [userSettings, setUserSettings] = useState<{compactMode?: boolean}>({});
    const [assignedUserId, setAssignedUserId] = useState<number | null>(null);
    const [boardMembers, setBoardMembers] = useState<any[]>([]);

    // Состояние для данных доски и проверки ролей
    const [boardData, setBoardData] = useState<any>(null);
    
    // Получаем контекст ролей
    const roleContext = useRoleContext();

    // Используем ExtendedTaskWithTypes вместо Task
    const [task, setTask] = useState<ExtendedTaskWithTypes | null>(initialTask || null);
    
    // Локальное состояние для подзадач (чтобы не закрывать модальное окно)
    const [localSubtasks, setLocalSubtasks] = useState<any[]>([]);
    
    // Функция для синхронизации локальных подзадач с задачей без закрытия модального окна
    const syncSubtasksToTask = React.useCallback(async () => {
        if (!task || localSubtasks.length === 0) return;
        
        try {
            // Обновляем только локальное состояние задачи с новыми подзадачами
            const updatedTask = {
                ...task,
                subtasks: localSubtasks,
                subtaskCount: localSubtasks.length
            };
            setTask(updatedTask);
            
            // НЕ вызываем onTaskUpdate, чтобы предотвратить закрытие модального окна
            // Синхронизация с родительским компонентом произойдет только при закрытии модального окна
            
            console.log('Подзадачи синхронизированы локально');
        } catch (error) {
            console.error('Ошибка при синхронизации подзадач:', error);
        }
    }, [task, localSubtasks]);
    
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

    // При загрузке доски, обновляем текущую доску в контексте ролей
    useEffect(() => {
        const loadBoardData = async () => {
            if (boardId) {
                try {
                    console.log('Загрузка данных доски для проверки прав, boardId:', boardId);
                    const data = await boardService.getBoard(boardId);
                    console.log('Данные доски загружены:', data);
                    if ((data as any).currentUser) {
                        console.log('Текущий пользователь:', (data as any).currentUser);
                        console.log('Роль пользователя:', (data as any).currentUser.role);
                    } else {
                        console.warn('Данные о текущем пользователе отсутствуют в ответе API');
                    }
                    setBoardData(data);
                } catch (error) {
                    console.error('Не удалось загрузить данные доски:', error);
                }
            } else {
                console.warn('boardId не предоставлен для TaskModal, права будут ограничены');
            }
        };
        
        if (open) {
            loadBoardData();
        }
    }, [boardId, open]);
    
    // Эффект для логирования проверок прав
    useEffect(() => {
        if (boardData) {
            console.log('Проверка прав пользователя:');
            console.log('- canEditTask:', canEditTask());
            console.log('- canDeleteTask:', canDeleteTask());
            console.log('- canAddComments:', canAddComments());
            console.log('- canCopyTask:', canCopyTask());
        }
    }, [boardData]);

    // Функции для проверки прав
    const canEditTask = (): boolean => {
        return roleContext.hasPermission(Permission.EDIT_TASKS);
    };
    
    const canDeleteTask = (): boolean => {
        return roleContext.hasPermission(Permission.DELETE_TASKS);
    };

    // Функция для проверки права на добавление комментариев
    const canAddComments = (): boolean => {
        return roleContext.hasPermission(Permission.COMMENT_TASKS);
    };

    // Функция для проверки права на копирование задач
    const canCopyTask = (): boolean => {
        return roleContext.hasPermission(Permission.ADD_TASKS);
    };

    useEffect(() => {
        if (open) {
            // Сбрасываем локальное состояние подзадач при открытии нового модального окна
            setLocalSubtasks([]);
            
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
                    setLocalSubtasks([...(initialTask.subtasks || [])]); // Инициализируем локальное состояние подзадач копией
                    setTitle(initialTask.title || '');
                    setDescription(initialTask.description || '');
                    setStartDate(initialTask.startDate ? new Date(initialTask.startDate) : null);
                    setEndDate(initialTask.endDate ? new Date(initialTask.endDate) : null);
                    setPriority(initialTask.priority || 'NONE');
                    setSelectedTypeId(initialTask.type?.id || null);
                    setSelectedStatusId(initialTask.customStatus?.id || null);
                    setTags(initialTask.tags || []);
                    setAssignedUserId(initialTask.assignee?.id || null);
                    
                    // Если в режиме просмотра, загружаем задачу по её ID для получения свежих данных
                    if (initialMode === 'view' && initialTask.id) {
                        const fetchTask = async () => {
                            try {
                                const loadedTask = await taskService.getTask(initialTask.id);
                                if (loadedTask) {
                                    setTask(loadedTask as ExtendedTaskWithTypes);
                                    setLocalSubtasks([...(loadedTask.subtasks || [])]); // Обновляем локальное состояние подзадач копией
                                    setTitle(loadedTask.title || '');
                                    setDescription(loadedTask.description || '');
                                    setStartDate(loadedTask.startDate ? new Date(loadedTask.startDate) : null);
                                    setEndDate(loadedTask.endDate ? new Date(loadedTask.endDate) : null);
                                    setPriority(loadedTask.priority || 'NONE');
                                    setSelectedTypeId(loadedTask.type?.id || null);
                                    setSelectedStatusId(loadedTask.customStatus?.id || null);
                                    setTags(loadedTask.tags || []);
                                    setAssignedUserId(loadedTask.assignee?.id || null);
                                }
                            } catch (error: any) {
                                console.error('Ошибка при загрузке задачи:', error);
                                // Если задача не найдена (была удалена), закрываем модальное окно
                                if (error.response && error.response.status === 404) {
                                    console.log('Задача не найдена или была удалена');
                                    showTaskNotification(t, enqueueSnackbar, 'taskNotFound', {}, 'error');
                                    onClose();
                                } else {
                                    setError(t('errorsLoadFailed'));
                                }
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
                setError(t('errorsLoadFailed'));
            }
        };
        
        const loadBoardMembers = async () => {
            // Определяем boardId: либо из пропса, либо из задачи
            const currentBoardId = boardId || task?.boardId || initialTask?.boardId;
            
            if (currentBoardId && open) {
                try {
                    console.log('Загружаем участников доски:', currentBoardId, 'режим:', mode);
                    // Сначала очищаем список
                    setBoardMembers([]);
                    const members = await BoardMembersService.getBoardMembers(currentBoardId);
                    console.log('Загружены участники доски:', members);
                    setBoardMembers(members);
                } catch (error) {
                    console.error('Error loading board members:', error);
                    setBoardMembers([]); // Очищаем список при ошибке
                }
            } else if (!open) {
                // Очищаем участников при закрытии модального окна
                setBoardMembers([]);
            }
        };
        
        // Загружаем данные только если модальное окно открыто
        if (open) {
            loadTags();
            loadBoardMembers();
        } else {
            // Очищаем состояние при закрытии
            setBoardMembers([]);
        }
    }, [boardId, open, task, initialTask]);

    useEffect(() => {
        if (task && mode !== 'create') {
            setTags(task.tags || []);
        } else if (mode === 'create') {
            // При создании новой задачи очищаем массив тегов
            setTags([]);
        }
    }, [task, mode]);

    const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
        // При переходе с таба подзадач обновляем локальное состояние задачи (но НЕ родительский компонент)
        if (selectedTab === 1 && localSubtasks.length > 0) {
            syncSubtasksToTask();
        }
        
        // При переходе на таб подзадач обновляем локальное состояние из текущей задачи
        if (newValue === 1 && task?.subtasks) {
            setLocalSubtasks([...task.subtasks]); // Создаем копию для избежания мутаций
        }
        
        setSelectedTab(newValue);
    };

    // Выносим проверку дат в отдельную функцию
    const validateDates = (start: Date | null, end: Date | null): string | undefined => {
        if (start && end && start > end) {
            return t('taskModalDateError');
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
            newErrors.title = t('taskModalTitleRequired');
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
            tags,
            assigneeId: assignedUserId || undefined
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
                setErrors(prev => ({ ...prev, dates: t('taskModalDateError') }));
                setError(null); 
            } else {
                setError(error.response?.data?.message || error.message || t('taskModalCreateError'));
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
        
        // Проверяем изменение ответственного
        const currentAssigneeId = task.assignee?.id || null;
        if (assignedUserId !== currentAssigneeId) {
            // Сохраняем информацию о назначении для последующей обработки
            (updatedTaskData as any).assigneeChanged = {
                oldAssigneeId: currentAssigneeId,
                newAssigneeId: assignedUserId
            };
        }
        
        // Проверяем, есть ли вообще изменения
        if (Object.keys(updatedTaskData).length === 0) {
            setError(t('errorsSaveFailed'));
            setIsSubmitting(false);
            // Можно просто закрыть окно или остаться в режиме редактирования
            // onClose(); // Закрываем, если нет изменений
            setMode('view'); // Или просто возвращаемся в режим просмотра
            return;
        }

        try {
            // Сначала обновляем основные поля задачи
            let finalUpdatedTask;
            
            // Убираем assigneeChanged перед отправкой основного обновления
            const assigneeChange = (updatedTaskData as any).assigneeChanged;
            delete (updatedTaskData as any).assigneeChanged;
            
            if (Object.keys(updatedTaskData).length > 0) {
                finalUpdatedTask = await taskService.updateTask(task.id, updatedTaskData);
            } else {
                finalUpdatedTask = task;
            }
            
            // Затем обрабатываем изменение ответственного, если оно есть
            if (assigneeChange) {
                if (assigneeChange.newAssigneeId) {
                    // Назначаем нового ответственного
                    finalUpdatedTask = await taskService.assignTask(String(task.id), String(assigneeChange.newAssigneeId));
                } else {
                    // Снимаем назначение
                    finalUpdatedTask = await taskService.unassignTask(String(task.id));
                }
            }
            
            if (onTaskUpdate) {
                onTaskUpdate(finalUpdatedTask);
            }
            
            // ИСПРАВЛЕНИЕ: Вызываем onClose после успешного обновления
            onClose();

        } catch (error: any) {
            console.error('Ошибка при обновлении задачи:', error);
            if (error.response && error.response.status === 400 && error.response.data?.error?.includes('End date must be after start date')) {
                setErrors(prev => ({ ...prev, dates: t('taskModalDateError') }));
                setError(null); 
            } else {
                setError(error.response?.data?.message || error.message || t('taskModalUpdateError'));
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    // Используем useCallback для привязки handleDelete
    const handleDelete = useCallback(async () => {
        console.log('handleDelete called');
        
        if (!task) {
            console.error('Нет задачи для удаления');
            return;
        }
        
        // Больше не требуем onTaskDelete для выполнения удаления
        if (!onTaskDelete) {
            console.warn('Предупреждение: не передан обработчик onTaskDelete. Задача будет удалена из API, но UI может не обновиться автоматически.');
        }

        try {
            console.log('Начало удаления задачи:', task.id);
            setIsSubmitting(true);
            
            // Вызов API для удаления задачи
            const result = await taskService.deleteTask(task.id);
            console.log('Ответ сервера после удаления:', result);
            
            // Закрываем модальное окно
            console.log('Закрываем модальное окно');
            onClose();
            
            // Уведомляем родительский компонент, если есть обработчик
            if (onTaskDelete) {
                console.log('Обновляем состояние родительского компонента');
                onTaskDelete(task.id);
            } else {
                console.log('Состояние не обновлено в UI - нет обработчика onTaskDelete');
                
                // Создаем и отправляем событие для обновления UI
                const taskDeletedEvent = new CustomEvent('task-deleted', {
                    detail: { taskId: task.id }
                });
                window.dispatchEvent(taskDeletedEvent);
                
                // Если задача была в колонке, создаем событие для обновления колонки
                if (boardId) {
                    console.log('Попытка обновить доску через событие');
                    // Создаем событие для обновления доски
                    const event = new CustomEvent('board:update', { 
                        detail: { boardId, forceRefresh: true } 
                    });
                    window.dispatchEvent(event);
                    
                    // Создаем событие удаления задачи
                    const taskDeleteEvent = new CustomEvent('task:delete', { 
                        detail: { taskId: task.id, boardId } 
                    });
                    window.dispatchEvent(taskDeleteEvent);
                } else {
                    // Пробуем найти boardId из URL
                    const urlMatch = window.location.pathname.match(/\/boards\/([a-zA-Z0-9_-]+)/);
                    if (urlMatch && urlMatch[1]) {
                        const boardIdFromUrl = urlMatch[1];
                        console.log('Найден boardId из URL:', boardIdFromUrl);
                        
                        const event = new CustomEvent('board:update', { 
                            detail: { boardId: boardIdFromUrl, forceRefresh: true } 
                        });
                        window.dispatchEvent(event);
                    }
                }
                
                // Если задача была открыта в отдельном модальном окне, можно также
                // добавить обработчик события для обновления списков задач
                const taskListUpdateEvent = new CustomEvent('tasklist:update');
                window.dispatchEvent(taskListUpdateEvent);
                
                // Показываем уведомление об успешном удалении
                showTaskNotification(t, enqueueSnackbar, 'taskDeleted', {}, 'success');
            }
            
        } catch (error) {
            console.error('Ошибка при удалении задачи:', error);
                            setError(t('errorsDeleteFailed'));
            setIsSubmitting(false);
        }
    }, [task, onTaskDelete, onClose, setIsSubmitting, setError, boardId]);

    const handleClose = () => {
        // Синхронизируем подзадачи с родительским компонентом перед закрытием
        if (task && localSubtasks.length > 0 && onTaskUpdate && mode !== 'create') {
            const updatedTask = {
                ...task,
                subtasks: localSubtasks,
                subtaskCount: localSubtasks.length
            };
            // Вызываем onTaskUpdate для синхронизации с доской
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
        setLocalSubtasks([]);
        setSelectedTab(0); // Сбрасываем активный таб
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
            setError(t('errorsCopyFailed'));
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
            setError(t('taskModalTitleRequired'));
            return;
        }
        
        setSaveTemplateDialogOpen(true);
    };
    
    const saveTemplate = async () => {
        setIsSavingTemplate(true);
        try {
            if (boardId) {
                await taskService.createTaskTemplate(boardId, {
                    id: 0, // ID будет присвоен на сервере
                    name: templateName.trim(),
                    taskData: {
                        title: title.trim(),
                        description: description.trim(),
                        typeId: selectedTypeId || undefined,
                        statusId: selectedStatusId || undefined,
                        priority: priority as TaskPriority,
                    },
                    tags: tags,
                    boardId: boardId,
                    createdBy: 0, // ID будет установлен на сервере
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                });
                setTemplateName('');
                setSaveTemplateDialogOpen(false);
            } else {
                console.error('Не удалось сохранить шаблон: boardId не указан');
                setTemplateError(t('taskModalTemplateError'));
            }
        } catch (error) {
            console.error('Ошибка при сохранении шаблона:', error);
            setTemplateError(t('taskModalTemplateSaveError'));
        } finally {
            setIsSavingTemplate(false);
        }
    };

    const renderDialogTitle = () => {
        switch (mode) {
            case 'create':
                return t('createTask');
            case 'edit':
                return t('editTask');
            case 'view':
                return t('viewTask');
            default:
                return t('taskTitle');
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
                            <Button onClick={handleClose}>{t('cancel')}</Button>
                            <Button 
                                onClick={handleCreate} 
                                variant="contained" 
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? <CircularProgress size={24} /> : t('create')}
                            </Button>
                        </DialogActions>
                    </Box>
                );
            case 'edit':
                return (
                    <Box sx={actionStyles} width="100%">
                        <DialogActions>
                            {canDeleteTask() && (
                                <Button 
                                    onClick={() => showConfirmDialog({
                                        title: t('deleteTask'),
                                        message: t('confirmDeleteTask'),
                                        actionType: "delete",
                                        onConfirm: handleDelete,
                                        loading: isSubmitting
                                    })} 
                                    color="error"
                                    disabled={isSubmitting}
                                    startIcon={<DeleteOutlineIcon />}
                                    sx={{ mr: 'auto' }}
                                >
                                    {t('delete')}
                                </Button>
                            )}
                            <Button onClick={() => setMode('view')} disabled={isSubmitting}>
                                {t('cancel')}
                            </Button>
                            <Button 
                                onClick={handleUpdate} 
                                variant="contained" 
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? <CircularProgress size={24} /> : t('save')}
                            </Button>
                        </DialogActions>
                    </Box>
                );
            case 'view':
                const canEdit = canEditTask();
                const canDelete = canDeleteTask();
                const canCopy = canCopyTask();
                
                console.log('Права при рендеринге кнопок в режиме просмотра:');
                console.log('- canEditTask:', canEdit);
                console.log('- canDeleteTask:', canDelete);
                console.log('- canCopyTask:', canCopy);
                
                return (
                    <Box sx={actionStyles} width="100%">
                        <DialogActions>
                            {canDelete && (
                                <Button 
                                    onClick={() => showConfirmDialog({
                                        title: t('deleteTask'),
                                        message: t('confirmDeleteTask'),
                                        actionType: "delete",
                                        onConfirm: handleDelete,
                                        loading: isSubmitting
                                    })} 
                                    color="error"
                                    disabled={isSubmitting}
                                    startIcon={<DeleteOutlineIcon />}
                                    sx={{ mr: 1 }}
                                >
                                    {isMobile ? '' : t('delete')}
                                </Button>
                            )}
                            {canCopy && (
                                <Button 
                                    onClick={handleCopyTask} 
                                    disabled={isSubmitting}
                                    startIcon={<ContentCopyIcon />}
                                    sx={{ mr: isMobile ? 'auto' : 1 }}
                                >
                                    {isMobile ? '' : t('copy')}
                                </Button>
                            )}
                            {onTaskUpdate && canEdit && (
                                <Button 
                                    onClick={() => {
                                        setMode('edit');
                                    }} 
                                    variant="contained"
                                >
                                    {t('edit')}
                                </Button>
                            )}
                            <Button onClick={handleClose}>{t('close')}</Button>
                        </DialogActions>
                    </Box>
                );
            default:
                return (
                    <Box sx={actionStyles} width="100%">
                        <DialogActions>
                            <Button onClick={handleClose}>{t('close')}</Button>
                        </DialogActions>
                    </Box>
                );
        }
    };

    const isEditable = (mode === 'create' || mode === 'edit') && canEditTask();

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
                                task.priority === 'HIGH' ? t('taskPriorityHigh') :
        task.priority === 'MEDIUM' ? t('taskPriorityMedium') :
        task.priority === 'LOW' ? t('taskPriorityLow') :
        t('taskPriorityNone')
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
                {task.assignee && (
                    <Chip
                        avatar={
                            task.assignee.avatarUrl ? (
                                <img 
                                    src={getAvatarUrl(task.assignee.avatarUrl)} 
                                    alt={task.assignee.username}
                                    style={{
                                        width: 24,
                                        height: 24,
                                        borderRadius: '50%'
                                    }}
                                    onError={(e) => {
                                        console.error('Ошибка загрузки аватара в TaskModal:', task.assignee?.avatarUrl);
                                        e.currentTarget.style.display = 'none';
                                    }}
                                />
                            ) : undefined
                        }
                        label={`${t('assignedTo')}: ${task.assignee.username}`}
                        size="medium"
                        variant="outlined"
                        color="primary"
                        onClick={isEditable ? undefined : () => {}}
                    />
                )}
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
                {t('taskModalTagsTitle')}
                <Tooltip title={t('taskModalTagsTooltip')}>
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
                            {t('taskModalNoTags')}
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
                                placeholder={t('taskModalAddTag')}
                                size="small"
                                fullWidth
                                disabled={!isEditable}
                            />
                        )}
                        disabled={!isEditable}
                    />
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                        {t('taskModalTagsHelp')}
                    </Typography>
                </>
            )}
        </Box>
    );

    // При загрузке задачи, обновляем данные в контексте ролей
    useEffect(() => {
        if (boardData) {
            roleContext.setCurrentBoard(boardData);
            if ((boardData as any).currentUser) {
                roleContext.setCurrentUserId((boardData as any).currentUser.id);
                console.log('Установлен currentUserId в RoleContext:', (boardData as any).currentUser.id);
                console.log('RoleContext после обновления:', {
                    isOwner: roleContext.isOwner,
                    isAdmin: roleContext.isAdmin,
                    currentRole: roleContext.currentRole,
                    permissions: {
                        canEditTask: roleContext.hasPermission(Permission.EDIT_TASKS),
                        canDeleteTask: roleContext.hasPermission(Permission.DELETE_TASKS),
                        canCopyTask: roleContext.hasPermission(Permission.ADD_TASKS),
                        canCommentTask: roleContext.hasPermission(Permission.COMMENT_TASKS)
                    }
                });
            }
        }
    }, [boardData, roleContext]);

    const hasCommentsPermission = canAddComments();
    console.log('Права на комментирование при рендеринге вкладки комментариев:', hasCommentsPermission);
    
    return (
        <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={getDateFnsLocale(language)}>
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
                                <Typography variant="h6">{t('taskModalTemplateSelector')}</Typography>
                                <Button onClick={() => setShowTemplateSelector(false)}>
                                    {t('taskModalBackToCreation')}
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
                                        <Tab label={t('taskModalMainTab')} />
                                        <Tab 
                                            label={
                                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                    <span>{t('taskModalSubtasksTab')}</span>
                                                    {task.subtasks && task.subtasks.length > 0 && (
                                                        <Chip 
                                                            label={task.subtasks.length} 
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
                                        <Tab 
                                            label={
                                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                    <span>{t('taskModalCommentsTab')}</span>
                                                    {((task.comments && task.comments.length > 0) || task.commentCount > 0) && (
                                                        <Chip 
                                                            label={task.comments?.length || task.commentCount || 0} 
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
                                        <Tab label={t('taskModalHistoryTab')} />
                                        <Tab 
                                            label={
                                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                    <span>{t('taskModalAttachmentsTab')}</span>
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
                                                label={t('taskModalTitle')}
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
                                                <Typography variant="subtitle2" gutterBottom>{t('taskModalDescription')}</Typography>
                                                {description ? (
                                                    <TextRenderer 
                                                        content={description} 
                                                        variant="body2"
                                                        maxHeight="300px"
                                                    />
                                                ) : (
                                                    <Paper 
                                                        variant="outlined" 
                                                        sx={{ 
                                                            p: 2, 
                                                            minHeight: '60px',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            color: 'text.secondary',
                                                            fontStyle: 'italic'
                                                        }}
                                                    >
                                                        {t('taskModalNoDescription')}
                                                    </Paper>
                                                )}
                                            </Box>
                                            
                                            <Box sx={{ display: 'flex', gap: 2 }}>
                                                <Box sx={{ flex: 1 }}>
                                                    <FormControl fullWidth disabled>
                                                        <InputLabel>{t('taskModalTaskType')}</InputLabel>
                                                        <Select
                                                            value={selectedTypeId || ''}
                                                            label={t('taskModalTaskType')}
                                                            readOnly
                                                            sx={{
                                                                '.MuiSelect-select.Mui-disabled': {
                                                                    WebkitTextFillColor: 'rgba(0, 0, 0, 0.87)',
                                                                }
                                                            }}
                                                        >
                                                            <MenuItem value="">
                                                                <em>{t('taskModalNotSelected')}</em>
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
                                                    <FormControl fullWidth disabled>
                                                        <InputLabel>{t('taskModalStatus')}</InputLabel>
                                                        <Select
                                                            value={selectedStatusId || ''}
                                                            label={t('taskModalStatus')}
                                                            readOnly
                                                            sx={{
                                                                '.MuiSelect-select.Mui-disabled': {
                                                                    WebkitTextFillColor: 'rgba(0, 0, 0, 0.87)',
                                                                }
                                                            }}
                                                        >
                                                            <MenuItem value="">
                                                                <em>{t('taskModalNotSelected')}</em>
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
                                                        label={t('taskModalStartDate')}
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
                                                        label={t('taskModalEndDate')}
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
                                            </Box>
                                            <FormControl fullWidth disabled>
                                                <InputLabel>{t('taskModalPriority')}</InputLabel>
                                                <Select
                                                    value={priority}
                                                    label={t('taskModalPriority')}
                                                    readOnly
                                                    sx={{
                                                        '.MuiSelect-select.Mui-disabled': {
                                                            WebkitTextFillColor: 'rgba(0, 0, 0, 0.87)',
                                                        }
                                                    }}
                                                >
                                                    <MenuItem value="NONE">{t('taskModalNoPriority')}</MenuItem>
                                                    <MenuItem value="LOW">{t('taskModalLowPriority')}</MenuItem>
                                                    <MenuItem value="MEDIUM">{t('taskModalMediumPriority')}</MenuItem>
                                                    <MenuItem value="HIGH">{t('taskModalHighPriority')}</MenuItem>
                                                </Select>
                                            </FormControl>
                                            
                                            {/* Поле "Назначена на" в режиме просмотра */}
                                            <FormControl fullWidth disabled>
                                                <InputLabel>{t('taskModalAssignedTo')}</InputLabel>
                                                <Select
                                                    value={assignedUserId || ''}
                                                    label={t('taskModalAssignedTo')}
                                                    readOnly
                                                    renderValue={(selected) => {
                                                        if (!selected) {
                                                            return <em>{t('taskModalNotAssigned')}</em>;
                                                        }
                                                        // Ищем участника в списке boardMembers
                                                        const selectedMember = boardMembers.find(member => member.userId === Number(selected));
                                                        if (selectedMember) {
                                                            return (
                                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                                    {(selectedMember.avatarUrl || selectedMember.user?.avatarUrl) && (
                                                                        <img 
                                                                            src={getAvatarUrl(selectedMember.avatarUrl || selectedMember.user?.avatarUrl)} 
                                                                            alt={selectedMember.username}
                                                                            style={{
                                                                                width: 20,
                                                                                height: 20,
                                                                                borderRadius: '50%',
                                                                                objectFit: 'cover'
                                                                            }}
                                                                            onError={(e) => {
                                                                                e.currentTarget.style.display = 'none';
                                                                            }}
                                                                        />
                                                                    )}
                                                                    <Typography>{selectedMember.username}</Typography>
                                                                </Box>
                                                            );
                                                        }
                                                        return `${t('taskModalUserNotFound')} ${selected}`;
                                                    }}
                                                    sx={{
                                                        '.MuiSelect-select.Mui-disabled': {
                                                            WebkitTextFillColor: 'rgba(0, 0, 0, 0.87)',
                                                        }
                                                    }}
                                                >
                                                    <MenuItem value="">
                                                        <em>{t('taskModalNotAssigned')}</em>
                                                    </MenuItem>
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
                                                        {t('taskModalUseTemplate')}
                                                    </Button>
                                                    <Button 
                                                        startIcon={<SaveAltIcon />} 
                                                        onClick={handleSaveAsTemplate}
                                                        color="secondary"
                                                        sx={{ ml: 2 }}
                                                        disabled={!title.trim()}
                                                    >
                                                        {t('taskModalSaveAsTemplate')}
                                                    </Button>
                                                </Box>
                                            )}
                                            
                                            <TextField
                                                label={t('taskModalTitle')}
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
                                                    <Typography variant="subtitle2" gutterBottom>{t('taskModalDescription')}</Typography>
                                                    <ReactQuill
                                                        value={description}
                                                        onChange={setDescription}
                                                        modules={quillModules}
                                                        formats={quillFormats}
                                                        placeholder={t('taskModalDescriptionPlaceholder')}
                                                        theme="snow"
                                                        style={{ height: '200px', marginBottom: '40px' }}
                                                    />
                                                </Box>
                                            ) : (
                                                <TextField
                                                    label={t('taskModalDescription')}
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
                                                        <InputLabel>{t('taskModalTaskType')}</InputLabel>
                                                        <Select
                                                            value={selectedTypeId || ''}
                                                            label={t('taskModalTaskType')}
                                                            onChange={(e) => {
                                                                const value = e.target.value;
                                                                setSelectedTypeId(value === '' ? null : Number(value));
                                                            }}
                                                            renderValue={(selected) => {
                                                                if (!selected) return <em>{t('taskModalNotSelected')}</em>;
                                                                const selectedType = taskTypes.find(type => type.id === selected);
                                                                if (!selectedType) return <em>{t('taskModalNotSelected')}</em>;
                                                                
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
                                                                <em>{t('taskModalNotSelected')}</em>
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
                                                        <InputLabel>{t('taskModalStatus')}</InputLabel>
                                                        <Select
                                                            value={selectedStatusId || ''}
                                                            label={t('taskModalStatus')}
                                                            onChange={(e) => {
                                                                const value = e.target.value;
                                                                setSelectedStatusId(value === '' ? null : Number(value));
                                                            }}
                                                            renderValue={(selected) => {
                                                                if (!selected) return <em>{t('taskModalNotSelected')}</em>;
                                                                const selectedStatus = boardStatuses.find(status => status.id === selected);
                                                                if (!selectedStatus) return <em>{t('taskModalNotSelected')}</em>;
                                                                
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
                                                                <em>{t('taskModalNotSelected')}</em>
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
                                                        label={t('taskModalStartDate')}
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
                                                        label={t('taskModalEndDate')}
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
                                            
                                            <Box sx={{ display: 'flex', gap: 2 }}>
                                                <FormControl fullWidth disabled={!isEditable}>
                                                    <InputLabel>{t('taskModalPriority')}</InputLabel>
                                                    <Select
                                                        value={priority}
                                                        label={t('taskModalPriority')}
                                                        onChange={(e) => setPriority(e.target.value as TaskPriority)}
                                                    >
                                                        <MenuItem value="NONE">{t('taskModalNoPriority')}</MenuItem>
                                                        <MenuItem value="LOW">{t('taskModalLowPriority')}</MenuItem>
                                                        <MenuItem value="MEDIUM">{t('taskModalMediumPriority')}</MenuItem>
                                                        <MenuItem value="HIGH">{t('taskModalHighPriority')}</MenuItem>
                                                    </Select>
                                                </FormControl>
                                                
                                                <FormControl fullWidth disabled={!isEditable}>
                                                    <InputLabel>{t('taskModalAssignedTo')}</InputLabel>
                                                    <Select
                                                        value={assignedUserId || ''}
                                                        label={t('taskModalAssignedTo')}
                                                        onChange={(e) => {
                                                            const value = e.target.value;
                                                            setAssignedUserId(value === '' ? null : Number(value));
                                                        }}
                                                        renderValue={(selected) => {
                                                            if (!selected) {
                                                                return <em>{t('taskModalNotAssigned')}</em>;
                                                            }
                                                            // Ищем участника в списке boardMembers
                                                            const selectedMember = boardMembers.find(member => member.userId === Number(selected));
                                                            if (selectedMember) {
                                                                return (
                                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                                        {(selectedMember.avatarUrl || selectedMember.user?.avatarUrl) && (
                                                                            <img 
                                                                                src={getAvatarUrl(selectedMember.avatarUrl || selectedMember.user?.avatarUrl)} 
                                                                                alt={selectedMember.username}
                                                                                style={{
                                                                                    width: 20,
                                                                                    height: 20,
                                                                                    borderRadius: '50%',
                                                                                    objectFit: 'cover'
                                                                                }}
                                                                                onError={(e) => {
                                                                                    e.currentTarget.style.display = 'none';
                                                                                }}
                                                                            />
                                                                        )}
                                                                        <Typography>{selectedMember.username}</Typography>
                                                                    </Box>
                                                                );
                                                            }
                                                            return `${t('taskModalUserNotFound')} ${selected}`;
                                                        }}
                                                    >
                                                        <MenuItem value="">
                                                            <em>{t('taskModalNotAssigned')}</em>
                                                        </MenuItem>
                                                        {boardMembers.length > 0 ? boardMembers.map((member) => (
                                                            <MenuItem key={member.userId} value={member.userId}>
                                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                                    {(member.avatarUrl || member.user?.avatarUrl) ? (
                                                                        <img 
                                                                            src={getAvatarUrl(member.avatarUrl || member.user?.avatarUrl)} 
                                                                            alt={member.username}
                                                                            style={{
                                                                                width: 24,
                                                                                height: 24,
                                                                                borderRadius: '50%',
                                                                                objectFit: 'cover'
                                                                            }}
                                                                            onError={(e) => {
                                                                                console.error('Ошибка загрузки аватара участника:', member.avatarUrl || member.user?.avatarUrl);
                                                                                e.currentTarget.style.display = 'none';
                                                                            }}
                                                                        />
                                                                    ) : (
                                                                        <Box 
                                                                            sx={{
                                                                                width: 24,
                                                                                height: 24,
                                                                                borderRadius: '50%',
                                                                                bgcolor: 'grey.300',
                                                                                display: 'flex',
                                                                                alignItems: 'center',
                                                                                justifyContent: 'center',
                                                                                fontSize: '12px',
                                                                                fontWeight: 'bold'
                                                                            }}
                                                                        >
                                                                            {member.username.charAt(0).toUpperCase()}
                                                                        </Box>
                                                                    )}
                                                                    <Typography>{member.username}</Typography>
                                                                </Box>
                                                            </MenuItem>
                                                        )) : (
                                                            <MenuItem disabled>
                                                                <Typography color="text.secondary">{t('taskModalNoBoardMembers')}</Typography>
                                                            </MenuItem>
                                                        )}
                                                    </Select>
                                                </FormControl>
                                            </Box>
                                        </>
                                    )}
                                    
                                    {renderTagsSelector()}
                                </Box>
                            )}

                            {mode !== 'create' && task && (
                                <>
                                    <TabPanel value={selectedTab} index={1}>
                                        <SubtaskList 
                                            task={{
                                                ...task,
                                                subtasks: localSubtasks // Используем локальное состояние подзадач
                                            }} 
                                            onTaskUpdate={(updatedTask: Task) => {
                                                // Обновляем локальное состояние задачи и подзадач
                                                setTask(updatedTask as ExtendedTaskWithTypes);
                                                setLocalSubtasks([...updatedTask.subtasks || []]);
                                                // НЕ вызываем onTaskUpdate чтобы не закрывать модальное окно
                                            }}
                                            onLocalUpdate={(subtasks) => setLocalSubtasks([...subtasks])}
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
                                            canComment={hasCommentsPermission}
                                        />
                                    </TabPanel>
                                    <TabPanel value={selectedTab} index={3}>
                                        <TaskHistory task={task} />
                                    </TabPanel>
                                    <TabPanel value={selectedTab} index={4}>
                                        <TaskAttachments
                                            taskId={task.id}
                                            onTaskUpdate={updatedTask => {
                                                // Обновляем локальное состояние задачи, но НЕ передаем обновление родительскому компоненту
                                                // чтобы предотвратить закрытие модального окна
                                                if (updatedTask && updatedTask.attachments) {
                                                    const updatedTaskState = {
                                                        ...task,
                                                        attachments: updatedTask.attachments,
                                                        attachmentCount: updatedTask.attachmentCount || updatedTask.attachments.length
                                                    };
                                                    setTask(updatedTaskState as ExtendedTaskWithTypes);
                                                }
                                                
                                                // НЕ вызываем onTaskUpdate для предотвращения закрытия модального окна
                                                // if (onTaskUpdate) {
                                                //     onTaskUpdate(updatedTask);
                                                // }
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
                <DialogTitle>{t('taskModalSaveTemplateTitle')}</DialogTitle>
                <DialogContent>
                    <TextField
                        label={t('taskModalTemplateName')}
                        value={templateName}
                        onChange={(e) => setTemplateName(e.target.value)}
                        fullWidth
                        required
                        margin="normal"
                        helperText={t('taskModalTemplateNameHelp')}
                    />
                    <Box sx={{ mt: 2 }}>
                        <Typography variant="subtitle2">{t('taskModalTemplateWillInclude')}</Typography>
                        <ul>
                            <li>{t('taskModalTemplateTitle')} {title}</li>
                            <li>{t('taskModalTemplateDescription')}{description ? '' : t('taskModalTemplateDescriptionEmpty')}</li>
                                                                            <li>{t('taskModalTemplateType')} {taskTypes.find(type => type.id === selectedTypeId)?.name || t('taskModalNotSelected')}</li>
                                                          <li>{t('taskModalTemplateStatus')} {boardStatuses.find(status => status.id === selectedStatusId)?.name || t('taskModalNotSelected')}</li>
                            <li>{t('taskModalTemplatePriority')} {
                                priority === 'HIGH' ? t('taskModalHighPriority') :
                                priority === 'MEDIUM' ? t('taskModalMediumPriority') :
                                priority === 'LOW' ? t('taskModalLowPriority') :
                                t('taskModalNoPriority')
                            }</li>
                        </ul>
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setSaveTemplateDialogOpen(false)}>{t('taskModalTemplateCancel')}</Button>
                    <Button 
                        onClick={saveTemplate} 
                        variant="contained"
                        disabled={!templateName.trim()}
                    >
                        {t('taskModalTemplateSave')}
                    </Button>
                </DialogActions>
            </Dialog>
        </LocalizationProvider>
    );
};