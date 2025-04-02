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
  CircularProgress
} from '@mui/material';
import { useTelegram } from '../hooks/useTelegram';
import { fetchUserProfile } from '../api/api';

export const ProfilePage = () => {
  const { user, WebApp } = useTelegram();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (WebApp) {
      WebApp.ready();
    }
    
    if (user) {
      setLoading(true);
      fetchUserProfile(user.id.toString())
        .then((data) => setProfile(data))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [user, WebApp]);

  const handleSaveProfile = () => {
    console.log('Сохранение профиля', profile);
    // Здесь будет логика сохранения профиля
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
        Мой профиль
      </Typography>
      
      <Paper sx={{ p: 3, mt: 3 }}>
        {profile ? (
          <>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
              <Avatar 
                sx={{ width: 100, height: 100, mr: 3 }}
                src={profile.avatarUrl || undefined}
              >
                {profile.username?.charAt(0) || 'U'}
              </Avatar>
              <Box>
                <Typography variant="h5" gutterBottom>
                  {profile.username || 'Пользователь'}
                </Typography>
                <Button variant="outlined" size="small">
                  Изменить фото
                </Button>
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
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Email"
                  value={profile.email || ''}
                  onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                  variant="outlined"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Телефон"
                  value={profile.phone || ''}
                  onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                  variant="outlined"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Должность"
                  value={profile.position || ''}
                  onChange={(e) => setProfile({ ...profile, position: e.target.value })}
                  variant="outlined"
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
                />
              </Grid>
            </Grid>
            
            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
              <Button 
                variant="contained" 
                color="primary"
                onClick={handleSaveProfile}
              >
                Сохранить изменения
              </Button>
            </Box>
          </>
        ) : (
          <Typography>
            Профиль не найден
          </Typography>
        )}
      </Paper>
    </Container>
  );
};