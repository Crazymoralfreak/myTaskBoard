import React from 'react';
import { 
  ListItem, 
  ListItemText, 
  Typography, 
  Chip, 
  Box,
  IconButton, 
  ListItemIcon,
  Tooltip,
  Menu,
  MenuItem,
  Checkbox
} from '@mui/material';
import { Notification, NotificationType, NotificationPriority } from '../../types/Notification';
import DoneIcon from '@mui/icons-material/Done';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import AssignmentIndIcon from '@mui/icons-material/AssignmentInd';
import EventIcon from '@mui/icons-material/Event';
import CommentIcon from '@mui/icons-material/Comment';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import GroupAddIcon from '@mui/icons-material/GroupAdd';
import GroupRemoveIcon from '@mui/icons-material/GroupRemove';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import NotificationsIcon from '@mui/icons-material/Notifications';
import SecurityIcon from '@mui/icons-material/Security';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import ArchiveIcon from '@mui/icons-material/Archive';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { formatDistanceToNow } from 'date-fns';
import { ru } from 'date-fns/locale';

interface NotificationItemProps {
  notification: Notification;
  onMarkAsRead: (id: number) => void;
  onArchive?: (id: number) => void;
  onDelete?: (id: number) => void;
  onClick?: (notification: Notification) => void;
  onNavigate?: (notification: Notification) => void;
  showActions?: boolean;
  isSelected?: boolean;
  onSelect?: (id: number, selected: boolean) => void;
  showCheckbox?: boolean;
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
    case NotificationType.DEADLINE_REMINDER:
      return <EventIcon />;
    case NotificationType.NEW_COMMENT_MENTION:
    case NotificationType.TASK_COMMENT_ADDED:
      return <CommentIcon />;
    case NotificationType.TASK_STATUS_CHANGED:
      return <SwapHorizIcon />;
    case NotificationType.TASK_CREATED:
    case NotificationType.SUBTASK_CREATED:
      return <AddIcon />;
    case NotificationType.TASK_UPDATED:
      return <EditIcon />;
    case NotificationType.TASK_DELETED:
      return <DeleteIcon />;
    case NotificationType.SUBTASK_COMPLETED:
      return <CheckCircleIcon />;
    case NotificationType.BOARD_MEMBER_ADDED:
      return <GroupAddIcon />;
    case NotificationType.BOARD_MEMBER_REMOVED:
      return <GroupRemoveIcon />;
    case NotificationType.ATTACHMENT_ADDED:
      return <AttachFileIcon />;
    case NotificationType.ROLE_CHANGED:
      return <SecurityIcon />;
    default:
      return <NotificationsIcon />;
  }
};

/**
 * Возвращает цвет для приоритета уведомления
 * @param priority приоритет уведомления
 * @returns цвет
 */
const getPriorityColor = (priority: NotificationPriority) => {
  switch (priority) {
    case NotificationPriority.CRITICAL:
      return '#f44336'; // красный
    case NotificationPriority.HIGH:
      return '#ff9800'; // оранжевый
    case NotificationPriority.NORMAL:
      return '#2196f3'; // синий
    case NotificationPriority.LOW:
      return '#9e9e9e'; // серый
    default:
      return '#2196f3';
  }
};

/**
 * Возвращает название приоритета на русском
 * @param priority приоритет уведомления
 * @returns название приоритета
 */
const getPriorityLabel = (priority: NotificationPriority) => {
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
      return 'Обычный';
  }
};

/**
 * Компонент для отображения уведомления
 */
