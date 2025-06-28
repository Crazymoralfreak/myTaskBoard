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
import { ru, enUS } from 'date-fns/locale';
import { useLocalization } from '../../hooks/useLocalization';

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
const getPriorityLabel = (priority: NotificationPriority, t: any) => {
  switch (priority) {
    case NotificationPriority.CRITICAL:
      return t('prioritiesCritical');
    case NotificationPriority.HIGH:
      return t('prioritiesHigh');
    case NotificationPriority.NORMAL:
      return t('prioritiesNormal');
    case NotificationPriority.LOW:
      return t('prioritiesLow');
    default:
      return t('prioritiesNormal');
  }
};

/**
 * Локализует текст уведомления
 * @param text оригинальный текст уведомления
 * @param t функция локализации
 * @returns локализованный текст
 */
const localizeNotificationText = (text: string, t: any): string => {
  if (!text) return '';

  // Словарь ВСЕХ возможных текстов с backend
  const translations: Record<string, string> = {
    // Русские заголовки из NotificationUtil.java
    'Новая задача создана': t('notificationTaskCreatedTitle'),
    'Вам назначена задача': t('notificationTaskAssignedTitle'),
    'Задача обновлена': t('notificationTaskUpdatedTitle'),
    'Задача удалена': t('notificationTaskDeletedTitle'),
    'Изменен статус задачи': t('notificationTaskStatusChangedTitle'),
    'Задача просрочена': t('notificationOverdueTitle'),
    'Приближается дедлайн': t('notificationDeadlineTitle'),
    'Напоминание о дедлайне': t('notificationDeadlineReminderTitle'),
    'Новый комментарий к задаче': t('notificationCommentAddedTitle'),
    'Вас упомянули в комментарии': t('notificationMentionTitle'),
    'Добавлено вложение к задаче': t('notificationAttachmentTitle'),
    'Создана подзадача': t('notificationSubtaskCreatedTitle'),
    'Подзадача завершена': t('notificationSubtaskCompletedTitle'),
    'Приглашение на доску': t('notificationBoardInviteTitle'),
    'Вы добавлены в доску': t('notificationBoardMemberAddedTitle'),
    'Вы удалены из доски': t('notificationBoardMemberRemovedTitle'),
    'Изменена роль на доске': t('notificationRoleChangedTitle'),

    // Русские сообщения из NotificationUtil.java
    'Вам назначена новая задача': t('notificationTaskCreatedMessage'),
    'Задача была обновлена': t('notificationTaskUpdatedMessage'),
    'Задача была удалена': t('notificationTaskDeletedMessage'),
    'Вы приглашены на доску': t('notificationBoardInviteMessage'),
    'Вы были добавлены в доску': t('notificationBoardMemberAddedMessage'),
    'Вы были удалены из доски': t('notificationBoardMemberRemovedMessage'),

    // Английские тексты из TelegramNotificationService.java
    'You have been assigned to task': t('notificationTaskAssignedTitle'),
    'A task has been assigned to you': t('notificationTaskAssignedTitle'),
    'Task has been updated': t('notificationTaskUpdatedTitle'),
    'Task status changed': t('notificationTaskStatusChangedTitle'),
    'You were mentioned in task': t('notificationMentionTitle'),
    'Task assigned': t('notificationTaskAssignedTitle'),
    'You have been added to board': t('notificationBoardMemberAddedTitle'),
    'Added to board': t('notificationBoardMemberAddedTitle'),

    // Дополнительные варианты
    'Назначена задача': t('notificationTaskAssignedTitle'),
    'Добавлен в доску': t('notificationBoardMemberAddedTitle')
  };

  // Точное совпадение
  if (translations[text]) {
    return translations[text];
  }

  // Паттерны с переменными (сохраняем динамическую часть)
  const patterns = [
    // Русские паттерны из NotificationUtil.java
    { pattern: /^Вам назначена новая задача:\s*(.+)$/, replacement: `${t('notificationTaskCreatedMessage')} $1` },
    { pattern: /^Вам назначена задача:\s*(.+)$/, replacement: `${t('notificationTaskAssignedMessage')} $1` },
    { pattern: /^Задача была обновлена:\s*(.+)$/, replacement: `${t('notificationTaskUpdatedMessage')} $1` },
    { pattern: /^Задача была удалена:\s*(.+)$/, replacement: `${t('notificationTaskDeletedMessage')} $1` },
    { pattern: /^Статус задачи "(.+)" изменен с "(.+)" на "(.+)"$/, replacement: `${t('notificationTaskStatusChangedMessage')} "$1": $2 → $3` },
    { pattern: /^Задача просрочена:\s*(.+)$/, replacement: `${t('notificationOverdueMessage')} $1` },
    { pattern: /^До завершения задачи "(.+)" осталось (\d+) дн\.$/, replacement: `${t('notificationDeadlineSoonMessage')} "$1" ($2 ${t('daysRemaining')})` },
    { pattern: /^Завтра истекает срок выполнения задачи:\s*(.+)$/, replacement: `${t('notificationDeadlineReminderMessage')} $1` },
    { pattern: /^(.+) добавил комментарий к задаче:\s*(.+)$/, replacement: `$1 ${t('notificationCommentAddedMessage')} $2` },
    { pattern: /^(.+) упомянул вас в комментарии к задаче:\s*(.+)$/, replacement: `$1 ${t('notificationMentionMessage')} $2` },
    { pattern: /^(.+) добавил файл "(.+)" к задаче:\s*(.+)$/, replacement: `$1 ${t('notificationAttachmentMessage')} "$2" ${t('toTask')} $3` },
    { pattern: /^Создана подзадача:\s*(.+) для задачи:\s*(.+)$/, replacement: `${t('notificationSubtaskCreatedMessage')} "$1" ${t('forTask')} "$2"` },
    { pattern: /^Подзадача завершена:\s*(.+) для задачи:\s*(.+)$/, replacement: `${t('notificationSubtaskCompletedMessage')} "$1" ${t('forTask')} "$2"` },
    { pattern: /^Вы приглашены на доску:\s*(.+)$/, replacement: `${t('notificationBoardInviteMessage')} $1` },
    { pattern: /^Вы были добавлены в доску:\s*(.+)$/, replacement: `${t('notificationBoardMemberAddedMessage')} $1` },
    { pattern: /^Вы были удалены из доски:\s*(.+)$/, replacement: `${t('notificationBoardMemberRemovedMessage')} $1` },
    { pattern: /^Ваша роль на доске "(.+)" изменена на:\s*(.+)$/, replacement: `${t('notificationRoleChangedMessage')} "$1": $2` },

    // Английские паттерны из TelegramNotificationService.java
    { pattern: /^You have been assigned to task:\s*(.+)$/, replacement: `${t('notificationTaskAssignedMessage')} $1` },
    { pattern: /^A task has been assigned to you:\s*(.+)$/, replacement: `${t('notificationTaskAssignedMessage')} $1` },
    { pattern: /^Task has been updated:\s*(.+)$/, replacement: `${t('notificationTaskUpdatedMessage')} $1` },
    { pattern: /^Task status changed to (.+):\s*(.+)$/, replacement: `${t('notificationTaskStatusChangedMessage')} $2 ($1)` },
    { pattern: /^You were mentioned in task (.+):\s*(.+)$/, replacement: `${t('notificationMentionMessage')} $1: $2` },
    { pattern: /^You have been added to board:\s*(.+)$/, replacement: `${t('notificationBoardMemberAddedMessage')} $1` }
  ];

  for (const { pattern, replacement } of patterns) {
    if (pattern.test(text)) {
      return text.replace(pattern, replacement);
    }
  }
  return text;
};

