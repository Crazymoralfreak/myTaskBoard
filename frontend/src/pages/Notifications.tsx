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
  Pagination
} from '@mui/material';
import NotificationItem from '../components/notifications/NotificationItem';
import { NotificationsService } from '../services/NotificationsService';
import { Notification, NotificationType } from '../types/notification';
import { useNavigate } from 'react-router-dom';

/**
 * Страница уведомлений пользователя
 */
const NotificationsPage: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [markingAsRead, setMarkingAsRead] = useState<boolean>(false);
  const navigate = useNavigate();
  
  // Загрузка уведомлений
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await NotificationsService.getNotifications(page - 1);
        setNotifications(response.content);
        setTotalPages(response.totalPages);
      } catch (err) {
        console.error('Error fetching notifications:', err);
        setError('Не удалось загрузить уведомления. Пожалуйста, попробуйте позже.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchNotifications();
  }, [page]);
  
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
    } catch (err) {
      console.error('Error marking notification as read:', err);
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
      }
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
    } finally {
      setMarkingAsRead(false);
    }
  };
  
  // Обработчик нажатия на уведомление
  const handleNotificationClick = (notification: Notification) => {
    // Отмечаем уведомление как прочитанное
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
      default:
        // По умолчанию никуда не перенаправляем
        break;
    }
  };
  
  // Обработчик изменения страницы
  const handlePageChange = (_: React.ChangeEvent<unknown>, value: number) => {
    setPage(value);
  };
  
  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Paper elevation={3} sx={{ p: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h5" component="h1">
            Уведомления
          </Typography>
          
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
        </Box>
        
        <Divider sx={{ mb: 2 }} />
        
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
            <List>
              {notifications.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onMarkAsRead={handleMarkAsRead}
                  onClick={handleNotificationClick}
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
              У вас нет уведомлений
            </Typography>
          </Box>
        )}
      </Paper>
    </Container>
  );
};

export default NotificationsPage; 