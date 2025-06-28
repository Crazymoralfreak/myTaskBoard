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
    alpha,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    TextField,
    InputAdornment,
    Skeleton
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
import CloseIcon from '@mui/icons-material/Close';
import PlayCircleIcon from '@mui/icons-material/PlayCircle';
import SortIcon from '@mui/icons-material/Sort';
import FilterListIcon from '@mui/icons-material/FilterList';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import SelectAllIcon from '@mui/icons-material/SelectAll';
import CheckBoxIcon from '@mui/icons-material/CheckBox';
import CheckBoxOutlineBlankIcon from '@mui/icons-material/CheckBoxOutlineBlank';
import DeleteSweepIcon from '@mui/icons-material/DeleteSweep';
import InfoIcon from '@mui/icons-material/Info';
import StorageIcon from '@mui/icons-material/Storage';
import ViewListIcon from '@mui/icons-material/ViewList';
import ViewModuleIcon from '@mui/icons-material/ViewModule';
import PhotoSizeSelectLargeIcon from '@mui/icons-material/PhotoSizeSelectLarge';
import CompressIcon from '@mui/icons-material/Compress';
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import FullscreenIcon from '@mui/icons-material/Fullscreen';
import FullscreenExitIcon from '@mui/icons-material/FullscreenExit';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import Menu from '@mui/material/Menu';
import { Task, TaskAttachment } from '../../../types/task';
import { ConfirmDialog } from '../../shared/ConfirmDialog';
import { taskService } from '../../../services/taskService';
import { formatFileSize } from '../../../utils/fileUtils';
import { getAttachmentUrl } from '../../../utils/attachmentUtils';
import { useLocalization } from '../../../hooks/useLocalization';

interface TextFilePreviewProps {
    url: string;
    filename: string;
}

