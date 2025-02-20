declare module '@twa-dev/sdk' {
    interface WebAppUser {
        id: string;
        username?: string;
        first_name?: string;
        last_name?: string;
    }

    interface WebAppInitData {
        user?: WebAppUser;
    }

    interface MainButton {
        isVisible: boolean;
        show: () => void;
        hide: () => void;
    }

    interface WebApp {
        initDataUnsafe: WebAppInitData;
        MainButton: MainButton;
        ready: () => void;
        close: () => void;
    }

    export const WebApp: WebApp;
} 