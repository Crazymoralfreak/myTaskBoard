import React, { useState, useEffect } from 'react';
import { 
  IconButton, 
  Badge, 
  Popover, 
  List, 
  Typography, 
  Box, 
  Divider, 
  Button,
  CircularProgress
} from '@mui/material';
import NotificationsIcon from '@mui/icons-material/Notifications';
import NotificationItem from './NotificationItem';
import { NotificationsService } from '../../services/NotificationsService';
import WebSocketService from '../../services/WebSocketService';
import { Notification, NotificationType } from '../../types/Notification';
import { useNavigate } from 'react-router-dom';

interface NotificationBellProps {
  token: string;
}

/**
 * Компонент "колокольчик" для отображения уведомлений
 */
const NotificationBell: React.FC<NotificationBellProps> = ({ token }) => {
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
  const navigate = useNavigate();
  
  // Инициализация WebSocket при монтировании компонента
  useEffect(() => {
    // Подключаемся к WebSocket
    WebSocketService.initialize(token);
    
    // Обработчик новых уведомлений
    const handleNewNotification = (notification: Notification) => {
      // Добавляем уведомление в начало списка
      setNotifications(prevNotifications => [notification, ...prevNotifications]);
      
      // Счетчик будет автоматически обновлен через WebSocket от сервера
    };
    
    // Обработчик обновлений счетчика
    const handleCountUpdate = (count: number) => {
      setUnreadCount(count);
    };
    
    // Обработчик событий обновления счетчика из других компонентов
    const handleCountUpdateEvent = (event: Event) => {
      const customEvent = event as CustomEvent;
      setUnreadCount(customEvent.detail.count);
    };
    
    // Регистрируем обработчики
    WebSocketService.addMessageHandler(handleNewNotification);
    WebSocketService.addCountUpdateHandler(handleCountUpdate);
    
    // Добавляем обработчик для событий обновления счетчика
    window.addEventListener('notification-count-update', handleCountUpdateEvent);
    
    // Получаем количество непрочитанных уведомлений
    fetchUnreadCount();
    
    // Отписываемся при размонтировании
    return () => {
      WebSocketService.removeMessageHandler(handleNewNotification);
      WebSocketService.removeCountUpdateHandler(handleCountUpdate);
      window.removeEventListener('notification-count-update', handleCountUpdateEvent);
      WebSocketService.disconnect();
    };
  }, [token]);
  
  // Загрузка количества непрочитанных уведомлений
  const fetchUnreadCount = async () => {
    try {
      const count = await NotificationsService.getUnreadCount();
      setUnreadCount(count);
    } catch (err) {
      console.error('Error fetching unread count:', err);
    }
  };
  
  // Загрузка непрочитанных уведомлений при открытии popover
  const fetchUnreadNotifications = async () => {
    if (notifications.length === 0) {
      try {
        setLoading(true);
        setError(null);
        
        const data = await NotificationsService.getUnreadNotifications();
        setNotifications(data);
      } catch (err) {
        console.error('Error fetching notifications:', err);
        setError('Не удалось загрузить уведомления');
      } finally {
        setLoading(false);
      }
    }
  };
  
  // Обработчик нажатия на иконку уведомлений
  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
    fetchUnreadNotifications();
  };
  
  // Обработчик закрытия popover
  const handleClose = () => {
    setAnchorEl(null);
  };
  
  // Обработчик отметки уведомления как прочитанного
  const handleMarkAsRead = async (id: number) => {
    try {
      const updatedNotification = await NotificationsService.markAsRead(id);
      
      // Обновляем уведомление в списке
      setNotifications(prevNotifications => 
        prevNotifications.map(notification => 
          notification.id === id ? updatedNotification : notification
        )
      );
      
      // Принудительно обновляем счетчик непрочитанных уведомлений
      const newCount = await NotificationsService.getUnreadCount();
      setUnreadCount(newCount);
      
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };
  
  // Обработчик навигации по уведомлению
  const handleNotificationNavigate = (notification: Notification) => {
    handleClose();
    
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
  
  // Обработчик перехода на страницу уведомлений
  const handleViewAll = () => {
    handleClose();
    navigate('/notifications');
  };
  
  const open = Boolean(anchorEl);
  const id = open ? 'notifications-popover' : undefined;
  
  return (
    <>
      <IconButton
        color="inherit"
        aria-label="notifications"
        onClick={handleClick}
        aria-describedby={id}
      >
        <Badge badgeContent={unreadCount} color="error">
          <NotificationsIcon />
        </Badge>
      </IconButton>
      
      <Popover
        id={id}
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        PaperProps={{
          sx: { width: '350px', maxHeight: '400px' }
        }}
      >
        <Box p={2}>
          <Typography variant="h6">Уведомления</Typography>
        </Box>
        
        <Divider />
        
        {loading ? (
          <Box display="flex" justifyContent="center" py={3}>
            <CircularProgress size={30} />
          </Box>
        ) : error ? (
          <Box p={2}>
            <Typography color="error">{error}</Typography>
          </Box>
        ) : notifications.length > 0 ? (
          <List sx={{ p: 0 }}>
            {notifications.map(notification => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onMarkAsRead={handleMarkAsRead}
                onNavigate={handleNotificationNavigate}
              />
            ))}
          </List>
        ) : (
          <Box p={3} textAlign="center">
            <Typography color="textSecondary">
              У вас нет новых уведомлений
            </Typography>
          </Box>
        )}
        
        <Divider />
        
        <Box p={1.5} display="flex" justifyContent="center">
          <Button 
            variant="text" 
            color="primary" 
            onClick={handleViewAll}
            fullWidth
          >
            Просмотреть все
          </Button>
        </Box>
      </Popover>
    </>
  );
};

export default NotificationBell; 