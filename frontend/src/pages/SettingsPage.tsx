import React, { useEffect, useState, ChangeEvent } from 'react';
import { 
  Container, 
  Typography, 
  Paper, 
  Box,
  Tabs,
  Tab,
  Divider,
  Switch,
  FormControlLabel,
  Button,
  CircularProgress,
  Alert,
  Snackbar,
  useTheme,
  Grid,
  Card,
  CardContent,
  CardHeader
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import { useSnackbar } from 'notistack';
import { userService } from '../services/userService';
import { NotificationsService } from '../services/NotificationsService';
import { NotificationPreferences } from '../types/Notification';
import { useThemeContext } from '../context/ThemeContext';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';

interface UserSettings {
  darkMode: boolean;
  compactMode: boolean;
  enableAnimations: boolean;
  browserNotifications: boolean;
  emailNotifications: boolean;
  telegramNotifications: boolean;
  language: string;
  timezone: string;
}

export const SettingsPage: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [notificationPreferences, setNotificationPreferences] = useState<NotificationPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { enqueueSnackbar } = useSnackbar();
  const { mode, toggleTheme } = useThemeContext();
  const muiTheme = useTheme();

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const [userSettingsResponse, notificationPrefsResponse] = await Promise.all([
        userService.getUserSettings(),
        NotificationsService.getNotificationPreferences()
      ]);
      setSettings(userSettingsResponse);
      setNotificationPreferences(notificationPrefsResponse);
    } catch (error) {
      console.error('Ошибка при загрузке настроек:', error);
      enqueueSnackbar('Не удалось загрузить настройки', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleBooleanSettingChange = (setting: keyof UserSettings) => (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!settings) return;
    
    // Только обновляем локальное состояние без сохранения
    const newSettings = {
      ...settings,
      [setting]: event.target.checked
    };
    
    setSettings(newSettings);
  };

  const handleSaveInterfaceSettings = async () => {
    if (!settings) return;
    
    try {
      setSaving(true);
      const updatedSettings = await userService.updateUserSettings(settings);
      setSettings(updatedSettings);
      enqueueSnackbar('Настройки интерфейса сохранены', { variant: 'success' });
      
      // Обновляем localStorage для настроек темы и компактного режима
      localStorage.setItem('darkMode', settings.darkMode ? 'true' : 'false');
      localStorage.setItem('compactMode', settings.compactMode ? 'true' : 'false');
    } catch (error) {
      console.error('Ошибка при сохранении настроек:', error);
      enqueueSnackbar('Не удалось сохранить настройки', { variant: 'error' });
      // Перезагружаем настройки при ошибке
      loadSettings();
    } finally {
      setSaving(false);
    }
  };

  const handleThemeSettingChange = async () => {
    toggleTheme();
  };

  const handleClearCache = async () => {
    try {
      await userService.clearCache();
      enqueueSnackbar('Кэш очищен', { variant: 'success' });
    } catch (error) {
      console.error('Ошибка при очистке кэша:', error);
      enqueueSnackbar('Не удалось очистить кэш', { variant: 'error' });
    }
  };

  const handleDeleteData = async () => {
    try {
      await userService.deleteUserData();
      enqueueSnackbar('Данные удалены', { variant: 'success' });
    } catch (error) {
      console.error('Ошибка при удалении данных:', error);
      enqueueSnackbar('Не удалось удалить данные', { variant: 'error' });
    }
  };

  // Обработчик изменения настроек уведомлений
  const handleNotificationPreferenceChange = (key: keyof NotificationPreferences) => async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (!notificationPreferences) return;
    
    try {
      // Обновляем локальное состояние
      const newValue = event.target.checked;
      setNotificationPreferences(prev => ({
        ...prev!,
        [key]: newValue
      }));

      // Сразу сохраняем изменение на сервере
      const updatedPreferences = {
        ...notificationPreferences,
        [key]: newValue
      };
      
      await NotificationsService.updateNotificationPreferences(updatedPreferences);
      enqueueSnackbar(`Настройка "${getSettingDisplayName(key)}" обновлена`, { variant: 'success' });
    } catch (error) {
      console.error('Ошибка при сохранении настройки:', error);
      enqueueSnackbar('Не удалось сохранить настройку', { variant: 'error' });
      
      // Откатываем изменение в UI при ошибке
      setNotificationPreferences(prev => ({
        ...prev!,
        [key]: !event.target.checked
      }));
    }
  };

  // Функция для получения читаемого названия настройки
  const getSettingDisplayName = (key: keyof NotificationPreferences): string => {
    const displayNames: Record<keyof NotificationPreferences, string> = {
      globalNotificationsEnabled: 'Глобальные уведомления',
      emailNotificationsEnabled: 'Email уведомления',
      telegramNotificationsEnabled: 'Telegram уведомления',
      browserNotificationsEnabled: 'Браузер уведомления',
      boardInviteNotifications: 'Приглашения на доску',
      taskAssignedNotifications: 'Назначение задач',
      taskStatusChangedNotifications: 'Изменение статуса задач',
      taskCreatedNotifications: 'Создание задач',
      taskUpdatedNotifications: 'Обновление задач',
      taskDeletedNotifications: 'Удаление задач',
      taskCommentAddedNotifications: 'Комментарии к задачам',
      mentionNotifications: 'Упоминания',
      subtaskCreatedNotifications: 'Создание подзадач',
      subtaskCompletedNotifications: 'Завершение подзадач',
      boardMemberAddedNotifications: 'Добавление участников',
      boardMemberRemovedNotifications: 'Удаление участников',
      attachmentAddedNotifications: 'Прикрепление файлов',
      deadlineReminderNotifications: 'Напоминания о дедлайнах',
      roleChangedNotifications: 'Изменение ролей',
      taskDueSoonNotifications: 'Скорые дедлайны',
      taskOverdueNotifications: 'Просроченные задачи',
      onlyHighPriorityNotifications: 'Только высокий приоритет',
      groupSimilarNotifications: 'Группировка уведомлений',
      id: 'ID'
    };
    return displayNames[key] || key as string;
  };

  if (loading) {
    return (
      <Container sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      <Typography variant="h4" gutterBottom>
        Настройки
      </Typography>
      
      <Paper sx={{ mt: 3 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs 
            value={tabValue} 
            onChange={handleTabChange}
            aria-label="settings tabs"
          >
            <Tab label="Интерфейс" />
            <Tab label="Уведомления" />
            <Tab label="Приложение" />
          </Tabs>
        </Box>
        
        {settings && (
          <>
            {tabValue === 0 && (
              <Box sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Настройки интерфейса
                </Typography>
                <Divider sx={{ my: 2 }} />
                
                <FormControlLabel
                  control={
                    <Switch 
                      checked={mode === 'dark'}
                      onChange={handleThemeSettingChange}
                      disabled={saving || loading}
                    />
                  }
                  label="Темная тема"
                />
                
                <Box sx={{ mt: 2 }}>
                  <FormControlLabel
                    control={
                      <Switch 
                        checked={settings.compactMode}
                        onChange={handleBooleanSettingChange('compactMode')}
                        disabled={saving}
                      />
                    }
                    label="Компактный вид задач"
                  />
                </Box>
                
                <Box sx={{ mt: 2 }}>
                  <FormControlLabel
                    control={
                      <Switch 
                        checked={settings.enableAnimations}
                        onChange={handleBooleanSettingChange('enableAnimations')}
                        disabled={saving}
                      />
                    }
                    label="Анимации интерфейса"
                  />
                </Box>
                
                <Divider sx={{ my: 3 }} />
                
                <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <Button
                    variant="contained"
                    onClick={handleSaveInterfaceSettings}
                    disabled={saving}
                    startIcon={saving ? <CircularProgress size={20} /> : undefined}
                  >
                    {saving ? 'Сохранение...' : 'Сохранить настройки'}
                  </Button>
                </Box>
              </Box>
            )}
            
            {tabValue === 1 && (
              <Box sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Настройки уведомлений
                </Typography>
                <Divider sx={{ my: 2 }} />
                
                {notificationPreferences ? (
                  <>
                    {/* Глобальные настройки */}
                    <Card sx={{ mb: 2 }}>
                      <CardHeader title="Общие настройки" />
                      <CardContent>
                        <FormControlLabel
                          control={
                            <Switch 
                              checked={notificationPreferences.globalNotificationsEnabled}
                              onChange={handleNotificationPreferenceChange('globalNotificationsEnabled')}
                            />
                          }
                          label="Включить уведомления"
                        />
                        
                        <FormControlLabel
                          control={
                            <Switch 
                              checked={notificationPreferences.onlyHighPriorityNotifications}
                              onChange={handleNotificationPreferenceChange('onlyHighPriorityNotifications')}
                              disabled={!notificationPreferences.globalNotificationsEnabled}
                            />
                          }
                          label="Только высокоприоритетные уведомления"
                        />
                      </CardContent>
                    </Card>

                    {/* Каналы доставки */}
                    <Card sx={{ mb: 2 }}>
                      <CardHeader title="Каналы доставки" />
                      <CardContent>
                        <FormControlLabel
                          control={
                            <Switch 
                              checked={notificationPreferences.browserNotificationsEnabled}
                              onChange={handleNotificationPreferenceChange('browserNotificationsEnabled')}
                              disabled={!notificationPreferences.globalNotificationsEnabled}
                            />
                          }
                          label="Уведомления в браузере"
                        />
                        
                        <Box sx={{ mt: 2 }}>
                          <FormControlLabel
                            control={
                              <Switch 
                                checked={notificationPreferences.emailNotificationsEnabled}
                                onChange={handleNotificationPreferenceChange('emailNotificationsEnabled')}
                                disabled={!notificationPreferences.globalNotificationsEnabled}
                              />
                            }
                            label="Уведомления по Email"
                          />
                        </Box>
                        
                        <Box sx={{ mt: 2 }}>
                          <FormControlLabel
                            control={
                              <Switch 
                                checked={notificationPreferences.telegramNotificationsEnabled}
                                onChange={handleNotificationPreferenceChange('telegramNotificationsEnabled')}
                                disabled={!notificationPreferences.globalNotificationsEnabled}
                              />
                            }
                            label="Уведомления в Telegram"
                          />
                        </Box>
                      </CardContent>
                    </Card>
                  </>
                ) : (
                  <Box display="flex" justifyContent="center" py={4}>
                    <CircularProgress />
                  </Box>
                )}
              </Box>
            )}
            
            {tabValue === 2 && (
              <Box sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Настройки приложения
                </Typography>
                <Divider sx={{ my: 2 }} />
                
                <Typography variant="body2" color="text.secondary" paragraph>
                  Версия приложения: 0.1.0
                </Typography>
                
                <Button 
                  variant="outlined" 
                  color="primary"
                  onClick={handleClearCache}
                  disabled={saving}
                >
                  Очистить кэш приложения
                </Button>
                
                <Box sx={{ mt: 2 }}>
                  <Button 
                    variant="outlined" 
                    color="error"
                    onClick={handleDeleteData}
                    disabled={saving}
                  >
                    Удалить все данные
                  </Button>
                </Box>
              </Box>
            )}
          </>
        )}
      </Paper>
    </Container>
  );
}; 