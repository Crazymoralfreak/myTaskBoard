import React, { useState } from 'react';
import { Box, Typography, Avatar, TextField, Button, Grid } from '@mui/material';
import { User } from '../types/user';

interface UserProfileProps {
    user: User | null;
}

export const UserProfile: React.FC<UserProfileProps> = ({ user }) => {
    const [profile, setProfile] = useState({
        username: user?.username || '',
        email: user?.email || '',
        phone: user?.phone || '',
        position: user?.position || '',
        bio: user?.bio || ''
    });

    const handleSaveProfile = () => {
        console.log('Сохранение профиля', profile);
        // Здесь будет логика сохранения профиля
    };

    return (
        <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
                <Avatar 
                    sx={{ width: 100, height: 100, mr: 3 }}
                    src={user?.avatarUrl}
                >
                    {user?.username?.charAt(0) || 'U'}
                </Avatar>
                <Box>
                    <Typography variant="h5" gutterBottom>
                        {user?.username || 'Пользователь'}
                    </Typography>
                    <Button variant="outlined" size="small">
                        Изменить фото
                    </Button>
                </Box>
            </Box>

            <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                    <TextField
                        fullWidth
                        label="Имя пользователя"
                        value={profile.username}
                        onChange={(e) => setProfile({ ...profile, username: e.target.value })}
                        variant="outlined"
                    />
                </Grid>
                <Grid item xs={12} sm={6}>
                    <TextField
                        fullWidth
                        label="Email"
                        value={profile.email}
                        onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                        variant="outlined"
                    />
                </Grid>
                <Grid item xs={12} sm={6}>
                    <TextField
                        fullWidth
                        label="Телефон"
                        value={profile.phone}
                        onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                        variant="outlined"
                    />
                </Grid>
                <Grid item xs={12} sm={6}>
                    <TextField
                        fullWidth
                        label="Должность"
                        value={profile.position}
                        onChange={(e) => setProfile({ ...profile, position: e.target.value })}
                        variant="outlined"
                    />
                </Grid>
                <Grid item xs={12}>
                    <TextField
                        fullWidth
                        label="О себе"
                        value={profile.bio}
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
        </Box>
    );
}; 