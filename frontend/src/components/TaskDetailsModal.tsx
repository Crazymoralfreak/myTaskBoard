import React, { useState, useRef, useEffect } from 'react';
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
    List,
    ListItem,
    ListItemText,
    ListItemIcon,
    ListItemSecondaryAction,
    Menu,
    MenuItem,
    CircularProgress,
    Paper,
    Tooltip,
    Autocomplete,
    LinearProgress,
    Avatar,
    useTheme,
    useMediaQuery,
    ListItemAvatar
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import SendIcon from '@mui/icons-material/Send';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import StopIcon from '@mui/icons-material/Stop';
import LinkIcon from '@mui/icons-material/Link';
import NotificationsIcon from '@mui/icons-material/Notifications';
import NotificationsOffIcon from '@mui/icons-material/NotificationsOff';
import AddIcon from '@mui/icons-material/Add';
import CheckBoxIcon from '@mui/icons-material/CheckBox';
import { Task, TaskComment, TaskAttachment, TaskHistory } from '../types/task';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { taskService } from '../services/taskService';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { ConfirmDialog } from './ConfirmDialog';
import { formatDuration } from '../utils/formatters';
import { SubtaskList } from './SubtaskList/SubtaskList';
import FormatBoldIcon from '@mui/icons-material/FormatBold';
import FormatItalicIcon from '@mui/icons-material/FormatItalic';
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';
import FormatListNumberedIcon from '@mui/icons-material/FormatListNumbered';
import VisibilityIcon from '@mui/icons-material/Visibility';
import ReactMarkdown from 'react-markdown';
import { userService } from '../services/userService';

interface TaskDetailsModalProps {
    open: boolean;
    onClose: () => void;
    task: Task;
    onTaskUpdate: (updatedTask: Task) => void;
    onTaskDelete: (taskId: number) => void;
    boardStatuses: Array<{
        id: number;
        name: string;
        color: string;
        isDefault: boolean;
        isCustom: boolean;
        position: number;
    }>;
}

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

