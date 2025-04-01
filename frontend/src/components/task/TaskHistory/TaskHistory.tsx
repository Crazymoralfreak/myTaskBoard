import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    List,
    ListItem,
    ListItemText,
    ListItemAvatar,
    Avatar,
    Paper,
    Divider,
    Chip,
    CircularProgress,
    IconButton,
    Tooltip
} from '@mui/material';
import { Task, TaskHistory as TaskHistoryType } from '../../../types/task';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { taskService } from '../../../services/taskService';
import RefreshIcon from '@mui/icons-material/Refresh';
// @ts-ignore
import * as DiffLib from 'diff';

// Типы для библиотеки diff
interface DiffPart {
    value: string;
    added?: boolean;
    removed?: boolean;
}

interface TaskHistoryProps {
    task: Task;
}

// Компонент для показа diff с подсветкой
const DiffView = ({ oldText, newText }: { oldText: string, newText: string }) => {
    // Генерируем diff между старым и новым текстом
    const diff: DiffPart[] = DiffLib.diffWords(oldText || '', newText || '');
    
    return (
        <Box>
            {diff.map((part: DiffPart, index: number) => {
                // Определяем цвет и стиль в зависимости от типа изменения
                let color = 'inherit';
                let backgroundColor = 'transparent';
                let textDecoration = 'none';
                
                if (part.added) {
                    color = 'success.main';
                    backgroundColor = 'rgba(76, 175, 80, 0.1)';
                } else if (part.removed) {
                    color = 'error.main';
                    backgroundColor = 'rgba(244, 67, 54, 0.1)';
                    textDecoration = 'line-through';
                }
                
                return (
                    <Typography
                        key={index}
                        component="span"
                        variant="body2"
                        sx={{ 
                            color, 
                            backgroundColor, 
                            textDecoration,
                            p: part.added || part.removed ? '0 2px' : 0,
                            borderRadius: '2px',
                            whiteSpace: 'pre-wrap',
                            overflowWrap: 'break-word'
                        }}
                    >
                        {part.value}
                    </Typography>
                );
            })}
        </Box>
    );
};

