import { useEffect, useState } from 'react';

interface TelegramUser {
    id: number;
    first_name: string;
    last_name?: string;
    username?: string;
    language_code?: string;
    is_premium?: boolean;
    photo_url?: string;
}

export const useTelegram = () => {
    const [user, setUser] = useState<TelegramUser | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [WebApp, setWebApp] = useState<any>(null);

    useEffect(() => {
        try {
            if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
                const webApp = window.Telegram.WebApp;
                setWebApp(webApp);
                const initData = webApp.initDataUnsafe;
                
                if (initData?.user) {
                    setUser(initData.user);
                } else {
                    setError('Пользователь не авторизован через Telegram');
                }
            } else {
                setError('Telegram Web App не инициализирован');
            }
        } catch (err) {
            setError('Ошибка при инициализации Telegram Web App');
            console.error('Telegram Web App error:', err);
        }
    }, []);

    const onClose = () => {
        if (WebApp) {
            WebApp.close();
        }
    };

    const onToggleButton = () => {
        if (WebApp?.MainButton) {
            if (WebApp.MainButton.isVisible) {
                WebApp.MainButton.hide();
            } else {
                WebApp.MainButton.show();
            }
        }
    };

    return {
        onClose,
        onToggleButton,
        user,
        error,
        WebApp
    };
};