export const TaskDetailsModal = ({
    open,
    onClose,
    task,
    onTaskUpdate,
    onTaskDelete,
    boardStatuses
}: TaskDetailsModalProps): React.ReactElement => {
    const theme = useTheme();
    const fullScreen = useMediaQuery(theme.breakpoints.down('md'));
    const [isEditing, setIsEditing] = useState(false);
    const [editedTask, setEditedTask] = useState<Task>(task);
    const [selectedTab, setSelectedTab] = useState(0);
    const [newComment, setNewComment] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [newTag, setNewTag] = useState('');
    const [statusAnchorEl, setStatusAnchorEl] = useState<null | HTMLElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [uploadProgress, setUploadProgress] = useState<number | null>(null);
    const [showPreview, setShowPreview] = useState(false);
    const [isDirty, setIsDirty] = useState(false);
    const autoSaveTimeoutRef = useRef<NodeJS.Timeout>();
    const [showConfirmClose, setShowConfirmClose] = useState(false);
    const [showCommentPreview, setShowCommentPreview] = useState(false);
    const [showMentions, setShowMentions] = useState(false);
    const [mentionUsers, setMentionUsers] = useState<Array<{
        id: number;
        username: string;
        avatarUrl?: string;
    }>>([]);

    useEffect(() => {
        setEditedTask(task);
    }, [task]);

    useEffect(() => {
        if (open && task.id) {
            const draft = localStorage.getItem(`task_draft_${task.id}`);
            if (draft) {
                const parsedDraft = JSON.parse(draft);
                setEditedTask(parsedDraft);
                setIsDirty(true);
            }
        }
    }, [open, task.id]);

    useEffect(() => {
        if (isEditing && isDirty) {
            if (autoSaveTimeoutRef.current) {
                clearTimeout(autoSaveTimeoutRef.current);
            }
            autoSaveTimeoutRef.current = setTimeout(() => {
                localStorage.setItem(`task_draft_${task.id}`, JSON.stringify(editedTask));
            }, 1000);
        }
        return () => {
            if (autoSaveTimeoutRef.current) {
                clearTimeout(autoSaveTimeoutRef.current);
            }
        };
    }, [editedTask, isEditing, isDirty, task.id]);

    const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
        setSelectedTab(newValue);
    };

    const handleSave = async () => {
        try {
            setIsSubmitting(true);
            // Проверяем и форматируем даты перед отправкой
            const taskToUpdate = {
                ...editedTask,
                startDate: editedTask.startDate ? new Date(editedTask.startDate).toISOString() : null,
                endDate: editedTask.endDate ? new Date(editedTask.endDate).toISOString() : null
            };
            const updatedTask = await taskService.updateTask(task.id, taskToUpdate);
            onTaskUpdate(updatedTask);
            setIsEditing(false);
            setIsDirty(false);
            localStorage.removeItem(`task_draft_${task.id}`);
        } catch (error) {
            console.error('Failed to update task:', error);
            setError('Не удалось обновить задачу');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async () => {
        try {
            setIsSubmitting(true);
            await taskService.deleteTask(task.id.toString());
            onTaskDelete(task.id);
            onClose();
        } catch (error) {
            setError('Не удалось удалить задачу');
        } finally {
            setIsSubmitting(false);
            setShowDeleteConfirm(false);
        }
    };

    const handleCommentSubmit = async () => {
        if (!newComment.trim()) return;
        
        try {
            setIsSubmitting(true);
            const updatedTask = await taskService.addComment(task.id, newComment);
            onTaskUpdate(updatedTask);
            setNewComment('');
            setShowCommentPreview(false);
        } catch (error) {
            console.error('Error adding comment:', error);
            // TODO: Add error notification
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        try {
            setUploadProgress(0);
            const updatedTask = await taskService.uploadFile(task.id, file, (progress) => {
                setUploadProgress(progress);
            });
            onTaskUpdate(updatedTask);
        } catch (error) {
            setError('Не удалось загрузить файл');
        } finally {
            setUploadProgress(null);
        }
    };

    const handleTagAdd = async () => {
        if (!newTag.trim()) return;
        
        const updatedTags = [...(editedTask.tags || []), newTag.trim()];
        try {
            const updatedTask = await taskService.updateTask(task.id, { tags: updatedTags });
            onTaskUpdate(updatedTask);
            setNewTag('');
        } catch (error) {
            setError('Не удалось добавить тег');
        }
    };

    const handleTagDelete = async (tagToDelete: string) => {
        const updatedTags = (editedTask.tags || []).filter(tag => tag !== tagToDelete);
        try {
            const updatedTask = await taskService.updateTask(task.id, { tags: updatedTags });
            onTaskUpdate(updatedTask);
        } catch (error) {
            setError('Не удалось удалить тег');
        }
    };

    const handleStatusChange = async (statusId: number) => {
        try {
            const newStatus = boardStatuses.find(status => status.id === statusId);
            if (!newStatus) return;

            const updatedTask = await taskService.updateTask(task.id, { 
                customStatus: newStatus
            });
            onTaskUpdate(updatedTask);
        } catch (error) {
            setError('Не удалось обновить статус');
        } finally {
            setStatusAnchorEl(null);
        }
    };

    const formatDate = (date: string) => {
        return format(new Date(date), 'dd MMMM yyyy HH:mm', { locale: ru });
    };

    const handleDescriptionKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Tab') {
            e.preventDefault();
            const target = e.target as HTMLTextAreaElement;
            const start = target.selectionStart;
            const end = target.selectionEnd;
            const newValue = editedTask.description.substring(0, start) + '    ' + editedTask.description.substring(end);
            setEditedTask({ ...editedTask, description: newValue });
            // Устанавливаем курсор после вставленных пробелов
            setTimeout(() => {
                target.selectionStart = target.selectionEnd = start + 4;
            });
        }
    };

    const handleFormatClick = (format: string) => {
        const textarea = document.querySelector('textarea') as HTMLTextAreaElement;
        if (!textarea) return;

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const selectedText = editedTask.description.substring(start, end);

        let newText = '';
        switch (format) {
            case 'bold':
                newText = `**${selectedText}**`;
                break;
            case 'italic':
                newText = `_${selectedText}_`;
                break;
            case 'bullet':
                newText = selectedText.split('\n').map(line => `• ${line}`).join('\n');
                break;
            case 'number':
                newText = selectedText.split('\n').map((line, i) => `${i + 1}. ${line}`).join('\n');
                break;
            default:
                return;
        }

        const newValue = editedTask.description.substring(0, start) + newText + editedTask.description.substring(end);
        setEditedTask({ ...editedTask, description: newValue });
    };

    const parseMarkdown = (text: string) => {
        return text
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/_(.*?)_/g, '<em>$1</em>')
            .replace(/^• (.*)$/gm, '<li>$1</li>')
            .replace(/^(\d+)\. (.*)$/gm, '<li>$2</li>')
            .split('\n').join('<br />');
    };

    const handleTaskChange = (changes: Partial<Task>) => {
        setEditedTask(prev => ({ ...prev, ...changes }));
        setIsDirty(true);
    };

    const handleClose = () => {
        if (isDirty) {
            setShowConfirmClose(true);
        } else {
            onClose();
        }
    };

    const handleCommentFormat = (format: string) => {
        const textarea = document.querySelector('textarea') as HTMLTextAreaElement;
        if (!textarea) return;

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const selectedText = newComment.substring(start, end);

        let newText = '';
        switch (format) {
            case 'bold':
                newText = `**${selectedText}**`;
                break;
            case 'italic':
                newText = `_${selectedText}_`;
                break;
            case 'bullet':
                newText = selectedText.split('\n').map(line => `• ${line}`).join('\n');
                break;
            case 'number':
                newText = selectedText.split('\n').map((line, i) => `${i + 1}. ${line}`).join('\n');
                break;
            default:
                return;
        }

        const updatedComment = newComment.substring(0, start) + newText + newComment.substring(end);
        setNewComment(updatedComment);
    };

    const handleMentionSearch = async (text: string) => {
        const lastWord = text.split(/\s/).pop() || '';
        if (lastWord.startsWith('@') && lastWord.length > 1) {
            try {
                // Здесь должен быть запрос к API для поиска пользователей
                const users = await userService.searchUsers(lastWord.substring(1));
                setMentionUsers(users);
                setShowMentions(true);
            } catch (error) {
                console.error('Failed to search users:', error);
            }
        } else {
            setShowMentions(false);
        }
    };

    const handleMentionSelect = (user: { id: number; username: string }) => {
        const words = newComment.split(/\s/);
        words[words.length - 1] = `@${user.username}`;
        setNewComment(words.join(' ') + ' ');
        setShowMentions(false);
    };

    return (
        <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ru}>
            <Dialog 
                open={open} 
                onClose={handleClose}
                maxWidth="lg"
                fullWidth
                fullScreen={fullScreen}
                PaperProps={{
                    sx: {
                        minHeight: '80vh',
                        maxHeight: '90vh'
                    }
                }}
            >
                <DialogTitle>
                    {isEditing ? (
                        <TextField
                            fullWidth
                            value={editedTask.title}
                            onChange={(e) => handleTaskChange({ title: e.target.value })}
                            variant="standard"
                            sx={{ fontSize: '1.5rem' }}
                        />
                    ) : (
                        <Typography variant="h5">
                            {editedTask.title}
                            {isDirty && (
                                <Chip 
                                    label="Черновик" 
                                    size="small" 
                                    color="warning" 
                                    sx={{ ml: 1 }}
                                />
                            )}
                        </Typography>
                    )}
                </DialogTitle>

                <DialogContent dividers>
                    <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                        <Tabs value={selectedTab} onChange={handleTabChange}>
                            <Tab label="Основное" />
                            <Tab label="Комментарии" />
                            <Tab label="Файлы" />
                            <Tab label="Подзадачи" />
                            <Tab label="История" />
                        </Tabs>
                    </Box>

                    <TabPanel value={selectedTab} index={0}>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                            {/* Статус */}
                            <Box>
                                <Typography variant="subtitle2" gutterBottom>
                                    Статус
                                </Typography>
                                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                                    {boardStatuses.map((status) => (
                                        <Chip
                                            key={status.id}
                                            label={status.name}
                                            onClick={() => isEditing && setEditedTask({ ...editedTask, customStatus: status })}
                                            sx={{
                                                backgroundColor: status.color,
                                                color: '#fff',
                                                opacity: editedTask.customStatus?.id === status.id ? 1 : 0.6,
                                                cursor: isEditing ? 'pointer' : 'default'
                                            }}
                                        />
                                    ))}
                                </Box>
                            </Box>

                            {/* Описание */}
                            <Box>
                                <Typography variant="subtitle2" gutterBottom>
                                    Описание
                                </Typography>
                                {isEditing && (
                                    <Paper variant="outlined" sx={{ p: 1, mb: 1 }}>
                                        <Box sx={{ display: 'flex', gap: 1 }}>
                                            <IconButton 
                                                size="small"
                                                onClick={() => handleFormatClick('bold')}
                                            >
                                                <FormatBoldIcon />
                                            </IconButton>
                                            <IconButton 
                                                size="small"
                                                onClick={() => handleFormatClick('italic')}
                                            >
                                                <FormatItalicIcon />
                                            </IconButton>
                                            <IconButton 
                                                size="small"
                                                onClick={() => handleFormatClick('bullet')}
                                            >
                                                <FormatListBulletedIcon />
                                            </IconButton>
                                            <IconButton 
                                                size="small"
                                                onClick={() => handleFormatClick('number')}
                                            >
                                                <FormatListNumberedIcon />
                                            </IconButton>
                                            <Divider orientation="vertical" flexItem />
                                            <IconButton 
                                                size="small"
                                                onClick={() => setShowPreview(!showPreview)}
                                                color={showPreview ? "primary" : "default"}
                                            >
                                                <Tooltip title="Предпросмотр">
                                                    <VisibilityIcon />
                                                </Tooltip>
                                            </IconButton>
                                        </Box>
                                    </Paper>
                                )}
                                {isEditing ? (
                                    showPreview ? (
                                        <Paper 
                                            variant="outlined" 
                                            sx={{ 
                                                p: 2,
                                                minHeight: '200px',
                                                bgcolor: 'grey.50',
                                                '& ul, & ol': { pl: 2 }
                                            }}
                                        >
                                            <div 
                                                dangerouslySetInnerHTML={{ 
                                                    __html: parseMarkdown(editedTask.description || '') 
                                                }} 
                                            />
                                        </Paper>
                                    ) : (
                                        <TextField
                                            fullWidth
                                            multiline
                                            minRows={4}
                                            maxRows={15}
                                            value={editedTask.description}
                                            onChange={(e) => handleTaskChange({ description: e.target.value })}
                                            onKeyDown={handleDescriptionKeyDown}
                                            variant="outlined"
                                            placeholder="Добавьте описание задачи..."
                                            sx={{
                                                '& .MuiInputBase-root': {
                                                    fontFamily: 'monospace'
                                                }
                                            }}
                                        />
                                    )
                                ) : (
                                    <div 
                                        dangerouslySetInnerHTML={{ 
                                            __html: parseMarkdown(editedTask.description || 'Описание отсутствует') 
                                        }}
                                        style={{ 
                                            whiteSpace: 'pre-wrap',
                                            fontFamily: 'inherit',
                                            padding: '16px',
                                            backgroundColor: theme.palette.grey[50],
                                            borderRadius: '4px'
                                        }}
                                    />
                                )}
                            </Box>

                            {/* Даты */}
                            <Box sx={{ display: 'flex', gap: 2 }}>
                                <DateTimePicker
                                    label="Дата начала"
                                    value={editedTask.startDate ? new Date(editedTask.startDate) : null}
                                    onChange={(newValue) => isEditing && handleTaskChange({ 
                                        startDate: newValue ? newValue.toISOString() : null 
                                    })}
                                    disabled={!isEditing}
                                    slotProps={{
                                        textField: { fullWidth: true }
                                    }}
                                />
                                <DateTimePicker
                                    label="Дата окончания"
                                    value={editedTask.endDate ? new Date(editedTask.endDate) : null}
                                    onChange={(newValue) => isEditing && handleTaskChange({ 
                                        endDate: newValue ? newValue.toISOString() : null 
                                    })}
                                    disabled={!isEditing}
                                    slotProps={{
                                        textField: { fullWidth: true }
                                    }}
                                />
                            </Box>

                            {/* Теги */}
                            <Box>
                                <Typography variant="subtitle2" gutterBottom>
                                    Теги
                                </Typography>
                                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 1 }}>
                                    {editedTask.tags?.map((tag) => (
                                        <Chip
                                            key={tag}
                                            label={tag}
                                            onDelete={isEditing ? () => handleTagDelete(tag) : undefined}
                                        />
                                    ))}
                                </Box>
                                {isEditing && (
                                    <TextField
                                        size="small"
                                        placeholder="Добавить тег..."
                                        value={newTag}
                                        onChange={(e) => setNewTag(e.target.value)}
                                        onKeyPress={(e) => {
                                            if (e.key === 'Enter' && newTag.trim()) {
                                                handleTagAdd();
                                            }
                                        }}
                                    />
                                )}
                            </Box>
                        </Box>
                    </TabPanel>

                    <TabPanel value={selectedTab} index={1}>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            {/* Список комментариев */}
                            {task.comments?.map((comment) => (
                                <Paper key={comment.id} variant="outlined" sx={{ p: 2 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                        <Avatar 
                                            src={comment.author.avatarUrl} 
                                            sx={{ width: 24, height: 24 }}
                                        >
                                            {comment.author.username[0]}
                                        </Avatar>
                                        <Typography variant="subtitle2">
                                            {comment.author.username}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">
                                            {formatDate(comment.createdAt)}
                                        </Typography>
                                    </Box>
                                    <div 
                                        dangerouslySetInnerHTML={{ 
                                            __html: parseMarkdown(comment.content) 
                                        }}
                                        style={{ 
                                            whiteSpace: 'pre-wrap'
                                        }}
                                    />
                                </Paper>
                            ))}

                            {/* Форма добавления комментария */}
                            <Paper variant="outlined" sx={{ p: 2 }}>
                                <Box sx={{ mb: 1 }}>
                                    <Paper variant="outlined" sx={{ p: 1, mb: 1 }}>
                                        <Box sx={{ display: 'flex', gap: 1 }}>
                                            <IconButton 
                                                size="small"
                                                onClick={() => handleCommentFormat('bold')}
                                            >
                                                <FormatBoldIcon />
                                            </IconButton>
                                            <IconButton 
                                                size="small"
                                                onClick={() => handleCommentFormat('italic')}
                                            >
                                                <FormatItalicIcon />
                                            </IconButton>
                                            <IconButton 
                                                size="small"
                                                onClick={() => handleCommentFormat('bullet')}
                                            >
                                                <FormatListBulletedIcon />
                                            </IconButton>
                                            <IconButton 
                                                size="small"
                                                onClick={() => handleCommentFormat('number')}
                                            >
                                                <FormatListNumberedIcon />
                                            </IconButton>
                                            <Divider orientation="vertical" flexItem />
                                            <IconButton 
                                                size="small"
                                                onClick={() => setShowCommentPreview(!showCommentPreview)}
                                                color={showCommentPreview ? "primary" : "default"}
                                            >
                                                <Tooltip title="Предпросмотр">
                                                    <VisibilityIcon />
                                                </Tooltip>
                                            </IconButton>
                                        </Box>
                                    </Paper>
                                    {showCommentPreview ? (
                                        <Paper 
                                            variant="outlined" 
                                            sx={{ 
                                                p: 2,
                                                minHeight: '100px',
                                                bgcolor: 'grey.50'
                                            }}
                                        >
                                            <div 
                                                dangerouslySetInnerHTML={{ 
                                                    __html: parseMarkdown(newComment) 
                                                }}
                                            />
                                        </Paper>
                                    ) : (
                                        <TextField
                                            fullWidth
                                            multiline
                                            minRows={2}
                                            maxRows={8}
                                            value={newComment}
                                            onChange={(e) => {
                                                setNewComment(e.target.value);
                                                handleMentionSearch(e.target.value);
                                            }}
                                            onKeyDown={(e) => {
                                                if (e.key === '@') {
                                                    setShowMentions(true);
                                                }
                                            }}
                                            placeholder="Добавить комментарий... Используйте @ для упоминания пользователей"
                                            sx={{
                                                '& .MuiInputBase-root': {
                                                    fontFamily: 'monospace'
                                                }
                                            }}
                                        />
                                    )}
                                </Box>
                                <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                                    <Button
                                        variant="contained"
                                        endIcon={<SendIcon />}
                                        onClick={handleCommentSubmit}
                                        disabled={!newComment.trim() || isSubmitting}
                                    >
                                        Отправить
                                    </Button>
                                </Box>
                            </Paper>
                        </Box>
                    </TabPanel>

                    <TabPanel value={selectedTab} index={2}>
                        <List>
                            {task.history && task.history.length > 0 ? (
                                task.history.map((entry) => (
                                    <ListItem key={entry.id}>
                                        <ListItemAvatar>
                                            <Avatar src={entry.avatarUrl} alt={entry.username}>
                                                {entry.username[0].toUpperCase()}
                                            </Avatar>
                                        </ListItemAvatar>
                                        <ListItemText
                                            primary={
                                                <Typography variant="body1">
                                                    <strong>{entry.username}</strong>
                                                    {' '}
                                                    {entry.action === 'created' && 'создал(а) задачу'}
                                                    {entry.action === 'updated' && 'обновил(а) задачу'}
                                                    {entry.action === 'comment_added' && 'добавил(а) комментарий'}
                                                    {entry.action === 'file_added' && 'прикрепил(а) файл'}
                                                </Typography>
                                            }
                                            secondary={
                                                <Typography variant="body2" color="textSecondary">
                                                    {new Date(entry.timestamp).toLocaleString('ru-RU')}
                                                </Typography>
                                            }
                                        />
                                    </ListItem>
                                ))
                            ) : (
                                <Typography variant="body1" color="textSecondary" sx={{ p: 2 }}>
                                    История пуста
                                </Typography>
                            )}
                        </List>
                    </TabPanel>

                    <TabPanel value={selectedTab} index={3}>
                        <SubtaskList task={task} onTaskUpdate={onTaskUpdate} />
                    </TabPanel>

                    <TabPanel value={selectedTab} index={4}>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            {task.history?.map((entry) => (
                                <Paper key={entry.id} variant="outlined" sx={{ p: 2 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                        <Avatar 
                                            src={entry.avatarUrl} 
                                            sx={{ width: 24, height: 24 }}
                                        >
                                            {entry.username[0]}
                                        </Avatar>
                                        <Typography variant="subtitle2">
                                            {entry.username}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">
                                            {new Date(entry.timestamp).toLocaleString('ru-RU')}
                                        </Typography>
                                    </Box>
                                    
                                    {entry.action === 'created' && (
                                        <Typography>
                                            создал(а) задачу
                                        </Typography>
                                    )}
                                    
                                    {entry.action === 'updated' && entry.changes && (
                                        <Box>
                                            <Typography>
                                                изменил(а) {entry.changes.field}
                                            </Typography>
                                            {entry.changes.oldValue && entry.changes.newValue && (
                                                <Box sx={{ 
                                                    display: 'flex', 
                                                    gap: 2, 
                                                    mt: 1,
                                                    bgcolor: 'grey.50',
                                                    p: 1,
                                                    borderRadius: 1
                                                }}>
                                                    <Box>
                                                        <Typography variant="caption" color="text.secondary">
                                                            Было:
                                                        </Typography>
                                                        <Typography>
                                                            {entry.changes.oldValue || '(пусто)'}
                                                        </Typography>
                                                    </Box>
                                                    <Divider orientation="vertical" flexItem />
                                                    <Box>
                                                        <Typography variant="caption" color="text.secondary">
                                                            Стало:
                                                        </Typography>
                                                        <Typography>
                                                            {entry.changes.newValue || '(пусто)'}
                                                        </Typography>
                                                    </Box>
                                                </Box>
                                            )}
                                        </Box>
                                    )}
                                    
                                    {entry.action === 'comment_added' && (
                                        <Typography>
                                            добавил(а) комментарий
                                        </Typography>
                                    )}
                                    
                                    {entry.action === 'file_added' && (
                                        <Typography>
                                            прикрепил(а) файл
                                        </Typography>
                                    )}
                                </Paper>
                            ))}
                            {!task.history?.length && (
                                <Typography color="text.secondary" align="center">
                                    История изменений пуста
                                </Typography>
                            )}
                        </Box>
                    </TabPanel>
                </DialogContent>

                <DialogActions sx={{ p: 2, gap: 1 }}>
                    {isEditing ? (
                        <>
                            <Button onClick={() => setIsEditing(false)}>
                                Отмена
                            </Button>
                            <Button 
                                variant="contained" 
                                color="primary"
                                onClick={handleSave}
                            >
                                Сохранить
                            </Button>
                        </>
                    ) : (
                        <>
                            <Button
                                color="error"
                                startIcon={<DeleteIcon />}
                                onClick={() => setShowDeleteConfirm(true)}
                            >
                                Удалить
                            </Button>
                            <Button onClick={handleClose}>
                                Закрыть
                            </Button>
                            <Button 
                                variant="contained" 
                                color="primary"
                                onClick={() => setIsEditing(true)}
                            >
                                Редактировать
                            </Button>
                        </>
                    )}
                </DialogActions>
            </Dialog>

            <ConfirmDialog
                open={showDeleteConfirm}
                onClose={() => setShowDeleteConfirm(false)}
                onConfirm={handleDelete}
                title="Удалить задачу"
                message="Вы уверены, что хотите удалить эту задачу? Это действие нельзя отменить."
                loading={isSubmitting}
                actionType="delete"
            />

            <ConfirmDialog
                open={showConfirmClose}
                onClose={() => setShowConfirmClose(false)}
                onConfirm={() => {
                    setShowConfirmClose(false);
                    onClose();
                }}
                title="Несохраненные изменения"
                message="У вас есть несохраненные изменения. Черновик будет сохранен автоматически. Вы уверены, что хотите закрыть окно?"
                actionType="edit"
            />
        </LocalizationProvider>
    );
}; 