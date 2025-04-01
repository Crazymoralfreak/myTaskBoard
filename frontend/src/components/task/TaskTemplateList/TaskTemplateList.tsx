import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Button,
    Card,
    CardContent,
    CardActions,
    IconButton,
    Menu,
    MenuItem,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    CircularProgress,
    Chip,
    Grid,
    Divider,
    Tooltip,
    List,
    ListItem,
    ListItemText,
    ListItemSecondaryAction
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import CategoryIcon from '@mui/icons-material/Category';
import { Task, TaskPriority } from '../../../types/task';
import { BoardStatus, TaskType } from '../../../types/board';
import { ConfirmDialog } from '../../shared/ConfirmDialog';
import { iconNameToComponent } from '../../shared/IconSelector/iconMapping';
import { taskService } from '../../../services/taskService';
import { useSnackbar } from 'notistack';

interface TaskTemplate {
    id: number;
    name: string;
    taskData: {
        title: string;
        description: string;
        typeId?: number;
        statusId?: number;
        priority: TaskPriority;
    };
}

interface TaskTemplateListProps {
    boardId?: number;
    onTemplateSelect?: (template: TaskTemplate) => void;
    onTemplateEdit?: (template: TaskTemplate) => void;
    onUseTemplate: (template: TaskTemplate) => void;
    boardStatuses?: BoardStatus[];
    taskTypes?: TaskType[];
}

