import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
    Container, 
    Typography, 
    Box, 
    IconButton, 
    CircularProgress,
    Button,
    Menu,
    MenuItem,
    Snackbar,
    Alert,
    TextField,
    InputAdornment,
    Chip,
    Popover,
    FormGroup,
    FormControlLabel,
    Checkbox,
    Tabs,
    Tab,
    Divider
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AddIcon from '@mui/icons-material/Add';
import SettingsIcon from '@mui/icons-material/Settings';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import FilterListIcon from '@mui/icons-material/FilterList';
import RefreshIcon from '@mui/icons-material/Refresh';
import PeopleAltIcon from '@mui/icons-material/PeopleAlt';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import ListIcon from '@mui/icons-material/List';
import DashboardCustomizeIcon from '@mui/icons-material/DashboardCustomize';
import SecurityIcon from '@mui/icons-material/Security';
import { Board } from '../types/board';
import { boardService } from '../services/boardService';
import { BoardColumn } from '../components/Board/BoardColumn';
import { Column, BoardStatus, TaskType } from '../types/board';
import { AddColumnModal } from '../components/Board/AddColumnModal/AddColumnModal';
import { Task } from '../types/task';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import { taskService } from '../services/taskService';
import { EditBoardModal } from '../components/Board/EditBoardModal/EditBoardModal';
import { EditColumnModal } from '../components/Board/EditColumnModal/EditColumnModal';
import { ConfirmDialog } from '../components/shared/ConfirmDialog/ConfirmDialog';
import { useHotkeys } from 'react-hotkeys-hook';
import { TaskFilters } from '../components/task/TaskFilters';
import { toast } from 'react-hot-toast';
import { userService } from '../services/userService';
import { useTheme, useMediaQuery } from '@mui/material';
import BoardMembersModal from '../components/Board/BoardMembersModal';
import { useRoleContext } from '../contexts/RoleContext';
import { Permission } from '../hooks/useUserRole';
import { BoardMembersService } from '../services/BoardMembersService';
import { BoardMember } from '../types/BoardMember';
import { getAvatarUrl } from '../utils/avatarUtils';
import { useLocalization } from '../hooks/useLocalization';

// Определяем тип для события горячих клавиш
interface HotkeyEvent {
    preventDefault(): void;
}

interface EditColumnData {
    id: string;
    name: string;
    color?: string;
}

interface BoardUpdate {
    name: string;
    description: string;
}

// Добавить TabPanel компонент
interface TabPanelProps {
    children?: React.ReactNode;
    index: number;
    value: number;
}

function TabPanel(props: TabPanelProps) {
    const { children, value, index, ...other } = props;

    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`filter-tabpanel-${index}`}
            aria-labelledby={`filter-tab-${index}`}
            {...other}
        >
            {value === index && (
                <Box sx={{ pt: 2 }}>
                    {children}
                </Box>
            )}
        </div>
    );
}

// Дополним типы для функций обратного вызова
interface ColumnMoveFn {
  (newPosition: number): void;
}

interface ColumnEditFn {
  (columnId: string, name: string, color?: string): void;
}

interface ColumnDeleteFn {
  (columnId: string, name: string): void;
}

interface TasksChangeFn {
  (updatedColumn: Column): void;
}