/**
 * Определяет наилучший текст для отображения в уведомлении
 * @param notification уведомление
 * @param t функция локализации
 * @returns объект с основным текстом и дополнительным (если есть)
 */
const getBestNotificationText = (notification: Notification, t: any) => {
  const localizedTitle = localizeNotificationText(notification.title, t);
  const localizedMessage = notification.message ? localizeNotificationText(notification.message, t) : '';
  
  // Если нет сообщения, показываем только заголовок
  if (!notification.message) {
    return {
      mainText: localizedTitle,
      secondaryText: null,
      hasSecondary: false
    };
  }
  
  // Если заголовок и сообщение одинаковые, показываем только одно
  if (localizedTitle === localizedMessage || notification.title === notification.message) {
    return {
      mainText: localizedMessage || localizedTitle,
      secondaryText: null,
      hasSecondary: false
    };
  }
  
  // ИСПРАВЛЕНИЕ: Приоритет отдаем сообщению (message), так как оно более информативное
  // Заголовок показываем как дополнительную информацию только если он короткий
  if (localizedTitle.length < 30 && localizedMessage.length > localizedTitle.length) {
    return {
      mainText: localizedMessage,
      secondaryText: localizedTitle,
      hasSecondary: true
    };
  }
  
  // В остальных случаях показываем только основное сообщение
  return {
    mainText: localizedMessage,
    secondaryText: null,
    hasSecondary: false
  };
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
  const { t, language } = useLocalization();
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  // ИСПРАВЛЕНИЕ: Локальное состояние для отслеживания статуса прочтения
  const [isRead, setIsRead] = React.useState(notification.read);

  // Обновляем локальное состояние при изменении props
  React.useEffect(() => {
    setIsRead(notification.read);
  }, [notification.read]);

  const handleClick = () => {
    if (!isRead) {
      setIsRead(true); // Немедленно обновляем UI
      onMarkAsRead(notification.id);
    }
    
    if (onClick) {
      onClick(notification);
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
    
    if (!isRead) {
      setIsRead(true); // Немедленно обновляем UI
      onMarkAsRead(notification.id);
    }
    
    if (onNavigate) {
      onNavigate(notification);
    }
  };
  
  const locale = language === 'ru' ? ru : enUS;
  const timeAgo = formatDistanceToNow(new Date(notification.createdAt), { 
    addSuffix: true,
    locale
  });

  const textInfo = getBestNotificationText(notification, t);
  
  return (
    <ListItem 
      alignItems="flex-start"
      onClick={handleClick}
      sx={{ 
        cursor: 'pointer',
        bgcolor: isRead ? 'transparent' : 'action.hover',
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
            opacity: isRead ? 0.7 : 1,
            transition: 'opacity 0.2s ease-in-out'
          }}
        >
          {onNavigate && (
            <Tooltip title={t('itemNavigate')}>
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
            <Tooltip title={t('itemActions')}>
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
      
      <ListItemText
        sx={{ ml: 1 }}
        primary={
          <Box display="flex" alignItems="center" gap={1} flexWrap="wrap">
            <Typography 
              variant="subtitle2" 
              component="div"
              sx={{ 
                fontWeight: isRead ? 400 : 600,
                color: isRead ? 'text.secondary' : 'text.primary',
                flexGrow: 1
              }}
            >
              {textInfo.mainText}
            </Typography>
            <Box display="flex" alignItems="center" gap={0.5}>
              <Chip 
                label={getPriorityLabel(notification.priority, t)} 
                size="small" 
                sx={{ 
                  height: 18, 
                  fontSize: '0.65rem',
                  backgroundColor: getPriorityColor(notification.priority),
                  color: 'white',
                  opacity: isRead ? 0.7 : 1
                }}
              />
              {!isRead && (
                <Chip 
                  label={t('itemNewStatus')} 
                  size="small" 
                  color="error"
                  variant="filled"
                  sx={{ 
                    height: 18, 
                    fontSize: '0.65rem'
                  }}
                />
              )}
            </Box>
          </Box>
        }
        secondary={
          <Box component="span">
            {textInfo.hasSecondary && (
              <Typography
                variant="body2"
                color={isRead ? 'text.secondary' : 'text.primary'}
                component="span"
                sx={{ 
                  display: 'block', 
                  mb: 0.5,
                  fontWeight: isRead ? 400 : 500
                }}
              >
                {textInfo.secondaryText}
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
        {onArchive && !notification.archived && (
          <MenuItem onClick={handleArchive}>
            <ArchiveIcon fontSize="small" sx={{ mr: 1 }} />
            {t('itemArchive')}
          </MenuItem>
        )}
        {onDelete && (
          <MenuItem onClick={handleDelete}>
            <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
            {t('itemDelete')}
          </MenuItem>
        )}
      </Menu>
    </ListItem>
  );
};

export default NotificationItem;

// Экспортируем функцию локализации для тестирования
export { localizeNotificationText, getBestNotificationText }; 