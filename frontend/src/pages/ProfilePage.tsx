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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Collapse
} from '@mui/material';
import LockIcon from '@mui/icons-material/Lock';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import { fetchUserProfile, updateUserProfile, changePassword } from '../api/api';

// Стандартные аватары
const AVATAR_OPTIONS = [
  '/avatars/avatar1.png',
  '/avatars/avatar2.png',
  '/avatars/avatar3.png',
  '/avatars/avatar4.png',
  '/avatars/avatar5.png',
  '/avatars/avatar6.png',
];

export const ProfilePage = () => {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [originalProfile, setOriginalProfile] = useState<any>(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error'
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

  useEffect(() => {
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    try {
      setLoading(true);
      const userData = await fetchUserProfile();
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
    try {
      setLoading(true);
      // Добавляем выбранный аватар в профиль перед сохранением
      const profileToUpdate = {
        ...profile,
        avatarUrl: selectedAvatar
      };
      
      await updateUserProfile(profileToUpdate);
      setOriginalProfile(profileToUpdate);
      setProfile(profileToUpdate);
      setIsEditing(false);
      setSnackbar({
        open: true,
        message: 'Профиль успешно обновлен',
        severity: 'success'
      });
    } catch (error) {
      console.error('Ошибка обновления профиля:', error);
      setSnackbar({
        open: true,
        message: 'Не удалось обновить профиль',
        severity: 'error'
      });
    } finally {
      setLoading(false);
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
  const handleChangePassword = async () => {
    setPasswordError('');
    
    // Проверка совпадения паролей
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError('Новый пароль и подтверждение не совпадают');
      return;
    }
    
    // Проверка длины пароля
    if (passwordData.newPassword.length < 6) {
      setPasswordError('Новый пароль должен содержать минимум 6 символов');
      return;
    }
    
    try {
      await changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });
      
      setPasswordDialogOpen(false);
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      
      setSnackbar({
        open: true,
        message: 'Пароль успешно изменен',
        severity: 'success'
      });
    } catch (error: any) {
      console.error('Ошибка изменения пароля:', error);
      
      if (error.response?.status === 400) {
        setPasswordError('Текущий пароль указан неверно');
      } else {
        setPasswordError('Не удалось изменить пароль. Попробуйте позже.');
      }
    }
  };

  // Функция для выбора аватара
  const handleSelectAvatar = (avatarUrl: string) => {
    setSelectedAvatar(avatarUrl);
    setAvatarDialogOpen(false);
  };

  if (loading && !profile) {
    return (
      <Container sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      <Typography variant="h4" gutterBottom>
        Мой профиль
      </Typography>
      
      <Paper sx={{ p: 3, mt: 3 }}>
        {profile ? (
          <>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
              <Avatar 
                sx={{ width: 100, height: 100, mr: 3 }}
                src={selectedAvatar || profile.avatarUrl || undefined}
              >
                {profile.username?.charAt(0) || 'U'}
              </Avatar>
              <Box>
                <Typography variant="h5" gutterBottom>
                  {profile.username || 'Пользователь'}
                </Typography>
                {isEditing && (
                  <Button 
                    variant="outlined" 
                    size="small"
                    onClick={() => setAvatarDialogOpen(true)}
                  >
                    Изменить фото
                  </Button>
                )}
              </Box>
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
                <Typography variant="h6">
                  Безопасность
                </Typography>
                <IconButton>
                  {showSecuritySection ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                </IconButton>
              </Box>
              
              <Collapse in={showSecuritySection}>
                <Box sx={{ display: 'flex', alignItems: 'center', my: 2 }}>
                  <LockIcon sx={{ mr: 2 }} />
                  <Box>
                    <Typography variant="body1">Пароль</Typography>
                    <Typography variant="body2" color="textSecondary">
                      ••••••••
                    </Typography>
                  </Box>
                  <Button
                    variant="outlined"
                    size="small"
                    sx={{ ml: 'auto' }}
                    onClick={() => setPasswordDialogOpen(true)}
                  >
                    Изменить
                  </Button>
                </Box>
              </Collapse>
            </Box>
            
            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
              {isEditing ? (
                <>
                  <Button 
                    variant="outlined" 
                    color="secondary"
                    onClick={handleCancelEdit}
                  >
                    Отмена
                  </Button>
                  <Button 
                    variant="contained" 
                    color="primary"
                    onClick={handleSaveProfile}
                    disabled={loading}
                  >
                    {loading ? <CircularProgress size={24} /> : 'Сохранить изменения'}
                  </Button>
                </>
              ) : (
                <Button 
                  variant="contained" 
                  color="primary"
                  onClick={() => setIsEditing(true)}
                >
                  Редактировать профиль
                </Button>
              )}
            </Box>
          </>
        ) : (
          <Typography>
            Профиль не найден
          </Typography>
        )}
      </Paper>
      
      {/* Диалог изменения пароля */}
      <Dialog open={passwordDialogOpen} onClose={() => setPasswordDialogOpen(false)}>
        <DialogTitle>Изменение пароля</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Текущий пароль"
            type="password"
            fullWidth
            variant="outlined"
            value={passwordData.currentPassword}
            onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})}
          />
          <TextField
            margin="dense"
            label="Новый пароль"
            type="password"
            fullWidth
            variant="outlined"
            value={passwordData.newPassword}
            onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
          />
          <TextField
            margin="dense"
            label="Подтвердите новый пароль"
            type="password"
            fullWidth
            variant="outlined"
            value={passwordData.confirmPassword}
            onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
            error={!!passwordError}
            helperText={passwordError}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPasswordDialogOpen(false)}>Отмена</Button>
          <Button onClick={handleChangePassword} variant="contained" color="primary">
            Сохранить
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Диалог выбора аватара */}
      <Dialog open={avatarDialogOpen} onClose={() => setAvatarDialogOpen(false)}>
        <DialogTitle>Выберите аватар</DialogTitle>
        <DialogContent>
          <Grid container spacing={2}>
            {AVATAR_OPTIONS.map((avatar, index) => (
              <Grid item key={index} xs={4}>
                <Box 
                  sx={{ 
                    border: selectedAvatar === avatar ? '2px solid #1976d2' : '1px solid #e0e0e0',
                    borderRadius: '4px',
                    p: 1,
                    cursor: 'pointer',
                    '&:hover': {
                      borderColor: '#1976d2'
                    }
                  }}
                  onClick={() => handleSelectAvatar(avatar)}
                >
                  <Avatar
                    src={avatar}
                    sx={{ width: 64, height: 64, margin: '0 auto' }}
                  />
                </Box>
              </Grid>
            ))}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAvatarDialogOpen(false)}>Отмена</Button>
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
    </Container>
  );
};