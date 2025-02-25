import React, { useState, useRef } from 'react';
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
    Paper,
    LinearProgress,
    ListItemAvatar
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import { Subtask } from '../../../types/subtask';
import { Task } from '../../../types/task';
import { taskService } from '../../../services/taskService';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { formatFileSize } from '../../../utils/formatters';

interface SubtaskListProps {
    task: Task;
    onTaskUpdate: (updatedTask: Task) => void;
}

export const SubtaskList: React.FC<SubtaskListProps> = ({ task, onTaskUpdate }) => {
    const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
    const [editingSubtask, setEditingSubtask] = useState<number | null>(null);
    const [editTitle, setEditTitle] = useState('');
    const [loading, setLoading] = useState(false);
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [selectedSubtask, setSelectedSubtask] = useState<number | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [uploadProgress, setUploadProgress] = useState<number | null>(null);

    const formatDate = (date: string) => {
        return format(new Date(date), 'dd MMM yyyy HH:mm', { locale: ru });
    };

    const handleAddSubtask = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newSubtaskTitle.trim() || loading) return;

        try {
            setLoading(true);
            const updatedTask = await taskService.createSubtask(task.id, {
                title: newSubtaskTitle.trim()
            });
            onTaskUpdate(updatedTask);
            setNewSubtaskTitle('');
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
            const updatedTask = await taskService.updateSubtask(task.id, subtaskId, {
                completed: !completed
            });
            onTaskUpdate(updatedTask);
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
            const updatedTask = await taskService.deleteSubtask(task.id, subtaskId);
            onTaskUpdate(updatedTask);
        } catch (error) {
            console.error('Failed to delete subtask:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleStartEdit = (subtask: Subtask) => {
        setEditingSubtask(subtask.id);
        setEditTitle(subtask.title);
    };

    const handleSaveEdit = async () => {
        if (!editingSubtask || !editTitle.trim() || loading) return;

        try {
            setLoading(true);
            const updatedTask = await taskService.updateSubtask(task.id, editingSubtask, {
                title: editTitle.trim()
            });
            onTaskUpdate(updatedTask);
            setEditingSubtask(null);
            setEditTitle('');
        } catch (error) {
            console.error('Failed to update subtask:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDragEnd = async (result: any) => {
        if (!result.destination || loading || !task.subtasks) return;

        const items = Array.from(task.subtasks);
        const [reorderedItem] = items.splice(result.source.index, 1);
        items.splice(result.destination.index, 0, reorderedItem);

        try {
            setLoading(true);
            const updatedTask = await taskService.reorderSubtasks(
                task.id,
                items.map(item => item.id)
            );
            onTaskUpdate(updatedTask);
        } catch (error) {
            console.error('Failed to reorder subtasks:', error);
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
            const updatedTask = await taskService.assignSubtask(task.id, selectedSubtask, userId);
            onTaskUpdate(updatedTask);
        } catch (error) {
            console.error('Failed to assign subtask:', error);
        } finally {
            setLoading(false);
            handleAssigneeClose();
        }
    };

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        if (!event.target.files || loading) return;

        const file = event.target.files[0];
        if (!file) return;

        try {
            setLoading(true);
            setUploadProgress(0);
            const updatedTask = await taskService.uploadFile(task.id, file, (progress) => {
                setUploadProgress(progress);
            });
            onTaskUpdate(updatedTask);
        } catch (error) {
            console.error('Failed to upload file:', error);
        } finally {
            setLoading(false);
            setUploadProgress(null);
        }
    };

    const handleDeleteFile = async (fileId: number) => {
        if (loading) return;

        try {
            setLoading(true);
            const updatedTask = await taskService.deleteFile(task.id, fileId);
            onTaskUpdate(updatedTask);
        } catch (error) {
            console.error('Failed to delete file:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box>
            <Box sx={{ mb: 2 }}>
                <form onSubmit={handleAddSubtask}>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                        <TextField
                            size="small"
                            fullWidth
                            placeholder="Добавить подзадачу"
                            value={newSubtaskTitle}
                            onChange={(e) => setNewSubtaskTitle(e.target.value)}
                            disabled={loading}
                        />
                        <Button
                            variant="contained"
                            type="submit"
                            disabled={!newSubtaskTitle.trim() || loading}
                        >
                            {loading ? <CircularProgress size={24} /> : 'Добавить'}
                        </Button>
                    </Box>
                </form>
            </Box>

            <DragDropContext onDragEnd={handleDragEnd}>
                <Droppable droppableId="subtasks">
                    {(provided) => (
                        <List {...provided.droppableProps} ref={provided.innerRef}>
                            {task.subtasks?.map((subtask, index) => (
                                <Draggable
                                    key={subtask.id}
                                    draggableId={String(subtask.id)}
                                    index={index}
                                >
                                    {(provided) => (
                                        <ListItem
                                            ref={provided.innerRef}
                                            {...provided.draggableProps}
                                            {...provided.dragHandleProps}
                                            sx={{
                                                bgcolor: 'background.paper',
                                                mb: 1,
                                                borderRadius: 1,
                                                border: '1px solid',
                                                borderColor: 'divider'
                                            }}
                                        >
                                            <Checkbox
                                                checked={subtask.completed}
                                                onChange={() => handleToggleComplete(subtask.id, subtask.completed)}
                                                disabled={loading}
                                            />
                                            {editingSubtask === subtask.id ? (
                                                <Box sx={{ display: 'flex', gap: 1, flex: 1 }}>
                                                    <TextField
                                                        fullWidth
                                                        size="small"
                                                        value={editTitle}
                                                        onChange={(e) => setEditTitle(e.target.value)}
                                                        disabled={loading}
                                                    />
                                                    <Button
                                                        variant="contained"
                                                        onClick={handleSaveEdit}
                                                        disabled={!editTitle.trim() || loading}
                                                    >
                                                        Сохранить
                                                    </Button>
                                                </Box>
                                            ) : (
                                                <>
                                                    <ListItemText
                                                        primary={
                                                            <Typography
                                                                sx={{
                                                                    textDecoration: subtask.completed ? 'line-through' : 'none',
                                                                    color: subtask.completed ? 'text.secondary' : 'text.primary'
                                                                }}
                                                            >
                                                                {subtask.title}
                                                            </Typography>
                                                        }
                                                        secondary={
                                                            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                                                                {subtask.dueDate && (
                                                                    <Typography variant="caption">
                                                                        Срок: {format(new Date(subtask.dueDate), 'dd MMM yyyy', { locale: ru })}
                                                                    </Typography>
                                                                )}
                                                                {subtask.estimatedHours && (
                                                                    <Typography variant="caption">
                                                                        Оценка: {subtask.estimatedHours}ч
                                                                    </Typography>
                                                                )}
                                                            </Box>
                                                        }
                                                    />
                                                    <ListItemSecondaryAction>
                                                        <Box sx={{ display: 'flex', gap: 1 }}>
                                                            {subtask.assignee ? (
                                                                <Tooltip title={subtask.assignee.username}>
                                                                    <Avatar
                                                                        src={subtask.assignee.avatarUrl}
                                                                        sx={{ width: 24, height: 24, cursor: 'pointer' }}
                                                                        onClick={(e) => handleAssigneeClick(e, subtask.id)}
                                                                    />
                                                                </Tooltip>
                                                            ) : (
                                                                <IconButton
                                                                    size="small"
                                                                    onClick={(e) => handleAssigneeClick(e, subtask.id)}
                                                                    disabled={loading}
                                                                >
                                                                    <PersonAddIcon />
                                                                </IconButton>
                                                            )}
                                                            <IconButton
                                                                size="small"
                                                                onClick={() => handleStartEdit(subtask)}
                                                                disabled={loading}
                                                            >
                                                                <EditIcon />
                                                            </IconButton>
                                                            <IconButton
                                                                size="small"
                                                                onClick={() => handleDeleteSubtask(subtask.id)}
                                                                disabled={loading}
                                                            >
                                                                <DeleteIcon />
                                                            </IconButton>
                                                        </Box>
                                                    </ListItemSecondaryAction>
                                                </>
                                            )}
                                        </ListItem>
                                    )}
                                </Draggable>
                            ))}
                            {provided.placeholder}
                        </List>
                    )}
                </Droppable>
            </DragDropContext>

            {/* Список файлов */}
            <Box sx={{ mt: 2 }}>
                {task.attachments?.map((attachment) => (
                    <Paper key={attachment.id} variant="outlined" sx={{ p: 2, mb: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <AttachFileIcon color="action" />
                            <Box sx={{ flex: 1 }}>
                                <Typography variant="subtitle2">
                                    {attachment.filename}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                    {formatFileSize(attachment.size)} • Загружен {formatDate(attachment.createdAt)}
                                </Typography>
                            </Box>
                            <IconButton
                                size="small"
                                onClick={() => handleDeleteFile(attachment.id)}
                                disabled={loading}
                            >
                                <DeleteIcon />
                            </IconButton>
                        </Box>
                    </Paper>
                ))}

                <Box sx={{ mt: 2 }}>
                    <input
                        type="file"
                        ref={fileInputRef}
                        style={{ display: 'none' }}
                        onChange={handleFileUpload}
                    />
                    <Button
                        variant="outlined"
                        startIcon={<AttachFileIcon />}
                        onClick={() => fileInputRef.current?.click()}
                        disabled={loading}
                    >
                        Прикрепить файл
                    </Button>
                </Box>

                {uploadProgress !== null && (
                    <LinearProgress 
                        variant="determinate" 
                        value={uploadProgress} 
                        sx={{ mt: 1 }}
                    />
                )}
            </Box>

            <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleAssigneeClose}
            >
                {task.watchers?.map((user) => (
                    <MenuItem
                        key={user.id}
                        onClick={() => handleAssignSubtask(user.id)}
                        disabled={loading}
                    >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Avatar
                                src={user.avatarUrl}
                                sx={{ width: 24, height: 24 }}
                            />
                            <Typography>{user.username}</Typography>
                        </Box>
                    </MenuItem>
                ))}
            </Menu>
        </Box>
    );
}; 