export const TaskTemplateList: React.FC<TaskTemplateListProps> = ({
    boardId,
    onTemplateSelect,
    onTemplateEdit,
    onUseTemplate,
    boardStatuses = [],
    taskTypes = []
}) => {
    const [templates, setTemplates] = useState<TaskTemplate[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [createDialogOpen, setCreateDialogOpen] = useState(false);
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [currentTemplate, setCurrentTemplate] = useState<TaskTemplate | null>(null);
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    
    // Состояния для формы создания/редактирования шаблона
    const [templateName, setTemplateName] = useState('');
    const [templateTitle, setTemplateTitle] = useState('');
    const [templateDescription, setTemplateDescription] = useState('');
    const [templateTypeId, setTemplateTypeId] = useState<number | null>(null);
    const [templateStatusId, setTemplateStatusId] = useState<number | null>(null);
    const [templatePriority, setTemplatePriority] = useState<TaskPriority>('NONE');
    const { enqueueSnackbar } = useSnackbar();

    useEffect(() => {
        loadTemplates();
    }, [boardId]);

    const loadTemplates = async () => {
        if (!boardId) return;
        
        try {
            setLoading(true);
            const response = await taskService.getTaskTemplates(boardId);
            if (response && response.data) {
                setTemplates(response.data as unknown as TaskTemplate[]);
            }
        } catch (error) {
            console.error('Failed to load templates:', error);
            enqueueSnackbar('Не удалось загрузить шаблоны', { variant: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, template: TaskTemplate) => {
        setAnchorEl(event.currentTarget);
        setCurrentTemplate(template);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
        setCurrentTemplate(null);
    };

    const handleCreateTemplateClick = () => {
        // Устанавливаем значения по умолчанию для создания шаблона
        resetFormFields();
        
        // Выбираем первый тип и статус по умолчанию, если они есть
        if (taskTypes && taskTypes.length > 0) {
            const defaultType = taskTypes.find((type: TaskType) => type.isDefault) || taskTypes[0];
            setTemplateTypeId(defaultType.id);
        }
        
        if (boardStatuses && boardStatuses.length > 0) {
            const defaultStatus = boardStatuses.find((status: BoardStatus) => status.isDefault) || boardStatuses[0];
            setTemplateStatusId(defaultStatus.id);
        }
        
        setCreateDialogOpen(true);
    };

    const handleEditTemplateClick = () => {
        if (currentTemplate) {
            setTemplateName(currentTemplate.name);
            setTemplateTitle(currentTemplate.taskData.title);
            setTemplateDescription(currentTemplate.taskData.description || '');
            setTemplateTypeId(currentTemplate.taskData.typeId || null);
            setTemplateStatusId(currentTemplate.taskData.statusId || null);
            setTemplatePriority(currentTemplate.taskData.priority || 'NONE');
            setEditDialogOpen(true);
            handleMenuClose();
        }
    };

    const handleDeleteTemplateClick = () => {
        setDeleteConfirmOpen(true);
        handleMenuClose();
    };

    const handleUseTemplate = (template: TaskTemplate) => {
        onUseTemplate(template);
    };

    const resetFormFields = () => {
        setTemplateName('');
        setTemplateTitle('');
        setTemplateDescription('');
        setTemplateTypeId(null);
        setTemplateStatusId(null);
        setTemplatePriority('NONE');
    };

    const handleCreateTemplate = () => {
        if (!templateName.trim() || !templateTitle.trim()) {
            setError('Название шаблона и задачи обязательны');
            return;
        }

        const newTemplate: TaskTemplate = {
            id: Date.now(), // Простой способ создать уникальный id
            name: templateName.trim(),
            taskData: {
                title: templateTitle.trim(),
                description: templateDescription.trim(),
                priority: templatePriority
            }
        };

        if (templateTypeId !== null) {
            newTemplate.taskData.typeId = templateTypeId;
        }

        if (templateStatusId !== null) {
            newTemplate.taskData.statusId = templateStatusId;
        }

        setTemplates(prev => [...prev, newTemplate]);
        resetFormFields();
        setCreateDialogOpen(false);
    };

    const handleUpdateTemplate = () => {
        if (!currentTemplate || !templateName.trim() || !templateTitle.trim()) {
            setError('Название шаблона и задачи обязательны');
            return;
        }

        const updatedTemplate: TaskTemplate = {
            ...currentTemplate,
            name: templateName.trim(),
            taskData: {
                title: templateTitle.trim(),
                description: templateDescription.trim(),
                priority: templatePriority
            }
        };

        if (templateTypeId !== null) {
            updatedTemplate.taskData.typeId = templateTypeId;
        }

        if (templateStatusId !== null) {
            updatedTemplate.taskData.statusId = templateStatusId;
        }

        setTemplates(prev => prev.map(template => 
            template.id === currentTemplate.id ? updatedTemplate : template
        ));
        
        resetFormFields();
        setEditDialogOpen(false);
    };

    const handleDeleteTemplate = () => {
        if (currentTemplate) {
            setTemplates(prev => prev.filter(template => template.id !== currentTemplate.id));
            setDeleteConfirmOpen(false);
            setCurrentTemplate(null);
        }
    };

    const handleDelete = async (templateId: number) => {
        try {
            await taskService.deleteTaskTemplate(templateId);
            setTemplates(templates.filter(t => t.id !== templateId));
            enqueueSnackbar('Шаблон удален', { variant: 'success' });
        } catch (error) {
            console.error('Failed to delete template:', error);
            enqueueSnackbar('Не удалось удалить шаблон', { variant: 'error' });
        }
    };

    const renderTemplateForm = () => (
        <>
            <TextField
                label="Название шаблона"
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                fullWidth
                required
                margin="normal"
            />
            <TextField
                label="Название задачи"
                value={templateTitle}
                onChange={(e) => setTemplateTitle(e.target.value)}
                fullWidth
                required
                margin="normal"
            />
            <TextField
                label="Описание задачи"
                value={templateDescription}
                onChange={(e) => setTemplateDescription(e.target.value)}
                fullWidth
                multiline
                rows={3}
                margin="normal"
            />
            <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                <TextField
                    select
                    label="Тип задачи"
                    value={templateTypeId || ''}
                    onChange={(e) => setTemplateTypeId(e.target.value ? Number(e.target.value) : null)}
                    fullWidth
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
                                <Box
                                    sx={{
                                        width: 16,
                                        height: 16,
                                        bgcolor: type.color,
                                        borderRadius: '4px'
                                    }}
                                />
                                <Typography>{type.name}</Typography>
                            </Box>
                        </MenuItem>
                    ))}
                </TextField>
                <TextField
                    select
                    label="Статус"
                    value={templateStatusId || ''}
                    onChange={(e) => setTemplateStatusId(e.target.value ? Number(e.target.value) : null)}
                    fullWidth
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
                </TextField>
            </Box>
            <TextField
                select
                label="Приоритет"
                value={templatePriority}
                onChange={(e) => setTemplatePriority(e.target.value as TaskPriority)}
                fullWidth
                margin="normal"
            >
                <MenuItem value="NONE">Без приоритета</MenuItem>
                <MenuItem value="LOW">Низкий</MenuItem>
                <MenuItem value="MEDIUM">Средний</MenuItem>
                <MenuItem value="HIGH">Высокий</MenuItem>
            </TextField>
        </>
    );

    if (loading) {
        return <Typography>Загрузка шаблонов...</Typography>;
    }

    if (templates.length === 0) {
        return <Typography>Нет сохраненных шаблонов</Typography>;
    }

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">Шаблоны задач</Typography>
                <Button 
                    variant="contained" 
                    startIcon={<AddIcon />}
                    onClick={handleCreateTemplateClick}
                >
                    Новый шаблон
                </Button>
            </Box>

            <List>
                {templates.map((template) => {
                    const templateType = template.taskData.typeId 
                        ? taskTypes.find(t => t.id === template.taskData.typeId) 
                        : null;
                    const templateStatus = template.taskData.statusId 
                        ? boardStatuses.find(s => s.id === template.taskData.statusId) 
                        : null;
                    
                    return (
                        <ListItem
                            key={template.id}
                            button
                            onClick={() => handleUseTemplate(template)}
                        >
                            <ListItemText
                                primary={template.name}
                                secondary={template.taskData.description}
                            />
                            <ListItemSecondaryAction>
                                <IconButton
                                    edge="end"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onTemplateEdit?.(template);
                                    }}
                                >
                                    <EditIcon />
                                </IconButton>
                                <IconButton
                                    edge="end"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleDelete(template.id);
                                    }}
                                >
                                    <DeleteIcon />
                                </IconButton>
                            </ListItemSecondaryAction>
                        </ListItem>
                    );
                })}
            </List>

            {/* Меню для шаблона */}
            <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleMenuClose}
            >
                <MenuItem onClick={handleEditTemplateClick}>
                    <EditIcon fontSize="small" sx={{ mr: 1 }} />
                    Редактировать
                </MenuItem>
                <MenuItem onClick={handleDeleteTemplateClick} sx={{ color: 'error.main' }}>
                    <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
                    Удалить
                </MenuItem>
            </Menu>

            {/* Диалог создания шаблона */}
            <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Создать новый шаблон задачи</DialogTitle>
                <DialogContent>
                    {renderTemplateForm()}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setCreateDialogOpen(false)}>Отмена</Button>
                    <Button 
                        onClick={handleCreateTemplate} 
                        variant="contained"
                    >
                        Создать
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Диалог редактирования шаблона */}
            <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Редактировать шаблон задачи</DialogTitle>
                <DialogContent>
                    {renderTemplateForm()}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setEditDialogOpen(false)}>Отмена</Button>
                    <Button 
                        onClick={handleUpdateTemplate} 
                        variant="contained"
                    >
                        Сохранить
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Диалог подтверждения удаления */}
            <ConfirmDialog
                open={deleteConfirmOpen}
                title="Удалить шаблон"
                message="Вы уверены, что хотите удалить этот шаблон? Это действие нельзя отменить."
                onConfirm={handleDeleteTemplate}
                onClose={() => setDeleteConfirmOpen(false)}
                actionType="delete"
            />
        </Box>
    );
}; 