import React, { useState, useEffect, useRef } from 'react';
import {
    Box,
    Typography,
    Button,
    List,
    ListItem,
    ListItemText,
    ListItemIcon,
    ListItemSecondaryAction,
    IconButton,
    Paper,
    CircularProgress,
    Divider,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Alert,
    Card,
    CardContent,
    CardMedia,
    CardActionArea,
    CardActions,
    Stack,
    Tooltip,
    Chip,
    useMediaQuery,
    Fade,
    useTheme,
    alpha
} from '@mui/material';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import DownloadIcon from '@mui/icons-material/Download';
import DeleteIcon from '@mui/icons-material/Delete';
import DescriptionIcon from '@mui/icons-material/Description';
import ImageIcon from '@mui/icons-material/Image';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import RefreshIcon from '@mui/icons-material/Refresh';
import VisibilityIcon from '@mui/icons-material/Visibility';
import FolderOpenIcon from '@mui/icons-material/FolderOpen';
import CloseIcon from '@mui/icons-material/Close';
import PlayCircleIcon from '@mui/icons-material/PlayCircle';
import { Task, TaskAttachment } from '../../../types/task';
import { ConfirmDialog } from '../../shared/ConfirmDialog';
import { taskService } from '../../../services/taskService';
import { formatFileSize } from '../../../utils/fileUtils';
import { getAttachmentUrl } from '../../../utils/attachmentUtils';

interface TextFilePreviewProps {
    url: string;
    filename: string;
}

const TextFilePreview: React.FC<TextFilePreviewProps> = ({ url, filename }) => {
    const [content, setContent] = useState<string>('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const loadTextContent = async () => {
            try {
                setLoading(true);
                setError(null);
                
                const response = await fetch(url);
                if (!response.ok) {
                    throw new Error('Не удалось загрузить файл');
                }
                
                const text = await response.text();
                setContent(text);
            } catch (err) {
                console.error('Ошибка при загрузке текстового файла:', err);
                setError('Не удалось загрузить содержимое файла');
            } finally {
                setLoading(false);
            }
        };

        loadTextContent();
    }, [url]);

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '70vh' }}>
                <CircularProgress />
                <Typography sx={{ ml: 2 }}>Загрузка содержимого файла...</Typography>
            </Box>
        );
    }

    if (error) {
        return (
            <Box sx={{ textAlign: 'center', p: 3 }}>
                <Typography color="error" sx={{ mb: 2 }}>{error}</Typography>
                <Button variant="outlined" onClick={() => window.location.reload()}>
                    Попробовать снова
                </Button>
            </Box>
        );
    }

    return (
        <Paper sx={{ p: 2, maxHeight: '70vh', overflow: 'auto' }}>
            <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 'bold' }}>
                {filename}
            </Typography>
            <Typography 
                variant="body2" 
                component="pre" 
                sx={{ 
                    whiteSpace: 'pre-wrap',
                    fontFamily: 'monospace',
                    fontSize: '0.875rem',
                    lineHeight: 1.5,
                    wordBreak: 'break-word'
                }}
            >
                {content}
            </Typography>
        </Paper>
    );
};

interface TaskAttachmentsProps {
    taskId: number;
    onTaskUpdate?: (updatedTask: Task) => void;
}

/**
 * Компонент для работы с вложениями задачи
 */
