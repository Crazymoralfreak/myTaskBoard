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
import { Notification } from '../../types/notification';
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
      // Обновляем счетчик непрочитанных уведомлений
      setUnreadCount(prevCount => prevCount + 1);
      
      // Добавляем уведомление в начало списка
      setNotifications(prevNotifications => [notification, ...prevNotifications]);
    };
    
    // Регистрируем обработчик
    WebSocketService.addMessageHandler(handleNewNotification);
    
    // Получаем количество непрочитанных уведомлений
    fetchUnreadCount();
    
    // Отписываемся при размонтировании
    return () => {
      WebSocketService.removeMessageHandler(handleNewNotification);
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
      
      // Уменьшаем счетчик непрочитанных уведомлений
      setUnreadCount(prevCount => Math.max(0, prevCount - 1));
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };
  
  // Обработчик нажатия на уведомление
  const handleNotificationClick = (notification: Notification) => {
    handleClose();
    
    // Отмечаем уведомление как прочитанное
    if (!notification.isRead) {
      handleMarkAsRead(notification.id);
    }
    
    // Логика перенаправления в зависимости от типа уведомления
    // реализуется в основной странице уведомлений
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
                onClick={handleNotificationClick}
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