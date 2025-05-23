import React, { useEffect, useState, ChangeEvent, FormEvent, useRef } from 'react';
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Collapse,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  DialogContentText,
  Switch,
  FormControlLabel,
  useTheme,
  Tooltip,
  useMediaQuery
} from '@mui/material';
import LockIcon from '@mui/icons-material/Lock';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import AddAPhotoIcon from '@mui/icons-material/AddAPhoto';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';
import SettingsIcon from '@mui/icons-material/Settings';
import { fetchUserProfile, updateUserProfile, changePassword, updateUserAvatar, uploadUserAvatar, updateUserSettings } from '../api/api';
import { getAvatarUrl } from '../utils/avatarUtils';
import AvatarUploader from '../components/AvatarUploader';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import * as authService from '../services/authService';
import { styled } from '@mui/system';

// Стандартные аватары
const AVATAR_OPTIONS = [
  '/avatars/avatar1.png',
  '/avatars/avatar2.png',
  '/avatars/avatar3.png',
  '/avatars/avatar4.png',
  '/avatars/avatar5.png',
  '/avatars/avatar6.png',
  '/avatars/avatar7.png',
  '/avatars/avatar8.png',
  '/avatars/avatar9.png',
  '/avatars/avatar10.png',
  '/avatars/avatar11.png',
  '/avatars/avatar12.png',
  '/avatars/avatar13.png',
  '/avatars/avatar14.png',
  '/avatars/avatar15.png',
  '/avatars/avatar16.png',
  '/avatars/avatar17.png',
  '/avatars/avatar18.png',
  '/avatars/avatar19.png'
];