const TextFilePreview: React.FC<TextFilePreviewProps> = ({ url, filename }) => {
    const { t } = useLocalization();
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
                    throw new Error(t('attachmentsErrorsLoadFile'));
                }
                
                const text = await response.text();
                setContent(text);
            } catch (err) {
                console.error('Ошибка при загрузке текстового файла:', err);
                setError(t('attachmentsErrorsLoadContent'));
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
                <Typography sx={{ ml: 2 }}>{t('attachmentsLoadingContent')}</Typography>
            </Box>
        );
    }

    if (error) {
        return (
            <Box sx={{ textAlign: 'center', p: 3 }}>
                <Typography color="error" sx={{ mb: 2 }}>{error}</Typography>
                <Button variant="outlined" onClick={() => window.location.reload()}>
                    {t('taskTryAgain')}
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



// Типы для фильтрации и сортировки
type FileFilter = 'all' | 'images' | 'videos' | 'documents' | 'text' | 'other';
type SortBy = 'name' | 'size' | 'date' | 'type';
type SortOrder = 'asc' | 'desc';

interface TaskAttachmentsProps {
    taskId: number;
    onTaskUpdate?: (updatedTask: Task) => void;
}

/**
 * Компонент для работы с вложениями задачи
 */
export const TaskAttachments: React.FC<TaskAttachmentsProps> = ({ taskId, onTaskUpdate }) => {
    const { t } = useLocalization();
    const [attachments, setAttachments] = useState<TaskAttachment[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [uploadProgress, setUploadProgress] = useState<number | null>(null);
    const [selectedAttachmentId, setSelectedAttachmentId] = useState<number | null>(null);
    const [confirmDelete, setConfirmDelete] = useState(false);
    const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
    const [previewAttachment, setPreviewAttachment] = useState<TaskAttachment | null>(null);
    const [isDragOver, setIsDragOver] = useState(false);
    
    // Состояния для фильтрации и сортировки
    const [filter, setFilter] = useState<FileFilter>('all');
    const [sortBy, setSortBy] = useState<SortBy>('date');
    const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
    const [searchQuery, setSearchQuery] = useState('');
    
    // Состояния для множественной загрузки
    const [multipleUploadProgress, setMultipleUploadProgress] = useState<{[key: string]: number}>({});
    const [uploadingFiles, setUploadingFiles] = useState<string[]>([]);
    
    // Состояния для массовых операций
    const [selectedFiles, setSelectedFiles] = useState<Set<number>>(new Set());
    const [isSelectionMode, setIsSelectionMode] = useState(false);
    
    // Состояния для адаптивности
    const [viewMode, setViewMode] = useState<'list' | 'grid'>('grid');
    const [compactMode, setCompactMode] = useState(false);
    const [thumbnailSize, setThumbnailSize] = useState<'small' | 'medium' | 'large'>('medium');
    
    // Состояния для расширенного предпросмотра
    const [fullscreenPreview, setFullscreenPreview] = useState(false);
    const [currentPreviewIndex, setCurrentPreviewIndex] = useState(0);
    
    // Состояния для упрощенного UI
    const [showInfoPanel, setShowInfoPanel] = useState(false);
    const [actionsMenuAnchor, setActionsMenuAnchor] = useState<null | HTMLElement>(null);
    const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
    
    const fileInputRef = useRef<HTMLInputElement>(null);
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    
    // Индикатор, что это темная тема
    const isDarkTheme = theme.palette.mode === 'dark';
    
    // Функция определения типа файла для фильтрации
    const getFileFilterType = (mimeType: string): FileFilter => {
        if (mimeType.startsWith('image/')) return 'images';
        if (mimeType.startsWith('video/')) return 'videos';
        if (mimeType.startsWith('text/') || 
            mimeType === 'application/pdf' ||
            mimeType.includes('word') ||
            mimeType.includes('document') ||
            mimeType.includes('excel') ||
            mimeType.includes('spreadsheet')) return 'documents';
        if (mimeType.startsWith('text/')) return 'text';
        return 'other';
    };
    
    // Функция фильтрации файлов
    const filterAttachments = (attachments: TaskAttachment[]): TaskAttachment[] => {
        let filtered = attachments;
        
        // Применяем фильтр по типу
        if (filter !== 'all') {
            filtered = filtered.filter(attachment => getFileFilterType(attachment.mimeType) === filter);
        }
        
        // Применяем поиск
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase().trim();
            filtered = filtered.filter(attachment => 
                attachment.filename.toLowerCase().includes(query)
            );
        }
        
        return filtered;
    };
    
    // Функция сортировки файлов
    const sortAttachments = (attachments: TaskAttachment[]): TaskAttachment[] => {
        return [...attachments].sort((a, b) => {
            let comparison = 0;
            
            switch (sortBy) {
                case 'name':
                    comparison = a.filename.localeCompare(b.filename);
                    break;
                case 'size':
                    comparison = a.size - b.size;
                    break;
                case 'date':
                    comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
                    break;
                case 'type':
                    comparison = a.mimeType.localeCompare(b.mimeType);
                    break;
                default:
                    return 0;
            }
            
            return sortOrder === 'asc' ? comparison : -comparison;
        });
    };
    
    // Получаем отфильтрованные и отсортированные вложения
    const processedAttachments = sortAttachments(filterAttachments(attachments));
    
    // Функция получения количества файлов по типам для статистики
    const getFileTypeStats = () => {
        const stats = {
            all: attachments.length,
            images: 0,
            videos: 0,
            documents: 0,
            text: 0,
            other: 0
        };
        
        attachments.forEach(attachment => {
            const type = getFileFilterType(attachment.mimeType);
            stats[type]++;
        });
        
        return stats;
    };
    
    // Функция расчета общего размера файлов
    const getTotalSize = () => {
        return attachments.reduce((total, attachment) => total + attachment.size, 0);
    };

    // Функция расчета размера выбранных файлов
    const getSelectedSize = () => {
        return attachments
            .filter(attachment => selectedFiles.has(attachment.id))
            .reduce((total, attachment) => total + attachment.size, 0);
    };

    // Функция для получения детальной статистики
    const getDetailedStats = () => {
        const totalSize = getTotalSize();
        const fileStats = getFileTypeStats();
        
        return {
            totalFiles: attachments.length,
            totalSize,
            selectedFiles: selectedFiles.size,
            selectedSize: getSelectedSize(),
            fileTypes: fileStats,
            avgFileSize: attachments.length > 0 ? totalSize / attachments.length : 0
        };
    };

    // Функция массового скачивания
    const handleMassDownload = async () => {
        if (selectedFiles.size === 0) return;
        
        const selectedAttachments = attachments.filter(attachment => 
            selectedFiles.has(attachment.id)
        );
        
        if (selectedAttachments.length === 1) {
            // Если выбран только один файл, скачиваем его напрямую
            await handleDownload(selectedAttachments[0]);
        } else {
            // Массовое скачивание с интервалами для избежания блокировки браузером
            let downloadIndex = 0;
            const downloadNext = () => {
                if (downloadIndex < selectedAttachments.length) {
                    const attachment = selectedAttachments[downloadIndex];
                    handleDownload(attachment);
                    downloadIndex++;
                    // Интервал между скачиваниями для браузера
                    setTimeout(downloadNext, 1000);
                }
            };
            downloadNext();
        }
    };
    
    const fileStats = getFileTypeStats();
    
    // Функции для массовых операций
    const toggleSelectionMode = () => {
        setIsSelectionMode(!isSelectionMode);
        if (isSelectionMode) {
            setSelectedFiles(new Set());
        }
    };
    
    const toggleFileSelection = (fileId: number) => {
        const newSelected = new Set(selectedFiles);
        if (newSelected.has(fileId)) {
            newSelected.delete(fileId);
        } else {
            newSelected.add(fileId);
        }
        setSelectedFiles(newSelected);
    };
    
    const selectAllFiles = () => {
        if (selectedFiles.size === processedAttachments.length) {
            setSelectedFiles(new Set());
        } else {
            setSelectedFiles(new Set(processedAttachments.map(f => f.id)));
        }
    };
    
    const deleteSelectedFiles = async () => {
        if (selectedFiles.size === 0) return;
        
        try {
            setLoading(true);
            
            // Удаляем файлы по одному
            for (const fileId of selectedFiles) {
                await taskService.deleteFile(taskId, fileId);
            }
            
            // Перезагружаем список файлов
            await loadTaskAttachments();
            
            // Сбрасываем выбор
            setSelectedFiles(new Set());
            setIsSelectionMode(false);
            
        } catch (err) {
            console.error('Ошибка при массовом удалении файлов:', err);
                            setError(t('attachmentsErrorsDeleteSelected'));
        } finally {
            setLoading(false);
        }
    };
    
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
            setError(t('attachmentsErrorsLoadList'));
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
    
    // Функция для загрузки множественных файлов
    const uploadMultipleFiles = async (files: File[]) => {
        const filesArray = Array.from(files);
        setUploadingFiles(filesArray.map(f => f.name));
        
        const uploadPromises = filesArray.map(async (file) => {
            const fileKey = file.name;
            
            try {
                const updatedTask = await taskService.uploadFile(
                    taskId, 
                    file, 
                    (progress) => {
                        setMultipleUploadProgress(prev => ({
                            ...prev,
                            [fileKey]: progress
                        }));
                    }
                );
                
                // Успешная загрузка
                setMultipleUploadProgress(prev => {
                    const newProgress = { ...prev };
                    delete newProgress[fileKey];
                    return newProgress;
                });
                
                return updatedTask;
            } catch (error) {
                console.error(`Ошибка при загрузке файла ${file.name}:`, error);
                setError(`${t('attachmentsErrorsUploadFile')}: ${file.name}`);
                
                setMultipleUploadProgress(prev => {
                    const newProgress = { ...prev };
                    delete newProgress[fileKey];
                    return newProgress;
                });
                
                throw error;
            }
        });
        
        try {
            const results = await Promise.allSettled(uploadPromises);
            
            // Получаем последний успешный результат для обновления списка
            const successResults = results
                .filter((result): result is PromiseFulfilledResult<Task> => 
                    result.status === 'fulfilled' && result.value != null
                )
                .map(result => result.value);
            
            if (successResults.length > 0) {
                const lastResult = successResults[successResults.length - 1];
                if (lastResult.attachments) {
                    setAttachments(lastResult.attachments);
                } else {
                    // Если все загрузки провалились, перезагружаем список
                    loadTaskAttachments();
                }
            } else {
                // Если все загрузки провалились, перезагружаем список
                loadTaskAttachments();
            }
            
            // Показываем статистику загрузки
            const successful = results.filter(r => r.status === 'fulfilled').length;
            const failed = results.filter(r => r.status === 'rejected').length;
            
            if (failed > 0) {
                setError(`${t('attachmentsUploadSummary')}: ${successful}, ${t('attachmentsUploadFailed')}: ${failed}`);
            }
            
        } catch (error) {
            console.error('Ошибка при массовой загрузке:', error);
            setError(t('attachmentsErrorsUploadFiles'));
        } finally {
            setUploadingFiles([]);
            setMultipleUploadProgress({});
        }
    };
    
    // Обработка выбора файлов (поддержка множественной загрузки)
    const handleFileSelected = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(event.target.files || []);
        if (files.length === 0) return;
        
        // Если выбран только один файл, используем старую логику с прогрессом
        if (files.length === 1) {
            const file = files[0];
            setUploadProgress(0);
            
            try {
                const updatedTask = await taskService.uploadFile(
                    taskId, 
                    file, 
                    (progress) => setUploadProgress(progress)
                );
                
                if (updatedTask && updatedTask.attachments) {
                    setAttachments(updatedTask.attachments);
                } else {
                    loadTaskAttachments();
                }
                
            } catch (err) {
                console.error('Ошибка при загрузке файла:', err);
                setError(t('attachmentsErrorsUploadSingleFile'));
            } finally {
                setUploadProgress(null);
            }
        } else {
            // Множественная загрузка
            await uploadMultipleFiles(files);
        }
        
        // Сбрасываем input file для возможности повторного выбора
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
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
            setError(t('attachmentsErrorsDeleteFile'));
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
        
        // Находим индекс текущего файла для навигации
        const previewableAttachments = processedAttachments.filter(att => 
            canPreview(att.mimeType, att.filename)
        );
        const index = previewableAttachments.findIndex(att => att.id === attachment.id);
        setCurrentPreviewIndex(index >= 0 ? index : 0);
    };
    
    // Получение списка файлов доступных для предпросмотра
    const getPreviewableAttachments = () => {
        return processedAttachments.filter(attachment => 
            canPreview(attachment.mimeType, attachment.filename)
        );
    };
    
    // Навигация к предыдущему файлу
    const goToPreviousFile = () => {
        const previewableFiles = getPreviewableAttachments();
        if (previewableFiles.length <= 1) return;
        
        const newIndex = currentPreviewIndex > 0 
            ? currentPreviewIndex - 1 
            : previewableFiles.length - 1;
        
        setCurrentPreviewIndex(newIndex);
        setPreviewAttachment(previewableFiles[newIndex]);
    };
    
    // Навигация к следующему файлу
    const goToNextFile = () => {
        const previewableFiles = getPreviewableAttachments();
        if (previewableFiles.length <= 1) return;
        
        const newIndex = currentPreviewIndex < previewableFiles.length - 1 
            ? currentPreviewIndex + 1 
            : 0;
        
        setCurrentPreviewIndex(newIndex);
        setPreviewAttachment(previewableFiles[newIndex]);
    };
    
    // Переключение полноэкранного режима
    const toggleFullscreenPreview = () => {
        setFullscreenPreview(!fullscreenPreview);
    };
    
    // Обработка клавиатурной навигации в предпросмотре
    useEffect(() => {
        const handleKeyPress = (event: KeyboardEvent) => {
            if (!previewDialogOpen) return;
            
            switch (event.key) {
                case 'ArrowLeft':
                    event.preventDefault();
                    goToPreviousFile();
                    break;
                case 'ArrowRight':
                    event.preventDefault();
                    goToNextFile();
                    break;
                case 'Escape':
                    event.preventDefault();
                    setPreviewDialogOpen(false);
                    break;
                case 'F11':
                case 'f':
                case 'F':
                    event.preventDefault();
                    toggleFullscreenPreview();
                    break;
            }
        };

        document.addEventListener('keydown', handleKeyPress);
        return () => document.removeEventListener('keydown', handleKeyPress);
    }, [previewDialogOpen, currentPreviewIndex, fullscreenPreview]);
    
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
        // Поддерживаем изображения, видео и текстовые файлы
        if (type.startsWith('image/') || 
            type.startsWith('text/') || 
            type.startsWith('video/')) {
            return true;
        }
        
        // Поддерживаем JSON и XML по MIME-типу
        if (type === 'application/json' || 
            type === 'application/xml' ||
            type === 'text/xml') {
            return true;
        }
        
        // Проверяем по расширению файла для дополнительных текстовых типов
        if (filename) {
            const extension = filename.toLowerCase().split('.').pop();
            return ['txt', 'log', 'md', 'markdown', 'json', 'xml', 'csv', 'yaml', 'yml', 'js', 'ts', 'jsx', 'tsx', 'css', 'scss', 'html', 'htm'].includes(extension || '');
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
            <Typography color="error">{t('attachmentsFailedGetUrl')}</Typography>
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
                            {t('attachmentsBrowserNotSupported')}
                        </Typography>
                    </video>
                </Box>
            );
        }
        
        // Предпросмотр текстовых файлов, JSON, XML, Markdown и т.д.
        if (mimeType.startsWith('text/') || 
            mimeType === 'application/json' ||
            mimeType === 'application/xml' ||
            mimeType === 'text/xml' ||
            fileExtension === 'txt' || 
            fileExtension === 'log' || 
            ['md', 'markdown', 'json', 'xml', 'csv', 'yaml', 'yml', 'js', 'ts', 'jsx', 'tsx', 'css', 'scss', 'html', 'htm'].includes(fileExtension || '')) {
            return <TextFilePreview url={url} filename={filename} />;
        }
        
        // Fallback для других типов файлов
        return (
            <Box sx={{ textAlign: 'center', p: 3 }}>
                <InsertDriveFileIcon sx={{ fontSize: 80, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" sx={{ mb: 2 }}>
                    {t('attachmentsPreviewUnavailable')}
                </Typography>
                <Typography variant="body1" sx={{ mb: 3, color: 'text.secondary' }}>
                    {t('attachmentsPreviewNotSupported')}<br />
                    {t('attachmentsDownloadToView')}
                </Typography>
                <Button 
                    variant="contained" 
                    startIcon={<DownloadIcon />}
                    onClick={() => handleDownload(previewAttachment)}
                    size="large"
                >
                                                {t('download')}
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
        
        // Размеры в зависимости от настроек
        const cardSizes = {
            small: { width: 80, height: 80, imageSize: 60 },
            medium: { width: 120, height: 120, imageSize: 80 },
            large: { width: 160, height: 160, imageSize: 120 }
        };
        
        const sizes = cardSizes[thumbnailSize];
        const isSelected = selectedFiles.has(attachment.id);
        
        return (
            <Card 
                key={attachment.id || index} 
                variant="outlined" 
                sx={{ 
                    mb: compactMode ? 1 : 2,
                    width: viewMode === 'grid' ? sizes.width : '100%',
                    minHeight: viewMode === 'grid' ? sizes.height : 'auto',
                    overflow: 'hidden',
                    transition: 'transform 0.2s, box-shadow 0.2s',
                    transform: isSelected ? 'scale(0.95)' : 'scale(1)',
                    boxShadow: isSelected ? `0 0 0 2px ${theme.palette.primary.main}` : 'none',
                    '&:hover': {
                        transform: isSelected ? 'scale(0.95)' : 'translateY(-2px)',
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
                        flexDirection: viewMode === 'grid' ? 'column' : 'row',
                        alignItems: viewMode === 'grid' ? 'center' : 'flex-start', 
                        p: compactMode ? 0.5 : 1,
                        height: '100%',
                        cursor: canPreviewFile ? 'pointer' : 'default'
                    }}
                >
                    {/* Чекбокс для выбора */}
                    {isSelectionMode && (
                        <Box 
                            sx={{ 
                                position: 'absolute', 
                                top: 4, 
                                left: 4, 
                                zIndex: 2,
                                backgroundColor: 'rgba(255,255,255,0.9)',
                                borderRadius: '50%',
                                p: 0.5
                            }}
                            onClick={(e) => {
                                e.stopPropagation();
                                toggleFileSelection(attachment.id);
                            }}
                        >
                            <IconButton size="small" sx={{ p: 0 }}>
                                {isSelected ? <CheckBoxIcon color="primary" /> : <CheckBoxOutlineBlankIcon />}
                            </IconButton>
                        </Box>
                    )}

                    {isImage && fileUrl ? (
                        <CardMedia
                            component="img"
                            sx={{ 
                                width: viewMode === 'grid' ? sizes.imageSize : 60, 
                                height: viewMode === 'grid' ? sizes.imageSize : 60, 
                                objectFit: 'cover', 
                                borderRadius: 1,
                                flexShrink: 0
                            }}
                            image={fileUrl}
                            alt={attachment.filename}
                        />
                    ) : (
                        <Box sx={{ 
                            width: viewMode === 'grid' ? sizes.imageSize : 60, 
                            height: viewMode === 'grid' ? sizes.imageSize : 60, 
                            bgcolor: alpha(fileColor, isDarkTheme ? 0.2 : 0.1),
                            color: fileColor,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            borderRadius: 1,
                            flexShrink: 0
                        }}>
                            {getFileIcon(attachment.mimeType)}
                            {fileExtension && !compactMode && (
                                <Typography 
                                    variant="caption" 
                                    sx={{ 
                                        mt: 0.5, 
                                        fontWeight: 'bold',
                                        color: isDarkTheme ? theme.palette.text.primary : fileColor,
                                        fontSize: thumbnailSize === 'small' ? '0.6rem' : '0.75rem'
                                    }}
                                >
                                    {fileExtension}
                                </Typography>
                            )}
                        </Box>
                    )}
                    
                    <CardContent sx={{ 
                        flexGrow: 1, 
                        p: compactMode ? 0.5 : 1, 
                        pl: viewMode === 'grid' ? (compactMode ? 0.5 : 1) : 2, 
                        '&:last-child': { pb: compactMode ? 0.5 : 1 },
                        minWidth: 0 // Важно для правильного обрезания текста
                    }}>
                        <Typography 
                            variant={compactMode ? "caption" : "subtitle2"} 
                            noWrap 
                            title={attachment.filename}
                            sx={{ 
                                fontSize: thumbnailSize === 'small' && compactMode ? '0.7rem' : undefined
                            }}
                        >
                            {attachment.filename}
                        </Typography>
                        {!compactMode && (
                            <Stack 
                                direction={viewMode === 'grid' ? 'column' : 'row'} 
                                spacing={1} 
                                sx={{ mt: 0.5 }} 
                                alignItems={viewMode === 'grid' ? 'center' : 'center'}
                            >
                                <Typography variant="caption" color="text.secondary">
                                    {formatFileSizeHelper(attachment.size)}
                                </Typography>
                                {viewMode === 'grid' && thumbnailSize !== 'small' && (
                                    <Typography variant="caption" color="text.secondary">
                                        {formatDate(attachment.createdAt)}
                                    </Typography>
                                )}
                            </Stack>
                        )}
                    </CardContent>
                </CardActionArea>
                
                {!compactMode && (
                    <CardActions sx={{ pt: 0, justifyContent: 'flex-end' }}>
                        <Tooltip title={t('download')}>
                            <IconButton 
                                size="small"
                                onClick={() => handleDownload(attachment)}
                            >
                                <DownloadIcon fontSize="small" />
                            </IconButton>
                        </Tooltip>
                        
                        <Tooltip title={t('delete')}>
                            <IconButton 
                                size="small" 
                                color="error"
                                onClick={() => handleDeleteClick(attachment.id)}
                            >
                                <DeleteIcon fontSize="small" />
                            </IconButton>
                        </Tooltip>
                        
                        {canPreviewFile && (
                            <Tooltip title={t('preview')}>
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
                )}
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
                                        label={t('attachmentsPreviewAvailable')}
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
                                <Tooltip title={t('preview')}>
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
                            
                            <Tooltip title={t('download')}>
                                <IconButton 
                                    edge="end" 
                                    aria-label="download"
                                    size="small"
                                    onClick={() => handleDownload(attachment)}
                                >
                                    <DownloadIcon fontSize="small" />
                                </IconButton>
                            </Tooltip>
                            
                            <Tooltip title={t('delete')}>
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

        // Поддерживаем множественную загрузку через drag-and-drop
        if (files.length === 1) {
            const file = files[0];
            setUploadProgress(0);

            try {
                const updatedTask = await taskService.uploadFile(
                    taskId, 
                    file, 
                    (progress) => setUploadProgress(progress)
                );
                
                if (updatedTask && updatedTask.attachments) {
                    setAttachments(updatedTask.attachments);
                } else {
                    loadTaskAttachments();
                }
                
            } catch (err) {
                console.error('Ошибка при загрузке файла:', err);
                setError(t('attachmentsErrorsUploadSingleFile'));
            } finally {
                setUploadProgress(null);
            }
        } else {
            // Множественная загрузка файлов
            await uploadMultipleFiles(files);
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
                            {t('attachmentsDropFiles')}
                        </Typography>
                        <Typography 
                            variant="body2" 
                            sx={{ 
                                color: theme.palette.primary.main,
                                mt: 1
                            }}
                        >
                            {t('attachmentsMultipleFilesSupported')}
                        </Typography>
                    </Box>
                </Box>
            )}
            
            {/* Компактная панель поиска и фильтрации */}
            {attachments.length > 0 && (
                <Paper variant="outlined" sx={{ p: 1.5, mb: 2 }}>
                    {/* Основная строка с поиском */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: showAdvancedFilters ? 1.5 : 0 }}>
                        <TextField
                            size="small"
                            placeholder={t('attachmentsSearchFiles')}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <SearchIcon fontSize="small" />
                                    </InputAdornment>
                                ),
                                endAdornment: searchQuery && (
                                    <InputAdornment position="end">
                                        <IconButton
                                            size="small"
                                            onClick={() => setSearchQuery('')}
                                            edge="end"
                                        >
                                            <ClearIcon fontSize="small" />
                                        </IconButton>
                                    </InputAdornment>
                                )
                            }}
                            sx={{ flexGrow: 1, minWidth: 200 }}
                        />
                        
                        {/* Быстрые фильтры */}
                        <Chip
                            label={`${filter === 'all' ? 'Все' : filter} (${
                                filter === 'all' ? fileStats.all : 
                                filter === 'images' ? fileStats.images :
                                filter === 'videos' ? fileStats.videos :
                                filter === 'documents' ? fileStats.documents :
                                filter === 'text' ? fileStats.text : fileStats.other
                            })`}
                            size="small"
                            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                            variant={filter !== 'all' ? 'filled' : 'outlined'}
                            color={filter !== 'all' ? 'primary' : 'default'}
                        />
                        
                        <Tooltip title={t('attachmentsAdvancedFilters')}>
                            <IconButton
                                size="small"
                                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                                color={showAdvancedFilters ? 'primary' : 'default'}
                            >
                                {showAdvancedFilters ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                            </IconButton>
                        </Tooltip>
                        
                        <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                            {processedAttachments.length}/{attachments.length}
                        </Typography>
                    </Box>
                    
                    {/* Расширенные фильтры */}
                    {showAdvancedFilters && (
                        <Fade in={showAdvancedFilters}>
                            <Stack direction={isMobile ? 'column' : 'row'} spacing={1} alignItems="center">
                                <FormControl size="small" sx={{ minWidth: 120 }}>
                                    <InputLabel>{t('attachmentsFileType')}</InputLabel>
                                    <Select
                                        value={filter}
                                        label={t('attachmentsFileType')}
                                        onChange={(e) => setFilter(e.target.value as FileFilter)}
                                    >
                                                                <MenuItem value="all">{t('attachmentsAllFiles')} ({fileStats.all})</MenuItem>
                        {fileStats.images > 0 && (
                            <MenuItem value="images">{t('attachmentsImages')} ({fileStats.images})</MenuItem>
                        )}
                        {fileStats.videos > 0 && (
                            <MenuItem value="videos">{t('attachmentsVideos')} ({fileStats.videos})</MenuItem>
                        )}
                        {fileStats.documents > 0 && (
                            <MenuItem value="documents">{t('attachmentsDocuments')} ({fileStats.documents})</MenuItem>
                        )}
                        {fileStats.text > 0 && (
                            <MenuItem value="text">{t('attachmentsTextFiles')} ({fileStats.text})</MenuItem>
                        )}
                        {fileStats.other > 0 && (
                            <MenuItem value="other">{t('attachmentsOtherFiles')} ({fileStats.other})</MenuItem>
                        )}
                                    </Select>
                                </FormControl>
                                
                                <FormControl size="small" sx={{ minWidth: 120 }}>
                                    <InputLabel>{t('attachmentsSorting')}</InputLabel>
                                    <Select
                                        value={sortBy}
                                        label={t('attachmentsSorting')}
                                        onChange={(e) => setSortBy(e.target.value as SortBy)}
                                    >
                                        <MenuItem value="date">{t('attachmentsSortByDate')}</MenuItem>
                                        <MenuItem value="name">{t('attachmentsSortByName')}</MenuItem>
                                        <MenuItem value="size">{t('attachmentsSortBySize')}</MenuItem>
                                        <MenuItem value="type">{t('attachmentsSortByType')}</MenuItem>
                                    </Select>
                                </FormControl>
                                
                                <Tooltip title={`Сортировать по ${sortOrder === 'asc' ? t('attachmentsSortDescending') : t('attachmentsSortAscending')}`}>
                                    <IconButton
                                        size="small"
                                        onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                                        color="primary"
                                    >
                                        <SortIcon 
                                            sx={{ 
                                                transform: sortOrder === 'desc' ? 'rotate(180deg)' : 'none',
                                                transition: 'transform 0.2s'
                                            }} 
                                        />
                                    </IconButton>
                                </Tooltip>
                            </Stack>
                        </Fade>
                    )}
                </Paper>
            )}

            {/* Компактная панель управления */}
            <Box sx={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                mb: 2,
                gap: 1,
                flexWrap: 'wrap'
            }}>
                {/* Левая группа - основные действия */}
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                    <Button 
                        variant="contained" 
                        color="primary"
                        startIcon={<AttachFileIcon />}
                        onClick={handleAttachButtonClick}
                        disabled={!!uploadProgress || uploadingFiles.length > 0 || loading}
                    >
                        {isMobile ? t('add') : t('attachmentsAddFiles')}
                    </Button>
                    
                    {/* Массовые операции - компактно */}
                    {attachments.length > 0 && (
                        <>
                            <Button
                                size="small"
                                variant={isSelectionMode ? "contained" : "outlined"}
                                color={isSelectionMode ? "secondary" : "primary"}
                                startIcon={isSelectionMode ? <CheckBoxIcon /> : <CheckBoxOutlineBlankIcon />}
                                onClick={toggleSelectionMode}
                                disabled={loading}
                            >
                                {isSelectionMode ? t('attachmentsSelection') : t('attachmentsSelect')}
                            </Button>
                            
                            {selectedFiles.size > 0 && (
                                <Button
                                    size="small"
                                    variant="outlined"
                                    color="primary"
                                    startIcon={<DownloadIcon />}
                                    onClick={handleMassDownload}
                                    disabled={loading}
                                >
                                    {t('download')} ({selectedFiles.size})
                                </Button>
                            )}
                        </>
                    )}
                </Box>
                
                {/* Правая группа - дополнительные действия */}
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                    {/* Режим отображения и доп. действия */}
                    {attachments.length > 0 && (
                        <>
                            <Tooltip title={viewMode === 'grid' ? "Список" : "Сетка"}>
                                <IconButton
                                    size="small"
                                    onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                                    color={viewMode === 'grid' ? 'primary' : 'default'}
                                >
                                    {viewMode === 'grid' ? <ViewModuleIcon /> : <ViewListIcon />}
                                </IconButton>
                            </Tooltip>
                            
                            <Tooltip title="Статистика">
                                <IconButton
                                    size="small"
                                    onClick={() => setShowInfoPanel(!showInfoPanel)}
                                    color={showInfoPanel ? 'primary' : 'default'}
                                >
                                    <InfoIcon />
                                </IconButton>
                            </Tooltip>
                            
                            <Tooltip title="Дополнительно">
                                <IconButton
                                    size="small"
                                    onClick={(e) => setActionsMenuAnchor(e.currentTarget)}
                                >
                                    <MoreHorizIcon />
                                </IconButton>
                            </Tooltip>
                            
                            {/* Меню дополнительных действий */}
                            <Menu
                                anchorEl={actionsMenuAnchor}
                                open={Boolean(actionsMenuAnchor)}
                                onClose={() => setActionsMenuAnchor(null)}
                                transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                                anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
                            >
                                <MenuItem onClick={() => {
                                    loadTaskAttachments();
                                    setActionsMenuAnchor(null);
                                }}>
                                    <RefreshIcon fontSize="small" sx={{ mr: 1 }} />
                                    {t('attachmentsRefresh')}
                                </MenuItem>
                                
                                {isSelectionMode && selectedFiles.size > 0 && (
                                    <>
                                        <MenuItem onClick={() => {
                                            selectAllFiles();
                                            setActionsMenuAnchor(null);
                                        }}>
                                            <SelectAllIcon fontSize="small" sx={{ mr: 1 }} />
                                            {selectedFiles.size === processedAttachments.length ? t('attachmentsDeselectAll') : t('attachmentsSelectAll')}
                                        </MenuItem>
                                        
                                        <MenuItem onClick={() => {
                                            deleteSelectedFiles();
                                            setActionsMenuAnchor(null);
                                        }} sx={{ color: 'error.main' }}>
                                            <DeleteSweepIcon fontSize="small" sx={{ mr: 1 }} />
                                            {t('attachmentsDeleteSelected')} ({selectedFiles.size})
                                        </MenuItem>
                                    </>
                                )}
                                
                                {!isMobile && (
                                    <>
                                        <MenuItem onClick={() => {
                                            setCompactMode(!compactMode);
                                            setActionsMenuAnchor(null);
                                        }}>
                                            <CompressIcon fontSize="small" sx={{ mr: 1 }} />
                                            {compactMode ? t('attachmentsFullMode') : t('attachmentsCompactMode')}
                                        </MenuItem>
                                        
                                        <MenuItem onClick={() => {
                                            const sizes = ['small', 'medium', 'large'] as const;
                                            const currentIndex = sizes.indexOf(thumbnailSize);
                                            const nextIndex = (currentIndex + 1) % sizes.length;
                                            setThumbnailSize(sizes[nextIndex]);
                                            setActionsMenuAnchor(null);
                                        }}>
                                            <PhotoSizeSelectLargeIcon fontSize="small" sx={{ mr: 1 }} />
                                            {t('attachmentsSizeLabel')} {thumbnailSize === 'small' ? t('attachmentsSizeSmall') : thumbnailSize === 'medium' ? t('attachmentsSizeMedium') : t('attachmentsSizeLarge')}
                                        </MenuItem>
                                    </>
                                )}
                            </Menu>
                        </>
                    )}
                </Box>
                
                <input
                    type="file"
                    ref={fileInputRef}
                    style={{ display: 'none' }}
                    onChange={handleFileSelected}
                    multiple
                    accept="*"
                />
            </Box>
            
            {/* Компактная информационная панель */}
            {attachments.length > 0 && showInfoPanel && (
                <Fade in={showInfoPanel}>
                    <Paper variant="outlined" sx={{ p: 1.5, mb: 2, bgcolor: isDarkTheme ? 'grey.900' : 'grey.50' }}>
                        <Stack spacing={1.5}>
                            {/* Основная статистика */}
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <StorageIcon fontSize="small" color="primary" />
                                    <Typography variant="body2">
                                        <strong>{attachments.length}</strong> {t('attachmentsFiles')}, <strong>{formatFileSizeHelper(getTotalSize())}</strong>
                                    </Typography>
                                </Box>
                                
                                {selectedFiles.size > 0 && (
                                    <>
                                        <Divider orientation="vertical" flexItem />
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <CheckBoxIcon fontSize="small" color="primary" />
                                            <Typography variant="body2" color="primary">
                                                Выбрано: <strong>{selectedFiles.size}</strong>, <strong>{formatFileSizeHelper(getSelectedSize())}</strong>
                                            </Typography>
                                        </Box>
                                    </>
                                )}
                                
                                {!isMobile && attachments.length > 1 && (
                                    <Typography variant="caption" color="text.secondary" sx={{ ml: 'auto' }}>
                                        Средний: {formatFileSizeHelper(getTotalSize() / attachments.length)}
                                    </Typography>
                                )}
                            </Box>
                            
                            {/* Статистика по типам - компактно */}
                            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                                {(() => {
                                    const stats = getFileTypeStats();
                                    const types = [
                                        { key: 'images', label: 'Изображения', shortLabel: 'Изобр', color: theme.palette.success.main },
                                        { key: 'videos', label: 'Видео', shortLabel: 'Видео', color: theme.palette.secondary.main },
                                        { key: 'documents', label: 'Документы', shortLabel: 'Док', color: theme.palette.error.main },
                                        { key: 'text', label: 'Текст', shortLabel: 'Текст', color: theme.palette.info.main },
                                        { key: 'other', label: 'Прочие', shortLabel: 'Прочие', color: theme.palette.grey[500] }
                                    ];
                                    
                                    return types
                                        .filter(type => stats[type.key as keyof typeof stats] > 0)
                                        .map(type => (
                                            <Chip
                                                key={type.key}
                                                label={`${isMobile ? type.shortLabel : type.label}: ${stats[type.key as keyof typeof stats]}`}
                                                size="small"
                                                sx={{
                                                    fontSize: '0.7rem',
                                                    height: 24,
                                                    backgroundColor: alpha(type.color, 0.1),
                                                    color: type.color,
                                                    borderColor: alpha(type.color, 0.3),
                                                    border: `1px solid ${alpha(type.color, 0.3)}`
                                                }}
                                            />
                                        ));
                                })()}
                            </Box>
                        </Stack>
                    </Paper>
                </Fade>
            )}
            
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
            
            {/* Прогресс множественной загрузки файлов */}
            <Fade in={uploadingFiles.length > 0}>
                <Box sx={{ mb: 2 }}>
                    {uploadingFiles.length > 0 && (
                        <Paper variant="outlined" sx={{ p: 2 }}>
                            <Typography variant="subtitle2" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                                <CircularProgress size={16} sx={{ mr: 1 }} />
                                {t('attachmentsUploadingFiles')} ({uploadingFiles.length})
                            </Typography>
                            {uploadingFiles.map((fileName) => {
                                const progress = multipleUploadProgress[fileName] || 0;
                                return (
                                    <Box key={fileName} sx={{ mb: 1 }}>
                                        <Typography variant="body2" sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                {fileName}
                                            </span>
                                            <span>{Math.round(progress)}%</span>
                                        </Typography>
                                        <Box 
                                            sx={{ 
                                                width: '100%', 
                                                backgroundColor: isDarkTheme ? alpha('#fff', 0.1) : alpha('#000', 0.1),
                                                borderRadius: 1,
                                                mt: 0.5,
                                                overflow: 'hidden',
                                                height: 4
                                            }}
                                        >
                                            <Box
                                                sx={{
                                                    height: '100%',
                                                    borderRadius: 1,
                                                    backgroundColor: 'primary.main',
                                                    width: `${progress}%`,
                                                    transition: 'width 0.3s ease-in-out'
                                                }}
                                            />
                                        </Box>
                                    </Box>
                                );
                            })}
                        </Paper>
                    )}
                </Box>
            </Fade>
            
            {/* Отображение загрузки, ошибок и пустого списка вложений */}
            {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', my: 4, flexDirection: 'column', alignItems: 'center' }}>
                    <CircularProgress size={40} />
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                        {t('attachmentsLoadingAttachments')}
                    </Typography>
                </Box>
            ) : error ? (
                <Alert 
                    severity="error" 
                    sx={{ mb: 2 }} 
                    action={
                        <Button color="inherit" size="small" onClick={loadTaskAttachments}>
                            {t('taskTryAgain')}
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
                        {t('attachmentsNoFilesAttached')}
                    </Typography>
                    <Button 
                        variant="outlined" 
                        color="primary"
                        startIcon={<AttachFileIcon />}
                        onClick={handleAttachButtonClick}
                    >
                        {t('attachmentsAttachFile')}
                    </Button>
                </Paper>
            ) : processedAttachments.length === 0 ? (
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
                        <SearchIcon sx={{ fontSize: 50, color: isDarkTheme ? alpha('#fff', 0.5) : alpha('#000', 0.3) }} />
                    </Box>
                    <Typography sx={{ color: 'text.secondary', mb: 2 }}>
                        {t('attachmentsNoFilesFound')}
                    </Typography>
                    <Button 
                        variant="outlined" 
                        color="primary"
                        onClick={() => {
                            setFilter('all');
                            setSearchQuery('');
                        }}
                    >
                        {t('attachmentsClearFilters')}
                    </Button>
                </Paper>
                            ) : (
                    /* Список вложений */
                    viewMode === 'grid' ? (
                        /* Вид сеткой карточек */
                        <Box sx={{ 
                            mt: 2,
                            display: 'flex',
                            flexWrap: 'wrap',
                            gap: compactMode ? 1 : 2,
                            justifyContent: isMobile ? 'center' : 'flex-start'
                        }}>
                            {processedAttachments.map((attachment, index) => (
                                renderAttachmentCard(attachment, index)
                            ))}
                        </Box>
                    ) : (
                        /* Вид списком */
                        <Paper variant="outlined" sx={{ borderRadius: 1, overflow: 'hidden' }}>
                            <List sx={{ width: '100%', bgcolor: 'background.paper', padding: 0 }}>
                                {processedAttachments.map((attachment, index) => (
                                    renderAttachmentListItem(attachment, index)
                                ))}
                            </List>
                        </Paper>
                    )
                )}
            
            {/* Диалог подтверждения удаления */}
            <ConfirmDialog
                open={confirmDelete}
                        title={t('attachmentsDeleteAttachment')}
        message={t('attachmentsConfirmDeleteFile')}
                onConfirm={handleConfirmDelete}
                onClose={() => setConfirmDelete(false)}
                actionType="delete"
                loading={loading}
            />
            
            {/* Диалог просмотра вложения */}
            <Dialog
                open={previewDialogOpen}
                onClose={() => setPreviewDialogOpen(false)}
                maxWidth={fullscreenPreview ? false : "lg"}
                fullWidth
                fullScreen={fullscreenPreview}
                PaperProps={{
                    sx: {
                        borderRadius: fullscreenPreview ? 0 : 2,
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
                        {(() => {
                            const previewableFiles = getPreviewableAttachments();
                            return previewableFiles.length > 1 && (
                                <Chip 
                                    label={`${currentPreviewIndex + 1} из ${previewableFiles.length}`}
                                    size="small"
                                    variant="outlined"
                                />
                            );
                        })()}
                    </Stack>
                    
                    <Stack direction="row" spacing={1}>
                        {/* Навигация между файлами */}
                        {(() => {
                            const previewableFiles = getPreviewableAttachments();
                            return previewableFiles.length > 1 && (
                                <>
                                    <Tooltip title={t('attachmentsPreviousFile')}>
                                        <IconButton 
                                            onClick={goToPreviousFile}
                                            size="small"
                                        >
                                            <NavigateBeforeIcon />
                                        </IconButton>
                                    </Tooltip>
                                    <Tooltip title={t('attachmentsNextFile')}>
                                        <IconButton 
                                            onClick={goToNextFile}
                                            size="small"
                                        >
                                            <NavigateNextIcon />
                                        </IconButton>
                                    </Tooltip>
                                </>
                            );
                        })()}
                        
                        {/* Полноэкранный режим */}
                        <Tooltip title={fullscreenPreview ? t('attachmentsExitFullscreen') : t('attachmentsFullscreen')}>
                            <IconButton 
                                onClick={toggleFullscreenPreview}
                                size="small"
                            >
                                {fullscreenPreview ? <FullscreenExitIcon /> : <FullscreenIcon />}
                            </IconButton>
                        </Tooltip>
                        
                        <IconButton 
                            onClick={() => setPreviewDialogOpen(false)}
                            size="small"
                            aria-label="close"
                        >
                            <CloseIcon />
                        </IconButton>
                    </Stack>
                </DialogTitle>
                
                <DialogContent sx={{ p: 0, overflow: 'hidden', position: 'relative' }}>
                    {renderPreviewContent()}
                    
                    {/* Навигация клавишами или свайпами */}
                    {(() => {
                        const previewableFiles = getPreviewableAttachments();
                        return previewableFiles.length > 1 && (
                            <>
                                <IconButton
                                    sx={{
                                        position: 'absolute',
                                        left: 16,
                                        top: '50%',
                                        transform: 'translateY(-50%)',
                                        backgroundColor: 'rgba(0,0,0,0.5)',
                                        color: 'white',
                                        '&:hover': {
                                            backgroundColor: 'rgba(0,0,0,0.7)'
                                        }
                                    }}
                                    onClick={goToPreviousFile}
                                >
                                    <NavigateBeforeIcon />
                                </IconButton>
                                <IconButton
                                    sx={{
                                        position: 'absolute',
                                        right: 16,
                                        top: '50%',
                                        transform: 'translateY(-50%)',
                                        backgroundColor: 'rgba(0,0,0,0.5)',
                                        color: 'white',
                                        '&:hover': {
                                            backgroundColor: 'rgba(0,0,0,0.7)'
                                        }
                                    }}
                                    onClick={goToNextFile}
                                >
                                    <NavigateNextIcon />
                                </IconButton>
                            </>
                        );
                    })()}
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
                            {t('close')}
                        </Button>
                        {previewAttachment && (
                            <Button 
                                variant="contained"
                                startIcon={<DownloadIcon />}
                                onClick={() => handleDownload(previewAttachment)}
                            >
                                {t('download')}
                            </Button>
                        )}
                    </Stack>
                </DialogActions>
            </Dialog>
        </Box>
    );
}; 