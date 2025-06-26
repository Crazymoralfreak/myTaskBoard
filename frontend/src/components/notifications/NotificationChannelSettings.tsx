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
import { useLocalization } from '../../hooks/useLocalization';

const NOTIFICATION_CHANNELS = [
  {
    key: 'browser',
    icon: <WebIcon />,
    color: '#2196f3'
  },
  {
    key: 'email',
    icon: <EmailIcon />,
    color: '#ff9800'
  },
  {
    key: 'telegram',
    icon: <TelegramIcon />,
    color: '#00bcd4'
  }
] as const;

const NOTIFICATION_TYPES = {
  tasks: {
    icon: '📋',
    color: '#4caf50',
    types: [
      { key: 'taskAssignedNotifications', priority: 'high' },
      { key: 'taskCreatedNotifications', priority: 'normal' },
      { key: 'taskUpdatedNotifications', priority: 'low' },
      { key: 'taskDeletedNotifications', priority: 'high' },
      { key: 'taskStatusChangedNotifications', priority: 'normal' },
      { key: 'taskDueSoonNotifications', priority: 'high' },
      { key: 'taskOverdueNotifications', priority: 'critical' }
    ]
  },
  collaboration: {
    icon: '👥',
    color: '#9c27b0',
    types: [
      { key: 'taskCommentAddedNotifications', priority: 'normal' },
      { key: 'mentionNotifications', priority: 'high' },
      { key: 'boardMemberAddedNotifications', priority: 'normal' },
      { key: 'boardMemberRemovedNotifications', priority: 'normal' },
      { key: 'roleChangedNotifications', priority: 'high' }
    ]
  },
  boards: {
    icon: '📊',
    color: '#ff5722',
    types: [
      { key: 'boardInviteNotifications', priority: 'high' }
    ]
  },
  subtasks: {
    icon: '✅',
    color: '#607d8b',
    types: [
      { key: 'subtaskCreatedNotifications', priority: 'low' },
      { key: 'subtaskCompletedNotifications', priority: 'normal' }
    ]
  },
  other: {
    icon: '📎',
    color: '#795548',
    types: [
      { key: 'attachmentAddedNotifications', priority: 'low' },
      { key: 'deadlineReminderNotifications', priority: 'critical' }
    ]
  }
};

