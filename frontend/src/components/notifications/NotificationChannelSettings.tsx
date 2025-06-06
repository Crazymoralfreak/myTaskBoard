import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Switch,
  FormControlLabel,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Grid,
  Chip,
  Alert,
  Collapse,
  CircularProgress,
  Divider,
  Paper,
  alpha,
  useTheme,
  Tooltip,
  IconButton
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import EmailIcon from '@mui/icons-material/Email';
import TelegramIcon from '@mui/icons-material/Telegram';
import WebIcon from '@mui/icons-material/Web';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import SettingsIcon from '@mui/icons-material/Settings';
import InfoIcon from '@mui/icons-material/Info';
import { NotificationSettings, NotificationPreferences } from '../../types/NotificationSettings';

const NOTIFICATION_CHANNELS = [
  {
    key: 'browser',
    label: 'Веб-уведомления',
    icon: <WebIcon />,
    description: 'Уведомления в браузере',
    color: '#2196f3',
    info: 'Мгновенные уведомления прямо в браузере. Убедитесь, что разрешили уведомления для сайта.'
  },
  {
    key: 'email',
    label: 'Email уведомления',
    icon: <EmailIcon />,
    description: 'Уведомления на электронную почту',
    color: '#ff9800',
    info: 'Email уведомления отправляются на вашу зарегистрированную почту. Подходят для важных событий.'
  },
  {
    key: 'telegram',
    label: 'Telegram уведомления',
    icon: <TelegramIcon />,
    description: 'Уведомления в Telegram',
    color: '#00bcd4',
    info: 'Быстрые уведомления в Telegram. Для настройки свяжите ваш аккаунт с Telegram ботом.'
  }
] as const;

const NOTIFICATION_TYPES = {
  tasks: {
    label: 'Задачи',
    icon: '📋',
    color: '#4caf50',
    types: [
      { key: 'taskAssignedNotifications', label: 'Назначение задачи', priority: 'high', description: 'Когда вам назначают задачу' },
      { key: 'taskCreatedNotifications', label: 'Создание задачи', priority: 'normal', description: 'При создании новой задачи на доске' },
      { key: 'taskUpdatedNotifications', label: 'Обновление задачи', priority: 'low', description: 'При изменении описания или деталей задачи' },
      { key: 'taskDeletedNotifications', label: 'Удаление задачи', priority: 'high', description: 'При удалении задач, где вы участник' },
      { key: 'taskStatusChangedNotifications', label: 'Изменение статуса', priority: 'normal', description: 'При переносе задачи между статусами' },
      { key: 'taskDueSoonNotifications', label: 'Приближение дедлайна', priority: 'high', description: 'За 24 часа до дедлайна' },
      { key: 'taskOverdueNotifications', label: 'Просроченные задачи', priority: 'critical', description: 'Когда задача просрочена' }
    ]
  },
  collaboration: {
    label: 'Совместная работа',
    icon: '👥',
    color: '#9c27b0',
    types: [
      { key: 'taskCommentAddedNotifications', label: 'Новые комментарии', priority: 'normal', description: 'При добавлении комментариев к вашим задачам' },
      { key: 'mentionNotifications', label: 'Упоминания (@username)', priority: 'high', description: 'Когда вас упоминают в комментариях' },
      { key: 'boardMemberAddedNotifications', label: 'Добавление участника', priority: 'normal', description: 'При добавлении нового участника на доску' },
      { key: 'boardMemberRemovedNotifications', label: 'Удаление участника', priority: 'normal', description: 'При удалении участника с доски' },
      { key: 'roleChangedNotifications', label: 'Изменение роли', priority: 'high', description: 'При изменении ваших прав на доске' }
    ]
  },
  boards: {
    label: 'Доски',
    icon: '📊',
    color: '#ff5722',
    types: [
      { key: 'boardInviteNotifications', label: 'Приглашения на доску', priority: 'high', description: 'При приглашении на новую доску' }
    ]
  },
  subtasks: {
    label: 'Подзадачи',
    icon: '✅',
    color: '#607d8b',
    types: [
      { key: 'subtaskCreatedNotifications', label: 'Создание подзадачи', priority: 'low', description: 'При добавлении подзадач к вашим задачам' },
      { key: 'subtaskCompletedNotifications', label: 'Завершение подзадачи', priority: 'normal', description: 'При выполнении подзадач' }
    ]
  },
  other: {
    label: 'Прочее',
    icon: '📎',
    color: '#795548',
    types: [
      { key: 'attachmentAddedNotifications', label: 'Добавление файла', priority: 'low', description: 'При прикреплении файлов к задачам' },
      { key: 'deadlineReminderNotifications', label: 'Напоминания о дедлайнах', priority: 'critical', description: 'Регулярные напоминания о приближающихся дедлайнах' }
    ]
  }
};