const NotificationItem: React.FC<NotificationItemProps> = ({ 
  notification, 
  onMarkAsRead,
  onArchive,
  onDelete,
  onClick,
  onNavigate,
  showActions = true,
  isSelected,
  onSelect,
  showCheckbox = true
}) => {
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);

  // Логгирование для диагностики проблемы со статусом "Новое"
  React.useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`Notification ${notification.id}:`, {
        title: notification.title,
        isRead: notification.isRead,
        readAt: notification.readAt,
        shouldShowNew: notification.isRead === false
      });
    }
  }, [notification.id, notification.isRead, notification.readAt]);

  const handleClick = () => {
    // Автоматически отмечаем как прочитанное при клике на уведомление
    if (!notification.isRead) {
      console.log('Marking notification as read on click:', notification.id);
      handleMarkAsRead(notification.id);
    }
    
    if (onClick) {
      onClick(notification);
    }
  };

  // Обработчик отметки как прочитанное с принудительным обновлением
  const handleMarkAsRead = async (notificationId: number) => {
    try {
      console.log('NotificationItem: Marking as read:', notificationId);
      await onMarkAsRead(notificationId);
      
      // Принудительно обновляем локальное состояние
      notification.isRead = true;
      notification.readAt = new Date().toISOString();
      
      console.log('NotificationItem: Marked as read successfully');
    } catch (error) {
      console.error('NotificationItem: Error marking as read:', error);
    }
  };

  const handleArchive = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onArchive) {
      onArchive(notification.id);
    }
    setAnchorEl(null);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDelete) {
      onDelete(notification.id);
    }
    setAnchorEl(null);
  };

  const handleSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    if (onSelect) {
      onSelect(notification.id, e.target.checked);
    }
  };

  const handleMenuOpen = (e: React.MouseEvent<HTMLElement>) => {
    e.stopPropagation();
    setAnchorEl(e.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };
  
  const handleNavigateClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    // Отмечаем как прочитанное при навигации
    if (!notification.isRead) {
      console.log('Marking notification as read on navigation:', notification.id);
      handleMarkAsRead(notification.id);
    }
    
    if (onNavigate) {
      onNavigate(notification);
    }
  };
  
  // Форматируем время создания
  const timeAgo = formatDistanceToNow(new Date(notification.createdAt), { 
    addSuffix: true,
    locale: ru
  });

  // Строгая проверка статуса "Новое" - должен показываться только если isRead === false
  const shouldShowNewStatus = notification.isRead === false;
  
  // Проверяем, нужно ли показывать описание отдельно от заголовка
  const hasDescription = notification.message && notification.message !== notification.title;
  
  return (
    <ListItem 
      alignItems="flex-start"
      onClick={handleClick}
      sx={{ 
        cursor: 'pointer',
        bgcolor: notification.isRead ? 'transparent' : 'action.hover',
        '&:hover': { bgcolor: 'action.selected' },
        borderRadius: 2,
        mb: 1,
        border: `1px solid ${getPriorityColor(notification.priority)}30`,
        borderLeft: `4px solid ${getPriorityColor(notification.priority)}`,
        transition: 'all 0.2s ease-in-out',
        '&:hover .notification-actions': {
          opacity: 1
        },
        pl: 1,
        pr: 1
      }}
      secondaryAction={
        <Box 
          display="flex" 
          alignItems="center" 
          gap={1}
          className="notification-actions"
          sx={{ 
            opacity: notification.isRead ? 0.7 : 1,
            transition: 'opacity 0.2s ease-in-out'
          }}
        >
          {/* Кнопка навигации */}
          {onNavigate && (
            <Tooltip title="Перейти к связанной задаче/доске">
              <IconButton 
                edge="end" 
                aria-label="navigate"
                onClick={handleNavigateClick}
                size="small"
                sx={{ 
                  bgcolor: 'primary.main',
                  color: 'white',
                  '&:hover': { bgcolor: 'primary.dark' }
                }}
              >
                <OpenInNewIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
          
          {showActions && (
            <Tooltip title="Действия">
              <IconButton 
                edge="end" 
                aria-label="more actions"
                onClick={handleMenuOpen}
                size="small"
              >
                <MoreVertIcon />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      }
    >
      {/* Левая часть - чекбокс и иконка на одном уровне */}
      <Box display="flex" alignItems="center" gap={1} sx={{ minWidth: 'auto', flexShrink: 0 }}>
        {showCheckbox && onSelect && (
          <Checkbox
            checked={isSelected || false}
            onChange={handleSelect}
            size="small"
            sx={{ p: 0.5 }}
          />
        )}
        
        <Box 
          sx={{ 
            color: getPriorityColor(notification.priority),
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 24,
            height: 24
          }}
        >
          {getNotificationIcon(notification.type)}
        </Box>
      </Box>
      
      {/* Основной контент */}
      <ListItemText
        sx={{ ml: 1 }}
        primary={
          <Box display="flex" alignItems="center" gap={1} flexWrap="wrap">
            <Typography 
              variant="subtitle2" 
              component="div"
              sx={{ 
                fontWeight: notification.isRead ? 400 : 600,
                color: notification.isRead ? 'text.secondary' : 'text.primary',
                flexGrow: 1
              }}
            >
              {notification.title}
            </Typography>
            <Box display="flex" alignItems="center" gap={0.5}>
              <Chip 
                label={getPriorityLabel(notification.priority)} 
                size="small" 
                sx={{ 
                  height: 18, 
                  fontSize: '0.65rem',
                  backgroundColor: getPriorityColor(notification.priority),
                  color: 'white',
                  opacity: notification.isRead ? 0.7 : 1
                }}
              />
              {shouldShowNewStatus && (
                <Chip 
                  label="Новое" 
                  size="small" 
                  color="error"
                  variant="filled"
                  sx={{ 
                    height: 18, 
                    fontSize: '0.65rem',
                    animation: 'pulse 2s infinite'
                  }}
                />
              )}
            </Box>
          </Box>
        }
        secondary={
          <Box component="span">
            {/* Показываем description только если он отличается от title */}
            {hasDescription && (
              <Typography
                variant="body2"
                color={notification.isRead ? 'text.secondary' : 'text.primary'}
                component="span"
                sx={{ 
                  display: 'block', 
                  mb: 0.5,
                  fontWeight: notification.isRead ? 400 : 500
                }}
              >
                {notification.message}
              </Typography>
            )}
            <Typography
              variant="caption"
              color="text.secondary"
              component="span"
            >
              {timeAgo}
            </Typography>
          </Box>
        }
      />

      {/* Меню действий */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        {onArchive && !notification.isArchived && (
          <MenuItem onClick={handleArchive}>
            <ArchiveIcon fontSize="small" sx={{ mr: 1 }} />
            Архивировать
          </MenuItem>
        )}
        {onDelete && (
          <MenuItem onClick={handleDelete}>
            <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
            Удалить
          </MenuItem>
        )}
      </Menu>
    </ListItem>
  );
};

export default NotificationItem; 