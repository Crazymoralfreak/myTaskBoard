import { WebApp } from '@twa-dev/sdk';

interface TelegramUser {
    id: string;
    username?: string;
    first_name?: string;
    last_name?: string;
}

export const useTelegram = () => {
    const user = WebApp.initDataUnsafe?.user as TelegramUser | undefined;

    const onClose = () => {
        WebApp.close();
    };

    const onToggleButton = () => {
        if (WebApp.MainButton.isVisible) {
            WebApp.MainButton.hide();
        } else {
            WebApp.MainButton.show();
        }
    };

    return {
        onClose,
        onToggleButton,
        user,
        WebApp
    };
};