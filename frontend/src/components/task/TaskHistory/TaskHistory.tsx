import React, { useState, useEffect, useMemo } from 'react';
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
    Tooltip,
    Collapse,
    Badge,
    Button,
    ButtonGroup,
    Grid,
    MenuItem,
    Menu
} from '@mui/material';
import { Task, TaskHistory as TaskHistoryType } from '../../../types/task';
import { format, isToday, isYesterday, isThisWeek, isSameDay } from 'date-fns';
import { ru } from 'date-fns/locale';
import { taskService } from '../../../services/taskService';
import { useLocalization } from '../../../hooks/useLocalization';
import RefreshIcon from '@mui/icons-material/Refresh';
import InfoIcon from '@mui/icons-material/Info';
import ArrowRightAltIcon from '@mui/icons-material/ArrowRightAlt';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import EventNoteIcon from '@mui/icons-material/EventNote';
import PriorityHighIcon from '@mui/icons-material/PriorityHigh';
import LabelIcon from '@mui/icons-material/Label';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import SwapVertIcon from '@mui/icons-material/SwapVert';
// @ts-ignore
import * as DiffLib from 'diff';
import { getAvatarUrl } from '../../../utils/avatarUtils';

// Типы для библиотеки diff
interface DiffPart {
    value: string;
    added?: boolean;
    removed?: boolean;
}

interface TaskHistoryProps {
    task: Task;
}