const PRIORITY_COLORS = {
  critical: '#f44336',
  high: '#ff9800', 
  normal: '#2196f3',
  low: '#9e9e9e'
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
  const { t } = useLocalization();
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
      setSuccessMessage(`${t('settingUpdated')}: "${getSettingDisplayName(settingKey)}"`);
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
    if (channel) return getChannelLabel(channel.key);
    
    // Поиск в типах уведомлений
    for (const group of Object.values(NOTIFICATION_TYPES)) {
      const type = group.types.find(t => t.key === key);
      if (type) return getTypeLabel(type.key);
    }
    
    // Глобальные настройки
    const globalSettings: Record<string, string> = {
      globalNotificationsEnabled: t('globalNotifications'),
      onlyHighPriorityNotifications: t('onlyHighPriority'),
      groupSimilarNotifications: t('groupSimilar')
    };
    
    return globalSettings[key] || key;
  };

  const getChannelLabel = (channelKey: string): string => {
    switch (channelKey) {
      case 'browser': return t('channelWeb');
      case 'email': return t('channelEmail');
      case 'telegram': return t('channelTelegram');
      default: return channelKey;
    }
  };

  const getChannelDescription = (channelKey: string): string => {
    switch (channelKey) {
      case 'browser': return t('channelWebDescription');
      case 'email': return t('channelEmailDescription');
      case 'telegram': return t('channelTelegramDescription');
      default: return '';
    }
  };

  const getChannelInfo = (channelKey: string): string => {
    switch (channelKey) {
      case 'browser': return t('channelWebInfo');
      case 'email': return t('channelEmailInfo');
      case 'telegram': return t('channelTelegramInfo');
      default: return '';
    }
  };

  const getGroupLabel = (groupKey: string): string => {
    switch (groupKey) {
      case 'tasks': return t('groupTasks');
      case 'collaboration': return t('groupCollaboration');
      case 'boards': return t('groupBoards');
      case 'subtasks': return t('groupSubtasks');
      case 'other': return t('groupOther');
      default: return groupKey;
    }
  };

  const getTypeLabel = (typeKey: string): string => {
    switch (typeKey) {
      case 'taskAssignedNotifications': return t('typeTaskAssigned');
      case 'taskCreatedNotifications': return t('typeTaskCreated');
      case 'taskUpdatedNotifications': return t('typeTaskUpdated');
      case 'taskDeletedNotifications': return t('typeTaskDeleted');
      case 'taskStatusChangedNotifications': return t('typeTaskStatusChanged');
      case 'taskDueSoonNotifications': return t('typeTaskDueSoon');
      case 'taskOverdueNotifications': return t('typeTaskOverdue');
      case 'taskCommentAddedNotifications': return t('typeTaskCommentAdded');
      case 'mentionNotifications': return t('typeMention');
      case 'boardMemberAddedNotifications': return t('typeBoardMemberAdded');
      case 'boardMemberRemovedNotifications': return t('typeBoardMemberRemoved');
      case 'roleChangedNotifications': return t('typeRoleChanged');
      case 'boardInviteNotifications': return t('typeBoardInvite');
      case 'subtaskCreatedNotifications': return t('typeSubtaskCreated');
      case 'subtaskCompletedNotifications': return t('typeSubtaskCompleted');
      case 'attachmentAddedNotifications': return t('typeAttachmentAdded');
      case 'deadlineReminderNotifications': return t('typeDeadlineReminder');
      default: return typeKey;
    }
  };

  const getTypeDescription = (typeKey: string): string => {
    switch (typeKey) {
      case 'taskAssignedNotifications': return t('typeTaskAssignedDescription');
      case 'taskCreatedNotifications': return t('typeTaskCreatedDescription');
      case 'taskUpdatedNotifications': return t('typeTaskUpdatedDescription');
      case 'taskDeletedNotifications': return t('typeTaskDeletedDescription');
      case 'taskStatusChangedNotifications': return t('typeTaskStatusChangedDescription');
      case 'taskDueSoonNotifications': return t('typeTaskDueSoonDescription');
      case 'taskOverdueNotifications': return t('typeTaskOverdueDescription');
      case 'taskCommentAddedNotifications': return t('typeTaskCommentAddedDescription');
      case 'mentionNotifications': return t('typeMentionDescription');
      case 'boardMemberAddedNotifications': return t('typeBoardMemberAddedDescription');
      case 'boardMemberRemovedNotifications': return t('typeBoardMemberRemovedDescription');
      case 'roleChangedNotifications': return t('typeRoleChangedDescription');
      case 'boardInviteNotifications': return t('typeBoardInviteDescription');
      case 'subtaskCreatedNotifications': return t('typeSubtaskCreatedDescription');
      case 'subtaskCompletedNotifications': return t('typeSubtaskCompletedDescription');
      case 'attachmentAddedNotifications': return t('typeAttachmentAddedDescription');
      case 'deadlineReminderNotifications': return t('typeDeadlineReminderDescription');
      default: return '';
    }
  };

  const getPriorityLabel = (priority: string): string => {
    switch (priority) {
      case 'critical': return t('priorityCritical');
      case 'high': return t('priorityHigh');
      case 'normal': return t('priorityNormal');
      case 'low': return t('priorityLow');
      default: return t('priorityNormal');
    }
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
                {t('settingsTitle')}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {t('settingsDescription')}
              </Typography>
            </Box>
          </Box>
          
          <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
            <Box flexGrow={1}>
              <Typography variant="body1" sx={{ fontWeight: 500 }}>
                {t('globalNotifications')}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {t('globalNotificationsDescription')}
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
                    {t('onlyHighPriority')}
                  </Typography>
                  <Tooltip title={t('onlyHighPriorityTooltip')}>
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
                    {t('groupSimilar')}
                  </Typography>
                  <Tooltip title={t('groupSimilarTooltip')}>
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
        {t('channelsTitle')}
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
                  {getChannelLabel(channel.key)}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {getChannelDescription(channel.key)}
                </Typography>
                {channelEnabled && enabled > 0 && (
                  <Typography variant="caption" sx={{ color: channel.color, display: 'block', mt: 0.5 }}>
                    {t('channelActiveTypes').replace('{enabled}', enabled.toString()).replace('{total}', total.toString())}
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
                  {getChannelInfo(channel.key)}
                </Typography>
              </Alert>

              {/* Детальные настройки типов уведомлений для данного канала */}
              {channelEnabled && (
                <Box>
                  <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
                    {t('typesForChannel').replace('{channel}', getChannelLabel(channel.key))}
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
                              {getGroupLabel(groupKey)}
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
                                          {getTypeLabel(type.key)}
                                        </Typography>
                                        <Chip
                                          label={getPriorityLabel(type.priority)}
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
                                        {getTypeDescription(type.key)}
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
                    {t('enableChannel').replace('{channel}', getChannelLabel(channel.key))}
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
          💡 <strong>{t('tipsTitle')}</strong>
        </Typography>
        <Box component="ul" sx={{ mt: 1, mb: 0, pl: 2 }}>
          <li>
            <Typography variant="caption">
              <strong>{t('channelWeb')}</strong> — {t('tipWeb')}
            </Typography>
          </li>
          <li>
            <Typography variant="caption">
              <strong>Email</strong> — {t('tipEmail')}
            </Typography>
          </li>
          <li>
            <Typography variant="caption">
              <strong>Telegram</strong> — {t('tipTelegram')}
            </Typography>
          </li>
        </Box>
      </Alert>
    </Box>
  );
};

export default NotificationChannelSettingsComponent; 