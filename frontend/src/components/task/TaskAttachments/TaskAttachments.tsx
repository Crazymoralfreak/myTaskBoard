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
    TextField,
    Grid
} from '@mui/material';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import DownloadIcon from '@mui/icons-material/Download';
import DeleteIcon from '@mui/icons-material/Delete';
import DescriptionIcon from '@mui/icons-material/Description';
import ImageIcon from '@mui/icons-material/Image';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import { Task, TaskAttachment } from '../../../types/task';
import { ConfirmDialog } from '../../shared/ConfirmDialog';
import { taskService } from '../../../services/taskService';

interface TaskAttachmentsProps {
    taskId: number;
    onTaskUpdate?: (updatedTask: Task) => void;
}

export const TaskAttachments: React.FC<TaskAttachmentsProps> = ({ taskId, onTaskUpdate }) => {
    const [attachments, setAttachments] = useState<TaskAttachment[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [uploadProgress, setUploadProgress] = useState<number | null>(null);
    const [selectedAttachmentId, setSelectedAttachmentId] = useState<number | null>(null);
    const [confirmDelete, setConfirmDelete] = useState(false);
    const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
    const [previewAttachment, setPreviewAttachment] = useState<TaskAttachment | null>(null);
    
    const fileInputRef = useRef<HTMLInputElement>(null);
    
    // Загрузка вложений из задачи
    useEffect(() => {
        if (!taskId) return;
        
        setLoading(true);
        
        // Используем вложения, которые уже есть в задаче
        if (attachments) {
            setAttachments(attachments);
            setLoading(false);
        } else {
            // Если вложений нет, устанавливаем пустой массив
            setAttachments([]);
            setLoading(false);
        }
    }, [taskId, attachments]);
    
    // Обработка клика по кнопке добавления файла
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
            
            if (updatedTask && updatedTask.attachments) {
                setAttachments(updatedTask.attachments);
            }
            
            // Обновляем родительский компонент
            if (onTaskUpdate) {
                onTaskUpdate(updatedTask);
            }
            
        } catch (err) {
            console.error('Ошибка при загрузке файла:', err);
            setError('Не удалось загрузить файл. Пожалуйста, попробуйте снова.');
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
            
            if (updatedTask && updatedTask.attachments) {
                setAttachments(updatedTask.attachments);
            } else {
                // Если вложения не вернулись, удаляем локально
                setAttachments(prev => prev.filter(attachment => 
                    attachment.id !== selectedAttachmentId
                ));
            }
            
            // Обновляем родительский компонент
            if (onTaskUpdate) {
                onTaskUpdate(updatedTask);
            }
            
        } catch (err) {
            console.error('Ошибка при удалении файла:', err);
            setError('Не удалось удалить файл. Пожалуйста, попробуйте снова.');
        } finally {
            setLoading(false);
            setSelectedAttachmentId(null);
            setConfirmDelete(false);
        }
    };
    
    // Обработка клика для просмотра вложения
    const handlePreviewClick = (attachment: TaskAttachment) => {
        setPreviewAttachment(attachment);
        setPreviewDialogOpen(true);
    };
    
    // Форматирование размера файла
    const formatFileSize = (bytes: number) => {
        if (bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };
    
    // Определение иконки для типа файла
    const getFileIcon = (type: string) => {
        if (type.startsWith('image/')) {
            return <ImageIcon />;
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
        const date = new Date(dateString);
        return date.toLocaleString('ru-RU', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };
    
    // Проверка, может ли файл быть предпросмотрен
    const canPreview = (type: string) => {
        return type.startsWith('image/') || type === 'application/pdf' || type.startsWith('text/');
    };
    
    // Рендеринг содержимого предпросмотра
    const renderPreviewContent = () => {
        if (!previewAttachment) return null;
        
        const { mimeType, url, filename } = previewAttachment;
        
        if (mimeType.startsWith('image/')) {
            return (
                <Box sx={{ textAlign: 'center' }}>
                    <img 
                        src={url} 
                        alt={filename} 
                        style={{ maxWidth: '100%', maxHeight: '70vh' }} 
                    />
                </Box>
            );
        } else if (mimeType === 'application/pdf') {
            return (
                <Box sx={{ height: '70vh' }}>
                    <iframe 
                        src={`${url}#toolbar=0&navpanes=0`} 
                        width="100%" 
                        height="100%" 
                        style={{ border: 'none' }}
                        title={filename}
                    />
                </Box>
            );
        } else if (mimeType.startsWith('text/')) {
            return (
                <Paper sx={{ p: 2, maxHeight: '70vh', overflow: 'auto' }}>
                    <Typography variant="body2" component="pre" sx={{ whiteSpace: 'pre-wrap' }}>
                        {/* В реальном приложении здесь был бы код для загрузки и отображения текстового содержимого */}
                        Содержимое текстового файла "{filename}"
                    </Typography>
                </Paper>
            );
        } else {
            return (
                <Box sx={{ textAlign: 'center', p: 3 }}>
                    <Typography variant="body1">
                        Предпросмотр недоступен для данного типа файла
                    </Typography>
                    <Button 
                        variant="contained" 
                        startIcon={<DownloadIcon />}
                        sx={{ mt: 2 }}
                        href={url}
                        download={filename}
                    >
                        Скачать файл
                    </Button>
                </Box>
            );
        }
    };
    
    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">Вложения</Typography>
                <Button 
                    variant="contained" 
                    startIcon={<AttachFileIcon />}
                    onClick={handleAttachButtonClick}
                    disabled={!!uploadProgress || loading}
                >
                    Добавить файл
                </Button>
                <input
                    type="file"
                    ref={fileInputRef}
                    style={{ display: 'none' }}
                    onChange={handleFileSelected}
                />
            </Box>
            
            {uploadProgress !== null && (
                <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" gutterBottom>
                        Загрузка файла... {uploadProgress}%
                    </Typography>
                    <Box sx={{ width: '100%', backgroundColor: '#e0e0e0', borderRadius: 1 }}>
                        <Box
                            sx={{
                                height: 8,
                                borderRadius: 1,
                                backgroundColor: 'primary.main',
                                width: `${uploadProgress}%`,
                                transition: 'width 0.3s ease-in-out'
                            }}
                        />
                    </Box>
                </Box>
            )}
            
            {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
                    <CircularProgress />
                </Box>
            ) : error ? (
                <Typography color="error">{error}</Typography>
            ) : attachments.length === 0 ? (
                <Paper variant="outlined" sx={{ p: 3, textAlign: 'center' }}>
                    <Typography sx={{ color: 'text.secondary', mb: 2 }}>
                        К этой задаче пока не прикреплено ни одного файла
                    </Typography>
                    <Button 
                        variant="outlined" 
                        startIcon={<AttachFileIcon />}
                        onClick={handleAttachButtonClick}
                    >
                        Прикрепить файл
                    </Button>
                </Paper>
            ) : (
                <List sx={{ width: '100%', bgcolor: 'background.paper' }}>
                    {attachments.map((attachment, index) => (
                        <React.Fragment key={attachment.id}>
                            <ListItem 
                                button 
                                onClick={() => canPreview(attachment.mimeType) ? handlePreviewClick(attachment) : null}
                                sx={{ cursor: canPreview(attachment.mimeType) ? 'pointer' : 'default' }}
                            >
                                <ListItemIcon>
                                    {getFileIcon(attachment.mimeType)}
                                </ListItemIcon>
                                <ListItemText 
                                    primary={attachment.filename}
                                    secondary={
                                        <React.Fragment>
                                            <Typography component="span" variant="body2" color="text.secondary">
                                                {formatFileSize(attachment.size)} • Добавлено {formatDate(attachment.createdAt)}
                                            </Typography>
                                        </React.Fragment>
                                    }
                                />
                                <ListItemSecondaryAction>
                                    <IconButton 
                                        edge="end" 
                                        aria-label="download"
                                        href={attachment.url}
                                        download={attachment.filename}
                                        sx={{ mr: 0.5 }}
                                    >
                                        <DownloadIcon />
                                    </IconButton>
                                    <IconButton 
                                        edge="end" 
                                        aria-label="delete" 
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleDeleteClick(attachment.id);
                                        }}
                                    >
                                        <DeleteIcon />
                                    </IconButton>
                                </ListItemSecondaryAction>
                            </ListItem>
                            {index < attachments.length - 1 && <Divider />}
                        </React.Fragment>
                    ))}
                </List>
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
            >
                <DialogTitle>
                    {previewAttachment?.filename}
                </DialogTitle>
                <DialogContent>
                    {renderPreviewContent()}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setPreviewDialogOpen(false)}>
                        Закрыть
                    </Button>
                    {previewAttachment && (
                        <Button 
                            href={previewAttachment.url}
                            download={previewAttachment.filename}
                            variant="contained"
                            startIcon={<DownloadIcon />}
                        >
                            Скачать
                        </Button>
                    )}
                </DialogActions>
            </Dialog>
        </Box>
    );
}; 