export const ProfilePage = () => {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [originalProfile, setOriginalProfile] = useState<any>(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error' | 'info' | 'warning'
  });
  
  // Состояния для диалогов
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [avatarDialogOpen, setAvatarDialogOpen] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordError, setPasswordError] = useState('');
  const [showSecuritySection, setShowSecuritySection] = useState(false);
  const [selectedAvatar, setSelectedAvatar] = useState('');
  const [avatarUploaderOpen, setAvatarUploaderOpen] = useState(false);
  const [avatarMenuAnchor, setAvatarMenuAnchor] = useState<null | HTMLElement>(null);
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [openPasswordDialog, setOpenPasswordDialog] = useState<boolean>(false);
  const [changePasswordLoading, setChangePasswordLoading] = useState<boolean>(false);
  const [snackbarOpen, setSnackbarOpen] = useState<boolean>(false);
  const [snackbarMessage, setSnackbarMessage] = useState<string>('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error' | 'info' | 'warning'>('success');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [saving, setSaving] = useState<boolean>(false);
  const [showUserSettings, setShowUserSettings] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const token = localStorage.getItem('token');

  useEffect(() => {
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    try {
      setLoading(true);
      const userData = await fetchUserProfile();
      if (!userData.userSettings) {
        userData.userSettings = {
          darkMode: false,
        };
      }
      setProfile(userData);
      setOriginalProfile(userData);
      if (userData.avatarUrl) {
        setSelectedAvatar(userData.avatarUrl);
      }
    } catch (error) {
      console.error('Ошибка загрузки профиля:', error);
      setSnackbar({
        open: true,
        message: 'Не удалось загрузить данные профиля',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!isEditing) return;

    setSaving(true);
    try {
      console.log('Сохранение профиля:', profile);
      
      // Сначала сохраняем информацию профиля
      const updatedProfile = await updateUserProfile({
        username: profile.username,
        email: profile.email,
        phone: profile.phone, // Использую поле phone вместо phoneNumber
        position: profile.position,
        bio: profile.bio
      });
      
      // Затем отдельно сохраняем настройки пользователя (если они есть)
      if (profile?.userSettings && token) {
        try {
          console.log('Сохранение настроек пользователя:', profile.userSettings);
          await updateUserSettings(token, profile.userSettings);
          console.log('Настройки пользователя успешно сохранены');
        } catch (settingsError) {
          console.error('Ошибка при сохранении настроек:', settingsError);
          // Продолжаем выполнение, даже если настройки не сохранились
          toast.error('Не удалось сохранить настройки пользователя');
        }
      }
      
      setIsEditing(false);
      setOriginalProfile({...profile});
      toast.success('Профиль успешно обновлен');
    } catch (error: any) {
      console.error('Error saving profile:', error);
      if (error.response && error.response.status === 401) {
        toast.error('Сессия истекла. Пожалуйста, войдите снова.');
        navigate('/login');
      } else {
        toast.error('Ошибка при сохранении профиля: ' + (error.message || 'Неизвестная ошибка'));
      }
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setProfile(originalProfile);
    setSelectedAvatar(originalProfile.avatarUrl || '');
    setIsEditing(false);
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  // Функция для обновления пароля
  const handlePasswordChange = async (e: FormEvent) => {
    e.preventDefault();
    
    // Открываем диалог с предупреждением
    setOpenPasswordDialog(true);
  };
  
  const closePasswordDialog = () => {
    setOpenPasswordDialog(false);
  };
  
  const confirmPasswordChange = async () => {
    // Закрываем модальное окно
    setOpenPasswordDialog(false);
    
    // Начинаем процесс смены пароля и показываем индикатор загрузки
    setChangePasswordLoading(true);
    
    try {
      const result = await authService.changePassword(
        passwordData.currentPassword,
        passwordData.newPassword
      );
      
      // Показываем сообщение об успехе
      setSnackbarMessage(result.message);
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
      
      // После успешной смены пароля сбрасываем форму
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      
      // Через 2 секунды перенаправляем на страницу логина
      setTimeout(() => {
        navigate('/login');
      }, 2000);
      
    } catch (error: any) {
      // Показываем сообщение об ошибке
      setSnackbarMessage(error.message || 'Произошла ошибка при смене пароля');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    } finally {
      // Скрываем индикатор загрузки
      setChangePasswordLoading(false);
    }
  };
  
  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };

  // Функция для открытия меню аватара
  const handleAvatarMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAvatarMenuAnchor(event.currentTarget);
  };

  // Функция для закрытия меню аватара
  const handleAvatarMenuClose = () => {
    setAvatarMenuAnchor(null);
  };

  // Функция для выбора из стандартных аватаров
  const handleOpenStandardAvatars = () => {
    handleAvatarMenuClose();
    setAvatarDialogOpen(true);
  };

  // Функция для открытия загрузчика аватарок
  const handleOpenAvatarUploader = () => {
    handleAvatarMenuClose();
    setAvatarUploaderOpen(true);
  };

  // Функция для сохранения загруженного аватара
  const handleAvatarUpload = async (imageUrl: string) => {
    try {
      setLoading(true);
      
      // Извлекаем из объекта URL file-объект для загрузки
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const file = new File([blob], "avatar.jpg", { type: "image/jpeg" });
      
      console.log('Подготовка файла для загрузки:', {
        размер: file.size,
        тип: file.type
      });
      
      // Загружаем файл на сервер
      const result = await uploadUserAvatar(file);
      console.log('Результат загрузки аватара:', result);
      
      if (result && result.avatarUrl) {
        const updatedProfile = {...profile, avatarUrl: result.avatarUrl};
        setProfile(updatedProfile);
        setOriginalProfile(updatedProfile);
        setSelectedAvatar(result.avatarUrl);
        
        // Проверяем URL аватара
        const avatarDisplay = processAvatarUrl(result.avatarUrl);
        console.log('URL аватара для отображения после загрузки:', avatarDisplay);
        
        setSnackbar({
          open: true,
          message: 'Аватар успешно обновлен',
          severity: 'success'
        });
      }
    } catch (error) {
      console.error('Ошибка обновления аватара:', error);
      setSnackbar({
        open: true,
        message: 'Не удалось обновить аватар',
        severity: 'error'
      });
    } finally {
      setLoading(false);
      setAvatarUploaderOpen(false);
    }
  };

  // Функция для выбора стандартного аватара
  const handleSelectAvatar = async (avatarUrl: string) => {
    try {
      setLoading(true);
      await updateUserAvatar(avatarUrl);
      // Обновляем профиль после изменения аватара
      const updatedProfile = {...profile, avatarUrl};
      setProfile(updatedProfile);
      setOriginalProfile(updatedProfile);
      setSelectedAvatar(avatarUrl);
      setAvatarMenuAnchor(null); // Закрываем меню
      setSnackbar({
        open: true,
        message: 'Аватар успешно обновлен',
        severity: 'success'
      });
    } catch (error) {
      console.error('Ошибка обновления аватара:', error);
      setSnackbar({
        open: true,
        message: 'Не удалось обновить аватар',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  // Валидация формы пароля
  const isPasswordFormValid = 
    passwordData.currentPassword.length > 0 && 
    passwordData.newPassword.length > 0 && 
    passwordData.confirmPassword.length > 0 && 
    passwordData.newPassword === passwordData.confirmPassword;

  // Функция для открытия диалога выбора файла
  const handleOpenFileDialog = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };
  
  // Функция для обработки выбора файла
  const handleFileSelect = (event: ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      setSelectedFile(file);
      
      // Загружаем выбранный файл аватара
      handleFileUpload(file);
    }
  };
  
  // Функция для загрузки файла аватара
  const handleFileUpload = async (file: File) => {
    try {
      setUploading(true);
      setSnackbarMessage('Загрузка аватара...');
      setSnackbarSeverity('info');
      setSnackbarOpen(true);
      
      // Загружаем файл на сервер
      const result = await uploadUserAvatar(file);
      
      // Обновляем профиль с новым URL аватара
      if (result && result.avatarUrl) {
        setProfile({
          ...profile!,
          avatarUrl: result.avatarUrl
        });
        
        // Показываем сообщение об успехе
        setSnackbarMessage('Аватар успешно обновлен');
        setSnackbarSeverity('success');
        setSnackbarOpen(true);
      }
    } catch (error: any) {
      console.error('Ошибка при загрузке аватара:', error);
      
      // Показываем сообщение об ошибке
      setSnackbarMessage(error.message || 'Произошла ошибка при загрузке аватара');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    } finally {
      setUploading(false);
      setSelectedFile(null);
      // Сбрасываем значение input, чтобы можно было загрузить тот же файл еще раз
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Функция для переключения темы
  const handleThemeChange = (event: ChangeEvent<HTMLInputElement>) => {
    const isDarkMode = event.target.checked;
    setProfile((prevProfile: any) => ({
      ...prevProfile,
      userSettings: {
        ...(prevProfile.userSettings || {}),
        darkMode: isDarkMode
      }
    }));
    
    localStorage.setItem('darkMode', isDarkMode ? 'true' : 'false');
    
    const themeChangeEvent = new CustomEvent('themeChange', {
      detail: { darkMode: isDarkMode }
    });
    window.dispatchEvent(themeChangeEvent);
    
    setSnackbar({
      open: true,
      message: isDarkMode ? 'Включена темная тема' : 'Включена светлая тема',
      severity: 'info'
    });
  };

  // Обработка URL аватарки с логированием
  const processAvatarUrl = (avatarUrl?: string): string | undefined => {
    console.log('ProfilePage - Исходный URL аватарки:', avatarUrl);
    const processedUrl = getAvatarUrl(avatarUrl);
    console.log('ProfilePage - Обработанный URL аватарки:', processedUrl);
    return processedUrl;
  };

  if (loading && !profile) {
    return (
      <Container sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ mt: 4, px: isMobile ? 2 : 3 }}>
      <Typography variant="h4" gutterBottom>
        Мой профиль
      </Typography>
      
      <Paper sx={{ p: isMobile ? 2 : 3, mt: 3 }}>
        {profile ? (
          <>
            <Box sx={{ 
              display: 'flex', 
              flexDirection: isMobile ? 'column' : 'row',
              alignItems: isMobile ? 'center' : 'flex-start', 
              mb: 4 
            }}>
              <Box sx={{ position: 'relative', mb: isMobile ? 2 : 0 }}>
                <Avatar 
                  sx={{ 
                    width: isMobile ? 80 : 100, 
                    height: isMobile ? 80 : 100, 
                    mr: isMobile ? 0 : 3 
                  }}
                  src={processAvatarUrl(selectedAvatar || profile.avatarUrl)}
                >
                  {profile.username?.charAt(0) || 'U'}
                </Avatar>
                {isEditing && (
                  <IconButton 
                    sx={{ 
                      position: 'absolute', 
                      bottom: 0, 
                      right: isMobile ? 0 : 12, 
                      backgroundColor: 'white',
                      boxShadow: 1,
                      '&:hover': {
                        backgroundColor: '#f5f5f5'
                      }
                    }}
                    size="small"
                    onClick={handleAvatarMenuOpen}
                  >
                    <AddAPhotoIcon fontSize="small" />
                  </IconButton>
                )}
              </Box>
              <Box sx={{ textAlign: isMobile ? 'center' : 'left' }}>
                <Typography variant="h5" gutterBottom>
                  {profile.username || 'Пользователь'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {profile.position || 'Должность не указана'}
                </Typography>
              </Box>
              
              {/* Меню выбора способа обновления аватара */}
              <Menu
                anchorEl={avatarMenuAnchor}
                open={Boolean(avatarMenuAnchor)}
                onClose={handleAvatarMenuClose}
              >
                <MenuItem onClick={handleOpenStandardAvatars}>
                  Выбрать из стандартных
                </MenuItem>
                <MenuItem onClick={handleOpenAvatarUploader}>
                  Загрузить и обрезать аватар
                </MenuItem>
              </Menu>
            </Box>
            
            <Divider sx={{ mb: 3 }} />
            
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Имя пользователя"
                  value={profile.username || ''}
                  onChange={(e) => setProfile({ ...profile, username: e.target.value })}
                  variant="outlined"
                  disabled={!isEditing}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Email"
                  value={profile.email || ''}
                  onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                  variant="outlined"
                  disabled={!isEditing}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Телефон"
                  value={profile.phone || profile.phoneNumber || ''}
                  onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                  variant="outlined"
                  disabled={!isEditing}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Должность"
                  value={profile.position || ''}
                  onChange={(e) => setProfile({ ...profile, position: e.target.value })}
                  variant="outlined"
                  disabled={!isEditing}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="О себе"
                  value={profile.bio || ''}
                  onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                  variant="outlined"
                  multiline
                  rows={4}
                  disabled={!isEditing}
                />
              </Grid>
            </Grid>
            
            {/* Секция безопасности */}
            <Box sx={{ mt: 4 }}>
              <Box 
                sx={{ 
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  cursor: 'pointer',
                  mb: 2
                }}
                onClick={() => setShowSecuritySection(!showSecuritySection)}
              >
                <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center' }}>
                  <LockIcon sx={{ mr: 1 }} /> Безопасность
                </Typography>
                <IconButton>
                  {showSecuritySection ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                </IconButton>
              </Box>
              
              <Collapse in={showSecuritySection}>
                <Paper variant="outlined" sx={{ p: isMobile ? 2 : 3, mb: 2 }}>
                  <Typography variant="subtitle1" fontWeight="medium" gutterBottom>
                    Изменение пароля
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                    Для обеспечения безопасности используйте надежный пароль и меняйте его регулярно. 
                    После изменения пароля вам потребуется войти снова.
                  </Typography>
                  
                  <form onSubmit={handlePasswordChange}>
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          label="Текущий пароль"
                          type="password"
                          variant="outlined"
                          value={passwordData.currentPassword}
                          onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})}
                          required
                          error={!!passwordError}
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          label="Новый пароль"
                          type="password"
                          variant="outlined"
                          value={passwordData.newPassword}
                          onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                          required
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          label="Подтвердите новый пароль"
                          type="password"
                          variant="outlined"
                          value={passwordData.confirmPassword}
                          onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                          error={passwordData.newPassword !== passwordData.confirmPassword && !!passwordData.confirmPassword}
                          helperText={
                            passwordData.newPassword !== passwordData.confirmPassword && !!passwordData.confirmPassword
                              ? 'Пароли не совпадают'
                              : ''
                          }
                          required
                        />
                      </Grid>
                      {passwordError && (
                        <Grid item xs={12}>
                          <Alert severity="error">
                            {passwordError}
                          </Alert>
                        </Grid>
                      )}
                      <Grid item xs={12}>
                        <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                          <Button 
                            type="submit" 
                            variant="contained" 
                            color="primary"
                            disabled={!isPasswordFormValid || changePasswordLoading}
                          >
                            {changePasswordLoading ? <CircularProgress size={24} /> : 'Изменить пароль'}
                          </Button>
                        </Box>
                      </Grid>
                    </Grid>
                  </form>
                </Paper>
              </Collapse>
            </Box>
            
            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end', gap: 2, flexWrap: 'wrap' }}>
              {isEditing ? (
                <>
                  <Button 
                    variant="outlined" 
                    color="secondary"
                    onClick={handleCancelEdit}
                    fullWidth={isMobile}
                  >
                    Отмена
                  </Button>
                  <Button 
                    variant="contained" 
                    color="primary"
                    onClick={handleSaveProfile}
                    disabled={loading || saving}
                    fullWidth={isMobile}
                  >
                    {loading || saving ? <CircularProgress size={24} /> : 'Сохранить изменения'}
                  </Button>
                </>
              ) : (
                <Button 
                  variant="contained" 
                  color="primary"
                  onClick={() => setIsEditing(true)}
                  disabled={loading}
                  fullWidth={isMobile}
                >
                  {loading ? <CircularProgress size={24} /> : 'Редактировать профиль'}
                </Button>
              )}
            </Box>
            
            {/* Добавляем компонент для загрузки и кропа аватара */}
            <AvatarUploader
              open={avatarUploaderOpen}
              onClose={() => setAvatarUploaderOpen(false)}
              onSave={handleAvatarUpload}
            />
          </>
        ) : (
          <Typography>
            Профиль не найден
          </Typography>
        )}
      </Paper>
      
      {/* Диалог подтверждения смены пароля */}
      <Dialog
        open={openPasswordDialog}
        onClose={closePasswordDialog}
        fullWidth
        maxWidth="sm"
        fullScreen={isMobile}
      >
        <DialogTitle>Подтверждение смены пароля</DialogTitle>
        <DialogContent>
          <DialogContentText>
            После смены пароля вы будете автоматически разлогинены из системы и перенаправлены на страницу входа.
            Вам потребуется снова авторизоваться с новым паролем.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={closePasswordDialog} color="primary">
            Отмена
          </Button>
          <Button onClick={confirmPasswordChange} color="primary" variant="contained">
            Подтвердить
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Индикатор загрузки при смене пароля */}
      {changePasswordLoading && (
        <Box sx={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          bgcolor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999
        }}>
          <Paper sx={{ p: 3, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <CircularProgress />
            <Typography sx={{ mt: 2 }}>Изменение пароля...</Typography>
            <Typography variant="body2" sx={{ mt: 1 }}>Вы будете перенаправлены на страницу входа</Typography>
          </Paper>
        </Box>
      )}
      
      {/* Диалог выбора аватара */}
      <Dialog 
        open={avatarDialogOpen} 
        onClose={() => setAvatarDialogOpen(false)}
        fullWidth
        maxWidth="md"
        fullScreen={isMobile}
      >
        <DialogTitle>Выберите аватар</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} justifyContent="center">
            {AVATAR_OPTIONS.map((avatar, index) => (
              <Grid item key={index}>
                <Avatar
                  src={processAvatarUrl(avatar)}
                  alt={`Аватар ${index + 1}`}
                  sx={{ 
                    width: 64, 
                    height: 64, 
                    cursor: 'pointer',
                    '&:hover': {
                      boxShadow: '0 0 0 2px #1976d2'
                    }
                  }}
                  onClick={() => {
                    handleSelectAvatar(avatar);
                    setAvatarDialogOpen(false);
                  }}
                />
              </Grid>
            ))}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAvatarDialogOpen(false)}>Закрыть</Button>
        </DialogActions>
      </Dialog>
      
      <Snackbar 
        open={snackbar.open} 
        autoHideDuration={6000} 
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
      
      {/* Уведомление */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleSnackbarClose} severity={snackbarSeverity} sx={{ width: '100%' }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Container>
  );
};