// Группа событий по времени
interface HistoryGroup {
    title: string;
    items: TaskHistoryType[];
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

// Иконки для разных типов действий
const getActionIcon = (action: string) => {
    switch (action) {
        case 'status_changed':
            return <EventNoteIcon fontSize="small" />;
        case 'priority_changed':
            return <PriorityHighIcon fontSize="small" />;
        case 'type_changed':
            return <LabelIcon fontSize="small" />;
        case 'moved_between_columns':
            return <ArrowRightAltIcon fontSize="small" />;
        case 'startDate_changed':
        case 'endDate_changed':
        case 'dates_changed':
            return <AccessTimeIcon fontSize="small" />;
        case 'attachment_added':
        case 'attachment_deleted':
            return <AttachFileIcon fontSize="small" />;
        case 'comment_added':
        case 'comment_updated':
        case 'comment_deleted':
            return <InfoIcon fontSize="small" />;
        case 'subtask_created':
            return <AddIcon fontSize="small" />;
        case 'subtask_updated':
            return <EditIcon fontSize="small" />;
        case 'subtask_completed':
            return <CheckCircleIcon fontSize="small" />;
        case 'subtask_deleted':
            return <DeleteIcon fontSize="small" />;
        case 'subtask_assigned':
            return <PersonAddIcon fontSize="small" />;
        case 'subtasks_reordered':
            return <SwapVertIcon fontSize="small" />;
        default:
            return undefined;
    }
};

// Получение цвета для чипа действия
const getActionColor = (action: string): "default" | "primary" | "secondary" | "error" | "info" | "success" | "warning" => {
    switch(action) {
        case 'task_created':
            return 'success';
        case 'priority_changed':
            return 'warning';
        case 'status_changed':
            return 'info';
        case 'moved_between_columns':
        case 'column_changed':
            return 'secondary';
        case 'title_changed':
            return 'primary';
        case 'tags_changed':
        case 'tags_updated':
        case 'tag_added':
            return 'info';
        case 'attachment_added':
            return 'success';
        case 'attachment_deleted':
            return 'error';
        case 'comment_added':
            return 'info';
        case 'comment_updated':
            return 'warning';
        case 'comment_deleted':
            return 'error';
        // Цвета для действий с подзадачами
        case 'subtask_created':
            return 'success';
        case 'subtask_updated':
            return 'info';
        case 'subtask_completed':
            return 'success';
        case 'subtask_deleted':
            return 'error';
        case 'subtask_assigned':
            return 'primary';
        case 'subtasks_reordered':
            return 'secondary';
        default:
            return 'default';
    }
};

export const TaskHistory: React.FC<TaskHistoryProps> = ({ task }) => {
    const { t } = useLocalization();
    const [history, setHistory] = useState<TaskHistoryType[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [expandedItems, setExpandedItems] = useState<{[key: string]: boolean}>({});
    const [visibleGroups, setVisibleGroups] = useState<{[key: string]: boolean}>({});
    const [compactMode, setCompactMode] = useState(false);
    const [filter, setFilter] = useState<string | null>(null);
    const [showFilterMenu, setShowFilterMenu] = useState(false);

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
            
            // Сначала загружаем свежие данные задачи
            let taskId = task.id;
            try {
                // Попытка загрузить актуальные данные задачи (если не отобразится в UI, то хотя бы для логов)
                const updatedTask = await taskService.getTask(taskId);
                console.log('Загружены свежие данные задачи для истории:', updatedTask.id);
            } catch (taskError) {
                console.warn('Не удалось загрузить свежие данные задачи:', taskError);
            }
            
            const historyData = await taskService.getTaskHistory(taskId);
            
            // Дополнительная проверка и фильтрация данных
            let sanitizedHistoryData = Array.isArray(historyData) 
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
            
            // Фильтруем события где значения не изменились
            sanitizedHistoryData = sanitizedHistoryData.filter(item => {
                // Если это события изменения дат и значения равны - пропускаем
                if ((item.action === 'startDate_changed' || 
                     item.action === 'endDate_changed' || 
                     item.action === 'dates_changed') && 
                    item.oldValue === item.newValue) {
                    return false;
                }
                
                // Пропускаем любые события, где значения не изменились (кроме особых типов)
                if (item.oldValue !== undefined && 
                    item.newValue !== undefined && 
                    item.oldValue === item.newValue &&
                    item.action !== 'task_created' && 
                    !item.action.includes('added') &&
                    !item.action.includes('deleted') && 
                    !item.action.includes('removed')) {
                    return false;
                }
                
                // Пропускаем события с action = 'skipped' (специальный признак пропущенных событий)
                if (item.action === 'skipped') {
                    return false;
                }
                
                return true;
            });
            
            // Удаляем дубликаты событий (одинаковое действие с одинаковым значением в одно и то же время)
            sanitizedHistoryData = sanitizedHistoryData.filter((item, index, self) => {
                // Ищем дубликаты для текущего элемента
                const isDuplicate = self.some((otherItem, otherIndex) => {
                    // Пропускаем сравнение с самим собой
                    if (otherIndex === index) return false;
                    
                    // Проверяем условия дубликата:
                    // 1. Одинаковое действие
                    // 2. Одинаковые значения
                    // 3. Близкие по времени (в течение 5 секунд)
                    const sameAction = otherItem.action === item.action;
                    const sameValues = otherItem.oldValue === item.oldValue && 
                                      otherItem.newValue === item.newValue;
                    const closeTime = Math.abs(
                        new Date(otherItem.timestamp).getTime() - 
                        new Date(item.timestamp).getTime()
                    ) < 5000;
                    
                    // Если все условия соблюдены, и индекс другого элемента меньше, считаем текущий дубликатом
                    return sameAction && sameValues && closeTime && otherIndex < index;
                });
                
                // Сохраняем элемент только если это не дубликат
                return !isDuplicate;
            });
            
            // Фильтруем "искусственные" события даты, которые появляются после изменения типа или других событий
            sanitizedHistoryData = sanitizedHistoryData.filter((item, index, self) => {
                // Не применяем эту логику к событиям, которые не связаны с датами
                if (item.action !== 'startDate_changed' && item.action !== 'endDate_changed') {
                    return true;
                }
                
                // Ищем другие события за короткий период времени
                const hasOtherChangesNearby = self.some(otherItem => {
                    // Исключаем проверку против самого себя или против событий того же типа
                    if (otherItem === item || otherItem.action === item.action) return false;
                    
                    // Проверяем, произошло ли другое событие в течение 10 секунд
                    const timeGap = Math.abs(
                        new Date(otherItem.timestamp).getTime() - 
                        new Date(item.timestamp).getTime()
                    );
                    
                    // Если есть близкое событие и это не связанное с датами событие
                    return timeGap < 10000;
                });
                
                // Если нашли другие события рядом и значения дат одинаковые или отличаются незначительно, считаем это лишним событием
                if (hasOtherChangesNearby && (item.oldValue === item.newValue || 
                   (item.oldValue && item.newValue && 
                    Math.abs(new Date(item.oldValue).getTime() - new Date(item.newValue).getTime()) < 1000))) {
                    return false;
                }
                
                return true;
            });
            
            console.log('Обработанная история:', sanitizedHistoryData);
            setHistory(sanitizedHistoryData);
            
            // По умолчанию разворачиваем группу "Сегодня"
            setVisibleGroups(prev => ({...prev, 'today': true}));
        } catch (error) {
            console.error('Ошибка при загрузке истории:', error);
            setError(t('historyErrorsLoadFailed'));
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

    // Форматирование временной метки с учетом часового пояса пользователя
    const formatTimestamp = (timestamp: string) => {
        try {
            const date = new Date(timestamp);
            
            // Используем toLocaleString для правильного отображения времени с учетом часового пояса пользователя
            return date.toLocaleString('ru-RU', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                hour12: false
            });
        } catch (e) {
            return timestamp;
        }
    };

    // Функция для форматирования типа действия
    const formatAction = (action: string): string => {
        if (!action) return t('historyUnknownAction');
        
        // Проверяем, есть ли перевод для этого действия
        const translationKey = `historyActions${action.charAt(0).toUpperCase() + action.slice(1).replace(/([A-Z])/g, '$1')}`;
        const translation = t(translationKey);
        
        // Если перевод найден (не равен ключу), возвращаем его
        if (translation !== translationKey) {
            return translation;
        }
        
        // Если перевода нет, форматируем красиво как fallback
        return action.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    };

    // Группируем записи истории по дате
    const groupedHistory = useMemo(() => {
        // Фильтруем данные, если фильтр установлен
        const filteredHistory = filter 
            ? history.filter(item => 
                formatAction(item.action).toLowerCase().includes(filter.toLowerCase()) ||
                (item.oldValue && item.oldValue.toLowerCase().includes(filter.toLowerCase())) ||
                (item.newValue && item.newValue.toLowerCase().includes(filter.toLowerCase())) ||
                (item.username && item.username.toLowerCase().includes(filter.toLowerCase()))
            ) 
            : history;
            
        const groups: HistoryGroup[] = [
                  { title: t('historyGroupsToday'), items: [] },
      { title: t('historyGroupsYesterday'), items: [] },
      { title: t('historyGroupsThisWeek'), items: [] },
      { title: t('historyGroupsEarlier'), items: [] }
        ];
        
        filteredHistory.forEach(item => {
            const date = new Date(item.timestamp);
            
            if (isToday(date)) {
                groups[0].items.push(item);
            } else if (isYesterday(date)) {
                groups[1].items.push(item);
            } else if (isThisWeek(date)) {
                groups[2].items.push(item);
            } else {
                groups[3].items.push(item);
            }
        });
        
        // Фильтруем пустые группы и сортируем записи внутри групп по времени (новые сверху)
        return groups
            .filter(group => group.items.length > 0)
            .map(group => ({
                ...group,
                items: group.items.sort((a, b) => 
                    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
                )
            }));
    }, [history, filter]);
    
    // Функция для переключения видимости группы
    const toggleGroup = (groupTitle: string) => {
        setVisibleGroups(prev => ({
            ...prev,
            [groupTitle.toLowerCase()]: !prev[groupTitle.toLowerCase()]
        }));
    };
    
    // Функция для переключения развернутого состояния элемента
    const toggleItemExpanded = (itemId: string | number) => {
        setExpandedItems(prev => ({
            ...prev,
            [itemId]: !prev[itemId]
        }));
    };
    
    // Применение фильтров
    const applyFilter = (filterValue: string | null) => {
        setFilter(filterValue);
    };
    
    // Переключение компактного режима
    const toggleCompactMode = () => {
        setCompactMode(!compactMode);
    };

    // Предопределенные типы фильтров
    const filterOptions = [
              { value: null, label: t('historyFilterOptionsAll') },
      { value: 'изменение', label: t('historyFilterOptionsChanges') },
      { value: 'статус', label: t('historyFilterOptionsStatus') },
      { value: 'приоритет', label: t('historyFilterOptionsPriority') },
      { value: 'тип', label: t('historyFilterOptionsType') },
      { value: 'название', label: t('historyFilterOptionsTitle') },
      { value: 'описание', label: t('historyFilterOptionsDescription') },
      { value: 'даты', label: t('historyFilterOptionsDates') },
      { value: 'перемещение', label: t('historyFilterOptionsMovement') },
      { value: 'теги', label: t('historyFilterOptionsTags') },
      { value: 'вложение', label: t('historyFilterOptionsAttachments') },
      { value: 'создание', label: t('historyFilterOptionsCreation') }
    ];

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
                    <Typography variant="caption">{t('historyRetryLoad')}</Typography>
                </Box>
            </Box>
        );
    }

    if (history.length === 0) {
        return (
            <Box sx={{ p: 2 }}>
                <Typography>{t('historyEmpty')}</Typography>
            </Box>
        );
    }

    return (
        <Box>
            <Box sx={{ 
                display: 'flex', 
                justifyContent: 'space-between',
                alignItems: 'center',
                mb: 2,
                flexWrap: 'wrap',
                gap: 1
            }}>
                <Typography variant="subtitle1">{t('historyTitle')}</Typography>
                
                <Box sx={{ display: 'flex', gap: 1 }}>
                    <ButtonGroup size="small" variant="outlined" sx={{ height: '32px' }}>
                        <Tooltip title={t('historyCompactMode')}>
                            <Button 
                                color={compactMode ? "primary" : "inherit"}
                                onClick={toggleCompactMode}
                                sx={{ height: '100%' }}
                            >
                                {compactMode ? t('historyExpand') : t('historyCollapse')}
                            </Button>
                        </Tooltip>
                        <Tooltip title={t('historyFilterByType')}>
                            <Box sx={{ position: 'relative', height: '100%' }}>
                                <Button
                                    color={filter ? "primary" : "inherit"}
                                    startIcon={<FilterListIcon />}
                                    onClick={() => setShowFilterMenu(!showFilterMenu)}
                                    sx={{ height: '100%' }}
                                >
                                    {filter ? t('historyFilterLabel') + ' ' + filter : t('historyFilter')} 
                                </Button>
                                
                                {showFilterMenu && (
                                    <Box 
                                        sx={{ 
                                            position: 'absolute', 
                                            top: '100%', 
                                            right: 0, 
                                            zIndex: 1000,
                                            mt: 1,
                                            bgcolor: 'background.paper',
                                            boxShadow: 3,
                                            borderRadius: 1,
                                            width: 200,
                                            p: 1
                                        }}
                                    >
                                        {filterOptions.map(option => (
                                            <Button 
                                                key={option.label}
                                                fullWidth
                                                size="small"
                                                color={filter === option.value ? "primary" : "inherit"}
                                                variant={filter === option.value ? "contained" : "text"}
                                                onClick={() => {
                                                    applyFilter(option.value);
                                                    setShowFilterMenu(false);
                                                }}
                                                sx={{ justifyContent: 'flex-start', mb: 0.5 }}
                                            >
                                                {option.label}
                                            </Button>
                                        ))}
                                    </Box>
                                )}
                            </Box>
                        </Tooltip>
                    </ButtonGroup>
                    
                    <Tooltip title={t('historyRefreshTooltip')}>
                        <IconButton onClick={loadHistory} size="small">
                            <RefreshIcon />
                        </IconButton>
                    </Tooltip>
                </Box>
            </Box>
            
            <Paper variant="outlined" sx={{ mb: 2 }}>
                {groupedHistory.map((group, groupIndex) => (
                    <Box key={group.title}>
                        {groupIndex > 0 && <Divider />}
                        
                        <Box
                            sx={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                p: 1,
                                bgcolor: 'action.hover',
                                cursor: 'pointer'
                            }}
                            onClick={() => toggleGroup(group.title)}
                        >
                            <Typography variant="subtitle2" sx={{ display: 'flex', alignItems: 'center' }}>
                                {group.title} 
                                <Badge 
                                    badgeContent={group.items.length} 
                                    color="primary" 
                                    sx={{ ml: 2 }}
                                    max={999}
                                />
                            </Typography>
                            <IconButton size="small">
                                {visibleGroups[group.title.toLowerCase()] 
                                    ? <KeyboardArrowUpIcon /> 
                                    : <KeyboardArrowDownIcon />}
                            </IconButton>
                        </Box>
                        
                        <Collapse in={visibleGroups[group.title.toLowerCase()]}>
                            <List sx={{ width: '100%', bgcolor: 'background.paper', p: 0 }}>
                                {group.items.map((item, index) => {
                                    const isExpanded = expandedItems[item.id];
                                    const hasExpandableContent = (item.oldValue && item.newValue) || 
                                                               item.action === 'description_changed';
                                    
                                    return (
                                        <React.Fragment key={item.id || index}>
                                            {index > 0 && <Divider component="li" />}
                                            <ListItem 
                                                alignItems={compactMode ? "center" : "flex-start"}
                                                sx={{ 
                                                    p: compactMode ? 1 : 2,
                                                    cursor: hasExpandableContent ? 'pointer' : 'default',
                                                    '&:hover': {
                                                        bgcolor: 'action.hover'
                                                    },
                                                    transition: 'background-color 0.2s'
                                                }}
                                                onClick={hasExpandableContent ? () => toggleItemExpanded(item.id) : undefined}
                                            >
                                                <ListItemAvatar sx={{ minWidth: 'auto', mr: 1.5, mt: compactMode ? 0 : 0.5 }}>
                                                    <Tooltip title={item.username || t('historyUnknownUser')} arrow> 
                                                        <Avatar 
                                                            alt={item.username || 'User'} 
                                                            src={item.avatarUrl ? getAvatarUrl(item.avatarUrl) : undefined}
                                                            sx={{ width: compactMode ? 24 : 32, height: compactMode ? 24 : 32 }}
                                                        >
                                                            {item.username ? item.username.charAt(0).toUpperCase() : '?'}
                                                        </Avatar>
                                                    </Tooltip>
                                                </ListItemAvatar>
                                                <ListItemText
                                                    primary={
                                                        <Box sx={{ 
                                                            display: 'flex', 
                                                            flexWrap: 'wrap', 
                                                            gap: 1, 
                                                            alignItems: 'center'
                                                        }}>
                                                            <Tooltip title={item.email || t('historyEmailNotSpecified')}>
                                                                <Typography
                                                                    component="span"
                                                                    variant={compactMode ? "caption" : "body2"}
                                                                    color="text.primary"
                                                                    sx={{ fontWeight: 'bold' }}
                                                                >
                                                                    {item.username}
                                                                </Typography>
                                                            </Tooltip>
                                                            <Typography
                                                                component="span"
                                                                variant={compactMode ? "caption" : "body2"}
                                                                color="text.secondary"
                                                            >
                                                                {formatTimestamp(item.timestamp)}
                                                            </Typography>
                                                        </Box>
                                                    }
                                                    secondary={
                                                        <Box sx={{ mt: compactMode ? 0 : 1 }}>
                                                            <Chip 
                                                                icon={getActionIcon(item.action)}
                                                                label={formatAction(item.action)}
                                                                size="small"
                                                                color={getActionColor(item.action)}
                                                                variant="outlined"
                                                                sx={{ 
                                                                    display: 'inline-flex',
                                                                    mr: 1
                                                                }}  
                                                            />
                                                            
                                                            {compactMode && hasExpandableContent && (
                                                                <IconButton 
                                                                    size="small" 
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        toggleItemExpanded(item.id);
                                                                    }}
                                                                >
                                                                    {isExpanded ? <KeyboardArrowUpIcon fontSize="small" /> : <KeyboardArrowDownIcon fontSize="small" />}
                                                                </IconButton>
                                                            )}
                                                            
                                                            <Collapse in={!compactMode || isExpanded}>
                                                                {(item.oldValue || item.newValue) && (
                                                                    <Box sx={{ 
                                                                        mt: 1, 
                                                                        display: 'flex', 
                                                                        flexDirection: 'column', 
                                                                        gap: 0.5,
                                                                        pl: 1,
                                                                        borderLeft: '2px solid',
                                                                        borderColor: 'divider'
                                                                    }}>
                                                                        {item.action === 'moved_between_columns' ? (
                                                                            <Box>
                                                                                {renderValue(item.oldValue || '', item, t)}
                                                                            </Box>
                                                                        ) : (
                                                                            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', width: '100%' }}>
                                                                                {item.oldValue && item.newValue && (
                                                                                    <Grid container spacing={1} alignItems="center">
                                                                                        <Grid item xs={5}>
                                                                                            <Typography
                                                                                                variant="body2"
                                                                                                sx={{ 
                                                                                                    color: 'error.main',
                                                                                                    display: 'flex',
                                                                                                    alignItems: 'center'
                                                                                                }}
                                                                                            >
                                                                                                {renderValue(item.oldValue, item, t)}
                                                                                            </Typography>
                                                                                        </Grid>
                                                                                        <Grid item xs={2} sx={{ textAlign: 'center' }}>
                                                                                            <ArrowRightAltIcon 
                                                                                                fontSize="small" 
                                                                                                color="action"
                                                                                                sx={{ transform: 'scale(1.2)' }}
                                                                                            />
                                                                                        </Grid>
                                                                                        <Grid item xs={5}>
                                                                                            <Typography
                                                                                                variant="body2"
                                                                                                sx={{ 
                                                                                                    color: 'success.main',
                                                                                                    display: 'flex',
                                                                                                    alignItems: 'center'
                                                                                                }}
                                                                                            >
                                                                                                {renderValue(item.newValue, item, t)}
                                                                                            </Typography>
                                                                                        </Grid>
                                                                                    </Grid>
                                                                                )}
                                                                                
                                                                                {item.oldValue && !item.newValue && (
                                                                                    <Typography
                                                                                        variant="body2"
                                                                                        sx={{ 
                                                                                            color: 'error.main',
                                                                                            display: 'flex',
                                                                                            alignItems: 'center'
                                                                                        }}
                                                                                    >
                                                                                        {renderValue(item.oldValue, item, t)}
                                                                                    </Typography>
                                                                                )}
                                                                                
                                                                                {!item.oldValue && item.newValue && (
                                                                                    <Typography
                                                                                        variant="body2"
                                                                                        sx={{ 
                                                                                            color: 'success.main',
                                                                                            display: 'flex',
                                                                                            alignItems: 'center'
                                                                                        }}
                                                                                    >
                                                                                        {renderValue(item.newValue, item, t)}
                                                                                    </Typography>
                                                                                )}
                                                                            </Box>
                                                                        )}
                                                                    </Box>
                                                                )}
                                                            </Collapse>
                                                        </Box>
                                                    }
                                                />
                                            </ListItem>
                                        </React.Fragment>
                                    );
                                })}
                            </List>
                        </Collapse>
                    </Box>
                ))}
            </Paper>
        </Box>
    );
};

