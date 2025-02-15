import React from 'react';
import { useTelegram } from '../../hooks/useTelegram';
import { authService } from '../../services/authService';
import { Button } from '@mui/material';
import { AuthResponse } from '../../types/auth';

interface TelegramLoginProps {
    onAuth: (response: AuthResponse) => void;
}

export const TelegramLogin: React.FC<TelegramLoginProps> = ({ onAuth }) => {
    const { user } = useTelegram();

    const handleTelegramAuth = async () => {
        if (user) {
            try {
                const authResponse = await authService.telegramAuth({
                    telegramId: user.id,
                    username: user.username || user.first_name || 'user',
                    firstName: user.first_name,
                    lastName: user.last_name
                });
                onAuth(authResponse);
                window.location.href = '/boards';
            } catch (error) {
                console.error('Telegram auth failed:', error);
            }
        }
    };

    return (
        <Button 
            variant="contained" 
            color="primary" 
            onClick={handleTelegramAuth}
            startIcon={<img src="/telegram-icon.svg" alt="Telegram" width={24} height={24} />}
        >
            Войти через Telegram
        </Button>
    );
}; 