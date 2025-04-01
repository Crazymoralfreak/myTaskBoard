import React, { useState, useEffect, useRef } from 'react';
import {
    Box,
    Typography,
    TextField,
    Button,
    Avatar,
    Paper,
    Divider,
    IconButton,
    Menu,
    MenuItem,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    CircularProgress,
    Zoom,
    Card,
    Fade,
    Chip,
    useTheme,
    alpha
} from '@mui/material';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import ReplyIcon from '@mui/icons-material/Reply';
import SendIcon from '@mui/icons-material/Send';
import { Task, TaskComment } from '../../../types/task';
import { ConfirmDialog } from '../../shared/ConfirmDialog';
import { useAuth } from '../../../hooks/useAuth';
import { taskService } from '../../../services/taskService';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

// Расширяем интерфейс TaskComment для поддержки вложенных комментариев в UI
interface CommentWithReplies extends TaskComment {
    parentId?: number;
    replies?: CommentWithReplies[];
    isNew?: boolean; // Для анимации новых комментариев
}

interface TaskCommentsProps {
    taskId: number;
    onTaskUpdate?: (updatedTaskInfo?: { id: number, commentCount: number }) => void;
}

export const TaskComments: React.FC<TaskCommentsProps> = ({ taskId, onTaskUpdate }) => {
    const { user } = useAuth();
    const theme = useTheme();
    const commentsEndRef = useRef<HTMLDivElement>(null);
    
    // Состояния для работы с комментариями
    const [comments, setComments] = useState<CommentWithReplies[]>([]);
    const [loading, setLoading] = useState(false);
    const [newComment, setNewComment] = useState('');
    const [replyToId, setReplyToId] = useState<number | null>(null);
    const [replyContent, setReplyContent] = useState('');
    const [editingCommentId, setEditingCommentId] = useState<number | null>(null);
    const [editContent, setEditContent] = useState('');
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [selectedCommentId, setSelectedCommentId] = useState<number | null>(null);
    const [confirmDelete, setConfirmDelete] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [commentCount, setCommentCount] = useState(0);
    
    // Упрощаем конфигурацию для ReactQuill
    const quillModules = {
        toolbar: [
            ['bold', 'italic', 'underline'],
            [{ 'list': 'ordered'}, { 'list': 'bullet' }],
            ['link']
        ]
    };
    
    const quillFormats = [
        'bold', 'italic', 'underline', 'strike',
        'list', 'bullet', 'link'
    ];
    
    // Коммент для реализации getComments, который не существует в taskService
    const fetchComments = async (taskId: number): Promise<TaskComment[]> => {
        // Здесь должна быть реализация получения комментариев
        // В текущей версии API мы просто создаем пустой массив
        console.log('Получение комментариев для задачи:', taskId);
        return [];
    };
    
    // Прокрутка к новому комментарию
    const scrollToBottom = () => {
        commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };
    
    // Загрузка комментариев из API
    useEffect(() => {
        if (!taskId) return;
        
        setLoading(true);
        
        // Загружаем задачу, чтобы получить комментарии
        taskService.getTask(Number(taskId))
            .then((task: Task) => {
                if (task && task.comments) {
                    setComments(task.comments as CommentWithReplies[]);
                    setCommentCount(task.comments.length);
                } else {
                    setComments([]);
                    setCommentCount(0);
                }
                setLoading(false);
            })
            .catch((err: Error) => {
                console.error('Ошибка при загрузке комментариев:', err);
                setError('Не удалось загрузить комментарии. Пожалуйста, попробуйте снова.');
                setLoading(false);
            });
    }, [taskId]);
    
    // Добавление нового комментария
    const handleAddComment = async () => {
        if (!newComment.trim()) return;
        
        // Проверяем, что taskId существует и является числом
        if (!taskId || isNaN(Number(taskId))) {
            setError('Ошибка: некорректный ID задачи');
            return;
        }
        
        try {
            setLoading(true);
            
            // Сохраняем текст комментария в переменную и очищаем поле ввода
            const commentText = newComment.trim();
            setNewComment('');
            
            // Временный ID для оптимистичного обновления
            const tempId = Date.now();
            
            // Создаем временный комментарий для мгновенного отображения
            const tempComment: CommentWithReplies = {
                id: tempId, // Временный ID
                content: commentText,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                author: {
                    id: user?.id || 0,
                    username: user?.username || 'Вы'
                },
                isNew: true
            };
            
            // Добавляем временный комментарий в список
            setComments(prev => [...prev, tempComment]);
            setCommentCount(prev => prev + 1);
            
            // Прокручиваем к новому комментарию
            setTimeout(scrollToBottom, 100);
            
            // Вызываем метод API для добавления комментария
            const updatedTask = await taskService.addComment(Number(taskId), commentText);
            
            // Обновляем список комментариев из полученных данных
            if (updatedTask && updatedTask.comments) {
                // Заменяем временный комментарий на реальный
                const updatedComments = updatedTask.comments as CommentWithReplies[];
                setComments(updatedComments);
                setCommentCount(updatedComments.length);
                console.log('Комментарий успешно добавлен, задача обновлена:', updatedTask);
            }
            
            // Обновляем только счетчик комментариев, не всю задачу
            if (onTaskUpdate) {
                onTaskUpdate({
                    id: taskId,
                    commentCount: updatedTask?.comments?.length || (comments.length + 1)
                });
            }
        } catch (err) {
            console.error('Ошибка при добавлении комментария:', err);
            setError('Не удалось добавить комментарий. Пожалуйста, попробуйте снова.');
            // В случае ошибки возвращаем ввод пользователя
            setNewComment(newComment);
            // И удаляем временный комментарий
            setComments(prev => prev.filter(c => !c.isNew));
        } finally {
            setLoading(false);
        }
    };
    
    // Добавление ответа на комментарий
    const handleAddReply = async (parentId: number) => {
        if (!replyContent.trim() || !taskId) return;
        
        try {
            setLoading(true);
            
            // В текущей версии API нет поддержки вложенных комментариев,
            // поэтому просто добавляем как обычный комментарий с упоминанием
            const parentComment = comments.find(c => c.id === parentId);
            const replyText = parentComment 
                ? `@${parentComment.author.username}: ${replyContent.trim()}`
                : replyContent.trim();
                
            // Вызываем метод API для добавления комментария
            const updatedTask = await taskService.addComment(Number(taskId), replyText);
            
            // Обновляем список комментариев из полученных данных
            if (updatedTask && updatedTask.comments) {
                setComments(updatedTask.comments as CommentWithReplies[]);
                setCommentCount(updatedTask.comments.length);
            }
            
            // Очищаем поле ввода
            setReplyToId(null);
            setReplyContent('');
            
            // Обновляем только счетчик комментариев, не всю задачу
            if (onTaskUpdate) {
                onTaskUpdate({
                    id: taskId,
                    commentCount: updatedTask?.comments?.length || comments.length
                });
            }
            
            // Прокручиваем к новому комментарию
            setTimeout(scrollToBottom, 100);
        } catch (err) {
            console.error('Ошибка при добавлении ответа:', err);
            setError('Не удалось добавить ответ. Пожалуйста, попробуйте снова.');
        } finally {
            setLoading(false);
        }
    };
    
    // Редактирование комментария - в будущих версиях API
    const handleEditComment = async () => {
        if (!editContent.trim() || !editingCommentId) return;
        
        try {
            setLoading(true);
            // Вызываем метод API для обновления комментария
            const updatedTask = await taskService.updateComment(taskId, editingCommentId, editContent.trim());
            
            // Обновляем состояние комментариев после успешного ответа от сервера
            if (updatedTask && updatedTask.comments) {
                setComments(updatedTask.comments as CommentWithReplies[]);
            }
            
            // Очищаем состояние редактирования
            setEditingCommentId(null);
            setEditContent('');
            
            // Обновляем родительский компонент с обновленной задачей
            if (onTaskUpdate) {
                onTaskUpdate({
                    id: taskId,
                    commentCount: updatedTask?.comments?.length || comments.length
                });
            }
        } catch (err) {
            console.error('Ошибка при обновлении комментария:', err);
            setError('Не удалось обновить комментарий. Пожалуйста, попробуйте снова.');
        } finally {
            setLoading(false);
        }
    };
    
    // Удаление комментария
    const handleDeleteComment = async () => {
        if (!selectedCommentId) return;
        
        try {
            setLoading(true);
            // Вызываем метод API для удаления комментария
            const updatedTask = await taskService.deleteComment(taskId, selectedCommentId);
            
            // Обновляем состояние комментариев после успешного ответа от сервера
            if (updatedTask && updatedTask.comments) {
                setComments(updatedTask.comments as CommentWithReplies[]);
            } else {
                // Если почему-то комментарии не вернулись, просто удаляем локально
                setComments(prev => prev.filter(c => c.id !== selectedCommentId));
            }
            
            setSelectedCommentId(null);
            setConfirmDelete(false);
            
            // Обновляем родительский компонент с обновленной задачей
            if (onTaskUpdate) {
                onTaskUpdate();
            }
        } catch (err) {
            console.error('Ошибка при удалении комментария:', err);
            setError('Не удалось удалить комментарий. Пожалуйста, попробуйте снова.');
        } finally {
            setLoading(false);
        }
    };
    
    // Обработка открытия меню
    const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, commentId: number) => {
        setAnchorEl(event.currentTarget);
        setSelectedCommentId(commentId);
    };
    
    // Обработка закрытия меню
    const handleMenuClose = () => {
        setAnchorEl(null);
        setSelectedCommentId(null);
    };
    
    // Начало редактирования комментария
    const handleStartEdit = () => {
        const commentToEdit = findCommentById(selectedCommentId!);
        
        if (commentToEdit) {
            setEditingCommentId(selectedCommentId);
            setEditContent(commentToEdit.content);
        }
        
        handleMenuClose();
    };
    
    // Функция для поиска комментария по ID (включая вложенные)
    const findCommentById = (id: number): CommentWithReplies | undefined => {
        // Сначала ищем в корневых комментариях
        const rootComment = comments.find(c => c.id === id);
        if (rootComment) return rootComment;
        
        // Затем ищем во вложенных
        for (const comment of comments) {
            if (comment.replies) {
                const reply = comment.replies.find(r => r.id === id);
                if (reply) return reply;
            }
        }
        
        return undefined;
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
    
    // Проверка, может ли пользователь редактировать комментарий
    const canEditComment = (comment: CommentWithReplies) => {
        if (!user || !comment.author) return false;
        return user.id === comment.author.id;
    };
    
    // Рендер комментария
    const renderComment = (comment: CommentWithReplies, isReply = false) => {
        const isEditing = editingCommentId === comment.id;
        
        // Защита от неопределенных данных
        if (!comment || !comment.author) {
            return null;
        }
        
        return (
            <Fade in key={comment.id} timeout={500}>
                <Card 
                    elevation={0} 
                    sx={{ 
                        p: 2, 
                        mb: 2, 
                        ml: isReply ? 4 : 0,
                        bgcolor: comment.isNew ? alpha(theme.palette.primary.light, 0.1) : 'background.paper',
                        borderLeft: comment.isNew ? `4px solid ${theme.palette.primary.main}` : undefined,
                        transition: 'all 0.3s ease',
                        '&:hover': {
                            boxShadow: 1
                        }
                    }}
                >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Avatar 
                                // У автора комментария может не быть avatarUrl
                                src={undefined} 
                                alt={comment.author?.username || 'Пользователь'}
                                sx={{ width: 32, height: 32 }}
                            >
                                {comment.author?.username?.[0]?.toUpperCase() || 'U'}
                            </Avatar>
                            <Box>
                                <Typography variant="subtitle2" sx={{ fontWeight: comment.isNew ? 'bold' : 'normal' }}>
                                    {comment.author?.username || 'Пользователь'}
                                    {comment.author?.id === user?.id && 
                                        <Chip size="small" label="Вы" sx={{ ml: 1, height: 16, fontSize: '0.7rem' }} />
                                    }
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                    {formatDate(comment.createdAt)}
                                    {comment.updatedAt && comment.updatedAt !== comment.createdAt && 
                                        ` (изменено ${formatDate(comment.updatedAt)})`}
                                </Typography>
                            </Box>
                        </Box>
                        
                        {canEditComment(comment) && (
                            <IconButton 
                                size="small" 
                                onClick={(e) => handleMenuOpen(e, comment.id)}
                            >
                                <MoreVertIcon fontSize="small" />
                            </IconButton>
                        )}
                    </Box>
                    
                    {isEditing ? (
                        <Box sx={{ mt: 2 }}>
                            <ReactQuill
                                value={editContent}
                                onChange={setEditContent}
                                modules={quillModules}
                                formats={quillFormats}
                                theme="snow"
                                style={{ height: '100px', marginBottom: '30px' }}
                            />
                            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2, gap: 1 }}>
                                <Button 
                                    size="small" 
                                    onClick={() => setEditingCommentId(null)}
                                >
                                    Отмена
                                </Button>
                                <Button 
                                    size="small" 
                                    variant="contained" 
                                    onClick={handleEditComment}
                                    disabled={!editContent.trim()}
                                >
                                    Сохранить
                                </Button>
                            </Box>
                        </Box>
                    ) : (
                        <>
                            <Box
                                sx={{ mt: 1 }}
                                dangerouslySetInnerHTML={{ __html: comment.content }}
                            />
                            
                            {!isReply && (
                                <Box sx={{ mt: 2 }}>
                                    <Button 
                                        size="small" 
                                        startIcon={<ReplyIcon />}
                                        onClick={() => setReplyToId(comment.id)}
                                    >
                                        Ответить
                                    </Button>
                                </Box>
                            )}
                            
                            {replyToId === comment.id && (
                                <Box sx={{ mt: 2 }}>
                                    <Box sx={{ 
                                        position: 'relative', 
                                        border: `1px solid ${theme.palette.divider}`,
                                        borderRadius: '4px',
                                        '.ql-toolbar': {
                                            borderTop: 'none',
                                            borderLeft: 'none',
                                            borderRight: 'none',
                                            padding: '6px',
                                            borderColor: theme.palette.divider,
                                            borderRadius: '4px 4px 0 0',
                                        },
                                        '.ql-container': {
                                            borderBottom: 'none',
                                            borderLeft: 'none',
                                            borderRight: 'none',
                                            borderRadius: '0 0 4px 4px',
                                            fontSize: '14px',
                                        },
                                        '.ql-editor': {
                                            padding: '6px 10px',
                                            maxHeight: '120px',
                                            minHeight: '60px',
                                            overflowY: 'auto',
                                        }
                                    }}>
                                        <ReactQuill
                                            value={replyContent}
                                            onChange={setReplyContent}
                                            modules={quillModules}
                                            formats={quillFormats}
                                            placeholder="Напишите ответ..."
                                            theme="snow"
                                        />
                                        
                                        <Box sx={{ 
                                            display: 'flex', 
                                            justifyContent: 'flex-end', 
                                            gap: 1,
                                            padding: '6px',
                                            borderTop: `1px solid ${theme.palette.divider}`,
                                            backgroundColor: alpha(theme.palette.background.default, 0.5),
                                        }}>
                                            <Button 
                                                size="small" 
                                                onClick={() => setReplyToId(null)}
                                                sx={{ 
                                                    borderRadius: '18px',
                                                    padding: '3px 12px',
                                                }}
                                            >
                                                Отмена
                                            </Button>
                                            <Button 
                                                size="small" 
                                                variant="contained" 
                                                color="primary"
                                                onClick={() => handleAddReply(comment.id)}
                                                disabled={!replyContent.trim()}
                                                startIcon={<ReplyIcon fontSize="small" />}
                                                sx={{ 
                                                    borderRadius: '18px',
                                                    padding: '3px 12px',
                                                    boxShadow: 'none',
                                                    '&:hover': {
                                                        boxShadow: 'none',
                                                    }
                                                }}
                                            >
                                                Ответить
                                            </Button>
                                        </Box>
                                    </Box>
                                </Box>
                            )}
                        </>
                    )}
                    
                    {/* Рендерим вложенные комментарии */}
                    {comment.replies && comment.replies.length > 0 && (
                        <Box sx={{ mt: 2 }}>
                            {comment.replies.map(reply => renderComment(reply, true))}
                        </Box>
                    )}
                </Card>
            </Fade>
        );
    };
    
    return (
        <Box>
            <Typography variant="h6" gutterBottom>Комментарии</Typography>
            
            {/* Исправляем отображение ошибки */}
            {error && (
                <Typography color="error" sx={{ mb: 2 }}>
                    {error}
                </Typography>
            )}
            
            {/* Форма добавления нового комментария */}
            <Paper 
                elevation={0} 
                variant="outlined" 
                sx={{ 
                    p: 2, 
                    mb: 3,
                    borderRadius: '8px',
                    backgroundColor: theme.palette.background.paper,
                }}
            >
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                    <Avatar 
                        src={undefined} 
                        alt={user?.username || 'Аватар'}
                        sx={{ width: 36, height: 36 }}
                    >
                        {user?.username?.charAt(0).toUpperCase() || 'U'}
                    </Avatar>
                    <Box sx={{ flexGrow: 1 }}>
                        {/* Улучшенный контейнер для редактора */}
                        <Box sx={{ 
                            position: 'relative', 
                            border: `1px solid ${theme.palette.divider}`,
                            borderRadius: '4px',
                            '.ql-toolbar': {
                                borderTop: 'none',
                                borderLeft: 'none',
                                borderRight: 'none',
                                padding: '8px',
                                borderColor: theme.palette.divider,
                                borderRadius: '4px 4px 0 0',
                            },
                            '.ql-container': {
                                borderBottom: 'none',
                                borderLeft: 'none',
                                borderRight: 'none',
                                borderRadius: '0 0 4px 4px',
                                fontSize: '14px',
                            },
                            '.ql-editor': {
                                padding: '8px 12px',
                                maxHeight: '150px',
                                minHeight: '80px',
                                overflowY: 'auto',
                            }
                        }}>
                            <ReactQuill
                                value={newComment}
                                onChange={setNewComment}
                                modules={quillModules}
                                formats={quillFormats}
                                placeholder="Добавьте комментарий..."
                                theme="snow"
                            />
                            
                            {/* Кнопка отправки внутри редактора */}
                            <Box sx={{ 
                                display: 'flex', 
                                justifyContent: 'flex-end', 
                                padding: '8px',
                                borderTop: `1px solid ${theme.palette.divider}`,
                                backgroundColor: alpha(theme.palette.background.default, 0.5),
                            }}>
                                <Button 
                                    variant="contained" 
                                    size="small"
                                    color="primary"
                                    onClick={handleAddComment}
                                    disabled={!newComment.trim() || loading}
                                    startIcon={loading ? <CircularProgress size={16} /> : <SendIcon />}
                                    sx={{ 
                                        borderRadius: '18px',
                                        padding: '4px 16px',
                                        boxShadow: 'none',
                                        '&:hover': {
                                            boxShadow: 'none',
                                        }
                                    }}
                                >
                                    Отправить
                                </Button>
                            </Box>
                        </Box>
                    </Box>
                </Box>
            </Paper>
            
            <Divider sx={{ my: 2 }} />
            
            {/* Список комментариев */}
            {loading && comments.length === 0 ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                    <CircularProgress />
                </Box>
            ) : error ? (
                <Typography color="error">{error}</Typography>
            ) : comments.length === 0 ? (
                <Paper 
                    variant="outlined" 
                    sx={{ 
                        p: 4, 
                        textAlign: 'center', 
                        bgcolor: theme.palette.background.paper 
                    }}
                >
                    <Typography variant="body1" color="text.secondary">
                        Комментариев пока нет. Будьте первым, кто оставит комментарий!
                    </Typography>
                </Paper>
            ) : (
                <Box>
                    <Box sx={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center',
                        mb: 2 
                    }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                            Все комментарии ({commentCount})
                        </Typography>
                        {comments.length > 3 && (
                            <Button 
                                size="small" 
                                onClick={scrollToBottom}
                            >
                                В конец
                            </Button>
                        )}
                    </Box>
                    {comments.map(comment => renderComment(comment))}
                    <div ref={commentsEndRef} /> {/* Референс для прокрутки к концу списка */}
                </Box>
            )}
            
            {/* Меню действий для комментария */}
            <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleMenuClose}
            >
                <MenuItem onClick={handleStartEdit}>
                    <EditIcon fontSize="small" sx={{ mr: 1 }} />
                    Редактировать
                </MenuItem>
                <MenuItem onClick={() => {
                    setConfirmDelete(true);
                    handleMenuClose();
                }} sx={{ color: 'error.main' }}>
                    <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
                    Удалить
                </MenuItem>
            </Menu>
            
            {/* Диалог подтверждения удаления */}
            <ConfirmDialog
                open={confirmDelete}
                title="Удалить комментарий"
                message="Вы уверены, что хотите удалить этот комментарий? Это действие нельзя отменить."
                onConfirm={handleDeleteComment}
                onClose={() => setConfirmDelete(false)}
                actionType="delete"
                loading={loading}
            />
        </Box>
    );
}; 