// Функция для безопасного отображения значений
const renderValue = (value: string | undefined, item: TaskHistoryType, t: (key: string) => string): React.ReactNode => {
    if (!value) return '';
    
    // Для события создания задачи показываем детали задачи
    if (item.action === 'task_created') {
        // Если у нас есть newValue, и это не просто "Задача создана"
        if (item.newValue && item.newValue !== 'Задача создана') {
            try {
                // Пытаемся распарсить JSON, если он есть в newValue
                const taskDetails = JSON.parse(item.newValue);
                return (
                    <Box sx={{ mt: 1 }}>
                        <Typography variant="caption" color="text.secondary">
                            {t('historyTaskCreatedDetailsLabel')}
                        </Typography>
                        <Box component="ul" sx={{ mt: 0.5, pl: 2, m: 0 }}>
                            {taskDetails.title && (
                                <Typography component="li" variant="body2">
                                    {t('historyTaskCreatedTitle')}: {taskDetails.title}
                                </Typography>
                            )}
                            {taskDetails.type && (
                                <Typography component="li" variant="body2">
                                    {t('historyTaskCreatedType')}: {taskDetails.type}
                                </Typography>
                            )}
                            {taskDetails.status && (
                                <Typography component="li" variant="body2">
                                    {t('historyTaskCreatedStatus')}: {taskDetails.status}
                                </Typography>
                            )}
                            {taskDetails.priority && (
                                <Typography component="li" variant="body2">
                                    {t('historyTaskCreatedPriority')}: {taskDetails.priority}
                                </Typography>
                            )}
                            {taskDetails.dates && (
                                <Typography component="li" variant="body2">
                                    {t('historyTaskCreatedDates')}: {taskDetails.dates}
                                </Typography>
                            )}
                            {taskDetails.tags && taskDetails.tags.length > 0 && (
                                <Typography component="li" variant="body2">
                                    {t('historyTaskCreatedTags')}: {taskDetails.tags.join(', ')}
                                </Typography>
                            )}
                        </Box>
                    </Box>
                );
            } catch {
                // Если не удалось распарсить JSON, просто показываем текст
                return <Typography variant="body2">{t('historyTaskCreatedText')}</Typography>;
            }
        }
        return <Typography variant="body2">{t('historyTaskCreatedText')}</Typography>;
    }
    
    // Для события изменения описания
    if (item.action === 'description_changed') {
        if (item.oldValue && item.newValue) {
            // Если есть и старое и новое значения, обрабатываем текст специальным образом
            const extractTextWithFormatting = (html: string) => {
                // Если описание не является HTML, возвращаем как есть
                if (!html.includes('<') && !html.includes('>')) {
                    return html;
                }
                
                try {
                    // Сначала заменяем все <br>, <p>, <div> на переносы строк
                    let processedHtml = html
                        .replace(/<br\s*\/?>/gi, '\n')
                        .replace(/<\/p>\s*<p>/gi, '\n\n')
                        .replace(/<\/div>\s*<div>/gi, '\n')
                        .replace(/<p>/gi, '')
                        .replace(/<\/p>/gi, '\n')
                        .replace(/<div>/gi, '')
                        .replace(/<\/div>/gi, '\n');
                    
                    // Создаем временный div для извлечения текста из HTML
                    const tempDiv = document.createElement('div');
                    tempDiv.innerHTML = processedHtml;
                    const extractedText = tempDiv.textContent || tempDiv.innerText || processedHtml;
                    
                    // Удаляем лишние переносы строк в начале и конце
                    return extractedText.trim();
                } catch {
                    return html;
                }
            };
            
            // Для изменения описания больше не показываем diff
            if (item.oldValue === item.newValue) {
                return <Typography variant="body2">
                    {t('historyDescriptionNoChange')}
                </Typography>;
            }
            
            // Получаем текст с сохранением форматирования
            const extractedText = extractTextWithFormatting(value);
            
            // Отображаем с сохранением переносов строк и пробелов
            return (
                <Typography 
                    variant="body2" 
                    component="pre"
                    sx={{ 
                        whiteSpace: 'pre-wrap',
                        fontFamily: 'inherit',
                        m: 0,
                        wordBreak: 'break-word',
                        fontSize: 'inherit',
                        overflow: 'auto',
                        maxHeight: '150px',
                        p: 1,
                        bgcolor: 'rgba(0, 0, 0, 0.03)',
                        borderRadius: 1
                    }}
                >
                    {extractedText}
                </Typography>
            );
        }
        
        // Если есть только одно из значений, обрабатываем его аналогичным образом
        const extractTextWithFormatting = (html: string) => {
            // Если описание не является HTML, возвращаем как есть
            if (!html.includes('<') && !html.includes('>')) {
                return html;
            }
            
            try {
                // Сначала заменяем все <br>, <p>, <div> на переносы строк
                let processedHtml = html
                    .replace(/<br\s*\/?>/gi, '\n')
                    .replace(/<\/p>\s*<p>/gi, '\n\n')
                    .replace(/<\/div>\s*<div>/gi, '\n')
                    .replace(/<p>/gi, '')
                    .replace(/<\/p>/gi, '\n')
                    .replace(/<div>/gi, '')
                    .replace(/<\/div>/gi, '\n');
                
                // Создаем временный div для извлечения текста из HTML
                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = processedHtml;
                const extractedText = tempDiv.textContent || tempDiv.innerText || processedHtml;
                
                // Удаляем лишние переносы строк в начале и конце
                return extractedText.trim();
            } catch {
                return html;
            }
        };
        
        const processedText = extractTextWithFormatting(value);
        
        return (
            <Typography 
                variant="body2" 
                component="pre"
                sx={{ 
                    whiteSpace: 'pre-wrap',
                    fontFamily: 'inherit',
                    m: 0,
                    wordBreak: 'break-word',
                    fontSize: 'inherit',
                    overflow: 'auto',
                    maxHeight: '150px',
                    p: 1,
                    bgcolor: 'rgba(0, 0, 0, 0.03)',
                    borderRadius: 1
                }}
            >
                {processedText}
            </Typography>
        );
    }
    
    // Если это события с вложениями
    if (item.action === 'attachment_added' || item.action === 'attachment_deleted') {
        const fileName = item.newValue || item.oldValue;
        if (fileName) {
            return (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <AttachFileIcon 
                        fontSize="small" 
                        color={item.action === 'attachment_added' ? 'success' : 'error'}
                    />
                    <Typography 
                        variant="body2" 
                        sx={{ 
                            fontWeight: 500,
                            color: item.action === 'attachment_added' ? 'success.main' : 'error.main'
                        }}
                    >
                        {fileName}
                    </Typography>
                </Box>
            );
        }
        return value;
    }
    
    // Если это изменение тегов
    if (item.action === 'tags_changed' || item.action === 'tag_added') {
        if (item.oldValue && item.newValue) {
            const oldTags = item.oldValue === t('historyTagsNoTags') ? [] : item.oldValue.split(', ');
            const newTags = item.newValue === t('historyTagsNoTags') ? [] : item.newValue.split(', ');
            
            const addedTags = newTags.filter(tag => !oldTags.includes(tag));
            const removedTags = oldTags.filter(tag => !newTags.includes(tag));
            
            return (
                <Box>
                    {removedTags.length > 0 && (
                        <Box sx={{ mb: 0.5 }}>
                            <Typography variant="caption" color="error.main">
                                {t('historyTagsRemoved')} 
                            </Typography>
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                                {removedTags.map((tag, i) => (
                                    <Chip 
                                        key={i}
                                        label={tag} 
                                        size="small" 
                                        color="error"
                                        variant="outlined"
                                    />
                                ))}
                            </Box>
                        </Box>
                    )}
                    {addedTags.length > 0 && (
                        <Box>
                            <Typography variant="caption" color="success.main">
                                {t('historyTagsAdded')} 
                            </Typography>
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                                {addedTags.map((tag, i) => (
                                    <Chip 
                                        key={i}
                                        label={tag} 
                                        size="small" 
                                        color="success"
                                        variant="outlined"
                                    />
                                ))}
                            </Box>
                        </Box>
                    )}
                    {addedTags.length === 0 && removedTags.length === 0 && (
                        <Typography variant="body2">
                            {t('historyTagsNoChange')}
                        </Typography>
                    )}
                </Box>
            );
        } else if (item.action === 'tag_added' && item.newValue) {
            // Для события добавления одного тега
            const tag = item.newValue;
            return (
                <Box>
                    <Typography variant="caption" color="success.main">
                        {t('historyTagsTagAdded')} 
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                        <Chip 
                            label={tag} 
                            size="small" 
                            color="success"
                            variant="outlined"
                        />
                    </Box>
                </Box>
            );
        }
        return value;
    }
    
    // Если это перемещение между колонками, меняем стиль отображения
    if (item.action === 'moved_between_columns' || item.action === 'column_changed') {
        // Добавляем специальный стиль отображения для перемещения между колонками
        return (
            <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
                <Chip 
                    label={item.oldValue} 
                    size="small" 
                    color="default"
                    variant="outlined"
                />
                <ArrowRightAltIcon color="action" />
                <Chip 
                    label={item.newValue} 
                    size="small" 
                    color="primary"
                    variant="outlined"
                />
            </Box>
        );
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