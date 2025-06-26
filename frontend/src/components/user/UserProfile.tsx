import React, { useState } from 'react';
import { Box, Typography, Avatar, TextField, Button, Grid } from '@mui/material';
import { User } from '../../types/user';
import { useLocalization } from '../../hooks/useLocalization';

interface UserProfileProps {
    user: User | null;
}

export const UserProfile: React.FC<UserProfileProps> = ({ user }) => {
    const { t } = useLocalization();
    const [profile, setProfile] = useState({
        username: user?.username || '',
        email: user?.email || '',
        phone: user?.phone || '',
        position: user?.position || '',
        bio: user?.bio || ''
    });

    const handleSaveProfile = () => {
        console.log(t('profileSavingProfile'), profile);
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
                        {user?.username || t('profileDefaultUsername')}
                    </Typography>
                    <Button variant="outlined" size="small">
                                                  {t('profileChangePhoto')}
                    </Button>
                </Box>
            </Box>

            <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                    <TextField
                        fullWidth
                        label={t('profileUsername')}
                        value={profile.username}
                        onChange={(e) => setProfile({ ...profile, username: e.target.value })}
                        variant="outlined"
                    />
                </Grid>
                <Grid item xs={12} sm={6}>
                    <TextField
                        fullWidth
                        label={t('profileEmail')}
                        value={profile.email}
                        onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                        variant="outlined"
                    />
                </Grid>
                <Grid item xs={12} sm={6}>
                    <TextField
                        fullWidth
                        label={t('profilePhone')}
                        value={profile.phone}
                        onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                        variant="outlined"
                    />
                </Grid>
                <Grid item xs={12} sm={6}>
                    <TextField
                        fullWidth
                        label={t('profilePosition')}
                        value={profile.position}
                        onChange={(e) => setProfile({ ...profile, position: e.target.value })}
                        variant="outlined"
                    />
                </Grid>
                <Grid item xs={12}>
                    <TextField
                        fullWidth
                        label={t('profileBio')}
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
                    {t('profileSaveChanges')}
                </Button>
            </Box>
        </Box>
    );
}; 