import React from 'react';
import { 
  ListItem, 
  ListItemText, 
  Typography, 
  Chip, 
  Box,
  IconButton, 
  ListItemIcon
} from '@mui/material';
import { Notification, NotificationType } from '../../types/notification';
import DoneIcon from '@mui/icons-material/Done';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import AssignmentIndIcon from '@mui/icons-material/AssignmentInd';
import EventIcon from '@mui/icons-material/Event';
import CommentIcon from '@mui/icons-material/Comment';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import { formatDistanceToNow } from 'date-fns';
import { ru } from 'date-fns/locale';

interface NotificationItemProps {
  notification: Notification;
  onMarkAsRead: (id: number) => void;
  onClick?: (notification: Notification) => void;
}

/**
 * Возвращает иконку для типа уведомления
 * @param type тип уведомления
 * @returns компонент иконки
 */
const getNotificationIcon = (type: string) => {
  switch (type) {
    case NotificationType.BOARD_INVITE:
      return <PersonAddIcon />;
    case NotificationType.TASK_ASSIGNED:
      return <AssignmentIndIcon />;
    case NotificationType.TASK_DUE_SOON:
    case NotificationType.TASK_OVERDUE:
      return <EventIcon />;
    case NotificationType.NEW_COMMENT_MENTION:
      return <CommentIcon />;
    case NotificationType.TASK_STATUS_CHANGED:
      return <SwapHorizIcon />;
    default:
      return <CommentIcon />;
  }
};

/**
 * Компонент для отображения уведомления
 */
const NotificationItem: React.FC<NotificationItemProps> = ({ 
  notification, 
  onMarkAsRead,
  onClick
}) => {
  const handleMarkAsRead = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!notification.isRead) {
      onMarkAsRead(notification.id);
    }
  };
  
  const handleClick = () => {
    if (onClick) {
      onClick(notification);
    }
  };
  
  // Форматируем время создания
  const timeAgo = formatDistanceToNow(new Date(notification.createdAt), { 
    addSuffix: true,
    locale: ru
  });
  
  return (
    <ListItem 
      alignItems="flex-start"
      onClick={handleClick}
      sx={{ 
        cursor: onClick ? 'pointer' : 'default',
        bgcolor: notification.isRead ? 'transparent' : 'action.hover',
        '&:hover': { bgcolor: 'action.selected' },
        borderRadius: 1,
        mb: 1
      }}
      secondaryAction={
        !notification.isRead && (
          <IconButton 
            edge="end" 
            aria-label="mark as read"
            onClick={handleMarkAsRead}
            size="small"
          >
            <DoneIcon />
          </IconButton>
        )
      }
    >
      <ListItemIcon>
        {getNotificationIcon(notification.type)}
      </ListItemIcon>
      
      <ListItemText
        primary={
          <Typography variant="subtitle2" component="div">
            {notification.title}
          </Typography>
        }
        secondary={
          <Box component="span">
            <Typography
              variant="body2"
              color="textPrimary"
              component="span"
              sx={{ display: 'block', mb: 1 }}
            >
              {notification.message}
            </Typography>
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Typography
                variant="caption"
                color="textSecondary"
                component="span"
              >
                {timeAgo}
              </Typography>
              {!notification.isRead && (
                <Chip 
                  label="Новое" 
                  size="small" 
                  color="primary" 
                  sx={{ height: 20, fontSize: '0.7rem' }}
                />
              )}
            </Box>
          </Box>
        }
      />
    </ListItem>
  );
};

export default NotificationItem; 