export const TaskAttachments: React.FC<TaskAttachmentsProps> = ({ taskId, onTaskUpdate }) => {
    const [attachments, setAttachments] = useState<TaskAttachment[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [uploadProgress, setUploadProgress] = useState<number | null>(null);
    const [selectedAttachmentId, setSelectedAttachmentId] = useState<number | null>(null);
    const [confirmDelete, setConfirmDelete] = useState(false);
    const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
    const [previewAttachment, setPreviewAttachment] = useState<TaskAttachment | null>(null);
    const [isDragOver, setIsDragOver] = useState(false);
    
    const fileInputRef = useRef<HTMLInputElement>(null);
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    
    // Индикатор, что это темная тема
    const isDarkTheme = theme.palette.mode === 'dark';
    
    // Загрузка вложений из задачи
    const loadTaskAttachments = async () => {
        if (!taskId) return;
        
        setLoading(true);
        setError(null);
        
        try {
            const loadedTask = await taskService.getTask(taskId);
            
            if (loadedTask && loadedTask.attachments) {
                setAttachments(loadedTask.attachments);
            } else {
                setAttachments([]);
            }
        } catch (err) {
            console.error('Ошибка при загрузке вложений:', err);
            setError('Не удалось загрузить список вложений');
        } finally {
            setLoading(false);
        }
    };
    
    // Загрузка вложений при монтировании компонента
    useEffect(() => {
        loadTaskAttachments();
    }, [taskId]);
    
    // Обработчик клика по кнопке добавления файла
    const handleAttachButtonClick = () => {
        fileInputRef.current?.click();
    };
    
    // Обработка выбора файла
    const handleFileSelected = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files;
        if (!files || files.length === 0) return;
        
        const file = files[0];
        setUploadProgress(0);
        
        try {
            // Загрузка файла через API
            const updatedTask = await taskService.uploadFile(
                taskId, 
                file, 
                (progress) => setUploadProgress(progress)
            );
            
            // Обновляем список вложений
            if (updatedTask && updatedTask.attachments) {
                setAttachments(updatedTask.attachments);
            } else {
                // Если вложения не вернулись с сервера, перезагружаем задачу
                loadTaskAttachments();
            }
            
            // НЕ обновляем родительский компонент для предотвращения дублирования записей в истории
            // История уже автоматически записывается на Backend при загрузке файла
            
        } catch (err) {
            console.error('Ошибка при загрузке файла:', err);
            setError('Не удалось загрузить файл');
        } finally {
            setUploadProgress(null);
            
            // Сбрасываем input file, чтобы можно было загрузить тот же файл повторно
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };
    
    // Обработка клика по кнопке удаления вложения
    const handleDeleteClick = (attachmentId: number) => {
        setSelectedAttachmentId(attachmentId);
        setConfirmDelete(true);
    };
    
    // Обработка подтверждения удаления вложения
    const handleConfirmDelete = async () => {
        if (selectedAttachmentId === null) return;
        
        try {
            setLoading(true);
            
            // Удаление файла через API
            const updatedTask = await taskService.deleteFile(taskId, selectedAttachmentId);
            
            // Обновляем список вложений
            if (updatedTask && updatedTask.attachments) {
                setAttachments(updatedTask.attachments);
            } else {
                // Если вложения не вернулись, удаляем локально
                setAttachments(prev => prev.filter(attachment => 
                    attachment.id !== selectedAttachmentId
                ));
                
                // Перезагружаем задачу для получения актуальных данных
                loadTaskAttachments();
            }
            
            // НЕ обновляем родительский компонент, чтобы избежать дублирования записей истории
            // onTaskUpdate уже был обновлен в TaskModal для предотвращения закрытия модального окна
            
        } catch (err) {
            console.error('Ошибка при удалении файла:', err);
            setError('Не удалось удалить файл');
        } finally {
            setLoading(false);
            setSelectedAttachmentId(null);
            setConfirmDelete(false);
        }
    };
    
    // Функция для принудительного скачивания файла
    const handleDownload = async (attachment: TaskAttachment) => {
        const url = getAttachmentUrl(attachment.url);
        if (!url) return;
        
        try {
            // Для надёжного скачивания используем fetch + blob
            const response = await fetch(url);
            if (!response.ok) throw new Error('Network response was not ok');
            
            const blob = await response.blob();
            const blobUrl = window.URL.createObjectURL(blob);
            
            // Создаем временную ссылку для скачивания
            const link = document.createElement('a');
            link.href = blobUrl;
            link.download = attachment.filename;
            link.style.display = 'none';
            
            // Добавляем ссылку в DOM, кликаем и удаляем
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            // Освобождаем память
            window.URL.revokeObjectURL(blobUrl);
        } catch (error) {
            console.error('Ошибка при скачивании файла:', error);
            // Fallback: пробуем старый метод
            const link = document.createElement('a');
            link.href = url;
            link.download = attachment.filename;
            link.target = '_blank';
            link.style.display = 'none';
            
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    };
    
    // Обработка клика для просмотра вложения
    const handlePreviewClick = (attachment: TaskAttachment) => {
        setPreviewAttachment(attachment);
        setPreviewDialogOpen(true);
    };
    
    // Форматирование размера файла
    const formatFileSizeHelper = (bytes: number) => {
        return formatFileSize(bytes);
    };
    
    // Определение иконки для типа файла
    const getFileIcon = (type: string) => {
        if (type.startsWith('image/')) {
            return <ImageIcon />;
        } else if (type.startsWith('video/')) {
            return <PlayCircleIcon />;
        } else if (type === 'application/pdf') {
            return <PictureAsPdfIcon />;
        } else if (type.startsWith('text/') || 
                  type === 'application/msword' || 
                  type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
            return <DescriptionIcon />;
        } else {
            return <InsertDriveFileIcon />;
        }
    };
    
    // Форматирование даты
    const formatDate = (dateString: string) => {
        try {
            const date = new Date(dateString);
            return date.toLocaleString('ru-RU', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch (e) {
            return dateString;
        }
    };
    
    // Проверка, может ли файл быть предпросмотрен
    const canPreview = (type: string, filename?: string) => {
        // Поддерживаем изображения и текстовые файлы
        if (type.startsWith('image/') || type.startsWith('text/') || type.startsWith('video/')) {
            return true;
        }
        
        // Проверяем по расширению файла для дополнительных текстовых типов
        if (filename) {
            const extension = filename.toLowerCase().split('.').pop();
            return ['txt', 'log'].includes(extension || '');
        }
        
        return false;
    };
    
    // Определение цвета для типа файла
    const getFileTypeColor = (type: string) => {
        if (type.startsWith('image/')) {
            return theme.palette.success.main;
        } else if (type.startsWith('video/')) {
            return theme.palette.secondary.main;
        } else if (type === 'application/pdf') {
            return theme.palette.error.main;
        } else if (type.startsWith('text/')) {
            return theme.palette.info.main;
        } else if (type.includes('excel') || type.includes('spreadsheet')) {
            return theme.palette.success.main;
        } else if (type.includes('word') || type.includes('document')) {
            return theme.palette.primary.main;
        } else {
            return theme.palette.grey[500];
        }
    };
    
    // Получение расширения файла из имени
    const getFileExtension = (filename: string) => {
        return filename.split('.').pop()?.toUpperCase() || '';
    };
    
    // Рендеринг содержимого предпросмотра
    const renderPreviewContent = () => {
        if (!previewAttachment) return null;
        
        const { filename, mimeType } = previewAttachment;
        const url = getAttachmentUrl(previewAttachment.url);
        const fileExtension = filename.toLowerCase().split('.').pop();
        
        if (!url) return (
            <Typography color="error">Не удалось получить URL вложения</Typography>
        );
        
        // Предпросмотр изображений
        if (mimeType.startsWith('image/')) {
            return (
                <Box sx={{ textAlign: 'center' }}>
                    <img 
                        src={url} 
                        alt={filename} 
                        style={{ maxWidth: '100%', maxHeight: '70vh', objectFit: 'contain' }} 
                    />
                </Box>
            );
        }
        
        // Предпросмотр видео файлов
        if (mimeType.startsWith('video/')) {
            return (
                <Box sx={{ textAlign: 'center', height: '70vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <video 
                        controls 
                        style={{ 
                            maxWidth: '100%', 
                            maxHeight: '100%',
                            objectFit: 'contain'
                        }}
                        preload="metadata"
                    >
                        <source src={url} type={mimeType} />
                        <Typography>
                            Ваш браузер не поддерживает воспроизведение видео.
                        </Typography>
                    </video>
                </Box>
            );
        }
        
        // Предпросмотр текстовых файлов
        if (mimeType.startsWith('text/') || fileExtension === 'txt' || fileExtension === 'log') {
            return <TextFilePreview url={url} filename={filename} />;
        }
        
        // Fallback для других типов файлов
        return (
            <Box sx={{ textAlign: 'center', p: 3 }}>
                <InsertDriveFileIcon sx={{ fontSize: 80, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" sx={{ mb: 2 }}>
                    Предпросмотр недоступен
                </Typography>
                <Typography variant="body1" sx={{ mb: 3, color: 'text.secondary' }}>
                    Для этого типа файла предпросмотр не поддерживается.<br />
                    Скачайте файл для просмотра.
                </Typography>
                <Button 
                    variant="contained" 
                    startIcon={<DownloadIcon />}
                    onClick={() => handleDownload(previewAttachment)}
                    size="large"
                >
                    Скачать файл
                </Button>
            </Box>
        );
    };
    
    // Рендер элемента вложения в виде карточки
    const renderAttachmentCard = (attachment: TaskAttachment, index: number) => {
        const isImage = attachment.mimeType.startsWith('image/');
        const fileExtension = getFileExtension(attachment.filename);
        const fileColor = getFileTypeColor(attachment.mimeType);
        const canPreviewFile = canPreview(attachment.mimeType, attachment.filename);
        const fileUrl = getAttachmentUrl(attachment.url);
        
        return (
            <Card 
                key={attachment.id || index} 
                variant="outlined" 
                sx={{ 
                    mb: 2, 
                    overflow: 'hidden',
                    transition: 'transform 0.2s, box-shadow 0.2s',
                    '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: isDarkTheme 
                            ? '0 6px 12px rgba(0,0,0,0.3)'
                            : '0 6px 12px rgba(0,0,0,0.1)'
                    }
                }}
            >
                <CardActionArea 
                    onClick={() => canPreviewFile ? handlePreviewClick(attachment) : null}
                    sx={{ 
                        display: 'flex', 
                        alignItems: 'flex-start', 
                        p: 1,
                        cursor: canPreviewFile ? 'pointer' : 'default'
                    }}
                >
                    {isImage && fileUrl ? (
                        <CardMedia
                            component="img"
                            sx={{ width: 60, height: 60, objectFit: 'cover', borderRadius: 1 }}
                            image={fileUrl}
                            alt={attachment.filename}
                        />
                    ) : (
                        <Box sx={{ 
                            width: 60, 
                            height: 60, 
                            bgcolor: alpha(fileColor, isDarkTheme ? 0.2 : 0.1),
                            color: fileColor,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            borderRadius: 1
                        }}>
                            {getFileIcon(attachment.mimeType)}
                            {fileExtension && (
                                <Typography 
                                    variant="caption" 
                                    sx={{ 
                                        mt: 0.5, 
                                        fontWeight: 'bold',
                                        color: isDarkTheme ? theme.palette.text.primary : fileColor 
                                    }}
                                >
                                    {fileExtension}
                                </Typography>
                            )}
                        </Box>
                    )}
                    
                    <CardContent sx={{ flexGrow: 1, p: 1, pl: 2, '&:last-child': { pb: 1 } }}>
                        <Typography variant="subtitle2" noWrap title={attachment.filename}>
                            {attachment.filename}
                        </Typography>
                        <Stack direction="row" spacing={1} sx={{ mt: 0.5 }} alignItems="center">
                            <Typography variant="caption" color="text.secondary">
                                {formatFileSizeHelper(attachment.size)}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                {formatDate(attachment.createdAt)}
                            </Typography>
                        </Stack>
                    </CardContent>
                </CardActionArea>
                
                <CardActions sx={{ pt: 0, justifyContent: 'flex-end' }}>
                    <Tooltip title="Скачать">
                        <IconButton 
                            size="small"
                            onClick={() => handleDownload(attachment)}
                        >
                            <DownloadIcon fontSize="small" />
                        </IconButton>
                    </Tooltip>
                    
                    <Tooltip title="Удалить">
                        <IconButton 
                            size="small" 
                            color="error"
                            onClick={() => handleDeleteClick(attachment.id)}
                        >
                            <DeleteIcon fontSize="small" />
                        </IconButton>
                    </Tooltip>
                    
                    {canPreviewFile && (
                        <Tooltip title="Просмотреть">
                            <IconButton 
                                size="small" 
                                color="primary"
                                onClick={() => handlePreviewClick(attachment)}
                            >
                                <VisibilityIcon fontSize="small" />
                            </IconButton>
                        </Tooltip>
                    )}
                </CardActions>
            </Card>
        );
    };
    
    // Рендер элемента вложения в виде строки списка
    const renderAttachmentListItem = (attachment: TaskAttachment, index: number) => {
        const fileExtension = getFileExtension(attachment.filename);
        const fileColor = getFileTypeColor(attachment.mimeType);
        const isImage = attachment.mimeType.startsWith('image/');
        const fileUrl = getAttachmentUrl(attachment.url);
        
        return (
            <React.Fragment key={attachment.id || index}>
                <ListItem sx={{ 
                    borderRadius: 1,
                    transition: 'background-color 0.2s',
                    '&:hover': {
                        bgcolor: isDarkTheme ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)'
                    }
                }}>
                    <ListItemIcon>
                        {isImage && fileUrl ? (
                            <Box
                                component="img"
                                src={fileUrl}
                                alt={attachment.filename}
                                sx={{
                                    width: 40,
                                    height: 40,
                                    borderRadius: 1,
                                    objectFit: 'cover',
                                    border: `1px solid ${alpha(fileColor, 0.3)}`
                                }}
                            />
                        ) : (
                            <Box sx={{ 
                                bgcolor: alpha(fileColor, isDarkTheme ? 0.2 : 0.1),
                                color: fileColor,
                                width: 40,
                                height: 40,
                                borderRadius: 1,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexDirection: 'column'
                            }}>
                                {getFileIcon(attachment.mimeType)}
                                {fileExtension && (
                                    <Typography 
                                        variant="caption" 
                                        sx={{ 
                                            fontSize: '0.6rem',
                                            fontWeight: 'bold', 
                                            lineHeight: 1
                                        }}
                                    >
                                        {fileExtension}
                                    </Typography>
                                )}
                            </Box>
                        )}
                    </ListItemIcon>
                    
                    <ListItemText 
                        primary={
                            <Box component="div" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                    {attachment.filename}
                                </Typography>
                                
                                {canPreview(attachment.mimeType, attachment.filename) && (
                                    <Chip
                                        label="Доступен просмотр"
                                        size="small"
                                        color="primary"
                                        variant="outlined"
                                        sx={{ height: 20 }}
                                    />
                                )}
                            </Box>
                        }
                        
                        secondary={
                            <Stack direction="row" spacing={2} alignItems="center">
                                <Typography variant="caption" color="text.secondary">
                                    {formatFileSizeHelper(attachment.size)}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                    {formatDate(attachment.createdAt)}
                                </Typography>
                            </Stack>
                        }
                        
                        primaryTypographyProps={{
                            sx: { marginBottom: 0.5 }
                        }}
                    />
                    
                    <ListItemSecondaryAction>
                        <Stack direction="row" spacing={1}>
                            {canPreview(attachment.mimeType, attachment.filename) && (
                                <Tooltip title="Просмотреть">
                                    <IconButton 
                                        edge="end" 
                                        aria-label="preview"
                                        onClick={() => handlePreviewClick(attachment)}
                                        size="small"
                                        color="primary"
                                    >
                                        <VisibilityIcon fontSize="small" />
                                    </IconButton>
                                </Tooltip>
                            )}
                            
                            <Tooltip title="Скачать">
                                <IconButton 
                                    edge="end" 
                                    aria-label="download"
                                    size="small"
                                    onClick={() => handleDownload(attachment)}
                                >
                                    <DownloadIcon fontSize="small" />
                                </IconButton>
                            </Tooltip>
                            
                            <Tooltip title="Удалить">
                                <IconButton 
                                    edge="end" 
                                    aria-label="delete" 
                                    onClick={() => handleDeleteClick(attachment.id)}
                                    size="small"
                                    color="error"
                                >
                                    <DeleteIcon fontSize="small" />
                                </IconButton>
                            </Tooltip>
                        </Stack>
                    </ListItemSecondaryAction>
                </ListItem>
                {index < attachments.length - 1 && <Divider variant="fullWidth" component="li" />}
            </React.Fragment>
        );
    };
    
    // Обработчики drag-and-drop
    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (!isDragOver) setIsDragOver(true);
    };

    const handleDragEnter = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        
        // Проверяем, что мы действительно покинули область
        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
        const isOutside = e.clientX < rect.left || e.clientX > rect.right || 
                         e.clientY < rect.top || e.clientY > rect.bottom;
        
        if (isOutside) {
            setIsDragOver(false);
        }
    };

    const handleDrop = async (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(false);

        const files = Array.from(e.dataTransfer.files);
        if (files.length === 0) return;

        // Обрабатываем только первый файл (можно расширить для множественной загрузки)
        const file = files[0];
        setUploadProgress(0);

        try {
            // Загрузка файла через API
            const updatedTask = await taskService.uploadFile(
                taskId, 
                file, 
                (progress) => setUploadProgress(progress)
            );
            
            // Обновляем список вложений
            if (updatedTask && updatedTask.attachments) {
                setAttachments(updatedTask.attachments);
            } else {
                // Если вложения не вернулись с сервера, перезагружаем задачу
                loadTaskAttachments();
            }
            
        } catch (err) {
            console.error('Ошибка при загрузке файла:', err);
            setError('Не удалось загрузить файл');
        } finally {
            setUploadProgress(null);
        }
    };
    
    return (
        <Box 
            onDragOver={handleDragOver}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            sx={{
                position: 'relative',
                border: isDragOver ? `2px dashed ${theme.palette.primary.main}` : '2px dashed transparent',
                borderRadius: 2,
                backgroundColor: isDragOver 
                    ? alpha(theme.palette.primary.main, 0.05)
                    : 'transparent',
                transition: 'all 0.2s ease-in-out',
                p: isDragOver ? 1 : 0
            }}
        >
            {/* Overlay для drag-and-drop */}
            {isDragOver && (
                <Box
                    sx={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: alpha(theme.palette.primary.main, 0.1),
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 1000,
                        borderRadius: 2,
                        border: `2px dashed ${theme.palette.primary.main}`
                    }}
                >
                    <Box sx={{ textAlign: 'center' }}>
                        <AttachFileIcon 
                            sx={{ 
                                fontSize: 60, 
                                color: theme.palette.primary.main,
                                mb: 2
                            }} 
                        />
                        <Typography 
                            variant="h6" 
                            sx={{ 
                                color: theme.palette.primary.main,
                                fontWeight: 600
                            }}
                        >
                            Отпустите файл для загрузки
                        </Typography>
                    </Box>
                </Box>
            )}
            
            {/* Шапка с заголовком и кнопками */}
            <Box sx={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                mb: 2,
                flexWrap: 'wrap',
                gap: 1
            }}>
                <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center' }}>
                    <FolderOpenIcon sx={{ mr: 1, color: theme.palette.primary.main }} />
                    Вложения 
                    {attachments.length > 0 && (
                        <Chip
                            label={attachments.length}
                            size="small"
                            color="primary"
                            sx={{ ml: 1, height: 22, minWidth: 22 }}
                        />
                    )}
                </Typography>
                
                <Box sx={{ display: 'flex', gap: 1 }}>
                    <Tooltip title="Обновить список файлов">
                        <Button 
                            size="small"
                            color="info"
                            startIcon={<RefreshIcon />}
                            onClick={loadTaskAttachments}
                            disabled={loading}
                            variant="outlined"
                        >
                            {isMobile ? '' : 'Обновить'}
                        </Button>
                    </Tooltip>
                    
                    <Button 
                        variant="contained" 
                        color="primary"
                        startIcon={<AttachFileIcon />}
                        onClick={handleAttachButtonClick}
                        disabled={!!uploadProgress || loading}
                    >
                        {isMobile ? '' : 'Добавить файл'}
                    </Button>
                </Box>
                
                <input
                    type="file"
                    ref={fileInputRef}
                    style={{ display: 'none' }}
                    onChange={handleFileSelected}
                />
            </Box>
            
            {/* Прогресс загрузки файла */}
            <Fade in={uploadProgress !== null}>
                <Box sx={{ mb: 2 }}>
                    {uploadProgress !== null && (
                        <Box sx={{ mb: 2 }}>
                            <Typography variant="body2" sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span>Загрузка файла...</span>
                                <span>{uploadProgress}%</span>
                            </Typography>
                            <Box 
                                sx={{ 
                                    width: '100%', 
                                    backgroundColor: isDarkTheme ? alpha('#fff', 0.1) : alpha('#000', 0.1),
                                    borderRadius: 1,
                                    mt: 1,
                                    overflow: 'hidden'
                                }}
                            >
                                <Box
                                    sx={{
                                        height: 6,
                                        borderRadius: 1,
                                        backgroundColor: 'primary.main',
                                        width: `${uploadProgress}%`,
                                        transition: 'width 0.3s ease-in-out'
                                    }}
                                />
                            </Box>
                        </Box>
                    )}
                </Box>
            </Fade>
            
            {/* Отображение загрузки, ошибок и пустого списка вложений */}
            {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', my: 4, flexDirection: 'column', alignItems: 'center' }}>
                    <CircularProgress size={40} />
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                        Загрузка вложений...
                    </Typography>
                </Box>
            ) : error ? (
                <Alert 
                    severity="error" 
                    sx={{ mb: 2 }} 
                    action={
                        <Button color="inherit" size="small" onClick={loadTaskAttachments}>
                            Повторить
                        </Button>
                    }
                >
                    {error}
                </Alert>
            ) : attachments.length === 0 ? (
                <Paper 
                    variant="outlined" 
                    sx={{ 
                        p: 3, 
                        textAlign: 'center',
                        borderStyle: 'dashed',
                        borderColor: isDarkTheme ? alpha('#fff', 0.2) : alpha('#000', 0.2),
                        bgcolor: 'transparent'
                    }}
                >
                    <Box sx={{ mb: 2 }}>
                        <InsertDriveFileIcon sx={{ fontSize: 50, color: isDarkTheme ? alpha('#fff', 0.5) : alpha('#000', 0.3) }} />
                    </Box>
                    <Typography sx={{ color: 'text.secondary', mb: 2 }}>
                        К этой задаче пока не прикреплено ни одного файла
                    </Typography>
                    <Button 
                        variant="outlined" 
                        color="primary"
                        startIcon={<AttachFileIcon />}
                        onClick={handleAttachButtonClick}
                    >
                        Прикрепить файл
                    </Button>
                </Paper>
            ) : (
                /* Список вложений */
                isMobile ? (
                    /* Вид карточками для мобильных устройств */
                    <Box sx={{ mt: 2 }}>
                        {attachments.map((attachment, index) => (
                            renderAttachmentCard(attachment, index)
                        ))}
                    </Box>
                ) : (
                    /* Вид списком для больших экранов */
                    <Paper variant="outlined" sx={{ borderRadius: 1, overflow: 'hidden' }}>
                        <List sx={{ width: '100%', bgcolor: 'background.paper', padding: 0 }}>
                            {attachments.map((attachment, index) => (
                                renderAttachmentListItem(attachment, index)
                            ))}
                        </List>
                    </Paper>
                )
            )}
            
            {/* Диалог подтверждения удаления */}
            <ConfirmDialog
                open={confirmDelete}
                title="Удалить вложение"
                message="Вы уверены, что хотите удалить этот файл? Это действие нельзя отменить."
                onConfirm={handleConfirmDelete}
                onClose={() => setConfirmDelete(false)}
                actionType="delete"
                loading={loading}
            />
            
            {/* Диалог просмотра вложения */}
            <Dialog
                open={previewDialogOpen}
                onClose={() => setPreviewDialogOpen(false)}
                maxWidth="lg"
                fullWidth
                PaperProps={{
                    sx: {
                        borderRadius: 2,
                        overflowY: 'visible'
                    }
                }}
            >
                <DialogTitle sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between',
                    borderBottom: 1,
                    borderColor: 'divider',
                    pb: 1
                }}>
                    <Stack direction="row" alignItems="center" spacing={1}>
                        {previewAttachment && getFileIcon(previewAttachment.mimeType)}
                        <Typography variant="h6">
                            {previewAttachment?.filename}
                        </Typography>
                    </Stack>
                    
                    <IconButton 
                        onClick={() => setPreviewDialogOpen(false)}
                        size="small"
                        aria-label="close"
                    >
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>
                
                <DialogContent sx={{ p: 0, overflow: 'hidden' }}>
                    {renderPreviewContent()}
                </DialogContent>
                
                <DialogActions sx={{ 
                    justifyContent: 'space-between',
                    borderTop: 1,
                    borderColor: 'divider',
                    px: 2
                }}>
                    {previewAttachment && (
                        <Typography variant="caption" color="text.secondary">
                            {formatFileSizeHelper(previewAttachment.size || 0)}
                        </Typography>
                    )}
                    
                    <Stack direction="row" spacing={1}>
                        <Button onClick={() => setPreviewDialogOpen(false)}>
                            Закрыть
                        </Button>
                        {previewAttachment && (
                            <Button 
                                variant="contained"
                                startIcon={<DownloadIcon />}
                                onClick={() => handleDownload(previewAttachment)}
                            >
                                Скачать
                            </Button>
                        )}
                    </Stack>
                </DialogActions>
            </Dialog>
        </Box>
    );
}; 