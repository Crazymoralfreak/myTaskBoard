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
  useTheme
} from '@mui/material';
import { useSnackbar } from 'notistack';
import { userService } from '../services/userService';
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
      const response = await userService.getUserSettings();
      setSettings(response);
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

  const handleBooleanSettingChange = (setting: keyof UserSettings) => async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!settings) return;
    
    const newSettings = {
      ...settings,
      [setting]: event.target.checked
    };
    
    setSettings(newSettings);
    
    try {
      setSaving(true);
      await userService.updateUserSettings(newSettings);
      enqueueSnackbar('Настройки сохранены', { variant: 'success' });
    } catch (error) {
      console.error('Ошибка при сохранении настроек:', error);
      enqueueSnackbar('Не удалось сохранить настройки', { variant: 'error' });
      // Откатываем изменения в случае ошибки
      setSettings(settings);
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
              </Box>
            )}
            
            {tabValue === 1 && (
              <Box sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Настройки уведомлений
                </Typography>
                <Divider sx={{ my: 2 }} />
                
                <FormControlLabel
                  control={
                    <Switch 
                      checked={settings.browserNotifications}
                      onChange={handleBooleanSettingChange('browserNotifications')}
                      disabled={saving}
                    />
                  }
                  label="Уведомления в браузере"
                />
                
                <Box sx={{ mt: 2 }}>
                  <FormControlLabel
                    control={
                      <Switch 
                        checked={settings.emailNotifications}
                        onChange={handleBooleanSettingChange('emailNotifications')}
                        disabled={saving}
                      />
                    }
                    label="Уведомления по Email"
                  />
                </Box>
                
                <Box sx={{ mt: 2 }}>
                  <FormControlLabel
                    control={
                      <Switch 
                        checked={settings.telegramNotifications}
                        onChange={handleBooleanSettingChange('telegramNotifications')}
                        disabled={saving}
                      />
                    }
                    label="Уведомления в Telegram"
                  />
                </Box>
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