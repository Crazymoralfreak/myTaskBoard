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

  const handleMarkAsRead = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!notification.isRead) {
      onMarkAsRead(notification.id);
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
    if (onNavigate) {
      onNavigate(notification);
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
      sx={{ 
        cursor: 'default',
        bgcolor: notification.isRead ? 'transparent' : 'action.hover',
        '&:hover': { bgcolor: 'action.selected' },
        borderRadius: 1,
        mb: 1,
        border: `2px solid ${getPriorityColor(notification.priority)}20`,
        borderLeft: `4px solid ${getPriorityColor(notification.priority)}`
      }}
      secondaryAction={
        <Box display="flex" alignItems="center" gap={1}>
          {/* Кнопка навигации */}
          {onNavigate && (
            <Tooltip title="Перейти к связанной задаче/доске">
              <IconButton 
                edge="end" 
                aria-label="navigate"
                onClick={handleNavigateClick}
                size="small"
              >
                <OpenInNewIcon />
              </IconButton>
            </Tooltip>
          )}
          
          {showActions && !notification.isRead && (
            <Tooltip title="Отметить как прочитанное">
              <IconButton 
                edge="end" 
                aria-label="mark as read"
                onClick={handleMarkAsRead}
                size="small"
              >
                <DoneIcon />
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
      {showCheckbox && onSelect && (
        <ListItemIcon sx={{ minWidth: 40 }}>
          <Checkbox
            checked={isSelected || false}
            onChange={handleSelect}
            size="small"
          />
        </ListItemIcon>
      )}
      
      <ListItemIcon sx={{ color: getPriorityColor(notification.priority) }}>
        {getNotificationIcon(notification.type)}
      </ListItemIcon>
      
      <ListItemText
        primary={
          <Box display="flex" alignItems="center" gap={1}>
            <Typography variant="subtitle2" component="div">
              {notification.title}
            </Typography>
            <Chip 
              label={getPriorityLabel(notification.priority)} 
              size="small" 
              sx={{ 
                height: 20, 
                fontSize: '0.7rem',
                backgroundColor: getPriorityColor(notification.priority),
                color: 'white'
              }}
            />
          </Box>
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
        {!notification.isRead && (
          <MenuItem onClick={handleMarkAsRead}>
            <DoneIcon fontSize="small" sx={{ mr: 1 }} />
            Отметить как прочитанное
          </MenuItem>
        )}
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