export const BoardPage: React.FC = () => {
    const { t } = useLocalization();
    const { boardId } = useParams<{ boardId: string }>();
    const [board, setBoard] = useState<Board | null>(null);
    const [loading, setLoading] = useState(true);
    const [isAddColumnModalOpen, setIsAddColumnModalOpen] = useState(false);
    const [isEditBoardModalOpen, setIsEditBoardModalOpen] = useState(false);
    const [isDeleteBoardDialogOpen, setIsDeleteBoardDialogOpen] = useState(false);
    const [editColumnData, setEditColumnData] = useState<EditColumnData | null>(null);
    const [deleteColumnData, setDeleteColumnData] = useState<{ id: string; name: string } | null>(null);
    const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
    const navigate = useNavigate();
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [deletingBoard, setDeletingBoard] = useState(false);
    const [deletingColumn, setDeletingColumn] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [filteredColumns, setFilteredColumns] = useState<Column[]>([]);
    const [selectedStatuses, setSelectedStatuses] = useState<number[]>([]);
    const [selectedTags, setSelectedTags] = useState<string[]>([]);
    const [filterAnchorEl, setFilterAnchorEl] = useState<null | HTMLElement>(null);
    const [availableTags, setAvailableTags] = useState<string[]>([]);
    const [taskTypes, setTaskTypes] = useState<TaskType[]>([]);
    const [selectedTypes, setSelectedTypes] = useState<number[]>([]);
    const [filterTabValue, setFilterTabValue] = useState(0);
    const [isRefreshing, setIsRefreshing] = useState(false);
    // Добавляем состояние для компактного режима карточек
    const [isCompactMode, setIsCompactMode] = useState(false);
    // Добавляем состояние для модального окна участников
    const [isMembersModalOpen, setIsMembersModalOpen] = useState(false);
    // Добавляем состояния для участников доски и фильтрации по ним
    const [boardMembers, setBoardMembers] = useState<BoardMember[]>([]);
    const [selectedAssignees, setSelectedAssignees] = useState<number[]>([]);
    const theme = useTheme();
    // Добавляем определение мобильного устройства
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    // Получаем контекст ролей
    const roleContext = useRoleContext();

    // Загружаем настройки пользователя при монтировании компонента
    useEffect(() => {
        const loadUserSettings = async () => {
            try {
                const settings = await userService.getUserSettings();
                if (settings && settings.compactMode !== undefined) {
                    setIsCompactMode(settings.compactMode);
                }
            } catch (error) {
                console.error('Не удалось загрузить настройки пользователя:', error);
                // В случае ошибки, используем false как значение по умолчанию
                setIsCompactMode(false);
            }
        };
        
        loadUserSettings();
    }, []);

    // Загружаем участников доски
    useEffect(() => {
        const loadBoardMembers = async () => {
            if (!boardId) {
                console.warn('BoardPage: boardId не определен, пропускаем загрузку участников');
                return;
            }
            
            console.log('BoardPage: Начинаем загрузку участников доски для boardId:', boardId);
            
            try {
                const members = await BoardMembersService.getBoardMembers(boardId);
                console.log('BoardPage: Получены участники доски:', members);
                
                // Безопасно устанавливаем участников, проверяя что это массив
                if (Array.isArray(members)) {
                    console.log(`BoardPage: Установлено ${members.length} участников доски`);
                    setBoardMembers(members);
                } else {
                    console.warn('BoardPage: Получены некорректные данные участников:', members);
                    setBoardMembers([]);
                }
            } catch (error) {
                console.error('BoardPage: Не удалось загрузить участников доски:', error);
                setBoardMembers([]); // Устанавливаем пустой массив при ошибке
            }
        };
        
        loadBoardMembers();
    }, [boardId]);

    // Добавляем обработчик события удаления задачи
    useEffect(() => {
        const handleTaskDeleted = (event: CustomEvent) => {
            const { taskId } = event.detail;
            console.log('Получено событие удаления задачи:', taskId);
            
            // Обновляем состояние доски, удаляя задачу из колонок
            setBoard(prevBoard => {
                if (!prevBoard) return prevBoard;
                
                const updatedColumns = prevBoard.columns.map(column => ({
                    ...column,
                    tasks: column.tasks.filter(task => task.id !== taskId)
                }));
                
                return {
                    ...prevBoard,
                    columns: updatedColumns
                };
            });
            
            // Также обновляем filteredColumns
            setFilteredColumns(prevColumns => 
                prevColumns.map(column => ({
                    ...column,
                    tasks: column.tasks.filter(task => task.id !== taskId)
                }))
            );
        };

        window.addEventListener('task-deleted', handleTaskDeleted as EventListener);
        
        return () => {
            window.removeEventListener('task-deleted', handleTaskDeleted as EventListener);
        };
    }, []);

    // Оптимизирую useEffect для загрузки доски
    useEffect(() => {
        if (boardId) {
            loadBoard();
        }
    }, [boardId]);

    // Оптимизирую useEffect для контекста ролей - обновляем только когда доска изменяется
    useEffect(() => {
        if (board) {
            console.log('Обновление контекста ролей и прав пользователя для доски');
            roleContext.setCurrentBoard(board);
            if ((board as any).currentUser) {
                roleContext.setCurrentUserId((board as any).currentUser.id);
            }
        }
    }, [board?.id, (board as any)?.currentUser?.id]); // Зависимости только от ID для минимизации перерендеров

    useEffect(() => {
        if (!board) return;

        if (!searchQuery.trim()) {
            setFilteredColumns([...board.columns]);
            return;
        }

        const query = searchQuery.toLowerCase().trim();
        const filtered = board.columns.map(column => ({
            ...column,
            tasks: column.tasks.filter(task => 
                task.title.toLowerCase().includes(query) ||
                task.description.toLowerCase().includes(query) ||
                task.tags?.some(tag => tag.toLowerCase().includes(query)) ||
                task.customStatus?.name.toLowerCase().includes(query)
            )
        }));

        setFilteredColumns([...filtered]);
    }, [searchQuery, board]);

    useEffect(() => {
        if (!board) return;
        const tags = new Set<string>();
        board.columns.forEach(column => {
            column.tasks.forEach(task => {
                task.tags?.forEach(tag => tags.add(tag));
            });
        });
        setAvailableTags(Array.from(tags));
    }, [board]);

    useEffect(() => {
        if (!board) return;

        const query = searchQuery.toLowerCase().trim();
        const filtered = board.columns.map(column => ({
            ...column,
            tasks: column.tasks.filter(task => {
                // Фильтрация по поисковому запросу
                const matchesSearch = !query || 
                    task.title.toLowerCase().includes(query) ||
                    task.description.toLowerCase().includes(query) ||
                    task.tags?.some(tag => tag.toLowerCase().includes(query)) ||
                    task.customStatus?.name.toLowerCase().includes(query);

                // Фильтрация по статусам
                const matchesStatus = selectedStatuses.length === 0 || 
                    (task.customStatus && selectedStatuses.includes(task.customStatus.id));

                // Фильтрация по типам
                const matchesType = selectedTypes.length === 0 ||
                    (task.type && selectedTypes.includes(task.type.id));

                // Фильтрация по тегам
                const matchesTags = selectedTags.length === 0 ||
                    selectedTags.every(tag => task.tags?.includes(tag));

                // Фильтрация по назначенным пользователям
                const matchesAssignees = selectedAssignees.length === 0 ||
                    (task.assignee && task.assignee.id && selectedAssignees.includes(task.assignee.id));

                return matchesSearch && matchesStatus && matchesType && matchesTags && matchesAssignees;
            })
        }));

        setFilteredColumns([...filtered]);
    }, [searchQuery, board, selectedStatuses, selectedTypes, selectedTags, selectedAssignees]);

    // Обновляем TaskCards при изменении статусов задач
    useEffect(() => {
        if (board && board.columns && board.taskStatuses) {
            console.log('Обновление карточек задач из-за изменения статусов задач');
            
            // Создаем копию колонок для безопасного обновления
            const updatedColumns = [...board.columns];
            
            // Обновляем задачи в колонках
            setFilteredColumns(updatedColumns);
        }
    }, [board?.taskStatuses]);

    // Обновим useEffect для обновления TaskCards при изменении типов задач
    useEffect(() => {
        if (board && board.columns && board.taskTypes) {
            console.log('Обновление карточек задач из-за изменения типов задач');
            
            // Идем по обратному пути - задачи уже привязаны к типам в массиве taskTypes
            // Создаем индекс задач по типам
            const taskTypeMap = new Map<number, {
                typeId: number;
                typeName: string;
                typeColor: string;
                typeIcon: string;
                isDefault: boolean;
                isCustom: boolean;
                position: number;
            }>();
            
            board.taskTypes.forEach(type => {
                // Безопасно проверяем наличие свойства tasks
                const typeTasks = (type as any).tasks;
                if (typeTasks && Array.isArray(typeTasks)) {
                    typeTasks.forEach((task: any) => {
                        if (task && typeof task.id === 'number') {
                            taskTypeMap.set(task.id, {
                                typeId: type.id,
                                typeName: type.name,
                                typeColor: type.color,
                                typeIcon: type.icon,
                                isDefault: type.isDefault,
                                isCustom: type.isCustom,
                                position: type.position
                            });
                        }
                    });
                }
            });
            
            // Обновляем задачи в колонках с типами из индекса
            const updatedColumns = board.columns.map(column => {
                return {
                    ...column,
                    tasks: column.tasks.map(task => {
                        const typeInfo = taskTypeMap.get(task.id);
                        if (typeInfo) {
                            return {
                                ...task,
                                type: {
                                    id: typeInfo.typeId,
                                    name: typeInfo.typeName,
                                    color: typeInfo.typeColor,
                                    icon: typeInfo.typeIcon,
                                    isDefault: typeInfo.isDefault,
                                    isCustom: typeInfo.isCustom,
                                    position: typeInfo.position
                                }
                            };
                        }
                        return task;
                    })
                };
            });
            
            // Обновляем фильтрованные колонки с обновленными типами задач
            setFilteredColumns(updatedColumns);
        }
    }, [board?.taskTypes]);

    // Оптимизируем обработку типов задач и статусов, учитывая специфичную структуру API
    const processTasksWithTypeAndStatus = (boardData: Board) => {
        // Отладочный вывод для анализа структуры данных
        console.log('Обрабатываем данные доски. TaskTypes:', boardData.taskTypes?.length);
        if (boardData.taskTypes && boardData.taskTypes.length > 0) {
            console.log('Пример типа задачи:', JSON.stringify(boardData.taskTypes[0], null, 2));
        }
        
        // Создаем индексы для быстрого доступа к типам и статусам
        const typeMap = new Map<number, TaskType>();
        const statusMap = new Map<number, BoardStatus>();
        
        // Создаем прямой индекс задач по их ID
        const taskTypeMap = new Map<number, TaskType>();
        const taskStatusMap = new Map<number, BoardStatus>();
        
        // Индексируем типы 
        if (boardData.taskTypes) {
            boardData.taskTypes.forEach(type => {
                typeMap.set(type.id, type);
                
                // Если у типа есть связанные задачи, создаем связи в обоих направлениях
                if (type.tasks && Array.isArray(type.tasks)) {
                    type.tasks.forEach(task => {
                        // Сохраняем связь "задача -> тип"
                        taskTypeMap.set(task.id, type);
                        console.log(`Связываем задачу ${task.id} (${task.title}) с типом ${type.name}`);
                    });
                }
            });
        }
        
        // Индексируем статусы
        if (boardData.taskStatuses) {
            boardData.taskStatuses.forEach(status => {
                statusMap.set(status.id, status);
                
                // Если у статуса есть связанные задачи, создаем связи
                if (status.tasks && Array.isArray(status.tasks)) {
                    status.tasks.forEach(task => {
                        // Сохраняем связь "задача -> статус"
                        taskStatusMap.set(task.id, status);
                    });
                }
            });
        }
        
        // Теперь обрабатываем колонки и задачи
        const processedColumns: Column[] = boardData.columns.map(column => {
            const processedTasks = column.tasks.map(task => {
                // ИСПРАВЛЕНИЕ: Полное копирование задачи с сохранением всех полей включая assignee
                let processedTask = { 
                    ...task,
                    // Явно сохраняем критически важные поля
                    assignee: task.assignee,
                    type: task.type,
                    customStatus: task.customStatus,
                    tags: task.tags,
                    commentCount: task.commentCount || 0,
                    attachmentCount: task.attachmentCount || 0
                };
                
                // Добавляем тип задачи из индекса задач
                const taskType = taskTypeMap.get(task.id);
                if (taskType) {
                    processedTask.type = {
                        id: taskType.id,
                        name: taskType.name,
                        color: taskType.color,
                        icon: taskType.icon,
                        isDefault: taskType.isDefault,
                        isCustom: taskType.isCustom,
                        position: taskType.position
                    };
                    console.log(`Задаче ${task.id} (${task.title}) установлен тип ${taskType.name}`);
                } else {
                    console.log(`Задаче ${task.id} (${task.title}) не найден тип`);
                    
                    // Пробуем найти тип по task.type?.id, если оно существует
                    if (task.type && task.type.id) {
                        const typeById = typeMap.get(task.type.id);
                        if (typeById) {
                            processedTask.type = {
                                id: typeById.id,
                                name: typeById.name,
                                color: typeById.color,
                                icon: typeById.icon,
                                isDefault: typeById.isDefault,
                                isCustom: typeById.isCustom,
                                position: typeById.position
                            };
                            console.log(`Задаче ${task.id} установлен тип ${typeById.name} по ID типа`);
                        }
                    }
                }
                
                // Добавляем статус задачи из индекса задач
                const taskStatus = taskStatusMap.get(task.id);
                if (taskStatus) {
                    processedTask.customStatus = {
                        id: taskStatus.id,
                        name: taskStatus.name,
                        color: taskStatus.color,
                        isDefault: taskStatus.isDefault,
                        isCustom: taskStatus.isCustom,
                        position: taskStatus.position
                    };
                } else {
                    // Пробуем найти статус по task.customStatus?.id, если оно существует
                    if (task.customStatus && task.customStatus.id) {
                        const statusById = statusMap.get(task.customStatus.id);
                        if (statusById) {
                            processedTask.customStatus = {
                                id: statusById.id,
                                name: statusById.name,
                                color: statusById.color,
                                isDefault: statusById.isDefault,
                                isCustom: statusById.isCustom,
                                position: statusById.position
                            };
                        }
                    }
                }
                
                // Отладочный вывод для проверки сохранения assignee
                if (task.assignee) {
                    console.log(`Задача ${task.id} имеет назначенного пользователя: ${task.assignee.username} (ID: ${task.assignee.id})`);
                    console.log(`processedTask сохранил assignee:`, processedTask.assignee);
                }
                
                return processedTask;
            });
            
            return {
                ...column,
                tasks: processedTasks
            };
        });
        
        // Выводим итоги обработки
        console.log(`Обработано ${boardData.columns.length} колонок с задачами`);
        boardData.columns.forEach(column => {
            console.log(`Колонка ${column.name}: ${column.tasks.length} задач`);
        });
        
        return {
            ...boardData,
            columns: processedColumns
        };
    };

    // Оптимизируем метод loadBoard, чтобы устранить дублирование запросов
    const loadBoard = async () => {
        if (!boardId) return;
        try {
            setLoading(true);
            
            // Загружаем доску одним запросом
            const boardData = await boardService.getBoard(boardId);
            console.log('Данные доски после загрузки:', boardData);
            
            // Обрабатываем типы и статусы задач
            const processedBoard = processTasksWithTypeAndStatus(boardData);
            
            // Устанавливаем состояние одним обновлением
            setBoard(processedBoard);
            setFilteredColumns([...processedBoard.columns]);
            setTaskTypes(processedBoard.taskTypes || []);
            
        } catch (error) {
            console.error('Failed to load board:', error instanceof Error ? error.message : error);
            setError('Не удалось загрузить доску');
        } finally {
            setLoading(false);
        }
    };

    // Проверяем, может ли пользователь добавлять колонки
    const canAddColumn = () => {
        return roleContext.hasPermission(Permission.ADD_COLUMNS);
    };
    
    // Проверяем, может ли пользователь редактировать доску
    const canEditBoard = () => {
        return roleContext.hasPermission(Permission.EDIT_BOARD_SETTINGS);
    };
    
    // Проверяем, может ли пользователь удалять доску
    const canDeleteBoard = () => {
        return roleContext.hasPermission(Permission.DELETE_BOARD);
    };

    // Обновляем обработчики действий с проверкой разрешений
    const handleAddColumn = async (columnName: string) => {
        if (!canAddColumn()) {
            toast.error('У вас нет прав на добавление колонок');
            return;
        }
        
        try {
            if (!board || !boardId) return;
            
            console.log('Добавление новой колонки:', columnName);
            setLoading(true);
            
            // Получаем обновленную доску через сервис
            const updatedBoard = await boardService.addColumn(boardId, { name: columnName });
            console.log('Доска после добавления колонки:', updatedBoard);
            
            // Обрабатываем типы и статусы задач
            const processedBoard = processTasksWithTypeAndStatus(updatedBoard);
            
            // Устанавливаем обновленное состояние
            setBoard(processedBoard);
            setFilteredColumns([...processedBoard.columns]);
            setTaskTypes(processedBoard.taskTypes || []);
            
            toast.success('Колонка успешно добавлена');
        } catch (error) {
            console.error('Ошибка при добавлении колонки:', error instanceof Error ? error.message : error);
            setError(t('errorAddColumn'));
            toast.error(t('errorAddColumn'));
        } finally {
            setLoading(false);
        }
    };

    const handleMoveColumn = async (columnId: string, newPosition: number): Promise<void> => {
        console.log(`Перемещение колонки ${columnId} на позицию ${newPosition}`);
        
        if (!board) {
            console.error('Доска не загружена');
            return;
        }
        
        // Проверяем, что новая позиция корректна
        if (newPosition < 0 || newPosition >= board.columns.length) {
            setError(`Некорректная позиция: ${newPosition}. Допустимый диапазон: 0-${board.columns.length - 1}`);
            return;
        }
        
        try {
            // Оптимистично обновляем UI
            const updatedColumns = [...board.columns];
            console.log('Колонки доски:', updatedColumns.map(c => `id:${c.id} (${typeof c.id}), name:${c.name}, position:${c.position}`));
            
            // Поиск колонки с приведением типов
            const columnIndex = updatedColumns.findIndex(c => c.id.toString() === columnId.toString());
            
            if (columnIndex === -1) {
                console.error(`Колонка с ID ${columnId} не найдена`);
                console.error(`Типы: ID в аргументе: ${typeof columnId}, ID колонок: ${typeof updatedColumns[0]?.id}`);
                return;
            }
            
            console.log(`Колонка найдена: ${updatedColumns[columnIndex].name} на позиции ${columnIndex}`);
            
            const [column] = updatedColumns.splice(columnIndex, 1);
            updatedColumns.splice(newPosition, 0, column);
            
            // Обновляем позиции
            const columnsWithNewPositions = updatedColumns.map((col, index) => ({
                ...col,
                position: index
            }));
            
            const optimisticBoard = {
                ...board,
                columns: columnsWithNewPositions
            };
            
            setBoard(optimisticBoard);
            
            // Также обновляем filteredColumns для немедленного отображения
            setFilteredColumns([...columnsWithNewPositions]);
            
            // Отправляем запрос на сервер
            console.log(`Отправка запроса на перемещение колонки ${columnId} на позицию ${newPosition}`);
            const updatedBoard = await boardService.moveColumn(board.id.toString(), columnId, newPosition);
            console.log('Получен ответ от сервера:', updatedBoard);
            
            // Обновляем доску с данными с сервера
            setBoard(updatedBoard);
            
            // Обновляем filteredColumns с данными с сервера
            setFilteredColumns([...updatedBoard.columns]);
            
        } catch (error) {
            console.error('Ошибка при перемещении колонки:', error);
            setError('Не удалось переместить колонку. Пожалуйста, попробуйте еще раз.');
            
            // Загружаем актуальное состояние доски с сервера
            if (!board) return;
            
            try {
                const refreshedBoard = await boardService.getBoard(board.id.toString());
                setBoard(refreshedBoard);
                
                // Обновляем filteredColumns при ошибке
                setFilteredColumns([...refreshedBoard.columns]);
                
            } catch (refreshError) {
                console.error('Не удалось обновить доску:', refreshError);
            }
        }
    };

    const onDragEnd = async (result: DropResult) => {
        const { destination, source, draggableId } = result;

        if (!destination) {
            return;
        }

        if (
            destination.droppableId === source.droppableId &&
            destination.index === source.index
        ) {
            return;
        }

        const taskId = parseInt(draggableId.replace('task-', ''));
        const sourceColumnId = parseInt(source.droppableId.replace('column-', ''));
        const destinationColumnId = parseInt(destination.droppableId.replace('column-', ''));

        // Находим задачу в исходной колонке
        const sourceColumn = board?.columns.find(col => Number(col.id) === sourceColumnId);
        if (!sourceColumn) {
            console.error('Исходная колонка не найдена');
            return;
        }

        const task = sourceColumn.tasks[source.index];
        if (!task) {
            console.error('Задача не найдена');
            return;
        }

        try {
            // Оптимистично обновляем UI сначала
            setBoard(prevBoard => {
                if (!prevBoard) return prevBoard;
                
                const newColumns = [...prevBoard.columns];
                const sourceCol = newColumns.find(col => Number(col.id) === sourceColumnId);
                const destinationCol = newColumns.find(col => Number(col.id) === destinationColumnId);

                if (!sourceCol || !destinationCol) {
                    return prevBoard;
                }

                // Удаляем задачу из исходной колонки
                const [movedTask] = sourceCol.tasks.splice(source.index, 1);
                
                // Добавляем задачу в целевую колонку
                destinationCol.tasks.splice(destination.index, 0, movedTask);

                const updatedBoard = {
                    ...prevBoard,
                    columns: newColumns
                };
                
                // Обновляем filteredColumns синхронно
                setFilteredColumns([...newColumns]);
                
                return updatedBoard;
            });

            console.log('Moving task:', {
                taskId,
                sourceColumnId,
                destinationColumnId,
                newPosition: destination.index,
                typeId: task.type?.id,
                statusId: task.customStatus?.id
            });

            // Выполняем API запрос после обновления UI
            const movedTask = await taskService.moveTask({
                taskId,
                sourceColumnId,
                destinationColumnId,
                newPosition: destination.index,
                typeId: task.type?.id || null,
                statusId: task.customStatus?.id || null
            });

            console.log('Task moved successfully:', movedTask);

            // Синхронизируем с сервером только если есть изменения
            if (movedTask && movedTask.assignee) {
                setBoard(prevBoard => {
                    if (!prevBoard) return prevBoard;
                    
                    const newColumns = [...prevBoard.columns];
                    const targetColumn = newColumns.find(col => Number(col.id) === destinationColumnId);
                    
                    if (targetColumn) {
                        const taskIndex = targetColumn.tasks.findIndex(t => t.id === taskId);
                        if (taskIndex !== -1) {
                            // Обновляем задачу данными с сервера, сохраняя аватарку
                            targetColumn.tasks[taskIndex] = {
                                ...movedTask,
                                assignee: movedTask.assignee ? {
                                    ...movedTask.assignee,
                                    avatarUrl: movedTask.assignee.avatarUrl || targetColumn.tasks[taskIndex].assignee?.avatarUrl
                                } : targetColumn.tasks[taskIndex].assignee
                            };
                        }
                    }
                    
                    return {
                        ...prevBoard,
                        columns: newColumns
                    };
                });
            }
        } catch (error) {
            console.error('Error moving task:', error);
            toast.error('Ошибка при перемещении задачи');
            
            // Откатываем изменения в случае ошибки
            if (board) {
                setBoard({ ...board });
                setFilteredColumns([...board.columns]);
            }
        }
    };

    const handleBoardMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
        setMenuAnchorEl(event.currentTarget);
    };

    const handleBoardMenuClose = () => {
        setMenuAnchorEl(null);
    };

    const handleEditBoard = async (updates: BoardUpdate) => {
        try {
            if (!boardId) return;
            setLoading(true);
            const updatedBoard = await boardService.updateBoardDetails(boardId, updates);
            
            // Обрабатываем полученную доску через processBoard
            const processedBoard = boardService.processBoard(updatedBoard);
            setBoard(processedBoard);
            
            // Обновляем filteredColumns для немедленного отображения
            setFilteredColumns([...processedBoard.columns]);
            
            setSuccess('Доска успешно обновлена');
            setIsEditBoardModalOpen(false);
            
            // Обновляем локальное состояние taskTypes для немедленного применения в интерфейсе
            setTaskTypes(processedBoard.taskTypes || []);
        } catch (error) {
            console.error('Failed to update board:', error instanceof Error ? error.message : error);
            setError('Не удалось обновить доску');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteBoard = async () => {
        try {
            if (!boardId) return;
            setDeletingBoard(true);
            await boardService.deleteBoard(boardId);
            setSuccess('Доска успешно удалена');
            navigate('/');
        } catch (error) {
            console.error('Failed to delete board:', error instanceof Error ? error.message : error);
            setError(t('errorDeleteBoard'));
        } finally {
            setDeletingBoard(false);
            setIsDeleteBoardDialogOpen(false);
        }
    };

    const handleEditColumn = async (columnId: string, name: string, color?: string) => {
        try {
            if (!boardId) return;
            setLoading(true);
            const updatedBoard = await boardService.updateColumn(boardId, columnId, { name, color });
            
            // Обрабатываем полученную доску через processBoard для правильного обновления типов
            const processedBoard = boardService.processBoard(updatedBoard);
            setBoard(processedBoard);
            
            // Явно обновляем filteredColumns для немедленного отображения
            setFilteredColumns([...processedBoard.columns]);
            
            setSuccess('Колонка успешно обновлена');
            setEditColumnData(null);
        } catch (error) {
            console.error('Failed to update column:', error instanceof Error ? error.message : error);
            setError('Не удалось обновить колонку');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteColumn = async (columnId: string, name: string) => {
        try {
            if (!boardId) return;
            setDeletingColumn(true);
            const updatedBoard = await boardService.deleteColumn(boardId, columnId);
            
            // Обрабатываем полученную доску через processBoard для правильного обновления типов
            const processedBoard = boardService.processBoard(updatedBoard);
            setBoard(processedBoard);
            
            // Явно обновляем filteredColumns для немедленного отображения
            setFilteredColumns([...processedBoard.columns]);
            
            setSuccess('Колонка успешно удалена');
            setDeleteColumnData(null);
        } catch (error) {
            console.error('Failed to delete column:', error instanceof Error ? error.message : error);
            setError(t('errorDeleteColumn'));
        } finally {
            setDeletingColumn(false);
        }
    };

    const handleFilterOpen = (event: React.MouseEvent<HTMLElement>) => {
        setFilterAnchorEl(event.currentTarget);
    };

    const handleFilterClose = () => {
        setFilterAnchorEl(null);
    };

    const handleStatusToggle = (statusId: number) => {
        setSelectedStatuses(prev => 
            prev.includes(statusId)
                ? prev.filter(id => id !== statusId)
                : [...prev, statusId]
        );
    };

    const handleTagToggle = (tag: string) => {
        setSelectedTags(prev =>
            prev.includes(tag)
                ? prev.filter(t => t !== tag)
                : [...prev, tag]
        );
    };

    const handleTypeToggle = (typeId: number) => {
        setSelectedTypes(prev => 
            prev.includes(typeId)
                ? prev.filter(id => id !== typeId)
                : [...prev, typeId]
        );
    };

    const handleAssigneeToggle = (userId: number) => {
        if (!userId || typeof userId !== 'number') {
            console.warn('Invalid userId provided to handleAssigneeToggle:', userId);
            return;
        }
        
        setSelectedAssignees(prev => 
            prev.includes(userId)
                ? prev.filter(id => id !== userId)
                : [...prev, userId]
        );
    };

    const clearFilters = () => {
        setSelectedStatuses([]);
        setSelectedTags([]);
        setSelectedTypes([]);
        setSelectedAssignees([]);
        handleFilterClose();
    };

    // Добавляем горячие клавиши
    useHotkeys('ctrl+f, cmd+f', (e: KeyboardEvent) => {
        e.preventDefault();
        const searchInput = document.querySelector('input[placeholder*="Search"]') as HTMLInputElement || 
                          document.querySelector('input[placeholder*="Поиск"]') as HTMLInputElement;
        if (searchInput) {
            searchInput.focus();
        }
    }, { enableOnFormTags: true }, []);

    useHotkeys('ctrl+/, cmd+/', (e: KeyboardEvent) => {
        e.preventDefault();
        const filterButton = document.querySelector('[aria-label*="Filter"]') as HTMLElement ||
                             document.querySelector('[aria-label*="Фильтр"]') as HTMLElement;
        if (filterButton) {
            setFilterAnchorEl(filterButton);
        }
    }, { enableOnFormTags: true }, []);

    useHotkeys('esc', (e: KeyboardEvent) => {
        e.preventDefault();
        setSearchQuery('');
        setFilterAnchorEl(null);
        setSelectedStatuses([]);
        setSelectedTags([]);
    }, { enableOnFormTags: true }, []);

    // Обновляем типы в хуках горячих клавиш
    useHotkeys('ctrl+n, cmd+n', (e: any) => {
        e.preventDefault();
        setIsAddColumnModalOpen(true);
    }, { enableOnFormTags: true }, []);

    useHotkeys('ctrl+e, cmd+e', (e: any) => {
        e.preventDefault();
        setIsEditBoardModalOpen(true);
    }, { enableOnFormTags: true }, []);

    // Добавляем новый компонент для индикатора синхронизации
    const SyncIndicator = () => (
        <Box
            sx={{
                position: 'fixed',
                bottom: 16,
                right: 16,
                zIndex: 1000
            }}
        >
            {success === 'Синхронизация...' && (
                <CircularProgress size={20} sx={{ mr: 1 }} />
            )}
            {success && (
                <Alert 
                    severity={success === 'Синхронизация...' ? 'info' : 'success'}
                    sx={{ 
                        boxShadow: 3,
                        opacity: 0.9,
                        '&:hover': { opacity: 1 }
                    }}
                >
                    {success}
                </Alert>
            )}
        </Box>
    );

    const handleFilterTabChange = (event: React.SyntheticEvent, newValue: number) => {
        setFilterTabValue(newValue);
    };

    // Оптимизируем метод handleRefreshBoard
    const handleRefreshBoard = async () => {
        if (!boardId) return;
        
        try {
            setIsRefreshing(true);
            
            // Загружаем доску без дополнительных параллельных запросов
            const boardData = await boardService.getBoard(boardId);
            console.log('Данные доски после обновления:', boardData);
            
            // Обрабатываем типы и статусы задач
            const processedBoard = processTasksWithTypeAndStatus(boardData);
            
            // Устанавливаем обновленное состояние
            setBoard(processedBoard);
            setFilteredColumns([...processedBoard.columns]);
            setTaskTypes(processedBoard.taskTypes || []);
            
            toast.success(t('boardUpdated'));
        } catch (error) {
            console.error(t('errorUpdatingBoard'), error);
            toast.error(t('failedToUpdateBoard'));
        } finally {
            setIsRefreshing(false);
        }
    };

    if (loading) {
        return (
            <Container sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                <CircularProgress />
            </Container>
        );
    }

    if (!board) {
        return (
            <Container>
                <Typography>{t('boardNotFound')}</Typography>
            </Container>
        );
    }

    return (
        <Container sx={{ mt: 2, mb: 4, p: {xs: 1, sm: 2} }} maxWidth={false}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <IconButton onClick={() => navigate('/boards')} aria-label="back">
                        <ArrowBackIcon />
                    </IconButton>
                    <Typography variant="h5" component="h1" noWrap sx={{ maxWidth: { xs: 200, sm: 300, md: 500 } }}>
                        {board?.name || t('loading')}
                    </Typography>
                    <IconButton 
                        onClick={handleBoardMenuOpen} 
                        aria-label="board settings"
                        aria-haspopup="true"
                        title={t('boardSettings')}
                    >
                        <SettingsIcon />
                    </IconButton>
                </Box>

                <Box sx={{ display: 'flex', gap: 1, ml: 'auto', flexWrap: 'wrap' }}>
                    <TextField
                        size="small"
                        placeholder={t('searchTasks')}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <SearchIcon />
                                </InputAdornment>
                            ),
                            endAdornment: searchQuery && (
                                <InputAdornment position="end">
                                    <IconButton size="small" onClick={() => setSearchQuery('')}>
                                        <ClearIcon fontSize="small" />
                                    </IconButton>
                                </InputAdornment>
                            ),
                            sx: { height: 40 }
                        }}
                        sx={{ width: { xs: '100%', sm: 200 } }}
                    />
                    
                    <Button 
                        variant="outlined" 
                        onClick={handleFilterOpen}
                        startIcon={<FilterListIcon />}
                        aria-label={t('filterTasks')}
                        aria-haspopup="true"
                        aria-expanded={Boolean(filterAnchorEl) ? 'true' : undefined}
                        aria-controls={Boolean(filterAnchorEl) ? 'filter-menu' : undefined}
                        size="small"
                        sx={{ height: 40, display: { xs: 'none', sm: 'flex' } }}
                    >
                        {t('filterTasks')}
                        {(selectedStatuses.length > 0 || selectedTags.length > 0 || selectedTypes.length > 0) && (
                            <Chip 
                                label={selectedStatuses.length + selectedTags.length + selectedTypes.length} 
                                size="small" 
                                color="primary"
                                sx={{ ml: 1, height: 20, minWidth: 20 }}
                            />
                        )}
                    </Button>
                    
                    <IconButton 
                        onClick={handleFilterOpen}
                        aria-label={t('filters')}
                        sx={{ display: { xs: 'flex', sm: 'none' } }}
                    >
                        <FilterListIcon />
                        {(selectedStatuses.length > 0 || selectedTags.length > 0 || selectedTypes.length > 0) && (
                            <Box 
                                sx={{ 
                                    position: 'absolute', 
                                    top: 0, 
                                    right: 0, 
                                    width: 12, 
                                    height: 12, 
                                    bgcolor: 'primary.main', 
                                    borderRadius: '50%' 
                                }} 
                            />
                        )}
                    </IconButton>
                    
                    <IconButton 
                        onClick={handleRefreshBoard}
                        aria-label={t('refreshBoard')}
                        disabled={isRefreshing}
                    >
                        <RefreshIcon />
                    </IconButton>
                </Box>

                <Menu
                    id="board-menu"
                    anchorEl={menuAnchorEl}
                    open={Boolean(menuAnchorEl)}
                    onClose={handleBoardMenuClose}
                    PaperProps={{
                        elevation: 3,
                        sx: { 
                            minWidth: '250px',
                            mt: 1,
                            p: 0.5
                        }
                    }}
                >
                    {canEditBoard() && (
                        <MenuItem 
                            onClick={() => {
                                setIsEditBoardModalOpen(true);
                                handleBoardMenuClose();
                            }}
                        >
                            <Box display="flex" alignItems="center">
                                <EditIcon fontSize="small" sx={{ mr: 2, color: 'primary.main' }} />
                                {t('editBoard')}
                            </Box>
                        </MenuItem>
                    )}
                    
                    <MenuItem 
                        onClick={() => {
                            setIsMembersModalOpen(true);
                            handleBoardMenuClose();
                        }}
                    >
                        <Box display="flex" alignItems="center">
                            <PeopleAltIcon fontSize="small" sx={{ mr: 2, color: 'primary.main' }} />
                            {t('members')}
                        </Box>
                    </MenuItem>
                
                    
                    <Divider sx={{ my: 1 }} />
                    
                    {canDeleteBoard() && (
                        <MenuItem 
                            onClick={() => {
                                setIsDeleteBoardDialogOpen(true);
                                handleBoardMenuClose();
                            }}
                            sx={{ color: 'error.main' }}
                        >
                            <Box display="flex" alignItems="center">
                                <DeleteIcon fontSize="small" sx={{ mr: 2 }} />
                                {t('deleteBoard')}
                            </Box>
                        </MenuItem>
                    )}
                </Menu>
                
                <Popover
                    id="filter-menu"
                    open={Boolean(filterAnchorEl)}
                    anchorEl={filterAnchorEl}
                    onClose={handleFilterClose}
                    anchorOrigin={{
                        vertical: 'bottom',
                        horizontal: 'right',
                    }}
                    transformOrigin={{
                        vertical: 'top',
                        horizontal: 'right',
                    }}
                    PaperProps={{
                        sx: { 
                            width: { xs: 300, sm: 450 },
                            maxHeight: { xs: '80vh', sm: 600 },
                            overflow: 'auto',
                            p: 2
                        }
                    }}
                >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Typography variant="h6">{t('filters')}</Typography>
                        <Button 
                            onClick={clearFilters}
                            disabled={selectedStatuses.length === 0 && selectedTags.length === 0 && selectedTypes.length === 0 && selectedAssignees.length === 0}
                        >
                            {t('resetAllFilters')}
                        </Button>
                    </Box>
                    
                    <Tabs 
                        value={filterTabValue} 
                        onChange={handleFilterTabChange}
                        variant="fullWidth"
                        sx={{ mb: 2 }}
                    >
                        <Tab label={t('filterTabStatuses')} />
                        <Tab label={t('filterTabTags')} />
                        <Tab label={t('filterTabTypes')} />
                        <Tab label={t('filterTabMembers')} />
                    </Tabs>
                    
                    <TabPanel value={filterTabValue} index={0}>
                        <FormGroup>
                            {board?.taskStatuses.map((status) => (
                                <FormControlLabel
                                    key={status.id}
                                    control={
                                        <Checkbox
                                            checked={selectedStatuses.includes(status.id)}
                                            onChange={() => handleStatusToggle(status.id)}
                                            sx={{
                                                color: status.color,
                                                '&.Mui-checked': {
                                                    color: status.color,
                                                },
                                            }}
                                        />
                                    }
                                    label={status.name}
                                />
                            ))}
                        </FormGroup>
                    </TabPanel>
                    
                    <TabPanel value={filterTabValue} index={1}>
                        <FormGroup>
                            {availableTags.map((tag) => (
                                <FormControlLabel
                                    key={tag}
                                    control={
                                        <Checkbox
                                            checked={selectedTags.includes(tag)}
                                            onChange={() => handleTagToggle(tag)}
                                        />
                                    }
                                    label={tag}
                                />
                            ))}
                        </FormGroup>
                    </TabPanel>
                    
                    <TabPanel value={filterTabValue} index={2}>
                        <FormGroup>
                            {taskTypes.map((type) => (
                                <FormControlLabel
                                    key={type.id}
                                    control={
                                        <Checkbox
                                            checked={selectedTypes.includes(type.id)}
                                            onChange={() => handleTypeToggle(type.id)}
                                            sx={{
                                                color: type.color || undefined,
                                                '&.Mui-checked': {
                                                    color: type.color || undefined,
                                                },
                                            }}
                                        />
                                    }
                                    label={type.name}
                                />
                            ))}
                        </FormGroup>
                    </TabPanel>
                    
                    <TabPanel value={filterTabValue} index={3}>
                        
                        {boardMembers && boardMembers.length > 0 ? (
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                {boardMembers
                                    .filter(member => {
                                        // Более гибкая фильтрация, поддерживающая разные структуры
                                        const hasUser = member && (member.user || member.userId || member.username);
                                        console.log('Фильтрация участника:', member, 'hasUser:', hasUser);
                                        return hasUser;
                                    })
                                    .map((member) => {
                                        // Определяем ID пользователя из разных возможных источников
                                        const userId = member.user?.id || member.userId;
                                        const username = member.user?.username || member.username;
                                        const email = member.user?.email || member.email;
                                        const avatarUrl = getAvatarUrl(member.user?.avatarUrl || member.avatarUrl);
                                        
                                        console.log('Рендеринг участника:', { userId, username, email, avatarUrl, member });
                                        
                                        if (!userId) {
                                            console.warn('Пропускаем участника без ID:', member);
                                            return null;
                                        }
                                        
                                        return (
                                            <FormControlLabel
                                                key={userId}
                                                control={
                                                    <Checkbox
                                                        checked={selectedAssignees.includes(userId)}
                                                        onChange={() => handleAssigneeToggle(userId)}
                                                        sx={{ p: 0.5 }}
                                                    />
                                                }
                                                label={
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                                        <Box
                                                            sx={{
                                                                width: 32,
                                                                height: 32,
                                                                borderRadius: '50%',
                                                                background: avatarUrl ? 
                                                                    `url(${avatarUrl}) center/cover` : 
                                                                    'linear-gradient(45deg, #FF6B6B, #4ECDC4)',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center',
                                                                color: 'white',
                                                                fontSize: '14px',
                                                                fontWeight: 'bold',
                                                                flexShrink: 0
                                                            }}
                                                        >
                                                            {!avatarUrl && (username || email || 'U').charAt(0).toUpperCase()}
                                                        </Box>
                                                        <Box sx={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                                                            <Typography variant="body2" sx={{ fontWeight: 500, color: 'text.primary' }}>
                                                                {username || email?.split('@')[0] || 'Пользователь'}
                                                            </Typography>
                                                            {member.role && (
                                                                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                                                    {member.role.name}
                                                                </Typography>
                                                            )}
                                                        </Box>
                                                    </Box>
                                                }
                                                sx={{
                                                    m: 0,
                                                    p: 1,
                                                    borderRadius: 1,
                                                    '&:hover': {
                                                        bgcolor: 'action.hover'
                                                    },
                                                    transition: 'background-color 0.2s'
                                                }}
                                            />
                                        );
                                    })
                                    .filter(Boolean) // Убираем null элементы
                                }
                            </Box>
                        ) : (
                            <Typography variant="body2" color="text.secondary" sx={{ p: 2, textAlign: 'center' }}>
                                {boardMembers === undefined ? t('loadingMembers') : t('membersNotFound')}
                            </Typography>
                        )}
                    </TabPanel>
                </Popover>
            </Box>
            
            {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                </Alert>
            )}

            <DragDropContext onDragEnd={onDragEnd}>
                <Box
                    sx={{
                        display: 'flex',
                        flexDirection: isMobile ? 'column' : 'row',
                        gap: 2,
                        height: 'calc(100vh - 200px)', // Фиксированная высота с учетом заголовка
                        overflow: 'hidden', // Предотвращаем прокрутку основного контейнера
                        pb: 2,
                        // Для мобильных, убираем ограничения по высоте
                        ...(isMobile && {
                            height: 'auto',
                            overflow: 'visible',
                            flexDirection: 'column'
                        })
                    }}
                >
                    {board.columns && board.columns.length > 0 ? (
                        <>
                            <Droppable droppableId="board" type="column">
                                {(provided) => (
                                    <Box
                                        {...provided.droppableProps}
                                        ref={provided.innerRef}
                                        sx={{
                                            display: 'flex',
                                            flexWrap: 'nowrap',
                                            overflowX: 'auto',
                                            gap: 2,
                                            pb: 2,
                                            pt: 1,
                                            pl: 1,
                                            width: '100%',
                                            height: '100%', // Занимаем всю доступную высоту
                                            minHeight: isMobile ? 'auto' : 'calc(100vh - 200px)', // Минимальная высота для десктопа
                                            '&::-webkit-scrollbar': {
                                                height: '8px',
                                            },
                                            '&::-webkit-scrollbar-track': {
                                                backgroundColor: 'background.paper',
                                            },
                                            '&::-webkit-scrollbar-thumb': {
                                                backgroundColor: 'primary.light',
                                                borderRadius: '4px',
                                            },
                                        }}
                                    >
                                        {filteredColumns.map((column, index) => (
                                            <BoardColumn
                                                key={column.id}
                                                column={column}
                                                canMoveLeft={index > 0}
                                                canMoveRight={index < filteredColumns.length - 1}
                                                boardStatuses={board.taskStatuses}
                                                taskTypes={taskTypes}
                                                onTasksChange={(updatedColumn) => {
                                                    // Обновляем колонку в состоянии board
                                                    const updatedColumns = board.columns.map(col =>
                                                        col.id === updatedColumn.id ? updatedColumn : col
                                                    );
                                                    setBoard({ ...board, columns: updatedColumns });
                                                }}
                                                onMove={(newPosition) => handleMoveColumn(column.id.toString(), newPosition)}
                                                onEdit={(columnId, columnName, color) => {
                                                    setEditColumnData({ id: columnId, name: columnName, color });
                                                }}
                                                onDelete={(columnId, columnName) => {
                                                    setDeleteColumnData({ id: columnId, name: columnName });
                                                }}
                                                boardId={boardId}
                                                isCompactMode={isCompactMode}
                                            />
                                        ))}
                                        {provided.placeholder}
                                        
                                        {/* Кнопка добавления колонки (только для админов и редакторов) */}
                                        {roleContext.hasPermission(Permission.ADD_COLUMNS) && (
                                            <Box 
                                                sx={{ 
                                                    minWidth: isMobile ? '100%' : 200,
                                                    maxWidth: isMobile ? '100%' : 200,
                                                    height: 50,
                                                    border: '2px dashed',
                                                    borderColor: 'primary.light',
                                                    borderRadius: 1,
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    cursor: 'pointer',
                                                    mt: 0.5,
                                                    transition: 'all 0.2s',
                                                    bgcolor: 'background.paper',
                                                    '&:hover': {
                                                        borderColor: 'primary.main',
                                                        bgcolor: 'primary.lighter',
                                                    }
                                                }}
                                                onClick={() => setIsAddColumnModalOpen(true)}
                                            >
                                                <Button
                                                    startIcon={<AddIcon />}
                                                    color="primary"
                                                >
                                                    {t('addColumn')}
                                                </Button>
                                            </Box>
                                        )}
                                    </Box>
                                )}
                            </Droppable>
                        </>
                    ) : (
                        searchQuery ? (
                            <Box sx={{ 
                                display: 'flex', 
                                flexDirection: 'column', 
                                alignItems: 'center',
                                width: '100%',
                                mt: 4 
                            }}>
                                <Typography variant="h6" color="text.secondary">
                                    {t('noTasksFound')}
                                </Typography>
                                <Button
                                    variant="text"
                                    onClick={() => setSearchQuery('')}
                                    sx={{ mt: 1 }}
                                >
                                    {t('resetSearch')}
                                </Button>
                            </Box>
                        ) : (
                            <Box sx={{ 
                                display: 'flex', 
                                flexDirection: 'column', 
                                alignItems: 'center',
                                width: '100%',
                                mt: 4 
                            }}>
                                <Typography variant="h6" color="text.secondary">
                                    {t('noBoardColumns')}
                                </Typography>
                                <Button
                                    variant="contained"
                                    startIcon={<AddIcon />}
                                    onClick={() => setIsAddColumnModalOpen(true)}
                                    sx={{ mt: 2 }}
                                >
                                    {t('createFirstColumn')}
                                </Button>
                            </Box>
                        )
                    )}
                </Box>
            </DragDropContext>

            <EditBoardModal
                open={isEditBoardModalOpen}
                onClose={() => setIsEditBoardModalOpen(false)}
                onSubmit={async (updates: BoardUpdate) => {
                    await handleEditBoard(updates);
                    setIsEditBoardModalOpen(false);
                }}
                initialName={board?.name || ''}
                initialDescription={board?.description || ''}
                board={board}
                onBoardUpdate={(updatedBoard) => {
                    setBoard(updatedBoard);
                    // Обновляем локальное состояние taskTypes для немедленного применения в интерфейсе
                    setTaskTypes(updatedBoard.taskTypes || []);
                }}
            />

            <EditColumnModal
                open={!!editColumnData}
                onClose={() => setEditColumnData(null)}
                onSubmit={async (name, color) => {
                    if (editColumnData) {
                        await handleEditColumn(editColumnData.id, name, color);
                        setEditColumnData(null);
                    }
                }}
                initialName={editColumnData?.name || ''}
                initialColor={board?.columns.find(col => col.id.toString() === editColumnData?.id)?.color || '#E0E0E0'}
            />

            <ConfirmDialog
                open={isDeleteBoardDialogOpen}
                onClose={() => setIsDeleteBoardDialogOpen(false)}
                onConfirm={handleDeleteBoard}
                title={t('deleteBoard')}
                message={t('deleteBoardConfirm')}
                loading={deletingBoard}
                actionType="delete"
            />

            <ConfirmDialog
                open={!!deleteColumnData}
                onClose={() => setDeleteColumnData(null)}
                onConfirm={() => {
                    if (deleteColumnData) {
                        handleDeleteColumn(deleteColumnData.id, deleteColumnData.name);
                        setDeleteColumnData(null);
                    }
                }}
                title={t('deleteColumn')}
                message={`${t('deleteColumnConfirm')} "${deleteColumnData?.name}"? ${t('deleteColumnWarning')}`}
                loading={deletingColumn}
                actionType="delete"
            />

            <Snackbar 
                open={!!error} 
                autoHideDuration={6000} 
                onClose={() => setError(null)}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            >
                <Alert severity="error" onClose={() => setError(null)}>
                    {error}
                </Alert>
            </Snackbar>

            <Snackbar 
                open={!!success} 
                autoHideDuration={3000} 
                onClose={() => setSuccess(null)}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            >
                <Alert severity="success" onClose={() => setSuccess(null)}>
                    {success}
                </Alert>
            </Snackbar>

            <AddColumnModal
                open={isAddColumnModalOpen}
                onClose={() => setIsAddColumnModalOpen(false)}
                onSubmit={handleAddColumn}
            />

            <SyncIndicator />

            {/* Модальное окно управления участниками */}
            {board && (
                <BoardMembersModal
                    open={isMembersModalOpen}
                    onClose={() => setIsMembersModalOpen(false)}
                    boardId={board.id.toString()}
                    currentUserId={(board as any).currentUser?.id || 0}
                    ownerId={(board as any).owner?.id}
                    isAdmin={(board as any).currentUser?.isAdmin || false}
                    currentUserRole={(board as any).currentUser?.role}
                    currentUserRoleId={(board as any).currentUser?.roleId}
                />
            )}
        </Container>
    );
};
  
  
