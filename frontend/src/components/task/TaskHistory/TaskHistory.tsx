import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    List,
    ListItem,
    ListItemAvatar,
    ListItemText,
    Avatar,
    Divider,
    CircularProgress,
    Paper
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import ArrowRightIcon from '@mui/icons-material/ArrowRight';
import EventIcon from '@mui/icons-material/Event';
import PriorityHighIcon from '@mui/icons-material/PriorityHigh';
import LabelIcon from '@mui/icons-material/Label';
import CategoryIcon from '@mui/icons-material/Category';
import { Task } from '../../../types/task';

// Тип для записи в истории
interface HistoryEntry {
    id: number;
    taskId: number;
    timestamp: string;
    action: 'create' | 'update' | 'delete' | 'status_change' | 'type_change' | 'priority_change' | 'date_change';
    user: {
        id: number;
        name: string;
        avatar?: string;
    };
    details?: {
        field?: string;
        oldValue?: string;
        newValue?: string;
    };
}

interface TaskHistoryProps {
    task: Task;
}

export const TaskHistory: React.FC<TaskHistoryProps> = ({ task }) => {
    const [historyEntries, setHistoryEntries] = useState<HistoryEntry[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    
    // Загрузка истории из localStorage (в реальном приложении будет API запрос)
    useEffect(() => {
        setLoading(true);
        try {
            // Имитируем загрузку данных
            setTimeout(() => {
                const savedHistory = localStorage.getItem(`task_history_${task.id}`);
                if (savedHistory) {
                    setHistoryEntries(JSON.parse(savedHistory));
                } else {
                    // Если истории нет, создаем начальную запись о создании задачи
                    const initialHistory: HistoryEntry[] = [{
                        id: 1,
                        taskId: task.id,
                        timestamp: task.startDate || new Date().toISOString(),
                        action: 'create',
                        user: {
                            id: 1,
                            name: 'Система',
                            avatar: undefined
                        }
                    }];
                    setHistoryEntries(initialHistory);
                    localStorage.setItem(`task_history_${task.id}`, JSON.stringify(initialHistory));
                }
                setLoading(false);
            }, 500);
        } catch (error) {
            console.error('Ошибка при загрузке истории:', error);
            setError('Не удалось загрузить историю задачи');
            setLoading(false);
        }
    }, [task.id, task.startDate]);
    
    // Обнаружение изменений задачи и добавление их в историю
    useEffect(() => {
        // Проверяем, есть ли уже запись о создании
        const hasCreateEntry = historyEntries.some(entry => entry.action === 'create');
        
        if (hasCreateEntry && historyEntries.length > 0) {
            // Получаем последнее состояние задачи из localStorage
            const lastTaskState = localStorage.getItem(`task_last_state_${task.id}`);
            
            if (lastTaskState) {
                const previousTask = JSON.parse(lastTaskState);
                
                // Проверяем, изменились ли поля задачи
                const changedFields = [];
                
                // Проверка изменения названия
                if (previousTask.title !== task.title) {
                    changedFields.push({
                        field: 'title',
                        oldValue: previousTask.title,
                        newValue: task.title,
                        action: 'update'
                    });
                }
                
                // Проверка изменения описания
                if (previousTask.description !== task.description) {
                    changedFields.push({
                        field: 'description',
                        oldValue: previousTask.description,
                        newValue: task.description,
                        action: 'update'
                    });
                }
                
                // Проверка изменения статуса
                if (
                    (previousTask.customStatus?.id !== task.customStatus?.id) || 
                    (previousTask.customStatus?.name !== task.customStatus?.name)
                ) {
                    changedFields.push({
                        field: 'status',
                        oldValue: previousTask.customStatus?.name,
                        newValue: task.customStatus?.name,
                        action: 'status_change'
                    });
                }
                
                // Проверка изменения типа задачи
                if (
                    (previousTask.type?.id !== task.type?.id) || 
                    (previousTask.type?.name !== task.type?.name)
                ) {
                    changedFields.push({
                        field: 'type',
                        oldValue: previousTask.type?.name,
                        newValue: task.type?.name,
                        action: 'type_change'
                    });
                }
                
                // Проверка изменения приоритета
                if (previousTask.priority !== task.priority) {
                    changedFields.push({
                        field: 'priority',
                        oldValue: previousTask.priority,
                        newValue: task.priority,
                        action: 'priority_change'
                    });
                }
                
                // Проверка изменения дат
                if (previousTask.startDate !== task.startDate) {
                    changedFields.push({
                        field: 'startDate',
                        oldValue: previousTask.startDate,
                        newValue: task.startDate,
                        action: 'date_change'
                    });
                }
                
                if (previousTask.endDate !== task.endDate) {
                    changedFields.push({
                        field: 'endDate',
                        oldValue: previousTask.endDate,
                        newValue: task.endDate,
                        action: 'date_change'
                    });
                }
                
                // Если есть изменения, добавляем их в историю
                if (changedFields.length > 0) {
                    const newEntries: HistoryEntry[] = changedFields.map((change, index) => ({
                        id: historyEntries[historyEntries.length - 1].id + index + 1,
                        taskId: task.id,
                        timestamp: new Date().toISOString(),
                        action: change.action as any,
                        user: {
                            id: 1,
                            name: 'Система',
                        },
                        details: {
                            field: change.field,
                            oldValue: change.oldValue || '',
                            newValue: change.newValue || ''
                        }
                    }));
                    
                    const updatedHistory = [...historyEntries, ...newEntries];
                    setHistoryEntries(updatedHistory);
                    localStorage.setItem(`task_history_${task.id}`, JSON.stringify(updatedHistory));
                }
            }
        }
        
        // Сохраняем текущее состояние задачи
        localStorage.setItem(`task_last_state_${task.id}`, JSON.stringify(task));
    }, [task, historyEntries]);
    
    // Форматирование даты с учётом часового пояса пользователя
    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        
        // Используем toLocaleString для форматирования в локальном часовом поясе пользователя
        return date.toLocaleString('ru-RU', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        });
    };
    
    // Получение иконки для действия
    const getActionIcon = (action: HistoryEntry['action'], details?: HistoryEntry['details']) => {
        switch (action) {
            case 'create':
                return <AddIcon color="success" />;
            case 'update':
                return <EditIcon color="primary" />;
            case 'delete':
                return <DeleteIcon color="error" />;
            case 'status_change':
                return <ArrowRightIcon color="info" />;
            case 'type_change':
                return <CategoryIcon color="secondary" />;
            case 'priority_change':
                return <PriorityHighIcon color="warning" />;
            case 'date_change':
                return <EventIcon color="action" />;
            default:
                return <EditIcon />;
        }
    };
    
    // Получение текста для действия
    const getActionText = (entry: HistoryEntry) => {
        const { action, details, user } = entry;
        
        switch (action) {
            case 'create':
                return `${user.name} создал(а) задачу`;
            case 'update':
                if (details?.field) {
                    return `${user.name} изменил(а) поле "${details.field}" с "${details.oldValue || 'пусто'}" на "${details.newValue || 'пусто'}"`;
                }
                return `${user.name} обновил(а) задачу`;
            case 'delete':
                return `${user.name} удалил(а) задачу`;
            case 'status_change':
                return `${user.name} изменил(а) статус с "${details?.oldValue || 'не задан'}" на "${details?.newValue || 'не задан'}"`;
            case 'type_change':
                return `${user.name} изменил(а) тип задачи с "${details?.oldValue || 'не задан'}" на "${details?.newValue || 'не задан'}"`;
            case 'priority_change':
                return `${user.name} изменил(а) приоритет с "${details?.oldValue || 'не задан'}" на "${details?.newValue || 'не задан'}"`;
            case 'date_change':
                if (details?.field === 'startDate') {
                    return `${user.name} изменил(а) дату начала с "${details.oldValue || 'не задана'}" на "${details.newValue || 'не задана'}"`;
                } else {
                    return `${user.name} изменил(а) дату окончания с "${details?.oldValue || 'не задана'}" на "${details?.newValue || 'не задана'}"`;
                }
            default:
                return `${user.name} выполнил(а) действие с задачей`;
        }
    };
    
    // Группировка истории по датам
    const groupHistoryByDate = () => {
        const grouped: Record<string, HistoryEntry[]> = {};
        
        historyEntries.forEach(entry => {
            const date = new Date(entry.timestamp).toISOString().split('T')[0];
            if (!grouped[date]) {
                grouped[date] = [];
            }
            grouped[date].push(entry);
        });
        
        return Object.entries(grouped)
            .sort(([dateA], [dateB]) => new Date(dateB).getTime() - new Date(dateA).getTime())
            .map(([date, entries]) => ({
                date,
                entries: entries.sort((a, b) => 
                    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
                )
            }));
    };
    
    const groupedHistory = groupHistoryByDate();
    
    // Формат даты группы
    const formatGroupDate = (dateString: string) => {
        const date = new Date(dateString);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        
        if (date.toDateString() === today.toDateString()) {
            return 'Сегодня';
        } else if (date.toDateString() === yesterday.toDateString()) {
            return 'Вчера';
        } else {
            return date.toLocaleDateString('ru-RU', {
                day: 'numeric',
                month: 'long',
                year: 'numeric'
            });
        }
    };
    
    return (
        <Box>
            <Typography variant="h6" gutterBottom>История изменений</Typography>
            
            {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
                    <CircularProgress />
                </Box>
            ) : error ? (
                <Typography color="error">{error}</Typography>
            ) : historyEntries.length === 0 ? (
                <Typography sx={{ textAlign: 'center', my: 4, color: 'text.secondary' }}>
                    История изменений пуста
                </Typography>
            ) : (
                <Box>
                    {groupedHistory.map(group => (
                        <Box key={group.date} sx={{ mb: 3 }}>
                            <Typography 
                                variant="subtitle1" 
                                sx={{ 
                                    fontWeight: 'bold', 
                                    mb: 1, 
                                    pb: 1, 
                                    borderBottom: '1px solid', 
                                    borderColor: 'divider' 
                                }}
                            >
                                {formatGroupDate(group.date)}
                            </Typography>
                            
                            <List sx={{ width: '100%', bgcolor: 'background.paper' }}>
                                {group.entries.map((entry, index) => (
                                    <React.Fragment key={entry.id}>
                                        <ListItem alignItems="flex-start">
                                            <ListItemAvatar>
                                                <Avatar sx={{ bgcolor: 'background.default' }}>
                                                    {getActionIcon(entry.action, entry.details)}
                                                </Avatar>
                                            </ListItemAvatar>
                                            <ListItemText
                                                primary={getActionText(entry)}
                                                secondary={
                                                    <React.Fragment>
                                                        <Typography
                                                            component="span"
                                                            variant="body2"
                                                            color="text.secondary"
                                                        >
                                                            {formatDate(entry.timestamp)}
                                                        </Typography>
                                                    </React.Fragment>
                                                }
                                            />
                                        </ListItem>
                                        {index < group.entries.length - 1 && (
                                            <Divider variant="inset" component="li" />
                                        )}
                                    </React.Fragment>
                                ))}
                            </List>
                        </Box>
                    ))}
                </Box>
            )}
        </Box>
    );
};