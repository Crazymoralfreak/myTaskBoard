import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Paper, 
  Typography, 
  List, 
  Divider, 
  Box, 
  Button, 
  CircularProgress,
  Alert,
  Pagination,
  Tabs,
  Tab,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  InputAdornment
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ArchiveIcon from '@mui/icons-material/Archive';
import InboxIcon from '@mui/icons-material/Inbox';
import NotificationItem from '../components/notifications/NotificationItem';
import { NotificationsService } from '../services/NotificationsService';
import { Notification, NotificationType, NotificationPriority } from '../types/Notification';
import { useNavigate } from 'react-router-dom';

/**
 * Страница уведомлений пользователя
 */
const NotificationsPage: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalElements, setTotalElements] = useState<number>(0);
  const [markingAsRead, setMarkingAsRead] = useState<boolean>(false);
  const [currentTab, setCurrentTab] = useState<'active' | 'archived'>('active');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [selectedNotifications, setSelectedNotifications] = useState<Set<number>>(new Set());
  const [showBulkActions, setShowBulkActions] = useState<boolean>(false);
  const navigate = useNavigate();
  
  // Загрузка уведомлений
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        setLoading(true);
        setError(null);
        
        let response;
        if (currentTab === 'archived') {
          response = await NotificationsService.getArchivedNotifications(page - 1);
        } else {
          response = await NotificationsService.getNotifications(page - 1);
        }
        
        let filteredNotifications = response.content;
        
        // Фильтрация по приоритету
        if (priorityFilter !== 'all') {
          filteredNotifications = filteredNotifications.filter(
            n => n.priority === priorityFilter
          );
        }
        
        // Поиск по тексту
        if (searchTerm) {
          filteredNotifications = filteredNotifications.filter(
            n => n.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                 n.message.toLowerCase().includes(searchTerm.toLowerCase())
          );
        }
        
        setNotifications(filteredNotifications);
        setTotalPages(response.totalPages);
        setTotalElements(response.totalElements);
      } catch (err) {
        console.error('Error fetching notifications:', err);
        
        // Не показываем ошибку для новых пользователей
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        if (!errorMessage.includes('404') && !errorMessage.includes('USER_NOT_FOUND')) {
          setError('Не удалось загрузить уведомления. Пожалуйста, попробуйте позже.');
        }
      } finally {
        setLoading(false);
      }
    };
    
    fetchNotifications();
  }, [page, currentTab, priorityFilter, searchTerm]);
  
  // Обработчик отметки уведомления как прочитанного
  const handleMarkAsRead = async (id: number) => {
    try {
      console.log('Attempting to mark notification as read:', id);
      const updatedNotification = await NotificationsService.markAsRead(id);
      console.log('Received updated notification from server:', updatedNotification);
      
      // Проверяем, что сервер вернул правильные данные
      if (!updatedNotification || updatedNotification.id !== id) {
        console.error('Invalid response from server for markAsRead:', updatedNotification);
        return;
      }
      
      // Обновляем уведомление в списке с принудительным обновлением isRead
      setNotifications(prevNotifications => {
        const updatedList = prevNotifications.map(notification => 
          notification.id === id ? {
            ...notification,
            ...updatedNotification,
            isRead: true, // Принудительно устанавливаем как прочитанное
            readAt: updatedNotification.readAt || new Date().toISOString()
          } : notification
        );
        console.log('Updated notifications list:', updatedList.find(n => n.id === id));
        return updatedList;
      });
      
      // Принудительно обновляем счетчик непрочитанных уведомлений
      const newCount = await NotificationsService.getUnreadCount();
      console.log('Updated unread count:', newCount);
      
      // Отправляем событие для обновления счетчика в NotificationBell
      const countUpdateEvent = new CustomEvent('notification-count-update', {
        detail: { count: newCount }
      });
      window.dispatchEvent(countUpdateEvent);
      
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };
  
  // Обработчик архивирования уведомления
  const handleArchive = async (id: number) => {
    try {
      await NotificationsService.archiveNotification(id);
      
      // Удаляем уведомление из списка активных
      if (currentTab === 'active') {
        setNotifications(prevNotifications => 
          prevNotifications.filter(notification => notification.id !== id)
        );
      }
    } catch (err) {
      console.error('Error archiving notification:', err);
    }
  };
  
  // Обработчик навигации по уведомлению
  const handleNotificationNavigate = (notification: Notification) => {
    // Отмечаем уведомление как прочитанное если оно не прочитано
    if (!notification.isRead) {
      handleMarkAsRead(notification.id);
    }
    
    // Перенаправляем пользователя в зависимости от типа уведомления
    switch (notification.type) {
      case NotificationType.BOARD_INVITE:
        if (notification.relatedEntityId) {
          navigate(`/boards/${notification.relatedEntityId}`);
        }
        break;
      case NotificationType.TASK_ASSIGNED:
      case NotificationType.TASK_DUE_SOON:
      case NotificationType.TASK_OVERDUE:
      case NotificationType.TASK_STATUS_CHANGED:
      case NotificationType.TASK_CREATED:
      case NotificationType.TASK_UPDATED:
      case NotificationType.TASK_DELETED:
      case NotificationType.TASK_COMMENT_ADDED:
      case NotificationType.SUBTASK_CREATED:
      case NotificationType.SUBTASK_COMPLETED:
      case NotificationType.ATTACHMENT_ADDED:
      case NotificationType.DEADLINE_REMINDER:
        if (notification.relatedEntityId) {
          const [boardId, taskId] = notification.relatedEntityId.split(':');
          navigate(`/boards/${boardId}?task=${taskId}`);
        }
        break;
      case NotificationType.NEW_COMMENT_MENTION:
        if (notification.relatedEntityId) {
          const [boardId, taskId, commentId] = notification.relatedEntityId.split(':');
          navigate(`/boards/${boardId}?task=${taskId}&comment=${commentId}`);
        }
        break;
      case NotificationType.BOARD_MEMBER_ADDED:
      case NotificationType.BOARD_MEMBER_REMOVED:
      case NotificationType.ROLE_CHANGED:
        if (notification.relatedEntityId) {
          navigate(`/boards/${notification.relatedEntityId}`);
        }
        break;
      default:
        // По умолчанию никуда не перенаправляем
        break;
    }
  };
  
  // Обработчик отметки всех уведомлений как прочитанных
  const handleMarkAllAsRead = async () => {
    try {
      setMarkingAsRead(true);
      const count = await NotificationsService.markAllAsRead();
      
      // Обновляем все уведомления в списке
      if (count > 0) {
        setNotifications(prevNotifications => 
          prevNotifications.map(notification => ({
            ...notification,
            isRead: true
          }))
        );
        
        // Обновляем счетчик
        const newCount = await NotificationsService.getUnreadCount();
        const countUpdateEvent = new CustomEvent('notification-count-update', {
          detail: { count: newCount }
        });
        window.dispatchEvent(countUpdateEvent);
      }
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
    } finally {
      setMarkingAsRead(false);
    }
  };
  
  // Обработчик изменения вкладки
  const handleTabChange = (_: React.SyntheticEvent, newValue: 'active' | 'archived') => {
    setCurrentTab(newValue);
    setPage(1); // Сбрасываем страницу при смене вкладки
    setSelectedNotifications(new Set()); // Очищаем выбранные уведомления
  };
  
  // Обработчик изменения страницы
  const handlePageChange = (_: React.ChangeEvent<unknown>, value: number) => {
    setPage(value);
    setSelectedNotifications(new Set()); // Очищаем выбранные уведомления
  };
  
  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case NotificationPriority.CRITICAL:
        return 'Критический';
      case NotificationPriority.HIGH:
        return 'Высокий';
      case NotificationPriority.NORMAL:
        return 'Обычный';
      case NotificationPriority.LOW:
        return 'Низкий';
      default:
        return 'Все приоритеты';
    }
  };
  
  // Обработчик удаления уведомления
  const handleDelete = async (id: number) => {
    try {
      await NotificationsService.deleteNotification(id);
      
      // Удаляем уведомление из списка
      setNotifications(prevNotifications => 
        prevNotifications.filter(notification => notification.id !== id)
      );
      
      // Удаляем из выбранных
      setSelectedNotifications(prev => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
      
      // Обновляем счетчик
      const newCount = await NotificationsService.getUnreadCount();
      const countUpdateEvent = new CustomEvent('notification-count-update', {
        detail: { count: newCount }
      });
      window.dispatchEvent(countUpdateEvent);
      
    } catch (err) {
      console.error('Error deleting notification:', err);
    }
  };

  // Обработчик выбора уведомления
  const handleSelect = (id: number, selected: boolean) => {
    setSelectedNotifications(prev => {
      const newSet = new Set(prev);
      if (selected) {
        newSet.add(id);
      } else {
        newSet.delete(id);
      }
      return newSet;
    });
  };

  // Обработчик выбора всех уведомлений
  const handleSelectAll = (selected: boolean) => {
    if (selected) {
      setSelectedNotifications(new Set(notifications.map(n => n.id)));
    } else {
      setSelectedNotifications(new Set());
    }
  };

  // Обработчик массового удаления
  const handleBulkDelete = async () => {
    try {
      const idsArray = Array.from(selectedNotifications);
      await NotificationsService.deleteNotifications(idsArray);
      
      // Удаляем уведомления из списка
      setNotifications(prevNotifications => 
        prevNotifications.filter(notification => !selectedNotifications.has(notification.id))
      );
      
      // Очищаем выбор
      setSelectedNotifications(new Set());
      
      // Обновляем счетчик
      const newCount = await NotificationsService.getUnreadCount();
      const countUpdateEvent = new CustomEvent('notification-count-update', {
        detail: { count: newCount }
      });
      window.dispatchEvent(countUpdateEvent);
      
    } catch (err) {
      console.error('Error bulk deleting notifications:', err);
    }
  };

  // Обработчик массовой отметки как прочитанные
  const handleBulkMarkAsRead = async () => {
    try {
      const idsArray = Array.from(selectedNotifications);
      await NotificationsService.markMultipleAsRead(idsArray);
      
      // Обновляем уведомления в списке
      setNotifications(prevNotifications => 
        prevNotifications.map(notification => 
          selectedNotifications.has(notification.id) 
            ? { ...notification, isRead: true }
            : notification
        )
      );
      
      // Очищаем выбор
      setSelectedNotifications(new Set());
      
      // Обновляем счетчик
      const newCount = await NotificationsService.getUnreadCount();
      const countUpdateEvent = new CustomEvent('notification-count-update', {
        detail: { count: newCount }
      });
      window.dispatchEvent(countUpdateEvent);
      
    } catch (err) {
      console.error('Error bulk marking notifications as read:', err);
    }
  };
  
  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Paper elevation={3} sx={{ p: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h5" component="h1">
            Уведомления
          </Typography>
          
          {currentTab === 'active' && (
            <Button
              variant="outlined"
              onClick={handleMarkAllAsRead}
              disabled={loading || markingAsRead || notifications.every(n => n.isRead)}
            >
              {markingAsRead ? (
                <CircularProgress size={24} sx={{ mr: 1 }} />
              ) : null}
              Прочитать все
            </Button>
          )}
        </Box>
        
        {/* Вкладки */}
        <Tabs value={currentTab} onChange={handleTabChange} sx={{ mb: 2 }}>
          <Tab 
            value="active" 
            label="Активные" 
            icon={<InboxIcon />} 
            iconPosition="start"
          />
          <Tab 
            value="archived" 
            label="Архивированные" 
            icon={<ArchiveIcon />} 
            iconPosition="start"
          />
        </Tabs>
        
        {/* Фильтры */}
        <Box display="flex" gap={2} mb={3} flexWrap="wrap">
          <TextField
            size="small"
            placeholder="Поиск уведомлений..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
            sx={{ minWidth: 250 }}
          />
          
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Приоритет</InputLabel>
            <Select
              value={priorityFilter}
              label="Приоритет"
              onChange={(e) => setPriorityFilter(e.target.value)}
            >
              <MenuItem value="all">Все приоритеты</MenuItem>
              <MenuItem value={NotificationPriority.CRITICAL}>
                {getPriorityLabel(NotificationPriority.CRITICAL)}
              </MenuItem>
              <MenuItem value={NotificationPriority.HIGH}>
                {getPriorityLabel(NotificationPriority.HIGH)}
              </MenuItem>
              <MenuItem value={NotificationPriority.NORMAL}>
                {getPriorityLabel(NotificationPriority.NORMAL)}
              </MenuItem>
              <MenuItem value={NotificationPriority.LOW}>
                {getPriorityLabel(NotificationPriority.LOW)}
              </MenuItem>
            </Select>
          </FormControl>
        </Box>
        
        <Divider sx={{ mb: 2 }} />
        
        {/* Массовые действия */}
        {selectedNotifications.size > 0 && (
          <Box mb={2} p={2} bgcolor="action.hover" borderRadius={1}>
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Typography variant="body2">
                Выбрано: {selectedNotifications.size} уведомлений
              </Typography>
              <Box display="flex" gap={1}>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={handleBulkMarkAsRead}
                  disabled={Array.from(selectedNotifications).every(id => 
                    notifications.find(n => n.id === id)?.isRead
                  )}
                >
                  Отметить как прочитанные
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  color="error"
                  onClick={handleBulkDelete}
                >
                  Удалить
                </Button>
                <Button
                  size="small"
                  variant="text"
                  onClick={() => setSelectedNotifications(new Set())}
                >
                  Отменить
                </Button>
              </Box>
            </Box>
          </Box>
        )}
        
        {loading ? (
          <Box display="flex" justifyContent="center" py={4}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        ) : notifications.length > 0 ? (
          <>
            {/* Кнопка выбрать все */}
            <Box mb={2}>
              <Button
                size="small"
                variant="text"
                onClick={() => handleSelectAll(selectedNotifications.size === 0)}
              >
                {selectedNotifications.size === notifications.length ? 'Снять выделение' : 'Выбрать все'}
              </Button>
            </Box>
            
            <List>
              {notifications.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onMarkAsRead={handleMarkAsRead}
                  onArchive={currentTab === 'active' ? handleArchive : undefined}
                  onDelete={handleDelete}
                  onNavigate={handleNotificationNavigate}
                  isSelected={selectedNotifications.has(notification.id)}
                  onSelect={handleSelect}
                  showCheckbox={true}
                />
              ))}
            </List>
            
            {totalPages > 1 && (
              <Box display="flex" justifyContent="center" mt={2}>
                <Pagination
                  count={totalPages}
                  page={page}
                  onChange={handlePageChange}
                  color="primary"
                />
              </Box>
            )}
          </>
        ) : (
          <Box textAlign="center" py={4}>
            <Typography variant="body1" color="textSecondary">
              {currentTab === 'active' 
                ? 'У вас нет активных уведомлений' 
                : 'У вас нет архивированных уведомлений'
              }
            </Typography>
          </Box>
        )}
      </Paper>
    </Container>
  );
};

export default NotificationsPage; 