const PRIORITY_COLORS = {
  critical: '#f44336',
  high: '#ff9800', 
  normal: '#2196f3',
  low: '#9e9e9e'
};

const PRIORITY_LABELS = {
  critical: 'Критично',
  high: 'Важно',
  normal: 'Обычно',
  low: 'Не важно'
};

interface NotificationChannelSettingsProps {
  settings: NotificationPreferences | null;
  onUpdateSettings: (settingKey: string, enabled: boolean) => Promise<void>;
  loading?: boolean;
}

const NotificationChannelSettingsComponent: React.FC<NotificationChannelSettingsProps> = ({
  settings,
  onUpdateSettings,
  loading = false
}) => {
  const theme = useTheme();
  // По умолчанию все блоки свернуты для компактности
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [expandedChannels, setExpandedChannels] = useState<Set<string>>(new Set());
  const [loadingStates, setLoadingStates] = useState<{ [key: string]: boolean }>({});
  const [successMessage, setSuccessMessage] = useState<string>('');

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  const toggleChannel = (channel: string) => {
    const newExpanded = new Set(expandedChannels);
    if (newExpanded.has(channel)) {
      newExpanded.delete(channel);
    } else {
      newExpanded.add(channel);
    }
    setExpandedChannels(newExpanded);
  };

  const handleToggle = async (settingKey: string, enabled: boolean) => {
    setLoadingStates(prev => ({ ...prev, [settingKey]: true }));
    
        try {
      await onUpdateSettings(settingKey, enabled);
      setSuccessMessage(`Настройка "${getSettingDisplayName(settingKey)}" обновлена`);
      setTimeout(() => setSuccessMessage(''), 3000);
      
      // Отправляем событие об обновлении настроек для обновления polling
      if (settingKey === 'globalNotificationsEnabled' || settingKey === 'browserNotificationsEnabled') {
        const preferencesUpdateEvent = new CustomEvent('notification-preferences-update');
        window.dispatchEvent(preferencesUpdateEvent);
        console.log('Отправлено событие обновления настроек уведомлений');
      }
    } catch (error: any) {
      // Ошибка будет логироваться в api.ts, здесь только обрабатываем UI
      if (error.response?.status === 401) {
        // Перенаправляем на страницу логина при 401
        setTimeout(() => {
          window.location.href = '/login';
        }, 2000);
      }
      // Родительский компонент уже показывает ошибку через snackbar
    } finally {
      setLoadingStates(prev => ({ ...prev, [settingKey]: false }));
    }
  };

  const getSettingDisplayName = (key: string): string => {
    // Поиск в каналах
    const channel = NOTIFICATION_CHANNELS.find(ch => `${ch.key}NotificationsEnabled` === key);
    if (channel) return channel.label;
    
    // Поиск в типах уведомлений
    for (const group of Object.values(NOTIFICATION_TYPES)) {
      const type = group.types.find(t => t.key === key);
      if (type) return type.label;
    }
    
    // Глобальные настройки
    const globalSettings: Record<string, string> = {
      globalNotificationsEnabled: 'Глобальные уведомления',
      onlyHighPriorityNotifications: 'Только важные уведомления',
      groupSimilarNotifications: 'Группировка уведомлений'
    };
    
    return globalSettings[key] || key;
  };

  const getChannelEnabled = (channelKey: string): boolean => {
    if (!settings) return false;
    switch (channelKey) {
      case 'browser': return settings.browserNotificationsEnabled;
      case 'email': return settings.emailNotificationsEnabled;
      case 'telegram': return settings.telegramNotificationsEnabled;
      default: return false;
    }
  };

  const getChannelEnabledCount = (channelKey: string): { enabled: number; total: number } => {
    if (!settings) return { enabled: 0, total: 0 };
    
    const channelEnabled = getChannelEnabled(channelKey);
    if (!channelEnabled) return { enabled: 0, total: 0 };

    let enabled = 0;
    let total = 0;

    Object.values(NOTIFICATION_TYPES).forEach(group => {
      group.types.forEach(type => {
        total++;
        if (settings[type.key as keyof NotificationPreferences]) {
          enabled++;
        }
      });
    });

    return { enabled, total };
  };

  const getSectionEnabledCount = (sectionTypes: any[]): { enabled: number; total: number } => {
    if (!settings) return { enabled: 0, total: 0 };
    
    const enabled = sectionTypes.filter(type => settings[type.key as keyof NotificationPreferences]).length;
    return { enabled, total: sectionTypes.length };
  };

  if (loading || !settings) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {/* Сообщение об успехе */}
      <Collapse in={!!successMessage}>
        <Alert 
          severity="success" 
          sx={{ 
            mb: 2,
            borderRadius: 2,
            '& .MuiAlert-icon': {
              color: theme.palette.success.main
            }
          }}
        >
          {successMessage}
        </Alert>
      </Collapse>

      {/* Глобальные настройки */}
      <Paper 
        elevation={2} 
        sx={{ 
          mb: 3, 
          border: `2px solid ${alpha(theme.palette.primary.main, 0.2)}`,
          borderRadius: 2,
          overflow: 'hidden',
          background: alpha(theme.palette.primary.main, 0.02)
        }}
      >
        <CardContent sx={{ pb: '16px !important' }}>
          <Box display="flex" alignItems="center" gap={2} mb={3}>
            <Box 
              sx={{
                width: 40,
                height: 40,
                borderRadius: '50%',
                backgroundColor: alpha(theme.palette.primary.main, 0.1),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <SettingsIcon color="primary" />
            </Box>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
                Общие настройки уведомлений
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Основные параметры системы уведомлений
              </Typography>
            </Box>
          </Box>
          
          <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
            <Box flexGrow={1}>
              <Typography variant="body1" sx={{ fontWeight: 500 }}>
                Глобальные уведомления
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Мастер-переключатель для всех уведомлений системы
              </Typography>
            </Box>
            <Box display="flex" alignItems="center" gap={1}>
              {loadingStates.globalNotificationsEnabled && <CircularProgress size={16} />}
              <Switch
                checked={settings.globalNotificationsEnabled}
                onChange={(e) => handleToggle('globalNotificationsEnabled', e.target.checked)}
                disabled={loadingStates.globalNotificationsEnabled}
                color="primary"
              />
            </Box>
          </Box>

          <Divider sx={{ mb: 2 }} />

          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <Box 
                display="flex" 
                alignItems="center" 
                justifyContent="space-between"
                sx={{
                  p: 1.5,
                  borderRadius: 1,
                  backgroundColor: alpha(theme.palette.warning.main, 0.05),
                  border: `1px solid ${alpha(theme.palette.warning.main, 0.2)}`
                }}
              >
                <Box display="flex" alignItems="center" gap={1}>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    Только важные уведомления
                  </Typography>
                  <Tooltip title="При включении будут приходить только критичные и важные уведомления">
                    <InfoIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                  </Tooltip>
                </Box>
                <Box display="flex" alignItems="center" gap={1}>
                  {loadingStates.onlyHighPriorityNotifications && <CircularProgress size={12} />}
                  <Switch
                    checked={settings.onlyHighPriorityNotifications}
                    onChange={(e) => handleToggle('onlyHighPriorityNotifications', e.target.checked)}
                    disabled={!settings.globalNotificationsEnabled || loadingStates.onlyHighPriorityNotifications}
                    size="small"
                    color="warning"
                  />
                </Box>
              </Box>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <Box 
                display="flex" 
                alignItems="center" 
                justifyContent="space-between"
                sx={{
                  p: 1.5,
                  borderRadius: 1,
                  backgroundColor: alpha(theme.palette.info.main, 0.05),
                  border: `1px solid ${alpha(theme.palette.info.main, 0.2)}`
                }}
              >
                <Box display="flex" alignItems="center" gap={1}>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    Группировать похожие
                  </Typography>
                  <Tooltip title="Схожие уведомления будут объединяться в одно сообщение">
                    <InfoIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                  </Tooltip>
                </Box>
                <Box display="flex" alignItems="center" gap={1}>
                  {loadingStates.groupSimilarNotifications && <CircularProgress size={12} />}
                  <Switch
                    checked={settings.groupSimilarNotifications}
                    onChange={(e) => handleToggle('groupSimilarNotifications', e.target.checked)}
                    disabled={!settings.globalNotificationsEnabled || loadingStates.groupSimilarNotifications}
                    size="small"
                    color="info"
                  />
                </Box>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Paper>

      {/* Настройки каналов */}
      <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
        Каналы уведомлений
      </Typography>

      {NOTIFICATION_CHANNELS.map(channel => {
        const channelEnabled = getChannelEnabled(channel.key);
        const { enabled, total } = getChannelEnabledCount(channel.key);
        const isChannelExpanded = expandedChannels.has(channel.key);
        
        return (
          <Accordion 
            key={channel.key}
            expanded={isChannelExpanded}
            onChange={() => toggleChannel(channel.key)}
            sx={{ 
              mb: 2,
              '&:before': { display: 'none' },
              border: `2px solid ${alpha(channel.color, channelEnabled ? 0.3 : 0.1)}`,
              borderRadius: 2,
              backgroundColor: channelEnabled 
                ? alpha(channel.color, 0.05) 
                : theme.palette.background.paper,
              '&:hover': { 
                borderColor: alpha(channel.color, 0.5),
                backgroundColor: alpha(channel.color, 0.08)
              },
              transition: 'all 0.3s ease',
              overflow: 'hidden'
            }}
          >
            <AccordionSummary 
              expandIcon={<ExpandMoreIcon />}
              sx={{ 
                minHeight: 72,
                '& .MuiAccordionSummary-content': { 
                  alignItems: 'center',
                  gap: 2,
                  my: 1
                }
              }}
            >
              <Box 
                sx={{ 
                  color: channel.color, 
                  fontSize: '1.8rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 48,
                  height: 48,
                  borderRadius: '50%',
                  backgroundColor: alpha(channel.color, 0.1)
                }}
              >
                {channel.icon}
              </Box>
              
              <Box flexGrow={1}>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
                  {channel.label}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {channel.description}
                </Typography>
                {channelEnabled && enabled > 0 && (
                  <Typography variant="caption" sx={{ color: channel.color, display: 'block', mt: 0.5 }}>
                    Активно {enabled} из {total} типов уведомлений
                  </Typography>
                )}
              </Box>
              
              <Box display="flex" alignItems="center" gap={2}>
                {channelEnabled && (
                  <Chip 
                    label={`${enabled}/${total}`}
                    size="small"
                    sx={{
                      backgroundColor: alpha(channel.color, 0.2),
                      color: channel.color,
                      fontWeight: 600
                    }}
                  />
                )}
                
                <Box 
                  onClick={(e) => e.stopPropagation()}
                  display="flex" 
                  alignItems="center" 
                  gap={1}
                >
                  {loadingStates[`${channel.key}NotificationsEnabled`] && <CircularProgress size={16} />}
                  <Switch
                    checked={channelEnabled}
                    onChange={(e) => handleToggle(`${channel.key}NotificationsEnabled`, e.target.checked)}
                    disabled={!settings.globalNotificationsEnabled || loadingStates[`${channel.key}NotificationsEnabled`]}
                    sx={{
                      '& .MuiSwitch-thumb': {
                        backgroundColor: channelEnabled ? channel.color : undefined
                      },
                      '& .MuiSwitch-track': {
                        backgroundColor: channelEnabled ? alpha(channel.color, 0.5) : undefined
                      }
                    }}
                  />
                </Box>
              </Box>
            </AccordionSummary>

            <AccordionDetails sx={{ pt: 0, pb: 2 }}>
              {/* Информация о канале */}
              <Alert 
                severity="info" 
                sx={{ 
                  mb: 2, 
                  backgroundColor: alpha(channel.color, 0.05),
                  border: `1px solid ${alpha(channel.color, 0.2)}`,
                  '& .MuiAlert-icon': { color: channel.color }
                }}
              >
                <Typography variant="body2">
                  {channel.info}
                </Typography>
              </Alert>

              {/* Детальные настройки типов уведомлений для данного канала */}
              {channelEnabled && (
                <Box>
                  <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
                    Типы уведомлений для канала "{channel.label}"
                  </Typography>
                  
                  {Object.entries(NOTIFICATION_TYPES).map(([groupKey, group]) => {
                    const sectionCount = getSectionEnabledCount(group.types);
                    
                    return (
                      <Accordion 
                        key={`${channel.key}-${groupKey}`}
                        expanded={expandedSections.has(`${channel.key}-${groupKey}`)}
                        onChange={() => toggleSection(`${channel.key}-${groupKey}`)}
                        sx={{ 
                          mb: 1,
                          '&:before': { display: 'none' },
                          boxShadow: 'none',
                          border: `1px solid ${alpha(group.color, 0.2)}`,
                          borderRadius: 1,
                          backgroundColor: alpha(group.color, 0.02),
                          '&:hover': { 
                            borderColor: alpha(group.color, 0.4),
                            backgroundColor: alpha(group.color, 0.05)
                          },
                          transition: 'all 0.2s ease'
                        }}
                      >
                        <AccordionSummary 
                          expandIcon={<ExpandMoreIcon />}
                          sx={{ minHeight: 56 }}
                        >
                          <Box display="flex" alignItems="center" gap={2} width="100%">
                            <Typography sx={{ fontSize: '1.2em' }}>
                              {group.icon}
                            </Typography>
                            <Typography variant="subtitle1" sx={{ flexGrow: 1, fontWeight: 500 }}>
                              {group.label}
                            </Typography>
                            <Chip 
                              label={`${sectionCount.enabled}/${sectionCount.total}`}
                              size="small"
                              sx={{ 
                                backgroundColor: alpha(group.color, 0.2), 
                                color: group.color,
                                fontWeight: 600
                              }}
                            />
                          </Box>
                        </AccordionSummary>
                        
                        <AccordionDetails sx={{ pt: 0 }}>
                          <Grid container spacing={1}>
                            {group.types.map(type => {
                              const isEnabled = settings[type.key as keyof NotificationPreferences] as boolean;
                              
                              return (
                                <Grid item xs={12} key={type.key}>
                                  <Box 
                                    display="flex" 
                                    alignItems="center" 
                                    justifyContent="space-between"
                                    sx={{ 
                                      p: 1.5,
                                      borderRadius: 1,
                                      backgroundColor: isEnabled 
                                        ? alpha(PRIORITY_COLORS[type.priority as keyof typeof PRIORITY_COLORS], 0.05)
                                        : alpha(theme.palette.grey[500], 0.05),
                                      border: `1px solid ${alpha(
                                        isEnabled 
                                          ? PRIORITY_COLORS[type.priority as keyof typeof PRIORITY_COLORS]
                                          : theme.palette.grey[500], 
                                        0.2
                                      )}`,
                                      '&:hover': { 
                                        backgroundColor: alpha(
                                          PRIORITY_COLORS[type.priority as keyof typeof PRIORITY_COLORS], 
                                          0.08
                                        )
                                      },
                                      transition: 'all 0.2s ease'
                                    }}
                                  >
                                    <Box flexGrow={1}>
                                      <Box display="flex" alignItems="center" gap={1} mb={0.5}>
                                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                          {type.label}
                                        </Typography>
                                        <Chip
                                          label={PRIORITY_LABELS[type.priority as keyof typeof PRIORITY_LABELS]}
                                          size="small"
                                          sx={{
                                            height: 18,
                                            fontSize: '0.65rem',
                                            fontWeight: 600,
                                            backgroundColor: alpha(PRIORITY_COLORS[type.priority as keyof typeof PRIORITY_COLORS], 0.2),
                                            color: PRIORITY_COLORS[type.priority as keyof typeof PRIORITY_COLORS]
                                          }}
                                        />
                                      </Box>
                                      <Typography variant="caption" color="text.secondary">
                                        {type.description}
                                      </Typography>
                                    </Box>
                                    
                                    <Box display="flex" alignItems="center" gap={1}>
                                      {loadingStates[type.key] && <CircularProgress size={12} />}
                                      <Switch
                                        checked={isEnabled}
                                        onChange={(e) => handleToggle(type.key, e.target.checked)}
                                        disabled={loadingStates[type.key]}
                                        size="small"
                                        sx={{
                                          '& .MuiSwitch-thumb': {
                                            backgroundColor: isEnabled 
                                              ? PRIORITY_COLORS[type.priority as keyof typeof PRIORITY_COLORS] 
                                              : undefined
                                          },
                                          '& .MuiSwitch-track': {
                                            backgroundColor: isEnabled 
                                              ? alpha(PRIORITY_COLORS[type.priority as keyof typeof PRIORITY_COLORS], 0.5) 
                                              : undefined
                                          }
                                        }}
                                      />
                                    </Box>
                                  </Box>
                                </Grid>
                              );
                            })}
                          </Grid>
                        </AccordionDetails>
                      </Accordion>
                    );
                  })}
                </Box>
              )}

              {!channelEnabled && (
                <Box 
                  sx={{ 
                    textAlign: 'center', 
                    py: 3, 
                    color: 'text.secondary',
                    backgroundColor: alpha(theme.palette.grey[500], 0.05),
                    borderRadius: 1
                  }}
                >
                  <Typography variant="body2">
                    Включите канал "{channel.label}" для настройки типов уведомлений
                  </Typography>
                </Box>
              )}
            </AccordionDetails>
          </Accordion>
        );
      })}

      {/* Информационное сообщение */}
      <Alert 
        severity="info" 
        sx={{ 
          mt: 3,
          borderRadius: 2,
          backgroundColor: alpha(theme.palette.info.main, 0.05),
          border: `1px solid ${alpha(theme.palette.info.main, 0.2)}`
        }}
      >
        <Typography variant="body2">
          💡 <strong>Совет для оптимальной настройки:</strong>
        </Typography>
        <Box component="ul" sx={{ mt: 1, mb: 0, pl: 2 }}>
          <li>
            <Typography variant="caption">
              <strong>Веб-уведомления</strong> — для мгновенных уведомлений о критичных событиях
            </Typography>
          </li>
          <li>
            <Typography variant="caption">
              <strong>Email</strong> — для дедлайнов, назначений задач и еженедельных сводок
            </Typography>
          </li>
          <li>
            <Typography variant="caption">
              <strong>Telegram</strong> — для упоминаний и срочных уведомлений вне рабочего времени
            </Typography>
          </li>
        </Box>
      </Alert>
    </Box>
  );
};

export default NotificationChannelSettingsComponent; 