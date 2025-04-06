import React, { useState } from 'react';
import { Box, Typography, Switch, FormControlLabel, Button, Divider } from '@mui/material';

export const UserSettings: React.FC = () => {
    const [settings, setSettings] = useState({
        darkMode: false,
        notifications: true,
        emailNotifications: true,
        telegramNotifications: true
    });

    const handleSaveSettings = () => {
        console.log('Сохранение настроек', settings);
        // Здесь будет логика сохранения настроек
    };

    return (
        <Box>
            <Typography variant="h6" gutterBottom>
                Настройки
            </Typography>

            <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle1" gutterBottom>
                    Внешний вид
                </Typography>
                <FormControlLabel
                    control={
                        <Switch
                            checked={settings.darkMode}
                            onChange={(e) => setSettings({ ...settings, darkMode: e.target.checked })}
                        />
                    }
                    label="Темная тема"
                />
            </Box>

            <Divider sx={{ my: 2 }} />

            <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle1" gutterBottom>
                    Уведомления
                </Typography>
                <FormControlLabel
                    control={
                        <Switch
                            checked={settings.notifications}
                            onChange={(e) => setSettings({ ...settings, notifications: e.target.checked })}
                        />
                    }
                    label="Включить уведомления"
                />
                <FormControlLabel
                    control={
                        <Switch
                            checked={settings.emailNotifications}
                            onChange={(e) => setSettings({ ...settings, emailNotifications: e.target.checked })}
                            disabled={!settings.notifications}
                        />
                    }
                    label="Email уведомления"
                />
                <FormControlLabel
                    control={
                        <Switch
                            checked={settings.telegramNotifications}
                            onChange={(e) => setSettings({ ...settings, telegramNotifications: e.target.checked })}
                            disabled={!settings.notifications}
                        />
                    }
                    label="Telegram уведомления"
                />
            </Box>

            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
                <Button 
                    variant="contained" 
                    color="primary"
                    onClick={handleSaveSettings}
                >
                    Сохранить настройки
                </Button>
            </Box>
        </Box>
    );
}; 