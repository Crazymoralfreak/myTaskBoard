import React, { useState, useRef, useEffect, useCallback } from 'react';
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
    MenuItem
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { Task, CreateTaskRequest, TaskPriority } from '../../../types/task';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { ru } from 'date-fns/locale';
import { taskService } from '../../../services/taskService';
import { SubtaskList } from '../SubtaskList';
import { ConfirmDialog } from '../../shared/ConfirmDialog';

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
    boardStatuses?: Array<{
        id: number;
        name: string;
        color: string;
        isDefault: boolean;
        isCustom: boolean;
        position: number;
    }>;
}

export const TaskModal: React.FC<TaskModalProps> = ({
    open,
    onClose,
    mode: initialMode,
    task,
    columnId,
    onTaskCreate,
    onTaskUpdate,
    onTaskDelete,
    boardStatuses = []
}) => {
    const theme = useTheme();
    const fullScreen = useMediaQuery(theme.breakpoints.down('md'));
    
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [startDate, setStartDate] = useState<Date | null>(null);
    const [endDate, setEndDate] = useState<Date | null>(null);
    const [priority, setPriority] = useState<TaskPriority>('NONE');
    const [error, setError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [tabValue, setTabValue] = useState(0);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [mode, setMode] = useState<'create' | 'edit' | 'view'>(initialMode);
    const [selectedTab, setSelectedTab] = useState(0);
    const [errors, setErrors] = useState<{
        title?: string;
        dates?: string;
    }>({});

    useEffect(() => {
        if (open) {
            if (initialMode === 'create') {
                setMode('create');
                setTitle('');
                setDescription('');
                setStartDate(null);
                setEndDate(null);
                setPriority('NONE');
            } else if (task) {
                setMode(initialMode);
                setTitle(task.title);
                setDescription(task.description || '');
                setStartDate(task.startDate ? new Date(task.startDate) : null);
                setEndDate(task.endDate ? new Date(task.endDate) : null);
                setPriority(task.priority || 'NONE');
            }
            setSelectedTab(0);
            setErrors({});
            setError(null);
        }
    }, [open, initialMode, task]);

    const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
        setSelectedTab(newValue);
    };

    const validateForm = (): boolean => {
        const newErrors: { title?: string; dates?: string } = {};

        if (!title.trim()) {
            newErrors.title = 'Название задачи обязательно';
        }

        if (startDate && endDate && startDate > endDate) {
            newErrors.dates = 'Дата начала не может быть позже даты окончания';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleCreate = async () => {
        if (!validateForm() || !columnId || !onTaskCreate) {
            return;
        }

        try {
            setIsSubmitting(true);
            const newTask: Omit<CreateTaskRequest, 'columnId'> = {
                title: title.trim(),
                description: description.trim(),
                status: 'todo',
                priority: priority,
                tags: []
            };

            if (startDate) {
                newTask.startDate = startDate.toISOString();
            }
            if (endDate) {
                newTask.endDate = endDate.toISOString();
            }

            onTaskCreate(newTask);
            handleClose();
        } catch (error) {
            console.error('Failed to create task:', error);
            setError('Не удалось создать задачу');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleUpdate = async () => {
        if (!validateForm() || !task || !onTaskUpdate) {
            return;
        }

        try {
            setIsSubmitting(true);
            const updatedTask = {
                ...task,
                title: title.trim(),
                description: description.trim(),
                startDate: startDate ? startDate.toISOString() : null,
                endDate: endDate ? endDate.toISOString() : null,
                priority: priority
            };

            const result = await taskService.updateTask(task.id, updatedTask);
            onTaskUpdate(result);
            handleClose();
        } catch (error) {
            console.error('Failed to update task:', error);
            setError('Не удалось обновить задачу');
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
            setShowDeleteConfirm(false);
        }
    };

    const handleClose = () => {
        setTitle('');
        setDescription('');
        setStartDate(null);
        setEndDate(null);
        setPriority('NONE');
        setErrors({});
        setError(null);
        onClose();
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
        switch (mode) {
            case 'create':
                return (
                    <>
                        <Button onClick={handleClose}>Отмена</Button>
                        <Button 
                            onClick={handleCreate} 
                            variant="contained" 
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? <CircularProgress size={24} /> : 'Создать'}
                        </Button>
                    </>
                );
            case 'edit':
                return (
                    <>
                        <Button 
                            onClick={() => setShowDeleteConfirm(true)} 
                            color="error"
                            disabled={isSubmitting}
                        >
                            Удалить
                        </Button>
                        <Button onClick={handleClose}>Отмена</Button>
                        <Button 
                            onClick={handleUpdate} 
                            variant="contained" 
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? <CircularProgress size={24} /> : 'Сохранить'}
                        </Button>
                    </>
                );
            case 'view':
                return (
                    <>
                        {onTaskDelete && (
                            <Button 
                                onClick={() => setShowDeleteConfirm(true)} 
                                color="error"
                            >
                                Удалить
                            </Button>
                        )}
                        <Button onClick={handleClose}>Закрыть</Button>
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
                    </>
                );
            default:
                return <Button onClick={handleClose}>Закрыть</Button>;
        }
    };

    const isEditable = mode === 'create' || mode === 'edit';

    return (
        <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ru}>
            <Dialog 
                open={open} 
                onClose={handleClose} 
                maxWidth="md" 
                fullWidth
                fullScreen={fullScreen}
            >
                <DialogTitle>
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
                <DialogContent>
                    {mode !== 'create' && task && (
                        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
                            <Tabs value={selectedTab} onChange={handleTabChange}>
                                <Tab label="Основное" />
                                <Tab label="Подзадачи" />
                                <Tab label="Комментарии" />
                                <Tab label="История" />
                                <Tab label="Вложения" />
                            </Tabs>
                        </Box>
                    )}

                    {mode === 'create' || selectedTab === 0 ? (
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
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
                            <TextField
                                label="Описание"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                fullWidth
                                multiline
                                rows={3}
                                disabled={!isEditable}
                            />
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
                        </Box>
                    ) : null}

                    {mode !== 'create' && task && (
                        <>
                            <TabPanel value={selectedTab} index={1}>
                                <SubtaskList 
                                    task={task} 
                                    onTaskUpdate={(updatedTask: Task) => onTaskUpdate && onTaskUpdate(updatedTask)}
                                />
                            </TabPanel>
                            <TabPanel value={selectedTab} index={2}>
                                <Typography>Комментарии будут здесь</Typography>
                            </TabPanel>
                            <TabPanel value={selectedTab} index={3}>
                                <Typography>История будет здесь</Typography>
                            </TabPanel>
                            <TabPanel value={selectedTab} index={4}>
                                <Typography>Вложения будут здесь</Typography>
                            </TabPanel>
                        </>
                    )}

                    {error && (
                        <Box sx={{ mt: 2 }}>
                            <Typography color="error">{error}</Typography>
                        </Box>
                    )}
                </DialogContent>
                <DialogActions>
                    {renderDialogActions()}
                </DialogActions>
            </Dialog>

            <ConfirmDialog
                open={showDeleteConfirm}
                title="Удалить задачу"
                message="Вы уверены, что хотите удалить эту задачу? Это действие нельзя отменить."
                onConfirm={handleDelete}
                onClose={() => setShowDeleteConfirm(false)}
                loading={isSubmitting}
                actionType="delete"
            />
        </LocalizationProvider>
    );
}; 