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
  CardHeader,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  SelectChangeEvent
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import { useSnackbar } from 'notistack';
import { userService } from '../services/userService';
import { getNotificationPreferences, updateNotificationPreferences } from '../services/notificationPreferencesService';
import { NotificationPreferences } from '../services/notificationPreferencesService';
import { useThemeContext } from '../context/ThemeContext';
import { SUPPORTED_LANGUAGES, SUPPORTED_TIMEZONES } from '../utils/constants';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';
import NotificationChannelSettingsComponent from '../components/notifications/NotificationChannelSettings';
import { updateNotificationSetting } from '../services/notificationPreferencesService';
import { useLocalization } from '../hooks/useLocalization';

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
  const { setLanguage } = useLocalization();
  const [tabValue, setTabValue] = useState(0);
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [notificationPreferences, setNotificationPreferences] = useState<NotificationPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingSettings, setSavingSettings] = useState<Record<string, boolean>>({});
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
        getNotificationPreferences()
      ]);
      
      // Проверяем и устанавливаем значения по умолчанию для null полей
      const validatedSettings = {
        ...userSettingsResponse,
        language: userSettingsResponse.language || 'ru',
        timezone: userSettingsResponse.timezone || 'Europe/Moscow'
      };
      
      console.log('Загруженные настройки:', userSettingsResponse);
      console.log('Валидированные настройки:', validatedSettings);
      
      setSettings(validatedSettings);
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

  // Автосохранение для настроек интерфейса (переключатели)
  const handleInterfaceSettingChange = (setting: keyof UserSettings) => async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (!settings) return;
    
    const newValue = event.target.checked;
    const settingName = setting;
    
    try {
      // Устанавливаем флаг сохранения для этой настройки
      setSavingSettings(prev => ({ ...prev, [settingName]: true }));
      
      // Обновляем локальное состояние
      const newSettings = {
        ...settings,
        [setting]: newValue
      };
      setSettings(newSettings);
      
      // Отправляем на сервер только измененную настройку
      const updatedSettings = await userService.updateUserSetting(setting, newValue);
      
      // Проверяем, что сервер вернул ожидаемое значение только для изменяемого поля
      if (updatedSettings[setting] !== newValue) {
        console.error(`Проверка настройки ${setting}: отправлено ${newValue}, получено ${updatedSettings[setting]}`);
        console.error('Полный ответ сервера:', updatedSettings);
        throw new Error(`Сервер вернул неожиданное значение для ${setting}: ожидали ${newValue}, получили ${updatedSettings[setting]}`);
      }
      
      // Обновляем все настройки с сервера
      setSettings(updatedSettings);
      
      enqueueSnackbar(`Настройка "${getInterfaceSettingDisplayName(setting)}" сохранена`, { 
        variant: 'success' 
      });
      
      // Обновляем localStorage для некоторых настроек
      if (setting === 'darkMode') {
        localStorage.setItem('darkMode', newValue ? 'true' : 'false');
      } else if (setting === 'compactMode') {
        localStorage.setItem('compactMode', newValue ? 'true' : 'false');
      }
      
    } catch (error) {
      console.error('Ошибка при сохранении настройки:', error);
      enqueueSnackbar(`Не удалось сохранить настройку "${getInterfaceSettingDisplayName(setting)}"`, { 
        variant: 'error' 
      });
      
      // Откатываем изменение при ошибке
      setSettings(prev => prev ? {
        ...prev,
        [setting]: !newValue
      } : null);
    } finally {
      // Убираем флаг сохранения
      setSavingSettings(prev => ({ ...prev, [settingName]: false }));
    }
  };

  // Автосохранение для настроек интерфейса (селекторы)
  const handleSelectSettingChange = (setting: 'language' | 'timezone') => async (
    event: SelectChangeEvent<string>
  ) => {
    if (!settings) return;
    
    const newValue = event.target.value;
    const settingName = setting;
    
    try {
      // Устанавливаем флаг сохранения для этой настройки
      setSavingSettings(prev => ({ ...prev, [settingName]: true }));
      
      // Обновляем локальное состояние
      const newSettings = {
        ...settings,
        [setting]: newValue
      };
      setSettings(newSettings);
      
      // Отправляем на сервер только измененную настройку
      const updatedSettings = await userService.updateUserSetting(setting, newValue);
      
      // Проверяем, что сервер вернул ожидаемое значение только для изменяемого поля
      if (updatedSettings[setting] !== newValue) {
        console.error(`Проверка настройки ${setting}: отправлено ${newValue}, получено ${updatedSettings[setting]}`);
        console.error('Полный ответ сервера:', updatedSettings);
        throw new Error(`Сервер вернул неожиданное значение для ${setting}: ожидали ${newValue}, получили ${updatedSettings[setting]}`);
      }
      
      // Обновляем все настройки с сервера
      setSettings(updatedSettings);
      
      enqueueSnackbar(`Настройка "${getInterfaceSettingDisplayName(setting)}" сохранена`, { 
        variant: 'success' 
      });
      
      // Обновляем localStorage для некоторых настроек
      if (setting === 'language') {
        localStorage.setItem('language', newValue);
        // Немедленно обновляем язык в системе локализации
        await setLanguage(newValue as 'ru' | 'en');
      } else if (setting === 'timezone') {
        localStorage.setItem('timezone', newValue);
      }
      
    } catch (error) {
      console.error('Ошибка при сохранении настройки:', error);
      enqueueSnackbar(`Не удалось сохранить настройку "${getInterfaceSettingDisplayName(setting)}"`, { 
        variant: 'error' 
      });
      
      // Откатываем изменение при ошибке
      setSettings(prev => prev ? {
        ...prev,
        [setting]: settings[setting]
      } : null);
    } finally {
      // Убираем флаг сохранения
      setSavingSettings(prev => ({ ...prev, [settingName]: false }));
    }
  };

  const handleThemeSettingChange = async () => {
    toggleTheme();
    
    // Также сохраняем в настройках пользователя
    if (settings) {
      const newDarkMode = mode !== 'dark'; // Инвертируем, так как toggleTheme еще не применился
      try {
        setSavingSettings(prev => ({ ...prev, darkMode: true }));
        
        const updatedSettings = await userService.updateUserSetting('darkMode', newDarkMode);
        setSettings(updatedSettings);
        
        enqueueSnackbar('Тема изменена', { variant: 'success' });
      } catch (error) {
        console.error('Ошибка при сохранении темы:', error);
        enqueueSnackbar('Не удалось сохранить тему', { variant: 'error' });
      } finally {
        setSavingSettings(prev => ({ ...prev, darkMode: false }));
      }
    }
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
      
      await updateNotificationPreferences(updatedPreferences);
      enqueueSnackbar(`Настройка "${getNotificationSettingDisplayName(key)}" обновлена`, { variant: 'success' });
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

  // Обработчик для нового компонента настроек уведомлений
  const handleNotificationSettingUpdate = async (settingKey: string, enabled: boolean) => {
    try {
      const updatedPreferences = await updateNotificationSetting(settingKey, enabled);
      setNotificationPreferences(updatedPreferences);
    } catch (error) {
      console.error('Ошибка при обновлении настройки уведомлений:', error);
      enqueueSnackbar('Не удалось обновить настройку', { variant: 'error' });
      throw error; // Пробрасываем ошибку для обработки в компоненте
    }
  };

  // Функция для получения читаемого названия настройки интерфейса
  const getInterfaceSettingDisplayName = (key: keyof UserSettings): string => {
    const displayNames: Record<keyof UserSettings, string> = {
      darkMode: 'Темная тема',
      compactMode: 'Компактный режим',
      enableAnimations: 'Анимации',
      browserNotifications: 'Браузерные уведомления',
      emailNotifications: 'Email уведомления',
      telegramNotifications: 'Telegram уведомления',
      language: 'Язык',
      timezone: 'Временная зона'
    };
    return displayNames[key] || key as string;
  };

  // Функция для получения читаемого названия настройки уведомлений
  const getNotificationSettingDisplayName = (key: keyof NotificationPreferences): string => {
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
      
      {/* Диагностический блок - только для разработки */}
      {process.env.NODE_ENV === 'development' && (
        <Alert severity="info" sx={{ mb: 2 }}>
          <Typography variant="body2">
            <strong>Диагностика:</strong><br/>
            Токен: {localStorage.getItem('token') ? '✅ Присутствует' : '❌ Отсутствует'}<br/>
            API URL: http://localhost:8081<br/>
            Настройки уведомлений: {notificationPreferences ? '✅ Загружены' : '❌ Не загружены'}
          </Typography>
        </Alert>
      )}
      
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
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Настройки сохраняются автоматически при изменении
                </Typography>
                <Divider sx={{ my: 2 }} />
                
                <FormControlLabel
                  control={
                    <Switch 
                      checked={mode === 'dark'}
                      onChange={handleThemeSettingChange}
                      disabled={savingSettings.darkMode}
                    />
                  }
                  label={
                    <Box display="flex" alignItems="center" gap={1}>
                      <span>Темная тема</span>
                      {savingSettings.darkMode && <CircularProgress size={16} />}
                    </Box>
                  }
                />
                
                <Box sx={{ mt: 2 }}>
                  <FormControlLabel
                    control={
                      <Switch 
                        checked={settings.compactMode}
                        onChange={handleInterfaceSettingChange('compactMode')}
                        disabled={savingSettings.compactMode}
                      />
                    }
                    label={
                      <Box display="flex" alignItems="center" gap={1}>
                        <span>Компактный вид задач</span>
                        {savingSettings.compactMode && <CircularProgress size={16} />}
                      </Box>
                    }
                  />
                </Box>
                
                <Box sx={{ mt: 2 }}>
                  <FormControlLabel
                    control={
                      <Switch 
                        checked={settings.enableAnimations}
                        onChange={handleInterfaceSettingChange('enableAnimations')}
                        disabled={savingSettings.enableAnimations}
                      />
                    }
                    label={
                      <Box display="flex" alignItems="center" gap={1}>
                        <span>Анимации интерфейса</span>
                        {savingSettings.enableAnimations && <CircularProgress size={16} />}
                      </Box>
                    }
                  />
                </Box>

                <Divider sx={{ my: 3 }} />

                {/* Языковые и региональные настройки */}
                <Typography variant="subtitle1" gutterBottom sx={{ mt: 2 }}>
                  Язык и регион
                </Typography>

                <Box sx={{ mt: 2 }}>
                  <FormControl fullWidth disabled={savingSettings.language}>
                    <InputLabel id="language-label">Язык интерфейса</InputLabel>
                    <Select
                      labelId="language-label"
                      value={settings.language}
                      label="Язык интерфейса"
                      onChange={handleSelectSettingChange('language')}
                      endAdornment={
                        savingSettings.language && (
                          <Box sx={{ position: 'absolute', right: 40 }}>
                            <CircularProgress size={20} />
                          </Box>
                        )
                      }
                    >
                      {SUPPORTED_LANGUAGES.map((language) => (
                        <MenuItem key={language.code} value={language.code}>
                          <Box display="flex" alignItems="center" gap={1}>
                            <span>{language.flag}</span>
                            <span>{language.name}</span>
                          </Box>
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Box>

                <Box sx={{ mt: 2 }}>
                  <FormControl fullWidth disabled={savingSettings.timezone}>
                    <InputLabel id="timezone-label">Часовой пояс</InputLabel>
                    <Select
                      labelId="timezone-label"
                      value={settings.timezone}
                      label="Часовой пояс"
                      onChange={handleSelectSettingChange('timezone')}
                      endAdornment={
                        savingSettings.timezone && (
                          <Box sx={{ position: 'absolute', right: 40 }}>
                            <CircularProgress size={20} />
                          </Box>
                        )
                      }
                    >
                      {SUPPORTED_TIMEZONES.map((timezone) => (
                        <MenuItem key={timezone.value} value={timezone.value}>
                          {timezone.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Box>
              </Box>
            )}
            
            {tabValue === 1 && (
              <Box sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Настройки уведомлений
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  Настройте детальные предпочтения уведомлений для каждого канала доставки
                </Typography>
                
                <NotificationChannelSettingsComponent
                  settings={notificationPreferences}
                  onUpdateSettings={handleNotificationSettingUpdate}
                  loading={loading}
                />
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
                >
                  Очистить кэш приложения
                </Button>
                
                <Box sx={{ mt: 2 }}>
                  <Button 
                    variant="outlined" 
                    color="error"
                    onClick={handleDeleteData}
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