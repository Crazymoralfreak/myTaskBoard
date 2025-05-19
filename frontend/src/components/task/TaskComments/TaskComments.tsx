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
    alpha,
    Tooltip
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
import { getAvatarUrl } from '../../../utils/avatarUtils';
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
    canComment?: boolean;
}

export const TaskComments: React.FC<TaskCommentsProps> = ({ taskId, onTaskUpdate, canComment = true }) => {
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
                // Находим реальный добавленный комментарий (предполагаем, что он последний в списке)
                const realComment = updatedTask.comments[updatedTask.comments.length - 1] as CommentWithReplies;
                
                // Обновляем список: заменяем временный комментарий реальным
                setComments(prev => 
                    prev.map(c => c.id === tempId ? { ...realComment, isNew: true } : c)
                );
                // Устанавливаем таймаут для удаления флага isNew, чтобы анимация не повторялась
                setTimeout(() => {
                    setComments(prev => prev.map(c => c.id === realComment.id ? { ...c, isNew: false } : c));
                }, 1500); // Длительность анимации + небольшой запас
                
                setCommentCount(updatedTask.comments.length);
                console.log('Комментарий успешно добавлен, задача обновлена:', updatedTask);
            } else {
                // Если ответ не содержит комментариев (неожиданно), удаляем временный
                setComments(prev => prev.filter(c => c.id !== tempId));
                setCommentCount(prev => prev - 1); // Уменьшаем счетчик обратно
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
    const canEditComment = (comment: CommentWithReplies): boolean => {
        // Сначала проверяем право на комментирование
        if (!canComment) {
            return false;
        }
        
        if (!user || !comment.author) {
            // Добавляем лог для случая отсутствия данных
            console.log('[canEditComment] Проверка невозможна: Нет user или comment.author', {
                userId: user?.id,
                authorId: comment.author?.id
            });
            return false;
        }
        
        // ИСПРАВЛЕНИЕ: Добавляем console.log для диагностики ID
        console.log('[canEditComment] Сравнение ID:', {
            userId: user.id,
            authorId: comment.author.id,
            userIdType: typeof user.id,
            authorIdType: typeof comment.author.id,
            isMatch: user.id === comment.author.id
        });
        
        return user.id === comment.author.id;
    };
    
    // Функция для рендеринга комментария
    const renderComment = (comment: CommentWithReplies, isReply = false) => {
        if (!comment || !comment.author) {
            console.warn("Попытка отрисовать некорректный комментарий:", comment);
            return null;
        }
        
        const isCurrentUserComment = comment.author && user && comment.author.id === user.id;
        const animationDuration = 1000; // Длительность анимации
        
        return (
            <Zoom 
                key={comment.id} 
                in={true} 
                timeout={comment.isNew ? animationDuration : 0}
                mountOnEnter
                unmountOnExit
            >
                <Box 
                    sx={{
                        display: 'flex', 
                        mb: 2, 
                        pl: isReply ? 4 : 0,
                        position: 'relative',
                        bgcolor: comment.isNew ? alpha(theme.palette.primary.light, 0.1) : 'transparent',
                        transition: `background-color ${animationDuration}ms ease-out`,
                        borderRadius: 1,
                        p: comment.isNew ? 1 : 0,
                        mx: comment.isNew ? -1 : 0,
                        '&:hover .comment-actions': {
                            opacity: 1,
                        },
                    }}
                >
                    <Box sx={{ mr: 1.5, flexShrink: 0 }}>
                        <Tooltip title={comment.author?.username || 'Пользователь'}>
                            <Avatar 
                                alt={comment.author?.username}
                                src={comment.author?.avatarUrl ? getAvatarUrl(comment.author.avatarUrl) : undefined}
                                sx={{ width: 32, height: 32 }}
                            >
                                {comment.author?.username ? comment.author.username.charAt(0).toUpperCase() : '?'}
                            </Avatar>
                        </Tooltip>
                    </Box>
                    <Paper 
                        variant="outlined" 
                        sx={{ 
                            p: 2, 
                            borderRadius: '8px',
                            backgroundColor: theme.palette.background.paper,
                        }}
                    >
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                                    {comment.author?.username || 'Пользователь'}
                                    {isCurrentUserComment && 
                                        <Chip size="small" label="Вы" sx={{ ml: 1, height: 16, fontSize: '0.7rem' }} />
                                    }
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                    {formatDate(comment.createdAt)}
                                    {comment.createdAt !== comment.updatedAt && 
                                        ` (изменено ${formatDate(comment.updatedAt)})`}
                                </Typography>
                            </Box>
                            
                            <Box className="comment-actions" sx={{ opacity: 0, transition: 'opacity 0.2s' }}> 
                                {editingCommentId !== comment.id && (
                                    <IconButton
                                        size="small"
                                        onClick={(e) => handleMenuOpen(e, comment.id)}
                                    >
                                        <MoreVertIcon fontSize="small" />
                                    </IconButton>
                                )}
                            </Box>
                        </Box>
                        
                        {editingCommentId === comment.id ? (
                            <Box sx={{ mt: 1 }}>
                                <ReactQuill 
                                    theme="snow"
                                    value={editContent}
                                    onChange={setEditContent}
                                    modules={quillModules}
                                    formats={quillFormats}
                                    placeholder="Введите комментарий..."
                                />
                                <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mt: 1 }}>
                                    <Button size="small" onClick={() => setEditingCommentId(null)}>
                                        Отмена
                                    </Button>
                                    <Button 
                                        size="small" 
                                        variant="contained" 
                                        onClick={handleEditComment}
                                        disabled={!editContent.trim() || loading}
                                    >
                                        Сохранить
                                    </Button>
                                </Box>
                            </Box>
                        ) : (
                            <Box 
                                sx={{ 
                                    "& a": { color: theme.palette.primary.main }, 
                                    "& p": { margin: 0 },
                                    wordBreak: 'break-word' 
                                }}
                                dangerouslySetInnerHTML={{ __html: comment.content }}
                            />
                        )}
                        
                        {replyToId === comment.id && (
                            <Box sx={{ mt: 2, ml: -5.5 }}>
                                <ReactQuill 
                                    theme="snow"
                                    value={replyContent}
                                    onChange={setReplyContent}
                                    modules={quillModules}
                                    formats={quillFormats}
                                    placeholder={`Ответ для ${comment.author?.username}...`}
                                />
                                <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mt: 1 }}>
                                    <Button size="small" onClick={() => setReplyToId(null)}>
                                        Отмена
                                    </Button>
                                    <Button 
                                        size="small" 
                                        variant="contained" 
                                        onClick={() => handleAddReply(comment.id)}
                                        disabled={!replyContent.trim() || loading}
                                        startIcon={<ReplyIcon />}
                                    >
                                        Ответить
                                    </Button>
                                </Box>
                            </Box>
                        )}
                        
                        {!editingCommentId && !replyToId && canComment && (
                            <Box sx={{ mt: 1, display: 'flex', justifyContent: 'flex-end' }}>
                                <Button 
                                    size="small" 
                                    startIcon={<ReplyIcon />}
                                    onClick={() => setReplyToId(comment.id)}
                                >
                                    Ответить
                                </Button>
                            </Box>
                        )}
                    </Paper>
                </Box>
            </Zoom>
        );
    };
    
    return (
        <Box sx={{ mt: 3 }}>
            <Typography variant="h6" gutterBottom>
                Комментарии ({commentCount})
            </Typography>
            
            {/* Список комментариев */}
            <Box sx={{ maxHeight: '400px', overflowY: 'auto', mb: 2, pr: 1 }}>
                {loading && comments.length === 0 && (
                    <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
                        <CircularProgress />
                    </Box>
                )}
                {error && (
                    <Typography color="error" sx={{ my: 2 }}>{error}</Typography>
                )}
                {!loading && comments.length === 0 && !error && (
                    <Typography color="text.secondary" sx={{ my: 2 }}>
                        Комментариев пока нет.
                    </Typography>
                )}
                {comments.map((comment) => renderComment(comment))}
                <div ref={commentsEndRef} />
            </Box>
            
            <Divider sx={{ my: 2 }} />
            
            {/* Поле для добавления нового комментария */} 
            {canComment ? (
                <>
                    <Typography variant="subtitle1" gutterBottom>
                        Добавить комментарий
                    </Typography>
                    <Box sx={{ mt: 1 }}>
                        <ReactQuill 
                            theme="snow"
                            value={newComment}
                            onChange={setNewComment}
                            modules={quillModules}
                            formats={quillFormats}
                            placeholder="Введите ваш комментарий..."
                        />
                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
                            <Button 
                                variant="contained"
                                onClick={handleAddComment}
                                disabled={!newComment.trim() || loading}
                                startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <SendIcon />}
                            >
                                {loading ? 'Отправка...' : 'Отправить'}
                            </Button>
                        </Box>
                    </Box>
                </>
            ) : (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                    У вас нет прав для добавления комментариев.
                </Typography>
            )}
            
            {/* Меню действий для комментария */} 
            <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleMenuClose}
            >
                {selectedCommentId && canEditComment(findCommentById(selectedCommentId)!) && (
                    <MenuItem onClick={handleStartEdit}>
                        <EditIcon fontSize="small" sx={{ mr: 1 }} /> Редактировать
                    </MenuItem>
                )}
                {canComment && (
                    <MenuItem onClick={() => { 
                        if (selectedCommentId) setReplyToId(selectedCommentId); 
                        handleMenuClose(); 
                    }}>
                        <ReplyIcon fontSize="small" sx={{ mr: 1 }} /> Ответить
                    </MenuItem>
                )}
                {selectedCommentId && canEditComment(findCommentById(selectedCommentId)!) && (
                    <MenuItem onClick={() => setConfirmDelete(true)} sx={{ color: 'error.main' }}>
                        <DeleteIcon fontSize="small" sx={{ mr: 1 }} /> Удалить
                    </MenuItem>
                )}
            </Menu>
            
            {/* Диалог подтверждения удаления */} 
            <ConfirmDialog
                open={confirmDelete}
                onClose={() => setConfirmDelete(false)}
                title="Удалить комментарий?"
                message="Вы уверены, что хотите удалить этот комментарий? Это действие необратимо."
                onConfirm={handleDeleteComment}
                actionType="delete"
            />
        </Box>
    );
}; 