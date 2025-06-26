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
import { Notification, NotificationType } from '../../types/Notification';
import { useNavigate } from 'react-router-dom';
import { useWebSocket } from '../../context/WebSocketContext';
import { useLocalization } from '../../hooks/useLocalization';

interface NotificationBellProps {
  token: string;
}

/**
 * Компонент "колокольчик" для отображения уведомлений
 */
const NotificationBell: React.FC<NotificationBellProps> = ({ token }) => {
  const { t } = useLocalization();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
  const navigate = useNavigate();
  
  // Используем WebSocket для real-time обновления счетчика
  const { unreadCount, newNotifications, clearNewNotifications } = useWebSocket();
  
  // Обработка новых уведомлений из WebSocket
  useEffect(() => {
    if (newNotifications.length > 0) {
      // Добавляем новые уведомления в начало списка
      setNotifications(prev => {
        const existingIds = new Set(prev.map(n => n.id));
        const uniqueNewNotifications = newNotifications.filter(n => !existingIds.has(n.id));
        return [...uniqueNewNotifications, ...prev];
      });
      
      // Очищаем новые уведомления после обработки
      clearNewNotifications();
    }
  }, [newNotifications, clearNewNotifications]);
  
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
        setError(t('errorsLoadFailed'));
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
      
      // Отправляем событие для обновления глобального счетчика
      const newCount = await NotificationsService.getUnreadCount();
      const countUpdateEvent = new CustomEvent('notification-count-update', {
        detail: { count: newCount }
      });
      window.dispatchEvent(countUpdateEvent);
      
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };

  // Обработчик навигации к связанной сущности
  const handleNotificationNavigate = (notification: Notification) => {
    handleClose();
    
    // Логика навигации в зависимости от типа уведомления
    switch (notification.type) {
      case NotificationType.BOARD_INVITE:
      case NotificationType.BOARD_MEMBER_ADDED:
      case NotificationType.BOARD_MEMBER_REMOVED:
        if (notification.relatedEntityId) {
          navigate(`/boards/${notification.relatedEntityId}`);
        }
        break;
      case NotificationType.TASK_ASSIGNED:
      case NotificationType.TASK_CREATED:
      case NotificationType.TASK_UPDATED:
      case NotificationType.TASK_DELETED:
      case NotificationType.TASK_STATUS_CHANGED:
      case NotificationType.TASK_DUE_SOON:
      case NotificationType.TASK_OVERDUE:
      case NotificationType.TASK_COMMENT_ADDED:
      case NotificationType.NEW_COMMENT_MENTION:
      case NotificationType.SUBTASK_CREATED:
      case NotificationType.SUBTASK_COMPLETED:
      case NotificationType.ATTACHMENT_ADDED:
      case NotificationType.DEADLINE_REMINDER:
        // Для задач нужно получить ID доски из relatedEntityType или использовать API
        if (notification.relatedEntityId) {
          // Предполагаем, что это ID задачи, нужно получить ID доски
          // Пока просто переходим на главную страницу
          navigate('/');
        }
        break;
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
        <Badge badgeContent={unreadCount || 0} color="error">
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
          sx: { 
            width: 400, 
            maxHeight: 500,
            '& .MuiList-root': {
              p: 0
            }
          }
        }}
      >
        <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
          <Typography variant="h6" component="div">
            {t('notificationsTitle')}
          </Typography>
          {unreadCount > 0 && (
            <Typography variant="body2" color="text.secondary">
              {unreadCount} {t('unread')}
            </Typography>
          )}
        </Box>
        
        {loading ? (
          <Box display="flex" justifyContent="center" p={3}>
            <CircularProgress size={24} />
          </Box>
        ) : error ? (
          <Box p={2}>
            <Typography color="error" variant="body2">
              {error}
            </Typography>
          </Box>
        ) : notifications.length === 0 ? (
          <Box p={2}>
            <Typography variant="body2" color="text.secondary" align="center">
              {t('empty')}
            </Typography>
          </Box>
        ) : (
          <List sx={{ maxHeight: 300, overflow: 'auto' }}>
            {notifications.slice(0, 5).map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onMarkAsRead={handleMarkAsRead}
                onNavigate={handleNotificationNavigate}
                showCheckbox={false}
                showActions={false}
              />
            ))}
          </List>
        )}
        
        <Divider />
        <Box sx={{ p: 1 }}>
          <Button
            fullWidth
            variant="text"
            onClick={handleViewAll}
            size="small"
          >
            {t('viewAll')}
          </Button>
        </Box>
      </Popover>
    </>
  );
};

export default NotificationBell; 