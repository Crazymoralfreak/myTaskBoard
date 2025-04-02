import React, { useEffect, useState } from 'react';
import { 
  Container, 
  Typography, 
  Paper, 
  Box, 
  Avatar, 
  Button, 
  Grid, 
  TextField, 
  Divider,
  CircularProgress,
  Snackbar,
  Alert,
  IconButton,
  Tab,
  Tabs
} from '@mui/material';
import { useTelegram } from '../hooks/useTelegram';
import { fetchUserProfile } from '../api/api';
import { authService } from '../services/authService';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import SaveIcon from '@mui/icons-material/Save';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import SettingsIcon from '@mui/icons-material/Settings';
import NotificationsIcon from '@mui/icons-material/Notifications';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`profile-tabpanel-${index}`}
      aria-labelledby={`profile-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

export const ProfilePage = () => {
  const { user: telegramUser, WebApp } = useTelegram();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [alertOpen, setAlertOpen] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertSeverity, setAlertSeverity] = useState<'success' | 'error'>('success');
  const [tabValue, setTabValue] = useState(0);

  useEffect(() => {
    if (WebApp) {
      WebApp.ready();
    }
    
    // Попробуем получить данные текущего пользователя
    const token = authService.getToken();
    const fetchProfile = async () => {
      setLoading(true);
      try {
        // Проверяем авторизован ли пользователь
        if (authService.isAuthenticated()) {
          // Если у нас есть Telegram пользователь, используем его ID
          if (telegramUser) {
            const data = await fetchUserProfile(telegramUser.id.toString());
            setProfile(data);
          } else {
            // Если Telegram пользователя нет, пробуем получить информацию из локального хранилища
            const userData = localStorage.getItem('user');
            if (userData) {
              const user = JSON.parse(userData);
              const data = await fetchUserProfile(user.id);
              setProfile(data);
            } else {
              setError('Данные пользователя не найдены');
            }
          }
        } else {
          setError('Пользователь не авторизован');
        }
      } catch (err) {
        console.error('Ошибка при загрузке профиля:', err);
        setError('Не удалось загрузить данные профиля');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [telegramUser, WebApp]);

  const handleSaveProfile = () => {
    setAlertSeverity('success');
    setAlertMessage('Профиль успешно сохранен');
    setAlertOpen(true);
    // Здесь будет логика сохранения профиля
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleAlertClose = () => {
    setAlertOpen(false);
  };

  if (loading) {
    return (
      <Container maxWidth="md" sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '70vh' }}>
        <Box textAlign="center">
          <CircularProgress size={60} thickness={4} />
          <Typography variant="h6" mt={2}>
            Загрузка профиля...
          </Typography>
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h5" color="error" gutterBottom>
            {error}
          </Typography>
          <Typography variant="body1" paragraph>
            Пожалуйста, войдите в систему или обновите страницу.
          </Typography>
          <Button 
            variant="contained" 
            color="primary" 
            onClick={() => window.location.href = "/auth"}
          >
            Перейти к авторизации
          </Button>
        </Paper>
      </Container>
    );
  }

  const defaultProfile = {
    username: profile?.username || 'Пользователь',
    email: profile?.email || '',
    phone: profile?.phone || '',
    position: profile?.position || '',
    bio: profile?.bio || '',
    avatarUrl: profile?.avatarUrl || ''
  };

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 8 }}>
      <Paper elevation={3} sx={{ borderRadius: 2, overflow: 'hidden' }}>
        <Box sx={{ 
          p: 3, 
          background: 'linear-gradient(to right, #4a148c, #7b1fa2)',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <Typography variant="h4">
            Мой профиль
          </Typography>
        </Box>

        <Box sx={{ width: '100%' }}>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs 
              value={tabValue} 
              onChange={handleTabChange} 
              aria-label="profile tabs"
              variant="fullWidth"
            >
              <Tab icon={<AccountCircleIcon />} label="Основная информация" />
              <Tab icon={<SettingsIcon />} label="Настройки" />
              <Tab icon={<NotificationsIcon />} label="Уведомления" />
            </Tabs>
          </Box>

          <TabPanel value={tabValue} index={0}>
            <Box sx={{ textAlign: 'center', mb: 4 }}>
              <Box sx={{ position: 'relative', display: 'inline-block' }}>
                <Avatar 
                  sx={{ 
                    width: 120, 
                    height: 120, 
                    border: '4px solid white',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                  }}
                  src={defaultProfile.avatarUrl}
                >
                  {defaultProfile.username.charAt(0).toUpperCase()}
                </Avatar>
                <IconButton 
                  sx={{ 
                    position: 'absolute', 
                    bottom: 0, 
                    right: 0, 
                    backgroundColor: 'primary.main',
                    color: 'white',
                    '&:hover': {
                      backgroundColor: 'primary.dark',
                    }
                  }}
                  size="small"
                >
                  <PhotoCameraIcon fontSize="small" />
                </IconButton>
              </Box>
              <Typography variant="h5" mt={2} fontWeight={500}>
                {defaultProfile.username}
              </Typography>
              {defaultProfile.position && (
                <Typography variant="body1" color="text.secondary">
                  {defaultProfile.position}
                </Typography>
              )}
            </Box>

            <Divider sx={{ mb: 4 }} />
            
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Имя пользователя"
                  value={defaultProfile.username}
                  onChange={(e) => setProfile({ ...profile, username: e.target.value })}
                  variant="outlined"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Email"
                  type="email"
                  value={defaultProfile.email}
                  onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                  variant="outlined"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Телефон"
                  value={defaultProfile.phone}
                  onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                  variant="outlined"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Должность"
                  value={defaultProfile.position}
                  onChange={(e) => setProfile({ ...profile, position: e.target.value })}
                  variant="outlined"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="О себе"
                  value={defaultProfile.bio}
                  onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                  variant="outlined"
                  multiline
                  rows={4}
                />
              </Grid>
            </Grid>
            
            <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end' }}>
              <Button 
                variant="contained" 
                color="primary"
                startIcon={<SaveIcon />}
                onClick={handleSaveProfile}
                size="large"
              >
                Сохранить изменения
              </Button>
            </Box>
          </TabPanel>

          <TabPanel value={tabValue} index={1}>
            <Typography variant="h6" gutterBottom>
              Настройки аккаунта
            </Typography>
            <Box sx={{ mb: 3 }}>
              <Button variant="outlined" fullWidth sx={{ mb: 2 }}>
                Изменить пароль
              </Button>
              <Button variant="outlined" fullWidth sx={{ mb: 2 }}>
                Настройки приватности
              </Button>
              <Button variant="outlined" fullWidth sx={{ mb: 2 }}>
                Настройки интерфейса
              </Button>
            </Box>

            <Typography variant="h6" gutterBottom sx={{ mt: 4 }}>
              Интеграции
            </Typography>
            <Box sx={{ mb: 3 }}>
              <Button variant="outlined" color="primary" fullWidth sx={{ mb: 2 }}>
                Подключить Telegram
              </Button>
              <Button variant="outlined" color="primary" fullWidth>
                Подключить Google
              </Button>
            </Box>
          </TabPanel>

          <TabPanel value={tabValue} index={2}>
            <Typography variant="h6" gutterBottom>
              Уведомления
            </Typography>
            <Box sx={{ mb: 3 }}>
              <Typography variant="body1" gutterBottom>
                Настройте способы получения уведомлений о задачах, дедлайнах и других событиях.
              </Typography>
              <Grid container spacing={2} sx={{ mt: 2 }}>
                <Grid item xs={12}>
                  <Paper variant="outlined" sx={{ p: 2 }}>
                    <Typography variant="subtitle1" gutterBottom>
                      Email уведомления
                    </Typography>
                    <Button variant="outlined" size="small">
                      Настроить
                    </Button>
                  </Paper>
                </Grid>
                <Grid item xs={12}>
                  <Paper variant="outlined" sx={{ p: 2 }}>
                    <Typography variant="subtitle1" gutterBottom>
                      Telegram уведомления
                    </Typography>
                    <Button variant="outlined" size="small">
                      Настроить
                    </Button>
                  </Paper>
                </Grid>
                <Grid item xs={12}>
                  <Paper variant="outlined" sx={{ p: 2 }}>
                    <Typography variant="subtitle1" gutterBottom>
                      Push уведомления
                    </Typography>
                    <Button variant="outlined" size="small">
                      Настроить
                    </Button>
                  </Paper>
                </Grid>
              </Grid>
            </Box>
          </TabPanel>
        </Box>
      </Paper>

      <Snackbar 
        open={alertOpen} 
        autoHideDuration={5000} 
        onClose={handleAlertClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleAlertClose} severity={alertSeverity}>
          {alertMessage}
        </Alert>
      </Snackbar>
    </Container>
  );
};