export const TaskHistory: React.FC<TaskHistoryProps> = ({ task }) => {
    const [history, setHistory] = useState<TaskHistoryType[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const loadHistory = async () => {
        setLoading(true);
        setError(null);
        
        try {
            // Загрузка истории с помощью API
            console.log(`Загружаем историю для задачи ${task.id}...`);
            if (!task || !task.id) {
                console.warn('Попытка загрузить историю без ID задачи');
                setHistory([]);
                return;
            }
            
            const historyData = await taskService.getTaskHistory(task.id);
            
            // Дополнительная проверка и фильтрация данных
            const sanitizedHistoryData = Array.isArray(historyData) 
                ? historyData
                    .filter(item => item && typeof item === 'object') // Проверяем, что это объект
                    .map(item => ({
                        id: item.id || Math.random(),
                        username: item.username || 'Неизвестный пользователь',
                        email: item.email,
                        avatarUrl: item.avatarUrl,
                        action: item.action || 'unknown_action',
                        oldValue: item.oldValue,
                        newValue: item.newValue,
                        timestamp: item.timestamp || new Date().toISOString()
                    }))
                : [];
            
            console.log('Обработанная история:', sanitizedHistoryData);
            setHistory(sanitizedHistoryData);
        } catch (error) {
            console.error('Ошибка при загрузке истории:', error);
            setError('Не удалось загрузить историю задачи');
            setHistory([]); // Устанавливаем пустой массив при ошибке
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (task && task.id) {
            loadHistory();
        }
    }, [task.id]);

    // Форматирование временной метки
    const formatTimestamp = (timestamp: string) => {
        try {
            const date = new Date(timestamp);
            return format(date, "d MMMM yyyy, HH:mm", { locale: ru });
        } catch (e) {
            return timestamp;
        }
    };

    // Функция для форматирования типа действия
    const formatAction = (action: string): string => {
        if (!action) return 'Неизвестное действие';
        
        switch (action) {
            case 'created':
                return 'Создание задачи';
            case 'updated':
                return 'Обновление задачи';
            case 'status_changed':
                return 'Изменение статуса';
            case 'type_changed':
                return 'Изменение типа';
            case 'priority_changed':
                return 'Изменение приоритета';
            case 'description_changed':
                return 'Изменение описания';
            case 'dates_changed':
                return 'Изменение дат';
            case 'comment_added':
                return 'Добавлен комментарий';
            case 'file_added':
                return 'Добавлен файл';
            case 'moved_between_columns':
                return 'Перемещение между колонками';
            case 'task_created':
                return 'Задача создана';
            case 'column_changed':
                return 'Смена колонки';
            case 'startDate_changed':
                return 'Изменение даты начала';
            case 'endDate_changed':
                return 'Изменение даты окончания';
            case 'title_changed': 
                return 'Изменение названия';
            default:
                return action.replace(/_/g, ' ');
        }
    };

    // Функция для безопасного отображения значений
    const renderValue = (value: string | undefined, item: TaskHistoryType): React.ReactNode => {
        if (!value) return '';
        
        // Если это изменение описания, используем DiffView компонент
        if (item.action === 'description_changed') {
            if (item.oldValue && item.newValue) {
                // Если есть и старое и новое значения, извлекаем текст, если это HTML
                const extractText = (html: string) => {
                    // Если описание не является HTML, возвращаем как есть
                    if (!html.includes('<') && !html.includes('>')) {
                        return html;
                    }
                    
                    try {
                        // Создаем временный div для извлечения текста из HTML
                        const tempDiv = document.createElement('div');
                        tempDiv.innerHTML = html;
                        return tempDiv.textContent || tempDiv.innerText || html;
                    } catch {
                        return html;
                    }
                };
                
                // Для изменения описания показываем diff между старым и новым значениями
                if (item.oldValue === 'Предыдущее описание' && item.newValue === 'Новое описание') {
                    // Это заглушка, у нас нет реальных данных для diff
                    return <Typography variant="body2" fontStyle="italic">
                        Содержимое описания изменено
                    </Typography>;
                }
                
                return <DiffView 
                    oldText={extractText(item.oldValue)} 
                    newText={extractText(item.newValue)} 
                />;
            }
            
            // Если есть только одно из значений
            return item.oldValue || item.newValue;
        }
        
        // Если это перемещение между колонками, меняем стиль отображения
        if (item.action === 'moved_between_columns') {
            return value;
        }
        
        // Для остальных типов записей истории
        // Если значение содержит HTML, извлекаем только текст
        if (value.includes('<') && value.includes('>')) {
            // Создаем временный div для извлечения текста из HTML
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = value;
            return tempDiv.textContent || tempDiv.innerText || value;
        }
        
        return value;
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                <CircularProgress />
            </Box>
        );
    }

    if (error) {
        return (
            <Box sx={{ p: 2 }}>
                <Typography color="error">{error}</Typography>
                <Box sx={{ mt: 2 }}>
                    <IconButton onClick={loadHistory} color="primary">
                        <RefreshIcon />
                    </IconButton>
                    <Typography variant="caption">Повторить загрузку</Typography>
                </Box>
            </Box>
        );
    }

    if (history.length === 0) {
        return (
            <Box sx={{ p: 2 }}>
                <Typography>История изменений пуста</Typography>
            </Box>
        );
    }

    return (
        <Box>
            <Box sx={{ 
                display: 'flex', 
                justifyContent: 'space-between',
                alignItems: 'center',
                mb: 2
            }}>
                <Typography variant="subtitle1">История изменений</Typography>
                <Tooltip title="Обновить историю">
                    <IconButton onClick={loadHistory} size="small">
                        <RefreshIcon />
                    </IconButton>
                </Tooltip>
            </Box>
            
            <Paper variant="outlined">
                <List sx={{ width: '100%', bgcolor: 'background.paper' }}>
                    {history.map((item, index) => (
                        <React.Fragment key={item.id || index}>
                            {index > 0 && <Divider component="li" />}
                            <ListItem alignItems="flex-start">
                                <ListItemAvatar>
                                    <Avatar 
                                        alt={item.username} 
                                        src={item.avatarUrl}
                                        sx={{ width: 32, height: 32 }}
                                    >
                                        {item.username ? item.username[0].toUpperCase() : '?'}
                                    </Avatar>
                                </ListItemAvatar>
                                <ListItemText
                                    primary={
                                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, alignItems: 'center' }}>
                                            <Tooltip title={item.email || 'Email не указан'}>
                                                <Typography
                                                    component="span"
                                                    variant="body2"
                                                    color="text.primary"
                                                    sx={{ fontWeight: 'bold' }}
                                                >
                                                    {item.username}
                                                </Typography>
                                            </Tooltip>
                                            <Typography
                                                component="span"
                                                variant="body2"
                                                color="text.secondary"
                                            >
                                                {formatTimestamp(item.timestamp)}
                                            </Typography>
                                        </Box>
                                    }
                                    secondary={
                                        <Box sx={{ mt: 1 }}>
                                            <Chip 
                                                label={formatAction(item.action)}
                                                size="small"
                                                color="primary"
                                                variant="outlined"
                                            />
                                            {(item.oldValue || item.newValue) && (
                                                <Box sx={{ mt: 1, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                                                    {item.action === 'description_changed' && item.oldValue && item.newValue ? (
                                                        // Для изменения описания показываем DiffView
                                                        <Box sx={{ mt: 1 }}>
                                                            {renderValue(item.oldValue, item)}
                                                        </Box>
                                                    ) : (
                                                        // Для всех остальных действий - стандартный вид
                                                        <>
                                                            {item.oldValue && (
                                                                <Typography
                                                                    variant="body2"
                                                                    color="text.secondary"
                                                                    sx={{ 
                                                                        textDecoration: 'line-through',
                                                                        display: 'flex',
                                                                        alignItems: 'center'
                                                                    }}
                                                                >
                                                                    <Box sx={{ 
                                                                        width: '16px', 
                                                                        height: '16px',
                                                                        borderRadius: '50%',
                                                                        bgcolor: 'error.light',
                                                                        color: 'white',
                                                                        display: 'inline-flex',
                                                                        justifyContent: 'center',
                                                                        alignItems: 'center',
                                                                        fontSize: '10px',
                                                                        mr: 1
                                                                    }}>
                                                                        -
                                                                    </Box>
                                                                    {renderValue(item.oldValue, item)}
                                                                </Typography>
                                                            )}
                                                            {item.newValue && item.action !== 'description_changed' && (
                                                                <Typography
                                                                    variant="body2"
                                                                    color="text.primary"
                                                                    sx={{ 
                                                                        display: 'flex',
                                                                        alignItems: 'center'
                                                                    }}
                                                                >
                                                                    <Box sx={{ 
                                                                        width: '16px', 
                                                                        height: '16px',
                                                                        borderRadius: '50%',
                                                                        bgcolor: 'success.light',
                                                                        color: 'white',
                                                                        display: 'inline-flex',
                                                                        justifyContent: 'center',
                                                                        alignItems: 'center',
                                                                        fontSize: '10px',
                                                                        mr: 1
                                                                    }}>
                                                                        +
                                                                    </Box>
                                                                    {renderValue(item.newValue, item)}
                                                                </Typography>
                                                            )}
                                                        </>
                                                    )}
                                                </Box>
                                            )}
                                        </Box>
                                    }
                                />
                            </ListItem>
                        </React.Fragment>
                    ))}
                </List>
            </Paper>
        </Box>
    );
};